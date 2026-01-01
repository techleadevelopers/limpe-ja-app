// LimpeJaApp/src/types/backend/providers.ts

import { Service } from './services';
import { BookingAddress, BookingDetails } from './bookings'; // Adicionar BookingDetails
import { VerificationStatus, UserRole } from './auth'; // CORREÇÃO: Importar UserRole
import { UserProfile } from './users'; // CORREÇÃO: Importar UserProfile para usar user.isVerified
import { ProviderServiceOffering } from './provider-service';

// Importa ReviewEntity do seu local canônico.
// Ajuste o caminho conforme a estrutura real do seu projeto se necessário.
import { ReviewEntity } from './reviews'; // <-- Importação adicionada/ajustada

// CORREÇÃO: Re-exportar ProviderServiceOffering para que outros módulos possam importá-lo daqui
export { ProviderServiceOffering };

/**
 * NOVO: Tipagem para as métricas de performance do provedor.
 * Adicionado conforme o relatório.
 */
export interface ProviderMetrics {
  acceptanceRate: number;
  averageResponseTime: number; // <<-- CORREÇÃO: Alterado de 'avgResponseTime' para 'averageResponseTime'
  totalBookings: number; // <<-- CORREÇÃO: Adicionado 'totalBookings' aqui para resolver o erro
}

// CORREÇÃO: Definir e exportar TransactionType
export enum TransactionType {
  PAYMENT = 'PAYMENT', // Corresponde ao Pagamento de Serviço (ou EARNING)
  WITHDRAWAL = 'WITHDRAWAL', // Corresponde ao Saque Solicitado
  COMMISSION = 'COMMISSION', // Corresponde à Comissão
  // Adicione outros tipos de transação se existirem no backend
}

/**
 * @interface ProviderAvailability
 * Tipo para a disponibilidade do provedor (conforme o retorno de getProviderAvailability)
 */
export type ProviderAvailability = {
  id?: string;
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  isAvailable: boolean; // ADICIONADO: Propriedade 'isAvailable'
};

/**
 * @interface ProviderDisplayInfo
 * Representa um provedor com informações essenciais para exibição no frontend.
 * Contém dados "achatados" para fácil consumo.
 * NOVO: Adicionados campos opcionais para sinais premium (alinhado com relatório: verificationStatus, acceptanceRate, averageResponseTime, nextAvailable, badges).
 */
export interface ProviderDisplayInfo {
  id: string;
  userId: string;
  fullName: string;
  email: string;
  avatarUrl?: string | null;
  phone?: string | null;
  bio?: string | null;
  verificationStatus?: VerificationStatus; // NOVO: Opcional para selo verificado nos cards
  address?: BookingAddress | null; // CORREÇÃO: BookingAddress agora tem lat/lon
  providerServices?: ProviderServiceOffering[];
  averageRating: number;
  reviewCount: number;
  yearsOfExperience?: number | null;
  fiveStarReviewCount?: number;
  monthlyBookingsCount?: number;
  cpf?: string | null;
  dateOfBirth?: string | null;
  createdAt: string;
  updatedAt: string;
  pixKey?: string | null;
  distance?: number | null;
  documentPhotoFrontUrl?: string | null;
  documentPhotoBackUrl?: string | null;
  selfieWithDocumentUrl?: string | null;
  backgroundCheckResult?: any | null;
  rejectionReason?: string | null;
  ocrResult?: any | null;
  livenessResult?: any | null;
  reviews?: ReviewEntity[]; // <<-- CORREÇÃO: Alterado para ReviewEntity[]
  badges?: string[]; // CORREÇÃO: Adicionado badges (opcional para consistência com relatório)
  user: { // CORREÇÃO: Adicionado objeto user com isVerified
    email: string;
    role: UserRole;
    isVerified: boolean;
  };
  metrics?: ProviderMetrics; // NOVO: Adicionado métricas ao ProviderDisplayInfo
  termsAcceptedAt?: string | null;
  termsVersion?: string | null;
  // NOVOS CAMPOS ADICIONADOS PARA RESOLVER ERROS DE TIPAGEM NOS COMPONENTES E RELATÓRIO
  acceptanceRate?: number; // Adicionado para PrestadorCard e RecomendacaoCard (métricas mini)
  averageResponseTime?: number; // Adicionado para PrestadorCard e RecomendacaoCard (métricas mini, componentes usam este nome)
  minPrice?: number; // NOVO: Preço mínimo pré-calculado de um serviço oferecido pelo provedor
  // NOVOS CAMPOS PARA SINAIS PREMIUM (opcionais, sem quebrar compatibilidade, conforme relatório)
  nextAvailable?: { date: string; time: string }; // Ex.: { date: '2025-09-29', time: '09:00' } — para chip de horário
}

/**
 * @type ProviderDetails
 * Alias para ProviderDisplayInfo, usado para importações em outros módulos.
 */
export type ProviderDetails = ProviderDisplayInfo;

/**
 * @interface ProviderWithCalculatedRating
 * Estende o tipo Provider para incluir campos calculados (averageRating, reviewCount)
 * e todas as relações necessárias para construir o ProviderDisplayInfo.
 * Usado no backend para mapeamento.
 * NOVO: Adicionados campos opcionais para sinais premium (alinhado com ProviderDisplayInfo).
 * NOTA: Esta interface é muito similar a ProviderDisplayInfo e pode ser redundante.
 * Considere usar apenas ProviderDisplayInfo se ela já contém todos os campos necessários.
 */
export type ProviderWithCalculatedRating = {
  id: string;
  userId: string;
  fullName: string;
  email: string;
  avatarUrl?: string | null;
  phone?: string | null;
  bio?: string | null;
  verificationStatus?: VerificationStatus; // NOVO: Opcional para selo verificado
  address?: BookingAddress | null; // CORREÇÃO: BookingAddress agora tem lat/lon
  providerServices?: ProviderServiceOffering[];
  averageRating: number;
  reviewCount: number;
  yearsOfExperience?: number | null;
  fiveStarReviewCount?: number;
  monthlyBookingsCount?: number;
  cpf?: string | null;
  dateOfBirth?: string | null;
  createdAt: string;
  updatedAt: string;
  pixKey?: string | null;
  distance?: number | null;
  documentPhotoFrontUrl?: string | null;
  documentPhotoBackUrl?: string | null;
  selfieWithDocumentUrl?: string | null;
  backgroundCheckResult?: any | null;
  rejectionReason?: string | null;
  ocrResult?: any | null;
  livenessResult?: any | null;
  badges?: string[]; // CORREÇÃO: Adicionado badges (opcional)
  user: { // CORREÇÃO: Adicionado objeto user com isVerified
    email: string;
    role: UserRole;
    isVerified: boolean;
  };
  // NOVOS CAMPOS ADICIONADOS PARA ALINHAR COM ProviderDisplayInfo, se necessário no backend
  acceptanceRate?: number; // NOVO: Para métricas mini
  averageResponseTime?: number; // NOVO: Para métricas mini
  minPrice?: number; // NOVO: Preço mínimo pré-calculado de um serviço oferecido pelo provedor
  // NOVOS CAMPOS PARA SINAIS PREMIUM (opcionais)
  nextAvailable?: { date: string; time: string }; // NOVO: Para chip de horário
};

/**
 * @interface ProviderReview
 * Representa uma avaliação de um provedor, incluindo informações do cliente.
 * <<-- CORREÇÃO: Alterado para ser um alias de ReviewEntity para consistência
 */
export type ProviderReview = ReviewEntity;

/**
 * @interface Offer
 * Representa uma oferta ou promoção.
 * <<-- CORREÇÃO: Adicionado e exportado 'Offer' aqui para resolver o erro
 */
export interface Offer {
  id: string;
  title: string;
  description: string;
  couponCode: string | null;
  discountType: 'PERCENT' | 'FIXED';
  discountValue: number;
  startDate: string;
  endDate: string;
}

// =========================================================================
// NOVAS INTERFACES EXPORTADAS PARA RESOLVER OS ERROS
// =========================================================================

/**
 * @interface CreateProviderServiceData
 * DTO para criar um novo serviço oferecido por um provedor.
 * Corresponde ao POST /providers/:providerId/services
 */
export interface CreateProviderServiceData {
  serviceId: string;
  pricePerHour: number;
  durationMinutes?: number;
  description?: string;
}

/**
 * @interface UpdateProviderServiceData
 * DTO para atualizar um serviço oferecido por um provedor.
 * Corresponde ao PATCH /providers/:providerId/services/:id
 */
export interface UpdateProviderServiceData {
  pricePerHour?: number;
  durationMinutes?: number;
  description?: string;
}

/**
 * @interface UpdateAvailabilityData
 * DTO para adicionar ou atualizar a disponibilidade de um provedor.
 * Corresponde ao POST/PATCH /providers/:providerId/availability
 */
export interface UpdateAvailabilityData {
  id?: string;
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  isAvailable: boolean; // ADICIONADO: Propriedade 'isAvailable'
}

/**
 * @interface GetProviderAvailabilityResponse
 * Interface para o tipo de retorno de getProviderAvailability (movido de providerService.ts)
 */
export interface GetProviderAvailabilityResponse { // MOVIDO PARA CÁ
  available: ProviderAvailability[]; // Slots de tempo configurados pelo provedor
  occupiedTimes: string[];         // Horários já agendados/ocupados
}

/**
 * @interface UpdateProviderProfileData
 * DTO para atualizar o perfil do provedor.
 * Corresponde ao PATCH /providers/me
 * NOTA: Esta é a mesma que UpdateProviderProfileDto em auth.ts, mas mantida aqui para consistência
 * com o contexto de provedores. Idealmente, você pode ter uma única fonte.
 */
export interface UpdateProviderProfileData {
  fullName?: string;
  phone?: string | null;
  avatarUrl?: string | null; // Agora espera uma URL válida
  bio?: string;
  yearsOfExperience?: number;
  pixKey?: string;
  address?: Partial<BookingAddress> | null; // CORREÇÃO: Adicionado address
}

/**
 * @interface ProviderDashboard
 * DTO para os dados do painel de controle do provedor.
 * Corresponde ao GET /providers/me/dashboard
 */
export interface ProviderDashboard {
  fullName: string; // Adicionado para exibir o nome do provedor no DashboardHeader
  totalEarnings?: number;
  pendingWithdrawals?: number; // Adicionado para o FinancialSummaryCard
  upcomingBookings: BookingDetails[]; // Alterado para listar os agendamentos pendentes/próximos
  completedBookingsCount?: number;
  averageRating?: number;
  reviews?: ReviewEntity[]; // <<-- CORREÇÃO: Alterado para ReviewEntity[]
  userProfile?: UserProfile;
  metrics?: ProviderMetrics; // NOVO: Adicionado métricas ao dashboard
}

/**
 * @interface ProviderTransaction
 * DTO para representar uma transação de um provedor (ex: ganhos).
 * Corresponde ao GET /providers/me/earnings
 */
export interface ProviderTransaction {
  id: string;
  amount: number; // CORREÇÃO: Decimal no Prisma é number aqui
  type: TransactionType; // CORREÇÃO: Usar o enum TransactionType
  description?: string;
  createdAt: string;
  status?: string; // CORREÇÃO: Adicionado status
  bookingId?: string; // CORREÇÃO: Adicionado bookingId
}

/**
 * @interface ProviderSearchQuery
 * DTO para os parâmetros de busca de provedores.
 * Corresponde aos parâmetros de query para GET /providers
 */
export interface ProviderSearchQuery {
  serviceId?: string;
  city?: string;
  state?: string;
  minRating?: number;
  limit?: number;
  offset?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  latitude?: number; // CORREÇÃO: Adicionado latitude
  longitude?: number; // CORREÇÃO: Adicionado longitude
  radius?: number; // CORREÇÃO: Adicionado radius
  searchTerm?: string; // Adicionado para alinhar com search-results.tsx
  categoryId?: string; // Adicionado para alinhar com search-results.tsx
}

/**
 * @interface EarningsResponseDto
 * DTO para a resposta da API de ganhos do provedor.
 * Corresponde ao GET /providers/me/earnings
 */
export interface EarningsResponseDto {
  totalEarnings: number;
  availableForWithdrawal: number;
  pendingWithdrawals: number;
  dailyEarnings: number;
  weeklyEarnings: number;
  monthlyEarnings: number;
  earningsBreakdown: { [key: string]: number }; // Ex: { "Jan 2023": 1500, "Feb 2023": 2000 }
  recentTransactions: ProviderTransaction[];
}
