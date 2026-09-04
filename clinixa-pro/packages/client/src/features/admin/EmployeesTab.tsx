import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { Employee } from '@clinixa/shared';
import { getEmployees, resetEmployeePassword, toggleEmployeeActive, type CreateEmployeeResponseData } from '../../lib/api/employees';
import { getBranches } from '../../lib/api/branches';
import { useAuthStore } from '../../lib/store/authStore';
import { hasPermission } from '../../lib/permissions';
import { getAvatarColorClass, getAvatarInitials } from '../../lib/avatar';
import { AddEmployeeModal } from './AddEmployeeModal';
import { PermissionsModal } from './PermissionsModal';
import { TemporaryPasswordModal } from './TemporaryPasswordModal';

/** تبويب الموظفون — GET/POST /api/employees + PUT permissions + PATCH reset-password/toggle-active. */
export function EmployeesTab() {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const permissions = useAuthStore((s) => s.employee?.permissions);
  const canEdit = hasPermission(permissions, 'admin.edit');

  const [openRowMenu, setOpenRowMenu] = useState<string | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [permissionsTarget, setPermissionsTarget] = useState<Employee | null>(null);
  const [tempPassword, setTempPassword] = useState<{ name: string; password: string } | null>(null);
  const [toast, setToast] = useState<string | null>(null);

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

  const employeesQuery = useQuery({ queryKey: ['employees'], queryFn: () => getEmployees() });
  const branchesQuery = useQuery({ queryKey: ['branches'], queryFn: getBranches });

  const resetPasswordMutation = useMutation({
    mutationFn: (id: string) => resetEmployeePassword(id),
  });

  const toggleActiveMutation = useMutation({
    mutationFn: ({ id, is_active }: { id: string; is_active: boolean }) => toggleEmployeeActive(id, is_active),
    onSuccess: (res, vars) => {
      if (res.ok) {
        queryClient.invalidateQueries({ queryKey: ['employees'] });
        setToast(vars.is_active ? t('admin.employees.toasts.activated') : t('admin.employees.toasts.deactivated'));
      }
    },
  });

  const items = employeesQuery.data?.ok ? employeesQuery.data.data.items : [];
  const branches = branchesQuery.data?.ok ? branchesQuery.data.data.items : [];
  const isLoading = employeesQuery.isLoading;
  const isEmpty = !isLoading && items.length === 0;

  function branchName(branchId: string | null): string {
    if (!branchId) return t('admin.employees.allBranches');
    return branches.find((b) => b.id === branchId)?.name_ar ?? '—';
  }

  async function handleResetPassword(employee: Employee) {
    setOpenRowMenu(null);
    if (!window.confirm(t('admin.employees.confirmResetPassword', { name: employee.name_ar }))) return;
    const res = await resetPasswordMutation.mutateAsync(employee.id);
    if (res.ok) {
      setTempPassword({ name: employee.name_ar, password: res.data.temporary_password });
      setToast(t('admin.employees.toasts.passwordReset'));
    }
  }

  function handleToggleActive(employee: Employee) {
    setOpenRowMenu(null);
    const nextActive = !employee.is_active;
    const confirmMsg = nextActive
      ? t('admin.employees.confirmActivate', { name: employee.name_ar })
      : t('admin.employees.confirmDeactivate', { name: employee.name_ar });
    if (!window.confirm(confirmMsg)) return;
    toggleActiveMutation.mutate({ id: employee.id, is_active: nextActive });
  }

  function handleCreated(data: CreateEmployeeResponseData) {
    setShowAddModal(false);
    queryClient.invalidateQueries({ queryKey: ['employees'] });
    setTempPassword({ name: data.name_ar, password: data.temporary_password });
  }

  function handlePermissionsUpdated() {
    setPermissionsTarget(null);
    queryClient.invalidateQueries({ queryKey: ['employees'] });
    setToast(t('admin.employees.toasts.permissionsUpdated'));
  }

  return (
    <>
      <div className="page-head" style={{ marginBottom: 'var(--space-4)' }}>
        <div />
        {canEdit && (
          <div className="page-actions">
            <button type="button" className="btn btn-primary btn-inline" onClick={() => setShowAddModal(true)}>
              <svg width={18} height={18} aria-hidden="true"><use href="#i-plus" /></svg>
              <span>{t('admin.employees.addEmployee')}</span>
            </button>
          </div>
        )}
      </div>

      <div className="table-card glass">
        {isEmpty ? (
          <div className="empty-state">
            <div className="empty-icon" aria-hidden="true">
              <svg width={24} height={24}><use href="#i-users" /></svg>
            </div>
            <h2 className="empty-title">{t('admin.employees.emptyTitle')}</h2>
            <p className="empty-text">{t('admin.employees.emptyText')}</p>
          </div>
        ) : (
          <table className="data-table" aria-label={t('admin.tabs.employees')}>
            <thead>
              <tr>
                <th scope="col" className="c-name">{t('admin.employees.columns.name')}</th>
                <th scope="col">{t('admin.employees.columns.username')}</th>
                <th scope="col">{t('admin.employees.columns.role')}</th>
                <th scope="col">{t('admin.employees.columns.branch')}</th>
                <th scope="col" className="c-status">{t('admin.employees.columns.status')}</th>
                <th scope="col" className="c-act"><span className="sr-only">{t('common.actions')}</span></th>
              </tr>
            </thead>
            <tbody>
              {isLoading
                ? Array.from({ length: 4 }).map((_, i) => (
                    <tr key={i}>
                      <td className="c-name"><span className="skel" style={{ width: '70%' }} /></td>
                      <td><span className="skel" style={{ width: '60%' }} /></td>
                      <td><span className="skel" style={{ width: '50%' }} /></td>
                      <td><span className="skel" style={{ width: '60%' }} /></td>
                      <td className="c-status"><span className="skel" style={{ width: '60%', margin: '0 auto' }} /></td>
                      <td className="c-act" />
                    </tr>
                  ))
                : items.map((employee) => (
                    <tr key={employee.id}>
                      <td className="c-name">
                        <div className="cell-person">
                          <span className={`avatar sm ${getAvatarColorClass(employee.name_ar)}`} aria-hidden="true">
                            {getAvatarInitials(employee.name_ar)}
                          </span>
                          <span className="txt">
                            <span style={{ display: 'block', fontWeight: 600 }}>{employee.name_ar}</span>
                            {employee.is_owner && <span className="badge badge-primary" style={{ marginTop: 2 }}>{t('admin.ownerBadge')}</span>}
                          </span>
                        </div>
                      </td>
                      <td className="num">{employee.username}</td>
                      <td>{t(`shell.roles.${employee.role}`)}</td>
                      <td>{branchName(employee.branch_id)}</td>
                      <td className="c-status">
                        {employee.is_active ? (
                          <span className="badge badge-success">{t('admin.employees.statusActive')}</span>
                        ) : (
                          <span className="badge badge-muted">{t('admin.employees.statusInactive')}</span>
                        )}
                      </td>
                      <td className="c-act">
                        {canEdit && (
                          <div className="menu-wrap">
                            <button
                              type="button"
                              className="row-menu-btn"
                              aria-haspopup="true"
                              aria-expanded={openRowMenu === employee.id}
                              aria-label={t('common.actions')}
                              onClick={(e) => {
                                e.stopPropagation();
                                setOpenRowMenu((prev) => (prev === employee.id ? null : employee.id));
                              }}
                            >
                              <svg width={18} height={18} aria-hidden="true"><use href="#i-more" /></svg>
                            </button>
                            <div className={`dropdown compact up${openRowMenu === employee.id ? ' open' : ''}`} role="menu">
                              {!employee.is_owner && (
                                <button type="button" className="menu-item" role="menuitem" onClick={() => { setPermissionsTarget(employee); setOpenRowMenu(null); }}>
                                  <svg width={18} height={18} aria-hidden="true"><use href="#i-lock" /></svg>
                                  <span>{t('admin.employees.editPermissions')}</span>
                                </button>
                              )}
                              <button type="button" className="menu-item" role="menuitem" onClick={() => handleResetPassword(employee)}>
                                <svg width={18} height={18} aria-hidden="true"><use href="#i-key" /></svg>
                                <span>{t('admin.employees.resetPassword')}</span>
                              </button>
                              {!employee.is_owner && (
                                <button type="button" className="menu-item danger" role="menuitem" onClick={() => handleToggleActive(employee)}>
                                  <svg width={18} height={18} aria-hidden="true"><use href={employee.is_active ? '#i-user-x' : '#i-check'} /></svg>
                                  <span>{employee.is_active ? t('admin.employees.deactivate') : t('admin.employees.activate')}</span>
                                </button>
                              )}
                            </div>
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
            </tbody>
          </table>
        )}
      </div>

      {showAddModal && <AddEmployeeModal branches={branches} onClose={() => setShowAddModal(false)} onCreated={handleCreated} />}
      {permissionsTarget && (
        <PermissionsModal employee={permissionsTarget} onClose={() => setPermissionsTarget(null)} onUpdated={handlePermissionsUpdated} />
      )}
      {tempPassword && <TemporaryPasswordModal name={tempPassword.name} password={tempPassword.password} onClose={() => setTempPassword(null)} />}

      <div className={`ok-toast${toast ? ' on' : ''}`} role="status">
        <svg width={18} height={18} aria-hidden="true"><use href="#i-check-circle" /></svg>
        <span>{toast}</span>
      </div>
    </>
  );
}
