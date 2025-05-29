// LimpeJaApp/app/(provider)/earnings.tsx
import React, { useState, useEffect, useRef } from 'react';
import {
    View,
    Text,
    FlatList,
    StyleSheet,
    ActivityIndicator,
    TouchableOpacity,
    Platform,
    Animated, // Importar Animated para animações
    Alert,
    ScrollView, // << CORREÇÃO: Importar ScrollView
} from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { formatDate } from '../../utils/helpers'; // Para formatar datas

// Tipos para os dados (mova para types/ se usar em mais lugares)
interface EarningsSummary {
  totalBalance: number;
  pendingWithdrawal: number;
  lastPayoutAmount: number;
  lastPayoutDate: string; // YYYY-MM-DD
}

interface Transaction {
  id: string;
  date: string; // YYYY-MM-DD
  description: string;
  amount: number; // Pode ser positivo ou negativo
  type: 'service' | 'withdrawal' | 'adjustment'; // Para categorizar
}

// Mock de dados (simulando uma busca)
const fetchEarningsData = async (): Promise<{ summary: EarningsSummary, transactions: Transaction[] }> => {
  return new Promise(resolve => {
    setTimeout(() => {
      resolve({
        summary: {
          totalBalance: 1250.75,
          pendingWithdrawal: 200.00,
          lastPayoutAmount: 550.00,
          lastPayoutDate: '2025-05-15',
        },
        transactions: [
          // << CORREÇÃO: Adicionar 'as const' ou 'as Transaction['type']' para o tipo da transação
          { id: 't1', date: '2025-06-01', description: 'Pagamento - Limpeza para Cliente A', amount: 150.00, type: 'service' as const },
          { id: 't2', date: '2025-05-28', description: 'Pagamento - Limpeza para Cliente B', amount: 120.00, type: 'service' as const },
          { id: 't3', date: '2025-05-25', description: 'Pagamento - Limpeza para Cliente C', amount: 200.00, type: 'service' as const },
          { id: 't4', date: '2025-05-20', description: 'Pagamento - Limpeza para Cliente D', amount: 80.00, type: 'service' as const },
          { id: 't5', date: '2025-05-15', description: 'Saque para conta bancária', amount: -550.00, type: 'withdrawal' as const },
          { id: 't6', date: '2025-05-10', description: 'Pagamento - Limpeza para Cliente E', amount: 180.00, type: 'service' as const },
          { id: 't7', date: '2025-05-05', description: 'Pagamento - Limpeza para Cliente F', amount: 95.00, type: 'service' as const },
        ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()), // Ordena por data mais recente
      });
    }, 1000); // Simula um atraso de rede
  });
};

// Componente para cada Transação com animações
const AnimatedTransactionItem: React.FC<{
    item: Transaction;
    delay: number;
}> = ({ item, delay }) => {
    const fadeAnim = useRef(new Animated.Value(0)).current;
    const slideAnim = useRef(new Animated.Value(20)).current;

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

    return (
        <Animated.View
            style={[
                styles.transactionItemWrapper,
                { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }
            ]}
        >
            <View style={styles.transactionItem}>
                <View style={styles.transactionIconContainer}>
                    {item.type === 'service' && <Ionicons name="briefcase-outline" size={24} color="#007AFF" />}
                    {item.type === 'withdrawal' && <Ionicons name="wallet-outline" size={24} color="#DC3545" />}
                    {item.type === 'adjustment' && <Ionicons name="information-circle-outline" size={24} color="#FFC107" />}
                </View>
                <View style={styles.transactionDetails}>
                    <Text style={styles.transactionDescription}>{item.description}</Text>
                    <Text style={styles.transactionDate}>{formatDate(item.date, { day: '2-digit', month: 'short', year: 'numeric' })}</Text>
                </View>
                <Text style={[styles.transactionAmount, amountColor]}>
                    {amountSign} R$ {item.amount.toFixed(2).replace('.', ',')}
                </Text>
            </View>
        </Animated.View>
    );
};


export default function ProviderEarningsScreen() {
  const router = useRouter();
  const [earningsSummary, setEarningsSummary] = useState<EarningsSummary | null>(null);
  const [recentTransactions, setRecentTransactions] = useState<Transaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Animações
  const headerAnim = useRef(new Animated.Value(0)).current;
  const summaryAnim = useRef(new Animated.Value(0)).current;
  const chartAnim = useRef(new Animated.Value(0)).current;
  const transactionsHeaderAnim = useRef(new Animated.Value(0)).current;


  useEffect(() => {
    // Animação de entrada do cabeçalho
    Animated.timing(headerAnim, {
      toValue: 1,
      duration: 500,
      useNativeDriver: true,
    }).start();

    setIsLoading(true);
    fetchEarningsData()
      .then(data => {
        setEarningsSummary(data.summary);
        setRecentTransactions(data.transactions);
        setIsLoading(false);
        // Animações de entrada para o conteúdo
        Animated.stagger(150, [
            Animated.timing(summaryAnim, { toValue: 1, duration: 600, useNativeDriver: true }),
            Animated.timing(chartAnim, { toValue: 1, duration: 600, useNativeDriver: true }),
            Animated.timing(transactionsHeaderAnim, { toValue: 1, duration: 600, useNativeDriver: true }),
        ]).start();
      })
      .catch(err => {
        console.error("Erro ao buscar dados de ganhos:", err);
        Alert.alert("Erro", "Não foi possível carregar seus dados de ganhos.");
        setIsLoading(false);
      });
  }, [headerAnim, summaryAnim, chartAnim, transactionsHeaderAnim]);

  const handleWithdrawalRequest = () => {
    Alert.alert(
      "Solicitar Saque",
      `Deseja solicitar o saque de R$ ${(earningsSummary?.totalBalance ?? 0).toFixed(2).replace('.', ',')} para sua conta bancária cadastrada?`,
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Confirmar Saque",
          onPress: () => {
            // TODO: Chamar API para solicitar saque
            Alert.alert("Saque Solicitado", "Seu pedido de saque foi enviado com sucesso e será processado em breve!");
            // Opcional: Atualizar o estado para refletir o saque pendente
          },
          style: "default"
        }
      ],
      { cancelable: true }
    );
  };

  if (isLoading) {
    return (
      <View style={styles.outerContainer}>
        <Stack.Screen options={{ headerShown: false }} />
        {/* Custom Header para o estado de loading */}
        <Animated.View style={[styles.customHeader, { opacity: headerAnim, transform: [{ translateY: headerAnim.interpolate({ inputRange: [0, 1], outputRange: [-20, 0] }) }] }]}>
            <Text style={styles.headerTitle}>Meus Ganhos</Text>
            <View style={styles.headerActionIconPlaceholder} /> {/* Placeholder para alinhar */}
        </Animated.View>
        <View style={styles.centeredFeedback}>
          <ActivityIndicator size="large" color="#007AFF" />
          <Text style={styles.loadingText}>Carregando seus dados financeiros...</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.outerContainer}>
      <Stack.Screen options={{ headerShown: false }} />

      {/* Custom Header */}
      <Animated.View style={[styles.customHeader, { opacity: headerAnim, transform: [{ translateY: headerAnim.interpolate({ inputRange: [0, 1], outputRange: [-20, 0] }) }] }]}>
          <TouchableOpacity onPress={() => router.back()} style={styles.headerBackButton}>
              <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Meus Ganhos</Text>
          <TouchableOpacity
              // << CORREÇÃO: Adicionar 'as any' para a rota >>
              onPress={() => router.push('/(provider)/profile/bank-details' as any)} // Rota para gerenciar dados bancários
              style={styles.headerActionIcon}
          >
              <Ionicons name="card-outline" size={26} color="#FFFFFF" />
          </TouchableOpacity>
      </Animated.View>

      {/* << CORREÇÃO: Usar ScrollView aqui >> */}
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollViewContent}>
        {/* Seção de Resumo de Ganhos */}
        <Animated.View style={[styles.summaryContainer, { opacity: summaryAnim, transform: [{ translateY: summaryAnim.interpolate({ inputRange: [0, 1], outputRange: [20, 0] }) }] }]}>
            <Text style={styles.sectionTitle}>Resumo Financeiro</Text>
            <View style={styles.summaryGrid}>
                <View style={styles.summaryCard}>
                    <Ionicons name="wallet-outline" size={30} color="#007AFF" />
                    <Text style={styles.summaryCardTitle}>Saldo Total</Text>
                    <Text style={styles.summaryCardValue}>R$ {(earningsSummary?.totalBalance ?? 0).toFixed(2).replace('.', ',')}</Text>
                </View>
                <View style={styles.summaryCard}>
                    <Ionicons name="hourglass-outline" size={30} color="#FFC107" />
                    <Text style={styles.summaryCardTitle}>Pendente de Saque</Text>
                    {/* << CORREÇÃO: Tratar earningsSummary?.pendingWithdrawal potencialmente indefinido >> */}
                    <Text style={styles.summaryCardValue}>R$ {(earningsSummary?.pendingWithdrawal ?? 0).toFixed(2).replace('.', ',')}</Text>
                </View>
                <View style={styles.summaryCard}>
                    <Ionicons name="cash-outline" size={30} color="#28A745" />
                    <Text style={styles.summaryCardTitle}>Último Pagamento</Text>
                    <Text style={styles.summaryCardValue}>R$ {(earningsSummary?.lastPayoutAmount ?? 0).toFixed(2).replace('.', ',')}</Text>
                    <Text style={styles.summaryCardSubtitle}>{formatDate(earningsSummary?.lastPayoutDate || '', { day: '2-digit', month: 'short' })}</Text>
                </View>
            </View>
            <TouchableOpacity
                style={[
                    styles.withdrawalButton,
                    (earningsSummary?.totalBalance === 0 || (earningsSummary?.pendingWithdrawal ?? 0) > 0) && styles.withdrawalButtonDisabled
                ]}
                onPress={handleWithdrawalRequest}
                disabled={earningsSummary?.totalBalance === 0 || (earningsSummary?.pendingWithdrawal ?? 0) > 0}
            >
                <Ionicons name="arrow-up-circle-outline" size={24} color="#FFFFFF" />
                <Text style={styles.withdrawalButtonText}>Solicitar Saque</Text>
            </TouchableOpacity>
        </Animated.View>

        {/* Seção de Gráfico de Ganhos */}
        <Animated.View style={[styles.chartSection, { opacity: chartAnim, transform: [{ translateY: chartAnim.interpolate({ inputRange: [0, 1], outputRange: [20, 0] }) }] }]}>
            <Text style={styles.sectionTitle}>Ganhos ao Longo do Tempo</Text>
            {/* Placeholder para um gráfico real (ex: de linha) */}
            <View style={styles.chartPlaceholder}>
                <MaterialCommunityIcons name="chart-line" size={60} color="#CED4DA" />
                <Text style={styles.chartPlaceholderText}>Gráfico de Ganhos (em breve)</Text>
                <Text style={styles.chartPlaceholderSubText}>Visualize seu histórico de ganhos aqui.</Text>
            </View>
        </Animated.View>

        {/* Seção de Transações Recentes */}
        <Animated.View style={[styles.transactionsSection, { opacity: transactionsHeaderAnim, transform: [{ translateY: transactionsHeaderAnim.interpolate({ inputRange: [0, 1], outputRange: [20, 0] }) }] }]}>
            <Text style={styles.sectionTitle}>Transações Recentes</Text>
            {recentTransactions.length === 0 ? (
                <View style={styles.emptyTransactions}>
                    <Ionicons name="cash-outline" size={64} color="#CED4DA" />
                    <Text style={styles.emptyTransactionsText}>Nenhuma transação recente.</Text>
                </View>
            ) : (
                <FlatList
                    data={recentTransactions}
                    keyExtractor={(item) => item.id}
                    renderItem={({ item, index }) => (
                        <AnimatedTransactionItem item={item} delay={index * 70} />
                    )}
                    scrollEnabled={false} // Para que o ScrollView pai controle o scroll
                    contentContainerStyle={styles.transactionsListContent}
                    ItemSeparatorComponent={() => <View style={styles.listSeparator} />}
                />
            )}
        </Animated.View>
      {/* << CORREÇÃO: Fechar ScrollView aqui >> */}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  outerContainer: {
    flex: 1,
    backgroundColor: '#F0F2F5',
  },
  scrollView: {
    flex: 1,
  },
  scrollViewContent: {
    padding: 15,
    paddingBottom: 40,
  },
  centeredFeedback: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 15,
    fontSize: 16,
    color: '#6C757D',
  },
  customHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#007AFF', // Cor primária do app
    paddingHorizontal: 15,
    paddingVertical: Platform.OS === 'ios' ? 50 : 20, // Ajuste para status bar iOS
    paddingTop: Platform.OS === 'ios' ? 50 : 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 5,
  },
  headerBackButton: {
    marginRight: 15,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFFFFF',
    flex: 1,
    textAlign: 'center',
  },
  headerActionIcon: {
    padding: 5, // Aumenta a área de toque
  },
  headerActionIconPlaceholder: {
    width: 26, // Largura do ícone para manter o alinhamento do título
    marginLeft:15, // Espaço à direita para alinhar com o botão de voltar
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1C3A5F',
    marginBottom: 15,
    marginTop: 10,
  },
  summaryContainer: {
    backgroundColor: '#FFFFFF',
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
    width: '48%', // Duas colunas
    backgroundColor: '#F8F9FA',
    borderRadius: 10,
    padding: 15,
    marginBottom: 15,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E9ECEF',
  },
  summaryCardTitle: {
    fontSize: 14,
    color: '#6C757D',
    marginTop: 8,
    marginBottom: 5,
    textAlign: 'center',
  },
  summaryCardValue: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#212529',
    textAlign: 'center',
  },
  summaryCardSubtitle: {
    fontSize: 12,
    color: '#868E96',
    marginTop: 2,
    textAlign: 'center',
  },
  withdrawalButton: {
    backgroundColor: '#28A745', // Verde para saque
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
  withdrawalButtonDisabled: { // Adicionado estilo para botão desabilitado
    backgroundColor: '#A5D6A7', // Um verde mais claro
    elevation: 0,
    shadowOpacity: 0,
  },
  withdrawalButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 10,
  },
  chartSection: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
    ...Platform.select({
      ios: { shadowColor: 'rgba(0,0,0,0.1)', shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.15, shadowRadius: 6 },
      android: { elevation: 4 },
    }),
  },
  chartPlaceholder: {
    backgroundColor: '#F8F9FA',
    borderRadius: 10,
    width: '100%',
    height: 200,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#E9ECEF',
    borderStyle: 'dashed',
  },
  chartPlaceholderText: {
    fontSize: 16,
    color: '#868E96',
    marginTop: 10,
  },
  chartPlaceholderSubText: {
    fontSize: 14,
    color: '#868E96',
    marginTop: 5,
  },
  transactionsSection: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    paddingHorizontal: 20, // Padding horizontal para a seção
    paddingVertical: 10, // Padding vertical menor, FlatList terá o seu
    ...Platform.select({
      ios: { shadowColor: 'rgba(0,0,0,0.1)', shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.15, shadowRadius: 6 },
      android: { elevation: 4 },
    }),
  },
  transactionsListContent: {
    paddingBottom: 10, // Pequeno padding no final da lista se houver muitos itens
  },
  transactionItemWrapper: {
    // Removido marginBottom, será tratado pelo ItemSeparatorComponent ou espaçamento direto
    borderRadius: 8,
    overflow: 'hidden',
  },
  transactionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 10,
    backgroundColor: '#F8F9FA', // Mantido para contraste se necessário
    // Removido borderWidth e borderRadius daqui, já que o wrapper pode cuidar disso ou ItemSeparator
  },
  transactionIconContainer: {
    marginRight: 10,
    width: 30,
    alignItems: 'center',
  },
  transactionDetails: {
    flex: 1,
  },
  transactionDescription: {
    fontSize: 15,
    fontWeight: '500',
    color: '#212529',
  },
  transactionDate: {
    fontSize: 12,
    color: '#868E96',
    marginTop: 2,
  },
  transactionAmount: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  positiveAmount: {
    color: '#28A745',
  },
  negativeAmount: {
    color: '#DC3545',
  },
  listSeparator: {
    height: 8, // Espaçador entre os itens da FlatList
  },
  emptyTransactions: {
    alignItems: 'center',
    paddingVertical: 30,
  },
  emptyTransactionsText: {
    fontSize: 16,
    color: '#6C757D',
    marginTop: 10,
  },
});