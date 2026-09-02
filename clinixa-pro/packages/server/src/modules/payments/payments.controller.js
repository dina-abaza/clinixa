"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.listCharges = listCharges;
exports.addCharge = addCharge;
exports.listPayments = listPayments;
exports.addPayment = addPayment;
exports.listOutstanding = listOutstanding;
exports.getDaySummaryInfo = getDaySummaryInfo;
exports.closeDayInfo = closeDayInfo;
exports.reopenDayInfo = reopenDayInfo;
const error_handler_middleware_1 = require("../../middlewares/error-handler.middleware");
const resolveBranch_1 = require("../../shared/utils/resolveBranch");
const payments_validation_1 = require("./payments.validation");
const payments_service_1 = require("./payments.service");
/**
 * @description جلب الرسوم لمريض (GET /api/charges?patient_id=xxx)
 */
async function listCharges(req, res, next) {
    try {
        const patientId = req.query.patient_id;
        if (!patientId) {
            throw new error_handler_middleware_1.AppError('VALIDATION_ERROR', 'معرّف المريض مطلوب', 400, 'patient_id');
        }
        const items = await (0, payments_service_1.getChargesByPatient)(patientId);
        res.status(200).json({ ok: true, data: { items }, warning: null });
    }
    catch (err) {
        next(err);
    }
}
/**
 * @description إضافة رسم طبي (POST /api/charges)
 */
async function addCharge(req, res, next) {
    try {
        const parsed = payments_validation_1.createChargeSchema.safeParse(req.body);
        if (!parsed.success) {
            const issue = parsed.error.issues[0];
            throw new error_handler_middleware_1.AppError('VALIDATION_ERROR', issue.message, 400, issue.path.join('.'));
        }
        const branchId = await (0, resolveBranch_1.resolveBranchId)(req.employee?.branch_id);
        const employeeId = req.employee?.id || '';
        const { data, warning } = await (0, payments_service_1.createCharge)(parsed.data, branchId, employeeId);
        res.status(201).json({ ok: true, data, warning });
    }
    catch (err) {
        next(err);
    }
}
/**
 * @description جلب المدفوعات لمريض (GET /api/payments?patient_id=xxx)
 */
async function listPayments(req, res, next) {
    try {
        const patientId = req.query.patient_id;
        if (!patientId) {
            throw new error_handler_middleware_1.AppError('VALIDATION_ERROR', 'معرّف المريض مطلوب', 400, 'patient_id');
        }
        const items = await (0, payments_service_1.getPaymentsByPatient)(patientId);
        res.status(200).json({ ok: true, data: { items }, warning: null });
    }
    catch (err) {
        next(err);
    }
}
/**
 * @description تسجيل دفعة مالية (POST /api/payments)
 */
async function addPayment(req, res, next) {
    try {
        const parsed = payments_validation_1.createPaymentSchema.safeParse(req.body);
        if (!parsed.success) {
            const issue = parsed.error.issues[0];
            throw new error_handler_middleware_1.AppError('VALIDATION_ERROR', issue.message, 400, issue.path.join('.'));
        }
        const branchId = await (0, resolveBranch_1.resolveBranchId)(req.employee?.branch_id);
        const employeeId = req.employee?.id || '';
        const result = await (0, payments_service_1.createPayment)(parsed.data, branchId, employeeId);
        res.status(201).json({ ok: true, data: result, warning: null });
    }
    catch (err) {
        next(err);
    }
}
/**
 * @description جلب قائمة المديونيات والمستحقات (GET /api/payments/outstanding)
 */
async function listOutstanding(req, res, next) {
    try {
        const branchId = await (0, resolveBranch_1.resolveBranchId)(req.query.branch_id || req.employee?.branch_id);
        const result = await (0, payments_service_1.getOutstandingPatients)(branchId);
        res.status(200).json({ ok: true, data: result, warning: null });
    }
    catch (err) {
        next(err);
    }
}
/**
 * @description جلب ملخص إيرادات اليوم (GET /api/day-summary)
 */
async function getDaySummaryInfo(req, res, next) {
    try {
        const parsed = payments_validation_1.daySummaryQuerySchema.safeParse(req.query);
        if (!parsed.success) {
            const issue = parsed.error.issues[0];
            throw new error_handler_middleware_1.AppError('VALIDATION_ERROR', issue.message, 400, issue.path.join('.'));
        }
        const branchId = await (0, resolveBranch_1.resolveBranchId)(parsed.data.branch_id || req.employee?.branch_id);
        const result = await (0, payments_service_1.getDaySummary)(parsed.data.date, branchId);
        res.status(200).json({ ok: true, data: result, warning: null });
    }
    catch (err) {
        next(err);
    }
}
/**
 * @description إقفال اليوم المالي (POST /api/day-summary/close)
 */
async function closeDayInfo(req, res, next) {
    try {
        const date = req.body.date || new Date().toISOString().split('T')[0];
        const branchId = await (0, resolveBranch_1.resolveBranchId)(req.employee?.branch_id);
        const employeeId = req.employee?.id || '';
        const result = await (0, payments_service_1.closeDay)(date, branchId, employeeId);
        res.status(200).json({ ok: true, data: result, warning: null });
    }
    catch (err) {
        next(err);
    }
}
/**
 * @description إعادة فتح اليوم المالي (POST /api/day-summary/reopen)
 */
async function reopenDayInfo(req, res, next) {
    try {
        const date = req.body.date || new Date().toISOString().split('T')[0];
        const branchId = await (0, resolveBranch_1.resolveBranchId)(req.employee?.branch_id);
        const employeeId = req.employee?.id || '';
        const result = await (0, payments_service_1.reopenDay)(date, branchId, employeeId);
        res.status(200).json({ ok: true, data: result, warning: null });
    }
    catch (err) {
        next(err);
    }
}
