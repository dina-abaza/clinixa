import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';

/**
 * بتزامن lang/dir على عنصر <html> مع لغة i18next الحالية — نفس سلوك
 * toggleLang() في البروتوتايب: RTL هيكليًا للعربي، LTR للإنجليزي
 * (Design System §0، مش ترجمة نصوص بس).
 */
export function useDocumentDirection() {
  const { i18n } = useTranslation();

  useEffect(() => {
    const html = document.documentElement;
    html.lang = i18n.language;
    html.dir = i18n.language === 'ar' ? 'rtl' : 'ltr';
  }, [i18n.language]);
}
