// LimpeJaApp/app/(provider)/schedule/manage-availability.tsx
import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Switch,
  Alert,
  TouchableOpacity,
  ScrollView,
  Platform,
  ActivityIndicator,
  Animated, // Importar Animated para animações
} from 'react-native';
import { Stack, useRouter } from 'expo-router';
import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { Ionicons } from '@expo/vector-icons';
// import { getProviderAvailability, updateProviderAvailability } from '../../../services/providerService'; // Ajuste o caminho

interface TimeSlot {
  id: string; // Para key no map e para identificar o slot
  startTime: string; // Formato HH:MM
  endTime:   string;   // Formato HH:MM
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

// Função para formatar Date para HH:MM
const formatTime = (date: Date): string => {
  const hours = date.getHours().toString().padStart(2, '0');
  const minutes = date.getMinutes().toString().padStart(2, '0');
  return `${hours}:${minutes}`;
};

// Função para converter HH:MM para um objeto Date (no dia de hoje, para o picker)
const parseTime = (timeString: string): Date => {
  const [hours, minutes] = timeString.split(':').map(Number);
  const date = new Date();
  date.setHours(hours, minutes, 0, 0);
  return date;
};

// Componente para cada TimeSlot com animações e feedback
const AnimatedTimeSlot: React.FC<{
    slot: TimeSlot;
    onOpenPicker: (slotId: string, mode: 'startTime' | 'endTime') => void;
    onRemove: (slotId: string) => void;
    delay: number;
}> = ({ slot, onOpenPicker, onRemove, delay }) => {
    const fadeAnim = useRef(new Animated.Value(0)).current;
    const slideAnim = useRef(new Animated.Value(20)).current;
    const scaleAnim = useRef(new Animated.Value(1)).current;

    useEffect(() => {
        Animated.parallel([
            Animated.timing(fadeAnim, {
                toValue: 1,
                duration: 300,
                delay: delay,
                useNativeDriver: true,
            }),
            Animated.timing(slideAnim, {
                toValue: 0,
                duration: 300,
                delay: delay,
                useNativeDriver: true,
            }),
        ]).start();
    }, [fadeAnim, slideAnim, delay]);

    const onPressInButton = () => { Animated.spring(scaleAnim, { toValue: 0.95, useNativeDriver: true }).start(); };
    const onPressOutButton = () => { Animated.spring(scaleAnim, { toValue: 1, friction: 3, tension: 40, useNativeDriver: true }).start(); };

    const handleRemove = () => {
        Alert.alert(
            "Remover Horário",
            `Tem certeza que deseja remover o horário das ${slot.startTime} às ${slot.endTime}?`,
            [
                { text: "Cancelar", style: "cancel" },
                { text: "Remover", style: "destructive", onPress: () => onRemove(slot.id) }
            ]
        );
    };

    return (
        <Animated.View style={[styles.slotItem, { opacity: fadeAnim, transform: [{ translateY: slideAnim }, { scale: scaleAnim }] }]}>
            <TouchableOpacity 
                style={styles.timeButton} 
                onPress={() => onOpenPicker(slot.id, 'startTime')}
                onPressIn={onPressInButton}
                onPressOut={onPressOutButton}
            >
                <Text style={styles.timeButtonText}>{slot.startTime}</Text>
            </TouchableOpacity>
            <Text style={styles.timeSeparator}>até</Text>
            <TouchableOpacity 
                style={styles.timeButton} 
                onPress={() => onOpenPicker(slot.id, 'endTime')}
                onPressIn={onPressInButton}
                onPressOut={onPressOutButton}
            >
                <Text style={styles.timeButtonText}>{slot.endTime}</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={handleRemove} style={styles.removeSlotButton}>
                <Ionicons name="trash-bin-outline" size={22} color="#F44336" />
            </TouchableOpacity>
        </Animated.View>
    );
};

// Componente para cada Dia da Semana com animações e feedback
const AnimatedDayCard: React.FC<{
    day: DailyAvailability;
    dayIdx: number;
    onToggleAvailability: (dayIndex: number, value: boolean) => void;
    onAddSlot: (dayIndex: number) => void;
    onOpenPicker: (dayIdx: number, slotId: string, mode: 'startTime' | 'endTime') => void;
    onRemoveSlot: (dayIndex: number, slotId: string) => void;
    delay: number;
}> = ({ day, dayIdx, onToggleAvailability, onAddSlot, onOpenPicker, onRemoveSlot, delay }) => {
    const fadeAnim = useRef(new Animated.Value(0)).current;
    const slideAnim = useRef(new Animated.Value(20)).current;

    useEffect(() => {
        Animated.parallel([
            Animated.timing(fadeAnim, {
                toValue: 1,
                duration: 500,
                delay: delay,
                useNativeDriver: true,
            }),
            Animated.timing(slideAnim, {
                toValue: 0,
                duration: 500,
                delay: delay,
                useNativeDriver: true,
            }),
        ]).start();
    }, [fadeAnim, slideAnim, delay]);

    return (
        <Animated.View style={[styles.dayCard, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
            <View style={styles.dayHeader}>
                <Text style={styles.dayName}>{day.dayName}</Text>
                <Switch
                    trackColor={{ false: "#CED4DA", true: "#82c7ff" }}
                    thumbColor={day.isAvailable ? "#007AFF" : "#f4f3f4"}
                    ios_backgroundColor="#E9ECEF"
                    onValueChange={(value) => onToggleAvailability(dayIdx, value)}
                    value={day.isAvailable}
                />
            </View>

            {day.isAvailable && (
                <View style={styles.slotsContainer}>
                    {day.slots.length === 0 && (
                        <Text style={styles.noSlotsText}>Nenhum horário definido para este dia.</Text>
                    )}
                    {day.slots.map((slot, slotIndex) => (
                        <AnimatedTimeSlot
                            key={slot.id}
                            slot={slot}
                            onOpenPicker={(slotId, mode) => onOpenPicker(dayIdx, slotId, mode)}
                            onRemove={(slotId) => onRemoveSlot(dayIdx, slotId)}
                            delay={slotIndex * 50} // Atraso para os slots dentro do dia
                        />
                    ))}
                    <TouchableOpacity style={styles.addSlotButton} onPress={() => onAddSlot(dayIdx)}>
                        <Ionicons name="add-circle-outline" size={22} color="#007AFF" />
                        <Text style={styles.addSlotButtonText}>Adicionar Horário</Text>
                    </TouchableOpacity>
                </View>
            )}
        </Animated.View>
    );
};


export default function ManageAvailabilityScreen() {
  const router = useRouter();
  const [weeklyAvailability, setWeeklyAvailability] = useState<DailyAvailability[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  // Estados para o TimePicker
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [currentPickerMode, setCurrentPickerMode] = useState<'startTime' | 'endTime'>('startTime');
  const [editingDayIndex, setEditingDayIndex] = useState<number | null>(null);
  const [editingSlotId, setEditingSlotId] = useState<string | null>(null); // ID do slot sendo editado ou 'new' para um novo slot
  const [timePickerDate, setTimePickerDate] = useState(new Date());

  // Animações
  const headerAnim = useRef(new Animated.Value(0)).current;
  const saveButtonAnim = useRef(new Animated.Value(0)).current;
  const specialSectionAnim = useRef(new Animated.Value(0)).current;


  // Carregar disponibilidade inicial (simulado)
  useEffect(() => {
    console.log("[ManageAvailability] Carregando disponibilidade...");
    setIsLoading(true);
    // TODO: Chamar providerService.getProviderAvailability();
    setTimeout(() => {
      const initialAvailability: DailyAvailability[] = DAYS_OF_WEEK.map(day => ({
        dayName: day.name,
        dayIndex: day.index,
        isAvailable: ![0, 6].includes(day.index), // Indisponível nos fins de semana por padrão
        slots: ![0, 6].includes(day.index)
          ? [{ id: Math.random().toString(), startTime: '09:00', endTime: '12:00' }, { id: Math.random().toString(), startTime: '14:00', endTime: '18:00' }]
          : [],
      }));
      setWeeklyAvailability(initialAvailability);
      setIsLoading(false);
      console.log("[ManageAvailability] Disponibilidade carregada.");
      
      // Animações de entrada após o carregamento
      Animated.stagger(150, [
          Animated.timing(headerAnim, { toValue: 1, duration: 500, useNativeDriver: true }),
          Animated.timing(saveButtonAnim, { toValue: 1, duration: 500, useNativeDriver: true }),
          Animated.timing(specialSectionAnim, { toValue: 1, duration: 500, useNativeDriver: true }),
      ]).start();

    }, 1000);
  }, [headerAnim, saveButtonAnim, specialSectionAnim]);

  const handleToggleDayAvailability = (dayIndex: number, value: boolean) => {
    setWeeklyAvailability(prev =>
      prev.map(day =>
        day.dayIndex === dayIndex ? { ...day, isAvailable: value, slots: value ? day.slots : [] } : day
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
            const newSlots = day.slots.map(slot =>
                slot.id === editingSlotId
                  ? { ...slot, [currentPickerMode]: formattedTime }
                  : slot
              );
            // TODO: Adicionar validação (endTime > startTime, não sobrepor horários)
            return { ...day, slots: newSlots.sort((a,b) => a.startTime.localeCompare(b.startTime)) };
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
      prev.map((day, idx) =>
        idx === dayIndex
          ? { ...day, isAvailable: true, slots: [...day.slots, { id: Math.random().toString(), startTime: '09:00', endTime: '10:00' }].sort((a,b) => a.startTime.localeCompare(b.startTime)) }
          : day
      )
    );
  };

  const removeSlot = (dayIndex: number, slotId: string) => {
    setWeeklyAvailability(prev =>
      prev.map((day, idx) =>
        idx === dayIndex
          ? { ...day, slots: day.slots.filter(slot => slot.id !== slotId) }
          : day
      )
    );
  };

  const handleSaveChanges = async () => {
    setIsSaving(true);
    console.log("[ManageAvailability] Salvando disponibilidade:", JSON.stringify(weeklyAvailability, null, 2));
    // TODO: Chamar providerService.updateProviderAvailability(weeklyAvailability);
    // try {
    //   await updateProviderAvailability(weeklyAvailability);
    //   Alert.alert('Sucesso', 'Sua disponibilidade foi salva!');
    //   router.back();
    // } catch (error) {
    //   Alert.alert('Erro', 'Não foi possível salvar a disponibilidade.');
    // } finally {
    //   setIsSaving(false);
    // }
    setTimeout(() => { // Simulação
      Alert.alert('Sucesso', 'Disponibilidade salva com sucesso!');
      setIsSaving(false);
      router.back();
    }, 1500);
  };

  if (isLoading) {
    return (
      <View style={styles.outerContainer}>
        <Stack.Screen options={{ headerShown: false }} />
        {/* Custom Header para o estado de loading */}
        <Animated.View style={[styles.customHeader, { opacity: headerAnim, transform: [{ translateY: headerAnim.interpolate({ inputRange: [0, 1], outputRange: [-20, 0] }) }] }]}>
            <Text style={styles.headerTitle}>Gerenciar Disponibilidade</Text>
            <View style={styles.headerActionIconPlaceholder} /> {/* Placeholder para alinhar */}
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
      
      {/* Custom Header */}
      <Animated.View style={[styles.customHeader, { opacity: headerAnim, transform: [{ translateY: headerAnim.interpolate({ inputRange: [0, 1], outputRange: [-20, 0] }) }] }]}>
          <TouchableOpacity onPress={() => router.back()} style={styles.headerBackButton}>
              <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Gerenciar Disponibilidade</Text>
          <View style={styles.headerActionIconPlaceholder} /> {/* Placeholder para alinhar */}
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
            delay={dayIdx * 100 + 200} // Atraso escalonado para cada dia
          />
        ))}
        
        {/* Placeholder para Bloquear Datas Específicas */}
        <Animated.View style={[styles.dayCard, styles.specialSectionCard, { opacity: specialSectionAnim, transform: [{ translateY: specialSectionAnim.interpolate({ inputRange: [0, 1], outputRange: [20, 0] }) }] }]}>
            <Text style={styles.sectionTitle}>Datas Específicas</Text>
            <TouchableOpacity style={styles.blockDateButton} onPress={() => Alert.alert("Em Breve", "A funcionalidade de bloquear datas específicas para férias, feriados ou indisponibilidade temporária será adicionada em breve!")}>
                <Ionicons name="calendar-outline" size={20} color="#455A64" style={{marginRight: 8}} />
                <Text style={styles.blockDateButtonText}>Bloquear Datas ou Períodos</Text>
                <Ionicons name="chevron-forward-outline" size={20} color="#8A8A8E" />
            </TouchableOpacity>
        </Animated.View>


        <TouchableOpacity style={[styles.saveButton, isSaving && styles.saveButtonDisabled]} onPress={handleSaveChanges} disabled={isSaving}>
          {isSaving ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.saveButtonText}>Salvar Alterações</Text>
          )}
        </TouchableOpacity>
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

// Estilos (longos, mas necessários para a UI)
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
    backgroundColor: '#007AFF', // Cor primária do app
    paddingHorizontal: 15,
    paddingVertical: Platform.OS === 'ios' ? 50 : 20, // Ajuste para status bar iOS
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
  headerActionIconPlaceholder: { // Para alinhar o título no centro
    width: 24, // Largura do ícone
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
  
  dayCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 15,
    marginBottom: 15,
    ...Platform.select({
      ios: { shadowColor: 'rgba(0,0,0,0.1)', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.15, shadowRadius: 6 },
      android: { elevation: 4 },
    }),
  },
  dayHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  dayName: { fontSize: 18, fontWeight: 'bold', color: '#343A40' },
  slotsContainer: { marginTop: 10, borderTopWidth: 1, borderTopColor: '#E9ECEF', paddingTop: 15 },
  slotItem: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    marginBottom: 12, 
    justifyContent: 'space-between',
    backgroundColor: '#F8F9FA', // Fundo para o item de slot
    borderRadius: 8,
    padding: 8,
    borderWidth: 1,
    borderColor: '#DEE2E6',
  },
  timeButton: {
    backgroundColor: '#E9F5FF',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#B3D4FC',
    minWidth: 75, // Ajustado para ser um pouco menor
    alignItems: 'center',
  },
  timeButtonText: {
    fontSize: 15,
    fontWeight: '500',
    color: '#0056b3',
  },
  timeSeparator: { marginHorizontal: 8, fontSize: 15, color: '#6C757D' },
  removeSlotButton: { padding: 5, marginLeft: 10 },
  addSlotButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    marginTop: 10,
    backgroundColor: '#F8F9FA',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#DEE2E6',
    ...Platform.select({
        ios: { shadowColor: 'rgba(0,0,0,0.03)', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.1, shadowRadius: 2 },
        android: { elevation: 1 },
    }),
  },
  addSlotButtonText: { fontSize: 15, color: '#007AFF', marginLeft: 8, fontWeight: '600' },
  noSlotsText: { textAlign: 'center', color: '#868E96', fontStyle: 'italic', paddingVertical: 10 },

  specialSectionCard: { marginTop: 20 },
  sectionTitle: { fontSize: 18, fontWeight: 'bold', color: '#1C3A5F', marginBottom: 15 },
  blockDateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 15,
    backgroundColor: '#F1F3F5',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#CED4DA',
    ...Platform.select({
        ios: { shadowColor: 'rgba(0,0,0,0.05)', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 3 },
        android: { elevation: 2 },
    }),
  },
  blockDateButtonText: {
    flex: 1,
    fontSize: 16,
    color: '#495057',
  },

  saveButton: { 
    backgroundColor: '#28A745', 
    paddingVertical: 15, 
    borderRadius: 8, 
    alignItems: 'center', 
    marginTop: 20,
    ...Platform.select({
        ios: { shadowColor: 'rgba(0,0,0,0.1)', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 6 },
        android: { elevation: 6 },
    }),
  },
  saveButtonDisabled: { 
    backgroundColor: '#A5D6A7',
    ...Platform.select({
        ios: { shadowOpacity: 0 },
        android: { elevation: 0 },
    }),
  },
  saveButtonText: { color: '#FFFFFF', fontSize: 17, fontWeight: 'bold' },
});