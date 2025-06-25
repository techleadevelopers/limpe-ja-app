// LimpeJaApp/app/(provider)/schedule/manage-availability.tsx
import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Alert,
  TouchableOpacity,
  ScrollView,
  Platform,
  ActivityIndicator,
  Animated,
} from 'react-native';
import { Stack, useRouter } from 'expo-router';
// <--- CORREÇÃO DE CASING: datetimepicker (lowercase p)
import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../../hooks/useAuth';

// <--- IMPORTAÇÕES DE SERVIÇOS E TIPAGENS
import {
  getProviderAvailability,
  updateProviderAvailability,
  addProviderAvailability,
  deleteProviderAvailability,
} from '../../services/providerService';
import { ProviderAvailability, UpdateAvailabilityData } from '../../types/backend/providers'; //

// <--- IMPORTA OS NOVOS COMPONENTES CRIADOS
import AnimatedDayCard from './components/manager/AnimatedDayCard';
import BlockDateSection from './components/manager/BlockDateSection';
import SaveChangesButton from './components/manager/SaveChangesButton';

// Tipagem das estruturas de dados internas
interface TimeSlot {
  id: string; // Para key no map (pode ser temporário para novos slots)
  backendId?: string; // ID real do slot no backend, se já existir
  startTime: string; // Formato HH:MM
  endTime: string; // Formato HH:MM
  hasError?: boolean;
  errorMessage?: string;
}

interface DailyAvailability {
  dayName: string;
  dayIndex: number; // 0 (Dom) a 6 (Sab)
  isAvailable: boolean;
  slots: TimeSlot[];
}

const DAYS_OF_WEEK = [
  { name: 'Domingo', index: 0 },
  { name: 'Segunda-feira', index: 1 },
  { name: 'Terça-feira', index: 2 },
  { name: 'Quarta-feira', index: 3 },
  { name: 'Quinta-feira', index: 4 },
  { name: 'Sexta-feira', index: 5 },
  { name: 'Sábado', index: 6 },
];

// Funções utilitárias (podem ser movidas para `utils/helpers.ts` ou `schedule-helpers.ts` se houver muitos)
const formatTime = (date: Date): string => {
  const hours = date.getHours().toString().padStart(2, '0');
  const minutes = date.getMinutes().toString().padStart(2, '0');
  return `${hours}:${minutes}`;
};

const parseTime = (timeString: string): Date => {
  const [hours, minutes] = timeString.split(':').map(Number);
  const date = new Date();
  date.setHours(hours, minutes, 0, 0);
  return date;
};

export default function ManageAvailabilityScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const [weeklyAvailability, setWeeklyAvailability] = useState<DailyAvailability[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Estados para o TimePicker
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [currentPickerMode, setCurrentPickerMode] = useState<'startTime' | 'endTime'>('startTime');
  const [editingDayIndex, setEditingDayIndex] = useState<number | null>(null);
  const [editingSlotId, setEditingSlotId] = useState<string | null>(null); // ID do slot sendo editado
  const [timePickerDate, setTimePickerDate] = useState(new Date());

  // Animações
  const headerAnim = useRef(new Animated.Value(0)).current;
  const saveButtonAnim = useRef(new Animated.Value(0)).current;
  const specialSectionAnim = useRef(new Animated.Value(0)).current;

  // NOVO ESTADO: Para slots a serem excluídos na API
  const [slotsToDelete, setSlotsToDelete] = useState<Set<string>>(new Set()); // Usar Set para IDs únicos

  // Função de validação de slots
  const validateSlots = useCallback((slots: TimeSlot[]): TimeSlot[] => {
    let processedSlots: TimeSlot[] = slots.map(s => ({ ...s, hasError: false, errorMessage: undefined }));

    processedSlots = processedSlots.map(slot => {
      const start = parseTime(slot.startTime);
      const end = parseTime(slot.endTime);
      if (start >= end) {
        return { ...slot, hasError: true, errorMessage: "Hora de término deve ser posterior à de início." };
      }
      return { ...slot, hasError: false, errorMessage: undefined };
    });

    const finalValidatedSlots: TimeSlot[] = [...processedSlots];

    for (let i = 0; i < finalValidatedSlots.length; i++) {
      for (let j = i + 1; j < finalValidatedSlots.length; j++) {
        const slotA = finalValidatedSlots[i];
        const slotB = finalValidatedSlots[j];

        const startA = parseTime(slotA.startTime);
        const endA = parseTime(slotA.endTime);
        const startB = parseTime(slotB.startTime);
        const endB = parseTime(slotB.endTime);

        if ((startA < endB && endA > startB)) {
          if (!slotA.hasError || slotA.errorMessage === undefined || slotA.errorMessage === "Horário se sobrepõe a outro slot.") {
            finalValidatedSlots[i] = { ...slotA, hasError: true, errorMessage: "Horário se sobrepõe a outro slot." };
          }
          if (!slotB.hasError || slotB.errorMessage === undefined || slotB.errorMessage === "Horário se sobrepõe a outro slot.") {
            finalValidatedSlots[j] = { ...slotB, hasError: true, errorMessage: "Horário se sobrepõe a outro slot." };
          }
        }
      }
    }

    return finalValidatedSlots;
  }, []);

  // Carregar disponibilidade inicial (integrando com a API real)
  useEffect(() => {
    console.log("[ManageAvailability] Carregando disponibilidade...");
    setIsLoading(true);

    const loadInitialAvailability = async () => {
      if (!user?.id) {
        console.warn("[ManageAvailability] user.id não disponível, não carregando disponibilidade.");
        Alert.alert("Erro de Autenticação", "Não foi possível carregar sua disponibilidade. Por favor, faça login novamente.");
        setIsLoading(false);
        return;
      }

      try {
        const apiAvailability: ProviderAvailability[] = await getProviderAvailability(user.id);

        const mappedAvailability: DailyAvailability[] = DAYS_OF_WEEK.map(day => {
          // Filtrar slots válidos da API para o dia atual. ProviderAvailability são slots individuais,
          // não contêm a propriedade 'slots' como na tipagem interna.
          const daySlots = apiAvailability.filter(a => a.dayOfWeek === day.index && a.isAvailable && a.startTime && a.endTime) //
            .map(a => ({
              id: a.id, // ID do backend como ID local
              backendId: a.id, // Salva o ID do backend explicitamente
              startTime: a.startTime,
              endTime: a.endTime,
              hasError: false,
              errorMessage: undefined,
            } as TimeSlot))
            .sort((a, b) => a.startTime.localeCompare(b.startTime));

          // Determine se o dia está disponível com base nos slots retornados ou se explicitamente marcado como indisponível no backend.
          // Aqui, 'isDayExplicitlyUnavailable' verifica se há um registro *específico* do backend que marca o dia como indisponível.
          const isDayExplicitlyUnavailable = apiAvailability.some(a => a.dayOfWeek === day.index && a.isAvailable === false); //
          
          return {
            dayName: day.name,
            dayIndex: day.index,
            isAvailable: daySlots.length > 0 || !isDayExplicitlyUnavailable, // Se tem slots ou não foi explicitamente desabilitado.
            slots: validateSlots(daySlots),
          };
        });
        setWeeklyAvailability(mappedAvailability);
        console.log("[ManageAvailability] Disponibilidade carregada da API.");

      } catch (error: any) {
        console.error("Erro ao carregar disponibilidade do provedor:", error.response?.data || error.message);
        Alert.alert("Erro", error.response?.data?.message || "Não foi possível carregar a disponibilidade.");
        // Fallback para dados padrão (vazios) se a API falhar
        setWeeklyAvailability(DAYS_OF_WEEK.map(day => ({
          dayName: day.name,
          dayIndex: day.index,
          isAvailable: false,
          slots: [],
        })));
      } finally {
        setIsLoading(false);
        Animated.stagger(150, [
          Animated.timing(headerAnim, { toValue: 1, duration: 500, useNativeDriver: true }),
          Animated.timing(saveButtonAnim, { toValue: 1, duration: 500, useNativeDriver: true }),
          Animated.timing(specialSectionAnim, { toValue: 1, duration: 500, useNativeDriver: true }),
        ]).start();
      }
    };

    if (user?.id) { // Só carrega se o ID do usuário estiver disponível
      loadInitialAvailability();
    }
  }, [headerAnim, saveButtonAnim, specialSectionAnim, validateSlots, user?.id]);

  const handleToggleDayAvailability = (dayIndex: number, value: boolean) => {
    setWeeklyAvailability(prev =>
      prev.map(day =>
        day.dayIndex === dayIndex ? { ...day, isAvailable: value, slots: value ? day.slots.map(s => ({ ...s, hasError: false, errorMessage: undefined })) : [] } : day
      )
    );
  };

  const openTimePicker = (dayIdx: number, slotId: string, mode: 'startTime' | 'endTime') => {
    setEditingDayIndex(dayIdx);
    setEditingSlotId(slotId);
    setCurrentPickerMode(mode);

    const day = weeklyAvailability[dayIdx];
    let initialTime = new Date();

    const slot = day.slots.find(s => s.id === slotId);
    if (slot) {
      initialTime = parseTime(mode === 'startTime' ? slot.startTime : slot.endTime);
    }

    setTimePickerDate(initialTime);
    setShowTimePicker(true);
    console.log(`[ManageAvailability] Abrindo TimePicker para Dia: ${dayIdx}, Slot: ${slotId}, Modo: ${mode}, Hora Inicial: ${initialTime}`);
  };

  const onTimeChange = (event: DateTimePickerEvent, selectedTimeValue?: Date) => {
    if (Platform.OS === 'android') {
      setShowTimePicker(false);
    }
    if (event.type === 'set' && selectedTimeValue && editingDayIndex !== null && editingSlotId !== null) {
      const formattedTime = formatTime(selectedTimeValue);
      console.log(`[ManageAvailability] Horário selecionado: ${formattedTime} para Dia: ${editingDayIndex}, Slot: ${editingSlotId}, Modo: ${currentPickerMode}`);

      setWeeklyAvailability(prev =>
        prev.map((day, idx) => {
          if (idx === editingDayIndex) {
            let newSlots = day.slots.map(slot =>
              slot.id === editingSlotId
                ? { ...slot, [currentPickerMode]: formattedTime }
                : slot
            );
            newSlots = newSlots.sort((a, b) => a.startTime.localeCompare(b.startTime));
            newSlots = validateSlots(newSlots);
            return { ...day, slots: newSlots };
          }
          return day;
        })
      );
    }
    if (Platform.OS === 'ios') {
      setShowTimePicker(false);
    }
  };

  const addSlot = (dayIndex: number) => {
    setWeeklyAvailability(prev =>
      prev.map((day, idx) => {
        if (idx === dayIndex) {
          const newId = `temp-${Math.random().toString(36).substring(2, 9)}`; // ID temporário para novos slots
          let newStartTime = '09:00';
          let newEndTime = '10:00';

          if (day.slots.length > 0) {
            const lastSlot = day.slots[day.slots.length - 1];
            const lastEndTime = parseTime(lastSlot.endTime);
            lastEndTime.setMinutes(lastEndTime.getMinutes() + 15);
            newStartTime = formatTime(lastEndTime);
            lastEndTime.setHours(lastEndTime.getHours() + 1);
            newEndTime = formatTime(lastEndTime);
          }

          let updatedSlots = [...day.slots, { id: newId, startTime: newStartTime, endTime: newEndTime }];
          updatedSlots = updatedSlots.sort((a, b) => a.startTime.localeCompare(b.startTime));
          updatedSlots = validateSlots(updatedSlots);
          return { ...day, isAvailable: true, slots: updatedSlots };
        }
        return day;
      })
    );
  };

  const removeSlot = (dayIndex: number, slotId: string) => {
    setWeeklyAvailability(prev =>
      prev.map((day, idx) => {
        if (idx === dayIndex) {
          const slotToRemove = day.slots.find(s => s.id === slotId);
          if (slotToRemove && slotToRemove.backendId) {
            // Marca o slot para ser deletado na API
            setSlotsToDelete(prev => new Set(prev).add(slotToRemove.backendId!)); // Adiciona ao Set
          }
          let updatedSlots = day.slots.filter(slot => slot.id !== slotId);
          updatedSlots = validateSlots(updatedSlots);
          return { ...day, slots: updatedSlots };
        }
        return day;
      })
    );
  };

  const hasValidationErrors = weeklyAvailability.some(day =>
    day.slots.some(slot => slot.hasError)
  );

  const handleSaveChanges = async () => {
    if (hasValidationErrors) {
      Alert.alert('Erro de Validação', 'Por favor, corrija os horários que apresentam erros antes de salvar.');
      return;
    }
    if (!user?.id) {
      Alert.alert("Erro", "ID do provedor não disponível para salvar.");
      return;
    }

    setIsSaving(true);
    setSaveSuccess(false);
    console.log("[ManageAvailability] Salvando disponibilidade.");

    try {
      // 1. Processar adições/atualizações
      const slotsToUpdateOrCreate: UpdateAvailabilityData[] = [];
      weeklyAvailability.forEach(day => {
        // Se o dia está disponível e tem slots, ou se um dia indisponível está sendo ativado com slots
        if (day.isAvailable && day.slots.length > 0) {
          day.slots.forEach(slot => {
            slotsToUpdateOrCreate.push({
              id: slot.backendId, // Inclui o ID para o backend distinguir update/create
              dayOfWeek: day.dayIndex,
              startTime: slot.startTime,
              endTime: slot.endTime,
              isAvailable: true, // Sempre true para slots individuais
            });
          });
        } else if (!day.isAvailable && day.slots.length === 0) {
          // Se o dia está marcado como indisponível E não tem slots, enviar um slot que desabilita o dia inteiro
          slotsToUpdateOrCreate.push({
            dayOfWeek: day.dayIndex,
            isAvailable: false,
            startTime: "00:00", // Valor padrão, pode ser ignorado pelo backend se isAvailable=false
            endTime: "00:00",
          });
        }
        // Se o dia está disponível mas não tem slots, e não está explicitamente desabilitado, não faz nada aqui
        // pois a API PATCH /availability deve interpretar a ausência de slots como "sem slots"
      });
      
      // 2. Chamar a API para atualizar/sincronizar todos os slots (PATCH em massa)
      // A API `updateProviderAvailability` no seu `providerService.ts` aceita `UpdateAvailabilityData[]`.
      // Esta API deve ser inteligente para criar novos, atualizar existentes e deletar os que não são enviados.
      // Ou seja, ela "sincroniza" o estado do backend com o que é enviado.
      console.log(`Sincronizando disponibilidade para provedor ${user.id}:`, slotsToUpdateOrCreate);
      await updateProviderAvailability(user.id, slotsToUpdateOrCreate); //

      // 3. Chamar a API para deletar slots marcados para exclusão (ids guardados em `slotsToDelete`)
      await Promise.all(
        Array.from(slotsToDelete).map(async (slotBackendId) => { // Iterar sobre o Set
          console.log(`Deletando slot ${slotBackendId} para provedor ${user.id}`);
          await deleteProviderAvailability(user.id, slotBackendId); //
        })
      );
      
      setSaveSuccess(true);
      setSlotsToDelete(new Set()); // Limpa a lista de slots a serem deletados após o sucesso
      
      setTimeout(() => {
        Alert.alert('Sucesso', 'Disponibilidade salva com sucesso!');
        router.back();
      }, 500);

    } catch (error: any) {
      console.error("Erro ao salvar disponibilidade:", error.response?.data || error.message);
      Alert.alert('Erro', error.response?.data?.message || 'Não foi possível salvar a disponibilidade.');
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <View style={styles.outerContainer}>
        <Stack.Screen options={{ headerShown: false }} />
        <Animated.View style={[styles.customHeader, { opacity: headerAnim, transform: [{ translateY: headerAnim.interpolate({ inputRange: [0, 1], outputRange: [-20, 0] }) }] }]}>
          <Text style={styles.headerTitle}>Gerenciar Disponibilidade</Text>
          <View style={styles.headerActionIconPlaceholder} />
        </Animated.View>
        <View style={styles.centeredFeedback}>
          <ActivityIndicator size="large" color="#007AFF" />
          <Text style={styles.loadingText}>Carregando sua disponibilidade...</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.outerContainer}>
      <Stack.Screen options={{ headerShown: false }} />

      <Animated.View style={[styles.customHeader, { opacity: headerAnim, transform: [{ translateY: headerAnim.interpolate({ inputRange: [0, 1], outputRange: [-20, 0] }) }] }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.headerBackButton}>
          <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Gerenciar Disponibilidade</Text>
        <View style={styles.headerActionIconPlaceholder} />
      </Animated.View>

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.container}>
        <Animated.Text style={[styles.mainHeaderTitle, { opacity: headerAnim, transform: [{ translateY: headerAnim.interpolate({ inputRange: [0, 1], outputRange: [20, 0] }) }] }]}>
          Horários de Trabalho Semanais
        </Animated.Text>
        <Animated.Text style={[styles.mainHeaderSubtitle, { opacity: headerAnim, transform: [{ translateY: headerAnim.interpolate({ inputRange: [0, 1], outputRange: [20, 0] }) }] }]}>
          Defina os dias e horários em que você está disponível para realizar serviços.
        </Animated.Text>

        {weeklyAvailability.map((day, dayIdx) => (
          <AnimatedDayCard
            key={day.dayIndex}
            day={day}
            dayIdx={dayIdx}
            onToggleAvailability={handleToggleDayAvailability}
            onAddSlot={addSlot}
            onOpenPicker={openTimePicker}
            onRemoveSlot={removeSlot}
            delay={dayIdx * 100 + 200}
          />
        ))}

        {/* Placeholder para Bloquear Datas Específicas - Usando o novo componente */}
        <BlockDateSection animation={specialSectionAnim} />

        {/* Botão Salvar Alterações - Usando o novo componente */}
        <SaveChangesButton
          isSaving={isSaving}
          saveSuccess={saveSuccess}
          hasValidationErrors={hasValidationErrors}
          onPress={handleSaveChanges}
          animation={saveButtonAnim}
        />
      </ScrollView>

      {showTimePicker && (
        <DateTimePicker
          testID="timePicker"
          value={timePickerDate}
          mode="time"
          is24Hour={true}
          display={Platform.OS === 'ios' ? "spinner" : "default"}
          onChange={onTimeChange}
          minuteInterval={15}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  outerContainer: { flex: 1, backgroundColor: '#F0F2F5' },
  scrollView: { flex: 1 },
  container: { padding: 15, paddingBottom: 30 },
  centeredFeedback: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  loadingText: { marginTop: 10, fontSize: 16, color: '#555' },

  customHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#007AFF',
    paddingHorizontal: 15,
    paddingVertical: Platform.OS === 'ios' ? 50 : 20,
    paddingTop: Platform.OS === 'ios' ? 50 : 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 5,
  },
  headerBackButton: {
    marginRight: 15,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFFFFF',
    flex: 1,
    textAlign: 'center',
  },
  headerActionIconPlaceholder: {
    width: 24,
    marginLeft: 15,
  },
  mainHeaderTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1C3A5F',
    marginBottom: 8,
    textAlign: 'center',
    marginTop: 10,
  },
  mainHeaderSubtitle: {
    fontSize: 15,
    color: '#495057',
    textAlign: 'center',
    marginBottom: 25,
    paddingHorizontal: 10
  },

  // Estilos de DayCard, TimeSlot, ErrorMessage, AddSlotButton movidos para os componentes filhos.
  // Mantendo apenas estilos gerais do layout principal.
});