import type { UseFormReturn } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import type { FirstRunSetupFormValues } from '../schema';
import { SPECIALTY_GROUPS } from '../data/specialties';

interface Props {
  form: UseFormReturn<FirstRunSetupFormValues>;
}

export function ClinicStep({ form }: Props) {
  const { t } = useTranslation();
  const {
    register,
    formState: { errors },
  } = form;

  return (
    <>
      <div className={`form-field${errors.clinicNameAr ? ' invalid' : ''}`}>
        <label htmlFor="clinicAr">{t('setup.clinic.nameLabel')}</label>
        <div className="input-wrap no-icon">
          <input
            id="clinicAr"
            type="text"
            dir="rtl"
            autoComplete="off"
            placeholder={t('setup.clinic.namePlaceholder')}
            {...register('clinicNameAr')}
          />
        </div>
        <p className="field-error" role="alert">
          <svg width={14} height={14} aria-hidden="true">
            <use href="#i-alert-circle" />
          </svg>
          <span>{t('setup.clinic.nameError')}</span>
        </p>
      </div>

      <div className={`form-field${errors.specialty ? ' invalid' : ''}`}>
        <label htmlFor="clinicSpecialty">{t('setup.clinic.specialtyLabel')}</label>
        <div className="input-wrap no-icon">
          <select id="clinicSpecialty" {...register('specialty')}>
            <option value="">{t('setup.clinic.specialtyPlaceholder')}</option>
            {SPECIALTY_GROUPS.map((group) => (
              <optgroup key={group.key} label={t(`setup.clinic.groups.${group.key}`)}>
                {group.specialties.map((key) => (
                  <option key={key} value={key}>
                    {t(`setup.clinic.specialties.${key}`)}
                  </option>
                ))}
              </optgroup>
            ))}
          </select>
          <span className="chev" aria-hidden="true">
            <svg width={18} height={18}>
              <use href="#i-chevron-down" />
            </svg>
          </span>
        </div>
        <p className="field-error" role="alert">
          <svg width={14} height={14} aria-hidden="true">
            <use href="#i-alert-circle" />
          </svg>
          <span>{t('setup.clinic.specialtyError')}</span>
        </p>
      </div>

      <div className={`form-field${errors.clinicPhone ? ' invalid' : ''}`}>
        <label htmlFor="clinicPh">{t('setup.clinic.phoneLabel')}</label>
        <div className="input-wrap no-icon">
          <input
            id="clinicPh"
            type="tel"
            dir="ltr"
            inputMode="tel"
            autoComplete="off"
            placeholder={t('setup.clinic.phonePlaceholder')}
            {...register('clinicPhone')}
          />
        </div>
        <p className="field-error" role="alert">
          <svg width={14} height={14} aria-hidden="true">
            <use href="#i-alert-circle" />
          </svg>
          <span>{t('setup.clinic.phoneError')}</span>
        </p>
      </div>

      <div className="form-field">
        <label htmlFor="clinicAddr">{t('setup.clinic.addressLabel')}</label>
        <div className="input-wrap no-icon">
          <input
            id="clinicAddr"
            type="text"
            dir="rtl"
            autoComplete="off"
            placeholder={t('setup.clinic.addressPlaceholder')}
            {...register('clinicAddress')}
          />
        </div>
      </div>

      <div className="two side">
        <div className={`form-field${errors.opensAt ? ' invalid' : ''}`}>
          <label htmlFor="clinicFrom">{t('setup.clinic.fromLabel')}</label>
          <div className="input-wrap no-icon">
            <input id="clinicFrom" type="time" dir="ltr" {...register('opensAt')} />
          </div>
          <p className="field-error" role="alert">
            <svg width={14} height={14} aria-hidden="true">
              <use href="#i-alert-circle" />
            </svg>
            <span>{t('setup.clinic.fromError')}</span>
          </p>
        </div>
        <div className={`form-field${errors.closesAt ? ' invalid' : ''}`}>
          <label htmlFor="clinicTo">{t('setup.clinic.toLabel')}</label>
          <div className="input-wrap no-icon">
            <input id="clinicTo" type="time" dir="ltr" {...register('closesAt')} />
          </div>
          <p className="field-error" role="alert">
            <svg width={14} height={14} aria-hidden="true">
              <use href="#i-alert-circle" />
            </svg>
            <span>{t('setup.clinic.toError')}</span>
          </p>
        </div>
      </div>

      <p className="field-hint">
        <svg width={14} height={14} aria-hidden="true">
          <use href="#i-help" />
        </svg>
        <span>{t('setup.clinic.hint')}</span>
      </p>
    </>
  );
}
