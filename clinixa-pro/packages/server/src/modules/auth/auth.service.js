"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.loginUser = loginUser;
exports.getUserSession = getUserSession;
exports.resetPassword = resetPassword;
exports.getSecurityQuestion = getSecurityQuestion;
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const query_1 = __importDefault(require("../../db/sqlite/query"));
const env_1 = require("../../config/env");
const error_handler_middleware_1 = require("../../middlewares/error-handler.middleware");
const shared_1 = require("@clinixa/shared");
/**
 * @description تسجيل دخول الموظف، فحص كلمة السر المشفّرة، وجلب الصلاحيات والفرع وتوليد الـ JWT Token
 * @param {LoginInput} input - بيانات الدخول (اسم المستخدم وكلمة السر)
 * @returns {Promise<LoginResult>} بيانات التوكن والموظف والفرع النشط
 * @throws {AppError} 401 UNAUTHORIZED في حال خطأ بيانات الدخول أو تعطيل الحساب
 */
async function loginUser(input) {
    const employee = await (0, query_1.default)('employees').where({ username: input.username }).first();
    if (!employee || !employee.is_active) {
        throw new error_handler_middleware_1.AppError('UNAUTHORIZED', 'اسم المستخدم أو كلمة السر غلط', 401);
    }
    const isPasswordValid = await bcryptjs_1.default.compare(input.password, employee.password_hash);
    if (!isPasswordValid) {
        throw new error_handler_middleware_1.AppError('UNAUTHORIZED', 'اسم المستخدم أو كلمة السر غلط', 401);
    }
    const isOwner = Boolean(employee.is_owner);
    let permissions = [];
    if (isOwner) {
        permissions = [...shared_1.PERMISSIONS];
    }
    else {
        const permRows = await (0, query_1.default)('employee_permissions')
            .where({ employee_id: employee.id })
            .select('permission_key');
        permissions = permRows.map((r) => r.permission_key);
    }
    let activeBranch;
    if (employee.branch_id) {
        activeBranch = await (0, query_1.default)('branches')
            .where({ id: employee.branch_id, is_active: 1 })
            .select('id', 'name_ar')
            .first();
    }
    if (!activeBranch) {
        activeBranch = await (0, query_1.default)('branches')
            .where({ is_host: 1, is_active: 1 })
            .select('id', 'name_ar')
            .first();
    }
    if (!activeBranch) {
        activeBranch = await (0, query_1.default)('branches')
            .where({ is_active: 1 })
            .select('id', 'name_ar')
            .first();
    }
    if (!activeBranch) {
        throw new error_handler_middleware_1.AppError('NOT_FOUND', 'لم يتم العثور على أي فرع نشط في النظام', 404);
    }
    const token = jsonwebtoken_1.default.sign({
        employee_id: employee.id,
        branch_id: employee.branch_id ?? activeBranch.id,
        is_owner: isOwner,
        permissions,
    }, env_1.env.JWT_SECRET, { expiresIn: env_1.env.JWT_EXPIRES_IN });
    return {
        token,
        employee: {
            id: employee.id,
            name_ar: employee.name_ar,
            username: employee.username,
            role: employee.role,
            is_owner: isOwner,
            branch_id: employee.branch_id ?? null,
            permissions,
        },
        active_branch: {
            id: activeBranch.id,
            name_ar: activeBranch.name_ar,
        },
    };
}
/**
 * @description جلب تفاصيل الجلسة الحالية للموظف المسجّل
 * @param {string} employeeId - معرّف الموظف المستخرج من التوكن
 * @returns {Promise<SessionResult>} بيانات الموظف والصلاحيات والفرع النشط
 * @throws {AppError} 401 UNAUTHORIZED لو الموظف غير موجود أو معطّل
 */
async function getUserSession(employeeId) {
    const employee = await (0, query_1.default)('employees').where({ id: employeeId }).first();
    if (!employee || !employee.is_active) {
        throw new error_handler_middleware_1.AppError('UNAUTHORIZED', 'الجلسة غير صالحة أو الموظف غير نشط', 401);
    }
    const isOwner = Boolean(employee.is_owner);
    let permissions = [];
    if (isOwner) {
        permissions = [...shared_1.PERMISSIONS];
    }
    else {
        const permRows = await (0, query_1.default)('employee_permissions')
            .where({ employee_id: employee.id })
            .select('permission_key');
        permissions = permRows.map((r) => r.permission_key);
    }
    let activeBranch;
    if (employee.branch_id) {
        activeBranch = await (0, query_1.default)('branches')
            .where({ id: employee.branch_id, is_active: 1 })
            .select('id', 'name_ar')
            .first();
    }
    if (!activeBranch) {
        activeBranch = await (0, query_1.default)('branches')
            .where({ is_host: 1, is_active: 1 })
            .select('id', 'name_ar')
            .first();
    }
    if (!activeBranch) {
        throw new error_handler_middleware_1.AppError('NOT_FOUND', 'لم يتم العثور على الفرع الرئيسي', 404);
    }
    return {
        employee: {
            id: employee.id,
            name_ar: employee.name_ar,
            username: employee.username,
            role: employee.role,
            is_owner: isOwner,
            branch_id: employee.branch_id ?? null,
            permissions,
        },
        active_branch: {
            id: activeBranch.id,
            name_ar: activeBranch.name_ar,
        },
    };
}
/**
 * @description استعادة كلمة السر عبر إجابة سؤال الأمان وتعيين كلمة سر جديدة
 * @param {ForgotPasswordInput} input - اسم المستخدم، إجابة سؤال الأمان، وكلمة السر الجديدة
 * @returns {Promise<{ message: string }>} رسالة نجاح عملية التغيير
 * @throws {AppError} 400 VALIDATION_ERROR عند الخطأ في إجابة سؤال الأمان
 */
async function resetPassword(input) {
    const employee = await (0, query_1.default)('employees').where({ username: input.username }).first();
    if (!employee) {
        throw new error_handler_middleware_1.AppError('VALIDATION_ERROR', 'إجابة سؤال الأمان غلط', 400, 'security_answer');
    }
    let answerHash = employee.security_answer_hash;
    if (!answerHash && employee.is_owner) {
        const clinicSettings = await (0, query_1.default)('clinic_settings').where({ id: 'singleton' }).first();
        if (clinicSettings) {
            answerHash = clinicSettings.security_answer_hash;
        }
    }
    if (!answerHash) {
        throw new error_handler_middleware_1.AppError('VALIDATION_ERROR', 'إجابة سؤال الأمان غلط', 400, 'security_answer');
    }
    const isAnswerValid = await bcryptjs_1.default.compare(input.security_answer, answerHash);
    if (!isAnswerValid) {
        throw new error_handler_middleware_1.AppError('VALIDATION_ERROR', 'إجابة سؤال الأمان غلط', 400, 'security_answer');
    }
    const newPasswordHash = await bcryptjs_1.default.hash(input.new_password, env_1.env.BCRYPT_SALT_ROUNDS);
    await (0, query_1.default)('employees')
        .where({ id: employee.id })
        .update({ password_hash: newPasswordHash, updated_at: new Date().toISOString() });
    return { message: 'تم تغيير كلمة السر بنجاح' };
}
/**
 * @description جلب نص سؤال الأمان المسجل للموظف تمهيدًا لاستعادة كلمة السر
 * @param {string} username - اسم المستخدم المطلوب الاستعلام عن سؤال الأمان له
 * @returns {Promise<{ question: string }>} نص سؤال الأمان
 * @throws {AppError} 404 NOT_FOUND في حال عدم وجود المستخدم أو عدم وجود سؤال أمان
 */
async function getSecurityQuestion(username) {
    const employee = await (0, query_1.default)('employees').where({ username }).first();
    if (!employee) {
        throw new error_handler_middleware_1.AppError('NOT_FOUND', 'المستخدم غير موجود', 404);
    }
    let question = employee.security_question;
    if (!question && employee.is_owner) {
        const clinicSettings = await (0, query_1.default)('clinic_settings').where({ id: 'singleton' }).first();
        if (clinicSettings) {
            question = clinicSettings.security_question;
        }
    }
    if (!question) {
        throw new error_handler_middleware_1.AppError('NOT_FOUND', 'لم يتم تسجيل سؤال أمان لهذا الحساب', 404);
    }
    return { question };
}
