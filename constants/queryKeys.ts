// LimpeJaApp/src/constants/queryKeys.ts

/**
 * Constantes para as chaves de busca do TanStack Query.
 * Isso garante tipagem forte e evita erros de digitação ao usar as chaves.
 */
export const API_QUERY_KEYS = {
  // Chaves relacionadas a provedores
  PROVIDERS: 'providers',
  PROVIDER: (id: string) => ['provider', id] as const,
  SEARCH_PROVIDERS: 'searchProviders',

  // Chaves relacionadas a serviços
  SERVICES: 'services',
  SERVICE: (id: string) => ['service', id] as const,

  // Chaves relacionadas a usuários e autenticação
  USER_PROFILE: 'userProfile',
  AUTH_STATUS: 'authStatus',

  // Chaves para agendamentos (bookings)
  BOOKINGS: 'bookings',
  BOOKING: (id: string) => ['booking', id] as const,
} as const;