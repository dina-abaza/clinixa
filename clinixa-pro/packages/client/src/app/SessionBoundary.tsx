import { useEffect, useRef, useState, type ReactNode } from 'react';
import { getSession } from '../lib/api/auth';
import { setAuthToken } from '../lib/api/client';
import { useAuthStore } from '../lib/store/authStore';

/**
 * بوابة استرجاع الجلسة — بتتشغّل مرة واحدة عند فتح التطبيق. لو فيه توكن
 * محفوظ من قبل (`persist` في authStore)، بتتأكد منه بـ`GET /api/auth/session`
 * قبل ما تسيب أي مسار محمي يترسم — عشان صلاحيات الموظف تفضل مطابقة لآخر
 * حالة فعلية في الباك (لو اتغيّرت أو الحساب اتعطّل من وقت آخر تسجيل دخول).
 */
export function SessionBoundary({ children }: { children: ReactNode }) {
  const [hydrated, setHydrated] = useState(useAuthStore.persist.hasHydrated());
  const token = useAuthStore((s) => s.token);
  const status = useAuthStore((s) => s.status);
  const setSession = useAuthStore((s) => s.setSession);
  const setStatus = useAuthStore((s) => s.setStatus);
  const clearSession = useAuthStore((s) => s.clearSession);

  // بيمنع تكرار محاولة الاسترجاع بسبب Effect دبل-إنفوك بتاع React StrictMode
  // في وضع التطوير (mount → cleanup → mount بنفس الـ closure) — الـ ref ده
  // بيفضل قيمته بين النداءين (بخلاف متغيّر عادي جوّه الـ effect)، فمانعيدش
  // نبدأ استرجاع جديد ولا نلغي الاستدعاء الأصلي اللي لسه مستني رد الباك.
  const restoreStartedRef = useRef(false);

  useEffect(() => {
    if (hydrated) return;
    return useAuthStore.persist.onFinishHydration(() => setHydrated(true));
  }, [hydrated]);

  useEffect(() => {
    if (!hydrated || restoreStartedRef.current) return;
    restoreStartedRef.current = true;

    if (!token) {
      setStatus('unauthenticated');
      return;
    }

    setAuthToken(token);
    setStatus('restoring');

    getSession().then((res) => {
      if (res.ok) {
        setSession({ token, employee: res.data.employee, activeBranch: res.data.active_branch });
      } else {
        clearSession();
      }
    });
  }, [hydrated, token, setSession, setStatus, clearSession]);

  if (!hydrated || status === 'idle' || status === 'restoring') {
    return (
      <div
        style={{
          display: 'grid',
          placeItems: 'center',
          height: '100vh',
          background: 'var(--color-background-canvas)',
        }}
      >
        <svg width={32} height={32} className="spinner" style={{ display: 'block', color: 'var(--color-action-primary-default)' }}>
          <use href="#i-loader" />
        </svg>
      </div>
    );
  }

  return <>{children}</>;
}
