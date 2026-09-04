import { z } from 'zod';
import { EGYPT_PHONE_RE } from '../../lib/validation/phone';

/**
 * فورم "مريض جديد" — نفس حقول `POST /api/patients` في clinixa-api-reference.md
 * §2 بالحرف (`name_ar`, `phone`, `age`, `gender`, `address`, `notes`,
 * `emergency_contact`). `employee_id`/`branch_id` بيتحطوا في الباك من التوكن.
 */
export const newPatientFormSchema = z.object({
  nameAr: z.string().trim().min(3),
  phone: z.string().regex(EGYPT_PHONE_RE),
  age: z.coerce.number().int().min(0).max(120),
  gender: z.enum(['male', 'female']),
  address: z.string().trim(),
  notes: z.string().trim(),
  emergencyName: z.string().trim(),
  emergencyRelation: z.enum(['father', 'mother', 'spouse', 'sibling', 'other', '']),
  emergencyPhone: z.string().refine((v) => v === '' || EGYPT_PHONE_RE.test(v)),
});

/** شكل قيم الفورم قبل التحقق (`age` نص من الـ input) — ده اللي بيتسجّل بـ `useForm<>`. */
export type NewPatientFormValues = z.input<typeof newPatientFormSchema>;
/** شكل القيم بعد التحقق (`age` رقم) — ده اللي بيوصل لـ `onSubmit`. */
export type NewPatientFormOutput = z.output<typeof newPatientFormSchema>;

export const NEW_PATIENT_FORM_DEFAULTS: NewPatientFormValues = {
  nameAr: '',
  phone: '',
  age: '',
  gender: 'male',
  address: '',
  notes: '',
  emergencyName: '',
  emergencyRelation: '',
  emergencyPhone: '',
};
