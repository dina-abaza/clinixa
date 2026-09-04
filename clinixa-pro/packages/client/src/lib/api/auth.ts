import type { EmployeeRole, Permission } from '@clinixa/shared';
import { apiClient } from './client';
import type { ApiResponse } from './types';
import { extractApiError } from './extractApiError';

/**
 * شكل الـ Request/Response مطابق لـ clinixa-api-reference.md §1 (`POST
 * /api/auth/login`) ولـ packages/server/src/modules/auth/auth.service.ts
 * (`LoginResult`) — نفس أسماء الحقول بالحرف.
 */
export interface LoginRequest {
  username: string;
  password: string;
}

export type { Permission };

export interface LoginResponseData {
  token: string;
  employee: {
    id: string;
    name_ar: string;
    username: string;
    role: EmployeeRole;
    is_owner: boolean;
    branch_id: string | null;
    permissions: Permission[];
  };
  active_branch: {
    id: string;
    name_ar: string;
  };
}

export async function postLogin(payload: LoginRequest): Promise<ApiResponse<LoginResponseData>> {
  try {
    const res = await apiClient.post<ApiResponse<LoginResponseData>>('/auth/login', payload);
    return res.data;
  } catch (err) {
    return extractApiError(err);
  }
}

/**
 * `GET /api/auth/security-question?username=...` — راجع
 * getSecurityQuestion() في auth.service.ts. مفيش authMiddleware عليها
 * (المستخدم لسه مش داخل).
 */
export interface SecurityQuestionResponseData {
  question: string;
}

export async function getSecurityQuestion(
  username: string,
): Promise<ApiResponse<SecurityQuestionResponseData>> {
  try {
    const res = await apiClient.get<ApiResponse<SecurityQuestionResponseData>>(
      '/auth/security-question',
      { params: { username } },
    );
    return res.data;
  } catch (err) {
    return extractApiError(err);
  }
}

/**
 * `POST /api/auth/forgot-password` — راجع resetPassword() في auth.service.ts.
 *
 * ⚠ الباك مالوش endpoint منفصل للتحقق من الإجابة بمفردها — التحقق الحقيقي
 * الوحيد بيحصل هنا، مع كلمة السر الجديدة في نفس الطلب. يعني خطوة ٢ (الإجابة)
 * في الشاشة **مش بتتأكد من الباك إلا وقت حفظ خطوة ٣** — لو غلط، الرد بيرجع
 * بـ `field: "security_answer"` والفرونت لازم يرجّع المستخدم لخطوة ٢ يعرضه
 * هناك (بدل ما يفضل واقف في خطوة ٣ بخطأ مالوش حقل يتحط عليه).
 */
export interface ForgotPasswordRequest {
  username: string;
  security_answer: string;
  new_password: string;
}

export interface ForgotPasswordResponseData {
  message: string;
}

export async function postForgotPassword(
  payload: ForgotPasswordRequest,
): Promise<ApiResponse<ForgotPasswordResponseData>> {
  try {
    const res = await apiClient.post<ApiResponse<ForgotPasswordResponseData>>(
      '/auth/forgot-password',
      payload,
    );
    return res.data;
  } catch (err) {
    return extractApiError(err);
  }
}

/**
 * `GET /api/auth/session` — نفس شكل بيانات `LoginResponseData` بدون `token`
 * (التوكن بيتبعت في الهيدر أصلًا). بيتستخدم لاسترجاع الجلسة بعد Refresh
 * للصفحة أو فتح التطبيق من جديد، طالما التوكن لسه محفوظ ومعروف.
 */
export type SessionResponseData = Omit<LoginResponseData, 'token'>;

export async function getSession(): Promise<ApiResponse<SessionResponseData>> {
  try {
    const res = await apiClient.get<ApiResponse<SessionResponseData>>('/auth/session');
    return res.data;
  } catch (err) {
    return extractApiError(err);
  }
}

/** `POST /api/auth/logout` — راجع authService.logout() في auth.service.ts. */
export interface LogoutResponseData {
  message: string;
}

export async function postLogout(): Promise<ApiResponse<LogoutResponseData>> {
  try {
    const res = await apiClient.post<ApiResponse<LogoutResponseData>>('/auth/logout');
    return res.data;
  } catch (err) {
    return extractApiError(err);
  }
}
