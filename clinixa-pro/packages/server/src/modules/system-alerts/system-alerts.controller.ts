import type { Request, Response, NextFunction } from 'express';
import { getSystemAlerts, markAlertAsRead } from './system-alerts.service';

/**
 * @description معالجة طلب جلب تنبيهات النظام (GET /api/system-alerts)
 */
export async function listSystemAlerts(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const branchId = req.employee?.branch_id;
    const result = await getSystemAlerts(branchId);
    res.status(200).json({ ok: true, data: result, warning: null });
  } catch (err) {
    next(err);
  }
}

/**
 * @description معالجة طلب تعليم التنبيه كمقروء (PATCH /api/system-alerts/:id/read)
 */
export async function readAlert(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const alertId = req.params.id as string;
    const result = await markAlertAsRead(alertId);
    res.status(200).json({ ok: true, data: result, warning: null });
  } catch (err) {
    next(err);
  }
}
