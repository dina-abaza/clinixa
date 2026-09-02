import app from './app';
import { env } from './config/env';
import query from './db/sqlite/query';

async function startServer(): Promise<void> {
  if (env.NODE_ENV !== 'test') {
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
