import { PaymentIntent, PaymentIntentStatus } from '../../../types/backend/payments';

export const createPaymentIntent = (overrides?: Partial<PaymentIntent>): PaymentIntent => ({
  id: 'pi-booking-1',
  bookingId: 'booking-1',
  amountCents: 15000,
  amount: 150,
  status: PaymentIntentStatus.PENDING,
  gateway: 'pix',
  createdAt: '2025-01-01T08:10:00.000Z',
  updatedAt: '2025-01-01T08:10:00.000Z',
  ...overrides,
});
