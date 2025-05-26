// LimpeJaApp/app/(provider)/schedule/index.tsx
import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  Platform, // Para estilos específicos de plataforma se necessário
} from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { Calendar, LocaleConfig, DateData } from 'react-native-calendars'; // Importação do Calendário
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
  id: string;         // ID do agendamento/serviço
  clientName: string;
  serviceType: string;
  startTime: string;  // Formato HH:MM
  endTime?: string;   // Formato HH:MM (opcional)
  date: string;       // Formato YYYY-MM-DD
  status: 'Confirmado' | 'PendenteCliente' | 'ARealizar'; // Exemplo
  // Adicione outros campos como endereço resumido, etc.
}

// Mock de dados de todos os agendamentos (simulando uma busca inicial)
const ALL_PROVIDER_APPOINTMENTS: ProviderAppointment[] = [
  { id: 'servA1', clientName: 'Fernanda Lima', serviceType: 'Limpeza Padrão', startTime: '09:00', endTime: '12:00', date: new Date(Date.now() + 86400000 * 1).toISOString().split('T')[0], status: 'Confirmado' },
  { id: 'servA2', clientName: 'Ricardo Alves', serviceType: 'Limpeza Pesada', startTime: '14:00', endTime: '18:00', date: new Date(Date.now() + 86400000 * 1).toISOString().split('T')[0], status: 'Confirmado' },
  { id: 'servA3', clientName: 'Juliana Moreira', serviceType: 'Limpeza de Manutenção', startTime: '10:00', endTime: '13:00', date: new Date(Date.now() + 86400000 * 3).toISOString().split('T')[0], status: 'ARealizar' },
  { id: 'servA4', clientName: 'Marcos Andrade', serviceType: 'Limpeza de Vidros', startTime: '08:00', endTime: '10:00', date: new Date(Date.now() - 86400000 * 2).toISOString().split('T')[0], status: 'Concluído' /* Exemplo de um passado */ },
];

// Função mockada para buscar agendamentos (substitua por API)
const fetchProviderAppointments = async (month?: string, year?: string): Promise<ProviderAppointment[]> => {
  console.log(`[MyScheduleScreen] Buscando todos os agendamentos (simulado) para ${month}/${year}`);
  await new Promise(resolve => setTimeout(resolve, 500));
  // Em um app real, você passaria mês/ano para a API para otimizar
  return ALL_PROVIDER_APPOINTMENTS;
};


export default function MyScheduleScreen() {
  const router = useRouter();
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]); // Data selecionada no formato YYYY-MM-DD
  const [allAppointments, setAllAppointments] = useState<ProviderAppointment[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Carrega todos os agendamentos (ou do mês atual/próximo) para marcar o calendário
    setIsLoading(true);
    fetchProviderAppointments() // TODO: Passar mês/ano para otimizar
      .then(data => {
        setAllAppointments(data);
      })
      .catch(err => {
        console.error("Erro ao buscar todos os agendamentos:", err);
        Alert.alert("Erro", "Não foi possível carregar os dados da agenda.");
      })
      .finally(() => setIsLoading(false));
  }, []);

  // Memoiza os agendamentos para a data selecionada
  const appointmentsForSelectedDate = useMemo(() => {
    return allAppointments.filter(app => app.date === selectedDate);
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
    if (marks[selectedDate]) {
      marks[selectedDate] = { ...marks[selectedDate], selected: true, selectedColor: '#007AFF', selectedTextColor: 'white' };
    } else {
      marks[selectedDate] = { selected: true, selectedColor: '#007AFF', selectedTextColor: 'white' };
    }
    return marks;
  }, [allAppointments, selectedDate]);

  const onDayPress = (day: DateData) => {
    console.log('[MyScheduleScreen] Dia selecionado:', day.dateString);
    setSelectedDate(day.dateString);
  };

  const getStatusStyle = (status: ProviderAppointment['status']) => {
    // Adapte conforme seus status reais e cores desejadas
    switch (status) {
      case 'Confirmado': return { text: '#388E3C', background: '#E8F5E9' };
      case 'ARealizar': return { text: '#007AFF', background: '#E3F2FD' };
      case 'PendenteCliente': return { text: '#FFA000', background: '#FFF3E0' };
      default: return { text: '#546E7A', background: '#ECEFF1' };
    }
  };

  const renderAppointmentItem = ({ item }: { item: ProviderAppointment }) => {
    const statusStyle = getStatusStyle(item.status);
    return (
      <TouchableOpacity 
        style={styles.appointmentCard} 
        onPress={() => router.push(`/(provider)/services/${item.id}`)} // Navega para detalhes do serviço
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
    );
  };

  return (
    <View style={styles.container}>
      <Stack.Screen 
        options={{ 
            title: 'Minha Agenda',
            headerRight: () => (
                <TouchableOpacity 
                    onPress={() => router.push('/(provider)/schedule/manage-availability')}
                    style={{ marginRight: 15 }}
                >
                    <Ionicons name="settings-outline" size={24} color="#007AFF" />
                </TouchableOpacity>
            )
        }} 
      />
      
      <Calendar
        current={selectedDate} // Data inicial do calendário
        onDayPress={onDayPress}
        markedDates={markedDates}
        monthFormat={'MMMM yyyy'}
        onMonthChange={(month) => {
          console.log('[MyScheduleScreen] Mês alterado para:', month.month, month.year);
          // TODO: Opcional - Recarregar agendamentos para o novo mês/ano visível
          // fetchProviderAppointments(month.month, month.year).then(setAllAppointments);
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
          // Você pode customizar muitas outras cores e fontes
        }}
        style={styles.calendarStyle}
      />

      <View style={styles.agendaListHeader}>
        <Text style={styles.agendaListTitle}>
            Agenda para: {selectedDate ? formatDate(selectedDate, {weekday: 'long', day: 'numeric', month: 'long'}) : "Selecione uma data"}
        </Text>
      </View>

      {isLoading && allAppointments.length === 0 ? ( // Mostra loading só na carga inicial de todos os agendamentos
        <View style={styles.centeredFeedback}><ActivityIndicator size="large" color="#007AFF" /></View>
      ) : appointmentsForSelectedDate.length > 0 ? (
        <FlatList
          data={appointmentsForSelectedDate}
          renderItem={renderAppointmentItem}
          keyExtractor={(item) => item.id}
          style={styles.listStyle}
          contentContainerStyle={styles.listContentContainer}
        />
      ) : (
        <View style={styles.centeredFeedback}>
          <Ionicons name="file-tray-outline" size={48} color="#CED4DA" />
          <Text style={styles.emptyListText}>Nenhum serviço agendado para este dia.</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F0F2F5',
  },
  calendarStyle: {
    // borderBottomWidth: 1,
    // borderBottomColor: '#e0e0e0',
    // marginBottom: 5, // Reduzido o espaço após o calendário
     ...Platform.select({ // Sombra suave para o calendário
      ios: { shadowColor: 'rgba(0,0,0,0.1)', shadowOffset: { width: 0, height: 3 }, shadowOpacity: 1, shadowRadius: 4 },
      android: { elevation: 3 },
    }),
  },
  agendaListHeader: {
    paddingHorizontal: 15,
    paddingTop: 15, // Aumentado
    paddingBottom: 10,
    backgroundColor: '#F0F2F5', // Mesma cor de fundo da tela
  },
  agendaListTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1C3A5F',
  },
  listStyle: {
    flex: 1, // Para ocupar o espaço restante
  },
  listContentContainer: {
    paddingHorizontal: 15,
    paddingBottom: 20,
  },
  appointmentCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    padding: 15,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    ...Platform.select({
      ios: { shadowColor: 'rgba(0,0,0,0.07)', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 1, shadowRadius: 3 },
      android: { elevation: 2 },
    }),
  },
  appointmentTimeContainer: {
      alignItems: 'center',
      marginRight: 15,
      paddingRight: 15,
      borderRightWidth: 1,
      borderRightColor: '#E9ECEF',
      minWidth: 70, // Para dar um bom espaço para a hora
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
  emptyListText: {
    fontSize: 16,
    color: '#6C757D',
    marginTop: 10,
    textAlign: 'center',
  },
});