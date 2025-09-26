import React, { useCallback, useEffect, useRef, memo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated, Easing, Alert, Dimensions, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { AppColors, AppShadows } from '../../../../constants/appStyles';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const MONTH_PT = ["Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho", "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"];
const DAY_PT = ["DOM", "SEG", "TER", "QUA", "QUI", "SEX", "SÁB"];

// Definindo o padding horizontal do card e o margin horizontal das células
const CARD_PADDING_HORIZONTAL =35;
const CELL_MARGIN_HORIZONTAL = 0; // Margem entre as células (2px de cada lado = 4px de espaçamento total)

// Calculando o tamanho da célula dinamicamente
// Largura disponível = SCREEN_WIDTH - (padding do card * 2)
// Número total de margens horizontais entre 7 células = 6 * (CELL_MARGIN_HORIZONTAL * 2)
// CELL_SIZE = (Largura disponível - Total de margens) / 7
const CELL_SIZE = Math.floor((SCREEN_WIDTH - (CARD_PADDING_HORIZONTAL * 2) - (CELL_MARGIN_HORIZONTAL * 2 * 6)) / 8);

interface DayInfo {
  day: number;
  month: 'current' | 'prev' | 'next';
  dateObj: Date;
}

interface DayCellProps {
  info: DayInfo;
  isSel: boolean;
  isPast: boolean;
  isWeekend: boolean;
  isToday: boolean;
  selectionAnim: Animated.Value;
  onPick: (dateObj: Date) => void;
}

// Componente de célula otimizado com React.memo
const DayCell: React.FC<DayCellProps> = memo(({ info, isSel, isPast, isWeekend, isToday, selectionAnim, onPick }) => {
  const cellScale = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (isSel) {
      cellScale.setValue(0.8); // Inicia menor para animar para 1
      Animated.spring(cellScale, {
        toValue: 1,
        friction: 5,
        tension: 80,
        useNativeDriver: true,
      }).start();
    } else {
      cellScale.setValue(1); // Garante que a célula não selecionada esteja em escala normal
    }
  }, [isSel]);


  const handlePress = useCallback(() => {
    if (info.month === 'current' && !isPast) {
      onPick(info.dateObj);
    }
  }, [info, isPast, onPick]);

  const accessibilityLabel = `${info.day} de ${MONTH_PT[info.dateObj.getMonth()]} de ${info.dateObj.getFullYear()}. ${isSel ? 'Selecionado. ' : ''}${isToday ? 'Hoje. ' : ''}${isPast ? 'Passado. ' : ''}`;

  return (
    <TouchableOpacity
      key={info.dateObj.toISOString()} // Usar a data completa como key
      style={[
        s.cell,
        isToday && !isSel && s.cellToday,
        isSel && s.cellSel,
        { transform: [{ scale: isSel ? cellScale : 1 }] } // Usar a animação local da célula
      ]}
      onPress={handlePress}
      disabled={info.month !== 'current' || isPast}
      accessibilityLabel={accessibilityLabel}
      accessible={true}
    >
      <Text style={[
        s.cellTxt,
        info.month !== 'current' && s.txtOut,
        isSel && s.txtSel,
        isPast && info.month === 'current' && s.txtPast,
        // ALTERAÇÃO AQUI: txtWeekend agora usa AppColors.primaryInteractive
        !isSel && !isPast && info.month === 'current' && (isWeekend ? s.txtWeekend : s.txtWeek),
        isToday && !isSel && s.txtToday
      ]}>
        {info.day}
      </Text>
    </TouchableOpacity>
  );
});


interface ScheduleCalendarProps {
  currentDisplayMonth: Date;
  onPrevMonth: () => void;
  onNextMonth: () => void;
  selectedDate: Date;
  onDaySelect: (date: Date) => void;
  fadeAnim: Animated.Value;
  slideUpAnim: Animated.Value;
  selectionAnim: Animated.Value; // Mantido para compatibilidade, mas a animação de seleção agora é local na célula
  calendarBreatheAnim: Animated.Value;
}

const ScheduleCalendar: React.FC<ScheduleCalendarProps> = ({
  currentDisplayMonth, onPrevMonth, onNextMonth, selectedDate, onDaySelect,
  fadeAnim, slideUpAnim, calendarBreatheAnim,
}) => {
  const [days, setDays] = React.useState<Array<DayInfo>>([]);

  // Animações para os botões de navegação de mês
  const prevMonthPressAnim = useRef(new Animated.Value(1)).current;
  const nextMonthPressAnim = useRef(new Animated.Value(1)).current;

  const onPressInMonthNav = (animValue: Animated.Value) => {
    Animated.spring(animValue, {
      toValue: 0.9,
      useNativeDriver: true,
      friction: 3,
      tension: 40,
    }).start();
  };

  const onPressOutMonthNav = (animValue: Animated.Value) => {
    Animated.spring(animValue, {
      toValue: 1,
      friction: 3,
      tension: 40,
      useNativeDriver: true,
    }).start();
  };

  const makeDays = useCallback((d: Date) => {
    const y = d.getFullYear(), m = d.getMonth();
    const first = new Date(y, m, 1), last = new Date(y, m + 1, 0);
    const len = last.getDate(), startW = first.getDay();
    const prevLast = new Date(y, m, 0).getDate();
    const arr: DayInfo[] = []; // Especificar o tipo do array
    for (let i = 0; i < startW; i++) arr.push({ day: prevLast - startW + 1 + i, month: 'prev', dateObj: new Date(y, m - 1, prevLast - startW + 1 + i) });
    for (let i = 1; i <= len; i++) arr.push({ day: i, month: 'current', dateObj: new Date(y, m, i) });
    const total = arr.length > 35 ? 42 : 35;
    for (let i = 1; i <= total - arr.length; i++) arr.push({ day: i, month: 'next', dateObj: new Date(y, m + 1, i) });
    setDays(arr);
  }, []);

  useEffect(() => { makeDays(currentDisplayMonth); }, [currentDisplayMonth, makeDays]);

  const onPick = useCallback((dateObj: Date) => {
    const today = new Date(); today.setHours(0, 0, 0, 0);
    if (dateObj < today) { Alert.alert('Data Inválida', 'Não é possível selecionar uma data passada.'); return; }
    onDaySelect(dateObj);
  }, [onDaySelect]);

  const today = new Date(); today.setHours(0, 0, 0, 0);

  return (
    <Animated.View style={{
      transform: [{
        scale: Animated.multiply(
          calendarBreatheAnim,
          fadeAnim.interpolate({ inputRange: [0, 1], outputRange: [0.95, 1] })
        )
      }],
      opacity: fadeAnim
    }}>
      <View style={s.card}>
        <View style={s.header}>
          <TouchableOpacity
            onPress={onPrevMonth}
            style={[s.iconBtn, { transform: [{ scale: prevMonthPressAnim }] }]}
            onPressIn={() => onPressInMonthNav(prevMonthPressAnim)}
            onPressOut={() => onPressOutMonthNav(prevMonthPressAnim)}
            accessibilityLabel={`Mês anterior, ${MONTH_PT[(currentDisplayMonth.getMonth() - 1 + 12) % 12]}`}
            accessible={true}
          >
            <Ionicons name="chevron-back" size={22} color={AppColors.textBody} />
          </TouchableOpacity>
          <Text style={s.month} accessibilityRole="header">
            {MONTH_PT[currentDisplayMonth.getMonth()]} {currentDisplayMonth.getFullYear()}
          </Text>
          <TouchableOpacity
            onPress={onNextMonth}
            style={[s.iconBtn, { transform: [{ scale: nextMonthPressAnim }] }]}
            onPressIn={() => onPressInMonthNav(nextMonthPressAnim)}
            onPressOut={() => onPressOutMonthNav(nextMonthPressAnim)}
            accessibilityLabel={`Próximo mês, ${MONTH_PT[(currentDisplayMonth.getMonth() + 1) % 12]}`}
            accessible={true}
          >
            <Ionicons name="chevron-forward" size={22} color={AppColors.textBody} />
          </TouchableOpacity>
        </View>

        <View style={s.daysHead}>
          {DAY_PT.map((d, index) => (
            <Text key={d} style={[s.dayHeadTxt, index === 0 || index === 6 ? s.dayHeadWeekend : null]}>
              {d[0]}
            </Text>
          ))}
        </View>

        <View style={s.grid}>
          {days.map((info) => {
            const isSel = selectedDate.toDateString() === info.dateObj.toDateString() && info.month === 'current';
            const isPast = info.dateObj < today && info.dateObj.toDateString() !== today.toDateString();
            const isWeekend = [0, 6].includes(info.dateObj.getDay());
            const isToday = info.dateObj.toDateString() === today.toDateString() && info.month === 'current';
            return (
              <DayCell
                key={info.dateObj.toISOString()} // Chave única para cada célula
                info={info}
                isSel={isSel}
                isPast={isPast}
                isWeekend={isWeekend}
                isToday={isToday}
                selectionAnim={fadeAnim} // Usando fadeAnim como placeholder, a animação de scale é interna ao DayCell
                onPick={onPick}
              />
            );
          })}
        </View>
      </View>
    </Animated.View>
  );
};

const s = StyleSheet.create({
  card: {
    backgroundColor: AppColors.white,
    borderRadius: 28,
    paddingVertical: 0,
    paddingHorizontal: CARD_PADDING_HORIZONTAL, // Usando a constante
    marginHorizontal: 35,
    marginVertical: 10,
    marginTop: 22,
    ...AppShadows.medium, // Adicionado sombra para o card
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
    marginTop: 20,
  },
  iconBtn: {
    padding: 22,
    width: 20, // Aumentado para área de toque
    height: 40, // Aumentado para área de toque
    justifyContent: 'center',
    alignItems: 'center',
  },
  month: {
    fontSize: 17,
    fontWeight: '800',
    color: AppColors.textBody,
  },

  daysHead: {
    flexDirection: 'row',
    justifyContent: 'center', // Centralizado
    marginBottom: 5,
  },
  dayHeadTxt: {
    width: CELL_SIZE + (CELL_MARGIN_HORIZONTAL * 0), // Largura da célula + margens
    textAlign: 'center',
    fontSize: 14,
    color: AppColors.mediumGray,
    fontWeight: '500',
  },
  dayHeadWeekend: {
    color: AppColors.primaryInteractive, // Cor para dias da semana do fim de semana
  },

  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center', // Alterado para 'center'
  },
  cell: {
    width: CELL_SIZE,
    height: CELL_SIZE,
    borderRadius: CELL_SIZE / 2,
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 3,
    marginHorizontal: -2, // Adicionado marginHorizontal
  },
  cellSel: {
    backgroundColor: AppColors.primaryInteractive,
    ...AppShadows.small, // Sombra para célula selecionada
    borderWidth: 1.5,
    borderColor: AppColors.primaryDark, // Cor da borda mais escura
  },
  cellToday: {
    backgroundColor: AppColors.backgroundNeutral,
    borderWidth: 1,
    borderColor: AppColors.lightGray,
  },

  cellTxt: { fontSize: 16.5, fontWeight: '600' },
  txtWeek: { color: AppColors.textBody },
  txtWeekend: { color: AppColors.primaryInteractive }, // ALTERAÇÃO AQUI: De AppColors.errorRed para AppColors.primaryInteractive
  txtOut: {
    color: AppColors.mediumGray + '80', // Mais visível que '16', mas ainda sutil
    opacity: 0.6, // Adicionado opacidade para sutileza
  },
  txtSel: { color: AppColors.white, fontWeight: '800' },
  txtPast: {
    color: AppColors.mediumGray + 'B0', // Um pouco mais escuro para contraste
    textDecorationLine: 'line-through',
    opacity: 0.7, // Adicionado opacidade para sutileza
  },
  txtToday: { color: AppColors.successStandard, fontWeight: '800' },
});


export default ScheduleCalendar;