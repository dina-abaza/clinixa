"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppError = void 0;
exports.errorHandler = errorHandler;
/**
 * @description كائن الخطأ المخصص للتطبيق
 */
class AppError extends Error {
    code;
    statusCode;
    field;
    constructor(code, message, statusCode = 400, field) {
        super(message);
        this.code = code;
        this.statusCode = statusCode;
        this.field = field;
        Object.setPrototypeOf(this, new.target.prototype);
    }
}
exports.AppError = AppError;
/**
 * @description Middleware معالجة الأخطاء المركزية للسيرفر
 * يحول أي خطأ مرفوع إلى الشكل الموحد الموثق في API Contract
 */
function errorHandler(err, _req, res, _next) {
    if (err instanceof AppError) {
        res.status(err.statusCode).json({
            ok: false,
            error: {
                code: err.code,
                message: err.message,
                ...(err.field ? { field: err.field } : {}),
            },
        });
        return;
    }
    console.error('❌ Unhandled Server Error:', err);
    res.status(500).json({
        ok: false,
        error: {
            code: 'SERVER_ERROR',
            message: 'حدث خطأ غير متوقع في السيرفر',
        },
    });
}
