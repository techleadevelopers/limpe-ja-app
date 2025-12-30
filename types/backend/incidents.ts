import { InsurancePlanId } from './bookings';
import { IncidentType } from './safety';

export type ClaimStatus = 'PENDING' | 'UNDER_REVIEW' | 'APPROVED' | 'REJECTED' | 'SETTLED';

export interface CreateIncidentClaimDto {
  bookingId: string;
  description: string;
  amountCents: number;
  attachments?: string[];
  type?: IncidentType;
}

export interface IncidentClaim {
  id: string;
  bookingId: string;
  reporterId: string;
  description: string;
  amountCents: number;
  deductibleCents: number;
  coverageCents: number;
  planId: InsurancePlanId;
  status: ClaimStatus;
  rejectionReason?: string | null;
  attachments: string[];
  createdAt: string;
  updatedAt: string;
}
