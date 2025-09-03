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
} from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { Calendar, LocaleConfig, DateData } from 'react-native-calendars';
import * as Haptics from 'expo-haptics';
import { useAuth } from '../../../hooks/useAuth';

// Importações de serviços e tipos do backend (ajuste os caminhos conforme sua estrutura)
import {
  getMyProviderAvailability,
  updateMyProviderAvailability,
} from '../../../services/providerService';
import { getBookingsForUser } from '../../../services/bookingService';
import { ProviderAvailability, GetProviderAvailabilityResponse, UpdateAvailabilityData } from '../../../types/backend/providers';
import { BookingDetails, BookingStatus } from '../../../types/backend/bookings';

// ====== Design tokens (mesmos da UI padronizada) ======
const Colors = {
  primary: '#4A90E2',
  primaryDark: '#2A72E7', // Added for primaryDark
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
  infoLight: '#E0F2F7', // New color for info card background
  infoDark: '#007B8C', // New color for info card icon/text
};

const Radii = {
  xl: 20,
  pill: 25,
  md: 15,
  sm: 10,
};

const Spacing = {
  xs: 6,
  sm: 10,
  md: 15,
  lg: 20,
};

const easeOut = Easing.out(Easing.ease);

// ====== Locale PT-BR (Calendário) ======
LocaleConfig.locales['pt-br'] = {
  monthNames: [
    'Janeiro','Fevereiro','Março','Abril','Maio','Junho',
    'Julho','Agosto','Setembro','Outubro','Novembro','Dezembro'
  ],
  monthNamesShort: ['Jan.','Fev.','Mar.','Abr.','Mai.','Jun.','Jul.','Ago.','Set.','Out.','Nov.','Dez.'],
  dayNames: ['Domingo','Segunda-feira','Terça-feira','Quarta-feira','Quinta-feira','Sexta-feira','Sábado'],
  dayNamesShort: ['DOM','SEG','TER','QUA','QUI','SEX','SÁB'],
  today: 'Hoje'
};
LocaleConfig.defaultLocale = 'pt-br';

// Helper para gerar blocos de tempo
const generateTimeSlots = (startHour: number, endHour: number, intervalMinutes: number = 30) => {
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

// Todos os slots possíveis de 04:00 a 19:00
const ALL_POSSIBLE_SLOTS = generateTimeSlots(4, 19, 30);

interface DayAvailability {
  dayOfWeek: number; // 0 (Domingo) a 6 (Sábado)
  isEnabled: boolean;
  selectedSlots: string[]; // Ex: ["09:00", "09:30", "10:00"]
  originalSlots: string[]; // Slots como vieram do backend para controle de exclusão
  id?: string; // ID da disponibilidade no backend se for um registro existente
}

interface SpecificDateOverride {
  date: string; // "YYYY-MM-DD"
  type: 'blocked' | 'custom';
  selectedSlots?: string[]; // Apenas se type === 'custom'
  id?: string; // ID da exceção no backend
  originalSlots?: string[]; // Slots originais para comparação
}

// Componente de Botão de Slot de Tempo
interface TimeSlotButtonProps {
  time: string;
  isSelected: boolean;
  onPress: (time: string) => void;
  isBooked: boolean; // Para desabilitar slots já agendados
}

const TimeSlotButton: React.FC<TimeSlotButtonProps> = ({ time, isSelected, onPress, isBooked }) => {
  const animatedScale = useRef(new Animated.Value(1)).current;

  const handlePressIn = () => {
    if (!isBooked) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      Animated.spring(animatedScale, { toValue: 0.9, useNativeDriver: true }).start();
    }
  };

  const handlePressOut = () => {
    if (!isBooked) {
      Animated.spring(animatedScale, { toValue: 1, friction: 3, tension: 40, useNativeDriver: true }).start();
    }
  };

  const backgroundColor = isBooked
    ? Colors.textSubtle // Cinza para agendado
    : isSelected
    ? Colors.primary // Azul para selecionado
    : Colors.fieldBg; // Fundo padrão

  const textColor = isBooked || isSelected ? Colors.surface : Colors.text;

  return (
    <Animated.View style={{ transform: [{ scale: animatedScale }] }}>
      <TouchableOpacity
        style={[styles.timeSlotButton, { backgroundColor }]}
        onPress={() => onPress(time)}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        disabled={isBooked} // Desabilita se já estiver agendado
      >
        <Text style={[styles.timeSlotText, { color: textColor }]}>{time}</Text>
        {isBooked && (
          <Ionicons
            name="lock-closed" // Icon for booked slots
            size={12}
            color={textColor}
            style={styles.bookedIcon}
          />
        )}
      </TouchableOpacity>
    </Animated.View>
  );
};

// Componente para o Cartão de Disponibilidade do Dia
interface DayAvailabilityCardProps {
  dayName: string;
  dayOfWeek: number;
  availability: DayAvailability;
  onToggleDay: (dayOfWeek: number, isEnabled: boolean) => void;
  onToggleSlot: (dayOfWeek: number, slot: string) => void;
  onSelectAll: (dayOfWeek: number) => void;
  onClearSlots: (dayOfWeek: number) => void;
  bookedSlotsForDay: string[]; // Slots já agendados para este dia da semana (recorrente)
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
}) => {
  const cardAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(cardAnim, { toValue: 1, duration: 400, easing: easeOut, useNativeDriver: true }).start();
  }, []);

  return (
    <Animated.View style={[styles.dayCard, { opacity: cardAnim, transform: [{ translateY: cardAnim.interpolate({ inputRange: [0, 1], outputRange: [20, 0] }) }] }]}>
      <View style={styles.dayHeader}>
        <Text style={styles.dayName}>{dayName}</Text>
        <Switch
          trackColor={{ false: Colors.textMuted, true: Colors.primary }}
          thumbColor={Colors.surface}
          ios_backgroundColor={Colors.textMuted}
          onValueChange={(value) => onToggleDay(dayOfWeek, value)}
          value={availability.isEnabled}
        />
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
                  {/* Add visual separators by hour */}
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
          {/* Interações secundárias: chips flutuantes alinhados à direita */}
          <View style={styles.dayActions}>
            <TouchableOpacity style={styles.actionButtonSecondary} onPress={() => onSelectAll(dayOfWeek)}>
              <Ionicons name="checkmark-done-circle-outline" size={16} color={Colors.primary} style={styles.actionButtonIcon} />
              <Text style={styles.actionButtonSecondaryText}>Selecionar Tudo</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.actionButtonSecondary} onPress={() => onClearSlots(dayOfWeek)}>
              <Ionicons name="trash-outline" size={16} color={Colors.primary} style={styles.actionButtonIcon} />
              <Text style={styles.actionButtonSecondaryText}>Limpar</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
    </Animated.View>
  );
};

// New InfoCard Component
const InfoCard: React.FC<{ text: string }> = ({ text }) => (
  <View style={styles.infoCard}>
    <Ionicons name="information-circle-outline" size={20} color={Colors.infoDark} style={styles.infoIcon} />
    <Text style={styles.infoText}>{text}</Text>
  </View>
);

export default function ManageAvailabilityScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [weeklyAvailability, setWeeklyAvailability] = useState<DayAvailability[]>([]);
  const [specificDateOverrides, setSpecificDateOverrides] = useState<SpecificDateOverride[]>([]);
  const [selectedDateForOverride, setSelectedDateForOverride] = useState<string | null>(null);
  const [bookings, setBookings] = useState<BookingDetails[]>([]);

  const headerAnim = useRef(new Animated.Value(0)).current;
  const contentAnim = useRef(new Animated.Value(0)).current;
  const saveButtonAnim = useRef(new Animated.Value(0)).current; // For save button animation

  const dayNames = ['Domingo', 'Segunda-feira', 'Terça-feira', 'Quarta-feira', 'Quinta-feira', 'Sexta-feira', 'Sábado'];

  // Helper para converter slots discretos em blocos contínuos (startTime, endTime)
  const convertSlotsToBlocks = (slots: string[]) => {
    if (slots.length === 0) return [];

    const sortedSlots = [...slots].sort();
    const blocks: { startTime: string; endTime: string }[] = [];

    let currentBlockStart = sortedSlots[0];
    let currentBlockEnd = sortedSlots[0];

    for (let i = 0; i < sortedSlots.length; i++) {
      const currentSlot = sortedSlots[i];
      const [currentHour, currentMinute] = currentSlot.split(':').map(Number);
      const currentTotalMinutes = currentHour * 60 + currentMinute;

      if (i === sortedSlots.length - 1) { // Último slot
        const [endHour, endMinute] = currentBlockEnd.split(':').map(Number);
        const finalEndTotalMinutes = endHour * 60 + endMinute + 30; // Adiciona 30 minutos para o fim do último slot
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

        // Se o próximo slot é contínuo (30 minutos depois)
        if (nextTotalMinutes === currentTotalMinutes + 30) {
          currentBlockEnd = currentSlot; // Estende o bloco atual
        } else { // O bloco contínuo foi quebrado
          const [endHour, endMinute] = currentBlockEnd.split(':').map(Number);
          const finalEndTotalMinutes = endHour * 60 + endMinute + 30;
          const finalEndHour = Math.floor(finalEndTotalMinutes / 60);
          const finalEndMinute = finalEndTotalMinutes % 60;
          blocks.push({
            startTime: currentBlockStart,
            endTime: `${finalEndHour < 10 ? '0' : ''}${finalEndHour}:${finalEndMinute < 10 ? '0' : ''}${finalEndMinute}`
          });
          currentBlockStart = nextSlot; // Inicia um novo bloco
          currentBlockEnd = nextSlot;
        }
      }
    }
    return blocks;
  };

  // Função para carregar disponibilidade e agendamentos
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

      // TODO: Carregar exceções de datas específicas do backend aqui
      // For now, let's simulate some overrides for testing the UI
      setSpecificDateOverrides([
        // { date: '2025-09-15', type: 'blocked' }, // Example blocked day
        // { date: '2025-09-16', type: 'custom', selectedSlots: ['10:00', '10:30', '11:00'] }, // Example custom day
      ]);


      const allBookings: BookingDetails[] = await getBookingsForUser(BookingStatus.CONFIRMED);
      setBookings(allBookings);

      Animated.parallel([
        Animated.timing(headerAnim, { toValue: 1, duration: 500, easing: easeOut, useNativeDriver: true }),
        Animated.timing(contentAnim, { toValue: 1, duration: 600, easing: easeOut, useNativeDriver: true }),
      ]).start();

    } catch (error: any) {
      console.error('Erro ao carregar dados de disponibilidade:', error);
      Alert.alert('Erro', 'Não foi possível carregar sua disponibilidade. Tente novamente.');
    } finally {
      setIsLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Lógica para gerenciar a disponibilidade semanal
  const handleToggleDay = (dayOfWeek: number, isEnabled: boolean) => {
    setWeeklyAvailability(prev =>
      prev.map(day => (day.dayOfWeek === dayOfWeek ? { ...day, isEnabled } : day))
    );
  };

  const handleToggleSlot = (dayOfWeek: number, slot: string) => {
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
  };

  const handleSelectAllSlots = (dayOfWeek: number) => {
    setWeeklyAvailability(prev =>
      prev.map(day => (day.dayOfWeek === dayOfWeek ? { ...day, selectedSlots: ALL_POSSIBLE_SLOTS } : day))
    );
  };

  const handleClearSlots = (dayOfWeek: number) => {
    setWeeklyAvailability(prev =>
      prev.map(day => (day.dayOfWeek === dayOfWeek ? { ...day, selectedSlots: [] } : day))
    );
  };

  // Lógica para gerenciar exceções de datas específicas
  const handleDayPressOnCalendar = (day: DateData) => {
    setSelectedDateForOverride(day.dateString);
    // Tenta encontrar uma exceção existente para esta data
    const existingOverride = specificDateOverrides.find(override => override.date === day.dateString);
    if (existingOverride) {
      // If there is an existing override, ensure it's selected in the UI
      // (The currentOverride memoized value handles this for rendering)
    } else {
      // If no override, ensure override options are reset or empty
      // (This is implicitly handled by currentOverride being null)
    }
  };

  const handleSetOverrideType = (type: 'blocked' | 'custom') => {
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
  };

  const handleToggleOverrideSlot = (slot: string) => {
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
  };

  const handleClearOverride = () => {
    if (!selectedDateForOverride) return;
    setSpecificDateOverrides(prev => prev.filter(o => o.date !== selectedDateForOverride));
    setSelectedDateForOverride(null);
  };

  const currentOverride = useMemo(() => {
    return specificDateOverrides.find(o => o.date === selectedDateForOverride);
  }, [specificDateOverrides, selectedDateForOverride]);

  const handleSaveAvailability = async () => {
    if (!user?.id) {
      Alert.alert("Erro", "ID do provedor não encontrado. Faça login novamente.");
      return;
    }

    setIsSaving(true);
    // Animate save button
    Animated.timing(saveButtonAnim, {
      toValue: 1,
      duration: 300,
      easing: Easing.in(Easing.ease),
      useNativeDriver: false, // Must be false for width animation
    }).start();

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

      // 2. Salvar Exceções de Datas Específicas
      for (const override of specificDateOverrides) {
        if (override.type === 'blocked') {
          console.log(`Bloqueando data: ${override.date}`);
          // TODO: Call backend API to block specific date
        } else if (override.type === 'custom' && override.selectedSlots) {
          const customBlocks = convertSlotsToBlocks(override.selectedSlots);
          console.log(`Customizando data ${override.date} com slots:`, customBlocks);
          // TODO: Call backend API to set custom slots for specific date
        }
      }
      // TODO: Lógica para remover overrides que foram desfeitos na UI

      // CORREÇÃO: Usar NotificationFeedbackType
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success); // Haptic feedback
      Alert.alert('Sucesso', 'Sua disponibilidade foi salva!');
      router.back();
    } catch (error: any) {
      console.error('Erro ao salvar disponibilidade:', error.response?.data || error.message);
      // CORREÇÃO: Usar NotificationFeedbackType
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error); // Haptic feedback
      Alert.alert('Erro', error.response?.data?.message || 'Não foi possível salvar sua disponibilidade. Tente novamente.');
    } finally {
      setIsSaving(false);
      Animated.timing(saveButtonAnim, {
        toValue: 0,
        duration: 300,
        easing: Easing.out(Easing.ease),
        useNativeDriver: false,
      }).start(() => {
        loadData(); // Recarrega os dados para refletir o estado atualizado após a animação de retorno
      });
    }
  };

  // Mapeia agendamentos para horários ocupados recorrentes
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

  // Slots já agendados para a data de override selecionada
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


  // Calendar marked dates for overrides
  const markedDates = useMemo(() => {
    const dates: { [key: string]: any } = {};
    specificDateOverrides.forEach(override => {
      if (override.type === 'blocked') {
        dates[override.date] = {
          selected: selectedDateForOverride === override.date,
          selectedColor: selectedDateForOverride === override.date ? Colors.primary : Colors.danger,
          dotColor: Colors.danger, // Red dot for blocked days
          marked: true,
        };
      } else if (override.type === 'custom') {
        dates[override.date] = {
          selected: selectedDateForOverride === override.date,
          selectedColor: selectedDateForOverride === override.date ? Colors.primary : Colors.primary, // Or a different color for custom
          dotColor: Colors.primary, // Blue dot for custom days
          marked: true,
        };
      }
    });
    if (selectedDateForOverride && !dates[selectedDateForOverride]) {
      dates[selectedDateForOverride] = { selected: true, selectedColor: Colors.primary };
    }
    return dates;
  }, [specificDateOverrides, selectedDateForOverride]);

  // Animated style for save button
  const saveButtonWidth = saveButtonAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['100%', '50%'], // Shrink to 50% width
  });
  const saveButtonOpacity = saveButtonAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 0], // Text fades out
  });
  const saveButtonSpinnerOpacity = saveButtonAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 1], // Spinner fades in
  });

  if (isLoading) {
    return (
      <View style={styles.centeredFeedback}>
        <ActivityIndicator size="large" color={Colors.primary} />
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
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Gerenciar Disponibilidade</Text>
        <View style={styles.headerPlaceholder} />
      </Animated.View>

      <Animated.ScrollView
        style={[styles.scrollContainer, { opacity: contentAnim }]}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Seção de Disponibilidade Semanal Padrão */}
        <Text style={styles.sectionTitleImproved}>Disponibilidade Semanal Padrão</Text>
        <InfoCard text="Defina seus horários de trabalho regulares para cada dia da semana. Os agendamentos existentes serão desabilitados." />
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
          />
        ))}

        {/* Seção de Exceções de Datas Específicas */}
        <Text style={styles.sectionTitleImproved}>Exceções de Datas Específicas</Text>
        <InfoCard text="Sobrescreva sua disponibilidade padrão para dias específicos. Agendamentos já confirmados não podem ser alterados." />
        <View style={styles.calendarOverrideContainer}>
          <Calendar
            onDayPress={handleDayPressOnCalendar}
            markedDates={markedDates} // Use the memoized markedDates
            theme={({
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
                textDayFontWeight: '400',
                textMonthFontWeight: 'bold',
                textDayHeaderFontWeight: '500',
                textDayFontSize: 15,
                textMonthFontSize: 18,
                textDayHeaderFontSize: 13,
                'stylesheet.calendar.header': {
                  week: {
                    marginTop: 6,
                    flexDirection: 'row',
                    justifyContent: 'space-around',
                    borderBottomWidth: 1,
                    borderBottomColor: Colors.border,
                    paddingBottom: 6,
                  },
                },
              }) as any}
            style={styles.calendarOverrideStyle}
          />
          {selectedDateForOverride && (
            <View style={styles.overrideOptionsCard}> {/* Apply card style here */}
              <Text style={styles.overrideTitle}>Opções para {selectedDateForOverride}</Text>

              {/* Display quick summary of custom slots if type is custom */}
              {currentOverride?.type === 'custom' && currentOverride.selectedSlots && currentOverride.selectedSlots.length > 0 && (
                <Text style={styles.customSlotsSummary}>
                  Horários selecionados: {currentOverride.selectedSlots.slice(0, 3).join(', ')}
                  {currentOverride.selectedSlots.length > 3 ? ` e mais ${currentOverride.selectedSlots.length - 3}` : ''}
                </Text>
              )}
              {currentOverride?.type === 'blocked' && (
                <Text style={styles.blockedDayBadge}>🔴 Dia Bloqueado</Text>
              )}

              <TouchableOpacity
                style={[styles.overrideButton, currentOverride?.type === 'blocked' && styles.overrideButtonSelected]}
                onPress={() => handleSetOverrideType('blocked')}
              >
                <Text style={[styles.overrideButtonText, currentOverride?.type === 'blocked' && styles.overrideButtonTextSelected]}>Bloquear Dia Inteiro</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.overrideButton, currentOverride?.type === 'custom' && styles.overrideButtonSelected]}
                onPress={() => handleSetOverrideType('custom')}
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
                <TouchableOpacity style={styles.clearOverrideButton} onPress={handleClearOverride}>
                  <Text style={styles.clearOverrideButtonText}>Remover Exceção para este Dia</Text>
                </TouchableOpacity>
              )}
            </View>
          )}
        </View>

        <TouchableOpacity
          style={[styles.saveButton, { width: saveButtonWidth }]}
          onPress={handleSaveAvailability}
          disabled={isSaving}
        >
          {isSaving ? (
            <Animated.View style={{ opacity: saveButtonSpinnerOpacity, position: 'absolute' }}>
              <ActivityIndicator color="#FFFFFF" size="small" />
            </Animated.View>
          ) : (
            <Animated.View style={[styles.saveButtonContent, { opacity: saveButtonOpacity }]}>
              <MaterialCommunityIcons name="content-save" size={20} color="#FFFFFF" style={styles.saveButtonIcon} />
              <Text style={styles.saveButtonText}>Salvar Todas as Alterações</Text>
            </Animated.View>
          )}
        </TouchableOpacity>
      </Animated.ScrollView>
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
    backgroundColor: Colors.primary,
    paddingHorizontal: 15,
    paddingVertical: Platform.OS === 'ios' ? 50 : 20,
    paddingTop: Platform.OS === 'ios' ? 50 : 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 8,
    borderBottomLeftRadius: Radii.xl,
    borderBottomRightRadius: Radii.xl,
  },
  backButton: {
    padding: Spacing.sm,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFFFFF',
    flex: 1,
    textAlign: 'center',
  },
  headerPlaceholder: {
    width: 24 + Spacing.sm * 2, // Espaço para o botão de voltar
  },
  scrollContainer: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: Spacing.md,
    paddingBottom: Spacing.lg * 2,
    paddingTop: Spacing.md,
  },
  // Improved section title style
  sectionTitleImproved: {
    fontSize: 20, // Increased font size
    fontWeight: 'bold',
    color: Colors.primaryDark, // Darker primary color for contrast
    marginTop: Spacing.lg,
    marginBottom: Spacing.sm,
  },
  // Info Card for description
  infoCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.infoLight, // Soft background
    borderRadius: Radii.md,
    padding: Spacing.md,
    marginBottom: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border, // Subtle border
  },
  infoIcon: {
    marginRight: Spacing.sm,
  },
  infoText: {
    flex: 1,
    fontSize: 14,
    color: Colors.infoDark, // Darker text for info
  },
  dayCard: {
    backgroundColor: Colors.surface,
    borderRadius: Radii.md,
    padding: Spacing.md,
    marginBottom: Spacing.md,
    ...Platform.select({
      ios: {
        shadowColor: Colors.shadow,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 6,
      },
      android: { elevation: 4 },
    }),
  },
  dayHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  dayName: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.text,
  },
  timeSlotGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'flex-start',
    marginBottom: Spacing.sm,
  },
  timeSlotButton: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: Radii.sm,
    margin: Spacing.xs,
    minWidth: 65,
    alignItems: 'center',
    flexDirection: 'row', // To align text and icon
    justifyContent: 'center',
  },
  timeSlotText: {
    fontSize: 13,
    fontWeight: '600',
  },
  bookedIcon: {
    marginLeft: Spacing.xs / 2, // Small space between text and icon
  },
  // New style for hour separators
  hourSeparatorContainer: {
    width: '100%', // Take full width
    alignItems: 'flex-start', // Align text to left
    paddingVertical: Spacing.xs,
    marginTop: Spacing.sm,
    marginBottom: Spacing.xs,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  hourSeparatorText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: Colors.textMuted,
  },
  dayActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end', // Align to right
    marginTop: Spacing.sm,
    width: '100%', // Ensure it takes full width to align right
  },
  actionButtonSecondary: {
    backgroundColor: Colors.fieldBg,
    borderRadius: Radii.pill,
    paddingVertical: 8,
    paddingHorizontal: 12,
    marginLeft: Spacing.sm, // Space between buttons
    flexDirection: 'row', // For icon and text
    alignItems: 'center',
  },
  actionButtonIcon: {
    marginRight: Spacing.xs,
  },
  actionButtonSecondaryText: {
    color: Colors.primary,
    fontSize: 13,
    fontWeight: '600',
  },
  calendarOverrideContainer: {
    backgroundColor: Colors.surface,
    borderRadius: Radii.md,
    overflow: 'hidden',
    marginBottom: Spacing.lg,
    ...Platform.select({
      ios: {
        shadowColor: Colors.shadow,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 6,
      },
      android: { elevation: 4 },
    }),
  },
  calendarOverrideStyle: {
    borderRadius: Radii.md,
  },
  overrideOptionsCard: { // New style for override options as a card
    padding: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    backgroundColor: Colors.surface, // Ensure it has a background
    borderRadius: Radii.md, // Apply border radius
    marginTop: Spacing.md, // Space from calendar
    ...Platform.select({
      ios: {
        shadowColor: Colors.shadow,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 6,
      },
      android: { elevation: 4 },
    }),
  },
  overrideTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: Colors.text,
    marginBottom: Spacing.sm,
  },
  customSlotsSummary: {
    fontSize: 13,
    color: Colors.textMuted,
    marginBottom: Spacing.sm,
    fontStyle: 'italic',
  },
  blockedDayBadge: {
    backgroundColor: Colors.danger,
    color: Colors.surface,
    paddingVertical: Spacing.xs,
    paddingHorizontal: Spacing.sm,
    borderRadius: Radii.pill,
    alignSelf: 'flex-start', // Fit content
    marginBottom: Spacing.sm,
    fontWeight: 'bold',
    fontSize: 12,
  },
  overrideButton: {
    backgroundColor: Colors.fieldBg,
    borderRadius: Radii.pill,
    paddingVertical: 10,
    alignItems: 'center',
    marginBottom: Spacing.sm,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  overrideButtonSelected: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  overrideButtonText: {
    color: Colors.text,
    fontSize: 14,
    fontWeight: 'bold',
  },
  overrideButtonTextSelected: {
    color: '#FFFFFF',
  },
  clearOverrideButton: {
    backgroundColor: Colors.danger,
    borderRadius: Radii.pill,
    paddingVertical: 10,
    alignItems: 'center',
    marginTop: Spacing.sm,
  },
  clearOverrideButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: 'bold',
  },
  saveButton: {
    backgroundColor: Colors.primary,
    borderRadius: Radii.pill,
    paddingVertical: Spacing.md,
    alignItems: 'center',
    justifyContent: 'center', // Center content for spinner
    marginTop: Spacing.lg,
    alignSelf: 'center', // Center the button itself when width changes
    // minWidth: '50%', // Ensure it doesn't shrink too much
    // maxWidth: '100%',
    ...Platform.select({
      ios: {
        shadowColor: Colors.primary,
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.3,
        shadowRadius: 10,
      },
      android: { elevation: 8 },
    }),
  },
  saveButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveButtonIcon: {
    marginRight: Spacing.xs,
  },
  saveButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
  centeredFeedback: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.bgSoft,
  },
  loadingText: {
    fontSize: 16,
    color: Colors.textMuted,
    marginTop: Spacing.sm,
  },
});