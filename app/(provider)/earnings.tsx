// LimpeJaApp/app/(provider)/earnings.tsx
import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
  Animated,
  ScrollView,
  RefreshControl,
  Platform,
  Alert,
} from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useAuth } from '../../hooks/useAuth';

// Importações dos serviços
import { getMyProviderDashboard } from '../services/providerService';
import { getMyProviderEarnings } from '../services/earningService';
import { requestWithdrawal } from '../services/paymentService';

// Importa os tipos da pasta centralizada
import { ProviderDashboard, ProviderTransaction, EarningsResponseDto } from '../types/backend/providers';

// REMOVIDO: import Colors from '../../constants/Colors'; // <-- REMOVIDO

// IMPORTA OS NOVOS COMPONENTES (Verifique os caminhos)
import EarningsSummaryCard from './components/earnings/EarningsSummaryCard';
import EarningsChartSection from './components/earnings/EarningsChartSection';
import RecentTransactionsSection from './components/earnings/RecentTransactionsSection';

// Interface para dados do gráfico (mantida)
interface ChartData {
  labels: string[];
  datasets: {
    data: number[];
    color?: (opacity: number) => string;
    strokeWidth?: number;
  }[];
}

// Hook para animação de toque (reutilizável)
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

// Componente: CustomHeader (para tela de Ganhos)
const CustomHeader: React.FC<{
  onBackPress: () => void;
  onManageBankDetailsPress: () => void;
  animation: Animated.Value;
}> = ({ onBackPress, onManageBankDetailsPress, animation }) => {
  return (
    <Animated.View style={[styles.customHeader, { opacity: animation, transform: [{ translateY: animation.interpolate({ inputRange: [0, 1], outputRange: [-20, 0] }) }] }]}>
      <TouchableOpacity onPress={onBackPress} style={styles.headerBackButton} accessibilityRole="button" accessibilityLabel="Voltar para a tela anterior">
        <Ionicons name="arrow-back" size={24} color={'#FFFFFF'} /> {/* Hardcoded WHITE */}
      </TouchableOpacity>
      <Text style={[styles.headerTitle, { color: '#FFFFFF' }]} accessibilityRole="header" accessibilityLabel="Meus Ganhos">Meus Ganhos</Text> {/* Hardcoded WHITE */}
      <TouchableOpacity onPress={onManageBankDetailsPress} style={styles.headerActionIcon} accessibilityRole="button" accessibilityLabel="Gerenciar dados bancários">
        <Ionicons name="card-outline" size={26} color={'#FFFFFF'} /> {/* Hardcoded WHITE */}
      </TouchableOpacity>
    </Animated.View>
  );
};


// Componente principal da tela de Ganhos
export default function ProviderEarningsScreen() {
  const router = useRouter();

  const [dashboardData, setDashboardData] = useState<ProviderDashboard | null>(null);
  const [recentTransactions, setRecentTransactions] = useState<ProviderTransaction[]>([]);
  const [chartData, setChartData] = useState<ChartData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Animações para as seções
  const headerAnim = useRef(new Animated.Value(0)).current;
  const summaryAnim = useRef(new Animated.Value(0)).current;
  const chartSectionAnim = useRef(new Animated.Value(0)).current;
  const transactionsSectionAnim = useRef(new Animated.Value(0)).current;

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    try {
      const fetchedDashboardData = await getMyProviderDashboard(); 
      const fetchedEarnings: EarningsResponseDto = await getMyProviderEarnings(); 

      setDashboardData(fetchedDashboardData); 
      setRecentTransactions(fetchedEarnings.recentTransactions || []); 

      const monthlyEarningsMap: { [key: string]: number } = fetchedEarnings.earningsBreakdown || {}; 
      const today = new Date();
      const labels: string[] = [];
      const dataPoints: number[] = [];

      for (let i = 0; i < 4; i++) {
        const date = new Date(today.getFullYear(), today.getMonth() - (3 - i), 1);
        const monthKey = date.toLocaleString('default', { month: 'short', year: 'numeric' });
        labels.push(date.toLocaleDateString('pt-BR', { month: 'short' }));
        dataPoints.push(monthlyEarningsMap[monthKey] || 0);
      }

      setChartData({
        labels: labels,
        datasets: [{
          data: dataPoints,
          color: (opacity = 1) => `rgba(0, 122, 255, ${opacity})`, // Hardcoded cor principal do tema light.tint
          strokeWidth: 2
        }]
      });

    } catch (err: any) {
      console.error("[ProviderEarningsScreen] Erro ao buscar dados de ganhos:", err.response?.data || err.message, err);
      Alert.alert("Erro", err.response?.data?.message || "Não foi possível carregar seus dados de ganhos. Tente novamente mais tarde.");
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchData();

    Animated.stagger(150, [
      Animated.timing(headerAnim, { toValue: 1, duration: 500, useNativeDriver: true }),
      Animated.timing(summaryAnim, { toValue: 1, duration: 600, useNativeDriver: true }),
      Animated.timing(chartSectionAnim, { toValue: 1, duration: 600, useNativeDriver: true }),
      Animated.timing(transactionsSectionAnim, { toValue: 1, duration: 600, useNativeDriver: true }),
    ]).start();

  }, [fetchData]);

  const onRefresh = useCallback(() => {
    setIsRefreshing(true);
    fetchData();
  }, [fetchData]);

  const handleWithdrawalRequest = async () => {
    if (!dashboardData || dashboardData.totalEarnings <= 0 || (dashboardData.pendingWithdrawals ?? 0) > 0) {
      Alert.alert("Atenção", "Você não possui saldo disponível para saque ou já tem um saque pendente.");
      return;
    }

    Alert.alert(
      "Solicitar Saque",
      `Deseja solicitar o saque de R$ ${(dashboardData.totalEarnings).toFixed(2).replace('.', ',')} para sua conta bancária cadastrada?`,
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Confirmar Saque",
          onPress: async () => {
            setIsLoading(true);
            try {
              await requestWithdrawal({ amount: dashboardData.totalEarnings });
              Alert.alert("Saque Solicitado", "Seu pedido de saque foi enviado com sucesso e será processado em breve! Você será notificado sobre o status.");
              fetchData();
            } catch (error: any) {
              console.error("Erro ao solicitar saque:", error.response?.data || error.message);
              Alert.alert("Erro", error.response?.data?.message || "Não foi possível solicitar o saque.");
            } finally {
              setIsLoading(false);
            }
          },
        },
      ],
      { cancelable: true }
    );
  };

  if (isLoading && !isRefreshing) {
    return (
      <View style={styles.outerContainer}>
        <Stack.Screen options={{ headerShown: false }} />
        <CustomHeader
          onBackPress={() => router.back()}
          onManageBankDetailsPress={() => router.push('/(provider)/profile/bank-details' as any)}
          animation={headerAnim}
        />
        <View style={styles.centeredFeedback}>
          <ActivityIndicator size="large" color={'#007AFF'} accessibilityLabel="Carregando dados" /> {/* Hardcoded ICON_PRIMARY */}
          <Text style={[styles.loadingText, { color: '#7A8599' }]}>Carregando seus dados financeiros...</Text> {/* Hardcoded TEXT_MUTED */}
        </View>
      </View>
    );
  }

  return (
    <View style={styles.outerContainer}>
      <Stack.Screen options={{ headerShown: false }} />

      <CustomHeader
        onBackPress={() => router.back()}
        onManageBankDetailsPress={() => router.push('/(provider)/profile/bank-details' as any)}
        animation={headerAnim}
      />

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollViewContent}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={onRefresh}
            tintColor={'#007AFF'}
            accessibilityLabel="Puxe para atualizar dados"
          />
        }
      >
        {/* Cartão de Resumo Financeiro */}
        <EarningsSummaryCard
          dashboardData={dashboardData}
          animation={summaryAnim}
          onWithdrawalRequest={handleWithdrawalRequest}
        />

        {/* Gráfico de Ganhos ao Longo do Tempo */}
        <EarningsChartSection
          chartData={chartData}
          animation={chartSectionAnim}
        />

        {/* Seção de Transações Recentes */}
        <RecentTransactionsSection
          transactions={recentTransactions}
          animation={transactionsSectionAnim}
        />

        {/* Quick Links para outras seções importantes */}
        <TouchableOpacity
          style={styles.quickLinkCard}
          onPress={() => router.push('/(provider)/services' as any)}
          accessibilityRole="button"
          accessibilityLabel="Visualizar todos os meus serviços"
        >
          <Ionicons name="briefcase-outline" size={24} color={'#007AFF'} /> {/* Hardcoded ICON_PRIMARY */}
          <Text style={[styles.quickLinkText, { color: '#1A2538' }]}>Meus Serviços Oferecidos</Text> {/* Hardcoded TEXT_DARK */}
          <Ionicons name="chevron-forward-outline" size={20} color={'#7A8599'} /> {/* Hardcoded TEXT_MUTED */}
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.quickLinkCard}
          onPress={() => router.push('/(provider)/reviews' as any)}
          accessibilityRole="button"
          accessibilityLabel="Visualizar todas as minhas avaliações"
        >
          <Ionicons name="star-outline" size={24} color={'#FFC107'} /> {/* Hardcoded WARNING_YELLOW */}
          <Text style={[styles.quickLinkText, { color: '#1A2538' }]}>Minhas Avaliações</Text> {/* Hardcoded TEXT_DARK */}
          <Ionicons name="chevron-forward-outline" size={20} color={'#7A8599'} /> {/* Hardcoded TEXT_MUTED */}
        </TouchableOpacity>

      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  outerContainer: {
    flex: 1,
    backgroundColor: '#F8F9FD', // Hardcoded BACKGROUND_ALT
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
    // color: Colors.light.textMuted, // Hardcoded acima
    fontFamily: 'System'
  },
  customHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#007AFF', // Hardcoded PRIMARY
    paddingHorizontal: 15,
    paddingVertical: Platform.OS === 'ios' ? 50 : 20,
    paddingTop: Platform.OS === 'ios' ? 50 : 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 5,
  },
  headerBackButton: {
    padding: 5,
    marginRight: 15,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    // color: Colors.light.background, // Hardcoded acima
    flex: 1,
    textAlign: 'center',
    fontFamily: 'System'
  },
  headerActionIcon: {
    padding: 5,
    marginLeft: 15,
  },
  headerActionIconPlaceholder: {
    width: 36,
    marginLeft: 15,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1A2538', // Hardcoded TEXT_DARK
    marginBottom: 15,
    marginTop: 10,
    fontFamily: 'System'
  },
  summaryContainer: {
    backgroundColor: '#FFFFFF', // Hardcoded WHITE
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
    ...Platform.select({
      ios: { shadowColor: 'rgba(0,0,0,0.1)', shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.15, shadowRadius: 6 }, // Hardcoded SHADOW_COLOR_SECTION
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
    backgroundColor: '#F8F9FD', // Hardcoded BACKGROUND_ALT
    borderRadius: 10,
    padding: 15,
    marginBottom: 15,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.08)', // Hardcoded BORDER_SUBTLE
  },
  summaryCardTitle: {
    fontSize: 14,
    color: '#7A8599', // Hardcoded TEXT_MUTED
    marginTop: 8,
    marginBottom: 5,
    textAlign: 'center',
    fontFamily: 'System'
  },
  summaryCardValue: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#1A2538', // Hardcoded TEXT_DARK
    textAlign: 'center',
    fontFamily: 'System'
  },
  summaryCardSubtitle: {
    fontSize: 12,
    color: '#7A8599', // Hardcoded TEXT_MUTED
    marginTop: 2,
    textAlign: 'center',
    fontFamily: 'System'
  },
  withdrawalButton: {
    backgroundColor: '#28a745', // Hardcoded SUCCESS_GREEN
    borderRadius: 8,
    paddingVertical: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    ...Platform.select({
      ios: { shadowColor: 'rgba(0,0,0,0.06)', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 6 }, // Hardcoded SHADOW_COLOR_CARD
      android: { elevation: 6 },
    }),
  },
  withdrawalButtonDisabled: {
    backgroundColor: '#A5D6A7', // Hardcoded light green
    opacity: 0.6,
    elevation: 0,
    shadowOpacity: 0,
  },
  withdrawalButtonText: {
    color: '#FFFFFF', // Hardcoded WHITE
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 10,
    fontFamily: 'System'
  },
  chartSection: {
    backgroundColor: '#FFFFFF', // Hardcoded WHITE
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
    ...Platform.select({
      ios: { shadowColor: 'rgba(0,0,0,0.1)', shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.15, shadowRadius: 6 }, // Hardcoded SHADOW_COLOR_SECTION
      android: { elevation: 4 },
    }),
  },
  chartContainerPlaceholder: {
    backgroundColor: '#F8F9FD', // Hardcoded BACKGROUND_ALT
    borderRadius: 10,
    width: '100%',
    height: 200,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.08)', // Hardcoded BORDER_SUBTLE
    borderStyle: 'dashed',
  },
  chartPlaceholderText: {
    fontSize: 16,
    color: '#7A8599', // Hardcoded TEXT_MUTED
    marginTop: 10,
    fontFamily: 'System'
  },
  transactionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(0,0,0,0.08)', // Hardcoded BORDER_SUBTLE
  },
  transactionDetails: {
    flex: 1,
    marginLeft: 10,
  },
  transactionDescription: {
    fontSize: 15,
    fontWeight: '500',
    color: '#1A2538', // Hardcoded TEXT_DARK
  },
  transactionDate: {
    fontSize: 13,
    color: '#7A8599', // Hardcoded TEXT_MUTED
    marginTop: 2,
  },
  transactionAmount: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1A2538', // Hardcoded TEXT_DARK
  },
  viewAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    marginTop: 10,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(0,0,0,0.08)', // Hardcoded BORDER_SUBTLE
  },
  viewAllButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#007AFF', // Hardcoded ICON_PRIMARY
    marginRight: 5,
  },
  emptyStateContainer: {
    alignItems: 'center',
    paddingVertical: 20,
    backgroundColor: '#F8F9FD', // Hardcoded BACKGROUND_ALT
    borderRadius: 12,
    marginTop: 10,
  },
  emptyText: {
    textAlign: 'center',
    color: '#7A8599', // Hardcoded TEXT_MUTED
    fontSize: 15,
    marginTop: 8,
  },
  quickLinkCard: {
    backgroundColor: '#FFFFFF', // Hardcoded WHITE
    borderRadius: 12,
    paddingVertical: 15,
    paddingHorizontal: 20,
    marginBottom: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.08)', // Hardcoded BORDER_SUBTLE
    ...Platform.select({
      ios: { shadowColor: 'rgba(0,0,0,0.06)', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.08, shadowRadius: 4 }, // Hardcoded SHADOW_COLOR_CARD
      android: { elevation: 3 },
    }),
  },
  quickLinkText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1A2538', // Hardcoded TEXT_DARK
    flex: 1,
    marginLeft: 15,
  },
});