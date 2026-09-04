import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuthStore } from '../lib/store/authStore';

/**
 * حارس المسارات المحمية — بيتشغّل بعد ما `SessionBoundary` يحسم حالة الجلسة
 * (مش idle/restoring خالص وقت ما ده بيترسم). بيحفظ المسار المطلوب في
 * `state.from` عشان `LoginPage` يرجّع المستخدم لمكانه بعد الدخول.
 */
export function ProtectedRoute() {
  const status = useAuthStore((s) => s.status);
  const location = useLocation();

  if (status !== 'authenticated') {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  return <Outlet />;
}
