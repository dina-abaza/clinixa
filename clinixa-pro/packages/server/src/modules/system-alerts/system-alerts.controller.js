"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.listSystemAlerts = listSystemAlerts;
exports.readAlert = readAlert;
const system_alerts_service_1 = require("./system-alerts.service");
/**
 * @description معالجة طلب جلب تنبيهات النظام (GET /api/system-alerts)
 */
async function listSystemAlerts(req, res, next) {
    try {
        const branchId = req.employee?.branch_id;
        const result = await (0, system_alerts_service_1.getSystemAlerts)(branchId);
        res.status(200).json({ ok: true, data: result, warning: null });
    }
    catch (err) {
        next(err);
    }
}
/**
 * @description معالجة طلب تعليم التنبيه كمقروء (PATCH /api/system-alerts/:id/read)
 */
async function readAlert(req, res, next) {
    try {
        const alertId = req.params.id;
        const result = await (0, system_alerts_service_1.markAlertAsRead)(alertId);
        res.status(200).json({ ok: true, data: result, warning: null });
    }
    catch (err) {
        next(err);
    }
}
