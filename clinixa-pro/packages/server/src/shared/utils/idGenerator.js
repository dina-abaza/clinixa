"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.generatePatientDisplayId = generatePatientDisplayId;
/**
 * @description توليد معرف المريض التلسكوبي (Display ID) من تسلسل patient_sequences
 * مثال: P-1001, P-1002 ...
 * @param {Knex | Knex.Transaction} db - معاملة أو اتصال قاعدة البيانات
 * @returns {Promise<string>} المعرف الفريد مثل P-1002
 */
async function generatePatientDisplayId(db) {
    const row = await db('patient_sequences').where({ id: 'singleton' }).first();
    const nextVal = (row?.last_seq ?? 1000) + 1;
    await db('patient_sequences').where({ id: 'singleton' }).update({ last_seq: nextVal });
    return `P-${nextVal}`;
}
