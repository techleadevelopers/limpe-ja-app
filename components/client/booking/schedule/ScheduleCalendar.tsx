import React, { useCallback, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated, Easing, Alert, Dimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons'; // Importação adicionada para corrigir o erro

const SCREEN_WIDTH = Dimensions.get('window').width;
const MONTH_NAMES_PT = ["Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho", "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"];
const DAY_NAMES_PT = ["DOM", "SEG", "TER", "QUA", "QUI", "SEX", "SÁB"];
const FIXED_DAY_CELL_SIZE = 40;

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
}

const ScheduleCalendar: React.FC<ScheduleCalendarProps> = ({
  currentDisplayMonth,
  onPrevMonth,
  onNextMonth,
  selectedDate,
  onDaySelect,
  fadeAnim,
  slideUpAnim,
  selectionAnim,
  calendarBreatheAnim,
}) => {
  const [calendarDays, setCalendarDays] = React.useState<Array<{ day: number, month: 'current' | 'prev' | 'next', dateObj: Date }>>([]);

  const generateCalendarDays = useCallback((dateInMonth: Date) => {
    const year = dateInMonth.getFullYear();
    const month = dateInMonth.getMonth();
    const firstDayOfMonth = new Date(year, month, 1);
    const lastDayOfMonth = new Date(year, month + 1, 0);
    const daysInMonth = lastDayOfMonth.getDate();
    const startDayOfWeek = firstDayOfMonth.getDay();

    const days: Array<{ day: number, month: 'current' | 'prev' | 'next', dateObj: Date }> = [];
    const prevMonthLastDay = new Date(year, month, 0).getDate();

    for (let i = 0; i < startDayOfWeek; i++) {
      const day = prevMonthLastDay - startDayOfWeek + 1 + i;
      days.push({ day, month: 'prev', dateObj: new Date(year, month - 1, day) });
    }
    for (let i = 1; i <= daysInMonth; i++) {
      days.push({ day: i, month: 'current', dateObj: new Date(year, month, i) });
    }
    const totalCells = days.length > 35 ? 42 : 35;
    const remainingCells = totalCells - days.length;
    for (let i = 1; i <= remainingCells; i++) {
      days.push({ day: i, month: 'next', dateObj: new Date(year, month + 1, i) });
    }
    setCalendarDays(days);
  }, []);

  useEffect(() => {
    generateCalendarDays(currentDisplayMonth);
  }, [currentDisplayMonth, generateCalendarDays]);

  const handleDaySelectInternal = useCallback((dateObj: Date) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (dateObj < today) {
        Alert.alert("Data Inválida", "Não é possível selecionar uma data passada.");
        return;
    }
    onDaySelect(dateObj); // Chama a função passada via prop
  }, [onDaySelect]);

  const gradientColors = [
    'rgba(173, 216, 230, 0.15)',
    'rgba(135, 206, 250, 0.25)',
    'rgba(100, 149, 237, 0.35)',
    'rgba(65, 153, 225, 0.25)',
  ] as const;

  return (
    <Animated.View style={{
        transform: [
          { scale: Animated.multiply(calendarBreatheAnim, fadeAnim.interpolate({ inputRange: [0, 1], outputRange: [0.95, 1] })) } // Combine as escalas
        ],
        opacity: fadeAnim, // Aplica a opacidade também
    }}>
      <LinearGradient
        colors={gradientColors}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.calendarGridContainer}
      >
        <BlurView intensity={5} tint="light" style={styles.calendarBlur}>
          <View style={styles.calendarHeader}>
            <TouchableOpacity onPress={onPrevMonth} style={styles.monthChangeButton}>
              <Ionicons name="chevron-back" size={24} color="#435ee9ff" />
            </TouchableOpacity>
            <Text style={styles.monthTitle}>
              {MONTH_NAMES_PT[currentDisplayMonth.getMonth()]} {currentDisplayMonth.getFullYear()}
            </Text>
            <TouchableOpacity onPress={onNextMonth} style={styles.monthChangeButton}>
              <Ionicons name="chevron-forward" size={24} color="#435ee9ff" />
            </TouchableOpacity>
          </View>
          <View style={styles.calendarInnerContainer}>
            <View style={styles.dayNamesRow}>
              {DAY_NAMES_PT.map((dayName, index) => (
                <Animated.Text
                  key={dayName}
                  style={[
                    styles.dayNameText,
                    {
                      opacity: fadeAnim,
                      transform: [{
                        translateY: slideUpAnim.interpolate({
                          inputRange: [0, 50],
                          outputRange: [0, index * 5]
                        })
                      }]
                    }
                  ]}
                >
                  {dayName.slice(0, 3)}
                </Animated.Text>
              ))}
            </View>
            <View style={styles.calendarGrid}>
              {calendarDays.map((dayInfo, index) => {
                const isSelected = selectedDate.toDateString() === dayInfo.dateObj.toDateString() && dayInfo.month === 'current';
                const isPast = dayInfo.dateObj < new Date(new Date().setHours(0, 0, 0, 0)) && dayInfo.dateObj.toDateString() !== new Date().toDateString();
                const isWeekend = dayInfo.dateObj.getDay() === 0 || dayInfo.dateObj.getDay() === 6;

                return (
                  <TouchableOpacity
                    key={index}
                    style={[
                      styles.dayCell,
                      isSelected && styles.dayCellSelected,
                      {
                        transform: [{
                          scale: isSelected ? selectionAnim : 1
                        }]
                      }
                    ]}
                    onPress={() => dayInfo.month === 'current' && handleDaySelectInternal(dayInfo.dateObj)}
                    disabled={dayInfo.month !== 'current' || isPast}
                  >
                    {isSelected && (
                      <LinearGradient
                        colors={['#4285F4', '#2A72E7']}
                        style={styles.selectedDayGradient}
                      />
                    )}
                    <Text style={[
                      styles.dayText,
                      dayInfo.month !== 'current' && styles.dayTextNotInMonth,
                      isSelected && styles.dayTextSelected,
                      isPast && dayInfo.month === 'current' && styles.dayTextPast,
                      !isSelected && !isPast && dayInfo.month === 'current' && (isWeekend ? styles.dayTextCurrentWeekend : styles.dayTextCurrentWeekday),
                    ]}>
                      {dayInfo.day}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        </BlurView>
      </LinearGradient>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  calendarGridContainer: {
    borderRadius: 16,
    marginHorizontal: 30,
    marginVertical: 50,
    marginTop: 25,
    overflow: 'hidden',
    shadowColor: 'rgb(33, 34, 34)',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 5,
    elevation: 8,
  },
  calendarBlur: {
    paddingVertical: 25,
    paddingHorizontal: 15,
  },
  calendarHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
    paddingHorizontal: 10,
  },
  monthTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  monthChangeButton: {
    padding: 5,
  },
  calendarInnerContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 12,
    padding: 10,
  },
  dayNamesRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 15,
    paddingHorizontal: 5,
  },
  dayNameText: {
    width: FIXED_DAY_CELL_SIZE,
    textAlign: 'center',
    fontSize: 10,
    color: 'rgba(23, 23, 24, 0.7)',
    fontWeight: '600',
    letterSpacing: 0.5,
  },
  calendarGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    paddingHorizontal: 5,
  },
  dayCell: {
    width: FIXED_DAY_CELL_SIZE,
    height: FIXED_DAY_CELL_SIZE,
    justifyContent: 'center',
    alignItems: 'center',
    marginVertical: 6,
    borderRadius: FIXED_DAY_CELL_SIZE / 2,
    position: 'relative',
  },
  dayCellSelected: {
    shadowColor: '#2A72E7',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  selectedDayGradient: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderRadius: FIXED_DAY_CELL_SIZE / 2,
  },
  dayText: {
    fontSize: 13,
    fontWeight: '500',
    zIndex: 1,
  },
  dayTextCurrentWeekday: {
    color: '#333333',
    fontWeight: '600',
  },
  dayTextCurrentWeekend: {
    color: '#2A72E7',
    fontWeight: '600',
  },
  dayTextNotInMonth: {
    color: 'rgba(0,0,0,0.2)',
  },
  dayTextSelected: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  dayTextPast: {
    color: '#AAAAAA',
    textDecorationLine: 'line-through',
  },
});

export default ScheduleCalendar;
