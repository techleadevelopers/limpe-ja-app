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

// ====== Interface para Theme (EXPANDIDA dos anexos para compatibilidade total com react-native-calendars) ======
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
  textDayFontSize?: number;
  textMonthFontSize?: number;
  textDayHeaderFontSize?: number;
  textDayFontWeight?: 
    | "normal" | "bold" | "100" | "200" | "300" | "400" | "500" | "600" | "700" | "800" | "900"
    | 100 | 200 | 300 | 400 | 500 | 600 | 700 | 800 | 900
    | "ultralight" | "thin" | "light" | "medium" | "semibold" | "extrabold" | "heavy" | "black"
    | undefined;
  textMonthFontWeight?: 
    | "normal" | "bold" | "100" | "200" | "300" | "400" | "500" | "600" | "700" | "800" | "900"
    | 100 | 200 | 300 | 400 | 500 | 600 | 700 | 800 | 900
    | "ultralight" | "thin" | "light" | "medium" | "semibold" | "extrabold" | "heavy" | "black"
    | undefined;
  textDayHeaderFontWeight?: 
    | "normal" | "bold" | "100" | "200" | "300" | "400" | "500" | "600" | "700" | "800" | "900"
    | 100 | 200 | 300 | 400 | 500 | 600 | 700 | 800 | 900
    | "ultralight" | "thin" | "light" | "medium" | "semibold" | "extrabold" | "heavy" | "black"
    | undefined;
  'stylesheet.calendar.header'?: {
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
  selectedDayTextColor?: string;
  todayBackgroundColor?: string;
}

// ====== Tema do Calendário (Integrado e adaptado dos anexos - resolve incompatibilidades TS) ======
const calendarTheme: Theme = {
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
  arrowColor: Colors.primary,
  monthTextColor: Colors.primaryDark,
  indicatorColor: Colors.primary,
  textDayFontWeight: '400' as const,
  textMonthFontWeight: 'bold' as const,
  textDayHeaderFontWeight: '500' as const,
  textDayFontSize: 16, // iOS larger
  textMonthFontSize: 19,
  textDayHeaderFontSize: 13,
  'stylesheet.calendar.header': {
    week: {
      marginTop: 8, // More space iOS
      flexDirection: 'row',
      justifyContent: 'space-around',
      borderBottomWidth: 1,
      borderBottomColor: Colors.border,
      paddingBottom: 8,
    },
    dayHeader: {
      color: Colors.textMuted,
      fontWeight: '500' as const,
      fontSize: 13,
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
  selectedDate: Date;
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
  selectedDate,
  onDaySelect,
  fadeAnim,
  slideUpAnim,
  selectionAnim,
  calendarBreatheAnim,
  markedDates = {}, // Default vazio para compatibilidade
  disablePastDates = true, // Default true para lógica de produção (bloquear passados)
}) => {
  const calendarRef = useRef<any>(null); // Ref para controle manual do Calendar (se necessário)

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
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const selected = new Date(day.dateString);
    selected.setHours(0, 0, 0, 0);

    if (disablePastDates && selected < today) {
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
    const selectedDateStr = selectedDate.toISOString().split('T')[0];

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
      const todayStr = today.toISOString().split('T')[0];
      Object.keys(marks).forEach(dateStr => {
        const date = new Date(dateStr);
        date.setHours(0, 0, 0, 0);
        if (date < today && dateStr !== todayStr) {
          marks[dateStr] = {
            ...marks[dateStr],
            disableTouchEvent: true,
          };
        }
      });
    }

    return marks;
  }, [markedDates, selectedDate, disablePastDates]);

  const today = new Date();
  today.setHours(0, 0, 0, 0);
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
    <Animated.View style={[styles.calendarContainer, containerTransform, AppShadows.medium]}>
      {/* Header customizado com botões (opcional, pois Calendar tem swipe, mas mantido para lógica original) */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={onPrevMonth}
          style={[styles.iconBtn, { transform: [{ scale: prevMonthPressAnim }] }]}
          onPressIn={() => onPressInMonthNav(prevMonthPressAnim)}
          onPressOut={() => onPressOutMonthNav(prevMonthPressAnim)}
          accessibilityLabel={`Mês anterior`}
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
          accessible={true}
        >
          <Ionicons name="chevron-forward" size={22} color={Colors.text} />
        </TouchableOpacity>
      </View>

      {/* Calendar robusto integrado dos anexos */}
      <Calendar
        ref={calendarRef}
        current={currentMonthStr} // Sincroniza com currentDisplayMonth
        onDayPress={handleDayPress}
        markedDates={finalMarkedDates}
        monthFormat={'MMMM yyyy'} // pt-BR via LocaleConfig
        onMonthChange={handleMonthChange}
        firstDay={1} // Segunda como primeiro dia (padrão BR)
        enableSwipeMonths={true} // Swipe para navegação (premium)
        theme={calendarTheme as Theme} // Tema robusto dos anexos
        style={styles.calendarStyle}
        accessibilityLabel="Calendário de agendamentos"
        accessibilityHint="Selecione uma data"
        // Desabilita toques em dias passados via markedDates (já integrado acima)
      />
    </Animated.View>
  );
});

// ====== Styles adaptados (Premium iOS Clean, integrando dos anexos) ======
const styles = StyleSheet.create({
  calendarContainer: {
    backgroundColor: Colors.surface,
    borderRadius: Radii.md,
    overflow: 'hidden',
    marginHorizontal: 18,
    marginTop: -28, // Ajustado para iOS (dos anexos)
    // iOS Premium Shadow (dos anexos)
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
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
    marginTop: 20,
    paddingHorizontal: Spacing.md,
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

ScheduleCalendar.displayName = 'ScheduleCalendar';

export default ScheduleCalendar;