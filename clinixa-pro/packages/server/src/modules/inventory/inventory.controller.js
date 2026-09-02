"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.listInventory = listInventory;
exports.createItem = createItem;
exports.updateItem = updateItem;
exports.adjustQty = adjustQty;
const error_handler_middleware_1 = require("../../middlewares/error-handler.middleware");
const inventory_validation_1 = require("./inventory.validation");
const inventory_service_1 = require("./inventory.service");
/**
 * @description معالجة طلب جلب قائمة المخزون (GET /api/inventory)
 */
async function listInventory(req, res, next) {
    try {
        const parsed = inventory_validation_1.queryInventorySchema.safeParse(req.query);
        if (!parsed.success) {
            const issue = parsed.error.issues[0];
            throw new error_handler_middleware_1.AppError('VALIDATION_ERROR', issue.message, 400, issue.path.join('.'));
        }
        const branchId = parsed.data.branch_id || req.employee?.branch_id;
        const result = await (0, inventory_service_1.getInventoryItems)(branchId);
        res.status(200).json({ ok: true, data: result, warning: null });
    }
    catch (err) {
        next(err);
    }
}
/**
 * @description معالجة طلب إضافة صنف جديد للمخزون (POST /api/inventory)
 */
async function createItem(req, res, next) {
    try {
        const parsed = inventory_validation_1.createInventoryItemSchema.safeParse(req.body);
        if (!parsed.success) {
            const issue = parsed.error.issues[0];
            throw new error_handler_middleware_1.AppError('VALIDATION_ERROR', issue.message, 400, issue.path.join('.'));
        }
        const result = await (0, inventory_service_1.createInventoryItem)(parsed.data, req.employee?.branch_id);
        res.status(201).json({ ok: true, data: result, warning: null });
    }
    catch (err) {
        next(err);
    }
}
/**
 * @description معالجة طلب تعديل صنف في المخزون (PUT /api/inventory/:id)
 */
async function updateItem(req, res, next) {
    try {
        const parsed = inventory_validation_1.updateInventoryItemSchema.safeParse(req.body);
        if (!parsed.success) {
            const issue = parsed.error.issues[0];
            throw new error_handler_middleware_1.AppError('VALIDATION_ERROR', issue.message, 400, issue.path.join('.'));
        }
        const itemId = req.params.id;
        const result = await (0, inventory_service_1.updateInventoryItem)(itemId, parsed.data);
        res.status(200).json({ ok: true, data: result, warning: null });
    }
    catch (err) {
        next(err);
    }
}
/**
 * @description معالجة طلب تعديل كمية الصنف المخزني (PATCH /api/inventory/:id/adjust-qty)
 */
async function adjustQty(req, res, next) {
    try {
        const parsed = inventory_validation_1.adjustQtySchema.safeParse(req.body);
        if (!parsed.success) {
            const issue = parsed.error.issues[0];
            throw new error_handler_middleware_1.AppError('VALIDATION_ERROR', issue.message, 400, issue.path.join('.'));
        }
        const itemId = req.params.id;
        const result = await (0, inventory_service_1.adjustInventoryQty)(itemId, parsed.data);
        res.status(200).json({ ok: true, data: result, warning: null });
    }
    catch (err) {
        next(err);
    }
}
