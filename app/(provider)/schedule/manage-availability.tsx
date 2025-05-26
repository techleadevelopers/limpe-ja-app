// LimpeJaApp/app/(provider)/schedule/manage-availability.tsx
import React, { useState, useEffect, useCallback } from 'react';
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
} from 'react-native';
import { Stack, useRouter } from 'expo-router';
import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { Ionicons } from '@expo/vector-icons';
// import { getProviderAvailability, updateProviderAvailability } from '../../../services/providerService'; // Ajuste o caminho

interface TimeSlot {
  id: string; // Para key no map e para identificar o slot
  startTime: string; // Formato HH:MM
  endTime: string;   // Formato HH:MM
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
    }, 1000);
  }, []);

  const handleToggleDayAvailability = (dayIndex: number, value: boolean) => {
    setWeeklyAvailability(prev =>
      prev.map(day =>
        day.dayIndex === dayIndex ? { ...day, isAvailable: value, slots: value ? day.slots : [] } : day
      )
    );
  };

  const openTimePicker = (dayIdx: number, slotId: string | 'new', mode: 'startTime' | 'endTime') => {
    setEditingDayIndex(dayIdx);
    setEditingSlotId(slotId);
    setCurrentPickerMode(mode);

    const day = weeklyAvailability[dayIdx];
    let initialTime = new Date(); // Default to now

    if (slotId !== 'new') {
        const slot = day.slots.find(s => s.id === slotId);
        if (slot) {
            initialTime = parseTime(mode === 'startTime' ? slot.startTime : slot.endTime);
        }
    } else {
        // Para novo slot, pode definir um horário padrão, ex: 09:00 para startTime, 10:00 para endTime
        initialTime = parseTime(mode === 'startTime' ? '09:00' : '10:00');
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
            let newSlots: TimeSlot[];
            if (editingSlotId === 'new') {
              // Adicionando um novo slot (ainda precisa do outro par, startTime ou endTime)
              // Esta lógica precisaria ser aprimorada para criar um slot completo de uma vez
              // ou ter um estado temporário para o novo slot.
              // Por simplicidade, vamos assumir que um novo slot precisa de ambos os tempos.
              // Este exemplo de adicionar 'new' diretamente no picker é simplificado.
              // Uma UI melhor teria campos separados para 'novo' e depois abriria o picker.
              // Para este exemplo, vamos focar em editar um slot existente.
              // Para adicionar um novo slot, normalmente você teria um botão "Adicionar Horário"
              // que cria um slot com horários padrão ou vazios, e então você edita.
              console.warn("[ManageAvailability] Lógica para 'novo' slot via picker simplificada. Melhor adicionar slot e depois editar.");
              // Para agora, vamos só atualizar o primeiro slot se for 'new' e currentPickerMode for startTime
              if (day.slots.length > 0 && currentPickerMode === 'startTime'){
                newSlots = [{...day.slots[0], startTime: formattedTime}, ...day.slots.slice(1)];
              } else if (day.slots.length > 0 && currentPickerMode === 'endTime'){
                 newSlots = [{...day.slots[0], endTime: formattedTime}, ...day.slots.slice(1)];
              } else { // Adiciona um novo slot se não houver nenhum
                 newSlots = [...day.slots, {id: Math.random().toString(), startTime: currentPickerMode === 'startTime' ? formattedTime : '00:00', endTime: currentPickerMode === 'endTime' ? formattedTime : '00:00' }];
              }

            } else { // Editando slot existente
              newSlots = day.slots.map(slot =>
                slot.id === editingSlotId
                  ? { ...slot, [currentPickerMode]: formattedTime }
                  : slot
              );
            }
            // TODO: Adicionar validação (endTime > startTime, não sobrepor horários)
            return { ...day, slots: newSlots.sort((a,b) => a.startTime.localeCompare(b.startTime)) };
          }
          return day;
        })
      );
    }
    if (Platform.OS === 'ios') { // Para iOS, fechar o picker (se modal) ou indicar que acabou
        setShowTimePicker(false); 
    }
    // Resetar estados de edição
    // setEditingDayIndex(null); // Não resetar aqui para permitir editar o outro tempo do mesmo slot
    // setEditingSlotId(null);
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
      Alert.alert('Sucesso (Simulado)', 'Disponibilidade salva!');
      setIsSaving(false);
      router.back();
    }, 1500);
  };

  if (isLoading) {
    return (
      <View style={styles.centeredFeedback}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={styles.loadingText}>Carregando sua disponibilidade...</Text>
      </View>
    );
  }

  return (
    <View style={styles.outerContainer}>
      <Stack.Screen options={{ title: 'Gerenciar Disponibilidade' }} />
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.container}>
        <Text style={styles.headerTitle}>Horários de Trabalho Semanais</Text>
        <Text style={styles.headerSubtitle}>Defina os dias e horários em que você está disponível para realizar serviços.</Text>

        {weeklyAvailability.map((day, dayIdx) => (
          <View key={day.dayIndex} style={styles.dayCard}>
            <View style={styles.dayHeader}>
              <Text style={styles.dayName}>{day.dayName}</Text>
              <Switch
                trackColor={{ false: "#CED4DA", true: "#82c7ff" }}
                thumbColor={day.isAvailable ? "#007AFF" : "#f4f3f4"}
                ios_backgroundColor="#E9ECEF"
                onValueChange={(value) => handleToggleDayAvailability(dayIdx, value)}
                value={day.isAvailable}
              />
            </View>

            {day.isAvailable && (
              <View style={styles.slotsContainer}>
                {day.slots.length === 0 && (
                    <Text style={styles.noSlotsText}>Nenhum horário definido para este dia.</Text>
                )}
                {day.slots.map((slot, slotIdx) => (
                  <View key={slot.id} style={styles.slotItem}>
                    <TouchableOpacity style={styles.timeButton} onPress={() => openTimePicker(dayIdx, slot.id, 'startTime')}>
                        <Text style={styles.timeButtonText}>{slot.startTime}</Text>
                    </TouchableOpacity>
                    <Text style={styles.timeSeparator}>até</Text>
                    <TouchableOpacity style={styles.timeButton} onPress={() => openTimePicker(dayIdx, slot.id, 'endTime')}>
                        <Text style={styles.timeButtonText}>{slot.endTime}</Text>
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => removeSlot(dayIdx, slot.id)} style={styles.removeSlotButton}>
                      <Ionicons name="trash-bin-outline" size={22} color="#F44336" />
                    </TouchableOpacity>
                  </View>
                ))}
                <TouchableOpacity style={styles.addSlotButton} onPress={() => addSlot(dayIdx)}>
                  <Ionicons name="add-circle-outline" size={22} color="#007AFF" />
                  <Text style={styles.addSlotButtonText}>Adicionar Horário</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        ))}
        
        {/* Placeholder para Bloquear Datas Específicas */}
        <View style={[styles.dayCard, styles.specialSectionCard]}>
            <Text style={styles.sectionTitle}>Datas Específicas</Text>
            <TouchableOpacity style={styles.blockDateButton} onPress={() => Alert.alert("WIP", "Funcionalidade de bloquear datas específicas.")}>
                <Ionicons name="calendar-outline" size={20} color="#455A64" style={{marginRight: 8}} />
                <Text style={styles.blockDateButtonText}>Bloquear Datas ou Períodos</Text>
                <Ionicons name="chevron-forward-outline" size={20} color="#8A8A8E" />
            </TouchableOpacity>
        </View>


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
          display={Platform.OS === 'ios' ? "spinner" : "default"} // "spinner" é bom para iOS se embutido ou em modal customizado
          onChange={onTimeChange}
          minuteInterval={15} // Opcional: intervalo de minutos
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
  headerTitle: { fontSize: 24, fontWeight: 'bold', color: '#1C3A5F', marginBottom: 8, textAlign: 'center' },
  headerSubtitle: { fontSize: 15, color: '#495057', textAlign: 'center', marginBottom: 25, paddingHorizontal: 10 },
  
  dayCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 15,
    marginBottom: 15,
    ...Platform.select({
      ios: { shadowColor: 'rgba(0,0,0,0.1)', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 1, shadowRadius: 4 },
      android: { elevation: 3 },
    }),
  },
  dayHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  dayName: { fontSize: 18, fontWeight: 'bold', color: '#343A40' },
  slotsContainer: { marginTop: 10, borderTopWidth: 1, borderTopColor: '#E9ECEF', paddingTop: 15 },
  slotItem: { flexDirection: 'row', alignItems: 'center', marginBottom: 12, justifyContent: 'space-between' },
  timeButton: {
    backgroundColor: '#E9F5FF',
    paddingVertical: 10,
    paddingHorizontal: 15,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#B3D4FC',
    minWidth: 80,
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
  },
  blockDateButtonText: {
    flex: 1,
    fontSize: 16,
    color: '#495057',
  },

  saveButton: { backgroundColor: '#28A745', paddingVertical: 15, borderRadius: 8, alignItems: 'center', marginTop: 20 },
  saveButtonDisabled: { backgroundColor: '#A5D6A7' },
  saveButtonText: { color: '#FFFFFF', fontSize: 17, fontWeight: 'bold' },
});