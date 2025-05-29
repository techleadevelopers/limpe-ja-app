// LimpeJaApp/functions/src/types/provider.types.ts
import { UserProfile } from "./user.types";
import admin from "firebase-admin";

export interface OfferedService {
  id: string; // <<< CHANGED from id?: string;
  name: string;
  description?: string;
  priceType: "hourly" | "fixed" | "quote";
  price?: number; // Em centavos
  currency: string; // Ex: "BRL"
  estimatedDurationMinutes?: number;
  providerId?: string; // ID do provedor que oferece este serviço
  isActive?: boolean; // <<< ADDED: To align with queries like getServicesByProvider
  createdAt?: admin.firestore.Timestamp;
  updatedAt?: admin.firestore.Timestamp;
}

export interface TimeInterval {
  startTime: string; // HH:MM
  endTime: string;   // HH:MM
}

export interface DailyAvailability {
  dayOfWeek: number; // 0 (Dom) - 6 (Sab)
  intervals: TimeInterval[];
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
    holderName?: string;     // Nome do titular da conta
    holderDocument?: string; // CPF/CNPJ do titular
    pixKey?: string;         // Chave PIX principal para recebimento
    pixKeyType?: "cpf" | "cnpj" | "email" | "phone" | "random";
}

export interface ProviderProfile extends UserProfile {
  bio?: string;
  yearsOfExperience?: number;
  servicesOffered: OfferedService[]; // Array of OfferedService objects
  serviceAreas: string[]; // e.g., ["São Paulo - Centro", "Campinas - Cambuí"]
  averageRating?: number;
  totalReviews?: number;
  isVerified?: boolean;
  documents?: Array<{ type: string; url: string; status: 'pending' | 'approved' | 'rejected' }>;
  
  bankAccount?: BankAccountDetails;
  pendingBalance?: number; // Saldo pendente para repasse (em centavos)
  totalEarnedHistorical?: number; // Total já ganho (em centavos) - opcional
  
  weeklyAvailability?: DailyAvailability[];
  blockedDates?: BlockedDate[];
  notesOnVerification?: string; 
  isDisabledByAdmin?: boolean;    
  
  location?: {
    latitude: number;
    longitude: number;
  };
  // Alternatively, use Firebase's GeoPoint:
  // location?: admin.firestore.GeoPoint;
}