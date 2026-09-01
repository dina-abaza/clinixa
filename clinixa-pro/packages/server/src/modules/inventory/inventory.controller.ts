import type { Request, Response, NextFunction } from 'express';
import { AppError } from '../../middlewares/error-handler.middleware';
import {
  queryInventorySchema,
  createInventoryItemSchema,
  updateInventoryItemSchema,
  adjustQtySchema,
} from './inventory.validation';
import {
  getInventoryItems,
  createInventoryItem,
  updateInventoryItem,
  adjustInventoryQty,
} from './inventory.service';

/**
 * @description معالجة طلب جلب قائمة المخزون (GET /api/inventory)
 */
export async function listInventory(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const parsed = queryInventorySchema.safeParse(req.query);
    if (!parsed.success) {
      const issue = parsed.error.issues[0];
      throw new AppError('VALIDATION_ERROR', issue.message, 400, issue.path.join('.'));
    }

    const branchId = parsed.data.branch_id || req.employee?.branch_id;
    const result = await getInventoryItems(branchId);
    res.status(200).json({ ok: true, data: result, warning: null });
  } catch (err) {
    next(err);
  }
}

/**
 * @description معالجة طلب إضافة صنف جديد للمخزون (POST /api/inventory)
 */
export async function createItem(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const parsed = createInventoryItemSchema.safeParse(req.body);
    if (!parsed.success) {
      const issue = parsed.error.issues[0];
      throw new AppError('VALIDATION_ERROR', issue.message, 400, issue.path.join('.'));
    }

    const result = await createInventoryItem(parsed.data, req.employee?.branch_id);
    res.status(201).json({ ok: true, data: result, warning: null });
  } catch (err) {
    next(err);
  }
}

/**
 * @description معالجة طلب تعديل صنف في المخزون (PUT /api/inventory/:id)
 */
export async function updateItem(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const parsed = updateInventoryItemSchema.safeParse(req.body);
    if (!parsed.success) {
      const issue = parsed.error.issues[0];
      throw new AppError('VALIDATION_ERROR', issue.message, 400, issue.path.join('.'));
    }

    const itemId = req.params.id as string;
    const result = await updateInventoryItem(itemId, parsed.data);
    res.status(200).json({ ok: true, data: result, warning: null });
  } catch (err) {
    next(err);
  }
}

/**
 * @description معالجة طلب تعديل كمية الصنف المخزني (PATCH /api/inventory/:id/adjust-qty)
 */
export async function adjustQty(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const parsed = adjustQtySchema.safeParse(req.body);
    if (!parsed.success) {
      const issue = parsed.error.issues[0];
      throw new AppError('VALIDATION_ERROR', issue.message, 400, issue.path.join('.'));
    }

    const itemId = req.params.id as string;
    const result = await adjustInventoryQty(itemId, parsed.data);
    res.status(200).json({ ok: true, data: result, warning: null });
  } catch (err) {
    next(err);
  }
}
