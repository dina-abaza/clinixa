"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.findAttendanceByDateAndBranch = findAttendanceByDateAndBranch;
exports.findAttendanceById = findAttendanceById;
exports.insertAttendance = insertAttendance;
exports.updateAttendanceStatus = updateAttendanceStatus;
const query_1 = __importDefault(require("../../db/sqlite/query"));
/**
 * @description جلب سجلات الحضور ليوم وفرع محددين مع بيانات المريض بـ JOIN
 * @param {string} date - تاريخ اليوم (YYYY-MM-DD)
 * @param {string} branchId - معرّف الفرع
 * @param {Knex | Knex.Transaction} [db] - اتصال اختياري للمعاملات
 * @returns {Promise<AttendanceRow[]>} قائمة سجلات الحضور
 */
async function findAttendanceByDateAndBranch(date, branchId, db = query_1.default) {
    const rows = await db('attendance')
        .join('patients', 'attendance.patient_id', 'patients.id')
        .where('attendance.date', date)
        .where('attendance.branch_id', branchId)
        .select('attendance.id', 'attendance.patient_id', 'patients.name_ar as patient_name', 'patients.display_id as patient_display_id', 'attendance.branch_id', 'attendance.date', 'attendance.time', 'attendance.status', 'attendance.items', 'attendance.created_by', 'attendance.updated_at')
        .orderBy('attendance.time', 'asc');
    return rows;
}
/**
 * @description البحث عن سجل حضور محدد بالـ ID
 */
async function findAttendanceById(id, db = query_1.default) {
    const row = await db('attendance')
        .join('patients', 'attendance.patient_id', 'patients.id')
        .where('attendance.id', id)
        .select('attendance.id', 'attendance.patient_id', 'patients.name_ar as patient_name', 'patients.display_id as patient_display_id', 'attendance.branch_id', 'attendance.date', 'attendance.time', 'attendance.status', 'attendance.items', 'attendance.created_by', 'attendance.updated_at')
        .first();
    return row;
}
/**
 * @description إضافة سجل حضور جديد (Append-Only)
 */
async function insertAttendance(data, db = query_1.default) {
    await db('attendance').insert({
        id: data.id,
        patient_id: data.patient_id,
        branch_id: data.branch_id,
        date: data.date,
        time: data.time,
        status: data.status,
        items: data.items ?? '[]',
        created_by: data.created_by,
    });
}
/**
 * @description التعديل الوحيد المسموح في سجل الحضور: تحديث حالة الكشف (status)
 * ⚠️ Append-Only — يُمنع منعًا باتًا وجود دالة delete أو تعديل عام للحقول
 */
async function updateAttendanceStatus(id, status, db = query_1.default) {
    await db('attendance')
        .where({ id })
        .update({
        status,
        updated_at: new Date().toISOString(),
    });
}
