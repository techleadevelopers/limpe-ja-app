import { useEffect, useRef } from 'react';
import { AppState } from 'react-native';
import { registerDevicePushToken } from '../services/pushService';

const MIN_INTERVAL_MS = 60_000;

export function usePushRegistration(enabled: boolean) {
  const lastRegisteredAt = useRef(0);

  useEffect(() => {
    if (!enabled) {
      return;
    }

    const attemptRegistration = () => {
      const now = Date.now();
      if (now - lastRegisteredAt.current < MIN_INTERVAL_MS) {
        return;
      }
      lastRegisteredAt.current = now;
      registerDevicePushToken().catch(() => {});
    };

    attemptRegistration();

    const subscription = AppState.addEventListener('change', (nextState) => {
      if (nextState === 'active') {
        attemptRegistration();
      }
    });

    return () => {
      subscription.remove();
    };
  }, [enabled]);
}
