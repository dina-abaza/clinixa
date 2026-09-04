import { z } from 'zod';
import { LICENSE_KEY_RE } from '../../lib/validation/licenseKey';
import { normalizeAnswer } from '../../lib/validation/normalizeAnswer';
import { SPECIALTY_KEYS } from './data/specialties';
import { SECURITY_QUESTION_KEYS } from './data/securityQuestions';

/**
 * ⚠ رقم التليفون: البروتوتايب بيتحقق بس إن فيه ٨ أرقام على الأقل، لكن الباك
 * الفعلي (packages/server/src/modules/setup/setup.validation.ts) بيفرض شكل
 * موبايل مصري كامل: ١١ رقم يبدأ بـ 010/011/012/015 — ونفس الرسالة موجودة
 * كمثال VALIDATION_ERROR في §0 من الـ API reference. اتبعنا شرط الباك هنا
 * (أدق من شرط البروتوتايب) عشان مايوصلش المستخدم لخطوة نجاح شكلية في
 * الفرونت يفشلها الباك فورًا.
 */
export const CLINIC_PHONE_RE = /^01[0125][0-9]{8}$/;

const specialtyEnum = z.enum(SPECIALTY_KEYS as [string, ...string[]]);
const questionEnum = z.enum(SECURITY_QUESTION_KEYS);

export const firstRunSetupFormSchema = z
  .object({
    licenseKey: z.string().regex(LICENSE_KEY_RE),

    clinicNameAr: z.string().trim().min(3),
    specialty: specialtyEnum,
    clinicPhone: z.string().regex(CLINIC_PHONE_RE),
    clinicAddress: z.string().trim(),
    opensAt: z.string().min(1),
    closesAt: z.string().min(1),

    doctorNameAr: z.string().trim().min(3),
    /**
     * ⚠ قرار 2026-08-30: البروتوتايب الأصلي كان بيمنع النقطة (`/^[a-zA-Z0-9]{3,}$/`)،
     * لكن الباك (auth/setup validation) مفيهوش أي قيد على الشكل — طول بس (٣+).
     * وأمثلة الـ API reference/.http كلها بتستخدم `dr.ahmed` كـ username، وده
     * بالظبط اللي شاشة تسجيل الدخول الديمو في البروتوتايب بتفترض وجوده —
     * يعني البروتوتايب نفسه كان فيه تناقض داخلي. اتصلّحت هنا (فرونت بس)
     * بالسماح بالنقطة، من غير أي لمسة للباك أو الـshared.
     */
    username: z.string().regex(/^[a-zA-Z0-9.]{3,}$/),
    password: z.string().min(6),
    confirmPassword: z.string(),

    securityQuestion: questionEnum,
    securityAnswer: z.string().trim().min(1),
    confirmAnswer: z.string().trim().min(1),
  })
  .superRefine((data, ctx) => {
    if (data.closesAt <= data.opensAt) {
      ctx.addIssue({ path: ['closesAt'], code: 'custom', message: 'closing must be after opening' });
    }
    if (data.password !== data.confirmPassword) {
      ctx.addIssue({ path: ['confirmPassword'], code: 'custom', message: "passwords don't match" });
    }
    if (normalizeAnswer(data.securityAnswer) !== normalizeAnswer(data.confirmAnswer)) {
      ctx.addIssue({ path: ['confirmAnswer'], code: 'custom', message: "answers don't match" });
    }
  });

export type FirstRunSetupFormValues = z.infer<typeof firstRunSetupFormSchema>;

export const FIRST_RUN_SETUP_DEFAULTS: FirstRunSetupFormValues = {
  licenseKey: '',
  clinicNameAr: '',
  specialty: '' as FirstRunSetupFormValues['specialty'],
  clinicPhone: '',
  clinicAddress: '',
  opensAt: '10:00',
  closesAt: '22:00',
  doctorNameAr: '',
  username: '',
  password: '',
  confirmPassword: '',
  securityQuestion: '' as FirstRunSetupFormValues['securityQuestion'],
  securityAnswer: '',
  confirmAnswer: '',
};

export const TOTAL_STEPS = 4;

/** أسماء الحقول اللي كل خطوة بتتحقق منها بس — نفس validStep() بالخطوات */
export const STEP_FIELDS: Record<number, (keyof FirstRunSetupFormValues)[]> = {
  1: ['licenseKey'],
  2: ['clinicNameAr', 'specialty', 'clinicPhone', 'opensAt', 'closesAt'],
  3: ['doctorNameAr', 'username', 'password', 'confirmPassword'],
  4: ['securityQuestion', 'securityAnswer', 'confirmAnswer'],
};
