import { useEffect, useState, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  getBackupHistory,
  restoreBackup,
  runBackup,
  getGoogleDriveSettings,
  updateGoogleDriveSettings,
  deleteGoogleDriveSettings,
  listGoogleDriveFiles,
} from '../../lib/api/backup';
import type { GoogleDriveFileInfo } from '../../lib/api/backup';
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
  const [runBackupPassword, setRunBackupPassword] = useState('');
  const [showRunBackupPassword, setShowRunBackupPassword] = useState(false);
  const [restoreSourceMode, setRestoreSourceMode] = useState<'history' | 'custom_path' | 'google_drive'>('history');
  const [restoreBackupId, setRestoreBackupId] = useState('');
  const [restoreCustomPath, setRestoreCustomPath] = useState('');
  const [restorePassword, setRestorePassword] = useState('');
  const [showRestorePassword, setShowRestorePassword] = useState(false);
  const [confirmText, setConfirmText] = useState('');
  const [toast, setToast] = useState<string | null>(null);
  const [restoreNotice, setRestoreNotice] = useState(false);
  const restoreFileInputRef = useRef<HTMLInputElement>(null);
  const [driveFileId, setDriveFileId] = useState('');

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

  const handleBrowseRestoreFile = async () => {
    if (window.clinixa?.selectFile) {
      try {
        const selected = await window.clinixa.selectFile(restoreCustomPath || undefined);
        if (selected) {
          setRestoreCustomPath(selected);
          return;
        }
      } catch (err) {
        console.error('Failed to select restore file via Electron:', err);
      }
    }
    // احتياطي إذا لم يكن Electron محمّلاً بعد
    restoreFileInputRef.current?.click();
  };

  const handleRestoreFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const filePath =
        (window.clinixa?.getPathForFile ? window.clinixa.getPathForFile(file) : null) ||
        (file as any).path ||
        file.name;
      setRestoreCustomPath(filePath);
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
  const [showDriveGuide, setShowDriveGuide] = useState(false);
  const [codeCopied, setCodeCopied] = useState(false);

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

  // Drive files query — only fetch when user selects google_drive restore mode
  const driveFilesQuery = useQuery({
    queryKey: ['google-drive-files'],
    queryFn: listGoogleDriveFiles,
    enabled: restoreSourceMode === 'google_drive',
    staleTime: 30_000,
  });
  const driveFiles: GoogleDriveFileInfo[] = driveFilesQuery.data?.ok ? driveFilesQuery.data.data.files : [];
  const driveFilesError = driveFilesQuery.data?.ok === false ? driveFilesQuery.data.error.message : null;

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
        backup_password: runBackupPassword.trim() || undefined,
      }),
    onSuccess: (res) => {
      if (!res.ok) return;
      queryClient.invalidateQueries({ queryKey: ['backup-history'] });
      setToast(res.data.status === 'ok' ? t('admin.backup.toasts.backupOk') : t('admin.backup.toasts.backupFailed'));
    },
  });

  const runDriveMutation = useMutation({
    mutationFn: () =>
      runBackup({
        destination: 'google_drive',
        kind: 'manual',
      }),
    onSuccess: (res) => {
      if (!res.ok) return;
      queryClient.invalidateQueries({ queryKey: ['backup-history'] });
      queryClient.invalidateQueries({ queryKey: ['google-drive-files'] });
      setToast(
        res.data.status === 'ok'
          ? 'تم إنشاء النسخة الاحتياطية ورفعها إلى Google Drive بنجاح'
          : 'فشل رفع النسخة إلى Google Drive — يرجى مراجعة سجل النسخ'
      );
    },
  });

  const restoreMutation = useMutation({
    mutationFn: () =>
      restoreBackup({
        confirmation_text: confirmText,
        source_mode: restoreSourceMode,
        backup_id: restoreSourceMode === 'history' ? (restoreBackupId || undefined) : undefined,
        custom_path: restoreSourceMode === 'custom_path' ? (restoreCustomPath.trim() || undefined) : undefined,
        backup_password: restorePassword.trim() || undefined,
        google_drive_file_id: restoreSourceMode === 'google_drive' ? (driveFileId || undefined) : undefined,
      }),
    onSuccess: (res) => {
      if (res.ok) {
        setRestoreNotice(true);
        setToast(t('admin.backup.toasts.restoreOk'));
        setTimeout(() => {
          window.location.reload();
        }, 2200);
      }
    },
  });

  const [driveValidationError, setDriveValidationError] = useState<string | null>(null);

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
      setDriveValidationError(null);
      setToast(t('admin.backup.toasts.driveSettingsSaved'));
    },
  });

  const handleSaveDriveSettings = () => {
    setDriveValidationError(null);
    const url = gdScriptUrl.trim();
    if (!url) {
      setDriveValidationError('يرجى إدخال رابط Google Apps Script أولاً');
      return;
    }
    if (!url.startsWith('https://script.google.com/')) {
      setDriveValidationError('الرابط يجب أن يبدأ بـ https://script.google.com/');
      return;
    }
    if (!driveSettings?.has_secret_key && !gdSecretKey.trim()) {
      setDriveValidationError('يرجى إدخال المفتاح السري (Secret Key) لحماية وتأمين الاتصال');
      return;
    }
    saveDriveMutation.mutate();
  };

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
      setDriveValidationError(null);
      setToast(t('admin.backup.toasts.driveSettingsDeleted'));
    },
  });

  const restoreError = restoreMutation.data?.ok === false ? restoreMutation.data.error.message : null;
  const runError = runMutation.data?.ok === false ? runMutation.data.error.message : null;
  const runDriveError = runDriveMutation.data?.ok === false ? runDriveMutation.data.error.message : null;
  const savedriveError = driveValidationError || (saveDriveMutation.data?.ok === false ? saveDriveMutation.data.error.message : null);

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

          {/* كلمة سر تشفير النسخة الاحتياطية */}
          <div className="form-field" style={{ maxWidth: 450, margin: 'var(--space-3) 0' }}>
            <label htmlFor="bk-run-password">{t('admin.backup.runPasswordLabel')}</label>
            <div className="input-wrap">
              <svg width={18} height={18} aria-hidden="true"><use href="#i-lock" /></svg>
              <input
                id="bk-run-password"
                type={showRunBackupPassword ? 'text' : 'password'}
                placeholder={t('admin.backup.runPasswordPlaceholder')}
                value={runBackupPassword}
                onChange={(e) => setRunBackupPassword(e.target.value)}
                dir="ltr"
                autoComplete="new-password"
              />
              <button
                type="button"
                className="input-action"
                aria-label={showRunBackupPassword ? 'إخفاء' : 'إظهار'}
                onClick={() => setShowRunBackupPassword((v) => !v)}
                style={{ position: 'absolute', insetInlineEnd: 'var(--space-3)', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-text-secondary)' }}
              >
                <svg width={16} height={16} aria-hidden="true"><use href={showRunBackupPassword ? '#i-eye-off' : '#i-eye'} /></svg>
              </button>
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
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)', marginBottom: 'var(--space-2)' }}>
            <svg width={24} height={24} viewBox="0 0 24 24" fill="none" aria-hidden="true" style={{ flexShrink: 0, color: '#4285F4' }}>
              <path d="M6.28 14.97L2 22h8.57l4.28-7.03H6.28z" fill="#0066DA"/>
              <path d="M14.85 14.97H6.28L10.57 8l4.28 6.97z" fill="#00AC47"/>
              <path d="M14.85 14.97L10.57 8l4.28-6.97L22 14.97h-7.15z" fill="#EA4335"/>
              <path d="M22 14.97H14.85l-4.28 7.03H22v-7.03z" fill="#00832D" opacity=".8"/>
            </svg>
            <div style={{ flex: 1 }}>
              <h2 style={{ margin: 0 }}>{t('admin.backup.googleDrive.sectionTitle')}</h2>
              <p style={{ margin: '4px 0 0', fontSize: 'var(--text-sm)', color: 'var(--color-text-secondary)' }}>
                {t('admin.backup.googleDrive.sectionHint')}
              </p>
            </div>
            {/* Status Badge */}
            <span
              className={`badge ${driveSettings?.is_enabled ? 'badge-success' : 'badge-neutral'}`}
              style={{ flexShrink: 0 }}
            >
              {driveSettings?.is_enabled
                ? t('admin.backup.googleDrive.statusEnabled')
                : t('admin.backup.googleDrive.statusDisabled')}
            </span>
          </div>

          {/* زرار دليل الإعداد */}
          <div style={{ marginBottom: 'var(--space-4)' }}>
            <button
              type="button"
              id="gd-setup-guide-btn"
              className="btn btn-secondary btn-inline"
              onClick={() => setShowDriveGuide(true)}
            >
              <svg width={16} height={16} aria-hidden="true"><use href="#i-info" /></svg>
              <span>{t('admin.backup.googleDrive.setupGuideBtn')}</span>
            </button>
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

          {/* Enable Toggle Card */}
          <div
            id="gd-enable-toggle-card"
            role="button"
            tabIndex={0}
            onClick={() => setGdEnabled((prev) => !prev)}
            onKeyDown={(e) => {
              if (e.key === ' ' || e.key === 'Enter') {
                e.preventDefault();
                setGdEnabled((prev) => !prev);
              }
            }}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: 'var(--space-3)',
              cursor: 'pointer',
              padding: 'var(--space-3) var(--space-4)',
              marginTop: 'var(--space-3)',
              marginBottom: 'var(--space-2)',
              borderRadius: 'var(--radius-md, 8px)',
              border: gdEnabled ? '1.5px solid #10b981' : '1.5px solid var(--color-border)',
              background: gdEnabled
                ? 'rgba(16, 185, 129, 0.08)'
                : 'var(--color-bg-secondary, rgba(0,0,0,0.02))',
              transition: 'all 0.2s ease',
              userSelect: 'none',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
              <div
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: '50%',
                  background: gdEnabled ? '#10b981' : 'var(--color-bg-muted, rgba(0,0,0,0.08))',
                  color: gdEnabled ? '#ffffff' : 'var(--color-text-secondary)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  transition: 'all 0.2s ease',
                  flexShrink: 0,
                }}
              >
                {gdEnabled ? (
                  <svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                ) : (
                  <svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                    <line x1="18" y1="6" x2="6" y2="18" />
                    <line x1="6" y1="6" x2="18" y2="18" />
                  </svg>
                )}
              </div>

              <div>
                <div style={{ fontSize: 'var(--text-sm)', fontWeight: 600, color: gdEnabled ? '#047857' : 'var(--color-text-primary)' }}>
                  {t('admin.backup.googleDrive.enabledLabel')}
                </div>
                <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)', marginTop: 2 }}>
                  {gdEnabled
                    ? 'سيتم تفعيل المزامنة ورفع النسخ الاحتياطية تلقائياً إلى السحابة'
                    : 'النسخ السحابي متوقف حالياً — انقر هنا للتفعيل'}
                </div>
              </div>
            </div>

            {/* Visual Switch Button */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
              <span
                style={{
                  display: 'inline-block',
                  padding: '2px 8px',
                  borderRadius: 9999,
                  fontSize: 'var(--text-xs)',
                  fontWeight: 600,
                  background: gdEnabled ? '#10b981' : '#9ca3af',
                  color: '#ffffff',
                  transition: 'all 0.2s ease',
                }}
              >
                {gdEnabled ? 'مفعّل ✓' : 'معطّل ✕'}
              </span>

              <div
                role="switch"
                aria-checked={gdEnabled}
                style={{
                  position: 'relative',
                  width: 48,
                  height: 26,
                  borderRadius: 13,
                  background: gdEnabled ? '#10b981' : '#cbd5e1',
                  transition: 'background 0.2s ease',
                  flexShrink: 0,
                  padding: 3,
                  boxSizing: 'border-box',
                  direction: 'ltr',
                }}
              >
                <div
                  style={{
                    width: 20,
                    height: 20,
                    borderRadius: '50%',
                    background: '#ffffff',
                    boxShadow: '0 2px 4px rgba(0,0,0,0.25)',
                    transform: gdEnabled ? 'translateX(22px)' : 'translateX(0px)',
                    transition: 'transform 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                  }}
                />
              </div>
            </div>
          </div>

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
              onClick={handleSaveDriveSettings}
            >
              <svg className="spinner" width={18} height={18} aria-hidden="true"><use href="#i-loader" /></svg>
              <svg width={18} height={18} aria-hidden="true"><use href="#i-cloud" /></svg>
              <span>{t('admin.backup.googleDrive.save')}</span>
            </button>

            {/* زرار نسخ احتياطي مباشر لـ Google Drive */}
            {driveSettings && driveSettings.has_secret_key && driveSettings.script_url && (
              <button
                type="button"
                id="gd-backup-now-btn"
                className={`btn btn-secondary btn-inline${runDriveMutation.isPending ? ' loading' : ''}`}
                disabled={runDriveMutation.isPending}
                onClick={() => runDriveMutation.mutate()}
                style={{
                  background: 'rgba(16, 185, 129, 0.12)',
                  borderColor: '#10b981',
                  color: '#047857',
                  fontWeight: 600,
                }}
              >
                <svg className="spinner" width={18} height={18} aria-hidden="true"><use href="#i-loader" /></svg>
                <svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                  <path d="M4 14.899A7 7 0 1 1 15.71 8h1.79a4.5 4.5 0 0 1 2.5 8.242" />
                  <path d="M12 12v9" />
                  <path d="m16 16-4-4-4 4" />
                </svg>
                <span>إنشاء نسخة احتياطية على Google Drive الآن</span>
              </button>
            )}

            {driveSettings && (driveSettings.script_url || driveSettings.has_secret_key || driveSettings.has_backup_password) && (
              <button
                type="button"
                id="gd-delete-btn"
                className="btn btn-secondary btn-inline"
                style={{ color: 'var(--color-status-error-text)', marginInlineStart: 'auto' }}
                onClick={() => setShowDeleteConfirm(true)}
              >
                <svg width={18} height={18} aria-hidden="true"><use href="#i-trash" /></svg>
                <span>{t('admin.backup.googleDrive.delete')}</span>
              </button>
            )}
          </div>

          {runDriveError && (
            <div className="form-error on" role="alert" style={{ marginTop: 'var(--space-2)' }}>
              <svg width={18} height={18} aria-hidden="true"><use href="#i-alert-circle" /></svg>
              <span>{runDriveError}</span>
            </div>
          )}
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
            {/* اختيار مصدر الاستعادة */}
            <div className="form-field" style={{ marginBottom: 'var(--space-4)' }}>
              <label style={{ display: 'block', marginBottom: 'var(--space-2)' }}>
                {t('admin.backup.restoreSourceLabel')}
              </label>
              <div style={{ display: 'flex', gap: 'var(--space-3)', flexWrap: 'wrap' }}>
                <button
                  type="button"
                  className={`btn ${restoreSourceMode === 'history' ? 'btn-primary' : 'btn-secondary'} btn-sm`}
                  onClick={() => setRestoreSourceMode('history')}
                  style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}
                >
                  <svg width={16} height={16} aria-hidden="true"><use href="#i-clock" /></svg>
                  <span>{t('admin.backup.restoreSourceHistory')}</span>
                </button>
                <button
                  type="button"
                  className={`btn ${restoreSourceMode === 'custom_path' ? 'btn-primary' : 'btn-secondary'} btn-sm`}
                  onClick={() => setRestoreSourceMode('custom_path')}
                  style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}
                >
                  <svg width={16} height={16} aria-hidden="true"><use href="#i-folder" /></svg>
                  <span>{t('admin.backup.restoreSourceCustom')}</span>
                </button>
                <button
                  type="button"
                  className={`btn ${restoreSourceMode === 'google_drive' ? 'btn-primary' : 'btn-secondary'} btn-sm`}
                  onClick={() => setRestoreSourceMode('google_drive')}
                  style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}
                >
                  <svg width={16} height={16} aria-hidden="true"><use href="#i-cloud" /></svg>
                  <span>{t('admin.backup.restoreSourceGoogleDrive')}</span>
                </button>
              </div>
            </div>

            {/* الحقول بحسب المصدر المختار */}
            {restoreSourceMode === 'google_drive' ? (
              <div style={{ marginBottom: 'var(--space-4)' }}>
                {/* حالة التحميل */}
                {driveFilesQuery.isLoading && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)', padding: 'var(--space-4)', color: 'var(--color-text-secondary)' }}>
                    <svg className="spinner" width={18} height={18} aria-hidden="true" style={{ animation: 'spin 1s linear infinite' }}><use href="#i-loader" /></svg>
                    <span>{t('admin.backup.driveFilesLoading')}</span>
                  </div>
                )}

                {/* خطأ في جلب الملفات */}
                {driveFilesError && (
                  <div className="form-error on" role="alert" style={{ marginBottom: 'var(--space-3)' }}>
                    <svg width={18} height={18} aria-hidden="true"><use href="#i-alert-circle" /></svg>
                    <span>{driveFilesError}</span>
                  </div>
                )}

                {/* لا توجد ملفات */}
                {!driveFilesQuery.isLoading && !driveFilesError && driveFiles.length === 0 && (
                  <div style={{
                    padding: 'var(--space-4)',
                    background: 'var(--color-bg-secondary, rgba(0,0,0,0.03))',
                    borderRadius: 'var(--radius-md, 8px)',
                    border: '1px solid var(--color-border)',
                    textAlign: 'center',
                    color: 'var(--color-text-secondary)',
                  }}>
                    <svg width={24} height={24} aria-hidden="true" style={{ marginBottom: 'var(--space-2)', opacity: 0.5 }}><use href="#i-cloud" /></svg>
                    <p style={{ margin: 0, fontSize: 'var(--text-sm)' }}>{t('admin.backup.driveFilesEmpty')}</p>
                  </div>
                )}

                {/* قائمة الملفات */}
                {driveFiles.length > 0 && (
                  <div>
                    <label style={{ display: 'block', marginBottom: 'var(--space-2)', fontSize: 'var(--text-sm)', fontWeight: 500 }}>
                      {t('admin.backup.driveFilesSelectLabel')}
                    </label>
                    <div style={{
                      maxHeight: 220,
                      overflow: 'auto',
                      border: '1px solid var(--color-border)',
                      borderRadius: 'var(--radius-md, 8px)',
                    }}>
                      {driveFiles.map((f) => {
                        const isSelected = driveFileId === f.id;
                        const sizeKb = (f.size / 1024).toFixed(1);
                        const sizeMb = (f.size / (1024 * 1024)).toFixed(2);
                        const sizeStr = f.size >= 1024 * 1024 ? `${sizeMb} MB` : `${sizeKb} KB`;
                        const dateStr = f.created ? new Date(f.created).toLocaleString('ar-EG', { dateStyle: 'medium', timeStyle: 'short' }) : '—';

                        return (
                          <button
                            key={f.id}
                            type="button"
                            onClick={() => setDriveFileId(isSelected ? '' : f.id)}
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: 'var(--space-3)',
                              width: '100%',
                              padding: 'var(--space-3) var(--space-4)',
                              background: isSelected ? 'var(--color-primary-light, rgba(16, 185, 129, 0.08))' : 'transparent',
                              border: 'none',
                              borderBottom: '1px solid var(--color-border)',
                              cursor: 'pointer',
                              textAlign: 'start',
                              transition: 'background 0.15s',
                              color: 'inherit',
                              font: 'inherit',
                            }}
                          >
                            <div style={{
                              width: 22, height: 22, borderRadius: '50%',
                              border: `2px solid ${isSelected ? 'var(--color-primary)' : 'var(--color-border)'}`,
                              background: isSelected ? 'var(--color-primary)' : 'transparent',
                              display: 'flex', alignItems: 'center', justifyContent: 'center',
                              flexShrink: 0, transition: 'all 0.15s',
                            }}>
                              {isSelected && (
                                <svg width={12} height={12} viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth={3} strokeLinecap="round" strokeLinejoin="round">
                                  <polyline points="20 6 9 17 4 12" />
                                </svg>
                              )}
                            </div>
                            <div style={{ flex: 1, minWidth: 0 }}>
                              <div style={{
                                fontSize: 'var(--text-sm)', fontWeight: 500, direction: 'ltr', textAlign: 'start',
                                whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                              }}>
                                {f.name}
                              </div>
                              <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)', marginTop: 2 }}>
                                {dateStr} — {sizeStr}
                              </div>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                    <p style={{ margin: 'var(--space-2) 0 0', fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)' }}>
                      {driveFileId ? t('admin.backup.driveFileSelected') : t('admin.backup.driveFileSelectHint')}
                    </p>
                  </div>
                )}

                {/* كلمة سر فك التشفير */}
                <div className="form-field" style={{ maxWidth: 450, marginTop: 'var(--space-3)' }}>
                  <label htmlFor="bk-restore-drive-password">{t('admin.backup.restorePasswordLabel')}</label>
                  <div className="input-wrap">
                    <svg width={18} height={18} aria-hidden="true"><use href="#i-lock" /></svg>
                    <input
                      id="bk-restore-drive-password"
                      type={showRestorePassword ? 'text' : 'password'}
                      placeholder={t('admin.backup.restorePasswordPlaceholder')}
                      value={restorePassword}
                      onChange={(e) => setRestorePassword(e.target.value)}
                      dir="ltr"
                      autoComplete="new-password"
                    />
                    <button
                      type="button"
                      className="input-action"
                      aria-label={showRestorePassword ? 'إخفاء' : 'إظهار'}
                      onClick={() => setShowRestorePassword((v) => !v)}
                      style={{ position: 'absolute', insetInlineEnd: 'var(--space-3)', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-text-secondary)' }}
                    >
                      <svg width={16} height={16} aria-hidden="true"><use href={showRestorePassword ? '#i-eye-off' : '#i-eye'} /></svg>
                    </button>
                  </div>
                </div>
              </div>
            ) : restoreSourceMode === 'history' ? (
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
              </div>
            ) : (
              <div style={{ marginBottom: 'var(--space-4)' }}>
                <div className="form-field">
                  <label htmlFor="bk-custom-path-input" style={{ display: 'block', marginBottom: 'var(--space-2)' }}>
                    {t('admin.backup.customFileOrFolderLabel')}
                  </label>

                  {/* حقل ملف مخفي للاستدعاء */}
                  <input
                    ref={restoreFileInputRef}
                    type="file"
                    accept=".encrypted,.db,.json,*"
                    style={{ display: 'none' }}
                    onChange={handleRestoreFileInputChange}
                  />

                  <div className="input-wrap" style={{ position: 'relative' }}>
                    <svg width={18} height={18} aria-hidden="true"><use href="#i-file-text" /></svg>
                    <input
                      id="bk-custom-path-input"
                      type="text"
                      placeholder="مسار الملف على جهازك (مثال: D:\backups\clinixa.db.encrypted)"
                      value={restoreCustomPath}
                      onChange={(e) => setRestoreCustomPath(e.target.value)}
                      dir="ltr"
                      style={{ paddingInlineEnd: 155 }}
                    />
                    <div
                      style={{
                        position: 'absolute',
                        insetInlineEnd: 6,
                        top: '50%',
                        transform: 'translateY(-50%)',
                        display: 'flex',
                        gap: 4,
                      }}
                    >
                      {restoreCustomPath && (
                        <button
                          type="button"
                          className="btn btn-ghost btn-sm"
                          onClick={() => setRestoreCustomPath('')}
                          title={t('common.cancel')}
                          style={{ padding: '2px 6px' }}
                        >
                          <svg width={14} height={14} aria-hidden="true"><use href="#i-x" /></svg>
                        </button>
                      )}
                      <button
                        type="button"
                        id="bk-browse-restore-file-btn"
                        className="btn btn-secondary btn-sm"
                        onClick={handleBrowseRestoreFile}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 6,
                          padding: '4px 12px',
                          fontSize: 'var(--text-xs)',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        <svg width={14} height={14} aria-hidden="true"><use href="#i-folder" /></svg>
                        <span>{t('admin.backup.chooseRestoreFile')}</span>
                      </button>
                    </div>
                  </div>
                </div>

                {/* كلمة سر فك التشفير الاختيارية */}
                <div className="form-field" style={{ maxWidth: 450, marginTop: 'var(--space-3)' }}>
                  <label htmlFor="bk-restore-password">{t('admin.backup.restorePasswordLabel')}</label>
                  <div className="input-wrap">
                    <svg width={18} height={18} aria-hidden="true"><use href="#i-lock" /></svg>
                    <input
                      id="bk-restore-password"
                      type={showRestorePassword ? 'text' : 'password'}
                      placeholder={t('admin.backup.restorePasswordPlaceholder')}
                      value={restorePassword}
                      onChange={(e) => setRestorePassword(e.target.value)}
                      dir="ltr"
                      autoComplete="new-password"
                    />
                    <button
                      type="button"
                      className="input-action"
                      aria-label={showRestorePassword ? 'إخفاء' : 'إظهار'}
                      onClick={() => setShowRestorePassword((v) => !v)}
                      style={{ position: 'absolute', insetInlineEnd: 'var(--space-3)', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-text-secondary)' }}
                    >
                      <svg width={16} height={16} aria-hidden="true"><use href={showRestorePassword ? '#i-eye-off' : '#i-eye'} /></svg>
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* حقل تأكيد الاستعادة */}
            <div className="form-grid" style={{ marginTop: 'var(--space-3)' }}>
              <div className="form-field" style={{ maxWidth: 450 }}>
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
                disabled={
                  confirmText.trim().length === 0 ||
                  (restoreSourceMode === 'custom_path' && !restoreCustomPath.trim()) ||
                  restoreMutation.isPending
                }
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
          className="modal-overlay open"
          role="dialog"
          aria-modal="true"
          aria-labelledby="gd-delete-confirm-title"
          onClick={(e) => { if (e.target === e.currentTarget) setShowDeleteConfirm(false); }}
        >
          <div className="modal" style={{ maxWidth: 420 }}>
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

      {/* ─── Google Drive Setup Guide Modal ────────────────────────────────────── */}
      {showDriveGuide && (
        <div
          className="modal-overlay open"
          role="dialog"
          aria-modal="true"
          aria-labelledby="gd-guide-title"
          onClick={(e) => { if (e.target === e.currentTarget) setShowDriveGuide(false); }}
        >
          <div className="modal" style={{ maxWidth: 620, maxHeight: '85vh', overflow: 'auto' }}>
            <div className="modal-head">
              <h2 id="gd-guide-title" className="modal-title">
                <svg width={20} height={20} aria-hidden="true" style={{ color: '#4285F4' }}>
                  <use href="#i-help" />
                </svg>
                {t('admin.backup.googleDrive.guideTitle')}
              </h2>
              <button
                type="button"
                className="modal-close"
                aria-label="إغلاق"
                onClick={() => setShowDriveGuide(false)}
              >
                <svg width={20} height={20} aria-hidden="true"><use href="#i-x" /></svg>
              </button>
            </div>

            <div style={{ padding: 'var(--space-4) var(--space-5) var(--space-5)', lineHeight: 1.8 }}>
              {/* الخطوة 1 */}
              <div style={{ marginBottom: 'var(--space-5)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)', marginBottom: 'var(--space-2)' }}>
                  <span style={{
                    display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                    width: 28, height: 28, borderRadius: '50%',
                    background: 'var(--color-primary)', color: '#fff',
                    fontSize: 'var(--text-sm)', fontWeight: 700, flexShrink: 0,
                  }}>1</span>
                  <h3 style={{ margin: 0, fontSize: 'var(--text-base)' }}>{t('admin.backup.googleDrive.guideStep1Title')}</h3>
                </div>
                <p style={{ margin: 0, color: 'var(--color-text-secondary)', fontSize: 'var(--text-sm)', paddingInlineStart: 40 }}>
                  {t('admin.backup.googleDrive.guideStep1Desc')}
                </p>
              </div>

              {/* الخطوة 2 */}
              <div style={{ marginBottom: 'var(--space-5)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)', marginBottom: 'var(--space-2)' }}>
                  <span style={{
                    display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                    width: 28, height: 28, borderRadius: '50%',
                    background: 'var(--color-primary)', color: '#fff',
                    fontSize: 'var(--text-sm)', fontWeight: 700, flexShrink: 0,
                  }}>2</span>
                  <h3 style={{ margin: 0, fontSize: 'var(--text-base)' }}>{t('admin.backup.googleDrive.guideStep2Title')}</h3>
                </div>
                <p style={{ margin: 0, color: 'var(--color-text-secondary)', fontSize: 'var(--text-sm)', paddingInlineStart: 40 }}>
                  {t('admin.backup.googleDrive.guideStep2Desc')}
                </p>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginInlineStart: 40, marginTop: 'var(--space-2)', marginBottom: 'var(--space-2)' }}>
                  <span style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)', fontWeight: 500 }}>
                    كود Google Apps Script المحدث (يدعم النسخ والاسترجاع):
                  </span>
                  <button
                    type="button"
                    id="gd-copy-script-code-btn"
                    className={`btn btn-sm ${codeCopied ? 'btn-primary' : 'btn-secondary'}`}
                    onClick={() => {
                      const codeToCopy = `var SECRET = "YOUR_SECRET_KEY_HERE";

function doPost(e) {
  try {
    if (!e || !e.postData || !e.postData.contents) {
      return jsonResponse({ ok: false, error: "No post data received" });
    }
    var data = JSON.parse(e.postData.contents);
    if (data.secret !== SECRET) {
      return jsonResponse({ ok: false, error: "Invalid secret key (unauthorized)" });
    }
    var folder = getOrCreateFolder();
    var blob = Utilities.newBlob(
      Utilities.base64Decode(data.file),
      "application/octet-stream",
      data.filename || "backup.encrypted.json"
    );
    var file = folder.createFile(blob);
    return jsonResponse({ ok: true, fileId: file.getId(), url: file.getUrl() });
  } catch (err) {
    return jsonResponse({ ok: false, error: err.toString() });
  }
}

function doGet(e) {
  try {
    var secret = (e && e.parameter && e.parameter.secret) ? e.parameter.secret : "";
    if (secret !== SECRET) {
      return jsonResponse({ ok: false, error: "Invalid secret key (unauthorized)" });
    }
    var action = (e && e.parameter && e.parameter.action) ? e.parameter.action : "list";
    var folder = getOrCreateFolder();
    
    if (action === "list") {
      var files = folder.getFiles();
      var result = [];
      while (files.hasNext()) {
        var f = files.next();
        result.push({
          id: f.getId(),
          name: f.getName(),
          size: f.getSize(),
          created: f.getDateCreated().toISOString()
        });
      }
      result.sort(function(a, b) { return b.created.localeCompare(a.created); });
      return jsonResponse({ ok: true, files: result });
    }
    
    if (action === "download") {
      var fileId = e && e.parameter && e.parameter.fileId;
      if (!fileId) {
        return jsonResponse({ ok: false, error: "Missing fileId parameter" });
      }
      var file = DriveApp.getFileById(fileId);
      var content = Utilities.base64Encode(file.getBlob().getBytes());
      return jsonResponse({ ok: true, name: file.getName(), content: content });
    }
    
    return jsonResponse({ ok: false, error: "Unknown action: " + action });
  } catch (err) {
    return jsonResponse({ ok: false, error: err.toString() });
  }
}

function getOrCreateFolder() {
  var folders = DriveApp.getFoldersByName("Clinixa-Backups");
  return folders.hasNext() ? folders.next() : DriveApp.createFolder("Clinixa-Backups");
}

function jsonResponse(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}`;
                      navigator.clipboard.writeText(codeToCopy);
                      setCodeCopied(true);
                      setTimeout(() => setCodeCopied(false), 2500);
                    }}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 6,
                      padding: '4px 12px',
                      fontSize: 'var(--text-xs)',
                      borderRadius: 'var(--radius-sm, 6px)',
                      transition: 'all 0.2s',
                    }}
                  >
                    {codeCopied ? (
                      <>
                        <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={3} strokeLinecap="round" strokeLinejoin="round">
                          <polyline points="20 6 9 17 4 12" />
                        </svg>
                        <span>تم نسخ الكود بنجاح ✓</span>
                      </>
                    ) : (
                      <>
                        <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                          <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                          <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
                        </svg>
                        <span>نسخ الكود بالكامل</span>
                      </>
                    )}
                  </button>
                </div>
                <div
                  dir="ltr"
                  style={{
                    marginInlineStart: 40,
                    padding: 'var(--space-3) var(--space-4)',
                    background: 'var(--color-bg-secondary, rgba(0,0,0,0.04))',
                    borderRadius: 'var(--radius-md, 8px)',
                    fontFamily: 'monospace', fontSize: 'var(--text-xs)',
                    whiteSpace: 'pre-wrap', wordBreak: 'break-all',
                    border: '1px solid var(--color-border)',
                    maxHeight: 340, overflow: 'auto',
                  }}
                >
{`var SECRET = "YOUR_SECRET_KEY_HERE";

function doPost(e) {
  try {
    if (!e || !e.postData || !e.postData.contents) {
      return jsonResponse({ ok: false, error: "No post data received" });
    }
    var data = JSON.parse(e.postData.contents);
    if (data.secret !== SECRET) {
      return jsonResponse({ ok: false, error: "Invalid secret key (unauthorized)" });
    }
    var folder = getOrCreateFolder();
    var blob = Utilities.newBlob(
      Utilities.base64Decode(data.file),
      "application/octet-stream",
      data.filename || "backup.encrypted.json"
    );
    var file = folder.createFile(blob);
    return jsonResponse({ ok: true, fileId: file.getId(), url: file.getUrl() });
  } catch (err) {
    return jsonResponse({ ok: false, error: err.toString() });
  }
}

function doGet(e) {
  try {
    var secret = (e && e.parameter && e.parameter.secret) ? e.parameter.secret : "";
    if (secret !== SECRET) {
      return jsonResponse({ ok: false, error: "Invalid secret key (unauthorized)" });
    }
    var action = (e && e.parameter && e.parameter.action) ? e.parameter.action : "list";
    var folder = getOrCreateFolder();
    
    if (action === "list") {
      var files = folder.getFiles();
      var result = [];
      while (files.hasNext()) {
        var f = files.next();
        result.push({
          id: f.getId(),
          name: f.getName(),
          size: f.getSize(),
          created: f.getDateCreated().toISOString()
        });
      }
      result.sort(function(a, b) { return b.created.localeCompare(a.created); });
      return jsonResponse({ ok: true, files: result });
    }
    
    if (action === "download") {
      var fileId = e && e.parameter && e.parameter.fileId;
      if (!fileId) {
        return jsonResponse({ ok: false, error: "Missing fileId parameter" });
      }
      var file = DriveApp.getFileById(fileId);
      var content = Utilities.base64Encode(file.getBlob().getBytes());
      return jsonResponse({ ok: true, name: file.getName(), content: content });
    }
    
    return jsonResponse({ ok: false, error: "Unknown action: " + action });
  } catch (err) {
    return jsonResponse({ ok: false, error: err.toString() });
  }
}

function getOrCreateFolder() {
  var folders = DriveApp.getFoldersByName("Clinixa-Backups");
  return folders.hasNext() ? folders.next() : DriveApp.createFolder("Clinixa-Backups");
}

function jsonResponse(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}`}
                </div>
              </div>

              {/* الخطوة 3 */}
              <div style={{ marginBottom: 'var(--space-5)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)', marginBottom: 'var(--space-2)' }}>
                  <span style={{
                    display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                    width: 28, height: 28, borderRadius: '50%',
                    background: 'var(--color-primary)', color: '#fff',
                    fontSize: 'var(--text-sm)', fontWeight: 700, flexShrink: 0,
                  }}>3</span>
                  <h3 style={{ margin: 0, fontSize: 'var(--text-base)' }}>{t('admin.backup.googleDrive.guideStep3Title')}</h3>
                </div>
                <p style={{ margin: 0, color: 'var(--color-text-secondary)', fontSize: 'var(--text-sm)', paddingInlineStart: 40 }}>
                  {t('admin.backup.googleDrive.guideStep3Desc')}
                </p>
              </div>

              {/* الخطوة 4 */}
              <div style={{ marginBottom: 'var(--space-5)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)', marginBottom: 'var(--space-2)' }}>
                  <span style={{
                    display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                    width: 28, height: 28, borderRadius: '50%',
                    background: 'var(--color-primary)', color: '#fff',
                    fontSize: 'var(--text-sm)', fontWeight: 700, flexShrink: 0,
                  }}>4</span>
                  <h3 style={{ margin: 0, fontSize: 'var(--text-base)' }}>{t('admin.backup.googleDrive.guideStep4Title')}</h3>
                </div>
                <p style={{ margin: 0, color: 'var(--color-text-secondary)', fontSize: 'var(--text-sm)', paddingInlineStart: 40 }}>
                  {t('admin.backup.googleDrive.guideStep4Desc')}
                </p>
              </div>

              {/* الخطوة 5 */}
              <div style={{ marginBottom: 'var(--space-4)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)', marginBottom: 'var(--space-2)' }}>
                  <span style={{
                    display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                    width: 28, height: 28, borderRadius: '50%',
                    background: 'var(--color-primary)', color: '#fff',
                    fontSize: 'var(--text-sm)', fontWeight: 700, flexShrink: 0,
                  }}>5</span>
                  <h3 style={{ margin: 0, fontSize: 'var(--text-base)' }}>{t('admin.backup.googleDrive.guideStep5Title')}</h3>
                </div>
                <p style={{ margin: 0, color: 'var(--color-text-secondary)', fontSize: 'var(--text-sm)', paddingInlineStart: 40 }}>
                  {t('admin.backup.googleDrive.guideStep5Desc')}
                </p>
              </div>

              {/* ملاحظة */}
              <div style={{
                marginTop: 'var(--space-4)',
                padding: 'var(--space-3) var(--space-4)',
                background: 'rgba(59, 130, 246, 0.06)',
                border: '1px solid rgba(59, 130, 246, 0.2)',
                borderRadius: 'var(--radius-md, 8px)',
                display: 'flex', alignItems: 'flex-start', gap: 'var(--space-3)',
              }}>
                <svg width={18} height={18} aria-hidden="true" style={{ color: '#3B82F6', flexShrink: 0, marginTop: 2 }}>
                  <use href="#i-info" />
                </svg>
                <p style={{ margin: 0, fontSize: 'var(--text-sm)', color: 'var(--color-text-secondary)' }}>
                  {t('admin.backup.googleDrive.guideNote')}
                </p>
              </div>
            </div>

            <div className="modal-actions">
              <button
                type="button"
                className="btn btn-primary btn-inline"
                onClick={() => setShowDriveGuide(false)}
              >
                {t('admin.backup.googleDrive.guideCloseBtn')}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
