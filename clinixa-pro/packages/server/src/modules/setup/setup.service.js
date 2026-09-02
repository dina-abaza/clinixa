"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.firstRunSetup = firstRunSetup;
const crypto_1 = __importDefault(require("crypto"));
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const query_1 = __importDefault(require("../../db/sqlite/query"));
const env_1 = require("../../config/env");
const error_handler_middleware_1 = require("../../middlewares/error-handler.middleware");
const shared_1 = require("@clinixa/shared");
/**
 * @description ينفّذ إعداد أول مرة (first-run) — clinic_settings + الفرع الرئيسي + حساب الطبيب المالك
 *              كل الإدراجات في transaction واحدة — لو أي جزء فشل، كله بيترجع (rollback)
 * ⚠️ ملحوظة: التحقق من إن license_key "مستخدم من قبل على جهاز تاني" (409) بيتطلب تحقق أونلاين
 *    ده قرار مفتوح لسه (روضماب - يوم ٢٤) — دلوقتي بنكتفي بفحص محلي: هل الجهاز ده اتعمله setup قبل كده
 */
async function firstRunSetup(input) {
    const existingSettings = await (0, query_1.default)('clinic_settings').where({ id: 'singleton' }).first();
    if (existingSettings) {
        throw new error_handler_middleware_1.AppError('CONFLICT', 'التطبيق ده متظبّط بالفعل على جهاز تاني بنفس المفتاح ده', 409);
    }
    const branchId = `br_${crypto_1.default.randomUUID()}`;
    const employeeId = `emp_${crypto_1.default.randomUUID()}`;
    const passwordHash = await bcryptjs_1.default.hash(input.doctor_account.password, env_1.env.BCRYPT_SALT_ROUNDS);
    const securityAnswerHash = await bcryptjs_1.default.hash(input.security.answer, env_1.env.BCRYPT_SALT_ROUNDS);
    await query_1.default.transaction(async (trx) => {
        await trx('clinic_settings').insert({
            id: 'singleton',
            name_ar: input.clinic.name_ar,
            specialty: input.clinic.specialty,
            phone: input.clinic.phone,
            address: input.clinic.address ?? null,
            license_key: input.license_key,
            security_question: input.security.question,
            security_answer_hash: securityAnswerHash,
            sync_mode: 'none',
        });
        await trx('branches').insert({
            id: branchId,
            name_ar: 'الفرع الرئيسي',
            address_ar: input.clinic.address ?? null,
            phone: input.clinic.phone,
            opens_at: '09:00',
            closes_at: '21:00',
            is_host: 1,
            is_active: 1,
        });
        await trx('employees').insert({
            id: employeeId,
            name_ar: input.doctor_account.name_ar,
            username: input.doctor_account.username,
            password_hash: passwordHash,
            role: 'doctor',
            branch_id: null, // المالك متاح لكل الفروع، مش مربوط بفرع واحد
            is_owner: 1,
            is_active: 1,
            security_question: input.security.question,
            security_answer_hash: securityAnswerHash,
        });
        const permissionRows = shared_1.PERMISSIONS.map((permission_key) => ({
            id: `eperm_${crypto_1.default.randomUUID()}`,
            employee_id: employeeId,
            permission_key,
        }));
        await trx('employee_permissions').insert(permissionRows);
    });
    const token = jsonwebtoken_1.default.sign({
        employee_id: employeeId,
        branch_id: null,
        is_owner: true,
        permissions: shared_1.PERMISSIONS,
    }, env_1.env.JWT_SECRET, { expiresIn: env_1.env.JWT_EXPIRES_IN });
    return {
        clinic: {
            name_ar: input.clinic.name_ar,
            specialty: input.clinic.specialty,
            sync_mode: 'none',
        },
        main_branch: {
            id: branchId,
            name_ar: 'الفرع الرئيسي',
            is_host: true,
        },
        employee: {
            id: employeeId,
            name_ar: input.doctor_account.name_ar,
            username: input.doctor_account.username,
            is_owner: true,
        },
        token,
    };
}
