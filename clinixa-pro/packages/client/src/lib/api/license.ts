import { apiClient } from './client';
import type { ApiResponse } from './types';
import { extractApiError } from './extractApiError';

export interface LicenseStatus {
  is_active: boolean;
  is_tampered: boolean;
  days_remaining: number;
  ms_remaining?: number;
  remaining_formatted?: string;
  expires_at: string;
  challenge_code: string;
  machine_id: string;
}

export interface ActivationResult {
  success: boolean;
  expires_at: string;
  months_added: number;
}

/**
 * @description جلب حالة الترخيص الشهري وكود التحدي الحالي
 */
export async function getLicenseStatus(): Promise<ApiResponse<LicenseStatus>> {
  try {
    const res = await apiClient.get<ApiResponse<LicenseStatus>>('/license/status');
    return res.data;
  } catch (err) {
    return extractApiError(err);
  }
}

/**
 * @description تفعيل الترخيص بواسطة كود الاستجابة
 */
export async function activateLicense(
  responseCode: string
): Promise<ApiResponse<ActivationResult>> {
  try {
    const res = await apiClient.post<ApiResponse<ActivationResult>>('/license/activate', {
      response_code: responseCode,
    });
    return res.data;
  } catch (err) {
    return extractApiError(err);
  }
}

/**
 * @description فحص صحة مفتاح ترخيص التثبيت في خطوة الإعداد
 */
export async function verifySetupKey(
  key: string
): Promise<ApiResponse<{ valid: boolean }>> {
  try {
    const res = await apiClient.post<ApiResponse<{ valid: boolean }>>('/license/verify-setup-key', {
      key,
    });
    return res.data;
  } catch (err) {
    return extractApiError(err);
  }
}
