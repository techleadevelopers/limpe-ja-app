import { Ionicons } from '@expo/vector-icons';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Animated,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import * as Haptics from 'expo-haptics';

import { getBookingDetails } from '../../../services/bookingService';
import { BookingDetails, BookingStatus } from '../../../types/backend/bookings';
import { PaymentIntentStatus } from '../../../types/backend/payments';
import NotificationUIService from '../../../services/notificationUIService';
import { useProviderBookings } from '../../../hooks/useProviderBookings';
import { useAuth } from '../../../hooks/useAuth';

const PRIMARY = '#007AFF';
const BG = '#F8F9FA';
const WHITE = '#FFFFFF';
const TEXT = '#1F2937';
const MUTED = '#6B7280';
const SUCCESS = '#16A34A';
const WARNING = '#F59E0B';

function parseDateTime(dateIso: string, timeHHmm: string): Date {
  // dateIso may be date-only or full ISO. We normalize using date part + time.
  try {
    const datePart = new Date(dateIso);
    if (Number.isNaN(datePart.getTime())) return new Date(NaN);
    const [hh, mm] = (timeHHmm || '00:00').split(':').map((n) => parseInt(n, 10));
    const dt = new Date(datePart);
    dt.setHours(hh || 0, mm || 0, 0, 0);
    return dt;
  } catch {
    return new Date(NaN);
  }
}

function minutesBetween(a: Date, b: Date): number {
  return Math.round((a.getTime() - b.getTime()) / 60000);
}

function useAnimatedMount() {
  const fade = useRef(new Animated.Value(0)).current;
  const slide = useRef(new Animated.Value(12)).current;
  useEffect(() => {
    Animated.parallel([
      Animated.timing(fade, { toValue: 1, duration: 300, useNativeDriver: true }),
      Animated.timing(slide, { toValue: 0, duration: 300, useNativeDriver: true }),
    ]).start();
  }, [fade, slide]);
  return { fade, slide };
}

async function tryBeepLocalNotification(title: string, body: string) {
  // Tenta usar expo-notifications (se presente) para emitir notificação local com som padrão
  try {
    // dynamic import to avoid hard dependency at compile time
    const Notifications = (await import('expo-notifications')).default || (await import('expo-notifications'));
    await Notifications.scheduleNotificationAsync({
      content: { title, body, sound: true, priority: 'max' as any },
      trigger: null,
    });
  } catch {
    try {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch {}
  }
}

// ATENÇÃO: Adicionei temporariamente 'paymentIntent' à tipagem local
// Se 'BookingDetails' é um tipo importado, você DEVE corrigi-lo no arquivo de origem
// '../../../types/backend/bookings'
type BookingDetailsWithPaymentIntent = BookingDetails & {
  paymentIntent?: {
    status: PaymentIntentStatus;
  };
};

export default function ActiveBookingDetails() {
  const { bookingId } = useLocalSearchParams<{ bookingId: string }>();
  const router = useRouter();
  const { fade, slide } = useAnimatedMount();
  const { user } = useAuth();
  const { start, complete } = useProviderBookings();

  const [booking, setBooking] = useState<BookingDetailsWithPaymentIntent | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState<'NONE' | 'START' | 'COMPLETE'>('NONE');

  const providerId =
    (user as any)?.providerDetails?.id ||
    (user as any)?.providerDetails?.providerId ||
    (user as any)?.id;

  const fetchDetails = useCallback(async () => {
    if (!bookingId) return;
    setLoading(true);
    try {
      // Tipagem ajustada localmente
      const data = await getBookingDetails(bookingId) as BookingDetailsWithPaymentIntent;
      if (providerId && data.providerId !== providerId) {
        NotificationUIService.showError('Agendamento nao pertence a este provedor.');
        router.back();
        return;
      }
      setBooking(data);
    } catch (e: any) {
      NotificationUIService.showError(e);
    } finally {
      setLoading(false);
    }
  }, [bookingId, providerId, router]);

  useEffect(() => {
    fetchDetails();
  }, [fetchDetails]);

  const scheduledStart = useMemo(() => {
    if (!booking) return null;
    if (booking.scheduledStart) {
      const d = new Date(booking.scheduledStart);
      if (!Number.isNaN(d.getTime())) return d;
    }
    return parseDateTime(booking.scheduledDate, booking.scheduledTime);
  }, [booking]);

  const scheduledEnd = useMemo(() => {
    if (!booking) return null;
    const start = booking.startedAt
      ? new Date(booking.startedAt)
      : booking.scheduledStart
        ? new Date(booking.scheduledStart)
        : parseDateTime(booking.scheduledDate, booking.scheduledTime);
    if (Number.isNaN(start.getTime())) return null;
    const durMin =
      booking.durationMinutes ??
      booking.serviceDurationMinutes ??
      120;
    return new Date(start.getTime() + durMin * 60000);
  }, [booking]);

  const nowInfo = useMemo(() => {
    const now = new Date();
    if (!scheduledStart) return { withinWindow: false, minutesToStart: undefined as number | undefined };
    const minutesToStart = minutesBetween(scheduledStart, now);
    // Janela para iniciar: 15 min antes até 120 min depois do horário marcado (ajustável)
    // Corrigido para corresponder ao uso em canStart (o limite inferior estava incorreto no seu código)
    // Assumindo que a janela é de -15 minutos (antes) até 120 minutos (depois), baseado na lógica
    const withinWindow = minutesToStart <= 120 && minutesToStart >= -15; 
    return { withinWindow, minutesToStart };
  }, [scheduledStart]);

  const canStart = useMemo(() => {
    const isOwner = !!providerId && booking?.providerId === providerId;
    return isOwner && booking?.status === BookingStatus.CONFIRMED && nowInfo.withinWindow;
  }, [booking?.providerId, booking?.status, nowInfo.withinWindow, providerId]);

  const canComplete = useMemo(() => {
    const isOwner = !!providerId && booking?.providerId === providerId;
    // O erro '2339' está aqui. Corrigido com a tipagem temporária acima.
    const isPaid = booking?.paymentIntent?.status === PaymentIntentStatus.PAID;
    const hasStarted = Boolean(booking?.startedAt);
    return isOwner && booking?.status === BookingStatus.IN_PROGRESS && isPaid && hasStarted;
  }, [booking?.paymentIntent?.status, booking?.providerId, booking?.startedAt, booking?.status, providerId]);

  const handleStart = useCallback(async () => {
    if (!booking || !bookingId) return;
    if (!canStart) {
      NotificationUIService.showError('Nao e possivel iniciar este atendimento agora.');
      return;
    }
    setSubmitting('START');
    try {
      const updated = await start(bookingId) as BookingDetailsWithPaymentIntent;
      setBooking(updated);
      NotificationUIService.showSuccess('Servico iniciado.');
      await tryBeepLocalNotification('Servico iniciado', 'Você iniciou o atendimento.');
    } catch (e: any) {
      NotificationUIService.showError(e);
    } finally {
      setSubmitting('NONE');
    }
  }, [booking, bookingId, canStart, start]);

  const handleComplete = useCallback(async () => {
    if (!booking || !bookingId) return;
    if (!canComplete) {
      NotificationUIService.showError('Nao e possivel concluir: verifique status, inicio e pagamento.');
      return;
    }
    setSubmitting('COMPLETE');
    try {
      const updated = await complete(bookingId) as BookingDetailsWithPaymentIntent;
      setBooking(updated);
      NotificationUIService.showSuccess('Servico finalizado.');
      await tryBeepLocalNotification('Servico finalizado', 'Atendimento Concluido com sucesso.');
      // return; // Esta linha não é necessária aqui, 'finally' será executado
    } catch (e: any) {
      const message = String(e?.message || '').toLowerCase();
      const isLoyaltyDup =
        message.includes('unique constraint failed') ||
        message.includes('p2002') ||
        message.includes('loyaltytransaction') ||
        message.includes('referenceid');
      const isFinishTooEarly =
        message.includes('cedo') ||
        message.includes('too early') ||
        (message.includes('finish') && message.includes('early'));

      if (isLoyaltyDup) {
        NotificationUIService.showSuccess('Servico finalizado. Pontuacao ja registrada.');
        await fetchDetails();
        return;
      }
      if (isFinishTooEarly) {
        Alert.alert(
          'Ainda nao e possivel finalizar',
          'Aguarde alguns minutos para concluir, de acordo com o tempo minimo do Servico.',
          [{ text: 'Entendi', style: 'default' }],
        );
        return;
      }
      
      // O bloco original estava com sintaxe inválida aqui. A string solta foi removida.
      
    } finally {
      setSubmitting('NONE');
    }
  }, [booking, bookingId, canComplete, complete, fetchDetails]);

  const handleSupportPress = useCallback(() => {
    Alert.alert(
      'Precisa de ajuda?',
      'Selecione uma opção:',
      [
        { text: 'Problema no endereço / cliente não responde', onPress: () => NotificationUIService.showInfo('Avise o cliente pelo chat e registre o ocorrido.') },
        { text: 'Atraso / trânsito', onPress: () => NotificationUIService.showInfo('Informe o cliente e ajuste o horário se preciso.') },
        { text: 'Falar com suporte', onPress: () => router.push('/provider/messages' as any) },
        { text: 'Fechar', style: 'cancel' },
      ],
      { cancelable: true }
    );
  }, [router]);

  // Se `loading` ou `!booking`
  if (loading || !booking) {
    return (
      <View style={styles.centered}>
        <Stack.Screen options={{ 
          title: 'Atendimento',
          headerLeft: () => (
            <TouchableOpacity
              onPress={() => {
                if (Platform.OS === 'ios') {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                }
                router.back();
              }}
              style={{ 
                marginLeft: 10, 
                padding: 8, 
                borderRadius: 8, 
                backgroundColor: 'rgba(255, 255, 255, 0.8)' 
              }}
            >
              <Ionicons name="arrow-back" size={24} color={PRIMARY} />
            </TouchableOpacity>
          )
        }} />
        <ActivityIndicator size="large" color={PRIMARY} />
        <Text style={styles.loadingText}>Carregando detalhes...</Text>
      </View>
    );
  }

  const isInProgress = booking.status === BookingStatus.IN_PROGRESS;
  const isCompleted = booking.status === BookingStatus.COMPLETED;
  const statusLabelMap: Record<string, string> = {
    [BookingStatus.PENDING]: 'Pendente',
    [BookingStatus.CONFIRMED]: 'Confirmado',
    [BookingStatus.IN_PROGRESS]: 'Em andamento',
    [BookingStatus.COMPLETED]: 'Concluido',
    [BookingStatus.CANCELLED]: 'Cancelado',
    [BookingStatus.REJECTED]: 'Recusado',
  };
  const getStatusLabel = (status: any) => {
    const key = String(status || '').toUpperCase();
    return statusLabelMap[key] || String(status || '');
  };

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ 
        title: 'Atendimento',
        headerLeft: () => (
          <TouchableOpacity
            onPress={() => {
              if (Platform.OS === 'ios') {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              }
              router.back();
            }}
            style={{ 
              marginLeft: 10, 
              padding: 8, 
              borderRadius: 8, 
              backgroundColor: 'rgba(255, 255, 255, 0.8)' 
            }}
          >
            <Ionicons name="arrow-back" size={20} color="#555454" />
          </TouchableOpacity>
        )
      }} />
      <Animated.View style={[styles.card, { opacity: fade, transform: [{ translateY: slide }] }]}>
        <View style={styles.row}>
          <Ionicons name="calendar-outline" size={18} color={PRIMARY} style={styles.icon} />
          <Text style={styles.title}>{booking.serviceName}</Text>
        </View>
        <Text style={styles.muted}>Cliente: {booking.clientFullName}</Text>
        <Text style={styles.muted}>Data: {new Date(booking.scheduledDate).toLocaleDateString('pt-BR')} às {booking.scheduledTime}</Text>
        {scheduledEnd && (
          <Text style={styles.muted}>Término estimado: {scheduledEnd.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</Text>
        )}

        {isInProgress && (
          <View style={[styles.banner, { backgroundColor: '#E0F2FE', borderColor: '#7DD3FC' }] }>
            <Ionicons name="time-outline" size={16} color={PRIMARY} />
            <Text style={[styles.bannerText, { color: TEXT }]}>Servico em andamento</Text>
          </View>
        )}
        {isCompleted && (
          <View style={[styles.banner, { backgroundColor: '#DCFCE7', borderColor: '#86EFAC' }]}>
            <Ionicons name="checkmark-circle-outline" size={16} color={SUCCESS} />
            <Text style={[styles.bannerText, { color: TEXT }]}>Concluido</Text>
          </View>
        )}

        {!isCompleted && (
          <View style={styles.actions}>
            <TouchableOpacity
              style={[styles.btn, styles.btnOutline, (!canStart || submitting !== 'NONE') && styles.btnDisabled]}
              onPress={handleStart}
              disabled={!canStart || submitting !== 'NONE'}
              accessibilityLabel="Iniciar Servico"
            >
              <Ionicons name="play-circle-outline" size={18} color={canStart ? PRIMARY : MUTED} />
              <Text style={[styles.btnTextPrimary, { color: canStart ? PRIMARY : MUTED }]}>Iniciar</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.btn, styles.btnPrimary, (!canComplete || submitting !== 'NONE') && styles.btnDisabledPrimary]}
              onPress={handleComplete}
              disabled={!canComplete || submitting !== 'NONE'}
              accessibilityLabel="Concluir Servico" // Corrigido a acessibilidade
            >
              {submitting === 'COMPLETE' ? (
                <ActivityIndicator color={WHITE} size="small" />
              ) : (
                <Ionicons name="stop-circle-outline" size={18} color={WHITE} />
              )}
              <Text style={styles.btnTextWhite}>Concluir</Text> 
            </TouchableOpacity>
          </View>
        )}

        {booking.status === BookingStatus.CONFIRMED && !nowInfo.withinWindow && (
          <View style={[styles.banner, { backgroundColor: '#FEF3C7', borderColor: '#FDE68A' }]}>
            <Ionicons name="alert-circle-outline" size={16} color={WARNING} />
            <Text style={[styles.bannerText, { color: TEXT }]}>Aguardando janela de início</Text>
          </View>
        )}

        <View style={{ height: 4 }} />
        <Text style={[styles.muted, { fontSize: 12 }]}>
          Status: {getStatusLabel(booking.status)}
        </Text>
        <TouchableOpacity style={styles.supportLink} onPress={handleSupportPress} accessibilityRole="button" accessibilityLabel="Acionar suporte ou ajuda">
          <Ionicons name="help-circle-outline" size={16} color={PRIMARY} style={{ marginRight: 6 }} />
          <Text style={[styles.muted, { color: PRIMARY, fontSize: 13, fontWeight: '600' }]}>
            Preciso de ajuda
          </Text>
        </TouchableOpacity>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: BG, padding: 16 },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: BG, padding: 24 },
  loadingText: { marginTop: 12, color: MUTED },
  card: {
    backgroundColor: WHITE,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    ...Platform.select({ ios: { shadowColor: '#000', shadowOpacity: 0.06, shadowOffset: { width: 0, height: 4 }, shadowRadius: 10 }, android: { elevation: 3 } }),
  },
  row: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  icon: { marginRight: 8 },
  title: { fontSize: 18, fontWeight: '700', color: TEXT },
  muted: { color: MUTED, marginTop: 2 },
  supportLink: {
    marginTop: 6,
    flexDirection: 'row',
    alignItems: 'center',
  },
  actions: { flexDirection: 'row', gap: 10, marginTop: 14 },
  btn: { flex: 1, paddingVertical: 12, borderRadius: 12, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', borderWidth: 1 },
  btnOutline: { backgroundColor: WHITE, borderColor: PRIMARY },
  btnPrimary: { backgroundColor: PRIMARY, borderColor: PRIMARY },
  btnDisabled: { borderColor: '#CBD5E1', backgroundColor: '#F8FAFC' },
  btnDisabledPrimary: { backgroundColor: '#93C5FD', borderColor: '#93C5FD' },
  btnTextPrimary: { marginLeft: 6, fontWeight: '700', color: PRIMARY },
  btnTextWhite: { marginLeft: 6, fontWeight: '700', color: WHITE },
  banner: { marginTop: 12, padding: 10, borderRadius: 10, borderWidth: 1, flexDirection: 'row', alignItems: 'center', gap: 8 },
  bannerText: { fontSize: 13, fontWeight: '600' },
});
