import { useState, type FormEvent } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import './ForgotPasswordPage.css';
import {
  FORGOT_PASSWORD_DEFAULTS,
  STEP_FIELDS,
  TOTAL_STEPS,
  forgotPasswordFormSchema,
} from './forgotPassword.schema';
import { getSecurityQuestion, postForgotPassword } from '../../lib/api/auth';
import { useDocumentDirection } from '../../lib/i18n/useDocumentDirection';
import { useTheme } from '../../lib/theme/useTheme';
import { BrandLogo } from '../../components/BrandLogo';
import { AuthScreenTools } from '../../components/AuthScreenTools';

const STEP_LABEL_KEYS = ['account', 'security', 'password'] as const;

export function ForgotPasswordPage() {
  const { t } = useTranslation();
  useDocumentDirection();
  const { theme, toggleTheme } = useTheme();

  const form = useForm({
    resolver: zodResolver(forgotPasswordFormSchema),
    defaultValues: FORGOT_PASSWORD_DEFAULTS,
  });
  const { register, watch, trigger, setError, getValues, formState: { errors } } = form;

  const [step, setStep] = useState(1);
  const [questionText, setQuestionText] = useState<string | null>(null);
  const [answerVisible, setAnswerVisible] = useState(false);
  const [passwordVisible, setPasswordVisible] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  const username = watch('username');
  const answer = watch('answer');
  const newPassword = watch('newPassword');
  const confirmPassword = watch('confirmPassword');

  const nextDisabled =
    step === 1 ? !username.trim() : step === 2 ? !answer.trim() : !newPassword || !confirmPassword;

  async function handleFormSubmit(e: FormEvent) {
    e.preventDefault();
    if (isSubmitting) return;

    const valid = await trigger(STEP_FIELDS[step]);
    if (!valid) return;

    if (step === 1) {
      setIsSubmitting(true);
      const res = await getSecurityQuestion(getValues('username'));
      setIsSubmitting(false);
      if (res.ok) {
        setQuestionText(res.data.question);
        setStep(2);
      } else {
        setError('username', { type: 'server', message: res.error.message });
      }
      return;
    }

    if (step === 2) {
      // ⚠ مفيش endpoint يتحقق من الإجابة لوحدها — التحقق الحقيقي بيحصل في
      // خطوة ٣ مع كلمة السر الجديدة (راجع ملحوظة lib/api/auth.ts)
      setStep(3);
      return;
    }

    setIsSubmitting(true);
    setSubmitError(null);
    const values = getValues();
    const res = await postForgotPassword({
      username: values.username,
      security_answer: values.answer,
      new_password: values.newPassword,
    });
    setIsSubmitting(false);

    if (res.ok) {
      setDone(true);
    } else if (res.error.field === 'security_answer') {
      setStep(2);
      setError('answer', { type: 'server', message: res.error.message });
    } else {
      setSubmitError(res.error.message || t('forgotPassword.genericError'));
    }
  }

  return (
    <div className="screen forgot-password-screen">
      <AuthScreenTools theme={theme} onToggleTheme={toggleTheme} />

      <div className="body-wrap">
        <div className="stack">
          <div className="brand">
            <BrandLogo />
            <div>
              <div className="brand-name">Clinixa</div>
              <p className="clinic-name">{t('forgotPassword.brandTagline')}</p>
            </div>
          </div>

          <div className="card glass">
            {done ? (
              <div className="done on" role="status">
                <div className="icon-badge" aria-hidden="true">
                  <svg width={24} height={24}>
                    <use href="#i-check" />
                  </svg>
                </div>
                <h1>{t('forgotPassword.done.title')}</h1>
                <p>{t('forgotPassword.done.body')}</p>
                <Link className="btn btn-primary" to="/login">
                  {t('forgotPassword.done.cta')}
                </Link>
              </div>
            ) : (
              <form noValidate onSubmit={handleFormSubmit}>
                <div className="icon-badge" aria-hidden="true">
                  <svg width={24} height={24}>
                    <use href="#i-lock" />
                  </svg>
                </div>

                <h1>{t('forgotPassword.title')}</h1>
                <p className="card-sub">{t(`forgotPassword.stepSubtitles.${step}`)}</p>

                {step !== 3 && (
                  <div className="notice notice-info">
                    <svg width={20} height={20} aria-hidden="true">
                      <use href="#i-info" />
                    </svg>
                    <div>
                      <strong>{t('forgotPassword.doctorNoticeTitle')}</strong>
                      <span>{t('forgotPassword.doctorNoticeBody')}</span>
                    </div>
                  </div>
                )}

                <div className="stepper" role="list">
                  {Array.from({ length: TOTAL_STEPS }, (_, i) => i + 1).map((n) => (
                    <div key={n} style={{ display: 'contents' }}>
                      <div
                        className={`step${n < step ? ' done' : n === step ? ' active' : ''}`}
                        role="listitem"
                      >
                        <span className="dot">{n < step ? '✓' : n}</span>
                        <span className="label">{t(`forgotPassword.stepLabels.${STEP_LABEL_KEYS[n - 1]}`)}</span>
                      </div>
                      {n < TOTAL_STEPS && <span className="bar" />}
                    </div>
                  ))}
                </div>

                {step === 1 && (
                  <div className={`form-field${errors.username ? ' invalid' : ''}`}>
                    <label htmlFor="username">{t('forgotPassword.usernameLabel')}</label>
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
                        spellCheck={false}
                        autoFocus
                        placeholder={t('forgotPassword.usernamePlaceholder')}
                        {...register('username')}
                      />
                    </div>
                    <p className="field-error" role="alert">
                      <svg width={14} height={14} aria-hidden="true">
                        <use href="#i-alert-circle" />
                      </svg>
                      <span>{errors.username?.message}</span>
                    </p>
                  </div>
                )}

                {step === 2 && (
                  <>
                    <div className="form-field">
                      <label>{t('forgotPassword.questionLabel')}</label>
                      <div className="readonly-value">{questionText || '—'}</div>
                    </div>
                    <div className={`form-field${errors.answer ? ' invalid' : ''}`}>
                      <label htmlFor="answer">{t('forgotPassword.answerLabel')}</label>
                      <div className="input-wrap has-toggle">
                        <span className="lead-icon" aria-hidden="true">
                          <svg width={20} height={20}>
                            <use href="#i-key" />
                          </svg>
                        </span>
                        <input
                          id="answer"
                          type={answerVisible ? 'text' : 'password'}
                          autoComplete="off"
                          spellCheck={false}
                          autoFocus
                          placeholder={t('forgotPassword.answerPlaceholder')}
                          {...register('answer')}
                        />
                        <button
                          type="button"
                          className="pw-toggle"
                          aria-pressed={answerVisible}
                          aria-controls="answer"
                          aria-label={
                            answerVisible ? t('setup.security.hideAnswer') : t('setup.security.showAnswer')
                          }
                          onClick={() => setAnswerVisible((v) => !v)}
                        >
                          <svg width={20} height={20} aria-hidden="true">
                            <use href={answerVisible ? '#i-eye-off' : '#i-eye'} />
                          </svg>
                        </button>
                      </div>
                      <p className="field-error" role="alert">
                        <svg width={14} height={14} aria-hidden="true">
                          <use href="#i-alert-circle" />
                        </svg>
                        <span>{errors.answer?.message}</span>
                      </p>
                      <p className="field-hint">
                        <svg width={14} height={14} aria-hidden="true">
                          <use href="#i-help" />
                        </svg>
                        <span>{t('forgotPassword.answerHint')}</span>
                      </p>
                    </div>
                  </>
                )}

                {step === 3 && (
                  <>
                    <div className={`form-field${errors.newPassword ? ' invalid' : ''}`}>
                      <label htmlFor="newPass">{t('forgotPassword.newPasswordLabel')}</label>
                      <div className="input-wrap has-toggle">
                        <span className="lead-icon" aria-hidden="true">
                          <svg width={20} height={20}>
                            <use href="#i-lock" />
                          </svg>
                        </span>
                        <input
                          id="newPass"
                          type={passwordVisible ? 'text' : 'password'}
                          autoComplete="new-password"
                          autoFocus
                          placeholder={t('forgotPassword.passwordPlaceholder')}
                          {...register('newPassword')}
                        />
                        <button
                          type="button"
                          className="pw-toggle"
                          aria-pressed={passwordVisible}
                          aria-controls="newPass"
                          aria-label={
                            passwordVisible ? t('forgotPassword.hidePassword') : t('forgotPassword.showPassword')
                          }
                          onClick={() => setPasswordVisible((v) => !v)}
                        >
                          <svg width={20} height={20} aria-hidden="true">
                            <use href={passwordVisible ? '#i-eye-off' : '#i-eye'} />
                          </svg>
                        </button>
                      </div>
                      <p className="field-error" role="alert">
                        <svg width={14} height={14} aria-hidden="true">
                          <use href="#i-alert-circle" />
                        </svg>
                        <span>{t('forgotPassword.passwordError')}</span>
                      </p>
                      <p className="field-hint">
                        <svg width={14} height={14} aria-hidden="true">
                          <use href="#i-help" />
                        </svg>
                        <span>{t('forgotPassword.passwordHint')}</span>
                      </p>
                    </div>
                    <div className={`form-field${errors.confirmPassword ? ' invalid' : ''}`}>
                      <label htmlFor="confirmPass">{t('forgotPassword.confirmLabel')}</label>
                      <div className="input-wrap">
                        <span className="lead-icon" aria-hidden="true">
                          <svg width={20} height={20}>
                            <use href="#i-lock" />
                          </svg>
                        </span>
                        <input
                          id="confirmPass"
                          type="password"
                          autoComplete="new-password"
                          placeholder={t('forgotPassword.confirmPlaceholder')}
                          {...register('confirmPassword')}
                        />
                      </div>
                      <p className="field-error" role="alert">
                        <svg width={14} height={14} aria-hidden="true">
                          <use href="#i-alert-circle" />
                        </svg>
                        <span>{t('forgotPassword.confirmError')}</span>
                      </p>
                    </div>
                  </>
                )}

                <button
                  type="submit"
                  className={`btn btn-primary${isSubmitting ? ' loading' : ''}`}
                  disabled={nextDisabled || isSubmitting}
                >
                  <svg className="spinner" width={18} height={18} aria-hidden="true">
                    <use href="#i-loader" />
                  </svg>
                  <span>
                    {isSubmitting
                      ? t('forgotPassword.checking')
                      : step === TOTAL_STEPS
                        ? t('forgotPassword.save')
                        : t('forgotPassword.next')}
                  </span>
                </button>

                <div className={`form-error${submitError ? ' on' : ''}`} role="alert">
                  <svg width={18} height={18} aria-hidden="true">
                    <use href="#i-alert-circle" />
                  </svg>
                  <span>{submitError}</span>
                </div>

                <div className="row-link" style={{ marginTop: 'var(--space-5)', marginBottom: 0, justifyContent: 'center' }}>
                  <Link className="link back-link" to="/login">
                    <svg className="back-arrow" width={16} height={16} aria-hidden="true">
                      <use href="#i-arrow" />
                    </svg>
                    <span>{t('forgotPassword.backToLogin')}</span>
                  </Link>
                </div>
              </form>
            )}
          </div>
        </div>
      </div>

      <div className="screen-foot">
        <span>{t('common.version')}</span>
        <span className="num">1.0.4</span>
      </div>
    </div>
  );
}
