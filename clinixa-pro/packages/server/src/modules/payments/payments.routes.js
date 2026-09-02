"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.daySummaryRouter = exports.chargesRouter = exports.paymentsRouter = void 0;
const express_1 = require("express");
const auth_middleware_1 = require("../../middlewares/auth.middleware");
const permission_middleware_1 = require("../../middlewares/permission.middleware");
const payments_controller_1 = require("./payments.controller");
// Router للمدوفوعات والرسوم المباشرة
exports.paymentsRouter = (0, express_1.Router)();
exports.paymentsRouter.use(auth_middleware_1.authMiddleware);
exports.paymentsRouter.get('/outstanding', (0, permission_middleware_1.requirePermission)('pay.view'), payments_controller_1.listOutstanding);
exports.paymentsRouter.get('/', (0, permission_middleware_1.requirePermission)('pay.view'), payments_controller_1.listPayments);
exports.paymentsRouter.post('/', (0, permission_middleware_1.requirePermission)('pay.add'), payments_controller_1.addPayment);
// Router للرسوم الطبية
exports.chargesRouter = (0, express_1.Router)();
exports.chargesRouter.use(auth_middleware_1.authMiddleware);
exports.chargesRouter.get('/', (0, permission_middleware_1.requirePermission)('pay.view'), payments_controller_1.listCharges);
exports.chargesRouter.post('/', (0, permission_middleware_1.requirePermission)('pay.add'), payments_controller_1.addCharge);
// Router لإقفال اليومية وملخص الإيرادات
exports.daySummaryRouter = (0, express_1.Router)();
exports.daySummaryRouter.use(auth_middleware_1.authMiddleware);
exports.daySummaryRouter.get('/', (0, permission_middleware_1.requirePermission)('pay.view'), payments_controller_1.getDaySummaryInfo);
exports.daySummaryRouter.post('/close', (0, permission_middleware_1.requirePermission)('pay.edit'), payments_controller_1.closeDayInfo);
exports.daySummaryRouter.post('/reopen', (0, permission_middleware_1.requirePermission)('pay.edit'), payments_controller_1.reopenDayInfo);
