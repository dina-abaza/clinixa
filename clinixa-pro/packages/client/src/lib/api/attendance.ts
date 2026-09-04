import type { AttendanceStatus, ChargeType, FollowUpStatus } from '@clinixa/shared';
import { apiClient } from './client';
import type { ApiResponse } from './types';
import { extractApiError } from './extractApiError';

/**
 * وحدة `/api/attendance` — مطابقة لـ clinixa-api-reference.md §3 ولـ
 * packages/server/src/modules/attendance (راجع attendance.service.ts —
 * هو المصدر الأدق لشكل الاستجابة الفعلي، الشاشة اتبنت عليه مباشرة).
 */

export interface AttendanceQueueItem {
  id: string;
  patient_id: string;
  patient_name: string;
  patient_display_id: string;
  date: string;
  time: string;
  status: AttendanceStatus;
  items: number[];
}

export async function getAttendanceQueue(date?: string): Promise<ApiResponse<{ items: AttendanceQueueItem[] }>> {
  try {
    const res = await apiClient.get<ApiResponse<{ items: AttendanceQueueItem[] }>>('/attendance', {
      params: date ? { date } : undefined,
    });
    return res.data;
  } catch (err) {
    return extractApiError(err);
  }
}

export interface CheckInResponseData {
  id: string;
  patient_id: string;
  status: 'waiting';
  date: string;
  time: string;
}

export async function checkInPatient(patientId: string): Promise<ApiResponse<CheckInResponseData>> {
  try {
    const res = await apiClient.post<ApiResponse<CheckInResponseData>>('/attendance/check-in', {
      patient_id: patientId,
    });
    return res.data;
  } catch (err) {
    return extractApiError(err);
  }
}

export interface CallResponseData {
  id: string;
  status: 'in_progress';
}

export async function callPatient(attendanceId: string): Promise<ApiResponse<CallResponseData>> {
  try {
    const res = await apiClient.patch<ApiResponse<CallResponseData>>(`/attendance/${attendanceId}/call`);
    return res.data;
  } catch (err) {
    return extractApiError(err);
  }
}

export interface SetStatusResponseData {
  id: string;
  status: 'noshow' | 'left';
}

export async function setAttendanceStatus(
  attendanceId: string,
  status: 'noshow' | 'left',
): Promise<ApiResponse<SetStatusResponseData>> {
  try {
    const res = await apiClient.patch<ApiResponse<SetStatusResponseData>>(`/attendance/${attendanceId}/status`, {
      status,
    });
    return res.data;
  } catch (err) {
    return extractApiError(err);
  }
}

export interface FinishChargeItemInput {
  charge_type: ChargeType;
  amount: number;
}

export interface FinishFollowUpInput {
  days: number;
  fee?: number | null;
  reason?: string | null;
}

export interface FinishAttendanceRequest {
  items?: FinishChargeItemInput[];
  follow_up?: FinishFollowUpInput | null;
}

export interface FinishAttendanceResponseData {
  attendance: { id: string; status: 'done' };
  charges_created: { id: string; type: ChargeType; amount: number; date: string; time: string }[];
  follow_up_created: { id: string; due_date: string; fee: number; status: FollowUpStatus } | null;
  final_due: number;
  can_collect: boolean;
}

export async function finishAttendance(
  attendanceId: string,
  payload: FinishAttendanceRequest,
): Promise<ApiResponse<FinishAttendanceResponseData>> {
  try {
    const res = await apiClient.post<ApiResponse<FinishAttendanceResponseData>>(
      `/attendance/${attendanceId}/finish`,
      payload,
    );
    return res.data;
  } catch (err) {
    return extractApiError(err);
  }
}

export interface ReadyForCheckoutItem {
  attendance_id: string;
  patient_id: string;
  patient_name: string;
  patient_display_id: string;
  due: number;
}

export async function getReadyForCheckout(): Promise<ApiResponse<{ items: ReadyForCheckoutItem[] }>> {
  try {
    const res = await apiClient.get<ApiResponse<{ items: ReadyForCheckoutItem[] }>>(
      '/attendance/ready-for-checkout',
    );
    return res.data;
  } catch (err) {
    return extractApiError(err);
  }
}
