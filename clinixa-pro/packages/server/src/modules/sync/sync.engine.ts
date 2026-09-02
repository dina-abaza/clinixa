/**
 * @fileoverview محرك المزامنة الأساسي
 * @description يوفر واجهة سهلة لاستعلام حالة outbox وتنفيذ إعادة المحاولة للتحكم في المزامنة
 */

import { getSyncSummary, retryPendingOutboxRecords } from './sync.repository';

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
  const processedCount = await retryPendingOutboxRecords();
  return { processed_count: processedCount };
}
