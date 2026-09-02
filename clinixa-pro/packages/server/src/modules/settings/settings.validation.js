"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateSettingsSchema = void 0;
const zod_1 = require("zod");
const shared_1 = require("@clinixa/shared");
const chargeTypeKeys = shared_1.CHARGE_TYPES.map((c) => c.key);
/**
 * @description سكيمة التحقق لتعديل إعدادات العيادة والأسعار
 */
exports.updateSettingsSchema = zod_1.z.object({
    clinic: zod_1.z
        .object({
        name_ar: zod_1.z.string().min(1, 'اسم العيادة بالعربية مطلوب').optional(),
        phone: zod_1.z.string().nullable().optional(),
        address: zod_1.z.string().nullable().optional(),
    })
        .optional(),
    prices: zod_1.z
        .array(zod_1.z.object({
        charge_type: zod_1.z.enum(chargeTypeKeys, {
            message: 'نوع الرسوم غير صالح',
        }),
        default_amount: zod_1.z
            .number({ message: 'السعر يجب أن يكون رقماً' })
            .min(0, 'السعر لا يمكن أن يكون سالباً'),
    }))
        .optional(),
});
