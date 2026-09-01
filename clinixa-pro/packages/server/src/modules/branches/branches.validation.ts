import { z } from 'zod';

/**
 * @description سكيمة التحقق لإنشاء فرع جديد
 */
export const createBranchSchema = z.object({
  name_ar: z.string().min(1, 'اسم الفرع بالعربية مطلوب'),
  address_ar: z.string().nullable().optional(),
  phone: z.string().min(1, 'رقم هاتف الفرع مطلوب'),
  opens_at: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, 'وقت الفتح يجب أن يكون بصيغة HH:MM'),
  closes_at: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, 'وقت الإغلاق يجب أن يكون بصيغة HH:MM'),
});

export type CreateBranchInput = z.infer<typeof createBranchSchema>;

/**
 * @description سكيمة التحقق لتعديل بيانات الفرع
 */
export const updateBranchSchema = z.object({
  name_ar: z.string().min(1, 'اسم الفرع بالعربية مطلوب').optional(),
  address_ar: z.string().nullable().optional(),
  phone: z.string().min(1, 'رقم هاتف الفرع مطلوب').optional(),
  opens_at: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, 'وقت الفتح يجب أن يكون بصيغة HH:MM').optional(),
  closes_at: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, 'وقت الإغلاق يجب أن يكون بصيغة HH:MM').optional(),
  is_active: z.boolean().optional(),
});

export type UpdateBranchInput = z.infer<typeof updateBranchSchema>;
