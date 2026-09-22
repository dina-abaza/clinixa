import { Request, Response, NextFunction } from 'express';
import { licenseService } from './license.service';

export async function getLicenseStatusController(
  _req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const status = await licenseService.getStatus();
    res.json({
      ok: true,
      data: status,
      warning: status.days_remaining <= 3 ? 'اقترب موعد انتهاء الاشتراك الشهري' : null,
    });
  } catch (error) {
    next(error);
  }
}

export async function activateLicenseController(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { response_code } = req.body;
    if (!response_code || typeof response_code !== 'string') {
      res.status(400).json({
        ok: false,
        error: { code: 'INVALID_INPUT', message: 'كود التفعيل مطلوب' },
      });
      return;
    }

    const result = await licenseService.activate(response_code);
    res.json({
      ok: true,
      data: result,
      warning: null,
    });
  } catch (error: any) {
    res.status(400).json({
      ok: false,
      error: { code: 'ACTIVATION_FAILED', message: error.message || 'فشل التفعيل' },
    });
  }
}

export async function verifySetupKeyController(
  req: Request,
  res: Response
): Promise<void> {
  const { key } = req.body;
  const keyCheck = await licenseService.verifySetupOrActivationKey(key);
  if (!keyCheck.valid) {
    res.status(400).json({
      ok: false,
      error: { code: 'INVALID_LICENSE', message: 'كود التفعيل غير صحيح أو غير متطابق مع هذا الجهاز' },
    });
    return;
  }
  res.json({
    ok: true,
    data: { valid: true, duration_code: keyCheck.durationCode },
    warning: null,
  });
}
