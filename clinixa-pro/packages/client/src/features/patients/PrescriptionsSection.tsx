import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { addPrescription, type AddPrescriptionResponseData, type PrescriptionItemInput } from '../../lib/api/patients';

interface Props {
  patientId: string;
}

interface ItemRow extends PrescriptionItemInput {
  key: number;
}

let seq = 0;

/**
 * الوصفات الطبية — `POST /api/patients/:id/prescriptions`. ⭐ بترجّع تنبيهات
 * الحساسية دايمًا مع كل حفظ (قرار ١١١ في المرجع) — بتتعرض كتحذير فورًا.
 *
 * ⚠ الباك مفيهوش أي `GET` لوصفات المريض (راجع `patients.routes.ts` —
 * `POST` بس)، فمفيش طريقة نجيب بيها الوصفات القديمة بعد تحميل الصفحة تاني.
 * القايمة هنا بتعرض وصفات الجلسة الحالية بس (من رد الحفظ نفسه) — أفضل من
 * إنها تختفي فورًا بعد الحفظ، لكن مش سجل دائم لحد ما endpoint للقراءة يتضاف.
 */
export function PrescriptionsSection({ patientId }: Props) {
  const { t } = useTranslation();
  const [isAdding, setIsAdding] = useState(false);
  const [rows, setRows] = useState<ItemRow[]>([{ key: seq++, drug: '', dose: '', frequency: '', duration: '', instructions: '' }]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [alerts, setAlerts] = useState<{ text_ar: string }[] | null>(null);
  const [savedPrescriptions, setSavedPrescriptions] = useState<AddPrescriptionResponseData['prescription'][]>([]);

  function addRow() {
    setRows((prev) => [...prev, { key: seq++, drug: '', dose: '', frequency: '', duration: '', instructions: '' }]);
  }
  function removeRow(key: number) {
    setRows((prev) => prev.filter((r) => r.key !== key));
  }
  function updateRow(key: number, patch: Partial<ItemRow>) {
    setRows((prev) => prev.map((r) => (r.key === key ? { ...r, ...patch } : r)));
  }

  async function handleSubmit() {
    const items = rows.filter((r) => r.drug.trim());
    if (items.length === 0) return;
    setIsSubmitting(true);
    const res = await addPrescription(patientId, { items });
    setIsSubmitting(false);
    if (res.ok) {
      setAlerts(res.data.medical_alerts.length > 0 ? res.data.medical_alerts : null);
      setSavedPrescriptions((prev) => [res.data.prescription, ...prev]);
      setRows([{ key: seq++, drug: '', dose: '', frequency: '', duration: '', instructions: '' }]);
      setIsAdding(false);
    }
  }

  return (
    <div className="detail-card glass mr-section" style={{ gridColumn: '1 / -1' }}>
      <div className="card-head" style={{ margin: 'calc(-1 * var(--space-5)) calc(-1 * var(--space-5)) var(--space-4)' }}>
        <h3>{t('patients.medicalRecord.prescriptions')}</h3>
        {savedPrescriptions.length > 0 && <span className="panel-head cnt-badge">{savedPrescriptions.length}</span>}
        <div className="spacer" />
        <button type="button" className="btn btn-tertiary btn-inline" onClick={() => setIsAdding((v) => !v)}>
          <svg width={16} height={16} aria-hidden="true"><use href={isAdding ? '#i-x' : '#i-plus'} /></svg>
          <span>{isAdding ? undefined : t('patients.medicalRecord.addPrescription')}</span>
        </button>
      </div>

      {alerts && (
        <div className="notice" role="alert" style={{ marginBottom: 'var(--space-4)' }}>
          <svg width={18} height={18} aria-hidden="true"><use href="#i-alert-triangle" /></svg>
          <span>
            <strong>{t('patients.medicalRecord.prescriptionAlertsTitle')}</strong>{' '}
            {alerts.map((a) => a.text_ar).join(' · ')}
          </span>
        </div>
      )}

      {isAdding && (
        <div className="mr-form">
          {rows.map((row) => (
            <div key={row.key} className="mr-form-row mr-form-row-wide" style={{ marginBottom: 'var(--space-2)' }}>
              <input type="text" value={row.drug} onChange={(e) => updateRow(row.key, { drug: e.target.value })} placeholder={t('patients.medicalRecord.rx.drug')} />
              <input type="text" value={row.dose ?? ''} onChange={(e) => updateRow(row.key, { dose: e.target.value })} placeholder={t('patients.medicalRecord.rx.dose')} />
              <input type="text" value={row.frequency ?? ''} onChange={(e) => updateRow(row.key, { frequency: e.target.value })} placeholder={t('patients.medicalRecord.rx.frequency')} />
              <input type="text" value={row.duration ?? ''} onChange={(e) => updateRow(row.key, { duration: e.target.value })} placeholder={t('patients.medicalRecord.rx.duration')} />
              <button type="button" className="icon-btn" style={{ width: 34, height: 34 }} onClick={() => removeRow(row.key)} aria-label={t('common.cancel')}>
                <svg width={16} height={16} aria-hidden="true"><use href="#i-x" /></svg>
              </button>
            </div>
          ))}
          <div style={{ display: 'flex', gap: 'var(--space-2)', marginTop: 'var(--space-2)' }}>
            <button type="button" className="btn btn-secondary btn-inline" onClick={addRow}>
              <svg width={16} height={16} aria-hidden="true"><use href="#i-plus" /></svg>
              <span>{t('attendance.finishModal.addItem')}</span>
            </button>
            <button
              type="button"
              className={`btn btn-primary btn-inline${isSubmitting ? ' loading' : ''}`}
              disabled={isSubmitting || rows.every((r) => !r.drug.trim())}
              onClick={handleSubmit}
            >
              <svg className="spinner" width={18} height={18} aria-hidden="true"><use href="#i-loader" /></svg>
              <span>{t('common.save')}</span>
            </button>
          </div>
        </div>
      )}

      {savedPrescriptions.length === 0 && !isAdding ? (
        <p className="detail-value muted mr-empty">—</p>
      ) : (
        <ul className="mr-list">
          {savedPrescriptions.map((rx) => (
            <li key={rx.id}>
              <span className="mr-date num">{rx.date}</span>
              <ul style={{ listStyle: 'none', margin: 'var(--space-1) 0 0', padding: 0, display: 'flex', flexDirection: 'column', gap: 4 }}>
                {rx.items.map((item, i) => (
                  <li key={i}>
                    <strong>{item.drug}</strong>
                    {item.dose ? ` · ${item.dose}` : ''}
                    {item.frequency ? ` · ${item.frequency}` : ''}
                    {item.duration ? ` · ${item.duration}` : ''}
                  </li>
                ))}
              </ul>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
