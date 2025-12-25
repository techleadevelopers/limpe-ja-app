import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import React, { memo, useCallback, useRef } from 'react';
import {
  Alert,
  Animated,
  Dimensions,
  Easing,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { Calendar, DateData, LocaleConfig } from 'react-native-calendars';
import { AppColors } from '../../../../constants/appStyles';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// ====== Locale PT-BR (Calendário) ======
LocaleConfig.locales['pt-br'] = {
  monthNames: [
    'Janeiro',
    'Fevereiro',
    'Março',
    'Abril',
    'Mai.',
    'Junho',
    'Julho',
    'Agosto',
    'Setembro',
    'Outubro',
    'Novembro',
    'Dezembro',
  ],
  monthNamesShort: ['Jan.', 'Fev.', 'Mar.', 'Abr.', 'Mai.', 'Jun.', 'Jul.', 'Ago.', 'Set.', 'Out.', 'Nov.', 'Dez.'],
  dayNames: ['Domingo', 'Segunda-feira', 'Terça-feira', 'Quarta-feira', 'Quinta-feira', 'Sexta-feira', 'Sábado'],
  dayNamesShort: ['DOM', 'SEG', 'TER', 'QUA', 'QUI', 'SEX', 'SÁB'],
  today: 'Hoje',
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

// ✅ PATCH: Helper para blindagem toISOString (defesa contra undefined)
const safeISO = (d?: Date) => (d instanceof Date ? d.toISOString() : new Date().toISOString());

// ✅ PATCH: Parse local seguro de YYYY-MM-DD (evita drift de fuso em Android/iOS)
const parseYMDLocal = (ymd: string) => {
  const [y, m, d] = ymd.split('-').map((n) => Number(n));
  if (!y || !m || !d) return new Date();
  const dt = new Date(y, m - 1, d);
  dt.setHours(0, 0, 0, 0);
  return dt;
};

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
      paddingHorizontal?: number;
    };
    dayHeader?: { color?: string; fontWeight?: string; fontSize?: number; paddingHorizontal?: number };
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
    // OBS: você usa "disabled" no código — mantive aqui pra não dar TS error e ficar explícito
    disabled?: boolean;
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

const ScheduleCalendar: React.FC<ScheduleCalendarProps> = memo(
  ({
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
    // today fixo (memo) em horário local
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

    const handleMonthChange = useCallback(
      (monthInfo: { month: number; year: number }) => {
        const newMonth = new Date(monthInfo.year, monthInfo.month - 1, 1);
        if (newMonth.getMonth() < currentDisplayMonth.getMonth() || newMonth.getFullYear() < currentDisplayMonth.getFullYear()) {
          onPrevMonth();
        } else if (newMonth.getMonth() > currentDisplayMonth.getMonth() || newMonth.getFullYear() > currentDisplayMonth.getFullYear()) {
          onNextMonth();
        }
      },
      [currentDisplayMonth, onPrevMonth, onNextMonth],
    );

    const handleDayPress = useCallback(
      (day: DateData) => {
        if (!day || typeof day.dateString !== 'string') return;

        const todayLocal = new Date();
        todayLocal.setHours(0, 0, 0, 0);

        // ✅ parse local seguro
        const selected = parseYMDLocal(day.dateString);

        if (disablePastDates && selected < todayLocal) {
          Alert.alert('Data Inválida', 'Não é possível selecionar uma data passada.');
          return;
        }

        onDaySelect(selected);

        if (Platform.OS === 'ios') {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        }
      },
      [onDaySelect, disablePastDates],
    );

    const finalMarkedDates = React.useMemo(() => {
      const marks: MarkedDate = { ...markedDates };

      const safeSelectedDate = selectedDate ?? new Date();
      const selectedDateStr = safeISO(safeSelectedDate).split('T')[0];

      marks[selectedDateStr] = {
        ...(marks[selectedDateStr] ?? {}),
        selected: true,
        selectedColor: Colors.primary,
        selectedTextColor: '#FFFFFF',
      };

      if (disablePastDates) {
        const todayLocal = new Date();
        todayLocal.setHours(0, 0, 0, 0);
        const todayStr = safeISO(todayLocal).split('T')[0];

        Object.keys(marks).forEach((dateStr) => {
          if (typeof dateStr !== 'string' || !dateStr.match(/^\d{4}-\d{2}-\d{2}$/)) return;

          // ✅ parse local seguro
          const date = parseYMDLocal(dateStr);

          if (date < todayLocal && dateStr !== todayStr) {
            marks[dateStr] = {
              ...(marks[dateStr] ?? {}),
              disableTouchEvent: true,
              disabled: true,
            };
          }
        });
      }

      return marks;
    }, [markedDates, selectedDate, disablePastDates]);

    // ✅ FIX ANDROID: Calendar current precisa ser YYYY-MM-DD (não YYYY-MM)
    const currentMonthStr = `${currentDisplayMonth.getFullYear()}-${String(currentDisplayMonth.getMonth() + 1).padStart(2, '0')}-01`;

    const containerTransform = {
      transform: [
        {
          scale: Animated.multiply(
            calendarBreatheAnim,
            fadeAnim.interpolate({ inputRange: [0, 1], outputRange: [0.95, 1] }),
          ),
        },
      ],
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
            accessibilityLabel="Mês anterior"
            accessibilityHint="Navegar para o mês anterior no calendário"
            accessible
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
            accessibilityLabel="Próximo mês"
            accessibilityHint="Navegar para o próximo mês no calendário"
            accessible
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
            enableSwipeMonths={false}
            hideExtraDays
            minDate={safeISO(today).split('T')[0]}
            disableAllTouchEventsForDisabledDays
            theme={calendarTheme}
            style={styles.calendarStyle}
            accessibilityLabel="Calendário de agendamentos"
            accessibilityHint="Selecione uma data para agendamento"
            dayComponent={({ date, state, marking }) => {
              const isSelected = (marking as any)?.selected === true;
              const isDisabled = (marking as any)?.disabled || state === 'disabled';

              const popAnim = React.useRef(new Animated.Value(isSelected ? 1 : 0)).current;

              React.useEffect(() => {
                Animated.timing(popAnim, {
                  toValue: isSelected ? 1 : 0,
                  duration: 180,
                  easing: easeOut,
                  useNativeDriver: true,
                }).start();
              }, [isSelected, popAnim]);

              const scale = popAnim.interpolate({ inputRange: [0, 1], outputRange: [1, 1.06] });
              const opacity = popAnim.interpolate({ inputRange: [0, 1], outputRange: [0.9, 1] });

              // ✅ FIX ANDROID: não chame o onPress interno com objeto incompleto
              // use o date completo (DateData) e passe pelo handleDayPress
              const handlePress = () => {
                if (!isDisabled && date) handleDayPress(date as any);
              };

              return (
                <Animated.View style={{ alignItems: 'center', justifyContent: 'center', transform: [{ scale }], opacity }}>
                  <TouchableOpacity
                    onPress={handlePress}
                    activeOpacity={0.9}
                    disabled={isDisabled}
                    style={{
                      width: 36,
                      height: 32,
                      borderRadius: 10,
                      overflow: 'hidden',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    {isSelected ? (
                      <LinearGradient
                        colors={['rgba(92, 168, 248, 1)', 'rgba(62, 149, 241, 1)']}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                        style={StyleSheet.absoluteFillObject}
                      />
                    ) : null}

                    <Text
                      style={{
                        color: isDisabled ? Colors.textMuted : isSelected ? '#FFFFFFFF' : Colors.text,
                        fontWeight: isSelected ? '700' : '600',
                      }}
                    >
                      {(date as any)?.day}
                    </Text>
                  </TouchableOpacity>
                </Animated.View>
              );
            }}
          />
        </View>
      </Animated.View>
    );
  },
);

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
    borderWidth: Platform.OS === 'android' ? 0 : 0.9,
    borderColor: 'rgba(24, 79, 230, 0.09)',
    ...Platform.select({
      ios: {
        shadowColor: '#45484b56',
        shadowOffset: { width: -1, height: 1 },
        shadowOpacity: 1.05,
        shadowRadius: 9,
      },
      android: { elevation: 0 },
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
