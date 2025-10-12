// relax-app/i18n.ts

import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import * as Localization from 'expo-localization';

// Importe seus arquivos JSON completos
// Ajuste o caminho conforme a estrutura real do seu projeto
import ptBRTranslation from './backend-cleaning/src/common/i18n/locales/pt-BR.json';
import enUSTranslation from './backend-cleaning/src/common/i18n/locales/en-US.json';

const resources = {
  // Use as chaves que correspondem aos seus arquivos JSON
  // Por exemplo, se o arquivo é pt-BR.json, use 'pt-BR' como chave
  'en-US': enUSTranslation,
  'pt-BR': ptBRTranslation,
};

i18n
  .use(initReactI18next) // Passa a instância do i18n para react-i18next
  .init({
    resources, // Agora 'resources' contém todos os seus dados de tradução importados
    // Define o idioma inicial. Tenta usar o idioma do dispositivo.
    // É importante que o 'lng' inicial (e 'fallbackLng') corresponda a uma das chaves em 'resources' ('en-US' ou 'pt-BR').
    lng: (() => { const loc = Localization.getLocales?.()[0]; const tag = (loc?.languageTag || loc?.languageCode || 'pt-BR') as string; if (tag.startsWith('pt')) return 'pt-BR'; if (tag.startsWith('en')) return 'en-US'; return 'pt-BR'; })(), // Tenta 'en-US' como padrão se nada for detectado
    fallbackLng: 'pt-BR',
    supportedLngs: ['pt-BR','pt','pt-br','en-US','en','en-us','dev'],
    nonExplicitSupportedLngs: true, // Idioma de fallback se a tradução não for encontrada
    debug: __DEV__,
    lowerCaseLng: false,
    load: 'currentOnly', // Habilita o modo debug apenas em desenvolvimento
    interpolation: {
      escapeValue: false, // Não escapa HTML, já que React já faz isso
    },
    compatibilityJSON: 'v4', // Mantido 'v4'
  });

export default i18n;