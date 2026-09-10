import { spawn, fork, ChildProcess } from 'child_process';
import path from 'path';
import fs from 'fs';
import { app } from 'electron';

export function startEmbeddedServer(): ChildProcess | null {
  const isDev = process.env.NODE_ENV === 'development' || !app.isPackaged;

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
    // Production mode: run compiled JS server using Node fork
    const appPath = app.getAppPath();
    const candidatePaths = [
      path.join(appPath, 'server/dist/packages/server/src/server.js'),
      path.join(appPath, 'server/dist/server.js'),
      path.join(appPath, 'packages/server/dist/packages/server/src/server.js'),
      path.join(appPath, '../server/dist/packages/server/src/server.js'),
      path.resolve(__dirname, '../../server/dist/packages/server/src/server.js'),
      path.resolve(__dirname, '../../server/dist/server.js'),
    ];

    const serverJsPath = candidatePaths.find((p) => fs.existsSync(p));

    if (!serverJsPath) {
      console.error('❌ Could not find compiled server.js in production candidate paths:', candidatePaths);
      return null;
    }

    console.log('🚀 Starting production embedded server from:', serverJsPath);

    const child = fork(serverJsPath, [], {
      env: {
        ...process.env,
        NODE_ENV: 'production',
        PORT: '4321',
      },
      stdio: 'inherit',
    });

    child.on('exit', (code) => {
      console.log(`Embedded production server exited with code ${code}`);
    });

    return child;
  }
}
