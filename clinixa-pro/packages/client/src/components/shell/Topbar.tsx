import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '../../lib/store/authStore';
import { useTheme } from '../../lib/theme/useTheme';
import { getAvatarColorClass, getAvatarInitials } from '../../lib/avatar';
import { getSystemAlerts, markSystemAlertRead } from '../../lib/api/systemAlerts';
import { postLogout } from '../../lib/api/auth';
import { useDropdownMenu } from './useDropdownMenu';
import { GlobalSearch } from './GlobalSearch';

/** الشريط العلوي — Screen 0: فرع نشط، بحث عام، لغة/مظهر، تنبيهات النظام، وحساب المستخدم. */
export function Topbar() {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { theme, toggleTheme } = useTheme();
  const employee = useAuthStore((s) => s.employee);
  const activeBranch = useAuthStore((s) => s.activeBranch);
  const clearSession = useAuthStore((s) => s.clearSession);
  const isEnglish = i18n.language === 'en';

  const bellMenu = useDropdownMenu<HTMLDivElement>();
  const accMenu = useDropdownMenu<HTMLDivElement>();

  const alertsQuery = useQuery({
    queryKey: ['system-alerts'],
    queryFn: getSystemAlerts,
    staleTime: 60_000,
  });
  const alerts = alertsQuery.data?.ok ? alertsQuery.data.data.items : [];
  const unreadCount = alertsQuery.data?.ok ? alertsQuery.data.data.unread_count : 0;

  const markReadMutation = useMutation({
    mutationFn: (id: string) => markSystemAlertRead(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['system-alerts'] }),
  });

  const [loggingOut, setLoggingOut] = useState(false);

  async function handleLogout() {
    setLoggingOut(true);
    await postLogout();
    clearSession();
    navigate('/login', { replace: true });
  }

  const employeeName = employee?.name_ar ?? '';

  return (
    <header className="topbar">
      {activeBranch && (
        <div className="branch-switch" aria-label={t('shell.topbar.activeBranch')}>
          <svg width={16} height={16} aria-hidden="true">
            <use href="#i-building" />
          </svg>
          <span>{activeBranch.name_ar}</span>
        </div>
      )}

      <GlobalSearch />

      <div className="topbar-spacer" />

      <button
        type="button"
        className="icon-btn lang-btn"
        onClick={() => i18n.changeLanguage(isEnglish ? 'ar' : 'en')}
        aria-label={t('common.switchLanguage')}
      >
        <span>{isEnglish ? 'AR' : 'EN'}</span>
      </button>
      <button
        type="button"
        className="icon-btn"
        onClick={toggleTheme}
        aria-label={t('common.switchTheme')}
      >
        <svg width={20} height={20} aria-hidden="true">
          <use href={theme === 'dark' ? '#i-sun' : '#i-moon'} />
        </svg>
      </button>

      <div className="menu-wrap" ref={bellMenu.ref}>
        <button
          type="button"
          className="icon-btn"
          aria-haspopup="true"
          aria-expanded={bellMenu.open}
          onClick={bellMenu.toggle}
          aria-label={t('shell.topbar.systemAlerts')}
        >
          <svg width={20} height={20} aria-hidden="true">
            <use href="#i-alert-triangle" />
          </svg>
          {unreadCount > 0 && <span className="badge-dot num">{unreadCount}</span>}
        </button>
        <div className={`dropdown${bellMenu.open ? ' open' : ''}`} role="menu">
          <div className="dropdown-head">{t('shell.topbar.systemAlerts')}</div>
          {alerts.length === 0 ? (
            <div className="ci-none">{t('shell.topbar.noAlerts')}</div>
          ) : (
            alerts.slice(0, 5).map((alert) => (
              <button
                type="button"
                className="menu-item"
                key={alert.id}
                role="menuitem"
                style={{ opacity: alert.is_read ? 0.6 : 1 }}
                onClick={() => !alert.is_read && markReadMutation.mutate(alert.id)}
              >
                <svg
                  width={18}
                  height={18}
                  className={alert.type === 'backup_failed' ? 'a-err' : 'a-warn'}
                  aria-hidden="true"
                >
                  <use href={alert.type === 'backup_failed' ? '#i-database' : '#i-alert-triangle'} />
                </svg>
                <span className="txt">
                  <span>{alert.title}</span>
                  {alert.detail && <span className="meta">{alert.detail}</span>}
                </span>
              </button>
            ))
          )}
        </div>
      </div>

      <div className="menu-wrap" ref={accMenu.ref}>
        <button
          type="button"
          className="user-chip"
          aria-haspopup="true"
          aria-expanded={accMenu.open}
          onClick={accMenu.toggle}
        >
          <span className={`avatar sm ${getAvatarColorClass(employeeName)}`} aria-hidden="true">
            {getAvatarInitials(employeeName)}
          </span>
          <span className="txt">
            <span className="u-name">{employeeName}</span>
            <span className="u-role" style={{ display: 'block' }}>
              {employee ? t(`shell.roles.${employee.role}`) : ''}
            </span>
          </span>
          <svg width={14} height={14} aria-hidden="true">
            <use href="#i-chevron-down" />
          </svg>
        </button>
        <div className={`dropdown${accMenu.open ? ' open' : ''}`} role="menu">
          <button
            type="button"
            className="menu-item danger"
            role="menuitem"
            disabled={loggingOut}
            onClick={handleLogout}
          >
            <svg width={18} height={18} aria-hidden="true">
              <use href="#i-logout" />
            </svg>
            <span>{t('shell.topbar.logout')}</span>
          </button>
        </div>
      </div>
    </header>
  );
}
