import { PaymentIntentStatus } from '@prisma/client';

export class PaymentIntentResponseDto {
  id: string;
  bookingId: string;
  amountCents: number;
  amount: number;
  status: PaymentIntentStatus;
  gateway: string;
  externalRef?: string | null;
  externalOrderId?: string | null;
  externalChargeId?: string | null;
  externalQrCodeId?: string | null;
  qrCodeUrl?: string | null;
  qrCodeText?: string | null;
  expiresAt?: string | null;
  createdAt: string;
  updatedAt: string;
}
