import { BookingStatus, PaymentIntentStatus, UserRole } from '@prisma/client';

export type StatusSeverity = 'info' | 'success' | 'warning' | 'danger' | 'neutral';

export type BookingStatusMeta = {
  status: BookingStatus;
  labelClient: string;
  labelProvider: string;
  severity: StatusSeverity;
  requiresAction: boolean;
};

export type PaymentStatusMeta = {
  status: PaymentIntentStatus;
  label: string;
  severity: StatusSeverity;
};

export type MetaStatusesResponse = {
  bookingStatuses: BookingStatusMeta[];
  paymentStatuses: PaymentStatusMeta[];
  transitions: Record<UserRole, Record<BookingStatus, BookingStatus[]>>;
};
