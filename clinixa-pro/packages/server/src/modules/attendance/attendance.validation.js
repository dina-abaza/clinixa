"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.finishAttendanceSchema = exports.finishFollowUpSchema = exports.finishChargeItemSchema = exports.updateStatusSchema = exports.checkInSchema = exports.queryAttendanceSchema = void 0;
const zod_1 = require("zod");
/**
 * @description سكيمة استعلام سجلات الحضور
 */
exports.queryAttendanceSchema = zod_1.z.object({
    date: zod_1.z.string().default(() => new Date().toISOString().split('T')[0]),
    branch_id: zod_1.z.string().optional(),
});
/**
 * @description سكيمة تسجيل دخول مريض للطابور (Check-in)
 */
exports.checkInSchema = zod_1.z.object({
    patient_id: zod_1.z.string().min(1, 'معرّف المريض مطلوب'),
});
/**
 * @description سكيمة تغيير حالة الحضور (noshow / left)
 */
exports.updateStatusSchema = zod_1.z.object({
    status: zod_1.z.enum(['noshow', 'left'], { message: 'الحالة غير مسموح بها' }),
});
/**
 * @description بند خدمة/رسوم عند إنهاء الكشف
 */
exports.finishChargeItemSchema = zod_1.z.object({
    charge_type: zod_1.z.string().min(1, 'نوع الرسم مطلوب'),
    amount: zod_1.z.coerce.number().min(0, 'المبلغ يجب أن يكون أكبر من أو يساوي ٠'),
});
/**
 * @description بيانات المتابعة عند إنهاء الكشف
 */
exports.finishFollowUpSchema = zod_1.z.object({
    days: zod_1.z.coerce.number().min(1, 'عدد الأيام مطلوب'),
    fee: zod_1.z.coerce.number().min(0).nullable().optional(),
    reason: zod_1.z.string().nullable().optional(),
});
/**
 * @description سكيمة الفعل المركّب عند إنهاء الكشف (Finish Attendance)
 */
exports.finishAttendanceSchema = zod_1.z.object({
    items: zod_1.z.array(exports.finishChargeItemSchema).optional().default([]),
    follow_up: exports.finishFollowUpSchema.nullable().optional(),
});
