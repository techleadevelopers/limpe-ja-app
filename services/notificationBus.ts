type ProviderNotificationEvent = 'bookingConfirmed' | 'paymentConfirmed';

type ProviderNotificationListener = (
  kind: ProviderNotificationEvent,
  payload?: unknown,
) => void;

const listeners = new Set<ProviderNotificationListener>();

export const subscribeToProviderNotifications = (
  listener: ProviderNotificationListener,
): (() => void) => {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
};

export const emitProviderNotification = (
  kind: ProviderNotificationEvent,
  payload?: unknown,
) => {
  listeners.forEach((listener) => listener(kind, payload));
};
