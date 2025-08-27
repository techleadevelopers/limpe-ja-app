// LimpeJaApp/src/constants/routes.ts
// Útil para navegação programática se você não quiser usar caminhos de string diretamente
// ou para passar como props, especialmente se os caminhos forem complexos.
// Com Expo Router, muitas vezes você usará os caminhos de arquivo diretamente.
// Mas pode ser útil para parâmetros de tipo seguro ou nomes canônicos.

export const AUTH_ROUTES = {
  LOGIN: '/(auth)/login',
  REGISTER_OPTIONS: '/(auth)/register-options',
  CLIENT_REGISTER: '/(auth)/client-register',
  PROVIDER_REGISTER_STEP1: '/(auth)/provider-register', 
  SERVICE_DETAILS_STEP: '/(auth)/provider-register/service-details',
  VERIFY_ACCOUNT_STEP: '/(auth)/provider-register/verify-account',
} as const; // FUNDAMENTAL: usar 'as const' aqui para tipagem literal de string

export const CLIENT_ROUTES = {
  EXPLORE: '/(client)/explore',
  SEARCH_RESULTS: '/(client)/explore/search-results', 
  PROVIDER_DETAILS: (providerId: string) => `/(client)/explore/${providerId}` as const,
  BOOKINGS_LIST: '/(client)/bookings',
  BOOKING_DETAILS: (bookingId: string) => `/(client)/bookings/${bookingId}` as const,
  SCHEDULE_SERVICE: '/(client)/bookings/schedule-service',
  MESSAGES_LIST: '/(client)/messages',
  CHAT: (chatId: string) => `/(client)/messages/${chatId}` as const,
  PROFILE: '/(client)/profile',
  EDIT_PROFILE: '/(client)/profile/edit',
  MISSIONS: '/(client)/missions', // ROTA DE MISSÕES ADICIONADA AQUI
} as const;

export const PROVIDER_ROUTES = {
  DASHBOARD: '/(provider)/dashboard', // CORRIGIDO: Adicionado /(provider)
  SCHEDULE: '/(provider)/schedule', // CORRIGIDO: Adicionado /(provider)
  MANAGE_AVAILABILITY: '/(provider)/schedule/manage-availability', // CORRIGIDO: Adicionado /(provider)
  SERVICES_LIST: '/(provider)/services', // CORRIGIDO: Adicionado /(provider)
  SERVICE_DETAILS: (serviceId: string) => `/(provider)/services/${serviceId}` as const, // CORRIGIDO: Adicionado /(provider)
  EARNINGS: '/(provider)/earnings', // CORRIGIDO: Adicionado /(provider)
  MESSAGES_LIST: '/(provider)/messages', // CORRIGIDO: Adicionado /(provider)
  PROVIDER_CHAT: (chatId: string) => `/(provider)/messages/${chatId}` as const, // CORRIGIDO: Adicionado /(provider)
  PROFILE: '/(provider)/profile', // CORRIGIDO: Adicionado /(provider)
  EDIT_SERVICES: '/(provider)/profile/edit-services', // CORRIGIDO: Adicionado /(provider)
  VERIFICATION: '/(provider)/verify-account', // CORRIGIDO: Adicionado /(provider)
  BOOKINGS_LIST: '/(provider)/bookings', // CORRIGIDO: Adicionado /(provider)
  WITHDRAW: '/(provider)/withdraw', // Já estava correto
  REVIEWS: '/(provider)/reviews/index', // Adicionado/Corrigido com base no erro de tipagem
} as const;

export const COMMON_ROUTES = {
  SETTINGS: '/(common)/settings',
  HELP: '/(common)/help',
  NOTIFICATIONS: '/(common)/notifications',
  FEEDBACK: (targetId: string) => `/(common)/feedback/${targetId}` as const,
} as const;