import { useTranslation } from 'react-i18next';
import type { Theme } from '../lib/theme/useTheme';

interface Props {
  theme: Theme;
  onToggleTheme: () => void;
}

/**
 * أدوات أعلى شاشات المصادقة (لغة + مظهر) — نفس .screen-tools في البروتوتايب.
 * مضافة برّه بنية الشاشة الموثّقة رسميًا (نفس ملحوظة البروتوتايب).
 */
export function AuthScreenTools({ theme, onToggleTheme }: Props) {
  const { t, i18n } = useTranslation();
  const isEnglish = i18n.language === 'en';

  return (
    <div className="screen-tools">
      <button
        type="button"
        className="icon-btn lang-btn"
        aria-label={t('common.switchLanguage')}
        onClick={() => i18n.changeLanguage(isEnglish ? 'ar' : 'en')}
      >
        {isEnglish ? 'AR' : 'EN'}
      </button>
      <button
        type="button"
        className="icon-btn"
        aria-label={t('common.switchTheme')}
        onClick={onToggleTheme}
      >
        <svg width={20} height={20} aria-hidden="true">
          <use href={theme === 'dark' ? '#i-sun' : '#i-moon'} />
        </svg>
      </button>
    </div>
  );
}
