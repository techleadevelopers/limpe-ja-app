// ./app/(client)/bookings/components/schedule/CalendarGrid.tsx
import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Dimensions, Platform } from 'react-native';

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

// Define um tamanho fixo para as células dos dias para melhor controle visual
const FIXED_DAY_CELL_SIZE = 40; // Tamanho de 40x40 pixels para cada célula

export default function CalendarGrid({ calendarDays, selectedDate, onDaySelect, DAY_NAMES_PT }: CalendarGridProps) {
    return (
        <View style={styles.calendarGridContainer}>
            <View style={styles.dayNamesRow}>
                {DAY_NAMES_PT.map(dayName => (
                    // Exibe apenas as 3 primeiras letras do nome do dia (ex: "Dom", "Seg")
                    <Text key={dayName} style={styles.dayNameText}>{dayName.slice(0, 3)}</Text>
                ))}
            </View>
            <View style={styles.calendarGrid}>
                {calendarDays.map((dayInfo, index) => {
                    const isSelected = selectedDate.toDateString() === dayInfo.dateObj.toDateString() && dayInfo.month === 'current';
                    const isPast = dayInfo.dateObj < new Date(new Date().setHours(0, 0, 0, 0)) && dayInfo.dateObj.toDateString() !== new Date().toDateString();
                    
                    // Determina se o dia é um fim de semana (Domingo = 0, Sábado = 6)
                    const isWeekend = dayInfo.dateObj.getDay() === 0 || dayInfo.dateObj.getDay() === 6;

                    return (
                        <TouchableOpacity
                            key={index}
                            style={[
                                styles.dayCell,
                                isSelected && styles.dayCellSelected, // Aplica o estilo de seleção apenas quando selecionado
                            ]}
                            onPress={() => dayInfo.month === 'current' && onDaySelect(dayInfo.dateObj)}
                            disabled={dayInfo.month !== 'current' || isPast} // Desabilita dias de outros meses e dias passados
                        >
                            <Text style={[
                                styles.dayText,
                                dayInfo.month !== 'current' && styles.dayTextNotInMonth, // Cor para dias de outros meses
                                isSelected && styles.dayTextSelected, // Cor para o dia selecionado
                                isPast && dayInfo.month === 'current' && styles.dayTextPast, // Cor para dias passados do mês atual
                                // Cor para dias do mês atual não selecionados e não passados
                                !isSelected && !isPast && dayInfo.month === 'current' && (isWeekend ? styles.dayTextCurrentWeekend : styles.dayTextCurrentWeekday),
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
        backgroundColor: '#fff',
        borderRadius: 15,
        paddingVertical: 15,
        paddingHorizontal: 15,
        marginHorizontal: 15,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08,
        shadowRadius: 5,
        elevation: 5,
    },
    dayNamesRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 10,
    },
    dayNameText: {
        width: FIXED_DAY_CELL_SIZE, // Garante que o nome do dia tenha a mesma largura da célula
        textAlign: 'center',
        fontSize: 9,
        color: '#999999', // Cor mais clara para os nomes dos dias, como na imagem
        fontWeight: 'normal',
    },
    calendarGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'space-between', // Distribui as células uniformemente na linha
    },
    dayCell: {
        width: FIXED_DAY_CELL_SIZE,
        height: FIXED_DAY_CELL_SIZE,
        justifyContent: 'center',
        alignItems: 'center',
        marginVertical: 4, // Espaçamento vertical entre as linhas de dias
        // Removido marginHorizontal para que justifyContent: 'space-between' funcione melhor
        // A borda arredondada (circular) e o background são aplicados APENAS em dayCellSelected
    },
    dayCellSelected: {
        backgroundColor: '#2A72E7', // Fundo azul para o dia selecionado
        borderRadius: FIXED_DAY_CELL_SIZE / 2, // Torna a célula circular apenas quando selecionada
    },
    dayText: {
        // Estilo base, será sobrescrito pelos estilos mais específicos abaixo
        fontSize: 10,
        fontWeight: '500',
    },
    dayTextCurrentWeekday: {
        color: '#333333', // Cor para dias de semana do mês atual, não selecionados
    },
    dayTextCurrentWeekend: {
        color: '#2A72E7', // Cor azul claro para fins de semana do mês atual, não selecionados, como na imagem
    },
    dayTextNotInMonth: {
        color: 'rgba(0,0,0,0.2)', // Cor muito clara para dias de meses adjacentes, quase transparente como na imagem
    },
    dayTextSelected: {
        color: '#FFFFFF', // Texto branco para o dia selecionado
        fontWeight: 'bold',
    },
    dayTextPast: {
        color: '#AAAAAA', // Cor para dias passados
        textDecorationLine: 'line-through',
    },
});