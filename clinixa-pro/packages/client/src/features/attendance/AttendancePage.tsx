import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link, useNavigate } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  getAttendanceQueue,
  callPatient,
  setAttendanceStatus,
  type AttendanceQueueItem,
  type FinishAttendanceResponseData,
} from '../../lib/api/attendance';
import { useAuthStore } from '../../lib/store/authStore';
import { hasPermission } from '../../lib/permissions';
import { getAvatarColorClass, getAvatarInitials } from '../../lib/avatar';
import { CheckInModal } from './CheckInModal';
import { FinishAttendanceModal } from './FinishAttendanceModal';
import './AttendancePage.css';

type Tab = 'today' | 'history';

const STATUS_META: Record<AttendanceQueueItem['status'], { labelKey: string; badge: string }> = {
  waiting: { labelKey: 'attendance.status.waiting', badge: 'badge-warning' },
  in_progress: { labelKey: 'attendance.status.inProgress', badge: 'badge-info' },
  done: { labelKey: 'attendance.status.done', badge: 'badge-success' },
  noshow: { labelKey: 'attendance.status.noshow', badge: 'badge-muted' },
  left: { labelKey: 'attendance.status.left', badge: 'badge-muted' },
};

function todayIso() {
  return new Date().toISOString().split('T')[0];
}

/** الحضور — Screen 9. تبويب "حضور اليوم" (طابور حي) و"سجل الحضور" (استعلام بتاريخ، نفس الـ endpoint). */
export function AttendancePage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const permissions = useAuthStore((s) => s.employee?.permissions);
  const canAdd = hasPermission(permissions, 'att.add');
  const canEdit = hasPermission(permissions, 'att.edit');
  const canDone = hasPermission(permissions, 'att.done');

  const [tab, setTab] = useState<Tab>('today');
  const [historyDate, setHistoryDate] = useState(todayIso());
  const [showCheckIn, setShowCheckIn] = useState(false);
  const [finishTarget, setFinishTarget] = useState<AttendanceQueueItem | null>(null);
  const [finishResult, setFinishResult] = useState<FinishAttendanceResponseData | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  const date = tab === 'today' ? todayIso() : historyDate;

  const queueQuery = useQuery({
    queryKey: ['attendance', date],
    queryFn: () => getAttendanceQueue(date),
  });

  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => setToast(null), 2800);
    return () => clearTimeout(timer);
  }, [toast]);

  const callMutation = useMutation({
    mutationFn: (id: string) => callPatient(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['attendance'] }),
  });

  const noshowMutation = useMutation({
    mutationFn: (id: string) => setAttendanceStatus(id, 'noshow'),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['attendance'] }),
  });

  const items = queueQuery.data?.ok ? queueQuery.data.data.items : [];
  const waitingCount = items.filter((i) => i.status === 'waiting').length;
  const isLoading = queueQuery.isLoading;
  const isEmpty = !isLoading && items.length === 0;

  function handleCheckedIn() {
    setShowCheckIn(false);
    queryClient.invalidateQueries({ queryKey: ['attendance'] });
    setToast(t('attendance.toasts.checkedIn'));
  }

  function handleFinished(result: FinishAttendanceResponseData) {
    setFinishTarget(null);
    setFinishResult(result);
    queryClient.invalidateQueries({ queryKey: ['attendance'] });
  }

  return (
    <>
      <div className="page-head">
        <div>
          <h1 className="page-title">{t('shell.nav.attendance')}</h1>
          <p className="page-sub">{t('attendance.headSub', { count: waitingCount })}</p>
        </div>
        {canAdd && (
          <div className="page-actions">
            <button type="button" className="btn btn-primary btn-inline" onClick={() => setShowCheckIn(true)}>
              <svg width={18} height={18} aria-hidden="true"><use href="#i-calendar-check" /></svg>
              <span>{t('attendance.checkIn')}</span>
            </button>
          </div>
        )}
      </div>

      <div className="tabs" role="tablist">
        <button
          type="button"
          className="tab"
          role="tab"
          aria-selected={tab === 'today'}
          onClick={() => setTab('today')}
        >
          <svg width={17} height={17} aria-hidden="true"><use href="#i-calendar-check" /></svg>
          <span>{t('attendance.tabs.today')}</span>
        </button>
        <button
          type="button"
          className="tab"
          role="tab"
          aria-selected={tab === 'history'}
          onClick={() => setTab('history')}
        >
          <svg width={17} height={17} aria-hidden="true"><use href="#i-calendar" /></svg>
          <span>{t('attendance.tabs.history')}</span>
        </button>
      </div>

      {tab === 'history' && (
        <div className="card-toolbar" style={{ marginBottom: 'var(--space-4)', borderBottom: 'none', padding: 0 }}>
          <div className="select-inline">
            <span className="lead-icon"><svg width={16} height={16} aria-hidden="true"><use href="#i-calendar" /></svg></span>
            <input
              type="date"
              value={historyDate}
              max={todayIso()}
              onChange={(e) => setHistoryDate(e.target.value)}
              style={{
                minHeight: 44,
                padding: '10px 16px',
                paddingInlineStart: 42,
                borderRadius: 'var(--radius-md)',
                border: '1px solid var(--color-border-subtle)',
                background: 'var(--color-surface-glass-elevated)',
                fontFamily: 'inherit',
                fontSize: 'var(--text-body-sm)',
                color: 'inherit',
              }}
            />
          </div>
        </div>
      )}

      <div className="table-card glass">
        {isEmpty ? (
          <div className="empty-state">
            <div className="empty-icon" aria-hidden="true">
              <svg width={24} height={24}><use href="#i-calendar-check" /></svg>
            </div>
            <h2 className="empty-title">{t('attendance.emptyTitle')}</h2>
            <p className="empty-text">{t('attendance.emptyText')}</p>
          </div>
        ) : (
          <table className="data-table" id="attendanceTable" aria-label={t('attendance.tableLabel')}>
            <thead>
              <tr>
                <th scope="col" className="c-name">{t('patients.columns.patient')}</th>
                <th scope="col" className="c-time">{t('attendance.columns.time')}</th>
                <th scope="col" className="c-status">{t('patients.columns.status')}</th>
                <th scope="col" className="c-act"><span className="sr-only">{t('common.actions')}</span></th>
              </tr>
            </thead>
            <tbody>
              {isLoading
                ? Array.from({ length: 5 }).map((_, i) => (
                    <tr key={i}>
                      <td className="c-name"><span className="skel" style={{ width: '70%' }} /></td>
                      <td className="c-time"><span className="skel" style={{ width: '50%', margin: '0 auto' }} /></td>
                      <td className="c-status"><span className="skel" style={{ width: '60%', margin: '0 auto' }} /></td>
                      <td className="c-act" />
                    </tr>
                  ))
                : items.map((item) => {
                    const meta = STATUS_META[item.status];
                    return (
                      <tr key={item.id}>
                        <td className="c-name">
                          <div className="cell-person">
                            <span className={`avatar sm ${getAvatarColorClass(item.patient_name)}`} aria-hidden="true">
                              {getAvatarInitials(item.patient_name)}
                            </span>
                            <span className="txt">
                              <Link className="pname" to={`/patients/${item.patient_id}`}>{item.patient_name}</Link>
                              <span className="pid num">{item.patient_display_id}</span>
                            </span>
                          </div>
                        </td>
                        <td className="c-time num">{item.time.slice(0, 5)}</td>
                        <td className="c-status">
                          <span className={`badge ${meta.badge}`}>{t(meta.labelKey)}</span>
                        </td>
                        <td className="c-act">
                          <div style={{ display: 'flex', gap: 'var(--space-2)', justifyContent: 'flex-end' }}>
                            {item.status === 'waiting' && canEdit && (
                              <>
                                <button
                                  type="button"
                                  className="btn btn-primary btn-inline"
                                  style={{ minHeight: 34, paddingBlock: 5 }}
                                  disabled={callMutation.isPending}
                                  onClick={() => callMutation.mutate(item.id)}
                                >
                                  {t('attendance.actions.call')}
                                </button>
                                <button
                                  type="button"
                                  className="btn btn-secondary btn-inline"
                                  style={{ minHeight: 34, paddingBlock: 5 }}
                                  disabled={noshowMutation.isPending}
                                  onClick={() => noshowMutation.mutate(item.id)}
                                >
                                  {t('attendance.actions.noshow')}
                                </button>
                              </>
                            )}
                            {item.status === 'in_progress' && canDone && (
                              <button
                                type="button"
                                className="btn btn-primary btn-inline"
                                style={{ minHeight: 34, paddingBlock: 5 }}
                                onClick={() => setFinishTarget(item)}
                              >
                                {t('attendance.actions.finish')}
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
            </tbody>
          </table>
        )}
      </div>

      {showCheckIn && <CheckInModal onClose={() => setShowCheckIn(false)} onCheckedIn={handleCheckedIn} />}

      {finishTarget && (
        <FinishAttendanceModal
          attendanceId={finishTarget.id}
          patientName={finishTarget.patient_name}
          onClose={() => setFinishTarget(null)}
          onFinished={handleFinished}
        />
      )}

      {finishResult && (
        <div className="modal-overlay open" onMouseDown={(e) => e.target === e.currentTarget && setFinishResult(null)}>
          <div className="modal" role="dialog" aria-modal="true" style={{ maxWidth: 420, textAlign: 'center' }}>
            <div className="empty-icon" style={{ margin: '0 auto var(--space-4)' }} aria-hidden="true">
              <svg width={24} height={24}><use href="#i-check-circle" /></svg>
            </div>
            <h2>{t('attendance.finishResult.title')}</h2>
            {finishResult.final_due > 0 ? (
              <p className="modal-sub">{t('attendance.finishResult.dueText', { amount: finishResult.final_due.toLocaleString() })}</p>
            ) : (
              <p className="modal-sub">{t('attendance.finishResult.noDueText')}</p>
            )}
            <div className="modal-foot" style={{ justifyContent: 'center' }}>
              <button type="button" className="btn btn-secondary" onClick={() => setFinishResult(null)}>
                {t('common.cancel')}
              </button>
              {finishResult.can_collect && (
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={() => {
                    setFinishResult(null);
                    navigate('/payments');
                  }}
                >
                  {t('attendance.finishResult.collect')}
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      <div className={`ok-toast${toast ? ' on' : ''}`} role="status">
        <svg width={18} height={18} aria-hidden="true"><use href="#i-check-circle" /></svg>
        <span>{toast}</span>
      </div>
    </>
  );
}
