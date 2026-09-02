"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getPatients = getPatients;
exports.getPatientById = getPatientById;
exports.createPatient = createPatient;
exports.updatePatient = updatePatient;
exports.togglePatientActive = togglePatientActive;
exports.getMedicalRecord = getMedicalRecord;
exports.addMedicalHistory = addMedicalHistory;
exports.addDiagnosis = addDiagnosis;
exports.addMedication = addMedication;
exports.stopMedication = stopMedication;
exports.refillMedication = refillMedication;
exports.addPrescription = addPrescription;
exports.addLab = addLab;
exports.addMedicalAlert = addMedicalAlert;
exports.addRadiology = addRadiology;
const crypto_1 = __importDefault(require("crypto"));
const query_1 = __importDefault(require("../../db/sqlite/query"));
const error_handler_middleware_1 = require("../../middlewares/error-handler.middleware");
const arabicNormalize_1 = require("../../shared/utils/arabicNormalize");
const idGenerator_1 = require("../../shared/utils/idGenerator");
const nameMap_1 = require("../../shared/utils/nameMap");
const recalcDue_1 = require("../../shared/utils/recalcDue");
/**
 * @description جلب قائمة المرضى المصفحة مع حساب المستحق اللحظي وإمكانيات البحث
 * @param {QueryPatientsInput} input - خيارات البحث والصفحات
 * @returns {Promise<{ items: any[]; page: number; page_size: number; total_items: number; total_pages: number }>} قائمة المرضى وبيانات الترقيم
 */
async function getPatients(input) {
    let builder = (0, query_1.default)('patients');
    if (!input.include_inactive) {
        builder = builder.where('is_active', 1);
    }
    if (input.search) {
        const norm = (0, arabicNormalize_1.normalizeArabicText)(input.search);
        builder = builder.where((q) => {
            q.where('name_ar_normalized', 'like', `%${norm}%`)
                .orWhere('phone', 'like', `%${input.search}%`)
                .orWhere('display_id', 'like', `%${input.search}%`);
        });
    }
    const countResult = await builder.clone().count('id as total').first();
    const totalItems = Number(countResult?.total ?? 0);
    const totalPages = Math.ceil(totalItems / input.page_size) || 1;
    const offset = (input.page - 1) * input.page_size;
    const rows = await builder
        .clone()
        .select('id', 'display_id', 'name_ar', 'name_en', 'phone', 'age', 'gender', 'home_branch_id', 'is_active')
        .orderBy('created_at', 'desc')
        .limit(input.page_size)
        .offset(offset);
    // حساب المستحق اللحظي لكل مريض في القائمة
    const items = await Promise.all(rows.map(async (p) => {
        const due = await (0, recalcDue_1.calculatePatientDue)(query_1.default, p.id);
        return {
            ...p,
            is_active: Boolean(p.is_active),
            due,
        };
    }));
    return {
        items,
        page: input.page,
        page_size: input.page_size,
        total_items: totalItems,
        total_pages: totalPages,
    };
}
/**
 * @description جلب تفاصيل مريض محدد بالـ ID مع بيانات الطوارئ والمستحق المحسوب
 * @param {string} patientId - معرف المريض
 * @returns {Promise<any>} بيانات المريض الكاملة
 * @throws {AppError} 404 NOT_FOUND لو المريض غير موجود
 */
async function getPatientById(patientId) {
    const patient = await (0, query_1.default)('patients').where({ id: patientId }).first();
    if (!patient) {
        throw new error_handler_middleware_1.AppError('NOT_FOUND', 'المريض غير موجود', 404);
    }
    const emergencyContact = await (0, query_1.default)('patient_emergency_contacts')
        .where({ patient_id: patientId })
        .select('name', 'relation', 'phone')
        .first();
    const due = await (0, recalcDue_1.calculatePatientDue)(query_1.default, patientId);
    return {
        id: patient.id,
        display_id: patient.display_id,
        name_ar: patient.name_ar,
        name_en: patient.name_en,
        phone: patient.phone,
        age: patient.age,
        gender: patient.gender,
        address: patient.address,
        notes: patient.notes,
        home_branch_id: patient.home_branch_id,
        is_active: Boolean(patient.is_active),
        due,
        emergency_contact: emergencyContact
            ? {
                name: emergencyContact.name,
                relation: emergencyContact.relation,
                phone: emergencyContact.phone,
            }
            : null,
        created_at: patient.created_at,
    };
}
/**
 * @description إنشاء مريض جديد مع فحص تكرار رقم الهاتف وتوليد المعرف والترجمات
 * @param {CreatePatientInput} input - بيانات المريض الجديد
 * @param {string | null} branchId - فرع الجلسة الحالي لتسجيله كفرع رئيسي للمريض
 * @returns {Promise<{ data: any; warning: ApiWarning | null }>} المريض الجديد وملاحظة التكرار إن وجدت
 */
async function createPatient(input, branchId) {
    const patientId = `pat_${crypto_1.default.randomUUID()}`;
    const normalizedName = (0, arabicNormalize_1.normalizeArabicText)(input.name_ar);
    const englishName = (0, nameMap_1.mapArabicNameToEnglish)(input.name_ar);
    // فحص تكرار رقم الهاتف لإرجاع تحذير غير مانع (Warning Case)
    const existingPatient = await (0, query_1.default)('patients')
        .where({ phone: input.phone, is_active: 1 })
        .first();
    let warning = null;
    if (existingPatient) {
        warning = {
            code: 'DUPLICATE_PHONE',
            message: 'رقم الهاتف ده مسجّل بالفعل لمريض تاني',
            meta: {
                existing_patient_id: existingPatient.id,
                existing_patient_name: existingPatient.name_ar,
            },
        };
    }
    let displayId = '';
    await query_1.default.transaction(async (trx) => {
        displayId = await (0, idGenerator_1.generatePatientDisplayId)(trx);
        await trx('patients').insert({
            id: patientId,
            display_id: displayId,
            name_ar: input.name_ar,
            name_ar_normalized: normalizedName,
            name_en: englishName,
            phone: input.phone,
            age: input.age,
            gender: input.gender,
            address: input.address ?? null,
            notes: input.notes ?? null,
            home_branch_id: branchId,
            is_active: 1,
        });
        if (input.emergency_contact) {
            await trx('patient_emergency_contacts').insert({
                id: `pec_${crypto_1.default.randomUUID()}`,
                patient_id: patientId,
                name: input.emergency_contact.name ?? null,
                relation: input.emergency_contact.relation ?? null,
                phone: input.emergency_contact.phone ?? null,
            });
        }
    });
    return {
        data: {
            id: patientId,
            display_id: displayId,
            name_ar: input.name_ar,
            name_en: englishName,
            phone: input.phone,
            age: input.age,
            gender: input.gender,
            due: 0,
            is_active: true,
        },
        warning,
    };
}
/**
 * @description تعديل بيانات مريض موجود
 * @param {string} patientId - معرف المريض
 * @param {UpdatePatientInput} input - البيانات المراد تحديثها
 * @returns {Promise<{ data: any; warning: ApiWarning | null }>} بيانات المريض بعد التحديث
 * @throws {AppError} 404 NOT_FOUND لو المريض غير موجود
 */
async function updatePatient(patientId, input) {
    const patient = await (0, query_1.default)('patients').where({ id: patientId }).first();
    if (!patient) {
        throw new error_handler_middleware_1.AppError('NOT_FOUND', 'المريض غير موجود', 404);
    }
    let warning = null;
    if (input.phone && input.phone !== patient.phone) {
        const existingPatient = await (0, query_1.default)('patients')
            .where({ phone: input.phone, is_active: 1 })
            .whereNot({ id: patientId })
            .first();
        if (existingPatient) {
            warning = {
                code: 'DUPLICATE_PHONE',
                message: 'رقم الهاتف ده مسجّل بالفعل لمريض تاني',
                meta: {
                    existing_patient_id: existingPatient.id,
                    existing_patient_name: existingPatient.name_ar,
                },
            };
        }
    }
    const updatePayload = {
        updated_at: new Date().toISOString(),
    };
    if (input.name_ar) {
        updatePayload.name_ar = input.name_ar;
        updatePayload.name_ar_normalized = (0, arabicNormalize_1.normalizeArabicText)(input.name_ar);
        updatePayload.name_en = (0, nameMap_1.mapArabicNameToEnglish)(input.name_ar);
    }
    if (input.phone)
        updatePayload.phone = input.phone;
    if (input.age !== undefined)
        updatePayload.age = input.age;
    if (input.gender)
        updatePayload.gender = input.gender;
    if (input.address !== undefined)
        updatePayload.address = input.address;
    if (input.notes !== undefined)
        updatePayload.notes = input.notes;
    await query_1.default.transaction(async (trx) => {
        await trx('patients').where({ id: patientId }).update(updatePayload);
        if (input.emergency_contact) {
            const existingContact = await trx('patient_emergency_contacts')
                .where({ patient_id: patientId })
                .first();
            if (existingContact) {
                await trx('patient_emergency_contacts')
                    .where({ patient_id: patientId })
                    .update({
                    name: input.emergency_contact.name ?? existingContact.name,
                    relation: input.emergency_contact.relation ?? existingContact.relation,
                    phone: input.emergency_contact.phone ?? existingContact.phone,
                    updated_at: new Date().toISOString(),
                });
            }
            else {
                await trx('patient_emergency_contacts').insert({
                    id: `pec_${crypto_1.default.randomUUID()}`,
                    patient_id: patientId,
                    name: input.emergency_contact.name ?? null,
                    relation: input.emergency_contact.relation ?? null,
                    phone: input.emergency_contact.phone ?? null,
                });
            }
        }
    });
    const updatedPatient = await getPatientById(patientId);
    return { data: updatedPatient, warning };
}
/**
 * @description تفعيل أو تعطيل حساب مريض
 * @param {string} patientId - معرف المريض
 * @param {boolean} isActive - الحالة الجديدة
 * @returns {Promise<{ id: string; is_active: boolean }>} النتيجة
 * @throws {AppError} 404 NOT_FOUND لو المريض غير موجود
 */
async function togglePatientActive(patientId, isActive) {
    const patient = await (0, query_1.default)('patients').where({ id: patientId }).first();
    if (!patient) {
        throw new error_handler_middleware_1.AppError('NOT_FOUND', 'المريض غير موجود', 404);
    }
    await (0, query_1.default)('patients')
        .where({ id: patientId })
        .update({ is_active: isActive ? 1 : 0, updated_at: new Date().toISOString() });
    return { id: patientId, is_active: isActive };
}
/**
 * @description جلب السجل الطبي الكامل لمريض شامل التنبيهات والأدوية والروشتات والتحاليل والوثائق
 * @param {string} patientId - معرف المريض
 * @returns {Promise<any>} السجل الطبي الشامل
 * @throws {AppError} 404 NOT_FOUND لو المريض غير موجود
 */
async function getMedicalRecord(patientId) {
    const patient = await (0, query_1.default)('patients').where({ id: patientId }).first();
    if (!patient) {
        throw new error_handler_middleware_1.AppError('NOT_FOUND', 'المريض غير موجود', 404);
    }
    const medicalAlerts = await (0, query_1.default)('medical_alerts').where({ patient_id: patientId });
    const medicalHistory = await (0, query_1.default)('medical_history').where({ patient_id: patientId });
    const diagnoses = await (0, query_1.default)('diagnoses').where({ patient_id: patientId });
    const medications = await (0, query_1.default)('medications').where({ patient_id: patientId });
    const labs = await (0, query_1.default)('labs').where({ patient_id: patientId });
    const radiology = await (0, query_1.default)('radiology').where({ patient_id: patientId });
    const documents = await (0, query_1.default)('documents').where({ patient_id: patientId });
    return {
        medical_alerts: medicalAlerts.map((a) => ({
            id: a.id,
            type: a.type,
            text_ar: a.text_ar,
            text_en: a.text_en,
        })),
        medical_history: medicalHistory.map((h) => ({
            id: h.id,
            category: h.category,
            text_ar: h.text_ar,
            text_en: h.text_en,
        })),
        diagnoses: diagnoses.map((d) => ({
            id: d.id,
            date: d.date,
            text_ar: d.text_ar,
            text_en: d.text_en,
        })),
        medications: medications.map((m) => ({
            id: m.id,
            name: m.name,
            dose: m.dose,
            frequency: m.frequency,
            status: m.status,
        })),
        labs: labs.map((l) => ({
            id: l.id,
            name: l.name,
            date: l.date,
            status: l.status,
            has_attachment: Boolean(l.has_attachment),
        })),
        radiology: radiology.map((r) => ({
            id: r.id,
            type: r.type,
            date: r.date,
            report: r.report,
            has_attachment: Boolean(r.has_attachment),
        })),
        documents: documents.map((doc) => ({
            id: doc.id,
            file_name: doc.file_name,
            type: doc.type,
            date: doc.date,
        })),
    };
}
/**
 * @description إضافة بند تاريخ مرضي لمريض
 */
async function addMedicalHistory(patientId, input) {
    const id = `mh_${crypto_1.default.randomUUID()}`;
    await (0, query_1.default)('medical_history').insert({
        id,
        patient_id: patientId,
        category: input.category,
        text_ar: input.text_ar,
        text_en: input.text_en ?? null,
    });
    return { id, category: input.category, text_ar: input.text_ar };
}
/**
 * @description إضافة تشخيص طبي لمريض
 */
async function addDiagnosis(patientId, input) {
    const id = `dx_${crypto_1.default.randomUUID()}`;
    await (0, query_1.default)('diagnoses').insert({
        id,
        patient_id: patientId,
        date: input.date,
        text_ar: input.text_ar,
        text_en: input.text_en ?? null,
    });
    return { id, date: input.date, text_ar: input.text_ar };
}
/**
 * @description إضافة دواء لمريض
 */
async function addMedication(patientId, input) {
    const id = `med_${crypto_1.default.randomUUID()}`;
    await (0, query_1.default)('medications').insert({
        id,
        patient_id: patientId,
        name: input.name,
        dose: input.dose ?? null,
        frequency: input.frequency ?? null,
        since: input.since ?? null,
        status: input.status,
    });
    return { id, name: input.name, status: input.status };
}
/**
 * @description إيقاف دواء حالي لمريض
 */
async function stopMedication(medicationId) {
    await (0, query_1.default)('medications')
        .where({ id: medicationId })
        .update({ status: 'completed', updated_at: new Date().toISOString() });
    return { id: medicationId, status: 'completed' };
}
/**
 * @description تجديد دواء لمريض
 */
async function refillMedication(medicationId) {
    await (0, query_1.default)('medications')
        .where({ id: medicationId })
        .update({ status: 'active', updated_at: new Date().toISOString() });
    return { id: medicationId, status: 'active' };
}
/**
 * @description إضافة روشتة طبية وإرجاع التنبيهات الطبية (الحساسيات) دائماً مع الاستجابة (قرار ١١١)
 */
async function addPrescription(patientId, doctorId, input) {
    const prescriptionId = `rx_${crypto_1.default.randomUUID()}`;
    await query_1.default.transaction(async (trx) => {
        await trx('prescriptions').insert({
            id: prescriptionId,
            patient_id: patientId,
            date: input.date,
            doctor_id: doctorId,
        });
        const items = input.items.map((item) => ({
            id: `rxi_${crypto_1.default.randomUUID()}`,
            prescription_id: prescriptionId,
            drug: item.drug,
            dose: item.dose ?? null,
            frequency: item.frequency ?? null,
            duration: item.duration ?? null,
            instructions: item.instructions ?? null,
        }));
        await trx('prescription_items').insert(items);
    });
    const alerts = await (0, query_1.default)('medical_alerts')
        .where({ patient_id: patientId, type: 'allergy' })
        .select('type', 'text_ar');
    return {
        prescription: {
            id: prescriptionId,
            date: input.date,
            doctor_id: doctorId,
            items: input.items,
        },
        medical_alerts: alerts,
    };
}
/**
 * @description إضافة تحليل طبي
 */
async function addLab(patientId, input) {
    const id = `lab_${crypto_1.default.randomUUID()}`;
    await (0, query_1.default)('labs').insert({
        id,
        patient_id: patientId,
        name: input.name,
        date: input.date,
        status: input.status,
        doctor_id: input.doctor_id ?? null,
        has_attachment: input.has_attachment ? 1 : 0,
    });
    return { id, name: input.name, status: input.status };
}
/**
 * @description إضافة تنبيه طبي للمريض (حساسية، تحذير دواء، تاريخ مرضي مهم)
 * @param {string} patientId - معرّف المريض
 * @param {{ type: string; text_ar: string; text_en?: string | null }} input - بيانات التنبيه
 * @returns {Promise<{ id: string; type: string; text_ar: string }>} التنبيه الجديد
 * @throws {AppError} 404 NOT_FOUND لو المريض غير موجود
 */
async function addMedicalAlert(patientId, input) {
    const patient = await (0, query_1.default)('patients').where({ id: patientId }).first();
    if (!patient) {
        throw new error_handler_middleware_1.AppError('NOT_FOUND', 'المريض غير موجود', 404);
    }
    const id = `ma_${crypto_1.default.randomUUID()}`;
    await (0, query_1.default)('medical_alerts').insert({
        id,
        patient_id: patientId,
        type: input.type,
        text_ar: input.text_ar,
        text_en: input.text_en ?? null,
    });
    return { id, type: input.type, text_ar: input.text_ar };
}
/**
 * @description إضافة أشعة طبية
 */
async function addRadiology(patientId, input) {
    const id = `rad_${crypto_1.default.randomUUID()}`;
    await (0, query_1.default)('radiology').insert({
        id,
        patient_id: patientId,
        type: input.type,
        date: input.date,
        report: input.report ?? null,
        has_attachment: input.has_attachment ? 1 : 0,
    });
    return { id, type: input.type, date: input.date };
}
