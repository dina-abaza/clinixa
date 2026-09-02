"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_middleware_1 = require("../../middlewares/auth.middleware");
const permission_middleware_1 = require("../../middlewares/permission.middleware");
const employees_controller_1 = require("./employees.controller");
const router = (0, express_1.Router)();
// تطبيق ميدلوير المصادقة على جميع مسارات الموظفين
router.use(auth_middleware_1.authMiddleware);
// مسارات إدارة الموظفين
router.get('/', (0, permission_middleware_1.requirePermission)('admin.view'), employees_controller_1.listEmployees);
router.post('/', (0, permission_middleware_1.requirePermission)('admin.edit'), employees_controller_1.createNewEmployee);
router.put('/:id/permissions', (0, permission_middleware_1.requirePermission)('admin.edit'), employees_controller_1.updatePermissions);
router.patch('/:id/reset-password', (0, permission_middleware_1.requirePermission)('admin.edit'), employees_controller_1.resetPassword);
router.patch('/:id/toggle-active', (0, permission_middleware_1.requirePermission)('admin.edit'), employees_controller_1.toggleActive);
exports.default = router;
