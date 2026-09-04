import type { FieldErrors, UseFormRegister } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import type { NewPatientFormValues } from './patients.schema';

interface Props {
  register: UseFormRegister<NewPatientFormValues>;
  errors: FieldErrors<NewPatientFormValues>;
}

/** حقول فورم المريض — مشتركة بين مودال "مريض جديد" و"تعديل بيانات المريض" (نفس الحقول بالظبط). */
export function PatientFormFields({ register, errors }: Props) {
  const { t } = useTranslation();

  return (
    <>
      <div className="np-sec" style={{ marginTop: 0, paddingTop: 0, borderTop: 'none' }}>
        {t('patients.newModal.sectionPatient')}
      </div>
      <div className="form-grid">
        <div className={`form-field wide${errors.nameAr ? ' invalid' : ''}`}>
          <label htmlFor="np-name">
            {t('patients.fields.nameAr')} <span className="np-req">*</span>
          </label>
          <div className="input-wrap no-icon">
            <input id="np-name" type="text" {...register('nameAr')} />
          </div>
          <p className="field-error">
            <svg width={14} height={14} aria-hidden="true"><use href="#i-alert-circle" /></svg>
            <span>{t('patients.fields.nameArError')}</span>
          </p>
        </div>

        <div className={`form-field${errors.phone ? ' invalid' : ''}`}>
          <label htmlFor="np-phone">
            {t('patients.fields.phone')} <span className="np-req">*</span>
          </label>
          <div className="input-wrap no-icon">
            <input id="np-phone" type="tel" dir="ltr" className="num" {...register('phone')} />
          </div>
          <p className="field-error">
            <svg width={14} height={14} aria-hidden="true"><use href="#i-alert-circle" /></svg>
            <span>{t('patients.fields.phoneError')}</span>
          </p>
        </div>

        <div className={`form-field${errors.age ? ' invalid' : ''}`}>
          <label htmlFor="np-age">
            {t('patients.fields.age')} <span className="np-req">*</span>
          </label>
          <div className="input-wrap no-icon">
            <input id="np-age" type="number" min={0} max={120} {...register('age')} />
          </div>
          <p className="field-error">
            <svg width={14} height={14} aria-hidden="true"><use href="#i-alert-circle" /></svg>
            <span>{t('patients.fields.ageError')}</span>
          </p>
        </div>

        <div className="form-field">
          <label htmlFor="np-gender">{t('patients.fields.gender')}</label>
          <div className="input-wrap no-icon">
            <select id="np-gender" {...register('gender')}>
              <option value="male">{t('patients.fields.genderMale')}</option>
              <option value="female">{t('patients.fields.genderFemale')}</option>
            </select>
            <span className="chev"><svg width={16} height={16} aria-hidden="true"><use href="#i-chevron-down" /></svg></span>
          </div>
        </div>

        <div className="form-field wide">
          <label htmlFor="np-address">{t('patients.fields.address')}</label>
          <div className="input-wrap no-icon">
            <input id="np-address" type="text" {...register('address')} />
          </div>
        </div>

        <div className="form-field wide">
          <label htmlFor="np-notes">{t('patients.fields.notes')}</label>
          <textarea id="np-notes" {...register('notes')} />
        </div>
      </div>

      <div className="np-sec">{t('patients.newModal.sectionEmergency')}</div>
      <p className="np-sec-sub">{t('patients.newModal.sectionEmergencySub')}</p>
      <div className="form-grid">
        <div className="form-field">
          <label htmlFor="np-em-name">{t('patients.fields.emergencyName')}</label>
          <div className="input-wrap no-icon">
            <input id="np-em-name" type="text" {...register('emergencyName')} />
          </div>
        </div>

        <div className="form-field">
          <label htmlFor="np-em-relation">{t('patients.fields.emergencyRelation')}</label>
          <div className="input-wrap no-icon">
            <select id="np-em-relation" {...register('emergencyRelation')}>
              <option value="">{t('patients.fields.emergencyRelationPlaceholder')}</option>
              <option value="father">{t('patients.relations.father')}</option>
              <option value="mother">{t('patients.relations.mother')}</option>
              <option value="spouse">{t('patients.relations.spouse')}</option>
              <option value="sibling">{t('patients.relations.sibling')}</option>
              <option value="other">{t('patients.relations.other')}</option>
            </select>
            <span className="chev"><svg width={16} height={16} aria-hidden="true"><use href="#i-chevron-down" /></svg></span>
          </div>
        </div>

        <div className={`form-field wide${errors.emergencyPhone ? ' invalid' : ''}`}>
          <label htmlFor="np-em-phone">{t('patients.fields.emergencyPhone')}</label>
          <div className="input-wrap no-icon">
            <input id="np-em-phone" type="tel" dir="ltr" className="num" {...register('emergencyPhone')} />
          </div>
          <p className="field-error">
            <svg width={14} height={14} aria-hidden="true"><use href="#i-alert-circle" /></svg>
            <span>{t('patients.fields.phoneError')}</span>
          </p>
        </div>
      </div>
    </>
  );
}
