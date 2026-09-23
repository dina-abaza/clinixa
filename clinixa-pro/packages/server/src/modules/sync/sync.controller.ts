import type { Request, Response, NextFunction } from 'express';
import { getSyncStatus, retryPendingSync } from './sync.engine';
import { MongoSyncAdapter } from './mongo.adapter';
import { storeRuntimeSecret } from '../../config/runtime-secret';
import query from '../../db/sqlite/query';

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

export async function getSyncHealthController(_req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const clinic = await query('clinic_settings').where({ id: 'singleton' }).first();
    if (!clinic || clinic.sync_mode === 'none') {
      res.status(200).json({ ok: true, data: { status: 'disabled', reason: 'المزامنة غير مفعلة' }, warning: null });
      return;
    }
    const diagnostic = await new MongoSyncAdapter().diagnose();
    res.status(200).json({ ok: true, data: diagnostic, warning: null });
  } catch (error) {
    next(error);
  }
}

export async function configureSyncController(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const uri = typeof req.body?.mongodb_uri === 'string' ? req.body.mongodb_uri.trim() : '';
    if (!uri.startsWith('mongodb://') && !uri.startsWith('mongodb+srv://')) {
      res.status(400).json({ ok: false, error: { code: 'VALIDATION_ERROR', message: 'رابط MongoDB Atlas غير صالح' } });
      return;
    }
    storeRuntimeSecret('MONGODB_URI', uri);
    process.env.MONGODB_URI = uri;
    const diagnostic = await new MongoSyncAdapter().diagnose();
    res.status(200).json({ ok: true, data: diagnostic, warning: null });
  } catch (error) {
    next(error);
  }
}
