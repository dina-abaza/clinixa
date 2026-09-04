import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { PAYMENT_METHODS, type PaymentMethod } from '@clinixa/shared';
import { addPayment, type AddPaymentResponseData } from '../../lib/api/payments';
import { PatientPicker, type PickerPatient } from './PatientPicker';

export type PaymentTargetPatient = PickerPatient;

interface Props {
  /** لو اتبعت، المودال بيفتح على المريض ده مباشرة (جاي من صف مستحقات) — زرار "تغيير" بيتخفي. */
  lockedPatient?: PaymentTargetPatient;
  onClose: () => void;
  onPaid: (result: AddPaymentResponseData) => void;
}

/** مودال "دفعة جديدة" — Modal مؤكد في Design System §3، مش صفحة كاملة. */
export function AddPaymentModal({ lockedPatient, onClose, onPaid }: Props) {
  const { t } = useTranslation();
  const [patient, setPatient] = useState<PaymentTargetPatient | null>(lockedPatient ?? null);
  const [amount, setAmount] = useState('');
  const [method, setMethod] = useState<PaymentMethod>('cash');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose();
    }
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [onClose]);

  const amountNum = Number(amount);
  const hasValidAmount = amount !== '' && Number.isFinite(amountNum) && amountNum > 0;
  const due = patient?.due ?? 0;
  const remaining = hasValidAmount ? Math.max(0, due - amountNum) : null;

  async function handleSubmit() {
    if (!patient || !hasValidAmount) return;
    setSubmitError(null);
    setIsSubmitting(true);
    const res = await addPayment({ patient_id: patient.id, amount: amountNum, method });
    setIsSubmitting(false);
    if (res.ok) {
      onPaid(res.data);
      return;
    }
    setSubmitError(res.error.message);
  }

  return (
    <div className="modal-overlay open" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal" role="dialog" aria-modal="true" aria-labelledby="payTitle" style={{ maxWidth: 480 }}>
        <h2 id="payTitle">{t('payments.addModal.title')}</h2>
        <p className="modal-sub">{t('payments.addModal.subtitle')}</p>

        <PatientPicker patient={patient} locked={Boolean(lockedPatient)} onSelect={setPatient} onClear={() => setPatient(null)} />

        {patient && (
          <>
            <div className="form-grid">
              <div className="form-field">
                <label htmlFor="pay-amount">{t('payments.addModal.amountLabel')}</label>
                <div className="input-wrap no-icon">
                  <input
                    id="pay-amount"
                    type="number"
                    min={0.01}
                    step={5}
                    className="num"
                    autoFocus
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                  />
                </div>
                {due > 0 && (
                  <button type="button" className="link" style={{ padding: 0, marginTop: 4 }} onClick={() => setAmount(String(due))}>
                    {t('payments.addModal.useFullDue')}
                  </button>
                )}
              </div>
              <div className="form-field">
                <label htmlFor="pay-method">{t('payments.addModal.methodLabel')}</label>
                <div className="input-wrap no-icon">
                  <select id="pay-method" value={method} onChange={(e) => setMethod(e.target.value as PaymentMethod)}>
                    {PAYMENT_METHODS.map((m) => (
                      <option key={m.key} value={m.key}>
                        {m.label_ar}
                      </option>
                    ))}
                  </select>
                  <span className="chev"><svg width={16} height={16} aria-hidden="true"><use href="#i-chevron-down" /></svg></span>
                </div>
              </div>
            </div>

            {remaining !== null && due > 0 && (
              <p className={remaining === 0 ? 'field-warn' : 'field-hint'} style={remaining === 0 ? { color: 'var(--color-status-success-text)', background: 'var(--color-status-success-bg)', borderColor: 'var(--color-status-success-border)' } : undefined}>
                {remaining === 0
                  ? t('payments.addModal.settlesFull')
                  : t('payments.addModal.remainingAfter', { amount: remaining.toLocaleString() })}
              </p>
            )}
          </>
        )}

        <div className={`form-error${submitError ? ' on' : ''}`} role="alert">
          <svg width={18} height={18} aria-hidden="true"><use href="#i-alert-circle" /></svg>
          <span>{submitError}</span>
        </div>

        <div className="modal-foot">
          <button type="button" className="btn btn-secondary" onClick={onClose} disabled={isSubmitting}>
            {t('common.cancel')}
          </button>
          <button
            type="button"
            className={`btn btn-primary${isSubmitting ? ' loading' : ''}`}
            disabled={!patient || !hasValidAmount || isSubmitting}
            onClick={handleSubmit}
          >
            <svg className="spinner" width={18} height={18} aria-hidden="true"><use href="#i-loader" /></svg>
            <span>{isSubmitting ? t('common.saving') : t('payments.addModal.submit')}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
