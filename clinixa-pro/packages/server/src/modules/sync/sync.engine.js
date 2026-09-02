"use strict";
/**
 * @fileoverview محرك المزامنة الأساسي
 * @description يوفر واجهة سهلة لاستعلام حالة outbox وتنفيذ إعادة المحاولة للتحكم في المزامنة
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.getSyncStatus = getSyncStatus;
exports.retryPendingSync = retryPendingSync;
const sync_repository_1 = require("./sync.repository");
/**
 * @description إرجاع ملخص حالة المزامنة للنظام الحالي
 * @returns {Promise<{ enabled: boolean; mode: string; pending_count: number; last_sync_at: string | null }>} ملخص الحالة
 */
async function getSyncStatus() {
    return (0, sync_repository_1.getSyncSummary)();
}
/**
 * @description تنفيذ إعادة المحاولة على جميع السجلات المعلقة في قائمة الانتظار
 * @returns {Promise<{ processed_count: number }>} عدد الصفوف المعالجة
 */
async function retryPendingSync() {
    const processedCount = await (0, sync_repository_1.retryPendingOutboxRecords)();
    return { processed_count: processedCount };
}
