import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import type { InventoryItem } from '@clinixa/shared';
import { adjustInventoryQty } from '../../lib/api/inventory';

interface Props {
  item: InventoryItem;
  onClose: () => void;
  onAdjusted: () => void;
}

/** مودال "تعديل الكمية السريع" — PATCH /api/inventory/:id/adjust-qty. */
export function AdjustQtyModal({ item, onClose, onAdjusted }: Props) {
  const { t } = useTranslation();
  const [qty, setQty] = useState(String(item.qty));
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose();
    }
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [onClose]);

  const qtyNum = Number(qty);
  const canSubmit = qty !== '' && Number.isFinite(qtyNum) && qtyNum >= 0;

  async function handleSubmit() {
    if (!canSubmit) return;
    setSubmitError(null);
    setIsSubmitting(true);
    const res = await adjustInventoryQty(item.id, qtyNum);
    setIsSubmitting(false);
    if (res.ok) {
      onAdjusted();
      return;
    }
    setSubmitError(res.error.message);
  }

  return (
    <div className="modal-overlay open" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal" role="dialog" aria-modal="true" aria-labelledby="invAdjTitle" style={{ maxWidth: 420 }}>
        <h2 id="invAdjTitle">{t('inventory.adjustModal.title')}</h2>
        <p className="modal-sub">{t('inventory.adjustModal.subtitle', { name: item.name_ar })}</p>

        <div className="form-field">
          <label htmlFor="inv-adj-qty">{t('inventory.adjustModal.qtyLabel')}</label>
          <div className="input-wrap no-icon">
            <input
              id="inv-adj-qty"
              type="number"
              min={0}
              className="num"
              autoFocus
              value={qty}
              onChange={(e) => setQty(e.target.value)}
            />
          </div>
        </div>

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
            <span>{isSubmitting ? t('common.saving') : t('inventory.adjustModal.submit')}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
