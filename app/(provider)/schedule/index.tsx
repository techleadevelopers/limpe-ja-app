import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  Platform,
  Animated,
  Alert,
  RefreshControl, // Added for pull-to-refresh
  Image, // <--- Adicione Image aqui

} from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { Calendar, LocaleConfig, DateData } from 'react-native-calendars';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons'; // Added MaterialCommunityIcons for more icon options
import { formatDate } from '../../../utils/helpers'; // Adjust path as needed

// Configure locale for the calendar (Brazilian Portuguese)
LocaleConfig.locales['pt-br'] = {
  monthNames: ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'],
  monthNamesShort: ['Jan.', 'Fev.', 'Mar.', 'Abr.', 'Mai.', 'Jun.', 'Jul.', 'Ago.', 'Set.', 'Out.', 'Nov.', 'Dez.'],
  dayNames: ['Domingo', 'Segunda-feira', 'Terça-feira', 'Quarta-feira', 'Quinta-feira', 'Sexta-feira', 'Sábado'],
  dayNamesShort: ['DOM', 'SEG', 'TER', 'QUA', 'QUI', 'SEX', 'SÁB'],
  today: 'Hoje'
};
LocaleConfig.defaultLocale = 'pt-br';

// Type for a provider appointment (consider moving to types/ if used elsewhere)
interface ProviderAppointment {
  id: string; // Appointment/service ID
  clientName: string;
  serviceType: string;
  startTime: string; // HH:MM format
  endTime?: string; // HH:MM format (optional)
  date: string; //<ctrl42>-MM-DD format
  status: 'Confirmado' | 'PendenteCliente' | 'ARealizar' | 'Concluído' | 'Cancelado'; // Example statuses
  clientAvatarUrl?: string; // Added client avatar for richer UI
  clientAddress?: string; // Added client address for quick info
  totalPrice?: number; // Added total price
}

// DEFINIÇÃO DO TIPO DE ÍCONE PARA MaterialCommunityIcons
// Isso é o que faltava para o TypeScript entender os nomes dos ícones
type MaterialCommunityIconName = React.ComponentProps<typeof MaterialCommunityIcons>['name'];

// Mock appointment data (simulating initial fetch)
const ALL_PROVIDER_APPOINTMENTS: ProviderAppointment[] = [
  { id: 'servA1', clientName: 'Fernanda Lima', serviceType: 'Limpeza Padrão', startTime: '09:00', endTime: '12:00', date: new Date(Date.now() + 86400000 * 1).toISOString().split('T')[0], status: 'Confirmado', clientAvatarUrl: 'https://randomuser.me/api/portraits/women/1.jpg', clientAddress: 'Rua A, 123' },
  { id: 'servA2', clientName: 'Ricardo Alves', serviceType: 'Limpeza Pesada', startTime: '14:00', endTime: '18:00', date: new Date(Date.now() + 86400000 * 1).toISOString().split('T')[0], status: 'Confirmado', clientAvatarUrl: 'https://randomuser.me/api/portraits/men/2.jpg', clientAddress: 'Av. B, 456', totalPrice: 250.00 },
  { id: 'servA3', clientName: 'Juliana Moreira', serviceType: 'Limpeza de Manutenção', startTime: '10:00', endTime: '13:00', date: new Date(Date.now() + 86400000 * 3).toISOString().split('T')[0], status: 'ARealizar', clientAvatarUrl: 'https://randomuser.me/api/portraits/women/3.jpg', clientAddress: 'Trav. C, 789', totalPrice: 180.00 },
  { id: 'servA4', clientName: 'Marcos Andrade', serviceType: 'Limpeza de Vidros', startTime: '08:00', endTime: '10:00', date: new Date(Date.now() - 86400000 * 2).toISOString().split('T')[0], status: 'Concluído', clientAvatarUrl: 'https://randomuser.me/api/portraits/men/4.jpg', clientAddress: 'Alameda D, 101', totalPrice: 100.00 },
  { id: 'servA5', clientName: 'Ana Paula', serviceType: 'Limpeza Pós-Obra', startTime: '09:00', endTime: '17:00', date: new Date(Date.now() + 86400000 * 5).toISOString().split('T')[0], status: 'PendenteCliente', clientAvatarUrl: 'https://randomuser.me/api/portraits/women/5.jpg', clientAddress: 'Praça E, 202', totalPrice: 400.00 },
  { id: 'servA6', clientName: 'Pedro Costa', serviceType: 'Limpeza Comercial', startTime: '13:00', endTime: '17:00', date: new Date(Date.now() + 86400000 * 1).toISOString().split('T')[0], status: 'ARealizar', clientAvatarUrl: 'https://randomuser.me/api/portraits/men/6.jpg', clientAddress: 'Rua F, 303', totalPrice: 300.00 }, // Another one for the same day
];

// Mock function to fetch appointments (replace with actual API call)
const fetchProviderAppointments = async (month?: string, year?: string): Promise<ProviderAppointment[]> => {
  console.log(`[MyScheduleScreen] Fetching all appointments (simulated) for ${month || 'current'}/${year || 'current'}`);
  await new Promise(resolve => setTimeout(resolve, 800)); // Simulate network delay
  return ALL_PROVIDER_APPOINTMENTS;
};

// Component for each appointment item with animations
const AnimatedAppointmentItem: React.FC<{
  item: ProviderAppointment;
  onPress: (item: ProviderAppointment) => void;
  delay: number;
}> = ({ item, onPress, delay }) => {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(20)).current;
  const scaleAnim = useRef(new Animated.Value(1)).current; // For touch feedback

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 400,
        delay: delay,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 400,
        delay: delay,
        useNativeDriver: true,
      }),
    ]).start();
  }, [fadeAnim, slideAnim, delay]);

  const onPressInItem = () => {
    Animated.spring(scaleAnim, { toValue: 0.98, useNativeDriver: true }).start();
  };

  const onPressOutItem = () => {
    Animated.spring(scaleAnim, { toValue: 1, friction: 3, tension: 40, useNativeDriver: true }).start();
  };

  // Ajuste a função getStatusStyle para tipar o `icon` corretamente
  const getStatusStyle = (status: ProviderAppointment['status']) => {
    let iconName: MaterialCommunityIconName; // Use o tipo MaterialCommunityIconName aqui

    switch (status) {
      case 'Confirmado':
        iconName = 'check-circle';
        return { text: '#2E7D32', background: '#E8F5E9', icon: iconName }; // Green
      case 'ARealizar':
        iconName = 'clock-time-four';
        return { text: '#007AFF', background: '#E3F2FD', icon: iconName }; // Blue (to be done)
      case 'PendenteCliente':
        iconName = 'timer-sand';
        return { text: '#FF6F00', background: '#FFF3E0', icon: iconName }; // Orange (pending client action)
      case 'Concluído':
        iconName = 'check-all';
        return { text: '#546E7A', background: '#ECEFF1', icon: iconName }; // Gray (completed)
      case 'Cancelado':
        iconName = 'close-circle';
        return { text: '#D32F2F', background: '#FFEBEE', icon: iconName }; // Red
      default:
        iconName = 'information';
        return { text: '#546E7A', background: '#ECEFF1', icon: iconName };
    }
  };

  const statusStyle = getStatusStyle(item.status);

  return (
    <Animated.View
      style={[
        styles.appointmentCardWrapper,
        { opacity: fadeAnim, transform: [{ translateY: slideAnim }, { scale: scaleAnim }] }
      ]}
    >
      <TouchableOpacity
        style={styles.appointmentCard}
        onPress={() => onPress(item)}
        onPressIn={onPressInItem}
        onPressOut={onPressOutItem}
        activeOpacity={1}
      >
        {item.clientAvatarUrl ? (
          <View style={styles.avatarContainer}>
            <Image source={{ uri: item.clientAvatarUrl }} style={styles.clientAvatar} />
          </View>
        ) : (
          <View style={styles.avatarPlaceholder}>
            <Ionicons name="person" size={24} color="#FFF" />
          </View>
        )}
        <View style={styles.appointmentDetails}>
          <Text style={styles.appointmentServiceType} numberOfLines={1}>{item.serviceType}</Text>
          <Text style={styles.appointmentClientName} numberOfLines={1}>Cliente: {item.clientName}</Text>
          <Text style={styles.appointmentTimeText}>
            <Ionicons name="time-outline" size={14} color="#6C757D" /> {item.startTime} {item.endTime ? ` - ${item.endTime}` : ''}
          </Text>
          {item.clientAddress && (
            <Text style={styles.appointmentAddressText} numberOfLines={1}>
              <Ionicons name="location-outline" size={14} color="#6C757D" /> {item.clientAddress}
            </Text>
          )}
          {item.totalPrice && (
            <Text style={styles.appointmentPriceText}>
              <MaterialCommunityIcons name="currency-usd" size={14} color="#2E7D32" /> Total: R$ {item.totalPrice.toFixed(2)}
            </Text>
          )}
        </View>
        <View style={[styles.appointmentStatusBadge, { backgroundColor: statusStyle.background }]}>
          {/* O erro está aqui, e será resolvido pela tipagem correta do `statusStyle.icon` */}
          <MaterialCommunityIcons name={statusStyle.icon} size={14} color={statusStyle.text} />
          <Text style={[styles.appointmentStatusText, { color: statusStyle.text, marginLeft: 4 }]}>{item.status}</Text>
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
};


export default function MyScheduleScreen() {
  const router = useRouter();
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]); // Selected date in<ctrl42>-MM-DD format
  const [allAppointments, setAllAppointments] = useState<ProviderAppointment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false); // For pull-to-refresh

  // Animations
  const headerAnim = useRef(new Animated.Value(0)).current;
  const calendarAnim = useRef(new Animated.Value(0)).current;
  const agendaHeaderAnim = useRef(new Animated.Value(0)).current;
  const feedbackAnim = useRef(new Animated.Value(0)).current; // For loading/empty states

  const loadAppointments = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await fetchProviderAppointments();
      setAllAppointments(data);
      // Staggered animations for calendar and agenda header after data loads
      Animated.stagger(150, [
        Animated.timing(calendarAnim, { toValue: 1, duration: 600, useNativeDriver: true }),
        Animated.timing(agendaHeaderAnim, { toValue: 1, duration: 600, useNativeDriver: true }),
        Animated.timing(feedbackAnim, { toValue: 1, duration: 500, useNativeDriver: true }), // For feedback states
      ]).start();
    } catch (err) {
      console.error("Error fetching all appointments:", err);
      Alert.alert("Erro", "Não foi possível carregar os dados da agenda.");
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [calendarAnim, agendaHeaderAnim, feedbackAnim]);

  useEffect(() => {
    // Header entry animation
    Animated.timing(headerAnim, {
      toValue: 1,
      duration: 500,
      useNativeDriver: true,
    }).start();

    loadAppointments();
  }, [headerAnim, loadAppointments]);

  // Memoize appointments for the selected date
  const appointmentsForSelectedDate = useMemo(() => {
    return allAppointments.filter(app => app.date === selectedDate).sort((a, b) => a.startTime.localeCompare(b.startTime));
  }, [allAppointments, selectedDate]);

  // Memoize marked dates for the calendar
  const markedDates = useMemo(() => {
    const marks: { [date: string]: any } = {};
    allAppointments.forEach(app => {
      if (!marks[app.date]) {
        marks[app.date] = { marked: true, dotColor: '#007AFF' }; // Simple marking
      }
      // For more complex markings (e.g., multiple dots, different colors), adjust here
    });
    if (marks[selectedDate]) {
      marks[selectedDate] = { ...marks[selectedDate], selected: true, selectedColor: '#007AFF', selectedTextColor: 'white' };
    } else {
      marks[selectedDate] = { selected: true, selectedColor: '#007AFF', selectedTextColor: 'white' };
    }
    return marks;
  }, [allAppointments, selectedDate]);

  const onDayPress = (day: DateData) => {
    console.log('[MyScheduleScreen] Day selected:', day.dateString);
    setSelectedDate(day.dateString);
  };

  const handleAppointmentPress = (item: ProviderAppointment) => {
    // Navigate to the appointment details screen
    router.push(`/(provider)/services/${item.id}` as any); // Example route for service/appointment details
  };

  const onRefresh = useCallback(() => {
    setIsRefreshing(true);
    loadAppointments();
  }, [loadAppointments]);

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />

      {/* Custom Header */}
      <Animated.View style={[styles.customHeader, { opacity: headerAnim, transform: [{ translateY: headerAnim.interpolate({ inputRange: [0, 1], outputRange: [-20, 0] }) }] }]}>
        <Text style={styles.headerTitle}>Minha Agenda</Text>
        <TouchableOpacity
          onPress={() => router.push('/(provider)/schedule/manage-availability' as any)}
          style={styles.headerActionIcon}
        >
          <Ionicons name="calendar-outline" size={24} color="#FFFFFF" />
          <Text style={styles.headerActionText}>Disponibilidade</Text>
        </TouchableOpacity>
      </Animated.View>

      <Animated.View style={[styles.calendarContainer, { opacity: calendarAnim, transform: [{ translateY: calendarAnim.interpolate({ inputRange: [0, 1], outputRange: [20, 0] }) }] }]}>
        <Calendar
          current={selectedDate} // Initial calendar date
          onDayPress={onDayPress}
          markedDates={markedDates}
          monthFormat={'MMMM Guadeloupe'}
          onMonthChange={(month) => {
            console.log('[MyScheduleScreen] Month changed to:', month.month, month.year);
            // TODO: Optional - Reload appointments for the newly visible month/year
            // fetchProviderAppointments(String(month.month), String(month.year)).then(setAllAppointments);
          }}
          firstDay={1} // Monday as the first day of the week
          theme={{
            backgroundColor: '#F0F2F5', // Calendar background
            calendarBackground: '#FFFFFF', // Days area background
            textSectionTitleColor: '#586069',
            selectedDayBackgroundColor: '#007AFF',
            selectedDayTextColor: '#ffffff',
            todayTextColor: '#007AFF',
            dayTextColor: '#2d4150',
            textDisabledColor: '#d9e1e8',
            dotColor: '#007AFF',
            selectedDotColor: '#ffffff',
            arrowColor: '#007AFF',
            monthTextColor: '#1C3A5F',
            indicatorColor: '#007AFF',
            textDayFontWeight: '400',
            textMonthFontWeight: 'bold',
            textDayHeaderFontWeight: '500',
            textDayFontSize: 15,
            textMonthFontSize: 18,
            textDayHeaderFontSize: 13,
          }}
          style={styles.calendarStyle}
        />
      </Animated.View>

      <Animated.View style={[styles.agendaListHeader, { opacity: agendaHeaderAnim, transform: [{ translateY: agendaHeaderAnim.interpolate({ inputRange: [0, 1], outputRange: [20, 0] }) }] }]}>
        <Text style={styles.agendaListTitle}>
          Agenda para: {selectedDate ? formatDate(selectedDate, { weekday: 'long', day: 'numeric', month: 'long' }) : "Selecione uma data"}
        </Text>
      </Animated.View>

      {isLoading && allAppointments.length === 0 ? (
        <Animated.View style={[styles.centeredFeedback, { opacity: feedbackAnim }]}>
          <ActivityIndicator size="large" color="#007AFF" />
          <Text style={styles.loadingText}>Carregando sua agenda...</Text>
        </Animated.View>
      ) : appointmentsForSelectedDate.length > 0 ? (
        <FlatList
          data={appointmentsForSelectedDate}
          renderItem={({ item, index }) => (
            <AnimatedAppointmentItem
              item={item}
              onPress={handleAppointmentPress}
              delay={index * 70} // Staggered delay for each item
            />
          )}
          keyExtractor={(item) => item.id}
          style={styles.listStyle}
          contentContainerStyle={styles.listContentContainer}
          ItemSeparatorComponent={() => <View style={styles.listSeparator} />}
          refreshControl={
            <RefreshControl
              refreshing={isRefreshing}
              onRefresh={onRefresh}
              tintColor="#007AFF"
              title="Atualizando agenda..."
              titleColor="#007AFF"
            />
          }
        />
      ) : (
        <Animated.View style={[styles.centeredFeedback, { opacity: feedbackAnim }]}>
          <Ionicons name="calendar-outline" size={64} color="#CED4DA" />
          <Text style={styles.emptyListText}>Nenhum serviço agendado para este dia.</Text>
          <Text style={styles.emptyListSubText}>Aproveite para gerenciar sua disponibilidade ou adicionar novos serviços!</Text>
          <TouchableOpacity
            style={styles.addAvailabilityButton}
            onPress={() => router.push('/(provider)/schedule/manage-availability' as any)}
          >
            <Ionicons name="add-circle-outline" size={20} color="#FFFFFF" />
            <Text style={styles.addAvailabilityButtonText}>Gerenciar Disponibilidade</Text>
          </TouchableOpacity>
        </Animated.View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F0F2F5',
  },
  customHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#007AFF', // Primary app color
    paddingHorizontal: 15,
    paddingVertical: Platform.OS === 'ios' ? 50 : 20, // Adjust for iOS status bar
    paddingTop: Platform.OS === 'ios' ? 50 : 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 5,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFFFFF',
    flex: 1, // To make the title occupy space and center better
    textAlign: 'center',
  },
  headerActionIcon: {
    flexDirection: 'row',
    alignItems: 'center',
    position: 'absolute', // To overlay if necessary or align precisely
    right: 15,
    padding: 5, // Increases touch area
    top: Platform.OS === 'ios' ? 47 : 17, // Adjust according to paddingTop
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 20,
    paddingHorizontal: 10,
  },
  headerActionText: {
    color: '#FFFFFF',
    marginLeft: 5,
    fontSize: 14,
    fontWeight: '600',
  },
  calendarContainer: {
    backgroundColor: '#FFFFFF',
    marginBottom: 10,
    ...Platform.select({ // Soft shadow for the calendar
      ios: { shadowColor: 'rgba(0,0,0,0.1)', shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.15, shadowRadius: 6 },
      android: { elevation: 4 },
    }),
  },
  calendarStyle: {
    // Removido borderRadius aqui para aplicar no container se necessário, ou deixar default
  },
  agendaListHeader: {
    paddingHorizontal: 15,
    paddingTop: 15,
    paddingBottom: 10,
    backgroundColor: '#F0F2F5', // Same background color as the screen
  },
  agendaListTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1C3A5F',
  },
  listStyle: {
    flex: 1,
  },
  listContentContainer: {
    paddingHorizontal: 15,
    paddingBottom: 20,
  },
  appointmentCardWrapper: { // Wrapper for each item's animation
    marginVertical: 6, // Spacing between cards
    borderRadius: 12,
    backgroundColor: '#FFFFFF', // Card background for shadow to work
    overflow: Platform.OS === 'ios' ? 'visible' : 'hidden', // For shadow on iOS
    ...Platform.select({
      ios: { shadowColor: 'rgba(0,0,0,0.07)', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 3 },
      android: { elevation: 3 }, // Slightly increase elevation for Android
    }),
  },
  appointmentCard: {
    padding: 15,
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatarContainer: {
    width: 50,
    height: 50,
    borderRadius: 25,
    overflow: 'hidden',
    marginRight: 15,
    borderWidth: 2,
    borderColor: '#007AFF', // A subtle border to highlight
    justifyContent: 'center',
    alignItems: 'center',
  },
  clientAvatar: {
    width: '100%',
    height: '100%',
  },
  avatarPlaceholder: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#CED4DA',
    marginRight: 15,
    justifyContent: 'center',
    alignItems: 'center',
  },
  appointmentDetails: {
    flex: 1,
  },
  appointmentServiceType: {
    fontSize: 16,
    fontWeight: '600',
    color: '#212529',
    marginBottom: 3,
  },
  appointmentClientName: {
    fontSize: 14,
    color: '#495057',
    marginBottom: 2,
  },
  appointmentTimeText: {
    fontSize: 13,
    color: '#6C757D',
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 2,
  },
  appointmentAddressText: {
    fontSize: 13,
    color: '#6C757D',
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 2,
  },
  appointmentPriceText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#2E7D32',
    flexDirection: 'row',
    alignItems: 'center',
  },
  appointmentStatusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 16,
    marginLeft: 10,
  },
  appointmentStatusText: {
    fontSize: 11,
    fontWeight: 'bold',
    textTransform: 'uppercase',
  },
  centeredFeedback: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    marginTop: 20,
  },
  loadingText: {
    fontSize: 16,
    color: '#6C757D',
    marginTop: 10,
  },
  emptyListText: {
    fontSize: 16,
    color: '#6C757D',
    marginTop: 10,
    textAlign: 'center',
  },
  emptyListSubText: {
    fontSize: 14,
    color: '#868E96',
    marginTop: 5,
    textAlign: 'center',
    marginBottom: 20,
  },
  addAvailabilityButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#007AFF',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 25,
    marginTop: 20,
    shadowColor: '#007AFF',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 6,
  },
  addAvailabilityButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  listSeparator: {
    height: 0, // No visible separators, marginVertical of wrapper handles spacing
  }
});