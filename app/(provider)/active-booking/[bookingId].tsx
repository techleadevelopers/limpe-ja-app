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

import { getBookingDetails, updateBookingStatus } from '../../../services/bookingService';
import { BookingDetails, BookingStatus } from '../../../types/backend/bookings';
import NotificationUIService from '../../../services/notificationUIService';

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
  } catch (e) {
    try {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch {}
  }
}

export default function ActiveBookingDetails() {
  const { bookingId } = useLocalSearchParams<{ bookingId: string }>();
  const router = useRouter();
  const { fade, slide } = useAnimatedMount();

  const [booking, setBooking] = useState<BookingDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState<'NONE' | 'START' | 'COMPLETE'>('NONE');

  const fetchDetails = useCallback(async () => {
    if (!bookingId) return;
    setLoading(true);
    try {
      const data = await getBookingDetails(bookingId);
      setBooking(data);
    } catch (e: any) {
      NotificationUIService.showError(e);
    } finally {
      setLoading(false);
    }
  }, [bookingId]);

  useEffect(() => {
    fetchDetails();
  }, [fetchDetails]);

  const scheduledStart = useMemo(() => {
    if (!booking) return null;
    return parseDateTime(booking.scheduledDate, booking.scheduledTime);
  }, [booking]);

  const scheduledEnd = useMemo(() => {
    if (!booking) return null;
    const start = parseDateTime(booking.scheduledDate, booking.scheduledTime);
    if (Number.isNaN(start.getTime())) return null;
    const durMin = booking.serviceDurationMinutes ?? 120;
    return new Date(start.getTime() + durMin * 60000);
  }, [booking]);

  const nowInfo = useMemo(() => {
    const now = new Date();
    if (!scheduledStart) return { withinWindow: false, minutesToStart: undefined as number | undefined };
    const minutesToStart = minutesBetween(scheduledStart, now);
    // Janela para iniciar: 15 min antes até 120 min depois do horário marcado (ajustável)
    const withinWindow = minutesToStart <= 15 && minutesToStart >= -120;
    return { withinWindow, minutesToStart };
  }, [scheduledStart]);

  const canStart = useMemo(() => {
    return (
      booking?.status === BookingStatus.CONFIRMED &&
      nowInfo.withinWindow
    );
  }, [booking?.status, nowInfo.withinWindow]);

  const canComplete = useMemo(() => booking?.status === BookingStatus.IN_PROGRESS, [booking?.status]);

  const handleStart = useCallback(async () => {
    if (!booking || !bookingId) return;
    if (!canStart) return;
    setSubmitting('START');
    try {
      const updated = await updateBookingStatus(bookingId, { status: BookingStatus.IN_PROGRESS });
      setBooking(updated);
      NotificationUIService.showSuccess('Serviço iniciado.');
      await tryBeepLocalNotification('Serviço iniciado', 'Você iniciou o atendimento.');
    } catch (e: any) {
      NotificationUIService.showError(e);
    } finally {
      setSubmitting('NONE');
    }
  }, [booking, bookingId, canStart]);

  const handleComplete = useCallback(async () => {
    if (!booking || !bookingId) return;
    if (!canComplete) return;
    setSubmitting('COMPLETE');
    try {
      const updated = await updateBookingStatus(bookingId, { status: BookingStatus.COMPLETED });
      setBooking(updated);
      NotificationUIService.showSuccess('Serviço finalizado.');
      await tryBeepLocalNotification('Serviço finalizado', 'Atendimento concluído com sucesso.');
      // Alert removido: feedback não-bloqueante já exibido (toast + haptics)
      return;
    } catch (e: any) {
      NotificationUIService.showError(e);
    } finally {
      setSubmitting('NONE');
    }
  }, [booking, bookingId, canComplete]);

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
            <Text style={[styles.bannerText, { color: TEXT }]}>Serviço em andamento</Text>
          </View>
        )}
        {isCompleted && (
          <View style={[styles.banner, { backgroundColor: '#DCFCE7', borderColor: '#86EFAC' }]}>
            <Ionicons name="checkmark-circle-outline" size={16} color={SUCCESS} />
            <Text style={[styles.bannerText, { color: TEXT }]}>Concluído</Text>
          </View>
        )}

        {!isCompleted && (
          <View style={styles.actions}>
            <TouchableOpacity
              style={[styles.btn, styles.btnOutline, (!canStart || submitting !== 'NONE') && styles.btnDisabled]}
              onPress={handleStart}
              disabled={!canStart || submitting !== 'NONE'}
              accessibilityLabel="Iniciar serviço"
            >
              <Ionicons name="play-circle-outline" size={18} color={canStart ? PRIMARY : MUTED} />
              <Text style={[styles.btnTextPrimary, { color: canStart ? PRIMARY : MUTED }]}>Iniciar</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.btn, styles.btnPrimary, (!canComplete || submitting !== 'NONE') && styles.btnDisabledPrimary]}
              onPress={handleComplete}
              disabled={!canComplete || submitting !== 'NONE'}
              accessibilityLabel="Finalizar serviço"
            >
              <Ionicons name="stop-circle-outline" size={18} color={WHITE} />
              <Text style={styles.btnTextWhite}>Finalizar</Text>
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
          Status: {booking.status}
        </Text>
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