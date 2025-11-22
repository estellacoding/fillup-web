import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

// Import translation files
import en from './en/translation.json';
import zhTW from './zh-TW/translation.json';
import zhCN from './zh-CN/translation.json';

// Supported languages configuration
export const SUPPORTED_LANGUAGES = {
  en: { name: 'English', nativeName: 'English', flag: '🇺🇸' },
  'zh-TW': { name: 'Traditional Chinese', nativeName: '繁體中文', flag: '🇹🇼' },
  'zh-CN': { name: 'Simplified Chinese', nativeName: '简体中文', flag: '🇨🇳' }
} as const;

export type SupportedLanguage = keyof typeof SUPPORTED_LANGUAGES;

// Language resources
const resources = {
  en: { translation: en },
  'zh-TW': { translation: zhTW },
  'zh-CN': { translation: zhCN }
};

// Initialize i18n
i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources,
    fallbackLng: 'zh-TW', // Default language
    debug: import.meta.env.DEV,

    interpolation: {
      escapeValue: false // React already escapes values
    },

    detection: {
      order: ['localStorage', 'navigator', 'htmlTag'],
      caches: ['localStorage'],
      lookupLocalStorage: 'fillup-language'
    },

    // React options
    react: {
      useSuspense: false
    }
  });

// Helper function to change language
export const changeLanguage = async (lang: SupportedLanguage) => {
  await i18n.changeLanguage(lang);
  // Update HTML lang attribute
  document.documentElement.lang = lang;
};

// Helper function to get current language
export const getCurrentLanguage = (): SupportedLanguage => {
  return i18n.language as SupportedLanguage;
};

export default i18n;
