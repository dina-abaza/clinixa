"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_middleware_1 = require("../../middlewares/auth.middleware");
const permission_middleware_1 = require("../../middlewares/permission.middleware");
const backup_controller_1 = require("./backup.controller");
const router = (0, express_1.Router)();
// تطبيق ميدلوير المصادقة على مسارات النسخ الاحتياطي
router.use(auth_middleware_1.authMiddleware);
// مسارات إدارة النسخ الاحتياطي
router.get('/history', (0, permission_middleware_1.requirePermission)('admin.view'), backup_controller_1.listBackupHistory);
router.post('/run', (0, permission_middleware_1.requirePermission)('admin.edit'), backup_controller_1.triggerBackup);
router.put('/destination', (0, permission_middleware_1.requirePermission)('admin.edit'), backup_controller_1.setBackupDestination);
router.post('/restore', (0, permission_middleware_1.requirePermission)('admin.edit'), backup_controller_1.restoreBackupData);
exports.default = router;
