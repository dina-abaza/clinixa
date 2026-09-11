import { app, BrowserWindow, dialog, ipcMain } from 'electron';
import path from 'path';
import fs from 'fs';
import { startEmbeddedServer } from './server-bootstrap';
import { startEmbeddedClient } from './client-bootstrap';

let mainWindow: BrowserWindow | null = null;
let serverProcess: ReturnType<typeof startEmbeddedServer> | null = null;
let clientProcess: ReturnType<typeof startEmbeddedClient> | null = null;

const isDev = process.env.NODE_ENV === 'development';

// معالج فتح نافذة اختيار المجلد لنظام التشغيل
ipcMain.handle('dialog:select-folder', async (_event, defaultPath?: string) => {
  if (!mainWindow) return null;
  const result = await dialog.showOpenDialog(mainWindow, {
    properties: ['openDirectory', 'createDirectory'],
    defaultPath: defaultPath || undefined,
    title: 'تحديد مجلد النسخ الاحتياطي',
    buttonLabel: 'تحديد المجلد',
  });
  if (result.canceled || result.filePaths.length === 0) {
    return null;
  }
  return result.filePaths[0];
});

// معالج فتح نافذة اختيار ملف النسخة الاحتياطية لنظام التشغيل
ipcMain.handle('dialog:select-file', async (_event, defaultPath?: string) => {
  if (!mainWindow) return null;
  const result = await dialog.showOpenDialog(mainWindow, {
    properties: ['openFile'],
    defaultPath: defaultPath || undefined,
    filters: [
      { name: 'ملفات النسخ الاحتياطي لـ Clinixa (*.encrypted, *.db, *.json)', extensions: ['encrypted', 'db', 'json'] },
      { name: 'جميع الملفات (*.*)', extensions: ['*'] },
    ],
    title: 'تحديد ملف النسخة الاحتياطية للاستعادة',
    buttonLabel: 'اختيار ملف النسخة',
  });
  if (result.canceled || result.filePaths.length === 0) {
    return null;
  }
  return result.filePaths[0];
});

async function loadDevURL(win: BrowserWindow, url: string, maxRetries = 20): Promise<void> {
  for (let i = 0; i < maxRetries; i++) {
    try {
      await win.loadURL(url);
      return;
    } catch {
      await new Promise((resolve) => setTimeout(resolve, 800));
    }
  }

  const clientDist = path.resolve(__dirname, '../../client/dist/index.html');
  if (fs.existsSync(clientDist)) {
    win.loadFile(clientDist);
  }
}

function createWindow(): void {
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 1100,
    minHeight: 700,
    backgroundColor: '#f7f9f8',
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
      preload: path.join(__dirname, 'preload.js'),
    },
  });

  if (isDev) {
    loadDevURL(mainWindow, 'http://localhost:5173');
  } else {
    const appPath = app.getAppPath();
    const candidateClientPaths = [
      path.join(appPath, 'packages/client/dist/index.html'),
      path.join(appPath, 'client/dist/index.html'),
      path.resolve(__dirname, '../../client/dist/index.html'),
    ];
    const clientDist = candidateClientPaths.find((p) => fs.existsSync(p));

    if (clientDist) {
      console.log('🚀 Loading production client index.html from:', clientDist);
      mainWindow.loadFile(clientDist);
    } else {
      console.error('❌ Could not find client index.html in production candidate paths:', candidateClientPaths);
    }
  }

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

app.whenReady().then(() => {
  // تشغيل السيرفر الخلفي
  serverProcess = startEmbeddedServer();

  // تشغيل سيرفر الفرونت إند في بيئة التطوير
  if (isDev) {
    clientProcess = startEmbeddedClient();
  }

  createWindow();

  app.on('activate', () => {
    if (mainWindow === null) {
      createWindow();
    }
  });
});

function cleanupProcesses(): void {
  if (serverProcess) {
    serverProcess.kill();
    serverProcess = null;
  }
  if (clientProcess) {
    clientProcess.kill();
    clientProcess = null;
  }
}

app.on('window-all-closed', () => {
  cleanupProcesses();

  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('before-quit', () => {
  cleanupProcesses();
});
