"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_middleware_1 = require("../../middlewares/auth.middleware");
const permission_middleware_1 = require("../../middlewares/permission.middleware");
const patients_controller_1 = require("./patients.controller");
const router = (0, express_1.Router)();
// تطبيق ميدلوير المصادقة على جميع مسارات المرضى
router.use(auth_middleware_1.authMiddleware);
// مسارات إدارة المرضى الأساسية
router.get('/', (0, permission_middleware_1.requirePermission)('pat.view'), patients_controller_1.listPatients);
router.post('/', (0, permission_middleware_1.requirePermission)('pat.add'), patients_controller_1.createNewPatient);
router.get('/:id', (0, permission_middleware_1.requirePermission)('pat.view'), patients_controller_1.getPatient);
router.put('/:id', (0, permission_middleware_1.requirePermission)('pat.edit'), patients_controller_1.updatePatientInfo);
router.patch('/:id/toggle-active', (0, permission_middleware_1.requirePermission)('pat.off'), patients_controller_1.toggleActive);
router.get('/:id/due', (0, permission_middleware_1.requirePermission)('pat.view'), patients_controller_1.getDue);
// مسارات السجل الطبي
router.get('/:id/medical-record', (0, permission_middleware_1.requirePermission)('pat.view'), patients_controller_1.getMedicalRecordInfo);
router.post('/:id/medical-alerts', (0, permission_middleware_1.requirePermission)('pat.edit'), patients_controller_1.addMedicalAlertInfo);
router.post('/:id/medical-history', (0, permission_middleware_1.requirePermission)('pat.edit'), patients_controller_1.addHistory);
router.post('/:id/diagnoses', (0, permission_middleware_1.requirePermission)('pat.edit'), patients_controller_1.addDiagnosisInfo);
router.post('/:id/medications', (0, permission_middleware_1.requirePermission)('pat.edit'), patients_controller_1.addMedicationInfo);
router.post('/:id/prescriptions', (0, permission_middleware_1.requirePermission)('pat.edit'), patients_controller_1.addPrescriptionInfo);
router.post('/:id/labs', (0, permission_middleware_1.requirePermission)('pat.edit'), patients_controller_1.addLabInfo);
router.post('/:id/radiology', (0, permission_middleware_1.requirePermission)('pat.edit'), patients_controller_1.addRadiologyInfo);
exports.default = router;
