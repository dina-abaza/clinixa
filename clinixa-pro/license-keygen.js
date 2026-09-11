#!/usr/bin/env node
/**
 * ═════════════════════════════════════════════════════════════════════
 * 🔐 Clinixa Master License Key Generator (أداة توليد أكواد التفعيل)
 * ═════════════════════════════════════════════════════════════════════
 * للاستخدام الحصري من قبل مالك ومطور النظام لتوليد:
 *   1. مفاتيح تثبيت النظام  CLX-XXXX-XXXX-XXXX
 *   2. أكواد التفعيل        ACT-[DUR]-[SIG]-[SIG]-[SIG]
 *
 * ─────────────────────────────────────────────────────────────────────
 * صيغة كود التفعيل الجديدة:
 *   ACT-006M-A1B2-C3D4-E5F6
 *        ↑
 *   المدة مضمّنة ومشمولة في التوقيع الرقمي
 *   → أي تعديل على المدة يكسر التوقيع فوراً ✅
 *
 * وحدات الزمن المتاحة:
 *   m  → دقيقة   (I في الكود الداخلي)
 *   h  → ساعة    (H)
 *   d  → يوم     (D)
 *   w  → أسبوع   (W)
 *   M  → شهر     (M)
 *   y  → سنة     (Y)
 *
 * أمثلة:
 *   node license-keygen.js REQ-XXXX-XXXX-XXXX 30m   → 30 دقيقة
 *   node license-keygen.js REQ-XXXX-XXXX-XXXX 2h    → ساعتين
 *   node license-keygen.js REQ-XXXX-XXXX-XXXX 7d    → 7 أيام
 *   node license-keygen.js REQ-XXXX-XXXX-XXXX 2w    → أسبوعان
 *   node license-keygen.js REQ-XXXX-XXXX-XXXX 6M    → 6 شهور
 *   node license-keygen.js REQ-XXXX-XXXX-XXXX 1y    → سنة كاملة
 * ═════════════════════════════════════════════════════════════════════
 */

const crypto = require('crypto');
const readline = require('readline');

// المفتاح السري الرئيسي الموحد (Master Secret Key)
const MASTER_SECRET = process.env.CLINIXA_LICENSE_SECRET || 'CLINIXA_SECURE_OFFLINE_SECRET_2026_MASTER_SIGNATURE_KEY_#99201';

// ─────────────────────────────────────────────────────────────────────────────
// وحدات الزمن (الرموز الداخلية كلها أحرف كبيرة لأمان المفتاح)
// ─────────────────────────────────────────────────────────────────────────────
const DURATION_UNIT_MS = {
  I: 60 * 1000,                        // دقيقة (mInutes)
  H: 60 * 60 * 1000,                   // ساعة
  D: 24 * 60 * 60 * 1000,              // يوم
  W: 7 * 24 * 60 * 60 * 1000,          // أسبوع
  M: 30 * 24 * 60 * 60 * 1000,         // شهر (30 يوم)
  Y: 365 * 24 * 60 * 60 * 1000,        // سنة (365 يوم)
};

const UNIT_ALIASES = {
  m: 'I', min: 'I', minute: 'I', minutes: 'I',
  h: 'H', hr: 'H', hour: 'H', hours: 'H',
  d: 'D', day: 'D', days: 'D',
  w: 'W', week: 'W', weeks: 'W',
  M: 'M', mo: 'M', month: 'M', months: 'M',
  y: 'Y', yr: 'Y', year: 'Y', years: 'Y',
};

const UNIT_ARABIC = {
  I: 'دقيقة', H: 'ساعة', D: 'يوم', W: 'أسبوع', M: 'شهر', Y: 'سنة',
};

/**
 * تحويل نص مدة (مثل "6M", "30m", "2w") → كود 4 أحرف (مثل "006M")
 */
function parseDuration(input) {
  const match = String(input).trim().match(/^(\d+)([a-zA-Z]+)$/);
  if (!match) throw new Error(`مدة غير صالحة: "${input}"\nمثال: 6M أو 30m أو 1y أو 2w`);

  const value = parseInt(match[1], 10);
  const alias = match[2];
  const unitCode = UNIT_ALIASES[alias] ?? alias.toUpperCase();

  if (!DURATION_UNIT_MS[unitCode]) {
    throw new Error(
      `وحدة زمن غير معروفة: "${alias}"\n` +
      `الوحدات المتاحة:\n` +
      `  m  → دقيقة\n  h  → ساعة\n  d  → يوم\n  w  → أسبوع\n  M  → شهر\n  y  → سنة`
    );
  }
  if (value < 1 || value > 999) throw new Error('القيمة يجب أن تكون بين 1 و 999');

  return { code: String(value).padStart(3, '0') + unitCode, value, unitCode };
}

/**
 * وصف بشري للكود (للعرض)
 */
function describeDuration(code) {
  const value = parseInt(code.slice(0, 3), 10);
  const unit = code[3];
  return `${value} ${UNIT_ARABIC[unit] ?? unit}`;
}

// ─────────────────────────────────────────────────────────────────────────────
// توليد مفتاح تثبيت أصلي — الصيغة: CLX-[DUR4]-[SIG4]-[SIG4]-[SIG4]
// مثال: CLX-030D-A1B2-C3D4-E5F6 ← 30 يوم تجربة
// ─────────────────────────────────────────────────────────────────────────────
function generateSetupLicenseKey(durationInput = '1M') {
  const { code: durationCode } = parseDuration(durationInput);

  const hmac = crypto.createHmac('sha256', MASTER_SECRET);
  hmac.update(`CLX_SETUP_SIGNATURE|${durationCode}`);
  const hash = hmac.digest('hex').toUpperCase();

  const sig1 = hash.slice(0, 4);
  const sig2 = hash.slice(4, 8);
  const sig3 = hash.slice(8, 12);

  return { key: `CLX-${durationCode}-${sig1}-${sig2}-${sig3}`, durationCode };
}

function verifySetupLicenseKey(key) {
  if (!key || typeof key !== 'string') return false;
  const match = key.trim().toUpperCase().match(
    /^CLX-(\d{3}[IHDWMY])-([A-Z0-9]{4})-([A-Z0-9]{4})-([A-Z0-9]{4})$/
  );
  if (!match) return false;

  const [, durationCode, s1, s2, s3] = match;
  const hmac = crypto.createHmac('sha256', MASTER_SECRET);
  hmac.update(`CLX_SETUP_SIGNATURE|${durationCode}`);
  const hash = hmac.digest('hex').toUpperCase();
  const expectedSig = `${hash.slice(0, 4)}-${hash.slice(4, 8)}-${hash.slice(8, 12)}`;

  return `${s1}-${s2}-${s3}` === expectedSig;
}

// ─────────────────────────────────────────────────────────────────────────────
// توليد كود التفعيل مع مدة مضمّنة
// الصيغة: ACT-[DUR4]-[SIG4]-[SIG4]-[SIG4]
// ─────────────────────────────────────────────────────────────────────────────
function generateActivationCode(challengeCode, durationInput = '1M') {
  const cleanChallenge = challengeCode.trim().toUpperCase();
  if (!cleanChallenge.startsWith('REQ-')) {
    throw new Error('كود التحدي غير صالح! يجب أن يبدأ بـ REQ-');
  }

  const { code: durationCode } = parseDuration(durationInput);

  const hmac = crypto.createHmac('sha256', MASTER_SECRET);
  hmac.update(`${cleanChallenge}|CLINIXA_VALID_ACTIVATION|${durationCode}`);
  const hash = hmac.digest('hex').toUpperCase();

  const sig1 = hash.slice(0, 4);
  const sig2 = hash.slice(4, 8);
  const sig3 = hash.slice(8, 12);

  return { key: `ACT-${durationCode}-${sig1}-${sig2}-${sig3}`, durationCode };
}

// ─────────────────────────────────────────────────────────────────────────────
// CLI
// ─────────────────────────────────────────────────────────────────────────────
const args = process.argv.slice(2);

if (args.length > 0) {
  const cmd = args[0].toUpperCase();

  if (cmd === '--SETUP' || cmd === 'SETUP') {
    const durationInput = args[1] || '1M';
    try {
      const { key, durationCode } = generateSetupLicenseKey(durationInput);
      console.log('\n════════════════════════════════════════');
      console.log('🔑 مفتاح تثبيت أصلي جديد (Setup Key):');
      console.log(`👉 ${key}`);
      console.log(`⏱️  المدة: ${describeDuration(durationCode)} (${durationCode})`);
      console.log('لا يمكن تعديل المدة — مشمولة في التوقيع.');
      console.log('════════════════════════════════════════\n');
    } catch (err) {
      console.error('❌ خطأ:', err.message);
    }

  } else if (args[0].trim().toUpperCase().startsWith('REQ-')) {
    const durationInput = args[1] || '1M';
    try {
      const { key, durationCode } = generateActivationCode(args[0], durationInput);
      console.log('\n════════════════════════════════════════');
      console.log('✅ كود التفعيل (Activation Code):');
      console.log(`👉 ${key}`);
      console.log(`⏱️  المدة: ${describeDuration(durationCode)} (${durationCode})`);
      console.log('════════════════════════════════════════\n');
    } catch (err) {
      console.error('❌ خطأ:', err.message);
    }

  } else {
    console.log(
      '\nالاستخدام:\n' +
      '  node license-keygen.js setup\n' +
      '  node license-keygen.js REQ-XXXX-XXXX-XXXX [مدة]\n\n' +
      'أمثلة على المدة:\n' +
      '  30m  → 30 دقيقة\n' +
      '  2h   → ساعتين\n' +
      '  7d   → 7 أيام\n' +
      '  2w   → أسبوعان\n' +
      '  6M   → 6 شهور\n' +
      '  1y   → سنة كاملة\n'
    );
  }

} else {
  // الوضع التفاعلي
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });

  console.log('\n╔═══════════════════════════════════════════════╗');
  console.log('║   CLINIXA LICENSE GENERATOR — نظام التفعيل    ║');
  console.log('╚═══════════════════════════════════════════════╝');
  console.log('1. توليد مفتاح تثبيت جديد للعيادة (CLX-...)');
  console.log('2. توليد كود تفعيل بمدة محددة (ACT-...)');

  rl.question('\nاختر رقم العملية [1 أو 2]: ', (choice) => {
    if (choice.trim() === '1') {
      const key = generateSetupLicenseKey();
      console.log('\n───────────────────────────────────────────────');
      console.log('🔑 مفتاح التثبيت الأصلي:');
      console.log(`\n    ${key}\n`);
      console.log('أعطِ هذا المفتاح للعميل لإدخاله في خطوة الإعداد الأولى.');
      console.log('───────────────────────────────────────────────\n');
      rl.close();
    } else {
      rl.question('\n📝 أدخل كود التحدي المستلم من العميل (REQ-...): ', (challengeInput) => {
        console.log('\nوحدات الزمن المتاحة: m(دقيقة)  h(ساعة)  d(يوم)  w(أسبوع)  M(شهر)  y(سنة)');
        rl.question('⏳ أدخل مدة التفعيل (مثال: 6M أو 30m أو 1y): ', (durationInput) => {
          try {
            const { key, durationCode } = generateActivationCode(
              challengeInput,
              durationInput.trim() || '1M'
            );
            console.log('\n───────────────────────────────────────────────');
            console.log('🔑 كود التفعيل الجاهز للإرسال للعميل:');
            console.log(`\n    ${key}\n`);
            console.log(`⏱️  مدة الصلاحية: ${describeDuration(durationCode)}`);
            console.log('💡 المدة مضمّنة ومشمولة في التوقيع — لا يمكن تعديلها.');
            console.log('───────────────────────────────────────────────\n');
          } catch (err) {
            console.error('\n❌ خطأ:', err.message, '\n');
          }
          rl.close();
        });
      });
    }
  });
}

module.exports = {
  generateSetupLicenseKey,
  verifySetupLicenseKey,
  generateActivationCode,
  parseDuration,
  describeDuration,
  MASTER_SECRET,
};
