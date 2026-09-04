import { Navigate } from 'react-router-dom';
import { useAuthStore } from '../lib/store/authStore';
import { isSetupComplete } from '../lib/setupState';

/**
 * وجهة "/" — بتتقرر حسب حالة فعلية، مش تحويل ثابت لـ `/setup` (كان بيفضّل
 * يطلب الترخيص تاني في كل فتح للتطبيق حتى بعد ما الإعداد يخلص). بتترسم
 * جوّه `<SessionBoundary>` في App.tsx، يعني `status` هنا وصل لحالته
 * النهائية (مش idle/restoring) قبل ما الكومبوننت ده يترسم أصلًا.
 */
export function RootRedirect() {
  const status = useAuthStore((s) => s.status);

  if (status === 'authenticated') return <Navigate to="/dashboard" replace />;
  if (isSetupComplete()) return <Navigate to="/login" replace />;
  return <Navigate to="/setup" replace />;
}
