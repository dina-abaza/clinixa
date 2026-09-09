import type { Knex } from 'knex';

/**
 * @description إنشاء جدول تتبع تراخيص وحماية النظام الشهرية (Challenge-Response)
 */
export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable('license_activations', (table) => {
    table.text('id').primary().notNullable().defaultTo('singleton');
    table.text('current_challenge').nullable();
    table.text('expires_at').notNullable();
    table.text('last_active_at').notNullable();
    table.boolean('is_tampered').notNullable().defaultTo(false);
    table.text('signature').notNullable();
    table.text('last_activated_at').nullable();
    table.text('updated_at').notNullable().defaultTo(knex.raw("(datetime('now'))"));
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists('license_activations');
}
