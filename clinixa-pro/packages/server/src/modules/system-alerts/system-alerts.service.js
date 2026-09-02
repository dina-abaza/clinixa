"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getSystemAlerts = getSystemAlerts;
exports.markAlertAsRead = markAlertAsRead;
const query_1 = __importDefault(require("../../db/sqlite/query"));
const error_handler_middleware_1 = require("../../middlewares/error-handler.middleware");
/**
 * @description جلب قائمة تنبيهات النظام مرتبة من الأحدث إلى الأقدم مع إجمالي التنبيهات غير المقروءة
 * @param {string | null | undefined} branchId - فرع الجلسة (اختياري)
 * @returns {Promise<SystemAlertsResult>} قائمة التنبيهات وعدد غير المقروء
 */
async function getSystemAlerts(branchId) {
    let q = (0, query_1.default)('system_alerts').orderBy('created_at', 'desc');
    if (branchId) {
        q = q.where(function () {
            this.where('branch_id', branchId).orWhereNull('branch_id');
        });
    }
    const rows = await q;
    const items = rows.map((r) => ({
        id: r.id,
        type: r.type,
        title: r.title,
        detail: r.detail ?? null,
        branch_id: r.branch_id ?? null,
        is_read: Boolean(r.is_read),
        created_at: r.created_at,
    }));
    const unreadCount = items.filter((item) => !item.is_read).length;
    return {
        items,
        unread_count: unreadCount,
    };
}
/**
 * @description تعليم تنبيه نظام محدد كمقروء
 * @param {string} id - معرّف التنبيه
 * @returns {Promise<{ id: string; is_read: boolean }>} معرّف التنبيه وحالته
 * @throws {AppError} 404 NOT_FOUND إذا لم يوجد التنبيه
 */
async function markAlertAsRead(id) {
    const alert = await (0, query_1.default)('system_alerts').where({ id }).first();
    if (!alert) {
        throw new error_handler_middleware_1.AppError('NOT_FOUND', 'تنبيه النظام غير موجود', 404);
    }
    await (0, query_1.default)('system_alerts').where({ id }).update({ is_read: 1 });
    return {
        id,
        is_read: true,
    };
}
