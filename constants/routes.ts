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
  SERVICE_DETAILS_STEP: '/(auth)/provider-register/service-details', // CORRIGIDO: Adicionado
  VERIFY_ACCOUNT_STEP: '/(auth)/provider-register/verify-account',   // CORRIGIDO: Adicionado
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
  DASHBOARD: '/dashboard', // Altere de '/(provider)/dashboard' para '/dashboard'
  SCHEDULE: '/schedule',
  MANAGE_AVAILABILITY: '/schedule/manage-availability',
  SERVICES_LIST: '/services',
  SERVICE_DETAILS: (serviceId: string) => `/services/${serviceId}` as const,
  EARNINGS: '/earnings', // Altere de '/(provider)/earnings' para '/earnings'
  MESSAGES_LIST: '/messages',
  PROVIDER_CHAT: (chatId: string) => `/messages/${chatId}` as const,
  PROFILE: '/profile',
  EDIT_SERVICES: '/profile/edit-services',
  VERIFICATION: '/verify-account',
  BOOKINGS_LIST: '/bookings',
} as const;

export const COMMON_ROUTES = {
  SETTINGS: '/(common)/settings',
  HELP: '/(common)/help',
  NOTIFICATIONS: '/(common)/notifications',
  FEEDBACK: (targetId: string) => `/(common)/feedback/${targetId}` as const,
} as const;