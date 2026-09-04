import { useTranslation } from 'react-i18next';
import type { Permission } from '@clinixa/shared';

interface Props {
  allPermissions: readonly Permission[];
  selected: Set<Permission>;
  onChange: (next: Set<Permission>) => void;
}

/** قائمة صلاحيات مجمّعة بحسب موديولها (pat/att/pay/inv/admin) — مستخدمة في مودالَي إضافة موظف وتعديل الصلاحيات. */
export function PermissionsChecklist({ allPermissions, selected, onChange }: Props) {
  const { t } = useTranslation();

  const groups = new Map<string, Permission[]>();
  for (const permission of allPermissions) {
    const groupKey = permission.split('.')[0];
    if (!groups.has(groupKey)) groups.set(groupKey, []);
    groups.get(groupKey)!.push(permission);
  }

  function toggle(permission: Permission, checked: boolean) {
    const next = new Set(selected);
    if (checked) next.add(permission);
    else next.delete(permission);
    onChange(next);
  }

  return (
    <div style={{ display: 'grid', gap: 'var(--space-4)' }}>
      {[...groups.entries()].map(([groupKey, groupPermissions]) => (
        <div key={groupKey}>
          <div style={{ fontSize: 'var(--text-caption)', fontWeight: 700, color: 'var(--color-text-secondary)', marginBottom: 6 }}>
            {t(`admin.employees.groups.${groupKey}`)}
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--space-3)' }}>
            {groupPermissions.map((permission) => (
              <label key={permission} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 'var(--text-body-sm)' }}>
                <input
                  type="checkbox"
                  checked={selected.has(permission)}
                  onChange={(e) => toggle(permission, e.target.checked)}
                />
                <span>{t(`admin.employees.permissions.${permission}`)}</span>
              </label>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
