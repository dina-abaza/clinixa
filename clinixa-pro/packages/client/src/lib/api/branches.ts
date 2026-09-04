import type { Branch } from '@clinixa/shared';
import { apiClient } from './client';
import type { ApiResponse } from './types';
import { extractApiError } from './extractApiError';

/** وحدة `/api/branches` — راجع clinixa-api-reference.md §3. */

export async function getBranches(): Promise<ApiResponse<{ items: Branch[] }>> {
  try {
    const res = await apiClient.get<ApiResponse<{ items: Branch[] }>>('/branches');
    return res.data;
  } catch (err) {
    return extractApiError(err);
  }
}

export interface CreateBranchRequest {
  name_ar: string;
  address_ar?: string | null;
  phone: string;
  opens_at: string;
  closes_at: string;
}

export interface CreateBranchResponseData {
  id: string;
  name_ar: string;
  is_host: boolean;
  is_active: boolean;
}

export async function createBranch(payload: CreateBranchRequest): Promise<ApiResponse<CreateBranchResponseData>> {
  try {
    const res = await apiClient.post<ApiResponse<CreateBranchResponseData>>('/branches', payload);
    return res.data;
  } catch (err) {
    return extractApiError(err);
  }
}

export type UpdateBranchRequest = Partial<CreateBranchRequest & { is_active: boolean }>;

export async function updateBranch(id: string, payload: UpdateBranchRequest): Promise<ApiResponse<Branch>> {
  try {
    const res = await apiClient.put<ApiResponse<Branch>>(`/branches/${id}`, payload);
    return res.data;
  } catch (err) {
    return extractApiError(err);
  }
}
