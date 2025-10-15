import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Platform,
  Animated,
  Alert,
  Switch,
  FlatList,
  Dimensions,
  Easing,
  AccessibilityInfo,
} from 'react-native';
import { Stack, useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { Calendar, LocaleConfig, DateData } from 'react-native-calendars';
import * as Haptics from 'expo-haptics';
import { useAuth } from '../../../hooks/useAuth';

// Definição manual da interface Theme (baseada na doc oficial da lib)
interface Theme {
  backgroundColor?: string;
  calendarBackground?: string;
  textSectionTitleColor?: string;
  selectedDayBackgroundColor?: string;
  selectedDayTextColor?: string;
  todayTextColor?: string;
  dayTextColor?: string;
  textDisabledColor?: string;
  dotColor?: string;
  selectedDotColor?: string;
  arrowColor?: string;
  monthTextColor?: string;
  indicatorColor?: string;
  textDayFontWeight?: '300' | '400' | '500' | '600' | '700' | '800' | '900' | 'bold' | 'normal';
  textMonthFontWeight?: '300' | '400' | '500' | '600' | '700' | '800' | '900' | 'bold' | 'normal';
  textDayHeaderFontWeight?: '300' | '400' | '500' | '600' | '700' | '800' | '900' | 'bold' | 'normal';
  textDayFontSize?: number;
  textMonthFontSize?: number;
  textDayHeaderFontSize?: number;
  'stylesheet.calendar.header'?: {
    week?: {
      marginTop?: number;
      flexDirection?: string;
      justifyContent?: string;
      borderBottomWidth?: number;
      borderBottomColor?: string;
      paddingBottom?: number;
    };
    dayHeader?: {
      color?: string;
      fontWeight?: '300' | '400' | '500' | '600' | '700' | '800' | '900' | 'bold' | 'normal';
      fontSize?: number;
    };
  };
  textInactiveColor?: string;
  textActiveColor?: string;
  todayBackgroundColor?: string;
}

// Importações de serviços e tipos do backend
import {
  getMyProviderAvailability,
  updateMyProviderAvailability,
} from '../../../services/providerService';
import { getBookingsForUser } from '../../../services/bookingService';
import { ProviderAvailability, GetProviderAvailabilityResponse, UpdateAvailabilityData } from '../../../types/backend/providers';
import { BookingDetails, BookingStatus } from '../../../types/backend/bookings';

// Design tokens
const Colors = {
  primary: '#4A90E2',
  primaryDark: '#2A72E7',
  bgSoft: '#F0F7FF',
  surface: '#FFFFFF',
  border: '#E9ECEF',
  fieldBg: '#F8F9FA',
  text: '#212529',
  textMuted: '#6C757D',
  textSubtle: '#868E96',
  danger: '#D32F2F',
  success: '#2E7D32',
  shadow: 'rgba(0,0,0,0.08)',
  infoLight: '#E0F2F7',
  infoDark: '#007B8C',
};

const Radii = {
  xl: 24,
  pill: 28,
  md: 16,
  sm: 12,
};

const Spacing = {
  xs: 8,
  sm: 12,
  md: 18,
  lg: 24,
};

const easeOut = Easing.out(Easing.ease);

// Locale PT-BR (Calendário)
LocaleConfig.locales['pt-br'] = {
  monthNames: [
    'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
    'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
  ],
  monthNamesShort: ['Jan.', 'Fev.', 'Mar.', 'Abr.', 'Mai.', 'Jun.', 'Jul.', 'Ago.', 'Set.', 'Out.', 'Nov.', 'Dez.'],
  dayNames: ['Domingo', 'Segunda-feira', 'Terça-feira', 'Quarta-feira', 'Quinta-feira', 'Sexta-feira', 'Sábado'],
  dayNamesShort: ['DOM', 'SEG', 'TER', 'QUA', 'QUI', 'SEX', 'SÁB'],
  today: 'Hoje'
};
LocaleConfig.defaultLocale = 'pt-br';

// Tema do Calendário
const calendarTheme: Theme = {
  backgroundColor: Colors.bgSoft,
  calendarBackground: Colors.surface,
  textSectionTitleColor: '#586069',
  selectedDayBackgroundColor: Colors.primary,
  selectedDayTextColor: '#FFFFFF',
  todayTextColor: Colors.primary,
  dayTextColor: '#2d4150',
  textDisabledColor: '#d9e1e8',
  dotColor: Colors.primary,
  selectedDotColor: '#FFFFFF',
  arrowColor: Colors.primary,
  monthTextColor: '#1C3A5F',
  indicatorColor: Colors.primary,
  textDayFontWeight: '400' as const,
  textMonthFontWeight: 'bold' as const,
  textDayHeaderFontWeight: '500' as const,
  textDayFontSize: 16,
  textMonthFontSize: 19,
  textDayHeaderFontSize: 13,
  'stylesheet.calendar.header': {
    week: {
      marginTop: 8,
      flexDirection: 'row',
      justifyContent: 'space-around',
      borderBottomWidth: 1,
      borderBottomColor: Colors.border,
      paddingBottom: 8,
    },
    dayHeader: {
      color: Colors.textMuted,
      fontWeight: '500' as const,
      fontSize: 13,
    },
  },
  textInactiveColor: Colors.textMuted,
  textActiveColor: Colors.primary,
  todayBackgroundColor: Colors.infoLight,
};

// Helper para gerar blocos de tempo
const generateTimeSlots = (startHour: number, endHour: number, intervalMinutes: number = 30): string[] => {
  const slots: string[] = [];
  for (let h = startHour; h <= endHour; h++) {
    for (let m = 0; m < 60; m += intervalMinutes) {
      if (h === endHour && m > 0) continue;
      const hour = h < 10 ? `0${h}` : `${h}`;
      const minute = m < 10 ? `0${m}` : `${m}`;
      slots.push(`${hour}:${minute}`);
    }
  }
  return slots;
};

const ALL_POSSIBLE_SLOTS = generateTimeSlots(4, 19, 30);

interface DayAvailability {
  dayOfWeek: number;
  isEnabled: boolean;
  selectedSlots: string[];
  originalSlots: string[];
  id?: string;
}

interface SpecificDateOverride {
  date: string;
  type: 'blocked' | 'custom';
  selectedSlots?: string[];
  id?: string;
  originalSlots?: string[];
}

type PresetKey = 'morning' | 'afternoon' | 'fullday';

interface TimeSlotButtonProps {
  time: string;
  isSelected: boolean;
  onPress: (time: string) => void;
  isBooked: boolean;
}

const TimeSlotButton: React.FC<TimeSlotButtonProps> = ({ time, isSelected, onPress, isBooked }) => {
  const animatedScale = useRef(new Animated.Value(1)).current;

  const handlePressIn = () => {
    if (!isBooked) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      Animated.spring(animatedScale, { toValue: 0.92, useNativeDriver: true, tension: 200 }).start();
    }
  };

  const handlePressOut = () => {
    if (!isBooked) {
      Animated.spring(animatedScale, { toValue: 1, friction: 4, tension: 50, useNativeDriver: true }).start();
    }
  };

  const backgroundColor = isBooked
    ? Colors.textSubtle
    : isSelected
    ? Colors.primary
    : Colors.fieldBg;

  const textColor = isBooked || isSelected ? Colors.surface : Colors.text;

  return (
    <Animated.View style={{ transform: [{ scale: animatedScale }] }}>
      <TouchableOpacity
        style={[styles.timeSlotButton, { backgroundColor }]}
        onPress={() => onPress(time)}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        disabled={isBooked}
        activeOpacity={0.92}
        accessibilityRole="button"
        accessibilityLabel={`Horário ${time}${isSelected ? ' selecionado' : isBooked ? ' (agendado)' : ''}`}
        accessibilityHint="Toque para selecionar ou desmarcar"
      >
        <Text style={[styles.timeSlotText, { color: textColor }]}>{time}</Text>
        {isBooked && (
          <Ionicons
            name="lock-closed"
            size={12}
            color={textColor}
            style={styles.bookedIcon}
            accessibilityHidden={true}
          />
        )}
      </TouchableOpacity>
    </Animated.View>
  );
};

interface DayAvailabilityCardProps {
  dayName: string;
  dayOfWeek: number;
  availability: DayAvailability;
  onToggleDay: (dayOfWeek: number, isEnabled: boolean) => void;
  onToggleSlot: (dayOfWeek: number, slot: string) => void;
  onSelectAll: (dayOfWeek: number) => void;
  onClearSlots: (dayOfWeek: number) => void;
  bookedSlotsForDay: string[];
  onApplyPreset: (dayOfWeek: number, preset: PresetKey) => void;
  onCopyToOthers: (dayOfWeek: number) => void;
  onResetDay: (dayOfWeek: number) => void;
}

const DayAvailabilityCard: React.FC<DayAvailabilityCardProps> = ({
  dayName,
  dayOfWeek,
  availability,
  onToggleDay,
  onToggleSlot,
  onSelectAll,
  onClearSlots,
  bookedSlotsForDay,
  onApplyPreset,
  onCopyToOthers,
  onResetDay,
}) => {
  const cardAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(cardAnim, { toValue: 1, duration: 500, easing: easeOut, useNativeDriver: true }).start();
  }, []);

  return (
    <Animated.View style={[styles.dayCard, { opacity: cardAnim, transform: [{ translateY: cardAnim.interpolate({ inputRange: [0, 1], outputRange: [20, 0] }) }] }]}>
      <View style={styles.dayHeader}>
        <Text style={styles.dayName}>{dayName}</Text>
        <Switch
          trackColor={{ false: Colors.textMuted, true: Colors.primary }}
          thumbColor={Colors.surface}
          ios_backgroundColor={Colors.textMuted}
          onValueChange={(value) => {
            onToggleDay(dayOfWeek, value);
            if (Platform.OS === 'ios') Haptics.selectionAsync();
          }}
          value={availability.isEnabled}
          accessibilityLabel={`Ativar ${dayName.toLowerCase()}`}
          accessibilityHint="Alterna disponibilidade para o dia"
        />
      </View>

      <View style={styles.quickActionsRow}>
        <TouchableOpacity
          style={styles.quickActionChip}
          onPress={() => onApplyPreset(dayOfWeek, 'morning')}
          accessibilityRole="button"
          accessibilityLabel={`Aplicar manhã em ${dayName}`}
        >
          <Text style={styles.quickActionText}>Manhã</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.quickActionChip}
          onPress={() => onApplyPreset(dayOfWeek, 'afternoon')}
          accessibilityRole="button"
          accessibilityLabel={`Aplicar tarde em ${dayName}`}
        >
          <Text style={styles.quickActionText}>Tarde</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.quickActionChip}
          onPress={() => onApplyPreset(dayOfWeek, 'fullday')}
          accessibilityRole="button"
          accessibilityLabel={`Aplicar dia todo em ${dayName}`}
        >
          <Text style={styles.quickActionText}>Dia todo</Text>
        </TouchableOpacity>
      </View>

      {availability.isEnabled && (
        <View>
          <View style={styles.timeSlotGrid}>
            {ALL_POSSIBLE_SLOTS.map((slot, index) => {
              const currentHour = parseInt(slot.split(':')[0]);
              const prevSlot = ALL_POSSIBLE_SLOTS[index - 1];
              const prevHour = prevSlot ? parseInt(prevSlot.split(':')[0]) : -1;

              return (
                <React.Fragment key={slot}>
                  {index > 0 && currentHour !== prevHour && (
                    <View style={styles.hourSeparatorContainer}>
                      <Text style={styles.hourSeparatorText}>{`${currentHour < 10 ? '0' : ''}${currentHour}h`}</Text>
                    </View>
                  )}
                  <TimeSlotButton
                    time={slot}
                    isSelected={availability.selectedSlots.includes(slot)}
                    onPress={onToggleSlot.bind(null, dayOfWeek, slot)}
                    isBooked={bookedSlotsForDay.includes(slot)}
                  />
                </React.Fragment>
              );
            })}
          </View>
          <View style={styles.dayActions}>
            <TouchableOpacity 
              style={styles.actionButtonSecondary} 
              onPress={() => {
                onSelectAll(dayOfWeek);
                if (Platform.OS === 'ios') Haptics.selectionAsync();
              }} 
              accessibilityRole="button" 
              accessibilityLabel="Selecionar todos os horários"
            >
              <Ionicons name="checkmark-done-circle-outline" size={16} color={Colors.primary} style={styles.actionButtonIcon} accessibilityHidden={true} />
              <Text style={styles.actionButtonSecondaryText}>Selecionar Tudo</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={styles.actionButtonSecondary} 
              onPress={() => {
                onClearSlots(dayOfWeek);
                if (Platform.OS === 'ios') Haptics.selectionAsync();
              }} 
              accessibilityRole="button" 
              accessibilityLabel="Limpar horários selecionados"
            >
              <Ionicons name="trash-outline" size={16} color={Colors.primary} style={styles.actionButtonIcon} accessibilityHidden={true} />
              <Text style={styles.actionButtonSecondaryText}>Limpar</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={styles.actionButtonSecondary} 
              onPress={() => {
                onCopyToOthers(dayOfWeek);
                if (Platform.OS === 'ios') Haptics.selectionAsync();
              }} 
              accessibilityRole="button" 
              accessibilityLabel={`Copiar de ${dayName} para outros dias`}
            >
              <Ionicons name="copy-outline" size={16} color={Colors.primary} style={styles.actionButtonIcon} accessibilityHidden={true} />
              <Text style={styles.actionButtonSecondaryText}>Copiar para...</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={styles.actionButtonSecondary} 
              onPress={() => {
                onResetDay(dayOfWeek);
                if (Platform.OS === 'ios') Haptics.selectionAsync();
              }} 
              accessibilityRole="button" 
              accessibilityLabel={`Reverter alterações em ${dayName}`}
            >
              <Ionicons name="refresh-outline" size={16} color={Colors.primary} style={styles.actionButtonIcon} accessibilityHidden={true} />
              <Text style={styles.actionButtonSecondaryText}>Reverter</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
    </Animated.View>
  );
};

const InfoCard: React.FC<{ text: string }> = ({ text }) => (
  <View style={styles.infoCard}>
    <Ionicons name="information-circle-outline" size={20} color={Colors.infoDark} style={styles.infoIcon} accessibilityHidden={true} />
    <Text style={styles.infoText}>{text}</Text>
  </View>
);

export default function ManageAvailabilityScreen() {
  const router = useRouter();
  const { preset } = useLocalSearchParams<{ preset?: string }>();
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [weeklyAvailability, setWeeklyAvailability] = useState<DayAvailability[]>([]);
  const [specificDateOverrides, setSpecificDateOverrides] = useState<SpecificDateOverride[]>([]);
  const [selectedDateForOverride, setSelectedDateForOverride] = useState<string | null>(null);
  const [bookings, setBookings] = useState<BookingDetails[]>([]);
  const [activeTab, setActiveTab] = useState<'weekly' | 'overrides'>('weekly');
  const [copyModalVisible, setCopyModalVisible] = useState(false);
  const [copyFromDay, setCopyFromDay] = useState<number | null>(null);
  const [copyTargets, setCopyTargets] = useState<number[]>([]);
  // Smart Step state
  const [smartVisible, setSmartVisible] = useState(false);
  const [smartMode, setSmartMode] = useState<'weekly' | 'override'>('weekly');
  const [smartStep, setSmartStep] = useState<1 | 2 | 3>(1);
  const [smartScope, setSmartScope] = useState<'today' | 'tomorrow' | 'weekday' | 'date'>('today');
  const [smartWeekdays, setSmartWeekdays] = useState<number[]>([]);
  const [smartPreset, setSmartPreset] = useState<PresetKey | 'custom' | 'off'>('morning');
  const [smartCustomSlots, setSmartCustomSlots] = useState<string[]>([]);
  const [smartDate, setSmartDate] = useState<string | null>(null);
  const [smartOverrideType, setSmartOverrideType] = useState<'blocked' | 'custom'>('blocked');

  const headerAnim = useRef(new Animated.Value(0)).current;
  const contentAnim = useRef(new Animated.Value(0)).current;

  const dayNames = ['Domingo', 'Segunda-feira', 'Terça-feira', 'Quarta-feira', 'Quinta-feira', 'Sexta-feira', 'Sábado'];

  // ===== Handlers movidos para cima (após states, antes de useEffects/JSX) =====

  // getBookedSlotsForDay (mantido como useCallback, movido para cima - depende de bookings)
  const getBookedSlotsForDay = useCallback((dayOfWeek: number): string[] => {
    const bookedTimes: string[] = [];
    const confirmedBookings = bookings.filter(b => b.status === BookingStatus.CONFIRMED);

    confirmedBookings.forEach(booking => {
      const bookingDate = new Date(booking.scheduledDate);
      if (bookingDate.getDay() === dayOfWeek) {
        const [startHour, startMinute] = booking.scheduledTime.split(':').map(Number);
        const startTotalMinutes = startHour * 60 + startMinute;

        const endTotalMinutes = booking.scheduledEndTime
          ? parseInt(booking.scheduledEndTime.split(':')[0]) * 60 + parseInt(booking.scheduledEndTime.split(':')[1])
          : startTotalMinutes + 30;

        for (let time = startTotalMinutes; time < endTotalMinutes; time += 30) {
          const hour = Math.floor(time / 60);
          const minute = time % 60;
          bookedTimes.push(`${hour < 10 ? '0' : ''}${hour}:${minute < 10 ? '0' : ''}${minute}`);
        }
      }
    });
    return Array.from(new Set(bookedTimes));
  }, [bookings]);

  // handleToggleDay (convertido para function declaration - hoisted, sem useCallback desnecessário)
  function handleToggleDay(dayOfWeek: number, isEnabled: boolean) {
    setWeeklyAvailability(prev =>
      prev.map(day => (day.dayOfWeek === dayOfWeek ? { ...day, isEnabled } : day))
    );
  }

  // handleClearSlots (convertido para function declaration)
  function handleClearSlots(dayOfWeek: number) {
    setWeeklyAvailability(prev =>
      prev.map(day => (day.dayOfWeek === dayOfWeek ? { ...day, selectedSlots: [] } : day))
    );
  }

  // handleDayPressOnCalendar (convertido para function declaration)
  function handleDayPressOnCalendar(day: DateData) {
    setSelectedDateForOverride(day.dateString);
    const existingOverride = specificDateOverrides.find(override => override.date === day.dateString);
    AccessibilityInfo.announceForAccessibility(`Data selecionada: ${day.dateString}. Configure exceção se desejar.`);
  }

  // handleSetOverrideType (convertido para function declaration)
  function handleSetOverrideType(type: 'blocked' | 'custom') {
    if (!selectedDateForOverride) return;
    setSpecificDateOverrides(prev => {
      const existingIndex = prev.findIndex(o => o.date === selectedDateForOverride);
      if (existingIndex !== -1) {
        const updated = [...prev];
        updated[existingIndex] = { ...updated[existingIndex], type, selectedSlots: type === 'custom' ? updated[existingIndex].selectedSlots || [] : undefined };
        return updated;
      }
      return [...prev, { date: selectedDateForOverride, type, selectedSlots: type === 'custom' ? [] : undefined }];
    });
    if (Platform.OS === 'ios') Haptics.selectionAsync();
  }

  // Outros handlers (mantidos como useCallback, mas movidos para cima)
  const convertSlotsToBlocks = useCallback((slots: string[]) => {
    if (slots.length === 0) return [];

    const sortedSlots = [...slots].sort();
    const blocks: { startTime: string; endTime: string }[] = [];

    let currentBlockStart = sortedSlots[0];
    let currentBlockEnd = sortedSlots[0];

    for (let i = 0; i < sortedSlots.length; i++) {
      const currentSlot = sortedSlots[i];
      const [currentHour, currentMinute] = currentSlot.split(':').map(Number);
      const currentTotalMinutes = currentHour * 60 + currentMinute;

      if (i === sortedSlots.length - 1) {
        const [endHour, endMinute] = currentBlockEnd.split(':').map(Number);
        const finalEndTotalMinutes = endHour * 60 + endMinute + 30;
        const finalEndHour = Math.floor(finalEndTotalMinutes / 60);
        const finalEndMinute = finalEndTotalMinutes % 60;
        blocks.push({
          startTime: currentBlockStart,
          endTime: `${finalEndHour < 10 ? '0' : ''}${finalEndHour}:${finalEndMinute < 10 ? '0' : ''}${finalEndMinute}`
        });
      } else {
        const nextSlot = sortedSlots[i + 1];
        const [nextHour, nextMinute] = nextSlot.split(':').map(Number);
        const nextTotalMinutes = nextHour * 60 + nextMinute;

        if (nextTotalMinutes === currentTotalMinutes + 30) {
          currentBlockEnd = currentSlot;
        } else {
          const [endHour, endMinute] = currentBlockEnd.split(':').map(Number);
          const finalEndTotalMinutes = endHour * 60 + endMinute + 30;
          const finalEndHour = Math.floor(finalEndTotalMinutes / 60);
          const finalEndMinute = finalEndTotalMinutes % 60;
          blocks.push({
            startTime: currentBlockStart,
            endTime: `${finalEndHour < 10 ? '0' : ''}${finalEndHour}:${finalEndMinute < 10 ? '0' : ''}${finalEndMinute}`
          });
          currentBlockStart = nextSlot;
          currentBlockEnd = nextSlot;
        }
      }
    }
    return blocks;
  }, []);

  const loadData = useCallback(async () => {
    if (!user?.id) {
      console.warn("User ID não disponível, não carregando dados de disponibilidade.");
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    try {
      const today = new Date();
      const year = today.getFullYear();
      const month = String(today.getMonth() + 1).padStart(2, '0');
      const day = String(today.getDate()).padStart(2, '0');
      const currentDate = `${year}-${month}-${day}`;

      const { available: providerAvailabilities } = await getMyProviderAvailability(currentDate);

      const initialWeekly: DayAvailability[] = Array.from({ length: 7 }, (_, i) => ({
        dayOfWeek: i,
        isEnabled: false,
        selectedSlots: [],
        originalSlots: [],
      }));

      providerAvailabilities.forEach((avail: ProviderAvailability) => {
        const dayIndex = initialWeekly.findIndex(d => d.dayOfWeek === avail.dayOfWeek);
        if (dayIndex !== -1) {
          const startMinutes = parseInt(avail.startTime.split(':')[0]) * 60 + parseInt(avail.startTime.split(':')[1]);
          const endMinutes = parseInt(avail.endTime.split(':')[0]) * 60 + parseInt(avail.endTime.split(':')[1]);
          const currentSlots: string[] = [];
          for (let time = startMinutes; time < endMinutes; time += 30) {
            const hour = Math.floor(time / 60);
            const minute = time % 60;
            currentSlots.push(`${hour < 10 ? '0' : ''}${hour}:${minute < 10 ? '0' : ''}${minute}`);
          }
          initialWeekly[dayIndex] = {
            ...initialWeekly[dayIndex],
            isEnabled: true,
            selectedSlots: currentSlots,
            originalSlots: currentSlots,
            id: avail.id,
          };
        }
      });
      setWeeklyAvailability(initialWeekly);

      setSpecificDateOverrides([]);

      const allBookings: BookingDetails[] = await getBookingsForUser(BookingStatus.CONFIRMED);
      setBookings(allBookings);

      Animated.parallel([
        Animated.timing(headerAnim, { toValue: 1, duration: 600, easing: easeOut, useNativeDriver: true }),
        Animated.timing(contentAnim, { toValue: 1, duration: 700, easing: easeOut, useNativeDriver: true }),
      ]).start();

    } catch (error: any) {
      console.error('Erro ao carregar dados de disponibilidade:', error);
      Alert.alert('Erro', 'Não foi possível carregar sua disponibilidade. Tente novamente.');
    } finally {
      setIsLoading(false);
    }
  }, [user?.id, headerAnim, contentAnim]);

  const applyPresetSlots = useCallback((preset: PresetKey): string[] => {
    if (preset === 'morning') return generateTimeSlots(8, 12, 30);
    if (preset === 'afternoon') return generateTimeSlots(13, 17, 30);
    return generateTimeSlots(8, 18, 30);
  }, []);

  const handleApplyPreset = useCallback((dayOfWeek: number, preset: PresetKey) => {
    setWeeklyAvailability(prev => prev.map(d => {
      if (d.dayOfWeek !== dayOfWeek) return d;
      const newSlots = applyPresetSlots(preset);
      return { ...d, isEnabled: true, selectedSlots: newSlots };
    }));
    AccessibilityInfo.announceForAccessibility?.('Preset aplicado');
  }, [applyPresetSlots]);

  const handleResetDayToOriginal = useCallback((dayOfWeek: number) => {
    setWeeklyAvailability(prev => prev.map(d => {
      if (d.dayOfWeek !== dayOfWeek) return d;
      const enabled = (d.originalSlots || []).length > 0;
      return { ...d, isEnabled: enabled, selectedSlots: d.originalSlots || [] };
    }));
  }, []);

  const openCopyModal = useCallback((fromDay: number) => {
    setCopyFromDay(fromDay);
    setCopyTargets([]);
    setCopyModalVisible(true);
  }, []);

  const toggleCopyTarget = useCallback((day: number) => {
    setCopyTargets(prev => prev.includes(day) ? prev.filter(d => d !== day) : [...prev, day]);
  }, []);

  const applyCopyToTargets = useCallback((overrideFrom?: number, overrideTargets?: number[]) => {
    const from = overrideFrom ?? copyFromDay;
    const targets = overrideTargets ?? copyTargets;
    if (from == null) return;
    const source = weeklyAvailability.find(d => d.dayOfWeek === from);
    if (!source) return;
    const sourceSlots = source.selectedSlots || [];
    setWeeklyAvailability(prev => prev.map(d => {
      if (!targets.includes(d.dayOfWeek) || d.dayOfWeek === from) return d;
      const booked = getBookedSlotsForDay(d.dayOfWeek);
      const filtered = sourceSlots.filter(s => !booked.includes(s));
      return { ...d, isEnabled: filtered.length > 0, selectedSlots: filtered };
    }));
    setCopyModalVisible(false);
    setCopyFromDay(null);
    setCopyTargets([]);
    AccessibilityInfo.announceForAccessibility?.('Disponibilidade copiada');
  }, [copyFromDay, copyTargets, weeklyAvailability, getBookedSlotsForDay]);

  const openSmartStep = useCallback((mode: 'weekly' | 'override' = 'weekly') => {
    setSmartMode(mode);
    setSmartStep(1);
    setSmartScope('today');
    setSmartPreset('morning');
    setSmartWeekdays([]);
    setSmartCustomSlots([]);
    setSmartDate(null);
    setSmartOverrideType('blocked');
    setSmartVisible(true);
    if (Platform.OS === 'ios') Haptics.selectionAsync();
  }, []);

  const toggleSmartWeekday = useCallback((dow: number) => {
    setSmartWeekdays(prev => prev.includes(dow) ? prev.filter(d => d !== dow) : [...prev, dow]);
  }, []);

  const toggleSmartCustomSlot = useCallback((slot: string) => {
    setSmartCustomSlots(prev => prev.includes(slot) ? prev.filter(s => s !== slot) : [...prev, slot].sort());
    if (Platform.OS === 'ios') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  }, []);

  const applySmartStep = useCallback(() => {
    try {
      if (smartMode === 'weekly') {
        const now = new Date();
        const today = now.getDay();
        const targetDays: number[] =
          smartScope === 'today' ? [today]
          : smartScope === 'tomorrow' ? [(today + 1) % 7]
          : smartScope === 'weekday' ? [...smartWeekdays]
          : [];

        if (smartScope === 'date') {
          setActiveTab('overrides');
          setSmartMode('override');
          setSmartStep(1);
          return;
        }

        if (targetDays.length === 0) {
          AccessibilityInfo.announceForAccessibility?.('Selecione pelo menos um dia.');
          return;
        }

        if (smartPreset === 'off') {
          targetDays.forEach(d => { handleClearSlots(d); handleToggleDay(d, false); });
        } else if (smartPreset === 'custom') {
          const base = targetDays[0];
          setWeeklyAvailability(prev => prev.map(day => day.dayOfWeek === base ? { ...day, isEnabled: smartCustomSlots.length > 0, selectedSlots: smartCustomSlots } : day));
          if (targetDays.length > 1) {
            const targets = targetDays.slice(1);
            applyCopyToTargets(base, targets);
          }
        } else {
          const base = targetDays[0];
          handleApplyPreset(base, smartPreset as PresetKey);
          if (targetDays.length > 1) {
            const targets = targetDays.slice(1);
            applyCopyToTargets(base, targets);
          }
        }
        setSmartVisible(false);
        if (Platform.OS === 'ios') Haptics.selectionAsync();
        AccessibilityInfo.announceForAccessibility?.('Disponibilidade atualizada');
      } else {
        if (!smartDate) {
          AccessibilityInfo.announceForAccessibility?.('Selecione uma data.');
          return;
        }
        const parts = smartDate.split('-').map(n => parseInt(n, 10));
        const dd: DateData = { dateString: smartDate, day: parts[2], month: parts[1], year: parts[0], timestamp: new Date(smartDate).getTime() } as DateData;
        handleDayPressOnCalendar(dd);

        if (smartOverrideType === 'blocked') {
          handleSetOverrideType('blocked');
        } else {
          handleSetOverrideType('custom');
          setSpecificDateOverrides(prev => {
            const existingIndex = prev.findIndex(o => o.date === smartDate);
            if (existingIndex !== -1) {
              const updated = [...prev];
              updated[existingIndex] = { ...updated[existingIndex], type: 'custom', selectedSlots: [...smartCustomSlots] };
              return updated;
            }
            return [...prev, { date: smartDate, type: 'custom', selectedSlots: [...smartCustomSlots] }];
          });
        }
        setSmartVisible(false);
        if (Platform.OS === 'ios') Haptics.selectionAsync();
        AccessibilityInfo.announceForAccessibility?.('Exceção atualizada');
      }
    } catch (e) {
      console.error('Erro ao aplicar assistente:', e);
    }
  }, [smartMode, smartScope, smartWeekdays, smartPreset, smartCustomSlots, smartDate, smartOverrideType, weeklyAvailability, handleClearSlots, handleToggleDay, handleApplyPreset, applyCopyToTargets, handleDayPressOnCalendar, handleSetOverrideType]);

  const handleToggleSlot = useCallback((dayOfWeek: number, slot: string) => {
    setWeeklyAvailability(prev =>
      prev.map(day => {
        if (day.dayOfWeek === dayOfWeek) {
          const newSlots = day.selectedSlots.includes(slot)
            ? day.selectedSlots.filter(s => s !== slot)
            : [...day.selectedSlots, slot].sort();
          return { ...day, selectedSlots: newSlots };
        }
        return day;
      })
    );
  }, []);

  const handleSelectAllSlots = useCallback((dayOfWeek: number) => {
    setWeeklyAvailability(prev =>
      prev.map(day => (day.dayOfWeek === dayOfWeek ? { ...day, selectedSlots: ALL_POSSIBLE_SLOTS } : day))
    );
  }, []);

  const handleToggleOverrideSlot = useCallback((slot: string) => {
    if (!selectedDateForOverride) return;
    setSpecificDateOverrides(prev => {
      const existingIndex = prev.findIndex(o => o.date === selectedDateForOverride);
      if (existingIndex !== -1 && prev[existingIndex].type === 'custom') {
        const updated = [...prev];
        const currentSlots = updated[existingIndex].selectedSlots || [];
        const newSlots = currentSlots.includes(slot)
          ? currentSlots.filter(s => s !== slot)
          : [...currentSlots, slot].sort();
        updated[existingIndex] = { ...updated[existingIndex], selectedSlots: newSlots };
        return updated;
      }
      return prev;
    });
    if (Platform.OS === 'ios') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  }, [selectedDateForOverride]);

  const handleClearOverride = useCallback(() => {
    if (!selectedDateForOverride) return;
    setSpecificDateOverrides(prev => prev.filter(o => o.date !== selectedDateForOverride));
    setSelectedDateForOverride(null);
    if (Platform.OS === 'ios') Haptics.selectionAsync();
    AccessibilityInfo.announceForAccessibility('Exceção removida para esta data.');
  }, [selectedDateForOverride]);

  const handleSaveAvailability = useCallback(async () => {
    if (!user?.id) {
      Alert.alert("Erro", "ID do provedor não encontrado. Faça login novamente.");
      return;
    }

    setIsSaving(true);

    try {
      const allAvailabilityUpdates: UpdateAvailabilityData[] = [];

      for (const day of weeklyAvailability) {
        const newBlocks = convertSlotsToBlocks(day.selectedSlots);
        if (day.isEnabled && newBlocks.length > 0) {
          newBlocks.forEach(block => {
            allAvailabilityUpdates.push({
              dayOfWeek: day.dayOfWeek,
              startTime: block.startTime,
              endTime: block.endTime,
              isAvailable: true,
            });
          });
        }
      }

      await updateMyProviderAvailability(allAvailabilityUpdates);

      for (const override of specificDateOverrides) {
        if (override.type === 'blocked') {
          console.log(`Bloqueando data: ${override.date}`);
        } else if (override.type === 'custom' && override.selectedSlots) {
          const customBlocks = convertSlotsToBlocks(override.selectedSlots);
          console.log(`Customizando data ${override.date} com slots:`, customBlocks);
        }
      }

      if (Platform.OS === 'ios') {
        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      } else {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      }
      Alert.alert('Sucesso', 'Sua disponibilidade foi salva!');
      router.back();
    } catch (error: any) {
      console.error('Erro ao salvar disponibilidade:', error.response?.data || error.message);
      if (Platform.OS === 'ios') {
        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      } else {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
      }
      Alert.alert('Erro', error.response?.data?.message || 'Não foi possível salvar sua disponibilidade. Tente novamente.');
    } finally {
      setIsSaving(false);
      loadData();
    }
  }, [user?.id, weeklyAvailability, specificDateOverrides, convertSlotsToBlocks, router, loadData]);

  const getBookedSlotsForSpecificDate = useCallback((date: string): string[] => {
    const bookedTimes: string[] = [];
    const confirmedBookings = bookings.filter(b => b.status === BookingStatus.CONFIRMED && b.scheduledDate === date);

    confirmedBookings.forEach(booking => {
      const [startHour, startMinute] = booking.scheduledTime.split(':').map(Number);
      const startTotalMinutes = startHour * 60 + startMinute;

      const endTotalMinutes = booking.scheduledEndTime
        ? parseInt(booking.scheduledEndTime.split(':')[0]) * 60 + parseInt(booking.scheduledEndTime.split(':')[1])
        : startTotalMinutes + 30;

      for (let time = startTotalMinutes; time < endTotalMinutes; time += 30) {
        const hour = Math.floor(time / 60);
        const minute = time % 60;
        bookedTimes.push(`${hour < 10 ? '0' : ''}${hour}:${minute < 10 ? '0' : ''}${minute}`);
      }
    });
    return Array.from(new Set(bookedTimes));
  }, [bookings]);

  const pendingChangesCount = useMemo(() => {
    const weeklyChanges = weeklyAvailability.reduce((acc, d) => {
      const a = (d.selectedSlots || []).join(',');
      const b = (d.originalSlots || []).join(',');
      return acc + (a !== b ? 1 : 0);
    }, 0);
    const overridesChanges = specificDateOverrides.length;
    return weeklyChanges + overridesChanges;
  }, [weeklyAvailability, specificDateOverrides]);

  const currentOverride = useMemo(() => {
    return specificDateOverrides.find(o => o.date === selectedDateForOverride);
  }, [specificDateOverrides, selectedDateForOverride]);

  const markedDates = useMemo(() => {
    const dates: { [key: string]: any } = {};
    specificDateOverrides.forEach(override => {
      if (override.type === 'blocked') {
        dates[override.date] = {
          selected: selectedDateForOverride === override.date,
          selectedColor: selectedDateForOverride === override.date ? Colors.primary : Colors.danger,
          dotColor: Colors.danger,
          marked: true,
        };
      } else if (override.type === 'custom') {
        dates[override.date] = {
          selected: selectedDateForOverride === override.date,
          selectedColor: selectedDateForOverride === override.date ? Colors.primary : Colors.primary,
          dotColor: Colors.primary,
          marked: true,
        };
      }
    });
    if (selectedDateForOverride && !dates[selectedDateForOverride]) {
      dates[selectedDateForOverride] = { selected: true, selectedColor: Colors.primary };
    }
    return dates;
  }, [specificDateOverrides, selectedDateForOverride]);

  // Apply preset actions when navigated with preset query param
  useEffect(() => {
    if (!preset) return;
    const d = new Date();
    const dow = d.getDay();
    switch (preset) {
      case 'today-morning':
        handleApplyPreset(dow, 'morning');
        break;
      case 'tomorrow-afternoon':
        handleApplyPreset((dow + 1) % 7, 'afternoon');
        break;
      case 'block-today':
        handleClearSlots(dow);
        handleToggleDay(dow, false);
        break;
      case 'repeat-week':
        openCopyModal(dow);
        setCopyTargets([1, 2, 3, 4, 5]);
        break;
    }
    if (Platform.OS === 'ios') Haptics.selectionAsync();
    AccessibilityInfo.announceForAccessibility('Disponibilidade atualizada');
  }, [preset, handleApplyPreset, handleClearSlots, handleToggleDay, openCopyModal]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  if (isLoading) {
    return (
      <View style={styles.centeredFeedback}>
        <ActivityIndicator size="large" color={Colors.primary} accessibilityLabel="Carregando disponibilidade" />
        <Text style={styles.loadingText}>Carregando disponibilidade...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />

      <Animated.View
        style={[
          styles.customHeader,
          { opacity: headerAnim, transform: [{ translateY: headerAnim.interpolate({ inputRange: [0, 1], outputRange: [-20, 0] }) }] }
        ]}
      >
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton} accessibilityRole="button" accessibilityLabel="Voltar">
          <Ionicons name="arrow-back" size={24} color="#2F3A4A" accessibilityHidden={true} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Gerenciar Disponibilidade</Text>
        <View style={styles.headerPlaceholder} />
      </Animated.View>

      <View style={styles.segmentedControl}>
        <TouchableOpacity
          style={[styles.segment, activeTab === 'weekly' && styles.segmentActive]}
          onPress={() => setActiveTab('weekly')}
          accessibilityRole="tab"
          accessibilityState={{ selected: activeTab === 'weekly' }}
        >
          <Text style={[styles.segmentText, activeTab === 'weekly' && styles.segmentTextActive]}>Semanal</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.segment, activeTab === 'overrides' && styles.segmentActive]}
          onPress={() => setActiveTab('overrides')}
          accessibilityRole="tab"
          accessibilityState={{ selected: activeTab === 'overrides' }}
        >
          <Text style={[styles.segmentText, activeTab === 'overrides' && styles.segmentTextActive]}>Exceções</Text>
        </TouchableOpacity>
      </View>

      <Animated.ScrollView
        style={[styles.scrollContainer, { opacity: contentAnim }]}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {activeTab === 'weekly' && (
          <>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginHorizontal: 20, marginTop: 8 }}>
              <TouchableOpacity 
                style={styles.quickActionChip} 
                onPress={() => {
                  const today = new Date().getDay();
                  handleApplyPreset(today, 'morning');
                  if (Platform.OS === 'ios') Haptics.selectionAsync();
                  AccessibilityInfo.announceForAccessibility('Disponibilidade salva para hoje 08-12');
                }}
              >
                <Text style={styles.quickActionText}>Disponível hoje 08-12</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={styles.quickActionChip} 
                onPress={() => {
                  const d = new Date(); 
                  const tomorrow = (d.getDay() + 1) % 7;
                  handleApplyPreset(tomorrow, 'afternoon');
                  if (Platform.OS === 'ios') Haptics.selectionAsync();
                  AccessibilityInfo.announceForAccessibility('Disponibilidade salva para amanhã 13-17');
                }}
              >
                <Text style={styles.quickActionText}>Disponível amanhã 13-17</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={styles.quickActionChip} 
                onPress={() => {
                  const t = new Date().getDay();
                  handleClearSlots(t); 
                  handleToggleDay(t, false);
                  if (Platform.OS === 'ios') Haptics.selectionAsync();
                  AccessibilityInfo.announceForAccessibility('Dia bloqueado');
                }}
              >
                <Text style={styles.quickActionText}>Bloquear hoje (folga)</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={styles.quickActionChip} 
                onPress={() => {
                  const base = new Date().getDay(); 
                  openCopyModal(base); 
                  setCopyTargets([1, 2, 3, 4, 5]);
                  if (Platform.OS === 'ios') Haptics.selectionAsync();
                  AccessibilityInfo.announceForAccessibility('Repetir esta semana');
                }}
              >
                <Text style={styles.quickActionText}>Repetir esta semana</Text>
              </TouchableOpacity>
            </View>
            <TouchableOpacity 
              style={styles.primaryCTAButton} 
              onPress={() => openSmartStep('weekly')} 
              accessibilityRole="button" 
              accessibilityLabel="Assistente de Horários"
            >
              <Ionicons name="flash-outline" size={18} color="#fff" style={{ marginRight: 8 }} accessibilityHidden={true} />
              <Text style={styles.primaryCTAButtonText}>Assistente de Horários</Text>
            </TouchableOpacity>
            <Text style={styles.sectionTitleImproved}>Disponibilidade Semanal</Text>
            <InfoCard text="Defina seus horários fixos por dia. Use os presets e copie para acelerar." />
            {weeklyAvailability.map(day => (
              <DayAvailabilityCard
                key={day.dayOfWeek}
                dayName={dayNames[day.dayOfWeek]}
                dayOfWeek={day.dayOfWeek}
                availability={day}
                onToggleDay={handleToggleDay}
                onToggleSlot={handleToggleSlot}
                onSelectAll={handleSelectAllSlots}
                onClearSlots={handleClearSlots}
                bookedSlotsForDay={getBookedSlotsForDay(day.dayOfWeek)}
                onApplyPreset={handleApplyPreset}
                onCopyToOthers={openCopyModal}
                onResetDay={handleResetDayToOriginal}
              />
            ))}
          </>
        )}

        {activeTab === 'overrides' && (
          <>
            <Text style={styles.sectionTitleImproved}>Exceções de Datas</Text>
            <TouchableOpacity 
              style={styles.primaryCTAButton} 
              onPress={() => openSmartStep('override')} 
              accessibilityRole="button" 
              accessibilityLabel="Criar exceção rápida"
            >
              <Ionicons name="calendar-outline" size={18} color="#fff" style={{ marginRight: 8 }} accessibilityHidden={true} />
              <Text style={styles.primaryCTAButtonText}>Criar exceção rápida</Text>
            </TouchableOpacity>
            <InfoCard text="Selecione uma data no calendário para bloquear ou definir horários personalizados." />
            <View style={styles.calendarOverrideContainer}>
              <Calendar
                onDayPress={handleDayPressOnCalendar}
                markedDates={markedDates}
                theme={calendarTheme}
                style={styles.calendarOverrideStyle}
                accessibilityLabel="Calendário para exceções de datas"
                accessibilityHint="Selecione uma data para configurar exceção"
              />
              {selectedDateForOverride && (
                <View style={styles.overrideOptionsCard}>
                  <Text style={styles.overrideTitle}>Opções para {selectedDateForOverride}</Text>

                  {currentOverride?.type === 'custom' && currentOverride.selectedSlots && currentOverride.selectedSlots.length > 0 && (
                    <Text style={styles.customSlotsSummary}>
                      Horários selecionados: {currentOverride.selectedSlots.slice(0, 3).join(', ')}
                      {currentOverride.selectedSlots.length > 3 ? ` e mais ${currentOverride.selectedSlots.length - 3}` : ''}
                    </Text>
                  )}
                  {currentOverride?.type === 'blocked' && (
                    <Text style={styles.blockedDayBadge}>🔒 Dia Bloqueado</Text>
                  )}

                  <TouchableOpacity
                    style={[styles.overrideButton, currentOverride?.type === 'blocked' && styles.overrideButtonSelected]}
                    onPress={() => handleSetOverrideType('blocked')}
                    activeOpacity={0.92}
                    accessibilityRole="button"
                    accessibilityLabel="Bloquear dia inteiro"
                  >
                    <Text style={[styles.overrideButtonText, currentOverride?.type === 'blocked' && styles.overrideButtonTextSelected]}>Bloquear Dia Inteiro</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.overrideButton, currentOverride?.type === 'custom' && styles.overrideButtonSelected]}
                    onPress={() => handleSetOverrideType('custom')}
                    activeOpacity={0.92}
                    accessibilityRole="button"
                    accessibilityLabel="Definir horários personalizados"
                  >
                    <Text style={[styles.overrideButtonText, currentOverride?.type === 'custom' && styles.overrideButtonTextSelected]}>Definir Horários Personalizados</Text>
                  </TouchableOpacity>

                  {currentOverride?.type === 'custom' && (
                    <View style={styles.timeSlotGrid}>
                      {ALL_POSSIBLE_SLOTS.map(slot => (
                        <TimeSlotButton
                          key={slot}
                          time={slot}
                          isSelected={(currentOverride.selectedSlots || []).includes(slot)}
                          onPress={handleToggleOverrideSlot}
                          isBooked={getBookedSlotsForSpecificDate(selectedDateForOverride).includes(slot)}
                        />
                      ))}
                    </View>
                  )}
                  {currentOverride && (
                    <TouchableOpacity 
                      style={styles.clearOverrideButton} 
                      onPress={handleClearOverride} 
                      activeOpacity={0.92} 
                      accessibilityRole="button" 
                      accessibilityLabel="Remover exceção"
                    >
                      <Text style={styles.clearOverrideButtonText}>Remover Exceção para este Dia</Text>
                    </TouchableOpacity>
                  )}
                </View>
              )}
            </View>
          </>
        )}
      </Animated.ScrollView>

      <View style={styles.stickySaveBar} accessibilityRole="summary">
        <Text style={styles.stickySummaryText}>
          {pendingChangesCount > 0 ? `${pendingChangesCount} alterações pendentes` : 'Tudo salvo'}
        </Text>
        <TouchableOpacity
          style={[styles.stickySaveButton, (isSaving || pendingChangesCount === 0) && styles.stickySaveButtonDisabled]}
          onPress={handleSaveAvailability}
          disabled={isSaving || pendingChangesCount === 0}
          activeOpacity={0.92}
          accessibilityRole="button"
          accessibilityLabel="Salvar alterações"
        >
          {isSaving ? (
            <ActivityIndicator color="#FFFFFF" size="small" />
          ) : (
            <View style={styles.saveButtonContent}>
              <MaterialCommunityIcons name="content-save" size={18} color="#FFFFFF" style={styles.saveButtonIcon} accessibilityHidden={true} />
              <Text style={styles.stickySaveButtonText}>Salvar</Text>
            </View>
          )}
        </TouchableOpacity>
      </View>

      {/* Copy Modal */}
      {copyModalVisible && (
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Copiar disponibilidade para</Text>
            <View style={styles.modalChipsRow}>
              {dayNames.map((label, idx) => (
                <TouchableOpacity
                  key={idx}
                  style={[
                    styles.modalChip, 
                    copyTargets.includes(idx) && styles.modalChipActive, 
                    copyFromDay === idx && styles.modalChipDisabled
                  ]}
                  onPress={() => copyFromDay !== idx && toggleCopyTarget(idx)}
                  disabled={copyFromDay === idx}
                  accessibilityRole="button"
                  accessibilityLabel={`Selecionar ${label}`}
                >
                  <Text style={[styles.modalChipText, copyTargets.includes(idx) && styles.modalChipTextActive]}>
                    {label.replace('-feira', '').split('-')[0].slice(0, 3)}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
            <View style={styles.modalActions}>
              <TouchableOpacity style={[styles.modalButton, styles.modalCancel]} onPress={() => setCopyModalVisible(false)}>
                <Text style={styles.modalButtonText}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.modalButton, styles.modalConfirm]} onPress={() => applyCopyToTargets()}>
                <Text style={[styles.modalButtonText, styles.modalConfirmText]}>Aplicar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      )}

      {/* Smart Step Modal */}
      {smartVisible && (
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>{smartMode === 'weekly' ? 'Assistente de Horários' : 'Exceção Rápida'}</Text>
            <Text style={styles.stepSubtitle}>Passo {smartStep} de 3</Text>

            {smartStep === 1 && (
              <View>
                <Text style={styles.stepTitle}>{smartMode === 'weekly' ? 'O que quer ajustar?' : 'Escolha a data'}</Text>
                {smartMode === 'weekly' ? (
                  <View style={styles.modalChipsRow}>
                    <TouchableOpacity 
                      style={[styles.modalChip, smartScope === 'today' && styles.modalChipActive]} 
                      onPress={() => setSmartScope('today')} 
                      accessibilityRole="button"
                    >
                      <Text style={[styles.modalChipText, smartScope === 'today' && styles.modalChipTextActive]}>Hoje</Text>
                    </TouchableOpacity>
                    <TouchableOpacity 
                      style={[styles.modalChip, smartScope === 'tomorrow' && styles.modalChipActive]} 
                      onPress={() => setSmartScope('tomorrow')} 
                      accessibilityRole="button"
                    >
                      <Text style={[styles.modalChipText, smartScope === 'tomorrow' && styles.modalChipTextActive]}>Amanhã</Text>
                    </TouchableOpacity>
                    <TouchableOpacity 
                      style={[styles.modalChip, smartScope === 'weekday' && styles.modalChipActive]} 
                      onPress={() => setSmartScope('weekday')} 
                      accessibilityRole="button"
                    >
                      <Text style={[styles.modalChipText, smartScope === 'weekday' && styles.modalChipTextActive]}>Dia da semana</Text>
                    </TouchableOpacity>
                    <TouchableOpacity 
                      style={[styles.modalChip, smartScope === 'date' && styles.modalChipActive]} 
                      onPress={() => setSmartScope('date')} 
                      accessibilityRole="button"
                    >
                      <Text style={[styles.modalChipText, smartScope === 'date' && styles.modalChipTextActive]}>Data no calendário</Text>
                    </TouchableOpacity>
                  </View>
                ) : (
                  <View style={{ borderRadius: Radii.md, overflow: 'hidden' }}>
                    <Calendar
                      onDayPress={(d) => { 
                        setSmartDate(d.dateString); 
                        if (Platform.OS === 'ios') Haptics.selectionAsync(); 
                      }}
                      markedDates={smartDate ? { [smartDate]: { selected: true, selectedColor: Colors.primary } } : {}}
                      theme={calendarTheme}
                    />
                  </View>
                )}

                {smartMode === 'weekly' && smartScope === 'weekday' && (
                  <View style={[styles.modalChipsRow, { marginTop: 6 }]}>
                    {dayNames.map((label, idx) => (
                      <TouchableOpacity 
                        key={idx} 
                        style={[styles.modalChip, smartWeekdays.includes(idx) && styles.modalChipActive]} 
                        onPress={() => toggleSmartWeekday(idx)} 
                        accessibilityRole="button"
                      >
                        <Text style={[styles.modalChipText, smartWeekdays.includes(idx) && styles.modalChipTextActive]}>
                          {label.replace('-feira', '').split('-')[0].slice(0, 3)}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                )}

                <View style={styles.modalActions}>
                  <TouchableOpacity style={[styles.modalButton, styles.modalConfirm]} onPress={() => setSmartStep(2)}>
                    <Text style={[styles.modalButtonText, styles.modalConfirmText]}>Continuar</Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}

            {smartStep === 2 && (
              <View>
                <Text style={styles.stepTitle}>{smartMode === 'weekly' ? 'Qual horário?' : 'Bloquear ou personalizar?'}</Text>
                {smartMode === 'weekly' ? (
                  <View style={styles.modalChipsRow}>
                    <TouchableOpacity 
                      style={[styles.modalChip, smartPreset === 'morning' && styles.modalChipActive]} 
                      onPress={() => setSmartPreset('morning')} 
                      accessibilityRole="button"
                    >
                      <Text style={[styles.modalChipText, smartPreset === 'morning' && styles.modalChipTextActive]}>Manhã (08-12)</Text>
                    </TouchableOpacity>
                    <TouchableOpacity 
                      style={[styles.modalChip, smartPreset === 'afternoon' && styles.modalChipActive]} 
                      onPress={() => setSmartPreset('afternoon')} 
                      accessibilityRole="button"
                    >
                      <Text style={[styles.modalChipText, smartPreset === 'afternoon' && styles.modalChipTextActive]}>Tarde (13-17)</Text>
                    </TouchableOpacity>
                    <TouchableOpacity 
                      style={[styles.modalChip, smartPreset === 'fullday' && styles.modalChipActive]} 
                      onPress={() => setSmartPreset('fullday')} 
                      accessibilityRole="button"
                    >
                      <Text style={[styles.modalChipText, smartPreset === 'fullday' && styles.modalChipTextActive]}>Dia todo (08-18)</Text>
                    </TouchableOpacity>
                    <TouchableOpacity 
                      style={[styles.modalChip, smartPreset === 'custom' && styles.modalChipActive]} 
                      onPress={() => setSmartPreset('custom')} 
                      accessibilityRole="button"
                    >
                      <Text style={[styles.modalChipText, smartPreset === 'custom' && styles.modalChipTextActive]}>Personalizar</Text>
                    </TouchableOpacity>
                    <TouchableOpacity 
                      style={[styles.modalChip, smartPreset === 'off' && styles.modalChipActive]} 
                      onPress={() => setSmartPreset('off')} 
                      accessibilityRole="button"
                    >
                      <Text style={[styles.modalChipText, smartPreset === 'off' && styles.modalChipTextActive]}>Folga</Text>
                    </TouchableOpacity>
                  </View>
                ) : (
                  <View style={styles.modalChipsRow}>
                    <TouchableOpacity 
                      style={[styles.modalChip, smartOverrideType === 'blocked' && styles.modalChipActive]} 
                      onPress={() => setSmartOverrideType('blocked')} 
                      accessibilityRole="button"
                    >
                      <Text style={[styles.modalChipText, smartOverrideType === 'blocked' && styles.modalChipTextActive]}>Bloquear</Text>
                    </TouchableOpacity>
                    <TouchableOpacity 
                      style={[styles.modalChip, smartOverrideType === 'custom' && styles.modalChipActive]} 
                      onPress={() => setSmartOverrideType('custom')} 
                      accessibilityRole="button"
                    >
                      <Text style={[styles.modalChipText, smartOverrideType === 'custom' && styles.modalChipTextActive]}>Personalizar</Text>
                    </TouchableOpacity>
                  </View>
                )}

                {(smartPreset === 'custom' || (smartMode === 'override' && smartOverrideType === 'custom')) && (
                  <View style={[styles.timeSlotGrid, { marginTop: 6 }]}>
                    {ALL_POSSIBLE_SLOTS.map(slot => (
                      <TimeSlotButton
                        key={slot}
                        time={slot}
                        isSelected={smartCustomSlots.includes(slot)}
                        onPress={toggleSmartCustomSlot}
                        isBooked={false}
                      />
                    ))}
                  </View>
                )}

                <View style={styles.modalActions}>
                  <TouchableOpacity style={[styles.modalButton, styles.modalCancel]} onPress={() => setSmartStep(1)}>
                    <Text style={styles.modalButtonText}>Voltar</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={[styles.modalButton, styles.modalConfirm]} onPress={() => setSmartStep(3)}>
                    <Text style={[styles.modalButtonText, styles.modalConfirmText]}>Continuar</Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}

            {smartStep === 3 && (
              <View>
                <Text style={styles.stepTitle}>Confirmar</Text>
                <View style={styles.summaryCard}>
                  <Ionicons name="checkmark-circle-outline" size={20} color={Colors.primary} style={{ marginRight: 8 }} accessibilityHidden={true} />
                  <Text style={{ flex: 1, color: Colors.text }}>
                    {smartMode === 'weekly' ? (
                      smartScope === 'today' ? 'Hoje' : smartScope === 'tomorrow' ? 'Amanhã' : smartScope === 'weekday' ? `Dias: ${smartWeekdays.map(d => dayNames[d].slice(0, 3)).join(', ')}` : 'Data no calendário'
                    ) : (
                      smartDate ? `Data: ${smartDate}` : 'Sem data selecionada'
                    )}
                    {' '}-{' '}
                    {(() => {
                      const p = smartMode === 'weekly' ? smartPreset : (smartOverrideType === 'blocked' ? 'blocked' : 'custom');
                      if (p === 'morning') return '08-12';
                      if (p === 'afternoon') return '13-17';
                      if (p === 'fullday') return '08-18';
                      if (p === 'off') return 'Folga';
                      return smartCustomSlots.length > 0 ? `${smartCustomSlots.length} horários` : (smartMode === 'override' && smartOverrideType === 'blocked' ? 'Bloqueado' : 'Personalizar');
                    })()}
                  </Text>
                </View>
                <View style={styles.modalActions}>
                  <TouchableOpacity style={[styles.modalButton, styles.modalCancel]} onPress={() => setSmartStep(2)}>
                    <Text style={styles.modalButtonText}>Voltar</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={[styles.modalButton, styles.modalConfirm]} onPress={applySmartStep}>
                    <Text style={[styles.modalButtonText, styles.modalConfirmText]}>Aplicar</Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.bgSoft,
  },
  customHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 18,
    paddingVertical: Platform.OS === 'ios' ? 18 : 18,
    paddingTop: Platform.OS === 'ios' ? 55 : 18,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.06,
        shadowRadius: 12,
      },
      android: { elevation: 4 },
    }),
    borderBottomLeftRadius: 0,
    borderBottomRightRadius: 0,
  },
  backButton: {
    padding: Spacing.sm + 2,
  },
  headerTitle: {
    fontSize: 20,
    left: 6,
    fontWeight: '600',
    color: '#2F3A4A',
    flex: 1,
    textAlign: 'center',
    fontFamily: Platform.OS === 'ios' ? 'SFProDisplay-Semibold' : 'System',
  },
  headerPlaceholder: {
    width: 28 + Spacing.sm * 2,
  },
  segmentedControl: {
    flexDirection: 'row',
    marginHorizontal: Spacing.md + 2,
    marginTop: Spacing.sm,
    backgroundColor: Colors.fieldBg,
    padding: 4,
    borderRadius: Radii.pill,
    alignSelf: 'center',
  },
  segment: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: Radii.pill,
    alignItems: 'center',
  },
  segmentActive: {
    backgroundColor: Colors.surface,
    ...Platform.select({ ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 6 }, android: { elevation: 3 } }),
  },
  segmentText: {
    color: Colors.textMuted,
    fontWeight: '600',
  },
  segmentTextActive: {
    color: Colors.primaryDark,
  },
  scrollContainer: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: Spacing.md + 2,
    paddingBottom: Spacing.lg * 2 + 20,
    paddingTop: Spacing.md,
  },
  sectionTitleImproved: {
    fontSize: 22,
    fontWeight: '600',
    color: Colors.primaryDark,
    marginTop: Spacing.lg,
    marginBottom: Spacing.sm,
    fontFamily: Platform.OS === 'ios' ? 'SFProDisplay-Semibold' : 'System',
  },
  primaryCTAButton: {
    backgroundColor: Colors.primary,
    borderRadius: Radii.pill,
    paddingVertical: 12,
    paddingHorizontal: Spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'stretch',
    marginTop: Spacing.md,
  },
  primaryCTAButtonText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 15,
  },
  stepTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.text,
    marginBottom: Spacing.sm,
  },
  stepSubtitle: {
    fontSize: 13,
    color: Colors.textMuted,
    marginBottom: Spacing.xs,
  },
  summaryCard: {
    backgroundColor: Colors.fieldBg,
    borderRadius: Radii.md,
    padding: Spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.md,
    borderWidth: 0.5,
    borderColor: Colors.border,
  },
  infoCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.infoLight,
    borderRadius: Radii.md,
    padding: Spacing.md + 2,
    marginBottom: Spacing.md,
    borderWidth: 0.5,
    borderColor: Colors.border,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
      },
      android: { elevation: 2 },
    }),
  },
  infoIcon: {
    marginRight: Spacing.sm,
  },
  infoText: {
    flex: 1,
    fontSize: 15,
    color: Colors.infoDark,
    lineHeight: 20,
    fontFamily: Platform.OS === 'ios' ? 'SFProText-Regular' : 'System',
  },
  dayCard: {
    backgroundColor: Colors.surface,
    borderRadius: Radii.md,
    padding: Spacing.md + 2,
    marginBottom: Spacing.md,
    ...Platform.select({
      ios: {
        shadowColor: Colors.shadow,
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.1,
        shadowRadius: 12,
      },
      android: { elevation: 6 },
    }),
  },
  dayHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  quickActionsRow: {
    flexDirection: 'row',
    marginBottom: Spacing.sm,
  },
  quickActionChip: {
    backgroundColor: Colors.fieldBg,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: Radii.pill,
    marginRight: Spacing.xs,
    borderWidth: 0.5,
    borderColor: Colors.border,
  },
  quickActionText: {
    color: Colors.text,
    fontWeight: '600',
    fontSize: 13,
  },
  dayName: {
    fontSize: 17,
    fontWeight: '700',
    color: Colors.text,
    fontFamily: Platform.OS === 'ios' ? 'SFProDisplay-Bold' : 'System',
  },
  timeSlotGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'flex-start',
    marginBottom: Spacing.sm,
  },
  timeSlotButton: {
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: Radii.sm,
    margin: Spacing.xs + 2,
    minWidth: 70,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
      },
      android: { elevation: 2 },
    }),
  },
  timeSlotText: {
    fontSize: 14,
    fontWeight: '600',
    fontFamily: Platform.OS === 'ios' ? 'SFProText-Semibold' : 'System',
  },
  bookedIcon: {
    marginLeft: Spacing.xs / 2,
  },
  hourSeparatorContainer: {
    width: '100%',
    alignItems: 'flex-start',
    paddingVertical: Spacing.xs,
    marginTop: Spacing.sm,
    marginBottom: Spacing.xs,
    borderBottomWidth: 0.5,
    borderBottomColor: Colors.border,
  },
  hourSeparatorText: {
    fontSize: 15,
    fontWeight: 'bold',
    color: Colors.textMuted,
    fontFamily: Platform.OS === 'ios' ? 'SFProText-Semibold' : 'System',
  },
  dayActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: Spacing.sm,
    width: '100%',
  },
  actionButtonSecondary: {
    backgroundColor: Colors.fieldBg,
    borderRadius: Radii.pill,
    paddingVertical: 10,
    paddingHorizontal: 14,
    marginLeft: Spacing.sm,
    flexDirection: 'row',
    alignItems: 'center',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
      },
      android: { elevation: 2 },
    }),
  },
  actionButtonIcon: {
    marginRight: Spacing.xs,
  },
  actionButtonSecondaryText: {
    color: Colors.primary,
    fontSize: 14,
    fontWeight: '600',
    fontFamily: Platform.OS === 'ios' ? 'SFProText-Medium' : 'System',
  },
  stickySaveBar: {
    position: 'absolute',
    left: Spacing.md,
    right: Spacing.md,
    bottom: Spacing.md + 4,
    backgroundColor: Colors.surface,
    borderRadius: Radii.pill,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
    paddingHorizontal: Spacing.md,
    ...Platform.select({ ios: { shadowColor: Colors.shadow, shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.12, shadowRadius: 16 }, android: { elevation: 10 } }),
  },
  stickySummaryText: {
    color: Colors.textMuted,
    fontSize: 14,
  },
  stickySaveButton: {
    backgroundColor: Colors.primary,
    paddingVertical: 10,
    paddingHorizontal: 18,
    borderRadius: Radii.pill,
    flexDirection: 'row',
    alignItems: 'center',
  },
  stickySaveButtonDisabled: {
    backgroundColor: '#9BBCEB',
  },
  stickySaveButtonText: {
    color: '#fff',
    fontWeight: '700',
    marginLeft: 6,
  },
  calendarOverrideContainer: {
    backgroundColor: Colors.surface,
    borderRadius: Radii.md,
    overflow: 'hidden',
    marginBottom: Spacing.lg,
    ...Platform.select({
      ios: {
        shadowColor: Colors.shadow,
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.1,
        shadowRadius: 12,
      },
      android: { elevation: 6 },
    }),
  },
  calendarOverrideStyle: {
    borderRadius: Radii.md,
  },
  overrideOptionsCard: {
    padding: Spacing.md + 2,
    borderTopWidth: 0.5,
    borderTopColor: Colors.border,
    backgroundColor: Colors.surface,
    borderRadius: Radii.md,
    marginTop: Spacing.md,
    ...Platform.select({
      ios: {
        shadowColor: Colors.shadow,
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.1,
        shadowRadius: 12,
      },
      android: { elevation: 6 },
    }),
  },
  overrideTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: Spacing.sm,
    fontFamily: Platform.OS === 'ios' ? 'SFProDisplay-Semibold' : 'System',
  },
  customSlotsSummary: {
    fontSize: 14,
    color: Colors.textMuted,
    marginBottom: Spacing.sm,
    fontStyle: 'italic',
    lineHeight: 18,
    fontFamily: Platform.OS === 'ios' ? 'SFProText-Italic' : 'System',
  },
  blockedDayBadge: {
    backgroundColor: Colors.danger,
    color: Colors.surface,
    paddingVertical: Spacing.xs,
    paddingHorizontal: Spacing.sm,
    borderRadius: Radii.pill,
    alignSelf: 'flex-start',
    marginBottom: Spacing.sm,
    fontWeight: 'bold',
    fontSize: 13,
    fontFamily: Platform.OS === 'ios' ? 'SFProText-Bold' : 'System',
  },
  overrideButton: {
    backgroundColor: Colors.fieldBg,
    borderRadius: Radii.pill,
    paddingVertical: 12,
    alignItems: 'center',
    marginBottom: Spacing.sm,
    borderWidth: 0.5,
    borderColor: Colors.border,
  },
  overrideButtonSelected: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  overrideButtonText: {
    color: Colors.text,
    fontSize: 15,
    fontWeight: '600',
    fontFamily: Platform.OS === 'ios' ? 'SFProText-Medium' : 'System',
  },
  overrideButtonTextSelected: {
    color: '#FFFFFF',
  },
  clearOverrideButton: {
    backgroundColor: Colors.danger,
    borderRadius: Radii.pill,
    paddingVertical: 12,
    alignItems: 'center',
    marginTop: Spacing.sm,
  },
  clearOverrideButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '600',
    fontFamily: Platform.OS === 'ios' ? 'SFProText-Semibold' : 'System',
  },
  saveButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveButtonIcon: {
    marginRight: Spacing.xs,
  },
  modalOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.35)',
    justifyContent: 'flex-end',
    padding: Spacing.md,
  },
  modalCard: {
    backgroundColor: Colors.surface,
    borderRadius: Radii.md,
    padding: Spacing.md,
    ...Platform.select({ ios: { shadowColor: Colors.shadow, shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.15, shadowRadius: 18 }, android: { elevation: 12 } }),
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.text,
    marginBottom: Spacing.sm,
  },
  modalChipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: Spacing.md,
  },
  modalChip: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: Radii.pill,
    backgroundColor: Colors.fieldBg,
    margin: 6,
    borderWidth: 0.5,
    borderColor: Colors.border,
  },
  modalChipActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  modalChipDisabled: {
    opacity: 0.4,
  },
  modalChipText: {
    color: Colors.text,
    fontWeight: '600',
  },
  modalChipTextActive: {
    color: '#fff',
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  modalButton: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: Radii.pill,
    marginLeft: Spacing.sm,
  },
  modalCancel: {
    backgroundColor: Colors.fieldBg,
  },
  modalConfirm: {
    backgroundColor: Colors.primary,
  },
  modalButtonText: {
    color: Colors.text,
    fontWeight: '700',
  },
  modalConfirmText: {
    color: '#fff',
  },
  centeredFeedback: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.bgSoft,
  },
  loadingText: {
    fontSize: 17,
    color: Colors.textMuted,
    marginTop: Spacing.sm + 4,
    fontFamily: Platform.OS === 'ios' ? 'SFProText-Medium' : 'System',
  },
});