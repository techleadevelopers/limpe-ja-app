// LimpeJaApp/src/types/backend/subscriptions.ts
// Assuming basic types for related entities exist elsewhere or will be defined
import { BookingAddress } from './bookings'; // CORREÇÃO: Importar BookingAddress

interface Client {
  id: string;
  fullName: string; // CORREÇÃO: name para fullName
  address?: BookingAddress | null; // CORREÇÃO: Adicionado address
  // ... other client fields
}

interface Provider {
  id: string;
  fullName: string; // CORREÇÃO: name para fullName
  // ... other provider fields
}

interface ProviderService {
  id: string;
  name: string;
  service: { // CORREÇÃO: Incluir detalhes do serviço aninhado
    id: string;
    name: string;
  };
  // ... other service fields
}

interface Booking {
  id: string;
  scheduledDate: string;
  status: string; // e.g., 'PENDING', 'CONFIRMED', 'COMPLETED'
  // ... other booking fields
}

export enum SubscriptionStatus {
  ACTIVE = 'ACTIVE',
  PAUSED = 'PAUSED',
  CANCELED = 'CANCELED',
  COMPLETED = 'COMPLETED',
}

export enum SubscriptionFrequency {
  WEEKLY = 'WEEKLY',
  BI_WEEKLY = 'BI_WEEKLY',
  MONTHLY = 'MONTHLY',
}

export interface CreateSubscriptionDto {
  clientId: string;
  providerId: string;
  providerServiceId: string;
  frequency: SubscriptionFrequency;
  startDate: string; // ISO date string
  endDate?: string; // ISO date string, optional
  totalPrice: number; // Price per generated booking/cycle (CORREÇÃO: Decimal no Prisma é number aqui)
}

export interface UpdateSubscriptionDto {
  status?: SubscriptionStatus;
  frequency?: SubscriptionFrequency;
  endDate?: string;
  totalPrice?: number; // CORREÇÃO: Adicionado totalPrice
  // Add other updatable fields as needed
}

export interface Subscription {
  id: string;
  clientId: string;
  client: Client;
  providerId: string;
  provider: Provider;
  providerServiceId: string;
  providerService: ProviderService;
  frequency: SubscriptionFrequency;
  startDate: string; // ISO date string
  endDate?: string; // ISO date string
  status: SubscriptionStatus;
  totalPrice: number; // CORREÇÃO: Decimal no Prisma é number aqui
  nextGenerationDate: string; // ISO date string
  generatedBookings?: Booking[]; // Optional, for details view
  createdAt: string;
  updatedAt: string;
}

export interface RecurringBooking {
  // This might just be a Booking with a subscriptionId
  // Or a separate entity if it needs distinct fields
  id: string;
  bookingId: string;
  subscriptionId: string;
  generatedDate: string;
  // ... other fields if needed
}