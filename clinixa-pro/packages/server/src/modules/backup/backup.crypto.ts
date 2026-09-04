import crypto from 'crypto';
import { AppError } from '../../middlewares/error-handler.middleware';

/**
 * @description واجهة بيانات النسخة الاحتياطية المشفرة
 */
export interface EncryptedBackupPayload {
  format: 'clinixa-encrypted-backup-v1';
  cipher: 'aes-256-gcm';
  salt: string;    // Base64
  iv: string;      // Base64
  authTag: string; // Base64
  data: string;    // Base64 (ciphertext)
  meta: {
    app: 'clinixa';
    createdAt: string;
  };
}

/**
 * @description تشفير كائن أو بيانات النسخة الاحتياطية باستخدام AES-256-GCM واشتقاق المفتاح بـ PBKDF2
 * @param {unknown} data - البيانات المراد تشفيرها (كائن، مصفوفة، نص)
 * @param {string} password - كلمة سر التشفير
 * @returns {EncryptedBackupPayload} الكائن المشفر النهائي
 */
export function encryptBackupData(data: unknown, password: string): EncryptedBackupPayload {
  if (!password || typeof password !== 'string' || password.trim().length === 0) {
    throw new AppError('VALIDATION_ERROR', 'كلمة سر تشفير النسخة الاحتياطية مطلوبة', 400);
  }

  const salt = crypto.randomBytes(16);
  const iv = crypto.randomBytes(12); // Standard 96-bit IV for GCM

  // اشتقاق مفتاح 256 بت باستخدام PBKDF2
  const key = crypto.pbkdf2Sync(password, salt, 100000, 32, 'sha256');

  const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);

  const jsonStr = typeof data === 'string' ? data : JSON.stringify(data);
  let encrypted = cipher.update(jsonStr, 'utf8', 'base64');
  encrypted += cipher.final('base64');

  const authTag = cipher.getAuthTag();

  return {
    format: 'clinixa-encrypted-backup-v1',
    cipher: 'aes-256-gcm',
    salt: salt.toString('base64'),
    iv: iv.toString('base64'),
    authTag: authTag.toString('base64'),
    data: encrypted,
    meta: {
      app: 'clinixa',
      createdAt: new Date().toISOString(),
    },
  };
}

/**
 * @description فك تشفير النسخة الاحتياطية والتحقق من صحتها بكلمة السر
 * @param {EncryptedBackupPayload} payload - الحزمة المشفرة
 * @param {string} password - كلمة سر فك التشفير
 * @returns {any} البيانات الأصلية بعد فك التشفير
 * @throws {AppError} 400 في حال عدم صحة كلمة السر أو تلف البيانات
 */
export function decryptBackupData(payload: EncryptedBackupPayload, password: string): any {
  if (!payload || payload.format !== 'clinixa-encrypted-backup-v1' || payload.cipher !== 'aes-256-gcm') {
    throw new AppError('VALIDATION_ERROR', 'صيغة النسخة الاحتياطية المشفرة غير صالحة', 400);
  }

  if (!password || typeof password !== 'string') {
    throw new AppError('VALIDATION_ERROR', 'كلمة سر فك التشفير مطلوبة', 400);
  }

  try {
    const salt = Buffer.from(payload.salt, 'base64');
    const iv = Buffer.from(payload.iv, 'base64');
    const authTag = Buffer.from(payload.authTag, 'base64');

    const key = crypto.pbkdf2Sync(password, salt, 100000, 32, 'sha256');

    const decipher = crypto.createDecipheriv('aes-256-gcm', key, iv);
    decipher.setAuthTag(authTag);

    let decrypted = decipher.update(payload.data, 'base64', 'utf8');
    decrypted += decipher.final('utf8');

    try {
      return JSON.parse(decrypted);
    } catch {
      return decrypted;
    }
  } catch (err) {
    throw new AppError('VALIDATION_ERROR', 'كلمة سر فك التشفير غير صحيحة أو البيانات تالفة', 400);
  }
}

/**
 * @description تشفير ملف باينري (Binary Buffer) مثل ملف قاعدة البيانات SQLite
 * @param {Buffer} buffer - محتوى الملف
 * @param {string} password - كلمة سر التشفير
 * @returns {EncryptedBackupPayload} الحزمة المشفرة
 */
export function encryptBuffer(buffer: Buffer, password: string): EncryptedBackupPayload {
  if (!password || typeof password !== 'string' || password.trim().length === 0) {
    throw new AppError('VALIDATION_ERROR', 'كلمة سر تشفير النسخة الاحتياطية مطلوبة', 400);
  }

  const salt = crypto.randomBytes(16);
  const iv = crypto.randomBytes(12);

  const key = crypto.pbkdf2Sync(password, salt, 100000, 32, 'sha256');
  const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);

  const encrypted = Buffer.concat([cipher.update(buffer), cipher.final()]);
  const authTag = cipher.getAuthTag();

  return {
    format: 'clinixa-encrypted-backup-v1',
    cipher: 'aes-256-gcm',
    salt: salt.toString('base64'),
    iv: iv.toString('base64'),
    authTag: authTag.toString('base64'),
    data: encrypted.toString('base64'),
    meta: {
      app: 'clinixa',
      createdAt: new Date().toISOString(),
    },
  };
}

/**
 * @description فك تشفير ملف باينري (Binary Buffer)
 * @param {EncryptedBackupPayload} payload - الحزمة المشفرة
 * @param {string} password - كلمة سر فك التشفير
 * @returns {Buffer} محتوى الملف الأصلي بعد فك التشفير
 */
export function decryptBuffer(payload: EncryptedBackupPayload, password: string): Buffer {
  if (!payload || payload.format !== 'clinixa-encrypted-backup-v1' || payload.cipher !== 'aes-256-gcm') {
    throw new AppError('VALIDATION_ERROR', 'صيغة النسخة الاحتياطية المشفرة غير صالحة', 400);
  }

  if (!password || typeof password !== 'string') {
    throw new AppError('VALIDATION_ERROR', 'كلمة سر فك التشفير مطلوبة', 400);
  }

  try {
    const salt = Buffer.from(payload.salt, 'base64');
    const iv = Buffer.from(payload.iv, 'base64');
    const authTag = Buffer.from(payload.authTag, 'base64');

    const key = crypto.pbkdf2Sync(password, salt, 100000, 32, 'sha256');
    const decipher = crypto.createDecipheriv('aes-256-gcm', key, iv);
    decipher.setAuthTag(authTag);

    const ciphertext = Buffer.from(payload.data, 'base64');
    return Buffer.concat([decipher.update(ciphertext), decipher.final()]);
  } catch {
    throw new AppError('VALIDATION_ERROR', 'كلمة سر فك التشفير غير صحيحة أو البيانات تالفة', 400);
  }
}
