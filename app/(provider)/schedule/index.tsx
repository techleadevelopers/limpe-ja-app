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
  RefreshControl,
  Image,
} from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { Calendar, LocaleConfig, DateData } from 'react-native-calendars';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { formatDate } from '../../../utils/helpers';

// Importa a função REAL do bookingService
import { getBookingsForUser } from '../../../services/bookingService';
import { BookingDetails, BookingStatus } from '../../../types/backend/bookings'; // Tipos de agendamento e status
import { useAuth } from '../../../hooks/useAuth'; // Para obter o ID do usuário logado

// Configura o idioma do calendário para Português do Brasil
LocaleConfig.locales['pt-br'] = {
  monthNames: ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'],
  monthNamesShort: ['Jan.', 'Fev.', 'Mar.', 'Abr.', 'Mai.', 'Jun.', 'Jul.', 'Ago.', 'Set.', 'Out.', 'Nov.', 'Dez.'],
  dayNames: ['Domingo', 'Segunda-feira', 'Terça-feira', 'Quarta-feira', 'Quinta-feira', 'Sexta-feira', 'Sábado'],
  dayNamesShort: ['DOM', 'SEG', 'TER', 'QUA', 'QUI', 'SEX', 'SÁB'],
  today: 'Hoje'
};
LocaleConfig.defaultLocale = 'pt-br';

// Tipo para um agendamento do provedor (adaptado para os dados do backend)
interface ProviderAppointment {
  id: string;
  clientName: string;
  serviceType: string;
  startTime: string;
  endTime?: string;
  date: string; // Formato YYYY-MM-DD
  status: 'Confirmado' | 'PendenteCliente' | 'ARealizar' | 'Concluído' | 'Cancelado'; // Status mapeados para o frontend
  clientAvatarUrl?: string;
  clientAddress?: string;
  totalPrice?: number;
}

type MaterialCommunityIconName = React.ComponentProps<typeof MaterialCommunityIcons>['name'];

// Componente para cada item de agendamento com animações
const AnimatedAppointmentItem: React.FC<{
  item: ProviderAppointment;
  onPress: (item: ProviderAppointment) => void;
  delay: number;
}> = ({ item, onPress, delay }) => {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(20)).current;
  const scaleAnim = useRef(new Animated.Value(1)).current;

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

  const getStatusStyle = (status: ProviderAppointment['status']) => {
    let iconName: MaterialCommunityIconName;

    switch (status) {
      case 'Confirmado':
        iconName = 'check-circle';
        return { text: '#2E7D32', background: '#E8F5E9', icon: iconName };
      case 'ARealizar':
        iconName = 'clock-time-four';
        return { text: '#007AFF', background: '#E3F2FD', icon: iconName };
      case 'PendenteCliente':
        iconName = 'timer-sand';
        return { text: '#FF6F00', background: '#FFF3E0', icon: iconName };
      case 'Concluído':
        iconName = 'check-all';
        return { text: '#546E7A', background: '#ECEFF1', icon: iconName };
      case 'Cancelado':
        iconName = 'close-circle';
        return { text: '#D32F2F', background: '#FFEBEE', icon: iconName };
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
          <MaterialCommunityIcons name={statusStyle.icon} size={14} color={statusStyle.text} />
          <Text style={[styles.appointmentStatusText, { color: statusStyle.text, marginLeft: 4 }]}>{item.status}</Text>
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
};


export default function MyScheduleScreen() {
  const { user } = useAuth(); // Obtém o usuário logado do contexto de autenticação
  const router = useRouter();
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]); // Data selecionada no formato YYYY-MM-DD
  const [allAppointments, setAllAppointments] = useState<ProviderAppointment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Animações
  const headerAnim = useRef(new Animated.Value(0)).current;
  const calendarAnim = useRef(new Animated.Value(0)).current;
  const agendaHeaderAnim = useRef(new Animated.Value(0)).current;
  const feedbackAnim = useRef(new Animated.Value(0)).current;

  const loadAppointments = useCallback(async () => {
    if (!user?.id) { // Verifica se o usuário está logado antes de tentar buscar dados
      setIsLoading(false);
      setIsRefreshing(false);
      Alert.alert("Erro", "Usuário não autenticado. Faça login novamente.");
      return;
    }
    setIsLoading(true);
    try {
      // CHAMADA REAL AO SERVIÇO PARA BUSCAR AGENDAMENTOS DO USUÁRIO LOGADO
      const fetchedBookings = await getBookingsForUser(); // O endpoint /bookings/me já retorna agendamentos para o usuário logado (provedor ou cliente)
      // Mapeia os dados do backend para o formato esperado pelo componente ProviderAppointment
      const mappedAppointments: ProviderAppointment[] = fetchedBookings.map((booking: BookingDetails) => ({ // Explicitamente tipado
        id: booking.id,
        clientName: booking.clientFullName, // Usando clientFullName
        serviceType: booking.serviceName, // Usando serviceName
        startTime: booking.scheduledDateTime.substring(11, 16), // Extrai HH:MM de scheduledDateTime
        endTime: booking.scheduledDateTime.substring(11, 16), // Pode ser ajustado se o backend fornecer endTime
        date: booking.scheduledDateTime.split('T')[0], // Garante o formato YYYY-MM-DD
        status:
          booking.status === BookingStatus.CONFIRMED ? 'Confirmado' :
          booking.status === BookingStatus.PENDING ? 'PendenteCliente' : // Ou 'ARealizar' dependendo da sua lógica
          booking.status === BookingStatus.COMPLETED ? 'Concluído' :
          booking.status === BookingStatus.CANCELED ? 'Cancelado' : 'ARealizar', // Mapear outros status conforme necessário
        clientAvatarUrl: booking.clientAvatarUrl || undefined,
        clientAddress: `${booking.address.street}, ${booking.address.number} - ${booking.address.neighborhood}`,
        totalPrice: parseFloat(booking.totalPrice.toString()), // Converte Decimal para number
      }));
      setAllAppointments(mappedAppointments);
      // Animações escalonadas após o carregamento dos dados
      Animated.stagger(150, [
        Animated.timing(calendarAnim, { toValue: 1, duration: 600, useNativeDriver: true }),
        Animated.timing(agendaHeaderAnim, { toValue: 1, duration: 600, useNativeDriver: true }),
        Animated.timing(feedbackAnim, { toValue: 1, duration: 500, useNativeDriver: true }),
      ]).start();
    } catch (error: any) { // Erro tipado como 'any'
      console.error("Error fetching all appointments:", error);
      Alert.alert("Erro", error.message || "Não foi possível carregar os dados da agenda.");
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [user, calendarAnim, agendaHeaderAnim, feedbackAnim]); // 'user' adicionado como dependência

  useEffect(() => {
    // Animação de entrada do cabeçalho
    Animated.timing(headerAnim, {
      toValue: 1,
      duration: 500,
      useNativeDriver: true,
    }).start();

    loadAppointments(); // Carrega os agendamentos na montagem do componente
  }, [headerAnim, loadAppointments]);

  // Memoriza os agendamentos para a data selecionada para otimização
  const appointmentsForSelectedDate = useMemo(() => {
    return allAppointments.filter(app => app.date === selectedDate).sort((a, b) => a.startTime.localeCompare(b.startTime));
  }, [allAppointments, selectedDate]);

  // Memoriza as datas marcadas no calendário
  const markedDates = useMemo(() => {
    const marks: { [date: string]: any } = {};
    allAppointments.forEach(app => {
      if (!marks[app.date]) {
        marks[app.date] = { marked: true, dotColor: '#007AFF' };
      }
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
    // Navega para a tela de detalhes do agendamento
    router.push(`/(provider)/services/${item.id}` as any); // Exemplo de rota para detalhes do serviço/agendamento
  };

  const onRefresh = useCallback(() => {
    setIsRefreshing(true);
    loadAppointments(); // Recarrega os agendamentos ao puxar para atualizar
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
          current={selectedDate}
          onDayPress={onDayPress}
          markedDates={markedDates}
          monthFormat={'MMMM Guadeloupe'}
          onMonthChange={(month) => {
            console.log('[MyScheduleScreen] Month changed to:', month.month, month.year);
            // Opcional: recarregar agendamentos para o mês/ano visível se não estiverem todos carregados
          }}
          firstDay={1}
          theme={{
            backgroundColor: '#F0F2F5',
            calendarBackground: '#FFFFFF',
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
              delay={index * 70}
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
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFFFFF',
    flex: 1,
    textAlign: 'center',
  },
  headerActionIcon: {
    flexDirection: 'row',
    alignItems: 'center',
    position: 'absolute',
    right: 15,
    padding: 5,
    top: Platform.OS === 'ios' ? 47 : 17,
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
    ...Platform.select({
      ios: { shadowColor: 'rgba(0,0,0,0.1)', shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.15, shadowRadius: 6 },
      android: { elevation: 4 },
    }),
  },
  calendarStyle: {
  },
  agendaListHeader: {
    paddingHorizontal: 15,
    paddingTop: 15,
    paddingBottom: 10,
    backgroundColor: '#F0F2F5',
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
  appointmentCardWrapper: {
    marginVertical: 6,
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    overflow: Platform.OS === 'ios' ? 'visible' : 'hidden',
    ...Platform.select({
      ios: { shadowColor: 'rgba(0,0,0,0.07)', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 3 },
      android: { elevation: 3 },
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
    borderColor: '#007AFF',
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
    height: 0,
  }
});