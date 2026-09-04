import { useState, type ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  MEDICAL_HISTORY_CATEGORIES,
  LAB_STATUSES,
  type MedicalHistoryCategory,
  type LabStatus,
} from '@clinixa/shared';
import {
  getMedicalRecord,
  addMedicalAlert,
  addMedicalHistory,
  addDiagnosis,
  addMedication,
  stopMedication,
  refillMedication,
  addLab,
  addRadiology,
  type MedicalAlertTypeBackend,
} from '../../lib/api/patients';

/** أنواع التنبيه الطبي المقبولة فعليًا في الباك (patients.controller.ts) — راجع تعليق `MedicalAlertTypeBackend`. */
const ALERT_TYPES: MedicalAlertTypeBackend[] = ['allergy', 'warning', 'chronic', 'other'];
import { PrescriptionsSection } from './PrescriptionsSection';
import './MedicalRecordTab.css';

interface Props {
  patientId: string;
}

/** لوحة "قسم" داخل السجل الطبي — عنوان + عدّاد + محتوى، وزرار "+" بيفتح فورم سريع. */
function RecordSection({
  title,
  count,
  addLabel,
  isAdding,
  onToggleAdd,
  form,
  children,
}: {
  title: string;
  count: number;
  addLabel: string;
  isAdding: boolean;
  onToggleAdd: () => void;
  form: ReactNode;
  children: ReactNode;
}) {
  return (
    <div className="detail-card glass mr-section">
      <div className="card-head" style={{ margin: 'calc(-1 * var(--space-5)) calc(-1 * var(--space-5)) var(--space-4)' }}>
        <h3>{title}</h3>
        <span className="panel-head cnt-badge">{count}</span>
        <div className="spacer" />
        <button type="button" className="btn btn-tertiary btn-inline" onClick={onToggleAdd}>
          <svg width={16} height={16} aria-hidden="true"><use href={isAdding ? '#i-x' : '#i-plus'} /></svg>
          <span>{isAdding ? undefined : addLabel}</span>
        </button>
      </div>
      {isAdding && <div className="mr-form">{form}</div>}
      {count === 0 && !isAdding ? <p className="detail-value muted mr-empty">—</p> : children}
    </div>
  );
}

export function MedicalRecordTab({ patientId }: Props) {
  const { t } = useTranslation();
  const queryClient = useQueryClient();

  const recordQuery = useQuery({
    queryKey: ['medical-record', patientId],
    queryFn: () => getMedicalRecord(patientId),
  });
  const record = recordQuery.data?.ok ? recordQuery.data.data : null;

  function invalidate() {
    queryClient.invalidateQueries({ queryKey: ['medical-record', patientId] });
  }

  const [addingSection, setAddingSection] = useState<string | null>(null);
  function toggle(section: string) {
    setAddingSection((prev) => (prev === section ? null : section));
  }

  // ── تنبيهات طبية ──
  const [alertType, setAlertType] = useState<MedicalAlertTypeBackend>('allergy');
  const [alertText, setAlertText] = useState('');
  const addAlertMutation = useMutation({
    mutationFn: () => addMedicalAlert(patientId, { type: alertType, text_ar: alertText }),
    onSuccess: (res) => {
      if (res.ok) {
        setAlertText('');
        setAddingSection(null);
        invalidate();
      }
    },
  });

  // ── تاريخ مرضي ──
  const [historyCategory, setHistoryCategory] = useState<MedicalHistoryCategory>('chronic');
  const [historyText, setHistoryText] = useState('');
  const addHistoryMutation = useMutation({
    mutationFn: () => addMedicalHistory(patientId, { category: historyCategory, text_ar: historyText }),
    onSuccess: (res) => {
      if (res.ok) {
        setHistoryText('');
        setAddingSection(null);
        invalidate();
      }
    },
  });

  // ── تشخيصات ──
  const [diagnosisText, setDiagnosisText] = useState('');
  const addDiagnosisMutation = useMutation({
    mutationFn: () => addDiagnosis(patientId, { text_ar: diagnosisText }),
    onSuccess: (res) => {
      if (res.ok) {
        setDiagnosisText('');
        setAddingSection(null);
        invalidate();
      }
    },
  });

  // ── أدوية ──
  const [medName, setMedName] = useState('');
  const [medDose, setMedDose] = useState('');
  const [medFrequency, setMedFrequency] = useState('');
  const addMedicationMutation = useMutation({
    mutationFn: () => addMedication(patientId, { name: medName, dose: medDose || null, frequency: medFrequency || null, status: 'active' }),
    onSuccess: (res) => {
      if (res.ok) {
        setMedName('');
        setMedDose('');
        setMedFrequency('');
        setAddingSection(null);
        invalidate();
      }
    },
  });
  const stopMedicationMutation = useMutation({ mutationFn: (id: string) => stopMedication(id), onSuccess: invalidate });
  const refillMedicationMutation = useMutation({ mutationFn: (id: string) => refillMedication(id), onSuccess: invalidate });

  // ── تحاليل ──
  const [labName, setLabName] = useState('');
  const [labDate, setLabDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [labStatus, setLabStatus] = useState<LabStatus>('pending');
  const addLabMutation = useMutation({
    mutationFn: () => addLab(patientId, { name: labName, date: labDate, status: labStatus }),
    onSuccess: (res) => {
      if (res.ok) {
        setLabName('');
        setAddingSection(null);
        invalidate();
      }
    },
  });

  // ── أشعة ──
  const [radType, setRadType] = useState('');
  const [radDate, setRadDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [radReport, setRadReport] = useState('');
  const addRadiologyMutation = useMutation({
    mutationFn: () => addRadiology(patientId, { type: radType, date: radDate, report: radReport || null }),
    onSuccess: (res) => {
      if (res.ok) {
        setRadType('');
        setRadReport('');
        setAddingSection(null);
        invalidate();
      }
    },
  });

  if (recordQuery.isLoading) {
    return <p className="detail-value muted">{t('common.saving')}</p>;
  }
  if (!record) return null;

  return (
    <div className="mr-grid">
      <RecordSection
        title={t('patients.medicalRecord.alerts')}
        count={record.medical_alerts.length}
        addLabel={t('patients.medicalRecord.addAlert')}
        isAdding={addingSection === 'alerts'}
        onToggleAdd={() => toggle('alerts')}
        form={
          <div className="mr-form-row">
            <select value={alertType} onChange={(e) => setAlertType(e.target.value as MedicalAlertTypeBackend)}>
              {ALERT_TYPES.map((k) => (
                <option key={k} value={k}>{t(`patients.medicalRecord.alertTypes.${k}`)}</option>
              ))}
            </select>
            <input type="text" value={alertText} onChange={(e) => setAlertText(e.target.value)} placeholder={t('patients.medicalRecord.textPlaceholder')} />
            <button type="button" className="btn btn-primary btn-inline" disabled={!alertText.trim() || addAlertMutation.isPending} onClick={() => addAlertMutation.mutate()}>
              {t('common.save')}
            </button>
          </div>
        }
      >
        <ul className="mr-list">
          {record.medical_alerts.map((a) => (
            <li key={a.id} className={a.type === 'allergy' ? 'mr-alert-danger' : undefined}>
              <span className="badge badge-warning" style={{ marginInlineEnd: 8 }}>{t(`patients.medicalRecord.alertTypes.${a.type}`)}</span>
              {a.text_ar}
            </li>
          ))}
        </ul>
      </RecordSection>

      <RecordSection
        title={t('patients.medicalRecord.history')}
        count={record.medical_history.length}
        addLabel={t('patients.medicalRecord.addHistory')}
        isAdding={addingSection === 'history'}
        onToggleAdd={() => toggle('history')}
        form={
          <div className="mr-form-row">
            <select value={historyCategory} onChange={(e) => setHistoryCategory(e.target.value as MedicalHistoryCategory)}>
              {MEDICAL_HISTORY_CATEGORIES.map((k) => (
                <option key={k} value={k}>{t(`patients.medicalRecord.historyCategories.${k}`)}</option>
              ))}
            </select>
            <input type="text" value={historyText} onChange={(e) => setHistoryText(e.target.value)} placeholder={t('patients.medicalRecord.textPlaceholder')} />
            <button type="button" className="btn btn-primary btn-inline" disabled={!historyText.trim() || addHistoryMutation.isPending} onClick={() => addHistoryMutation.mutate()}>
              {t('common.save')}
            </button>
          </div>
        }
      >
        <ul className="mr-list">
          {record.medical_history.map((h) => (
            <li key={h.id}>
              <span className="badge badge-muted" style={{ marginInlineEnd: 8 }}>{t(`patients.medicalRecord.historyCategories.${h.category}`)}</span>
              {h.text_ar}
            </li>
          ))}
        </ul>
      </RecordSection>

      <RecordSection
        title={t('patients.medicalRecord.diagnoses')}
        count={record.diagnoses.length}
        addLabel={t('patients.medicalRecord.addDiagnosis')}
        isAdding={addingSection === 'diagnoses'}
        onToggleAdd={() => toggle('diagnoses')}
        form={
          <div className="mr-form-row">
            <input type="text" value={diagnosisText} onChange={(e) => setDiagnosisText(e.target.value)} placeholder={t('patients.medicalRecord.textPlaceholder')} />
            <button type="button" className="btn btn-primary btn-inline" disabled={!diagnosisText.trim() || addDiagnosisMutation.isPending} onClick={() => addDiagnosisMutation.mutate()}>
              {t('common.save')}
            </button>
          </div>
        }
      >
        <ul className="mr-list">
          {record.diagnoses.map((d) => (
            <li key={d.id}>
              <span className="mr-date num">{d.date}</span> — {d.text_ar}
            </li>
          ))}
        </ul>
      </RecordSection>

      <RecordSection
        title={t('patients.medicalRecord.medications')}
        count={record.medications.length}
        addLabel={t('patients.medicalRecord.addMedication')}
        isAdding={addingSection === 'medications'}
        onToggleAdd={() => toggle('medications')}
        form={
          <div className="mr-form-row mr-form-row-wide">
            <input type="text" value={medName} onChange={(e) => setMedName(e.target.value)} placeholder={t('patients.medicalRecord.medNamePlaceholder')} />
            <input type="text" value={medDose} onChange={(e) => setMedDose(e.target.value)} placeholder={t('patients.medicalRecord.medDosePlaceholder')} />
            <input type="text" value={medFrequency} onChange={(e) => setMedFrequency(e.target.value)} placeholder={t('patients.medicalRecord.medFrequencyPlaceholder')} />
            <button type="button" className="btn btn-primary btn-inline" disabled={!medName.trim() || addMedicationMutation.isPending} onClick={() => addMedicationMutation.mutate()}>
              {t('common.save')}
            </button>
          </div>
        }
      >
        <ul className="mr-list">
          {record.medications.map((m) => (
            <li key={m.id} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ flex: 1 }}>
                <strong>{m.name}</strong>
                {m.dose ? ` · ${m.dose}` : ''}
                {m.frequency ? ` · ${m.frequency}` : ''}
              </span>
              <span className={`badge ${m.status === 'active' ? 'badge-success' : 'badge-muted'}`}>
                {t(`patients.medicalRecord.medicationStatus.${m.status}`)}
              </span>
              {m.status === 'active' ? (
                <button type="button" className="link" onClick={() => stopMedicationMutation.mutate(m.id)}>
                  {t('patients.medicalRecord.stop')}
                </button>
              ) : (
                <button type="button" className="link" onClick={() => refillMedicationMutation.mutate(m.id)}>
                  {t('patients.medicalRecord.refill')}
                </button>
              )}
            </li>
          ))}
        </ul>
      </RecordSection>

      <RecordSection
        title={t('patients.medicalRecord.labs')}
        count={record.labs.length}
        addLabel={t('patients.medicalRecord.addLab')}
        isAdding={addingSection === 'labs'}
        onToggleAdd={() => toggle('labs')}
        form={
          <div className="mr-form-row mr-form-row-wide">
            <input type="text" value={labName} onChange={(e) => setLabName(e.target.value)} placeholder={t('patients.medicalRecord.labNamePlaceholder')} />
            <input type="date" value={labDate} onChange={(e) => setLabDate(e.target.value)} />
            <select value={labStatus} onChange={(e) => setLabStatus(e.target.value as LabStatus)}>
              {LAB_STATUSES.map((k) => (
                <option key={k} value={k}>{t(`patients.medicalRecord.labStatus.${k}`)}</option>
              ))}
            </select>
            <button type="button" className="btn btn-primary btn-inline" disabled={!labName.trim() || addLabMutation.isPending} onClick={() => addLabMutation.mutate()}>
              {t('common.save')}
            </button>
          </div>
        }
      >
        <ul className="mr-list">
          {record.labs.map((l) => (
            <li key={l.id}>
              <span className="mr-date num">{l.date}</span> — {l.name}{' '}
              <span className={`badge ${l.status === 'abnormal' ? 'badge-error' : l.status === 'normal' ? 'badge-success' : 'badge-muted'}`}>
                {t(`patients.medicalRecord.labStatus.${l.status}`)}
              </span>
            </li>
          ))}
        </ul>
      </RecordSection>

      <RecordSection
        title={t('patients.medicalRecord.radiology')}
        count={record.radiology.length}
        addLabel={t('patients.medicalRecord.addRadiology')}
        isAdding={addingSection === 'radiology'}
        onToggleAdd={() => toggle('radiology')}
        form={
          <div className="mr-form-row mr-form-row-wide">
            <input type="text" value={radType} onChange={(e) => setRadType(e.target.value)} placeholder={t('patients.medicalRecord.radTypePlaceholder')} />
            <input type="date" value={radDate} onChange={(e) => setRadDate(e.target.value)} />
            <input type="text" value={radReport} onChange={(e) => setRadReport(e.target.value)} placeholder={t('patients.medicalRecord.radReportPlaceholder')} />
            <button type="button" className="btn btn-primary btn-inline" disabled={!radType.trim() || addRadiologyMutation.isPending} onClick={() => addRadiologyMutation.mutate()}>
              {t('common.save')}
            </button>
          </div>
        }
      >
        <ul className="mr-list">
          {record.radiology.map((r) => (
            <li key={r.id}>
              <span className="mr-date num">{r.date}</span> — {r.type}
              {r.report ? ` · ${r.report}` : ''}
            </li>
          ))}
        </ul>
      </RecordSection>

      <div className="detail-card glass mr-section">
        <div className="card-head" style={{ margin: 'calc(-1 * var(--space-5)) calc(-1 * var(--space-5)) var(--space-4)' }}>
          <h3>{t('patients.medicalRecord.documents')}</h3>
          <span className="panel-head cnt-badge">{record.documents.length}</span>
        </div>
        {record.documents.length === 0 ? (
          <p className="detail-value muted mr-empty">—</p>
        ) : (
          <ul className="mr-list">
            {record.documents.map((d) => (
              <li key={d.id}>
                <span className="mr-date num">{d.date}</span> — {d.file_name}
              </li>
            ))}
          </ul>
        )}
      </div>

      <PrescriptionsSection patientId={patientId} />
    </div>
  );
}
