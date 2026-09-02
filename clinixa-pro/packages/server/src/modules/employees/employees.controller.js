"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.listEmployees = listEmployees;
exports.createNewEmployee = createNewEmployee;
exports.updatePermissions = updatePermissions;
exports.resetPassword = resetPassword;
exports.toggleActive = toggleActive;
const error_handler_middleware_1 = require("../../middlewares/error-handler.middleware");
const employees_validation_1 = require("./employees.validation");
const employees_service_1 = require("./employees.service");
/**
 * @description معالجة طلب جلب قائمة الموظفين (GET /api/employees)
 */
async function listEmployees(req, res, next) {
    try {
        const parsed = employees_validation_1.queryEmployeesSchema.safeParse(req.query);
        if (!parsed.success) {
            const issue = parsed.error.issues[0];
            throw new error_handler_middleware_1.AppError('VALIDATION_ERROR', issue.message, 400, issue.path.join('.'));
        }
        const branchId = parsed.data.branch_id || (req.employee?.is_owner ? undefined : req.employee?.branch_id);
        const result = await (0, employees_service_1.getEmployees)(branchId);
        res.status(200).json({ ok: true, data: result, warning: null });
    }
    catch (err) {
        next(err);
    }
}
/**
 * @description معالجة طلب إنشاء موظف جديد (POST /api/employees)
 */
async function createNewEmployee(req, res, next) {
    try {
        const parsed = employees_validation_1.createEmployeeSchema.safeParse(req.body);
        if (!parsed.success) {
            const issue = parsed.error.issues[0];
            throw new error_handler_middleware_1.AppError('VALIDATION_ERROR', issue.message, 400, issue.path.join('.'));
        }
        const result = await (0, employees_service_1.createEmployee)(parsed.data);
        res.status(201).json({ ok: true, data: result, warning: null });
    }
    catch (err) {
        next(err);
    }
}
/**
 * @description معالجة طلب تعديل صلاحيات موظف (PUT /api/employees/:id/permissions)
 */
async function updatePermissions(req, res, next) {
    try {
        const parsed = employees_validation_1.updatePermissionsSchema.safeParse(req.body);
        if (!parsed.success) {
            const issue = parsed.error.issues[0];
            throw new error_handler_middleware_1.AppError('VALIDATION_ERROR', issue.message, 400, issue.path.join('.'));
        }
        const employeeId = req.params.id;
        const result = await (0, employees_service_1.updateEmployeePermissions)(employeeId, parsed.data);
        res.status(200).json({ ok: true, data: result, warning: null });
    }
    catch (err) {
        next(err);
    }
}
/**
 * @description معالجة طلب إعادة تعيين كلمة سر الموظف (PATCH /api/employees/:id/reset-password)
 */
async function resetPassword(req, res, next) {
    try {
        const employeeId = req.params.id;
        const result = await (0, employees_service_1.resetEmployeePassword)(employeeId);
        res.status(200).json({ ok: true, data: result, warning: null });
    }
    catch (err) {
        next(err);
    }
}
/**
 * @description معالجة طلب تبديل حالة تفعيل الموظف (PATCH /api/employees/:id/toggle-active)
 */
async function toggleActive(req, res, next) {
    try {
        const parsed = employees_validation_1.toggleActiveEmployeeSchema.safeParse(req.body);
        if (!parsed.success) {
            const issue = parsed.error.issues[0];
            throw new error_handler_middleware_1.AppError('VALIDATION_ERROR', issue.message, 400, issue.path.join('.'));
        }
        const employeeId = req.params.id;
        const result = await (0, employees_service_1.toggleEmployeeActive)(employeeId, parsed.data);
        res.status(200).json({ ok: true, data: result, warning: null });
    }
    catch (err) {
        next(err);
    }
}
