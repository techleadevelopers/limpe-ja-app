import { Ionicons } from '@expo/vector-icons';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { getBookingDetails } from '../../../services/bookingService';
import { BookingDetails } from '../../../types/backend/bookings';

export default function ProviderSuccessScreen() {
  const { bookingId } = useLocalSearchParams<{ bookingId: string }>();
  const router = useRouter();
  const [booking, setBooking] = useState<BookingDetails | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!bookingId) return;
    setLoading(true);
    getBookingDetails(bookingId)
      .then((data) => setBooking(data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [bookingId]);

  const paymentLabel = booking?.paymentStatus === 'PAID' ? 'A receber' : 'Processando';
  const formattedAmount =
    booking?.totalPrice != null ? `R$ ${Number(booking.totalPrice).toFixed(2)}` : '—';

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#2563EB" />
        <Text style={styles.statusText}>Carregando o resumo do seu atendimento...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />
      <Ionicons name="rocket-outline" size={64} color="#2563EB" style={styles.icon} />
      <Text style={styles.title}>Serviço concluído!</Text>
      <Text style={styles.subtitle}>
        Obrigado por cuidar do Joaquim. Agora é hora de descansar ou planejar o próximo atendimento.
      </Text>
      <View style={styles.infoCard}>
        <Text style={styles.infoLabel}>Serviço</Text>
        <Text style={styles.infoValue}>{booking?.serviceName ?? 'Serviço confirmado'}</Text>
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
    borderRadius: 16,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    marginBottom: 24,
  },
  infoLabel: {
    color: '#71717A',
    fontSize: 12,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  infoValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
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
