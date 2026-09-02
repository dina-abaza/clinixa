"use strict";
/**
 * @fileoverview مستودع عمليات المزامنة (sync_outbox)
 * @description يتعامل مع سجل outbox فقط، دون اشتراط وجود Mongo في هذا القدر الأولي من المرحلة
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getSyncSummary = getSyncSummary;
exports.upsertOutboxRecord = upsertOutboxRecord;
exports.retryPendingOutboxRecords = retryPendingOutboxRecords;
const crypto_1 = __importDefault(require("crypto"));
const query_1 = __importDefault(require("../../db/sqlite/query"));
/**
 * @description جلب ملخص حالة المزامنة الحالية من جدول outbox
 * @returns {Promise<SyncSummary>} ملخص سريع لواجهة الإدارة
 */
async function getSyncSummary() {
    const clinic = await (0, query_1.default)('clinic_settings').where({ id: 'singleton' }).first();
    const pendingRow = await (0, query_1.default)('sync_outbox').where({ status: 'pending' }).count({ count: '*' }).first();
    const lastSyncRow = await (0, query_1.default)('sync_outbox')
        .whereNotNull('synced_at')
        .orderBy('synced_at', 'desc')
        .first();
    const mode = clinic?.sync_mode ?? 'none';
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
async function upsertOutboxRecord(tableName, recordId, branchId) {
    const now = new Date().toISOString();
    const existing = await (0, query_1.default)('sync_outbox').where({ table_name: tableName, record_id: recordId }).first();
    if (existing) {
        await (0, query_1.default)('sync_outbox')
            .where({ id: existing.id })
            .update({
            branch_id: branchId,
            status: 'pending',
            updated_at: now,
            last_error: null,
        });
        return;
    }
    await (0, query_1.default)('sync_outbox').insert({
        id: `sync_${crypto_1.default.randomUUID()}`,
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
async function retryPendingOutboxRecords() {
    const rows = await (0, query_1.default)('sync_outbox')
        .whereIn('status', ['pending', 'failed'])
        .orderBy('created_at', 'asc')
        .limit(25);
    if (!rows.length) {
        return 0;
    }
    for (const row of rows) {
        const nextAttempts = Number(row.attempts ?? 0) + 1;
        const now = new Date().toISOString();
        await (0, query_1.default)('sync_outbox')
            .where({ id: row.id })
            .update({
            status: 'syncing',
            attempts: nextAttempts,
            last_error: null,
            updated_at: now,
        });
        await (0, query_1.default)('sync_outbox')
            .where({ id: row.id })
            .update({
            status: 'synced',
            synced_at: now,
            updated_at: now,
            last_error: null,
        });
    }
    return rows.length;
}
