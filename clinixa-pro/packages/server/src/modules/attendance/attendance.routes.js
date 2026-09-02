"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_middleware_1 = require("../../middlewares/auth.middleware");
const permission_middleware_1 = require("../../middlewares/permission.middleware");
const attendance_controller_1 = require("./attendance.controller");
const router = (0, express_1.Router)();
// جميع المسارات تحمي بواسطة authMiddleware
router.use(auth_middleware_1.authMiddleware);
// ⚠️ الـ static routes يجب أن تأتي قبل الـ dynamic routes (:id)
// وإلا Express سيعامل "ready-for-checkout" و "check-in" كـ :id
router.get('/ready-for-checkout', (0, permission_middleware_1.requirePermission)('pay.add'), attendance_controller_1.readyForCheckout);
router.post('/check-in', (0, permission_middleware_1.requirePermission)('att.add'), attendance_controller_1.checkIn);
router.get('/', (0, permission_middleware_1.requirePermission)('att.view'), attendance_controller_1.getQueue);
router.patch('/:id/call', (0, permission_middleware_1.requirePermission)('att.edit'), attendance_controller_1.call);
router.patch('/:id/status', (0, permission_middleware_1.requirePermission)('att.edit'), attendance_controller_1.setStatus);
router.post('/:id/finish', (0, permission_middleware_1.requirePermission)('att.done'), attendance_controller_1.finish);
exports.default = router;
