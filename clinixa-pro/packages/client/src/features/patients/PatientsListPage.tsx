import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { getPatients, togglePatientActive, type CreatePatientResponseData } from '../../lib/api/patients';
import { getPaginationRange } from '../../lib/pagination';
import { useAuthStore } from '../../lib/store/authStore';
import { hasPermission } from '../../lib/permissions';
import { getAvatarColorClass, getAvatarInitials } from '../../lib/avatar';
import { NewPatientModal } from './NewPatientModal';
import './PatientsListPage.css';

const PAGE_SIZE = 25;

/** قائمة المرضى — Screen 3. الأعمدة هنا مطابقة لما بيرجعه `GET /api/patients` فعليًا فقط (لا فرع/زيارات/آخر زيارة — مش موجودين في العقد). */
export function PatientsListPage() {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const permissions = useAuthStore((s) => s.employee?.permissions);
  const canAdd = hasPermission(permissions, 'pat.add');
  const canOff = hasPermission(permissions, 'pat.off');

  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [includeInactive, setIncludeInactive] = useState(false);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [openRowMenu, setOpenRowMenu] = useState<string | null>(null);
  const [showNewModal, setShowNewModal] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  useEffect(() => {
    const timer = setTimeout(() => {
      setSearch(searchInput.trim());
      setPage(1);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchInput]);

  useEffect(() => {
    if (!openRowMenu) return;
    const close = () => setOpenRowMenu(null);
    document.addEventListener('click', close);
    return () => document.removeEventListener('click', close);
  }, [openRowMenu]);

  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => setToast(null), 2800);
    return () => clearTimeout(timer);
  }, [toast]);

  const patientsQuery = useQuery({
    queryKey: ['patients', search, page, includeInactive],
    queryFn: () => getPatients({ search, page, page_size: PAGE_SIZE, include_inactive: includeInactive }),
    placeholderData: (prev) => prev,
  });

  const toggleActiveMutation = useMutation({
    mutationFn: ({ id, is_active }: { id: string; is_active: boolean }) => togglePatientActive(id, is_active),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['patients'] }),
  });

  const data = patientsQuery.data?.ok ? patientsQuery.data.data : null;
  const items = data?.items ?? [];
  const totalItems = data?.total_items ?? 0;
  const totalPages = data?.total_pages ?? 1;
  const isLoading = patientsQuery.isLoading;
  const isEmpty = !isLoading && items.length === 0;

  function toggleSelectAll(checked: boolean) {
    setSelected(checked ? new Set(items.map((p) => p.id)) : new Set());
  }

  function toggleSelectOne(id: string, checked: boolean) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (checked) next.add(id);
      else next.delete(id);
      return next;
    });
  }

  async function bulkDeactivate() {
    await Promise.all([...selected].map((id) => togglePatientActive(id, false)));
    setSelected(new Set());
    queryClient.invalidateQueries({ queryKey: ['patients'] });
    setToast(t('patients.toasts.bulkDeactivated', { count: selected.size }));
  }

  function handlePatientCreated(patient: CreatePatientResponseData, warning: { message: string } | null) {
    setShowNewModal(false);
    queryClient.invalidateQueries({ queryKey: ['patients'] });
    setToast(warning ? warning.message : t('patients.toasts.created', { name: patient.name_ar }));
  }

  return (
    <>
      <div className="page-head">
        <div>
          <h1 className="page-title">{t('shell.nav.patients')}</h1>
          <p className="page-sub">{t('patients.headCount', { count: totalItems })}</p>
        </div>
        {canAdd && (
          <div className="page-actions">
            <button type="button" className="btn btn-primary btn-inline" onClick={() => setShowNewModal(true)}>
              <svg width={18} height={18} aria-hidden="true"><use href="#i-plus" /></svg>
              <span>{t('patients.newPatient')}</span>
            </button>
          </div>
        )}
      </div>

      <div className="table-card glass">
        <div className="card-toolbar">
          <div className={`filter-field${search ? ' active' : ''}`}>
            <span className="lead-icon"><svg width={18} height={18} aria-hidden="true"><use href="#i-list-filter" /></svg></span>
            <input
              type="text"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder={t('patients.filterPlaceholder')}
              aria-label={t('patients.filterPlaceholder')}
            />
            {search && (
              <button type="button" className="filter-clear" onClick={() => setSearchInput('')} aria-label={t('common.clearFilter')}>
                <svg width={16} height={16} aria-hidden="true"><use href="#i-x" /></svg>
              </button>
            )}
          </div>
          <div className={`select-inline${includeInactive ? ' active' : ''}`}>
            <select
              value={includeInactive ? 'all' : 'active'}
              onChange={(e) => {
                setIncludeInactive(e.target.value === 'all');
                setPage(1);
              }}
              aria-label={t('patients.statusFilterLabel')}
            >
              <option value="active">{t('patients.statusFilterActiveOnly')}</option>
              <option value="all">{t('patients.statusFilterAll')}</option>
            </select>
            <span className="chev"><svg width={16} height={16} aria-hidden="true"><use href="#i-chevron-down" /></svg></span>
          </div>
        </div>

        <div className={`bulk-bar${selected.size > 0 ? ' on' : ''}`} role="region" aria-label={t('common.bulkActions')}>
          <span className="bulk-count">{t('patients.bulkSelectedCount', { count: selected.size })}</span>
          <div className="toolbar-spacer" />
          {canOff && (
            <button
              type="button"
              className="btn btn-secondary btn-inline"
              style={{ minHeight: 36, paddingBlock: 6, color: 'var(--color-status-error-text)' }}
              onClick={bulkDeactivate}
            >
              <svg width={16} height={16} aria-hidden="true"><use href="#i-user-x" /></svg>
              <span>{t('patients.deactivate')}</span>
            </button>
          )}
          <button
            type="button"
            className="btn btn-secondary btn-inline"
            style={{ minHeight: 36, paddingBlock: 6 }}
            onClick={() => setSelected(new Set())}
          >
            <svg width={16} height={16} aria-hidden="true"><use href="#i-x" /></svg>
            <span>{t('common.clearSelection')}</span>
          </button>
        </div>

        {isEmpty ? (
          <div className="empty-state">
            <div className="empty-icon" aria-hidden="true">
              <svg width={24} height={24}><use href={search ? '#i-search-x' : '#i-users'} /></svg>
            </div>
            <h2 className="empty-title">{search ? t('patients.emptySearchTitle') : t('patients.emptyTitle')}</h2>
            <p className="empty-text">{search ? t('patients.emptySearchText') : t('patients.emptyText')}</p>
          </div>
        ) : (
          <table className="data-table" id="patientsTable" aria-label={t('patients.tableLabel')}>
            <thead>
              <tr>
                <th className="c-check" scope="col">
                  <label className="cbx-hit">
                    <input
                      type="checkbox"
                      className="cbx"
                      checked={items.length > 0 && selected.size === items.length}
                      onChange={(e) => toggleSelectAll(e.target.checked)}
                      aria-label={t('patients.selectAllLabel')}
                    />
                  </label>
                </th>
                <th scope="col" className="c-name">{t('patients.columns.patient')}</th>
                <th scope="col" className="c-age">{t('patients.columns.age')}</th>
                <th scope="col" className="c-phone">{t('patients.columns.phone')}</th>
                <th scope="col" className="c-status">{t('patients.columns.status')}</th>
                <th scope="col" className="c-due">{t('patients.columns.due')}</th>
                <th scope="col" className="c-act"><span className="sr-only">{t('common.actions')}</span></th>
              </tr>
            </thead>
            <tbody>
              {isLoading
                ? Array.from({ length: 8 }).map((_, i) => (
                    <tr key={i}>
                      <td className="c-check"><span className="skel circle" /></td>
                      <td className="c-name"><span className="skel" style={{ width: '70%' }} /></td>
                      <td className="c-age"><span className="skel" style={{ width: '40%', margin: '0 auto' }} /></td>
                      <td className="c-phone"><span className="skel" style={{ width: '80%', margin: '0 auto' }} /></td>
                      <td className="c-status"><span className="skel" style={{ width: '60%', margin: '0 auto' }} /></td>
                      <td className="c-due"><span className="skel" style={{ width: '60%', margin: '0 auto' }} /></td>
                      <td className="c-act" />
                    </tr>
                  ))
                : items.map((patient) => (
                    <tr key={patient.id} className={selected.has(patient.id) ? 'selected clickable-row' : 'clickable-row'}>
                      <td className="c-check">
                        <label className="cbx-hit">
                          <input
                            type="checkbox"
                            className="cbx"
                            checked={selected.has(patient.id)}
                            onChange={(e) => toggleSelectOne(patient.id, e.target.checked)}
                            aria-label={t('patients.selectRowLabel', { name: patient.name_ar })}
                          />
                        </label>
                      </td>
                      <td className="c-name">
                        <div className="cell-person">
                          <span className={`avatar sm ${getAvatarColorClass(patient.name_ar)}`} aria-hidden="true">
                            {getAvatarInitials(patient.name_ar)}
                          </span>
                          <span className="txt">
                            <Link className="pname" to={`/patients/${patient.id}`}>{patient.name_ar}</Link>
                            <span className="pid num">{patient.display_id}</span>
                          </span>
                        </div>
                      </td>
                      <td className="c-age num">{patient.age}</td>
                      <td className="c-phone num">{patient.phone}</td>
                      <td className="c-status">
                        {patient.is_active ? (
                          <span className="badge badge-success">{t('patients.statusActive')}</span>
                        ) : (
                          <span className="badge badge-muted">{t('patients.statusInactive')}</span>
                        )}
                      </td>
                      <td className="c-due">
                        {patient.due > 0 ? (
                          <span className="due-amount num">{patient.due.toLocaleString()}</span>
                        ) : (
                          <span className="due-none">{t('patients.dueNone')}</span>
                        )}
                      </td>
                      <td className="c-act">
                        <div className="menu-wrap">
                          <button
                            type="button"
                            className="row-menu-btn"
                            aria-haspopup="true"
                            aria-expanded={openRowMenu === patient.id}
                            aria-label={t('common.actions')}
                            onClick={(e) => {
                              e.stopPropagation();
                              setOpenRowMenu((prev) => (prev === patient.id ? null : patient.id));
                            }}
                          >
                            <svg width={18} height={18} aria-hidden="true"><use href="#i-more" /></svg>
                          </button>
                          <div className={`dropdown compact up${openRowMenu === patient.id ? ' open' : ''}`} role="menu">
                            <Link className="menu-item" role="menuitem" to={`/patients/${patient.id}`}>
                              <svg width={18} height={18} aria-hidden="true"><use href="#i-file-pen" /></svg>
                              <span>{t('patients.openFile')}</span>
                            </Link>
                            {canOff && (
                              <button
                                type="button"
                                className="menu-item danger"
                                role="menuitem"
                                onClick={() =>
                                  toggleActiveMutation.mutate({ id: patient.id, is_active: !patient.is_active })
                                }
                              >
                                <svg width={18} height={18} aria-hidden="true"><use href="#i-user-x" /></svg>
                                <span>{patient.is_active ? t('patients.deactivate') : t('patients.activate')}</span>
                              </button>
                            )}
                          </div>
                        </div>
                      </td>
                    </tr>
                  ))}
            </tbody>
          </table>
        )}

        {!isEmpty && (
          <div className="pagination">
            <span className="page-info" aria-live="polite">
              {t('patients.paginationInfo', {
                from: (page - 1) * PAGE_SIZE + 1,
                to: Math.min(page * PAGE_SIZE, totalItems),
                total: totalItems,
              })}
            </span>
            <button
              type="button"
              className="page-btn"
              disabled={page <= 1}
              onClick={() => setPage((p) => p - 1)}
              aria-label={t('patients.previousPage')}
            >
              <svg className="mirror-rtl" width={16} height={16} aria-hidden="true"><use href="#i-chevron-inline" /></svg>
            </button>
            {getPaginationRange(page, totalPages).map((entry, i) =>
              entry === '…' ? (
                <span className="page-gap" key={`gap-${i}`}>…</span>
              ) : (
                <button
                  key={entry}
                  type="button"
                  className="page-btn"
                  aria-current={entry === page ? 'page' : undefined}
                  onClick={() => setPage(entry)}
                >
                  {entry}
                </button>
              ),
            )}
            <button
              type="button"
              className="page-btn"
              disabled={page >= totalPages}
              onClick={() => setPage((p) => p + 1)}
              aria-label={t('patients.nextPage')}
            >
              <svg className="mirror-rtl" width={16} height={16} aria-hidden="true" style={{ transform: 'rotate(180deg)' }}>
                <use href="#i-chevron-inline" />
              </svg>
            </button>
          </div>
        )}
      </div>

      {showNewModal && <NewPatientModal onClose={() => setShowNewModal(false)} onCreated={handlePatientCreated} />}

      <div className={`ok-toast${toast ? ' on' : ''}`} role="status">
        <svg width={18} height={18} aria-hidden="true"><use href="#i-check-circle" /></svg>
        <span>{toast}</span>
      </div>
    </>
  );
}
