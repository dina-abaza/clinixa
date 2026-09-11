/**
 * @fileoverview تحميل وفحص متغيرات البيئة باستخدام Zod
 * @description يُحمِّل الـ .env ويتحقق من وجود وصحة كل متغير حرج عند تشغيل السيرفر
 *              أي متغير مطلوب غير موجود أو غير صالح → يُطلق استثناءً فورياً لبيئة التشغيل (Fail-Fast)
 */

import * as dotenv from 'dotenv';
import * as path from 'path';
import * as fs from 'fs';
import { z } from 'zod';

// لا تُحمّل .env في production؛ لأن Electron يمرّر المتغيرات من process.env
// وملف .env ممكن أن يُعيد NODE_ENV إلى development ويشوه مسار المهاجرات.
const isProduction = (process.env.NODE_ENV || '').toLowerCase() === 'production';

if (!isProduction) {
  // حاول العثور على ملف .env في بيئات التطوير وداخل الحزمة المعبأة.
  const appPath = process.env.CLINIXA_APP_PATH || process.cwd();
  const envCandidates = [
    path.resolve(appPath, 'packages/server/.env'),
    path.resolve(appPath, 'server/.env'),
    path.resolve(process.cwd(), 'packages/server/.env'),
    path.resolve(process.cwd(), '.env'),
    path.resolve(__dirname, '../../.env'),
    path.resolve(__dirname, '../../../../.env'),
    path.resolve(__dirname, '../../../../../.env'),
  ];

  const envPath = envCandidates.find((candidate) => fs.existsSync(candidate));
  if (envPath) {
    dotenv.config({ path: envPath });
  }
}

/**
 * @description سكيمة التحقق لمتغيرات البيئة باستخدام Zod
 */
const envSchema = z.object({
  // ── عام ──────────────────────────────────────────
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().default(4321),

  // ── قاعدة البيانات المحلية ────────────────────
  SQLITE_DB_PATH: z.string().min(1, 'مسار قاعدة البيانات مطلوبة').default('./data/clinixa.db'),

  // ── المصادقة ──────────────────────────────────
  JWT_SECRET: z.string().min(1, 'JWT_SECRET مطلوب لأمان التطبيق').default('clinixa_secret_key_for_testing_and_development_123456789'),
  JWT_EXPIRES_IN: z.string().default('12h'),
  BCRYPT_SALT_ROUNDS: z.coerce.number().default(10),

  // ── الملفات ───────────────────────────────────
  UPLOADS_DIR: z.string().default('./data/attachments'),
  MAX_UPLOAD_SIZE_MB: z.coerce.number().default(20),

  // ── النسخ الاحتياطي ───────────────────────────
  BACKUP_LOCAL_DIR: z.string().default('./data/backups'),

  // ── المزامنة ───────────────────────────────────
  MONGODB_URI: z.string().default(''),
  SYNC_ENABLED: z.enum(['true', 'false']).default('false').transform((v) => v === 'true'),
  SYNC_POLL_INTERVAL_MS: z.coerce.number().default(30000),
  SYNC_MAX_ATTEMPTS: z.coerce.number().default(5),

  // ── CORS ──────────────────────────────────────
  CORS_ORIGIN: z.string().default('http://localhost:5173'),
});

/**
 * @description دالة تحليل والتحقق من متغيرات البيئة وقت التشغيل
 * @returns كائن الإعدادات المفحوص بنجاح
 * @throws {Error} في حال فشل الفحص لمتغيرات بيئية حجة
 */
const parseEnv = () => {
  const result = envSchema.safeParse(process.env);

  if (!result.success) {
    console.error('❌ خطأ في فحص متغيرات البيئة (Environment Variables Error):');
    console.error(result.error.format());
    throw new Error('فشل فحص متغيرات البيئة، تأكد من إعداد ملف .env بالشكل الصحيح');
  }

  const parsed = result.data;

  return {
    ...parsed,
    IS_PRODUCTION: parsed.NODE_ENV === 'production',
    SYNC_POLL_INTERVAL: parsed.SYNC_POLL_INTERVAL_MS,
  } as const;
};

/**
 * @description كائن الإعدادات المُفحوص بوساطة Zod — يُستورد في كل الكود بدلاً من process.env مباشرة
 */
export const env = parseEnv();
export type Env = typeof env;
