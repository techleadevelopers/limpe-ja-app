// Routes used across the app for navigation helpers.

export const AUTH_ROUTES = {
  LOGIN: '/auth/login',
  REGISTER_OPTIONS: '/auth/register-options',
  CLIENT_REGISTER: '/auth/client-register',
  PROVIDER_REGISTER_STEP1: '/auth/provider-register',
  SERVICE_DETAILS_STEP: '/auth/provider-register/service-details',
  VERIFY_ACCOUNT_STEP: '/auth/provider-register/verify-account',
} as const;

export const CLIENT_ROUTES = {
  EXPLORE: '/client/explore',
  SEARCH_RESULTS: '/client/explore/search-results',
  PROVIDER_DETAILS: (providerId: string) => `/client/explore/${providerId}` as const,
  BOOKINGS_LIST: '/client/bookings',
  BOOKING_DETAILS: (bookingId: string) => `/client/bookings/${bookingId}` as const,
  SCHEDULE_SERVICE: '/client/bookings/schedule-service',
  MESSAGES_LIST: '/client/messages',
  CHAT: (chatId: string) => `/client/messages/${chatId}` as const,
  PROFILE: '/client/profile',
  EDIT_PROFILE: '/client/profile/edit',
  MISSIONS: '/client/missions',
  SAFETY_REPORT: '/common/safety/incident-report',
} as const;

export const PROVIDER_ROUTES = {
  HOME: '/provider',
  DASHBOARD: '/provider',
  SCHEDULE: '/provider/schedule',
  MANAGE_AVAILABILITY: '/provider/schedule/manage-availability',
  SERVICES_LIST: '/provider/services',
  SERVICE_DETAILS: (serviceId: string) => `/provider/services/${serviceId}` as const,
  EARNINGS: '/provider/earnings',
  MESSAGES_LIST: '/provider/messages',
  PROVIDER_CHAT: (chatId: string) => `/provider/messages/${chatId}` as const,
  PROFILE: '/provider/profile',
  EDIT_SERVICES: '/provider/profile/edit-services',
  VERIFICATION: '/provider/verify-account',
  BOOKINGS_LIST: '/provider/active-booking',
  ACTIVE_BOOKING: '/provider/active-booking',
  WITHDRAW: '/provider/withdraw',
  REVIEWS: '/provider/reviews',
} as const;

export const COMMON_ROUTES = {
  SETTINGS: '/common/settings',
  HELP: '/common/help',
  NOTIFICATIONS: '/common/notifications',
  FEEDBACK: (targetId: string) => `/common/feedback/${targetId}` as const,
} as const;
