// LimpeJaApp/app/(client)/bookings/schedule-service.tsx
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  Button,
  StyleSheet,
  Alert,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { Ionicons } from '@expo/vector-icons'; // Para ícones

// Supondo que você tenha uma função para chamar a API no futuro
// import { createBooking, getProviderAvailability } from '../../../services/clientService';

// Simulação de busca de horários disponíveis
const fetchAvailableTimeSlots = async (providerId: string, date: Date): Promise<string[]> => {
  console.log(`[ScheduleService] Buscando horários para ${providerId} na data ${date.toISOString().split('T')[0]}`);
  await new Promise(resolve => setTimeout(resolve, 1000)); // Simula delay
  // Lógica de exemplo: horários diferentes para dias diferentes ou baseado no providerId
  const day = date.getDay(); // 0 = Domingo, 1 = Segunda, etc.
  if (day === 0 || day === 6) { // Fim de semana
    return ["10:00", "11:00", "12:00"];
  }
  return ["09:00", "10:00", "11:00", "14:00", "15:00", "16:00"];
};

export default function ScheduleServiceScreen() {
  const router = useRouter();
  const { providerId, serviceType, providerName } = useLocalSearchParams<{
    providerId?: string;
    serviceType?: string;
    providerName?: string; // Adicionado para exibir o nome do prestador
  }>();

  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
  const [showDatePicker, setShowDatePicker] = useState(false);

  const [availableTimeSlots, setAvailableTimeSlots] = useState<string[]>([]);
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [isFetchingSlots, setIsFetchingSlots] = useState(false);

  const [address, setAddress] = useState(''); // TODO: Carregar endereço padrão do usuário?
  const [notes, setNotes] = useState('');
  const [isBooking, setIsBooking] = useState(false);

  // Efeito para buscar horários quando uma data é selecionada
  useEffect(() => {
    if (selectedDate && providerId) {
      setSelectedTime(null); // Reseta o horário selecionado ao mudar a data
      setAvailableTimeSlots([]);
      setIsFetchingSlots(true);
      fetchAvailableTimeSlots(providerId, selectedDate)
        .then(slots => {
          setAvailableTimeSlots(slots);
        })
        .catch(err => {
          console.error("Erro ao buscar horários:", err);
          Alert.alert("Erro", "Não foi possível carregar os horários disponíveis.");
        })
        .finally(() => {
          setIsFetchingSlots(false);
        });
    }
  }, [selectedDate, providerId]);

  const onDateChange = (event: DateTimePickerEvent, date?: Date) => {
    setShowDatePicker(Platform.OS === 'ios'); // No iOS, o picker é um modal que precisa ser fechado
    if (event.type === 'set' && date) {
      setSelectedDate(date);
      console.log("Data selecionada:", date.toLocaleDateString('pt-BR'));
    } else {
      // Usuário cancelou (no Android) ou 'dismissed' no iOS
      setSelectedDate(selectedDate); // Mantém a data anterior ou undefined
    }
  };

  const handleConfirmBooking = async () => {
    if (!providerId) {
        Alert.alert("Erro", "ID do provedor não encontrado.");
        return;
    }
    if (!selectedDate || !selectedTime || !address) {
      Alert.alert("Campos Obrigatórios", "Por favor, selecione data, horário e preencha o endereço.");
      return;
    }
    setIsBooking(true);
    
    const bookingData = {
      providerId,
      serviceType: serviceType || "Não especificado", // ou um id de serviço se for mais complexo
      date: selectedDate.toISOString().split('T')[0], // Formato YYYY-MM-DD
      time: selectedTime, // Formato HH:MM
      address,
      notes,
    };
    console.log("[ScheduleService] Enviando dados do agendamento:", bookingData);

    // TODO: Descomentar e implementar chamada real ao clientService.createBooking
    // try {
    //   // const newBooking = await createBooking(bookingData);
    //   Alert.alert("Sucesso!", "Serviço agendado com sucesso.");
    //   // router.replace(`/(client)/bookings/${newBooking.id}`); // Navega para detalhes do novo agendamento
    //   router.push('/(client)/bookings'); // Volta para a lista de agendamentos
    // } catch (error: any) {
    //   Alert.alert("Falha no Agendamento", error.message || "Não foi possível agendar o serviço.");
    // } finally {
    //   setIsBooking(false);
    // }

    // Simulação de sucesso
    setTimeout(() => {
        Alert.alert("Sucesso! (Simulado)", `Serviço com ${providerName || 'o provedor'} agendado para ${selectedDate.toLocaleDateString('pt-BR')} às ${selectedTime}.`);
        router.push('/(client)/bookings');
        setIsBooking(false);
    }, 1500);
  };

  return (
    <ScrollView style={styles.scrollView} contentContainerStyle={styles.container}>
      <Stack.Screen options={{ title: `Agendar com ${providerName || 'Provedor'}` }} />
      <Text style={styles.title}>Agendar Serviço</Text>
      {providerName && <Text style={styles.providerInfo}>Com: {providerName}</Text>}
      {serviceType && <Text style={styles.providerInfo}>Serviço: {serviceType}</Text>}

      {/* Seção de Data */}
      <Text style={styles.label}>1. Escolha a Data:</Text>
      <TouchableOpacity style={styles.datePickerButton} onPress={() => setShowDatePicker(true)}>
        <Ionicons name="calendar-outline" size={20} color="#007AFF" />
        <Text style={styles.datePickerButtonText}>
          {selectedDate ? selectedDate.toLocaleDateString('pt-BR') : "Selecionar Data"}
        </Text>
      </TouchableOpacity>
      {showDatePicker && (
        <DateTimePicker
          value={selectedDate || new Date()} // Data inicial do picker
          mode="date"
          display={Platform.OS === 'ios' ? 'spinner' : 'default'}
          onChange={onDateChange}
          minimumDate={new Date()} // Não permite selecionar datas passadas
          // maximumDate={new Date(2025, 11, 31)} // Exemplo de data máxima
        />
      )}

      {/* Seção de Horário (aparece após selecionar data) */}
      {selectedDate && (
        <>
          <Text style={styles.label}>2. Escolha o Horário:</Text>
          {isFetchingSlots ? (
            <ActivityIndicator size="small" color="#007AFF" style={styles.slotLoader}/>
          ) : availableTimeSlots.length > 0 ? (
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.timeSlotsContainer}>
              {availableTimeSlots.map(time => (
                <TouchableOpacity
                  key={time}
                  style={[styles.timeSlotButton, selectedTime === time && styles.timeSlotSelected]}
                  onPress={() => setSelectedTime(time)}
                >
                  <Text style={[styles.timeSlotText, selectedTime === time && styles.timeSlotSelectedText]}>{time}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          ) : (
            <Text style={styles.noSlotsText}>Nenhum horário disponível para esta data.</Text>
          )}
        </>
      )}
      
      {/* Seção de Endereço e Observações */}
      <Text style={styles.label}>3. Endereço do Serviço:</Text>
      <TextInput
        style={styles.input}
        value={address}
        onChangeText={setAddress}
        placeholder="Rua Completa, Número, Bairro"
        placeholderTextColor="#999"
      />
      {/* Você pode adicionar mais campos de endereço se necessário (Cidade, CEP, etc.) */}

      <Text style={styles.label}>4. Observações (opcional):</Text>
      <TextInput
        style={[styles.input, styles.textArea]}
        value={notes}
        onChangeText={setNotes}
        placeholder="Ex: Foco na limpeza da cozinha, tenho um animal de estimação (dócil), etc."
        placeholderTextColor="#999"
        multiline
        numberOfLines={3}
      />

      {/* Botão de Confirmação */}
      <TouchableOpacity 
        style={[styles.confirmButton, (!selectedDate || !selectedTime || !address || isBooking) && styles.confirmButtonDisabled]} 
        onPress={handleConfirmBooking}
        disabled={!selectedDate || !selectedTime || !address || isBooking}
      >
        {isBooking ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.confirmButtonText}>Confirmar Agendamento</Text>
        )}
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scrollView: {
    flex: 1,
    backgroundColor: '#f4f7fc',
  },
  container: {
    padding: 20,
    paddingBottom: 40, // Espaço extra no final do scroll
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1C3A5F',
    marginBottom: 10,
    textAlign: 'center',
  },
  providerInfo: {
    fontSize: 16,
    color: '#555',
    textAlign: 'center',
    marginBottom: 20,
  },
  label: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginTop: 20,
    marginBottom: 10,
  },
  datePickerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#007AFF',
    paddingVertical: 12,
    paddingHorizontal: 15,
    borderRadius: 8,
    justifyContent: 'center',
  },
  datePickerButtonText: {
    color: '#007AFF',
    fontSize: 16,
    marginLeft: 10,
  },
  slotLoader: {
      marginVertical: 20,
  },
  timeSlotsContainer: {
    flexDirection: 'row',
    paddingVertical: 10,
  },
  timeSlotButton: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#007AFF',
    paddingVertical: 10,
    paddingHorizontal: 18,
    borderRadius: 20,
    marginRight: 10,
  },
  timeSlotSelected: {
    backgroundColor: '#007AFF',
  },
  timeSlotText: {
    color: '#007AFF',
    fontSize: 15,
    fontWeight: '500',
  },
  timeSlotSelectedText: {
    color: '#fff',
  },
  noSlotsText: {
      fontSize: 15,
      color: 'gray',
      textAlign: 'center',
      marginTop: 10,
  },
  input: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#ddd',
    paddingHorizontal: 15,
    paddingVertical: 12,
    borderRadius: 8,
    fontSize: 16,
    color: '#333',
    marginBottom: 15,
  },
  textArea: {
    minHeight: 80,
    textAlignVertical: 'top', // Para Android
  },
  confirmButton: {
    backgroundColor: '#007AFF',
    paddingVertical: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 30,
  },
  confirmButtonDisabled: {
    backgroundColor: '#a0cfff', // Cor mais clara para desabilitado
  },
  confirmButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
});