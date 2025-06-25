// ./app/(client)/bookings/components/schedule/CalendarGrid.tsx
import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Dimensions } from 'react-native';

interface CalendarDayInfo {
    day: number;
    month: 'current' | 'prev' | 'next';
    dateObj: Date;
}

interface CalendarGridProps {
    calendarDays: CalendarDayInfo[];
    selectedDate: Date;
    onDaySelect: (dateObj: Date) => void;
    DAY_NAMES_PT: string[];
}

const SCREEN_WIDTH = Dimensions.get('window').width;

export default function CalendarGrid({ calendarDays, selectedDate, onDaySelect, DAY_NAMES_PT }: CalendarGridProps) {
    return (
        <View style={styles.calendarGridContainer}>
            <View style={styles.dayNamesRow}>
                {DAY_NAMES_PT.map(dayName => (
                    <Text key={dayName} style={styles.dayNameText}>{dayName}</Text>
                ))}
            </View>
            <View style={styles.calendarGrid}>
                {calendarDays.map((dayInfo, index) => {
                    const isSelected = selectedDate.toDateString() === dayInfo.dateObj.toDateString() && dayInfo.month === 'current';
                    const isPast = dayInfo.dateObj < new Date(new Date().setHours(0, 0, 0, 0)) && dayInfo.dateObj.toDateString() !== new Date().toDateString();
                    const isToday = dayInfo.dateObj.toDateString() === new Date().toDateString();

                    return (
                        <TouchableOpacity
                            key={index}
                            style={[
                                styles.dayCell,
                                dayInfo.month !== 'current' && styles.dayCellNotInMonth,
                                isSelected && styles.dayCellSelected,
                                isToday && !isSelected && styles.dayCellToday,
                            ]}
                            onPress={() => dayInfo.month === 'current' && onDaySelect(dayInfo.dateObj)}
                            disabled={dayInfo.month !== 'current' || isPast}
                        >
                            <Text style={[
                                styles.dayText,
                                dayInfo.month !== 'current' && styles.dayTextNotInMonth,
                                isSelected && styles.dayTextSelected,
                                isPast && dayInfo.month === 'current' && styles.dayTextPast,
                                isToday && !isSelected && styles.dayTextToday,
                            ]}>
                                {dayInfo.day}
                            </Text>
                        </TouchableOpacity>
                    );
                })}
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    calendarGridContainer: {
        paddingHorizontal: 10,
        marginTop: 15,
    },
    dayNamesRow: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        marginBottom: 10,
        // Mantido para alinhamento com dayNameText, mas o ajuste principal é no dayCell
        paddingHorizontal: (SCREEN_WIDTH - 20 - (7 * 40)) / 14,
    },
    dayNameText: {
        width: 40,
        textAlign: 'center',
        fontSize: 12,
        color: '#888888',
        fontWeight: '500',
    },
    calendarGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'space-around', // Alterado de 'flex-start' para 'space-around'
    },
    dayCell: {
        // Ajuste no cálculo da largura para garantir que 7 células caibam na linha
        width: (SCREEN_WIDTH - 20 - (6 * 6)) / 7, // SCREEN_WIDTH - padding total - (espaçamento entre celulas * numero de espaçamentos) / 7 dias
        height: 40,
        justifyContent: 'center',
        alignItems: 'center',
        margin: 3, // Margem para espaçamento entre as células
        borderRadius: 20,
    },
    dayCellNotInMonth: {},
    dayCellSelected: {
        backgroundColor: '#2A72E7',
    },
    dayCellToday: {
        borderColor: '#2A72E7',
        borderWidth: 1,
    },
    dayText: {
        fontSize: 15,
        color: '#333333',
    },
    dayTextNotInMonth: {
        color: '#CCCCCC',
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
        color: '#2A72E7',
        fontWeight: 'bold',
    },
});