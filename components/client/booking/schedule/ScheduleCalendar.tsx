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
import { Calendar, LocaleConfig, DateData } from 'react-native-calendars';
import { Ionicons } from '@expo/vector-icons';
import { AppColors, AppShadows } from '../../../../constants/appStyles';
import * as Haptics from 'expo-haptics';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// ====== Locale PT-BR (Calendário) ======
LocaleConfig.locales['pt-br'] = {
  monthNames: [
    'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Mai.', 'Junho',
    'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
  ],
  monthNamesShort: ['Jan.', 'Fev.', 'Mar.', 'Abr.', 'Mai.', 'Jun.', 'Jul.', 'Ago.', 'Set.', 'Out.', 'Nov.', 'Dez.'],
  dayNames: ['Domingo', 'Segunda-feira', 'Terça-feira', 'Quarta-feira', 'Quinta-feira', 'Sexta-feira', 'Sábado'],
  dayNamesShort: ['DOM', 'SEG', 'TER', 'QUA', 'QUI', 'SEX', 'SÁB'],
  today: 'Hoje'
};
LocaleConfig.defaultLocale = 'pt-br';

// ====== Design tokens ======
const Colors = {
  primary: AppColors.primaryInteractive || '#4A90E2',
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

// ✅ PATCH 3.1: Helper para blindagem toISOString (defesa contra undefined)
const safeISO = (d?: Date) => (d instanceof Date ? d.toISOString() : new Date().toISOString());

// ====== Interface para Theme (Local) ======
interface CustomTheme {
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
  textDayFontWeight?: 'normal' | 'bold' | '400' | '500' | '600' | '700' | undefined;
  textMonthFontWeight?: 'normal' | 'bold' | '400' | '500' | '600' | '700' | undefined;
  textDayHeaderFontWeight?: 'normal' | 'bold' | '400' | '500' | '600' | '700' | undefined;
  'stylesheet.calendar.header'?: {
    header?: {
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
  todayBackgroundColor?: string;
}

// ====== Tema do Calendário ======
const calendarTheme: CustomTheme = {
  backgroundColor: Colors.bgSoft,
  calendarBackground: Colors.surface,
  textSectionTitleColor: '#586069',
  selectedDayBackgroundColor: Colors.primary,
  selectedDayTextColor: '#FFFFFF',
  todayTextColor: Colors.primary,
  dayTextColor: Colors.text,
  textDisabledColor: Colors.textMuted,
  dotColor: Colors.primary,
  selectedDotColor: '#FFFFFF',
  arrowColor: 'transparent',
  disabledArrowColor: 'transparent',
  monthTextColor: 'transparent',
  indicatorColor: Colors.primary,
  textDayFontWeight: '400' as const,
  textMonthFontWeight: 'bold' as const,
  textDayHeaderFontWeight: '500' as const,
  textDayFontSize: 16,
  textMonthFontSize: 19,
  textDayHeaderFontSize: 13,
  'stylesheet.calendar.header': {
    header: {
      height: 0,
      paddingTop: 0,
      paddingBottom: 0,
      marginTop: 0,
      backgroundColor: 'transparent',
      opacity: 0,
    },
    week: {
      marginTop: 8,
      flexDirection: 'row',
      justifyContent: 'space-around',
      borderBottomWidth: 1,
      borderBottomColor: Colors.border,
      paddingBottom: 8,
      paddingHorizontal: 24,
    },
    dayHeader: {
      color: Colors.textMuted,
      fontWeight: '500' as const,
      fontSize: 13,
      paddingHorizontal: 2,
    },
  },
  textInactiveColor: Colors.textMuted,
  textActiveColor: Colors.primary,
  todayBackgroundColor: Colors.infoLight,
} as const;

// ====== Tipos ======
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
  selectedDate: Date | undefined;
  onDaySelect: (date: Date) => void;
  fadeAnim: Animated.Value;
  slideUpAnim: Animated.Value;
  selectionAnim: Animated.Value;
  calendarBreatheAnim: Animated.Value;
  markedDates?: MarkedDate;
  disablePastDates?: boolean;
}

const ScheduleCalendar: React.FC<ScheduleCalendarProps> = memo(({
  currentDisplayMonth,
  onPrevMonth,
  onNextMonth,
  selectedDate,
  onDaySelect,
  fadeAnim,
  slideUpAnim,
  selectionAnim,
  calendarBreatheAnim,
  markedDates = {},
  disablePastDates = true,
}) => {
  // ✅ PATCH: Defina today ANTES do useMemo
  const today = React.useMemo(() => {
    const t = new Date();
    t.setHours(0, 0, 0, 0);
    return t;
  }, []);

  const prevMonthPressAnim = useRef(new Animated.Value(1)).current;
  const nextMonthPressAnim = useRef(new Animated.Value(1)).current;

  const onPressInMonthNav = useCallback((animValue: Animated.Value) => {
    if (Platform.OS === 'ios') {
      Haptics.selectionAsync();
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

  const handleMonthChange = useCallback((monthInfo: { month: number; year: number }) => {
    const newMonth = new Date(monthInfo.year, monthInfo.month - 1, 1);
    if (newMonth.getMonth() < currentDisplayMonth.getMonth()) {
      onPrevMonth();
    } else if (newMonth.getMonth() > currentDisplayMonth.getMonth()) {
      onNextMonth();
    }
  }, [currentDisplayMonth, onPrevMonth, onNextMonth]);

  const handleDayPress = useCallback((day: DateData) => {
    // ✅ PATCH: Blindagem extra (removido warn; só return se inválido)
    if (!day || typeof day.dateString !== 'string') {
      return; // Silencioso, sem warn para evitar LogBox
    }

    const todayLocal = new Date();
    todayLocal.setHours(0, 0, 0, 0);
    const selected = new Date(day.dateString);
    selected.setHours(0, 0, 0, 0);

    if (disablePastDates && selected < todayLocal) {
      Alert.alert('Data Inválida', 'Não é possível selecionar uma data passada.');
      return;
    }

    onDaySelect(selected);
    if (Platform.OS === 'ios') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
  }, [onDaySelect, disablePastDates]);

  // ✅ PATCH: Blindagem extra no useMemo de marks (evita loop com chaves inválidas no mount)
  const finalMarkedDates = React.useMemo(() => {
    const marks: MarkedDate = { ...markedDates };

    const safeSelectedDate = selectedDate ?? new Date();
    const selectedDateStr = safeISO(safeSelectedDate).split('T')[0];

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

    if (disablePastDates) {
      const todayLocal = new Date();
      todayLocal.setHours(0, 0, 0, 0);
      const todayStr = safeISO(todayLocal).split('T')[0];

      // ✅ PATCH: Filtra só chaves válidas (string YYYY-MM-DD) para evitar warns no mount
      Object.keys(marks).forEach(dateStr => {
        if (typeof dateStr !== 'string' || !dateStr.match(/^\d{4}-\d{2}-\d{2}$/)) return; // Ignora inválidas
        const date = new Date(dateStr);
        date.setHours(0, 0, 0, 0);
        if (date < todayLocal && dateStr !== todayStr) {
          marks[dateStr] = {
            ...marks[dateStr],
            disableTouchEvent: true,
            disabled: true,
          };
        }
      });
    }

    return marks;
  }, [markedDates, selectedDate, disablePastDates]);

  const currentMonthStr = currentDisplayMonth.toISOString().split('T')[0].substring(0, 7);

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
      <View style={[styles.header, { paddingHorizontal: 24 }]}>
        <TouchableOpacity
          onPress={onPrevMonth}
          style={[styles.iconBtn, { transform: [{ scale: prevMonthPressAnim }] }]}
          onPressIn={() => onPressInMonthNav(prevMonthPressAnim)}
          onPressOut={() => onPressOutMonthNav(prevMonthPressAnim)}
          accessibilityLabel={`Mês anterior`}
          accessibilityHint="Navegar para o mês anterior no calendário"
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
          accessibilityHint="Navegar para o próximo mês no calendário"
          accessible={true}
        >
          <Ionicons name="chevron-forward" size={22} color={Colors.text} />
        </TouchableOpacity>
      </View>

      <View style={{ paddingHorizontal: 24 }}>
        <Calendar
          current={currentMonthStr}
          onDayPress={handleDayPress}
          markedDates={finalMarkedDates}
          monthFormat={'MMMM yyyy'}
          onMonthChange={handleMonthChange}
          firstDay={1}
          enableSwipeMonths={false} // ✅ CORREÇÃO: Desabilita swipe para evitar re-renders desnecessários (use botões manuais)
          hideExtraDays={true}
          minDate={safeISO(today).split('T')[0]}
          disableAllTouchEventsForDisabledDays={true} // ✅ NOVO: Esconde dias vazios (menos itens no FlatList interno)
          theme={calendarTheme}
          style={styles.calendarStyle}
          accessibilityLabel="Calendário de agendamentos"
          accessibilityHint="Selecione uma data para agendamento"
        />
      </View>
    </Animated.View>
  );
});

ScheduleCalendar.displayName = 'ScheduleCalendar';

export default ScheduleCalendar;

// ====== Styles ======
const styles = StyleSheet.create({
  calendarContainer: {
    backgroundColor: Colors.surface,
    borderRadius: Radii.md,
    overflow: 'hidden',
    marginHorizontal: 25,
    paddingVertical: 10,
    marginBottom: 20,
    marginTop: 28,
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
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
    marginTop: 10,
    paddingHorizontal: 24,
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


