// LimpeJaApp/src/types/backend/bookings.ts

// Importar interfaces de tipagem relevantes de outros arquivos
import { ProviderDisplayInfo } from './providers';
import { Service } from './services';
import { CreateAddressDto } from './auth';

/**
 * @enum BookingStatus
 * Enumeração para os possíveis status de um agendamento.
 * Deve ser consistente com o enum BookingStatus no backend (@prisma/client).
 */
export enum BookingStatus {
  PENDING = 'PENDING',
  CONFIRMED = 'CONFIRMED',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
  PENDING_DISPUTE = 'PENDING_DISPUTE',
  RESCHEDULED = 'RESCHEDULED',
  IN_PROGRESS = 'IN_PROGRESS',
  REJECTED = 'REJECTED',
  NO_SHOW = 'NO_SHOW',
  PENDING_PROVIDER_CONFIRMATION = 'PENDING_PROVIDER_CONFIRMATION', // Adicionado
}

/**
 * @interface BookingAddress
 * Representa o endereço de um agendamento.
 * Alinhado com o Address do backend.
 */
export interface BookingAddress {
  cep: string;
  street: string;
  number: string;
  complement: string | null;
  neighborhood: string;
  city: string;
  state: string;
  latitude?: number;
  longitude?: number;
}

/**
 * @interface CreateBookingDto
 * DTO para criar um novo agendamento (POST /bookings).
 * Alinhado com o que o bookings.service.ts espera.
 */
export interface CreateBookingDto {
  providerId: string;
  providerServiceId: string;
  scheduledDate: string;
  scheduledTime: string;
  totalPrice: number;
  notes?: string | null;
  address: CreateAddressDto;
  requestedDurationMinutes?: number;
  requestedSquareMeters?: number;
  requestedRoomCount?: number;
  couponCode?: string; // NOVO: Adicionado para permitir o envio do código do cupom
}

/**
 * @interface BookingDetails
 * Representa um agendamento completo retornado pelo backend para exibição no frontend.
 * Esta é a versão "achatada" do BookingWithDetailsRelations do backend.
 */
export interface BookingDetails {
  id: string;
  status: BookingStatus;

  scheduledDate: string;
  scheduledTime: string;
  scheduledEndTime?: string;

  totalPrice: number;
  notes?: string | null;
  createdAt: string;
  updatedAt: string;

  // Dados do Cliente
  clientId: string;
  clientFullName: string;
  clientEmail: string;
  clientAvatarUrl?: string | null;

  // Dados do Provedor
  providerId: string;
  providerFullName: string;
  providerEmail: string;
  providerAvatarUrl?: string | null;

  // Dados do Serviço do Provedor
  providerServiceId: string;
  serviceId: string;
  serviceName: string;
  serviceDescription?: string | null;
  servicePrice: number;
  serviceDurationMinutes?: number | null;

  // Dados do Endereço do Agendamento
  address: BookingAddress;

  // Dados da Avaliação (review), se existir
  reviewId?: string | null;
  reviewRating?: number | null;
  reviewComment?: string | null;
  isReviewed?: boolean;

  // Novas relações incluídas no BookingWithDetailsRelations
  subscriptionId?: string | null;
  incidents?: any[];
  guaranteeClaims?: any[];
  couponId?: string | null; // NOVO: ID do cupom aplicado
  discountAmount?: number | null; // NOVO: Valor do desconto aplicado pelo cupom
}

/**
 * @interface UpdateBookingStatusDto
 * DTO para atualizar o status de um agendamento (PATCH /bookings/:id/status).
 * Alinhado com o que o bookings.service.ts espera.
 */
export interface UpdateBookingStatusDto {
  status: BookingStatus;
  reason?: string;
}

/**
 * NOVO: Tipagem para o cupom aplicado.
 */
export type AppliedCoupon = {
  code: string;
  kind: 'PERCENT' | 'FIXED';
  value: number;
};

/**
 * NOVO: Tipagem para detalhes de precificação de um agendamento.
 */
export type BookingPricing = {
  subtotal: number;
  discountValue?: number;
  total: number;
  appliedCoupon?: AppliedCoupon;
};