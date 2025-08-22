import React, { useCallback, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated, Easing, Alert, Dimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
// import { BlurView } from 'expo-blur'; // Removido para um fundo mais limpo
import { Ionicons } from '@expo/vector-icons';

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

    // Dias do mês anterior
    for (let i = 0; i < startDayOfWeek; i++) {
      const day = prevMonthLastDay - startDayOfWeek + 1 + i;
      days.push({ day, month: 'prev', dateObj: new Date(year, month - 1, day) });
    }
    // Dias do mês atual
    for (let i = 1; i <= daysInMonth; i++) {
      days.push({ day: i, month: 'current', dateObj: new Date(year, month, i) });
    }
    // Dias do próximo mês
    const totalCells = days.length > 35 ? 42 : 35; // Garante 6 linhas se necessário
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
    // Animação de seleção (pop-in)
    selectionAnim.setValue(0); // Inicia de 0 para um efeito de "pop-in"
    Animated.spring(selectionAnim, {
        toValue: 1, // Anima para o tamanho normal
        friction: 5, // Controla o "bounciness"
        tension: 80, // Controla a velocidade
        useNativeDriver: true,
    }).start();

    onDaySelect(dateObj);
  }, [onDaySelect, selectionAnim]);

  // A cor do gradiente externo foi removida, o background do calendário será sólido branco.

  const today = new Date();
  today.setHours(0, 0, 0, 0); // Normaliza a data de hoje para comparação

  return (
    <Animated.View style={{ // Este Animated.View agora só lida com as animações de escala e opacidade
        transform: [
          { scale: Animated.multiply(calendarBreatheAnim, fadeAnim.interpolate({ inputRange: [0, 1], outputRange: [0.95, 1] })) }
        ],
        opacity: fadeAnim,
        // Removido calendarContainerShadow daqui. O estilo de card será aplicado pelo componente pai.
    }}>
      {/* O calendarGridContainer agora é o principal container visual do calendário */}
      <View style={styles.calendarGridContainer}>
        <View style={styles.calendarHeader}>
          <TouchableOpacity onPress={onPrevMonth} style={styles.monthChangeButton}>
            <Ionicons name="chevron-back" size={24} color="#333" /> {/* Cor mais escura para os ícones */}
          </TouchableOpacity>
          <Text style={styles.monthTitle}>
            {MONTH_NAMES_PT[currentDisplayMonth.getMonth()]} {currentDisplayMonth.getFullYear()}
          </Text>
          <TouchableOpacity onPress={onNextMonth} style={styles.monthChangeButton}>
            <Ionicons name="chevron-forward" size={24} color="#333" /> {/* Cor mais escura para os ícones */}
          </TouchableOpacity>
        </View>
        <View style={styles.calendarInnerContainer}> {/* Esta será a parte com fundo branco */}
          <View style={styles.dayNamesRow}>
            {DAY_NAMES_PT.map((dayName, index) => (
              <Text
                key={dayName}
                style={styles.dayNameText}
              >
                {dayName.slice(0, 1)} {/* Apenas a primeira letra como no exemplo da Play Store */}
              </Text>
            ))}
          </View>
          <View style={styles.calendarGrid}>
            {calendarDays.map((dayInfo, index) => {
              const isSelected = selectedDate.toDateString() === dayInfo.dateObj.toDateString() && dayInfo.month === 'current';
              const isPast = dayInfo.dateObj < today && dayInfo.dateObj.toDateString() !== today.toDateString();
              const isWeekend = dayInfo.dateObj.getDay() === 0 || dayInfo.dateObj.getDay() === 6;
              const isToday = dayInfo.dateObj.toDateString() === today.toDateString() && dayInfo.month === 'current';

              return (
                <TouchableOpacity
                  key={index}
                  style={[
                    styles.dayCell,
                    isToday && !isSelected && styles.dayCellToday, // Aplica estilo de hoje se não estiver selecionado
                    isSelected && styles.dayCellSelected, // Aplica estilo de selecionado
                    {
                      transform: [{
                        scale: isSelected ? selectionAnim : 1 // Aplica animação de seleção apenas se selecionado
                      }]
                    }
                  ]}
                  onPress={() => dayInfo.month === 'current' && handleDaySelectInternal(dayInfo.dateObj)}
                  disabled={dayInfo.month !== 'current' || isPast}
                >
                  <Text style={[
                    styles.dayText,
                    dayInfo.month !== 'current' && styles.dayTextNotInMonth,
                    isSelected && styles.dayTextSelected,
                    isPast && dayInfo.month === 'current' && styles.dayTextPast,
                    !isSelected && !isPast && dayInfo.month === 'current' && (isWeekend ? styles.dayTextCurrentWeekend : styles.dayTextCurrentWeekday),
                    isToday && !isSelected && styles.dayTextToday, // Aplica cor do texto de hoje se não estiver selecionado
                  ]}>
                    {dayInfo.day}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>
      </View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  // calendarContainerShadow removido daqui, pois o estilo de card será aplicado pelo componente pai
  calendarGridContainer: {
    borderRadius: 16, // Mantém este borderRadius para o conteúdo interno do calendário
    // Removido marginHorizontal, marginVertical e marginTop daqui. Eles serão gerenciados pelo componente pai.
    backgroundColor: '#FFFFFF', // Fundo branco sólido para o conteúdo do calendário
    overflow: 'hidden', // Garante que o conteúdo respeite o raio da borda
    paddingVertical: 25, // Mantém o padding interno original
    paddingHorizontal: 15, // Mantém o padding interno original
  },
  calendarHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
    // paddingHorizontal removido, herda do calendarGridContainer
    paddingTop: 0,
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
    borderRadius: 12,
    // paddingHorizontal removido, herda do calendarGridContainer
    paddingBottom: 0,
  },
  dayNamesRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 10,
    paddingHorizontal: 0,
  },
  dayNameText: {
    width: FIXED_DAY_CELL_SIZE,
    textAlign: 'center',
    fontSize: 12,
    color: '#999',
    fontWeight: 'normal',
    letterSpacing: 0,
  },
  calendarGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    paddingHorizontal: 0,
  },
  dayCell: {
    width: FIXED_DAY_CELL_SIZE,
    height: FIXED_DAY_CELL_SIZE,
    justifyContent: 'center',
    alignItems: 'center',
    marginVertical: 4,
    borderRadius: FIXED_DAY_CELL_SIZE / 2,
  },
  dayCellSelected: {
    backgroundColor: '#2A72E7',
    shadowColor: '#2A72E7',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  dayCellToday: {
    backgroundColor: '#E0F2F1',
  },
  dayText: {
    fontSize: 15,
    fontWeight: '500',
    zIndex: 1,
  },
  dayTextCurrentWeekday: {
    color: '#333333',
    fontWeight: 'normal',
  },
  dayTextCurrentWeekend: {
    color: '#2A72E7',
    fontWeight: 'normal',
  },
  dayTextNotInMonth: {
    color: 'rgba(0,0,0,0.15)',
  },
  dayTextSelected: {
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
  dayTextPast: {
    color: '#AAAAAA',
    textDecorationLine: 'line-through',
  },
  dayTextToday: {
    color: '#00BFA5',
    fontWeight: 'bold',
  },
});

export default ScheduleCalendar;