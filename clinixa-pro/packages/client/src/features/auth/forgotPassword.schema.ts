import { z } from 'zod';

/**
 * ⚠ خطوة ٢ (الإجابة) بتتحقق من وجودها بس هنا (مش من صحّتها) — الباك مفيهوش
 * endpoint يتحقق من الإجابة لوحدها، فالتحقق الحقيقي بيحصل مع خطوة ٣ (راجع
 * ملحوظة postForgotPassword في lib/api/auth.ts).
 */
export const forgotPasswordFormSchema = z
  .object({
    username: z.string().trim().min(1),
    answer: z.string().trim().min(1),
    newPassword: z.string().min(6),
    confirmPassword: z.string(),
  })
  .superRefine((data, ctx) => {
    if (data.newPassword !== data.confirmPassword) {
      ctx.addIssue({ path: ['confirmPassword'], code: 'custom', message: "passwords don't match" });
    }
  });

export type ForgotPasswordFormValues = z.infer<typeof forgotPasswordFormSchema>;

export const FORGOT_PASSWORD_DEFAULTS: ForgotPasswordFormValues = {
  username: '',
  answer: '',
  newPassword: '',
  confirmPassword: '',
};

export const TOTAL_STEPS = 3;

export const STEP_FIELDS: Record<number, (keyof ForgotPasswordFormValues)[]> = {
  1: ['username'],
  2: ['answer'],
  3: ['newPassword', 'confirmPassword'],
};
