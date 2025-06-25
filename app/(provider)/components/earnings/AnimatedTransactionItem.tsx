// app/(provider)/earnings/components/AnimatedTransactionItem.tsx
import React, { useRef, useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { formatDate } from '../../../../utils/helpers'; // Certifique-se de que o caminho está correto

// Importa a tipagem de transação do provedor
import { ProviderTransaction } from '../../../types/backend/providers'; //

// DEFINE AS CORES PARA REUTILIZAÇÃO
const POSITIVE_AMOUNT_COLOR = '#28A745'; // Verde para ganhos
const NEGATIVE_AMOUNT_COLOR = '#DC3545'; // Vermelho para saques
const DEFAULT_TEXT_COLOR = '#212529'; // Preto quase total
const MUTED_TEXT_COLOR = '#868E96'; // Cinza para datas
const BACKGROUND_COLOR_ALT = '#F0F2F5'; // Fundo para detalhes expandidos
const BORDER_COLOR_SUBTLE = '#E9ECEF'; // Borda para detalhes expandidos

interface AnimatedTransactionItemProps {
    item: ProviderTransaction;
    delay: number;
}

const AnimatedTransactionItem: React.FC<AnimatedTransactionItemProps> = ({ item, delay }) => {
    const fadeAnim = useRef(new Animated.Value(0)).current;
    const slideAnim = useRef(new Animated.Value(20)).current;
    const [isExpanded, setIsExpanded] = useState(false);

    useEffect(() => {
        Animated.parallel([
            Animated.timing(fadeAnim, {
                toValue: 1,
                duration: 400,
                delay: delay,
                useNativeDriver: true,
            }),
            Animated.timing(slideAnim, {
                toValue: 0,
                duration: 400,
                delay: delay,
                useNativeDriver: true,
            }),
        ]).start();
    }, [fadeAnim, slideAnim, delay]);

    const isPositive = item.amount > 0;
    const amountColor = isPositive ? styles.positiveAmount : styles.negativeAmount;
    const amountSign = isPositive ? '+' : '';

    const getIcon = (type: ProviderTransaction['type']) => {
        switch (type) {
            case 'PAYMENT': return <Ionicons name="briefcase-outline" size={24} color="#007AFF" accessibilityLabel="Ícone de Pagamento de Serviço" />; // CORRIGIDO de 'SERVICE_PAYMENT' para 'PAYMENT'
            case 'WITHDRAWAL': return <Ionicons name="wallet-outline" size={24} color="#DC3545" accessibilityLabel="Ícone de Saque" />;
            case 'COMMISSION': return <Ionicons name="information-circle-outline" size={24} color="#FFC107" accessibilityLabel="Ícone de Comissão" />; // Ajustado para 'COMMISSION'
            default: return <Ionicons name="help-circle-outline" size={24} color="#6C757D" accessibilityLabel="Ícone de Transação Desconhecida" />;
        }
    };

    return (
        <Animated.View
            style={[
                styles.transactionItemWrapper,
                { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }
            ]}
        >
            <TouchableOpacity
                style={styles.transactionItem}
                onPress={() => setIsExpanded(!isExpanded)}
                accessibilityRole="button"
                accessibilityState={{ expanded: isExpanded }}
                accessibilityLabel={`Detalhes da transação: ${item.type} em ${formatDate(item.createdAt, { day: '2-digit', month: 'short', year: 'numeric' })}`}
            >
                <View style={styles.transactionIconContainer}>
                    {getIcon(item.type)}
                </View>
                <View style={styles.transactionDetails}>
                    <Text style={styles.transactionDescription}>
                        {item.description || (item.type === 'PAYMENT' ? 'Pagamento de Serviço' : item.type === 'WITHDRAWAL' ? 'Saque' : 'Ajuste')}
                    </Text>
                    <Text style={styles.transactionDate}>{formatDate(item.createdAt, { day: '2-digit', month: 'short', year: 'numeric' })}</Text>
                </View>
                <Text style={[styles.transactionAmount, amountColor]}>
                    {amountSign} R$ {item.amount.toFixed(2).replace('.', ',')}
                </Text>
            </TouchableOpacity>
            {isExpanded && (
                <View style={styles.expandedDetails}>
                    <Text style={styles.detailText}>ID: {item.id}</Text>
                    <Text style={styles.detailText}>Status: {item.status}</Text>
                    <Text style={styles.detailText}>Data da Criação: {formatDate(item.createdAt, { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</Text>
                    {item.bookingId && <Text style={styles.detailText}>Agendamento ID: {item.bookingId}</Text>}
                    {/* REMOVIDO: item.relatedUserId - não existe no tipo ProviderTransaction */}
                </View>
            )}
        </Animated.View>
    );
};

const styles = StyleSheet.create({
    transactionItemWrapper: {
        borderRadius: 8,
        overflow: 'hidden',
        backgroundColor: '#F8F9FA',
        marginBottom: 8,
        ...Platform.select({
            ios: { shadowColor: 'rgba(0,0,0,0.05)', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 3 },
            android: { elevation: 2 },
        }),
    },
    transactionItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 12,
        paddingHorizontal: 10,
    },
    transactionIconContainer: {
        marginRight: 10,
        width: 30,
        alignItems: 'center',
        justifyContent: 'center',
    },
    transactionDetails: {
        flex: 1,
    },
    transactionDescription: {
        fontSize: 15,
        fontWeight: '500',
        color: DEFAULT_TEXT_COLOR,
        fontFamily: 'System'
    },
    transactionDate: {
        fontSize: 12,
        color: MUTED_TEXT_COLOR,
        marginTop: 2,
        fontFamily: 'System'
    },
    transactionAmount: {
        fontSize: 16,
        fontWeight: 'bold',
        fontFamily: 'System'
    },
    positiveAmount: {
        color: POSITIVE_AMOUNT_COLOR,
    },
    negativeAmount: {
        color: NEGATIVE_AMOUNT_COLOR,
    },
    expandedDetails: {
        paddingHorizontal: 15,
        paddingBottom: 10,
        paddingTop: 5,
        backgroundColor: BACKGROUND_COLOR_ALT,
        borderTopWidth: 1,
        borderTopColor: BORDER_COLOR_SUBTLE,
    },
    detailText: {
        fontSize: 13,
        color: '#495057',
        marginBottom: 3,
        fontFamily: 'System'
    },
});

export default AnimatedTransactionItem;