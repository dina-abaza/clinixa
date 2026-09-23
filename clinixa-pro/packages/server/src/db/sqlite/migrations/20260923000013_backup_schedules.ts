import type { Knex } from 'knex';

/** @description إنشاء إعدادات جدولة مستقلة للنسخ المحلي وGoogle Drive */
export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable('backup_schedules', (table) => {
    table.text('destination').primary().notNullable();
    table.integer('is_enabled').notNullable().defaultTo(0);
    table.text('frequency').notNullable().defaultTo('daily');
    table.text('time').notNullable().defaultTo('02:00');
    table.integer('day_of_week').nullable();
    table.text('target_path').nullable();
    table.text('backup_password').nullable();
    table.text('updated_at').notNullable().defaultTo(knex.raw("(datetime('now'))"));
  });

  await knex('backup_schedules').insert([
    { destination: 'local_device', is_enabled: 0, frequency: 'daily', time: '02:00' },
    { destination: 'google_drive', is_enabled: 0, frequency: 'daily', time: '02:00' },
  ]);
}

/** @description حذف جدول جدولة النسخ الاحتياطي */
export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists('backup_schedules');
}