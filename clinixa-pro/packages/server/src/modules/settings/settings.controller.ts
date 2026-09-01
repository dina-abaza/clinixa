import type { Request, Response, NextFunction } from 'express';
import { AppError } from '../../middlewares/error-handler.middleware';
import { updateSettingsSchema } from './settings.validation';
import { getClinicSettings, updateClinicSettings } from './settings.service';

/**
 * @description معالجة طلب جلب إعدادات العيادة والأسعار (GET /api/settings)
 */
export async function getSettings(_req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const result = await getClinicSettings();
    res.status(200).json({ ok: true, data: result, warning: null });
  } catch (err) {
    next(err);
  }
}

/**
 * @description معالجة طلب تحديث إعدادات العيادة والأسعار (PUT /api/settings)
 */
export async function updateSettings(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const parsed = updateSettingsSchema.safeParse(req.body);
    if (!parsed.success) {
      const issue = parsed.error.issues[0];
      throw new AppError('VALIDATION_ERROR', issue.message, 400, issue.path.join('.'));
    }

    const result = await updateClinicSettings(parsed.data);
    res.status(200).json({ ok: true, data: result, warning: null });
  } catch (err) {
    next(err);
  }
}
