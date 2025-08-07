// LimpeJaApp/src/types/backend/bookings.ts

// Importar interfaces de tipagem relevantes de outros arquivos
import { ProviderDisplayInfo } from './providers';
import { Service } from './services'; // Importar Service para serviceName, etc.
import { CreateAddressDto } from './auth'; // CORREÇÃO: Usar CreateAddressDto para o endereço

/**
 * @enum BookingStatus
 * Enumeração para os possíveis status de um agendamento.
 * Deve ser consistente com o enum BookingStatus no backend (@prisma/client).
 */
export enum BookingStatus {
  PENDING = 'PENDING',
  PENDING_PROVIDER_CONFIRMATION = 'PENDING_PROVIDER_CONFIRMATION',
  CONFIRMED = 'CONFIRMED',
  COMPLETED = 'COMPLETED',
  CANCELED = 'CANCELED',
  PENDING_DISPUTE = 'PENDING_DISPUTE',
  RESCHEDULED = 'RESCHEDULED',
  IN_PROGRESS = 'IN_PROGRESS',
  REJECTED = 'REJECTED',
  NO_SHOW = 'NO_SHOW', // CORREÇÃO: Adicionado NO_SHOW
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
  complement?: string | null;
  neighborhood: string;
  city: string;
  state: string;
  latitude: number; // CORREÇÃO: Adicionado latitude
  longitude: number; // CORREÇÃO: Adicionado longitude
}

/**
 * @interface CreateBookingDto
 * DTO para criar um novo agendamento (POST /bookings).
 * Alinhado com o que o bookings.service.ts espera.
 */
export interface CreateBookingDto {
  providerId: string;
  providerServiceId: string; // ID do serviço específico oferecido pelo provedor
  scheduledDate: string; // Data agendada (ex: "YYYY-MM-DD")
  scheduledTime: string; // Hora agendada (ex: "HH:mm")
  totalPrice: number;
  notes?: string | null;
  address: CreateAddressDto; // CORREÇÃO: Usar CreateAddressDto
  requestedDurationMinutes?: number; // NEW: for HOURLY services
  requestedSquareMeters?: number; // NEW: for BY_SIZE services
  requestedRoomCount?: number; // NEW: for BY_SIZE services
  couponCode?: string; // CORREÇÃO: Adicionado couponCode
}

/**
 * @interface BookingDetails
 * Representa um agendamento completo retornado pelo backend para exibição no frontend.
 * Esta é a versão "achatada" do BookingWithDetailsRelations do backend.
 */
export interface BookingDetails {
  id: string;
  status: BookingStatus; // Usar o enum definido

  scheduledDate: string; // CORREÇÃO: Usar scheduledDate (ISO 8601 string)
  scheduledTime: string; // CORREÇÃO: Usar scheduledTime (HH:mm)
  // scheduledDateTime: string; // Removido, pois os campos separados são mais precisos

  totalPrice: number; // Preço total do agendamento
  notes?: string | null;
  createdAt: string; // ISO 8601 string
  updatedAt: string; // ISO 8601 string

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
  providerServiceId: string; // ID do ProviderService
  serviceId: string; // **GARANTIDO AQUI:** Este campo é necessário para resolver o erro no [bookingId].tsx
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
  isReviewed?: boolean; // Opção 1: Backend envia.

  // CORREÇÃO: Novas relações incluídas no BookingWithDetailsRelations
  subscriptionId?: string | null; // ID da assinatura, se aplicável
  incidents?: any[]; // Array de incidentes relacionados (ou tipo mais específico)
  guaranteeClaims?: any[]; // Array de solicitações de garantia (ou tipo mais específico)
  couponId?: string | null; // ID do cupom aplicado
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