import { apiClient } from './client';
import type { ApiResponse } from './types';
import { extractApiError } from './extractApiError';

export interface SyncHealth {
  status: 'connected' | 'failed' | 'disabled';
  code?: string;
  reason: string | null;
}

export async function getSyncHealth(): Promise<ApiResponse<SyncHealth>> {
  try {
    const res = await apiClient.get<ApiResponse<SyncHealth>>('/sync/health');
    return res.data;
  } catch (error) {
    return extractApiError(error);
  }
}

export async function configureSync(mongodbUri: string): Promise<ApiResponse<SyncHealth>> {
  try {
    const res = await apiClient.post<ApiResponse<SyncHealth>>('/sync/configure', { mongodb_uri: mongodbUri });
    return res.data;
  } catch (error) {
    return extractApiError(error);
  }
}
