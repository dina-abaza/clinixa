import type { InventoryItem, InventoryType } from '@clinixa/shared';
import { apiClient } from './client';
import type { ApiResponse } from './types';
import { extractApiError } from './extractApiError';

/** وحدة `/api/inventory` — راجع clinixa-api-reference.md §1. */

export async function getInventory(branchId?: string): Promise<ApiResponse<{ items: InventoryItem[] }>> {
  try {
    const res = await apiClient.get<ApiResponse<{ items: InventoryItem[] }>>('/inventory', {
      params: branchId ? { branch_id: branchId } : undefined,
    });
    return res.data;
  } catch (err) {
    return extractApiError(err);
  }
}

export interface CreateInventoryItemRequest {
  name_ar: string;
  name_en?: string | null;
  type: InventoryType;
  qty?: number;
  min_qty?: number | null;
  unit: string;
  branch_id?: string;
}

export async function createInventoryItem(
  payload: CreateInventoryItemRequest,
): Promise<ApiResponse<InventoryItem>> {
  try {
    const res = await apiClient.post<ApiResponse<InventoryItem>>('/inventory', payload);
    return res.data;
  } catch (err) {
    return extractApiError(err);
  }
}

export type UpdateInventoryItemRequest = Partial<
  Omit<CreateInventoryItemRequest, 'branch_id'> & { is_active: boolean }
>;

export async function updateInventoryItem(
  id: string,
  payload: UpdateInventoryItemRequest,
): Promise<ApiResponse<InventoryItem>> {
  try {
    const res = await apiClient.put<ApiResponse<InventoryItem>>(`/inventory/${id}`, payload);
    return res.data;
  } catch (err) {
    return extractApiError(err);
  }
}

export interface AdjustQtyResponseData {
  id: string;
  qty: number;
  min_qty: number | null;
  low_stock: boolean;
}

export async function adjustInventoryQty(id: string, qty: number): Promise<ApiResponse<AdjustQtyResponseData>> {
  try {
    const res = await apiClient.patch<ApiResponse<AdjustQtyResponseData>>(`/inventory/${id}/adjust-qty`, { qty });
    return res.data;
  } catch (err) {
    return extractApiError(err);
  }
}
