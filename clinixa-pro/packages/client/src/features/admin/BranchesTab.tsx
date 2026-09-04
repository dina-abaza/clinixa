import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import type { Branch } from '@clinixa/shared';
import { getBranches } from '../../lib/api/branches';
import { useAuthStore } from '../../lib/store/authStore';
import { hasPermission } from '../../lib/permissions';
import { BranchFormModal } from './BranchFormModal';

/** تبويب الفروع — GET/POST /api/branches + PUT /api/branches/:id. */
export function BranchesTab() {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const permissions = useAuthStore((s) => s.employee?.permissions);
  const canEdit = hasPermission(permissions, 'admin.edit');

  const [showAddModal, setShowAddModal] = useState(false);
  const [editBranch, setEditBranch] = useState<Branch | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => setToast(null), 2800);
    return () => clearTimeout(timer);
  }, [toast]);

  const branchesQuery = useQuery({ queryKey: ['branches'], queryFn: getBranches });
  const items = branchesQuery.data?.ok ? branchesQuery.data.data.items : [];
  const isLoading = branchesQuery.isLoading;
  const isEmpty = !isLoading && items.length === 0;

  function invalidate() {
    queryClient.invalidateQueries({ queryKey: ['branches'] });
  }

  function handleCreated() {
    setShowAddModal(false);
    invalidate();
    setToast(t('admin.branches.toasts.created'));
  }

  function handleUpdated() {
    setEditBranch(null);
    invalidate();
    setToast(t('admin.branches.toasts.updated'));
  }

  return (
    <>
      <div className="page-head" style={{ marginBottom: 'var(--space-4)' }}>
        <div />
        {canEdit && (
          <div className="page-actions">
            <button type="button" className="btn btn-primary btn-inline" onClick={() => setShowAddModal(true)}>
              <svg width={18} height={18} aria-hidden="true"><use href="#i-plus" /></svg>
              <span>{t('admin.branches.addBranch')}</span>
            </button>
          </div>
        )}
      </div>

      <div className="table-card glass">
        {isEmpty ? (
          <div className="empty-state">
            <div className="empty-icon" aria-hidden="true">
              <svg width={24} height={24}><use href="#i-building" /></svg>
            </div>
            <h2 className="empty-title">{t('admin.branches.emptyTitle')}</h2>
            <p className="empty-text">{t('admin.branches.emptyText')}</p>
          </div>
        ) : (
          <table className="data-table" aria-label={t('admin.tabs.branches')}>
            <thead>
              <tr>
                <th scope="col" className="c-name">{t('admin.branches.columns.name')}</th>
                <th scope="col" className="c-phone">{t('admin.branches.columns.phone')}</th>
                <th scope="col">{t('admin.branches.columns.hours')}</th>
                <th scope="col" className="c-status">{t('admin.branches.columns.status')}</th>
                <th scope="col" className="c-act"><span className="sr-only">{t('common.actions')}</span></th>
              </tr>
            </thead>
            <tbody>
              {isLoading
                ? Array.from({ length: 2 }).map((_, i) => (
                    <tr key={i}>
                      <td className="c-name"><span className="skel" style={{ width: '70%' }} /></td>
                      <td className="c-phone"><span className="skel" style={{ width: '70%', margin: '0 auto' }} /></td>
                      <td><span className="skel" style={{ width: '60%' }} /></td>
                      <td className="c-status"><span className="skel" style={{ width: '60%', margin: '0 auto' }} /></td>
                      <td className="c-act" />
                    </tr>
                  ))
                : items.map((branch) => (
                    <tr key={branch.id}>
                      <td className="c-name">
                        <span style={{ display: 'block', fontWeight: 600 }}>{branch.name_ar}</span>
                        {branch.is_host && <span className="badge badge-primary" style={{ marginTop: 2 }}>{t('admin.branches.hostBadge')}</span>}
                      </td>
                      <td className="c-phone num">{branch.phone}</td>
                      <td className="num">{branch.opens_at} – {branch.closes_at}</td>
                      <td className="c-status">
                        {branch.is_active ? (
                          <span className="badge badge-success">{t('admin.branches.statusActive')}</span>
                        ) : (
                          <span className="badge badge-muted">{t('admin.branches.statusInactive')}</span>
                        )}
                      </td>
                      <td className="c-act">
                        {canEdit && (
                          <button type="button" className="btn btn-secondary btn-inline" style={{ minHeight: 34, paddingBlock: 5 }} onClick={() => setEditBranch(branch)}>
                            <svg width={16} height={16} aria-hidden="true"><use href="#i-file-pen" /></svg>
                            <span>{t('admin.branches.edit')}</span>
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
            </tbody>
          </table>
        )}
      </div>

      {showAddModal && <BranchFormModal onClose={() => setShowAddModal(false)} onSaved={handleCreated} />}
      {editBranch && <BranchFormModal branch={editBranch} onClose={() => setEditBranch(null)} onSaved={handleUpdated} />}

      <div className={`ok-toast${toast ? ' on' : ''}`} role="status">
        <svg width={18} height={18} aria-hidden="true"><use href="#i-check-circle" /></svg>
        <span>{toast}</span>
      </div>
    </>
  );
}
