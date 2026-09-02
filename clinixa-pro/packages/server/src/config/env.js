"use strict";
/**
 * @fileoverview تحميل وفحص متغيرات البيئة باستخدام Zod
 * @description يُحمِّل الـ .env ويتحقق من وجود وصحة كل متغير حرج عند تشغيل السيرفر
 *              أي متغير مطلوب غير موجود أو غير صالح → يُطلق استثناءً فورياً لبيئة التشغيل (Fail-Fast)
 */
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.env = void 0;
const dotenv = __importStar(require("dotenv"));
const path = __importStar(require("path"));
const zod_1 = require("zod");
// تحميل ملف .env من مجلد السيرفر
dotenv.config({ path: path.join(__dirname, '../../.env') });
/**
 * @description سكيمة التحقق لمتغيرات البيئة باستخدام Zod
 */
const envSchema = zod_1.z.object({
    // ── عام ──────────────────────────────────────────
    NODE_ENV: zod_1.z.enum(['development', 'test', 'production']).default('development'),
    PORT: zod_1.z.coerce.number().default(4321),
    // ── قاعدة البيانات المحلية ────────────────────
    SQLITE_DB_PATH: zod_1.z.string().min(1, 'مسار قاعدة البيانات مطلوبة').default('./data/clinixa.db'),
    // ── المصادقة ──────────────────────────────────
    JWT_SECRET: zod_1.z.string().min(1, 'JWT_SECRET مطلوب لأمان التطبيق'),
    JWT_EXPIRES_IN: zod_1.z.string().default('12h'),
    BCRYPT_SALT_ROUNDS: zod_1.z.coerce.number().default(10),
    // ── الملفات ───────────────────────────────────
    UPLOADS_DIR: zod_1.z.string().default('./data/attachments'),
    MAX_UPLOAD_SIZE_MB: zod_1.z.coerce.number().default(20),
    // ── النسخ الاحتياطي ───────────────────────────
    BACKUP_LOCAL_DIR: zod_1.z.string().default('./data/backups'),
    // ── المزامنة ───────────────────────────────────
    MONGODB_URI: zod_1.z.string().default(''),
    SYNC_ENABLED: zod_1.z.enum(['true', 'false']).default('false').transform((v) => v === 'true'),
    SYNC_POLL_INTERVAL_MS: zod_1.z.coerce.number().default(30000),
    SYNC_MAX_ATTEMPTS: zod_1.z.coerce.number().default(5),
    // ── CORS ──────────────────────────────────────
    CORS_ORIGIN: zod_1.z.string().default('http://localhost:5173'),
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
    };
};
/**
 * @description كائن الإعدادات المُفحوص بوساطة Zod — يُستورد في كل الكود بدلاً من process.env مباشرة
 */
exports.env = parseEnv();
