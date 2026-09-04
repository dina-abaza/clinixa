import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  getBackupHistory,
  restoreBackup,
  runBackup,
  getGoogleDriveSettings,
  updateGoogleDriveSettings,
  deleteGoogleDriveSettings,
} from '../../lib/api/backup';
import { useAuthStore } from '../../lib/store/authStore';
import { hasPermission } from '../../lib/permissions';

/** تبويب النسخ الاحتياطي مع Google Drive Integration */
export function BackupTab() {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const permissions = useAuthStore((s) => s.employee?.permissions);
  const canEdit = hasPermission(permissions, 'admin.edit');

  // ─── Backup State ──────────────────────────────────────────────────────────
  const [customPath, setCustomPath] = useState('');
  const [restoreBackupId, setRestoreBackupId] = useState('');
  const [confirmText, setConfirmText] = useState('');
  const [toast, setToast] = useState<string | null>(null);
  const [restoreNotice, setRestoreNotice] = useState(false);

  const handleBrowseFolder = async () => {
    if (window.clinixa?.selectFolder) {
      try {
        const selected = await window.clinixa.selectFolder(customPath || undefined);
        if (selected) {
          setCustomPath(selected);
        }
      } catch (err) {
        console.error('Failed to select folder:', err);
      }
    }
  };

  // ─── Google Drive Form State ───────────────────────────────────────────────
  const [gdScriptUrl, setGdScriptUrl] = useState('');
  const [gdSecretKey, setGdSecretKey] = useState('');
  const [gdPassword, setGdPassword] = useState('');
  const [gdEnabled, setGdEnabled] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showSecretKey, setShowSecretKey] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => setToast(null), 3200);
    return () => clearTimeout(timer);
  }, [toast]);

  // ─── Queries ───────────────────────────────────────────────────────────────
  const historyQuery = useQuery({ queryKey: ['backup-history'], queryFn: getBackupHistory });
  const items = historyQuery.data?.ok ? historyQuery.data.data.items : [];
  const isLoading = historyQuery.isLoading;
  const isEmpty = !isLoading && items.length === 0;
  const okBackups = items.filter((b) => b.status === 'ok');

  const driveQuery = useQuery({
    queryKey: ['google-drive-settings'],
    queryFn: getGoogleDriveSettings,
  });
  const driveSettings = driveQuery.data?.ok ? driveQuery.data.data : null;

  // Sync form from server on load
  useEffect(() => {
    if (!driveSettings) return;
    setGdScriptUrl(driveSettings.script_url ?? '');
    setGdEnabled(driveSettings.is_enabled);
  }, [driveSettings]);

  // ─── Mutations ─────────────────────────────────────────────────────────────
  const runMutation = useMutation({
    mutationFn: () =>
      runBackup({
        destination: 'local_device',
        kind: 'manual',
        target_path: customPath.trim() || undefined,
      }),
    onSuccess: (res) => {
      if (!res.ok) return;
      queryClient.invalidateQueries({ queryKey: ['backup-history'] });
      setToast(res.data.status === 'ok' ? t('admin.backup.toasts.backupOk') : t('admin.backup.toasts.backupFailed'));
    },
  });

  const restoreMutation = useMutation({
    mutationFn: () => restoreBackup({ confirmation_text: confirmText, backup_id: restoreBackupId || undefined }),
    onSuccess: (res) => {
      if (res.ok) setRestoreNotice(true);
    },
  });

  const saveDriveMutation = useMutation({
    mutationFn: () =>
      updateGoogleDriveSettings({
        script_url: gdScriptUrl.trim() || null,
        secret_key: gdSecretKey.trim() || undefined,
        backup_password: gdPassword.trim() || undefined,
        is_enabled: gdEnabled,
      }),
    onSuccess: (res) => {
      if (!res.ok) return;
      queryClient.invalidateQueries({ queryKey: ['google-drive-settings'] });
      setGdSecretKey('');
      setGdPassword('');
      setToast(t('admin.backup.toasts.driveSettingsSaved'));
    },
  });

  const deleteDriveMutation = useMutation({
    mutationFn: deleteGoogleDriveSettings,
    onSuccess: (res) => {
      if (!res.ok) return;
      queryClient.invalidateQueries({ queryKey: ['google-drive-settings'] });
      setGdScriptUrl('');
      setGdSecretKey('');
      setGdPassword('');
      setGdEnabled(false);
      setShowDeleteConfirm(false);
      setToast(t('admin.backup.toasts.driveSettingsDeleted'));
    },
  });

  const restoreError = restoreMutation.data?.ok === false ? restoreMutation.data.error.message : null;
  const runError = runMutation.data?.ok === false ? runMutation.data.error.message : null;
  const savedriveError = saveDriveMutation.data?.ok === false ? saveDriveMutation.data.error.message : null;

  return (
    <>
      {/* ─── Run Backup ───────────────────────────────────────────────────────── */}
      {canEdit && (
        <div className="detail-card glass" style={{ marginBottom: 'var(--space-5)' }}>
          <h2 style={{ marginTop: 0 }}>{t('admin.tabs.backup')}</h2>
          
          <div className="form-field" style={{ margin: 'var(--space-3) 0' }}>
            <label style={{ display: 'block', marginBottom: 'var(--space-2)' }}>{t('admin.backup.customPathLabel')}</label>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: 'var(--space-3)',
                padding: 'var(--space-3) var(--space-4)',
                background: 'var(--color-bg-secondary, rgba(0,0,0,0.03))',
                border: '1px solid var(--color-border)',
                borderRadius: 'var(--radius-md, 8px)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)', minWidth: 0, flex: 1 }}>
                <div
                  style={{
                    width: 38,
                    height: 38,
                    borderRadius: 'var(--radius-sm, 6px)',
                    background: customPath ? 'var(--color-primary-light, rgba(16, 185, 129, 0.12))' : 'var(--color-bg-muted, rgba(0,0,0,0.06))',
                    color: customPath ? 'var(--color-primary)' : 'var(--color-text-secondary)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                  }}
                >
                  <svg width={20} height={20} aria-hidden="true"><use href="#i-folder" /></svg>
                </div>
                <div style={{ minWidth: 0, flex: 1 }}>
                  <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)', marginBottom: 2 }}>
                    {customPath ? t('admin.backup.folderSelectedLocal') : t('admin.backup.folderDefault')}
                  </div>
                  <div
                    style={{
                      fontSize: 'var(--text-sm)',
                      fontWeight: 500,
                      direction: 'ltr',
                      textAlign: 'start',
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      color: customPath ? 'var(--color-text-primary)' : 'var(--color-text-secondary)',
                    }}
                    title={customPath || 'data/backups'}
                  >
                    {customPath || 'data/backups (الافتراضي)'}
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', gap: 'var(--space-2)', flexShrink: 0 }}>
                <button
                  type="button"
                  id="bk-browse-folder-btn"
                  className="btn btn-secondary btn-inline"
                  onClick={handleBrowseFolder}
                  style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}
                >
                  <svg width={16} height={16} aria-hidden="true"><use href="#i-folder" /></svg>
                  <span>{customPath ? t('admin.backup.changeFolder') : t('admin.backup.chooseFolder')}</span>
                </button>
                {customPath && (
                  <button
                    type="button"
                    className="btn btn-secondary btn-inline"
                    onClick={() => setCustomPath('')}
                    title={t('admin.backup.resetDefaultPath')}
                  >
                    <svg width={16} height={16} aria-hidden="true"><use href="#i-x" /></svg>
                  </button>
                )}
              </div>
            </div>
          </div>

          <div className={`form-error${runError ? ' on' : ''}`} role="alert">
            <svg width={18} height={18} aria-hidden="true"><use href="#i-alert-circle" /></svg>
            <span>{runError}</span>
          </div>

          <div style={{ display: 'flex', gap: 'var(--space-2)', flexWrap: 'wrap', marginTop: 'var(--space-4)' }}>
            <button
              type="button"
              id="bk-run-now-btn"
              className={`btn btn-primary btn-inline${runMutation.isPending ? ' loading' : ''}`}
              disabled={runMutation.isPending}
              onClick={() => runMutation.mutate()}
            >
              <svg className="spinner" width={18} height={18} aria-hidden="true"><use href="#i-loader" /></svg>
              <svg width={18} height={18} aria-hidden="true"><use href="#i-database" /></svg>
              <span>{t('admin.backup.runNow')}</span>
            </button>
          </div>
        </div>
      )}

      {/* ─── Google Drive Settings ──────────────────────────────────────────────── */}
      {canEdit && (
        <div className="detail-card glass" style={{ marginBottom: 'var(--space-5)' }}>
          {/* Header */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)', marginBottom: 'var(--space-2)' }}>
            <svg width={24} height={24} viewBox="0 0 24 24" fill="none" aria-hidden="true" style={{ flexShrink: 0, color: '#4285F4' }}>
              <path d="M6.28 14.97L2 22h8.57l4.28-7.03H6.28z" fill="#0066DA"/>
              <path d="M14.85 14.97H6.28L10.57 8l4.28 6.97z" fill="#00AC47"/>
              <path d="M14.85 14.97L10.57 8l4.28-6.97L22 14.97h-7.15z" fill="#EA4335"/>
              <path d="M22 14.97H14.85l-4.28 7.03H22v-7.03z" fill="#00832D" opacity=".8"/>
            </svg>
            <div>
              <h2 style={{ margin: 0 }}>{t('admin.backup.googleDrive.sectionTitle')}</h2>
              <p style={{ margin: '4px 0 0', fontSize: 'var(--text-sm)', color: 'var(--color-text-secondary)' }}>
                {t('admin.backup.googleDrive.sectionHint')}
              </p>
            </div>
            {/* Status Badge */}
            <span
              className={`badge ${driveSettings?.is_enabled ? 'badge-success' : 'badge-neutral'}`}
              style={{ marginInlineStart: 'auto', flexShrink: 0 }}
            >
              {driveSettings?.is_enabled
                ? t('admin.backup.googleDrive.statusEnabled')
                : t('admin.backup.googleDrive.statusDisabled')}
            </span>
          </div>

          {/* Stored keys status chips */}
          {driveSettings && (
            <div style={{ display: 'flex', gap: 'var(--space-2)', flexWrap: 'wrap', marginBottom: 'var(--space-4)' }}>
              <span className={`badge ${driveSettings.has_secret_key ? 'badge-success' : 'badge-neutral'}`}>
                <svg width={12} height={12} aria-hidden="true" style={{ marginInlineEnd: 4 }}>
                  <use href={driveSettings.has_secret_key ? '#i-check-circle' : '#i-alert-circle'} />
                </svg>
                {driveSettings.has_secret_key
                  ? t('admin.backup.googleDrive.hasKey')
                  : t('admin.backup.googleDrive.noKey')}
              </span>
              <span className={`badge ${driveSettings.has_backup_password ? 'badge-success' : 'badge-neutral'}`}>
                <svg width={12} height={12} aria-hidden="true" style={{ marginInlineEnd: 4 }}>
                  <use href={driveSettings.has_backup_password ? '#i-check-circle' : '#i-alert-circle'} />
                </svg>
                {driveSettings.has_backup_password
                  ? t('admin.backup.googleDrive.hasPassword')
                  : t('admin.backup.googleDrive.noPassword')}
              </span>
              {driveSettings.updated_at && (
                <span className="badge badge-neutral" style={{ marginInlineStart: 'auto' }}>
                  {t('admin.backup.googleDrive.updatedAt')}: {driveSettings.updated_at.slice(0, 16).replace('T', ' ')}
                </span>
              )}
            </div>
          )}

          {/* Form Fields */}
          <div className="form-grid">
            {/* Script URL */}
            <div className="form-field" style={{ gridColumn: '1 / -1' }}>
              <label htmlFor="gd-script-url">{t('admin.backup.googleDrive.scriptUrlLabel')}</label>
              <div className="input-wrap">
                <svg width={18} height={18} aria-hidden="true"><use href="#i-link" /></svg>
                <input
                  id="gd-script-url"
                  type="url"
                  placeholder={t('admin.backup.googleDrive.scriptUrlPlaceholder')}
                  value={gdScriptUrl}
                  onChange={(e) => setGdScriptUrl(e.target.value)}
                  dir="ltr"
                />
              </div>
            </div>

            {/* Secret Key */}
            <div className="form-field">
              <label htmlFor="gd-secret-key">{t('admin.backup.googleDrive.secretKeyLabel')}</label>
              <div className="input-wrap">
                <svg width={18} height={18} aria-hidden="true"><use href="#i-key" /></svg>
                <input
                  id="gd-secret-key"
                  type={showSecretKey ? 'text' : 'password'}
                  placeholder={
                    driveSettings?.has_secret_key
                      ? t('admin.backup.googleDrive.secretKeyHint')
                      : t('admin.backup.googleDrive.secretKeyPlaceholder')
                  }
                  value={gdSecretKey}
                  onChange={(e) => setGdSecretKey(e.target.value)}
                  dir="ltr"
                  autoComplete="new-password"
                />
                <button
                  type="button"
                  className="input-action"
                  aria-label={showSecretKey ? 'إخفاء' : 'إظهار'}
                  onClick={() => setShowSecretKey((v) => !v)}
                  style={{ position: 'absolute', insetInlineEnd: 'var(--space-3)', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-text-secondary)' }}
                >
                  <svg width={16} height={16} aria-hidden="true"><use href={showSecretKey ? '#i-eye-off' : '#i-eye'} /></svg>
                </button>
              </div>
            </div>

            {/* Backup Password */}
            <div className="form-field">
              <label htmlFor="gd-password">{t('admin.backup.googleDrive.backupPasswordLabel')}</label>
              <div className="input-wrap">
                <svg width={18} height={18} aria-hidden="true"><use href="#i-lock" /></svg>
                <input
                  id="gd-password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder={
                    driveSettings?.has_backup_password
                      ? t('admin.backup.googleDrive.backupPasswordHint')
                      : t('admin.backup.googleDrive.backupPasswordPlaceholder')
                  }
                  value={gdPassword}
                  onChange={(e) => setGdPassword(e.target.value)}
                  dir="ltr"
                  autoComplete="new-password"
                />
                <button
                  type="button"
                  className="input-action"
                  aria-label={showPassword ? 'إخفاء' : 'إظهار'}
                  onClick={() => setShowPassword((v) => !v)}
                  style={{ position: 'absolute', insetInlineEnd: 'var(--space-3)', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-text-secondary)' }}
                >
                  <svg width={16} height={16} aria-hidden="true"><use href={showPassword ? '#i-eye-off' : '#i-eye'} /></svg>
                </button>
              </div>
            </div>
          </div>

          {/* Enable Toggle */}
          <label
            htmlFor="gd-enabled"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 'var(--space-3)',
              cursor: 'pointer',
              padding: 'var(--space-3) 0',
              marginTop: 'var(--space-2)',
            }}
          >
            <span
              role="switch"
              aria-checked={gdEnabled}
              style={{
                position: 'relative',
                display: 'inline-block',
                width: 44,
                height: 24,
                borderRadius: 12,
                background: gdEnabled ? 'var(--color-primary)' : 'var(--color-border)',
                transition: 'background 0.2s',
                flexShrink: 0,
              }}
            >
              <input
                id="gd-enabled"
                type="checkbox"
                checked={gdEnabled}
                onChange={(e) => setGdEnabled(e.target.checked)}
                style={{ position: 'absolute', opacity: 0, width: 0, height: 0 }}
              />
              <span
                style={{
                  position: 'absolute',
                  top: 2,
                  insetInlineStart: gdEnabled ? 22 : 2,
                  width: 20,
                  height: 20,
                  borderRadius: '50%',
                  background: '#fff',
                  boxShadow: '0 1px 3px rgba(0,0,0,.2)',
                  transition: 'inset-inline-start 0.2s',
                }}
              />
            </span>
            <span style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-secondary)' }}>
              {t('admin.backup.googleDrive.enabledLabel')}
            </span>
          </label>

          {/* Error */}
          <div className={`form-error${savedriveError ? ' on' : ''}`} role="alert">
            <svg width={18} height={18} aria-hidden="true"><use href="#i-alert-circle" /></svg>
            <span>{savedriveError}</span>
          </div>

          {/* Actions */}
          <div style={{ display: 'flex', gap: 'var(--space-2)', flexWrap: 'wrap', marginTop: 'var(--space-4)' }}>
            <button
              type="button"
              id="gd-save-btn"
              className={`btn btn-primary btn-inline${saveDriveMutation.isPending ? ' loading' : ''}`}
              disabled={saveDriveMutation.isPending}
              onClick={() => saveDriveMutation.mutate()}
            >
              <svg className="spinner" width={18} height={18} aria-hidden="true"><use href="#i-loader" /></svg>
              <svg width={18} height={18} aria-hidden="true"><use href="#i-cloud" /></svg>
              <span>{t('admin.backup.googleDrive.save')}</span>
            </button>

            {driveSettings && (driveSettings.script_url || driveSettings.has_secret_key || driveSettings.has_backup_password) && (
              <button
                type="button"
                id="gd-delete-btn"
                className="btn btn-secondary btn-inline"
                style={{ color: 'var(--color-status-error-text)' }}
                onClick={() => setShowDeleteConfirm(true)}
              >
                <svg width={18} height={18} aria-hidden="true"><use href="#i-trash" /></svg>
                <span>{t('admin.backup.googleDrive.delete')}</span>
              </button>
            )}
          </div>
        </div>
      )}

      {/* ─── Backup History ──────────────────────────────────────────────────────── */}
      <div className="table-card glass" style={{ marginBottom: 'var(--space-5)' }}>
        <div className="card-head" style={{ padding: 'var(--space-5) var(--space-5) 0' }}>
          <h2 style={{ margin: '0 0 var(--space-4)' }}>{t('admin.backup.historyTitle')}</h2>
        </div>
        {isEmpty ? (
          <div className="empty-state">
            <div className="empty-icon" aria-hidden="true">
              <svg width={24} height={24}><use href="#i-database" /></svg>
            </div>
            <h2 className="empty-title">{t('admin.backup.emptyTitle')}</h2>
            <p className="empty-text">{t('admin.backup.emptyText')}</p>
          </div>
        ) : (
          <table className="data-table" aria-label={t('admin.backup.historyTitle')}>
            <thead>
              <tr>
                <th scope="col">{t('admin.backup.columns.date')}</th>
                <th scope="col">{t('admin.backup.columns.time')}</th>
                <th scope="col" className="c-status">{t('admin.backup.columns.status')}</th>
                <th scope="col">{t('admin.backup.columns.reason')}</th>
                <th scope="col">{t('admin.backup.columns.size')}</th>
                <th scope="col">{t('admin.backup.columns.kind')}</th>
                <th scope="col">{t('admin.backup.columns.destination')}</th>
              </tr>
            </thead>
            <tbody>
              {isLoading
                ? Array.from({ length: 3 }).map((_, i) => (
                    <tr key={i}>
                      <td colSpan={7}><span className="skel" style={{ width: '90%' }} /></td>
                    </tr>
                  ))
                : items.map((record) => (
                    <tr key={record.id}>
                      <td className="num">{record.date}</td>
                      <td className="num">{record.time}</td>
                      <td className="c-status">
                        {record.status === 'ok' ? (
                          <span className="badge badge-success">{t('admin.backup.statusOk')}</span>
                        ) : (
                          <span className="badge badge-error">{t('admin.backup.statusFail')}</span>
                        )}
                      </td>
                      <td>{record.fail_reason ? t(`admin.backup.failReasons.${record.fail_reason}`) : '—'}</td>
                      <td className="num">{record.size_mb !== null ? `${record.size_mb} MB` : '—'}</td>
                      <td>{record.kind === 'manual' ? t('admin.backup.kindManual') : t('admin.backup.kindAuto')}</td>
                      <td>{t(`admin.backup.destinations.${record.destination}`)}</td>
                    </tr>
                  ))}
            </tbody>
          </table>
        )}
      </div>

      {/* ─── Restore Section ─────────────────────────────────────────────────────── */}
      {canEdit && (
      <div className="detail-card glass">
        <h2 style={{ marginTop: 0 }}>{t('admin.backup.restoreSection')}</h2>
        <p className="modal-sub" style={{ margin: '0 0 var(--space-4)' }}>{t('admin.backup.restoreHint')}</p>

        {restoreNotice ? (
          <p className="form-ok on" role="status">
            <svg width={18} height={18} aria-hidden="true"><use href="#i-check-circle" /></svg>
            <span>{t('admin.backup.restoringNotice')}</span>
          </p>
        ) : (
          <>
            <div className="form-grid">
              <div className="form-field">
                <label htmlFor="bk-restore-select">{t('admin.backup.restoreSelectLabel')}</label>
                <div className="input-wrap no-icon">
                  <select id="bk-restore-select" value={restoreBackupId} onChange={(e) => setRestoreBackupId(e.target.value)}>
                    <option value="">{t('admin.backup.restoreLatestOk')}</option>
                    {okBackups.map((b) => (
                      <option key={b.id} value={b.id}>
                        {b.date} {b.time} — {t(`admin.backup.destinations.${b.destination}`)}
                      </option>
                    ))}
                  </select>
                  <span className="chev"><svg width={16} height={16} aria-hidden="true"><use href="#i-chevron-down" /></svg></span>
                </div>
              </div>
              <div className="form-field">
                <label htmlFor="bk-confirm">{t('admin.backup.confirmLabel')}</label>
                <div className="input-wrap no-icon">
                  <input
                    id="bk-confirm"
                    type="text"
                    placeholder={t('admin.backup.confirmPlaceholder')}
                    value={confirmText}
                    onChange={(e) => setConfirmText(e.target.value)}
                  />
                </div>
              </div>
            </div>

            <div className={`form-error${restoreError ? ' on' : ''}`} role="alert">
              <svg width={18} height={18} aria-hidden="true"><use href="#i-alert-circle" /></svg>
              <span>{restoreError}</span>
            </div>

            <div style={{ marginTop: 'var(--space-4)' }}>
              <button
                type="button"
                className={`btn btn-primary btn-inline${restoreMutation.isPending ? ' loading' : ''}`}
                disabled={confirmText.trim().length === 0 || restoreMutation.isPending}
                style={{ background: 'var(--color-status-error-text)' }}
                onClick={() => restoreMutation.mutate()}
              >
                <svg className="spinner" width={18} height={18} aria-hidden="true"><use href="#i-loader" /></svg>
                <span>{t('admin.backup.restoreSubmit')}</span>
              </button>
            </div>
          </>
        )}
      </div>
      )}

      {/* ─── Toast ───────────────────────────────────────────────────────────────── */}
      <div className={`ok-toast${toast ? ' on' : ''}`} role="status">
        <svg width={18} height={18} aria-hidden="true"><use href="#i-check-circle" /></svg>
        <span>{toast}</span>
      </div>

      {/* ─── Delete Confirm Modal ─────────────────────────────────────────────────── */}
      {showDeleteConfirm && (
        <div
          className="modal-overlay"
          role="dialog"
          aria-modal="true"
          aria-labelledby="gd-delete-confirm-title"
          onClick={(e) => { if (e.target === e.currentTarget) setShowDeleteConfirm(false); }}
        >
          <div className="modal-box" style={{ maxWidth: 420 }}>
            <div className="modal-head">
              <h2 id="gd-delete-confirm-title" className="modal-title">
                <svg width={20} height={20} aria-hidden="true" style={{ color: 'var(--color-status-error-text)' }}>
                  <use href="#i-alert-circle" />
                </svg>
                {t('admin.backup.googleDrive.deleteConfirmTitle')}
              </h2>
              <button
                type="button"
                className="modal-close"
                aria-label="إغلاق"
                onClick={() => setShowDeleteConfirm(false)}
              >
                <svg width={20} height={20} aria-hidden="true"><use href="#i-x" /></svg>
              </button>
            </div>
            <p className="modal-sub">{t('admin.backup.googleDrive.deleteConfirmMsg')}</p>
            <div className="modal-actions">
              <button
                type="button"
                className="btn btn-secondary btn-inline"
                onClick={() => setShowDeleteConfirm(false)}
              >
                {t('common.cancel')}
              </button>
              <button
                type="button"
                id="gd-delete-confirm-btn"
                className={`btn btn-primary btn-inline${deleteDriveMutation.isPending ? ' loading' : ''}`}
                style={{ background: 'var(--color-status-error-text)' }}
                disabled={deleteDriveMutation.isPending}
                onClick={() => deleteDriveMutation.mutate()}
              >
                <svg className="spinner" width={18} height={18} aria-hidden="true"><use href="#i-loader" /></svg>
                <span>{t('admin.backup.googleDrive.deleteConfirmBtn')}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}