"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getQueue = getQueue;
exports.checkIn = checkIn;
exports.call = call;
exports.setStatus = setStatus;
exports.finish = finish;
exports.readyForCheckout = readyForCheckout;
const error_handler_middleware_1 = require("../../middlewares/error-handler.middleware");
const resolveBranch_1 = require("../../shared/utils/resolveBranch");
const attendance_validation_1 = require("./attendance.validation");
const attendance_service_1 = require("./attendance.service");
/**
 * @description جلب طابور الحضور لليوم (GET /api/attendance)
 */
async function getQueue(req, res, next) {
    try {
        const parsed = attendance_validation_1.queryAttendanceSchema.safeParse(req.query);
        if (!parsed.success) {
            const issue = parsed.error.issues[0];
            throw new error_handler_middleware_1.AppError('VALIDATION_ERROR', issue.message, 400, issue.path.join('.'));
        }
        const branchId = await (0, resolveBranch_1.resolveBranchId)(parsed.data.branch_id || req.employee?.branch_id);
        const items = await (0, attendance_service_1.getAttendanceQueue)(parsed.data.date, branchId);
        res.status(200).json({ ok: true, data: { items }, warning: null });
    }
    catch (err) {
        next(err);
    }
}
/**
 * @description تسجيل دخول مريض للطابور (POST /api/attendance/check-in)
 */
async function checkIn(req, res, next) {
    try {
        const parsed = attendance_validation_1.checkInSchema.safeParse(req.body);
        if (!parsed.success) {
            const issue = parsed.error.issues[0];
            throw new error_handler_middleware_1.AppError('VALIDATION_ERROR', issue.message, 400, issue.path.join('.'));
        }
        const employeeId = req.employee?.id;
        if (!employeeId) {
            throw new error_handler_middleware_1.AppError('UNAUTHORIZED', 'يجب تسجيل الدخول أولاً', 401);
        }
        const branchId = await (0, resolveBranch_1.resolveBranchId)(req.employee?.branch_id);
        const result = await (0, attendance_service_1.checkInPatient)(parsed.data.patient_id, branchId, employeeId);
        res.status(201).json({ ok: true, data: result, warning: null });
    }
    catch (err) {
        next(err);
    }
}
/**
 * @description نداء المريض للكشف (PATCH /api/attendance/:id/call)
 */
async function call(req, res, next) {
    try {
        const attendanceId = req.params.id;
        const branchId = await (0, resolveBranch_1.resolveBranchId)(req.employee?.branch_id);
        const result = await (0, attendance_service_1.callPatient)(attendanceId, branchId);
        res.status(200).json({ ok: true, data: result, warning: null });
    }
    catch (err) {
        next(err);
    }
}
/**
 * @description تغيير حالة الحضور إلى noshow أو left (PATCH /api/attendance/:id/status)
 */
async function setStatus(req, res, next) {
    try {
        const attendanceId = req.params.id;
        const parsed = attendance_validation_1.updateStatusSchema.safeParse(req.body);
        if (!parsed.success) {
            const issue = parsed.error.issues[0];
            throw new error_handler_middleware_1.AppError('VALIDATION_ERROR', issue.message, 400, issue.path.join('.'));
        }
        const result = await (0, attendance_service_1.updateStatus)(attendanceId, parsed.data.status);
        res.status(200).json({ ok: true, data: result, warning: null });
    }
    catch (err) {
        next(err);
    }
}
/**
 * @description الفعل المركّب عند إنهاء الكشف (POST /api/attendance/:id/finish)
 */
async function finish(req, res, next) {
    try {
        const attendanceId = req.params.id;
        const parsed = attendance_validation_1.finishAttendanceSchema.safeParse(req.body);
        if (!parsed.success) {
            const issue = parsed.error.issues[0];
            throw new error_handler_middleware_1.AppError('VALIDATION_ERROR', issue.message, 400, issue.path.join('.'));
        }
        const permissions = req.employee?.permissions || [];
        const employeeId = req.employee?.id || '';
        const result = await (0, attendance_service_1.finishAttendance)(attendanceId, permissions, employeeId, parsed.data);
        res.status(200).json({ ok: true, data: result, warning: null });
    }
    catch (err) {
        next(err);
    }
}
/**
 * @description جلب قائمة جاهزي التحصيل (GET /api/attendance/ready-for-checkout)
 */
async function readyForCheckout(req, res, next) {
    try {
        const branchId = await (0, resolveBranch_1.resolveBranchId)(req.employee?.branch_id);
        const items = await (0, attendance_service_1.getReadyForCheckout)(branchId);
        res.status(200).json({ ok: true, data: { items }, warning: null });
    }
    catch (err) {
        next(err);
    }
}
