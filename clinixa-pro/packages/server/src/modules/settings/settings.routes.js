"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_middleware_1 = require("../../middlewares/auth.middleware");
const permission_middleware_1 = require("../../middlewares/permission.middleware");
const settings_controller_1 = require("./settings.controller");
const router = (0, express_1.Router)();
// تطبيق ميدلوير المصادقة على جميع مسارات الإعدادات
router.use(auth_middleware_1.authMiddleware);
// مسارات قراءة وتعديل الإعدادات والأسعار
router.get('/', settings_controller_1.getSettings);
router.put('/', (0, permission_middleware_1.requirePermission)('admin.edit'), settings_controller_1.updateSettings);
exports.default = router;
