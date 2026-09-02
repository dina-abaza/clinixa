"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getClinicSettings = getClinicSettings;
exports.updateClinicSettings = updateClinicSettings;
const crypto_1 = __importDefault(require("crypto"));
const query_1 = __importDefault(require("../../db/sqlite/query"));
const error_handler_middleware_1 = require("../../middlewares/error-handler.middleware");
/**
 * @description جلب إعدادات العيادة الحالية وقائمة الأسعار الافتراضية للخدمات
 * @returns {Promise<SettingsResult>} إعدادات العيادة والأسعار
 * @throws {AppError} 404 NOT_FOUND في حال عدم تهيئة العيادة بعد
 */
async function getClinicSettings() {
    const clinic = await (0, query_1.default)('clinic_settings').where({ id: 'singleton' }).first();
    if (!clinic) {
        throw new error_handler_middleware_1.AppError('NOT_FOUND', 'لم يتم ضبط إعدادات العيادة بعد', 404);
    }
    const pricesRows = await (0, query_1.default)('clinic_prices').orderBy('charge_type', 'asc');
    const prices = pricesRows.map((p) => ({
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
async function updateClinicSettings(input) {
    const clinic = await (0, query_1.default)('clinic_settings').where({ id: 'singleton' }).first();
    if (!clinic) {
        throw new error_handler_middleware_1.AppError('NOT_FOUND', 'لم يتم ضبط إعدادات العيادة بعد', 404);
    }
    await query_1.default.transaction(async (trx) => {
        // تحديث بيانات العيادة إن وجدت
        if (input.clinic) {
            const updateData = {
                updated_at: trx.raw("(datetime('now'))"),
            };
            if (input.clinic.name_ar !== undefined)
                updateData.name_ar = input.clinic.name_ar;
            if (input.clinic.phone !== undefined)
                updateData.phone = input.clinic.phone;
            if (input.clinic.address !== undefined)
                updateData.address = input.clinic.address;
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
                }
                else {
                    await trx('clinic_prices').insert({
                        id: `prc_${crypto_1.default.randomUUID()}`,
                        charge_type: priceItem.charge_type,
                        default_amount: priceItem.default_amount,
                    });
                }
            }
        }
    });
    return { message: 'تم تحديث الإعدادات والأسعار بنجاح' };
}
