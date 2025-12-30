import { Injectable } from '@nestjs/common';
import {
  BookingStatus,
  PaymentIntentStatus,
  UserRole,
} from '@prisma/client';
import {
  BOOKING_STATUS_LABELS_CLIENT,
  BOOKING_STATUS_LABELS_PROVIDER,
  BOOKING_STATUS_REQUIRES_ACTION,
  BOOKING_STATUS_SEVERITY,
  BOOKING_TRANSITIONS_BY_ROLE,
  PAYMENT_STATUS_LABELS,
  PAYMENT_STATUS_SEVERITY,
  StatusSeverity,
} from '../bookings/booking-status.constants';

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

@Injectable()
export class MetaService {
  getStatusMetadata(): MetaStatusesResponse {
    const bookingStatuses: BookingStatusMeta[] = Object.values(
      BookingStatus,
    ).map((status) => ({
      status,
      labelClient: BOOKING_STATUS_LABELS_CLIENT[status] || status,
      labelProvider:
        BOOKING_STATUS_LABELS_PROVIDER[status] || BOOKING_STATUS_LABELS_CLIENT[status] || status,
      severity: BOOKING_STATUS_SEVERITY[status] || 'neutral',
      requiresAction: BOOKING_STATUS_REQUIRES_ACTION[status] || false,
    }));

    const paymentStatuses: PaymentStatusMeta[] = Object.values(
      PaymentIntentStatus,
    ).map((status) => ({
      status,
      label: PAYMENT_STATUS_LABELS[status] || status,
      severity: PAYMENT_STATUS_SEVERITY[status] || 'neutral',
    }));

    return {
      bookingStatuses,
      paymentStatuses,
      transitions: BOOKING_TRANSITIONS_BY_ROLE,
    };
  }
}
