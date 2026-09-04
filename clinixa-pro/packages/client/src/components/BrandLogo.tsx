import { useTranslation } from 'react-i18next';

/** شعار Clinixa — نفس مسارات الـSVG بالحرف من شاشات المصادقة في البروتوتايب */
export function BrandLogo() {
  const { t } = useTranslation();
  return (
    <svg className="brand-logo" viewBox="0 0 48 48" fill="none" role="img" aria-label={t('common.clinixaLogo')}>
      <path d="M39 13.4A18 18 0 1 0 39 34.6" stroke="url(#logoGrad)" strokeWidth={6.4} strokeLinecap="round" />
      <circle cx={24} cy={20} r={4.4} fill="url(#logoGrad)" />
      <path d="M14.6 26.4a11.2 11.2 0 0 0 19.6 0" stroke="url(#logoGrad)" strokeWidth={5.2} strokeLinecap="round" />
    </svg>
  );
}
