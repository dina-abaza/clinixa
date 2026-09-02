"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createRadiologySchema = exports.createLabSchema = exports.createPrescriptionSchema = exports.prescriptionItemSchema = exports.createMedicationSchema = exports.createDiagnosisSchema = exports.createMedicalHistorySchema = exports.createFollowUpSchema = exports.createEmergencyContactSchema = exports.toggleActivePatientSchema = exports.updatePatientSchema = exports.createPatientSchema = exports.queryPatientsSchema = void 0;
const zod_1 = require("zod");
/**
 * @description سكيمة الفلترة والترقيم عند استعلام المرضى
 */
exports.queryPatientsSchema = zod_1.z.object({
    search: zod_1.z.string().optional().default(''),
    page: zod_1.z.coerce.number().min(1).default(1),
    page_size: zod_1.z.coerce.number().min(1).max(100).default(25),
    include_inactive: zod_1.z
        .enum(['true', 'false'])
        .optional()
        .transform((v) => v === 'true'),
});
/**
 * @description سكيمة إنشاء مريض جديد
 */
exports.createPatientSchema = zod_1.z.object({
    name_ar: zod_1.z.string().min(3, 'الاسم لازم يكون أكتر من كلمتين أو ٣ أحرف'),
    phone: zod_1.z.string().regex(/^01[0125][0-9]{8}$/, 'رقم الهاتف غير صالح، يجب أن يكون ١١ رقم ويبدأ بـ 010/011/012/015'),
    age: zod_1.z.coerce.number().min(0, 'العمر غير صالح').max(150, 'العمر غير صالح'),
    gender: zod_1.z.enum(['male', 'female'], { message: 'النوع غير معروف' }),
    address: zod_1.z.string().nullable().optional(),
    notes: zod_1.z.string().nullable().optional(),
    emergency_contact: zod_1.z
        .object({
        name: zod_1.z.string().nullable().optional(),
        relation: zod_1.z.string().nullable().optional(),
        phone: zod_1.z.string().nullable().optional(),
    })
        .optional(),
});
/**
 * @description سكيمة تعديل بيانات مريض
 */
exports.updatePatientSchema = exports.createPatientSchema.partial();
/**
 * @description سكيمة تغيير حالة تفعيل المريض
 */
exports.toggleActivePatientSchema = zod_1.z.object({
    is_active: zod_1.z.boolean(),
});
/**
 * @description سكيمة إضافة / تعديل جهة الاتصال الطارئة
 */
exports.createEmergencyContactSchema = zod_1.z.object({
    name: zod_1.z.string().nullable().optional(),
    relation: zod_1.z.string().nullable().optional(),
    phone: zod_1.z.string().nullable().optional(),
});
/**
 * @description سكيمة إدراج موعد متابعة للمريض
 */
exports.createFollowUpSchema = zod_1.z.object({
    due_date: zod_1.z.string().min(1, 'تاريخ المتابعة مطلوب'),
    reason: zod_1.z.string().nullable().optional(),
    fee: zod_1.z.coerce.number().nullable().optional(),
});
/**
 * @description سكيمة إضافة بند في التاريخ المرضي
 */
exports.createMedicalHistorySchema = zod_1.z.object({
    category: zod_1.z.string().min(1, 'الفئة مطلوبة'),
    text_ar: zod_1.z.string().min(1, 'النص العربي مطلوب'),
    text_en: zod_1.z.string().nullable().optional(),
});
/**
 * @description سكيمة إضافة تشخيص طبي
 */
exports.createDiagnosisSchema = zod_1.z.object({
    date: zod_1.z.string().default(() => new Date().toISOString().split('T')[0]),
    text_ar: zod_1.z.string().min(1, 'تشخيص المرض مطلوب'),
    text_en: zod_1.z.string().nullable().optional(),
});
/**
 * @description سكيمة إضافة دواء جديد للمريض
 */
exports.createMedicationSchema = zod_1.z.object({
    name: zod_1.z.string().min(1, 'اسم الدواء مطلوب'),
    dose: zod_1.z.string().nullable().optional(),
    frequency: zod_1.z.string().nullable().optional(),
    since: zod_1.z.string().nullable().optional(),
    status: zod_1.z.enum(['active', 'completed']).default('active'),
});
/**
 * @description سكيمة بند في الروشتة الطبية
 */
exports.prescriptionItemSchema = zod_1.z.object({
    drug: zod_1.z.string().min(1, 'اسم الدواء مطلوب'),
    dose: zod_1.z.string().nullable().optional(),
    frequency: zod_1.z.string().nullable().optional(),
    duration: zod_1.z.string().nullable().optional(),
    instructions: zod_1.z.string().nullable().optional(),
});
/**
 * @description سكيمة إنشاء روشتة طبية كاملة
 */
exports.createPrescriptionSchema = zod_1.z.object({
    date: zod_1.z.string().default(() => new Date().toISOString().split('T')[0]),
    items: zod_1.z.array(exports.prescriptionItemSchema).min(1, 'يجب إضافة دواء واحد على الأقل للروشتة'),
});
/**
 * @description سكيمة إضافة تحليل طبي
 */
exports.createLabSchema = zod_1.z.object({
    name: zod_1.z.string().min(1, 'اسم التحليل مطلوب'),
    date: zod_1.z.string().default(() => new Date().toISOString().split('T')[0]),
    status: zod_1.z.enum(['normal', 'abnormal', 'pending']).default('pending'),
    doctor_id: zod_1.z.string().nullable().optional(),
    has_attachment: zod_1.z.boolean().default(false),
});
/**
 * @description سكيمة إضافة أشعة طبية
 */
exports.createRadiologySchema = zod_1.z.object({
    type: zod_1.z.string().min(1, 'نوع الأشعة مطلوب'),
    date: zod_1.z.string().default(() => new Date().toISOString().split('T')[0]),
    report: zod_1.z.string().nullable().optional(),
    has_attachment: zod_1.z.boolean().default(false),
});
