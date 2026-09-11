import { z } from 'zod';
import { CHARGE_TYPES, type ChargeType } from '@clinixa/shared';

const chargeTypeKeys = CHARGE_TYPES.map((c) => c.key) as [ChargeType, ...ChargeType[]];

/**
 * @description سكيمة التحقق لتعديل إعدادات العيادة والأسعار
 */
export const updateSettingsSchema = z.object({
  clinic: z
    .object({
      name_ar: z.string().min(1, 'اسم العيادة بالعربية مطلوب').optional(),
      phone: z.string().nullable().optional(),
      address: z.string().nullable().optional(),
    })
    .optional(),
  prices: z
    .array(
      z.object({
        charge_type: z.enum(chargeTypeKeys, {
          message: 'نوع الرسوم غير صالح',
        }),
        default_amount: z
          .number({ message: 'السعر يجب أن يكون رقماً' })
          .min(0, 'السعر لا يمكن أن يكون سالباً'),
      })
    )
    .optional(),
});

export type UpdateSettingsInput = z.infer<typeof updateSettingsSchema>;
