import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { CHARGE_TYPES, PAYMENT_METHODS } from '@clinixa/shared';
import { getChargesByPatient, getPaymentsByPatient, type AddChargeResponseData, type AddPaymentResponseData } from '../../lib/api/payments';
import { useAuthStore } from '../../lib/store/authStore';
import { hasPermission } from '../../lib/permissions';
import { AddChargeModal } from '../payments/AddChargeModal';
import { AddPaymentModal } from '../payments/AddPaymentModal';
import { ReceiptModal } from '../payments/ReceiptModal';
import type { ApiWarning } from '../../lib/api/types';
import './PatientFinanceTab.css';

interface Props {
  patientId: string;
  patientName: string;
  due: number;
}

const CHARGE_TYPE_LABELS = Object.fromEntries(CHARGE_TYPES.map((c) => [c.key, c.label_ar]));
const PAYMENT_METHOD_LABELS = Object.fromEntries(PAYMENT_METHODS.map((m) => [m.key, m.label_ar]));

/**
 * تبويب "الحركة المالية" في ملف المريض — `GET /api/charges` و`GET /api/payments`
 * بفلتر `patient_id`، ومفيش UI ليهم قبل كده رغم إنهم موجودين في الباك.
 */
export function PatientFinanceTab({ patientId, patientName, due }: Props) {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const permissions = useAuthStore((s) => s.employee?.permissions);
  const canAdd = hasPermission(permissions, 'pay.add');

  const [showAddCharge, setShowAddCharge] = useState(false);
  const [showAddPayment, setShowAddPayment] = useState(false);
  const [receipt, setReceipt] = useState<AddPaymentResponseData | null>(null);

  const chargesQuery = useQuery({
    queryKey: ['charges', patientId],
    queryFn: () => getChargesByPatient(patientId),
  });
  const paymentsQuery = useQuery({
    queryKey: ['payments', patientId],
    queryFn: () => getPaymentsByPatient(patientId),
  });

  const charges = chargesQuery.data?.ok ? chargesQuery.data.data.items : [];
  const payments = paymentsQuery.data?.ok ? paymentsQuery.data.data.items : [];

  function invalidate() {
    queryClient.invalidateQueries({ queryKey: ['charges', patientId] });
    queryClient.invalidateQueries({ queryKey: ['payments', patientId] });
    queryClient.invalidateQueries({ queryKey: ['patient', patientId] });
    queryClient.invalidateQueries({ queryKey: ['patients'] });
  }

  function handleChargeAdded(_result: AddChargeResponseData, _warning: ApiWarning | null) {
    setShowAddCharge(false);
    invalidate();
  }

  function handlePaid(result: AddPaymentResponseData) {
    setShowAddPayment(false);
    setReceipt(result);
    invalidate();
  }

  return (
    <>
      {canAdd && (
        <div className="fin-actions">
          <button type="button" className="btn btn-secondary btn-inline" onClick={() => setShowAddCharge(true)}>
            <svg width={18} height={18} aria-hidden="true"><use href="#i-plus" /></svg>
            <span>{t('payments.addCharge')}</span>
          </button>
          <button type="button" className="btn btn-primary btn-inline" onClick={() => setShowAddPayment(true)}>
            <svg width={18} height={18} aria-hidden="true"><use href="#i-wallet" /></svg>
            <span>{t('payments.collect')}</span>
          </button>
        </div>
      )}

      <div className="fin-grid">
        <div className="detail-card glass">
          <div className="card-head" style={{ margin: 'calc(-1 * var(--space-5)) calc(-1 * var(--space-5)) var(--space-4)' }}>
            <h3>{t('patients.finance.charges')}</h3>
            <span className="panel-head cnt-badge">{charges.length}</span>
          </div>
          {charges.length === 0 ? (
            <p className="detail-value muted" style={{ margin: 0 }}>—</p>
          ) : (
            <ul className="fin-list">
              {charges.map((c) => (
                <li key={c.id} className="fin-row">
                  <span className="fin-txt">
                    {CHARGE_TYPE_LABELS[c.type] ?? c.type}
                    <span className="fin-date num">{c.date}</span>
                  </span>
                  <span className="fin-amt debit num">{c.amount.toLocaleString()}</span>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="detail-card glass">
          <div className="card-head" style={{ margin: 'calc(-1 * var(--space-5)) calc(-1 * var(--space-5)) var(--space-4)' }}>
            <h3>{t('patients.finance.payments')}</h3>
            <span className="panel-head cnt-badge">{payments.length}</span>
          </div>
          {payments.length === 0 ? (
            <p className="detail-value muted" style={{ margin: 0 }}>—</p>
          ) : (
            <ul className="fin-list">
              {payments.map((p) => (
                <li key={p.id} className="fin-row">
                  <span className="fin-txt">
                    {PAYMENT_METHOD_LABELS[p.method] ?? p.method}
                    <span className="fin-date num">{p.date}</span>
                  </span>
                  <span className="fin-amt credit num">{p.amount.toLocaleString()}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      {showAddCharge && (
        <AddChargeModal
          lockedPatient={{ id: patientId, name_ar: patientName, due }}
          onClose={() => setShowAddCharge(false)}
          onAdded={handleChargeAdded}
        />
      )}
      {showAddPayment && (
        <AddPaymentModal
          lockedPatient={{ id: patientId, name_ar: patientName, due }}
          onClose={() => setShowAddPayment(false)}
          onPaid={handlePaid}
        />
      )}
      {receipt && <ReceiptModal receipt={receipt.receipt} onClose={() => setReceipt(null)} />}
    </>
  );
}
