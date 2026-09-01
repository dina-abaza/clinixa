import crypto from 'crypto';
import query from '../../db/sqlite/query';
import { AppError } from '../../middlewares/error-handler.middleware';
import type { ClinicPrice } from '@clinixa/shared';
import type { UpdateSettingsInput } from './settings.validation';

/**
 * @description شكل بيانات العيادة والإعدادات والأسعار المرجعة
 */
export interface SettingsResult {
  clinic: {
    name_ar: string;
    specialty: string;
    phone: string | null;
    address: string | null;
    sync_mode: string;
  };
  prices: ClinicPrice[];
}

/**
 * @description جلب إعدادات العيادة الحالية وقائمة الأسعار الافتراضية للخدمات
 * @returns {Promise<SettingsResult>} إعدادات العيادة والأسعار
 * @throws {AppError} 404 NOT_FOUND في حال عدم تهيئة العيادة بعد
 */
export async function getClinicSettings(): Promise<SettingsResult> {
  const clinic = await query('clinic_settings').where({ id: 'singleton' }).first();
  if (!clinic) {
    throw new AppError('NOT_FOUND', 'لم يتم ضبط إعدادات العيادة بعد', 404);
  }

  const pricesRows = await query('clinic_prices').orderBy('charge_type', 'asc');

  const prices: ClinicPrice[] = pricesRows.map((p) => ({
    id: p.id,
    charge_type: p.charge_type,
    default_amount: Number(p.default_amount),
  }));

  return {
    clinic: {
      name_ar: clinic.name_ar,
      specialty: clinic.specialty,
      phone: clinic.phone ?? null,
      address: clinic.address ?? null,
      sync_mode: clinic.sync_mode,
    },
    prices,
  };
}

/**
 * @description تحديث إعدادات العيادة وقائمة الأسعار الافتراضية
 * @param {UpdateSettingsInput} input - البيانات المراد تحديثها
 * @returns {Promise<{ message: string }>} رسالة نجاح العملية
 * @throws {AppError} 404 NOT_FOUND في حال عدم وجود إعدادات العيادة
 */
export async function updateClinicSettings(
  input: UpdateSettingsInput
): Promise<{ message: string }> {
  const clinic = await query('clinic_settings').where({ id: 'singleton' }).first();
  if (!clinic) {
    throw new AppError('NOT_FOUND', 'لم يتم ضبط إعدادات العيادة بعد', 404);
  }

  await query.transaction(async (trx) => {
    // تحديث بيانات العيادة إن وجدت
    if (input.clinic) {
      const updateData: Record<string, any> = {
        updated_at: trx.raw("(datetime('now'))"),
      };
      if (input.clinic.name_ar !== undefined) updateData.name_ar = input.clinic.name_ar;
      if (input.clinic.phone !== undefined) updateData.phone = input.clinic.phone;
      if (input.clinic.address !== undefined) updateData.address = input.clinic.address;

      await trx('clinic_settings').where({ id: 'singleton' }).update(updateData);
    }

    // تحديث أو إدراج الأسعار إن وجدت
    if (input.prices && input.prices.length > 0) {
      for (const priceItem of input.prices) {
        const existingPrice = await trx('clinic_prices')
          .where({ charge_type: priceItem.charge_type })
          .first();

        if (existingPrice) {
          await trx('clinic_prices')
            .where({ charge_type: priceItem.charge_type })
            .update({ default_amount: priceItem.default_amount });
        } else {
          await trx('clinic_prices').insert({
            id: `prc_${crypto.randomUUID()}`,
            charge_type: priceItem.charge_type,
            default_amount: priceItem.default_amount,
          });
        }
      }
    }
  });

  return { message: 'تم تحديث الإعدادات والأسعار بنجاح' };
}
