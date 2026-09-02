"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.adjustQtySchema = exports.updateInventoryItemSchema = exports.createInventoryItemSchema = exports.queryInventorySchema = void 0;
const zod_1 = require("zod");
/**
 * @description سكيمة التحقق من استعلام جلب قائمة المخزون
 */
exports.queryInventorySchema = zod_1.z.object({
    branch_id: zod_1.z.string().optional(),
});
/**
 * @description سكيمة التحقق لإضافة صنف جديد في المخزون
 */
exports.createInventoryItemSchema = zod_1.z.object({
    branch_id: zod_1.z.string().optional(),
    name_ar: zod_1.z.string().min(1, 'اسم الصنف بالعربية مطلوب'),
    name_en: zod_1.z.string().nullable().optional(),
    type: zod_1.z.enum(['supplies', 'equipment'], {
        message: 'نوع الصنف يجب أن يكون مستلزمات (supplies) أو أجهزة (equipment)',
    }),
    qty: zod_1.z.number().int('الكمية يجب أن تكون عدداً صحيحاً').min(0, 'الكمية لا يمكن أن تكون سالبة').default(0),
    min_qty: zod_1.z.number().int('الحد الأدنى يجب أن يكون عدداً صحيحاً').min(0).nullable().optional(),
    unit: zod_1.z.string().min(1, 'وحدة القياس مطلوبة'),
});
/**
 * @description سكيمة التحقق لتعديل بيانات صنف في المخزون
 */
exports.updateInventoryItemSchema = zod_1.z.object({
    name_ar: zod_1.z.string().min(1, 'اسم الصنف بالعربية مطلوب').optional(),
    name_en: zod_1.z.string().nullable().optional(),
    type: zod_1.z.enum(['supplies', 'equipment']).optional(),
    qty: zod_1.z.number().int().min(0).optional(),
    min_qty: zod_1.z.number().int().min(0).nullable().optional(),
    unit: zod_1.z.string().min(1).optional(),
    is_active: zod_1.z.boolean().optional(),
});
/**
 * @description سكيمة التحقق لتعديل كمية الصنف المخزني فقط (adjust-qty)
 */
exports.adjustQtySchema = zod_1.z.object({
    qty: zod_1.z.number().int('الكمية يجب أن تكون عدداً صحيحاً').min(0, 'الكمية لا يمكن أن تكون سالبة'),
});
