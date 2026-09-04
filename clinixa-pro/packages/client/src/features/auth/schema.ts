import { z } from 'zod';

/**
 * مطابق لـ loginSchema في packages/server/src/modules/auth/auth.validation.ts —
 * الباك بس بيتحقق من إن الحقلين مش فاضيين (مفيش شكل/طول إضافي مفروض).
 */
export const loginFormSchema = z.object({
  username: z.string().trim().min(1),
  password: z.string().min(1),
});

export type LoginFormValues = z.infer<typeof loginFormSchema>;

export const LOGIN_FORM_DEFAULTS: LoginFormValues = {
  username: '',
  password: '',
};
