import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { closeDay, getDaySummary, getOutstanding, reopenDay, type OutstandingItem } from '../../lib/api/payments';
import { getReadyForCheckout } from '../../lib/api/attendance';
import { useAuthStore } from '../../lib/store/authStore';
import { hasPermission } from '../../lib/permissions';
import { getAvatarColorClass, getAvatarInitials } from '../../lib/avatar';
import { AddPaymentModal, type PaymentTargetPatient } from './AddPaymentModal';
import { AddChargeModal } from './AddChargeModal';
import { ReceiptModal } from './ReceiptModal';
import type { AddPaymentResponseData } from '../../lib/api/payments';
import './PaymentsPage.css';

type Tab = 'readyForCheckout' | 'outstanding' | 'daySummary';

const AGING_THRESHOLD_DAYS = 60;

function daysSince(dateStr: string): number {
  const diff = Date.now() - new Date(dateStr).getTime();
  return Math.floor(diff / (1000 * 60 * 60 * 24));
}

/** المدفوعات — Screens 10/23. "جاهزين للتحصيل" (`/attendance/ready-for-checkout`) + "المستحقات" (`/payments/outstanding`) + "ملخص اليوم" (`/day-summary`). */
export function PaymentsPage() {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const permissions = useAuthStore((s) => s.employee?.permissions);
  const canAdd = hasPermission(permissions, 'pay.add');
  const canEdit = hasPermission(permissions, 'pay.edit');

  const [tab, setTab] = useState<Tab>('readyForCheckout');
  const [paymentTarget, setPaymentTarget] = useState<PaymentTargetPatient | 'new' | null>(null);
  const [showAddCharge, setShowAddCharge] = useState(false);
  const [receipt, setReceipt] = useState<AddPaymentResponseData | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => setToast(null), 2800);
    return () => clearTimeout(timer);
  }, [toast]);

  const readyQuery = useQuery({
    queryKey: ['ready-for-checkout'],
    queryFn: getReadyForCheckout,
    enabled: tab === 'readyForCheckout',
  });

  const outstandingQuery = useQuery({
    queryKey: ['outstanding'],
    queryFn: getOutstanding,
    enabled: tab === 'outstanding',
  });

  const summaryQuery = useQuery({
    queryKey: ['day-summary'],
    queryFn: () => getDaySummary(),
    enabled: tab === 'daySummary',
  });

  const closeDayMutation = useMutation({
    mutationFn: () => closeDay(),
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ['day-summary'] });
      if (res.ok) setToast(t('payments.toasts.dayClosed'));
    },
  });

  const reopenDayMutation = useMutation({
    mutationFn: () => reopenDay(),
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ['day-summary'] });
      if (res.ok) setToast(t('payments.toasts.dayReopened'));
    },
  });

  const readyItems = readyQuery.data?.ok ? readyQuery.data.data.items : [];
  const isReadyLoading = readyQuery.isLoading;
  const isReadyEmpty = !isReadyLoading && readyItems.length === 0;

  const items = outstandingQuery.data?.ok ? outstandingQuery.data.data.items : [];
  const totalOutstanding = outstandingQuery.data?.ok ? outstandingQuery.data.data.total_outstanding : 0;
  const isLoading = outstandingQuery.isLoading;
  const isEmpty = !isLoading && items.length === 0;

  const summary = summaryQuery.data?.ok ? summaryQuery.data.data : null;

  function invalidateFinancials() {
    queryClient.invalidateQueries({ queryKey: ['ready-for-checkout'] });
    queryClient.invalidateQueries({ queryKey: ['outstanding'] });
    queryClient.invalidateQueries({ queryKey: ['day-summary'] });
    queryClient.invalidateQueries({ queryKey: ['patients'] });
  }

  function handlePaid(result: AddPaymentResponseData) {
    setPaymentTarget(null);
    setReceipt(result);
    invalidateFinancials();
  }

  function handleChargeAdded(_: unknown, warning: { message: string } | null) {
    setShowAddCharge(false);
    invalidateFinancials();
    setToast(warning ? warning.message : t('payments.toasts.chargeAdded'));
  }

  return (
    <>
      <div className="page-head">
        <div>
          <h1 className="page-title">{t('shell.nav.payments')}</h1>
          <p className="page-sub">
            {tab === 'outstanding'
              ? t('payments.headOutstanding', { amount: totalOutstanding.toLocaleString() })
              : tab === 'readyForCheckout'
                ? t('payments.headReadyForCheckout', { count: readyItems.length })
                : t('payments.headDaySummary')}
          </p>
        </div>
        {canAdd && (
          <div className="page-actions">
            <button type="button" className="btn btn-secondary btn-inline" onClick={() => setShowAddCharge(true)}>
              <svg width={18} height={18} aria-hidden="true"><use href="#i-plus" /></svg>
              <span>{t('payments.addCharge')}</span>
            </button>
            <button type="button" className="btn btn-primary btn-inline" onClick={() => setPaymentTarget('new')}>
              <svg width={18} height={18} aria-hidden="true"><use href="#i-wallet" /></svg>
              <span>{t('payments.newPayment')}</span>
            </button>
          </div>
        )}
      </div>

      <div className="tabs" role="tablist">
        <button type="button" className="tab" role="tab" aria-selected={tab === 'readyForCheckout'} onClick={() => setTab('readyForCheckout')}>
          <svg width={17} height={17} aria-hidden="true"><use href="#i-check-circle" /></svg>
          <span>{t('payments.tabs.readyForCheckout')}</span>
          {readyItems.length > 0 && <span className="count num">{readyItems.length}</span>}
        </button>
        <button type="button" className="tab" role="tab" aria-selected={tab === 'outstanding'} onClick={() => setTab('outstanding')}>
          <svg width={17} height={17} aria-hidden="true"><use href="#i-wallet" /></svg>
          <span>{t('payments.tabs.outstanding')}</span>
        </button>
        <button type="button" className="tab" role="tab" aria-selected={tab === 'daySummary'} onClick={() => setTab('daySummary')}>
          <svg width={17} height={17} aria-hidden="true"><use href="#i-calendar" /></svg>
          <span>{t('payments.tabs.daySummary')}</span>
        </button>
      </div>

      {tab === 'readyForCheckout' && (
        <div className="table-card glass">
          {isReadyEmpty ? (
            <div className="empty-state">
              <div className="empty-icon" aria-hidden="true">
                <svg width={24} height={24}><use href="#i-check-circle" /></svg>
              </div>
              <h2 className="empty-title">{t('payments.emptyReadyTitle')}</h2>
              <p className="empty-text">{t('payments.emptyReadyText')}</p>
            </div>
          ) : (
            <table className="data-table" id="readyTable" aria-label={t('payments.tabs.readyForCheckout')}>
              <thead>
                <tr>
                  <th scope="col" className="c-name">{t('patients.columns.patient')}</th>
                  <th scope="col" className="c-due">{t('patients.columns.due')}</th>
                  <th scope="col" className="c-act"><span className="sr-only">{t('common.actions')}</span></th>
                </tr>
              </thead>
              <tbody>
                {isReadyLoading
                  ? Array.from({ length: 3 }).map((_, i) => (
                      <tr key={i}>
                        <td className="c-name"><span className="skel" style={{ width: '70%' }} /></td>
                        <td className="c-due"><span className="skel" style={{ width: '50%', margin: '0 auto' }} /></td>
                        <td className="c-act" />
                      </tr>
                    ))
                  : readyItems.map((item) => (
                      <tr key={item.attendance_id}>
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
                        <td className="c-due">
                          <span className="due-amount num">{item.due.toLocaleString()}</span>
                        </td>
                        <td className="c-act">
                          {canAdd && (
                            <button
                              type="button"
                              className="btn btn-primary btn-inline"
                              style={{ minHeight: 34, paddingBlock: 5 }}
                              onClick={() => setPaymentTarget({ id: item.patient_id, name_ar: item.patient_name, due: item.due })}
                            >
                              {t('payments.collect')}
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {tab === 'outstanding' && (
        <div className="table-card glass">
          {isEmpty ? (
            <div className="empty-state">
              <div className="empty-icon" aria-hidden="true">
                <svg width={24} height={24}><use href="#i-check-circle" /></svg>
              </div>
              <h2 className="empty-title">{t('payments.emptyOutstandingTitle')}</h2>
              <p className="empty-text">{t('payments.emptyOutstandingText')}</p>
            </div>
          ) : (
            <table className="data-table" id="outstandingTable" aria-label={t('payments.tabs.outstanding')}>
              <thead>
                <tr>
                  <th scope="col" className="c-name">{t('patients.columns.patient')}</th>
                  <th scope="col" className="c-last">{t('payments.columns.lastVisit')}</th>
                  <th scope="col" className="c-due">{t('patients.columns.due')}</th>
                  <th scope="col" className="c-act"><span className="sr-only">{t('common.actions')}</span></th>
                </tr>
              </thead>
              <tbody>
                {isLoading
                  ? Array.from({ length: 5 }).map((_, i) => (
                      <tr key={i}>
                        <td className="c-name"><span className="skel" style={{ width: '70%' }} /></td>
                        <td className="c-last"><span className="skel" style={{ width: '60%', margin: '0 auto' }} /></td>
                        <td className="c-due"><span className="skel" style={{ width: '50%', margin: '0 auto' }} /></td>
                        <td className="c-act" />
                      </tr>
                    ))
                  : items.map((item: OutstandingItem) => {
                      const aging = item.last_visit_date ? daysSince(item.last_visit_date) : null;
                      const isOld = aging !== null && aging >= AGING_THRESHOLD_DAYS;
                      return (
                        <tr key={item.patient_id}>
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
                          <td className="c-last">
                            {item.last_visit_date ? (
                              <span className={isOld ? 'due-amount' : undefined} style={{ fontSize: 'var(--text-body-sm)' }}>
                                <span className="num">{item.last_visit_date}</span>
                                {isOld && <span style={{ display: 'block', fontSize: 'var(--text-caption)' }}>{t('payments.agingDays', { count: aging })}</span>}
                              </span>
                            ) : (
                              <span className="due-none">{t('patients.dueNone')}</span>
                            )}
                          </td>
                          <td className="c-due">
                            <span className="due-amount num">{item.due.toLocaleString()}</span>
                          </td>
                          <td className="c-act">
                            {canAdd && (
                              <button
                                type="button"
                                className="btn btn-primary btn-inline"
                                style={{ minHeight: 34, paddingBlock: 5 }}
                                onClick={() => setPaymentTarget({ id: item.patient_id, name_ar: item.patient_name, due: item.due })}
                              >
                                {t('payments.collect')}
                              </button>
                            )}
                          </td>
                        </tr>
                      );
                    })}
              </tbody>
            </table>
          )}
        </div>
      )}

      {tab === 'daySummary' && (
        <>
          <div className="stat-grid">
            <div className="stat-card glass tone-a">
              <div className="stat-top">
                <span className="stat-icon" aria-hidden="true"><svg width={20} height={20}><use href="#i-wallet" /></svg></span>
                <span className="stat-label">{t('payments.summary.totalCollected')}</span>
              </div>
              <div className="stat-value"><span className="num">{(summary?.total_collected ?? 0).toLocaleString()}</span></div>
            </div>
            <div className="stat-card glass tone-b">
              <div className="stat-top">
                <span className="stat-icon" aria-hidden="true"><svg width={20} height={20}><use href="#i-file-pen" /></svg></span>
                <span className="stat-label">{t('payments.summary.totalCharges')}</span>
              </div>
              <div className="stat-value"><span className="num">{(summary?.total_charges ?? 0).toLocaleString()}</span></div>
            </div>
            <div className="stat-card glass tone-c">
              <div className="stat-top">
                <span className="stat-icon" aria-hidden="true"><svg width={20} height={20}><use href="#i-check-circle" /></svg></span>
                <span className="stat-label">{t('payments.summary.status')}</span>
              </div>
              <div className="stat-value" style={{ fontSize: 'var(--text-h3)' }}>
                {summary?.is_closed ? (
                  <span className="badge badge-muted">{t('payments.summary.closed')}</span>
                ) : (
                  <span className="badge badge-success">{t('payments.summary.open')}</span>
                )}
              </div>
            </div>
          </div>

          {canEdit && summary && (
            <div className="detail-card glass">
              {summary.is_closed ? (
                <>
                  <p style={{ marginTop: 0 }}>{t('payments.summary.reopenHint')}</p>
                  <button
                    type="button"
                    className="btn btn-secondary btn-inline"
                    disabled={reopenDayMutation.isPending}
                    onClick={() => reopenDayMutation.mutate()}
                  >
                    {t('payments.summary.reopenDay')}
                  </button>
                </>
              ) : (
                <>
                  <p style={{ marginTop: 0 }}>{t('payments.summary.closeHint')}</p>
                  <button
                    type="button"
                    className="btn btn-primary btn-inline"
                    disabled={closeDayMutation.isPending}
                    onClick={() => closeDayMutation.mutate()}
                  >
                    {t('payments.summary.closeDay')}
                  </button>
                </>
              )}
              {closeDayMutation.data && !closeDayMutation.data.ok && (
                <p className="field-error" style={{ display: 'flex', marginTop: 'var(--space-3)' }}>
                  <svg width={14} height={14} aria-hidden="true"><use href="#i-alert-circle" /></svg>
                  <span>{closeDayMutation.data.error.message}</span>
                </p>
              )}
            </div>
          )}
        </>
      )}

      {paymentTarget && (
        <AddPaymentModal
          lockedPatient={paymentTarget === 'new' ? undefined : paymentTarget}
          onClose={() => setPaymentTarget(null)}
          onPaid={handlePaid}
        />
      )}

      {showAddCharge && <AddChargeModal onClose={() => setShowAddCharge(false)} onAdded={handleChargeAdded} />}

      {receipt && <ReceiptModal receipt={receipt.receipt} onClose={() => setReceipt(null)} />}

      <div className={`ok-toast${toast ? ' on' : ''}`} role="status">
        <svg width={18} height={18} aria-hidden="true"><use href="#i-check-circle" /></svg>
        <span>{toast}</span>
      </div>
    </>
  );
}
