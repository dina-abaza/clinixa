"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.listBackupHistory = listBackupHistory;
exports.triggerBackup = triggerBackup;
exports.setBackupDestination = setBackupDestination;
exports.restoreBackupData = restoreBackupData;
const error_handler_middleware_1 = require("../../middlewares/error-handler.middleware");
const backup_validation_1 = require("./backup.validation");
const backup_service_1 = require("./backup.service");
/**
 * @description معالجة طلب جلب سجل النسخ الاحتياطي (GET /api/backup/history)
 */
async function listBackupHistory(_req, res, next) {
    try {
        const result = await (0, backup_service_1.getBackupHistory)();
        res.status(200).json({ ok: true, data: result, warning: null });
    }
    catch (err) {
        next(err);
    }
}
/**
 * @description معالجة طلب تشغيل النسخ الاحتياطي (POST /api/backup/run)
 */
async function triggerBackup(req, res, next) {
    try {
        const parsed = backup_validation_1.runBackupSchema.safeParse(req.body);
        if (!parsed.success) {
            const issue = parsed.error.issues[0];
            throw new error_handler_middleware_1.AppError('VALIDATION_ERROR', issue.message, 400, issue.path.join('.'));
        }
        const result = await (0, backup_service_1.runBackup)(parsed.data);
        res.status(200).json({ ok: true, data: result, warning: null });
    }
    catch (err) {
        next(err);
    }
}
/**
 * @description معالجة طلب تحديث وجهة النسخ الاحتياطي (PUT /api/backup/destination)
 */
async function setBackupDestination(req, res, next) {
    try {
        const parsed = backup_validation_1.updateBackupDestinationSchema.safeParse(req.body);
        if (!parsed.success) {
            const issue = parsed.error.issues[0];
            throw new error_handler_middleware_1.AppError('VALIDATION_ERROR', issue.message, 400, issue.path.join('.'));
        }
        const result = await (0, backup_service_1.updateBackupDestination)(parsed.data);
        res.status(200).json({ ok: true, data: result, warning: null });
    }
    catch (err) {
        next(err);
    }
}
/**
 * @description معالجة طلب استعادة نسخة احتياطية (POST /api/backup/restore)
 */
async function restoreBackupData(req, res, next) {
    try {
        const parsed = backup_validation_1.restoreBackupSchema.safeParse(req.body);
        if (!parsed.success) {
            const issue = parsed.error.issues[0];
            throw new error_handler_middleware_1.AppError('VALIDATION_ERROR', issue.message, 400, issue.path.join('.'));
        }
        const result = await (0, backup_service_1.restoreBackup)(parsed.data);
        res.status(200).json({ ok: true, data: result, warning: null });
    }
    catch (err) {
        next(err);
    }
}
