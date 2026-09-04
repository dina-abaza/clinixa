import { apiClient } from './client';
import type { ApiResponse } from './types';
import { extractApiError } from './extractApiError';

/**
 * شكل الـ Request/Response مطابق حرفيًا لـ clinixa-api-reference.md §1
 * (`POST /api/setup/first-run`) وللـ schema الفعلية في
 * packages/server/src/modules/setup/setup.validation.ts.
 *
 * ⚠ `opens_at`/`closes_at`: مش موجودين في مثال الـ Request الموثّق في الـ
 * API reference ولا في schema الباك الحالية — الباك دلوقتي بيحطّ قيمة ثابتة
 * (09:00–21:00) على الفرع الرئيسي وبيتجاهل أي حاجة تانية (setup.service.ts).
 * بعتناهم هنا زيادة (بنفس اسم الحقل المستخدم لاحقًا في GET/POST /api/branches)
 * عشان الشاشة متبنيتش على بيانات ضايعة لو الباك اتحدّث يقبلهم — لكن لحد
 * ما ده يتظبّط في الباك، مدخل مواعيد العمل في الخطوة ٢ **مالوش أي أثر فعلي**.
 */
export interface FirstRunSetupRequest {
  license_key: string;
  clinic: {
    name_ar: string;
    phone: string;
    address: string | null;
    specialty: string;
    opens_at: string;
    closes_at: string;
  };
  doctor_account: {
    name_ar: string;
    username: string;
    password: string;
  };
  security: {
    question: string;
    answer: string;
  };
}

export interface FirstRunSetupResponseData {
  clinic: { name_ar: string; specialty: string; sync_mode: string };
  main_branch: { id: string; name_ar: string; is_host: boolean };
  employee: { id: string; name_ar: string; username: string; is_owner: boolean };
  token: string;
}

export async function postFirstRunSetup(
  payload: FirstRunSetupRequest,
): Promise<ApiResponse<FirstRunSetupResponseData>> {
  try {
    const res = await apiClient.post<ApiResponse<FirstRunSetupResponseData>>(
      '/setup/first-run',
      payload,
    );
    return res.data;
  } catch (err) {
    return extractApiError(err);
  }
}
