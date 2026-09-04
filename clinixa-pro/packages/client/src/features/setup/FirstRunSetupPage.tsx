import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import './FirstRunSetupPage.css';
import {
  FIRST_RUN_SETUP_DEFAULTS,
  STEP_FIELDS,
  TOTAL_STEPS,
  firstRunSetupFormSchema,
  type FirstRunSetupFormValues,
} from './schema';
import { LICENSE_KEY_RE } from '../../lib/validation/licenseKey';
import { postFirstRunSetup, type FirstRunSetupRequest } from '../../lib/api/setup';
import { setAuthToken } from '../../lib/api/client';
import { markSetupComplete } from '../../lib/setupState';
import { ar } from '../../lib/i18n/locales/ar';
import { useDocumentDirection } from '../../lib/i18n/useDocumentDirection';
import { useTheme } from '../../lib/theme/useTheme';
import { BrandLogo } from '../../components/BrandLogo';
import { AuthScreenTools } from '../../components/AuthScreenTools';
import { LicenseStep } from './steps/LicenseStep';
import { ClinicStep } from './steps/ClinicStep';
import { AccountStep } from './steps/AccountStep';
import { SecurityStep } from './steps/SecurityStep';
import { SetupDone } from './SetupDone';

/** يترجم مسار حقل من رسالة خطأ الباك (زي "clinic.phone") لخطوة الفورم وحقله */
const BACKEND_FIELD_TO_FORM: Record<
  string,
  { step: number; field: keyof FirstRunSetupFormValues }
> = {
  license_key: { step: 1, field: 'licenseKey' },
  'clinic.name_ar': { step: 2, field: 'clinicNameAr' },
  'clinic.specialty': { step: 2, field: 'specialty' },
  'clinic.phone': { step: 2, field: 'clinicPhone' },
  'clinic.address': { step: 2, field: 'clinicAddress' },
  'doctor_account.name_ar': { step: 3, field: 'doctorNameAr' },
  'doctor_account.username': { step: 3, field: 'username' },
  'doctor_account.password': { step: 3, field: 'password' },
  'security.question': { step: 4, field: 'securityQuestion' },
  'security.answer': { step: 4, field: 'securityAnswer' },
};

interface DoneSnapshot {
  clinicName: string;
  username: string;
  questionLabel: string;
}

export function FirstRunSetupPage() {
  const { t } = useTranslation();
  useDocumentDirection();
  const { theme, toggleTheme } = useTheme();

  const form = useForm<FirstRunSetupFormValues>({
    resolver: zodResolver(firstRunSetupFormSchema),
    defaultValues: FIRST_RUN_SETUP_DEFAULTS,
  });
  const { watch, trigger, handleSubmit, setError } = form;

  const [step, setStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [done, setDone] = useState<DoneSnapshot | null>(null);

  const licenseKey = watch('licenseKey');
  const nextDisabled = step === 1 && !LICENSE_KEY_RE.test(licenseKey);

  async function handleNext() {
    const fields = STEP_FIELDS[step];
    const valid = await trigger(fields);
    if (valid) setStep((s) => Math.min(TOTAL_STEPS, s + 1));
  }

  function handleBack() {
    setSubmitError(null);
    setStep((s) => Math.max(1, s - 1));
  }

  async function onValidSubmit(values: FirstRunSetupFormValues) {
    setSubmitError(null);
    setIsSubmitting(true);

    // ⚠ سؤال الأمان بيتبعت كنص عربي (لغة القيد) مش كمفتاح داخلي — نفس شكل
    // §1 و GET /api/auth/security-question في الـ API reference
    const questionTextAr = ar.setup.security.questions[values.securityQuestion];

    const payload: FirstRunSetupRequest = {
      license_key: values.licenseKey,
      clinic: {
        name_ar: values.clinicNameAr,
        phone: values.clinicPhone,
        address: values.clinicAddress.trim() || null,
        specialty: values.specialty,
        opens_at: values.opensAt,
        closes_at: values.closesAt,
      },
      doctor_account: {
        name_ar: values.doctorNameAr,
        username: values.username,
        password: values.password,
      },
      security: {
        question: questionTextAr,
        answer: values.securityAnswer,
      },
    };

    const res = await postFirstRunSetup(payload);
    setIsSubmitting(false);

    if (res.ok) {
      setAuthToken(res.data.token);
      markSetupComplete();
      setDone({
        clinicName: values.clinicNameAr,
        username: values.username,
        questionLabel: t(`setup.security.questions.${values.securityQuestion}`),
      });
      return;
    }

    // العيادة متظبّطة بالفعل على الجهاز ده (409) — إشارة أكيدة من الباك، أوثق من أي علامة محلية.
    // نسجّلها فورًا عشان "/" يوصّل لتسجيل الدخول من غير ما يعرض الويزارد تاني.
    if (res.error.code === 'CONFLICT') {
      markSetupComplete();
      setSubmitError(res.error.message);
      return;
    }

    const mapped = res.error.field ? BACKEND_FIELD_TO_FORM[res.error.field] : undefined;
    if (mapped) {
      setStep(mapped.step);
      setError(mapped.field, { type: 'server', message: res.error.message });
    } else {
      setSubmitError(res.error.message || t('setup.genericError'));
    }
  }

  return (
    <div className="screen setup-screen">
      <AuthScreenTools theme={theme} onToggleTheme={toggleTheme} />

      <div className="body-wrap">
        <div className="stack">
          <div className="brand">
            <BrandLogo />
            <div>
              <div className="brand-name">Clinixa</div>
              <p className="clinic-name">{t('setup.brandTagline')}</p>
            </div>
          </div>

          <div className="card glass">
            {done ? (
              <SetupDone
                clinicName={done.clinicName}
                username={done.username}
                questionLabel={done.questionLabel}
              />
            ) : (
              <form noValidate onSubmit={handleSubmit(onValidSubmit)}>
                <div className="icon-badge" aria-hidden="true">
                  <svg width={24} height={24}>
                    <use href="#i-lock" />
                  </svg>
                </div>

                <h1>{t(`setup.stepTitles.${step}`)}</h1>
                <p className="card-sub">{t('setup.cardSubtitle')}</p>

                <div className="step-lbl">{t('setup.stepOf', { step, total: TOTAL_STEPS })}</div>
                <div className="steps" aria-hidden="true">
                  {[1, 2, 3, 4].map((n) => (
                    <span
                      key={n}
                      className={`st${n < step ? ' done' : n === step ? ' on' : ''}`}
                    />
                  ))}
                </div>

                {step === 1 && (
                  <div className="row-link">
                    <Link className="link" to="/login">
                      {t('setup.alreadySetUp')}
                    </Link>
                  </div>
                )}

                <div className="pane on">
                  {step === 1 && <LicenseStep form={form} />}
                  {step === 2 && <ClinicStep form={form} />}
                  {step === 3 && <AccountStep form={form} />}
                  {step === 4 && <SecurityStep form={form} />}
                </div>

                <div className="wiz-foot">
                  {step > 1 && (
                    <button type="button" className="btn btn-secondary back" onClick={handleBack}>
                      {t('setup.back')}
                    </button>
                  )}
                  {step < TOTAL_STEPS ? (
                    <button
                      type="button"
                      className="btn btn-primary"
                      disabled={nextDisabled}
                      onClick={handleNext}
                    >
                      {t('setup.next')}
                    </button>
                  ) : (
                    <button
                      type="submit"
                      className={`btn btn-primary${isSubmitting ? ' loading' : ''}`}
                      disabled={isSubmitting}
                    >
                      <svg className="spinner" width={18} height={18} aria-hidden="true">
                        <use href="#i-loader" />
                      </svg>
                      <span>{isSubmitting ? t('setup.saving') : t('setup.finish')}</span>
                    </button>
                  )}
                </div>

                <div className={`form-error${submitError ? ' on' : ''}`} role="alert">
                  <svg width={18} height={18} aria-hidden="true">
                    <use href="#i-alert-circle" />
                  </svg>
                  <span>{submitError}</span>
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
