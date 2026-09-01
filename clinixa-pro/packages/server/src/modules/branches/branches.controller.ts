import type { Request, Response, NextFunction } from 'express';
import { AppError } from '../../middlewares/error-handler.middleware';
import { createBranchSchema, updateBranchSchema } from './branches.validation';
import { getBranches, createBranch, updateBranch } from './branches.service';

/**
 * @description معالجة طلب جلب قائمة الفروع (GET /api/branches)
 */
export async function listBranches(_req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const result = await getBranches();
    res.status(200).json({ ok: true, data: result, warning: null });
  } catch (err) {
    next(err);
  }
}

/**
 * @description معالجة طلب إنشاء فرع جديد (POST /api/branches)
 */
export async function createNewBranch(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const parsed = createBranchSchema.safeParse(req.body);
    if (!parsed.success) {
      const issue = parsed.error.issues[0];
      throw new AppError('VALIDATION_ERROR', issue.message, 400, issue.path.join('.'));
    }

    const result = await createBranch(parsed.data);
    res.status(201).json({ ok: true, data: result, warning: null });
  } catch (err) {
    next(err);
  }
}

/**
 * @description معالجة طلب تعديل بيانات الفرع (PUT /api/branches/:id)
 */
export async function updateBranchInfo(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const parsed = updateBranchSchema.safeParse(req.body);
    if (!parsed.success) {
      const issue = parsed.error.issues[0];
      throw new AppError('VALIDATION_ERROR', issue.message, 400, issue.path.join('.'));
    }

    const branchId = req.params.id as string;
    const result = await updateBranch(branchId, parsed.data);
    res.status(200).json({ ok: true, data: result, warning: null });
  } catch (err) {
    next(err);
  }
}
