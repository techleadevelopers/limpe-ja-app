import { Ionicons } from '@expo/vector-icons';
import { Stack, useRouter } from 'expo-router';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    Animated,
    Platform,
    RefreshControl,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';

import { getMyProviderEarnings } from '../../services/earningService';
import { requestWithdrawal } from '../../services/paymentService';
import { getMyProviderDashboard } from '../../services/providerService';

import { EarningsResponseDto, ProviderDashboard, ProviderTransaction } from '../../types/backend/providers';

import MainEarningsChartSection from '../../components/provider/dashboard/MainEarningsChartSection';
import EarningsChartSection from '../../components/provider/earnings/EarningsChartSection';
import EarningsSummaryCard from '../../components/provider/earnings/EarningsSummaryCard';
import RecentTransactionsSection from '../../components/provider/earnings/RecentTransactionsSection';

const WHITE = '#FFFFFF';
const BACKGROUND_ALT = '#F8F9FD';
const TEXT_DARK = '#1A2538';
const TEXT_MEDIUM = '#4A5568';
const TEXT_MUTED = '#7A8599';
const ICON_PRIMARY = '#007AFF';
const SUCCESS_GREEN = '#28a745';
const DANGER_RED = '#dc3545';
const WARNING_YELLOW = '#FFC107';
const BORDER_SUBTLE = 'rgba(0,0,0,0.08)';
const SHADOW_COLOR_CARD = 'rgba(0, 0, 0, 0.06)';
const SHADOW_COLOR_SECTION = 'rgba(0, 0, 0, 0.1)';
const PRIMARY_LIGHT = '#EBF5FF';

interface ChartData {
  labels: string[];
  datasets: {
    data: number[];
    color?: (opacity: number) => string;
    strokeWidth?: number;
  }[];
}

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

const CustomHeader: React.FC<{
  onBackPress: () => void;
  onManageBankDetailsPress: () => void;
  animation: Animated.Value;
}> = ({ onBackPress, onManageBankDetailsPress, animation }) => {
  return (
    <Animated.View style={[styles.customHeader, { opacity: animation, transform: [{ translateY: animation.interpolate({ inputRange: [0, 1], outputRange: [-20, 0] }) }] }]}>
      <TouchableOpacity onPress={onBackPress} style={styles.headerBackButton}>
        <Ionicons name="arrow-back" size={24} color={WHITE} />
      </TouchableOpacity>
      <Text style={[styles.headerTitle, { color: WHITE }]}>Meus Ganhos</Text>
      <TouchableOpacity onPress={onManageBankDetailsPress} style={styles.headerActionIcon}>
        <Ionicons name="card-outline" size={26} color={WHITE} />
      </TouchableOpacity>
    </Animated.View>
  );
};

export default function ProviderEarningsScreen() {
  const router = useRouter();

  const [dashboardData, setDashboardData] = useState<ProviderDashboard | null>(null);
  const [earningsData, setEarningsData] = useState<EarningsResponseDto | null>(null);
  const [recentTransactions, setRecentTransactions] = useState<ProviderTransaction[]>([]);
  const [chartData, setChartData] = useState<ChartData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const headerAnim = useRef(new Animated.Value(0)).current;
  const summaryAnim = useRef(new Animated.Value(0)).current;
  const mainChartAnim = useRef(new Animated.Value(0)).current;
  const chartSectionAnim = useRef(new Animated.Value(0)).current;
  const transactionsSectionAnim = useRef(new Animated.Value(0)).current;

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    try {
      const fetchedDashboardData = await getMyProviderDashboard(); 
      const fetchedEarnings: EarningsResponseDto = await getMyProviderEarnings(); 

      setDashboardData(fetchedDashboardData); 
      setEarningsData(fetchedEarnings); 
      setRecentTransactions(fetchedEarnings.recentTransactions || []); 

      const monthlyEarningsMap: { [key: string]: number } = fetchedEarnings.earningsBreakdown || {}; 
      const today = new Date();
      const labels: string[] = [];
      const dataPoints: number[] = [];

      for (let i = 3; i >= 0; i--) {
        const date = new Date(today.getFullYear(), today.getMonth() - i, 1);
        const monthKey = date.toLocaleString('pt-BR', { month: 'short', year: 'numeric' });
        labels.push(date.toLocaleDateString('pt-BR', { month: 'short' }));
        dataPoints.push(monthlyEarningsMap[monthKey] || 0);
      }

      setChartData({
        labels: labels,
        datasets: [{
          data: dataPoints,
          color: (opacity = 1) => `rgba(0, 122, 255, ${opacity})`,
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
      Animated.timing(mainChartAnim, { toValue: 1, duration: 600, useNativeDriver: true }),
      Animated.timing(chartSectionAnim, { toValue: 1, duration: 600, useNativeDriver: true }),
      Animated.timing(transactionsSectionAnim, { toValue: 1, duration: 600, useNativeDriver: true }),
    ]).start();

  }, [fetchData, headerAnim, summaryAnim, mainChartAnim, chartSectionAnim, transactionsSectionAnim]);

  const onRefresh = useCallback(() => {
    setIsRefreshing(true);
    fetchData();
  }, [fetchData]);

  const handleWithdrawalRequest = async () => {
    const amountToWithdraw = earningsData?.availableForWithdrawal ?? dashboardData?.totalEarnings;

    if (!amountToWithdraw || amountToWithdraw <= 0 || (earningsData?.pendingWithdrawals ?? 0) > 0) {
      Alert.alert("Atenção", "Você não possui saldo disponível para saque ou já tem um saque pendente.");
      return;
    }

    Alert.alert(
      "Solicitar Saque",
      `Deseja solicitar o saque de R$ ${amountToWithdraw.toFixed(2).replace('.', ',')} para sua conta bancária cadastrada?`,
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Confirmar Saque",
          onPress: async () => {
            setIsLoading(true);
            try {
              await requestWithdrawal({
                amount: amountToWithdraw,
                bankName: 'Banco do Brasil',
                agencyNumber: '1234',
                accountNumber: '56789-0',
                accountType: 'CONTA_CORRENTE',
                notes: 'Saque solicitado pelo app'
              });
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
          <ActivityIndicator size="large" color={ICON_PRIMARY} />
          <Text style={[styles.loadingText, { color: TEXT_MUTED }]}>Carregando seus dados financeiros...</Text>
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
            tintColor={ICON_PRIMARY}
          />
        }
      >
        <EarningsSummaryCard
          dashboardData={dashboardData}
          animation={summaryAnim}
          onWithdrawalRequest={handleWithdrawalRequest}
        />

        {earningsData && (
          <MainEarningsChartSection
            contentAnim={mainChartAnim}
            totalGrossSales={earningsData.totalEarnings}
            earningsSummary={{
              today: earningsData.dailyEarnings || 0,
              weekly: earningsData.weeklyEarnings || 0,
              monthly: earningsData.monthlyEarnings || 0,
            }}
            isLoading={isLoading}
            onChartDetailPress={() => console.log('Detalhe do gráfico pressionado')}
          />
        )}

        <EarningsChartSection chartData={chartData} animation={chartSectionAnim} />

        <RecentTransactionsSection
          transactions={recentTransactions}
          animation={transactionsSectionAnim}
        />

        <TouchableOpacity
          style={styles.quickLinkCard}
          onPress={() => router.push('/(provider)/services' as any)}
        >
          <Ionicons name="briefcase-outline" size={24} color={ICON_PRIMARY} />
          <Text style={[styles.quickLinkText, { color: TEXT_DARK }]}>Meus Serviços Oferecidos</Text>
          <Ionicons name="chevron-forward-outline" size={20} color={TEXT_MUTED} />
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.quickLinkCard}
          onPress={() => router.push('/(provider)/reviews' as any)}
        >
          <Ionicons name="star-outline" size={24} color={WARNING_YELLOW} />
          <Text style={[styles.quickLinkText, { color: TEXT_DARK }]}>Minhas Avaliações</Text>
          <Ionicons name="chevron-forward-outline" size={20} color={TEXT_MUTED} />
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}
const styles = StyleSheet.create({
  outerContainer: {
    flex: 1,
    backgroundColor: BACKGROUND_ALT,
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
    color: TEXT_MUTED,
    fontFamily: 'System'
  },
  customHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: ICON_PRIMARY,
    paddingHorizontal: 15,
    paddingVertical: Platform.OS === 'ios' ? 50 : 10,
    paddingTop: Platform.OS === 'ios' ? 50 : 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    marginTop: 15,
    elevation: 5,
  },
  headerBackButton: {
    padding: 5,
    marginRight: 15,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: WHITE,
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
    color: TEXT_DARK,
    marginBottom: 15,
    marginTop: 10,
    fontFamily: 'System'
  },
  summaryContainer: {
    backgroundColor: WHITE,
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
    ...Platform.select({
      ios: { shadowColor: SHADOW_COLOR_SECTION, shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.15, shadowRadius: 6 },
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
    backgroundColor: BACKGROUND_ALT,
    borderRadius: 10,
    padding: 15,
    marginBottom: 15,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: BORDER_SUBTLE,
  },
  summaryCardTitle: {
    fontSize: 14,
    color: TEXT_MUTED,
    marginTop: 8,
    marginBottom: 5,
    textAlign: 'center',
    fontFamily: 'System'
  },
  summaryCardValue: {
    fontSize: 22,
    fontWeight: 'bold',
    color: TEXT_DARK,
    textAlign: 'center',
    fontFamily: 'System'
  },
  summaryCardSubtitle: {
    fontSize: 12,
    color: TEXT_MUTED,
    marginTop: 2,
    textAlign: 'center',
    fontFamily: 'System'
  },
  withdrawalButton: {
    backgroundColor: SUCCESS_GREEN,
    borderRadius: 8,
    paddingVertical: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    ...Platform.select({
      ios: { shadowColor: SHADOW_COLOR_CARD, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 6 },
      android: { elevation: 6 },
    }),
  },
  withdrawalButtonDisabled: {
    backgroundColor: '#A5D6A7', // Cor de desabilitado para o verde
    opacity: 0.6,
    elevation: 0,
    shadowOpacity: 0,
  },
  withdrawalButtonText: {
    color: WHITE,
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 10,
    fontFamily: 'System'
  },
  chartSection: {
    backgroundColor: WHITE,
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
    ...Platform.select({
      ios: { shadowColor: SHADOW_COLOR_SECTION, shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.15, shadowRadius: 6 },
      android: { elevation: 4 },
    }),
  },
  chartContainerPlaceholder: {
    backgroundColor: BACKGROUND_ALT,
    borderRadius: 10,
    width: '100%',
    height: 200,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
    borderWidth: 1,
    borderColor: BORDER_SUBTLE,
    borderStyle: 'dashed',
  },
  chartPlaceholderText: {
    fontSize: 16,
    color: TEXT_MUTED,
    marginTop: 10,
    fontFamily: 'System'
  },
  transactionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderColor: BORDER_SUBTLE,
  },
  transactionDetails: {
    flex: 1,
    marginLeft: 10,
  },
  transactionDescription: {
    fontSize: 15,
    fontWeight: '500',
    color: TEXT_DARK,
  },
  transactionDate: {
    fontSize: 13,
    color: TEXT_MUTED,
    marginTop: 2,
  },
  transactionAmount: {
    fontSize: 16,
    fontWeight: 'bold',
    color: TEXT_DARK,
  },
  viewAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    marginTop: 10,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderColor: BORDER_SUBTLE,
  },
  viewAllButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: ICON_PRIMARY,
    marginRight: 5,
  },
  emptyStateContainer: {
    alignItems: 'center',
    paddingVertical: 20,
    backgroundColor: BACKGROUND_ALT,
    borderRadius: 12,
    marginTop: 10,
  },
  emptyText: {
    textAlign: 'center',
    color: TEXT_MUTED,
    fontSize: 15,
    marginTop: 8,
  },
  quickLinkCard: {
    backgroundColor: WHITE,
    borderRadius: 12,
    paddingVertical: 15,
    paddingHorizontal: 20,
    marginBottom: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: BORDER_SUBTLE,
    ...Platform.select({
      ios: { shadowColor: SHADOW_COLOR_CARD, shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.08, shadowRadius: 4 },
      android: { elevation: 3 },
    }),
  },
  quickLinkText: {
    fontSize: 16,
    fontWeight: '600',
    color: TEXT_DARK,
    flex: 1,
    marginLeft: 15,
  },
});