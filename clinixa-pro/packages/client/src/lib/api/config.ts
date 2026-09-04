import type {
  AttendanceStatus,
  ChargeType,
  EmployeeRole,
  Permission,
  Specialty,
} from '@clinixa/shared';
import { apiClient } from './client';
import type { ApiResponse } from './types';
import { extractApiError } from './extractApiError';

/** وحدة `/api/config/constants` — راجع clinixa-api-reference.md §7. مسار عام، متاح قبل تسجيل الدخول. */

export interface ConstantsResponseData {
  charge_types: Array<{ key: ChargeType; label_ar: string }>;
  payment_methods: Array<{ key: string; label_ar: string }>;
  attendance_status: AttendanceStatus[];
  roles: EmployeeRole[];
  permissions: Permission[];
  specialties: Array<{ key: Specialty; label_ar: string; group: string }>;
}

export async function getConstants(): Promise<ApiResponse<ConstantsResponseData>> {
  try {
    const res = await apiClient.get<ApiResponse<ConstantsResponseData>>('/config/constants');
    return res.data;
  } catch (err) {
    return extractApiError(err);
  }
}
