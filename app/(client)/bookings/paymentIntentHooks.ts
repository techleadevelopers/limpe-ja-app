// LimpeJaApp/app/(client)/bookings/paymentIntentHooks.ts
import { useCallback, useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Clipboard from 'expo-clipboard';
import * as Haptics from 'expo-haptics';
import Toast from 'react-native-toast-message';
import i18n from '../../../i18n';

import { fetchApi } from '../../../services/api';
import { PaymentIntent } from '../../../types/backend/payments';

const PAYMENT_INTENT_CACHE_KEY = (bookingId: string) => `payment_intent_${bookingId}`;

export function usePaymentIntent(bookingId?: string) {
  const [intent, setIntent] = useState<PaymentIntent | null>(null);
  const [loading, setLoading] = useState<boolean>(Boolean(bookingId));
  const [error, setError] = useState<unknown>(null);
  const [refreshToken, setRefreshToken] = useState(0);

  useEffect(() => {
    let alive = true;

    if (!bookingId) {
      setIntent(null);
      setLoading(false);
      return () => {
        alive = false;
      };
    }

    setLoading(true);
    const cacheKey = PAYMENT_INTENT_CACHE_KEY(bookingId);

    const load = async () => {
      try {
        const cachedRaw = await AsyncStorage.getItem(cacheKey);
        if (cachedRaw && alive) {
          try {
            const cachedValue = JSON.parse(cachedRaw) as PaymentIntent;
            setIntent(prev => prev ?? cachedValue);
          } catch (_) {
            await AsyncStorage.removeItem(cacheKey);
          }
        }

        const fresh = await fetchApi<PaymentIntent>(`/payments/intent/${bookingId}`, { headers: { 'x-silent': '1' } });
        if (!alive) return;
        setIntent(fresh);
        setError(null);
        await AsyncStorage.setItem(cacheKey, JSON.stringify(fresh));
      } catch (err) {
        if (!alive) return;
        setError(err);
      } finally {
        if (alive) {
          setLoading(false);
        }
      }
    };

    load();
    return () => {
      alive = false;
    };
  }, [bookingId, refreshToken]);

  const refresh = useCallback(() => {
    setRefreshToken(token => token + 1);
  }, []);

  return { intent, loading, error, refresh } as const;
}

export function usePixActions(source: { qrCodeText?: string; copiaECola?: string } | null) {
  return {
    copy: async () => {
      const value = source?.qrCodeText ?? source?.copiaECola;
      if (!value) {
        return;
      }
      await Clipboard.setStringAsync(value);
      try {
        await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      } catch (_) {
        // ignore haptics errors
      }
      Toast.show({
        type: 'info',
        text1: i18n.t('payments.pix.copy_success_title'),
        text2: i18n.t('payments.pix.copy_success_message'),
      });
    },
  } as const;
}

export async function cachePaymentIntent(bookingId: string, intent: PaymentIntent | null | undefined) {
  await AsyncStorage.setItem(
    PAYMENT_INTENT_CACHE_KEY(bookingId),
    JSON.stringify(intent ?? null),
  );
}