import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { INVENTORY_TYPES, type InventoryItem, type InventoryType } from '@clinixa/shared';
import { createInventoryItem } from '../../lib/api/inventory';

interface Props {
  onClose: () => void;
  onCreated: (item: InventoryItem) => void;
}

/** مودال "صنف جديد بالمخزون" — POST /api/inventory. */
export function AddInventoryItemModal({ onClose, onCreated }: Props) {
  const { t } = useTranslation();
  const [nameAr, setNameAr] = useState('');
  const [nameEn, setNameEn] = useState('');
  const [type, setType] = useState<InventoryType>('supplies');
  const [qty, setQty] = useState('0');
  const [minQty, setMinQty] = useState('');
  const [unit, setUnit] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose();
    }
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [onClose]);

  const canSubmit = nameAr.trim().length > 0 && unit.trim().length > 0;

  async function handleSubmit() {
    if (!canSubmit) return;
    setSubmitError(null);
    setIsSubmitting(true);
    const res = await createInventoryItem({
      name_ar: nameAr.trim(),
      name_en: nameEn.trim() || null,
      type,
      qty: qty === '' ? 0 : Number(qty),
      min_qty: type === 'equipment' || minQty === '' ? null : Number(minQty),
      unit: unit.trim(),
    });
    setIsSubmitting(false);
    if (res.ok) {
      onCreated(res.data);
      return;
    }
    setSubmitError(res.error.message);
  }

  return (
    <div className="modal-overlay open" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal" role="dialog" aria-modal="true" aria-labelledby="invAddTitle" style={{ maxWidth: 520 }}>
        <h2 id="invAddTitle">{t('inventory.addModal.title')}</h2>
        <p className="modal-sub">{t('inventory.addModal.subtitle')}</p>

        <div className="form-grid">
          <div className="form-field wide">
            <label htmlFor="inv-name-ar">{t('inventory.fields.nameAr')}</label>
            <div className="input-wrap no-icon">
              <input id="inv-name-ar" type="text" autoFocus value={nameAr} onChange={(e) => setNameAr(e.target.value)} />
            </div>
          </div>
          <div className="form-field">
            <label htmlFor="inv-name-en">{t('inventory.fields.nameEn')}</label>
            <div className="input-wrap no-icon">
              <input id="inv-name-en" type="text" value={nameEn} onChange={(e) => setNameEn(e.target.value)} />
            </div>
          </div>
          <div className="form-field">
            <label htmlFor="inv-type">{t('inventory.fields.type')}</label>
            <div className="input-wrap no-icon">
              <select id="inv-type" value={type} onChange={(e) => setType(e.target.value as InventoryType)}>
                {INVENTORY_TYPES.map((it) => (
                  <option key={it.key} value={it.key}>{it.label_ar}</option>
                ))}
              </select>
              <span className="chev"><svg width={16} height={16} aria-hidden="true"><use href="#i-chevron-down" /></svg></span>
            </div>
          </div>
          <div className="form-field">
            <label htmlFor="inv-qty">{t('inventory.fields.qty')}</label>
            <div className="input-wrap no-icon">
              <input id="inv-qty" type="number" min={0} className="num" value={qty} onChange={(e) => setQty(e.target.value)} />
            </div>
          </div>
          {type === 'supplies' && (
            <div className="form-field">
              <label htmlFor="inv-min-qty">{t('inventory.fields.minQty')}</label>
              <div className="input-wrap no-icon">
                <input id="inv-min-qty" type="number" min={0} className="num" value={minQty} onChange={(e) => setMinQty(e.target.value)} />
              </div>
            </div>
          )}
          <div className="form-field">
            <label htmlFor="inv-unit">{t('inventory.fields.unit')}</label>
            <div className="input-wrap no-icon">
              <input id="inv-unit" type="text" placeholder={t('inventory.fields.unitPlaceholder')} value={unit} onChange={(e) => setUnit(e.target.value)} />
            </div>
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
            <span>{isSubmitting ? t('common.saving') : t('inventory.addModal.submit')}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
