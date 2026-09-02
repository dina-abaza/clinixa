"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.calculatePatientDue = calculatePatientDue;
/**
 * @description حساب المستحق المالي اللحظي لمريض (SUM(charges) - SUM(payments))
 * ⭐ المستحق لا يُخزَّن مطلقاً في قاعدة البيانات طبقاً للقاعدة المعمارية الصارمة #1
 * @param {Knex | Knex.Transaction} db - اتصال أو معاملة قاعدة البيانات
 * @param {string} patientId - معرف المريض
 * @returns {Promise<number>} إجمالي المبلغ المستحق (موجب يعني مديونية، 0 مسدد، سالب فائض)
 */
async function calculatePatientDue(db, patientId) {
    const chargesResult = await db('charges')
        .where({ patient_id: patientId })
        .sum('amount as total')
        .first();
    const paymentsResult = await db('payments')
        .where({ patient_id: patientId })
        .sum('amount as total')
        .first();
    const totalCharges = Number(chargesResult?.total ?? 0);
    const totalPayments = Number(paymentsResult?.total ?? 0);
    return totalCharges - totalPayments;
}
