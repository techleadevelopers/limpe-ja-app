// LimpeJaApp/src/types/backend/bookings.ts

// Importar interfaces de tipagem relevantes de outros arquivos
import { ProviderDisplayInfo, ServiceDetailsDto } from './providers'; // Importar ProviderDisplayInfo e ServiceDetailsDto

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
  RESCHEDULED = 'RESCHEDULED',
  PENDING_PROVIDER_CONFIRMATION = 'PENDING_PROVIDER_CONFIRMATION',
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
  address: BookingAddress; // Essa linha deve estar presente e sem comentário
}

/**
 * @interface BookingDetails
 * Representa um agendamento completo retornado pelo backend para exibição no frontend.
 * Esta é a versão "achatada" do BookingWithDetailsRelations do backend.
 */
export interface BookingDetails {
  id: string;
  status: BookingStatus; // Usar o enum definido
  scheduledDate: string; // Data agendada (YYYY-MM-DD)
  scheduledTime: string; // Hora agendada (HH:mm)
  totalPrice: number;
  notes?: string | null;
  createdAt: string; // ISO 8601 string
  updatedAt: string; // ISO 8601 string

  // Dados do Cliente (achatados do client.user)
  clientId: string;
  clientFullName: string;
  clientEmail: string;

  // Dados do Provedor (achatados do provider.user e provider)
  providerId: string;
  providerFullName: string;
  providerEmail: string;
  providerAvatarUrl?: string | null; // Adicionado, se o backend o incluir

  // Dados do Serviço do Provedor (achatados do providerService.service e providerService)
  providerServiceId: string; // ID do ProviderService
  serviceName: string; // Nome do serviço (ex: "Limpeza Padrão")
  serviceDescription?: string | null; // Descrição do serviço
  servicePrice: number; // Preço do serviço específico do provedor
  serviceDurationMinutes?: number | null; // Duração do serviço específico do provedor

  // Dados do Endereço do Agendamento (se for específico do agendamento ou do cliente)
  address?: BookingAddress; // Essa linha deve estar presente para receber o endereço do backend

  // Dados da Avaliação (review), se existir
  reviewId?: string | null;
  reviewRating?: number | null;
  reviewComment?: string | null;
}

/**
 * @interface UpdateBookingStatusDto
 * DTO para atualizar o status de um agendamento (PATCH /bookings/:id/status).
 * Alinhado com o que o bookings.service.ts espera.
 */
export interface UpdateBookingStatusDto {
  status: BookingStatus; // Usar o enum BookingStatus
  reason?: string; // Opcional, para cancelamento ou rejeição
}