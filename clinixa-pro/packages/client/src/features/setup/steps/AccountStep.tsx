import type { UseFormReturn } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import type { FirstRunSetupFormValues } from '../schema';

interface Props {
  form: UseFormReturn<FirstRunSetupFormValues>;
}

export function AccountStep({ form }: Props) {
  const { t } = useTranslation();
  const {
    register,
    formState: { errors },
  } = form;

  return (
    <>
      <div className="two">
        <div className={`form-field${errors.doctorNameAr ? ' invalid' : ''}`}>
          <label htmlFor="drName">{t('setup.account.nameLabel')}</label>
          <div className="input-wrap no-icon">
            <input
              id="drName"
              type="text"
              dir="rtl"
              autoComplete="off"
              placeholder={t('setup.account.namePlaceholder')}
              {...register('doctorNameAr')}
            />
          </div>
          <p className="field-error" role="alert">
            <svg width={14} height={14} aria-hidden="true">
              <use href="#i-alert-circle" />
            </svg>
            <span>{t('setup.account.nameError')}</span>
          </p>
        </div>
        <div className={`form-field${errors.username ? ' invalid' : ''}`}>
          <label htmlFor="userName">{t('setup.account.usernameLabel')}</label>
          <div className="input-wrap no-icon">
            <input
              id="userName"
              type="text"
              dir="ltr"
              style={{ textAlign: 'start' }}
              autoComplete="off"
              spellCheck={false}
              placeholder={t('setup.account.usernamePlaceholder')}
              {...register('username')}
            />
          </div>
          <p className="field-error" role="alert">
            <svg width={14} height={14} aria-hidden="true">
              <use href="#i-alert-circle" />
            </svg>
            <span>{t('setup.account.usernameError')}</span>
          </p>
        </div>
      </div>

      <div className="two">
        <div className={`form-field${errors.password ? ' invalid' : ''}`}>
          <label htmlFor="pw1">{t('setup.account.passwordLabel')}</label>
          <div className="input-wrap no-icon">
            <input
              id="pw1"
              type="password"
              autoComplete="new-password"
              placeholder={t('setup.account.passwordPlaceholder')}
              {...register('password')}
            />
          </div>
          <p className="field-error" role="alert">
            <svg width={14} height={14} aria-hidden="true">
              <use href="#i-alert-circle" />
            </svg>
            <span>{t('setup.account.passwordError')}</span>
          </p>
        </div>
        <div className={`form-field${errors.confirmPassword ? ' invalid' : ''}`}>
          <label htmlFor="pw2">{t('setup.account.confirmLabel')}</label>
          <div className="input-wrap no-icon">
            <input
              id="pw2"
              type="password"
              autoComplete="new-password"
              placeholder={t('setup.account.passwordPlaceholder')}
              {...register('confirmPassword')}
            />
          </div>
          <p className="field-error" role="alert">
            <svg width={14} height={14} aria-hidden="true">
              <use href="#i-alert-circle" />
            </svg>
            <span>{t('setup.account.confirmError')}</span>
          </p>
        </div>
      </div>

      <p className="field-hint">
        <svg width={14} height={14} aria-hidden="true">
          <use href="#i-help" />
        </svg>
        <span>{t('setup.account.hint')}</span>
      </p>
    </>
  );
}
