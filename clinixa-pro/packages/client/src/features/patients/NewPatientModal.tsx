import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useTranslation } from 'react-i18next';
import { createPatient, type CreatePatientResponseData, type UpsertPatientRequest } from '../../lib/api/patients';
import {
  NEW_PATIENT_FORM_DEFAULTS,
  newPatientFormSchema,
  type NewPatientFormOutput,
  type NewPatientFormValues,
} from './patients.schema';
import { PatientFormFields } from './PatientFormFields';
import type { ApiWarning } from '../../lib/api/types';

interface Props {
  onClose: () => void;
  onCreated: (patient: CreatePatientResponseData, warning: ApiWarning | null) => void;
}

/** مودال "مريض جديد" — بيفتح في مكانه فوق قائمة المرضى (قرار 196 في البروتوتايب)، مش صفحة كاملة. */
export function NewPatientModal({ onClose, onCreated }: Props) {
  const { t } = useTranslation();
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<NewPatientFormValues, unknown, NewPatientFormOutput>({
    resolver: zodResolver(newPatientFormSchema),
    defaultValues: NEW_PATIENT_FORM_DEFAULTS,
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

    const payload: UpsertPatientRequest = {
      name_ar: values.nameAr,
      phone: values.phone,
      age: values.age,
      gender: values.gender,
      address: values.address || null,
      notes: values.notes || null,
      emergency_contact:
        values.emergencyName || values.emergencyPhone || values.emergencyRelation
          ? {
              name: values.emergencyName || null,
              relation: values.emergencyRelation || null,
              phone: values.emergencyPhone || null,
            }
          : undefined,
    };

    const res = await createPatient(payload);
    setIsSubmitting(false);

    if (res.ok) {
      onCreated(res.data, res.warning);
      return;
    }
    setSubmitError(res.error.message);
  }

  return (
    <div className="modal-overlay open" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal np-modal" role="dialog" aria-modal="true" aria-labelledby="npTitle">
        <h2 id="npTitle">{t('patients.newModal.title')}</h2>
        <p className="modal-sub">{t('patients.newModal.subtitle')}</p>

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
              <span>{isSubmitting ? t('common.saving') : t('patients.newModal.submit')}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
