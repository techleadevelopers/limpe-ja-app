import React, { useCallback, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated, Easing, Alert } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { AppColors, AppShadows } from '../../../../constants/appStyles'; // Importe AppColors e AppShadows

const MONTH_PT = ["Janeiro","Fevereiro","Março","Abril","Maio","Junho","Julho","Agosto","Setembro","Outubro","Novembro","Dezembro"];
const DAY_PT = ["DOM", "SEG", "TER", "QUA", "QUI", "SEX", "SÁB"];
const CELL = 40;

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
  currentDisplayMonth, onPrevMonth, onNextMonth, selectedDate, onDaySelect,
  fadeAnim, slideUpAnim, selectionAnim, calendarBreatheAnim,
}) => {
  const [days, setDays] = React.useState<Array<{ day: number, month: 'current' | 'prev' | 'next', dateObj: Date }>>([]);

  // Animações para os botões de navegação de mês
  const prevMonthPressAnim = useRef(new Animated.Value(1)).current;
  const nextMonthPressAnim = useRef(new Animated.Value(1)).current;

  const onPressInMonthNav = (animValue: Animated.Value) => {
    Animated.spring(animValue, {
      toValue: 0.9,
      useNativeDriver: true,
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
    const arr: any[] = [];
    for (let i = 0; i < startW; i++) arr.push({ day: prevLast - startW + 1 + i, month: 'prev', dateObj: new Date(y, m - 1, prevLast - startW + 1 + i) });
    for (let i = 1; i <= len; i++) arr.push({ day: i, month: 'current', dateObj: new Date(y, m, i) });
    const total = arr.length > 35 ? 42 : 35;
    for (let i = 1; i <= total - arr.length; i++) arr.push({ day: i, month: 'next', dateObj: new Date(y, m + 1, i) });
    setDays(arr);
  }, []);

  useEffect(() => { makeDays(currentDisplayMonth); }, [currentDisplayMonth, makeDays]);

  const onPick = useCallback((dateObj: Date) => {
    const today = new Date(); today.setHours(0,0,0,0);
    if (dateObj < today) { Alert.alert('Data Inválida','Não é possível selecionar uma data passada.'); return; }
    selectionAnim.setValue(0);
    Animated.spring(selectionAnim, { toValue: 1, friction: 5, tension: 80, useNativeDriver: true }).start();
    onDaySelect(dateObj);
  }, [onDaySelect, selectionAnim]);

  const today = new Date(); today.setHours(0,0,0,0);

  return (
    <Animated.View style={{ transform: [{ scale: Animated.multiply(calendarBreatheAnim, fadeAnim.interpolate({ inputRange: [0,1], outputRange: [0.95,1] })) }], opacity: fadeAnim }}>
      <View style={s.card}>
        <View style={s.header}>
          <TouchableOpacity
            onPress={onPrevMonth}
            style={[s.iconBtn, { transform: [{ scale: prevMonthPressAnim }] }]}
            onPressIn={() => onPressInMonthNav(prevMonthPressAnim)}
            onPressOut={() => onPressOutMonthNav(prevMonthPressAnim)}
          >
            <Ionicons name="chevron-back" size={22} color={AppColors.textBody} />
          </TouchableOpacity>
          <Text style={s.month}>{MONTH_PT[currentDisplayMonth.getMonth()]} {currentDisplayMonth.getFullYear()}</Text>
          <TouchableOpacity
            onPress={onNextMonth}
            style={[s.iconBtn, { transform: [{ scale: nextMonthPressAnim }] }]}
            onPressIn={() => onPressInMonthNav(nextMonthPressAnim)}
            onPressOut={() => onPressOutMonthNav(nextMonthPressAnim)}
          >
            <Ionicons name="chevron-forward" size={22} color={AppColors.textBody} />
          </TouchableOpacity>
        </View>

        <View style={s.daysHead}>
          {DAY_PT.map((d) => <Text key={d} style={s.dayHeadTxt}>{d[0]}</Text>)}
        </View>

        <View style={s.grid}>
          {days.map((info, i) => {
            const isSel = selectedDate.toDateString() === info.dateObj.toDateString() && info.month === 'current';
            const isPast = info.dateObj < today && info.dateObj.toDateString() !== today.toDateString();
            const isWeekend = [0,6].includes(info.dateObj.getDay());
            const isToday = info.dateObj.toDateString() === today.toDateString() && info.month === 'current';
            return (
              <TouchableOpacity
                key={i}
                style={[
                  s.cell,
                  isToday && !isSel && s.cellToday,
                  isSel && s.cellSel,
                  { transform: [{ scale: isSel ? selectionAnim : 1 }] }
                ]}
                onPress={() => info.month === 'current' && onPick(info.dateObj)}
                disabled={info.month !== 'current' || isPast}
              >
                <Text style={[
                  s.cellTxt,
                  info.month !== 'current' && s.txtOut,
                  isSel && s.txtSel,
                  isPast && info.month === 'current' && s.txtPast,
                  !isSel && !isPast && info.month === 'current' && (isWeekend ? s.txtWeekend : s.txtWeek),
                  isToday && !isSel && s.txtToday
                ]}>
                  {info.day}
                </Text>
              </TouchableOpacity>
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
    paddingVertical: -10,
    paddingHorizontal: 25,
    marginHorizontal: 25,
    marginVertical: 10,
    marginTop: 14,
     ...AppShadows.medium, // Usando AppShadows
           
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
    marginTop: 20,
  },
  iconBtn: { padding: 6 },
  month: {
    fontSize: 17,
    fontWeight: '800',
    color: AppColors.textBody,
  },

  daysHead: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 10,
    
  },
  dayHeadTxt: {
    width: CELL,
    textAlign: 'center',
    fontSize: 14,
    color: AppColors.mediumGray,
    fontWeight: '600',
    
  },

  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    
  },
  cell: {
    width: CELL,
    height: CELL,
    borderRadius: CELL / 2,
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 5,
    
  },
  cellSel: {
    backgroundColor: AppColors.primaryInteractive,
    ...AppShadows.medium,
    borderWidth: 1.5,
    borderColor : '#45484b56',
  },
  cellToday: {
    backgroundColor: AppColors.backgroundNeutral,
  },

  cellTxt: { fontSize: 15, fontWeight: '600' },
  txtWeek: { color: AppColors.textBody },
  txtWeekend: { color: AppColors.primaryInteractive },
  txtOut: { color: AppColors.black + '16' },
  txtSel: { color: AppColors.white, fontWeight: '800' },
  txtPast: {
    color: AppColors.mediumGray,
    textDecorationLine: 'line-through',
  },
  txtToday: { color: AppColors.successStandard, fontWeight: '800' },
});


export default ScheduleCalendar;