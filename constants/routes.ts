// LimpeJaApp/src/constants/routes.ts
// Útil para navegação programática se você não quiser usar caminhos de string diretamente
// ou para passar como props, especialmente se os caminhos forem complexos.
// Com Expo Router, muitas vezes você usará os caminhos de arquivo diretamente.
// Mas pode ser útil para parâmetros de tipo seguro ou nomes canônicos.

export const AUTH_ROUTES = {
  LOGIN: '/(auth)/login',
  REGISTER_OPTIONS: '/(auth)/register-options',
  CLIENT_REGISTER: '/(auth)/client-register',
  PROVIDER_REGISTER_STEP1: '/(auth)/provider-register', // ou o nome da primeira tela, ex: '/(auth)/provider-register/index'
  // ...
};

export const CLIENT_ROUTES = {
  EXPLORE: '/(client)/explore',
  SEARCH_RESULTS: '/(client)/explore/search-results', // Geralmente você passaria params aqui
  PROVIDER_DETAILS: (providerId: string) => `/(client)/explore/${providerId}` as const,
  BOOKINGS_LIST: '/(client)/bookings',
  BOOKING_DETAILS: (bookingId: string) => `/(client)/bookings/${bookingId}` as const,
  SCHEDULE_SERVICE: '/(client)/bookings/schedule-service',
  MESSAGES_LIST: '/(client)/messages',
  CHAT: (chatId: string) => `/(client)/messages/${chatId}` as const,
  PROFILE: '/(client)/profile',
  EDIT_PROFILE: '/(client)/profile/edit',
  // ...
};

export const PROVIDER_ROUTES = {
  DASHBOARD: '/(provider)/dashboard',
  SCHEDULE: '/(provider)/schedule',
  MANAGE_AVAILABILITY: '/(provider)/schedule/manage-availability',
  SERVICES_LIST: '/(provider)/services', // ou JOBS_LIST
  SERVICE_DETAILS: (serviceId: string) => `/(provider)/services/${serviceId}` as const,
  EARNINGS: '/(provider)/earnings',
  MESSAGES_LIST: '/(provider)/messages',
  PROVIDER_CHAT: (chatId: string) => `/(provider)/messages/${chatId}` as const,
  PROFILE: '/(provider)/profile',
  EDIT_SERVICES: '/(provider)/profile/edit-services',
  // ...
};

export const COMMON_ROUTES = {
  SETTINGS: '/(common)/settings',
  HELP: '/(common)/help',
  NOTIFICATIONS: '/(common)/notifications',
  FEEDBACK: (targetId: string) => `/(common)/feedback/${targetId}` as const,
};

// Você pode não precisar de todos esses se estiver usando <Link href="..."> diretamente.
// Mas pode ser útil para router.push(CLIENT_ROUTES.PROVIDER_DETAILS('123'))