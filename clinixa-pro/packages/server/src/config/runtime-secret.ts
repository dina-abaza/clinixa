import crypto from 'crypto';
import fs from 'fs';
import os from 'os';
import path from 'path';

const STORE_FILENAME = 'clinixa-runtime-secrets.json';

function getRuntimeStorePath(): string {
  const appDataDir = process.env.APPDATA || path.join(os.homedir(), 'AppData', 'Roaming');
  const targetDir = path.join(appDataDir, 'Clinixa');
  fs.mkdirSync(targetDir, { recursive: true });
  return path.join(targetDir, STORE_FILENAME);
}

function getLocalMachineKey(): string {
  const raw = [
    process.platform,
    process.arch,
    os.hostname(),
    os.userInfo().username || 'local-user',
    process.env.COMPUTERNAME || '',
    process.env.USERPROFILE || '',
  ].join('|');

  return crypto.createHash('sha256').update(raw).digest('hex');
}

function readRuntimeSecrets(): Record<string, { encrypted: string; iv: string; tag: string }> {
  const filePath = getRuntimeStorePath();
  if (!fs.existsSync(filePath)) return {};

  try {
    const raw = fs.readFileSync(filePath, 'utf8');
    const parsed = JSON.parse(raw) as Record<string, { encrypted: string; iv: string; tag: string }>;
    return parsed && typeof parsed === 'object' ? parsed : {};
  } catch {
    return {};
  }
}

function writeRuntimeSecrets(secrets: Record<string, { encrypted: string; iv: string; tag: string }>) {
  const filePath = getRuntimeStorePath();
  fs.writeFileSync(filePath, JSON.stringify(secrets, null, 2), {
    mode: 0o600,
  });
}

export function resolveRuntimeSecret(key: string): string {
  const envValue = process.env[key]?.trim();
  if (envValue) return envValue;

  const secrets = readRuntimeSecrets();
  const record = secrets[key];
  if (!record) return '';

  try {
    const keyBuffer = crypto.createHash('sha256').update(getLocalMachineKey()).digest();
    const iv = Buffer.from(record.iv, 'hex');
    const tag = Buffer.from(record.tag, 'hex');
    const decipher = crypto.createDecipheriv('aes-256-gcm', keyBuffer, iv);
    decipher.setAuthTag(tag);

    const decrypted = Buffer.concat([
      decipher.update(Buffer.from(record.encrypted, 'hex')),
      decipher.final(),
    ]);

    return decrypted.toString('utf8');
  } catch {
    return '';
  }
}

export function storeRuntimeSecret(key: string, value: string): void {
  const trimmed = value?.trim();
  if (!trimmed) return;

  const secrets = readRuntimeSecrets();
  const keyBuffer = crypto.createHash('sha256').update(getLocalMachineKey()).digest();
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv('aes-256-gcm', keyBuffer, iv);

  const encrypted = Buffer.concat([
    cipher.update(trimmed, 'utf8'),
    cipher.final(),
  ]);

  secrets[key] = {
    encrypted: encrypted.toString('hex'),
    iv: iv.toString('hex'),
    tag: cipher.getAuthTag().toString('hex'),
  };

  writeRuntimeSecrets(secrets);
}
