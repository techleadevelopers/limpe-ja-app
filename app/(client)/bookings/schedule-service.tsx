import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Platform,
  Alert,
  Image,
  Dimensions,
  ActivityIndicator,
  FlatList,
  Animated,
  Easing,
} from 'react-native';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as Clipboard from 'expo-clipboard';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';

// Import new components
import CalendarHeader from '../../../components/schedule/CalendarHeader';
import AddressSection from '../../../components/schedule/AddressSection';
import TimeSlotButton from '../../../components/schedule/TimeSlotButton';
import PaymentMethodSelection from '../../../components/schedule/PaymentMethodSelection';


// --- Interfaces (Adapted from your provided schedule-service.tsx) ---
interface ProviderDetails {
  id: string;
  nome: string;
  especialidade: string;
  avaliacao: number;
  precoServico: number;
  imagemUrl: string;
  pixKey?: string;
}

// --- Mock Data (From your provided schedule-service.tsx) ---
const MOCK_PROVIDERS: ProviderDetails[] = [
  {
    id: 'provider1',
    nome: 'Ana Oliveira',
    especialidade: 'Limpeza Residencial Detalhada',
    avaliacao: 4.8,
    precoServico: 95.50,
    imagemUrl: 'https://randomuser.me/api/portraits/women/43.jpg',
    pixKey: 'a1b2c3d4-e5f6-7890-1234-567890abcdef',
  },
  {
    id: 'provider2',
    nome: 'Carlos Silva',
    especialidade: 'Higienização Comercial',
    avaliacao: 4.9,
    precoServico: 120.00,
    imagemUrl: 'https://randomuser.me/api/portraits/men/32.jpg',
    pixKey: 'fedcba09-8765-4321-0fed-cba987654321',
  },
];

const fetchProviderDetailsFromAPI = async (id: string): Promise<ProviderDetails | undefined> => {
  await new Promise(resolve => setTimeout(resolve, 300));
  return MOCK_PROVIDERS.find(p => p.id === id);
};

const fetchAvailableTimeSlotsAPI = async (providerId: string, date: Date): Promise<string[]> => {
  console.log(`[ScheduleService] Buscando horários para ${providerId} na data ${date.toISOString().split('T')[0]}`);
  await new Promise(resolve => setTimeout(resolve, 700));
  const dayOfWeek = date.getDay();

  if (providerId === 'provider2') {
    return ["10:00", "11:00", "14:00", "15:00"];
  }
  if (dayOfWeek === 0 || dayOfWeek === 6) {
    return ["10:00", "11:30", "13:00"];
  }
  return ["09:00", "09:30", "10:00", "10:30", "11:00", "14:00", "14:30", "15:00", "15:30", "16:00"];
};

const SCREEN_WIDTH = Dimensions.get('window').width;
const MONTH_NAMES_PT = ["Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho", "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"];
const DAY_NAMES_PT = ["DOM", "SEG", "TER", "QUA", "QUI", "SEX", "SÁB"];

const USER_ADDRESS = "Rua Doutor Quirino, N° 58 - Centro - Campinas SP";

export default function ScheduleServiceScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ providerId?: string; serviceName?: string }>();
  const providerId = params.providerId;

  const [provider, setProvider] = useState<ProviderDetails | null>(null);
  const [isLoadingProvider, setIsLoadingProvider] = useState(true);

  const [currentDisplayMonth, setCurrentDisplayMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(new Date());
  
  const [calendarDays, setCalendarDays] = useState<Array<{day: number, month: 'current' | 'prev' | 'next', dateObj: Date}>>([]);

  const [availableTimeSlots, setAvailableTimeSlots] = useState<string[]>([]);
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [isFetchingSlots, setIsFetchingSlots] = useState(false);
  const [isBooking, setIsBooking] = useState(false);
  const [showPaymentMethodSelection, setShowPaymentMethodSelection] = useState(false);

  const shineAnim = useRef(new Animated.Value(-SCREEN_WIDTH * 0.3)).current;

  useEffect(() => {
    if (providerId) {
      setIsLoadingProvider(true);
      fetchProviderDetailsFromAPI(providerId)
        .then(data => {
          if (data) setProvider(data);
          else Alert.alert("Erro", "Prestador não encontrado.");
        })
        .catch(err => Alert.alert("Erro", "Falha ao carregar dados do prestador."))
        .finally(() => setIsLoadingProvider(false));
    } else {
      Alert.alert("Erro", "ID do prestador não fornecido.");
      router.back();
    }
  }, [providerId, router]);

  useEffect(() => {
    const animateShine = () => {
      shineAnim.setValue(-SCREEN_WIDTH * 0.3);
      Animated.timing(shineAnim, {
        toValue: SCREEN_WIDTH + (SCREEN_WIDTH * 0.3),
        duration: 3000,
        easing: Easing.linear,
        useNativeDriver: true,
      }).start(() => animateShine());
    };
    animateShine(); 
  }, []);

  const generateCalendarDays = useCallback((dateInMonth: Date) => {
    const year = dateInMonth.getFullYear();
    const month = dateInMonth.getMonth();
    const firstDayOfMonth = new Date(year, month, 1);
    const lastDayOfMonth = new Date(year, month + 1, 0);
    const daysInMonth = lastDayOfMonth.getDate();
    const startDayOfWeek = firstDayOfMonth.getDay();

    const days: Array<{day: number, month: 'current' | 'prev' | 'next', dateObj: Date}> = [];
    const prevMonthLastDay = new Date(year, month, 0).getDate();
    
    for (let i = 0; i < startDayOfWeek; i++) {
      const day = prevMonthLastDay - startDayOfWeek + 1 + i;
      days.push({ day, month: 'prev', dateObj: new Date(year, month -1, day) });
    }
    for (let i = 1; i <= daysInMonth; i++) {
      days.push({ day: i, month: 'current', dateObj: new Date(year, month, i) });
    }
    const totalCells = days.length > 35 ? 42 : 35;
    const remainingCells = totalCells - days.length;
    for (let i = 1; i <= remainingCells; i++) {
      days.push({ day: i, month: 'next', dateObj: new Date(year, month + 1, i) });
    }
    setCalendarDays(days);
  }, []);

  useEffect(() => {
    generateCalendarDays(currentDisplayMonth);
  }, [currentDisplayMonth, generateCalendarDays]);
  
  useEffect(() => {
    if (providerId && selectedDate) {
      setSelectedTime(null);
      setAvailableTimeSlots([]);
      setIsFetchingSlots(true);
      setShowPaymentMethodSelection(false); 
      fetchAvailableTimeSlotsAPI(providerId, selectedDate)
        .then(slots => setAvailableTimeSlots(slots))
        .catch(err => Alert.alert("Erro", "Não foi possível carregar os horários disponíveis."))
        .finally(() => setIsFetchingSlots(false));
    }
  }, [selectedDate, providerId]);

  const handlePrevMonth = () => {
    setCurrentDisplayMonth(prev => new Date(prev.getFullYear(), prev.getMonth() - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentDisplayMonth(prev => new Date(prev.getFullYear(), prev.getMonth() + 1, 1));
  };

  const handleDaySelect = (dateObj: Date) => {
    const today = new Date();
    today.setHours(0,0,0,0);
    if (dateObj < today) {
        Alert.alert("Data Inválida", "Não é possível selecionar uma data passada.");
        return;
    }
    setSelectedDate(dateObj);
  };

  const handleTimeSelect = (time: string) => {
    setSelectedTime(time);
    setShowPaymentMethodSelection(true); 
  };

  const handleSelectPixPayment = () => {
    setShowPaymentMethodSelection(false);
  };

  const copyToClipboard = async (text: string) => {
    if (!text) return;
    await Clipboard.setStringAsync(text);
    Alert.alert("Copiado!", "Chave PIX copiada para a área de transferência.");
  };

  const handleConfirmBooking = () => {
    if (!selectedDate || !selectedTime || !provider) {
      Alert.alert("Seleção Incompleta", "Por favor, selecione uma data e um horário.");
      return;
    }
    if (showPaymentMethodSelection) {
        handleSelectPixPayment();
        return;
    }

    setIsBooking(true);
    // Simula o processamento do agendamento e pagamento
    setTimeout(() => {
      // Navega diretamente para a página de sucesso do provider
      // A rota deve corresponder à estrutura de pastas e nome do arquivo no Expo Router
      // Ex: se o arquivo é app/(provider)/bookingss/sucess.tsx, a rota é '/(provider)/bookingss/sucess'
      router.replace({ pathname: '/(client)/bookings/success' }); // CORREÇÃO AQUI: 'bookingss' para 'bookings'
      setIsBooking(false);
    }, 1500);
  };

  if (isLoadingProvider || !provider) {
    return (
      <View style={styles.centeredFeedback}>
        <Stack.Screen options={{ title: "Carregando..." }} />
        <ActivityIndicator size="large" color="#2A72E7" />
      </View>
    );
  }

  return (
    <View style={styles.screenContainer}>
      <Stack.Screen options={{ headerShown: false }} />

      {/* Usando o novo componente CalendarHeader */}
      <CalendarHeader
        currentDisplayMonth={currentDisplayMonth}
        onPrevMonth={handlePrevMonth}
        onNextMonth={handleNextMonth}
        routerBack={() => router.back()}
        MONTH_NAMES_PT={MONTH_NAMES_PT}
      />
      
      <ScrollView contentContainerStyle={styles.scrollContentContainer}>
        <View style={styles.providerBrief}>
            <Image source={{ uri: provider.imagemUrl }} style={styles.providerImageSmall} />
            <View style={styles.providerTextInfo}>
              <Text style={styles.providerNameSmall}>{provider.nome}</Text>
              <Text style={styles.providerServiceSmall}>{params.serviceName || provider.especialidade}</Text>
            </View>
        </View>

        {/* Usando o novo componente AddressSection */}
        <AddressSection userAddress={USER_ADDRESS} shineAnim={shineAnim} />

        <View style={styles.calendarGridContainer}>
          <View style={styles.dayNamesRow}>
            {DAY_NAMES_PT.map(dayName => (
              <Text key={dayName} style={styles.dayNameText}>{dayName}</Text>
            ))}
          </View>
          <View style={styles.calendarGrid}>
            {calendarDays.map((dayInfo, index) => {
              const isSelected = selectedDate.toDateString() === dayInfo.dateObj.toDateString() && dayInfo.month === 'current';
              const isPast = dayInfo.dateObj < new Date(new Date().setHours(0,0,0,0)) && dayInfo.dateObj.toDateString() !== new Date().toDateString();
              const isToday = dayInfo.dateObj.toDateString() === new Date().toDateString();

              return (
                <TouchableOpacity
                  key={index}
                  style={[
                    styles.dayCell,
                    dayInfo.month !== 'current' && styles.dayCellNotInMonth,
                    isSelected && styles.dayCellSelected,
                    isToday && !isSelected && styles.dayCellToday,
                  ]}
                  onPress={() => dayInfo.month === 'current' && handleDaySelect(dayInfo.dateObj)}
                  disabled={dayInfo.month !== 'current' || isPast}
                >
                  <Text style={[
                    styles.dayText,
                    dayInfo.month !== 'current' && styles.dayTextNotInMonth,
                    isSelected && styles.dayTextSelected,
                    isPast && dayInfo.month === 'current' && styles.dayTextPast,
                    isToday && !isSelected && styles.dayTextToday,
                  ]}>
                    {dayInfo.day}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        <View style={styles.timeSlotsSection}>
          <Text style={styles.timeSlotsTitle}>
            Horários Disponíveis - {selectedDate.toLocaleDateString('pt-BR', { day: 'numeric', month: 'long' })}
          </Text>
          {isFetchingSlots ? (
            <ActivityIndicator size="large" color="#2A72E7" style={styles.slotsLoader} />
          ) : availableTimeSlots.length > 0 ? (
            <FlatList
              data={availableTimeSlots}
              renderItem={({ item: time }) => (
                
                <TimeSlotButton
                  time={time}
                  isSelected={selectedTime === time}
                  onPress={handleTimeSelect}
                />
              )}
              keyExtractor={(item) => item}
              numColumns={3}
              columnWrapperStyle={styles.timeSlotsRow}
              contentContainerStyle={styles.timeSlotsListContainer}
            />
          ) : (
            <Text style={styles.noSlotsText}>Nenhum horário disponível para esta data.</Text>
          )}
        </View>

        {/* Usando o novo componente PaymentMethodSelection */}
        {selectedTime && showPaymentMethodSelection && (
          <PaymentMethodSelection onSelectPixPayment={handleSelectPixPayment} />
        )}

        {selectedTime && !showPaymentMethodSelection && provider && provider.precoServico > 0 && provider.pixKey && (
          <View style={styles.pixPaymentContainer}>
            <Text style={styles.pixSectionTitle}>Pagamento via PIX</Text>
            <View style={styles.pixCard}>
              <View style={styles.pixAmountHighlight}>
                <Text style={styles.pixAmountLabel}>Valor Total:</Text>
                <Text style={styles.pixAmountValue}>R$ {provider.precoServico.toFixed(2).replace('.', ',')}</Text>
              </View>

              <View style={styles.pixContent}>
                <View style={styles.pixQrContainer}>
                  <Ionicons name="qr-code-outline" size={100} color="#333" />
                  <Text style={styles.pixQrCaption}>Escaneie o QR Code</Text>
                </View>
                <View style={styles.pixOrSeparator}>
                    <View style={styles.pixSeparatorLine} />
                    <Text style={styles.pixOrText}>OU</Text>
                    <View style={styles.pixSeparatorLine} />
                </View>
                <View style={styles.pixCopyKeyContainer}>
                  <Text style={styles.pixCopyLabel}>Copie a Chave PIX:</Text>
                  <View style={styles.pixKeyBox}>
                    <Text style={styles.pixKeyValue} numberOfLines={1} ellipsizeMode="middle">
                      {provider.pixKey}
                    </Text>
                    <TouchableOpacity onPress={() => copyToClipboard(provider.pixKey!)} style={styles.pixCopyButton}>
                      <Ionicons name="copy-outline" size={22} color="#2A72E7" />
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
              
              <Text style={styles.pixInstructionsTitle}>Instruções:</Text>
              <Text style={styles.pixInstructionItem}>1. Abra o app do seu banco e acesse a área PIX.</Text>
              <Text style={styles.pixInstructionItem}>2. Escolha pagar com QR Code ou Chave PIX.</Text>
              <Text style={styles.pixInstructionItem}>3. Escaneie o código ou cole a chave copiada.</Text>
              <Text style={styles.pixInstructionItem}>4. Confirme os dados e o valor, depois finalize o pagamento.</Text>
              <Text style={styles.pixInstructionItem}>Seu agendamento será confirmado após a aprovação do pagamento.</Text>
            </View>
          </View>
        )}

      </ScrollView>

      <View style={styles.confirmButtonWrapper}>
        <TouchableOpacity
          style={[
            styles.confirmButton,
            (!selectedTime || !provider.precoServico || isBooking) && styles.confirmButtonDisabled
          ]}
          onPress={handleConfirmBooking}
          disabled={!selectedTime || !provider.precoServico || isBooking}
        >
          {isBooking ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <Text style={styles.confirmButtonText}>
              {selectedTime && provider.precoServico ? 
                `Agendar (R$ ${provider.precoServico.toFixed(2).replace('.', ',')})` : 
                "Selecione Data e Hora"
              }
            </Text>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screenContainer: { flex: 1, backgroundColor: '#FFFFFF' },
  centeredFeedback: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#F8F9FA' },
  scrollContentContainer: { paddingBottom: 120 },

  // Styles for CalendarHeader, AddressSection, TimeSlotButton, PaymentMethodSelection
  // are now moved to their respective component files.
  // Only styles specific to schedule-service.tsx remain here.

  providerBrief: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
    backgroundColor: '#F7F9FC',
    borderBottomWidth: 1,
    borderBottomColor: '#E9EDF0'
  },
  providerImageSmall: {
    width: 50,
    height: 50,
    borderRadius: 25,
    marginRight: 12,
    borderWidth: 1,
    borderColor: '#DDEEFF'
  },
  providerTextInfo: {
    flex: 1,
  },
  providerNameSmall: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  providerServiceSmall: {
    fontSize: 14,
    color: '#555',
  },

  calendarGridContainer: {
    paddingHorizontal: 10,
    marginTop: 15,
  },
  dayNamesRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 10,
    paddingHorizontal: (SCREEN_WIDTH - 20 - (7 * 40)) / 14, 
  },
  dayNameText: {
    width: 40, 
    textAlign: 'center',
    fontSize: 12,
    color: '#888888',
    fontWeight: '500',
  },
  calendarGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'flex-start',
  },
  dayCell: {
    width: (SCREEN_WIDTH - 20) / 7 - 6, 
    height: 40, 
    justifyContent: 'center',
    alignItems: 'center',
    margin: 3,
    borderRadius: 20, 
  },
  dayCellNotInMonth: {},
  dayCellSelected: {
    backgroundColor: '#2A72E7',
  },
    dayCellToday: {
    borderColor: '#2A72E7',
    borderWidth: 1,
  },
  dayText: {
    fontSize: 15,
    color: '#333333',
  },
  dayTextNotInMonth: {
    color: '#CCCCCC',
  },
  dayTextSelected: {
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
  dayTextPast: {
      color: '#AAAAAA',
      textDecorationLine: 'line-through',
  },
    dayTextToday: {
    color: '#2A72E7',
    fontWeight: 'bold',
  },

  timeSlotsSection: {
    marginTop: 20,
    paddingHorizontal: 15,
  },
  timeSlotsTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: '#111',
    marginBottom: 15,
  },
  slotsLoader: {
    marginVertical: 20,
  },
  timeSlotsListContainer: {},
  timeSlotsRow: {
    justifyContent: 'space-between', 
  },
  noSlotsText: {
    textAlign: 'center',
    color: '#777777',
    fontSize: 15,
    marginVertical: 20,
    fontStyle: 'italic',
  },
  
  pixPaymentContainer: {
    marginTop: 25,
    marginBottom: 10,
    paddingHorizontal: 15,
  },
  pixSectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#111',
    marginBottom: 10,
    textAlign: 'center',
  },
  pixCard: {
    backgroundColor: '#F7F9FC',
    borderRadius: 12,
    padding: 15,
    borderWidth: 1,
    borderColor: '#E9EDF0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  pixAmountHighlight: {
    backgroundColor: '#E6F0FF',
    paddingVertical: 10,
    paddingHorizontal: 15,
    borderRadius: 8,
    marginBottom: 15,
    alignItems: 'center',
  },
  pixAmountLabel: {
    fontSize: 14,
    color: '#2A72E7',
    fontWeight: '500',
  },
  pixAmountValue: {
    fontSize: 20,
    color: '#2A72E7',
    fontWeight: 'bold',
  },
  pixContent: {
    alignItems: 'center',
  },
  pixQrContainer: {
    alignItems: 'center',
    marginBottom: 10,
  },
  pixQrCaption: {
    fontSize: 13,
    color: '#555',
    marginTop: 4,
  },
  pixOrSeparator: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 15,
    width: '80%',
  },
  pixSeparatorLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#DDEEFF',
  },
  pixOrText: {
    marginHorizontal: 10,
    fontSize: 13,
    color: '#778899',
    fontWeight: '500',
  },
  pixCopyKeyContainer: {
    width: '100%',
    alignItems: 'center',
    marginBottom: 20,
  },
  pixCopyLabel: {
    fontSize: 14,
    color: '#333',
    marginBottom: 6,
    fontWeight: '500',
  },
  pixKeyBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: '#DDEEFF',
    width: '90%',
    minHeight: 48,
  },
  pixKeyValue: {
    flex: 1,
    fontSize: 14,
    color: '#333',
    marginRight: 10,
  },
  pixCopyButton: {
    padding: 6,
  },
  pixInstructionsTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#334155',
    marginTop: 10,
    marginBottom: 8,
  },
  pixInstructionItem: {
    fontSize: 13,
    color: '#475569',
    lineHeight: 20,
    marginBottom: 4,
  },
  pixConfirmationNote: {
      fontSize: 12,
      color: '#64748B',
      textAlign: 'center',
      marginTop: 15,
      fontStyle: 'italic',
  },

  confirmButtonWrapper: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 20,
    paddingVertical: Platform.OS === 'ios' ? 25 : 15,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
  },
  confirmButton: {
    backgroundColor: '#2A72E7', 
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
  },
  confirmButtonDisabled: {
    backgroundColor: '#A0C7F2', 
  },
  confirmButtonText: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '600',
  },
});