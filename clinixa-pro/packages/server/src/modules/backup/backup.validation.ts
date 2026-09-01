import { z } from 'zod';
import { BACKUP_DESTINATION, BACKUP_KIND, BACKUP_FAIL_REASON } from '@clinixa/shared';

/**
 * @description سكيمة التحقق لتشغيل النسخ الاحتياطي
 */
export const runBackupSchema = z.object({
  destination: z.enum(BACKUP_DESTINATION, {
    message: 'اختار مكان النسخ الاحتياطي الأول',
  }),
  kind: z.enum(BACKUP_KIND).default('manual'),
  fail_reason: z.enum(BACKUP_FAIL_REASON).optional(),
  force_fail: z.boolean().optional(),
});

export type RunBackupInput = z.infer<typeof runBackupSchema>;

/**
 * @description سكيمة التحقق لتعديل وجهة النسخ الاحتياطي الافتراضية
 */
export const updateBackupDestinationSchema = z.object({
  destination: z.enum(BACKUP_DESTINATION, {
    message: 'وجهة النسخ الاحتياطي غير صالحة',
  }),
});

export type UpdateBackupDestinationInput = z.infer<typeof updateBackupDestinationSchema>;

/**
 * @description سكيمة التحقق لطلب استعادة النسخة الاحتياطية
 */
export const restoreBackupSchema = z.object({
  confirmation_text: z.string({ message: 'نص تأكيد الاستعادة مطلوب' }),
  backup_id: z.string().optional(),
});

export type RestoreBackupInput = z.infer<typeof restoreBackupSchema>;
