import type { Knex } from 'knex';
import * as path from 'path';
import * as fs from 'fs';

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
function ensureDirectory(filePath: string): void {
  if (filePath === ':memory:' || !filePath) return;
  const dir = path.dirname(filePath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

/**
 * @description الإعدادات المشتركة لجميع بيئات التشغيل (DRY)
 * ⭐ يُفعِّل PRAGMA foreign_keys = ON في كل الاتصالات المنشأة بواسطة Knex (Migrations & Seeds)
 */
const baseConfig: Partial<Knex.Config> = {
  client: 'better-sqlite3',
  useNullAsDefault: true,
  pool: {
    afterCreate: (conn: any, done: (err: Error | null, connection: any) => void) => {
      try {
        conn.pragma('foreign_keys = ON');
        done(null, conn);
      } catch (err) {
        done(err as Error, conn);
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
const config: Record<string, Knex.Config> = {
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
      filename: process.env.SQLITE_DB_PATH!,
    },
    migrations: {
      directory: path.join(__dirname, 'src/db/sqlite/migrations'),
      extension: 'js',
      loadExtensions: ['.js'],
    },
    seeds: {
      directory: path.join(__dirname, 'src/db/sqlite/seeds'),
      extension: 'js',
      loadExtensions: ['.js'],
    },
  },
};

export default config;
