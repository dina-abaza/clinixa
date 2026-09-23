import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { CHARGE_TYPES, SPECIALTIES, type ChargeType, type SyncMode } from '@clinixa/shared';
import { getSettings, updateSettings } from '../../lib/api/settings';
import { configureSync, getSyncHealth } from '../../lib/api/sync';
import { useAuthStore } from '../../lib/store/authStore';
import { hasPermission } from '../../lib/permissions';

/** تبويب الإعدادات والأسعار — GET/PUT /api/settings. */
export function SettingsTab() {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const permissions = useAuthStore((s) => s.employee?.permissions);
  const canEdit = hasPermission(permissions, 'admin.edit');

  const settingsQuery = useQuery({ queryKey: ['settings'], queryFn: getSettings });

  const [nameAr, setNameAr] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [syncMode, setSyncMode] = useState<SyncMode>('none');
  const [prices, setPrices] = useState<Record<ChargeType, string>>({} as Record<ChargeType, string>);
  const [toast, setToast] = useState<string | null>(null);
  const [hydrated, setHydrated] = useState(false);
  const [mongodbUri, setMongodbUri] = useState('');
  const [syncFeedback, setSyncFeedback] = useState<string | null>(null);

  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => setToast(null), 2800);
    return () => clearTimeout(timer);
  }, [toast]);

  useEffect(() => {
    if (hydrated || !settingsQuery.data?.ok) return;
    const { clinic, prices: existingPrices } = settingsQuery.data.data;
    setNameAr(clinic.name_ar);
    setPhone(clinic.phone ?? '');
    setAddress(clinic.address ?? '');
    setSyncMode(clinic.sync_mode ?? 'none');
    const map = {} as Record<ChargeType, string>;
    for (const ct of CHARGE_TYPES) {
      const existing = existingPrices.find((p) => p.charge_type === ct.key);
      map[ct.key] = existing ? String(existing.default_amount) : '0';
    }
    setPrices(map);
    setHydrated(true);
  }, [settingsQuery.data, hydrated]);

  const updateMutation = useMutation({
    mutationFn: () =>
      updateSettings({
        clinic: {
          name_ar: nameAr.trim(),
          phone: phone.trim() || null,
          address: address.trim() || null,
          sync_mode: syncMode,
        },
        prices: CHARGE_TYPES.map((ct) => ({ charge_type: ct.key, default_amount: Number(prices[ct.key] ?? 0) })),
      }),
    onSuccess: (res) => {
      if (res.ok) {
        queryClient.invalidateQueries({ queryKey: ['settings'] });
        setToast(t('admin.settings.toasts.saved'));
      }
    },
  });

  const syncModeMutation = useMutation({
    mutationFn: (nextMode: SyncMode) => updateSettings({ clinic: { sync_mode: nextMode } }),
    onSuccess: (res, nextMode) => {
      if (res.ok) {
        setSyncMode(nextMode);
        queryClient.invalidateQueries({ queryKey: ['settings'] });
        setToast(t('admin.settings.toasts.saved'));
      }
    },
  });

  const syncHealthQuery = useQuery({
    queryKey: ['sync-health'],
    queryFn: getSyncHealth,
    enabled: hydrated && syncMode !== 'none',
    refetchInterval: 30000,
  });

  const configureSyncMutation = useMutation({
    mutationFn: () => configureSync(mongodbUri),
    onSuccess: (res) => {
      if (res.ok) {
        setMongodbUri('');
        queryClient.invalidateQueries({ queryKey: ['sync-health'] });
        setSyncFeedback(res.data.reason ?? 'تم الاتصال بـ MongoDB Atlas بنجاح');
        setToast(res.data.status === 'connected' ? 'تم الاتصال بـ MongoDB Atlas بنجاح' : (res.data.reason ?? 'فشل اتصال MongoDB Atlas'));
      } else {
        setSyncFeedback(res.error.message);
      }
    },
    onError: () => setSyncFeedback('تعذر إرسال طلب اختبار الاتصال إلى السيرفر'),
  });

  if (settingsQuery.data && !settingsQuery.data.ok) {
    return (
      <div className="table-card glass" style={{ padding: 'var(--space-6)' }}>
        <p className="field-error" style={{ display: 'flex' }}>
          <svg width={14} height={14} aria-hidden="true"><use href="#i-alert-circle" /></svg>
          <span>{settingsQuery.data.error.message}</span>
        </p>
      </div>
    );
  }

  if (settingsQuery.isLoading || !hydrated) {
    return (
      <div className="table-card glass" style={{ padding: 'var(--space-6)' }}>
        <span className="skel" style={{ width: '40%', marginBottom: 12 }} />
        <span className="skel" style={{ width: '60%', marginBottom: 12 }} />
        <span className="skel" style={{ width: '50%' }} />
      </div>
    );
  }

  const clinic = settingsQuery.data?.ok ? settingsQuery.data.data.clinic : null;
  const submitError = updateMutation.data && !updateMutation.data.ok ? updateMutation.data.error.message : null;

  return (
    <>
      <div className="detail-card glass" style={{ marginBottom: 'var(--space-5)' }}>
        <h2 style={{ marginTop: 0 }}>{t('admin.settings.clinicSection')}</h2>
        <div className="form-grid">
          <div className="form-field">
            <label htmlFor="set-name-ar">{t('admin.settings.fields.nameAr')}</label>
            <div className="input-wrap no-icon">
              <input id="set-name-ar" type="text" disabled={!canEdit} value={nameAr} onChange={(e) => setNameAr(e.target.value)} />
            </div>
          </div>
          <div className="form-field">
            <label htmlFor="set-phone">{t('admin.settings.fields.phone')}</label>
            <div className="input-wrap no-icon">
              <input id="set-phone" type="tel" disabled={!canEdit} value={phone} onChange={(e) => setPhone(e.target.value)} />
            </div>
          </div>
          <div className="form-field wide">
            <label htmlFor="set-address">{t('admin.settings.fields.address')}</label>
            <div className="input-wrap no-icon">
              <input id="set-address" type="text" disabled={!canEdit} value={address} onChange={(e) => setAddress(e.target.value)} />
            </div>
          </div>
          <div className="form-field">
            <label>{t('admin.settings.fields.specialty')}</label>
            <div className="input-wrap no-icon">
              <input type="text" disabled value={clinic ? SPECIALTIES.find((s) => s.key === clinic.specialty)?.label_ar ?? clinic.specialty : ''} />
            </div>
          </div>
          <div className="form-field" style={{ gridColumn: '1 / -1' }}>
            <label>{t('admin.settings.fields.syncMode')}</label>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: 'var(--space-3)',
                padding: 'var(--space-3) var(--space-4)',
                borderRadius: 'var(--radius-md)',
                border: '1px solid var(--color-border)',
                background: 'var(--color-bg-secondary)',
              }}
            >
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                <strong style={{ fontSize: 'var(--text-body-sm)' }}>
                  {clinic ? t(`admin.settings.syncModes.${clinic.sync_mode}`) : t('admin.settings.syncModes.none')}
                </strong>
                <span style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)' }}>
                  {syncMode === 'none'
                    ? 'المزامنة متوقفة — حددها من هنا عند الحاجة.'
                    : 'المزامنة مفعّلة عبر MongoDB / مزامنة الفروع.'}
                </span>
              </div>

              <button
                type="button"
                disabled={!canEdit || syncModeMutation.isPending}
                onClick={() => syncModeMutation.mutate(syncMode === 'none' ? 'external_hosting' : 'none')}
                style={{
                  minWidth: 108,
                  border: 'none',
                  borderRadius: 999,
                  padding: '8px 14px',
                  background: syncMode === 'none' ? 'var(--color-bg-muted)' : '#10b981',
                  color: syncMode === 'none' ? 'var(--color-text-primary)' : '#ffffff',
                  fontWeight: 700,
                  cursor: canEdit ? 'pointer' : 'not-allowed',
                  opacity: syncModeMutation.isPending ? 0.65 : 1,
                }}
              >
                {syncMode === 'none' ? 'تفعيل' : 'إيقاف'}
              </button>
            </div>
          </div>
        </div>
      </div>

      {syncMode !== 'none' && (
        <div className="detail-card glass" style={{ marginBottom: 'var(--space-5)' }}>
          <h2 style={{ marginTop: 0 }}>مزامنة الفروع عبر MongoDB Atlas</h2>
          <p style={{ color: 'var(--color-text-secondary)', marginTop: 0 }}>
            يتم حفظ الرابط مشفراً على هذا الجهاز فقط، ولا يتم عرضه أو طباعته في السجلات.
          </p>
          <div className="form-grid">
            <div className="form-field wide">
              <label htmlFor="mongodb-uri">رابط MongoDB Atlas</label>
              <div className="input-wrap no-icon">
                <input
                  id="mongodb-uri"
                  type="password"
                  autoComplete="off"
                  disabled={!canEdit || configureSyncMutation.isPending}
                  value={mongodbUri}
                  onChange={(event) => setMongodbUri(event.target.value)}
                  placeholder="mongodb+srv://..."
                />
              </div>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)', marginTop: 'var(--space-3)' }}>
            <span className={`badge ${syncHealthQuery.data?.ok && syncHealthQuery.data.data.status === 'connected' ? 'badge-success' : 'badge-muted'}`}>
              {syncHealthQuery.data?.ok ? syncHealthQuery.data.data.status : 'غير متحقق'}
            </span>
            <span style={{ color: 'var(--color-text-secondary)', fontSize: 'var(--text-xs)' }}>
              {syncHealthQuery.data?.ok ? syncHealthQuery.data.data.reason ?? 'الاتصال يعمل' : 'أدخل الرابط لاختبار الاتصال'}
            </span>
          </div>
          {syncFeedback && (
            <p className="field-error" role="alert" style={{ display: 'flex', marginTop: 'var(--space-3)' }}>
              <svg width={14} height={14} aria-hidden="true"><use href="#i-alert-circle" /></svg>
              <span>{syncFeedback}</span>
            </p>
          )}
          {canEdit && (
            <button
              type="button"
              className="btn btn-secondary btn-inline"
              disabled={!mongodbUri.trim() || configureSyncMutation.isPending}
              onClick={() => configureSyncMutation.mutate()}
              style={{ marginTop: 'var(--space-4)' }}
            >
              <span>{configureSyncMutation.isPending ? 'جاري الاختبار...' : 'حفظ واختبار الاتصال'}</span>
            </button>
          )}
        </div>
      )}

      <div className="detail-card glass">
        <h2 style={{ marginTop: 0 }}>{t('admin.settings.pricesSection')}</h2>
        <div className="form-grid">
          {CHARGE_TYPES.map((ct) => (
            <div className="form-field" key={ct.key}>
              <label htmlFor={`price-${ct.key}`}>{ct.label_ar}</label>
              <div className="input-wrap no-icon">
                <input
                  id={`price-${ct.key}`}
                  type="number"
                  min={0}
                  className="num"
                  disabled={!canEdit}
                  value={prices[ct.key] ?? '0'}
                  onChange={(e) => setPrices((prev) => ({ ...prev, [ct.key]: e.target.value }))}
                />
              </div>
            </div>
          ))}
        </div>

        {canEdit && (
          <>
            <div className={`form-error${submitError ? ' on' : ''}`} role="alert" style={{ marginTop: 'var(--space-3)' }}>
              <svg width={18} height={18} aria-hidden="true"><use href="#i-alert-circle" /></svg>
              <span>{submitError}</span>
            </div>

            <div style={{ marginTop: 'var(--space-5)' }}>
              <button
                type="button"
                className={`btn btn-primary btn-inline${updateMutation.isPending ? ' loading' : ''}`}
                disabled={updateMutation.isPending}
                onClick={() => updateMutation.mutate()}
              >
                <svg className="spinner" width={18} height={18} aria-hidden="true"><use href="#i-loader" /></svg>
                <span>{updateMutation.isPending ? t('common.saving') : t('admin.settings.save')}</span>
              </button>
            </div>
          </>
        )}
      </div>

      <div className={`ok-toast${toast ? ' on' : ''}`} role="status">
        <svg width={18} height={18} aria-hidden="true"><use href="#i-check-circle" /></svg>
        <span>{toast}</span>
      </div>
    </>
  );
}
