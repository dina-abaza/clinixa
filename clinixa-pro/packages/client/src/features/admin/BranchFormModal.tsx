import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import type { Branch } from '@clinixa/shared';
import { createBranch, updateBranch } from '../../lib/api/branches';

interface Props {
  /** لو اتبعت، المودال بيشتغل في وضع التعديل (PUT) بدل الإضافة (POST). */
  branch?: Branch;
  onClose: () => void;
  onSaved: () => void;
}

/** مودال "فرع جديد / تعديل فرع" — POST /api/branches أو PUT /api/branches/:id. */
export function BranchFormModal({ branch, onClose, onSaved }: Props) {
  const { t } = useTranslation();
  const isEdit = Boolean(branch);
  const [nameAr, setNameAr] = useState(branch?.name_ar ?? '');
  const [address, setAddress] = useState(branch?.address_ar ?? '');
  const [phone, setPhone] = useState(branch?.phone ?? '');
  const [opensAt, setOpensAt] = useState(branch?.opens_at ?? '09:00');
  const [closesAt, setClosesAt] = useState(branch?.closes_at ?? '21:00');
  const [isActive, setIsActive] = useState(branch?.is_active ?? true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose();
    }
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [onClose]);

  const canSubmit = nameAr.trim().length > 0 && phone.trim().length > 0 && opensAt && closesAt;

  async function handleSubmit() {
    if (!canSubmit) return;
    setSubmitError(null);
    setIsSubmitting(true);

    const payload = {
      name_ar: nameAr.trim(),
      address_ar: address.trim() || null,
      phone: phone.trim(),
      opens_at: opensAt,
      closes_at: closesAt,
    };

    const res = isEdit
      ? await updateBranch(branch!.id, { ...payload, is_active: isActive })
      : await createBranch(payload);

    setIsSubmitting(false);
    if (res.ok) {
      onSaved();
      return;
    }
    setSubmitError(res.error.message);
  }

  return (
    <div className="modal-overlay open" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal" role="dialog" aria-modal="true" aria-labelledby="branchFormTitle" style={{ maxWidth: 560 }}>
        <h2 id="branchFormTitle">{isEdit ? t('admin.branches.editModal.title') : t('admin.branches.addModal.title')}</h2>
        <p className="modal-sub">
          {isEdit ? t('admin.branches.editModal.subtitle', { name: branch!.name_ar }) : t('admin.branches.addModal.subtitle')}
        </p>

        <div className="form-grid">
          <div className="form-field wide">
            <label htmlFor="br-name-ar">{t('admin.branches.fields.nameAr')}</label>
            <div className="input-wrap no-icon">
              <input id="br-name-ar" type="text" autoFocus value={nameAr} onChange={(e) => setNameAr(e.target.value)} />
            </div>
          </div>
          <div className="form-field wide">
            <label htmlFor="br-address">{t('admin.branches.fields.address')}</label>
            <div className="input-wrap no-icon">
              <input id="br-address" type="text" value={address} onChange={(e) => setAddress(e.target.value)} />
            </div>
          </div>
          <div className="form-field">
            <label htmlFor="br-phone">{t('admin.branches.fields.phone')}</label>
            <div className="input-wrap no-icon">
              <input id="br-phone" type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} />
            </div>
          </div>
          <div className="form-field" />
          <div className="form-field">
            <label htmlFor="br-opens">{t('admin.branches.fields.opensAt')}</label>
            <div className="input-wrap no-icon">
              <input id="br-opens" type="time" value={opensAt} onChange={(e) => setOpensAt(e.target.value)} />
            </div>
          </div>
          <div className="form-field">
            <label htmlFor="br-closes">{t('admin.branches.fields.closesAt')}</label>
            <div className="input-wrap no-icon">
              <input id="br-closes" type="time" value={closesAt} onChange={(e) => setClosesAt(e.target.value)} />
            </div>
          </div>
        </div>

        {isEdit && (
          <label style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 'var(--space-4)' }}>
            <input type="checkbox" checked={isActive} onChange={(e) => setIsActive(e.target.checked)} />
            <span>{t('admin.branches.statusActive')}</span>
          </label>
        )}

        <div className={`form-error${submitError ? ' on' : ''}`} role="alert">
          <svg width={18} height={18} aria-hidden="true"><use href="#i-alert-circle" /></svg>
          <span>{submitError}</span>
        </div>

        <div className="modal-foot">
          <button type="button" className="btn btn-secondary" onClick={onClose} disabled={isSubmitting}>
            {t('common.cancel')}
          </button>
          <button
            type="button"
            className={`btn btn-primary${isSubmitting ? ' loading' : ''}`}
            disabled={!canSubmit || isSubmitting}
            onClick={handleSubmit}
          >
            <svg className="spinner" width={18} height={18} aria-hidden="true"><use href="#i-loader" /></svg>
            <span>{isSubmitting ? t('common.saving') : isEdit ? t('common.save') : t('admin.branches.addModal.submit')}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
