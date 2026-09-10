import { spawn, ChildProcess } from 'child_process';
import path from 'path';
import fs from 'fs';
import { app } from 'electron';

export function startEmbeddedServer(): ChildProcess | null {
  const isDev = process.env.NODE_ENV === 'development';

  if (isDev) {
    const serverDir = path.resolve(__dirname, '../../server');
    const npxCmd = process.platform === 'win32' ? 'npx.cmd' : 'npx';

    const child = spawn(npxCmd, ['ts-node-dev', '-r', 'tsconfig-paths/register', '--respawn', '--transpile-only', 'src/server.ts'], {
      cwd: serverDir,
      stdio: 'inherit',
      shell: true,
      env: {
        ...process.env,
        NODE_ENV: 'development',
        PORT: '4321',
      },
    });

    child.on('exit', (code) => {
      console.log(`Embedded dev server exited with code ${code}`);
    });

    return child;
  } else {
    const appPath = app.getAppPath();
    const candidatePaths = [
      path.join(appPath, 'packages/server/dist/src/server.js'),
      path.join(appPath, 'packages/server/dist/packages/server/src/server.js'),
      path.join(appPath, 'server/dist/src/server.js'),
      path.resolve(__dirname, '../../server/dist/src/server.js'),
      path.resolve(__dirname, '../../server/dist/packages/server/src/server.js'),
    ];

    const serverJsPath = candidatePaths.find((p) => fs.existsSync(p));

    if (!serverJsPath) {
      console.error('❌ Could not find compiled server.js in production candidate paths:', candidatePaths);
      return null;
    }

    console.log('🚀 Loading production embedded server from:', serverJsPath);

    // Push runtime env hard into this Electron process before loading the compiled server.
    process.env.NODE_ENV = 'production';
    process.env.PORT = '4321';
    process.env.CORS_ORIGIN = 'http://localhost:5173';
    process.env.SQLITE_DB_PATH = path.join(appPath, 'packages/server/data/clinixa.db');
    process.env.UPLOADS_DIR = path.join(appPath, 'packages/server/data/attachments');
    process.env.BACKUP_LOCAL_DIR = path.join(appPath, 'packages/server/data/backups');
    process.env.CLINIXA_APP_PATH = appPath;

    try {
      require(serverJsPath);
      return null;
    } catch (error) {
      console.error('❌ Failed to load embedded production server:', error);
      return null;
    }
  }
}
