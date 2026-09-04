import type { Request, Response, NextFunction } from 'express';
import { AppError } from '../../middlewares/error-handler.middleware';
import {
  runBackupSchema,
  updateBackupDestinationSchema,
  restoreBackupSchema,
  updateGoogleDriveSettingsSchema,
} from './backup.validation';
import {
  getBackupHistory,
  runBackup,
  updateBackupDestination,
  restoreBackup,
  getGoogleDriveSettings,
  updateGoogleDriveSettings,
  deleteGoogleDriveSettings,
} from './backup.service';

/**
 * @description معالجة طلب جلب سجل النسخ الاحتياطي (GET /api/backup/history)
 */
export async function listBackupHistory(_req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const result = await getBackupHistory();
    res.status(200).json({ ok: true, data: result, warning: null });
  } catch (err) {
    next(err);
  }
}

/**
 * @description معالجة طلب تشغيل النسخ الاحتياطي (POST /api/backup/run)
 */
export async function triggerBackup(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const parsed = runBackupSchema.safeParse(req.body);
    if (!parsed.success) {
      const issue = parsed.error.issues[0];
      throw new AppError('VALIDATION_ERROR', issue.message, 400, issue.path.join('.'));
    }

    const result = await runBackup(parsed.data);
    res.status(200).json({ ok: true, data: result, warning: null });
  } catch (err) {
    next(err);
  }
}

/**
 * @description معالجة طلب تحديث وجهة النسخ الاحتياطي (PUT /api/backup/destination)
 */
export async function setBackupDestination(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const parsed = updateBackupDestinationSchema.safeParse(req.body);
    if (!parsed.success) {
      const issue = parsed.error.issues[0];
      throw new AppError('VALIDATION_ERROR', issue.message, 400, issue.path.join('.'));
    }

    const result = await updateBackupDestination(parsed.data);
    res.status(200).json({ ok: true, data: result, warning: null });
  } catch (err) {
    next(err);
  }
}

/**
 * @description معالجة طلب استعادة نسخة احتياطية (POST /api/backup/restore)
 */
export async function restoreBackupData(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const parsed = restoreBackupSchema.safeParse(req.body);
    if (!parsed.success) {
      const issue = parsed.error.issues[0];
      throw new AppError('VALIDATION_ERROR', issue.message, 400, issue.path.join('.'));
    }

    const result = await restoreBackup(parsed.data);
    res.status(200).json({ ok: true, data: result, warning: null });
  } catch (err) {
    next(err);
  }
}

/**
 * @description معالجة طلب جلب إعدادات Google Drive (GET /api/backup/google-drive)
 */
export async function getGoogleDriveSettingsHandler(
  _req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const result = await getGoogleDriveSettings();
    res.status(200).json({ ok: true, data: result, warning: null });
  } catch (err) {
    next(err);
  }
}

/**
 * @description معالجة طلب تعديل إعدادات Google Drive (PUT /api/backup/google-drive)
 */
export async function updateGoogleDriveSettingsHandler(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const parsed = updateGoogleDriveSettingsSchema.safeParse(req.body);
    if (!parsed.success) {
      const issue = parsed.error.issues[0];
      throw new AppError('VALIDATION_ERROR', issue.message, 400, issue.path.join('.'));
    }

    const result = await updateGoogleDriveSettings(parsed.data);
    res.status(200).json({ ok: true, data: result, warning: null });
  } catch (err) {
    next(err);
  }
}

/**
 * @description معالجة طلب حذف إعدادات Google Drive (DELETE /api/backup/google-drive)
 */
export async function deleteGoogleDriveSettingsHandler(
  _req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const result = await deleteGoogleDriveSettings();
    res.status(200).json({ ok: true, data: result, warning: null });
  } catch (err) {
    next(err);
  }
}
