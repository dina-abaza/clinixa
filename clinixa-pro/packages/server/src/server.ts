import app from './app';
import { env } from './config/env';
import query from './db/sqlite/query';

async function normalizeMigrationRegistryForProduction(): Promise<void> {
  if (env.NODE_ENV !== 'production') {
    return;
  }

  try {
    const hasKnexTable = await query.schema.hasTable('knex_migrations');
    if (!hasKnexTable) {
      return;
    }

    await query.raw("UPDATE knex_migrations SET name = replace(name, '.ts', '.js') WHERE name LIKE '%.ts'");
    console.log('✅ Normalized production knex_migrations from .ts to .js entries');
  } catch (error) {
    console.warn('⚠️ Migration registry normalization skipped:', error);
  }
}

async function startServer(): Promise<void> {
  if (env.NODE_ENV !== 'test') {
    await normalizeMigrationRegistryForProduction();
    await query.migrate.latest();
    console.log('✅ SQLite migrations are up to date');
  }

  const server = app.listen(env.PORT, () => {
    console.log(`🚀 Clinixa Server is running on http://localhost:${env.PORT}`);
    console.log(`🔧 Environment: ${env.NODE_ENV}`);
  });

  (global as typeof globalThis & { __clinixaServer?: unknown }).__clinixaServer = server;
}

startServer();

export default app;
