import type { Employee, EmployeeRole, Permission } from '@clinixa/shared';
import { apiClient } from './client';
import type { ApiResponse } from './types';
import { extractApiError } from './extractApiError';

/** وحدة `/api/employees` — راجع clinixa-api-reference.md §2. */

export async function getEmployees(branchId?: string): Promise<ApiResponse<{ items: Employee[] }>> {
  try {
    const res = await apiClient.get<ApiResponse<{ items: Employee[] }>>('/employees', {
      params: branchId ? { branch_id: branchId } : undefined,
    });
    return res.data;
  } catch (err) {
    return extractApiError(err);
  }
}

export interface CreateEmployeeRequest {
  name_ar: string;
  username: string;
  role: EmployeeRole;
  branch_id?: string | null;
  permissions?: Permission[];
}

export interface CreateEmployeeResponseData {
  id: string;
  name_ar: string;
  username: string;
  role: EmployeeRole;
  temporary_password: string;
}

export async function createEmployee(
  payload: CreateEmployeeRequest,
): Promise<ApiResponse<CreateEmployeeResponseData>> {
  try {
    const res = await apiClient.post<ApiResponse<CreateEmployeeResponseData>>('/employees', payload);
    return res.data;
  } catch (err) {
    return extractApiError(err);
  }
}

export async function updateEmployeePermissions(
  id: string,
  permissions: Permission[],
): Promise<ApiResponse<{ id: string; permissions: Permission[] }>> {
  try {
    const res = await apiClient.put<ApiResponse<{ id: string; permissions: Permission[] }>>(
      `/employees/${id}/permissions`,
      { permissions },
    );
    return res.data;
  } catch (err) {
    return extractApiError(err);
  }
}

export async function resetEmployeePassword(
  id: string,
): Promise<ApiResponse<{ id: string; temporary_password: string }>> {
  try {
    const res = await apiClient.patch<ApiResponse<{ id: string; temporary_password: string }>>(
      `/employees/${id}/reset-password`,
    );
    return res.data;
  } catch (err) {
    return extractApiError(err);
  }
}

export async function toggleEmployeeActive(
  id: string,
  isActive: boolean,
): Promise<ApiResponse<{ id: string; is_active: boolean }>> {
  try {
    const res = await apiClient.patch<ApiResponse<{ id: string; is_active: boolean }>>(
      `/employees/${id}/toggle-active`,
      { is_active: isActive },
    );
    return res.data;
  } catch (err) {
    return extractApiError(err);
  }
}
