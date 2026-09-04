import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ROLES, PERMISSIONS, type Branch, type EmployeeRole, type Permission } from '@clinixa/shared';
import { createEmployee, type CreateEmployeeResponseData } from '../../lib/api/employees';
import { PermissionsChecklist } from './PermissionsChecklist';

interface Props {
  branches: Branch[];
  onClose: () => void;
  onCreated: (data: CreateEmployeeResponseData) => void;
}

/** مودال "موظف جديد" — POST /api/employees. */
export function AddEmployeeModal({ branches, onClose, onCreated }: Props) {
  const { t } = useTranslation();
  const [nameAr, setNameAr] = useState('');
  const [username, setUsername] = useState('');
  const [role, setRole] = useState<EmployeeRole>('secretary');
  const [branchId, setBranchId] = useState('');
  const [selectedPermissions, setSelectedPermissions] = useState<Set<Permission>>(new Set());
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose();
    }
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [onClose]);

  const canSubmit = nameAr.trim().length > 0 && username.trim().length >= 3;

  async function handleSubmit() {
    if (!canSubmit) return;
    setSubmitError(null);
    setIsSubmitting(true);
    const res = await createEmployee({
      name_ar: nameAr.trim(),
      username: username.trim(),
      role,
      branch_id: branchId || null,
      permissions: [...selectedPermissions],
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
      <div className="modal" role="dialog" aria-modal="true" aria-labelledby="empAddTitle" style={{ maxWidth: 640 }}>
        <h2 id="empAddTitle">{t('admin.employees.addModal.title')}</h2>
        <p className="modal-sub">{t('admin.employees.addModal.subtitle')}</p>

        <div className="form-grid">
          <div className="form-field">
            <label htmlFor="emp-name-ar">{t('admin.employees.fields.nameAr')}</label>
            <div className="input-wrap no-icon">
              <input id="emp-name-ar" type="text" autoFocus value={nameAr} onChange={(e) => setNameAr(e.target.value)} />
            </div>
          </div>
          <div className="form-field">
            <label htmlFor="emp-username">{t('admin.employees.fields.username')}</label>
            <div className="input-wrap no-icon">
              <input id="emp-username" type="text" value={username} onChange={(e) => setUsername(e.target.value)} />
            </div>
          </div>
          <div className="form-field">
            <label htmlFor="emp-role">{t('admin.employees.fields.role')}</label>
            <div className="input-wrap no-icon">
              <select id="emp-role" value={role} onChange={(e) => setRole(e.target.value as EmployeeRole)}>
                {ROLES.map((r) => (
                  <option key={r} value={r}>{t(`shell.roles.${r}`)}</option>
                ))}
              </select>
              <span className="chev"><svg width={16} height={16} aria-hidden="true"><use href="#i-chevron-down" /></svg></span>
            </div>
          </div>
          <div className="form-field">
            <label htmlFor="emp-branch">{t('admin.employees.fields.branch')}</label>
            <div className="input-wrap no-icon">
              <select id="emp-branch" value={branchId} onChange={(e) => setBranchId(e.target.value)}>
                <option value="">{t('admin.employees.fields.branchNone')}</option>
                {branches.map((b) => (
                  <option key={b.id} value={b.id}>{b.name_ar}</option>
                ))}
              </select>
              <span className="chev"><svg width={16} height={16} aria-hidden="true"><use href="#i-chevron-down" /></svg></span>
            </div>
          </div>
        </div>

        <div className="form-field wide">
          <label>{t('admin.employees.addModal.permissionsLabel')}</label>
          <PermissionsChecklist
            allPermissions={PERMISSIONS}
            selected={selectedPermissions}
            onChange={setSelectedPermissions}
          />
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
            <span>{isSubmitting ? t('common.saving') : t('admin.employees.addModal.submit')}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
