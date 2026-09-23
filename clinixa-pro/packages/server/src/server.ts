import dns from 'dns';
import app from './app';
import { env } from './config/env';
import query from './db/sqlite/query';
import { startBackupScheduler } from './modules/backup/backup.scheduler';
import { startSyncEngine } from './modules/sync/sync.engine';

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
  const dnsServers = env.MONGODB_DNS_SERVERS.split(',').map((server) => server.trim()).filter(Boolean);
  if (dnsServers.length > 0) {
    dns.setServers(dnsServers);
    console.log(`🌐 DNS resolvers configured for external services: ${dnsServers.join(', ')}`);
  }

  try {
    if (env.NODE_ENV !== 'test') {
      await normalizeMigrationRegistryForProduction();
      await query.migrate.latest();
      console.log('✅ SQLite migrations are up to date');
      startBackupScheduler();
      startSyncEngine();
    }
  } catch (migErr) {
    console.error('⚠️ Migrations execution failed or partially completed:', migErr);
  }

  const server = app.listen(env.PORT, '127.0.0.1', () => {
    console.log(`🚀 Clinixa Server is running on http://127.0.0.1:${env.PORT}`);
    console.log(`🔧 Environment: ${env.NODE_ENV}`);
  });

  (global as typeof globalThis & { __clinixaServer?: unknown }).__clinixaServer = server;
}

startServer().catch((err) => {
  console.error('❌ Critical failure starting server:', err);
});

export default app;
