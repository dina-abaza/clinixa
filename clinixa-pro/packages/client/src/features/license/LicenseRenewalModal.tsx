import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useQueryClient } from '@tanstack/react-query';
import { activateLicense, type LicenseStatus } from '../../lib/api/license';
import './LicenseRenewalModal.css';

interface LicenseRenewalModalProps {
  statusData: LicenseStatus;
  isOpen: boolean;
  onClose?: () => void;
  canClose?: boolean;
}

export function LicenseRenewalModal({
  statusData,
  isOpen,
  onClose,
  canClose = true,
}: LicenseRenewalModalProps) {
  const { t } = useTranslation();
  const queryClient = useQueryClient();

  const [inputCode, setInputCode] = useState('');
  const [copied, setCopied] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  function handleCopy() {
    if (statusData?.challenge_code) {
      navigator.clipboard.writeText(statusData.challenge_code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  }

  function formatActivationInput(val: string) {
    const clean = val.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 19);
    const parts = [clean.slice(0, 3)];
    if (clean.length > 3) parts.push(clean.slice(3, 7));
    if (clean.length > 7) parts.push(clean.slice(7, 11));
    if (clean.length > 11) parts.push(clean.slice(11, 15));
    if (clean.length > 15) parts.push(clean.slice(15, 19));
    return parts.join('-');
  }

  async function handleActivate() {
    if (!inputCode.trim()) return;
    setErrorMsg(null);
    setSuccessMsg(null);
    setIsSubmitting(true);

    const res = await activateLicense(inputCode.trim());
    setIsSubmitting(false);

    if (res.ok) {
      setSuccessMsg(t('license.activationSuccess', { months: res.data.months_added }));
      setInputCode('');
      queryClient.invalidateQueries({ queryKey: ['license-status'] });
      setTimeout(() => {
        if (onClose) onClose();
      }, 1800);
    } else {
      setErrorMsg(res.error.message || t('license.activationFailed'));
    }
  }

  const isExpired = !statusData.is_active;

  return (
    <div className="license-modal-overlay" role="dialog" aria-modal="true">
      <div className="license-modal-card">
        {/* Header */}
        <div className="license-modal-head">
          <div className="title-group">
            <div className={`license-icon-box ${isExpired ? 'danger' : ''}`}>
              <svg width={22} height={22} aria-hidden="true">
                <use href={isExpired ? '#i-alert-triangle' : '#i-key'} />
              </svg>
            </div>
            <div>
              <h2 className="section-title" style={{ fontSize: '1.15rem' }}>
                {isExpired ? t('license.expiredTitle') : t('license.renewTitle')}
              </h2>
              <span className="field-hint">
                {isExpired ? t('license.expiredSub') : t('license.renewSub')}
              </span>
            </div>
          </div>

          {canClose && !isExpired && onClose ? (
            <button
              type="button"
              className="btn btn-ghost btn-sm"
              onClick={onClose}
              aria-label={t('common.cancel')}
            >
              <svg width={18} height={18}><use href="#i-x" /></svg>
            </button>
          ) : null}
        </div>

        {/* Body */}
        <div className="license-modal-body">
          {/* شارة الحالة */}
          <div
            className={`license-status-badge ${
              isExpired
                ? 'expired'
                : (statusData.ms_remaining !== undefined
                    ? statusData.ms_remaining <= 3 * 24 * 60 * 60 * 1000
                    : statusData.days_remaining <= 3)
                ? 'warn'
                : 'ok'
            }`}
          >
            <svg width={16} height={16} aria-hidden="true">
              <use href={isExpired ? '#i-alert-circle' : '#i-clock'} />
            </svg>
            <span>
              {isExpired
                ? t('license.statusExpired')
                : t('license.daysLeft', {
                    time: statusData.remaining_formatted || `${statusData.days_remaining} يوم`,
                  })}
            </span>
          </div>

          {/* كود التحدي */}
          <div className="challenge-box-wrapper">
            <label className="challenge-box-label">{t('license.challengeLabel')}</label>
            <div className="challenge-code-display">
              <span className="challenge-code-text">{statusData.challenge_code}</span>
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                onClick={handleCopy}
              >
                <svg width={14} height={14} aria-hidden="true">
                  <use href={copied ? '#i-check' : '#i-folder'} />
                </svg>
                <span>{copied ? t('common.copied') : t('common.copy')}</span>
              </button>
            </div>
            <p className="field-hint">{t('license.challengeHint')}</p>
          </div>

          {/* حقل إدخال كود التفعيل */}
          <div className="activation-input-group">
            <label htmlFor="actCode" className="challenge-box-label">
              {t('license.activationInputLabel')}
            </label>
            <input
              id="actCode"
              type="text"
              className="key-input activation-key-input"
              placeholder="ACT-001M-0000-0000-0000"
              value={inputCode}
              onChange={(e) => setInputCode(formatActivationInput(e.target.value))}
              disabled={isSubmitting}
              autoComplete="off"
            />
          </div>

          {/* رسائل الخطأ / النجاح */}
          {errorMsg ? (
            <div className="form-error on" role="alert">
              <svg width={16} height={16}><use href="#i-alert-circle" /></svg>
              <span>{errorMsg}</span>
            </div>
          ) : null}

          {successMsg ? (
            <div className="form-ok on" role="status">
              <svg width={16} height={16}><use href="#i-check" /></svg>
              <span>{successMsg}</span>
            </div>
          ) : null}
        </div>

        {/* Footer */}
        <div className="license-modal-foot">
          {canClose && !isExpired && onClose ? (
            <button type="button" className="btn btn-secondary" onClick={onClose}>
              {t('common.cancel')}
            </button>
          ) : null}
          <button
            type="button"
            className={`btn btn-primary ${isSubmitting ? 'loading' : ''}`}
            onClick={handleActivate}
            disabled={!inputCode || inputCode.length < 10 || isSubmitting}
          >
            {isSubmitting ? (
              <svg className="spinner" width={16} height={16}><use href="#i-loader" /></svg>
            ) : (
              <svg width={16} height={16}><use href="#i-check" /></svg>
            )}
            <span>{t('license.activateBtn')}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
