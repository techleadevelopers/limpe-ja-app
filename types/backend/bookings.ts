// LimpeJaApp/src/types/backend/bookings.ts

// Importar interfaces de tipagem relevantes de outros arquivos
import { ProviderDisplayInfo } from './providers';
import { Service } from './services'; // Importar Service para serviceName, etc.

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
  CANCELED = 'CANCELED', // CORREÇÃO: Alinhado com 'CANCELED' do schema.prisma
  PENDING_DISPUTE = 'PENDING_DISPUTE',
  RESCHEDULED = 'RESCHEDULED',
  IN_PROGRESS = 'IN_PROGRESS',
  REJECTED = 'REJECTED',
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
  address: BookingAddress;
  requestedDurationMinutes?: number; // NEW: for HOURLY services
  requestedSquareMeters?: number; // NEW: for BY_SIZE services
  requestedRoomCount?: number; // NEW: for BY_SIZE services
}

/**
 * @interface BookingDetails
 * Representa um agendamento completo retornado pelo backend para exibição no frontend.
 * Esta é a versão "achatada" do BookingWithDetailsRelations do backend.
 */
export interface BookingDetails {
  id: string;
  status: BookingStatus; // Usar o enum definido

  scheduledDateTime: string; // Data e hora agendadas, combinadas em uma string ISO 8601

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