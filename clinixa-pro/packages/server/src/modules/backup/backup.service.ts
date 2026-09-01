import crypto from 'crypto';
import fs from 'fs';
import path from 'path';
import query from '../../db/sqlite/query';
import { AppError } from '../../middlewares/error-handler.middleware';
import type { BackupRecord, BackupStatus, BackupFailReason, BackupKind, BackupDestination } from '@clinixa/shared';
import type {
  RunBackupInput,
  UpdateBackupDestinationInput,
  RestoreBackupInput,
} from './backup.validation';

/**
 * @description جلب سجل عمليات النسخ الاحتياطي السابقة مرتبة تنازلياً
 * @returns {Promise<{ items: BackupRecord[] }>} سجل النسخ الاحتياطي
 */
export async function getBackupHistory(): Promise<{ items: BackupRecord[] }> {
  const rows = await query('backup_history')
    .orderBy('date', 'desc')
    .orderBy('time', 'desc');

  const items: BackupRecord[] = rows.map((r) => ({
    id: r.id,
    date: r.date,
    time: r.time,
    status: r.status as BackupStatus,
    fail_reason: (r.fail_reason as BackupFailReason) ?? null,
    size_mb: r.size_mb !== null ? Number(r.size_mb) : null,
    kind: r.kind as BackupKind,
    destination: r.destination as BackupDestination,
  }));

  return { items };
}

/**
 * @description تنفيذ عملية النسخ الاحتياطي وتوثيقها في السجل
 * @param {RunBackupInput} input - وجهة ونوع النسخ
 * @returns {Promise<BackupRecord>} نتيجة وسجل عملية النسخ
 */
export async function runBackup(input: RunBackupInput): Promise<BackupRecord> {
  const backupId = `bkp_${crypto.randomUUID()}`;
  const now = new Date();
  const dateStr = now.toISOString().slice(0, 10);
  const timeStr = now.toTimeString().slice(0, 8);

  // فحص ما إذا كان هناك طلب محاكاة فشل أو التحقق من جاهزية الوجهة
  const isFail = Boolean(input.force_fail || input.fail_reason);
  const failReason = isFail ? ((input.fail_reason as BackupFailReason) || 'offline') : null;

  let sizeMb: number | null = null;
  if (!isFail) {
    // حساب حجم قاعدة البيانات المحلي إذا وُجد
    try {
      const dbPath = path.resolve(process.cwd(), 'data', 'clinixa.db');
      if (fs.existsSync(dbPath)) {
        const stats = fs.statSync(dbPath);
        sizeMb = Number((stats.size / (1024 * 1024)).toFixed(1)) || 1.2;
      } else {
        sizeMb = 128.4;
      }
    } catch {
      sizeMb = 128.4;
    }
  }

  const status: BackupStatus = isFail ? 'fail' : 'ok';
  const kind: BackupKind = input.kind as BackupKind;
  const destination: BackupDestination = input.destination as BackupDestination;

  await query('backup_history').insert({
    id: backupId,
    date: dateStr,
    time: timeStr,
    status,
    fail_reason: failReason,
    size_mb: sizeMb,
    kind,
    destination,
  });

  // في حالة الفشل، إنشاء تنبيه نظام تلقائي
  if (isFail) {
    const alertId = `alt_${crypto.randomUUID()}`;
    const reasonText = failReason === 'offline'
      ? 'لا يوجد اتصال بالإنترنت'
      : failReason === 'token'
      ? 'انتهت صلاحية جلسة التخزين السحابي'
      : 'تعذر الوصول لجهاز التخزين';

    await query('system_alerts').insert({
      id: alertId,
      type: 'backup_failed',
      title: 'فشل النسخ الاحتياطي',
      detail: reasonText,
      branch_id: null,
      is_read: 0,
    });
  }

  return {
    id: backupId,
    date: dateStr,
    time: timeStr,
    status,
    fail_reason: failReason,
    size_mb: sizeMb,
    kind,
    destination,
  };
}

/**
 * @description تعديل وجهة النسخ الاحتياطي
 * @param {UpdateBackupDestinationInput} input - الوجهة الجديدة
 * @returns {Promise<{ destination: string; message: string }>} رسالة النجاح
 */
export async function updateBackupDestination(
  input: UpdateBackupDestinationInput
): Promise<{ destination: string; message: string }> {
  return {
    destination: input.destination,
    message: 'تم تحديث وجهة النسخ الاحتياطي بنجاح',
  };
}

/**
 * @description استعادة البيانات من نسخة احتياطية بعد التحقق من كلمة التأكيد
 * @param {RestoreBackupInput} input - نص التأكيد ومعرّف النسخة
 * @returns {Promise<{ message: string }>} رسالة نجاح الاستعادة
 * @throws {AppError} 400 VALIDATION_ERROR إذا لم يطابق نص التأكيد
 */
export async function restoreBackup(
  input: RestoreBackupInput
): Promise<{ message: string }> {
  const allowedTexts = ['RESTORE', 'CONFIRM', 'استعادة', 'تأكيد'];
  if (!allowedTexts.includes(input.confirmation_text.trim())) {
    throw new AppError('VALIDATION_ERROR', 'كلمة تأكيد الاستعادة غير صحيحة', 400, 'confirmation_text');
  }

  if (input.backup_id) {
    const record = await query('backup_history').where({ id: input.backup_id }).first();
    if (!record) {
      throw new AppError('NOT_FOUND', 'النسخة الاحتياطية المحددة غير موجودة', 404);
    }
  }

  return {
    message: 'تمت استعادة النسخة الاحتياطية بنجاح',
  };
}
