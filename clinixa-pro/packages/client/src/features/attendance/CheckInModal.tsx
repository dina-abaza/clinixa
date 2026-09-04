import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useQuery } from '@tanstack/react-query';
import { getPatients, type PatientListItem } from '../../lib/api/patients';
import { checkInPatient } from '../../lib/api/attendance';
import { getAvatarColorClass, getAvatarInitials } from '../../lib/avatar';

interface Props {
  onClose: () => void;
  onCheckedIn: () => void;
}

/** مودال تسجيل الحضور — بحث عن مريض واختياره ثم تأكيد (قرار 192 في البروتوتايب: بيفتح في مكانه مش شاشة كاملة). */
export function CheckInModal({ onClose, onCheckedIn }: Props) {
  const { t } = useTranslation();
  const [query, setQuery] = useState('');
  const [debounced, setDebounced] = useState('');
  const [selected, setSelected] = useState<PatientListItem | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  useEffect(() => {
    const timer = setTimeout(() => setDebounced(query.trim()), 300);
    return () => clearTimeout(timer);
  }, [query]);

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose();
    }
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [onClose]);

  const searchQuery = useQuery({
    queryKey: ['checkin-search', debounced],
    queryFn: () => getPatients({ search: debounced, page: 1, page_size: 8 }),
    enabled: debounced.length >= 2 && !selected,
  });
  const results = searchQuery.data?.ok ? searchQuery.data.data.items : [];

  async function handleConfirm() {
    if (!selected) return;
    setSubmitError(null);
    setIsSubmitting(true);
    const res = await checkInPatient(selected.id);
    setIsSubmitting(false);
    if (res.ok) {
      onCheckedIn();
      return;
    }
    setSubmitError(res.error.message);
  }

  return (
    <div className="modal-overlay open" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal ci-modal" role="dialog" aria-modal="true" aria-labelledby="ciTitle" style={{ maxWidth: 560 }}>
        <h2 id="ciTitle">{t('attendance.checkInModal.title')}</h2>
        <p className="modal-sub">{t('attendance.checkInModal.subtitle')}</p>

        {!selected ? (
          <>
            <div className="filter-field" style={{ maxWidth: 'none' }}>
              <span className="lead-icon"><svg width={18} height={18} aria-hidden="true"><use href="#i-search" /></svg></span>
              <input
                type="text"
                autoFocus
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder={t('attendance.checkInModal.searchPlaceholder')}
                aria-label={t('attendance.checkInModal.searchPlaceholder')}
              />
            </div>
            <p className="ci-hint">{t('attendance.checkInModal.searchHint')}</p>
            <div className="ci-results">
              {debounced.length < 2 ? null : searchQuery.isFetching ? (
                <div className="ci-none">{t('shell.topbar.searching')}</div>
              ) : results.length === 0 ? (
                <div className="ci-none">{t('shell.topbar.noSearchResults')}</div>
              ) : (
                results.map((patient) => (
                  <button key={patient.id} type="button" className="ci-hit" onClick={() => setSelected(patient)}>
                    <span className={`avatar sm ${getAvatarColorClass(patient.name_ar)}`} aria-hidden="true">
                      {getAvatarInitials(patient.name_ar)}
                    </span>
                    <span className="t">
                      <span className="n">{patient.name_ar}</span>
                      <span className="m">
                        {patient.display_id} · {patient.phone}
                      </span>
                    </span>
                  </button>
                ))
              )}
            </div>
          </>
        ) : (
          <div className="ci-hit on" style={{ width: '100%' }}>
            <span className={`avatar sm ${getAvatarColorClass(selected.name_ar)}`} aria-hidden="true">
              {getAvatarInitials(selected.name_ar)}
            </span>
            <span className="t">
              <span className="n">{selected.name_ar}</span>
              <span className="m">
                {selected.display_id} · {selected.phone}
              </span>
            </span>
            <button
              type="button"
              className="icon-btn"
              style={{ marginInlineStart: 'auto', width: 32, height: 32 }}
              onClick={() => setSelected(null)}
              aria-label={t('common.cancel')}
            >
              <svg width={16} height={16} aria-hidden="true"><use href="#i-x" /></svg>
            </button>
          </div>
        )}

        <div className={`form-error${submitError ? ' on' : ''}`} role="alert">
          <svg width={18} height={18} aria-hidden="true"><use href="#i-alert-circle" /></svg>
          <span>{submitError}</span>
        </div>

        <div className="modal-foot">
          <button type="button" className="btn btn-secondary" onClick={onClose}>
            {t('common.cancel')}
          </button>
          <button
            type="button"
            className={`btn btn-primary${isSubmitting ? ' loading' : ''}`}
            disabled={!selected || isSubmitting}
            onClick={handleConfirm}
          >
            <svg className="spinner" width={18} height={18} aria-hidden="true"><use href="#i-loader" /></svg>
            <span>{isSubmitting ? t('common.saving') : t('attendance.checkInModal.confirm')}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
