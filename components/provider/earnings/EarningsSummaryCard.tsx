import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router'; // Importa o useRouter
import React, { useRef } from 'react';
import { Animated, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { shadow, textFix } from '../../../_shared/ui/parity';
import { PROVIDER_ROUTES } from '../../../constants/routes'; // Importa PROVIDER_ROUTES
import { formatDate } from '../../../utils/helpers'; // Certifique-se de que o caminho está correto

// Importa a tipagem do Dashboard para o resumo
import { EarningsResponseDto, ProviderDashboard } from '../../../types/backend/providers';

// DEFINIÇÕES DE CORES LOCAIS - ALINHADAS COM O TEMA DA DASHBOARD
const WHITE = '#FFFFFF'; // Branco
const ICON_PRIMARY = '#007AFF'; // Azul Primário (usado para o card principal)
const WARNING_YELLOW = '#FFC107'; // Amarelo para pendente (usado como WARNING_COLOR_SUMMARY)
const SUCCESS_GREEN = '#28A745'; // Verde para saque (usado como SUCCESS_COLOR_SUMMARY)
interface EarningsSummaryCardProps {
    dashboardData: ProviderDashboard | null;
    earningsData?: EarningsResponseDto | null;
    animation: Animated.Value;
    // onWithdrawalRequest: () => void; // Esta prop não é mais necessária
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

const EarningsSummaryCard: React.FC<EarningsSummaryCardProps> = ({ dashboardData, earningsData, animation }) => {
    const router = useRouter(); // Inicializa o router
    const availableForWithdrawal = earningsData?.availableForWithdrawal ?? 0;
    const pendingWithdrawals = earningsData?.pendingWithdrawals ?? 0;
    const displayedTotalEarnings =
        earningsData?.totalEarnings ?? dashboardData?.totalEarnings ?? 0;
    const canWithdraw = availableForWithdrawal > 0;

    const { scaleAnim, onPressIn, onPressOut } = useAnimatedTouch();

    return (
        <Animated.View style={[styles.summaryContainer, { opacity: animation, transform: [{ translateY: animation.interpolate({ inputRange: [0, 1], outputRange: [20, 0] }) }] }]}>
            <Text style={styles.summaryCardSubtitle} accessibilityLabel={`Informação atualizada em ${formatDate(new Date().toISOString(), { day: '2-digit', month: 'short' })}`}>
                        {formatDate(new Date().toISOString(), { day: '2-digit', month: 'short' })}
                    </Text>
            <Text style={styles.sectionTitle} accessibilityRole="header">Seus Ganhos</Text>
            <View style={styles.summaryGrid}>
                <View style={styles.summaryCard}>
                    <Ionicons name="wallet-outline" size={25} color={WHITE} accessibilityLabel="Ícone de saldo liberado" />
                    <Text style={styles.summaryCardTitle}>Saldo liberado</Text>
                    <Text style={styles.summaryCardValue} accessibilityLabel={`Saldo liberado de R$ ${availableForWithdrawal.toFixed(2).replace('.', ',')}`}>
                        R$ {availableForWithdrawal.toFixed(2).replace('.', ',')}
                    </Text>
                </View>
                <View style={styles.summaryCard}>
                    <Ionicons name="hourglass-outline" size={25} color={WARNING_YELLOW} accessibilityLabel="Ícone de saldo pendente" />
                    <Text style={styles.summaryCardTitle}>Saldo pendente</Text>
                    <Text style={styles.summaryCardValue} accessibilityLabel={`Saldo pendente de R$ ${pendingWithdrawals.toFixed(2).replace('.', ',')}`}>
                        R$ {pendingWithdrawals.toFixed(2).replace('.', ',')}
                    </Text>
                </View>
                <View style={styles.summaryCard}>
                    <Ionicons name="cash-outline" size={25} color={SUCCESS_GREEN} accessibilityLabel="Ícone de total acumulado" />
                    <Text style={styles.summaryCardTitle}>Total acumulado</Text>
                    <Text style={styles.summaryCardValue} accessibilityLabel={`Total acumulado de R$ ${displayedTotalEarnings.toFixed(2).replace('.', ',')}`}>
                        R$ {displayedTotalEarnings.toFixed(2).replace('.', ',')}
                    </Text>
                </View>
            </View>
            {/* Botão Solicitar Saque - Estilo do botão da Dashboard, mas com cor de sucesso */}
            <TouchableOpacity
                style={[
                    styles.withdrawalButton,
                    !canWithdraw && styles.withdrawalButtonDisabled,
                    { transform: [{ scale: scaleAnim }] }
                ]}
                onPress={() => {
                    router.push({
                        pathname: PROVIDER_ROUTES.WITHDRAW,
                        params: { availableForWithdrawal: availableForWithdrawal.toFixed(2) },
                    } as any);
                }}
                onPressIn={onPressIn}
                onPressOut={onPressOut}
                disabled={!canWithdraw}
                accessibilityRole="button"
                accessibilityLabel={
                    !canWithdraw
                        ? "Botão de solicitar saque desabilitado"
                        : `Solicitar saque de R$ ${availableForWithdrawal.toFixed(2).replace('.', ',')}`
                }
            >
                <Ionicons name="arrow-up-circle-outline" size={24} color={WHITE} />
                <Text style={styles.withdrawalButtonText}>Solicitar Saque</Text>
            </TouchableOpacity>
        </Animated.View>
    );
};

const styles = StyleSheet.create({
    sectionTitle: {
        ...textFix({ fontSize: 20, fontWeight: 'bold' }),
        color: WHITE,
        marginBottom: 15,
        marginTop: 10,
        textAlign: 'center',
        fontFamily: 'System'
    },
    summaryContainer: {
        backgroundColor: ICON_PRIMARY,
        borderRadius: 18,
        padding: 20,
        marginBottom: 20,
        ...shadow(3),
    },
    summaryGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'space-around', // Usar space-around para espaçamento
        marginBottom: 20,
    },
    summaryCard: {
        width: '30%',
        aspectRatio: 1,
        backgroundColor: 'rgba(255,255,255,0.2)',
        borderRadius: 12,
        padding: 10,
        marginBottom: 15,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.3)',
        ...shadow(1),
    },
    summaryCardTitle: {
        ...textFix({ fontSize: 10 }),
        color: 'rgba(255,255,255,0.7)',
        marginTop: 8,
        marginBottom: 5,
        textAlign: 'center',
        fontFamily: 'System'
    },
    summaryCardValue: {
        ...textFix({ fontSize: 18, fontWeight: 'bold' }),
        color: WHITE,
        textAlign: 'center',
        fontFamily: 'System'
    },
    summaryCardSubtitle: {
        ...textFix({ fontSize: 12 }),
        color: 'rgba(255,255,255,0.5)',
        marginTop: 2,
        textAlign: 'center',
        fontFamily: 'System'
    },
    withdrawalButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'rgba(255,255,255,0.2)',
        borderRadius: 25,
        paddingVertical: 12,
        ...shadow(2),
    },
    withdrawalButtonDisabled: {
        backgroundColor: 'rgba(255,255,255,0.1)', // Desabilitado ainda mais transparente
        opacity: 0.6,
        elevation: 0,
        shadowOpacity: 0,
    },
    withdrawalButtonText: {
        ...textFix({ fontSize: 16, fontWeight: '600' }),
        color: WHITE,
        marginHorizontal: 10,
        fontFamily: 'System'
    },
});

export default EarningsSummaryCard;
