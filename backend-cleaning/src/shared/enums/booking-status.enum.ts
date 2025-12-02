// src/shared/enums/booking-status.enum.ts
export enum BookingStatus {
  PENDING = 'PENDING',
  CONFIRMED = 'CONFIRMED',
  COMPLETED = 'COMPLETED',
  CANCELED = 'CANCELED',
  RESCHEDULED = 'RESCHEDULED',
  IN_PROGRESS = 'IN_PROGRESS', // Adicionado
  PENDING_PROVIDER_CONFIRMATION = 'PENDING_PROVIDER_CONFIRMATION', // Adicionado
  REJECTED = 'REJECTED', // Adicionado
}
