/**
 * @fileoverview مستودع عمليات المزامنة (sync_outbox)
 * @description يتعامل مع سجل outbox فقط، دون اشتراط وجود Mongo في هذا القدر الأولي من المرحلة
 */

import crypto from 'crypto';
import query from '../../db/sqlite/query';
import type { SyncStatus } from '@clinixa/shared';
import type { SyncableTable } from '@clinixa/shared';

/**
 * @description بنية ملخص حالة المزامنة
 */
export interface SyncSummary {
  enabled: boolean;
  mode: 'none' | 'local_server' | 'external_hosting';
  pending_count: number;
  last_sync_at: string | null;
}

/** @description صف outbox المطلوب رفعه إلى Mongo */
export interface SyncOutboxRow {
  id: string;
  table_name: SyncableTable;
  record_id: string;
  branch_id: string;
  status: SyncStatus;
  attempts: number;
}

/**
 * @description جلب ملخص حالة المزامنة الحالية من جدول outbox
 * @returns {Promise<SyncSummary>} ملخص سريع لواجهة الإدارة
 */
export async function getSyncSummary(): Promise<SyncSummary> {
  const clinic = await query('clinic_settings').where({ id: 'singleton' }).first();
  const pendingRow = await query('sync_outbox').where({ status: 'pending' }).count<{ count: number }[]>({ count: '*' }).first();
  const lastSyncRow = await query('sync_outbox')
    .whereNotNull('synced_at')
    .orderBy('synced_at', 'desc')
    .first();

  const mode = (clinic?.sync_mode as SyncSummary['mode']) ?? 'none';

  return {
    enabled: mode !== 'none',
    mode,
    pending_count: Number(pendingRow?.count ?? 0),
    last_sync_at: lastSyncRow?.synced_at ?? null,
  };
}

/**
 * @description إنشاء سجل جديد في outbox أو تحديثه إذا كان موجوداً في نفس السجل
 * @param {string} tableName - اسم الجدول القابل للمزامنة
 * @param {string} recordId - معرف السجل داخل الجدول
 * @param {string} branchId - معرف الفرع owner
 * @returns {Promise<void>} لا توجد قيمة مرتجعة
 */
export async function upsertOutboxRecord(tableName: string, recordId: string, branchId: string): Promise<void> {
  const now = new Date().toISOString();
  const existing = await query('sync_outbox').where({ table_name: tableName, record_id: recordId }).first();

  if (existing) {
    await query('sync_outbox')
      .where({ id: existing.id })
      .update({
        branch_id: branchId,
        status: 'pending',
        updated_at: now,
        last_error: null,
      });
    return;
  }

  await query('sync_outbox').insert({
    id: `sync_${crypto.randomUUID()}`,
    table_name: tableName,
    record_id: recordId,
    branch_id: branchId,
    status: 'pending',
    attempts: 0,
    last_error: null,
    created_at: now,
    updated_at: now,
    synced_at: null,
  });
}

/**
 * @description تجميع السجلات المعلقة ومعالجتها في تتابع بسيط (simulated sync)
 * @returns {Promise<number>} عدد السجلات التي تمت معالجتها
 */
export async function retryPendingOutboxRecords(): Promise<number> {
  const rows = await query('sync_outbox')
    .whereIn('status', ['pending', 'failed'])
    .orderBy('created_at', 'asc')
    .limit(25);

  if (!rows.length) {
    return 0;
  }

  for (const row of rows) {
    const nextAttempts = Number(row.attempts ?? 0) + 1;
    const now = new Date().toISOString();

    await query('sync_outbox')
      .where({ id: row.id })
      .update({
        status: 'syncing' as SyncStatus,
        attempts: nextAttempts,
        last_error: null,
        updated_at: now,
      });

    await query('sync_outbox')
      .where({ id: row.id })
      .update({
        status: 'synced' as SyncStatus,
        synced_at: now,
        updated_at: now,
        last_error: null,
      });
  }

  return rows.length;
}

/** @description جلب دفعة من صفوف outbox الجاهزة للرفع */
export async function getPendingOutboxRecords(limit = 25): Promise<SyncOutboxRow[]> {
  return query('sync_outbox')
    .whereIn('status', ['pending', 'failed'])
    .where('attempts', '<', 5)
    .orderBy('created_at', 'asc')
    .limit(limit) as unknown as SyncOutboxRow[];
}

/** @description تغيير حالة صف outbox مع بيانات الخطأ أو وقت المزامنة */
export async function updateOutboxStatus(
  id: string,
  status: SyncStatus,
  details: { attempts?: number; last_error?: string | null; synced_at?: string | null } = {}
): Promise<void> {
  await query('sync_outbox').where({ id }).update({
    status,
    updated_at: new Date().toISOString(),
    ...details,
  });
}

/** @description قراءة السجل الحالي من SQLite أو معرفة أنه حُذف */
export async function getOutboxRecord(row: SyncOutboxRow): Promise<Record<string, unknown> | null> {
  const record = await query(row.table_name).where({ id: row.record_id }).first();
  return record ? (record as Record<string, unknown>) : null;
}

/** @description تطبيق سجل قادم من Mongo محليًا ثم إزالة pointer الناتج عن الاستقبال */
export async function applyRemoteRecord(
  tableName: SyncableTable,
  document: Record<string, unknown>
): Promise<void> {
  const { _id, _synced_from_branch: _syncedFromBranch, _synced_at: _syncedAt, ...fields } = document;
  const recordId = String(_id ?? fields.id ?? '');
  if (!recordId) throw new Error(`السجل القادم من ${tableName} لا يحتوي على معرف`);

  await query(tableName).insert({ ...fields, id: recordId }).onConflict('id').merge();
  await query('sync_outbox').where({ table_name: tableName, record_id: recordId }).del();
}
