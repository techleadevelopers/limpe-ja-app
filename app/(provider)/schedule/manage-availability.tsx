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
  Easing,
  AccessibilityInfo,
  ImageSourcePropType,
} from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { Calendar, LocaleConfig, DateData } from 'react-native-calendars';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { formatDate } from '../../../utils/helpers';

// ====== Design tokens (mesmos da UI padronizada) ======
const Colors = {
  primary: '#4A90E2',
  primaryDark: '#2A72E7',
  bgSoft: '#F0F7FF',
  surface: '#FFFFFF',
  border: '#E9ECEF',
  fieldBg: '#F8F9FA',
  text: '#212529',
  textMuted: '#6C757D',
  textSubtle: '#868E96',
  danger: '#D32F2F',
  shadow: 'rgba(0,0,0,0.08)',
};

const Radii = {
  xl: 20,
  pill: 25,
  md: 15,
};

const Spacing = {
  sm: 10,
  md: 15,
  lg: 20,
};

const easeOut = Easing.out(Easing.ease);

// ====== Locale PT-BR (Calendário) ======
LocaleConfig.locales['pt-br'] = {
  monthNames: [
    'Janeiro','Fevereiro','Março','Abril','Maio','Junho',
    'Julho','Agosto','Setembro','Outubro','Novembro','Dezembro'
  ],
  monthNamesShort: ['Jan.','Fev.','Mar.','Abr.','Mai.','Jun.','Jul.','Ago.','Set.','Out.','Nov.','Dez.'],
  dayNames: ['Domingo','Segunda-feira','Terça-feira','Quarta-feira','Quinta-feira','Sexta-feira','Sábado'],
  dayNamesShort: ['DOM','SEG','TER','QUA','QUI','SEX','SÁB'],
  today: 'Hoje'
};
LocaleConfig.defaultLocale = 'pt-br';

// ====== Interface local para Theme (remoção do import externo) ======
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
  textDayFontWeight?:
    | "normal" | "bold" | "100" | "200" | "300" | "400" | "500" | "600" | "700" | "800" | "900"
    | 100 | 200 | 300 | 400 | 500 | 600 | 700 | 800 | 900;
  textMonthFontWeight?:
    | "normal" | "bold" | "100" | "200" | "300" | "400" | "500" | "600" | "700" | "800" | "900"
    | 100 | 200 | 300 | 400 | 500 | 600 | 700 | 800 | 900;
  textDayHeaderFontWeight?:
    | "normal" | "bold" | "100" | "200" | "300" | "400" | "500" | "600" | "700" | "800" | "900"
    | 100 | 200 | 300 | 400 | 500 | 600 | 700 | 800 | 900;
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
    dayHeader?: { color?: string };
  };
}

// ====== ÍCONES 3D (injeção sutil, sem poluir a UI) ======
const Icons3D = {
  avatar: require('/assets/images/3d/perfil.png'),
  empty: require('/assets/images/3d/step1-card-profile.png'),
} satisfies Record<string, ImageSourcePropType>;

const Icon3D = ({ src, size = 24, style }: { src: ImageSourcePropType; size?: number; style?: any }) => (
  <Image source={src} style={[{ width: size, height: size }, style]} resizeMode="contain" />
);

// ====== Tipos e dados simulados ======
interface ProviderAppointment {
  id: string;
  clientName: string;
  clientAvatarUrl?: string;
  serviceType: string;
  startTime: string;
  endTime?: string;
  date: string;
  status: 'Confirmado' | 'PendenteCliente' | 'ARealizar' | 'Concluído' | 'Cancelado';
  addressSummary?: string;
}

const ALL_PROVIDER_APPOINTMENTS: ProviderAppointment[] = [
  { id: 'servA1', clientName: 'Fernanda Lima', clientAvatarUrl: 'https://randomuser.me/api/portraits/women/1.jpg', serviceType: 'Limpeza Padrão', startTime: '09:00', endTime: '12:00', date: new Date(Date.now() + 86400000 * 1).toISOString().split('T')[0], status: 'Confirmado', addressSummary: 'Rua das Flores, 100' },
  { id: 'servA2', clientName: 'Ricardo Alves', clientAvatarUrl: 'https://randomuser.me/api/portraits/men/2.jpg', serviceType: 'Limpeza Pesada', startTime: '14:00', endTime: '18:00', date: new Date(Date.now() + 86400000 * 1).toISOString().split('T')[0], status: 'Confirmado', addressSummary: 'Av. Brasil, 500' },
  { id: 'servA3', clientName: 'Juliana Moreira', clientAvatarUrl: 'https://randomuser.me/api/portraits/women/3.jpg', serviceType: 'Limpeza de Manutenção', startTime: '10:00', endTime: '13:00', date: new Date(Date.now() + 86400000 * 3).toISOString().split('T')[0], status: 'ARealizar', addressSummary: 'Travessa da Paz, 45' },
  { id: 'servA4', clientName: 'Marcos Andrade', clientAvatarUrl: 'https://randomuser.me/api/portraits/men/4.jpg', serviceType: 'Limpeza de Vidros', startTime: '08:00', endTime: '10:00', date: new Date(Date.now() - 86400000 * 2).toISOString().split('T')[0], status: 'Concluído', addressSummary: 'Rua do Sol, 20' },
  { id: 'servA5', clientName: 'Ana Paula', clientAvatarUrl: 'https://randomuser.me/api/portraits/women/5.jpg', serviceType: 'Limpeza Pós-Obra', startTime: '09:00', endTime: '17:00', date: new Date(Date.now() + 86400000 * 5).toISOString().split('T')[0], status: 'PendenteCliente', addressSummary: 'Praça da Liberdade, 10' },
  { id: 'servA6', clientName: 'Pedro Costa', clientAvatarUrl: 'https://randomuser.me/api/portraits/men/6.jpg', serviceType: 'Limpeza Comercial', startTime: '13:00', endTime: '17:00', date: new Date(Date.now() + 86400000 * 1).toISOString().split('T')[0], status: 'ARealizar', addressSummary: 'Av. Central, 800' },
];

const fetchProviderAppointments = async (_month?: string, _year?: string): Promise<ProviderAppointment[]> => {
  await new Promise(resolve => setTimeout(resolve, 800));
  return ALL_PROVIDER_APPOINTMENTS;
};

// ====== Item animado ======
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
      Animated.timing(fadeAnim, { toValue: 1, duration: 420, delay, easing: easeOut, useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: 0, duration: 420, delay, easing: easeOut, useNativeDriver: true }),
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
      case 'Confirmado':      return { text: '#2E7D32', background: '#E8F5E9', icon: 'check-circle' };
      case 'ARealizar':       return { text: Colors.primary, background: '#E3F2FD', icon: 'clock-time-four' };
      case 'PendenteCliente': return { text: '#FF6F00', background: '#FFF3E0', icon: 'alert-circle' };
      case 'Concluído':       return { text: '#546E7A', background: '#ECEFF1', icon: 'check-all' };
      case 'Cancelado':       return { text: Colors.danger, background: '#FFEBEE', icon: 'close-circle' };
      default:                return { text: '#546E7A', background: '#ECEFF1', icon: 'information' };
    }
  };

  const statusStyle = getStatusStyle(item.status);

  return (
    <Animated.View
      style={[
        styles.appointmentCardWrapper,
        { opacity: fadeAnim, transform: [{ translateY: slideAnim }, { scale: scaleAnim }] }
      ]}
      accessibilityRole="summary"
      accessibilityLabel={`Cliente ${item.clientName}, serviço ${item.serviceType}.`}
    >
      <TouchableOpacity
        style={styles.appointmentCard}
        onPress={() => onPress(item)}
        onPressIn={onPressInItem}
        onPressOut={onPressOutItem}
        activeOpacity={0.9}
      >
        {item.clientAvatarUrl ? (
          <Image source={{ uri: item.clientAvatarUrl }} style={styles.clientAvatar} />
        ) : (
          <View style={styles.clientAvatarPlaceholder}>
            {/* Ícone 3D no placeholder do avatar (mesma área, sem mudar layout) */}
            <Icon3D src={Icons3D.avatar} size={26} />
          </View>
        )}

        <View style={styles.appointmentDetails}>
          <Text style={styles.appointmentClientName} numberOfLines={1}>{item.clientName}</Text>
          <Text style={styles.appointmentServiceType} numberOfLines={1}>{item.serviceType}</Text>

          <View style={styles.timeAndLocation}>
            <Ionicons name="time-outline" size={14} color={Colors.textMuted} style={{ marginRight: 4 }} />
            <Text style={styles.appointmentTime}>
              {item.startTime}{item.endTime ? ` - ${item.endTime}` : ''}
            </Text>
          </View>

          {item.addressSummary && (
            <View style={styles.timeAndLocation}>
              <Ionicons name="location-outline" size={14} color={Colors.textMuted} style={{ marginRight: 4 }} />
              <Text style={styles.appointmentAddress}>{item.addressSummary}</Text>
            </View>
          )}
        </View>

        <View style={[styles.appointmentStatusBadge, { backgroundColor: statusStyle.background }]}>
          <MaterialCommunityIcons name={statusStyle.icon as any} size={14} color={statusStyle.text} />
          <Text style={[styles.appointmentStatusText, { color: statusStyle.text }]}>{item.status}</Text>
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
};

// ====== Screen ======
export default function MyScheduleScreen() {
  const router = useRouter();
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [allAppointments, setAllAppointments] = useState<ProviderAppointment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const headerAnim = useRef(new Animated.Value(0)).current;
  const calendarAnim = useRef(new Animated.Value(0)).current;
  const agendaHeaderAnim = useRef(new Animated.Value(0)).current;
  const feedbackAnim = useRef(new Animated.Value(0)).current;

  const loadAppointments = async () => {
    try {
      setIsLoading(true);
      const data = await fetchProviderAppointments();
      setAllAppointments(data);
      Animated.stagger(140, [
        Animated.timing(calendarAnim, { toValue: 1, duration: 560, easing: easeOut, useNativeDriver: true }),
        Animated.timing(agendaHeaderAnim, { toValue: 1, duration: 560, easing: easeOut, useNativeDriver: true }),
        Animated.timing(feedbackAnim, { toValue: 1, duration: 420, easing: easeOut, useNativeDriver: true }),
      ]).start();
    } catch (err) {
      console.error('[MyScheduleScreen] Erro ao buscar agendamentos:', err);
      Alert.alert('Erro', 'Não foi possível carregar os dados da agenda.');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    Animated.timing(headerAnim, { toValue: 1, duration: 520, easing: easeOut, useNativeDriver: true }).start();
    loadAppointments();
  }, [headerAnim]);

  const onRefresh = () => {
    setIsRefreshing(true);
    loadAppointments();
  };

  const appointmentsForSelectedDate = useMemo(() => {
    return allAppointments
      .filter(app => app.date === selectedDate)
      .sort((a, b) => a.startTime.localeCompare(b.startTime));
  }, [allAppointments, selectedDate]);

  const markedDates = useMemo(() => {
    const marks: Record<string, any> = {};
    allAppointments.forEach(app => {
      const hasConfirmed = allAppointments.some(a => a.date === app.date && a.status === 'Confirmado');
      const hasPending = allAppointments.some(a => a.date === app.date && a.status === 'PendenteCliente');
      const hasUpcoming = allAppointments.some(a => a.date === app.date && a.status === 'ARealizar');

      let dotColor = Colors.primary;
      if (hasPending) dotColor = '#FF6F00';
      else if (hasConfirmed || hasUpcoming) dotColor = '#2E7D32';

      marks[app.date] = { marked: true, dotColor };
    });

    const currentMark = marks[selectedDate] || {};
    marks[selectedDate] = {
      ...currentMark,
      selected: true,
      selectedColor: Colors.primary,
      selectedTextColor: '#FFFFFF',
      marked: currentMark.marked || false,
      dotColor: currentMark.dotColor || Colors.primary,
    };
    return marks;
  }, [allAppointments, selectedDate]);

  const onDayPress = (day: DateData) => {
    setSelectedDate(day.dateString);
    AccessibilityInfo.announceForAccessibility?.(`Data selecionada ${formatDate(day.dateString, { weekday: 'long', day: 'numeric', month: 'long' })}`);
  };

  const handleAppointmentPress = (item: ProviderAppointment) => {
    // mantém a navegação atual
    router.push(`/(provider)/services/${item.id}` as any);
  };

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />

      <Animated.View
        style={[
          styles.customHeader,
          { opacity: headerAnim, transform: [{ translateY: headerAnim.interpolate({ inputRange: [0, 1], outputRange: [-20, 0] }) }] }
        ]}
      >
        <Text style={styles.headerTitle}>Minha Agenda</Text>
        <TouchableOpacity
          onPress={() => router.push('/(provider)/schedule/manage-availability' as any)}
          style={styles.headerActionIcon}
          accessibilityRole="button"
          accessibilityLabel="Gerenciar disponibilidade"
        >
          <Ionicons name="options-outline" size={22} color="#FFFFFF" />
          <Text style={styles.headerActionText}>Disponibilidade</Text>
        </TouchableOpacity>
      </Animated.View>

      <Animated.View
        style={[
          styles.calendarContainer,
          { opacity: calendarAnim, transform: [{ translateY: calendarAnim.interpolate({ inputRange: [0, 1], outputRange: [20, 0] }) }] }
        ]}
      >
        <Calendar
          current={selectedDate}
          onDayPress={onDayPress}
          markedDates={markedDates}
          monthFormat={'MMMM yyyy'} // pt-BR via LocaleConfig
          onMonthChange={(month) => {
            // manter log; futura integração para fetch por mês
            console.log('[MyScheduleScreen] Mês alterado para:', month.month, month.year);
          }}
          firstDay={1}
          enableSwipeMonths
          theme={({
            backgroundColor: Colors.bgSoft,
            calendarBackground: Colors.surface,
            textSectionTitleColor: '#586069',
            selectedDayBackgroundColor: Colors.primary,
            selectedDayTextColor: '#FFFFFF',
            todayTextColor: Colors.primary,
            dayTextColor: '#2d4150',
            textDisabledColor: '#d9e1e8',
            dotColor: Colors.primary,
            selectedDotColor: '#FFFFFF',
            arrowColor: Colors.primary,
            monthTextColor: '#1C3A5F',
            indicatorColor: Colors.primary,
            textDayFontWeight: '400',
            textMonthFontWeight: 'bold',
            textDayHeaderFontWeight: '500',
            textDayFontSize: 15,
            textMonthFontSize: 18,
            textDayHeaderFontSize: 13,
            'stylesheet.calendar.header': {
              week: {
                marginTop: 6,
                flexDirection: 'row',
                justifyContent: 'space-around',
                borderBottomWidth: 1,
                borderBottomColor: Colors.border,
                paddingBottom: 6,
              },
            },
          }) as Theme}
          style={styles.calendarStyle}
        />
      </Animated.View>

      <Animated.View
        style={[
          styles.agendaListHeader,
          { opacity: agendaHeaderAnim, transform: [{ translateY: agendaHeaderAnim.interpolate({ inputRange: [0, 1], outputRange: [20, 0] }) }] }
        ]}
      >
        <Text style={styles.agendaListTitle}>
          Agenda para: {selectedDate ? formatDate(selectedDate, { weekday: 'long', day: 'numeric', month: 'long' }) : 'Selecione uma data'}
        </Text>
      </Animated.View>

      {isLoading && allAppointments.length === 0 ? (
        <Animated.View style={[styles.centeredFeedback, { opacity: feedbackAnim }]}>
          <ActivityIndicator size="large" color={Colors.primary} />
          <Text style={styles.loadingText}>Carregando sua agenda...</Text>
        </Animated.View>
      ) : appointmentsForSelectedDate.length > 0 ? (
        <FlatList
          data={appointmentsForSelectedDate}
          renderItem={({ item, index }) => (
            <AnimatedAppointmentItem item={item} onPress={handleAppointmentPress} delay={index * 70} />
          )}
          keyExtractor={(item) => item.id}
          style={styles.listStyle}
          contentContainerStyle={styles.listContentContainer}
          ItemSeparatorComponent={() => <View style={styles.listSeparator} />}
          refreshControl={
            <RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} tintColor={Colors.primary} colors={[Colors.primary]} />
          }
        />
      ) : (
        <Animated.View style={[styles.centeredFeedback, { opacity: feedbackAnim }]}>
          {/* Substituição sutil: ícone 3D no vazio (mesmo tamanho ~64) */}
          <Icon3D src={Icons3D.empty} size={64} />
          <Text style={styles.emptyListText}>Nenhum serviço agendado para este dia.</Text>
          <Text style={styles.emptyListSubText}>
            Aproveite para gerenciar sua disponibilidade ou confira outros dias!
          </Text>
          <TouchableOpacity
            style={styles.manageAvailabilityButton}
            onPress={() => router.push('/(provider)/schedule/manage-availability' as any)}
            accessibilityRole="button"
            accessibilityLabel="Ir para Gerenciar Disponibilidade"
          >
            <Text style={styles.manageAvailabilityButtonText}>Gerenciar Disponibilidade</Text>
            <Ionicons name="arrow-forward" size={18} color="#FFFFFF" style={{ marginLeft: 8 }} />
          </TouchableOpacity>
        </Animated.View>
      )}
    </View>
  );
}

// ====== Styles ======
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.bgSoft,
  },
  customHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.primary,
    paddingHorizontal: 15,
    paddingVertical: Platform.OS === 'ios' ? 50 : 20,
    paddingTop: Platform.OS === 'ios' ? 50 : 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 8,
    borderBottomLeftRadius: Radii.xl,
    borderBottomRightRadius: Radii.xl,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#FFFFFF',
    flex: 1,
    textAlign: 'left',
    marginLeft: 10,
  },
  headerActionIcon: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.18)',
    borderRadius: Radii.pill,
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  headerActionText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 6,
  },
  calendarContainer: {
    backgroundColor: Colors.surface,
    marginHorizontal: 15,
    marginTop: -25,
    borderRadius: Radii.md,
    overflow: 'hidden',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.1,
        shadowRadius: 10,
      },
      android: { elevation: 6 },
    }),
  },
  calendarStyle: {
    borderRadius: Radii.md,
  },
  agendaListHeader: {
    paddingHorizontal: 15,
    paddingTop: 20,
    paddingBottom: 15,
    backgroundColor: Colors.bgSoft,
  },
  agendaListTitle: {
    fontSize: 19,
    fontWeight: 'bold',
    color: '#1C3A5F',
    textTransform: 'capitalize',
  },
  listStyle: { flex: 1 },
  listContentContainer: {
    paddingHorizontal: 15,
    paddingBottom: 20,
  },
  appointmentCardWrapper: {
    marginVertical: 8,
    borderRadius: Radii.md,
    backgroundColor: Colors.surface,
    overflow: Platform.OS === 'ios' ? 'visible' : 'hidden',
    ...Platform.select({
      ios: {
        shadowColor: Colors.shadow,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.4,
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
  clientAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    marginRight: 15,
    borderWidth: 2,
    borderColor: Colors.primary,
  },
  clientAvatarPlaceholder: {
    width: 50,
    height: 50,
    borderRadius: 25,
    marginRight: 15,
    backgroundColor: '#B0C4DE',
    justifyContent: 'center',
    alignItems: 'center',
  },
  appointmentDetails: { flex: 1 },
  appointmentClientName: {
    fontSize: 17,
    fontWeight: '700',
    color: Colors.text,
    marginBottom: 4,
  },
  appointmentServiceType: {
    fontSize: 15,
    fontWeight: '500',
    color: '#495057',
    marginBottom: 4,
  },
  timeAndLocation: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 2,
  },
  appointmentTime: { fontSize: 13, color: Colors.textMuted },
  appointmentAddress: { fontSize: 13, color: Colors.textMuted },
  appointmentStatusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 15,
    marginLeft: 15,
  },
  appointmentStatusText: {
    fontSize: 12,
    fontWeight: 'bold',
    textTransform: 'uppercase',
    marginLeft: 5,
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
    color: Colors.textMuted,
    marginTop: 12,
    fontWeight: '500',
    textAlign: 'center',
  },
  emptyListText: {
    fontSize: 16,
    color: Colors.textMuted,
    marginTop: 15,
    textAlign: 'center',
    fontWeight: '600',
  },
  emptyListSubText: {
    fontSize: 15,
    color: Colors.textSubtle,
    marginTop: 8,
    textAlign: 'center',
  },
  manageAvailabilityButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.primary,
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 30,
    marginTop: 22,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  manageAvailabilityButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  listSeparator: { height: 0 },
});
