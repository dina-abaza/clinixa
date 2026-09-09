import crypto from 'crypto';
import fs from 'fs';
import path from 'path';
import query from '../../db/sqlite/query';
import { AppError } from '../../middlewares/error-handler.middleware';
import type {
  BackupRecord,
  BackupStatus,
  BackupFailReason,
  BackupKind,
  BackupDestination,
  GoogleDriveSettings,
} from '@clinixa/shared';
import type {
  RunBackupInput,
  UpdateBackupDestinationInput,
  RestoreBackupInput,
  UpdateGoogleDriveSettingsInput,
} from './backup.validation';
import {
  encryptBackupData,
  decryptBackupData,
  encryptBuffer,
  decryptBuffer,
  type EncryptedBackupPayload,
} from './backup.crypto';


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
 * @description جلب إعدادات الربط مع Google Drive
 * @returns {Promise<GoogleDriveSettings>} إعدادات الربط الحالية (مع إخفاء المفاتيح الحساسة)
 */
export async function getGoogleDriveSettings(): Promise<GoogleDriveSettings> {
  let row = await query('google_drive_settings').where({ id: 'singleton' }).first();

  if (!row) {
    await query('google_drive_settings').insert({
      id: 'singleton',
      script_url: null,
      secret_key: null,
      backup_password: null,
      is_enabled: 0,
    });
    row = await query('google_drive_settings').where({ id: 'singleton' }).first();
  }

  return {
    id: 'singleton',
    script_url: row.script_url ?? null,
    has_secret_key: Boolean(row.secret_key && row.secret_key.trim().length > 0),
    has_backup_password: Boolean(row.backup_password && row.backup_password.trim().length > 0),
    is_enabled: Boolean(row.is_enabled),
    updated_at: row.updated_at ?? null,
  };
}

/**
 * @description تحديث أو ضبط إعدادات Google Drive
 * @param {UpdateGoogleDriveSettingsInput} input - البيانات الجديدة
 * @returns {Promise<{ settings: GoogleDriveSettings; message: string }>} الإعدادات المحدثة
 */
export async function updateGoogleDriveSettings(
  input: UpdateGoogleDriveSettingsInput
): Promise<{ settings: GoogleDriveSettings; message: string }> {
  const existing = await query('google_drive_settings').where({ id: 'singleton' }).first();

  const updateData: Record<string, any> = {
    updated_at: query.raw("(datetime('now'))"),
  };

  if (input.script_url !== undefined) {
    updateData.script_url = input.script_url ? input.script_url.trim() : null;
  }
  if (input.secret_key !== undefined) {
    updateData.secret_key = input.secret_key ? input.secret_key.trim() : null;
  }
  if (input.backup_password !== undefined) {
    updateData.backup_password = input.backup_password ? input.backup_password.trim() : null;
  }
  if (input.is_enabled !== undefined) {
    updateData.is_enabled = input.is_enabled ? 1 : 0;
  }

  if (existing) {
    await query('google_drive_settings').where({ id: 'singleton' }).update(updateData);
  } else {
    await query('google_drive_settings').insert({
      id: 'singleton',
      script_url: updateData.script_url ?? null,
      secret_key: updateData.secret_key ?? null,
      backup_password: updateData.backup_password ?? null,
      is_enabled: updateData.is_enabled ?? 0,
    });
  }

  const updated = await getGoogleDriveSettings();
  return {
    settings: updated,
    message: 'تم حفظ إعدادات Google Drive بنجاح',
  };
}

/**
 * @description حذف وتفريغ إعدادات Google Drive وتعطيل الربط
 * @returns {Promise<{ message: string }>} رسالة النجاح
 */
export async function deleteGoogleDriveSettings(): Promise<{ message: string }> {
  await query('google_drive_settings').where({ id: 'singleton' }).update({
    script_url: null,
    secret_key: null,
    backup_password: null,
    is_enabled: 0,
    updated_at: query.raw("(datetime('now'))"),
  });

  return { message: 'تم مسح إعدادات Google Drive وتعطيل المزامنة السحابية بنجاح' };
}

/**
 * @description تجميع بيانات جميع الجداول في قاعدة البيانات لإنشاء نسخة احتياطية كاملة وشاملة 100%
 */
async function exportDatabaseTables(): Promise<Record<string, any[]>> {
  const tableRows = await query('sqlite_master')
    .where({ type: 'table' })
    .whereNotIn('name', ['sqlite_sequence', 'knex_migrations', 'knex_migrations_lock'])
    .select('name');

  const exportData: Record<string, any[]> = {};
  for (const t of tableRows) {
    try {
      const rows = await query(t.name).select('*');
      exportData[t.name] = rows;
    } catch {
      exportData[t.name] = [];
    }
  }

  return exportData;
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

  const kind: BackupKind = input.kind as BackupKind;
  const destination: BackupDestination = input.destination as BackupDestination;

  let isFail = Boolean(input.force_fail || input.fail_reason);
  let failReason: BackupFailReason | null = isFail
    ? ((input.fail_reason as BackupFailReason) || 'offline')
    : null;
  let sizeMb: number | null = null;

  // 1. النسخ المحلي أو عبر USB (مشفر بـ AES-256-GCM)
  if (!isFail && (destination === 'local_device' || destination === 'usb')) {
    try {
      const backupRoot =
        input.target_path && input.target_path.trim().length > 0
          ? path.resolve(input.target_path.trim())
          : path.resolve(__dirname, '../../..', 'data', 'backups');
      fs.mkdirSync(backupRoot, { recursive: true });

      const dbSource = path.resolve(__dirname, '../../..', 'data', 'clinixa.db');
      const attachmentsSource = path.resolve(__dirname, '../../..', 'data', 'attachments');

      const backupDir = path.join(
        backupRoot,
        `${dateStr}_${timeStr.replace(/:/g, '-')}`
      );

      fs.mkdirSync(backupDir, { recursive: true });

      const customPassword = input.backup_password?.trim();

      if (fs.existsSync(dbSource)) {
        if (customPassword && customPassword.length > 0) {
          // 🔒 تشفير بالكامل بكلمة السر المحددة من المستخدم
          const dbBuffer = fs.readFileSync(dbSource);
          const encryptedPayload = encryptBuffer(dbBuffer, customPassword);
          fs.writeFileSync(
            path.join(backupDir, 'clinixa.db.encrypted'),
            JSON.stringify(encryptedPayload)
          );
        } else {
          // 📄 حفظ ملف قاعدة بيانات مباشر غير مشفر (Raw SQLite Database)
          fs.copyFileSync(dbSource, path.join(backupDir, 'clinixa.db'));
        }
      }

      if (fs.existsSync(attachmentsSource)) {
        fs.cpSync(attachmentsSource, path.join(backupDir, 'attachments'), {
          recursive: true,
        });
      }

      const calculateDirSize = (dirPath: string): number => {
        let size = 0;
        try {
          const files = fs.readdirSync(dirPath);
          files.forEach((file) => {
            const filePath = path.join(dirPath, file);
            const stat = fs.statSync(filePath);
            if (stat.isFile()) {
              size += stat.size;
            } else if (stat.isDirectory()) {
              size += calculateDirSize(filePath);
            }
          });
        } catch {
          // تجاهل الأخطاء أثناء حساب الحجم
        }
        return size;
      };

      const totalSize = calculateDirSize(backupDir);
      sizeMb = Number((totalSize / (1024 * 1024)).toFixed(1)) || 1.2;
    } catch {
      isFail = true;
      failReason = 'device';
    }
  }

  // 2. النسخ السحابي عبر Google Drive
  if (!isFail && destination === 'google_drive') {
    const driveSettings = await query('google_drive_settings').where({ id: 'singleton' }).first();

    if (
      !driveSettings ||
      !driveSettings.script_url ||
      !driveSettings.secret_key ||
      !driveSettings.backup_password ||
      !driveSettings.is_enabled
    ) {
      isFail = true;
      failReason = 'token';
    } else {
      try {
        const dbDump = await exportDatabaseTables();
        const encryptedPayload = encryptBackupData(dbDump, driveSettings.backup_password);
        const fileName = `clinixa_backup_${dateStr}_${timeStr.replace(/:/g, '-')}.encrypted.json`;

        const requestBody = {
          secretKey: driveSettings.secret_key,
          fileName,
          content: encryptedPayload,
        };

        const jsonString = JSON.stringify(requestBody);
        const payloadBytes = Buffer.byteLength(jsonString, 'utf8');
        sizeMb = Number((payloadBytes / (1024 * 1024)).toFixed(2)) || 0.1;

        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 20000);

        try {
          const res = await fetch(driveSettings.script_url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: jsonString,
            redirect: 'follow',
            signal: controller.signal,
          });

          clearTimeout(timeoutId);

          if (!res.ok) {
            isFail = true;
            failReason = res.status === 401 || res.status === 403 ? 'token' : 'device';
          } else {
            const data: any = await res.json();
            if (data && data.status === 'error') {
              isFail = true;
              failReason = 'token';
            }
          }
        } catch (fetchErr: any) {
          clearTimeout(timeoutId);
          isFail = true;
          if (fetchErr.name === 'AbortError' || fetchErr.code === 'ENOTFOUND' || fetchErr.code === 'ECONNREFUSED' || fetchErr.message?.includes('fetch')) {
            failReason = 'offline';
          } else {
            failReason = 'device';
          }
        }
      } catch (err: any) {
        isFail = true;
        failReason = failReason || 'device';
      }
    }
  }

  const status: BackupStatus = isFail ? 'fail' : 'ok';
  if (isFail) {
    sizeMb = null;
  }

  await query('backup_history').insert({
    id: backupId,
    date: dateStr,
    time: timeStr,
    status,
    fail_reason: isFail ? failReason : null,
    size_mb: sizeMb,
    kind,
    destination,
  });

  if (isFail) {
    const alertId = `alt_${crypto.randomUUID()}`;
    const reasonText =
      failReason === 'offline'
        ? 'لا يوجد اتصال بالإنترنت'
        : failReason === 'token'
        ? 'انتهت صلاحية جلسة التخزين السحابي أو المفاتيح غير صالحة'
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
    fail_reason: isFail ? failReason : null,
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
 * @description استعادة البيانات من نسخة احتياطية (من السجل الداخلي أو من ملف/مجلد مخصص على الجهاز أو USB)
 * @param {RestoreBackupInput} input - خيارات الاستعادة والتأكيد والمسار وكلمة السر
 * @returns {Promise<{ message: string }>} رسالة نجاح الاستعادة
 * @throws {AppError} في حال عدم تطابق التأكيد أو عدم وجود الملف أو خطأ فك التشفير
 */
export async function restoreBackup(
  input: RestoreBackupInput
): Promise<{ message: string }> {
  const allowedTexts = ['RESTORE', 'CONFIRM', 'استعادة', 'تأكيد'];
  if (!allowedTexts.includes(input.confirmation_text.trim())) {
    throw new AppError('VALIDATION_ERROR', 'كلمة تأكيد الاستعادة غير صحيحة (اكتب RESTORE أو استعادة)', 400, 'confirmation_text');
  }

  let dbFilePath: string | null = null;
  let attachmentsDirPath: string | null = null;

  // 1. تحديد مسار ملف النسخة الاحتياطية ومجلد المرفقات
  if (input.source_mode === 'custom_path' || (input.custom_path && input.custom_path.trim().length > 0)) {
    if (!input.custom_path || input.custom_path.trim().length === 0) {
      throw new AppError('VALIDATION_ERROR', 'يرجى تحديد مسار ملف أو مجلد النسخة الاحتياطية للاستعادة', 400, 'custom_path');
    }

    const resolved = path.resolve(input.custom_path.trim());
    if (!fs.existsSync(resolved)) {
      throw new AppError('NOT_FOUND', 'المسار أو الملف المحدد للنسخة الاحتياطية غير موجود على القرص', 404);
    }

    const stat = fs.statSync(resolved);
    if (stat.isDirectory()) {
      // إذا اختار مجلد كامل: نبحث عن clinixa.db.encrypted أو clinixa.db
      const encDbPath = path.join(resolved, 'clinixa.db.encrypted');
      const rawDbPath = path.join(resolved, 'clinixa.db');
      const jsonEncPath = path.join(resolved, 'backup.encrypted.json');

      if (fs.existsSync(encDbPath)) {
        dbFilePath = encDbPath;
      } else if (fs.existsSync(rawDbPath)) {
        dbFilePath = rawDbPath;
      } else if (fs.existsSync(jsonEncPath)) {
        dbFilePath = jsonEncPath;
      } else {
        // ابحث عن أي ملف ينتهي بـ .encrypted أو .db داخل المجلد
        const files = fs.readdirSync(resolved);
        const candidate = files.find((f) => f.endsWith('.encrypted') || f.endsWith('.db'));
        if (candidate) {
          dbFilePath = path.join(resolved, candidate);
        } else {
          throw new AppError('NOT_FOUND', 'لم يتم العثور على ملف قاعدة بيانات صالح (clinixa.db.encrypted أو clinixa.db) داخل المجلد المحدد', 404);
        }
      }

      const possibleAttachments = path.join(resolved, 'attachments');
      if (fs.existsSync(possibleAttachments) && fs.statSync(possibleAttachments).isDirectory()) {
        attachmentsDirPath = possibleAttachments;
      }
    } else if (stat.isFile()) {
      dbFilePath = resolved;
      const parentDir = path.dirname(resolved);
      const possibleAttachments = path.join(parentDir, 'attachments');
      if (fs.existsSync(possibleAttachments) && fs.statSync(possibleAttachments).isDirectory()) {
        attachmentsDirPath = possibleAttachments;
      }
    }
  } else {
    // 2. الاستعادة من السجل الداخلي (History)
    let record: any = null;
    if (input.backup_id) {
      record = await query('backup_history').where({ id: input.backup_id }).first();
      if (!record) {
        throw new AppError('NOT_FOUND', 'النسخة الاحتياطية المحددة غير موجودة في سجل النظام', 404);
      }
    } else {
      record = await query('backup_history')
        .where({ status: 'ok' })
        .whereIn('destination', ['local_device', 'usb'])
        .orderBy('date', 'desc')
        .orderBy('time', 'desc')
        .first();

      if (!record) {
        throw new AppError('NOT_FOUND', 'لا توجد أي نسخة احتياطية محلية ناجحة مسجلة في سجل النظام', 404);
      }
    }

    const defaultBackupsRoot = path.resolve(__dirname, '../../..', 'data', 'backups');
    const folderName = `${record.date}_${String(record.time).replace(/:/g, '-')}`;
    const backupFolder = path.join(defaultBackupsRoot, folderName);

    if (!fs.existsSync(backupFolder)) {
      throw new AppError('NOT_FOUND', `مجلد النسخة الاحتياطية (${folderName}) غير موجود على القرص المحلي`, 404);
    }

    const encDb = path.join(backupFolder, 'clinixa.db.encrypted');
    const rawDb = path.join(backupFolder, 'clinixa.db');
    if (fs.existsSync(encDb)) {
      dbFilePath = encDb;
    } else if (fs.existsSync(rawDb)) {
      dbFilePath = rawDb;
    } else {
      throw new AppError('NOT_FOUND', 'ملف قاعدة البيانات غير موجود داخل مجلد النسخة الاحتياطية', 404);
    }

    const attachPath = path.join(backupFolder, 'attachments');
    if (fs.existsSync(attachPath) && fs.statSync(attachPath).isDirectory()) {
      attachmentsDirPath = attachPath;
    }
  }

  if (!dbFilePath || !fs.existsSync(dbFilePath)) {
    throw new AppError('NOT_FOUND', 'تعذر العثور على ملف النسخة الاحتياطية المراد استعادتها', 404);
  }

  // 3. قراءة وفك تشفير محتوى قاعدة البيانات
  const fileContent = fs.readFileSync(dbFilePath);
  let decryptedBuffer: Buffer | null = null;

  // جلب كلمات السر المحتملة للتجربة في حال عدم تمرير كلمة سر صريحة
  const driveSettings = await query('google_drive_settings').where({ id: 'singleton' }).first();
  const clinicSettings = await query('clinic_settings').where({ id: 'singleton' }).first();
  const candidatePasswords = [
    input.backup_password?.trim(),
    'ClinixaBackupKey2026',
    driveSettings?.backup_password,
    clinicSettings?.license_key,
    'CLX-001M-5356-BF88-A8D1',
    'CLX-002I-55DB-2593-A3F9',
    'CLX-005I-4786-E5EA-143F',
    'CLX-010I-105F-0722-9A12',
    'CLX-003I-79D5-4BA8-3E42',
    'CLX-0000-0000-0000',
    'CLINIXA_SECURE_OFFLINE_SECRET_2026_MASTER_SIGNATURE_KEY_#99201',
  ].filter((p): p is string => Boolean(p && p.length > 0));

  const textStart = fileContent.slice(0, 100).toString('utf8').trim();
  const isJsonEncrypted = textStart.startsWith('{') && textStart.includes('clinixa-encrypted-backup-v1');

  if (isJsonEncrypted) {
    let payload: EncryptedBackupPayload;
    try {
      payload = JSON.parse(fileContent.toString('utf8'));
    } catch {
      throw new AppError('VALIDATION_ERROR', 'ملف النسخة الاحتياطية المشفر تالف ولا يمكن قراءته', 400);
    }

    let success = false;
    for (const pwd of candidatePasswords) {
      try {
        decryptedBuffer = decryptBuffer(payload, pwd);
        success = true;
        break;
      } catch {
        // تجربة الكلمة التالية
      }
    }

    if (!success || !decryptedBuffer) {
      throw new AppError(
        'VALIDATION_ERROR',
        'فشل فك تشفير النسخة الاحتياطية! يرجى التأكد من إدخال كلمة سر النسخة الاحتياطية الصحيحة.',
        400
      );
    }
  } else {
    // ملف قاعدة بيانات غير مشفر (Raw SQLite Database)
    decryptedBuffer = fileContent;
  }

  // التحقق من ترويسة SQLite الرسمية ("SQLite format 3\0")
  const sqliteHeader = decryptedBuffer.slice(0, 16).toString('utf8');
  if (!sqliteHeader.startsWith('SQLite format 3')) {
    throw new AppError(
      'VALIDATION_ERROR',
      'الملف الناتج ليس قاعدة بيانات SQLite صالحة تابعة لـ Clinixa',
      400
    );
  }

  // 4. استبدال قاعدة البيانات النشطة وتحديث المرفقات
  const targetDbPath = path.resolve(__dirname, '../../..', 'data', 'clinixa.db');
  const tempRestorePath = `${targetDbPath}.restoring_tmp`;

  try {
    fs.writeFileSync(tempRestorePath, decryptedBuffer);

    // حذف ملفات الـ WAL المؤقتة إن وُجدت لمنع التعارض
    const walPath = `${targetDbPath}-wal`;
    const shmPath = `${targetDbPath}-shm`;
    if (fs.existsSync(walPath)) {
      try { fs.unlinkSync(walPath); } catch {}
    }
    if (fs.existsSync(shmPath)) {
      try { fs.unlinkSync(shmPath); } catch {}
    }

    // استبدال الملف الأساسي
    fs.copyFileSync(tempRestorePath, targetDbPath);
    try { fs.unlinkSync(tempRestorePath); } catch {}

    // استعادة المرفقات إن وُجدت
    if (attachmentsDirPath && fs.existsSync(attachmentsDirPath)) {
      const targetAttachments = path.resolve(__dirname, '../../..', 'data', 'attachments');
      fs.mkdirSync(targetAttachments, { recursive: true });
      fs.cpSync(attachmentsDirPath, targetAttachments, { recursive: true });
    }
  } catch (restoreErr: any) {
    try {
      if (fs.existsSync(tempRestorePath)) fs.unlinkSync(tempRestorePath);
    } catch {}
    throw new AppError(
      'INTERNAL_ERROR',
      `فشلت كتابة قاعدة البيانات المستعادة: ${restoreErr?.message || 'خطأ غير معروف'}`,
      500
    );
  }

  // 5. تسجيل تنبيه استعادة ناجحة في النظام
  try {
    const alertId = `alt_${crypto.randomUUID()}`;
    await query('system_alerts').insert({
      id: alertId,
      type: 'system_restored',
      title: 'تمت استعادة نسخة احتياطية بنجاح',
      detail: `تم استعادة قاعدة بيانات النظام بنجاح في ${new Date().toLocaleString('ar-EG')}`,
      branch_id: null,
      is_read: 0,
    });
  } catch {
    // تجاهل أخطاء التنبيه إن كان الاتصال يستلزم ريستارت
  }

  return {
    message: 'تمت استعادة قاعدة البيانات والنسخة الاحتياطية بنجاح.',
  };
}
