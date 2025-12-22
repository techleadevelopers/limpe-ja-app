import { BookingStatus } from '@prisma/client';

type LegacyBookingStatus =
  | 'ACCEPTED'
  | 'COMPLETED'
  | 'PAID'
  | 'REVIEWED'
  | 'DISPUTED'
  | 'IN_PROGRESS'
  | 'CANCELED_BY_CUSTOMER'
  | 'CANCELED_BY_PROVIDER';

const LEGACY_STATUS_MAP: Record<LegacyBookingStatus, BookingStatus> = {
  ACCEPTED: BookingStatus.CONFIRMED,
  COMPLETED: BookingStatus.FINISHED,
  PAID: BookingStatus.FINISHED,
  REVIEWED: BookingStatus.FINISHED,
  DISPUTED: BookingStatus.PENDING_DISPUTE,
  IN_PROGRESS: BookingStatus.STARTED,
  CANCELED_BY_CUSTOMER: BookingStatus.CANCELED,
  CANCELED_BY_PROVIDER: BookingStatus.CANCELED,
};

const OFFICIAL_STATUS_NAMES = new Set<string>(Object.values(BookingStatus));

export function normalizeBookingStatus(
  status: BookingStatus | LegacyBookingStatus | string,
): BookingStatus {
  const statusName = status as string;
  if (OFFICIAL_STATUS_NAMES.has(statusName)) {
    return statusName as BookingStatus;
  }

  const legacyMatch = LEGACY_STATUS_MAP[statusName as LegacyBookingStatus];
  if (legacyMatch) {
    return legacyMatch;
  }

  throw new Error(`Unknown booking status "${statusName}"`);
}

export enum BookingEvent {
  CONFIRM = 'CONFIRM',
  REJECT = 'REJECT',
  CANCEL = 'CANCEL',
  START_TRAVEL = 'START_TRAVEL',
  ARRIVE = 'ARRIVE',
  START_SERVICE = 'START_SERVICE',
  COMPLETE_SERVICE = 'COMPLETE_SERVICE',
  RESCHEDULE = 'RESCHEDULE',
  OPEN_DISPUTE = 'OPEN_DISPUTE',
  MARK_NO_SHOW = 'MARK_NO_SHOW',
}

interface Transition {
  from: BookingStatus | BookingStatus[];
  to: BookingStatus;
  event: BookingEvent;
}

export const bookingTransitions: Transition[] = [
  {
    from: BookingStatus.PENDING,
    to: BookingStatus.CONFIRMED,
    event: BookingEvent.CONFIRM,
  },
  {
    from: BookingStatus.PENDING,
    to: BookingStatus.REJECTED,
    event: BookingEvent.REJECT,
  },
  {
    from: BookingStatus.PENDING,
    to: BookingStatus.CANCELED,
    event: BookingEvent.CANCEL,
  },
  {
    from: BookingStatus.PENDING,
    to: BookingStatus.PENDING_DISPUTE,
    event: BookingEvent.OPEN_DISPUTE,
  },
  {
    from: BookingStatus.CONFIRMED,
    to: BookingStatus.ON_THE_WAY,
    event: BookingEvent.START_TRAVEL,
  },
  {
    from: BookingStatus.CONFIRMED,
    to: BookingStatus.ARRIVED,
    event: BookingEvent.ARRIVE,
  },
  {
    from: BookingStatus.CONFIRMED,
    to: BookingStatus.STARTED,
    event: BookingEvent.START_SERVICE,
  },
  {
    from: BookingStatus.CONFIRMED,
    to: BookingStatus.FINISHED,
    event: BookingEvent.COMPLETE_SERVICE,
  },
  {
    from: BookingStatus.CONFIRMED,
    to: BookingStatus.CANCELED,
    event: BookingEvent.CANCEL,
  },
  {
    from: BookingStatus.CONFIRMED,
    to: BookingStatus.RESCHEDULED,
    event: BookingEvent.RESCHEDULE,
  },
  {
    from: BookingStatus.CONFIRMED,
    to: BookingStatus.PENDING_DISPUTE,
    event: BookingEvent.OPEN_DISPUTE,
  },
  {
    from: BookingStatus.ON_THE_WAY,
    to: BookingStatus.ARRIVED,
    event: BookingEvent.ARRIVE,
  },
  {
    from: BookingStatus.ON_THE_WAY,
    to: BookingStatus.CANCELED,
    event: BookingEvent.CANCEL,
  },
  {
    from: BookingStatus.ON_THE_WAY,
    to: BookingStatus.PENDING_DISPUTE,
    event: BookingEvent.OPEN_DISPUTE,
  },
  {
    from: BookingStatus.ARRIVED,
    to: BookingStatus.STARTED,
    event: BookingEvent.START_SERVICE,
  },
  {
    from: BookingStatus.ARRIVED,
    to: BookingStatus.CANCELED,
    event: BookingEvent.CANCEL,
  },
  {
    from: BookingStatus.ARRIVED,
    to: BookingStatus.PENDING_DISPUTE,
    event: BookingEvent.OPEN_DISPUTE,
  },
  {
    from: BookingStatus.STARTED,
    to: BookingStatus.FINISHED,
    event: BookingEvent.COMPLETE_SERVICE,
  },
  {
    from: BookingStatus.STARTED,
    to: BookingStatus.CANCELED,
    event: BookingEvent.CANCEL,
  },
  {
    from: BookingStatus.STARTED,
    to: BookingStatus.PENDING_DISPUTE,
    event: BookingEvent.OPEN_DISPUTE,
  },
  {
    from: BookingStatus.RESCHEDULED,
    to: BookingStatus.CONFIRMED,
    event: BookingEvent.RESCHEDULE,
  },
  {
    from: BookingStatus.RESCHEDULED,
    to: BookingStatus.CANCELED,
    event: BookingEvent.CANCEL,
  },
  {
    from: BookingStatus.RESCHEDULED,
    to: BookingStatus.PENDING_DISPUTE,
    event: BookingEvent.OPEN_DISPUTE,
  },
  {
    from: BookingStatus.PENDING_DISPUTE,
    to: BookingStatus.FINISHED,
    event: BookingEvent.COMPLETE_SERVICE,
  },
  {
    from: BookingStatus.PENDING_DISPUTE,
    to: BookingStatus.CANCELED,
    event: BookingEvent.CANCEL,
  },
  {
    from: BookingStatus.PENDING_DISPUTE,
    to: BookingStatus.NO_SHOW,
    event: BookingEvent.MARK_NO_SHOW,
  },
];

export class BookingStateMachine {
  static canTransition(
    currentStatus: BookingStatus | LegacyBookingStatus | string,
    event: BookingEvent,
  ): boolean {
    const normalizedStatus = normalizeBookingStatus(currentStatus);
    return bookingTransitions.some((transition) => {
      const fromStatuses = Array.isArray(transition.from)
        ? transition.from
        : [transition.from];
      return (
        fromStatuses.includes(normalizedStatus) && transition.event === event
      );
    });
  }

  static getNextStatus(
    currentStatus: BookingStatus | LegacyBookingStatus | string,
    event: BookingEvent,
  ): BookingStatus {
    const normalizedStatus = normalizeBookingStatus(currentStatus);
    const transition = bookingTransitions.find((t) => {
      const fromStatuses = Array.isArray(t.from) ? t.from : [t.from];
      return fromStatuses.includes(normalizedStatus) && t.event === event;
    });

    if (!transition) {
      throw new Error(
        `Invalid transition from status ${normalizedStatus} with event ${event}`,
      );
    }

    return transition.to;
  }
}
