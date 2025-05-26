// LimpeJaApp/src/types/booking.ts
import { User } from './user'; // Supondo que User tenha id, name, etc.
import { ServiceOffering } from './service'; // Supondo que ServiceOffering tenha id, name, etc.

export type BookingStatus =
  | 'pending_provider_confirmation' // Cliente agendou, provedor precisa confirmar
  | 'confirmed'                     // Provedor confirmou
  | 'pending_client_payment'        // Se o pagamento for após a confirmação
  | 'paid_awaiting_service'         // Pago, aguardando a data do serviço
  | 'in_progress'                   // Serviço em andamento
  | 'completed'                     // Serviço concluído
  | 'cancelled_by_client'
  | 'cancelled_by_provider'
  | 'disputed'
  | 'pending_reschedule';

export interface Booking {
  id: string;
  clientId: string;
  client?: Partial<User>; // Informações do cliente (opcionalmente populadas)
  providerId: string;
  provider?: Partial<User>; // Informações do provedor (opcionalmente populadas)
  serviceOfferingId?: string; // ID do serviço específico do provedor, se aplicável
  serviceSnapshot: { // Um instantâneo dos detalhes do serviço no momento do agendamento
    name: string;
    description?: string;
    priceType: ServiceOffering['priceType'];
    priceValueAtBooking?: number; // Preço no momento do agendamento
    estimatedDurationMinutes?: number;
  };
  scheduledDateTime: string; // ISO 8601 string (ex: "2025-07-15T14:00:00Z")
  actualStartTime?: string;
  actualEndTime?: string;
  status: BookingStatus;
  address: {
    street: string;
    number: string;
    complement?: string;
    neighborhood: string;
    city: string;
    state: string;
    zipCode: string;
    // latitude?: number;
    // longitude?: number;
  };
  clientNotes?: string;   // Observações do cliente
  providerNotes?: string; // Observações do provedor (internas ou para o cliente)
  totalPrice?: number;    // Preço total calculado (pode ser após orçamento ou baseado em horas)
  currency: string;       // Ex: "BRL"
  paymentId?: string;     // Referência ao pagamento
  paymentStatus?: 'pending' | 'paid' | 'failed' | 'refunded';
  createdAt: string;
  updatedAt: string;
  // Campos para avaliação
  clientReviewId?: string;
  providerReviewId?: string;
}

// Para uma nova solicitação de agendamento (antes de se tornar um Booking completo)
export interface BookingRequestData {
  providerId: string;
  serviceOfferingId?: string; // Ou descrição do serviço se for customizado
  customServiceDescription?: string;
  preferredDate: string; // YYYY-MM-DD
  preferredTimeSlot?: string; // Ex: "Manhã (08-12h)", "14:00"
  address: Booking['address'];
  clientNotes?: string;
}