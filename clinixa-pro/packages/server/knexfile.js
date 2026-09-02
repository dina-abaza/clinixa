"use strict";
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
const path = __importStar(require("path"));
const fs = __importStar(require("fs"));
const dotenv = __importStar(require("dotenv"));
dotenv.config();
/**
 * @description التحقق من وجود مسار قاعدة البيانات في بيئة الإنتاج (Fail-Fast)
 * يُطلق خطأ فورياً إذا لم يُمرَّر المسار من Electron
 */
if (process.env.NODE_ENV === 'production' && !process.env.SQLITE_DB_PATH) {
    throw new Error('SQLITE_DB_PATH is required in production environment');
}
/**
 * @description ينشئ مجلد قاعدة البيانات إذا لم يكن موجوداً
 */
function ensureDirectory(filePath) {
    if (filePath === ':memory:' || !filePath)
        return;
    const dir = path.dirname(filePath);
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
    }
}
/**
 * @description الإعدادات المشتركة لجميع بيئات التشغيل (DRY)
 * ⭐ يُفعِّل PRAGMA foreign_keys = ON في كل الاتصالات المنشأة بواسطة Knex (Migrations & Seeds)
 */
const baseConfig = {
    client: 'better-sqlite3',
    useNullAsDefault: true,
    pool: {
        afterCreate: (conn, done) => {
            try {
                conn.pragma('foreign_keys = ON');
                done(null, conn);
            }
            catch (err) {
                done(err, conn);
            }
        },
    },
};
const devDbPath = process.env.SQLITE_DB_PATH ?? path.join(__dirname, '../../data/clinixa.db');
ensureDirectory(devDbPath);
/**
 * @description إعداد Knex لقاعدة البيانات SQLite
 * - development: ملف محلي في data/clinixa.db
 * - test: قاعدة بيانات في الذاكرة (in-memory) للاختبارات
 * - production: المسار يُمرَّر من Electron عبر متغير البيئة SQLITE_DB_PATH
 */
const config = {
    development: {
        ...baseConfig,
        connection: {
            filename: process.env.SQLITE_DB_PATH ?? path.join(__dirname, '../../data/clinixa.db'),
        },
        migrations: {
            directory: path.join(__dirname, 'src/db/sqlite/migrations'),
            extension: 'ts',
            loadExtensions: ['.ts'],
        },
        seeds: {
            directory: path.join(__dirname, 'src/db/sqlite/seeds'),
            extension: 'ts',
            loadExtensions: ['.ts'],
        },
    },
    test: {
        ...baseConfig,
        connection: {
            filename: ':memory:',
        },
        migrations: {
            directory: path.join(__dirname, 'src/db/sqlite/migrations'),
            extension: 'ts',
            loadExtensions: ['.ts'],
        },
    },
    production: {
        ...baseConfig,
        connection: {
            filename: process.env.SQLITE_DB_PATH,
        },
        migrations: {
            directory: path.join(__dirname, 'src/db/sqlite/migrations'),
        },
        seeds: {
            directory: path.join(__dirname, 'src/db/sqlite/seeds'),
        },
    },
};
exports.default = config;
