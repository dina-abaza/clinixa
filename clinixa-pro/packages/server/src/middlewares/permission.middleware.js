"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.requirePermission = requirePermission;
const error_handler_middleware_1 = require("./error-handler.middleware");
/**
 * @description Factory function — بترجع middleware ترفض الطلب لو الموظف مالوش الصلاحية المطلوبة
 * ⚠️ لازم يجي بعد authMiddleware في السلسلة (محتاج req.employee محقون فعلاً)
 * @param {Permission} permission - الصلاحية المطلوبة للوصول للـ endpoint
 */
function requirePermission(permission) {
    return (req, _res, next) => {
        const employee = req.employee;
        if (!employee) {
            throw new error_handler_middleware_1.AppError('UNAUTHORIZED', 'يجب تسجيل الدخول أولاً', 401);
        }
        // المالك متاح له كل الصلاحيات دايمًا
        if (employee.is_owner || employee.permissions.includes(permission)) {
            next();
            return;
        }
        throw new error_handler_middleware_1.AppError('FORBIDDEN', 'ليس لديك صلاحية لتنفيذ هذا الإجراء', 403);
    };
}
