"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.listBranches = listBranches;
exports.createNewBranch = createNewBranch;
exports.updateBranchInfo = updateBranchInfo;
const error_handler_middleware_1 = require("../../middlewares/error-handler.middleware");
const branches_validation_1 = require("./branches.validation");
const branches_service_1 = require("./branches.service");
/**
 * @description معالجة طلب جلب قائمة الفروع (GET /api/branches)
 */
async function listBranches(_req, res, next) {
    try {
        const result = await (0, branches_service_1.getBranches)();
        res.status(200).json({ ok: true, data: result, warning: null });
    }
    catch (err) {
        next(err);
    }
}
/**
 * @description معالجة طلب إنشاء فرع جديد (POST /api/branches)
 */
async function createNewBranch(req, res, next) {
    try {
        const parsed = branches_validation_1.createBranchSchema.safeParse(req.body);
        if (!parsed.success) {
            const issue = parsed.error.issues[0];
            throw new error_handler_middleware_1.AppError('VALIDATION_ERROR', issue.message, 400, issue.path.join('.'));
        }
        const result = await (0, branches_service_1.createBranch)(parsed.data);
        res.status(201).json({ ok: true, data: result, warning: null });
    }
    catch (err) {
        next(err);
    }
}
/**
 * @description معالجة طلب تعديل بيانات الفرع (PUT /api/branches/:id)
 */
async function updateBranchInfo(req, res, next) {
    try {
        const parsed = branches_validation_1.updateBranchSchema.safeParse(req.body);
        if (!parsed.success) {
            const issue = parsed.error.issues[0];
            throw new error_handler_middleware_1.AppError('VALIDATION_ERROR', issue.message, 400, issue.path.join('.'));
        }
        const branchId = req.params.id;
        const result = await (0, branches_service_1.updateBranch)(branchId, parsed.data);
        res.status(200).json({ ok: true, data: result, warning: null });
    }
    catch (err) {
        next(err);
    }
}
