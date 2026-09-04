/**
 * شكل الاستجابة الموحّد لكل الـ API — مطابق تمامًا لـ clinixa-api-reference.md
 * §0 (Contract-First: أي تعديل شكل لازم يتحدّث في الملف ده الأول).
 */
export interface ApiWarning {
  code: string;
  message: string;
  meta?: Record<string, unknown>;
}

export interface ApiSuccess<T> {
  ok: true;
  data: T;
  warning: ApiWarning | null;
}

export interface ApiErrorBody {
  code: string;
  message: string;
  field?: string;
}

export interface ApiError {
  ok: false;
  error: ApiErrorBody;
}

export type ApiResponse<T> = ApiSuccess<T> | ApiError;
