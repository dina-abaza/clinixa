import { NavLink } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import type { Permission } from '@clinixa/shared';
import { useAuthStore } from '../../lib/store/authStore';
import { hasPermission } from '../../lib/permissions';

interface NavItemDef {
  to: string;
  icon: string;
  labelKey: string;
  permission: Permission | null;
}

/** العناصر الستة — نفس ترتيب البروتوتايب بالحرف (Screen 0). بدون صلاحية = ظاهر للكل (لوحة التحكم فقط). */
const NAV_ITEMS: NavItemDef[] = [
  { to: '/dashboard', icon: 'i-dashboard', labelKey: 'shell.nav.dashboard', permission: null },
  { to: '/patients', icon: 'i-users', labelKey: 'shell.nav.patients', permission: 'pat.view' },
  { to: '/attendance', icon: 'i-calendar-check', labelKey: 'shell.nav.attendance', permission: 'att.view' },
  { to: '/payments', icon: 'i-wallet', labelKey: 'shell.nav.payments', permission: 'pay.view' },
  { to: '/inventory', icon: 'i-package', labelKey: 'shell.nav.inventory', permission: 'inv.view' },
  { to: '/admin', icon: 'i-settings', labelKey: 'shell.nav.admin', permission: 'admin.view' },
];

/** الشريط الجانبي — Screen 0. العناصر اللي مالهاش صلاحية بتتخفي بالكامل، مش Disabled (Design System §3). */
export function Sidebar() {
  const { t } = useTranslation();
  const permissions = useAuthStore((s) => s.employee?.permissions);

  return (
    <nav className="sidebar" aria-label={t('shell.nav.mainNavigation')}>
      <div className="brand-row">
        <svg viewBox="0 0 48 48" fill="none" role="img" aria-label="Clinixa">
          <path d="M39 13.4A18 18 0 1 0 39 34.6" stroke="url(#logoGrad)" strokeWidth={6.4} strokeLinecap="round" />
          <circle cx={24} cy={20} r={4.4} fill="url(#logoGrad)" />
          <path d="M14.6 26.4a11.2 11.2 0 0 0 19.6 0" stroke="url(#logoGrad)" strokeWidth={5.2} strokeLinecap="round" />
        </svg>
        <span className="name">Clinixa</span>
      </div>

      {NAV_ITEMS.filter((item) => !item.permission || hasPermission(permissions, item.permission)).map(
        (item) => (
          <NavLink key={item.to} className="nav-item" to={item.to}>
            <svg width={20} height={20} aria-hidden="true">
              <use href={`#${item.icon}`} />
            </svg>
            <span>{t(item.labelKey)}</span>
          </NavLink>
        ),
      )}
      <div className="nav-spacer" />
    </nav>
  );
}
