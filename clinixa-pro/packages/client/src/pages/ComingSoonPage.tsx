import { useTranslation } from 'react-i18next';

interface Props {
  titleKey: string;
}

/** موديول برّه نطاق Phase 3 الحالي (المخزون / الإدارة) — Sidebar بيوصّله هنا بدل رابط مكسور. */
export function ComingSoonPage({ titleKey }: Props) {
  const { t } = useTranslation();

  return (
    <div className="empty-state">
      <div className="empty-icon" aria-hidden="true">
        <svg width={24} height={24}>
          <use href="#i-clock" />
        </svg>
      </div>
      <h2 className="empty-title">{t(titleKey)}</h2>
      <p className="empty-text">{t('shell.comingSoon.body')}</p>
    </div>
  );
}
