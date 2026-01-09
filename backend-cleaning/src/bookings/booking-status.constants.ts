import { BookingStatus, PaymentIntentStatus, UserRole } from '@prisma/client';

export type StatusSeverity = 'info' | 'success' | 'warning' | 'danger' | 'neutral';

export const BOOKING_STATUS_TRANSITIONS: Record<BookingStatus, BookingStatus[]> = {
  [BookingStatus.PENDING]: [
    BookingStatus.CONFIRMED,
    BookingStatus.REJECTED,
    BookingStatus.CANCELED,
    BookingStatus.PENDING_DISPUTE,
  ],
  [BookingStatus.PENDING_PAYMENT]: [
    BookingStatus.CONFIRMED,
    BookingStatus.REJECTED,
    BookingStatus.CANCELED,
    BookingStatus.PENDING_DISPUTE,
    BookingStatus.EXPIRED,
  ],
  [BookingStatus.PENDING_PROVIDER_CONFIRMATION]: [
    BookingStatus.CONFIRMED,
    BookingStatus.REJECTED,
    BookingStatus.CANCELED,
    BookingStatus.PENDING_DISPUTE,
  ],
  [BookingStatus.CONFIRMED]: [
    BookingStatus.ON_THE_WAY,
    BookingStatus.ARRIVED,
    BookingStatus.STARTED,
    BookingStatus.FINISHED,
    BookingStatus.CANCELED,
    BookingStatus.RESCHEDULED,
    BookingStatus.PENDING_DISPUTE,
  ],
  [BookingStatus.ON_THE_WAY]: [
    BookingStatus.ARRIVED,
    BookingStatus.CANCELED,
    BookingStatus.PENDING_DISPUTE,
  ],
  [BookingStatus.ARRIVED]: [
    BookingStatus.STARTED,
    BookingStatus.CANCELED,
    BookingStatus.PENDING_DISPUTE,
  ],
  [BookingStatus.STARTED]: [
    BookingStatus.FINISHED,
    BookingStatus.CANCELED,
    BookingStatus.PENDING_DISPUTE,
  ],
  [BookingStatus.RESCHEDULED]: [
    BookingStatus.CONFIRMED,
    BookingStatus.CANCELED,
    BookingStatus.PENDING_DISPUTE,
  ],
  [BookingStatus.PENDING_DISPUTE]: [
    BookingStatus.FINISHED,
    BookingStatus.CANCELED,
    BookingStatus.NO_SHOW,
  ],
  [BookingStatus.FINISHED]: [],
  [BookingStatus.CANCELED]: [],
  [BookingStatus.REJECTED]: [],
  [BookingStatus.EXPIRED]: [],
  [BookingStatus.NO_SHOW]: [],
};

export const BOOKING_STATUS_LABELS_CLIENT: Record<BookingStatus, string> = {
  [BookingStatus.PENDING]: 'Pendente',
  [BookingStatus.PENDING_PAYMENT]: 'Aguardando pagamento',
  [BookingStatus.PENDING_PROVIDER_CONFIRMATION]: 'Aguardando confirmação',
  [BookingStatus.CONFIRMED]: 'Confirmado',
  [BookingStatus.ON_THE_WAY]: 'Prestador a caminho',
  [BookingStatus.ARRIVED]: 'Prestador chegou',
  [BookingStatus.STARTED]: 'Serviço em andamento',
  [BookingStatus.FINISHED]: 'Concluído',
  [BookingStatus.CANCELED]: 'Cancelado',
  [BookingStatus.EXPIRED]: 'Expirado',
  [BookingStatus.PENDING_DISPUTE]: 'Em disputa',
  [BookingStatus.RESCHEDULED]: 'Reagendado',
  [BookingStatus.REJECTED]: 'Rejeitado',
  [BookingStatus.NO_SHOW]: 'Não compareceu',
};

export const BOOKING_STATUS_LABELS_PROVIDER: Record<BookingStatus, string> = {
  ...BOOKING_STATUS_LABELS_CLIENT,
};

export const BOOKING_STATUS_SEVERITY: Record<BookingStatus, StatusSeverity> = {
  [BookingStatus.PENDING]: 'warning',
  [BookingStatus.PENDING_PAYMENT]: 'warning',
  [BookingStatus.PENDING_PROVIDER_CONFIRMATION]: 'warning',
  [BookingStatus.CONFIRMED]: 'info',
  [BookingStatus.ON_THE_WAY]: 'info',
  [BookingStatus.ARRIVED]: 'info',
  [BookingStatus.STARTED]: 'info',
  [BookingStatus.FINISHED]: 'success',
  [BookingStatus.CANCELED]: 'danger',
  [BookingStatus.EXPIRED]: 'danger',
  [BookingStatus.PENDING_DISPUTE]: 'warning',
  [BookingStatus.RESCHEDULED]: 'neutral',
  [BookingStatus.REJECTED]: 'danger',
  [BookingStatus.NO_SHOW]: 'danger',
};

export const BOOKING_STATUS_REQUIRES_ACTION: Record<BookingStatus, boolean> = {
  [BookingStatus.PENDING]: true,
  [BookingStatus.PENDING_PAYMENT]: true,
  [BookingStatus.PENDING_PROVIDER_CONFIRMATION]: true,
  [BookingStatus.CONFIRMED]: true,
  [BookingStatus.ON_THE_WAY]: true,
  [BookingStatus.ARRIVED]: true,
  [BookingStatus.STARTED]: true,
  [BookingStatus.FINISHED]: false,
  [BookingStatus.CANCELED]: false,
  [BookingStatus.EXPIRED]: false,
  [BookingStatus.PENDING_DISPUTE]: true,
  [BookingStatus.RESCHEDULED]: true,
  [BookingStatus.REJECTED]: false,
  [BookingStatus.NO_SHOW]: false,
};

export const PAYMENT_STATUS_LABELS: Record<PaymentIntentStatus, string> = {
  [PaymentIntentStatus.PENDING]: 'Pendente',
  [PaymentIntentStatus.PAID]: 'Pago',
  [PaymentIntentStatus.EXPIRED]: 'Expirado',
  [PaymentIntentStatus.REFUNDED]: 'Reembolsado',
  [PaymentIntentStatus.CHARGEBACK]: 'Chargeback',
};

export const PAYMENT_STATUS_SEVERITY: Record<PaymentIntentStatus, StatusSeverity> = {
  [PaymentIntentStatus.PENDING]: 'warning',
  [PaymentIntentStatus.PAID]: 'success',
  [PaymentIntentStatus.EXPIRED]: 'danger',
  [PaymentIntentStatus.REFUNDED]: 'neutral',
  [PaymentIntentStatus.CHARGEBACK]: 'danger',
};

export const BOOKING_TRANSITIONS_BY_ROLE: Record<
  UserRole,
  Record<BookingStatus, BookingStatus[]>
> = {
  [UserRole.CLIENT]: {
    [BookingStatus.PENDING]: [BookingStatus.CANCELED],
    [BookingStatus.PENDING_PAYMENT]: [BookingStatus.CANCELED],
    [BookingStatus.PENDING_PROVIDER_CONFIRMATION]: [BookingStatus.CANCELED],
    [BookingStatus.CONFIRMED]: [BookingStatus.CANCELED],
    [BookingStatus.RESCHEDULED]: [BookingStatus.CANCELED],
    [BookingStatus.PENDING_DISPUTE]: [BookingStatus.CANCELED],
    [BookingStatus.ON_THE_WAY]: [],
    [BookingStatus.ARRIVED]: [],
    [BookingStatus.STARTED]: [],
    [BookingStatus.FINISHED]: [],
    [BookingStatus.CANCELED]: [],
    [BookingStatus.EXPIRED]: [],
    [BookingStatus.REJECTED]: [],
    [BookingStatus.NO_SHOW]: [],
  },
  [UserRole.PROVIDER]: {
    [BookingStatus.PENDING]: [BookingStatus.CONFIRMED, BookingStatus.REJECTED],
    [BookingStatus.PENDING_PAYMENT]: [
      BookingStatus.CONFIRMED,
      BookingStatus.REJECTED,
    ],
    [BookingStatus.PENDING_PROVIDER_CONFIRMATION]: [
      BookingStatus.CONFIRMED,
      BookingStatus.REJECTED,
    ],
    [BookingStatus.CONFIRMED]: [
      BookingStatus.ON_THE_WAY,
      BookingStatus.ARRIVED,
      BookingStatus.STARTED,
      BookingStatus.FINISHED,
      BookingStatus.CANCELED,
      BookingStatus.RESCHEDULED,
    ],
    [BookingStatus.ON_THE_WAY]: [BookingStatus.ARRIVED, BookingStatus.CANCELED],
    [BookingStatus.ARRIVED]: [BookingStatus.STARTED, BookingStatus.CANCELED],
    [BookingStatus.STARTED]: [BookingStatus.FINISHED, BookingStatus.CANCELED],
    [BookingStatus.RESCHEDULED]: [BookingStatus.CONFIRMED, BookingStatus.CANCELED],
    [BookingStatus.PENDING_DISPUTE]: [BookingStatus.FINISHED, BookingStatus.CANCELED],
    [BookingStatus.FINISHED]: [],
    [BookingStatus.CANCELED]: [],
    [BookingStatus.EXPIRED]: [],
    [BookingStatus.REJECTED]: [],
    [BookingStatus.NO_SHOW]: [],
  },
  [UserRole.ADMIN]: BOOKING_STATUS_TRANSITIONS,
  [UserRole.SYSTEM]: BOOKING_STATUS_TRANSITIONS,
  [UserRole.SUPPORT_AGENT]: BOOKING_STATUS_TRANSITIONS,
};
