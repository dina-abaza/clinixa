"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.login = login;
exports.logout = logout;
exports.getSession = getSession;
exports.forgotPassword = forgotPassword;
exports.getSecurityQuestionHandler = getSecurityQuestionHandler;
const auth_validation_1 = require("./auth.validation");
const auth_service_1 = require("./auth.service");
const error_handler_middleware_1 = require("../../middlewares/error-handler.middleware");
/**
 * @description معالجة طلب تسجيل الدخول (POST /api/auth/login)
 * @param {Request} req - طلب الـ HTTP المتضمن اسم المستخدم وكلمة السر
 * @param {Response} res - استجابة الـ HTTP
 * @param {NextFunction} next - دالة تمرير الأخطاء للميدلوير الرئيسي
 */
async function login(req, res, next) {
    try {
        const parsed = auth_validation_1.loginSchema.safeParse(req.body);
        if (!parsed.success) {
            const issue = parsed.error.issues[0];
            throw new error_handler_middleware_1.AppError('VALIDATION_ERROR', issue.message, 400, issue.path.join('.'));
        }
        const result = await (0, auth_service_1.loginUser)(parsed.data);
        res.status(200).json({ ok: true, data: result, warning: null });
    }
    catch (err) {
        next(err);
    }
}
/**
 * @description معالجة طلب تسجيل الخروج (POST /api/auth/logout)
 * @param {Request} _req - طلب الـ HTTP
 * @param {Response} res - استجابة الـ HTTP
 */
async function logout(_req, res) {
    res.status(200).json({
        ok: true,
        data: { message: 'تم تسجيل الخروج بنجاح' },
        warning: null,
    });
}
/**
 * @description معالجة طلب جلب تفاصيل الجلسة الحالية (GET /api/auth/session)
 * @param {Request} req - طلب الـ HTTP المحتوي على req.employee الموثّق
 * @param {Response} res - استجابة الـ HTTP
 * @param {NextFunction} next - دالة تمرير الأخطاء
 */
async function getSession(req, res, next) {
    try {
        const employeeId = req.employee?.id;
        if (!employeeId) {
            throw new error_handler_middleware_1.AppError('UNAUTHORIZED', 'يجب تسجيل الدخول أولاً', 401);
        }
        const result = await (0, auth_service_1.getUserSession)(employeeId);
        res.status(200).json({ ok: true, data: result, warning: null });
    }
    catch (err) {
        next(err);
    }
}
/**
 * @description معالجة طلب نسيت كلمة السر واستعادتها (POST /api/auth/forgot-password)
 * @param {Request} req - طلب الـ HTTP المتضمن اسم المستخدم وإجابة سؤال الأمان وكلمة السر الجديدة
 * @param {Response} res - استجابة الـ HTTP
 * @param {NextFunction} next - دالة تمرير الأخطاء
 */
async function forgotPassword(req, res, next) {
    try {
        const parsed = auth_validation_1.forgotPasswordSchema.safeParse(req.body);
        if (!parsed.success) {
            const issue = parsed.error.issues[0];
            throw new error_handler_middleware_1.AppError('VALIDATION_ERROR', issue.message, 400, issue.path.join('.'));
        }
        const result = await (0, auth_service_1.resetPassword)(parsed.data);
        res.status(200).json({ ok: true, data: result, warning: null });
    }
    catch (err) {
        next(err);
    }
}
/**
 * @description معالجة طلب جلب سؤال الأمان للمستخدم (GET /api/auth/security-question?username=xxx)
 * @param {Request} req - طلب الـ HTTP المتضمن اسم المستخدم في الـ query params
 * @param {Response} res - استجابة الـ HTTP
 * @param {NextFunction} next - دالة تمرير الأخطاء
 */
async function getSecurityQuestionHandler(req, res, next) {
    try {
        const parsed = auth_validation_1.getSecurityQuestionSchema.safeParse(req.query);
        if (!parsed.success) {
            const issue = parsed.error.issues[0];
            throw new error_handler_middleware_1.AppError('VALIDATION_ERROR', issue.message, 400, issue.path.join('.'));
        }
        const result = await (0, auth_service_1.getSecurityQuestion)(parsed.data.username);
        res.status(200).json({ ok: true, data: result, warning: null });
    }
    catch (err) {
        next(err);
    }
}
