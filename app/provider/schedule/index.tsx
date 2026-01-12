import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import timezone from 'dayjs/plugin/timezone';
import 'dayjs/locale/pt-br';
import { useRouter } from 'expo-router';
import React, { Suspense, useEffect, useMemo, useState, useCallback } from 'react';
import {
  ActivityIndicator,
  FlatList,
  RefreshControl,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  LogBox,
  Alert
} from 'react-native';
import ProviderNavBar from '../../../components/provider/navigation/ProviderNavBar';
import { ResilientErrorBoundary } from '../../../components/common/ResilientErrorBoundary';
import { PROVIDER_ROUTES } from '../../../constants/routes';
import { useProviderSchedule } from '../../../hooks/useProviderSchedule';
import { BookingDetails, BookingStatus } from '../../../types/backend/bookings';

// Silencia avisos de rotas do navigator e animações experimentais
LogBox.ignoreLogs([
  'Layout children: No route named',
  'setLayoutAnimationEnabledExperimental'
]);

dayjs.extend(utc);
dayjs.extend(timezone);
dayjs.locale('pt-br');

const Colors = {
  primary: '#2563EB',      
  primarySoft: '#E7F0FF',  
  primaryLight: '#DBEAFE', 
  bgSoft: '#F8FAFC',       
  surface: '#FFFFFF',
  border: '#E2E8F0',
  text: '#0F172A',
  textMuted: '#64748B',
};

const TIMEZONE = 'America/Sao_Paulo';
const TIMELINE_START = 8;
const TIMELINE_END = 21;

const getStatusColor = (status: BookingStatus) => {
  const statusKey = status as unknown as string;
  if (status === BookingStatus.CONFIRMED) return '#3B82F6';
  if (statusKey === 'STARTED') return '#F59E0B'; 
  if (statusKey === 'FINISHED') return '#10B981'; 
  if (status === BookingStatus.CANCELLED) return '#EF4444';
  return '#94A3B8';
};

interface ScheduleViewProps {
  scheduleState: any;
  selectedDate: string;
  setSelectedDate: (date: string) => void;
  selectedDateKey: string;
}

const ScheduleSuspenseFallback = () => (
  <View style={styles.fallback}>
    <ActivityIndicator size="large" color={Colors.primary} />
    <Text style={styles.fallbackText}>Sincronizando agenda...</Text>
  </View>
);

function ScheduleView({ scheduleState, selectedDate, setSelectedDate, selectedDateKey }: ScheduleViewProps) {
  const router = useRouter();
  const { appointments, refreshing, refresh } = scheduleState;

  const normalizedAppointments = useMemo(() => {
    const now = dayjs().tz(TIMEZONE);
    return (appointments || []).map((item: BookingDetails) => {
      const scheduledMoment = dayjs.utc(item.scheduledStart || `${item.scheduledDate}T${item.scheduledTime}`).tz(TIMEZONE);
      
      const isStarted = (item.status as unknown as string) === 'STARTED';
      const duration = item.durationMinutes ?? 60;
      const progressPercent = isStarted 
        ? Math.min(1, Math.max(0, now.diff(scheduledMoment, 'minute') / duration)) 
        : null;

      return {
        ...item,
        scheduledMoment,
        dateKey: scheduledMoment.format('YYYY-MM-DD'),
        clientName: item.clientFullName || 'Cliente',
        serviceType: item.serviceName || 'Serviço',
        startTimeLabel: scheduledMoment.format('HH:mm'),
        statusColor: getStatusColor(item.status),
        progressPercent,
      };
    });
  }, [appointments]);

  const timelineRows = useMemo(() => {
    const hours = Array.from({ length: TIMELINE_END - TIMELINE_START + 1 }, (_, i) => TIMELINE_START + i);
    const dayAppointments = normalizedAppointments.filter((a: any) => a.dateKey === selectedDateKey);
    return hours.map(hour => ({
      hour,
      booking: dayAppointments.find((a: any) => a.scheduledMoment.hour() === hour),
      isNowLine: dayjs().tz(TIMEZONE).hour() === hour && dayjs(selectedDateKey).isSame(dayjs(), 'day')
    }));
  }, [normalizedAppointments, selectedDateKey]);

  const dateStrip = useMemo(() => {
    return Array.from({ length: 7 }, (_, i) => {
      const d = dayjs(selectedDateKey).tz(TIMEZONE).startOf('day').add(i - 3, 'day');
      return { iso: d.format('YYYY-MM-DD'), label: d.format('D'), dayName: d.format('ddd').toUpperCase(), isSelected: d.isSame(dayjs(selectedDateKey), 'day') };
    });
  }, [selectedDateKey]);

  const handleRefresh = useCallback(() => {
    if (!refreshing) {
      refresh();
    }
  }, [refreshing, refresh]);

  const renderTimelineItem = ({ item }: { item: any }) => (
    <View style={[styles.timelineRow, item.isNowLine && styles.timelineNowRow]}>
      <View style={styles.hourColumn}>
        <Text style={styles.hourLabel}>{`${String(item.hour).padStart(2, '0')}h`}</Text>
      </View>
      {item.booking ? (
        <TouchableOpacity 
          style={styles.timelineCard} 
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            router.push(`${PROVIDER_ROUTES.ACTIVE_BOOKING}/${item.booking.id}`);
          }}
        >
          <View style={[styles.statusIndicator, { backgroundColor: item.booking.statusColor }]} />
          <View style={styles.cardBody}>
            <View style={styles.cardHeader}>
              <Text style={styles.cardTitle} numberOfLines={1}>{item.booking.clientName}</Text>
              <Text style={styles.cardTime}>{item.booking.startTimeLabel}</Text>
            </View>
            <Text style={styles.cardSubtitle}>{item.booking.serviceType}</Text>
            {item.booking.progressPercent !== null && (
              <View style={styles.progressTrack}>
                <View style={[styles.progressFill, { width: `${item.booking.progressPercent * 100}%` }]} />
              </View>
            )}
          </View>
        </TouchableOpacity>
      ) : (
        <View style={styles.availableContainer}>
          <Text style={styles.availableLabel}>Horário Livre</Text>
          <TouchableOpacity 
            style={styles.availableButton} 
            onPress={() => router.push(PROVIDER_ROUTES.MANAGE_AVAILABILITY)}
          >
            <Ionicons name="add" size={14} color="#FFF" />
            <Text style={styles.availableButtonText}>Abrir</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}><Text style={styles.headerTitle}>Agenda</Text></View>
      <View style={styles.dateStripContainer}>
        <FlatList
          data={dateStrip}
          horizontal
          showsHorizontalScrollIndicator={false}
          keyExtractor={d => d.iso}
          renderItem={({ item }) => (
            <TouchableOpacity 
              style={[styles.dateChip, item.isSelected && styles.dateChipActive]} 
              onPress={() => setSelectedDate(item.iso)}
            >
              <Text style={[styles.dateDayName, item.isSelected && styles.dateTextActive]}>{item.dayName}</Text>
              <Text style={[styles.dateDayNum, item.isSelected && styles.dateTextActive]}>{item.label}</Text>
            </TouchableOpacity>
          )}
        />
      </View>
      <FlatList
        data={timelineRows}
        keyExtractor={r => `${r.hour}`}
        renderItem={renderTimelineItem}
        contentContainerStyle={styles.timelineList}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor={Colors.primary} />}
      />
      <ProviderNavBar />
    </View>
  );
}

const MyScheduleScreen = () => {
  const [selectedDate, setSelectedDate] = useState(() => dayjs().tz(TIMEZONE).format('YYYY-MM-DD'));
  const [debouncedDate, setDebouncedDate] = useState(selectedDate);

  // Debounce para evitar múltiplas chamadas enquanto navega no calendário
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedDate(selectedDate);
    }, 400); // Reduzido para 400ms para melhor fluidez sem loop
    return () => clearTimeout(handler);
  }, [selectedDate]);

  // CORREÇÃO CRÍTICA: Memoizar o objeto dateBounds para evitar loops infinitos no hook
  const dateBounds = useMemo(() => ({
    start: dayjs(debouncedDate).tz(TIMEZONE).startOf('day').toISOString(),
    end: dayjs(debouncedDate).tz(TIMEZONE).endOf('day').toISOString()
  }), [debouncedDate]);

  const scheduleState = useProviderSchedule(dateBounds);

  // Tratamento de Erros e Throttling
  const apiError = scheduleState.error as any;
  const isThrottled = apiError?.statusCode === 429 || apiError?.status === 429;

  useEffect(() => {
    if (isThrottled) {
      Alert.alert("Aviso", "Muitas requisições. Aguarde um momento para atualizar a agenda.");
    }
  }, [isThrottled]);

  return (
    <ResilientErrorBoundary onRetry={isThrottled ? undefined : scheduleState.retry}>
      <Suspense fallback={<ScheduleSuspenseFallback />}>
        <ScheduleView
          scheduleState={scheduleState}
          selectedDate={selectedDate}
          setSelectedDate={setSelectedDate}
          selectedDateKey={selectedDate}
        />
      </Suspense>
    </ResilientErrorBoundary>
  );
};

export default MyScheduleScreen;

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bgSoft, paddingTop: 60 },
  header: { paddingHorizontal: 20, marginBottom: 15 },
  headerTitle: { fontSize: 24, fontWeight: '800', color: Colors.text },
  dateStripContainer: { paddingLeft: 20, marginBottom: 20 },
  dateChip: { width: 55, height: 75, justifyContent: 'center', alignItems: 'center', backgroundColor: '#FFF', borderRadius: 12, marginRight: 10, borderWidth: 1, borderColor: Colors.border },
  dateChipActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  dateDayName: { fontSize: 10, fontWeight: '700', color: Colors.textMuted },
  dateDayNum: { fontSize: 16, fontWeight: '800', color: Colors.text },
  dateTextActive: { color: '#FFF' },
  timelineList: { paddingHorizontal: 20, paddingBottom: 100 },
  timelineRow: { flexDirection: 'row', marginBottom: 15, alignItems: 'center' },
  timelineNowRow: { backgroundColor: Colors.primarySoft, borderRadius: 12, paddingVertical: 5 },
  hourColumn: { width: 45 },
  hourLabel: { fontSize: 12, fontWeight: '600', color: Colors.textMuted },
  timelineCard: { flex: 1, flexDirection: 'row', backgroundColor: '#FFF', borderRadius: 12, minHeight: 80, elevation: 2, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 5 },
  statusIndicator: { width: 4, borderTopLeftRadius: 12, borderBottomLeftRadius: 12 },
  cardBody: { flex: 1, padding: 12, justifyContent: 'center' },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between' },
  cardTitle: { fontSize: 15, fontWeight: '700', color: Colors.text, flex: 1, marginRight: 10 },
  cardTime: { fontSize: 12, fontWeight: '700', color: Colors.primary },
  cardSubtitle: { fontSize: 12, color: Colors.textMuted, marginTop: 2 },
  progressTrack: { height: 3, backgroundColor: '#E2E8F0', borderRadius: 2, marginTop: 10, overflow: 'hidden' },
  progressFill: { height: '100%', backgroundColor: '#F59E0B' },
  availableContainer: { flex: 1, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 12, borderRadius: 12, borderWidth: 1, borderStyle: 'dashed', borderColor: Colors.primaryLight, backgroundColor: '#FFF' },
  availableLabel: { fontSize: 13, color: Colors.textMuted },
  availableButton: { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.primary, paddingVertical: 5, paddingHorizontal: 10, borderRadius: 15 },
  availableButtonText: { color: '#FFF', fontSize: 11, fontWeight: '700', marginLeft: 3 },
  fallback: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  fallbackText: { marginTop: 10, color: Colors.textMuted }
});