// LimpeJaApp/src/types/backend/bookings.ts

// Importar interfaces de tipagem relevantes de outros arquivos
import { ProviderDisplayInfo, ServiceDetailsDto } from './providers'; 

/**
 * @enum BookingStatus
 * Enumeração para os possíveis status de um agendamento.
 * Deve ser consistente com o enum BookingStatus no backend (@prisma/client).
 */
export enum BookingStatus {
  PENDING = 'PENDING',
  PENDING_PROVIDER_CONFIRMATION = 'PENDING_PROVIDER_CONFIRMATION', // Adicionado/Verificado
  CONFIRMED = 'CONFIRMED',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED', // Verificado: com dois 'L's
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
  // --- ADICIONADO/AJUSTADO: isReviewed para corresponder à expectativa do frontend ---
  // Se o backend NUNCA retornar 'isReviewed' diretamente,
  // remova esta linha e derive 'isReviewed' no frontend de '!!reviewId'
  isReviewed?: boolean; // Opção 1: Backend envia.
}

// REMOVER OU COMENTAR esta linha se você não usa 'Booking' como um tipo separado em outros lugares.
// SE VOCÊ AINDA USA 'Booking' EM ALGUM LUGAR, certifique-se de que ela EXTENDE BookingDetails
// E ADICIONE isReviewed aqui, se for para ser uma propriedade DO OBJETO DE DADOS,
// e não uma derivação do frontend.
export interface Booking extends BookingDetails {
  // Se isReviewed é uma propriedade que virá do backend, adicione-a aqui.
  // Caso contrário, remova-a daqui e derive-a no componente (!!booking.reviewId)
  isReviewed?: boolean;
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