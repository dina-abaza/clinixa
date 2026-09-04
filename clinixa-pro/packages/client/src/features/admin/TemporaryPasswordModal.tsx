import { useState } from 'react';
import { useTranslation } from 'react-i18next';

interface Props {
  name: string;
  password: string;
  onClose: () => void;
}

/** مودال عرض كلمة السر المؤقتة — مرة واحدة فقط، مفيش أي تخزين لها بعد إغلاق النافذة دي (AGENTS.md §6.4). */
export function TemporaryPasswordModal({ name, password, onClose }: Props) {
  const { t } = useTranslation();
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(password);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      // نسخ الحافظة مش متاح — المستخدم يقدر يعمل تحديد ونسخ يدوي بدلاً منه
    }
  }

  return (
    <div className="modal-overlay open">
      <div className="modal" role="dialog" aria-modal="true" aria-labelledby="tempPwTitle" style={{ maxWidth: 420 }}>
        <h2 id="tempPwTitle">{t('admin.employees.tempPasswordModal.title')}</h2>
        <p className="modal-sub">{t('admin.employees.tempPasswordModal.subtitle')}</p>

        <p style={{ fontWeight: 600, marginBottom: 8 }}>{t('admin.employees.tempPasswordModal.forEmployee', { name })}</p>

        <div
          className="num"
          style={{
            fontSize: 'var(--text-h2)',
            fontWeight: 800,
            letterSpacing: '.04em',
            textAlign: 'center',
            padding: 'var(--space-4)',
            borderRadius: 'var(--radius-md)',
            background: 'var(--color-row-hover)',
            border: '1px solid var(--color-border-subtle)',
            marginBottom: 'var(--space-4)',
          }}
        >
          {password}
        </div>

        <div className="modal-foot">
          <button type="button" className="btn btn-secondary" onClick={handleCopy}>
            <svg width={16} height={16} aria-hidden="true"><use href={copied ? '#i-check' : '#i-file-pen'} /></svg>
            <span>{copied ? t('common.copied') : t('common.copy')}</span>
          </button>
          <button type="button" className="btn btn-primary" onClick={onClose}>
            {t('admin.employees.tempPasswordModal.done')}
          </button>
        </div>
      </div>
    </div>
  );
}
