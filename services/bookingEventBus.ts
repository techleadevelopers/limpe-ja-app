export interface BookingEventPayload {
  bookingId: string;
  status?: string;
  source?: 'notification' | 'stream';
  payload?: Record<string, unknown> | null;
}

type BookingEventListener = (event: BookingEventPayload) => void;

const listeners = new Set<BookingEventListener>();

export const subscribeToBookingEvents = (listener: BookingEventListener) => {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
};

export const emitBookingEvent = (event: BookingEventPayload) => {
  if (!event || !event.bookingId) {
    return;
  }
  listeners.forEach((listener) => {
    try {
      listener(event);
    } catch (error) {
      console.warn('[bookingEventBus]', 'listener error', error);
    }
  });
};
