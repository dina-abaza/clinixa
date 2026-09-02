"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getInventoryItems = getInventoryItems;
exports.createInventoryItem = createInventoryItem;
exports.updateInventoryItem = updateInventoryItem;
exports.adjustInventoryQty = adjustInventoryQty;
const crypto_1 = __importDefault(require("crypto"));
const query_1 = __importDefault(require("../../db/sqlite/query"));
const error_handler_middleware_1 = require("../../middlewares/error-handler.middleware");
const resolveBranch_1 = require("../../shared/utils/resolveBranch");
/**
 * @description دالة مساعدة لإنشاء تنبيه نقص مخزون في جدول system_alerts
 * @param {string} itemId - معرّف الصنف
 * @param {string} nameAr - اسم الصنف بالعربية
 * @param {number} qty - الكمية الحالية
 * @param {number} minQty - الحد الأدنى للكمية
 * @param {string} branchId - معرّف الفرع
 */
async function checkAndCreateLowStockAlert(nameAr, qty, minQty, branchId) {
    if (minQty !== null && qty <= minQty) {
        const alertId = `alt_${crypto_1.default.randomUUID()}`;
        await (0, query_1.default)('system_alerts').insert({
            id: alertId,
            type: 'low_stock',
            title: `${nameAr} أقل من الحد الأدنى`,
            detail: `المتبقي ${qty} من ${minQty}`,
            branch_id: branchId,
            is_read: 0,
        });
    }
}
/**
 * @description استرجاع قائمة الأصناف في المخزون لفرع محدد مع حساب حالة نقص المخزون
 * @param {string | null | undefined} branchId - معرّف الفرع المطلوب الاستعلام عنه
 * @returns {Promise<{ items: FormattedInventoryItem[] }>} مصفوفة الأصناف وحالتها
 */
async function getInventoryItems(branchId) {
    const targetBranchId = await (0, resolveBranch_1.resolveBranchId)(branchId);
    const rows = await (0, query_1.default)('inventory_items')
        .where({ branch_id: targetBranchId })
        .orderBy('name_ar', 'asc');
    const items = rows.map((row) => ({
        id: row.id,
        branch_id: row.branch_id,
        name_ar: row.name_ar,
        name_en: row.name_en ?? null,
        type: row.type,
        qty: row.qty,
        min_qty: row.min_qty ?? null,
        unit: row.unit,
        is_active: Boolean(row.is_active),
        low_stock: row.min_qty !== null && row.qty <= row.min_qty,
        updated_at: row.updated_at,
    }));
    return { items };
}
/**
 * @description إنشاء صنف جديد في المخزون والتحقق من تنبيه نقص المخزون الأولي
 * @param {CreateInventoryItemInput} input - بيانات الصنف الجديد
 * @param {string | null | undefined} sessionBranchId - فرع الجلسة الحالي للمستخدم
 * @returns {Promise<FormattedInventoryItem>} الصنف المنشأ كاملاً
 */
async function createInventoryItem(input, sessionBranchId) {
    const targetBranchId = await (0, resolveBranch_1.resolveBranchId)(input.branch_id || sessionBranchId);
    const itemId = `inv_${crypto_1.default.randomUUID()}`;
    const minQty = input.min_qty !== undefined ? input.min_qty : null;
    await (0, query_1.default)('inventory_items').insert({
        id: itemId,
        branch_id: targetBranchId,
        name_ar: input.name_ar,
        name_en: input.name_en ?? null,
        type: input.type,
        qty: input.qty,
        min_qty: minQty,
        unit: input.unit,
        is_active: 1,
    });
    // فحص وإنشاء تنبيه نقص المخزون إذا كانت الكمية المضافة أقل أو تساوي الحد الأدنى
    await checkAndCreateLowStockAlert(input.name_ar, input.qty, minQty, targetBranchId);
    const created = await (0, query_1.default)('inventory_items').where({ id: itemId }).first();
    return {
        id: created.id,
        branch_id: created.branch_id,
        name_ar: created.name_ar,
        name_en: created.name_en ?? null,
        type: created.type,
        qty: created.qty,
        min_qty: created.min_qty ?? null,
        unit: created.unit,
        is_active: Boolean(created.is_active),
        low_stock: created.min_qty !== null && created.qty <= created.min_qty,
        updated_at: created.updated_at,
    };
}
/**
 * @description تعديل بيانات صنف في المخزون
 * @param {string} id - معرّف الصنف المراد تعديله
 * @param {UpdateInventoryItemInput} input - البيانات الجديدة للصنف
 * @returns {Promise<FormattedInventoryItem>} الصنف بعد التعديل
 * @throws {AppError} 404 NOT_FOUND في حال عدم وجود الصنف
 */
async function updateInventoryItem(id, input) {
    const item = await (0, query_1.default)('inventory_items').where({ id }).first();
    if (!item) {
        throw new error_handler_middleware_1.AppError('NOT_FOUND', 'الصنف غير موجود في المخزون', 404);
    }
    const updateData = {
        updated_at: query_1.default.raw("(datetime('now'))"),
    };
    if (input.name_ar !== undefined)
        updateData.name_ar = input.name_ar;
    if (input.name_en !== undefined)
        updateData.name_en = input.name_en;
    if (input.type !== undefined)
        updateData.type = input.type;
    if (input.qty !== undefined)
        updateData.qty = input.qty;
    if (input.min_qty !== undefined)
        updateData.min_qty = input.min_qty;
    if (input.unit !== undefined)
        updateData.unit = input.unit;
    if (input.is_active !== undefined)
        updateData.is_active = input.is_active ? 1 : 0;
    await (0, query_1.default)('inventory_items').where({ id }).update(updateData);
    const updated = await (0, query_1.default)('inventory_items').where({ id }).first();
    // فحص التنبيه بعد التعديل
    await checkAndCreateLowStockAlert(updated.name_ar, updated.qty, updated.min_qty ?? null, updated.branch_id);
    return {
        id: updated.id,
        branch_id: updated.branch_id,
        name_ar: updated.name_ar,
        name_en: updated.name_en ?? null,
        type: updated.type,
        qty: updated.qty,
        min_qty: updated.min_qty ?? null,
        unit: updated.unit,
        is_active: Boolean(updated.is_active),
        low_stock: updated.min_qty !== null && updated.qty <= updated.min_qty,
        updated_at: updated.updated_at,
    };
}
/**
 * @description تعديل كمية صنف في المخزون مع فحص وإنشاء تنبيه نقص المخزون التلقائي
 * @param {string} id - معرّف الصنف المخزني
 * @param {AdjustQtyInput} input - الكمية الجديدة
 * @returns {Promise<{ id: string; qty: number; min_qty: number | null; low_stock: boolean }>} النتيجة بحسب عقد الـ API
 * @throws {AppError} 404 NOT_FOUND في حال عدم وجود الصنف
 */
async function adjustInventoryQty(id, input) {
    const item = await (0, query_1.default)('inventory_items').where({ id }).first();
    if (!item) {
        throw new error_handler_middleware_1.AppError('NOT_FOUND', 'الصنف غير موجود في المخزون', 404);
    }
    await (0, query_1.default)('inventory_items').where({ id }).update({
        qty: input.qty,
        updated_at: query_1.default.raw("(datetime('now'))"),
    });
    const minQty = item.min_qty !== null ? Number(item.min_qty) : null;
    const isLowStock = minQty !== null && input.qty <= minQty;
    // توليد تنبيه نظام تلقائياً إذا أصبحت الكمية أقل أو تساوي الحد الأدنى
    await checkAndCreateLowStockAlert(item.name_ar, input.qty, minQty, item.branch_id);
    return {
        id: item.id,
        qty: input.qty,
        min_qty: minQty,
        low_stock: isLowStock,
    };
}
