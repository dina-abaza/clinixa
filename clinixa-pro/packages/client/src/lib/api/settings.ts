import type { ChargeType, ClinicPrice, Specialty, SyncMode } from '@clinixa/shared';
import { apiClient } from './client';
import type { ApiResponse } from './types';
import { extractApiError } from './extractApiError';

/** وحدة `/api/settings` — راجع clinixa-api-reference.md §4. */

export interface ClinicSettingsSummary {
  name_ar: string;
  specialty: Specialty;
  phone: string | null;
  address: string | null;
  sync_mode: SyncMode;
}

export interface GetSettingsResponseData {
  clinic: ClinicSettingsSummary;
  prices: ClinicPrice[];
}

export async function getSettings(): Promise<ApiResponse<GetSettingsResponseData>> {
  try {
    const res = await apiClient.get<ApiResponse<GetSettingsResponseData>>('/settings');
    return res.data;
  } catch (err) {
    return extractApiError(err);
  }
}

export interface UpdateSettingsRequest {
  clinic?: {
    name_ar?: string;
    phone?: string | null;
    address?: string | null;
  };
  prices?: Array<{ charge_type: ChargeType; default_amount: number }>;
}

export async function updateSettings(payload: UpdateSettingsRequest): Promise<ApiResponse<{ message: string }>> {
  try {
    const res = await apiClient.put<ApiResponse<{ message: string }>>('/settings', payload);
    return res.data;
  } catch (err) {
    return extractApiError(err);
  }
}
