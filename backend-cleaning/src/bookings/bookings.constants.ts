import { BookingStatus } from '@prisma/client';

export const BLOCKED_BOOKING_STATUSES: BookingStatus[] = [
  BookingStatus.PENDING,
  BookingStatus.PENDING_PAYMENT,
  BookingStatus.PENDING_PROVIDER_CONFIRMATION,
  BookingStatus.CONFIRMED,
  BookingStatus.ON_THE_WAY,
  BookingStatus.ARRIVED,
  BookingStatus.STARTED,
  BookingStatus.RESCHEDULED,
];
