import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { CHARGE_TYPES, SPECIALTIES, type ChargeType } from '@clinixa/shared';
import { getSettings, updateSettings } from '../../lib/api/settings';
import { useAuthStore } from '../../lib/store/authStore';
import { hasPermission } from '../../lib/permissions';

/** تبويب الإعدادات والأسعار — GET/PUT /api/settings. specialty و sync_mode للعرض فقط (مش قابلين للتعديل من هنا). */
export function SettingsTab() {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const permissions = useAuthStore((s) => s.employee?.permissions);
  const canEdit = hasPermission(permissions, 'admin.edit');

  const settingsQuery = useQuery({ queryKey: ['settings'], queryFn: getSettings });

  const [nameAr, setNameAr] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [prices, setPrices] = useState<Record<ChargeType, string>>({} as Record<ChargeType, string>);
  const [toast, setToast] = useState<string | null>(null);
  const [hydrated, setHydrated] = useState(false);

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
        clinic: { name_ar: nameAr.trim(), phone: phone.trim() || null, address: address.trim() || null },
        prices: CHARGE_TYPES.map((ct) => ({ charge_type: ct.key, default_amount: Number(prices[ct.key] ?? 0) })),
      }),
    onSuccess: (res) => {
      if (res.ok) {
        queryClient.invalidateQueries({ queryKey: ['settings'] });
        setToast(t('admin.settings.toasts.saved'));
      }
    },
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
          <div className="form-field">
            <label>{t('admin.settings.fields.syncMode')}</label>
            <div className="input-wrap no-icon">
              <input type="text" disabled value={clinic ? t(`admin.settings.syncModes.${clinic.sync_mode}`) : ''} />
            </div>
          </div>
        </div>
      </div>

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
