import axios from 'axios';

/**
 * عميل HTTP واحد لكل الفرونت — الـ base URL بييجي من VITE_API_BASE_URL
 * (راجع .env.example)، وبيفضل شغّال حتى من غير ملف .env محلي بقيمة افتراضية
 * مطابقة لسيرفر التطوير (packages/server, PORT=4321).
 */
export const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:4321/api',
  headers: { 'Content-Type': 'application/json' },
});

/**
 * التوكن بيتحط هنا بعد أي نجاح Login/Setup — ومعاه في كل Request بعد كده
 * زي ما موثّق في §0: "الهيدرز المطلوبة في كل Request بعد تسجيل الدخول".
 */
export function setAuthToken(token: string | null) {
  if (token) {
    apiClient.defaults.headers.common.Authorization = `Bearer ${token}`;
  } else {
    delete apiClient.defaults.headers.common.Authorization;
  }
}
