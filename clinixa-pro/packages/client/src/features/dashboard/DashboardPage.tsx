import { useTranslation } from 'react-i18next';
import { useQuery } from '@tanstack/react-query';
import { getDashboardSummary } from '../../lib/api/dashboard';
import { useAuthStore } from '../../lib/store/authStore';
import { StatCard } from './StatCard';
import { TodayPatientsTable } from './TodayPatientsTable';
import { DashboardSkeleton } from './DashboardSkeleton';
import './DashboardPage.css';

export function DashboardPage() {
  const { t, i18n } = useTranslation();
  const employee = useAuthStore((s) => s.employee);

  const { data, isLoading, isFetching, refetch } = useQuery({
    queryKey: ['dashboard-summary'],
    queryFn: async () => {
      const res = await getDashboardSummary();
      if (!res.ok) throw new Error(res.error.message);
      return res.data;
    },
    refetchInterval: 60000, // تحديث دوري كل دقيقة
  });

  const today = new Date();
  const dateStr = today.toLocaleDateString(i18n.language === 'ar' ? 'ar-EG' : 'en-US', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  if (isLoading) {
    return <DashboardSkeleton />;
  }

  const stats = data?.stats;
  const patients = data?.today_patients || [];

  return (
    <div className="dashboard-page">
      <div className="page-head">
        <div className="stack">
          <h1 className="page-title">
            {t('dashboard.welcome', { name: employee?.name_ar || employee?.username || '' })}
          </h1>
          <p className="page-sub">{dateStr}</p>
        </div>

        <div className="page-actions">
          <button
            type="button"
            className="btn btn-secondary btn-sm"
            onClick={() => refetch()}
            disabled={isFetching}
            title={t('dashboard.refresh')}
          >
            <svg
              width={16}
              height={16}
              aria-hidden="true"
              className={isFetching ? 'spin' : ''}
            >
              <use href="#i-refresh" />
            </svg>
            <span>{t('dashboard.refresh')}</span>
          </button>
        </div>
      </div>

      <div className="stat-grid">
        {/* بطاقة مرضى اليوم */}
        <StatCard
          label={t('dashboard.stats.todayPatients')}
          value={stats?.today_attendance ?? 0}
          iconId="i-users"
          tone="tone-a"
          to="/attendance"
        />

        {/* بطاقة في الانتظار */}
        <StatCard
          label={t('dashboard.stats.waitingNow')}
          value={stats?.waiting_count ?? 0}
          iconId="i-clock"
          tone="tone-a"
          to="/attendance"
        />

        {/* بطاقة مدفوعات اليوم */}
        <StatCard
          label={t('dashboard.stats.todayPayments')}
          value={stats?.today_payments ?? 0}
          iconId="i-wallet"
          tone="tone-b"
          currency={t('common.currency')}
          to="/payments"
        />

        {/* بطاقة تنبيهات المخزون */}
        <StatCard
          label={t('dashboard.stats.lowStock')}
          value={stats?.low_stock_count ?? 0}
          iconId="i-alert-triangle"
          tone="tone-c"
          to="/inventory"
          foot={
            stats?.low_stock_count && stats.low_stock_count > 0
              ? t('dashboard.stats.needsReview')
              : undefined
          }
          footTone="danger"
        />
      </div>

      <TodayPatientsTable patients={patients} />
    </div>
  );
}
