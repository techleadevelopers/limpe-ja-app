// LimpeJaApp/src/types/backend/providers.ts

import { Service, PricingType } from './services'; // Import PricingType e Service
import { BookingAddress } from './bookings'; // CORREÇÃO: Importar BookingAddress
import { VerificationStatus } from './auth'; // CORREÇÃO: Importar VerificationStatus
import { UserProfile } from './users'; // Importar UserProfile, necessário para ProviderDashboard se ela contiver o perfil do usuário
import { ProviderServiceOffering } from './provider-service'; // <--- CORREÇÃO: Importar de novo arquivo (CORRETO)

/**
 * @interface ProviderAvailability
 * Tipo para a disponibilidade do provedor (conforme o retorno de getProviderAvailability)
 */
export type ProviderAvailability = {
  id?: string; // Adicionado ID para operações de atualização/exclusão
  dayOfWeek: number; // 0 para Domingo, 1 para Segunda, etc.
  startTime: string; // Ex: "09:00"
  endTime: string;   // Ex: "17:00"
};

/*
 * REMOVIDO: A definição de ProviderServiceOffering foi movida para './provider-service.ts'
 *
 * /**
 *  * @interface ProviderServiceOffering
 *  * Representa um serviço específico oferecido por um provedor, incluindo detalhes do tipo de serviço.
 *  * /
 * export interface ProviderServiceOffering {
 *   id: string;
 *   providerId: string;
 *   serviceId: string;
 *   price: number;
 *   durationMinutes?: number | null; // Permitir null
 *   description?: string | null; // Permitir null
 *   pricingType: PricingType; // NEW: Pricing type
 *   pricePerSquareMeter?: number | null; // NEW: Price per square meter
 *   pricePerRoom?: number | null; // NEW: Price per room
 *   service: Service; // Details about the service category
 * }
 */

/**
 * @interface ProviderDisplayInfo
 * Representa um provedor com informações essenciais para exibição no frontend.
 * Contém dados "achatados" para fácil consumo.
 */
export interface ProviderDisplayInfo {
  id: string;
  userId: string;
  fullName: string;
  email: string;
  avatarUrl?: string | null; // Permitir null
  phone?: string | null; // Permitir null
  bio?: string | null; // Permitir null
  verificationStatus: VerificationStatus; // CORREÇÃO: Usar o enum VerificationStatus
  address?: BookingAddress | null; // CORREÇÃO: Usar BookingAddress e permitir null
  providerServices?: ProviderServiceOffering[]; // Agora usa a interface importada
  averageRating: number;
  reviewCount: number;
  yearsOfExperience?: number | null; // Permitir null
  fiveStarReviewCount?: number; // NEW: Number of 5-star reviews (tornar opcional se o backend não garantir sempre)
  monthlyBookingsCount?: number; // NEW: Number of bookings this month (tornar opcional se o backend não garantir sempre)
  cpf?: string | null; // Permitir null
  dateOfBirth?: string | null; // Permitir null
  createdAt: string;
  updatedAt: string;
  pixKey?: string | null; // Permitir null
  distance?: number | null; // Optional, for geographical searches, permitir null
  documentPhotoFrontUrl?: string | null; // Permitir null
  documentPhotoBackUrl?: string | null; // Permitir null
  selfieWithDocumentUrl?: string | null; // Permitir null
  backgroundCheckResult?: any | null; // Prisma.JsonValue, permitir null
  rejectionReason?: string | null; // Permitir null
  ocrResult?: any | null; // Prisma.JsonValue, permitir null
  livenessResult?: any | null; // Prisma.JsonValue, permitir null
  reviews?: ProviderReview[]; // Recent reviews for display
}

/**
 * @type ProviderDetails
 * Alias para ProviderDisplayInfo, usado para importações em outros módulos.
 */
export type ProviderDetails = ProviderDisplayInfo; // <--- CORREÇÃO: Nova exportação

/**
 * @interface ProviderWithCalculatedRating
 * Estende o tipo Provider para incluir campos calculados (averageRating, reviewCount)
 * e todas as relações necessárias para construir o ProviderDisplayInfo.
 * Usado no backend para mapeamento.
 * NOTA: Esta interface é muito similar a ProviderDisplayInfo e pode ser redundante.
 * Considere usar apenas ProviderDisplayInfo se ela já contém todos os campos necessários.
 */
export type ProviderWithCalculatedRating = {
  id: string;
  userId: string;
  fullName: string;
  email: string;
  avatarUrl?: string | null; // Permitir null
  phone?: string | null; // Permitir null
  bio?: string | null; // Permitir null
  verificationStatus: VerificationStatus; // CORREÇÃO: Usar o enum VerificationStatus
  address?: BookingAddress | null; // CORREÇÃO: Usar BookingAddress e permitir null
  providerServices?: ProviderServiceOffering[]; // Agora usa a interface importada
  averageRating: number;
  reviewCount: number;
  yearsOfExperience?: number | null; // Permitir null
  fiveStarReviewCount?: number; // NEW: Number of 5-star reviews (tornar opcional se o backend não garantir sempre)
  monthlyBookingsCount?: number; // NEW: Number of bookings this month (tornar opcional se o backend não garantir sempre)
  cpf?: string | null; // Permitir null
  dateOfBirth?: string | null; // Permitir null
  createdAt: string;
  updatedAt: string;
  pixKey?: string | null; // Permitir null
  distance?: number | null;
  documentPhotoFrontUrl?: string | null; // Permitir null
  documentPhotoBackUrl?: string | null; // Permitir null
  selfieWithDocumentUrl?: string | null; // Permitir null
  backgroundCheckResult?: any | null; // Permitir null
  rejectionReason?: string | null; // Permitir null
  ocrResult?: any | null; // Permitir null
  livenessResult?: any | null; // Permitir null
};

/**
 * @interface ProviderReview
 * Representa uma avaliação de um provedor, incluindo informações do cliente.
 */
export interface ProviderReview {
  id: string;
  rating: number;
  comment?: string | null; // Permitir null
  createdAt: string;
  updatedAt: string;
  bookingId: string;
  clientId: string;
  providerId: string;
  client?: { // Cliente que fez a avaliação
    id: string;
    fullName: string;
    user?: {
      id: string;
      avatarUrl?: string | null; // Permitir null
    } | null; // Permitir null
  } | null; // Permitir null
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
  price: number;
  durationMinutes?: number;
  description?: string;
  pricingType: PricingType;
  pricePerSquareMeter?: number;
  pricePerRoom?: number;
}

/**
 * @interface UpdateProviderServiceData
 * DTO para atualizar um serviço oferecido por um provedor.
 * Corresponde ao PATCH /providers/:providerId/services/:id
 */
export interface UpdateProviderServiceData {
  price?: number;
  durationMinutes?: number;
  description?: string;
  pricingType?: PricingType;
  pricePerSquareMeter?: number;
  pricePerRoom?: number;
}

/**
 * @interface UpdateAvailabilityData
 * DTO para adicionar ou atualizar a disponibilidade de um provedor.
 * Corresponde ao POST/PATCH /providers/:providerId/availability
 */
export interface UpdateAvailabilityData {
  id?: string; // Opcional para criação, obrigatório para atualização
  dayOfWeek: number;
  startTime: string; // Ex: "09:00"
  endTime: string;   // Ex: "17:00"
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
  phone?: string;
  avatarUrl?: string | null;
  bio?: string;
  yearsOfExperience?: number;
  pixKey?: string;
  // Adicione outros campos que podem ser atualizados no perfil do provedor
  // Ex: address?: CreateAddressDto;
  // Ex: documentPhotoFrontUrl?: string;
  // Ex: documentPhotoBackUrl?: string;
  // Ex: selfieWithDocumentUrl?: string;
}

/**
 * @interface ProviderDashboard
 * DTO para os dados do painel de controle do provedor.
 * Corresponde ao GET /providers/me/dashboard
 */
export interface ProviderDashboard {
  totalEarnings?: number;
  upcomingBookingsCount?: number;
  completedBookingsCount?: number;
  averageRating?: number;
  recentReviews?: ProviderReview[];
  // Adicione outros campos relevantes para o dashboard
  userProfile?: UserProfile; // Exemplo: pode incluir o perfil completo do usuário
}

/**
 * @interface ProviderTransaction
 * DTO para representar uma transação de um provedor (ex: ganhos).
 * Corresponde ao GET /providers/me/earnings
 */
export interface ProviderTransaction {
  id: string;
  amount: number;
  type: 'EARNING' | 'WITHDRAWAL'; // Exemplo de tipos
  description?: string;
  createdAt: string;
  // Adicione outros detalhes da transação
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
  // Adicione outros filtros de busca
  limit?: number;
  offset?: number;
  sortBy?: string; // Ex: 'rating', 'distance', 'price'
  sortOrder?: 'asc' | 'desc';
}