import React, { useState, useEffect, useMemo, useRef } from 'react';
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
  GestureResponderEvent, // Importação adicionada para GestureResponderEvent
  ImageSourcePropType,
} from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { Calendar, LocaleConfig, DateData } from 'react-native-calendars';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { formatDate } from '../../../utils/helpers';
// Importar useAuth para obter o ID do usuário logado
import { useAuth } from '../../../hooks/useAuth';
// Importar o bookingService real
import { getBookingsForUser } from '../../../services/bookingService';
import { BookingDetails, BookingStatus } from '../../../types/backend/bookings';


// Configuração de local para o calendário (Português-Brasil)
LocaleConfig.locales['pt-br'] = {
  monthNames: ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'],
  monthNamesShort: ['Jan.', 'Fev.', 'Mar.', 'Abr.', 'Mai.', 'Jun.', 'Jul.', 'Ago.', 'Set.', 'Out.', 'Nov.', 'Dez.'],
  dayNames: ['Domingo', 'Segunda-feira', 'Terça-feira', 'Quarta-feira', 'Quinta-feira', 'Sexta-feira', 'Sábado'],
  dayNamesShort: ['DOM', 'SEG', 'TER', 'QUA', 'QUI', 'SEX', 'SÁB'],
  today: 'Hoje'
};
LocaleConfig.defaultLocale = 'pt-br';

// === NOVO BLOCO: DEFINIÇÃO LOCAL DA INTERFACE THEME ===
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
  disabledArrowColor?: string;
  monthTextColor?: string;
  indicatorColor?: string;
  textDayFontFamily?: string;
  textMonthFontFamily?: string;
  textDayHeaderFontFamily?: string;
  // Alterado para tipos de string literais ou número para compatibilidade
  textDayFontWeight?: "normal" | "bold" | "100" | "200" | "300" | "400" | "500" | "600" | "700" | "800" | "900" | 100 | 200 | 300 | 400 | 500 | 600 | 700 | 800 | 900;
  textMonthFontWeight?: "normal" | "bold" | "100" | "200" | "300" | "400" | "500" | "600" | "700" | "800" | "900" | 100 | 200 | 300 | 400 | 500 | 600 | 700 | 800 | 900;
  textDayHeaderFontWeight?: "normal" | "bold" | "100" | "200" | "300" | "400" | "500" | "600" | "700" | "800" | "900" | 100 | 200 | 300 | 400 | 500 | 600 | 700 | 800 | 900;
  textDayFontSize?: number;
  textMonthFontSize?: number;
  textDayHeaderFontSize?: number;
  'stylesheet.calendar.header'?: {
    week?: {
      marginTop?: number;
      flexDirection?: 'row' | 'column' | 'row-reverse' | 'column-reverse';
      justifyContent?: 'flex-start' | 'flex-end' | 'center' | 'space-between' | 'space-around' | 'space-evenly';
      borderBottomWidth?: number;
      borderBottomColor?: string;
      paddingBottom?: number;
    };
    dayHeader?: {
      color?: string;
    };
    // Adicione outras propriedades de estilo do cabeçalho do calendário conforme necessário
  };
  // Adicione outras propriedades de tema conforme a documentação do react-native-calendars
  // Exemplo para 'stylesheet.day.basic': { base: { width: ..., height: ... } }
  // Ou 'stylesheet.day.period': { base: { width: ..., height: ... } }
}
// === FIM DO NOVO BLOCO ===

// === ÍCONES 3D (injeção sutil, sem mexer no layout) ===
const Icons3D: Record<string, ImageSourcePropType> = {
  avatar: require('/assets/images/3d/perfil.png'),
  empty: require('/assets/images/3d/step1-card-profile.png'),
};

const Icon3D = ({ src, size = 24, style }: { src: ImageSourcePropType; size?: number; style?: any }) => (
  <Image source={src} style={[{ width: size, height: size }, style]} resizeMode="contain" />
);

// A interface ProviderAppointment estende BookingDetails e adiciona campos específicos da UI
interface ProviderAppointment extends BookingDetails {
  clientAvatarUrls?: string[]; // Para múltiplos avatares na UI, derivado de clientAvatarUrl
  clientName: string; // Para exibir na UI, derivado de clientFullName
  date: string; // Data no formato YYYY-MM-DD, derivado de scheduledDate
  startTime: string; // Hora de início no formato HH:mm, derivado de scheduledTime
  endTime?: string; // Hora de término no formato HH:mm, derivado de scheduledEndTime (se disponível)
  serviceType: string; // Tipo de serviço para a UI, derivado de serviceName
}


// A função fetchProviderAppointments agora utiliza o bookingService real.
const fetchProviderAppointments = async (userId: string, selectedDateFilter?: string): Promise<ProviderAppointment[]> => {
  console.log(`[MyScheduleScreen] Buscando agendamentos para o usuário ${userId} na data ${selectedDateFilter || 'todos os dias'}`);
  try {
    // Buscar agendamentos confirmados e em progresso para o provedor
    const confirmedBookings = await getBookingsForUser(BookingStatus.CONFIRMED, userId);
    const inProgressBookings = await getBookingsForUser(BookingStatus.IN_PROGRESS, userId);

    const allProviderBookings: BookingDetails[] = [...confirmedBookings, ...inProgressBookings];

    const mappedAppointments: ProviderAppointment[] = allProviderBookings
      .filter(booking => selectedDateFilter ? booking.scheduledDate === selectedDateFilter : true) // Filtrar por data agendada
      .map(booking => {
        // Formatar a hora de início
        const startTime = booking.scheduledTime;
        // Formatar a hora de término se disponível, caso contrário, undefined
        // 'scheduledEndTime' agora é reconhecido devido à atualização na interface BookingDetails
        const endTime = booking.scheduledEndTime; 

        return {
          ...booking,
          id: booking.id,
          clientName: booking.clientFullName, // Usar o nome completo do cliente
          clientAvatarUrls: booking.clientAvatarUrl ? [booking.clientAvatarUrl] : [], // Adaptar para UI
          serviceType: booking.serviceName, // Usar o nome do serviço
          startTime: startTime, // Usar a hora agendada diretamente
          endTime: endTime, // Usar a hora final agendada ou undefined
          date: booking.scheduledDate, // Usar a data agendada diretamente
          status: booking.status, // Usar o BookingStatus do backend
          addressSummary: `${booking.address.street}, ${booking.address.number}`, // Resumo do endereço
        };
      });

    await new Promise(resolve => setTimeout(resolve, 800)); // Simular um pequeno delay para a UI
    return mappedAppointments;
  } catch (error) {
    console.error("Erro ao buscar agendamentos reais:", error);
    throw error; // Propagar o erro para o tratamento na tela
  }
};

const AnimatedAppointmentItem: React.FC<{
  item: ProviderAppointment;
  onPress: (item: ProviderAppointment) => void;
  delay: number;
}> = ({ item, onPress, delay }) => {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(20)).current;
  const scaleAnim = useRef(new Animated.Value(1)).current; // Adicionado para feedback de pressão

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

  // Funções tipadas explicitamente para não receberem argumentos
  const onPressInItem = (): void => {
    Animated.spring(scaleAnim, { toValue: 0.98, useNativeDriver: true }).start();
  };

  const onPressOutItem = (): void => {
    Animated.spring(scaleAnim, { toValue: 1, friction: 3, tension: 40, useNativeDriver: true }).start();
  };

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
        <View style={styles.clientAvatarsContainer}>
          {item.clientAvatarUrls && item.clientAvatarUrls.length > 0 ? (
            <>
              <Image source={{ uri: item.clientAvatarUrls[0] }} style={styles.clientAvatar} />
              {item.clientAvatarUrls.length > 1 && (
                <Image source={{ uri: item.clientAvatarUrls[1] }} style={[styles.clientAvatar, styles.clientAvatarOverlap]} />
              )}
            </>
          ) : (
            <View style={styles.clientAvatarPlaceholder}>
              {/* Ícone 3D no placeholder do avatar (sem alterar layout) */}
              <Icon3D src={Icons3D.avatar} size={26} />
            </View>
          )}
        </View>
        <View style={styles.appointmentDetails}>
          <Text style={styles.appointmentServiceType} numberOfLines={1}>{item.serviceType}</Text>
          <Text style={styles.appointmentClientName} numberOfLines={1}>{item.clientName}</Text>
          <View style={styles.timeAndLocation}>
            <Text style={styles.appointmentTime}>{item.startTime} {item.endTime ? ` - ${item.endTime}` : ''}</Text>
          </View>
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
};

const Timeline: React.FC = () => {
  // Altura estimada de cada "hora" na lista de agendamentos
  const HOUR_HEIGHT = 80; // Ajuste conforme a altura dos seus cartões de agendamento e espaçamento
  const START_HOUR = 9; // Hora de início da timeline na imagem
  const END_HOUR = 14; // Hora de término da timeline na imagem (14:00 é o último agendamento)

  const timeLabels = [];
  for (let i = START_HOUR; i <= END_HOUR; i++) {
    const hour = i > 12 ? i - 12 : i;
    const ampm = i >= 12 ? 'PM' : 'AM';
    timeLabels.push(`${hour} ${ampm}`);
  }

  // Posição do ponto vermelho (simulando 10 AM na imagem)
  const redDotPosition = (10 - START_HOUR) * HOUR_HEIGHT + 10; // 10px de offset para alinhar com o topo do card

  return (
    <View style={styles.timelineContainer}>
      {/* Linha vertical */}
      <View style={styles.timelineLine} />

      {/* Marcadores de tempo */}
      {timeLabels.map((label, index) => (
        <Text key={label} style={[styles.timeLabel, { top: index * HOUR_HEIGHT }]}>
          {label}
        </Text>
      ))}

      {/* Ponto vermelho na linha do tempo (simulando 10 AM) */}
      <View style={[styles.redDot, { top: redDotPosition }]} />
    </View>
  );
};


export default function MyScheduleScreen() {
  const router = useRouter();
  const { user } = useAuth(); // Obter informações do usuário logado
  // Data inicial para corresponder à imagem (12 de Outubro de 2025)
  const [selectedDate, setSelectedDate] = useState('2025-10-12');
  const [allAppointments, setAllAppointments] = useState<ProviderAppointment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const headerAnim = useRef(new Animated.Value(0)).current;
  const calendarAnim = useRef(new Animated.Value(0)).current;
  const agendaHeaderAnim = useRef(new Animated.Value(0)).current;
  const feedbackAnim = useRef(new Animated.Value(0)).current;

  // Animação para o botão de Disponibilidade
  const availabilityButtonScaleAnim = useRef(new Animated.Value(1)).current;


  const loadAppointments = async () => {
    if (!user?.id) {
      console.warn("[MyScheduleScreen] User ID não disponível, não carregando agendamentos.");
      setIsLoading(false);
      setIsRefreshing(false);
      return;
    }

    try {
      setIsLoading(true);
      // Chamar a função de busca real, passando o ID do usuário e a data selecionada
      const data = await fetchProviderAppointments(user.id, selectedDate);
      setAllAppointments(data);
      Animated.stagger(150, [
        Animated.timing(calendarAnim, { toValue: 1, duration: 600, useNativeDriver: true }),
        Animated.timing(agendaHeaderAnim, { toValue: 1, duration: 600, useNativeDriver: true }),
        Animated.timing(feedbackAnim, { toValue: 1, duration: 500, useNativeDriver: true }),
      ]).start();
    } catch (err) {
      console.error("Erro ao buscar agendamentos reais:", err);
      Alert.alert("Erro", "Não foi possível carregar os dados da agenda.");
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    Animated.timing(headerAnim, {
      toValue: 1,
      duration: 500,
      useNativeDriver: true,
    }).start();

    loadAppointments();
  }, [headerAnim, user?.id, selectedDate]); // Adicionar selectedDate como dependência para recarregar ao mudar o dia

  const onRefresh = () => {
    setIsRefreshing(true);
    loadAppointments();
  };

  const appointmentsForSelectedDate = useMemo(() => {
    // Filtrar por data e ordenar por hora de início
    return allAppointments.filter(app => app.date === selectedDate).sort((a, b) => a.startTime.localeCompare(b.startTime));
  }, [allAppointments, selectedDate]);

  const markedDates = useMemo(() => {
    const marks: { [date: string]: any } = {};
    allAppointments.forEach(app => {
      // Usar os status reais do backend para marcar os dias
      const hasConfirmed = allAppointments.some(a => a.date === app.date && a.status === BookingStatus.CONFIRMED);
      const hasInProgress = allAppointments.some(a => a.date === app.date && a.status === BookingStatus.IN_PROGRESS);

      let dotColor = '#007AFF'; // Default
      if (hasConfirmed || hasInProgress) {
        dotColor = '#5C35D6'; // Cor roxa para dias com agendamentos, como na imagem
      }

      marks[app.date] = { marked: true, dotColor: dotColor };
    });
    const currentMark = marks[selectedDate] || {};
    marks[selectedDate] = {
      ...currentMark,
      selected: true,
      // Cor roxa para o dia selecionado
      selectedColor: '#5C35D6', // Cor roxa da imagem
      selectedTextColor: 'white',
      marked: currentMark.marked || false,
      dotColor: currentMark.dotColor || '#5C35D6' // Cor do dot para dia selecionado
    };
    return marks;
  }, [allAppointments, selectedDate]);

  const onDayPress = (day: DateData) => {
    console.log('[MyScheduleScreen] Dia selecionado:', day.dateString);
    setSelectedDate(day.dateString);
  };

  const handleAppointmentPress = (item: ProviderAppointment) => {
    // Navegar para a tela de detalhes do agendamento do provedor
    // Ajustar o caminho conforme a rota real da tela de detalhes do agendamento do provedor
    router.push(`/(provider)/schedule/${item.id}` as any);
  };

  const onPressInAvailabilityButton = () => {
    Animated.spring(availabilityButtonScaleAnim, { toValue: 0.95, useNativeDriver: true }).start();
  };

  const onPressOutAvailabilityButton = () => {
    Animated.spring(availabilityButtonScaleAnim, { toValue: 1, friction: 3, tension: 40, useNativeDriver: true }).start();
  };

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />

      {/* Header customizado da tela (Minha Agenda) - Mantido, mas a imagem tem um header diferente */}
      <Animated.View style={[
        styles.customHeader,
        {
          opacity: headerAnim,
          transform: [{ translateY: headerAnim.interpolate({ inputRange: [0, 1], outputRange: [-20, 0] }) }]
        }
      ]}>
        <Text style={styles.headerTitle}>Minha Agenda</Text>
        <TouchableOpacity
          onPress={() => router.push('/(provider)/schedule/manage-availability' as any)}
          style={[styles.headerActionIcon, { transform: [{ scale: availabilityButtonScaleAnim }] }]} // Aplicando animação
          onPressIn={onPressInAvailabilityButton} // Adicionado
          onPressOut={onPressOutAvailabilityButton} // Adicionado
        >
          <Ionicons name="options-outline" size={26} color="#FFFFFF" />
          <Text style={styles.headerActionText}>Disponibilidade</Text>
        </TouchableOpacity>
      </Animated.View>

      <Animated.View style={[styles.calendarContainer, { opacity: calendarAnim, transform: [{ translateY: calendarAnim.interpolate({ inputRange: [0, 1], outputRange: [20, 0] }) }] }]}>
        <Calendar
          current={selectedDate}
          onDayPress={onDayPress}
          markedDates={markedDates}
          // Formato do mês na imagem é apenas o nome do mês
          monthFormat={'MMMM'}
          onMonthChange={(month) => {
            console.log('[MyScheduleScreen] Mês alterado para:', month.month, month.year);
          }}
          firstDay={1}
          enableSwipeMonths={true}
          theme={({
            backgroundColor: '#F0F2F5',
            calendarBackground: '#FFFFFF',
            textSectionTitleColor: '#586069', // Cor para "DOM", "SEG", etc.
            selectedDayBackgroundColor: '#5C35D6', // Cor roxa para o dia selecionado
            selectedDayTextColor: '#ffffff',
            todayTextColor: '#007AFF', // Mantido como azul para "Hoje"
            dayTextColor: '#2d4150', // Cor do texto dos dias
            textDisabledColor: '#d9e1e8',
            dotColor: '#5C35D6', // Cor do dot para dias marcados
            selectedDotColor: '#ffffff', // Cor do dot para dia selecionado
            arrowColor: '#5C35D6', // Cor das setas de navegação
            monthTextColor: '#1C3A5F', // Cor do nome do mês
            indicatorColor: '#5C35D6', // Cor do indicador de carregamento
            textDayFontWeight: '400',
            textMonthFontWeight: 'bold',
            textDayHeaderFontWeight: '500',
            textDayFontSize: 15,
            textMonthFontSize: 18,
            textDayHeaderFontSize: 13,
            'stylesheet.calendar.header': { // This structure should be recognized by react-native-calendars
              week: {
                marginTop: 5,
                flexDirection: 'row',
                justifyContent: 'space-around',
                borderBottomWidth: 1,
                borderBottomColor: '#E9ECEF',
                paddingBottom: 5,
              }
            }
          }) as Theme} // Continuamos usando 'as Theme' que agora se refere à nossa interface local
          style={styles.calendarStyle}
        />
      </Animated.View>

      <Animated.View style={[styles.agendaListHeader, { opacity: agendaHeaderAnim, transform: [{ translateY: agendaHeaderAnim.interpolate({ inputRange: [0, 1], outputRange: [20, 0] }) }] }]}>
        <Text style={styles.agendaListTitle}>
          Ongoing
        </Text>
      </Animated.View>

      {isLoading && allAppointments.length === 0 ? (
        <Animated.View style={[styles.centeredFeedback, { opacity: feedbackAnim }]}>
          <ActivityIndicator size="large" color="#007AFF" />
          <Text style={styles.loadingText}>Carregando sua agenda...</Text>
        </Animated.View>
      ) : appointmentsForSelectedDate.length > 0 ? (
        <View style={styles.agendaContent}>
          <Timeline />
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
              />
            }
          />
        </View>
      ) : (
        <Animated.View style={[styles.centeredFeedback, { opacity: feedbackAnim }]}>
          {/* Ícone 3D no estado vazio (mantendo tamanho ~64) */}
          <Icon3D src={Icons3D.empty} size={64} />
          <Text style={styles.emptyListText}>Nenhum serviço agendado para este dia.</Text>
          <Text style={styles.emptyListSubText}>Aproveite para gerenciar sua disponibilidade ou confira outros dias!</Text>
          <TouchableOpacity
            style={[styles.manageAvailabilityButton, { transform: [{ scale: availabilityButtonScaleAnim }] }]} // Aplicando animação
            onPress={() => router.push('/(provider)/schedule/manage-availability' as any)}
            onPressIn={onPressInAvailabilityButton} // Adicionado
            onPressOut={onPressOutAvailabilityButton} // Adicionado
          >
            <Text style={styles.manageAvailabilityButtonText}>Gerenciar Disponibilidade</Text>
            <Ionicons name="arrow-forward" size={18} color="#FFFFFF" style={{ marginLeft: 8 }} />
          </TouchableOpacity>
        </Animated.View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F0F2F5', // Neutro - Fundo de tela
  },
  customHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#5C35D6', // Azul/Roxo da imagem
    paddingHorizontal: 15,
    paddingVertical: Platform.OS === 'ios' ? 50 : 20,
    paddingTop: Platform.OS === 'ios' ? 50 : 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 8,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#FFFFFF', // Neutro - Branco
    flex: 1,
    textAlign: 'left',
    marginLeft: 10,
  },
  headerActionIcon: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.2)', // Neutro - Branco transparente
    borderRadius: 20,
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  headerActionText: {
    color: '#FFFFFF', // Neutro - Branco
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 5,
  },
  calendarContainer: {
    backgroundColor: '#FFFFFF', // Neutro - Branco
    marginHorizontal: 15,
    marginTop: -25,
    borderRadius: 15,
    overflow: 'hidden',
    ...Platform.select({
      ios: {
        shadowColor: '#000', // Neutro - Preto
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.1,
        shadowRadius: 10,
      },
      android: {
        elevation: 6,
      },
    }),
  },
  calendarStyle: {
    borderRadius: 15,
  },
  agendaListHeader: {
    paddingHorizontal: 15,
    paddingTop: 20,
    paddingBottom: 15,
    backgroundColor: '#F0F2F5', // Neutro - Fundo de tela
  },
  agendaListTitle: {
    fontSize: 19,
    fontWeight: 'bold',
    color: '#1C3A5F', // Neutro - Cinza escuro
  },
  agendaContent: {
    flex: 1,
    flexDirection: 'row', // Para a timeline e a lista de agendamentos
  },
  timelineContainer: {
    position: 'absolute',
    left: 15,
    top: 0,
    bottom: 0,
    width: 60, // Largura para os marcadores de tempo
    alignItems: 'flex-start',
    paddingTop: 10, // Ajuste para alinhar com o primeiro card
  },
  timelineLine: {
    position: 'absolute',
    left: 50, // Posição da linha vertical
    top: 0,
    bottom: 0,
    width: 1,
    backgroundColor: '#D3D3D3', // Neutro - Cinza claro
  },
  timeLabel: {
    position: 'absolute',
    left: 0,
    fontSize: 12,
    color: '#6C757D', // Neutro - Cinza
    fontWeight: '500',
    marginTop: -8, // Ajuste para centralizar o texto verticalmente
  },
  redDot: {
    position: 'absolute',
    left: 47, // Alinhar com a linha
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#FF0000', // Vermelho - Acento
    zIndex: 1,
  },
  listStyle: {
    flex: 1,
  },
  listContentContainer: {
    paddingLeft: 70, // Espaço para a timeline
    paddingBottom: 20,
    paddingRight: 15,
  },
  appointmentCardWrapper: {
    marginVertical: 8,
    borderRadius: 15,
    backgroundColor: '#5C35D6', // Azul/Roxo do card
    overflow: Platform.OS === 'ios' ? 'visible' : 'hidden',
    marginLeft: 5, // Pequeno ajuste para alinhar com a linha
    ...Platform.select({
      ios: {
        shadowColor: 'rgba(0,0,0,0.08)', // Neutro - Preto transparente
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.15,
        shadowRadius: 8,
      },
      android: { elevation: 5 },
    }),
  },
  appointmentCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 18,
  },
  clientAvatarsContainer: {
    flexDirection: 'row',
    marginRight: 15,
    position: 'relative',
  },
  clientAvatar: {
    width: 40, // Avatares menores
    height: 40,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: '#FFFFFF', // Neutro - Branco
  },
  clientAvatarOverlap: {
    position: 'absolute',
    left: 20, // Sobrepor o primeiro avatar
    borderColor: '#FFFFFF', // Neutro - Branco
  },
  clientAvatarPlaceholder: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 15,
    backgroundColor: '#B0C4DE', // Neutro - Azul acinzentado
    justifyContent: 'center',
    alignItems: 'center',
  },
  appointmentDetails: {
    flex: 1,
  },
  appointmentClientName: {
    fontSize: 15,
    fontWeight: '500',
    color: '#FFFFFF', // Neutro - Branco
    marginBottom: 4,
  },
  appointmentServiceType: {
    fontSize: 17,
    fontWeight: '700',
    color: '#FFFFFF', // Neutro - Branco
    marginBottom: 4,
  },
  timeAndLocation: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  appointmentTime: {
    fontSize: 13,
    color: '#FFFFFF', // Neutro - Branco
  },
  appointmentAddress: {
    fontSize: 13,
    color: '#FFFFFF', // Neutro - Branco
  },
  centeredFeedback: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    marginTop: 20,
  },
  loadingText: {
    fontSize: 17,
    color: '#6C757D', // Neutro - Cinza
    marginTop: 15,
    fontWeight: '500',
  },
  emptyListText: {
    fontSize: 17,
    color: '#6C757D', // Neutro - Cinza
    marginTop: 15,
    textAlign: 'center',
    fontWeight: '500',
  },
  emptyListSubText: {
    fontSize: 15,
    color: '#868E96', // Neutro - Cinza
    marginTop: 8,
    textAlign: 'center',
  },
  manageAvailabilityButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#007AFF', // Azul Principal
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 30,
    marginTop: 25,
    shadowColor: '#007AFF', // Azul Principal
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  manageAvailabilityButtonText: {
    color: '#FFFFFF', // Neutro - Branco
    fontSize: 16,
    fontWeight: 'bold',
  },
  listSeparator: {
    height: 0,
  }
});
