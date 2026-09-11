import { Request, Response, NextFunction } from 'express';
import { licenseService } from './license.service';

/**
 * @description حارس الترخيص الشهري — يمنع العمليات عند انتهاء الاشتراك
 */
export async function licenseGuardMiddleware(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  const path = req.path;

  // استثناء مسارات التفعيل، الإعداد الأولي، والمصادقة الأساسية
  if (
    path.startsWith('/api/license') ||
    path.startsWith('/api/setup') ||
    path.startsWith('/api/auth') ||
    path === '/health'
  ) {
    return next();
  }

  try {
    const status = await licenseService.getStatus();

    if (!status.is_active) {
      res.status(402).json({
        ok: false,
        error: {
          code: 'LICENSE_EXPIRED',
          message: status.is_tampered
            ? 'تم اكتشاف تلاعب في تاريخ أو بيانات النظام! يرجى إعادة التفعيل.'
            : 'انتهت فترة الاشتراك الشهري للنظام. يرجى تجديد الترخيص لمتابعة العمل.',
          details: {
            challenge_code: status.challenge_code,
            expires_at: status.expires_at,
          },
        },
      });
      return;
    }

    next();
  } catch (error) {
    next(error);
  }
}
