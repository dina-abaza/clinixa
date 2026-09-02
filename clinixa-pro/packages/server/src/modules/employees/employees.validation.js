"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.toggleActiveEmployeeSchema = exports.updatePermissionsSchema = exports.createEmployeeSchema = exports.queryEmployeesSchema = void 0;
const zod_1 = require("zod");
const shared_1 = require("@clinixa/shared");
/**
 * @description سكيمة التحقق من استعلام جلب الموظفين
 */
exports.queryEmployeesSchema = zod_1.z.object({
    branch_id: zod_1.z.string().optional(),
});
/**
 * @description سكيمة التحقق لإنشاء موظف جديد
 */
exports.createEmployeeSchema = zod_1.z.object({
    name_ar: zod_1.z.string().min(1, 'اسم الموظف بالعربية مطلوب'),
    username: zod_1.z.string().min(3, 'اسم المستخدم يجب أن يكون 3 أحرف على الأقل').toLowerCase().trim(),
    role: zod_1.z.enum(['doctor', 'nurse', 'secretary'], {
        message: 'الدور الوظيفي يجب أن يكون doctor أو nurse أو secretary',
    }),
    branch_id: zod_1.z.string().nullable().optional(),
    permissions: zod_1.z
        .array(zod_1.z.string().refine((val) => (0, shared_1.isValidPermission)(val), {
        message: 'إحدى الصلاحيات المدخلة غير معتمدة في النظام',
    }))
        .default([]),
});
/**
 * @description سكيمة التحقق لتعديل صلاحيات الموظف
 */
exports.updatePermissionsSchema = zod_1.z.object({
    permissions: zod_1.z.array(zod_1.z.string().refine((val) => (0, shared_1.isValidPermission)(val), {
        message: 'إحدى الصلاحيات المدخلة غير معتمدة في النظام',
    })),
});
/**
 * @description سكيمة التحقق لتبديل حالة تفعيل الموظف
 */
exports.toggleActiveEmployeeSchema = zod_1.z.object({
    is_active: zod_1.z.boolean({ message: 'حالة التفعيل يجب أن تكون true أو false' }),
});
