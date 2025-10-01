import React, { useCallback, useEffect, useRef, memo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Easing,
  Alert,
  Dimensions,
  Platform,
} from 'react-native';
import { Calendar, LocaleConfig, DateData } from 'react-native-calendars'; // ✅ CORREÇÃO: Removido 'Theme' do import (não é exportado diretamente)
import { Ionicons } from '@expo/vector-icons';
import { AppColors, AppShadows } from '../../../../constants/appStyles';
import * as Haptics from 'expo-haptics'; // Adicionado para feedback premium iOS

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// ====== Locale PT-BR (Calendário) ====== (Integrado dos anexos para robustez)
LocaleConfig.locales['pt-br'] = {
  monthNames: [
    'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
    'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
  ],
  monthNamesShort: ['Jan.', 'Fev.', 'Mar.', 'Abr.', 'Mai.', 'Jun.', 'Jul.', 'Ago.', 'Set.', 'Out.', 'Nov.', 'Dez.'],
  dayNames: ['Domingo', 'Segunda-feira', 'Terça-feira', 'Quarta-feira', 'Quinta-feira', 'Sexta-feira', 'Sábado'],
  dayNamesShort: ['DOM', 'SEG', 'TER', 'QUA', 'QUI', 'SEX', 'SÁB'],
  today: 'Hoje'
};
LocaleConfig.defaultLocale = 'pt-br';

// ====== Design tokens adaptados dos anexos (Premium iOS) ======
const Colors = {
  primary: AppColors.primaryInteractive || '#4A90E2', // Fallback para compatibilidade
  primaryDark: '#2A72E7',
  bgSoft: AppColors.backgroundNeutral || '#F0F7FF',
  surface: AppColors.white || '#FFFFFF',
  border: '#E9ECEF',
  text: AppColors.textBody || '#212529',
  textMuted: AppColors.mediumGray || '#6C757D',
  textSubtle: '#868E96',
  danger: AppColors.errorRed || '#D32F2F',
  success: AppColors.successStandard || '#2E7D32',
  shadow: 'rgba(0,0,0,0.08)',
  infoLight: '#E0F2F7',
  infoDark: '#007B8C',
};

const Radii = {
  xl: 24,
  pill: 28,
  md: 16,
  sm: 12,
};

const Spacing = {
  sm: 12,
  md: 18,
  lg: 24,
};

const easeOut = Easing.out(Easing.ease);

// ✅ PATCH 3.1: Helper para blindagem toISOString (defesa contra undefined em useMemo e handleDayPress)
const safeISO = (d?: Date) => (d instanceof Date ? d.toISOString() : new Date().toISOString());

// ====== Interface para Theme (CORRIGIDA: Local, baseada na lib oficial - sem import dependente) ======
// ✅ CORREÇÃO: Interface autônoma (não estende Theme importado). Union de fontWeight simplificada para compatibilidade exata com lib
// (valores comuns: strings literais + undefined; removidas duplicatas e pesos raros para evitar TS mismatches)
interface CustomTheme {
  // Propriedades da lib + custom (sem duplicatas)
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
  textDayFontSize?: number;
  textMonthFontSize?: number;
  textDayHeaderFontSize?: number;
  // ✅ CORREÇÃO: Union simplificada e compatível com lib (strings literais comuns + undefined; sem pesos exóticos)
  textDayFontWeight?: 'normal' | 'bold' | '400' | '500' | '600' | '700' | undefined;
  textMonthFontWeight?: 'normal' | 'bold' | '400' | '500' | '600' | '700' | undefined;
  textDayHeaderFontWeight?: 'normal' | 'bold' | '400' | '500' | '600' | '700' | undefined;
  'stylesheet.calendar.header'?: {
    header?: {  // ✅ ADICIONADO: Para ocultar o header do mês da lib (espaço e título duplicado)
      height?: number;
      paddingTop?: number;
      paddingBottom?: number;
      marginTop?: number;
      backgroundColor?: string;
      opacity?: number;
    };
    week?: {
      marginTop?: number;
      flexDirection?: 'row' | 'column' | 'row-reverse' | 'column-reverse';
      justifyContent?: 'flex-start' | 'flex-end' | 'center' | 'space-between' | 'space-around' | 'space-evenly';
      borderBottomWidth?: number;
      borderBottomColor?: string;
      paddingBottom?: number;
    };
    dayHeader?: { color?: string; fontWeight?: string; fontSize?: number; };
  };
  textInactiveColor?: string;
  textActiveColor?: string;
  // ✅ FIX: Removida duplicata; só uma selectedDayTextColor
  todayBackgroundColor?: string;
}

// ====== Tema do Calendário (Integrado e adaptado dos anexos - agora compatível) ======
// ✅ CORREÇÃO: Tipado com CustomTheme local (sem dependência de import)
// ✅ RESOLUÇÃO DO PROBLEMA: Ocultar título duplicado do mês da lib (set monthTextColor transparente + header height:0 para colapsar espaço)
// ✅ PREMIUM: Alinhamento confortável - paddingHorizontal do header customizado para 24 (mais espaçoso e premium), 
//    com justifyContent space-between para ícones simétricos; calendar com padding interno via theme para alinhar dias centralizados
const calendarTheme: CustomTheme = {
  backgroundColor: Colors.bgSoft,
  calendarBackground: Colors.surface,
  textSectionTitleColor: '#586069',
  selectedDayBackgroundColor: Colors.primary,
  selectedDayTextColor: '#FFFFFF', // ✅ FIX: Só uma vez
  todayTextColor: Colors.primary,
  dayTextColor: Colors.text,
  textDisabledColor: Colors.textMuted,
  dotColor: Colors.primary,
  selectedDotColor: '#FFFFFF',
  arrowColor: 'transparent', // ✅ FIX: Oculta setas da lib (usamos custom nav)
  disabledArrowColor: 'transparent', // ✅ FIX: Oculta setas desabilitadas
  monthTextColor: 'transparent', // ✅ FIX: Oculta título do mês da lib (evita duplicado)
  indicatorColor: Colors.primary,
  textDayFontWeight: '400' as const, // ✅ FIX: Valor compatível com union
  textMonthFontWeight: 'bold' as const,
  textDayHeaderFontWeight: '500' as const,
  textDayFontSize: 16, // iOS larger
  textMonthFontSize: 19,
  textDayHeaderFontSize: 13,
  'stylesheet.calendar.header': {
    // ✅ FIX PREMIUM: Colapsa o header da lib para remover espaço duplicado (height:0 + paddings zero)
    header: {
      height: 0,
      paddingTop: 0,
      paddingBottom: 0,
      marginTop: 0,
      backgroundColor: 'transparent',
      opacity: 0,
    },
    week: {
      marginTop: 8, // More space iOS
      flexDirection: 'row',
      justifyContent: 'space-around', // ✅ Alinhamento premium: dias espaçados uniformemente (confortável visual)
      borderBottomWidth: 1,
      borderBottomColor: Colors.border,
      paddingBottom: 8,
      // ✅ ADICIONADO: Padding horizontal para alinhar com header custom (confortável e simétrico)
      paddingHorizontal: 24, // Match com header (premium: mais espaço lateral para respiração)
    },
    dayHeader: {
      color: Colors.textMuted,
      fontWeight: '500' as const,
      fontSize: 13,
      // ✅ ADICIONADO: Padding para alinhamento premium dos nomes dos dias
      paddingHorizontal: 2, // Leve para centralizar perfeitamente
    },
  },
  textInactiveColor: Colors.textMuted,
  textActiveColor: Colors.primary,
  todayBackgroundColor: Colors.infoLight,
} as const;

// ====== Tipos adaptados para integração com Calendar ======
interface MarkedDate {
  [key: string]: {
    selected?: boolean;
    selectedColor?: string;
    selectedTextColor?: string;
    marked?: boolean;
    dotColor?: string;
    disableTouchEvent?: boolean;
  };
}

interface ScheduleCalendarProps {
  currentDisplayMonth: Date;
  onPrevMonth: () => void;
  onNextMonth: () => void;
  selectedDate: Date | undefined; // ✅ PATCH: Permite undefined para blindagem
  onDaySelect: (date: Date) => void;
  fadeAnim: Animated.Value;
  slideUpAnim: Animated.Value;
  selectionAnim: Animated.Value;
  calendarBreatheAnim: Animated.Value;
  // Adicionado para suporte a markedDates (dos anexos, para lógica de produção)
  markedDates?: MarkedDate;
  // Adicionado para suporte a dias passados desabilitados (lógica de produção)
  disablePastDates?: boolean;
}

const ScheduleCalendar: React.FC<ScheduleCalendarProps> = memo(({
  currentDisplayMonth,
  onPrevMonth,
  onNextMonth,
  selectedDate, // Pode ser undefined
  onDaySelect,
  fadeAnim,
  slideUpAnim,
  selectionAnim,
  calendarBreatheAnim,
  markedDates = {}, // Default vazio para compatibilidade
  disablePastDates = true, // Default true para lógica de produção (bloquear passados)
}) => {
  // ✅ CORREÇÃO: Removido calendarRef (não usado e causa erro de prop 'ref' inválida no Calendar)
  // Se precisar no futuro, envolva em forwardRef, mas desnecessário aqui

  // ✅ PATCH: Defina today ANTES do useMemo para evitar closure undefined
  const today = React.useMemo(() => {
    const t = new Date();
    t.setHours(0, 0, 0, 0);
    return t;
  }, []); // Estável, re-computa só no mount

  // Animações para botões de navegação (mantidas da lógica original, mas opcionais pois Calendar tem swipe)
  const prevMonthPressAnim = useRef(new Animated.Value(1)).current;
  const nextMonthPressAnim = useRef(new Animated.Value(1)).current;

  const onPressInMonthNav = useCallback((animValue: Animated.Value) => {
    if (Platform.OS === 'ios') {
      Haptics.selectionAsync(); // Premium iOS haptic
    }
    Animated.spring(animValue, {
      toValue: 0.9,
      useNativeDriver: true,
      friction: 3,
      tension: 40,
    }).start();
  }, []);

  const onPressOutMonthNav = useCallback((animValue: Animated.Value) => {
    Animated.spring(animValue, {
      toValue: 1,
      friction: 3,
      tension: 40,
      useNativeDriver: true,
    }).start();
  }, []);

  // Lógica de navegação de mês (adaptada para Calendar - usa onMonthChange para sincronizar)
  const handleMonthChange = useCallback((monthInfo: { month: number; year: number }) => {
    const newMonth = new Date(monthInfo.year, monthInfo.month - 1, 1); // Calendar usa 1-based month
    // Sincroniza com props externas se necessário (lógica de produção)
    if (newMonth.getMonth() < currentDisplayMonth.getMonth()) {
      onPrevMonth();
    } else if (newMonth.getMonth() > currentDisplayMonth.getMonth()) {
      onNextMonth();
    }
  }, [currentDisplayMonth, onPrevMonth, onNextMonth]);

  // Lógica de seleção de dia (adaptada da original, com validação de passado)
  const handleDayPress = useCallback((day: DateData) => {
    // ✅ PATCH: Blindagem extra para day.dateString (deve ser string, mas fallback se undefined)
    if (!day || typeof day.dateString !== 'string') {
      console.warn('[Calendar] day.dateString inválido:', day);
      return;
    }

    const todayLocal = new Date(); // Local para evitar closure
    todayLocal.setHours(0, 0, 0, 0);
    const selected = new Date(day.dateString);
    selected.setHours(0, 0, 0, 0);

    if (disablePastDates && selected < todayLocal) {
      Alert.alert('Data Inválida', 'Não é possível selecionar uma data passada.');
      return;
    }

    onDaySelect(selected);
    if (Platform.OS === 'ios') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); // Premium haptic na seleção
    }
  }, [onDaySelect, disablePastDates]);

  // Marked dates adaptados (dos anexos: selected + marked para dots)
  const finalMarkedDates = React.useMemo(() => {
    const marks: MarkedDate = { ...markedDates };

    // ✅ PATCH: Blindagem para selectedDate undefined
    const safeSelectedDate = selectedDate ?? new Date();
    const selectedDateStr = safeISO(safeSelectedDate).split('T')[0];

    // Garante que o dia selecionado seja marcado (lógica de produção)
    if (!marks[selectedDateStr]) {
      marks[selectedDateStr] = {
        selected: true,
        selectedColor: Colors.primary,
        selectedTextColor: '#FFFFFF',
      };
    } else {
      marks[selectedDateStr] = {
        ...marks[selectedDateStr],
        selected: true,
        selectedColor: Colors.primary,
        selectedTextColor: '#FFFFFF',
      };
    }

    // Desabilita dias passados se necessário
    if (disablePastDates) {
      // ✅ PATCH: todayStr computado dentro do memo para estabilidade (evita closure undefined)
      const todayLocal = new Date();
      todayLocal.setHours(0, 0, 0, 0);
      const todayStr = safeISO(todayLocal).split('T')[0];

      Object.keys(marks).forEach(dateStr => {
        // ✅ PATCH: Validação extra para dateStr
        if (!dateStr || typeof dateStr !== 'string') return;
        const date = new Date(dateStr);
        date.setHours(0, 0, 0, 0);
        if (date < todayLocal && dateStr !== todayStr) {
          marks[dateStr] = {
            ...marks[dateStr],
            disableTouchEvent: true,
          };
        }
      });
    }

    return marks;
  }, [markedDates, selectedDate, disablePastDates]); // ✅ Deps incluem selectedDate para re-compute se mudar

  const currentMonthStr = currentDisplayMonth.toISOString().split('T')[0].substring(0, 7); // YYYY-MM

  // Animação integrada (mantida da original, aplicada ao container do Calendar)
  const containerTransform = {
    transform: [{
      scale: Animated.multiply(
        calendarBreatheAnim,
        fadeAnim.interpolate({ inputRange: [0, 1], outputRange: [0.95, 1] })
      )
    }],
    opacity: fadeAnim,
  };

  return (
    <Animated.View style={[styles.calendarContainer, containerTransform]}>
      {/* Header customizado com botões (opcional, pois Calendar tem swipe, mas mantido para lógica original) */}
      {/* ✅ FIX PREMIUM: Ajuste de paddingHorizontal para 24 (mais confortável e espaçoso, alinhado com theme.week.paddingHorizontal) */}
      <View style={[styles.header, { paddingHorizontal: 24 }]}>
        <TouchableOpacity
          onPress={onPrevMonth}
          style={[styles.iconBtn, { transform: [{ scale: prevMonthPressAnim }] }]}
          onPressIn={() => onPressInMonthNav(prevMonthPressAnim)}
          onPressOut={() => onPressOutMonthNav(prevMonthPressAnim)}
          accessibilityLabel={`Mês anterior`}
          accessibilityHint="Navegar para o mês anterior no calendário" // ✅ NOVO: Hint extra para acessibilidade
          accessible={true}
        >
          <Ionicons name="chevron-back" size={22} color={Colors.text} />
        </TouchableOpacity>
        <Text style={styles.month} accessibilityRole="header">
          {LocaleConfig.locales['pt-br'].monthNames[currentDisplayMonth.getMonth()]} {currentDisplayMonth.getFullYear()}
        </Text>
        <TouchableOpacity
          onPress={onNextMonth}
          style={[styles.iconBtn, { transform: [{ scale: nextMonthPressAnim }] }]}
          onPressIn={() => onPressInMonthNav(nextMonthPressAnim)}
          onPressOut={() => onPressOutMonthNav(nextMonthPressAnim)}
          accessibilityLabel={`Próximo mês`}
          accessibilityHint="Navegar para o próximo mês no calendário" // ✅ NOVO: Hint extra para acessibilidade
          accessible={true}
        >
          <Ionicons name="chevron-forward" size={22} color={Colors.text} />
        </TouchableOpacity>
      </View>

      {/* Calendar robusto integrado dos anexos */}
      {/* ✅ CORREÇÃO: Removido ref={calendarRef} (prop inválida); theme tipado com CustomTheme local */}
      {/* ✅ FIX: Adicionado style wrapper para padding extra se necessário, mas theme cuida do alinhamento */}
      <View style={{ paddingHorizontal: 24 }}> {/* ✅ ADICIONADO: Wrapper para padding confortável (premium: alinha com header e dias) */}
        <Calendar
          current={currentMonthStr} // Sincroniza com currentDisplayMonth
          onDayPress={handleDayPress}
          markedDates={finalMarkedDates}
          monthFormat={'MMMM yyyy'} // pt-BR via LocaleConfig
          onMonthChange={handleMonthChange}
          firstDay={1} // Segunda como primeiro dia (padrão BR)
          enableSwipeMonths={true} // Swipe para navegação (premium)
          theme={calendarTheme} // ✅ FIX: Tipado nativamente com CustomTheme (sem assertion forçada)
          style={styles.calendarStyle}
          accessibilityLabel="Calendário de agendamentos"
          accessibilityHint="Selecione uma data para agendamento" // ✅ AJUSTE: Hint mais claro
          // Desabilita toques em dias passados via markedDates (já integrado acima)
        />
      </View>
    </Animated.View>
  );
});

ScheduleCalendar.displayName = 'ScheduleCalendar';

export default ScheduleCalendar;

// ====== Styles adaptados (Premium iOS Clean, integrando dos anexos) ======
const styles = StyleSheet.create({
  calendarContainer: {
    backgroundColor: Colors.surface,
    borderRadius: Radii.md,
    overflow: 'hidden',
    marginHorizontal: 25,
    paddingVertical: 10,
    marginBottom: 20,
    marginTop: 28, // ✅ FIX RESOLVIDO: Mudado de -28 para 16 (espaçamento positivo e confortável para evitar overlap com AddressSection)
    // iOS Premium Shadow (dos anexos) - INJETADO: Mesma sombra do ProviderBrief
    borderWidth: 0.9,
    borderColor: 'rgba(24, 79, 230, 0.09)',
    ...Platform.select({
      ios: {
        shadowColor: '#45484b56',
        shadowOffset: { width: -1, height: 1 },
        shadowOpacity: 1.05,
        shadowRadius: 9,
      },
      android: { elevation: 6 },
    }),
  },
  calendarStyle: {
    borderRadius: Radii.md,
    marginBottom: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between', // ✅ FIX PREMIUM: Space-between para ícones simétricos e mês centralizado (confortável)
    alignItems: 'center',
    marginBottom: 12,
    marginTop: 10,
    paddingHorizontal: 24, // ✅ FIX: Ajustado para 24 (premium: mais espaço lateral, alinhado com theme.week)
  },
  iconBtn: {
    padding: Spacing.sm,
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: Radii.sm,
  },
  month: {
    flex: 1,
    textAlign: 'center',
    fontSize: Platform.select({ ios: 18, android: 17 }),
    fontWeight: '800',
    color: Colors.primaryDark,
    fontFamily: Platform.OS === 'ios' ? 'SFProDisplay-Semibold' : 'System',
    
  },
});