import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link, useParams } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { getPatient, togglePatientActive, type PatientDetail } from '../../lib/api/patients';
import { useAuthStore } from '../../lib/store/authStore';
import { hasPermission } from '../../lib/permissions';
import { getAvatarColorClass, getAvatarInitials } from '../../lib/avatar';
import { EditPatientModal } from './EditPatientModal';
import { MedicalRecordTab } from './MedicalRecordTab';
import { PatientFinanceTab } from './PatientFinanceTab';

type Tab = 'overview' | 'medical' | 'finance';

const RELATION_LABEL_KEYS: Record<string, string> = {
  father: 'patients.relations.father',
  mother: 'patients.relations.mother',
  spouse: 'patients.relations.spouse',
  sibling: 'patients.relations.sibling',
  other: 'patients.relations.other',
};

/** ملف المريض — Screen 4. تبويب "نظرة عامة" و"السجل الطبي". */
export function PatientProfilePage() {
  const { t } = useTranslation();
  const { id } = useParams<{ id: string }>();
  const queryClient = useQueryClient();
  const permissions = useAuthStore((s) => s.employee?.permissions);
  const canEdit = hasPermission(permissions, 'pat.edit');
  const canOff = hasPermission(permissions, 'pat.off');

  const [tab, setTab] = useState<Tab>('overview');
  const [showEdit, setShowEdit] = useState(false);

  const patientQuery = useQuery({
    queryKey: ['patient', id],
    queryFn: () => getPatient(id as string),
    enabled: Boolean(id),
  });

  const toggleActiveMutation = useMutation({
    mutationFn: (is_active: boolean) => togglePatientActive(id as string, is_active),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['patient', id] });
      queryClient.invalidateQueries({ queryKey: ['patients'] });
    },
  });

  if (patientQuery.isLoading) {
    return (
      <div className="entity-head glass">
        <span className="skel circle" style={{ width: 52, height: 52 }} />
        <span className="skel" style={{ width: 200 }} />
      </div>
    );
  }

  if (!patientQuery.data?.ok) {
    return (
      <div className="empty-state">
        <div className="empty-icon" aria-hidden="true"><svg width={24} height={24}><use href="#i-search-x" /></svg></div>
        <h2 className="empty-title">{t('patients.profile.notFoundTitle')}</h2>
        <p className="empty-text">{patientQuery.data?.error.message}</p>
      </div>
    );
  }

  const patient: PatientDetail = patientQuery.data.data;

  function handleUpdated(updated: PatientDetail) {
    setShowEdit(false);
    queryClient.setQueryData(['patient', id], { ok: true, data: updated, warning: null });
    queryClient.invalidateQueries({ queryKey: ['patients'] });
  }

  return (
    <>
      <div className="breadcrumb">
        <Link to="/patients">{t('shell.nav.patients')}</Link>
        <span className="sep" aria-hidden="true">/</span>
        <span aria-current="page">{patient.name_ar}</span>
      </div>

      <div className="entity-head glass">
        <div className="who">
          <span className={`avatar lg ${getAvatarColorClass(patient.name_ar)}`} aria-hidden="true">
            {getAvatarInitials(patient.name_ar)}
          </span>
          <div className="titles">
            <h1>
              {patient.name_ar}
              {patient.is_active ? (
                <span className="badge badge-success">{t('patients.statusActive')}</span>
              ) : (
                <span className="badge badge-muted">{t('patients.statusInactive')}</span>
              )}
            </h1>
            <p className="meta">
              <span className="num">{patient.display_id}</span> · {t('patients.profile.ageGender', { age: patient.age, gender: t(`patients.fields.gender${patient.gender === 'male' ? 'Male' : 'Female'}`) })}
              {patient.due > 0 && (
                <>
                  {' · '}
                  <span className="due-amount num">{t('patients.profile.dueLabel', { amount: patient.due.toLocaleString() })}</span>
                </>
              )}
            </p>
          </div>
        </div>
        <div className="acts">
          {canEdit && (
            <button type="button" className="btn btn-secondary btn-inline" onClick={() => setShowEdit(true)}>
              <svg width={18} height={18} aria-hidden="true"><use href="#i-file-pen" /></svg>
              <span>{t('patients.profile.edit')}</span>
            </button>
          )}
          {canOff && (
            <button
              type="button"
              className="btn btn-danger-soft btn-inline"
              disabled={toggleActiveMutation.isPending}
              onClick={() => toggleActiveMutation.mutate(!patient.is_active)}
            >
              <svg width={18} height={18} aria-hidden="true"><use href="#i-user-x" /></svg>
              <span>{patient.is_active ? t('patients.deactivate') : t('patients.activate')}</span>
            </button>
          )}
        </div>
      </div>

      <div className="tabs" role="tablist">
        <button type="button" className="tab" role="tab" aria-selected={tab === 'overview'} onClick={() => setTab('overview')}>
          <span>{t('patients.profile.tabOverview')}</span>
        </button>
        <button type="button" className="tab" role="tab" aria-selected={tab === 'medical'} onClick={() => setTab('medical')}>
          <span>{t('patients.profile.tabMedical')}</span>
        </button>
        <button type="button" className="tab" role="tab" aria-selected={tab === 'finance'} onClick={() => setTab('finance')}>
          <span>{t('patients.profile.tabFinance')}</span>
        </button>
      </div>

      {tab === 'overview' ? (
        <div className="detail-card glass">
          <div className="detail-grid">
            <div className="detail-item">
              <span className="detail-label">{t('patients.fields.phone')}</span>
              <span className="detail-value num">{patient.phone}</span>
            </div>
            <div className="detail-item">
              <span className="detail-label">{t('patients.fields.address')}</span>
              <span className={`detail-value${patient.address ? '' : ' muted'}`}>{patient.address || '—'}</span>
            </div>
            <div className="detail-item wide">
              <span className="detail-label">{t('patients.fields.notes')}</span>
              <span className={`detail-value${patient.notes ? '' : ' muted'}`}>{patient.notes || '—'}</span>
            </div>
            <div className="detail-item">
              <span className="detail-label">{t('patients.fields.emergencyName')}</span>
              <span className={`detail-value${patient.emergency_contact?.name ? '' : ' muted'}`}>
                {patient.emergency_contact?.name || '—'}
              </span>
            </div>
            <div className="detail-item">
              <span className="detail-label">{t('patients.fields.emergencyRelation')}</span>
              <span className={`detail-value${patient.emergency_contact?.relation ? '' : ' muted'}`}>
                {patient.emergency_contact?.relation ? t(RELATION_LABEL_KEYS[patient.emergency_contact.relation]) : '—'}
              </span>
            </div>
            <div className="detail-item">
              <span className="detail-label">{t('patients.fields.emergencyPhone')}</span>
              <span className={`detail-value num${patient.emergency_contact?.phone ? '' : ' muted'}`}>
                {patient.emergency_contact?.phone || '—'}
              </span>
            </div>
          </div>
        </div>
      ) : tab === 'medical' ? (
        <MedicalRecordTab patientId={patient.id} />
      ) : (
        <PatientFinanceTab patientId={patient.id} patientName={patient.name_ar} due={patient.due} />
      )}

      {showEdit && <EditPatientModal patient={patient} onClose={() => setShowEdit(false)} onUpdated={handleUpdated} />}
    </>
  );
}
