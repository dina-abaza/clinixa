import { apiClient } from './client';
import type { ApiResponse } from './types';
import { extractApiError } from './extractApiError';

export interface DashboardSummary {
  stats: {
    today_attendance: number;
    waiting_count: number;
    today_payments: number;
    low_stock_count: number;
  };
  today_patients: Array<{
    attendance_id: string;
    status: 'waiting' | 'in_progress' | 'done' | 'cancelled';
    time: string;
    patient_id: string;
    display_id: string;
    name_ar: string;
    phone: string;
  }>;
}

/**
 * @description جلب ملخص لوحة التحكم (الإحصائيات ومرضى اليوم)
 */
export async function getDashboardSummary(): Promise<ApiResponse<DashboardSummary>> {
  try {
    const res = await apiClient.get<ApiResponse<DashboardSummary>>('/dashboard/summary');
    return res.data;
  } catch (err) {
    return extractApiError(err);
  }
}
