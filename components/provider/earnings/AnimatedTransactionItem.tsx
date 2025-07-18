// app/(provider)/earnings/components/AnimatedTransactionItem.tsx
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import React, { useEffect, useRef, useState } from 'react';
import { Animated, Platform, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { formatDate } from '../../../utils/helpers';

// Importa a tipagem de transação do provedor e TransactionType
import { ProviderTransaction, TransactionType } from '../../../types/backend/providers';

// --- DEFINIÇÕES DE CORES (ALINHADAS COM O TEMA GERAL E ADICIONANDO AS FALTANTES) ---
const WHITE = '#FFFFFF';
const TEXT_DARK = '#1A2538'; // Cor principal do texto
const TEXT_MEDIUM = '#4A5568'; // Corrigido: Adicionado TEXT_MEDIUM
const TEXT_MUTED = '#7A8599'; // Cor para datas e textos mais suaves
const ICON_PRIMARY = '#007AFF'; // Azul para ícones gerais
const SUCCESS_GREEN = '#28a745'; // Verde para valores positivos (pagamentos)
const DANGER_RED = '#dc3545'; // Vermelho para valores negativos (saques)
const WARNING_YELLOW = '#FFC107'; // Amarelo para comissões ou alertas
const BORDER_SUBTLE = 'rgba(0,0,0,0.08)'; // Borda sutil
const BACKGROUND_ALT = '#F8F9FD'; // Fundo para o item e detalhes expandidos
// -------------------------------------------------------------------------

interface AnimatedTransactionItemProps {
    item: ProviderTransaction;
    delay: number;
}

const AnimatedTransactionItem: React.FC<AnimatedTransactionItemProps> = ({ item, delay }) => {
    const fadeAnim = useRef(new Animated.Value(0)).current;
    const slideAnim = useRef(new Animated.Value(20)).current;
    const [isExpanded, setIsExpanded] = useState(false);
    const expandedHeightAnim = useRef(new Animated.Value(0)).current; // Para animação de expansão

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

    useEffect(() => {
        if (isExpanded) {
            Animated.timing(expandedHeightAnim, {
                toValue: 1,
                duration: 250,
                useNativeDriver: false, // Altura não pode usar native driver
            }).start();
        } else {
            Animated.timing(expandedHeightAnim, {
                toValue: 0,
                duration: 200,
                useNativeDriver: false,
            }).start();
        }
    }, [isExpanded, expandedHeightAnim]);

    // --- LOGS DEFENSIVOS E TRATAMENTO DE VALORES ---
    const displayedAmount = item.amount ?? 0; // Garante que amount é um número
    const isPositive = displayedAmount > 0;
    const amountColor = isPositive ? SUCCESS_GREEN : DANGER_RED;
    const amountSign = isPositive ? '+' : '';

    const transactionDescription = item.description || (item.type === TransactionType.PAYMENT ? 'Pagamento de Serviço' : item.type === TransactionType.WITHDRAWAL ? 'Saque' : 'Ajuste');

    // LOG DEFENSIVO: Verifica se item.createdAt é válido
    let formattedDate = 'Data Inválida';
    if (item.createdAt) {
        try {
            formattedDate = formatDate(item.createdAt, { day: '2-digit', month: 'short', year: 'numeric' });
        } catch (e) {
            console.error(`[AnimatedTransactionItem] Erro ao formatar item.createdAt (${item.createdAt}):`, e);
            formattedDate = 'Erro de Data';
        }
    } else {
        console.warn(`[AnimatedTransactionItem] item.createdAt é undefined/null para transação ID: ${item.id}. Valor:`, item.createdAt);
    }
    // --- FIM DOS LOGS DEFENSIVOS E TRATAMENTO DE VALORES ---

    const getIconAndColor = (type: TransactionType) => { // Usando TransactionType do backend
        switch (type) {
            case TransactionType.PAYMENT:
                return { icon: "briefcase", color: ICON_PRIMARY, label: "Pagamento de Serviço" };
            case TransactionType.WITHDRAWAL:
                return { icon: "wallet", color: DANGER_RED, label: "Saque Solicitado" };
            case TransactionType.COMMISSION:
                return { icon: "percent", color: WARNING_YELLOW, label: "Comissão" };
            default:
                // LOG DEFENSIVO: Tipo de transação desconhecido
                console.warn(`[AnimatedTransactionItem] Tipo de transação desconhecido para ID: ${item.id}, Tipo: ${item.type}`);
                return { icon: "help-circle", color: TEXT_MUTED, label: "Transação Desconhecida" };
        }
    };

    const { icon, color, label } = getIconAndColor(item.type);

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
                accessibilityLabel={`Detalhes da transação: ${transactionDescription} de ${amountSign} R$ ${displayedAmount.toFixed(2).replace('.', ',')} em ${formattedDate}`}
            >
                <View style={styles.transactionIconContainer}>
                    <MaterialCommunityIcons name={icon as any} size={24} color={color} />
                </View>
                <View style={styles.transactionDetails}>
                    <Text style={styles.transactionDescription} numberOfLines={1}>
                        {transactionDescription}
                    </Text>
                    <Text style={styles.transactionDate}>{formattedDate}</Text>
                </View>
                <Text style={[styles.transactionAmount, { color: amountColor }]}>
                    {amountSign} R$ {displayedAmount.toFixed(2).replace('.', ',')}
                </Text>
                <Ionicons name={isExpanded ? "chevron-up" : "chevron-down"} size={18} color={TEXT_MUTED} style={styles.expandIcon} />
            </TouchableOpacity>
            <Animated.View
                style={[
                    styles.expandedDetailsContainer,
                    {
                        height: expandedHeightAnim.interpolate({
                            inputRange: [0, 1],
                            // Ajustar altura com base na presença da descrição para não cortar o texto
                            outputRange: [0, item.description ? 130 : 100], // Aumentei um pouco a altura para a descrição completa
                        }),
                        opacity: expandedHeightAnim,
                    },
                ]}
            >
                {isExpanded && ( // Renderiza os detalhes apenas se expandido para otimização
                    <View style={styles.expandedDetailsContent}>
                        <Text style={styles.detailText}>**ID da Transação:** {item.id || 'N/A'}</Text> {/* LOG DEFENSIVO: ID da transação */}
                        <Text style={styles.detailText}>**Tipo:** {label}</Text>
                        <Text style={styles.detailText}>**Status:** {item.status || 'N/A'}</Text> {/* LOG DEFENSIVO: Status da transação */}
                        {/* LOG DEFENSIVO: Data completa, com fallback */}
                        <Text style={styles.detailText}>**Data Completa:** {item.createdAt ? formatDate(item.createdAt, { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : 'Data Indisponível'}</Text>
                        {item.bookingId && <Text style={styles.detailText}>**Agendamento ID:** {item.bookingId}</Text>}
                        {/* LOG DEFENSIVO: Descrição, com fallback */}
                        {item.description && <Text style={styles.detailText}>**Descrição:** {item.description}</Text>}
                        {!item.description && <Text style={styles.detailText}>**Descrição:** Nenhuma descrição fornecida.</Text>}
                    </View>
                )}
            </Animated.View>
        </Animated.View>
    );
};

const styles = StyleSheet.create({
    transactionItemWrapper: {
        backgroundColor: WHITE,
        borderRadius: 12,
        overflow: 'hidden',
        marginBottom: 10,
        ...Platform.select({
            ios: { shadowColor: 'rgba(0,0,0,0.07)', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 3 },
            android: { elevation: 2 },
        }),
    },
    transactionItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 15,
        paddingHorizontal: 15,
    },
    transactionIconContainer: {
        marginRight: 15,
        width: 30,
        alignItems: 'center',
        justifyContent: 'center',
    },
    transactionDetails: {
        flex: 1,
        marginRight: 10,
    },
    transactionDescription: {
        fontSize: 16,
        fontWeight: '600',
        color: TEXT_DARK,
        fontFamily: 'System',
    },
    transactionDate: {
        fontSize: 13,
        color: TEXT_MUTED,
        marginTop: 4,
        fontFamily: 'System',
    },
    transactionAmount: {
        fontSize: 17,
        fontWeight: 'bold',
        fontFamily: 'System',
        marginRight: 10,
    },
    expandIcon: {
        marginLeft: 5,
    },
    expandedDetailsContainer: {
        backgroundColor: BACKGROUND_ALT,
        borderTopWidth: 1,
        borderTopColor: BORDER_SUBTLE,
        overflow: 'hidden',
    },
    expandedDetailsContent: {
        paddingVertical: 10,
        paddingHorizontal: 15,
    },
    detailText: {
        fontSize: 13,
        color: TEXT_MEDIUM,
        marginBottom: 4,
        fontFamily: 'System',
    },
});

export default AnimatedTransactionItem;