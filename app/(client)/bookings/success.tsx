import React, { useEffect, useMemo, useRef, useState, useCallback } from 'react';
import { View, StyleSheet, ActivityIndicator, Text, Animated, Easing } from 'react-native';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import PaymentConfirmationCard from '../../../components/client/booking/success/PaymentConfirmationCard';
import SuccessPixInfo from '../../../components/client/booking/success/SuccessPixInfo';
import { fetchPaymentIntent } from '../../../services/paymentService';
import { getBookingDetails } from '../../../services/bookingService';
import NotificationUIService from '../../../services/notificationUIService';
import { PaymentIntentStatus } from '../../../types/backend/payments';

export default function BookingSuccessScreen() {
  const { bookingId } = useLocalSearchParams<{ bookingId?: string }>();
  const router = useRouter();
  const [loading, setLoading] = useState<boolean>(true);
  const [paid, setPaid] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const pollRef = useRef<NodeJS.Timeout | null>(null);
  const onceRef = useRef(false);

  const startPolling = useCallback(() => {
    if (!bookingId) return;
    const poll = async () => {
      try {
        const intent = await fetchPaymentIntent(bookingId);
        if (intent?.status === PaymentIntentStatus.PAID) {
          setPaid(true);
          if (!onceRef.current) {
            onceRef.current = true;
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
            NotificationUIService.showSuccess('Pagamento confirmado. Seu agendamento está garantido.', 'Sucesso');
            try { await getBookingDetails(bookingId); } catch {}
            // Small grace delay to let user see the card if they stay
            setTimeout(() => {
              router.replace('/(client)/bookings?highlightNew=true' as any);
            }, 1200);
          }
        }
      } catch (e: any) {
        setError(e?.message || 'Erro ao verificar pagamento.');
      } finally {
        setLoading(false);
      }
    };
    poll();
    pollRef.current = setInterval(poll, 3000);
  }, [bookingId, router]);

  useEffect(() => {
    startPolling();
    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, [startPolling]);

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ title: 'Pagamento', headerShown: true }} />
      {loading && !paid ? (
        <View style={styles.center}> 
          <ActivityIndicator size="large" color="#2563eb" />
          <Text style={styles.subtle}>Confirmando pagamento...</Text>
        </View>
      ) : null}

      {/* Premium success card (renders when paid) */}
      {paid && bookingId ? (
        <PaymentConfirmationCard
          message={`Seu agendamento foi confirmado.`}
          ctaLabel="Ver detalhes"
          onPressCta={() => router.push({ pathname: '/(client)/bookings/[bookingId]', params: { bookingId } } as any)}
        />
      ) : null}

      {/* PIX info (QR + copy). Displays regardless; hides gracefully if no data */}
      {bookingId ? <SuccessPixInfo bookingId={bookingId} fallback={null} /> : null}

      {error ? (
        <View style={styles.center}> 
          <Text style={styles.error}>{error}</Text>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff', paddingTop: 8 },
  center: { alignItems: 'center', justifyContent: 'center', paddingVertical: 16 },
  subtle: { marginTop: 8, fontSize: 12, color: '#6B7280' },
  error: { color: '#DC2626', fontSize: 14 },
});
