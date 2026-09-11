import { z } from 'zod';
import { SPECIALTIES } from '@clinixa/shared';

const specialtyKeys = SPECIALTIES.map((s) => s.key) as [string, ...string[]];

export const firstRunSchema = z.object({
  license_key: z
    .string()
    .regex(
      /^CLX-\d{3}[IHDWMY]-[A-Z0-9]{4}-[A-Z0-9]{4}-[A-Z0-9]{4}$/i,
      'صيغة مفتاح الترخيص غير صحيحة (مثال: CLX-001M-XXXX-XXXX-XXXX)'
    ),

  clinic: z.object({
    name_ar: z.string().min(3, 'اسم العيادة لازم يكون أكتر من حرفين'),
    phone: z.string().regex(/^01[0125][0-9]{8}$/, 'رقم الهاتف غير صالح'),
    address: z.string().nullable().optional(),
    specialty: z.enum(specialtyKeys as [string, ...string[]], {
      message: 'التخصص غير معروف',
    }),
  }),

  doctor_account: z.object({
    name_ar: z.string().min(3, 'اسم الطبيب لازم يكون أكتر من حرفين'),
    username: z.string().min(3, 'اسم المستخدم لازم يكون أكتر من ٣ أحرف'),
    password: z.string().min(6, 'كلمة السر لازم تكون ٦ أحرف على الأقل'),
  }),

  security: z.object({
    question: z.string().min(3, 'سؤال الأمان مطلوب'),
    answer: z.string().min(1, 'إجابة سؤال الأمان مطلوبة'),
  }),
});

export type FirstRunInput = z.infer<typeof firstRunSchema>;