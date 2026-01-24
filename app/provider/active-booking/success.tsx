import { Ionicons } from '@expo/vector-icons';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { getBookingDetails } from '../../../services/bookingService';
import { getMyProviderEarnings } from '../../../services/earningService';
import { BookingDetails, BookingStatus } from '../../../types/backend/bookings';
import { ProviderTransaction, TransactionType } from '../../../types/backend/providers';
import { formatPriceBRL } from '../../../utils/formatters';
import { scheduleLocalNotification } from '../../../services/localNotificationService';

const PRIMARY = '#2563EB';

export default function ProviderSuccessScreen() {
  const { bookingId } = useLocalSearchParams<{ bookingId: string }>();
  const router = useRouter();
  const [booking, setBooking] = useState<BookingDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [payoutSummary, setPayoutSummary] = useState<ProviderTransaction | null>(null);
  const [summaryLoading, setSummaryLoading] = useState(false);
  const [summaryError, setSummaryError] = useState<string | null>(null);
  const notificationSentRef = useRef<string | null>(null);

  useEffect(() => {
    if (!bookingId) return;
    setLoading(true);
    getBookingDetails(bookingId)
      .then((data) => setBooking(data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [bookingId]);

  useEffect(() => {
    if (!booking?.id) return;
    setSummaryLoading(true);
    setSummaryError(null);
    getMyProviderEarnings()
      .then((earnings) => {
        const transactions = earnings.recentTransactions ?? [];
        const match =
          transactions.find(
            (tx) => tx.bookingId === booking.id && tx.type === TransactionType.PAYMENT,
          ) ?? transactions.find((tx) => tx.bookingId === booking.id);
        setPayoutSummary(match ?? null);
      })
      .catch((error) => {
        console.error('Erro ao buscar ganhos do provedor', error);
        setSummaryError('Resumo de ganho indisponível no momento.');
      })
      .finally(() => setSummaryLoading(false));
  }, [booking?.id]);

  useEffect(() => {
    if (!booking || booking.status !== BookingStatus.FINISHED) return;
    if (notificationSentRef.current === booking.id) return;
    scheduleLocalNotification({
      title: 'Pagamento processado para o serviço concluído!',
      body: 'O repasse referente a esse atendimento já está disponível.',
    }).catch(() => {});
    notificationSentRef.current = booking.id;
  }, [booking]);

  const paymentLabel = booking?.paymentStatus === 'PAID' ? 'A receber' : 'Processando';
  const formattedAmount = booking ? formatPriceBRL(booking.totalPrice ?? 0) : '—';
  const payoutAmount = payoutSummary?.amount ?? booking?.totalPrice ?? 0;
  const payoutNote = summaryError
    ? summaryError
    : payoutSummary?.description ?? `Status: ${booking?.status ?? 'Atualizado'}`;

  if (loading) {
    return (
      <View style={styles.centered}>
      <ActivityIndicator size="large" color={PRIMARY} />
        <Text style={styles.statusText}>Carregando o resumo do seu atendimento...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />
      <Ionicons name="rocket-outline" size={64} color={PRIMARY} style={styles.icon} />
      <Text style={styles.title}>Parabéns!</Text>
      <Text style={styles.subtitle}>
        Você concluiu seu serviço de {booking?.serviceName ?? 'este atendimento'} com segurança e eficiência.
      </Text>
      <View style={styles.infoCard}>
        <Text style={styles.infoLabel}>Serviço</Text>
        <Text style={styles.infoValue}>{booking?.serviceName ?? 'Serviço confirmado'}</Text>
        <Text style={styles.infoLabel}>Resumo do ganho</Text>
        {summaryLoading ? (
          <ActivityIndicator size="small" color={PRIMARY} style={{ marginBottom: 4 }} />
        ) : (
          <Text style={styles.infoValue}>{formatPriceBRL(payoutAmount)}</Text>
        )}
        <Text style={styles.infoMeta}>{payoutNote}</Text>
        <Text style={styles.infoLabel}>Pagamento</Text>
        <Text style={styles.infoValue}>
          {paymentLabel} · {formattedAmount}
        </Text>
      </View>
      <TouchableOpacity
        style={styles.primaryButton}
        onPress={() => router.push('/provider')}
        accessibilityLabel="Voltar ao Dashboard do Prestador"
      >
        <Text style={styles.primaryButtonText}>Ir para o Dashboard</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F8FAFC',
    padding: 24,
  },
  icon: {
    marginBottom: 16,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 8,
  },
  subtitle: {
    textAlign: 'center',
    color: '#4B5563',
    marginBottom: 24,
    lineHeight: 22,
  },
  infoCard: {
    width: '100%',
    padding: 20,
    borderRadius: 18,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    marginBottom: 24,
  },
  infoLabel: {
    fontSize: 12,
    color: '#71717A',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  infoValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 12,
  },
  infoMeta: {
    fontSize: 13,
    color: '#4B5563',
    marginBottom: 12,
  },
  primaryButton: {
    backgroundColor: '#2563EB',
    paddingVertical: 14,
    paddingHorizontal: 32,
    borderRadius: 12,
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 16,
  },
  statusText: {
    marginTop: 12,
    color: '#6B7280',
  },
});
