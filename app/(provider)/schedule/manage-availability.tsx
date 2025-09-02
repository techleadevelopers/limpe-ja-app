// LimpeJaApp/app/(provider)/schedule/manage-availability.tsx
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
  // REMOVIDO: getProviderAvailability, // Não é mais usado diretamente aqui
  // REMOVIDO: updateProviderAvailability, // Não é mais usado diretamente aqui
  getMyProviderAvailability, // NOVO: Importa a função para o provedor autenticado
  updateMyProviderAvailability, // NOVO: Importa a função para atualizar o provedor autenticado
} from '../../../services/providerService';
import { getBookingsForUser } from '../../../services/bookingService';
// Importa os tipos necessários, incluindo GetProviderAvailabilityResponse e UpdateAvailabilityData
import { ProviderAvailability, GetProviderAvailabilityResponse, UpdateAvailabilityData } from '../../../types/backend/providers';
import { BookingDetails, BookingStatus } from '../../../types/backend/bookings';

// ====== Design tokens (mesmos da UI padronizada) ======
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
      // Se for a última hora e o minuto já exceder o limite, pare.
      // Ex: se endHour é 19, não queremos 19:30, apenas até 19:00.
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
            {ALL_POSSIBLE_SLOTS.map(slot => (
              <TimeSlotButton
                key={slot}
                time={slot}
                isSelected={availability.selectedSlots.includes(slot)}
                onPress={onToggleSlot.bind(null, dayOfWeek, slot)}
                isBooked={bookedSlotsForDay.includes(slot)} // Marca como agendado
              />
            ))}
          </View>
          <View style={styles.dayActions}>
            <TouchableOpacity style={styles.actionButtonSecondary} onPress={() => onSelectAll(dayOfWeek)}>
              <Text style={styles.actionButtonSecondaryText}>Selecionar Tudo</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.actionButtonSecondary} onPress={() => onClearSlots(dayOfWeek)}>
              <Text style={styles.actionButtonSecondaryText}>Limpar</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
    </Animated.View>
  );
};

export default function ManageAvailabilityScreen() {
  const router = useRouter();
  const { user } = useAuth(); // Obter o ID do provedor logado
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [weeklyAvailability, setWeeklyAvailability] = useState<DayAvailability[]>([]);
  const [specificDateOverrides, setSpecificDateOverrides] = useState<SpecificDateOverride[]>([]);
  const [selectedDateForOverride, setSelectedDateForOverride] = useState<string | null>(null);
  const [bookings, setBookings] = useState<BookingDetails[]>([]); // Para obter horários já agendados

  const headerAnim = useRef(new Animated.Value(0)).current;
  const contentAnim = useRef(new Animated.Value(0)).current;

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
      // --- INÍCIO DA CORREÇÃO ---
      // Obtenha a data atual no formato YYYY-MM-DD
      const today = new Date();
      const year = today.getFullYear();
      const month = String(today.getMonth() + 1).padStart(2, '0'); // Mês é 0-indexado
      const day = String(today.getDate()).padStart(2, '0');
      const currentDate = `${year}-${month}-${day}`;

      // CORREÇÃO: Usar getMyProviderAvailability para o provedor autenticado, passando a data atual
      const { available: providerAvailabilities } = await getMyProviderAvailability(currentDate);
      // --- FIM DA CORREÇÃO ---

      const initialWeekly: DayAvailability[] = Array.from({ length: 7 }, (_, i) => ({
        dayOfWeek: i,
        isEnabled: false,
        selectedSlots: [],
        originalSlots: [],
      }));

      providerAvailabilities.forEach((avail: ProviderAvailability) => { // Adicionado tipo explícito para 'avail'
        const dayIndex = initialWeekly.findIndex(d => d.dayOfWeek === avail.dayOfWeek);
        if (dayIndex !== -1) {
          // Converte startTime e endTime para blocos de 30 minutos
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
            originalSlots: currentSlots, // Guarda os slots originais para comparação na hora de salvar
            id: avail.id, // Se a disponibilidade semanal tiver um ID geral
          };
        }
      });
      setWeeklyAvailability(initialWeekly);

      // TODO: Carregar exceções de datas específicas do backend aqui
      // const specificAvailabilities: SpecificDateOverride[] = await getSpecificDateOverrides(user.id);
      // setSpecificDateOverrides(specificAvailabilities);


      // CORREÇÃO: Passar apenas o status para getBookingsForUser
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
  }, [user?.id]); // Adiciona user.id como dependência

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
      // Se houver, pré-seleciona as opções
      // TODO: Implementar a lógica de pré-seleção na UI
    } else {
      // Limpa as opções se não houver exceção
      // TODO: Implementar a lógica de limpeza na UI
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
    try {
      // 1. Salvar Disponibilidade Semanal
      const allAvailabilityUpdates: UpdateAvailabilityData[] = [];

      for (const day of weeklyAvailability) {
        const newBlocks = convertSlotsToBlocks(day.selectedSlots);
        if (day.isEnabled && newBlocks.length > 0) {
          // Para cada bloco contínuo, crie um objeto UpdateAvailabilityData
          newBlocks.forEach(block => {
            allAvailabilityUpdates.push({
              dayOfWeek: day.dayOfWeek,
              startTime: block.startTime,
              endTime: block.endTime,
              isAvailable: true, // Assumindo que slots selecionados são disponíveis
              // Se o backend espera um 'id' para atualizar blocos existentes,
              // a lógica aqui precisaria ser mais sofisticada para mapear IDs.
              // Por enquanto, assume que o PATCH substitui ou adiciona.
            });
          });
        }
        // Se day.isEnabled for false ou newBlocks estiver vazio, não adicionamos nada para este dia.
        // O backend deve interpretar a ausência de blocos para um dayOfWeek como uma remoção.
      }

      // CORREÇÃO: Chama updateMyProviderAvailability uma única vez com todos os blocos de atualização
      await updateMyProviderAvailability(allAvailabilityUpdates);


      // 2. Salvar Exceções de Datas Específicas
      for (const override of specificDateOverrides) {
        if (override.type === 'blocked') {
          // Envia para o backend que esta data está bloqueada
          // await addSpecificDateOverride(user.id, override.date, 'blocked');
          console.log(`Bloqueando data: ${override.date}`);
        } else if (override.type === 'custom' && override.selectedSlots) {
          const customBlocks = convertSlotsToBlocks(override.selectedSlots);
          // Envia para o backend os horários personalizados para esta data
          // await addSpecificDateOverride(user.id, override.date, 'custom', customBlocks);
          console.log(`Customizando data ${override.date} com slots:`, customBlocks);
        }
      }
      // TODO: Lógica para remover overrides que foram desfeitos na UI

      Alert.alert('Sucesso', 'Sua disponibilidade foi salva!');
      router.back(); // Volta para a tela da agenda
    } catch (error: any) {
      console.error('Erro ao salvar disponibilidade:', error.response?.data || error.message);
      Alert.alert('Erro', error.response?.data?.message || 'Não foi possível salvar sua disponibilidade. Tente novamente.');
    } finally {
      setIsSaving(false);
      loadData(); // Recarrega os dados para refletir o estado atualizado
    }
  };

  // Mapeia agendamentos para horários ocupados recorrentes
  const getBookedSlotsForDay = useCallback((dayOfWeek: number): string[] => {
    const bookedTimes: string[] = [];
    // Filtra agendamentos confirmados
    const confirmedBookings = bookings.filter(b => b.status === BookingStatus.CONFIRMED);

    confirmedBookings.forEach(booking => {
      const bookingDate = new Date(booking.scheduledDate);
      // Verifica se o dia da semana do agendamento corresponde ao dia em questão
      if (bookingDate.getDay() === dayOfWeek) {
        // Converte a hora de início do agendamento para um slot de 30 minutos
        const [startHour, startMinute] = booking.scheduledTime.split(':').map(Number);
        const startTotalMinutes = startHour * 60 + startMinute;

        // CORREÇÃO: Tratar scheduledEndTime como possivelmente undefined
        const endTotalMinutes = booking.scheduledEndTime
          ? parseInt(booking.scheduledEndTime.split(':')[0]) * 60 + parseInt(booking.scheduledEndTime.split(':')[1])
          : startTotalMinutes + 30; // Assume 30 min duration if end time is missing

        // Adiciona todos os slots de 30 minutos que o agendamento ocupa
        for (let time = startTotalMinutes; time < endTotalMinutes; time += 30) {
          const hour = Math.floor(time / 60);
          const minute = time % 60;
          bookedTimes.push(`${hour < 10 ? '0' : ''}${hour}:${minute < 10 ? '0' : ''}${minute}`);
        }
      }
    });
    return Array.from(new Set(bookedTimes)); // Retorna slots únicos
  }, [bookings]);

  // Slots já agendados para a data de override selecionada
  const getBookedSlotsForSpecificDate = useCallback((date: string): string[] => {
    const bookedTimes: string[] = [];
    const confirmedBookings = bookings.filter(b => b.status === BookingStatus.CONFIRMED && b.scheduledDate === date);

    confirmedBookings.forEach(booking => {
      const [startHour, startMinute] = booking.scheduledTime.split(':').map(Number);
      const startTotalMinutes = startHour * 60 + startMinute;

      // CORREÇÃO: Tratar scheduledEndTime como possivelmente undefined
      const endTotalMinutes = booking.scheduledEndTime
        ? parseInt(booking.scheduledEndTime.split(':')[0]) * 60 + parseInt(booking.scheduledEndTime.split(':')[1])
        : startTotalMinutes + 30; // Assume 30 min duration if end time is missing

      for (let time = startTotalMinutes; time < endTotalMinutes; time += 30) {
        const hour = Math.floor(time / 60);
        const minute = time % 60;
        bookedTimes.push(`${hour < 10 ? '0' : ''}${hour}:${minute < 10 ? '0' : ''}${minute}`);
      }
    });
    return Array.from(new Set(bookedTimes));
  }, [bookings]);


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
        <Text style={styles.sectionTitle}>Disponibilidade Semanal Padrão</Text>
        <Text style={styles.sectionDescription}>Defina seus horários de trabalho regulares para cada dia da semana. Os agendamentos existentes serão desabilitados.</Text>
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
            bookedSlotsForDay={getBookedSlotsForDay(day.dayOfWeek)} // Passa os slots já agendados
          />
        ))}

        {/* Seção de Exceções de Datas Específicas */}
        <Text style={styles.sectionTitle}>Exceções de Datas Específicas</Text>
        <Text style={styles.sectionDescription}>Sobrescreva sua disponibilidade padrão para dias específicos. Agendamentos já confirmados não podem ser alterados.</Text>
        <View style={styles.calendarOverrideContainer}>
          <Calendar
            onDayPress={handleDayPressOnCalendar}
            markedDates={selectedDateForOverride ? { [selectedDateForOverride]: { selected: true, selectedColor: Colors.primary } } : {}}
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
              }) as any} // 'as any' para evitar problemas de tipagem com o tema
            style={styles.calendarOverrideStyle}
          />
          {selectedDateForOverride && (
            <View style={styles.overrideOptions}>
              <Text style={styles.overrideTitle}>Opções para {selectedDateForOverride}</Text>
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
          style={styles.saveButton}
          onPress={handleSaveAvailability}
          disabled={isSaving}
        >
          {isSaving ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <Text style={styles.saveButtonText}>Salvar Todas as Alterações</Text>
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
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.text,
    marginTop: Spacing.lg,
    marginBottom: Spacing.sm,
  },
  sectionDescription: {
    fontSize: 14,
    color: Colors.textMuted,
    marginBottom: Spacing.md,
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
  },
  timeSlotText: {
    fontSize: 13,
    fontWeight: '600',
  },
  dayActions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: Spacing.sm,
  },
  actionButtonSecondary: {
    backgroundColor: Colors.fieldBg,
    borderRadius: Radii.pill,
    paddingVertical: 8,
    paddingHorizontal: 12,
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
  overrideOptions: {
    padding: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  overrideTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: Colors.text,
    marginBottom: Spacing.sm,
  },
  overrideButton: {
    backgroundColor: Colors.fieldBg, // Cor de fundo para botões não selecionados
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
    marginTop: Spacing.lg,
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