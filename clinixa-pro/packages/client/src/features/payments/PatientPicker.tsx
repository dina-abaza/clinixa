import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useQuery } from '@tanstack/react-query';
import { getPatients } from '../../lib/api/patients';
import { getAvatarColorClass, getAvatarInitials } from '../../lib/avatar';

export interface PickerPatient {
  id: string;
  name_ar: string;
  due?: number;
}

interface Props {
  patient: PickerPatient | null;
  /** لو true، زرار "تغيير" بيتخفي — المريض جاي من سياق مقفول (صف مستحقات مثلًا). */
  locked?: boolean;
  onSelect: (patient: PickerPatient) => void;
  onClear: () => void;
}

/**
 * اختيار مريض بالبحث — نفس هيكل صف نتيجة البحث في `GlobalSearch`/`CheckInModal`
 * (`.ci-hit`/`.ci-results`)، مشترك بين مودالي "دفعة جديدة" و"إضافة رسم مباشر".
 */
export function PatientPicker({ patient, locked, onSelect, onClear }: Props) {
  const { t } = useTranslation();
  const [query, setQuery] = useState('');
  const [debounced, setDebounced] = useState('');

  useEffect(() => {
    const timer = setTimeout(() => setDebounced(query.trim()), 300);
    return () => clearTimeout(timer);
  }, [query]);

  const searchQuery = useQuery({
    queryKey: ['payment-patient-search', debounced],
    queryFn: () => getPatients({ search: debounced, page: 1, page_size: 8 }),
    enabled: debounced.length >= 2 && !patient,
  });
  const results = searchQuery.data?.ok ? searchQuery.data.data.items : [];

  if (patient) {
    return (
      <div className="ci-hit on" style={{ width: '100%', marginBottom: 'var(--space-4)' }}>
        <span className={`avatar sm ${getAvatarColorClass(patient.name_ar)}`} aria-hidden="true">
          {getAvatarInitials(patient.name_ar)}
        </span>
        <span className="t">
          <span className="n">{patient.name_ar}</span>
          {Boolean(patient.due && patient.due > 0) && (
            <span className="m">{t('payments.addModal.dueAmount', { amount: patient.due!.toLocaleString() })}</span>
          )}
        </span>
        {!locked && (
          <button
            type="button"
            className="icon-btn"
            style={{ marginInlineStart: 'auto', width: 32, height: 32 }}
            onClick={onClear}
            aria-label={t('common.cancel')}
          >
            <svg width={16} height={16} aria-hidden="true"><use href="#i-x" /></svg>
          </button>
        )}
      </div>
    );
  }

  return (
    <>
      <div className="form-field">
        <label htmlFor="patient-picker-input">{t('payments.addModal.patientLabel')}</label>
        <div className="input-wrap no-icon">
          <input
            id="patient-picker-input"
            type="text"
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={t('attendance.checkInModal.searchPlaceholder')}
          />
        </div>
      </div>
      <div className="ci-results">
        {debounced.length < 2 ? null : searchQuery.isFetching ? (
          <div className="ci-none">{t('shell.topbar.searching')}</div>
        ) : results.length === 0 ? (
          <div className="ci-none">{t('shell.topbar.noSearchResults')}</div>
        ) : (
          results.map((p) => (
            <button
              key={p.id}
              type="button"
              className="ci-hit"
              onClick={() => onSelect({ id: p.id, name_ar: p.name_ar, due: p.due })}
            >
              <span className={`avatar sm ${getAvatarColorClass(p.name_ar)}`} aria-hidden="true">
                {getAvatarInitials(p.name_ar)}
              </span>
              <span className="t">
                <span className="n">{p.name_ar}</span>
                <span className="m">
                  {p.display_id} · {p.due > 0 ? t('payments.addModal.dueAmount', { amount: p.due.toLocaleString() }) : t('patients.dueNone')}
                </span>
              </span>
            </button>
          ))
        )}
      </div>
    </>
  );
}
