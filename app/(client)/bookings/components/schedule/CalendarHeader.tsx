import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Platform, Dimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
// LinearGradient e BlurView não são mais necessários
// import { LinearGradient } from 'expo-linear-gradient';
// import { BlurView } from 'expo-blur';

const SCREEN_WIDTH = Dimensions.get('window').width;

interface CalendarHeaderProps {
    currentDisplayMonth: Date;
    onPrevMonth: () => void;
    onNextMonth: () => void;
    routerBack: () => void;
    MONTH_NAMES_PT: string[];
}

const CalendarHeader: React.FC<CalendarHeaderProps> = ({
    currentDisplayMonth,
    onPrevMonth,
    onNextMonth,
    routerBack,
    MONTH_NAMES_PT,
}) => {
    return (
        <View style={styles.calendarHeaderContainer}>
            <View style={styles.headerContentWrapper}>
                <TouchableOpacity onPress={routerBack} style={styles.headerIcon}>
                    <Ionicons name="arrow-back" size={24} color="#2A72E7" /> {/* Cor azul normal */}
                </TouchableOpacity>
                <View style={styles.monthSelector}>
                    <TouchableOpacity onPress={onPrevMonth} style={styles.monthArrow}>
                        <Ionicons name="chevron-back" size={24} color="#2A72E7" /> {/* Cor azul normal */}
                    </TouchableOpacity>
                    <Text style={styles.monthYearText}>
                        {MONTH_NAMES_PT[currentDisplayMonth.getMonth()]} {currentDisplayMonth.getFullYear()}
                    </Text>
                    <TouchableOpacity onPress={onNextMonth} style={styles.monthArrow}>
                        <Ionicons name="chevron-forward" size={24} color="#2A72E7" /> {/* Cor azul normal */}
                    </TouchableOpacity>
                </View>
                <View style={{ width: 24 }} /> {/* Mantém o espaçamento à direita */}
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    calendarHeaderContainer: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 15,
        paddingTop: Platform.OS === 'ios' ? 50 : 50,
        paddingBottom: 25,
        position: 'relative',
        overflow: 'hidden',
        // --- REMOVIDO: backgroundColor e estilos de sombra ---
        backgroundColor: 'transparent', // Fundo transparente
        borderBottomLeftRadius: 0, // Remover border radius se não tiver fundo
        borderBottomRightRadius: 0, // Remover border radius se não tiver fundo
        // Removido shadowColor, shadowOffset, shadowOpacity, shadowRadius, elevation
        marginBottom: 1, // Mantido o marginBottom para espaçamento com o conteúdo abaixo
    },
    headerContentWrapper: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        width: '100%',
        position: 'absolute',
        top: Platform.OS === 'ios' ? 50 : 25,
        paddingHorizontal: 15,
        zIndex: 2,
    },
    headerIcon: {
        padding: 5,
        textShadowColor: 'transparent', // Remover sombra de texto
        textShadowOffset: { width: 0, height: 0 },
        textShadowRadius: 0,
    },
    monthSelector: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    monthArrow: {
        padding: 5,
        textShadowColor: 'transparent', // Remover sombra de texto
        textShadowOffset: { width: 0, height: 0 },
        textShadowRadius: 0,
    },
    monthYearText: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#2A72E7', // Cor azul normal/mais escura
        marginHorizontal: 15,
        textShadowColor: 'transparent', // Remover sombra de texto
        textShadowOffset: { width: 0, height: 0 },
        textShadowRadius: 0,
    },
});

export default CalendarHeader;