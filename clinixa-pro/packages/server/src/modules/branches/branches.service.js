"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getBranches = getBranches;
exports.createBranch = createBranch;
exports.updateBranch = updateBranch;
const crypto_1 = __importDefault(require("crypto"));
const query_1 = __importDefault(require("../../db/sqlite/query"));
const error_handler_middleware_1 = require("../../middlewares/error-handler.middleware");
/**
 * @description استرجاع قائمة جميع الفروع المسجلة في النظام
 * @returns {Promise<{ items: Branch[] }>} قائمة الفروع
 */
async function getBranches() {
    const rows = await (0, query_1.default)('branches').orderBy('created_at', 'asc');
    const items = rows.map((r) => ({
        id: r.id,
        name_ar: r.name_ar,
        address_ar: r.address_ar ?? null,
        phone: r.phone,
        opens_at: r.opens_at,
        closes_at: r.closes_at,
        is_host: Boolean(r.is_host),
        is_active: Boolean(r.is_active),
        created_at: r.created_at,
        updated_at: r.updated_at,
    }));
    return { items };
}
/**
 * @description إنشاء فرع جديد في النظام
 * @param {CreateBranchInput} input - بيانات الفرع الجديد
 * @returns {Promise<{ id: string; name_ar: string; is_host: boolean; is_active: boolean }>} بيانات الفرع الأساسية بعد الإنشاء
 */
async function createBranch(input) {
    const branchId = `br_${crypto_1.default.randomUUID()}`;
    await (0, query_1.default)('branches').insert({
        id: branchId,
        name_ar: input.name_ar,
        address_ar: input.address_ar ?? null,
        phone: input.phone,
        opens_at: input.opens_at,
        closes_at: input.closes_at,
        is_host: 0,
        is_active: 1,
    });
    return {
        id: branchId,
        name_ar: input.name_ar,
        is_host: false,
        is_active: true,
    };
}
/**
 * @description تعديل بيانات فرع مع حماية عدم تعطيل آخر فرع نشط
 * @param {string} id - معرّف الفرع المراد تعديله
 * @param {UpdateBranchInput} input - البيانات الجديدة للفرع
 * @returns {Promise<Branch>} بيانات الفرع المحدثة
 * @throws {AppError} 404 NOT_FOUND إذا لم يوجد الفرع
 * @throws {AppError} 400 VALIDATION_ERROR إذا كانت محاولة التعطيل ستترك النظام بدون فروع نشطة
 */
async function updateBranch(id, input) {
    const branch = await (0, query_1.default)('branches').where({ id }).first();
    if (!branch) {
        throw new error_handler_middleware_1.AppError('NOT_FOUND', 'الفرع غير موجود', 404);
    }
    // في حال طلب تعطيل الفرع، التحقق من وجود فرع نشط آخر على الأقل
    if (input.is_active === false && Boolean(branch.is_active)) {
        const activeCountResult = await (0, query_1.default)('branches')
            .where('is_active', 1)
            .whereNot('id', id)
            .count('id as count')
            .first();
        const otherActiveCount = Number(activeCountResult?.count ?? 0);
        if (otherActiveCount === 0) {
            throw new error_handler_middleware_1.AppError('VALIDATION_ERROR', 'لا يمكن تعطيل الفرع الوحيد النشط في النظام', 400, 'is_active');
        }
    }
    const updateData = {
        updated_at: query_1.default.raw("(datetime('now'))"),
    };
    if (input.name_ar !== undefined)
        updateData.name_ar = input.name_ar;
    if (input.address_ar !== undefined)
        updateData.address_ar = input.address_ar;
    if (input.phone !== undefined)
        updateData.phone = input.phone;
    if (input.opens_at !== undefined)
        updateData.opens_at = input.opens_at;
    if (input.closes_at !== undefined)
        updateData.closes_at = input.closes_at;
    if (input.is_active !== undefined)
        updateData.is_active = input.is_active ? 1 : 0;
    await (0, query_1.default)('branches').where({ id }).update(updateData);
    const updated = await (0, query_1.default)('branches').where({ id }).first();
    return {
        id: updated.id,
        name_ar: updated.name_ar,
        address_ar: updated.address_ar ?? null,
        phone: updated.phone,
        opens_at: updated.opens_at,
        closes_at: updated.closes_at,
        is_host: Boolean(updated.is_host),
        is_active: Boolean(updated.is_active),
        created_at: updated.created_at,
        updated_at: updated.updated_at,
    };
}
