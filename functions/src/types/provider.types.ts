// LimpeJaApp/functions/src/types/provider.types.ts
import { UserProfile } from "./user.types"; // Adicionado UserRole

// Estes tipos podem ser movidos para um arquivo service.types.ts ou booking.types.ts se fizer mais sentido
export interface OfferedService {
  id: string;
  name: string;
  description?: string;
  priceType: "hourly" | "fixed" | "quote";
  priceValue?: number; // Em centavos
  currency: string; // Ex: "BRL"
  estimatedDurationMinutes?: number;
}

export interface WeeklyAvailabilitySlot {
  id: string;
  startTime: string; // HH:MM
  endTime: string;   // HH:MM
}

export interface DailyAvailability {
  dayIndex: number; // 0 (Dom) - 6 (Sab)
  isAvailable: boolean;
  slots: WeeklyAvailabilitySlot[];
}

export interface BlockedDate {
    date: string; // YYYY-MM-DD
    reason?: string;
}

export interface BankAccountDetails {
    bankName?: string;
    agency?: string;
    accountNumber?: string;
    accountType?: "checking" | "savings"; // Conta Corrente ou Poupança
    holderName?: string;    // Nome do titular da conta
    holderDocument?: string; // CPF/CNPJ do titular
    pixKey?: string;         // Chave PIX principal para recebimento
    pixKeyType?: "cpf" | "cnpj" | "email" | "phone" | "random";
}

export interface ProviderProfile extends UserProfile {
  bio?: string;
  yearsOfExperience?: number;
  servicesOffered: OfferedService[];
  serviceAreas: string[];
  averageRating?: number;
  totalReviews?: number;
  isVerified?: boolean;
  documents?: Array<{ type: string; url: string; status: 'pending' | 'approved' | 'rejected' }>;
  
  bankAccount?: BankAccountDetails;     // <<<--- ADICIONADO/DEFINIDO AQUI
  pendingBalance?: number;            // Saldo pendente para repasse (em centavos) <<<--- ADICIONADO AQUI
  totalEarnedHistorical?: number;     // Total já ganho (em centavos) - opcional
  
  weeklyAvailability?: DailyAvailability[];
  blockedDates?: BlockedDate[];
  notesOnVerification?: string; 
  isDisabledByAdmin?: boolean;  
  
  // Se UserProfile já tem createdAt/updatedAt com FieldValue, não precisa repetir
  // createdAt: admin.firestore.Timestamp | admin.firestore.FieldValue; // Herda de UserProfile
  // updatedAt: admin.firestore.Timestamp | admin.firestore.FieldValue; // Herda de UserProfile
}