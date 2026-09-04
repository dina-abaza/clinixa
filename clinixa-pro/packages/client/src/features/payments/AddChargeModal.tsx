import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { CHARGE_TYPES, type ChargeType } from '@clinixa/shared';
import { addCharge, type AddChargeResponseData } from '../../lib/api/payments';
import type { ApiWarning } from '../../lib/api/types';
import { PatientPicker, type PickerPatient } from './PatientPicker';

interface Props {
  /** لو اتبعت، المودال بيفتح على المريض ده مباشرة (جاي من ملف المريض) — زرار "تغيير" بيتخفي. */
  lockedPatient?: PickerPatient;
  onClose: () => void;
  onAdded: (result: AddChargeResponseData, warning: ApiWarning | null) => void;
}

/**
 * مودال "إضافة رسم مباشر" — `POST /api/charges`. بيزوّد مستحق المريض على طول
 * (بخلاف رسوم "إنهاء الكشف" اللي بتتربط بزيارة حضور)، ومن غيره الـ endpoint
 * ده مكانش مستخدم في أي واجهة (راجع مراجعة عقد الـ API).
 */
export function AddChargeModal({ lockedPatient, onClose, onAdded }: Props) {
  const { t } = useTranslation();
  const [patient, setPatient] = useState<PickerPatient | null>(lockedPatient ?? null);
  const [chargeType, setChargeType] = useState<ChargeType>('consultation');
  const [amount, setAmount] = useState('');
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
  const hasValidAmount = amount !== '' && Number.isFinite(amountNum) && amountNum >= 0;

  async function handleSubmit() {
    if (!patient || !hasValidAmount) return;
    setSubmitError(null);
    setIsSubmitting(true);
    const res = await addCharge({ patient_id: patient.id, type: chargeType, amount: amountNum });
    setIsSubmitting(false);
    if (res.ok) {
      onAdded(res.data, res.warning);
      return;
    }
    setSubmitError(res.error.message);
  }

  return (
    <div className="modal-overlay open" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal" role="dialog" aria-modal="true" aria-labelledby="chargeTitle" style={{ maxWidth: 480 }}>
        <h2 id="chargeTitle">{t('payments.addChargeModal.title')}</h2>
        <p className="modal-sub">{t('payments.addChargeModal.subtitle')}</p>

        <PatientPicker patient={patient} locked={Boolean(lockedPatient)} onSelect={setPatient} onClear={() => setPatient(null)} />

        {patient && (
          <div className="form-grid">
            <div className="form-field">
              <label htmlFor="charge-type">{t('payments.addChargeModal.typeLabel')}</label>
              <div className="input-wrap no-icon">
                <select id="charge-type" value={chargeType} onChange={(e) => setChargeType(e.target.value as ChargeType)}>
                  {CHARGE_TYPES.map((c) => (
                    <option key={c.key} value={c.key}>
                      {c.label_ar}
                    </option>
                  ))}
                </select>
                <span className="chev"><svg width={16} height={16} aria-hidden="true"><use href="#i-chevron-down" /></svg></span>
              </div>
            </div>
            <div className="form-field">
              <label htmlFor="charge-amount">{t('payments.addChargeModal.amountLabel')}</label>
              <div className="input-wrap no-icon">
                <input
                  id="charge-amount"
                  type="number"
                  min={0}
                  step={5}
                  className="num"
                  autoFocus
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                />
              </div>
            </div>
          </div>
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
            <span>{isSubmitting ? t('common.saving') : t('payments.addChargeModal.submit')}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
