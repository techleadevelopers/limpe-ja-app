// app/(provider)/earnings/components/EarningsSummaryCard.tsx
import React, { useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { formatDate } from '../../../../utils/helpers'; // Certifique-se de que o caminho está correto

// Importa a tipagem do Dashboard para o resumo
import { ProviderDashboard } from '../../../types/backend/providers';

// DEFINIÇÕES DE CORES LOCAIS (Para resolver o erro de forma direta)
const WHITE_SUMMARY = '#FFFFFF';
const PRIMARY_COLOR_SUMMARY = '#007AFF'; // Azul
const WARNING_COLOR_SUMMARY = '#FFC107'; // Amarelo para pendente
const SUCCESS_COLOR_SUMMARY = '#28A745'; // Verde para saque
const MUTED_TEXT_COLOR_SUMMARY = '#6C757D'; // Cinza
const BORDER_COLOR_SUMMARY = '#E9ECEF'; // Borda sutil
const BACKGROUND_COLOR_LIGHT_SUMMARY = '#F8F9FA'; // Fundo leve para cartões
const TEXT_COLOR_DARK_SUMMARY = '#212529'; // Preto quase total
const TEXT_COLOR_MUTED_SUBTITLE_SUMMARY = '#868E96'; // Cinza mais claro para detalhes

interface EarningsSummaryCardProps {
    dashboardData: ProviderDashboard | null;
    animation: Animated.Value;
    onWithdrawalRequest: () => void;
}

// Hook de animação para o botão de saque (reutilizado de earnings.tsx ou definido aqui)
const useAnimatedTouch = () => {
    const scaleAnim = useRef(new Animated.Value(1)).current;
    const onPressIn = () => {
        Animated.spring(scaleAnim, { toValue: 0.95, useNativeDriver: true, friction: 5 }).start();
    };
    const onPressOut = () => {
        Animated.spring(scaleAnim, { toValue: 1, useNativeDriver: true, friction: 5, tension: 40 }).start();
    };
    return { scaleAnim, onPressIn, onPressOut };
};

const EarningsSummaryCard: React.FC<EarningsSummaryCardProps> = ({ dashboardData, animation, onWithdrawalRequest }) => {
    const displayedTotalEarnings = dashboardData?.totalEarnings ?? 0;
    const displayedPendingWithdrawals = dashboardData?.pendingWithdrawals ?? 0;

    const { scaleAnim, onPressIn, onPressOut } = useAnimatedTouch();

    return (
        <Animated.View style={[styles.summaryContainer, { opacity: animation, transform: [{ translateY: animation.interpolate({ inputRange: [0, 1], outputRange: [20, 0] }) }] }]}>
            <Text style={styles.sectionTitle} accessibilityRole="header">Resumo Financeiro</Text>
            <View style={styles.summaryGrid}>
                <View style={styles.summaryCard}>
                    <Ionicons name="wallet-outline" size={30} color={PRIMARY_COLOR_SUMMARY} accessibilityLabel="Ícone de Saldo Total" />
                    <Text style={styles.summaryCardTitle}>Saldo Disponível</Text>
                    <Text style={styles.summaryCardValue} accessibilityLabel={`Seu saldo total é de ${displayedTotalEarnings.toFixed(2).replace('.', ',')} reais`}>
                        R$ {displayedTotalEarnings.toFixed(2).replace('.', ',')}
                    </Text>
                </View>
                <View style={styles.summaryCard}>
                    <Ionicons name="hourglass-outline" size={30} color={WARNING_COLOR_SUMMARY} accessibilityLabel="Ícone de Saque Pendente" />
                    <Text style={styles.summaryCardTitle}>Saque Pendente</Text>
                    <Text style={styles.summaryCardValue} accessibilityLabel={`Você tem ${displayedPendingWithdrawals.toFixed(2).replace('.', ',')} reais pendentes para saque`}>
                        R$ {displayedPendingWithdrawals.toFixed(2).replace('.', ',')}
                    </Text>
                </View>
                <View style={styles.summaryCard}>
                    <Ionicons name="cash-outline" size={30} color={SUCCESS_COLOR_SUMMARY} accessibilityLabel="Ícone de Ganhos Mês" />
                    <Text style={styles.summaryCardTitle}>Ganhos Mês</Text>
                    <Text style={styles.summaryCardValue} accessibilityLabel={`Seus ganhos este mês são de ${displayedTotalEarnings.toFixed(2).replace('.', ',')} reais`}>
                        R$ {displayedTotalEarnings.toFixed(2).replace('.', ',')}
                    </Text>
                    <Text style={styles.summaryCardSubtitle} accessibilityLabel={`Informação atualizada em ${formatDate(new Date().toISOString(), { day: '2-digit', month: 'short' })}`}>
                        {formatDate(new Date().toISOString(), { day: '2-digit', month: 'short' })}
                    </Text>
                </View>
            </View>
            <TouchableOpacity
                style={[
                    styles.withdrawalButton,
                    (displayedTotalEarnings === 0 || displayedPendingWithdrawals > 0) && styles.withdrawalButtonDisabled,
                    { transform: [{ scale: scaleAnim }] }
                ]}
                onPress={onWithdrawalRequest}
                onPressIn={onPressIn}
                onPressOut={onPressOut}
                disabled={displayedTotalEarnings === 0 || displayedPendingWithdrawals > 0}
                accessibilityRole="button"
                accessibilityLabel={displayedTotalEarnings === 0 || displayedPendingWithdrawals > 0 ? "Botão de solicitar saque desabilitado" : "Solicitar saque do saldo disponível"}
            >
                <Ionicons name="arrow-up-circle-outline" size={24} color={WHITE_SUMMARY} />
                <Text style={styles.withdrawalButtonText}>Solicitar Saque</Text>
            </TouchableOpacity>
        </Animated.View>
    );
};

const styles = StyleSheet.create({
    sectionTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: TEXT_COLOR_DARK_SUMMARY, // Usando constante local
        marginBottom: 15,
        marginTop: 10,
        fontFamily: 'System'
    },
    summaryContainer: {
        backgroundColor: WHITE_SUMMARY, // Usando constante local
        borderRadius: 12,
        padding: 20,
        marginBottom: 20,
        ...Platform.select({
            ios: { shadowColor: 'rgba(0,0,0,0.1)', shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.15, shadowRadius: 6 },
            android: { elevation: 4 },
        }),
    },
    summaryGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
        marginBottom: 20,
    },
    summaryCard: {
        width: '48%',
        backgroundColor: BACKGROUND_COLOR_LIGHT_SUMMARY, // Usando constante local
        borderRadius: 10,
        padding: 15,
        marginBottom: 15,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: BORDER_COLOR_SUMMARY, // Usando constante local
    },
    summaryCardTitle: {
        fontSize: 14,
        color: MUTED_TEXT_COLOR_SUMMARY, // Usando constante local
        marginTop: 8,
        marginBottom: 5,
        textAlign: 'center',
        fontFamily: 'System'
    },
    summaryCardValue: {
        fontSize: 22,
        fontWeight: 'bold',
        color: TEXT_COLOR_DARK_SUMMARY, // Usando constante local
        textAlign: 'center',
        fontFamily: 'System'
    },
    summaryCardSubtitle: {
        fontSize: 12,
        color: TEXT_COLOR_MUTED_SUBTITLE_SUMMARY, // Usando constante local
        marginTop: 2,
        textAlign: 'center',
        fontFamily: 'System'
    },
    withdrawalButton: {
        backgroundColor: SUCCESS_COLOR_SUMMARY, // Usando constante local
        borderRadius: 8,
        paddingVertical: 14,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        ...Platform.select({
            ios: { shadowColor: 'rgba(0,0,0,0.1)', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 6 },
            android: { elevation: 6 },
        }),
    },
    withdrawalButtonDisabled: {
        backgroundColor: '#A5D6A7', // Cor específica para disabled
        opacity: 0.6,
        elevation: 0,
        shadowOpacity: 0,
    },
    withdrawalButtonText: {
        color: WHITE_SUMMARY, // Usando constante local
        fontSize: 16,
        fontWeight: 'bold',
        marginLeft: 10,
        fontFamily: 'System'
    },
});

export default EarningsSummaryCard;