import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useTranslation } from 'react-i18next';
import { updatePatient, type UpsertPatientRequest, type PatientDetail } from '../../lib/api/patients';
import {
  newPatientFormSchema,
  type NewPatientFormOutput,
  type NewPatientFormValues,
} from './patients.schema';
import { PatientFormFields } from './PatientFormFields';

interface Props {
  patient: PatientDetail;
  onClose: () => void;
  onUpdated: (patient: PatientDetail) => void;
}

/** مودال "تعديل بيانات المريض" — نفس حقول مودال الإضافة، مبنية مسبقًا من بيانات المريض الحالية. */
export function EditPatientModal({ patient, onClose, onUpdated }: Props) {
  const { t } = useTranslation();
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<NewPatientFormValues, unknown, NewPatientFormOutput>({
    resolver: zodResolver(newPatientFormSchema),
    defaultValues: {
      nameAr: patient.name_ar,
      phone: patient.phone,
      age: String(patient.age),
      gender: patient.gender,
      address: patient.address ?? '',
      notes: patient.notes ?? '',
      emergencyName: patient.emergency_contact?.name ?? '',
      emergencyRelation: (patient.emergency_contact?.relation as NewPatientFormValues['emergencyRelation']) ?? '',
      emergencyPhone: patient.emergency_contact?.phone ?? '',
    },
    mode: 'onBlur',
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose();
    }
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [onClose]);

  async function onSubmit(values: NewPatientFormOutput) {
    setSubmitError(null);
    setIsSubmitting(true);

    const payload: Partial<UpsertPatientRequest> = {
      name_ar: values.nameAr,
      phone: values.phone,
      age: values.age,
      gender: values.gender,
      address: values.address || null,
      notes: values.notes || null,
      emergency_contact: {
        name: values.emergencyName || null,
        relation: values.emergencyRelation || null,
        phone: values.emergencyPhone || null,
      },
    };

    const res = await updatePatient(patient.id, payload);
    setIsSubmitting(false);

    if (res.ok) {
      onUpdated({ ...res.data, emergency_contact: patient.emergency_contact });
      return;
    }
    setSubmitError(res.error.message);
  }

  return (
    <div className="modal-overlay open" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal np-modal" role="dialog" aria-modal="true" aria-labelledby="epTitle">
        <h2 id="epTitle">{t('patients.editModal.title')}</h2>
        <p className="modal-sub">{t('patients.editModal.subtitle', { name: patient.name_ar })}</p>

        <form noValidate onSubmit={handleSubmit(onSubmit)}>
          <div className="np-body">
            <PatientFormFields register={register} errors={errors} />
          </div>

          <div className={`form-error${submitError ? ' on' : ''}`} role="alert">
            <svg width={18} height={18} aria-hidden="true"><use href="#i-alert-circle" /></svg>
            <span>{submitError}</span>
          </div>

          <div className="modal-foot">
            <button type="button" className="btn btn-secondary" onClick={onClose} disabled={isSubmitting}>
              {t('common.cancel')}
            </button>
            <button type="submit" className={`btn btn-primary${isSubmitting ? ' loading' : ''}`} disabled={isSubmitting}>
              <svg className="spinner" width={18} height={18} aria-hidden="true"><use href="#i-loader" /></svg>
              <span>{isSubmitting ? t('common.saving') : t('common.save')}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
