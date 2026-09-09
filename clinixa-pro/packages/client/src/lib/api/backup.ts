import type { BackupDestination, BackupFailReason, BackupKind, BackupRecord, BackupStatus } from '@clinixa/shared';
import { apiClient } from './client';
import type { ApiResponse } from './types';
import { extractApiError } from './extractApiError';

/** وحدة `/api/backup` — راجع clinixa-api-reference.md §5. */

export interface RunBackupRequest {
  destination: BackupDestination;
  kind?: BackupKind;
  target_path?: string;
  backup_password?: string;
}

export interface RunBackupResponseData {
  id: string;
  date: string;
  time: string;
  status: BackupStatus;
  fail_reason: BackupFailReason | null;
  size_mb: number | null;
  kind: BackupKind;
  destination: BackupDestination;
}

export async function runBackup(payload: RunBackupRequest): Promise<ApiResponse<RunBackupResponseData>> {
  try {
    const res = await apiClient.post<ApiResponse<RunBackupResponseData>>('/backup/run', payload);
    return res.data;
  } catch (err) {
    return extractApiError(err);
  }
}

export async function getBackupHistory(): Promise<ApiResponse<{ items: BackupRecord[] }>> {
  try {
    const res = await apiClient.get<ApiResponse<{ items: BackupRecord[] }>>('/backup/history');
    return res.data;
  } catch (err) {
    return extractApiError(err);
  }
}

export interface SetBackupDestinationResponseData {
  destination: BackupDestination;
  message: string;
}

export async function setBackupDestination(
  destination: BackupDestination,
): Promise<ApiResponse<SetBackupDestinationResponseData>> {
  try {
    const res = await apiClient.put<ApiResponse<SetBackupDestinationResponseData>>('/backup/destination', {
      destination,
    });
    return res.data;
  } catch (err) {
    return extractApiError(err);
  }
}

export interface RestoreBackupRequest {
  confirmation_text: string;
  source_mode?: 'history' | 'custom_path';
  backup_id?: string;
  custom_path?: string;
  backup_password?: string;
}

export async function restoreBackup(payload: RestoreBackupRequest): Promise<ApiResponse<{ message: string }>> {
  try {
    const res = await apiClient.post<ApiResponse<{ message: string }>>('/backup/restore', payload);
    return res.data;
  } catch (err) {
    return extractApiError(err);
  }
}

// ─── Google Drive Settings ─────────────────────────────────────────────────────

export interface GoogleDriveSettingsData {
  id: string;
  script_url: string | null;
  has_secret_key: boolean;
  has_backup_password: boolean;
  is_enabled: boolean;
  updated_at: string | null;
}

export interface UpdateGoogleDriveSettingsRequest {
  script_url?: string | null;
  secret_key?: string | null;
  backup_password?: string | null;
  is_enabled?: boolean;
}

export async function getGoogleDriveSettings(): Promise<ApiResponse<GoogleDriveSettingsData>> {
  try {
    const res = await apiClient.get<ApiResponse<GoogleDriveSettingsData>>('/backup/google-drive');
    return res.data;
  } catch (err) {
    return extractApiError(err);
  }
}

export async function updateGoogleDriveSettings(
  payload: UpdateGoogleDriveSettingsRequest,
): Promise<ApiResponse<{ settings: GoogleDriveSettingsData; message: string }>> {
  try {
    const res = await apiClient.put<ApiResponse<{ settings: GoogleDriveSettingsData; message: string }>>(
      '/backup/google-drive',
      payload,
    );
    return res.data;
  } catch (err) {
    return extractApiError(err);
  }
}

export async function deleteGoogleDriveSettings(): Promise<ApiResponse<{ message: string }>> {
  try {
    const res = await apiClient.delete<ApiResponse<{ message: string }>>('/backup/google-drive');
    return res.data;
  } catch (err) {
    return extractApiError(err);
  }
}
