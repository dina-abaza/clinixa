"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getChargesByPatient = getChargesByPatient;
exports.createCharge = createCharge;
exports.getPaymentsByPatient = getPaymentsByPatient;
exports.createPayment = createPayment;
exports.getOutstandingPatients = getOutstandingPatients;
exports.getDaySummary = getDaySummary;
exports.closeDay = closeDay;
exports.reopenDay = reopenDay;
const crypto_1 = __importDefault(require("crypto"));
const query_1 = __importDefault(require("../../db/sqlite/query"));
const error_handler_middleware_1 = require("../../middlewares/error-handler.middleware");
const recalcDue_1 = require("../../shared/utils/recalcDue");
/**
 * @description جلب جميع الرسوم الطبية لمريض
 */
async function getChargesByPatient(patientId) {
    return await (0, query_1.default)('charges').where({ patient_id: patientId }).orderBy('created_at', 'desc');
}
/**
 * @description إضافة رسم طبي جديد لمريض مع فحص المديونية السابقة وإرجاع Warning إن وجدت
 */
async function createCharge(input, branchId, employeeId) {
    const priorDue = await (0, recalcDue_1.calculatePatientDue)(query_1.default, input.patient_id);
    const chargeId = `chg_${crypto_1.default.randomUUID()}`;
    await (0, query_1.default)('charges').insert({
        id: chargeId,
        patient_id: input.patient_id,
        branch_id: branchId,
        type: input.type,
        amount: input.amount,
        date: input.date,
        time: input.time,
        created_by: employeeId,
    });
    const newDue = await (0, recalcDue_1.calculatePatientDue)(query_1.default, input.patient_id);
    let warning = null;
    if (priorDue > 0) {
        warning = {
            code: 'PATIENT_HAS_OUTSTANDING',
            message: 'المريض عليه مستحقات سابقة',
            meta: { current_due: newDue },
        };
    }
    return {
        data: {
            id: chargeId,
            patient_id: input.patient_id,
            type: input.type,
            amount: input.amount,
            date: input.date,
            time: input.time,
        },
        warning,
    };
}
/**
 * @description جلب جميع الدفعات المسددة لمريض
 */
async function getPaymentsByPatient(patientId) {
    return await (0, query_1.default)('payments').where({ patient_id: patientId }).orderBy('created_at', 'desc');
}
/**
 * @description تسجيل دفعة مالية جديدة وتحديد ما إذا كانت بعد إقفال اليوم وإعادة بيانات الإيصال
 */
async function createPayment(input, branchId, employeeId) {
    const now = new Date();
    const dateStr = now.toISOString().split('T')[0];
    const timeStr = now.toTimeString().split(' ')[0];
    // فحص ما إذا كان اليوم المالي مغلقاً بالفرع
    const closure = await (0, query_1.default)('day_closures')
        .where({ branch_id: branchId, date: dateStr })
        .whereNull('reopened_at')
        .first();
    const afterDayClose = Boolean(closure);
    const paymentId = `pmt_${crypto_1.default.randomUUID()}`;
    await (0, query_1.default)('payments').insert({
        id: paymentId,
        patient_id: input.patient_id,
        branch_id: branchId,
        amount: input.amount,
        method: input.method,
        date: dateStr,
        time: timeStr,
        recorded_by: employeeId,
        after_day_close: afterDayClose ? 1 : 0,
    });
    const remainingDue = await (0, recalcDue_1.calculatePatientDue)(query_1.default, input.patient_id);
    const patient = await (0, query_1.default)('patients').where({ id: input.patient_id }).first();
    const branch = await (0, query_1.default)('branches').where({ id: branchId }).first();
    const clinic = await (0, query_1.default)('clinic_settings').where({ id: 'singleton' }).first();
    const methodLabelMap = {
        cash: 'كاش',
        card: 'فيزا (ماكينة)',
        wallet: 'محفظة إلكترونية',
        bank_transfer: 'تحويل بنكي',
    };
    const receipt = {
        clinic_name: clinic?.name_ar || 'Clinixa',
        branch_name: branch?.name_ar || '',
        branch_phone: branch?.phone || '',
        patient_name: patient?.name_ar || '',
        amount: input.amount,
        method: methodLabelMap[input.method] || input.method,
        date: dateStr,
        remaining_line_visible: remainingDue > 0,
        remaining_amount: remainingDue > 0 ? remainingDue : 0,
    };
    return {
        payment: {
            id: paymentId,
            patient_id: input.patient_id,
            amount: input.amount,
            method: input.method,
            date: dateStr,
            time: timeStr,
            recorded_by: employeeId,
            after_day_close: afterDayClose,
        },
        remaining_due: remainingDue,
        receipt,
    };
}
/**
 * @description جلب شاشة المستحقات والمديونيات للفرع (Outstanding)
 */
async function getOutstandingPatients(branchId) {
    const patientIds = await (0, query_1.default)('charges')
        .where({ branch_id: branchId })
        .distinct('patient_id')
        .pluck('patient_id');
    const items = [];
    let totalOutstanding = 0;
    for (const pid of patientIds) {
        const due = await (0, recalcDue_1.calculatePatientDue)(query_1.default, pid);
        if (due > 0) {
            const patient = await (0, query_1.default)('patients').where({ id: pid }).first();
            const lastVisit = await (0, query_1.default)('attendance')
                .where({ patient_id: pid, status: 'done' })
                .orderBy('date', 'desc')
                .first();
            items.push({
                patient_id: pid,
                patient_name: patient?.name_ar || '',
                patient_display_id: patient?.display_id || '',
                due,
                last_visit_date: lastVisit?.date || null,
            });
            totalOutstanding += due;
        }
    }
    return {
        items,
        total_outstanding: totalOutstanding,
    };
}
/**
 * @description ملخص حركة الإيرادات والرسوم لليوم
 */
async function getDaySummary(date, branchId) {
    const paymentsResult = await (0, query_1.default)('payments')
        .where({ branch_id: branchId, date })
        .sum('amount as total')
        .first();
    const chargesResult = await (0, query_1.default)('charges')
        .where({ branch_id: branchId, date })
        .sum('amount as total')
        .first();
    const closure = await (0, query_1.default)('day_closures')
        .where({ branch_id: branchId, date })
        .whereNull('reopened_at')
        .first();
    return {
        date,
        branch_id: branchId,
        total_collected: Number(paymentsResult?.total ?? 0),
        total_charges: Number(chargesResult?.total ?? 0),
        is_closed: Boolean(closure),
        closed_at: closure?.closed_at ?? null,
    };
}
/**
 * @description إقفال اليوم المالي بالفرع (Close Day)
 */
async function closeDay(date, branchId, employeeId) {
    const existing = await (0, query_1.default)('day_closures')
        .where({ branch_id: branchId, date })
        .whereNull('reopened_at')
        .first();
    if (existing) {
        throw new error_handler_middleware_1.AppError('CONFLICT', 'اليوم ده مقفول بالفعل', 409);
    }
    const summary = await getDaySummary(date, branchId);
    const now = new Date().toISOString();
    const id = `dc_${crypto_1.default.randomUUID()}`;
    await (0, query_1.default)('day_closures').insert({
        id,
        branch_id: branchId,
        date,
        closed_by: employeeId,
        closed_at: now,
    });
    return {
        date,
        closed_by: employeeId,
        closed_at: now,
        total_collected: summary.total_collected,
        total_charges: summary.total_charges,
    };
}
/**
 * @description إعادة فتح اليوم المالي (Reopen Day)
 */
async function reopenDay(date, branchId, employeeId) {
    const existing = await (0, query_1.default)('day_closures')
        .where({ branch_id: branchId, date })
        .whereNull('reopened_at')
        .first();
    if (!existing) {
        throw new error_handler_middleware_1.AppError('NOT_FOUND', 'اليوم غير مقفول أصلاً', 404);
    }
    const now = new Date().toISOString();
    await (0, query_1.default)('day_closures')
        .where({ id: existing.id })
        .update({
        reopened_by: employeeId,
        reopened_at: now,
    });
    return {
        date,
        reopened_by: employeeId,
        reopened_at: now,
        message: 'تم إعادة فتح اليوم المالي بنجاح',
    };
}
