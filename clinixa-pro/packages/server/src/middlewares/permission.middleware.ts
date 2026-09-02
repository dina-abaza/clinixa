import type { Request, Response, NextFunction } from 'express';
import type { Permission } from '@clinixa/shared';
import { AppError } from './error-handler.middleware';

/**
 * @description Factory function — بترجع middleware ترفض الطلب لو الموظف مالوش الصلاحية المطلوبة
 * ⚠️ لازم يجي بعد authMiddleware في السلسلة (محتاج req.employee محقون فعلاً)
 * @param {Permission} permission - الصلاحية المطلوبة للوصول للـ endpoint
 */
export function requirePermission(permission: Permission) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    const employee = req.employee;

    if (!employee) {
      return next(new AppError('UNAUTHORIZED', 'يجب تسجيل الدخول أولاً', 401));
    }

    // المالك متاح له كل الصلاحيات دايمًا
    if (employee.is_owner || employee.permissions.includes(permission)) {
      next();
      return;
    }

    return next(new AppError('FORBIDDEN', 'ليس لديك صلاحية لتنفيذ هذا الإجراء', 403));
  };
}