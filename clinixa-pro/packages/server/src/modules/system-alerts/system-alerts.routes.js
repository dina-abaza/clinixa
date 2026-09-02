"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_middleware_1 = require("../../middlewares/auth.middleware");
const system_alerts_controller_1 = require("./system-alerts.controller");
const router = (0, express_1.Router)();
// تطبيق ميدلوير المصادقة على مسارات تنبيهات النظام
router.use(auth_middleware_1.authMiddleware);
// مسارات استرجاع وتعليم التنبيهات كمقروءة
router.get('/', system_alerts_controller_1.listSystemAlerts);
router.patch('/:id/read', system_alerts_controller_1.readAlert);
exports.default = router;
