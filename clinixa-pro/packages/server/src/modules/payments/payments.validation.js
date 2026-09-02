"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.daySummaryQuerySchema = exports.createPaymentSchema = exports.createChargeSchema = void 0;
const zod_1 = require("zod");
/**
 * @description سكيمة إضافة رسم طبي مباشر (Charge)
 */
exports.createChargeSchema = zod_1.z.object({
    patient_id: zod_1.z.string().min(1, 'معرّف المريض مطلوب'),
    type: zod_1.z.string().min(1, 'نوع الرسم مطلوب'),
    amount: zod_1.z.coerce.number().min(0, 'المبلغ غير صالح'),
    date: zod_1.z.string().default(() => new Date().toISOString().split('T')[0]),
    time: zod_1.z.string().default(() => new Date().toTimeString().split(' ')[0]),
});
/**
 * @description سكيمة تسجيل دفعة مالية (Payment)
 */
exports.createPaymentSchema = zod_1.z.object({
    patient_id: zod_1.z.string().min(1, 'معرّف المريض مطلوب'),
    amount: zod_1.z.coerce.number().min(0.01, 'مبلغ الدفع يجب أن يكون أكبر من ٠'),
    method: zod_1.z.enum(['cash', 'card', 'wallet', 'bank_transfer']).default('cash'),
});
/**
 * @description سكيمة الاستعلام عن ملخص اليوم
 */
exports.daySummaryQuerySchema = zod_1.z.object({
    date: zod_1.z.string().default(() => new Date().toISOString().split('T')[0]),
    branch_id: zod_1.z.string().optional(),
});
