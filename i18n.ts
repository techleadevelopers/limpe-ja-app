// relax-app/i18n.ts

import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import * as Localization from 'expo-localization';

import ptBRTranslation from './i18n/locales/pt-BR.json';
import enUSTranslation from './i18n/locales/en-US.json';

const resources = {
  'en-US': enUSTranslation,
  'pt-BR': ptBRTranslation,
};

const isDev =
  typeof __DEV__ !== 'undefined' ? __DEV__ : process.env.NODE_ENV !== 'production';
const isTest = process.env.NODE_ENV === 'test';

const silentLogger = {
  log: () => {},
  warn: () => {},
  error: () => {},
};

const detectLanguage = () => {
  const loc = Localization.getLocales?.()[0];
  const tag = (loc?.languageTag || loc?.languageCode || 'pt-BR') as string;
  if (tag.startsWith('pt')) return 'pt-BR';
  if (tag.startsWith('en')) return 'en-US';
  return 'pt-BR';
};

i18n
  .use(initReactI18next)
  .init({
    resources,
    lng: detectLanguage(),
    fallbackLng: 'pt-BR',
    supportedLngs: ['pt-BR', 'pt', 'pt-br', 'en-US', 'en', 'en-us', 'dev'],
    nonExplicitSupportedLngs: true,
    debug: isDev && !isTest,
    logger: isTest ? silentLogger : undefined,
    saveMissing: !isTest,
    lowerCaseLng: false,
    load: 'currentOnly',
    interpolation: {
      escapeValue: false,
    },
    compatibilityJSON: 'v4',
    missingKeyHandler: isTest ? () => undefined : undefined,
  });

export default i18n;
