"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getSettings = getSettings;
exports.updateSettings = updateSettings;
const error_handler_middleware_1 = require("../../middlewares/error-handler.middleware");
const settings_validation_1 = require("./settings.validation");
const settings_service_1 = require("./settings.service");
/**
 * @description معالجة طلب جلب إعدادات العيادة والأسعار (GET /api/settings)
 */
async function getSettings(_req, res, next) {
    try {
        const result = await (0, settings_service_1.getClinicSettings)();
        res.status(200).json({ ok: true, data: result, warning: null });
    }
    catch (err) {
        next(err);
    }
}
/**
 * @description معالجة طلب تحديث إعدادات العيادة والأسعار (PUT /api/settings)
 */
async function updateSettings(req, res, next) {
    try {
        const parsed = settings_validation_1.updateSettingsSchema.safeParse(req.body);
        if (!parsed.success) {
            const issue = parsed.error.issues[0];
            throw new error_handler_middleware_1.AppError('VALIDATION_ERROR', issue.message, 400, issue.path.join('.'));
        }
        const result = await (0, settings_service_1.updateClinicSettings)(parsed.data);
        res.status(200).json({ ok: true, data: result, warning: null });
    }
    catch (err) {
        next(err);
    }
}
