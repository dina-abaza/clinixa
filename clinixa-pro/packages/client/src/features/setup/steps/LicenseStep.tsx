import { Controller, type UseFormReturn } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import type { FirstRunSetupFormValues } from '../schema';
import { formatLicenseKey } from '../../../lib/validation/licenseKey';

interface Props {
  form: UseFormReturn<FirstRunSetupFormValues>;
}

export function LicenseStep({ form }: Props) {
  const { t } = useTranslation();
  const {
    control,
    watch,
    formState: { errors },
  } = form;
  const invalid = Boolean(errors.licenseKey);
  const isEmpty = !watch('licenseKey');

  return (
    <div className={`form-field${invalid ? ' invalid' : ''}`}>
      <label htmlFor="licKey">{t('setup.license.label')}</label>
      <div className="input-wrap">
        <span className="lead-icon" aria-hidden="true">
          <svg width={20} height={20}>
            <use href="#i-key" />
          </svg>
        </span>
        <Controller
          name="licenseKey"
          control={control}
          render={({ field }) => (
            <input
              id="licKey"
              type="text"
              className="key-input"
              autoComplete="off"
              spellCheck={false}
              aria-describedby="keyErr"
              placeholder={t('setup.license.placeholder')}
              value={field.value}
              onBlur={field.onBlur}
              onChange={(e) => field.onChange(formatLicenseKey(e.target.value))}
            />
          )}
        />
      </div>
      <p className="field-error" id="keyErr" role="alert">
        <svg width={14} height={14} aria-hidden="true">
          <use href="#i-alert-circle" />
        </svg>
        <span>
          {isEmpty ? t('setup.license.errorRequired') : t('setup.license.errorInvalid')}
        </span>
      </p>
      <p className="field-hint">
        <svg width={14} height={14} aria-hidden="true">
          <use href="#i-help" />
        </svg>
        <span>{t('setup.license.hint')}</span>
      </p>
    </div>
  );
}
