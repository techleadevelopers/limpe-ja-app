import { BookingStatus, PaymentIntentStatus, UserRole } from '@prisma/client';
import {
  calculateExpectedEnd,
  calculateScheduledAtInSaoPaulo,
  formatScheduledTime,
} from './booking-time.utils';

export type BookingAction =
  | 'CONTACT_SUPPORT'
  | 'CANCEL'
  | 'OPEN_DISPUTE'
  | 'START_SERVICE'
  | 'COMPLETE_SERVICE'
  | 'CONFIRM'
  | 'REJECT';

export const BOOKING_ACTIONS: BookingAction[] = [
  'CONTACT_SUPPORT',
  'CANCEL',
  'OPEN_DISPUTE',
  'START_SERVICE',
  'COMPLETE_SERVICE',
  'CONFIRM',
  'REJECT',
];

export interface BookingActionContext {
  status: BookingStatus;
  scheduledDate: Date | string;
  scheduledTime?: string | Date | null;
  scheduledStart?: Date | string | null;
  startedAt?: Date | string | null;
  durationMinutes?: number | null;
  paymentIntentStatus?: PaymentIntentStatus | null;
}

const FINAL_STATUSES = new Set<BookingStatus>([
  BookingStatus.FINISHED,
  BookingStatus.CANCELED,
  BookingStatus.REJECTED,
  BookingStatus.NO_SHOW,
]);

const CLIENT_OPEN_DISPUTE_STATUSES = new Set<BookingStatus>([
  BookingStatus.CONFIRMED,
  BookingStatus.ON_THE_WAY,
  BookingStatus.ARRIVED,
  BookingStatus.STARTED,
  BookingStatus.FINISHED,
  BookingStatus.PENDING_DISPUTE,
]);

const PROVIDER_OPEN_DISPUTE_STATUSES = new Set<BookingStatus>([
  BookingStatus.CONFIRMED,
  BookingStatus.STARTED,
  BookingStatus.ON_THE_WAY,
  BookingStatus.ARRIVED,
  BookingStatus.PENDING_DISPUTE,
]);

function canStartService(ctx: BookingActionContext): boolean {
  const scheduledTimeValue = formatScheduledTime(ctx.scheduledTime);
  if (ctx.status !== BookingStatus.ARRIVED) return false;
  if (ctx.paymentIntentStatus !== PaymentIntentStatus.PAID) return false;
  const scheduledStart =
    ctx.scheduledStart instanceof Date
      ? ctx.scheduledStart
      : typeof ctx.scheduledStart === 'string'
        ? new Date(ctx.scheduledStart)
        : calculateScheduledAtInSaoPaulo(ctx.scheduledDate, scheduledTimeValue);

  if (Number.isNaN(scheduledStart.getTime())) return false;
  const now = new Date();
  const minutesToStart = Math.round(
    (now.getTime() - scheduledStart.getTime()) / 60000,
  );
  return minutesToStart >= -15 && minutesToStart <= 120;
}

function canCompleteService(ctx: BookingActionContext): boolean {
  const scheduledTimeValue = formatScheduledTime(ctx.scheduledTime);
  if (ctx.status !== BookingStatus.STARTED) return false;
  if (ctx.paymentIntentStatus !== PaymentIntentStatus.PAID) return false;
  const expectedEnd = calculateExpectedEnd({
    scheduledDate: ctx.scheduledDate,
    scheduledTime: scheduledTimeValue,
    scheduledStart: ctx.scheduledStart,
    startedAt: ctx.startedAt,
    durationMinutes: ctx.durationMinutes,
  });
  const now = new Date();
  if (now < expectedEnd) return false;

  const runReference =
    ctx.startedAt instanceof Date
      ? ctx.startedAt
      : typeof ctx.startedAt === 'string'
        ? new Date(ctx.startedAt)
        : ctx.scheduledStart instanceof Date
          ? ctx.scheduledStart
          : typeof ctx.scheduledStart === 'string'
            ? new Date(ctx.scheduledStart)
            : calculateScheduledAtInSaoPaulo(
                ctx.scheduledDate,
                scheduledTimeValue,
              );
  if (Number.isNaN(runReference.getTime())) return false;
  const runMinutes = Math.round(
    (now.getTime() - runReference.getTime()) / 60000,
  );
  const minRunMinutes = Math.max(
    0,
    parseInt(process.env.MIN_SERVICE_MINUTES ?? '15', 10) || 15,
  );
  return runMinutes >= minRunMinutes;
}

export function getAllowedBookingActions(
  context: BookingActionContext,
  role: UserRole,
): BookingAction[] {
  const actions = new Set<BookingAction>();
  actions.add('CONTACT_SUPPORT');

  if (role === UserRole.CLIENT) {
    if (!FINAL_STATUSES.has(context.status)) {
      actions.add('CANCEL');
    }
    if (CLIENT_OPEN_DISPUTE_STATUSES.has(context.status)) {
      actions.add('OPEN_DISPUTE');
    }
  }

  if (role === UserRole.PROVIDER) {
    if (context.status === BookingStatus.PENDING) {
      actions.add('CONFIRM');
      actions.add('REJECT');
    }
    if (canStartService(context)) {
      actions.add('START_SERVICE');
    }
    if (canCompleteService(context)) {
      actions.add('COMPLETE_SERVICE');
    }
    if (PROVIDER_OPEN_DISPUTE_STATUSES.has(context.status)) {
      actions.add('OPEN_DISPUTE');
    }
  }

  if (role === UserRole.ADMIN) {
    actions.add('OPEN_DISPUTE');
  }

  return Array.from(actions);
}
