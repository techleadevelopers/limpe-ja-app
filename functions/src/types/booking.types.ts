// LimpeJaApp/functions/src/types/booking.types.ts
import * as admin from "firebase-admin";
import { OfferedService } from "./provider.types";
import { UserRole } from "./user.types"; // Correct import path for UserRole

export type BookingStatus =
    | "pending_provider_confirmation"
    | "confirmed_by_provider"
    | "pending_payment"
    | "awaiting_payment_confirmation" // Adicionado para refletir o fluxo de pagamento
    | "scheduled_paid"
    | "in_progress"
    | "completed"
    | "finalized"
    | "cancelled_by_client"
    | "cancelled_by_provider"
    | "disputed"
    | "reschedule_requested";

// Exportado o tipo PaymentStatus para ser importável
export type PaymentStatus =
    | "pending_payment"
    | "awaiting_payment_confirmation"
    | "paid"
    | "failed"
    | "refund_pending" // Adicionado para casos de reembolso
    | "refunded"
    | "payout_pending" // Quando o valor está aguardando repasse ao prestador
    | "payout_completed"; // Quando o repasse ao prestador foi feito

export interface BookedServiceSnapshot {
    serviceId?: string;
    name: string;
    description?: string;
    priceType: OfferedService['priceType'];
    priceValueAtBooking?: number;
    currency: string;
    estimatedDurationMinutes?: number;
}

export interface Booking {
    id: string;
    bookingId: string;
    clientId: string;
    clientName?: string;
    clientAvatarUrl?: string;
    providerId: string;
    providerName?: string;
    providerAvatarUrl?: string;
    serviceSnapshot: BookedServiceSnapshot;
    scheduledDateTime: admin.firestore.Timestamp;
    address: {
        street: string;
        number: string;
        complement?: string | null; // Changed to allow null
        neighborhood: string;
        city: string;
        state: string;
        zipCode: string;
    };
    clientNotes?: string;
    totalPrice: number; // Definido como obrigatório, já que é essencial para pagamentos
    commissionRate?: number;
    commissionValue?: number;
    providerEarnings?: number;
    status: BookingStatus;
    paymentStatus: PaymentStatus; // Tipo agora é PaymentStatus exportado
    paymentGatewayRefId?: string; // ID da transação no gateway
    pixQrCode?: string; // Base64 ou URL do QR Code PIX
    pixCode?: string; // Código copia e cola do PIX (mantive o nome original que estava no frontend)

    paymentConfirmedAt?: admin.firestore.Timestamp; // Quando o PSP confirmou o pagamento

    cancellationReason?: string;
    cancelledBy?: UserRole;

    clientReviewId?: string;
    providerReviewId?: string;
    reminderSent?: boolean;
    rescheduleRequestId?: string | admin.firestore.FieldValue;

    createdAt: admin.firestore.Timestamp | admin.firestore.FieldValue;
    updatedAt: admin.firestore.Timestamp | admin.firestore.FieldValue;
}

// --- BookingRequestData (RE-INSERIDA) ---
export interface BookingRequestData {
    providerId: string;
    serviceOfferingId?: string;
    customServiceDescription?: string;
    preferredDate: string;
    preferredTimeSlot?: string;
    address: Booking['address'];
    clientNotes?: string;
}

// --- Nova Interface RescheduleRequest ---
export interface RescheduleRequest {
    bookingId: string;
    proposedDateTime: admin.firestore.Timestamp;
    reason: string;
    status: "pending" | "accepted" | "rejected";
    requestedBy: UserRole;
    requestedById: string;
    createdAt: admin.firestore.Timestamp | admin.firestore.FieldValue;
    updatedAt?: admin.firestore.Timestamp | admin.firestore.FieldValue;
}