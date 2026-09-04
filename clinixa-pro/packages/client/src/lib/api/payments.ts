import type { Charge, ChargeType, Payment, PaymentMethod } from '@clinixa/shared';
import { apiClient } from './client';
import type { ApiResponse } from './types';
import { extractApiError } from './extractApiError';

/**
 * وحدة `/api/charges`، `/api/payments`، `/api/day-summary` — مطابقة لـ
 * clinixa-api-reference.md §4، ولـ packages/server/src/modules/payments
 * (payments.service.ts هو المصدر الأدق لشكل استجابة `day-summary`، بيرجّع
 * `is_closed`/`closed_at` مش الشكل الموثّق في المرجع بالحرف).
 */

// ─────────────────────────────────────────────────────────────
// الرسوم (Charges)
// ─────────────────────────────────────────────────────────────

export async function getChargesByPatient(patientId: string): Promise<ApiResponse<{ items: Charge[] }>> {
  try {
    const res = await apiClient.get<ApiResponse<{ items: Charge[] }>>('/charges', {
      params: { patient_id: patientId },
    });
    return res.data;
  } catch (err) {
    return extractApiError(err);
  }
}

export interface AddChargeRequest {
  patient_id: string;
  type: ChargeType;
  amount: number;
}

export interface AddChargeResponseData {
  id: string;
  patient_id: string;
  type: ChargeType;
  amount: number;
  date: string;
  time: string;
}

export async function addCharge(payload: AddChargeRequest): Promise<ApiResponse<AddChargeResponseData>> {
  try {
    const res = await apiClient.post<ApiResponse<AddChargeResponseData>>('/charges', payload);
    return res.data;
  } catch (err) {
    return extractApiError(err);
  }
}

// ─────────────────────────────────────────────────────────────
// المدفوعات (Payments)
// ─────────────────────────────────────────────────────────────

export async function getPaymentsByPatient(patientId: string): Promise<ApiResponse<{ items: Payment[] }>> {
  try {
    const res = await apiClient.get<ApiResponse<{ items: Payment[] }>>('/payments', {
      params: { patient_id: patientId },
    });
    return res.data;
  } catch (err) {
    return extractApiError(err);
  }
}

export interface AddPaymentRequest {
  patient_id: string;
  amount: number;
  method: PaymentMethod;
}

export interface PaymentReceipt {
  clinic_name: string;
  branch_name: string;
  branch_phone: string;
  patient_name: string;
  amount: number;
  method: string;
  date: string;
  remaining_line_visible: boolean;
  remaining_amount: number;
}

export interface AddPaymentResponseData {
  payment: {
    id: string;
    patient_id: string;
    amount: number;
    method: PaymentMethod;
    date: string;
    time: string;
    recorded_by: string;
    after_day_close: boolean;
  };
  remaining_due: number;
  receipt: PaymentReceipt;
}

export async function addPayment(payload: AddPaymentRequest): Promise<ApiResponse<AddPaymentResponseData>> {
  try {
    const res = await apiClient.post<ApiResponse<AddPaymentResponseData>>('/payments', payload);
    return res.data;
  } catch (err) {
    return extractApiError(err);
  }
}

// ─────────────────────────────────────────────────────────────
// المستحقات (Outstanding)
// ─────────────────────────────────────────────────────────────

export interface OutstandingItem {
  patient_id: string;
  patient_name: string;
  patient_display_id: string;
  due: number;
  last_visit_date: string | null;
}

export interface OutstandingResponseData {
  items: OutstandingItem[];
  total_outstanding: number;
}

export async function getOutstanding(): Promise<ApiResponse<OutstandingResponseData>> {
  try {
    const res = await apiClient.get<ApiResponse<OutstandingResponseData>>('/payments/outstanding');
    return res.data;
  } catch (err) {
    return extractApiError(err);
  }
}

// ─────────────────────────────────────────────────────────────
// ملخص اليوم المالي (Day Summary)
// ─────────────────────────────────────────────────────────────

export interface DaySummaryResponseData {
  date: string;
  branch_id: string;
  total_collected: number;
  total_charges: number;
  is_closed: boolean;
  closed_at: string | null;
}

export async function getDaySummary(date?: string): Promise<ApiResponse<DaySummaryResponseData>> {
  try {
    const res = await apiClient.get<ApiResponse<DaySummaryResponseData>>('/day-summary', {
      params: date ? { date } : undefined,
    });
    return res.data;
  } catch (err) {
    return extractApiError(err);
  }
}

export interface CloseDayResponseData {
  date: string;
  closed_by: string;
  closed_at: string;
  total_collected: number;
  total_charges: number;
}

export async function closeDay(date?: string): Promise<ApiResponse<CloseDayResponseData>> {
  try {
    const res = await apiClient.post<ApiResponse<CloseDayResponseData>>('/day-summary/close', date ? { date } : {});
    return res.data;
  } catch (err) {
    return extractApiError(err);
  }
}

export interface ReopenDayResponseData {
  date: string;
  reopened_by: string;
  reopened_at: string;
  message: string;
}

export async function reopenDay(date?: string): Promise<ApiResponse<ReopenDayResponseData>> {
  try {
    const res = await apiClient.post<ApiResponse<ReopenDayResponseData>>(
      '/day-summary/reopen',
      date ? { date } : {},
    );
    return res.data;
  } catch (err) {
    return extractApiError(err);
  }
}
