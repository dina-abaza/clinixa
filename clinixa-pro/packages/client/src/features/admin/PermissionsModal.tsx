import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { PERMISSIONS, type Employee, type Permission } from '@clinixa/shared';
import { updateEmployeePermissions } from '../../lib/api/employees';
import { PermissionsChecklist } from './PermissionsChecklist';

interface Props {
  employee: Employee;
  onClose: () => void;
  onUpdated: () => void;
}

/** مودال "تعديل صلاحيات الموظف" — PUT /api/employees/:id/permissions (استبدال كامل). */
export function PermissionsModal({ employee, onClose, onUpdated }: Props) {
  const { t } = useTranslation();
  const [selectedPermissions, setSelectedPermissions] = useState<Set<Permission>>(new Set(employee.permissions));
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose();
    }
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [onClose]);

  async function handleSubmit() {
    setSubmitError(null);
    setIsSubmitting(true);
    const res = await updateEmployeePermissions(employee.id, [...selectedPermissions]);
    setIsSubmitting(false);
    if (res.ok) {
      onUpdated();
      return;
    }
    setSubmitError(res.error.message);
  }

  return (
    <div className="modal-overlay open" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal" role="dialog" aria-modal="true" aria-labelledby="permTitle" style={{ maxWidth: 640 }}>
        <h2 id="permTitle">{t('admin.employees.permissionsModal.title', { name: employee.name_ar })}</h2>
        <p className="modal-sub">{t('admin.employees.permissionsModal.subtitle')}</p>

        <PermissionsChecklist allPermissions={PERMISSIONS} selected={selectedPermissions} onChange={setSelectedPermissions} />

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
            disabled={isSubmitting}
            onClick={handleSubmit}
          >
            <svg className="spinner" width={18} height={18} aria-hidden="true"><use href="#i-loader" /></svg>
            <span>{isSubmitting ? t('common.saving') : t('admin.employees.permissionsModal.submit')}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
