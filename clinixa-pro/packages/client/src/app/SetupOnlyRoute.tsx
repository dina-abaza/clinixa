import { Navigate, Outlet } from 'react-router-dom';
import { useAuthStore } from '../lib/store/authStore';
import { isSetupComplete } from '../lib/setupState';

/**
 * حارس `/setup` — دفاع إضافي بالإضافة لـ `RootRedirect`: لو حد وصل للمسار ده
 * مباشرة (رابط محفوظ، رجوع للخلف) والجهاز أصلًا معدّي عليه الإعداد أو فيه
 * جلسة شغّالة، بيتنقل بعيد عن الويزارد بدل ما يعرضه تاني.
 */
export function SetupOnlyRoute() {
  const status = useAuthStore((s) => s.status);

  if (status === 'authenticated') return <Navigate to="/dashboard" replace />;
  if (isSetupComplete()) return <Navigate to="/login" replace />;
  return <Outlet />;
}
