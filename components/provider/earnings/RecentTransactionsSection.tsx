// app/(provider)/earnings/components/RecentTransactionsSection.tsx
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React from 'react';
import { Animated, FlatList, Platform, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

// Importa o componente AnimatedTransactionItem
import AnimatedTransactionItem from './AnimatedTransactionItem'; // Este arquivo precisa ser ajustado
// Importa a tipagem de transação do provedor e TransactionType
import { ProviderTransaction } from '../../../app/types/backend/providers'; // CORRIGIDO: Importa TransactionType

// --- DEFINIÇÕES DE CORES (ALINHADAS COM O TEMA GERAL) ---
const WHITE = '#FFFFFF';
const BACKGROUND_ALT = '#F8F9FD';
const TEXT_DARK = '#1A2538';
const TEXT_MEDIUM = '#4A5568';
const TEXT_MUTED = '#7A8599';
const ICON_PRIMARY = '#007AFF'; // Azul Primário
const SUCCESS_GREEN = '#28a745'; // Verde de sucesso
const DANGER_RED = '#dc3545'; // Vermelho de perigo
const WARNING_YELLOW = '#FFC107'; // Amarelo de aviso
const BORDER_SUBTLE = 'rgba(0,0,0,0.08)';
const SHADOW_COLOR_SECTION = 'rgba(0, 0, 0, 0.1)';
const SHADOW_COLOR_CARD = 'rgba(0, 0, 0, 0.06)';
const PRIMARY_LIGHT = '#EBF5FF'; // CORRIGIDO: Adicionado PRIMARY_LIGHT aqui
// --------------------------------------------------------

interface RecentTransactionsSectionProps {
    transactions: ProviderTransaction[];
    animation: Animated.Value;
}

const RecentTransactionsSection: React.FC<RecentTransactionsSectionProps> = ({ transactions, animation }) => {
    const router = useRouter();

    const renderEmptyState = () => (
        <View style={styles.emptyTransactionsContainer}>
            <MaterialCommunityIcons name="cash-multiple" size={64} color={TEXT_MUTED} accessibilityLabel="Nenhuma transação" />
            <Text style={styles.emptyTransactionsText}>Você ainda não tem transações recentes.</Text>
            <Text style={styles.emptyTransactionsSubText}>Comece a completar serviços para ver seus ganhos aqui!</Text>
            <TouchableOpacity
                onPress={() => router.push('/(provider)/services' as any)}
                style={styles.emptyStateButton}
            >
                <Ionicons name="briefcase-outline" size={20} color={WHITE} />
                <Text style={styles.emptyStateButtonText}>Ver Meus Serviços</Text>
            </TouchableOpacity>
        </View>
    );

    return (
        <Animated.View style={[styles.transactionsSection, { opacity: animation, transform: [{ translateY: animation.interpolate({ inputRange: [0, 1], outputRange: [20, 0] }) }] }]}>
            <Text style={styles.sectionTitle} accessibilityRole="header">Transações Recentes</Text>
            {transactions.length === 0 ? (
                renderEmptyState()
            ) : (
                <>
                    <FlatList
                        data={transactions.slice(0, 5)} // Limita a 5 transações mais recentes para pré-visualização
                        keyExtractor={(item) => item.id}
                        renderItem={({ item, index }) => (
                            // AnimatedTransactionItem DEVE ser ajustado para exibir os dados da transação corretamente
                            <AnimatedTransactionItem item={item} delay={index * 50} />
                        )}
                        scrollEnabled={false} // Para que o ScrollView pai controle o scroll
                        contentContainerStyle={styles.transactionsListContent}
                        ItemSeparatorComponent={() => <View style={styles.listItemSeparator} />} // Separador entre itens
                    />
                    {transactions.length > 5 && ( // Exibir "Ver todas" se houver mais de 5
                        <TouchableOpacity
                            onPress={() => router.push('/(provider)/transactions' as any)} // Rota para o histórico completo
                            style={styles.viewAllTransactionsButton}
                            accessibilityRole="link"
                            accessibilityLabel="Ver todas as transações"
                        >
                            <Text style={styles.viewAllTransactionsButtonText}>Ver todas as transações</Text>
                            <Ionicons name="arrow-forward" size={18} color={ICON_PRIMARY} />
                        </TouchableOpacity>
                    )}
                </>
            )}
        </Animated.View>
    );
};

const styles = StyleSheet.create({
    sectionTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: TEXT_DARK,
        marginBottom: 15,
        marginTop: 0,
        fontFamily: 'System'
    },
    transactionsSection: {
        backgroundColor: WHITE,
        borderRadius: 18,
        padding: 20,
        marginBottom: 20,
        ...Platform.select({
            ios: { shadowColor: SHADOW_COLOR_SECTION, shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.1, shadowRadius: 10 },
            android: { elevation: 8 },
        }),
    },
    transactionsListContent: {
        // Sem paddingBottom aqui, o separador e o botão "Ver todas" cuidam disso
    },
    listItemSeparator: {
        height: 1,
        backgroundColor: BORDER_SUBTLE,
        marginVertical: 8,
    },
    emptyTransactionsContainer: {
        alignItems: 'center',
        paddingVertical: 30,
        backgroundColor: BACKGROUND_ALT,
        borderRadius: 12,
        marginVertical: 10,
        paddingHorizontal: 20,
    },
    emptyTransactionsText: {
        fontSize: 18,
        fontWeight: '600',
        color: TEXT_DARK,
        marginTop: 15,
        textAlign: 'center',
    },
    emptyTransactionsSubText: {
        fontSize: 14,
        color: TEXT_MUTED,
        marginTop: 5,
        textAlign: 'center',
        marginBottom: 20,
    },
    emptyStateButton: {
        backgroundColor: ICON_PRIMARY,
        paddingVertical: 12,
        paddingHorizontal: 25,
        borderRadius: 25,
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 10,
        ...Platform.select({
            ios: { shadowColor: ICON_PRIMARY, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 6 },
            android: { elevation: 6, backgroundColor: ICON_PRIMARY },
        }),
    },
    emptyStateButtonText: {
        color: WHITE,
        fontSize: 16,
        fontWeight: 'bold',
        marginLeft: 8,
    },
    viewAllTransactionsButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: 20,
        paddingVertical: 12,
        borderRadius: 25,
        borderWidth: 1.5,
        borderColor: ICON_PRIMARY,
        backgroundColor: PRIMARY_LIGHT, // Usando a constante PRIMARY_LIGHT
        ...Platform.select({
            ios: { shadowColor: ICON_PRIMARY, shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.2, shadowRadius: 4 },
            android: { elevation: 3 },
        }),
    },
    viewAllTransactionsButtonText: {
        color: ICON_PRIMARY,
        fontSize: 16,
        fontWeight: '600',
        marginRight: 8,
        fontFamily: 'System'
    },
});

export default RecentTransactionsSection;