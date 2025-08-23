// relax-app/i18n.ts

import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import * as Localization from 'expo-localization';

const resources = {
  en: {
    translation: {
      "common.error": "Error",
      "common.generic_error": "An unexpected error occurred. Please try again.",
      "common.loading": "Loading",
      "common.tryAgain": "Try Again", // Adicionei esta chave pois vi no seu index.tsx
      "common.user": "User", // Adicionei esta chave
      "safety.panic.location_permission_denied": "Location Permission Denied",
      "safety.panic.location_permission_message": "Please grant location access to use this feature.",
      "search.all_categories": "All Categories", // Adicionei esta chave
      "search.recommended_providers": "Recommended Providers", // Adicionei esta chave
      "search.nearby_providers": "Nearby Providers", // Adicionei esta chave
      "search.no_results": "No results found.", // Adicionei esta chave
      // Adicione outras chaves de tradução conforme necessário
    }
  },
  pt: {
    translation: {
      "common.error": "Erro",
      "common.generic_error": "Ocorreu um erro inesperado. Por favor, tente novamente.",
      "common.loading": "Carregando",
      "common.tryAgain": "Tentar Novamente", // Adicionei esta chave
      "common.user": "Usuário", // Adicionei esta chave
      "safety.panic.location_permission_denied": "Permissão de Localização Negada",
      "safety.panic.location_permission_message": "Por favor, conceda acesso à localização para usar este recurso.",
      "search.all_categories": "Todas as Categorias", // Adicionei esta chave
      "search.recommended_providers": "Prestadores Recomendados", // Adicionei esta chave
      "search.nearby_providers": "Prestadores Próximos", // Adicionei esta chave
      "search.no_results": "Nenhum resultado encontrado.", // Adicionei esta chave
      // Adicione outras chaves de tradução conforme necessário
    }
  }
};

i18n
  .use(initReactI18next) // Passa a instância do i18n para react-i18next
  .init({
    resources, // Agora 'resources' está dentro do objeto de opções
    // Define o idioma inicial. Tenta usar o idioma do dispositivo, caso contrário, usa 'en'.
    lng: Localization.getLocales()[0]?.languageCode || 'en',
    fallbackLng: 'en', // Idioma de fallback se a tradução não for encontrada
    debug: __DEV__, // Habilita o modo debug apenas em desenvolvimento
    interpolation: {
      escapeValue: false, // Não escapa HTML, já que React já faz isso
    },
    compatibilityJSON: 'v4', // CORRIGIDO: Alterado de 'v3' para 'v4'
  });

export default i18n;