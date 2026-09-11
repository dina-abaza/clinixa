import type { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { env } from '../config/env';
import { AppError } from './error-handler.middleware';
import type { Permission } from '@clinixa/shared';

/**
 * @description شكل بيانات الموظف المُستخرجة من التوكن، بعد فك التشفير
 */
export interface AuthEmployee {
  id: string;
  branch_id: string | null;
  is_owner: boolean;
  permissions: Permission[];
}

/**
 * @description شكل الـ payload المُخزَّن داخل الـ JWT وقت توليده (login / first-run)
 */
export interface JwtPayload {
  employee_id: string;
  branch_id: string | null;
  is_owner: boolean;
  permissions: Permission[];
}

// توسيع نوع Request بتاع Express عشان نقدر نحقن req.employee بأمان
declare global {
  namespace Express {
    interface Request {
      employee?: AuthEmployee;
    }
  }
}

/**
 * @description يفك تشفير الـ JWT من الـ Authorization header ويحقن بيانات الموظف في req
 * أي endpoint محمي لازم يمرّ من هنا أولاً
 */
export function authMiddleware(req: Request, _res: Response, next: NextFunction): void {
  const header = req.headers.authorization;

  if (!header || !header.startsWith('Bearer ')) {
    return next(new AppError('UNAUTHORIZED', 'يجب تسجيل الدخول أولاً', 401));
  }

  const token = header.slice('Bearer '.length);

  try {
    const payload = jwt.verify(token, env.JWT_SECRET) as JwtPayload;

    req.employee = {
      id: payload.employee_id,
      branch_id: payload.branch_id,
      is_owner: payload.is_owner,
      permissions: payload.permissions,
    };

    next();
  } catch {
    return next(new AppError('UNAUTHORIZED', 'الجلسة غير صالحة أو منتهية', 401));
  }
}