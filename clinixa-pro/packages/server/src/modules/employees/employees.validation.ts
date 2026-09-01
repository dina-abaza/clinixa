import { z } from 'zod';
import { PERMISSIONS, isValidPermission } from '@clinixa/shared';

/**
 * @description سكيمة التحقق من استعلام جلب الموظفين
 */
export const queryEmployeesSchema = z.object({
  branch_id: z.string().optional(),
});

export type QueryEmployeesInput = z.infer<typeof queryEmployeesSchema>;

/**
 * @description سكيمة التحقق لإنشاء موظف جديد
 */
export const createEmployeeSchema = z.object({
  name_ar: z.string().min(1, 'اسم الموظف بالعربية مطلوب'),
  username: z.string().min(3, 'اسم المستخدم يجب أن يكون 3 أحرف على الأقل').toLowerCase().trim(),
  role: z.enum(['doctor', 'nurse', 'secretary'], {
    message: 'الدور الوظيفي يجب أن يكون doctor أو nurse أو secretary',
  }),
  branch_id: z.string().nullable().optional(),
  permissions: z
    .array(
      z.string().refine((val) => isValidPermission(val), {
        message: 'إحدى الصلاحيات المدخلة غير معتمدة في النظام',
      })
    )
    .default([]),
});

export type CreateEmployeeInput = z.infer<typeof createEmployeeSchema>;

/**
 * @description سكيمة التحقق لتعديل صلاحيات الموظف
 */
export const updatePermissionsSchema = z.object({
  permissions: z.array(
    z.string().refine((val) => isValidPermission(val), {
      message: 'إحدى الصلاحيات المدخلة غير معتمدة في النظام',
    })
  ),
});

export type UpdatePermissionsInput = z.infer<typeof updatePermissionsSchema>;

/**
 * @description سكيمة التحقق لتبديل حالة تفعيل الموظف
 */
export const toggleActiveEmployeeSchema = z.object({
  is_active: z.boolean({ message: 'حالة التفعيل يجب أن تكون true أو false' }),
});

export type ToggleActiveEmployeeInput = z.infer<typeof toggleActiveEmployeeSchema>;
