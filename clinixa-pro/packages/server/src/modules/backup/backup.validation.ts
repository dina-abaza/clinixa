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
  target_path: z.string().trim().optional(),
  backup_password: z.string().trim().optional(),
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
 * @description سكيمة التحقق لضبط وتحديث إعدادات Google Drive
 */
export const updateGoogleDriveSettingsSchema = z.object({
  script_url: z.string().url('عنوان رابط Google Script غير صالح').nullable().optional(),
  secret_key: z.string().min(1, 'مفتاح الأمان السري لا يمكن أن يكون فارغاً').nullable().optional(),
  backup_password: z.string().min(4, 'كلمة سر التشفير يجب أن تكون 4 أحرف على الأقل').nullable().optional(),
  is_enabled: z.boolean().optional(),
});

export type UpdateGoogleDriveSettingsInput = z.infer<typeof updateGoogleDriveSettingsSchema>;

/** @description سكيمة التحقق لتحديث جدولة النسخ الاحتياطي لوجهة واحدة */
export const updateBackupScheduleSchema = z
  .object({
    destination: z.enum(['local_device', 'google_drive']),
    is_enabled: z.boolean(),
    frequency: z.enum(['minutely', 'hourly', 'daily', 'weekly']),
    time: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, 'الوقت يجب أن يكون بصيغة HH:mm'),
    day_of_week: z.number().int().min(0).max(6).nullable().optional(),
    target_path: z.string().trim().nullable().optional(),
    backup_password: z.string().trim().min(4, 'كلمة السر يجب أن تكون 4 أحرف على الأقل').nullable().optional(),
  })
  .superRefine((value, context) => {
    if (value.frequency === 'weekly' && value.day_of_week == null) {
      context.addIssue({ code: 'custom', path: ['day_of_week'], message: 'اختر يوم الأسبوع للجدولة الأسبوعية' });
    }
  });

export type UpdateBackupScheduleInput = z.infer<typeof updateBackupScheduleSchema>;

/**
 * @description سكيمة التحقق لطلب استعادة النسخة الاحتياطية
 */
export const restoreBackupSchema = z.object({
  confirmation_text: z.string({ message: 'نص تأكيد الاستعادة مطلوب' }),
  source_mode: z.enum(['history', 'custom_path', 'google_drive']).default('history'),
  backup_id: z.string().optional(),
  custom_path: z.string().trim().optional(),
  backup_password: z.string().optional(),
  google_drive_file_id: z.string().trim().optional(),
});

export type RestoreBackupInput = z.infer<typeof restoreBackupSchema>;

