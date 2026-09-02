"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getSyncStatusController = getSyncStatusController;
exports.retryPendingSyncController = retryPendingSyncController;
const sync_engine_1 = require("./sync.engine");
/**
 * @description معالجة طلب حالة المزامنة (GET /api/sync/status)
 */
async function getSyncStatusController(_req, res, next) {
    try {
        const result = await (0, sync_engine_1.getSyncStatus)();
        res.status(200).json({ ok: true, data: result, warning: null });
    }
    catch (error) {
        next(error);
    }
}
/**
 * @description معالجة طلب إعادة محاولة المزامنة (POST /api/sync/retry)
 */
async function retryPendingSyncController(_req, res, next) {
    try {
        const result = await (0, sync_engine_1.retryPendingSync)();
        res.status(200).json({ ok: true, data: result, warning: null });
    }
    catch (error) {
        next(error);
    }
}
