import { useState } from 'react';
import type { UseFormReturn } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import type { FirstRunSetupFormValues } from '../schema';
import { SECURITY_QUESTION_KEYS } from '../data/securityQuestions';

interface Props {
  form: UseFormReturn<FirstRunSetupFormValues>;
}

export function SecurityStep({ form }: Props) {
  const { t } = useTranslation();
  const {
    register,
    formState: { errors },
  } = form;
  const [answerVisible, setAnswerVisible] = useState(false);

  return (
    <>
      <div className="notice">
        <svg width={20} height={20} aria-hidden="true">
          <use href="#i-alert-triangle" />
        </svg>
        <div>
          <strong>{t('setup.security.noticeTitle')}</strong>
          <span>{t('setup.security.noticeBody')}</span>
        </div>
      </div>

      <div className={`form-field${errors.securityQuestion ? ' invalid' : ''}`}>
        <label htmlFor="question">{t('setup.security.questionLabel')}</label>
        <div className="input-wrap">
          <span className="lead-icon" aria-hidden="true">
            <svg width={20} height={20}>
              <use href="#i-help" />
            </svg>
          </span>
          <select id="question" aria-describedby="qErr" {...register('securityQuestion')}>
            <option value="">{t('setup.security.questionPlaceholder')}</option>
            {SECURITY_QUESTION_KEYS.map((key) => (
              <option key={key} value={key}>
                {t(`setup.security.questions.${key}`)}
              </option>
            ))}
          </select>
          <span className="chev" aria-hidden="true">
            <svg width={18} height={18}>
              <use href="#i-chevron-down" />
            </svg>
          </span>
        </div>
        <p className="field-error" id="qErr" role="alert">
          <svg width={14} height={14} aria-hidden="true">
            <use href="#i-alert-circle" />
          </svg>
          <span>{t('setup.security.questionError')}</span>
        </p>
      </div>

      <div className={`form-field${errors.securityAnswer ? ' invalid' : ''}`}>
        <label htmlFor="answer">{t('setup.security.answerLabel')}</label>
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
            aria-describedby="aErr answerHint"
            placeholder={t('setup.security.answerPlaceholder')}
            {...register('securityAnswer')}
          />
          <button
            type="button"
            className="pw-toggle"
            aria-pressed={answerVisible}
            aria-controls="answer"
            aria-label={answerVisible ? t('setup.security.hideAnswer') : t('setup.security.showAnswer')}
            onClick={() => setAnswerVisible((v) => !v)}
          >
            <svg width={20} height={20} aria-hidden="true">
              <use href={answerVisible ? '#i-eye-off' : '#i-eye'} />
            </svg>
          </button>
        </div>
        <p className="field-error" id="aErr" role="alert">
          <svg width={14} height={14} aria-hidden="true">
            <use href="#i-alert-circle" />
          </svg>
          <span>{t('setup.security.answerError')}</span>
        </p>
        <p className="field-hint" id="answerHint">
          <svg width={14} height={14} aria-hidden="true">
            <use href="#i-help" />
          </svg>
          <span>{t('setup.security.answerHint')}</span>
        </p>
      </div>

      <div className={`form-field${errors.confirmAnswer ? ' invalid' : ''}`}>
        <label htmlFor="confirm">{t('setup.security.confirmLabel')}</label>
        <div className="input-wrap">
          <span className="lead-icon" aria-hidden="true">
            <svg width={20} height={20}>
              <use href="#i-key" />
            </svg>
          </span>
          <input
            id="confirm"
            type="password"
            autoComplete="off"
            spellCheck={false}
            placeholder={t('setup.security.confirmPlaceholder')}
            {...register('confirmAnswer')}
          />
        </div>
        <p className="field-error" role="alert">
          <svg width={14} height={14} aria-hidden="true">
            <use href="#i-alert-circle" />
          </svg>
          <span>{t('setup.security.confirmError')}</span>
        </p>
      </div>
    </>
  );
}
