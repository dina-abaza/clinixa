import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { EmployeesTab } from './EmployeesTab';
import { BranchesTab } from './BranchesTab';
import { SettingsTab } from './SettingsTab';
import { BackupTab } from './BackupTab';

type Tab = 'employees' | 'branches' | 'settings' | 'backup';

/** الإدارة والإعدادات — تبويبات الموظفين/الفروع/الإعدادات والأسعار/النسخ الاحتياطي، بنفس نمط تبويبات PaymentsPage. */
export function AdminPage() {
  const { t } = useTranslation();
  const [tab, setTab] = useState<Tab>('employees');

  return (
    <>
      <div className="page-head">
        <div>
          <h1 className="page-title">{t('shell.nav.admin')}</h1>
        </div>
      </div>

      <div className="tabs" role="tablist">
        <button type="button" className="tab" role="tab" aria-selected={tab === 'employees'} onClick={() => setTab('employees')}>
          <svg width={17} height={17} aria-hidden="true"><use href="#i-users" /></svg>
          <span>{t('admin.tabs.employees')}</span>
        </button>
        <button type="button" className="tab" role="tab" aria-selected={tab === 'branches'} onClick={() => setTab('branches')}>
          <svg width={17} height={17} aria-hidden="true"><use href="#i-building" /></svg>
          <span>{t('admin.tabs.branches')}</span>
        </button>
        <button type="button" className="tab" role="tab" aria-selected={tab === 'settings'} onClick={() => setTab('settings')}>
          <svg width={17} height={17} aria-hidden="true"><use href="#i-settings" /></svg>
          <span>{t('admin.tabs.settings')}</span>
        </button>
        <button type="button" className="tab" role="tab" aria-selected={tab === 'backup'} onClick={() => setTab('backup')}>
          <svg width={17} height={17} aria-hidden="true"><use href="#i-database" /></svg>
          <span>{t('admin.tabs.backup')}</span>
        </button>
      </div>

      {tab === 'employees' && <EmployeesTab />}
      {tab === 'branches' && <BranchesTab />}
      {tab === 'settings' && <SettingsTab />}
      {tab === 'backup' && <BackupTab />}
    </>
  );
}
