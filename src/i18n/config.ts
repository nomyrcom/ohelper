import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

import commonAr from './locales/ar/common.json';
import servicesAr from './locales/ar/services.json';
import profileAr from './locales/ar/profile.json';
import chatAr from './locales/ar/chat.json';

import commonEn from './locales/en/common.json';
import servicesEn from './locales/en/services.json';
import profileEn from './locales/en/profile.json';
import chatEn from './locales/en/chat.json';

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources: {
      ar: {
        common: commonAr,
        services: servicesAr,
        profile: profileAr,
        chat: chatAr,
      },
      en: {
        common: commonEn,
        services: servicesEn,
        profile: profileEn,
        chat: chatEn,
      },
    },
    fallbackLng: 'ar',
    debug: false,
    interpolation: {
      escapeValue: false,
    },
    ns: ['common', 'services', 'profile', 'chat'],
    defaultNS: 'common',
  });

export default i18n;
