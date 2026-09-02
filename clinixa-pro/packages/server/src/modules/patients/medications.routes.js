"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_middleware_1 = require("../../middlewares/auth.middleware");
const permission_middleware_1 = require("../../middlewares/permission.middleware");
const patients_controller_1 = require("../patients/patients.controller");
const router = (0, express_1.Router)();
router.use(auth_middleware_1.authMiddleware);
/**
 * @description إيقاف دواء بالـ ID (PATCH /api/medications/:id/stop)
 */
router.patch('/:id/stop', (0, permission_middleware_1.requirePermission)('pat.edit'), patients_controller_1.stopMedicationInfo);
/**
 * @description تجديد دواء بالـ ID (PATCH /api/medications/:id/refill)
 */
router.patch('/:id/refill', (0, permission_middleware_1.requirePermission)('pat.edit'), patients_controller_1.refillMedicationInfo);
exports.default = router;
