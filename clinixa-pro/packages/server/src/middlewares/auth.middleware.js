"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.authMiddleware = authMiddleware;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const env_1 = require("../config/env");
const error_handler_middleware_1 = require("./error-handler.middleware");
/**
 * @description يفك تشفير الـ JWT من الـ Authorization header ويحقن بيانات الموظف في req
 * أي endpoint محمي لازم يمرّ من هنا أولاً
 */
function authMiddleware(req, _res, next) {
    const header = req.headers.authorization;
    if (!header || !header.startsWith('Bearer ')) {
        throw new error_handler_middleware_1.AppError('UNAUTHORIZED', 'يجب تسجيل الدخول أولاً', 401);
    }
    const token = header.slice('Bearer '.length);
    try {
        const payload = jsonwebtoken_1.default.verify(token, env_1.env.JWT_SECRET);
        req.employee = {
            id: payload.employee_id,
            branch_id: payload.branch_id,
            is_owner: payload.is_owner,
            permissions: payload.permissions,
        };
        next();
    }
    catch {
        throw new error_handler_middleware_1.AppError('UNAUTHORIZED', 'الجلسة غير صالحة أو منتهية', 401);
    }
}
