import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useTranslation } from 'react-i18next';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import './LoginPage.css';
import { LOGIN_FORM_DEFAULTS, loginFormSchema, type LoginFormValues } from './schema';
import { postLogin } from '../../lib/api/auth';
import { useDocumentDirection } from '../../lib/i18n/useDocumentDirection';
import { useTheme } from '../../lib/theme/useTheme';
import { useAuthStore } from '../../lib/store/authStore';
import { markSetupComplete } from '../../lib/setupState';
import { BrandLogo } from '../../components/BrandLogo';
import { AuthScreenTools } from '../../components/AuthScreenTools';

export function LoginPage() {
  const { t } = useTranslation();
  useDocumentDirection();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const location = useLocation();
  const setSession = useAuthStore((s) => s.setSession);
  const redirectTo = (location.state as { from?: { pathname?: string } } | null)?.from?.pathname || '/dashboard';

  const {
    register,
    watch,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginFormSchema),
    defaultValues: LOGIN_FORM_DEFAULTS,
    mode: 'onBlur',
    reValidateMode: 'onChange',
  });

  const [passwordVisible, setPasswordVisible] = useState(false);
  const [capsOn, setCapsOn] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [signedIn, setSignedIn] = useState(false);

  const submitDisabled = !watch('username').trim() || !watch('password');
  const passwordField = register('password');

  async function onSubmit(values: LoginFormValues) {
    setSubmitError(null);
    setIsSubmitting(true);

    const res = await postLogin(values);
    setIsSubmitting(false);

    if (res.ok) {
      setSession({
        token: res.data.token,
        employee: res.data.employee,
        activeBranch: res.data.active_branch,
      });
      markSetupComplete();
      setSignedIn(true);
      setTimeout(() => navigate(redirectTo, { replace: true }), 700);
    } else {
      setSubmitError(res.error.message);
    }
  }


  return (
    <div className="screen login-screen">
      <AuthScreenTools theme={theme} onToggleTheme={toggleTheme} />

      <div className="body-wrap">
        <div className="stack">
          <div className="brand">
            <BrandLogo />
            <div>
              <div className="brand-name">Clinixa</div>
            </div>
          </div>

          <form className="card glass" noValidate onSubmit={handleSubmit(onSubmit)}>
            <h1>{t('login.title')}</h1>
            <p className="card-sub">{t('login.subtitle')}</p>

            <div className={`form-field${errors.username ? ' invalid' : ''}`}>
              <label htmlFor="username">{t('login.usernameLabel')}</label>
              <div className="input-wrap">
                <span className="lead-icon" aria-hidden="true">
                  <svg width={20} height={20}>
                    <use href="#i-user" />
                  </svg>
                </span>
                <input
                  id="username"
                  type="text"
                  autoComplete="username"
                  autoFocus
                  spellCheck={false}
                  aria-describedby="userErr"
                  placeholder={t('login.usernamePlaceholder')}
                  {...register('username')}
                />
              </div>
              <p className="field-error" id="userErr" role="alert">
                <svg width={14} height={14} aria-hidden="true">
                  <use href="#i-alert-circle" />
                </svg>
                <span>{t('login.usernameError')}</span>
              </p>
            </div>

            <div className={`form-field${errors.password ? ' invalid' : ''}`}>
              <label htmlFor="password">{t('login.passwordLabel')}</label>
              <div className="input-wrap has-toggle">
                <span className="lead-icon" aria-hidden="true">
                  <svg width={20} height={20}>
                    <use href="#i-lock" />
                  </svg>
                </span>
                <input
                  id="password"
                  type={passwordVisible ? 'text' : 'password'}
                  autoComplete="current-password"
                  aria-describedby="passErr capsHint"
                  placeholder={t('login.passwordPlaceholder')}
                  {...passwordField}
                  onKeyUp={(e) => setCapsOn(e.getModifierState?.('CapsLock') ?? false)}
                  onBlur={(e) => {
                    passwordField.onBlur(e);
                    setCapsOn(false);
                  }}
                />
                <button
                  type="button"
                  className="pw-toggle"
                  aria-pressed={passwordVisible}
                  aria-controls="password"
                  aria-label={passwordVisible ? t('login.hidePassword') : t('login.showPassword')}
                  onClick={() => setPasswordVisible((v) => !v)}
                >
                  <svg width={20} height={20} aria-hidden="true">
                    <use href={passwordVisible ? '#i-eye-off' : '#i-eye'} />
                  </svg>
                </button>
              </div>
              <p className="field-error" id="passErr" role="alert">
                <svg width={14} height={14} aria-hidden="true">
                  <use href="#i-alert-circle" />
                </svg>
                <span>{t('login.passwordError')}</span>
              </p>
              <p className={`caps-hint${capsOn ? ' on' : ''}`} id="capsHint">
                <svg width={14} height={14} aria-hidden="true">
                  <use href="#i-alert-triangle" />
                </svg>
                <span>{t('login.capsLockOn')}</span>
              </p>
            </div>

            <div className="row-link">
              <Link className="link" to="/forgot-password">
                {t('login.forgotPassword')}
              </Link>
            </div>

            <button
              type="submit"
              className={`btn btn-primary${isSubmitting ? ' loading' : ''}`}
              disabled={submitDisabled || isSubmitting || signedIn}
            >
              <svg className="spinner" width={18} height={18} aria-hidden="true">
                <use href="#i-loader" />
              </svg>
              <span>{isSubmitting ? t('login.checking') : t('login.submit')}</span>
            </button>

            <div className={`form-error${submitError ? ' on' : ''}`} role="alert">
              <svg width={18} height={18} aria-hidden="true">
                <use href="#i-alert-circle" />
              </svg>
              <span>{submitError}</span>
            </div>

            <div className={`form-ok${signedIn ? ' on' : ''}`} role="status">
              <svg width={18} height={18} aria-hidden="true">
                <use href="#i-check" />
              </svg>
              <span>{t('login.success')}</span>
            </div>

            <div style={{ margin: 'var(--space-5) 0 var(--space-4)', borderTop: '1px solid var(--color-border)' }} />

            <div style={{ textAlign: 'center' }}>
              <Link
                to="/setup"
                className="btn btn-secondary"
                style={{ width: '100%', display: 'inline-flex', justifyContent: 'center', alignItems: 'center', gap: 'var(--space-2)' }}
              >
                <svg width={18} height={18} aria-hidden="true">
                  <use href="#i-building" />
                </svg>
                <span>{t('login.createClinic')}</span>
              </Link>
            </div>
          </form>
        </div>
      </div>

      <div className="screen-foot">
        <span>{t('common.version')}</span>
        <span className="num">1.0.4</span>
      </div>
    </div>
  );
}
