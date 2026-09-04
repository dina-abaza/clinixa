import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { getPatients } from '../../lib/api/patients';
import { getAvatarColorClass, getAvatarInitials } from '../../lib/avatar';
import { useDropdownMenu } from './useDropdownMenu';

/**
 * البحث العام في الـ Top bar — بيفتح ملف المريض مباشرة. مختلف عن فلترة
 * القوائم جوّه الشاشات (أيقونة عدسة مش فلتر) — Design System §3، Search/Filter.
 */
export function GlobalSearch() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const menu = useDropdownMenu<HTMLDivElement>();
  const [query, setQuery] = useState('');
  const [debounced, setDebounced] = useState('');

  useEffect(() => {
    const timer = setTimeout(() => setDebounced(query.trim()), 300);
    return () => clearTimeout(timer);
  }, [query]);

  const searchQuery = useQuery({
    queryKey: ['global-search', debounced],
    queryFn: () => getPatients({ search: debounced, page: 1, page_size: 6 }),
    enabled: debounced.length >= 2,
  });

  const results = searchQuery.data?.ok ? searchQuery.data.data.items : [];
  const isOpen = menu.open && debounced.length >= 2;

  function openPatient(id: string) {
    menu.close();
    setQuery('');
    navigate(`/patients/${id}`);
  }

  return (
    <div className="global-search menu-wrap" ref={menu.ref}>
      <svg width={18} height={18} aria-hidden="true">
        <use href="#i-search" />
      </svg>
      <input
        type="search"
        autoComplete="off"
        role="combobox"
        aria-expanded={isOpen}
        aria-label={t('shell.topbar.globalSearchLabel')}
        placeholder={t('shell.topbar.globalSearchPlaceholder')}
        value={query}
        onFocus={() => menu.setOpen(true)}
        onChange={(e) => setQuery(e.target.value)}
      />
      <div className={`dropdown search-results${isOpen ? ' open' : ''}`} role="listbox">
        {searchQuery.isFetching ? (
          <div className="ci-none">{t('shell.topbar.searching')}</div>
        ) : results.length === 0 ? (
          <div className="ci-none">{t('shell.topbar.noSearchResults')}</div>
        ) : (
          results.map((patient) => (
            <button
              key={patient.id}
              type="button"
              className="menu-item"
              role="option"
              aria-selected={false}
              onClick={() => openPatient(patient.id)}
            >
              <span className={`avatar sm ${getAvatarColorClass(patient.name_ar)}`} aria-hidden="true">
                {getAvatarInitials(patient.name_ar)}
              </span>
              <span className="txt">
                <span style={{ fontWeight: 600 }}>{patient.name_ar}</span>
                <span className="meta">
                  {patient.display_id} · {patient.phone}
                </span>
              </span>
            </button>
          ))
        )}
      </div>
    </div>
  );
}
