// app/(provider)/earnings/components/EarningsSummaryCard.tsx
import { Ionicons } from '@expo/vector-icons';
import React, { useRef } from 'react';
import { Animated, Platform, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { formatDate } from '../../../utils/helpers'; // Certifique-se de que o caminho está correto

// Importa a tipagem do Dashboard para o resumo
import { ProviderDashboard } from '../../../types/backend/providers';

// DEFINIÇÕES DE CORES LOCAIS - ALINHADAS COM O TEMA DA DASHBOARD
const WHITE = '#FFFFFF'; // Branco
const ICON_PRIMARY = '#007AFF'; // Azul Primário (usado para o card principal)
const WARNING_YELLOW = '#FFC107'; // Amarelo para pendente (usado como WARNING_COLOR_SUMMARY)
const SUCCESS_GREEN = '#28A745'; // Verde para saque (usado como SUCCESS_COLOR_SUMMARY)
const TEXT_DARK = '#1A2538'; // Texto escuro
const TEXT_MUTED = '#7A8599'; // Texto mutado
const BACKGROUND_ALT = '#F8F9FD'; // Fundo alternativo
const SHADOW_COLOR_SECTION = 'rgba(0, 0, 0, 0.1)'; // Sombra para seções
const SHADOW_COLOR_CARD = 'rgba(0, 0, 0, 0.06)'; // Sombra para cartões pequenos
const BORDER_SUBTLE = 'rgba(0,0,0,0.08)'; // Borda sutil

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
            <Text style={styles.summaryCardSubtitle} accessibilityLabel={`Informação atualizada em ${formatDate(new Date().toISOString(), { day: '2-digit', month: 'short' })}`}>
                        {formatDate(new Date().toISOString(), { day: '2-digit', month: 'short' })}
                    </Text>
            <Text style={styles.sectionTitle} accessibilityRole="header">Resumo Financeiro</Text>
            <View style={styles.summaryGrid}>
                {/* Saldo Disponível */}
                <View style={styles.summaryCard}>
                    <Ionicons name="wallet-outline" size={25} color={WHITE} accessibilityLabel="Ícone de Saldo Total" /> {/* Ícone branco */}
                    <Text style={styles.summaryCardTitle}>Saldo Disponível</Text> {/* Título branco */}
                    <Text style={styles.summaryCardValue} accessibilityLabel={`Seu saldo total é de ${displayedTotalEarnings.toFixed(2).replace('.', ',')} reais`}>
                        R$ {displayedTotalEarnings.toFixed(2).replace('.', ',')}
                    </Text>
                </View>
                {/* Saque Pendente */}
                <View style={styles.summaryCard}>
                    <Ionicons name="hourglass-outline" size={25} color={WARNING_YELLOW} accessibilityLabel="Ícone de Saque Pendente" />
                    <Text style={styles.summaryCardTitle}>Saque Pendente</Text> {/* Título branco */}
                    <Text style={styles.summaryCardValue} accessibilityLabel={`Você tem ${displayedPendingWithdrawals.toFixed(2).replace('.', ',')} reais pendentes para saque`}>
                        R$ {displayedPendingWithdrawals.toFixed(2).replace('.', ',')}
                    </Text>
                </View>
                {/* Ganhos Mês */}
                <View style={styles.summaryCard}>
                    <Ionicons name="cash-outline" size={25} color={SUCCESS_GREEN} accessibilityLabel="Ícone de Ganhos Mês" />
                    <Text style={styles.summaryCardTitle}>Ganhos Mês</Text> {/* Título branco */}
                    <Text style={styles.summaryCardValue} accessibilityLabel={`Seus ganhos este mês são de ${displayedTotalEarnings.toFixed(2).replace('.', ',')} reais`}>
                        R$ {displayedTotalEarnings.toFixed(2).replace('.', ',')}
                    </Text>
                    
                </View>
                
            </View>
            {/* Botão Solicitar Saque - Estilo do botão da Dashboard, mas com cor de sucesso */}
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
                <Ionicons name="arrow-up-circle-outline" size={24} color={WHITE} />
                <Text style={styles.withdrawalButtonText}>Solicitar Saque</Text>
            </TouchableOpacity>
        </Animated.View>
    );
};

const styles = StyleSheet.create({
    sectionTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: WHITE, // Título principal do card azul deve ser branco
        marginBottom: 15,
        marginTop: 10,
        textAlign: 'center', // Centralizar o título
        fontFamily: 'System'
    },
    summaryContainer: {
        backgroundColor: ICON_PRIMARY, // Fundo azul primário
        borderRadius: 18, // Bordas mais arredondadas como na dashboard
        padding: 20,
        marginBottom: 20,
        ...Platform.select({
            ios: { shadowColor: SHADOW_COLOR_SECTION, shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.1, shadowRadius: 10 }, // Sombra maior
            android: { elevation: 10 },
        }),
    },
    summaryGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'space-around', // Usar space-around para espaçamento
        marginBottom: 20,
    },
    summaryCard: {
        width: '30%', // Para 3 itens por linha, similar às ações rápidas da dashboard
        aspectRatio: 1, // Manter proporção quadrada
        backgroundColor: 'rgba(255,255,255,0.2)', // Fundo semi-transparente branco para os cards internos
        borderRadius: 12, // Bordas arredondadas
        padding: 10, // Menor padding para caber
        marginBottom: 15,
        alignItems: 'center',
        justifyContent: 'center', // Centralizar conteúdo
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.3)', // Borda mais sutil no fundo azul
    },
    summaryCardTitle: {
        fontSize: 10, // Fonte menor para caber
        color: 'rgba(255,255,255,0.7)', // Texto mais suave
        marginTop: 8,
        marginBottom: 5,
        textAlign: 'center',
        fontFamily: 'System'
    },
    summaryCardValue: {
        fontSize: 18, // Fonte menor
        fontWeight: 'bold',
        color: WHITE, // Valor principal em branco
        textAlign: 'center',
        fontFamily: 'System'
    },
    summaryCardSubtitle: {
        fontSize: 12, // Fonte ainda menor
        color: 'rgba(255,255,255,0.5)', // Subtítulo mais suave
        marginTop: 2,
        textAlign: 'center',
        fontFamily: 'System'
    },
    withdrawalButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'rgba(255,255,255,0.2)', // Fundo semi-transparente como o da dashboard
        borderRadius: 25, // Bordas mais arredondadas
        paddingVertical: 12,
        ...Platform.select({
            ios: { shadowColor: 'rgba(0,0,0,0.1)', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.3, shadowRadius: 4 },
            android: { elevation: 3 },
        }),
    },
    withdrawalButtonDisabled: {
        backgroundColor: 'rgba(255,255,255,0.1)', // Desabilitado ainda mais transparente
        opacity: 0.6,
        elevation: 0,
        shadowOpacity: 0,
    },
    withdrawalButtonText: {
        color: WHITE, // Texto do botão em branco
        fontSize: 16,
        fontWeight: '600', // Semibold
        marginHorizontal: 10, // Espaçamento similar
        fontFamily: 'System'
    },
});

export default EarningsSummaryCard;