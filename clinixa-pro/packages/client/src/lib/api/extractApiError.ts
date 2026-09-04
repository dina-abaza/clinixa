import type { ApiError } from './types';

/** بيحوّل أي فشل axios (شبكة أو 4xx/5xx) لنفس شكل ApiError الموحّد في §0 */
export function extractApiError(err: unknown): ApiError {
  if (
    err &&
    typeof err === 'object' &&
    'response' in err &&
    err.response &&
    typeof err.response === 'object' &&
    'data' in err.response
  ) {
    const data = (err as { response: { data?: unknown } }).response.data;
    if (data && typeof data === 'object' && 'ok' in data && (data as ApiError).ok === false) {
      return data as ApiError;
    }
  }
  return {
    ok: false,
    error: { code: 'NETWORK_ERROR', message: 'تعذّر الاتصال بالسيرفر' },
  };
}
