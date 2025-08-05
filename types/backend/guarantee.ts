// LimpeJaApp/src/types/backend/guarantee.ts
// Assuming basic types for related entities exist elsewhere or will be defined
interface Booking {
  id: string;
  // ... other booking fields
}

interface Client {
  id: string;
  name: string;
  // ... other client fields
}

interface Provider {
  id: string;
  name: string;
  // ... other provider fields
}

export enum ClaimStatus {
  PENDING = 'PENDING',
  UNDER_REVIEW = 'UNDER_REVIEW',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
  SETTLED = 'SETTLED',
}

export interface SubmitClaimDto {
  bookingId: string;
  description: string;
  attachments?: string[]; // URLs of uploaded photos/videos
  estimatedValue?: number;
}

export interface GuaranteeClaim {
  id: string;
  bookingId: string;
  booking: Booking; // Full booking object or just ID
  clientId: string;
  client: Client; // Full client object or just ID
  providerId: string;
  provider: Provider; // Full provider object or just ID
  description: string;
  attachments?: string[];
  estimatedValue?: number;
  resolvedValue?: number; // Final value paid/reimbursed
  status: ClaimStatus;
  resolutionNotes?: string;
  resolvedAt?: string; // ISO date string
  createdAt: string;
  updatedAt: string;
}