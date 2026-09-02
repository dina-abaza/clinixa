"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.listPatients = listPatients;
exports.getPatient = getPatient;
exports.createNewPatient = createNewPatient;
exports.updatePatientInfo = updatePatientInfo;
exports.toggleActive = toggleActive;
exports.getDue = getDue;
exports.getMedicalRecordInfo = getMedicalRecordInfo;
exports.addMedicalAlertInfo = addMedicalAlertInfo;
exports.addHistory = addHistory;
exports.addDiagnosisInfo = addDiagnosisInfo;
exports.addMedicationInfo = addMedicationInfo;
exports.stopMedicationInfo = stopMedicationInfo;
exports.refillMedicationInfo = refillMedicationInfo;
exports.addPrescriptionInfo = addPrescriptionInfo;
exports.addLabInfo = addLabInfo;
exports.addRadiologyInfo = addRadiologyInfo;
const error_handler_middleware_1 = require("../../middlewares/error-handler.middleware");
const patients_validation_1 = require("./patients.validation");
const zod_1 = require("zod");
const patients_service_1 = require("./patients.service");
const recalcDue_1 = require("../../shared/utils/recalcDue");
const query_1 = __importDefault(require("../../db/sqlite/query"));
/**
 * @description سكيمة إضافة التنبيه الطبي محلياً في الكنترولر
 */
const createMedicalAlertSchema = zod_1.z.object({
    type: zod_1.z.enum(['allergy', 'warning', 'chronic', 'other'], { message: 'النوع غير صالح' }),
    text_ar: zod_1.z.string().min(1, 'النص العربي مطلوب'),
    text_en: zod_1.z.string().nullable().optional(),
});
/**
 * @description معالجة طلب جلب قائمة المرضى المصفحة (GET /api/patients)
 */
async function listPatients(req, res, next) {
    try {
        const parsed = patients_validation_1.queryPatientsSchema.safeParse(req.query);
        if (!parsed.success) {
            const issue = parsed.error.issues[0];
            throw new error_handler_middleware_1.AppError('VALIDATION_ERROR', issue.message, 400, issue.path.join('.'));
        }
        const result = await (0, patients_service_1.getPatients)(parsed.data);
        res.status(200).json({ ok: true, data: result, warning: null });
    }
    catch (err) {
        next(err);
    }
}
/**
 * @description معالجة طلب جلب مريض محدد بـ ID (GET /api/patients/:id)
 */
async function getPatient(req, res, next) {
    try {
        const patientId = req.params.id;
        const result = await (0, patients_service_1.getPatientById)(patientId);
        res.status(200).json({ ok: true, data: result, warning: null });
    }
    catch (err) {
        next(err);
    }
}
/**
 * @description معالجة طلب إنشاء مريض جديد (POST /api/patients)
 */
async function createNewPatient(req, res, next) {
    try {
        const parsed = patients_validation_1.createPatientSchema.safeParse(req.body);
        if (!parsed.success) {
            const issue = parsed.error.issues[0];
            throw new error_handler_middleware_1.AppError('VALIDATION_ERROR', issue.message, 400, issue.path.join('.'));
        }
        const branchId = req.employee?.branch_id ?? null;
        const { data, warning } = await (0, patients_service_1.createPatient)(parsed.data, branchId);
        res.status(201).json({ ok: true, data, warning });
    }
    catch (err) {
        next(err);
    }
}
/**
 * @description معالجة طلب تعديل بيانات مريض (PUT /api/patients/:id)
 */
async function updatePatientInfo(req, res, next) {
    try {
        const patientId = req.params.id;
        const parsed = patients_validation_1.updatePatientSchema.safeParse(req.body);
        if (!parsed.success) {
            const issue = parsed.error.issues[0];
            throw new error_handler_middleware_1.AppError('VALIDATION_ERROR', issue.message, 400, issue.path.join('.'));
        }
        const { data, warning } = await (0, patients_service_1.updatePatient)(patientId, parsed.data);
        res.status(200).json({ ok: true, data, warning });
    }
    catch (err) {
        next(err);
    }
}
/**
 * @description معالجة طلب تفعيل / تعطيل مريض (PATCH /api/patients/:id/toggle-active)
 */
async function toggleActive(req, res, next) {
    try {
        const patientId = req.params.id;
        const parsed = patients_validation_1.toggleActivePatientSchema.safeParse(req.body);
        if (!parsed.success) {
            const issue = parsed.error.issues[0];
            throw new error_handler_middleware_1.AppError('VALIDATION_ERROR', issue.message, 400, issue.path.join('.'));
        }
        const result = await (0, patients_service_1.togglePatientActive)(patientId, parsed.data.is_active);
        res.status(200).json({ ok: true, data: result, warning: null });
    }
    catch (err) {
        next(err);
    }
}
/**
 * @description معالجة طلب جلب المستحق اللحظي لمريض (GET /api/patients/:id/due)
 */
async function getDue(req, res, next) {
    try {
        const patientId = req.params.id;
        const due = await (0, recalcDue_1.calculatePatientDue)(query_1.default, patientId);
        res.status(200).json({ ok: true, data: { patient_id: patientId, due }, warning: null });
    }
    catch (err) {
        next(err);
    }
}
/**
 * @description معالجة طلب جلب السجل الطبي الكامل (GET /api/patients/:id/medical-record)
 */
async function getMedicalRecordInfo(req, res, next) {
    try {
        const patientId = req.params.id;
        const result = await (0, patients_service_1.getMedicalRecord)(patientId);
        res.status(200).json({ ok: true, data: result, warning: null });
    }
    catch (err) {
        next(err);
    }
}
/**
 * @description إضافة تنبيه طبي للمريض (POST /api/patients/:id/medical-alerts)
 * الأنواع المدعومة: allergy | warning | chronic | other
 */
async function addMedicalAlertInfo(req, res, next) {
    try {
        const patientId = req.params.id;
        const parsed = createMedicalAlertSchema.safeParse(req.body);
        if (!parsed.success) {
            const issue = parsed.error.issues[0];
            throw new error_handler_middleware_1.AppError('VALIDATION_ERROR', issue.message, 400, issue.path.join('.'));
        }
        const result = await (0, patients_service_1.addMedicalAlert)(patientId, parsed.data);
        res.status(201).json({ ok: true, data: result, warning: null });
    }
    catch (err) {
        next(err);
    }
}
/**
 * @description إضافة بند في التاريخ المرضي (POST /api/patients/:id/medical-history)
 */
async function addHistory(req, res, next) {
    try {
        const patientId = req.params.id;
        const parsed = patients_validation_1.createMedicalHistorySchema.safeParse(req.body);
        if (!parsed.success) {
            const issue = parsed.error.issues[0];
            throw new error_handler_middleware_1.AppError('VALIDATION_ERROR', issue.message, 400, issue.path.join('.'));
        }
        const result = await (0, patients_service_1.addMedicalHistory)(patientId, parsed.data);
        res.status(201).json({ ok: true, data: result, warning: null });
    }
    catch (err) {
        next(err);
    }
}
/**
 * @description إضافة تشخيص (POST /api/patients/:id/diagnoses)
 */
async function addDiagnosisInfo(req, res, next) {
    try {
        const patientId = req.params.id;
        const parsed = patients_validation_1.createDiagnosisSchema.safeParse(req.body);
        if (!parsed.success) {
            const issue = parsed.error.issues[0];
            throw new error_handler_middleware_1.AppError('VALIDATION_ERROR', issue.message, 400, issue.path.join('.'));
        }
        const result = await (0, patients_service_1.addDiagnosis)(patientId, parsed.data);
        res.status(201).json({ ok: true, data: result, warning: null });
    }
    catch (err) {
        next(err);
    }
}
/**
 * @description إضافة دواء (POST /api/patients/:id/medications)
 */
async function addMedicationInfo(req, res, next) {
    try {
        const patientId = req.params.id;
        const parsed = patients_validation_1.createMedicationSchema.safeParse(req.body);
        if (!parsed.success) {
            const issue = parsed.error.issues[0];
            throw new error_handler_middleware_1.AppError('VALIDATION_ERROR', issue.message, 400, issue.path.join('.'));
        }
        const result = await (0, patients_service_1.addMedication)(patientId, parsed.data);
        res.status(201).json({ ok: true, data: result, warning: null });
    }
    catch (err) {
        next(err);
    }
}
/**
 * @description إيقاف دواء (PATCH /api/medications/:id/stop)
 */
async function stopMedicationInfo(req, res, next) {
    try {
        const medicationId = req.params.id;
        const result = await (0, patients_service_1.stopMedication)(medicationId);
        res.status(200).json({ ok: true, data: result, warning: null });
    }
    catch (err) {
        next(err);
    }
}
/**
 * @description تجديد دواء (PATCH /api/medications/:id/refill)
 */
async function refillMedicationInfo(req, res, next) {
    try {
        const medicationId = req.params.id;
        const result = await (0, patients_service_1.refillMedication)(medicationId);
        res.status(200).json({ ok: true, data: result, warning: null });
    }
    catch (err) {
        next(err);
    }
}
/**
 * @description إضافة روشتة (POST /api/patients/:id/prescriptions)
 */
async function addPrescriptionInfo(req, res, next) {
    try {
        const patientId = req.params.id;
        const parsed = patients_validation_1.createPrescriptionSchema.safeParse(req.body);
        if (!parsed.success) {
            const issue = parsed.error.issues[0];
            throw new error_handler_middleware_1.AppError('VALIDATION_ERROR', issue.message, 400, issue.path.join('.'));
        }
        const doctorId = req.employee?.id ?? null;
        const result = await (0, patients_service_1.addPrescription)(patientId, doctorId, parsed.data);
        res.status(201).json({ ok: true, data: result, warning: null });
    }
    catch (err) {
        next(err);
    }
}
/**
 * @description إضافة تحليل (POST /api/patients/:id/labs)
 */
async function addLabInfo(req, res, next) {
    try {
        const patientId = req.params.id;
        const parsed = patients_validation_1.createLabSchema.safeParse(req.body);
        if (!parsed.success) {
            const issue = parsed.error.issues[0];
            throw new error_handler_middleware_1.AppError('VALIDATION_ERROR', issue.message, 400, issue.path.join('.'));
        }
        const result = await (0, patients_service_1.addLab)(patientId, parsed.data);
        res.status(201).json({ ok: true, data: result, warning: null });
    }
    catch (err) {
        next(err);
    }
}
/**
 * @description إضافة أشعة (POST /api/patients/:id/radiology)
 */
async function addRadiologyInfo(req, res, next) {
    try {
        const patientId = req.params.id;
        const parsed = patients_validation_1.createRadiologySchema.safeParse(req.body);
        if (!parsed.success) {
            const issue = parsed.error.issues[0];
            throw new error_handler_middleware_1.AppError('VALIDATION_ERROR', issue.message, 400, issue.path.join('.'));
        }
        const result = await (0, patients_service_1.addRadiology)(patientId, parsed.data);
        res.status(201).json({ ok: true, data: result, warning: null });
    }
    catch (err) {
        next(err);
    }
}
