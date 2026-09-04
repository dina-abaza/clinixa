import type { Knex } from 'knex';

/**
 * @description إنشاء جدول إعدادات النسخ الاحتياطي السحابي عبر Google Drive
 * صف واحد فقط (Singleton) — id ثابت = 'singleton'
 * الحقول تبدأ فارغة (null) ويتم ضبطها لاحقاً من الإعدادات
 */
export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable('google_drive_settings', (table) => {
    table.text('id').primary().notNullable().defaultTo('singleton');
    table.text('script_url').nullable();
    table.text('secret_key').nullable();
    table.text('backup_password').nullable();
    table.integer('is_enabled').notNullable().defaultTo(0);
    table.text('updated_at').notNullable().defaultTo(knex.raw("(datetime('now'))"));
  });

  // إدراج الصف الافتراضي الوحيد
  await knex('google_drive_settings').insert({
    id: 'singleton',
    script_url: null,
    secret_key: null,
    backup_password: null,
    is_enabled: 0,
  });
}

/**
 * @description حذف جدول إعدادات Google Drive عند التراجع
 */
export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists('google_drive_settings');
}
