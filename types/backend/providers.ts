import { Service, PricingType } from './services'; // Import PricingType e Service
import { BookingAddress } from './bookings'; // CORREÇÃO: Importar BookingAddress
import { VerificationStatus } from './auth'; // CORREÇÃO: Importar VerificationStatus

/**
 * @interface ProviderAvailability
 * Tipo para a disponibilidade do provedor (conforme o retorno de getProviderAvailability)
 */
export type ProviderAvailability = {
  dayOfWeek: number; // 0 para Domingo, 1 para Segunda, etc.
  startTime: string; // Ex: "09:00"
  endTime: string;   // Ex: "17:00"
};

/**
 * @interface ProviderServiceOffering
 * Representa um serviço específico oferecido por um provedor, incluindo detalhes do tipo de serviço.
 */
export interface ProviderServiceOffering {
  id: string;
  providerId: string;
  serviceId: string;
  price: number;
  durationMinutes?: number | null; // Permitir null
  description?: string | null; // Permitir null
  pricingType: PricingType; // NEW: Pricing type
  pricePerSquareMeter?: number | null; // NEW: Price per square meter
  pricePerRoom?: number | null; // NEW: Price per room
  service: Service; // Details about the service category
}

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
  providerServices?: ProviderServiceOffering[];
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
  providerServices?: ProviderServiceOffering[];
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