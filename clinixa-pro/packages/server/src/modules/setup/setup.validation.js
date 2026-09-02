"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.firstRunSchema = void 0;
const zod_1 = require("zod");
const shared_1 = require("@clinixa/shared");
const specialtyKeys = shared_1.SPECIALTIES.map((s) => s.key);
exports.firstRunSchema = zod_1.z.object({
    license_key: zod_1.z.string().min(1, 'مفتاح الترخيص مطلوب'),
    clinic: zod_1.z.object({
        name_ar: zod_1.z.string().min(3, 'اسم العيادة لازم يكون أكتر من حرفين'),
        phone: zod_1.z.string().regex(/^01[0125][0-9]{8}$/, 'رقم الهاتف غير صالح'),
        address: zod_1.z.string().nullable().optional(),
        specialty: zod_1.z.enum(specialtyKeys, {
            message: 'التخصص غير معروف',
        }),
    }),
    doctor_account: zod_1.z.object({
        name_ar: zod_1.z.string().min(3, 'اسم الطبيب لازم يكون أكتر من حرفين'),
        username: zod_1.z.string().min(3, 'اسم المستخدم لازم يكون أكتر من ٣ أحرف'),
        password: zod_1.z.string().min(6, 'كلمة السر لازم تكون ٦ أحرف على الأقل'),
    }),
    security: zod_1.z.object({
        question: zod_1.z.string().min(3, 'سؤال الأمان مطلوب'),
        answer: zod_1.z.string().min(1, 'إجابة سؤال الأمان مطلوبة'),
    }),
});
