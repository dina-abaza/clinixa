import db from '../../db/sqlite/query';
import { getMachineFingerprint } from './license.fingerprint';
import {
  generateChallenge,
  verifyActivationCode,
  verifySetupLicenseKey,
  signLicenseState,
  verifyLicenseSignature,
  describeDurationCode,
} from './license.crypto';

export interface LicenseStatusResult {
  is_active: boolean;
  is_tampered: boolean;
  days_remaining: number;
  ms_remaining: number;
  remaining_formatted: string;
  expires_at: string;
  challenge_code: string;
  machine_id: string;
}

export function formatRemainingTimeAr(ms: number): string {
  if (ms <= 0) return 'منتهي الصلاحية';
  const totalSeconds = Math.max(0, Math.floor(ms / 1000));
  const totalMinutes = Math.floor(totalSeconds / 60);
  const totalHours = Math.floor(totalMinutes / 60);
  const totalDays = Math.floor(totalHours / 24);

  if (totalDays >= 1) {
    if (totalDays === 1) return 'يوم واحد';
    if (totalDays === 2) return 'يومان';
    if (totalDays <= 10) return `${totalDays} أيام`;
    return `${totalDays} يوماً`;
  }
  if (totalHours >= 1) {
    if (totalHours === 1) return 'ساعة واحدة';
    if (totalHours === 2) return 'ساعتان';
    if (totalHours <= 10) return `${totalHours} ساعات`;
    return `${totalHours} ساعة`;
  }
  if (totalMinutes >= 1) {
    if (totalMinutes === 1) return 'دقيقة واحدة';
    if (totalMinutes === 2) return 'دقيقتان';
    if (totalMinutes <= 10) return `${totalMinutes} دقائق`;
    return `${totalMinutes} دقيقة`;
  }
  return 'أقل من دقيقة';
}

export class LicenseService {
  /**
   * @description فحص صحة مفتاح ترخيص التثبيت
   */
  verifySetupKey(key: string): { valid: boolean; durationMs: number; durationCode: string } {
    return verifySetupLicenseKey(key);
  }

  /**
   * @description فحص حالة الترخيص الحالية والتحقق من التلاعب
   */
  async getStatus(): Promise<LicenseStatusResult> {
    const machineId = getMachineFingerprint();
    const now = new Date();
    const currentMonthStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    const challengeCode = generateChallenge(machineId, currentMonthStr);

    let row = await db('license_activations').where({ id: 'singleton' }).first();

    if (!row) {
      // تهيئة الترخيص الأولي (صلاحية ٣٠ يوماً افتراضية عند التركيب لأول مرة)
      const initialExpiry = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000).toISOString();
      const lastActive = now.toISOString();
      const sig = signLicenseState(initialExpiry, lastActive, machineId);

      await db('license_activations').insert({
        id: 'singleton',
        current_challenge: challengeCode,
        expires_at: initialExpiry,
        last_active_at: lastActive,
        is_tampered: false,
        signature: sig,
        last_activated_at: now.toISOString(),
      });

      row = await db('license_activations').where({ id: 'singleton' }).first();
    }

    let isTampered = Boolean(row.is_tampered);
    const expiresAt = new Date(row.expires_at);
    const lastActiveAt = new Date(row.last_active_at);

    // 1. التحقق من التوقيع الرقمي للترخيص
    const isSigValid = verifyLicenseSignature(row.expires_at, row.last_active_at, machineId, row.signature);
    if (!isSigValid) isTampered = true;

    // 2. التحقق من التلاعب بساعة النظام (Anti-Clock Tampering)
    if (now.getTime() < lastActiveAt.getTime() - 2 * 60 * 60 * 1000) {
      isTampered = true;
    }

    // تحديث آخر وقت نشاط وتجديد التوقيع
    const updatedLastActive = now.toISOString();
    const newSig = signLicenseState(row.expires_at, updatedLastActive, machineId);

    await db('license_activations')
      .where({ id: 'singleton' })
      .update({
        current_challenge: challengeCode,
        last_active_at: updatedLastActive,
        is_tampered: isTampered,
        signature: newSig,
        updated_at: db.raw("(datetime('now'))"),
      });

    const msDiff = expiresAt.getTime() - now.getTime();
    const daysRemaining = Math.max(0, Math.ceil(msDiff / (1000 * 60 * 60 * 24)));
    const remainingFormatted = formatRemainingTimeAr(msDiff);
    const isActive = !isTampered && msDiff > 0;

    return {
      is_active: isActive,
      is_tampered: isTampered,
      days_remaining: daysRemaining,
      ms_remaining: Math.max(0, msDiff),
      remaining_formatted: remainingFormatted,
      expires_at: row.expires_at,
      challenge_code: challengeCode,
      machine_id: machineId,
    };
  }

  /**
   * @description تفعيل الترخيص بواسطة كود الاستجابة
   * الكود الجديد يحمل المدة مضمّنة ومشمولة في التوقيع (ACT-[DUR]-[SIG]-[SIG]-[SIG])
   */
  async activate(
    activationCode: string
  ): Promise<{ success: boolean; expires_at: string; duration_label: string }> {
    const machineId = getMachineFingerprint();
    const now = new Date();
    const currentMonthStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    const currentChallenge = generateChallenge(machineId, currentMonthStr);

    const check = verifyActivationCode(currentChallenge, activationCode);
    if (!check.valid) {
      throw new Error('كود التفعيل غير صحيح أو غير متطابق مع هذا الجهاز!');
    }

    const row = await db('license_activations').where({ id: 'singleton' }).first();
    const currentExpiry = row?.expires_at ? new Date(row.expires_at) : now;

    // إذا كان منتهي الصلاحية نبدأ الحساب من تاريخ اليوم
    const baseDate = currentExpiry.getTime() > now.getTime() ? currentExpiry : now;
    const newExpiry = new Date(baseDate.getTime() + check.durationMs);
    const newExpiryStr = newExpiry.toISOString();
    const lastActiveStr = now.toISOString();
    const newSig = signLicenseState(newExpiryStr, lastActiveStr, machineId);

    await db('license_activations')
      .where({ id: 'singleton' })
      .update({
        expires_at: newExpiryStr,
        last_active_at: lastActiveStr,
        is_tampered: false,
        signature: newSig,
        last_activated_at: now.toISOString(),
        updated_at: db.raw("(datetime('now'))"),
      });

    return {
      success: true,
      expires_at: newExpiryStr,
      duration_label: describeDurationCode(check.durationCode),
    };
  }
}

export const licenseService = new LicenseService();
