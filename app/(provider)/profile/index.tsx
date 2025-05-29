// LimpeJaApp/app/(provider)/schedule/index.tsx
import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  Platform,
  Animated, // Importar Animated para animações
  Alert, // << CORREÇÃO: Importar Alert
} from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { Calendar, LocaleConfig, DateData } from 'react-native-calendars';
import { Ionicons } from '@expo/vector-icons';
import { formatDate } from '../../../utils/helpers'; // Ajuste o caminho se necessário

// Configuração de local para o calendário (Português-Brasil)
LocaleConfig.locales['pt-br'] = {
  monthNames: ['Janeiro','Fevereiro','Março','Abril','Maio','Junho','Julho','Agosto','Setembro','Outubro','Novembro','Dezembro'],
  monthNamesShort: ['Jan.','Fev.','Mar.','Abr.','Mai.','Jun.','Jul.','Ago.','Set.','Out.','Nov.','Dez.'],
  dayNames: ['Domingo','Segunda-feira','Terça-feira','Quarta-feira','Quinta-feira','Sexta-feira','Sábado'],
  dayNamesShort: ['DOM','SEG','TER','QUA','QUI','SEX','SÁB'],
  today: 'Hoje'
};
LocaleConfig.defaultLocale = 'pt-br';

// Tipo para um agendamento do provedor (mova para types/ se usar em mais lugares)
interface ProviderAppointment {
  id: string;        // ID do agendamento/serviço
  clientName: string;
  serviceType: string;
  startTime: string;  // Formato HH:MM
  endTime?: string;   // Formato HH:MM (opcional)
  date: string;       // Formato YYYY-MM-DD
  status: 'Confirmado' | 'PendenteCliente' | 'ARealizar' | 'Concluído' | 'Cancelado'; // Exemplo
  // Adicione outros campos como endereço resumido, etc.
}

// Mock de dados de todos os agendamentos (simulando uma busca inicial)
const ALL_PROVIDER_APPOINTMENTS: ProviderAppointment[] = [
  { id: 'servA1', clientName: 'Fernanda Lima', serviceType: 'Limpeza Padrão', startTime: '09:00', endTime: '12:00', date: new Date(Date.now() + 86400000 * 1).toISOString().split('T')[0], status: 'Confirmado' },
  { id: 'servA2', clientName: 'Ricardo Alves', serviceType: 'Limpeza Pesada', startTime: '14:00', endTime: '18:00', date: new Date(Date.now() + 86400000 * 1).toISOString().split('T')[0], status: 'Confirmado' },
  { id: 'servA3', clientName: 'Juliana Moreira', serviceType: 'Limpeza de Manutenção', startTime: '10:00', endTime: '13:00', date: new Date(Date.now() + 86400000 * 3).toISOString().split('T')[0], status: 'ARealizar' },
  { id: 'servA4', clientName: 'Marcos Andrade', serviceType: 'Limpeza de Vidros', startTime: '08:00', endTime: '10:00', date: new Date(Date.now() - 86400000 * 2).toISOString().split('T')[0], status: 'Concluído' /* Exemplo de um passado */ },
  { id: 'servA5', clientName: 'Ana Paula', serviceType: 'Limpeza Pós-Obra', startTime: '09:00', endTime: '17:00', date: new Date(Date.now() + 86400000 * 5).toISOString().split('T')[0], status: 'PendenteCliente' },
  { id: 'servA6', clientName: 'Pedro Costa', serviceType: 'Limpeza Comercial', startTime: '13:00', endTime: '17:00', date: new Date(Date.now() + 86400000 * 1).toISOString().split('T')[0], status: 'ARealizar' }, // Mais um para o mesmo dia
];

// Função mockada para buscar agendamentos (substitua por API)
const fetchProviderAppointments = async (month?: string, year?: string): Promise<ProviderAppointment[]> => {
  console.log(`[MyScheduleScreen] Buscando todos os agendamentos (simulado) para ${month}/${year}`);
  await new Promise(resolve => setTimeout(resolve, 800)); // Simula delay de rede
  return ALL_PROVIDER_APPOINTMENTS;
};

// Componente para cada item de agendamento com animações
const AnimatedAppointmentItem: React.FC<{
    item: ProviderAppointment;
    onPress: (item: ProviderAppointment) => void;
    delay: number;
}> = ({ item, onPress, delay }) => {
    const fadeAnim = useRef(new Animated.Value(0)).current;
    const slideAnim = useRef(new Animated.Value(20)).current;
    const scaleAnim = useRef(new Animated.Value(1)).current; // Para feedback de toque

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
        switch (status) {
            case 'Confirmado': return { text: '#2E7D32', background: '#E8F5E9' }; // Verde escuro
            case 'ARealizar': return { text: '#007AFF', background: '#E3F2FD' }; // Azul primário
            case 'PendenteCliente': return { text: '#FF6F00', background: '#FFF3E0' }; // Laranja
            case 'Concluído': return { text: '#546E7A', background: '#ECEFF1' }; // Cinza
            case 'Cancelado': return { text: '#D32F2F', background: '#FFEBEE' }; // Vermelho
            default: return { text: '#546E7A', background: '#ECEFF1' };
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
                <View style={styles.appointmentTimeContainer}>
                    <Text style={styles.appointmentTime}>{item.startTime}</Text>
                    {item.endTime && <Text style={styles.appointmentEndTime}>até {item.endTime}</Text>}
                </View>
                <View style={styles.appointmentDetails}>
                    <Text style={styles.appointmentServiceType} numberOfLines={1}>{item.serviceType}</Text>
                    <Text style={styles.appointmentClientName} numberOfLines={1}>Cliente: {item.clientName}</Text>
                </View>
                <View style={[styles.appointmentStatusBadge, {backgroundColor: statusStyle.background}]}>
                    <Text style={[styles.appointmentStatusText, {color: statusStyle.text}]}>{item.status}</Text>
                </View>
            </TouchableOpacity>
        </Animated.View>
    );
};


export default function MyScheduleScreen() {
  const router = useRouter();
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]); // Data selecionada no formato YYYY-MM-DD
  const [allAppointments, setAllAppointments] = useState<ProviderAppointment[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Animações
  const headerAnim = useRef(new Animated.Value(0)).current;
  const calendarAnim = useRef(new Animated.Value(0)).current;
  const agendaHeaderAnim = useRef(new Animated.Value(0)).current;
  const feedbackAnim = useRef(new Animated.Value(0)).current; // Para loading/empty states

  useEffect(() => {
    // Animação de entrada do cabeçalho
    Animated.timing(headerAnim, {
      toValue: 1,
      duration: 500,
      useNativeDriver: true,
    }).start();

    // Carrega todos os agendamentos (ou do mês atual/próximo) para marcar o calendário
    setIsLoading(true);
    fetchProviderAppointments()
      .then(data => {
        setAllAppointments(data);
        // Animações para calendário e cabeçalho da agenda após carregar dados
        Animated.stagger(150, [
            Animated.timing(calendarAnim, { toValue: 1, duration: 600, useNativeDriver: true }),
            Animated.timing(agendaHeaderAnim, { toValue: 1, duration: 600, useNativeDriver: true }),
            Animated.timing(feedbackAnim, { toValue: 1, duration: 500, useNativeDriver: true }), // Para estados de feedback
        ]).start();
      })
      .catch(err => {
        console.error("Erro ao buscar todos os agendamentos:", err);
        Alert.alert("Erro", "Não foi possível carregar os dados da agenda.");
      })
      .finally(() => setIsLoading(false));
  }, [headerAnim, calendarAnim, agendaHeaderAnim, feedbackAnim]);

  // Memoiza os agendamentos para a data selecionada
  const appointmentsForSelectedDate = useMemo(() => {
    return allAppointments.filter(app => app.date === selectedDate).sort((a, b) => a.startTime.localeCompare(b.startTime));
  }, [allAppointments, selectedDate]);

  // Memoiza as datas marcadas para o calendário
  const markedDates = useMemo(() => {
    const marks: { [date: string]: any } = {};
    allAppointments.forEach(app => {
      if (!marks[app.date]) {
        marks[app.date] = { marked: true, dotColor: '#007AFF' }; // Marcação simples
      }
      // Para marcações mais complexas (ex: múltiplos pontos, cores diferentes), ajuste aqui
    });
    // Garante que a data selecionada tenha o estilo de selecionada
    const currentMark = marks[selectedDate] || {};
    marks[selectedDate] = {
        ...currentMark,
        selected: true,
        selectedColor: '#007AFF',
        selectedTextColor: 'white',
        // Mantém o dot se já estava marcado
        marked: currentMark.marked || false, 
        dotColor: currentMark.dotColor || '#007AFF' 
    };
    return marks;
  }, [allAppointments, selectedDate]);

  const onDayPress = (day: DateData) => {
    console.log('[MyScheduleScreen] Dia selecionado:', day.dateString);
    setSelectedDate(day.dateString);
  };

  const handleAppointmentPress = (item: ProviderAppointment) => {
    // Navega para a tela de detalhes do agendamento
    router.push(`/(provider)/services/${item.id}` as any); // Exemplo de rota, ajuste conforme necessário
  };

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />

      {/* Custom Header */}
      <Animated.View style={[styles.customHeader, { opacity: headerAnim, transform: [{ translateY: headerAnim.interpolate({ inputRange: [0, 1], outputRange: [-20, 0] }) }] }]}>
          <Text style={styles.headerTitle}>Minha Agenda</Text>
          <TouchableOpacity
              onPress={() => router.push('/(provider)/schedule/manage-availability' as any)} // Ajuste de rota se necessário
              style={styles.headerActionIcon}
          >
              <Ionicons name="settings-outline" size={24} color="#FFFFFF" />
          </TouchableOpacity>
      </Animated.View>

      <Animated.View style={[styles.calendarContainer, { opacity: calendarAnim, transform: [{ translateY: calendarAnim.interpolate({ inputRange: [0, 1], outputRange: [20, 0] }) }] }]}>
        <Calendar
            current={selectedDate} // Data inicial do calendário
            onDayPress={onDayPress}
            markedDates={markedDates}
            monthFormat={'MMMM yyyy'}
            onMonthChange={(month) => {
                console.log('[MyScheduleScreen] Mês alterado para:', month.month, month.year);
                // TODO: Opcional - Recarregar agendamentos para o novo mês/ano visível
                // fetchProviderAppointments(String(month.month), String(month.year)).then(setAllAppointments);
            }}
            firstDay={1} // Segunda como primeiro dia da semana
            theme={{
                backgroundColor: '#F0F2F5', // Fundo do calendário
                calendarBackground: '#FFFFFF', // Fundo da área dos dias
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
            Agenda para: {selectedDate ? formatDate(selectedDate, {weekday: 'long', day: 'numeric', month: 'long'}) : "Selecione uma data"}
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
                delay={index * 70} // Atraso escalonado para cada item
            />
          )}
          keyExtractor={(item) => item.id}
          style={styles.listStyle}
          contentContainerStyle={styles.listContentContainer}
          ItemSeparatorComponent={() => <View style={styles.listSeparator} />}
        />
      ) : (
        <Animated.View style={[styles.centeredFeedback, { opacity: feedbackAnim }]}>
          <Ionicons name="calendar-outline" size={64} color="#CED4DA" />
          <Text style={styles.emptyListText}>Nenhum serviço agendado para este dia.</Text>
          <Text style={styles.emptyListSubText}>Aproveite para gerenciar sua disponibilidade!</Text>
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
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFFFFF',
    flex: 1, // Para o título ocupar o espaço e centralizar melhor
    textAlign: 'center',
    marginLeft: 34, // Ajuste para centralizar com o botão de volta
  },
  headerActionIcon: {
    position: 'absolute', // Para sobrepor se necessário ou alinhar precisamente
    right: 15,
    padding: 5, // Aumenta a área de toque
    top: Platform.OS === 'ios' ? 47 : 17, // Ajuste de acordo com paddingTop
  },
  calendarContainer: {
    backgroundColor: '#FFFFFF',
    marginBottom: 10,
    ...Platform.select({ // Sombra suave para o calendário
      ios: { shadowColor: 'rgba(0,0,0,0.1)', shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.15, shadowRadius: 6 },
      android: { elevation: 4 },
    }),
  },
  calendarStyle: {
    // Removido borderRadius daqui para aplicar no container se necessário, ou deixar default
  },
  agendaListHeader: {
    paddingHorizontal: 15,
    paddingTop: 15,
    paddingBottom: 10,
    backgroundColor: '#F0F2F5', // Mesma cor de fundo da tela
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
  appointmentCardWrapper: { // Wrapper para a animação de cada item
    marginVertical: 6, // Espaçamento entre os cards
    borderRadius: 12,
    backgroundColor: '#FFFFFF', // Fundo do card para a sombra funcionar
    overflow: Platform.OS === 'ios' ? 'visible' : 'hidden', // Para sombra no iOS
    ...Platform.select({
        ios: { shadowColor: 'rgba(0,0,0,0.07)', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 3 },
        android: { elevation: 3 }, // Aumenta um pouco a elevação para Android
    }),
  },
  appointmentCard: {
    // backgroundColor: '#FFFFFF', // Movido para o wrapper
    padding: 15,
    flexDirection: 'row',
    alignItems: 'center',
  },
  appointmentTimeContainer: {
      alignItems: 'center',
      marginRight: 15,
      paddingRight: 15,
      borderRightWidth: 1,
      borderRightColor: '#E9ECEF',
      minWidth: 70,
  },
  appointmentTime: {
    fontSize: 17,
    fontWeight: 'bold',
    color: '#007AFF',
  },
  appointmentEndTime: {
    fontSize: 12,
    color: '#6C757D',
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
  },
  appointmentStatusBadge: {
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 12,
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
  },
  listSeparator: {
    height: 0, // Não queremos separadores visíveis, o marginVertical do wrapper já faz o espaçamento
  }
});