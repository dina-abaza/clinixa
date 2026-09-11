import type { Request, Response, NextFunction } from 'express';
import { AppError } from '../../middlewares/error-handler.middleware';
import {
  queryEmployeesSchema,
  createEmployeeSchema,
  updatePermissionsSchema,
  toggleActiveEmployeeSchema,
} from './employees.validation';
import {
  getEmployees,
  createEmployee,
  updateEmployeePermissions,
  resetEmployeePassword,
  toggleEmployeeActive,
} from './employees.service';

/**
 * @description معالجة طلب جلب قائمة الموظفين (GET /api/employees)
 */
export async function listEmployees(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const parsed = queryEmployeesSchema.safeParse(req.query);
    if (!parsed.success) {
      const issue = parsed.error.issues[0];
      throw new AppError('VALIDATION_ERROR', issue.message, 400, issue.path.join('.'));
    }

    const branchId = parsed.data.branch_id || (req.employee?.is_owner ? undefined : req.employee?.branch_id);
    const result = await getEmployees(branchId);
    res.status(200).json({ ok: true, data: result, warning: null });
  } catch (err) {
    next(err);
  }
}

/**
 * @description معالجة طلب إنشاء موظف جديد (POST /api/employees)
 */
export async function createNewEmployee(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const parsed = createEmployeeSchema.safeParse(req.body);
    if (!parsed.success) {
      const issue = parsed.error.issues[0];
      throw new AppError('VALIDATION_ERROR', issue.message, 400, issue.path.join('.'));
    }

    const result = await createEmployee(parsed.data);
    res.status(201).json({ ok: true, data: result, warning: null });
  } catch (err) {
    next(err);
  }
}

/**
 * @description معالجة طلب تعديل صلاحيات موظف (PUT /api/employees/:id/permissions)
 */
export async function updatePermissions(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const parsed = updatePermissionsSchema.safeParse(req.body);
    if (!parsed.success) {
      const issue = parsed.error.issues[0];
      throw new AppError('VALIDATION_ERROR', issue.message, 400, issue.path.join('.'));
    }

    const employeeId = req.params.id as string;
    const result = await updateEmployeePermissions(employeeId, parsed.data);
    res.status(200).json({ ok: true, data: result, warning: null });
  } catch (err) {
    next(err);
  }
}

/**
 * @description معالجة طلب إعادة تعيين كلمة سر الموظف (PATCH /api/employees/:id/reset-password)
 */
export async function resetPassword(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const employeeId = req.params.id as string;
    const result = await resetEmployeePassword(employeeId);
    res.status(200).json({ ok: true, data: result, warning: null });
  } catch (err) {
    next(err);
  }
}

/**
 * @description معالجة طلب تبديل حالة تفعيل الموظف (PATCH /api/employees/:id/toggle-active)
 */
export async function toggleActive(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const parsed = toggleActiveEmployeeSchema.safeParse(req.body);
    if (!parsed.success) {
      const issue = parsed.error.issues[0];
      throw new AppError('VALIDATION_ERROR', issue.message, 400, issue.path.join('.'));
    }

    const employeeId = req.params.id as string;
    const result = await toggleEmployeeActive(employeeId, parsed.data);
    res.status(200).json({ ok: true, data: result, warning: null });
  } catch (err) {
    next(err);
  }
}
