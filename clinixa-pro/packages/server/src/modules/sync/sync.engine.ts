/**
 * @fileoverview محرك المزامنة الأساسي
 * @description يوفر واجهة سهلة لاستعلام حالة outbox وتنفيذ إعادة المحاولة للتحكم في المزامنة
 */

import { env } from '../../config/env';
import { resolveRuntimeSecret } from '../../config/runtime-secret';
import type { SyncStatus } from '@clinixa/shared';
import { MongoSyncAdapter, type SyncMongoAdapter } from './mongo.adapter';
import {
  getOutboxRecord,
  getPendingOutboxRecords,
  getSyncSummary,
  retryPendingOutboxRecords,
  updateOutboxStatus,
  applyRemoteRecord,
} from './sync.repository';

let syncTimer: ReturnType<typeof setInterval> | null = null;
let syncRunning = false;
let lastPullAt: string | null = null;

/**
 * @description إرجاع ملخص حالة المزامنة للنظام الحالي
 * @returns {Promise<{ enabled: boolean; mode: string; pending_count: number; last_sync_at: string | null }>} ملخص الحالة
 */
export async function getSyncStatus() {
  return getSyncSummary();
}

/**
 * @description تنفيذ إعادة المحاولة على جميع السجلات المعلقة في قائمة الانتظار
 * @returns {Promise<{ processed_count: number }>} عدد الصفوف المعالجة
 */
export async function retryPendingSync() {
  const summary = await getSyncSummary();
  const mongoUri = resolveRuntimeSecret('MONGODB_URI');
  const processedCount = summary.enabled && mongoUri
    ? await pushPendingRecords(new MongoSyncAdapter())
    : await retryPendingOutboxRecords();
  return { processed_count: processedCount };
}

/**
 * @description رفع سجلات outbox إلى Mongo وتحديث حالتها حسب النتيجة
 * @param {SyncMongoAdapter} adapter - موصل Mongo الحقيقي أو الوهمي للاختبارات
 * @returns {Promise<number>} عدد السجلات التي عولجت
 */
export async function pushPendingRecords(adapter: SyncMongoAdapter): Promise<number> {
  const rows = await getPendingOutboxRecords();
  let processedCount = 0;
  for (const row of rows) {
    const attempts = Number(row.attempts ?? 0) + 1;
    await updateOutboxStatus(row.id, 'syncing' as SyncStatus, { attempts, last_error: null });
    try {
      const record = await getOutboxRecord(row);
      if (record) {
        await adapter.upsert(row.table_name, record, row.branch_id);
      } else {
        await adapter.remove(row.table_name, row.record_id);
      }
      await updateOutboxStatus(row.id, 'synced', {
        synced_at: new Date().toISOString(),
        last_error: null,
      });
      processedCount += 1;
    } catch (error) {
      await updateOutboxStatus(row.id, attempts >= 5 ? 'failed' : 'pending', {
        last_error: error instanceof Error ? error.message.slice(0, 500) : 'خطأ غير معروف في المزامنة',
      });
    }
  }
  return processedCount;
}

/**
 * @description سحب التعديلات البعيدة وتطبيقها في SQLite بدون إعادة إدخالها إلى outbox
 * @param {SyncMongoAdapter} adapter - موصل Mongo الحقيقي أو الوهمي للاختبارات
 * @returns {Promise<number>} عدد السجلات المستقبلة
 */
export async function pullRemoteRecords(adapter: SyncMongoAdapter): Promise<number> {
  const changedRecords = await adapter.findChangedSince(lastPullAt);
  for (const changed of changedRecords) {
    await applyRemoteRecord(changed.tableName, changed.document);
  }
  if (changedRecords.length > 0) lastPullAt = new Date().toISOString();
  return changedRecords.length;
}

/** @description يبدأ دورة مزامنة خلفية آمنة ولا يتصل بـ Mongo في وضع الفرع الواحد */
export function startSyncEngine(): void {
  if (syncTimer) return;
  const run = async () => {
    if (syncRunning) return;
    syncRunning = true;
    try {
      const summary = await getSyncSummary();
      if (!summary.enabled || !resolveRuntimeSecret('MONGODB_URI')) return;
      const adapter = new MongoSyncAdapter();
      await pushPendingRecords(adapter);
      await pullRemoteRecords(adapter);
    } catch (error) {
      console.error('⚠️ Sync cycle failed:', error instanceof Error ? error.message : 'unknown error');
    } finally {
      syncRunning = false;
    }
  };
  syncTimer = setInterval(() => void run(), env.SYNC_POLL_INTERVAL);
  void run();
}
