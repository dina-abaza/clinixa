"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.resolveBranchId = resolveBranchId;
const query_1 = __importDefault(require("../../db/sqlite/query"));
const error_handler_middleware_1 = require("../../middlewares/error-handler.middleware");
/**
 * @description دالة استنتاج الفرع النشط (Branch ID)
 * لو الموظف مالك (branch_id = null)، يتم التوجيه تلقائياً إلى الفرع المضيف (Host Branch)
 * @param {string | null | undefined} branchId - معرّف الفرع إن وجد
 * @returns {Promise<string>} معرّف الفرع الصالح
 * @throws {AppError} 404 NOT_FOUND إذا لم يوجد أي فرع في النظام
 */
async function resolveBranchId(branchId) {
    if (branchId)
        return branchId;
    const hostBranch = await (0, query_1.default)('branches')
        .where({ is_host: 1, is_active: 1 })
        .select('id')
        .first();
    if (hostBranch)
        return hostBranch.id;
    const firstBranch = await (0, query_1.default)('branches')
        .where({ is_active: 1 })
        .select('id')
        .first();
    if (firstBranch)
        return firstBranch.id;
    throw new error_handler_middleware_1.AppError('NOT_FOUND', 'لم يتم العثور على أي فرع نشط في النظام', 404);
}
