"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateBranchSchema = exports.createBranchSchema = void 0;
const zod_1 = require("zod");
/**
 * @description سكيمة التحقق لإنشاء فرع جديد
 */
exports.createBranchSchema = zod_1.z.object({
    name_ar: zod_1.z.string().min(1, 'اسم الفرع بالعربية مطلوب'),
    address_ar: zod_1.z.string().nullable().optional(),
    phone: zod_1.z.string().min(1, 'رقم هاتف الفرع مطلوب'),
    opens_at: zod_1.z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, 'وقت الفتح يجب أن يكون بصيغة HH:MM'),
    closes_at: zod_1.z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, 'وقت الإغلاق يجب أن يكون بصيغة HH:MM'),
});
/**
 * @description سكيمة التحقق لتعديل بيانات الفرع
 */
exports.updateBranchSchema = zod_1.z.object({
    name_ar: zod_1.z.string().min(1, 'اسم الفرع بالعربية مطلوب').optional(),
    address_ar: zod_1.z.string().nullable().optional(),
    phone: zod_1.z.string().min(1, 'رقم هاتف الفرع مطلوب').optional(),
    opens_at: zod_1.z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, 'وقت الفتح يجب أن يكون بصيغة HH:MM').optional(),
    closes_at: zod_1.z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, 'وقت الإغلاق يجب أن يكون بصيغة HH:MM').optional(),
    is_active: zod_1.z.boolean().optional(),
});
