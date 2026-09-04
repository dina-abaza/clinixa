import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import { ar } from './locales/ar';
import { en } from './locales/en';

export const SUPPORTED_LANGUAGES = ['ar', 'en'] as const;
export type SupportedLanguage = (typeof SUPPORTED_LANGUAGES)[number];

const defaultLocale = (import.meta.env.VITE_DEFAULT_LOCALE as SupportedLanguage) || 'ar';

void i18n.use(initReactI18next).init({
  resources: {
    ar: { translation: ar },
    en: { translation: en },
  },
  lng: defaultLocale,
  fallbackLng: 'ar',
  interpolation: { escapeValue: false },
  returnNull: false,
});

export default i18n;
