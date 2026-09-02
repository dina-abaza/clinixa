"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getEmployees = getEmployees;
exports.createEmployee = createEmployee;
exports.updateEmployeePermissions = updateEmployeePermissions;
exports.resetEmployeePassword = resetEmployeePassword;
exports.toggleEmployeeActive = toggleEmployeeActive;
const crypto_1 = __importDefault(require("crypto"));
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const query_1 = __importDefault(require("../../db/sqlite/query"));
const error_handler_middleware_1 = require("../../middlewares/error-handler.middleware");
/**
 * @description توليد كلمة سر مؤقتة سهلة القراءة وآمنة (مثال: Xk7-Nq2-Wp9)
 * @returns {string} كلمة السر المؤقتة
 */
function generateTemporaryPassword() {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789';
    const getChunk = (len) => {
        let res = '';
        const bytes = crypto_1.default.randomBytes(len);
        for (let i = 0; i < len; i++) {
            res += chars[bytes[i] % chars.length];
        }
        return res;
    };
    return `${getChunk(3)}-${getChunk(3)}-${getChunk(3)}`;
}
/**
 * @description جلب قائمة الموظفين مع صلاحيات كل موظف
 * @param {string | null | undefined} branchId - فلتر اختياري بالفرع
 * @returns {Promise<{ items: FormattedEmployee[] }>} قائمة الموظفين
 */
async function getEmployees(branchId) {
    let q = (0, query_1.default)('employees').select('id', 'name_ar', 'username', 'role', 'branch_id', 'is_owner', 'is_active', 'created_at', 'updated_at');
    if (branchId) {
        q = q.where(function () {
            this.where('branch_id', branchId).orWhere('is_owner', 1);
        });
    }
    const rows = await q.orderBy('created_at', 'asc');
    // جلب الصلاحيات لجميع الموظفين المسترجعين
    const employeeIds = rows.map((r) => r.id);
    const permissionsRows = employeeIds.length > 0
        ? await (0, query_1.default)('employee_permissions')
            .whereIn('employee_id', employeeIds)
            .select('employee_id', 'permission_key')
        : [];
    const permissionsByEmp = new Map();
    for (const perm of permissionsRows) {
        const list = permissionsByEmp.get(perm.employee_id) || [];
        list.push(perm.permission_key);
        permissionsByEmp.set(perm.employee_id, list);
    }
    const items = rows.map((r) => ({
        id: r.id,
        name_ar: r.name_ar,
        username: r.username,
        role: r.role,
        branch_id: r.branch_id ?? null,
        is_owner: Boolean(r.is_owner),
        is_active: Boolean(r.is_active),
        permissions: permissionsByEmp.get(r.id) || [],
        created_at: r.created_at,
        updated_at: r.updated_at,
    }));
    return { items };
}
/**
 * @description إنشاء حساب موظف جديد مع كلمة سر مؤقتة وصلاحياته
 * @param {CreateEmployeeInput} input - بيانات الموظف والصلاحيات
 * @returns {Promise<{ id: string; name_ar: string; username: string; role: string; temporary_password: string }>} بيانات الموظف وكلمة السر المؤقتة
 * @throws {AppError} 409 CONFLICT في حال تكرار اسم المستخدم
 */
async function createEmployee(input) {
    const existing = await (0, query_1.default)('employees').where({ username: input.username }).first();
    if (existing) {
        throw new error_handler_middleware_1.AppError('CONFLICT', 'اسم المستخدم مسجل بالفعل لموظف آخر', 409, 'username');
    }
    const employeeId = `emp_${crypto_1.default.randomUUID()}`;
    const temporaryPassword = generateTemporaryPassword();
    const passwordHash = await bcryptjs_1.default.hash(temporaryPassword, 10);
    await query_1.default.transaction(async (trx) => {
        await trx('employees').insert({
            id: employeeId,
            name_ar: input.name_ar,
            username: input.username,
            password_hash: passwordHash,
            role: input.role,
            branch_id: input.branch_id ?? null,
            is_owner: 0,
            is_active: 1,
        });
        if (input.permissions && input.permissions.length > 0) {
            const permInserts = input.permissions.map((p) => ({
                id: `perm_${crypto_1.default.randomUUID()}`,
                employee_id: employeeId,
                permission_key: p,
            }));
            await trx('employee_permissions').insert(permInserts);
        }
    });
    return {
        id: employeeId,
        name_ar: input.name_ar,
        username: input.username,
        role: input.role,
        temporary_password: temporaryPassword,
    };
}
/**
 * @description تعديل صلاحيات موظف مع حماية حساب المالك
 * @param {string} id - معرّف الموظف
 * @param {UpdatePermissionsInput} input - قائمة الصلاحيات الجديدة
 * @returns {Promise<{ id: string; permissions: Permission[] }>} الصلاحيات المحدثة
 * @throws {AppError} 403 FORBIDDEN إذا كان الموظف هو المالك
 * @throws {AppError} 404 NOT_FOUND إذا لم يوجد الموظف
 */
async function updateEmployeePermissions(id, input) {
    const employee = await (0, query_1.default)('employees').where({ id }).first();
    if (!employee) {
        throw new error_handler_middleware_1.AppError('NOT_FOUND', 'الموظف غير موجود', 404);
    }
    // حماية حساب المالك من تعديل الصلاحيات
    if (employee.is_owner) {
        throw new error_handler_middleware_1.AppError('FORBIDDEN', 'مينفعش تعدّل صلاحيات حساب المالك', 403);
    }
    await query_1.default.transaction(async (trx) => {
        await trx('employee_permissions').where({ employee_id: id }).del();
        if (input.permissions.length > 0) {
            const permInserts = input.permissions.map((p) => ({
                id: `perm_${crypto_1.default.randomUUID()}`,
                employee_id: id,
                permission_key: p,
            }));
            await trx('employee_permissions').insert(permInserts);
        }
    });
    return {
        id,
        permissions: input.permissions,
    };
}
/**
 * @description إعادة تعيين كلمة السر لموظف وتوليد كلمة سر مؤقتة جديدة
 * @param {string} id - معرّف الموظف
 * @returns {Promise<{ id: string; temporary_password: string }>} كلمة السر المؤقتة الجديدة
 * @throws {AppError} 404 NOT_FOUND إذا لم يوجد الموظف
 */
async function resetEmployeePassword(id) {
    const employee = await (0, query_1.default)('employees').where({ id }).first();
    if (!employee) {
        throw new error_handler_middleware_1.AppError('NOT_FOUND', 'الموظف غير موجود', 404);
    }
    const temporaryPassword = generateTemporaryPassword();
    const passwordHash = await bcryptjs_1.default.hash(temporaryPassword, 10);
    await (0, query_1.default)('employees').where({ id }).update({
        password_hash: passwordHash,
        updated_at: query_1.default.raw("(datetime('now'))"),
    });
    return {
        id,
        temporary_password: temporaryPassword,
    };
}
/**
 * @description تفعيل أو تعطيل حساب موظف مع حماية حساب المالك من التعطيل
 * @param {string} id - معرّف الموظف
 * @param {ToggleActiveEmployeeInput} input - حالة التفعيل
 * @returns {Promise<{ id: string; is_active: boolean }>} الحالة المحدثة
 * @throws {AppError} 403 FORBIDDEN إذا كان الموظف هو المالك
 * @throws {AppError} 404 NOT_FOUND إذا لم يوجد الموظف
 */
async function toggleEmployeeActive(id, input) {
    const employee = await (0, query_1.default)('employees').where({ id }).first();
    if (!employee) {
        throw new error_handler_middleware_1.AppError('NOT_FOUND', 'الموظف غير موجود', 404);
    }
    // حماية حساب المالك من التعطيل
    if (employee.is_owner) {
        throw new error_handler_middleware_1.AppError('FORBIDDEN', 'مينفعش تعطّل حساب المالك', 403);
    }
    await (0, query_1.default)('employees').where({ id }).update({
        is_active: input.is_active ? 1 : 0,
        updated_at: query_1.default.raw("(datetime('now'))"),
    });
    return {
        id,
        is_active: input.is_active,
    };
}
