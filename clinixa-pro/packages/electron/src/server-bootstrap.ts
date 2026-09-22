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

    const userDataPath = app.getPath('userData');
    const dataDir = path.join(userDataPath, 'data');
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }
    const uploadsDir = path.join(dataDir, 'attachments');
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
    }
    const backupsDir = path.join(dataDir, 'backups');
    if (!fs.existsSync(backupsDir)) {
      fs.mkdirSync(backupsDir, { recursive: true });
    }

    // Push runtime env hard into this Electron process before loading the compiled server.
    process.env.NODE_ENV = 'production';
    process.env.PORT = '4321';
    process.env.CORS_ORIGIN = 'http://localhost:5173';
    process.env.SQLITE_DB_PATH = path.join(dataDir, 'clinixa.db');
    process.env.UPLOADS_DIR = uploadsDir;
    process.env.BACKUP_LOCAL_DIR = backupsDir;
    process.env.CLINIXA_APP_PATH = appPath;

    // Secure per-installation JWT secret
    const secretPath = path.join(dataDir, '.jwt_secret');
    let jwtSecret: string = process.env.JWT_SECRET || '';
    if (!jwtSecret || jwtSecret.length < 32) {
      if (fs.existsSync(secretPath)) {
        try {
          jwtSecret = fs.readFileSync(secretPath, 'utf8').trim();
        } catch {}
      }
      if (!jwtSecret || jwtSecret.length < 32) {
        const cryptoModule = require('crypto');
        jwtSecret = cryptoModule.randomBytes(48).toString('hex');
        try {
          fs.writeFileSync(secretPath, jwtSecret, { encoding: 'utf8' });
        } catch {}
      }
    }
    process.env.JWT_SECRET = jwtSecret;

    const logFile = path.join(userDataPath, 'server.log');
    const log = (msg: string) => {
      const line = `[${new Date().toISOString()}] ${msg}\n`;
      try {
        fs.appendFileSync(logFile, line);
      } catch {}
      console.log(msg);
    };

    // Hook Module._resolveFilename to resolve workspace packages in production asar
    const Module = require('module');
    const origResolveFilename = Module._resolveFilename;
    Module._resolveFilename = function (request: string, parent: any, isMain: boolean, options: any) {
      if (request === '@clinixa/shared') {
        const sharedCandidates = [
          path.join(appPath, 'packages/shared/dist/index.js'),
          path.join(appPath, 'packages/shared/dist/packages/shared/src/index.js'),
          path.resolve(__dirname, '../../shared/dist/index.js'),
        ];
        const target = sharedCandidates.find((p) => fs.existsSync(p));
        if (target) return target;
      } else if (request.startsWith('@clinixa/shared/')) {
        const subPath = request.replace('@clinixa/shared/', '');
        const target = path.join(appPath, 'packages/shared/dist', `${subPath}.js`);
        if (fs.existsSync(target)) return target;
      }
      return origResolveFilename.call(this, request, parent, isMain, options);
    };

    log(`🚀 Loading production embedded server from: ${serverJsPath}`);
    log(`📂 SQLite DB Path: ${process.env.SQLITE_DB_PATH}`);

    try {
      require(serverJsPath);
      log('✅ Embedded production server initialized successfully');
      return null;
    } catch (error: any) {
      log(`❌ Failed to load embedded production server: ${error?.stack || error?.message || error}`);
      console.error('❌ Failed to load embedded production server:', error);
      return null;
    }
  }
}
