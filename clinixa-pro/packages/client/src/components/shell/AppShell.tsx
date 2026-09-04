import { Outlet } from 'react-router-dom';
import { useDocumentDirection } from '../../lib/i18n/useDocumentDirection';
import { Sidebar } from './Sidebar';
import { Topbar } from './Topbar';

/**
 * حاوية التطبيق الرئيسية بعد تسجيل الدخول — Screen 0 (Global Navigation
 * Chrome). `<IconSprite/>` مش هنا بقصد — متركّب مرة واحدة في جذر التطبيق
 * (`App.tsx`) عشان تفضل نفس المجموعة لشاشات المصادقة والـ Shell بدون
 * تكرار `id`.
 */
export function AppShell() {
  useDocumentDirection();

  return (
    <>
      <div className="bg-blobs" aria-hidden="true">
        <span />
        <span />
        <span />
      </div>
      <div className="app">
        <Sidebar />
        <div className="main">
          <Topbar />
          <main className="content">
            <Outlet />
          </main>
        </div>
      </div>
    </>
  );
}
