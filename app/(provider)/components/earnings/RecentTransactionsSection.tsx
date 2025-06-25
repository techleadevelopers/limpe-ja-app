// app/(provider)/earnings/components/RecentTransactionsSection.tsx
import React from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Platform, Animated } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

// Importa o componente AnimatedTransactionItem
import AnimatedTransactionItem from './AnimatedTransactionItem';
// Importa a tipagem de transação do provedor
import { ProviderTransaction } from '../../../types/backend/providers';

// DEFINIÇÕES DE CORES LOCAIS (Para resolver o erro de forma direta)
const WHITE_TRANSACTION = '#FFFFFF';
const BACKGROUND_COLOR_ALT_TRANSACTION = '#F8F9FA'; // Fundo para a lista de transações
const MUTED_TEXT_COLOR_TRANSACTION = '#6C757D'; // Cinza
const PLACEHOLDER_ICON_COLOR_TRANSACTION = '#CED4DA'; // Cinza claro para ícones de placeholder
const PRIMARY_COLOR_TRANSACTION = '#007AFF'; // Azul
const TEXT_COLOR_DARK_TRANSACTION = '#1C3A5F'; // Azul escuro para títulos

interface RecentTransactionsSectionProps {
    transactions: ProviderTransaction[];
    animation: Animated.Value;
}

const RecentTransactionsSection: React.FC<RecentTransactionsSectionProps> = ({ transactions, animation }) => {
    const router = useRouter();

    const renderEmptyState = () => (
        <View style={styles.emptyTransactions}>
            <Ionicons name="cash-outline" size={64} color={PLACEHOLDER_ICON_COLOR_TRANSACTION} accessibilityLabel="Nenhuma transação" />
            <Text style={styles.emptyTransactionsText}>Nenhuma transação recente encontrada.</Text>
        </View>
    );

    return (
        <Animated.View style={[styles.transactionsSection, { opacity: animation, transform: [{ translateY: animation.interpolate({ inputRange: [0, 1], outputRange: [20, 0] }) }] }]}>
            <Text style={styles.sectionTitle} accessibilityRole="header">Transações Recentes</Text>
            {transactions.length === 0 ? (
                renderEmptyState()
            ) : (
                <FlatList
                    data={transactions}
                    keyExtractor={(item) => item.id}
                    renderItem={({ item, index }) => (
                        <AnimatedTransactionItem item={item} delay={index * 70} />
                    )}
                    scrollEnabled={false} // Para que o ScrollView pai controle o scroll
                    contentContainerStyle={styles.transactionsListContent}
                    ListFooterComponent={() => (
                        <TouchableOpacity
                            onPress={() => router.push('/(provider)/transactions' as any)} // Rota para o histórico completo
                            style={styles.viewAllTransactionsButton}
                            accessibilityRole="link"
                            accessibilityLabel="Ver todas as transações"
                        >
                            <Text style={styles.viewAllTransactionsButtonText}>Ver todas as transações</Text>
                            <Ionicons name="arrow-forward" size={18} color={PRIMARY_COLOR_TRANSACTION} />
                        </TouchableOpacity>
                    )}
                />
            )}
        </Animated.View>
    );
};

const styles = StyleSheet.create({
    sectionTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: TEXT_COLOR_DARK_TRANSACTION, // Usando constante local
        marginBottom: 15,
        marginTop: 10,
        fontFamily: 'System'
    },
    transactionsSection: {
        backgroundColor: WHITE_TRANSACTION, // Usando constante local
        borderRadius: 12,
        paddingHorizontal: 20,
        paddingVertical: 10,
        ...Platform.select({
            ios: { shadowColor: 'rgba(0,0,0,0.1)', shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.15, shadowRadius: 6 },
            android: { elevation: 4 },
        }),
    },
    transactionsListContent: {
        paddingBottom: 10,
    },
    emptyTransactions: {
        alignItems: 'center',
        paddingVertical: 30,
    },
    emptyTransactionsText: {
        fontSize: 16,
        color: MUTED_TEXT_COLOR_TRANSACTION, // Usando constante local
        marginTop: 10,
        fontFamily: 'System'
    },
    viewAllTransactionsButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: 20,
        paddingVertical: 10,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: PRIMARY_COLOR_TRANSACTION, // Usando constante local
        backgroundColor: '#E6F2FF', // Fundo azul claro (manter literal aqui, ou adicionar ao Colors.ts)
    },
    viewAllTransactionsButtonText: {
        color: PRIMARY_COLOR_TRANSACTION, // Usando constante local
        fontSize: 15,
        fontWeight: '600',
        marginRight: 8,
        fontFamily: 'System'
    },
});

export default RecentTransactionsSection;