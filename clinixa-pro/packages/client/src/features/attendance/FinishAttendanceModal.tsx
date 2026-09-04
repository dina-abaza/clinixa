import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { CHARGE_TYPES, type ChargeType } from '@clinixa/shared';
import { finishAttendance, type FinishAttendanceResponseData } from '../../lib/api/attendance';
import { useAuthStore } from '../../lib/store/authStore';
import { hasPermission } from '../../lib/permissions';

interface Props {
  attendanceId: string;
  patientName: string;
  onClose: () => void;
  onFinished: (result: FinishAttendanceResponseData) => void;
}

interface ChargeRow {
  key: number;
  charge_type: ChargeType;
  amount: string;
}

let rowKeySeq = 0;

/** مودال إنهاء الكشف — الفعل المركّب ⭐ (رسوم + متابعة اختيارية) `POST /api/attendance/:id/finish`. */
export function FinishAttendanceModal({ attendanceId, patientName, onClose, onFinished }: Props) {
  const { t } = useTranslation();
  const permissions = useAuthStore((s) => s.employee?.permissions);
  const canAddCharges = hasPermission(permissions, 'pay.add');

  const [rows, setRows] = useState<ChargeRow[]>(
    canAddCharges ? [{ key: rowKeySeq++, charge_type: 'consultation', amount: '' }] : [],
  );
  const [followUpEnabled, setFollowUpEnabled] = useState(false);
  const [followUpDays, setFollowUpDays] = useState('14');
  const [followUpFee, setFollowUpFee] = useState('');
  const [followUpReason, setFollowUpReason] = useState('');

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose();
    }
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [onClose]);

  function addRow() {
    setRows((prev) => [...prev, { key: rowKeySeq++, charge_type: 'consultation', amount: '' }]);
  }
  function removeRow(key: number) {
    setRows((prev) => prev.filter((r) => r.key !== key));
  }
  function updateRow(key: number, patch: Partial<ChargeRow>) {
    setRows((prev) => prev.map((r) => (r.key === key ? { ...r, ...patch } : r)));
  }

  const total = rows.reduce((sum, r) => sum + (Number(r.amount) || 0), 0);

  async function handleSubmit() {
    setSubmitError(null);
    setIsSubmitting(true);

    const items = rows
      .filter((r) => Number(r.amount) > 0)
      .map((r) => ({ charge_type: r.charge_type, amount: Number(r.amount) }));

    const res = await finishAttendance(attendanceId, {
      items,
      follow_up: followUpEnabled
        ? {
            days: Number(followUpDays) || 1,
            fee: followUpFee ? Number(followUpFee) : null,
            reason: followUpReason || null,
          }
        : null,
    });

    setIsSubmitting(false);
    if (res.ok) {
      onFinished(res.data);
      return;
    }
    setSubmitError(res.error.message);
  }

  return (
    <div className="modal-overlay open" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal" role="dialog" aria-modal="true" aria-labelledby="finishTitle" style={{ maxWidth: 560 }}>
        <h2 id="finishTitle">{t('attendance.finishModal.title')}</h2>
        <p className="modal-sub">{t('attendance.finishModal.subtitle', { name: patientName })}</p>

        {canAddCharges && (
          <>
            <div className="np-sec" style={{ marginTop: 0, paddingTop: 0, borderTop: 'none' }}>
              {t('attendance.finishModal.chargesSection')}
            </div>
            {rows.map((row) => (
              <div key={row.key} className="ci-two" style={{ marginBottom: 'var(--space-2)', alignItems: 'center' }}>
                <div className="select-inline">
                  <select
                    value={row.charge_type}
                    onChange={(e) => updateRow(row.key, { charge_type: e.target.value as ChargeType })}
                  >
                    {CHARGE_TYPES.map((c) => (
                      <option key={c.key} value={c.key}>
                        {c.label_ar}
                      </option>
                    ))}
                  </select>
                  <span className="chev"><svg width={16} height={16} aria-hidden="true"><use href="#i-chevron-down" /></svg></span>
                </div>
                <div style={{ display: 'flex', gap: 'var(--space-2)', alignItems: 'center' }}>
                  <input
                    type="number"
                    min={0}
                    step={5}
                    className="fu-fee-in"
                    value={row.amount}
                    onChange={(e) => updateRow(row.key, { amount: e.target.value })}
                    placeholder="0"
                    aria-label={t('attendance.finishModal.amount')}
                  />
                  <button
                    type="button"
                    className="icon-btn"
                    style={{ width: 34, height: 34 }}
                    onClick={() => removeRow(row.key)}
                    aria-label={t('common.cancel')}
                  >
                    <svg width={16} height={16} aria-hidden="true"><use href="#i-x" /></svg>
                  </button>
                </div>
              </div>
            ))}
            <button type="button" className="btn btn-secondary btn-inline fu-add" onClick={addRow} style={{ marginBottom: 'var(--space-3)' }}>
              <svg width={16} height={16} aria-hidden="true"><use href="#i-plus" /></svg>
              <span>{t('attendance.finishModal.addItem')}</span>
            </button>
            {total > 0 && (
              <div className="col-total">
                <span>{t('attendance.finishModal.total')}</span>
                <span className="num">{total.toLocaleString()}</span>
              </div>
            )}
          </>
        )}

        <div className="ci-purpose">
          <label style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', cursor: 'pointer', marginBottom: followUpEnabled ? 'var(--space-3)' : 0 }}>
            <input type="checkbox" className="cbx" checked={followUpEnabled} onChange={(e) => setFollowUpEnabled(e.target.checked)} />
            <span className="ci-lbl" style={{ marginBottom: 0 }}>{t('attendance.finishModal.followUpToggle')}</span>
          </label>

          {followUpEnabled && (
            <div className="form-grid">
              <div className="form-field">
                <label htmlFor="fu-days">{t('attendance.finishModal.followUpDays')}</label>
                <div className="input-wrap no-icon">
                  <input id="fu-days" type="number" min={1} className="num" value={followUpDays} onChange={(e) => setFollowUpDays(e.target.value)} />
                </div>
              </div>
              <div className="form-field">
                <label htmlFor="fu-fee">{t('attendance.finishModal.followUpFee')}</label>
                <div className="input-wrap no-icon">
                  <input id="fu-fee" type="number" min={0} className="num" value={followUpFee} onChange={(e) => setFollowUpFee(e.target.value)} placeholder="0" />
                </div>
              </div>
              <div className="form-field wide">
                <label htmlFor="fu-reason">{t('attendance.finishModal.followUpReason')}</label>
                <div className="input-wrap no-icon">
                  <input id="fu-reason" type="text" value={followUpReason} onChange={(e) => setFollowUpReason(e.target.value)} />
                </div>
              </div>
            </div>
          )}
        </div>

        <div className={`form-error${submitError ? ' on' : ''}`} role="alert">
          <svg width={18} height={18} aria-hidden="true"><use href="#i-alert-circle" /></svg>
          <span>{submitError}</span>
        </div>

        <div className="modal-foot">
          <button type="button" className="btn btn-secondary" onClick={onClose} disabled={isSubmitting}>
            {t('common.cancel')}
          </button>
          <button type="button" className={`btn btn-primary${isSubmitting ? ' loading' : ''}`} disabled={isSubmitting} onClick={handleSubmit}>
            <svg className="spinner" width={18} height={18} aria-hidden="true"><use href="#i-loader" /></svg>
            <span>{isSubmitting ? t('common.saving') : t('attendance.finishModal.submit')}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
