import query from '../../db/sqlite/query';
import { AppError } from '../../middlewares/error-handler.middleware';
import type { SystemAlert } from '@clinixa/shared';

/**
 * @description شكل استجابة تنبيهات النظام مع عدد التنبيهات غير المقروءة
 */
export interface SystemAlertsResult {
  items: SystemAlert[];
  unread_count: number;
}

/**
 * @description جلب قائمة تنبيهات النظام مرتبة من الأحدث إلى الأقدم مع إجمالي التنبيهات غير المقروءة
 * @param {string | null | undefined} branchId - فرع الجلسة (اختياري)
 * @returns {Promise<SystemAlertsResult>} قائمة التنبيهات وعدد غير المقروء
 */
export async function getSystemAlerts(branchId?: string | null): Promise<SystemAlertsResult> {
  let q = query('system_alerts').orderBy('created_at', 'desc');

  if (branchId) {
    q = q.where(function () {
      this.where('branch_id', branchId).orWhereNull('branch_id');
    });
  }

  const rows = await q;

  const items: SystemAlert[] = rows.map((r) => ({
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
export async function markAlertAsRead(id: string): Promise<{ id: string; is_read: boolean }> {
  const alert = await query('system_alerts').where({ id }).first();
  if (!alert) {
    throw new AppError('NOT_FOUND', 'تنبيه النظام غير موجود', 404);
  }

  await query('system_alerts').where({ id }).update({ is_read: 1 });

  return {
    id,
    is_read: true,
  };
}
