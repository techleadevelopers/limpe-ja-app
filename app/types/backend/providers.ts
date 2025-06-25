// LimpeJaApp/src/types/backend/providers.ts

// =========================================================================
// INTERFACES PRINCIPAIS DE PROVEDORES
// =========================================================================

// Definir o enum VerificationStatus para uso no frontend
export enum VerificationStatus {
  PENDING_INITIAL_REVIEW = 'PENDING_INITIAL_REVIEW',
  PENDING_DOCUMENTS_UPLOAD = 'PENDING_DOCUMENTS_UPLOAD',
  PENDING_BACKGROUND_CHECK = 'PENDING_BACKGROUND_CHECK',
  PENDING_MANUAL_REVIEW = 'PENDING_MANUAL_REVIEW',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
  BLOCKED = 'BLOCKED',
}

/**
 * @interface ServiceDetailsDto
 * Representa os detalhes de um tipo de serviço base (não o oferecido por um provedor específico).
 * Alinhado com o modelo `Service` do Prisma.
 */
export interface ServiceDetailsDto {
  id: string;
  name: string;
  description?: string | null;
  icon?: string | null;
  createdAt: string;
  updatedAt: string;
  price: number; // Preço base do serviço (já é number no DTO do backend)
}

/**
 * @interface ProviderServiceOffering
 * Representa um serviço específico oferecido por um provedor, incluindo detalhes do serviço base.
 * Corresponde à estrutura `ProviderService & { service: Service }` do backend.
 */
export interface ProviderServiceOffering {
  id: string; // ID do ProviderService (a relação entre provedor e serviço)
  providerId: string;
  serviceId: string; // ID do Service base
  price: number; // Preço que este provedor cobra por este serviço (já é number)
  durationMinutes?: number | null; // Duração que este provedor leva para este serviço
  description?: string | null; // Descrição específica do provedor para este serviço (se aplicável)
  service: ServiceDetailsDto; // Detalhes do serviço base
  createdAt: string;
  updatedAt: string;
}

/**
 * @interface ProviderDisplayInfo
 * Representa os detalhes completos de um provedor para exibição no frontend.
 * Corresponde ao `ProviderWithCalculatedRating` do backend.
 *
 * CORREÇÃO: Adicionado 'distance' para uso em componentes de exibição de lista.
 * CORREÇÃO: Adicionado 'reviews' para alinhamento com o uso no frontend.
 * CORREÇÃO: Adicionado 'pixKey' para o PIX.
 * CORREÇÃO: Alterado 'profilePictureUrl' para 'avatarUrl' para consistência.
 * CORREÇÃO: Usando 'verificationStatus' em vez de 'verified'.
 */
export interface ProviderDisplayInfo {
  id: string;
  fullName: string;
  email: string; // Vem de user.email
  avatarUrl?: string | null; // <-- RENOMEADO DE profilePictureUrl PARA avatarUrl
  phone?: string | null;
  bio?: string | null;
  // CORREÇÃO AQUI: Usando verificationStatus no lugar de verified
  verificationStatus: VerificationStatus; // <--- O CAMPO VERIFICADO AGORA É verificationStatus
  averageRating: number; // Calculado no backend
  reviewCount: number; // Calculado no backend
  yearsOfExperience?: number | null;
  cpf: string;
  dateOfBirth: string; // ISO string

  // Inclui campos do Address (agora não opcional, pois o DTO backend sempre inclui)
  address: {
    id: string;
    cep: string;
    street: string;
    number: string;
    complement?: string | null;
    neighborhood: string;
    city: string; // Geralmente obrigatório
    state: string; // Geralmente obrigatório
  } | null; // Pode ser null se o provedor não tiver endereço

  // Inclui serviços que o provedor oferece
  providerServices: ProviderServiceOffering[];

  createdAt: string; // Data de criação do provedor (ISO string)
  updatedAt: string; // Data da última atualização do provedor (ISO string)

  // Adicionado para uso em componentes de cartão/lista, como o ProviderCard
  distance?: string; // Distância do provedor até o cliente (calculado no frontend ou retornado pelo backend em buscas de localização)

  // CORREÇÃO: Adicionado o array de reviews
  reviews?: ProviderReview[]; // Reviews do provedor, opcional se nem sempre for carregado

  pixKey?: string; // <-- ADICIONADO: Chave PIX do provedor
}

// =========================================================================
// INTERFACES PARA OPERAÇÕES (Criação, Atualização, Busca)
// =========================================================================

/**
 * @interface ProviderSearchQuery
 * Interface para os parâmetros de busca de provedores.
 * Corresponde ao `ProviderSearchDto` do backend.
 */
export interface ProviderSearchQuery {
  searchTerm?: string;
  serviceId?: string;
  location?: string; // Para busca textual de endereço (cidade, estado, etc.)
  minRating?: number;
  limit?: number;
  offset?: number;
  sortBy?: 'rating' | 'experience';
}

/**
 * @interface UpdateProviderProfileData
 * DTO para atualizar o perfil do provedor.
 * Corresponde ao `UpdateProviderProfileDto` do backend.
 */
export interface UpdateProviderProfileData {
  fullName?: string;
  phone?: string;
  avatarUrl?: string;
  yearsOfExperience?: number;
  bio?: string;
  cpf?: string;
  dateOfBirth?: string; // ISO string
  address?: {
    id?: string; // ID opcional para atualização de endereço existente
    cep?: string;
    street?: string;
    number?: string;
    complement?: string;
    neighborhood: string;
    city: string; // Geralmente obrigatório
    state: string; // Geralmente obrigatório
  };
}

/**
 * @interface CreateProviderServiceData
 * DTO para adicionar um novo serviço à lista de serviços oferecidos por um provedor.
 * Corresponde ao `CreateProviderServiceDto` do backend.
 */
export interface CreateProviderServiceData {
  serviceId: string;
  price: number;
  durationMinutes?: number;
}

/**
 * @interface UpdateProviderServiceData
 * DTO para atualizar um serviço específico oferecido por um provedor.
 * Corresponde ao `UpdateProviderServiceDto` do backend.
 */
export interface UpdateProviderServiceData {
  price?: number;
  durationMinutes?: number;
}

/**
 * @interface ProviderAvailability
 * Representa um slot de disponibilidade de um provedor.
 * Alinhado com o modelo `ProviderAvailability` do Prisma.
 */
export interface ProviderAvailability {
  id: string;
  providerId: string;
  dayOfWeek: number; // 0 para Domingo, 1 para Segunda, etc.
  startTime: string; // Ex: "09:00"
  endTime: string;  // Ex: "17:00"
  isAvailable: boolean;
  createdAt: string;
  updatedAt: string;
}

/**
 * @interface UpdateAvailabilityData
 * DTO para atualizar ou adicionar um slot de disponibilidade.
 * Corresponde ao `UpdateAvailabilityDto` do backend.
 */
export interface UpdateAvailabilityData {
  id?: string; // ID opcional para permitir o envio do ID ao backend (para atualização)
  providerId?: string; // (opcional, pode ser inferido pelo contexto)
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  isAvailable: boolean;
}

// =========================================================================
// INTERFACES PARA DASHBOARD E TRANSAÇÕES
// =========================================================================

/**
 * @interface ProviderReview
 * Representa uma avaliação de um provedor.
 * Alinhado com a estrutura de reviews em `ProviderWithIncludes` do backend.
 *
 * CORREÇÃO: Atualizado a estrutura de 'client' para incluir 'id' e 'user'
 * conforme o erro de tipagem no componente ReviewCard.
 * ADICIONADO: 'user' dentro de 'client' pode ser null se o cliente não tiver um user.
 */
export interface ProviderReview {
  id: string;
  rating: number;
  comment?: string | null;
  // CORREÇÃO: Client com mais detalhes para compatibilidade com ReviewCard
  // MUDANÇA IMPORTANTE: client pode ser nulo se a relação não for carregada ou for inválida
  // E user dentro de client também pode ser nulo/indefinido.
  client: {
    id: string; // ID do cliente
    fullName: string;
    user?: { // Detalhes do usuário associado ao cliente - TORNADO OPCIONAL
      id: string;
      avatarUrl?: string | null;
    };
  } | null; // <--- TORNADO OPCIONAL: O OBJETO CLIENT PODE SER NULO
  createdAt: string; // ISO string
  bookingId: string;
  providerId: string;
}

/**
 * @interface ProviderDashboard
 * REPRESENTA OS DADOS DO PAINEL DE CONTROLE DO PROVEDOR.
 * Corresponde ao `DashboardDto` do backend.
 * ATUALIZADO: Alinhado com o `DashboardDto` do backend, incluindo `fullName` e `totalEarnings`.
 * Mantém `recentReviews` e `unreadMessagesCount` se o backend os enviar.
 */
export interface ProviderDashboard {
  fullName: string; // <-- Adicionado para corresponder ao backend
  upcomingBookings?: any[]; // Tipo 'any' temporário, pois bookings são carregados separadamente no frontend
  totalEarnings: number; // <-- Adicionado para corresponder ao backend
  pendingWithdrawals: number;
  recentReviews?: ProviderReview[]; // Manter se o backend vai enviar isso via DashboardDto
  unreadMessagesCount?: number; // Manter se o backend vai enviar isso via DashboardDto
}

/**
 * @interface ProviderTransaction
 * Representa uma transação financeira relacionada ao provedor.
 * Alinhado com o modelo `Transaction` do Prisma.
 */
export interface ProviderTransaction {
  id: string;
  type: 'PAYMENT' | 'WITHDRAWAL' | 'COMMISSION'; // Alinhado com TransactionType do backend
  amount: number; // No backend é Decimal, no frontend será number
  status: string; // Status da transação (e.g., "PENDING", "COMPLETED", "FAILED")
  createdAt: string; // ISO string
  description?: string | null;
  providerId: string;
  bookingId?: string | null; // <--- CORREÇÃO AQUI: ADICIONADO bookingId como opcional/nullable
  updatedAt: string;
}

/**
 * @interface WithdrawalRequestDto
 * DTO para solicitar um saque.
 * Alinhado com o `WithdrawalRequestDto` do backend.
 */
export interface WithdrawalRequestDto { // <-- CORREÇÃO: Adicionado 'export'
  amount: number;
  withdrawalAccountInfo?: string; // Informações da conta para saque (ex: chave PIX)
}

/**
 * @interface WithdrawalResponseDto
 * DTO para a resposta de uma solicitação de saque.
 * Alinhado com o `WithdrawalResponseDto` do backend.
 */
export interface WithdrawalResponseDto { // <-- CORREÇÃO: Adicionado 'export'
  success: boolean;
  message: string;
  transactionId?: string; // ID da transação criada no backend
}

/**
 * @interface EarningsResponseDto
 * DTO para a resposta completa do endpoint de ganhos do provedor.
 * Alinhado com o `EarningsResponseDto` do backend.
 */
export interface EarningsResponseDto { // <-- CORREÇÃO: Adicionado 'export'
    totalEarnings: number;
    availableForWithdrawal: number;
    pendingWithdrawals: number;
    recentTransactions: ProviderTransaction[];
    earningsBreakdown: { [period: string]: number };
}

export type Provider = ProviderDisplayInfo;