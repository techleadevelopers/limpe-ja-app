// src/bookings/states/booking.state-machine.ts

export enum BookingStatus {
  PENDING = 'PENDING', // Cliente criou, aguardando resposta do prestador
  ACCEPTED = 'ACCEPTED', // Prestador aceitou
  REJECTED = 'REJECTED', // Prestador rejeitou
  CANCELED_BY_CUSTOMER = 'CANCELED_BY_CUSTOMER', // Cliente cancelou
  CANCELED_BY_PROVIDER = 'CANCELED_BY_PROVIDER', // Prestador cancelou
  STARTED = 'STARTED', // Prestador iniciou o serviço
  COMPLETED = 'COMPLETED', // Serviço concluído (prestador marcou como concluído)
  PAID = 'PAID', // Pagamento processado
  REVIEWED = 'REVIEWED', // Avaliado pelo cliente
  DISPUTED = 'DISPUTED', // Disputa aberta
}

export enum BookingEvent {
  ACCEPT = 'ACCEPT',
  REJECT = 'REJECT',
  CANCEL_BY_CUSTOMER = 'CANCEL_BY_CUSTOMER',
  CANCEL_BY_PROVIDER = 'CANCEL_BY_PROVIDER',
  START = 'START',
  COMPLETE = 'COMPLETE',
  PAY = 'PAY',
  REVIEW = 'REVIEW',
  OPEN_DISPUTE = 'OPEN_DISPUTE',
}

interface Transition {
  from: BookingStatus | BookingStatus[];
  to: BookingStatus;
  event: BookingEvent;
}

export const bookingTransitions: Transition[] = [
  {
    from: BookingStatus.PENDING,
    to: BookingStatus.ACCEPTED,
    event: BookingEvent.ACCEPT,
  },
  {
    from: BookingStatus.PENDING,
    to: BookingStatus.REJECTED,
    event: BookingEvent.REJECT,
  },
  {
    from: [BookingStatus.PENDING, BookingStatus.ACCEPTED],
    to: BookingStatus.CANCELED_BY_CUSTOMER,
    event: BookingEvent.CANCEL_BY_CUSTOMER,
  },
  {
    from: [BookingStatus.PENDING, BookingStatus.ACCEPTED],
    to: BookingStatus.CANCELED_BY_PROVIDER,
    event: BookingEvent.CANCEL_BY_PROVIDER,
  },
  {
    from: BookingStatus.ACCEPTED,
    to: BookingStatus.STARTED,
    event: BookingEvent.START,
  },
  {
    from: BookingStatus.STARTED,
    to: BookingStatus.COMPLETED,
    event: BookingEvent.COMPLETE,
  },
  {
    from: BookingStatus.COMPLETED,
    to: BookingStatus.PAID,
    event: BookingEvent.PAY,
  },
  {
    from: BookingStatus.PAID,
    to: BookingStatus.REVIEWED,
    event: BookingEvent.REVIEW,
  },
  {
    from: [BookingStatus.COMPLETED, BookingStatus.PAID],
    to: BookingStatus.DISPUTED,
    event: BookingEvent.OPEN_DISPUTE,
  },
];

export class BookingStateMachine {
  static canTransition(
    currentStatus: BookingStatus,
    event: BookingEvent,
  ): boolean {
    return bookingTransitions.some((transition) => {
      const fromStatuses = Array.isArray(transition.from)
        ? transition.from
        : [transition.from];
      return fromStatuses.includes(currentStatus) && transition.event === event;
    });
  }

  static getNextStatus(
    currentStatus: BookingStatus,
    event: BookingEvent,
  ): BookingStatus {
    const transition = bookingTransitions.find((t) => {
      const fromStatuses = Array.isArray(t.from) ? t.from : [t.from];
      return fromStatuses.includes(currentStatus) && t.event === event;
    });

    if (!transition) {
      throw new Error(
        `Invalid transition from status ${currentStatus} with event ${event}`,
      );
    }
    return transition.to;
  }
}
