import { z } from 'zod';
import { SPECIALTIES } from '@clinixa/shared';

const SPECIALTY_MAP: Record<string, string> = {
  family: 'general',
  pediatric: 'pediatrics',
  endocrine: 'diabetes',
  nephro: 'nephrology',
  neuro: 'neurology',
  rheum: 'rheumatology',
  gastro: 'gastro',
  hema: 'hematology',
  derma: 'dermatology',
  psych: 'psychiatry',
  uro: 'urology',
  obgyn: 'gynecology',
  rehab: 'ortho',
  geriatrics: 'general',
  immuno: 'hematology',
  nutrition: 'internal',
};

export const firstRunSchema = z.object({
  license_key: z
    .string()
    .regex( 
      /^(CLX|ACT)-\d{3}[IHDWMY]-[A-Z0-9]{4}-[A-Z0-9]{4}-[A-Z0-9]{4}$/i,
      'صيغة كود التفعيل غير صحيحة (مثال: ACT-001Y-XXXX-XXXX-XXXX أو CLX-001M-XXXX-XXXX-XXXX)'
    ),

  clinic: z.object({
    name_ar: z.string().min(3, 'اسم العيادة لازم يكون أكتر من حرفين'),
    phone: z.string().regex(/^01[0125][0-9]{8}$/, 'رقم الهاتف غير صالح'),
    address: z.string().nullable().optional(),
    specialty: z
      .string()
      .min(1, 'التخصص مطلوب')
      .transform((val) => SPECIALTY_MAP[val] || val),
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