// Centralized routes for Expo Router navigation.
export const COMMON_ROUTES = {
  HELP: '/common/help',
  TERMOS: '/common/termos',
  PRIVACIDADE: '/common/privacidade',
  SUPPORT: '/common/support',
  SAFETY: '/common/safety',
  SAFETY_INCIDENT: '/common/safety/incident-report',
  SAFETY_PANIC: '/common/safety/panic',
  FEEDBACK: (targetId: string) => `/common/feedback/${targetId}` as const,
} as const;

export const CLIENT_ROUTES = {
  EXPLORE: '/client/explore',
  COUPONS: '/client/coupons',
  BOOKINGS: '/client/bookings',
  BOOKING_SUCCESS: '/client/bookings/success',
  SCHEDULE_SERVICE: '/client/bookings/schedule-service',
  MESSAGES: '/client/messages',
  PROFILE: '/client/profile',
  PROFILE_EDIT: '/client/profile/edit',
  RANKING: '/client/ranking',
  REFERRALS: '/client/referrals',
  SUBSCRIPTIONS: '/client/subscriptions',
  SUPPORT: '/client/support',
  METRICS: '/client/metrics',
  MISSIONS: '/client/missions',
  NOTIFICATIONS: '/client/notifications',
  COUPONS_LIST: '/client/coupons',
  EXPLORE_MENU: '/client/explore/menu',
  WALLET_CASHBACK: '/client/wallet/cashback',
  EXPLORE_SECURITY: '/client/explore/security',
  EXPLORE_TODOS: '/client/explore/todas-categorias',
  CATEGORY: (categoryId: string) => `/client/category/${categoryId}` as const,
  PROVIDER_DETAILS: (providerId: string) => `/client/explore/${providerId}` as const,
  CHAT: (chatId: string) => `/client/messages/${chatId}` as const,
} as const;

export const PROVIDER_ROUTES = {
  DASHBOARD: '/provider',
  MESSAGES: '/provider/messages',
  PROFILE: '/provider/profile',
  REVIEWS: '/provider/reviews',
  SCHEDULE: '/provider/schedule',
  SERVICES: '/provider/services',
  WITHDRAW: '/provider/withdraw',
  MISSIONS: '/provider/missions',
  NOTIFICATIONS: '/provider/notifications',
  SCHEDULE_MANAGE: '/provider/schedule/manage-availability',
  ACTIVE_BOOKING: (bookingId: string) => `/provider/active-booking/${bookingId}` as const,
  PROFILE_EDIT_SERVICES: '/provider/profile/edit-services',
  SERVICE_DETAILS: (serviceId: string) => `/provider/services/${serviceId}` as const,
} as const;

export const AUTH_ROUTES = {
  LOGIN: '/auth/login',
  REGISTER_OPTIONS: '/auth/register-options',
  CLIENT_REGISTER: '/auth/client-register',
  PROVIDER_REGISTER: '/auth/provider-register',
  PROVIDER_PERSONAL_DETAILS: '/auth/provider-register/personal-details',
  PROVIDER_SERVICE_DETAILS: '/auth/provider-register/service-details',
  PROVIDER_VERIFY_ACCOUNT: '/auth/provider-register/verify-account',
  PROVIDER_COVERAGE_AVAILABILITY: '/auth/provider-register/coverage-availability',
} as const;
