import { Navigate, Outlet } from 'react-router-dom';
import { useAuthStore } from '../lib/store/authStore';

/** حارس `/login` و`/forgot-password` — مستخدم مسجّل دخول أصلًا يترجّع للوحة التحكم بدل ما يشوف فورم الدخول تاني. */
export function GuestOnlyRoute() {
  const status = useAuthStore((s) => s.status);

  if (status === 'authenticated') return <Navigate to="/dashboard" replace />;
  return <Outlet />;
}
