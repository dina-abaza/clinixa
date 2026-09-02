"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getAttendanceQueue = getAttendanceQueue;
exports.checkInPatient = checkInPatient;
exports.callPatient = callPatient;
exports.updateStatus = updateStatus;
exports.finishAttendance = finishAttendance;
exports.getReadyForCheckout = getReadyForCheckout;
const crypto_1 = __importDefault(require("crypto"));
const query_1 = __importDefault(require("../../db/sqlite/query"));
const error_handler_middleware_1 = require("../../middlewares/error-handler.middleware");
const recalcDue_1 = require("../../shared/utils/recalcDue");
const attendance_repository_1 = require("./attendance.repository");
/**
 * @description جلب طابور الحضور لفرع وتاريخ محددين
 */
async function getAttendanceQueue(date, branchId) {
    const rows = await (0, attendance_repository_1.findAttendanceByDateAndBranch)(date, branchId);
    return rows.map((r) => ({
        id: r.id,
        patient_id: r.patient_id,
        patient_name: r.patient_name,
        patient_display_id: r.patient_display_id,
        date: r.date,
        time: r.time,
        status: r.status,
        items: JSON.parse(r.items || '[]'),
    }));
}
/**
 * @description تسجيل دخول مريض للطابور (Check-in)
 */
async function checkInPatient(patientId, branchId, employeeId) {
    const patient = await (0, query_1.default)('patients').where({ id: patientId }).first();
    if (!patient || !patient.is_active) {
        throw new error_handler_middleware_1.AppError('VALIDATION_ERROR', 'المريض ده معطّل، لازم تفعّله الأول', 400, 'patient_id');
    }
    const now = new Date();
    const dateStr = now.toISOString().split('T')[0];
    const timeStr = now.toTimeString().split(' ')[0];
    const id = `att_${crypto_1.default.randomUUID()}`;
    await (0, attendance_repository_1.insertAttendance)({
        id,
        patient_id: patientId,
        branch_id: branchId,
        date: dateStr,
        time: timeStr,
        status: 'waiting',
        created_by: employeeId,
    });
    return {
        id,
        patient_id: patientId,
        status: 'waiting',
        date: dateStr,
        time: timeStr,
    };
}
/**
 * @description نداء المريض للدخول للكشف (Call) — يحوّل الحالة لـ in_progress ويقفل أي كشف نشط آخر بالفرع
 */
async function callPatient(attendanceId, branchId) {
    const attendance = await (0, attendance_repository_1.findAttendanceById)(attendanceId);
    if (!attendance) {
        throw new error_handler_middleware_1.AppError('NOT_FOUND', 'سجل الحضور غير موجود', 404);
    }
    const today = new Date().toISOString().split('T')[0];
    await query_1.default.transaction(async (trx) => {
        // إقفال أي كشف نشط آخر بنفس الفرع لليوم
        const activeOthers = await trx('attendance')
            .where({ branch_id: branchId, date: today, status: 'in_progress' })
            .whereNot({ id: attendanceId });
        for (const other of activeOthers) {
            await (0, attendance_repository_1.updateAttendanceStatus)(other.id, 'done', trx);
        }
        await (0, attendance_repository_1.updateAttendanceStatus)(attendanceId, 'in_progress', trx);
    });
    return { id: attendanceId, status: 'in_progress' };
}
/**
 * @description تغيير حالة الحضور إلى لم يحضر (noshow) أو غادر (left)
 */
async function updateStatus(attendanceId, status) {
    const attendance = await (0, attendance_repository_1.findAttendanceById)(attendanceId);
    if (!attendance) {
        throw new error_handler_middleware_1.AppError('NOT_FOUND', 'سجل الحضور غير موجود', 404);
    }
    await (0, attendance_repository_1.updateAttendanceStatus)(attendanceId, status);
    return { id: attendanceId, status };
}
/**
 * @description الفعل المركّب عند إنهاء الكشف (Finish Attendance)
 * ينشئ بنود الرسوم والمتابعة ويحسب المستحق النهائي بـ Transaction واحدة
 */
async function finishAttendance(attendanceId, employeePermissions, employeeId, input) {
    const attendance = await (0, attendance_repository_1.findAttendanceById)(attendanceId);
    if (!attendance) {
        throw new error_handler_middleware_1.AppError('NOT_FOUND', 'سجل الحضور غير موجود', 404);
    }
    const hasPayAddPermission = employeePermissions.includes('pay.add');
    if (input.items && input.items.length > 0 && !hasPayAddPermission) {
        throw new error_handler_middleware_1.AppError('FORBIDDEN', 'مفيش صلاحية لإضافة بنود رسوم', 403);
    }
    const now = new Date();
    const dateStr = now.toISOString().split('T')[0];
    const timeStr = now.toTimeString().split(' ')[0];
    const chargesCreated = [];
    let followUpCreated = null;
    await query_1.default.transaction(async (trx) => {
        await (0, attendance_repository_1.updateAttendanceStatus)(attendanceId, 'done', trx);
        if (input.items && input.items.length > 0) {
            for (const item of input.items) {
                const chargeId = `chg_${crypto_1.default.randomUUID()}`;
                await trx('charges').insert({
                    id: chargeId,
                    patient_id: attendance.patient_id,
                    branch_id: attendance.branch_id,
                    type: item.charge_type,
                    amount: item.amount,
                    date: dateStr,
                    time: timeStr,
                    attendance_id: attendance.id,
                    created_by: employeeId,
                });
                chargesCreated.push({
                    id: chargeId,
                    type: item.charge_type,
                    amount: item.amount,
                    date: dateStr,
                    time: timeStr,
                });
            }
        }
        if (input.follow_up) {
            const dueDate = new Date();
            dueDate.setDate(dueDate.getDate() + input.follow_up.days);
            const dueDateStr = dueDate.toISOString().split('T')[0];
            const followUpId = `fu_${crypto_1.default.randomUUID()}`;
            await trx('patient_follow_ups').insert({
                id: followUpId,
                patient_id: attendance.patient_id,
                branch_id: attendance.branch_id,
                due_date: dueDateStr,
                reason: input.follow_up.reason ?? null,
                fee: input.follow_up.fee ?? null,
                status: 'scheduled',
            });
            followUpCreated = {
                id: followUpId,
                due_date: dueDateStr,
                fee: input.follow_up.fee ?? 0,
                status: 'scheduled',
            };
        }
    });
    const finalDue = await (0, recalcDue_1.calculatePatientDue)(query_1.default, attendance.patient_id);
    const canCollect = finalDue > 0 && hasPayAddPermission;
    return {
        attendance: { id: attendance.id, status: 'done' },
        charges_created: chargesCreated,
        follow_up_created: followUpCreated,
        final_due: finalDue,
        can_collect: canCollect,
    };
}
/**
 * @description جلب قائمة المرضى جاهزي التحصيل (Ready for Checkout)
 */
async function getReadyForCheckout(branchId) {
    const today = new Date().toISOString().split('T')[0];
    const rows = await (0, query_1.default)('attendance')
        .join('patients', 'attendance.patient_id', 'patients.id')
        .where('attendance.branch_id', branchId)
        .where('attendance.date', today)
        .where('attendance.status', 'done')
        .select('attendance.id as attendance_id', 'patients.id as patient_id', 'patients.name_ar as patient_name', 'patients.display_id as patient_display_id');
    const readyList = await Promise.all(rows.map(async (r) => {
        const due = await (0, recalcDue_1.calculatePatientDue)(query_1.default, r.patient_id);
        return {
            ...r,
            due,
        };
    }));
    return readyList.filter((item) => item.due > 0);
}
