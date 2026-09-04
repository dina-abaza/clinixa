import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { INVENTORY_TYPES, type InventoryItem, type InventoryType } from '@clinixa/shared';
import { updateInventoryItem } from '../../lib/api/inventory';

interface Props {
  item: InventoryItem;
  onClose: () => void;
  onUpdated: (item: InventoryItem) => void;
}

/** مودال "تعديل الصنف" — PUT /api/inventory/:id، مبني مسبقًا من بيانات الصنف الحالية. */
export function EditInventoryItemModal({ item, onClose, onUpdated }: Props) {
  const { t } = useTranslation();
  const [nameAr, setNameAr] = useState(item.name_ar);
  const [nameEn, setNameEn] = useState(item.name_en ?? '');
  const [type, setType] = useState<InventoryType>(item.type);
  const [minQty, setMinQty] = useState(item.min_qty === null ? '' : String(item.min_qty));
  const [unit, setUnit] = useState(item.unit);
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
    const res = await updateInventoryItem(item.id, {
      name_ar: nameAr.trim(),
      name_en: nameEn.trim() || null,
      type,
      min_qty: type === 'equipment' || minQty === '' ? null : Number(minQty),
      unit: unit.trim(),
    });
    setIsSubmitting(false);
    if (res.ok) {
      onUpdated(res.data);
      return;
    }
    setSubmitError(res.error.message);
  }

  return (
    <div className="modal-overlay open" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal" role="dialog" aria-modal="true" aria-labelledby="invEditTitle" style={{ maxWidth: 520 }}>
        <h2 id="invEditTitle">{t('inventory.editModal.title')}</h2>
        <p className="modal-sub">{t('inventory.editModal.subtitle', { name: item.name_ar })}</p>

        <div className="form-grid">
          <div className="form-field wide">
            <label htmlFor="inv-e-name-ar">{t('inventory.fields.nameAr')}</label>
            <div className="input-wrap no-icon">
              <input id="inv-e-name-ar" type="text" autoFocus value={nameAr} onChange={(e) => setNameAr(e.target.value)} />
            </div>
          </div>
          <div className="form-field">
            <label htmlFor="inv-e-name-en">{t('inventory.fields.nameEn')}</label>
            <div className="input-wrap no-icon">
              <input id="inv-e-name-en" type="text" value={nameEn} onChange={(e) => setNameEn(e.target.value)} />
            </div>
          </div>
          <div className="form-field">
            <label htmlFor="inv-e-type">{t('inventory.fields.type')}</label>
            <div className="input-wrap no-icon">
              <select id="inv-e-type" value={type} onChange={(e) => setType(e.target.value as InventoryType)}>
                {INVENTORY_TYPES.map((it) => (
                  <option key={it.key} value={it.key}>{it.label_ar}</option>
                ))}
              </select>
              <span className="chev"><svg width={16} height={16} aria-hidden="true"><use href="#i-chevron-down" /></svg></span>
            </div>
          </div>
          {type === 'supplies' && (
            <div className="form-field">
              <label htmlFor="inv-e-min-qty">{t('inventory.fields.minQty')}</label>
              <div className="input-wrap no-icon">
                <input id="inv-e-min-qty" type="number" min={0} className="num" value={minQty} onChange={(e) => setMinQty(e.target.value)} />
              </div>
            </div>
          )}
          <div className="form-field">
            <label htmlFor="inv-e-unit">{t('inventory.fields.unit')}</label>
            <div className="input-wrap no-icon">
              <input id="inv-e-unit" type="text" value={unit} onChange={(e) => setUnit(e.target.value)} />
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
            <span>{isSubmitting ? t('common.saving') : t('common.save')}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
