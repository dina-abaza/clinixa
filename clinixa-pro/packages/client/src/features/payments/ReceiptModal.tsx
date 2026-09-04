import { useTranslation } from 'react-i18next';
import type { PaymentReceipt } from '../../lib/api/payments';

interface Props {
  receipt: PaymentReceipt;
  onClose: () => void;
}

/**
 * تأكيد الدفعة + إيصال قابل للطباعة — `.receipt` مخفي على الشاشة وبيظهر
 * بس وقت الطباعة (tokens.css §13، مقاس طابعة حرارية 80mm).
 */
export function ReceiptModal({ receipt, onClose }: Props) {
  const { t } = useTranslation();

  return (
    <>
      <div className="modal-overlay open" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
        <div className="modal" role="dialog" aria-modal="true" style={{ maxWidth: 420, textAlign: 'center' }}>
          <div className="empty-icon" style={{ margin: '0 auto var(--space-4)' }} aria-hidden="true">
            <svg width={24} height={24}><use href="#i-check-circle" /></svg>
          </div>
          <h2>{t('payments.receipt.title')}</h2>
          <p className="modal-sub">{t('payments.receipt.amount', { amount: receipt.amount.toLocaleString() })}</p>

          <div className="detail-grid" style={{ textAlign: 'start', marginTop: 'var(--space-4)' }}>
            <div className="detail-item">
              <span className="detail-label">{t('payments.receipt.patient')}</span>
              <span className="detail-value">{receipt.patient_name}</span>
            </div>
            <div className="detail-item">
              <span className="detail-label">{t('payments.addModal.methodLabel')}</span>
              <span className="detail-value">{receipt.method}</span>
            </div>
            {receipt.remaining_line_visible && (
              <div className="detail-item wide">
                <span className="detail-label">{t('payments.receipt.remaining')}</span>
                <span className="detail-value num">{receipt.remaining_amount.toLocaleString()}</span>
              </div>
            )}
          </div>

          <div className="modal-foot" style={{ justifyContent: 'center' }}>
            <button type="button" className="btn btn-secondary" onClick={onClose}>
              {t('common.cancel')}
            </button>
            <button type="button" className="btn btn-primary" onClick={() => window.print()}>
              <svg width={18} height={18} aria-hidden="true"><use href="#i-file-pen" /></svg>
              <span>{t('payments.receipt.print')}</span>
            </button>
          </div>
        </div>
      </div>

      <div className="receipt" aria-hidden="true">
        <p className="r-clinic">{receipt.clinic_name}</p>
        <p className="r-branch">
          {receipt.branch_name}
          {receipt.branch_phone ? ` · ${receipt.branch_phone}` : ''}
        </p>
        <p className="r-title">{t('payments.receipt.printTitle')}</p>
        <div className="r-line"><span className="r-key">{t('payments.receipt.patient')}</span><span className="r-val">{receipt.patient_name}</span></div>
        <div className="r-line"><span className="r-key">{t('payments.receipt.date')}</span><span className="r-val num">{receipt.date}</span></div>
        <div className="r-line"><span className="r-key">{t('payments.addModal.methodLabel')}</span><span className="r-val">{receipt.method}</span></div>
        <div className="r-total"><span>{t('payments.receipt.total')}</span><span className="num">{receipt.amount.toLocaleString()}</span></div>
        {receipt.remaining_line_visible && (
          <div className="r-line"><span className="r-key">{t('payments.receipt.remaining')}</span><span className="r-val num">{receipt.remaining_amount.toLocaleString()}</span></div>
        )}
        <p className="r-foot">{t('payments.receipt.footNote')}</p>
      </div>
    </>
  );
}
