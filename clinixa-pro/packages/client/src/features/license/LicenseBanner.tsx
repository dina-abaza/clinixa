import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useQuery } from '@tanstack/react-query';
import { getLicenseStatus } from '../../lib/api/license';
import { LicenseRenewalModal } from './LicenseRenewalModal';

export function LicenseBanner() {
  const { t } = useTranslation();
  const [manualOpen, setManualOpen] = useState(false);

  const { data: licenseRes } = useQuery({
    queryKey: ['license-status'],
    queryFn: async () => {
      const res = await getLicenseStatus();
      if (!res.ok) throw new Error(res.error.message);
      return res.data;
    },
    refetchInterval: 30 * 1000, // فحص دوري كل 30 ثانية
  });

  const license = licenseRes;
  if (!license) return null;

  const isExpired = !license.is_active;
  const isExpiringSoon =
    license.is_active &&
    (license.ms_remaining !== undefined
      ? license.ms_remaining <= 3 * 24 * 60 * 60 * 1000
      : license.days_remaining <= 3);

  return (
    <>
      {isExpiringSoon ? (
        <div
          style={{
            background: 'rgba(245, 158, 11, 0.15)',
            borderBottom: '1px solid rgba(245, 158, 11, 0.3)',
            color: '#f59e0b',
            padding: '8px 16px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            fontSize: 'var(--text-xs)',
            fontWeight: 700,
            zIndex: 10,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <svg width={16} height={16} aria-hidden="true">
              <use href="#i-alert-triangle" />
            </svg>
            <span>
              {t('license.bannerExpiringSoon', {
                time: license.remaining_formatted || `${license.days_remaining} يوم`,
              })}
            </span>
          </div>

          <button
            type="button"
            className="btn btn-secondary btn-sm"
            onClick={() => setManualOpen(true)}
            style={{
              borderColor: 'rgba(245, 158, 11, 0.4)',
              color: 'inherit',
              padding: '2px 10px',
              fontSize: 'var(--text-xs)',
            }}
          >
            {t('license.renewNow')}
          </button>
        </div>
      ) : null}

      {/* Modal التجديد الإجباري عند الانتهاء أو اليدوي */}
      <LicenseRenewalModal
        statusData={license}
        isOpen={isExpired || manualOpen}
        onClose={() => setManualOpen(false)}
        canClose={!isExpired}
      />
    </>
  );
}
