// LimpeJaApp/functions/src/types/booking.types.ts
import * as admin from "firebase-admin"; // Para FirebaseFirestore.Timestamp e FieldValue
import { OfferedService } from "./provider.types"; // Para o snapshot do serviço
// Importe UserRole se for usá-lo em cancelledBy (já deve estar em user.types.ts e exportado por types/index.ts)
import { UserRole } from "./user.types";

export type BookingStatus =
  | "pending_provider_confirmation"
  | "confirmed_by_provider"
  | "pending_payment"
  | "scheduled_paid"
  | "in_progress"
  | "completed"
  | "finalized"
  | "cancelled_by_client"
  | "cancelled_by_provider"
  | "disputed";

export interface BookedServiceSnapshot {
  serviceId?: string;
  name: string;
  description?: string;
  priceType: OfferedService['priceType']; // Usando o tipo de OfferedService
  priceValueAtBooking?: number; // Em centavos
  currency: string; // Ex: "BRL"
  estimatedDurationMinutes?: number;
}

export interface Booking {
  id?: string; // ID do documento no Firestore
  bookingId: string; // Um ID único para o agendamento
  clientId: string;
  clientName?: string; // Denormalizado para facilitar a exibição
  clientAvatarUrl?: string; // Denormalizado
  providerId: string;
  providerName?: string; // Denormalizado
  providerAvatarUrl?: string; // Denormalizado
  serviceSnapshot: BookedServiceSnapshot;
  scheduledDateTime: admin.firestore.Timestamp; // Data e hora do início do serviço
  address: {
    street: string;
    number: string;
    complement?: string;
    neighborhood: string;
    city: string;
    state: string; // UF
    zipCode: string;
  };
  clientNotes?: string;
  totalPrice?: number; // Preço total em centavos
  commissionRate?: number; // Percentual da comissão (ex: 0.20 para 20%)
  commissionValue?: number; // Valor da comissão em centavos
  providerEarnings?: number; // Valor a ser repassado ao prestador
  status: BookingStatus;
  paymentStatus?: "pending" | "paid" | "failed" | "refunded" | "payout_pending" | "payout_completed";
  paymentIntentId?: string; // ID da intenção de pagamento do gateway
  cancellationReason?: string;
  cancelledBy?: UserRole; // Usando UserRole para 'client', 'provider', 'admin'
  
  clientReviewId?: string;    
  providerReviewId?: string;  
  reminderSent?: boolean; // <<<--- ADICIONADO AQUI

  createdAt: admin.firestore.Timestamp | admin.firestore.FieldValue;
  updatedAt: admin.firestore.Timestamp | admin.firestore.FieldValue;
}

// Interface para os dados recebidos do frontend ao criar um novo agendamento
export interface BookingRequestData {
  providerId: string;
  serviceOfferingId?: string; // ID do serviço específico do provedor, se aplicável
  customServiceDescription?: string; // Se o serviço não for de um catálogo
  preferredDate: string; // Formato YYYY-MM-DD
  preferredTimeSlot?: string; // Formato HH:MM ou descrição do período
  address: Booking['address']; // Reutiliza a estrutura de endereço
  clientNotes?: string;
  // O preço pode ser calculado no backend ou vir de uma estimativa/orçamento
}