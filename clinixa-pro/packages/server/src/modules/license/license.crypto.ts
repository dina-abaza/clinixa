import * as crypto from 'crypto';

export const MASTER_SECRET =
  process.env.CLINIXA_LICENSE_SECRET ||
  'CLINIXA_SECURE_OFFLINE_SECRET_2026_MASTER_SIGNATURE_KEY_#99201';

// ─────────────────────────────────────────────────────────────────────────────
// وحدات الزمن المشفّرة (كلها أحرف كبيرة لأمان المفتاح)
// ─────────────────────────────────────────────────────────────────────────────
// I = mInutes (دقيقة)  H = Hours (ساعة)  D = Days (يوم)
// W = Weeks (أسبوع)    M = Months (شهر)  Y = Years (سنة)
export const DURATION_UNIT_MS: Record<string, number> = {
  I: 60 * 1000,                         // دقيقة
  H: 60 * 60 * 1000,                    // ساعة
  D: 24 * 60 * 60 * 1000,               // يوم
  W: 7 * 24 * 60 * 60 * 1000,           // أسبوع
  M: 30 * 24 * 60 * 60 * 1000,          // شهر (30 يوم)
  Y: 365 * 24 * 60 * 60 * 1000,         // سنة (365 يوم)
};

/** وحدات مختصرة مقبولة من المستخدم → رمز داخلي */
const UNIT_ALIASES: Record<string, string> = {
  m: 'I', min: 'I', minute: 'I', minutes: 'I',
  h: 'H', hr: 'H', hour: 'H', hours: 'H',
  d: 'D', day: 'D', days: 'D',
  w: 'W', week: 'W', weeks: 'W',
  M: 'M', mo: 'M', month: 'M', months: 'M',
  y: 'Y', yr: 'Y', year: 'Y', years: 'Y',
};

// ─────────────────────────────────────────────────────────────────────────────
// تحويل نص مدة إنسانية (مثل "6M", "30m", "1y") → كود 4 أحرف (مثل "006M")
// ─────────────────────────────────────────────────────────────────────────────
export function parseDurationInput(input: string): { code: string; ms: number } {
  const match = input.trim().match(/^(\d+)([a-zA-Z]+)$/);
  if (!match) throw new Error(`مدة غير صالحة: "${input}". مثال: 6M أو 30m أو 1y`);

  const value = parseInt(match[1], 10);
  const alias = match[2];
  const unitCode = UNIT_ALIASES[alias] ?? alias.toUpperCase();

  if (!DURATION_UNIT_MS[unitCode]) {
    throw new Error(
      `وحدة زمن غير معروفة: "${alias}"\n` +
      `الوحدات المتاحة: m(دقيقة) h(ساعة) d(يوم) w(أسبوع) M(شهر) y(سنة)`
    );
  }
  if (value < 1 || value > 999) throw new Error('القيمة يجب أن تكون بين 1 و 999');

  const code = String(value).padStart(3, '0') + unitCode;
  const ms = value * DURATION_UNIT_MS[unitCode];
  return { code, ms };
}

// ─────────────────────────────────────────────────────────────────────────────
// تحويل كود مضمّن (مثل "006M") → ميللي ثانية
// ─────────────────────────────────────────────────────────────────────────────
export function parseDurationCode(code: string): number {
  const match = code.trim().toUpperCase().match(/^(\d{3})([IHDWMY])$/);
  if (!match) throw new Error(`كود مدة غير صالح: "${code}"`);

  const value = parseInt(match[1], 10);
  const unit = match[2];
  return value * DURATION_UNIT_MS[unit];
}

/** وصف بشري للكود (للعرض فقط) */
export function describeDurationCode(code: string): string {
  const match = code.trim().toUpperCase().match(/^(\d{3})([IHDWMY])$/);
  if (!match) return code;
  const value = parseInt(match[1], 10);
  const labels: Record<string, string> = {
    I: 'دقيقة', H: 'ساعة', D: 'يوم', W: 'أسبوع', M: 'شهر', Y: 'سنة',
  };
  return `${value} ${labels[match[2]] ?? match[2]}`;
}

// ─────────────────────────────────────────────────────────────────────────────
// مفتاح التثبيت — الصيغة الجديدة: CLX-[DUR4]-[SIG4]-[SIG4]-[SIG4]
// المدة مضمّنة ومشمولة في التوقيع تماماً كمفاتيح التفعيل
// ─────────────────────────────────────────────────────────────────────────────
export function verifySetupLicenseKey(
  key: string
): { valid: boolean; durationMs: number; durationCode: string } {
  const INVALID = { valid: false, durationMs: 0, durationCode: '' };
  if (!key || typeof key !== 'string') return INVALID;

  const match = key.trim().toUpperCase().match(
    /^CLX-(\d{3}[IHDWMY])-([A-Z0-9]{4})-([A-Z0-9]{4})-([A-Z0-9]{4})$/
  );
  if (!match) return INVALID;

  const [, durationCode, s1, s2, s3] = match;

  // إعادة حساب التوقيع والمقارنة
  const hmac = crypto.createHmac('sha256', MASTER_SECRET);
  hmac.update(`CLX_SETUP_SIGNATURE|${durationCode}`);
  const hash = hmac.digest('hex').toUpperCase();
  const expectedSig = `${hash.slice(0, 4)}-${hash.slice(4, 8)}-${hash.slice(8, 12)}`;
  const providedSig = `${s1}-${s2}-${s3}`;

  if (expectedSig !== providedSig) return INVALID;

  try {
    const durationMs = parseDurationCode(durationCode);
    return { valid: true, durationMs, durationCode };
  } catch {
    return INVALID;
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// توليد كود التحدي
// ─────────────────────────────────────────────────────────────────────────────
export function generateChallenge(machineId: string, periodStr: string): string {
  const hmac = crypto.createHmac('sha256', MASTER_SECRET);
  hmac.update(`${machineId}|CLINIXA_CHALLENGE_SEED|${periodStr}`);
  const hash = hmac.digest('hex').toUpperCase();

  const c1 = hash.slice(0, 4);
  const c2 = hash.slice(4, 8);
  const c3 = hash.slice(8, 12);
  return `REQ-${c1}-${c2}-${c3}`;
}

// ─────────────────────────────────────────────────────────────────────────────
// التحقق من كود التفعيل — الصيغة الجديدة: ACT-[DUR4]-[SIG4]-[SIG4]-[SIG4]
// المدة مضمّنة ومشمولة في التوقيع → لا يمكن تعديلها
// ─────────────────────────────────────────────────────────────────────────────
export function verifyActivationCode(
  challengeCode: string,
  activationCode: string
): { valid: boolean; durationMs: number; durationCode: string } {
  const INVALID = { valid: false, durationMs: 0, durationCode: '' };

  const cleanChallenge = challengeCode.trim().toUpperCase();
  const cleanActivation = activationCode.trim().toUpperCase();

  // الصيغة: ACT-[3 أرقام + حرف وحدة]-[4]-[4]-[4]
  const match = cleanActivation.match(
    /^ACT-(\d{3}[IHDWMY])-([A-Z0-9]{4})-([A-Z0-9]{4})-([A-Z0-9]{4})$/
  );
  if (!match) return INVALID;

  const [, durationCode, s1, s2, s3] = match;

  // إعادة حساب التوقيع والمقارنة
  const hmac = crypto.createHmac('sha256', MASTER_SECRET);
  hmac.update(`${cleanChallenge}|CLINIXA_VALID_ACTIVATION|${durationCode}`);
  const hash = hmac.digest('hex').toUpperCase();
  const expectedSig = `${hash.slice(0, 4)}-${hash.slice(4, 8)}-${hash.slice(8, 12)}`;
  const providedSig = `${s1}-${s2}-${s3}`;

  if (expectedSig !== providedSig) return INVALID;

  try {
    const durationMs = parseDurationCode(durationCode);
    return { valid: true, durationMs, durationCode };
  } catch {
    return INVALID;
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// توقيع حالة الترخيص لمنع التلاعب في قاعدة البيانات
// ─────────────────────────────────────────────────────────────────────────────
export function signLicenseState(
  expiresAt: string,
  lastActiveAt: string,
  machineId: string
): string {
  const hmac = crypto.createHmac('sha256', MASTER_SECRET);
  hmac.update(`${expiresAt}::${lastActiveAt}::${machineId}`);
  return hmac.digest('hex');
}

export function verifyLicenseSignature(
  expiresAt: string,
  lastActiveAt: string,
  machineId: string,
  signature: string
): boolean {
  if (!signature || typeof signature !== 'string') return false;
  const expected = signLicenseState(expiresAt, lastActiveAt, machineId);
  const expectedBuf = Buffer.from(expected);
  const sigBuf = Buffer.from(signature);
  if (expectedBuf.length !== sigBuf.length) return false;
  return crypto.timingSafeEqual(expectedBuf, sigBuf);
}
