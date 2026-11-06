import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import type { DashboardSummary } from '../../lib/api/dashboard';
import { formatTime12h } from '../../lib/formatTime';

export interface TodayPatientsTableProps {
  patients: DashboardSummary['today_patients'];
}

export function TodayPatientsTable({ patients }: TodayPatientsTableProps) {
  const { t } = useTranslation();

  return (
    <div className="table-card glass">
      <div className="card-head">
        <h2 className="section-title">{t('dashboard.todayPatientsList')}</h2>
        <span className="pt-count num">{patients.length}</span>
      </div>

      <div className="table-responsive">
        <table className="data-table">
          <thead>
            <tr>
              <th scope="col" className="c-time">{t('dashboard.table.time')}</th>
              <th scope="col" className="c-name">{t('dashboard.table.patient')}</th>
              <th scope="col" className="c-phone">{t('dashboard.table.phone')}</th>
              <th scope="col" className="c-status">{t('dashboard.table.status')}</th>
              <th scope="col" className="c-act">{t('dashboard.table.actions')}</th>
            </tr>
          </thead>
          <tbody>
            {patients.length > 0 ? (
              patients.map((p) => (
                <tr key={p.attendance_id}>
                  <td className="c-time num">{formatTime12h(p.time)}</td>
                  <td className="c-name">
                    <div className="patient-info">
                      <Link to={`/patients/${p.patient_id}`} className="name-link">
                        <span className="name">{p.name_ar}</span>
                      </Link>
                      <span className="id num">{p.display_id}</span>
                    </div>
                  </td>
                  <td className="c-phone num">{p.phone}</td>
                  <td className="c-status">
                    <span className={`badge badge-${p.status}`}>
                      {t(`dashboard.status.${p.status}`)}
                    </span>
                  </td>
                  <td className="c-act">
                    <Link
                      to={`/patients/${p.patient_id}`}
                      className="btn btn-subtle btn-sm"
                    >
                      {t('dashboard.table.openProfile')}
                    </Link>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={5} className="empty-state">
                  {t('dashboard.noPatientsToday')}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
