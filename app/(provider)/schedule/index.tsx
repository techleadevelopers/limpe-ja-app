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
  Animated,
  Alert,
  RefreshControl,
  Image,
  Easing,
  AccessibilityInfo, // Importar AccessibilityInfo
} from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { PROVIDER_ROUTES } from '../../../constants/routes';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Calendar, LocaleConfig, DateData } from 'react-native-calendars';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { showOverlay } from '../../../hooks/useOverlayMessage';
import * as Haptics from 'expo-haptics'; // Adicionado para iOS premium feedback
import { formatDate } from '../../../utils/helpers';

// ====== Design tokens (mesmos da UI padronizada - Premium iOS) ======
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
  shadow: 'rgba(0,0,0,0.08)', // Sutil para iOS
};

const Radii = {
  xl: 24, // Mais arredondado para iOS clean
  pill: 28,
  md: 16,
};

const Spacing = {
  sm: 12, // Aumentado para conforto
  md: 18,
  lg: 24,
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

// ====== Tema do Calendário (objeto estático para corrigir TS(2560)) ======
const calendarTheme: Partial<Theme> = {
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
  textDayFontSize: 16, // Maior para iOS
  textMonthFontSize: 19,
  textDayHeaderFontSize: 13,
  'stylesheet.calendar.header': {
    week: {
      marginTop: 8, // Mais espaço iOS
      flexDirection: 'row',
      justifyContent: 'space-around',
      borderBottomWidth: 1,
      borderBottomColor: Colors.border,
      paddingBottom: 8,
    },
  },
};

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

// Hook para verificar se o movimento reduzido está ativado
function useReducedMotion() {
  const [isReducedMotionEnabled, setIsReducedMotionEnabled] = useState(false);

  useEffect(() => {
    const updateReducedMotion = async () => {
      const enabled = await AccessibilityInfo.isReduceMotionEnabled();
      setIsReducedMotionEnabled(enabled);
    };

    updateReducedMotion();

    const subscription = AccessibilityInfo.addEventListener(
      'reduceMotionChanged',
      setIsReducedMotionEnabled
    );

    return () => subscription.remove();
  }, []);

  return isReducedMotionEnabled;
}

// ====== Item animado ======
const AnimatedAppointmentItem: React.FC<{
  item: ProviderAppointment;
  onPress: (item: ProviderAppointment) => void;
  delay: number;
  isReducedMotionEnabled: boolean; // Adicionar prop
}> = ({ item, onPress, delay, isReducedMotionEnabled }) => {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(20)).current;
  const scaleAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    const animationDuration = isReducedMotionEnabled ? 0 : 500; // Suave para iOS
    const animationDelay = isReducedMotionEnabled ? 0 : delay;

    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: animationDuration, delay: animationDelay, easing: easeOut, useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: 0, duration: animationDuration, delay: animationDelay, easing: easeOut, useNativeDriver: true }),
    ]).start();
  }, [fadeAnim, slideAnim, delay, isReducedMotionEnabled]);

  const onPressInItem = () => {
    if (!isReducedMotionEnabled) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); // iOS premium haptic
      Animated.spring(scaleAnim, { toValue: 0.97, useNativeDriver: true, tension: 200 }).start();
    }
  };

  const onPressOutItem = () => {
    if (!isReducedMotionEnabled) {
      Animated.spring(scaleAnim, { toValue: 1, friction: 4, tension: 50, useNativeDriver: true }).start();
    }
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
      accessibilityLabel={`Agendamento para ${item.clientName}, serviço ${item.serviceType} às ${item.startTime}. Status: ${item.status}. Endereço: ${item.addressSummary || 'Não informado'}.`}
    >
      <TouchableOpacity
        style={styles.appointmentCard}
        onPress={() => onPress(item)}
        onPressIn={onPressInItem}
        onPressOut={onPressOutItem}
        activeOpacity={0.92} // Suave iOS
        accessibilityRole="button"
        accessibilityHint="Abrir detalhes do agendamento"
      >
        {item.clientAvatarUrl ? (
          <Image source={{ uri: item.clientAvatarUrl }} style={styles.clientAvatar} accessibilityLabel={`Foto de perfil de ${item.clientName}`} />
        ) : (
          <View style={styles.clientAvatarPlaceholder} accessibilityLabel={`Avatar padrão para ${item.clientName}`}>
            <Ionicons name="person" size={24} color="#FFF" />
          </View>
        )}

        <View style={styles.appointmentDetails}>
          <Text style={styles.appointmentClientName} numberOfLines={1}>{item.clientName}</Text>
          <Text style={styles.appointmentServiceType} numberOfLines={1}>{item.serviceType}</Text>

          <View style={styles.timeAndLocation}>
            <Ionicons name="time-outline" size={14} color={Colors.textMuted} style={{ marginRight: 6 }} accessibilityHidden={true} />
            <Text style={styles.appointmentTime}>
              {item.startTime}{item.endTime ? ` - ${item.endTime}` : ''}
            </Text>
          </View>

          {item.addressSummary && (
            <View style={styles.timeAndLocation}>
              <Ionicons name="location-outline" size={14} color={Colors.textMuted} style={{ marginRight: 6 }} accessibilityHidden={true} />
              <Text style={styles.appointmentAddress}>{item.addressSummary}</Text>
            </View>
          )}
        </View>

        <View style={[styles.appointmentStatusBadge, { backgroundColor: statusStyle.background }]}>
          <MaterialCommunityIcons name={statusStyle.icon as any} size={14} color={statusStyle.text} accessibilityHidden={true} />
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

  const isReducedMotionEnabled = useReducedMotion(); // Usar o hook de movimento reduzido

  const headerAnim = useRef(new Animated.Value(0)).current;
  const calendarAnim = useRef(new Animated.Value(0)).current;
  const agendaHeaderAnim = useRef(new Animated.Value(0)).current;
  const feedbackAnim = useRef(new Animated.Value(0)).current;

  // Coach (manual prático) – guia leve para 30–70 anos
  const [coachVisible, setCoachVisible] = useState(false);
  const [coachStep, setCoachStep] = useState<1 | 2 | 3 | 4>(1);
  const [coachDontShow, setCoachDontShow] = useState(false);

  // Quick Availability step
  const [qaVisible, setQaVisible] = useState(false);
  const [qaStep, setQaStep] = useState<1 | 2 | 3>(1);
  const [qaWhen, setQaWhen] = useState<'today' | 'tomorrow' | 'week'>('today');
  const [qaPreset, setQaPreset] = useState<'morning' | 'afternoon' | 'fullday' | 'off'>('morning');

  // Respond Request step
  const [rrVisible, setRrVisible] = useState(false);
  const [rrItem, setRrItem] = useState<ProviderAppointment | null>(null);

  const loadAppointments = async () => {
    try {
      setIsLoading(true);
      const data = await fetchProviderAppointments();
      setAllAppointments(data);

      const animationDuration = isReducedMotionEnabled ? 0 : 160; // Suave iOS
      const staggerDelay = isReducedMotionEnabled ? 0 : 60; // Sequência mais natural (60ms)

      Animated.stagger(staggerDelay, [
        Animated.timing(calendarAnim, { toValue: 1, duration: animationDuration, easing: easeOut, useNativeDriver: true }),
        Animated.timing(agendaHeaderAnim, { toValue: 1, duration: animationDuration, easing: easeOut, useNativeDriver: true }),
        Animated.timing(feedbackAnim, { toValue: 1, duration: animationDuration, easing: easeOut, useNativeDriver: true }),
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
    const animationDuration = isReducedMotionEnabled ? 0 : 600; // Confortável iOS
    Animated.timing(headerAnim, { toValue: 1, duration: animationDuration, easing: easeOut, useNativeDriver: true }).start();
    loadAppointments();
    // Exibir guia na primeira visita
    (async () => {
      try {
        const seen = await AsyncStorage.getItem('provider_schedule_coach_v1');
        if (!seen) {
          setCoachVisible(true);
          setCoachStep(1);
          AccessibilityInfo.announceForAccessibility('Bem-vindo! Toque em continuar para aprender a editar seus horários.');
        }
      } catch {}
    })();
  }, [headerAnim, isReducedMotionEnabled]);

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
      ...currentMark, // Spread correto para fusão
      selected: true,
      selectedColor: Colors.primary,
      selectedTextColor: '#FFFFFF',
      marked: currentMark.marked || false,
      dotColor: currentMark.dotColor || Colors.primary,
    };
    return marks;
  }, [allAppointments, selectedDate]);

  const onDayPress = (day: DateData) => {
    const todayStr = new Date().toISOString().split('T')[0];
    if (day.dateString < todayStr) {
      // Ignora seleção de datas passadas (mensagem mais empática)
      AccessibilityInfo.announceForAccessibility('Escolha uma data de hoje pra frente, tá bom?');
      return;
    }
    setSelectedDate(day.dateString);
    // Aprimorar a acessibilidade para leitores de tela
    const appointmentsCount = allAppointments.filter(app => app.date === day.dateString).length;
    let announcement = `Data selecionada ${formatDate(day.dateString, { weekday: 'long', day: 'numeric', month: 'long' })}`;
    if (appointmentsCount > 0) {
      announcement += `. ${appointmentsCount} agendamento${appointmentsCount > 1 ? 's' : ''} para este dia.`;
    } else {
      announcement += `. Nenhum agendamento para este dia.`;
    }
    AccessibilityInfo.announceForAccessibility(announcement); // Fallback sem ? para compatibilidade
  };

  const handleAppointmentPress = (item: ProviderAppointment) => {
    if (item.status === 'PendenteCliente') {
      setRrItem(item);
      setRrVisible(true);
      if (Platform.OS === 'ios') Haptics.selectionAsync();
      return;
    }
    router.push(`/(provider)/services/${item.id}` as any);
  };

  const confirmQuickAvailability = () => {
    let presetParam = '';
    if (qaWhen === 'week') {
      presetParam = 'repeat-week';
    } else if (qaPreset === 'off' && qaWhen === 'today') {
      presetParam = 'block-today';
    } else if (qaWhen === 'today') {
      presetParam = `today-${qaPreset}`; // today-morning | today-afternoon | today-fullday
    } else if (qaWhen === 'tomorrow') {
      presetParam = `tomorrow-${qaPreset}`; // tomorrow-afternoon etc.
    }
    setQaVisible(false);
    if (presetParam) {
      showOverlay({ title: 'Aplicando disponibilidade', variant: 'info' });
      if (Platform.OS === 'ios') Haptics.selectionAsync();
      router.push(`${PROVIDER_ROUTES.MANAGE_AVAILABILITY}?preset=${presetParam}` as any);
    }
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
          onPress={() => router.push(PROVIDER_ROUTES.MANAGE_AVAILABILITY as any)}
          style={styles.headerActionIcon}
          accessibilityRole="button"
          accessibilityLabel="Gerenciar disponibilidade"
          accessibilityHint="Navegar para tela de gerenciamento de horários"
        >
          <Ionicons name="options-outline" size={22} color="#FFFFFF" accessibilityHidden={true} />
          <Text style={styles.headerActionText}>Disponibilidade</Text>
        </TouchableOpacity>
      </Animated.View>

      {/* Quick Availability launcher */}
      <View style={{ paddingHorizontal: 18, marginTop: 10 }}>
        <TouchableOpacity
          style={styles.quickCTAButton}
          onPress={() => { setQaStep(1); setQaVisible(true); if (Platform.OS==='ios') Haptics.selectionAsync(); }}
          accessibilityRole="button"
          accessibilityLabel="Ajuda para montar meus horários"
        >
          <Ionicons name="flash-outline" size={18} color="#fff" style={{ marginRight: 8 }} />
          <Text style={styles.quickCTAButtonText}>Ajuda para montar meus horários</Text>
        </TouchableOpacity>
      </View>

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
          minDate={new Date().toISOString().split('T')[0]}
          onMonthChange={(month) => {
            // manter log; futura integração para fetch por mês
            console.log('[MyScheduleScreen] Mês alterado para:', month.month, month.year);
            AccessibilityInfo.announceForAccessibility(`Mês alterado para ${LocaleConfig.locales['pt-br'].monthNames[month.month - 1]} de ${month.year}`);
          }}
          firstDay={1}
          enableSwipeMonths
          theme={calendarTheme} // Objeto estático (corrige TS(2560))
          style={styles.calendarStyle}
          accessibilityLabel="Calendário de agendamentos"
          accessibilityHint="Selecione uma data para ver agendamentos"
        />
      </Animated.View>

      <Animated.View
        style={[
          styles.agendaListHeader,
          { opacity: agendaHeaderAnim, transform: [{ translateY: agendaHeaderAnim.interpolate({ inputRange: [0, 1], outputRange: [20, 0] }) }] }
        ]}
      >
        <Text style={styles.agendaListTitle} accessibilityLabel={`Agenda para: ${selectedDate ? formatDate(selectedDate, { weekday: 'long', day: 'numeric', month: 'long' }) : 'Selecione uma data'}`}>
          Agenda para: {selectedDate ? formatDate(selectedDate, { weekday: 'long', day: 'numeric', month: 'long' }) : 'Selecione uma data'}
        </Text>
      </Animated.View>

      {isLoading && allAppointments.length === 0 ? (
        <Animated.View style={[styles.centeredFeedback, { opacity: feedbackAnim }]}>
          <ActivityIndicator size="large" color={Colors.primary} accessibilityLabel="Carregando sua agenda" />
          <Text style={styles.loadingText}>Carregando sua agenda...</Text>
        </Animated.View>
      ) : appointmentsForSelectedDate.length > 0 ? (
        <FlatList
          data={appointmentsForSelectedDate}
          renderItem={({ item, index }) => (
            <AnimatedAppointmentItem item={item} onPress={handleAppointmentPress} delay={index * 60} isReducedMotionEnabled={isReducedMotionEnabled} /> // Delay suave (60ms)
          )}
          keyExtractor={(item) => item.id}
          style={styles.listStyle}
          contentContainerStyle={styles.listContentContainer}
          ItemSeparatorComponent={() => <View style={styles.listSeparator} />}
          refreshControl={
            <RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} tintColor={Colors.primary} colors={[Colors.primary]} accessibilityLabel="Atualizar lista de agendamentos" />
          }
          accessibilityLabel="Lista de agendamentos para o dia selecionado"
        />
      ) : (
        <Animated.View style={[styles.centeredFeedback, { opacity: feedbackAnim }]}>
          <Ionicons name="calendar-outline" size={68} color="#CED4DA" accessibilityHidden={true} />
          <Text style={styles.emptyListText}>Nenhum serviço agendado para este dia.</Text>
          <Text style={styles.emptyListSubText}>
            Aproveite para gerenciar sua disponibilidade ou confira outros dias!
          </Text>
          <TouchableOpacity
            style={styles.manageAvailabilityButton}
            onPress={() => router.push(PROVIDER_ROUTES.MANAGE_AVAILABILITY as any)}
            accessibilityRole="button"
            accessibilityLabel="Ir para Gerenciar Disponibilidade"
            accessibilityHint="Navegar para tela de gerenciamento de horários disponíveis"
          >
            <Text style={styles.manageAvailabilityButtonText}>Gerenciar Disponibilidade</Text>
            <Ionicons name="arrow-forward" size={20} color="#FFFFFF" style={{ marginLeft: 10 }} accessibilityHidden={true} />
          </TouchableOpacity>
        </Animated.View>
      )}
      {/* Quick Availability Modal */}
      {qaVisible && (
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Disponibilidade rápida</Text>
            <Text style={styles.stepSubtitle}>Passo {qaStep} de 3</Text>

            {qaStep === 1 && (
              <View>
                <Text style={styles.stepTitle}>Para quando?</Text>
                <View style={styles.modalChipsRow}>
                  <TouchableOpacity style={[styles.modalChip, qaWhen==='today' && styles.modalChipActive]} onPress={() => setQaWhen('today')}><Text style={[styles.modalChipText, qaWhen==='today' && styles.modalChipTextActive]}>Hoje</Text></TouchableOpacity>
                  <TouchableOpacity style={[styles.modalChip, qaWhen==='tomorrow' && styles.modalChipActive]} onPress={() => setQaWhen('tomorrow')}><Text style={[styles.modalChipText, qaWhen==='tomorrow' && styles.modalChipTextActive]}>Amanhã</Text></TouchableOpacity>
                  <TouchableOpacity style={[styles.modalChip, qaWhen==='week' && styles.modalChipActive]} onPress={() => setQaWhen('week')}><Text style={[styles.modalChipText, qaWhen==='week' && styles.modalChipTextActive]}>Esta semana</Text></TouchableOpacity>
                </View>
                <View style={styles.modalActions}>
                  <TouchableOpacity style={[styles.modalButton, styles.modalConfirm]} onPress={() => setQaStep(2)}>
                    <Text style={[styles.modalButtonText, styles.modalConfirmText]}>Continuar</Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}

            {qaStep === 2 && (
              <View>
                <Text style={styles.stepTitle}>Qual horário?</Text>
                <View style={styles.modalChipsRow}>
                  <TouchableOpacity style={[styles.modalChip, qaPreset==='morning' && styles.modalChipActive]} onPress={() => setQaPreset('morning')}>
                    <Ionicons name="sunny-outline" size={16} color={qaPreset==='morning' ? '#fff' : Colors.text} style={{ marginRight: 6 }} />
                    <Text style={[styles.modalChipText, qaPreset==='morning' && styles.modalChipTextActive]}>Manhã (08–12)</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={[styles.modalChip, qaPreset==='afternoon' && styles.modalChipActive]} onPress={() => setQaPreset('afternoon')}>
                    <Ionicons name="partly-sunny-outline" size={16} color={qaPreset==='afternoon' ? '#fff' : Colors.text} style={{ marginRight: 6 }} />
                    <Text style={[styles.modalChipText, qaPreset==='afternoon' && styles.modalChipTextActive]}>Tarde (13–17)</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={[styles.modalChip, qaPreset==='fullday' && styles.modalChipActive]} onPress={() => setQaPreset('fullday')}>
                    <Ionicons name="time-outline" size={16} color={qaPreset==='fullday' ? '#fff' : Colors.text} style={{ marginRight: 6 }} />
                    <Text style={[styles.modalChipText, qaPreset==='fullday' && styles.modalChipTextActive]}>Dia todo (08–18)</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={[styles.modalChip, qaPreset==='off' && styles.modalChipActive]} onPress={() => setQaPreset('off')}>
                    <Ionicons name="moon-outline" size={16} color={qaPreset==='off' ? '#fff' : Colors.text} style={{ marginRight: 6 }} />
                    <Text style={[styles.modalChipText, qaPreset==='off' && styles.modalChipTextActive]}>Folga</Text>
                  </TouchableOpacity>
                </View>
                <View style={styles.modalActions}>
                  <TouchableOpacity style={[styles.modalButton, styles.modalCancel]} onPress={() => setQaStep(1)}><Text style={styles.modalButtonText}>Voltar</Text></TouchableOpacity>
                  <TouchableOpacity style={[styles.modalButton, styles.modalConfirm]} onPress={() => setQaStep(3)}><Text style={[styles.modalButtonText, styles.modalConfirmText]}>Continuar</Text></TouchableOpacity>
                </View>
              </View>
            )}

            {qaStep === 3 && (
              <View>
                <Text style={styles.stepTitle}>Confirmar</Text>
                <View style={styles.summaryCard}>
                  <Ionicons name="checkmark-circle-outline" size={20} color={Colors.primary} style={{ marginRight: 8 }} />
                  <Text style={{ flex: 1, color: Colors.text }}>
                    {(qaWhen==='today' ? 'Hoje' : qaWhen==='tomorrow' ? 'Amanhã' : 'Esta semana')} • {(qaPreset==='morning' ? '08–12' : qaPreset==='afternoon' ? '13–17' : qaPreset==='fullday' ? '08–18' : 'Folga')}
                  </Text>
                </View>
                <View style={styles.modalActions}>
                  <TouchableOpacity style={[styles.modalButton, styles.modalCancel]} onPress={() => setQaStep(2)}><Text style={styles.modalButtonText}>Voltar</Text></TouchableOpacity>
                  <TouchableOpacity style={[styles.modalButton, styles.modalConfirm]} onPress={confirmQuickAvailability}><Text style={[styles.modalButtonText, styles.modalConfirmText]}>Aplicar</Text></TouchableOpacity>
                </View>
              </View>
            )}
          </View>
        </View>
      )}

      {/* Responder Pedido Modal */}
      {rrVisible && rrItem && (
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Responder pedido</Text>
            <View style={styles.summaryCard}>
              <Ionicons name="person-circle-outline" size={20} color={Colors.primary} style={{ marginRight: 8 }} />
              <Text style={{ flex: 1, color: Colors.text }}>
                {rrItem.clientName} • {rrItem.serviceType}{formatDate(rrItem.date, { weekday: 'long', day: 'numeric', month: 'long' })} • {rrItem.startTime}{rrItem.endTime?`–${rrItem.endTime}`:''}
              </Text>
            </View>
            <View style={styles.modalActions}>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalConfirm]}
                onPress={() => {
                  setAllAppointments(prev => prev.map(a => a.id===rrItem.id ? { ...a, status: 'Confirmado' } : a));
                  setRrVisible(false);
                  showOverlay({ title: 'Pedido aceito', variant: 'success' });
                  if (Platform.OS==='ios') Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                }}
              >
                <Text style={[styles.modalButtonText, styles.modalConfirmText]}>Aceitar</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalCancel]}
                onPress={() => {
                  setRrVisible(false);
                  // Sugerir: abrir disponibilidade com sugestão padrão
                  router.push(`${PROVIDER_ROUTES.MANAGE_AVAILABILITY}?preset=tomorrow-afternoon` as any);
                  showOverlay({ title: 'Sugira um novo horário', variant: 'info' });
                  if (Platform.OS==='ios') Haptics.selectionAsync();
                }}
              >
                <Text style={styles.modalButtonText}>Sugerir outro horário</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalCancel]}
                onPress={() => {
                  setAllAppointments(prev => prev.map(a => a.id===rrItem.id ? { ...a, status: 'Cancelado' } : a));
                  setRrVisible(false);
                  showOverlay({ title: 'Pedido recusado', variant: 'warning' });
                }}
              >
                <Text style={styles.modalButtonText}>Recusar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      )}

      {/* Botão discreto para reabrir o guia (não atrapalha a visão) */}
      {!qaVisible && !rrVisible && !coachVisible && (
        <TouchableOpacity
          style={styles.coachFab}
          accessibilityRole="button"
          accessibilityLabel="Abrir guia rápido"
          onPress={() => {
            setCoachStep(1);
            setCoachVisible(true);
            if (Platform.OS === 'ios') Haptics.selectionAsync();
            AccessibilityInfo.announceForAccessibility('Guia rápido aberto.');
          }}
        >
          <Ionicons name="help-circle-outline" size={22} color={Colors.primary} />
        </TouchableOpacity>
      )}

      {/* Coach Overlay: manual prático (primeiro acesso) */}
      {coachVisible && !qaVisible && !rrVisible && (
        <View style={styles.coachOverlay} accessible accessibilityViewIsModal>
          <View style={styles.coachCard}>
            {coachStep === 1 && (
              <>
                <Text style={styles.coachTitle}>Bem-vindo à sua agenda</Text>
                <Text style={styles.coachText}>
                  Toque no calendário para escolher o dia. Você só edita hoje ou datas futuras.
                </Text>
              </>
            )}
            {coachStep === 2 && (
              <>
                <Text style={styles.coachTitle}>Horários prontos</Text>
                <Text style={styles.coachText}>
                  Use “Ajuda para montar meus horários” para aplicar manhã, tarde ou dia todo e repetir em outros dias.
                </Text>
              </>
            )}
            {coachStep === 3 && (
              <>
                <Text style={styles.coachTitle}>Editar com detalhes</Text>
                <Text style={styles.coachText}>
                  Precisa ajustar finamente? Toque em “Disponibilidade” no topo para abrir a tela de edição.
                </Text>
              </>
            )}
            {coachStep === 4 && (
              <>
                <Text style={styles.coachTitle}>Pronto!</Text>
                <Text style={styles.coachText}>
                  Quando terminar, seus clientes já verão seus horários. Você pode desfazer alterações depois.
                </Text>
              </>
            )}

            <View style={styles.coachCheckboxRow}>
              <TouchableOpacity
                onPress={() => setCoachDontShow(prev => !prev)}
                accessibilityRole="checkbox"
                accessibilityState={{ checked: coachDontShow }}
              >
                <Text style={styles.coachCheckboxText}>{coachDontShow ? '☑ ' : '☐ '}Não mostrar novamente</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.coachActions}>
              {coachStep > 1 ? (
                <TouchableOpacity
                  style={[styles.coachButton, styles.coachSecondaryButton]}
                  onPress={() => { setCoachStep((s) => (s > 1 ? ((s - 1) as any) : s)); if (Platform.OS==='ios') Haptics.selectionAsync(); }}
                  accessibilityRole="button"
                >
                  <Text style={styles.coachSecondaryText}>Voltar</Text>
                </TouchableOpacity>
              ) : (
                <View />
              )}
              {coachStep < 4 ? (
                <TouchableOpacity
                  style={styles.coachButton}
                  onPress={() => { setCoachStep((s) => ((s + 1) as any)); AccessibilityInfo.announceForAccessibility('Continuar'); if (Platform.OS==='ios') Haptics.selectionAsync(); }}
                  accessibilityRole="button"
                >
                  <Text style={styles.coachButtonText}>Continuar</Text>
                </TouchableOpacity>
              ) : (
                <TouchableOpacity
                  style={styles.coachButton}
                  onPress={async () => {
                    if (coachDontShow) { try { await AsyncStorage.setItem('provider_schedule_coach_v1', '1'); } catch {} }
                    setCoachVisible(false);
                    AccessibilityInfo.announceForAccessibility('Guia concluído.');
                  }}
                  accessibilityRole="button"
                >
                  <Text style={styles.coachButtonText}>Começar</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        </View>
      )}
    </View>
  );
}

// ====== Styles (Premium iOS Clean e Confortável) ======
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
    paddingHorizontal: 18,
    paddingVertical: Platform.OS === 'ios' ? 55 : 20,
    paddingTop: Platform.OS === 'ios' ? 55 : 20,
    // iOS Premium Shadow (sutil)
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.15,
        shadowRadius: 12,
      },
      android: { elevation: 10 },
    }),
    borderBottomLeftRadius: Radii.xl,
    borderBottomRightRadius: Radii.xl,
  },
  headerTitle: {
    fontSize: 24, // Maior para iOS
    fontWeight: '600',
    color: '#FFFFFF',
    flex: 1,
    textAlign: 'left',
    marginLeft: 12,
    fontFamily: Platform.OS === 'ios' ? 'SFProDisplay-Semibold' : 'System',
  },
  headerActionIcon: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.2)', // Mais sutil
    borderRadius: Radii.pill,
    paddingVertical: 10,
    paddingHorizontal: 14,
    // iOS clean shadow
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
      },
      android: { elevation: 3 },
    }),
  },
  headerActionText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '600',
    marginLeft: 8,
    fontFamily: Platform.OS === 'ios' ? 'SFProText-Medium' : 'System',
  },
  calendarContainer: {
    backgroundColor: Colors.surface,
    marginHorizontal: 18,
    marginTop: -28, // Ajustado para iOS
    borderRadius: Radii.md,
    overflow: 'hidden',
    // iOS Premium Shadow
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.1,
        shadowRadius: 16,
      },
      android: { elevation: 8 },
    }),
  },
  calendarStyle: {
    borderRadius: Radii.md,
  },
  agendaListHeader: {
    paddingHorizontal: 18,
    paddingTop: 24,
    paddingBottom: 18,
    backgroundColor: Colors.bgSoft,
  },
  agendaListTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1C3A5F',
    textTransform: 'capitalize',
    fontFamily: Platform.OS === 'ios' ? 'SFProDisplay-Semibold' : 'System',
  },
  listStyle: { flex: 1 },
  listContentContainer: {
    paddingHorizontal: 18,
    paddingBottom: 24, // Mais bottom para iOS
  },
  appointmentCardWrapper: {
    marginVertical: 10, // Mais espaço
    borderRadius: Radii.md,
    backgroundColor: Colors.surface,
    overflow: Platform.OS === 'ios' ? 'visible' : 'hidden',
    // iOS Premium Shadow (clean)
    ...Platform.select({
      ios: {
        shadowColor: Colors.shadow,
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.12,
        shadowRadius: 12,
      },
      android: { elevation: 6 },
    }),
  },
  appointmentCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20, // Mais padding iOS
  },
  clientAvatar: {
    width: 54,
    height: 54,
    borderRadius: 27,
    marginRight: 16,
    borderWidth: 2,
    borderColor: Colors.primary,
  },
  clientAvatarPlaceholder: {
    width: 54,
    height: 54,
    borderRadius: 27,
    marginRight: 16,
    backgroundColor: '#B0C4DE',
    justifyContent: 'center',
    alignItems: 'center',
  },
  appointmentDetails: { flex: 1 },
  appointmentClientName: {
    fontSize: 18, // Maior iOS
    fontWeight: '700',
    color: Colors.text,
    marginBottom: 4,
    fontFamily: Platform.OS === 'ios' ? 'SFProDisplay-Bold' : 'System',
  },
  appointmentServiceType: {
    fontSize: 16,
    fontWeight: '500',
    color: '#495057',
    marginBottom: 6,
    fontFamily: Platform.OS === 'ios' ? 'SFProText-Medium' : 'System',
  },
  timeAndLocation: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4, // Mais espaço
  },
  appointmentTime: { fontSize: 15, color: Colors.textMuted, fontFamily: Platform.OS === 'ios' ? 'SFProText-Regular' : 'System' },
  appointmentAddress: { fontSize: 15, color: Colors.textMuted, fontFamily: Platform.OS === 'ios' ? 'SFProText-Regular' : 'System' },
  appointmentStatusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 18, // Mais arredondado iOS
    marginLeft: 16,
    // iOS clean shadow
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
      },
      android: { elevation: 2 },
    }),
  },
  appointmentStatusText: {
    fontSize: 12,
    fontWeight: 'bold',
    textTransform: 'uppercase',
    marginLeft: 6,
    fontFamily: Platform.OS === 'ios' ? 'SFProText-Semibold' : 'System',
  },
  centeredFeedback: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
    marginTop: 24,
  },
  loadingText: {
    fontSize: 17,
    color: Colors.textMuted,
    marginTop: 14,
    fontWeight: '500',
    textAlign: 'center',
    fontFamily: Platform.OS === 'ios' ? 'SFProText-Medium' : 'System',
  },
  emptyListText: {
    fontSize: 18,
    color: Colors.textMuted,
    marginTop: 18,
    textAlign: 'center',
    fontWeight: '600',
    fontFamily: Platform.OS === 'ios' ? 'SFProText-Semibold' : 'System',
  },
  emptyListSubText: {
    fontSize: 16,
    color: Colors.textSubtle,
    marginTop: 10,
    textAlign: 'center',
    lineHeight: 22,
    fontFamily: Platform.OS === 'ios' ? 'SFProText-Regular' : 'System',
  },
  manageAvailabilityButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.primary,
    paddingVertical: 14,
    paddingHorizontal: 22,
    borderRadius: 32, // Mais pill para iOS
    marginTop: 24,
    // iOS Premium Shadow
    ...Platform.select({
      ios: {
        shadowColor: Colors.primary,
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.3,
        shadowRadius: 10,
      },
      android: { elevation: 8 },
    }),
  },
  manageAvailabilityButtonText: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '600',
    fontFamily: Platform.OS === 'ios' ? 'SFProText-Semibold' : 'System',
  },
  listSeparator: { height: 0 },
  // CTA and modal styles
  quickCTAButton: {
    backgroundColor: Colors.primary,
    borderRadius: Radii.pill,
    paddingVertical: 12,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
  },
  quickCTAButtonText: { color: '#fff', fontWeight: '700' },
  // Coach styles
  coachOverlay: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.45)', justifyContent: 'center', alignItems: 'center', padding: 18 },
  coachCard: { backgroundColor: Colors.surface, borderRadius: Radii.md, padding: 18, width: '88%', maxWidth: 520, ...Platform.select({ ios: { shadowColor: Colors.shadow, shadowOffset: { width:0, height:8 }, shadowOpacity: 0.18, shadowRadius: 18 }, android: { elevation: 14 } }) },
  coachTitle: { fontSize: 18, fontWeight: '800', color: Colors.text, marginBottom: 8 },
  coachText: { fontSize: 16, color: Colors.textMuted, lineHeight: 22 },
  coachCheckboxRow: { marginTop: 10, marginBottom: 6 },
  coachCheckboxText: { color: Colors.textSubtle, fontSize: 14 },
  coachActions: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 10 },
  coachButton: { backgroundColor: Colors.primary, paddingVertical: 12, paddingHorizontal: 18, borderRadius: Radii.pill, minWidth: 120, alignItems: 'center' },
  coachButtonText: { color: '#fff', fontWeight: '700' },
  coachSecondaryButton: { backgroundColor: Colors.fieldBg },
  coachSecondaryText: { color: Colors.text, fontWeight: '700' },
  coachFab: {
    position: 'absolute',
    right: 16,
    bottom: 16,
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.92)',
    ...Platform.select({
      ios: { shadowColor: Colors.shadow, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.18, shadowRadius: 8 },
      android: { elevation: 8 },
    }),
  },
  modalOverlay: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.35)', justifyContent: 'flex-end', padding: 18 },
  modalCard: { backgroundColor: Colors.surface, borderRadius: Radii.md, padding: 18, ...Platform.select({ ios: { shadowColor: Colors.shadow, shadowOffset: { width:0, height:8 }, shadowOpacity: 0.15, shadowRadius: 18 }, android: { elevation: 12 } }) },
  modalTitle: { fontSize: 16, fontWeight: '700', color: Colors.text, marginBottom: 6 },
  stepTitle: { fontSize: 16, fontWeight: '700', color: Colors.text, marginBottom: 8 },
  stepSubtitle: { fontSize: 13, color: Colors.textMuted, marginBottom: 6 },
  summaryCard: { backgroundColor: Colors.fieldBg, borderRadius: Radii.md, padding: 12, flexDirection: 'row', alignItems: 'center', marginBottom: 12, borderWidth: 0.5, borderColor: Colors.border },
  modalChipsRow: { flexDirection: 'row', flexWrap: 'wrap', marginBottom: 12 },
  modalChip: { paddingVertical: 8, paddingHorizontal: 12, borderRadius: 14, backgroundColor: Colors.fieldBg, margin: 6, borderWidth: 0.5, borderColor: Colors.border },
  modalChipActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  modalChipText: { color: Colors.text, fontWeight: '600' },
  modalChipTextActive: { color: '#fff' },
  modalActions: { flexDirection: 'row', justifyContent: 'flex-end' },
  modalButton: { paddingVertical: 10, paddingHorizontal: 16, borderRadius: Radii.pill, marginLeft: 8 },
  modalCancel: { backgroundColor: Colors.fieldBg },
  modalConfirm: { backgroundColor: Colors.primary },
  modalButtonText: { color: Colors.text, fontWeight: '700' },
  modalConfirmText: { color: '#fff' },
});
