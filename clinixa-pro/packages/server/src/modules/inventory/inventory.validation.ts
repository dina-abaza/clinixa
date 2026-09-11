import { z } from 'zod';

/**
 * @description سكيمة التحقق من استعلام جلب قائمة المخزون
 */
export const queryInventorySchema = z.object({
  branch_id: z.string().optional(),
});

export type QueryInventoryInput = z.infer<typeof queryInventorySchema>;

/**
 * @description سكيمة التحقق لإضافة صنف جديد في المخزون
 */
export const createInventoryItemSchema = z.object({
  branch_id: z.string().optional(),
  name_ar: z.string().min(1, 'اسم الصنف بالعربية مطلوب'),
  name_en: z.string().nullable().optional(),
  type: z.enum(['supplies', 'equipment'], {
    message: 'نوع الصنف يجب أن يكون مستلزمات (supplies) أو أجهزة (equipment)',
  }),
  qty: z.number().int('الكمية يجب أن تكون عدداً صحيحاً').min(0, 'الكمية لا يمكن أن تكون سالبة').default(0),
  min_qty: z.number().int('الحد الأدنى يجب أن يكون عدداً صحيحاً').min(0).nullable().optional(),
  unit: z.string().min(1, 'وحدة القياس مطلوبة'),
});

export type CreateInventoryItemInput = z.infer<typeof createInventoryItemSchema>;

/**
 * @description سكيمة التحقق لتعديل بيانات صنف في المخزون
 */
export const updateInventoryItemSchema = z.object({
  name_ar: z.string().min(1, 'اسم الصنف بالعربية مطلوب').optional(),
  name_en: z.string().nullable().optional(),
  type: z.enum(['supplies', 'equipment']).optional(),
  qty: z.number().int().min(0).optional(),
  min_qty: z.number().int().min(0).nullable().optional(),
  unit: z.string().min(1).optional(),
  is_active: z.boolean().optional(),
});

export type UpdateInventoryItemInput = z.infer<typeof updateInventoryItemSchema>;

/**
 * @description سكيمة التحقق لتعديل كمية الصنف المخزني فقط (adjust-qty)
 */
export const adjustQtySchema = z.object({
  qty: z.number().int('الكمية يجب أن تكون عدداً صحيحاً').min(0, 'الكمية لا يمكن أن تكون سالبة'),
});

export type AdjustQtyInput = z.infer<typeof adjustQtySchema>;
