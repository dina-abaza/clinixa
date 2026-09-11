import type { Request, Response, NextFunction } from 'express';
import { getSyncStatus, retryPendingSync } from './sync.engine';

/**
 * @description معالجة طلب حالة المزامنة (GET /api/sync/status)
 */
export async function getSyncStatusController(_req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const result = await getSyncStatus();
    res.status(200).json({ ok: true, data: result, warning: null });
  } catch (error) {
    next(error);
  }
}

/**
 * @description معالجة طلب إعادة محاولة المزامنة (POST /api/sync/retry)
 */
export async function retryPendingSyncController(_req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const result = await retryPendingSync();
    res.status(200).json({ ok: true, data: result, warning: null });
  } catch (error) {
    next(error);
  }
}
