import type { SystemAlert } from '@clinixa/shared';
import { apiClient } from './client';
import type { ApiResponse } from './types';
import { extractApiError } from './extractApiError';

/** `GET /api/system-alerts` — راجع clinixa-api-reference.md §8. جرس التنبيهات في الـ Top bar. */
export interface GetSystemAlertsResponseData {
  items: SystemAlert[];
  unread_count: number;
}

export async function getSystemAlerts(): Promise<ApiResponse<GetSystemAlertsResponseData>> {
  try {
    const res = await apiClient.get<ApiResponse<GetSystemAlertsResponseData>>('/system-alerts');
    return res.data;
  } catch (err) {
    return extractApiError(err);
  }
}

/** `PATCH /api/system-alerts/:id/read` — راجع clinixa-api-reference.md §6.2. */
export async function markSystemAlertRead(id: string): Promise<ApiResponse<{ id: string; is_read: boolean }>> {
  try {
    const res = await apiClient.patch<ApiResponse<{ id: string; is_read: boolean }>>(`/system-alerts/${id}/read`);
    return res.data;
  } catch (err) {
    return extractApiError(err);
  }
}
