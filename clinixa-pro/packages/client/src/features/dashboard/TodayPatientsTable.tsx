import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import type { DashboardSummary } from '../../lib/api/dashboard';

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
              <th>{t('dashboard.table.time')}</th>
              <th>{t('dashboard.table.patient')}</th>
              <th>{t('dashboard.table.phone')}</th>
              <th>{t('dashboard.table.status')}</th>
              <th>{t('dashboard.table.actions')}</th>
            </tr>
          </thead>
          <tbody>
            {patients.length > 0 ? (
              patients.map((p) => (
                <tr key={p.attendance_id}>
                  <td className="num">{p.time}</td>
                  <td>
                    <div className="patient-info">
                      <Link to={`/patients/${p.patient_id}`} className="name-link">
                        <span className="name">{p.name_ar}</span>
                      </Link>
                      <span className="id num">{p.display_id}</span>
                    </div>
                  </td>
                  <td className="num">{p.phone}</td>
                  <td>
                    <span className={`badge badge-${p.status}`}>
                      {t(`dashboard.status.${p.status}`)}
                    </span>
                  </td>
                  <td>
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
