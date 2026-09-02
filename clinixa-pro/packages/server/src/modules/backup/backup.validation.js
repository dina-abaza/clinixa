"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.restoreBackupSchema = exports.updateBackupDestinationSchema = exports.runBackupSchema = void 0;
const zod_1 = require("zod");
const shared_1 = require("@clinixa/shared");
/**
 * @description سكيمة التحقق لتشغيل النسخ الاحتياطي
 */
exports.runBackupSchema = zod_1.z.object({
    destination: zod_1.z.enum(shared_1.BACKUP_DESTINATION, {
        message: 'اختار مكان النسخ الاحتياطي الأول',
    }),
    kind: zod_1.z.enum(shared_1.BACKUP_KIND).default('manual'),
    fail_reason: zod_1.z.enum(shared_1.BACKUP_FAIL_REASON).optional(),
    force_fail: zod_1.z.boolean().optional(),
});
/**
 * @description سكيمة التحقق لتعديل وجهة النسخ الاحتياطي الافتراضية
 */
exports.updateBackupDestinationSchema = zod_1.z.object({
    destination: zod_1.z.enum(shared_1.BACKUP_DESTINATION, {
        message: 'وجهة النسخ الاحتياطي غير صالحة',
    }),
});
/**
 * @description سكيمة التحقق لطلب استعادة النسخة الاحتياطية
 */
exports.restoreBackupSchema = zod_1.z.object({
    confirmation_text: zod_1.z.string({ message: 'نص تأكيد الاستعادة مطلوب' }),
    backup_id: zod_1.z.string().optional(),
});
