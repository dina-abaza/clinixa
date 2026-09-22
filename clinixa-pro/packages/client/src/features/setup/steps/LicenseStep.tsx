import { useEffect, useState } from 'react';
import { Controller, type UseFormReturn } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import type { FirstRunSetupFormValues } from '../schema';
import { formatLicenseKey } from '../../../lib/validation/licenseKey';
import { getLicenseStatus } from '../../../lib/api/license';

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

  const [challengeCode, setChallengeCode] = useState<string>('');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    let isMounted = true;
    getLicenseStatus().then((res) => {
      if (isMounted && res.ok && res.data.challenge_code) {
        setChallengeCode(res.data.challenge_code);
      }
    });
    return () => {
      isMounted = false;
    };
  }, []);

  function handleCopy() {
    if (!challengeCode) return;
    navigator.clipboard.writeText(challengeCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="license-step-wrap">
      {/* صندوق كود الجهاز */}
      <div className="challenge-box">
        <div className="challenge-head">
          <span className="challenge-title">كود طلب التفعيل الخاص بهذا الجهاز:</span>
          {challengeCode && (
            <button
              type="button"
              className="btn-copy-code"
              onClick={handleCopy}
            >
              {copied ? '✅ تم النسخ' : '📋 نسخ الكود'}
            </button>
          )}
        </div>
        <div className="challenge-code-row">
          <span className="challenge-code-val">
            {challengeCode || 'جاري توليد كود الجهاز...'}
          </span>
        </div>
      </div>

      <div className={`form-field${invalid ? ' invalid' : ''}`}>
        <label htmlFor="licKey">كود التفعيل (أو مفتاح التثبيت)</label>
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
                placeholder="ACT-001Y-0000-0000-0000"
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
          <span>انسخ كود الجهاز بالأعلى وأرسله للمطور لاستلام كود التفعيل الخاص بجهازك.</span>
        </p>
      </div>
    </div>
  );
}
