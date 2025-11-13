// LimpeJaApp/app/(provider)/earnings.tsx
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
import * as Haptics from 'expo-haptics'; // Adicionado para iOS premium

// Import NotificationUIService
import NotificationUIService from '../../services/notificationUIService'; // Added

import { getMyProviderEarnings } from '../../services/earningService';
import { PROVIDER_ROUTES } from '../../constants/routes';
import { requestWithdrawal } from '../../services/paymentService'; // Esta função ainda é usada se o saque for confirmado
import { getMyProviderDashboard } from '../../services/providerService';

import { EarningsResponseDto, ProviderDashboard, ProviderTransaction } from '../../types/backend/providers';

import MainEarningsChartSection from '../../components/provider/dashboard/MainEarningsChartSection';
import EarningsChartSection from '../../components/provider/earnings/EarningsChartSection';
import EarningsSummaryCard from '../../components/provider/earnings/EarningsSummaryCard';
import ProviderNudgeContainer from '../../components/provider/ProviderNudgeContainer'; // Added
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
    if (Platform.OS === 'ios') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); // Premium haptic
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
      <TouchableOpacity onPress={onBackPress} style={styles.headerBackButton} activeOpacity={0.92}>
        <Ionicons name="arrow-back" size={24} color={WHITE} />
      </TouchableOpacity>
      <Text style={[styles.headerTitle, { color: WHITE }]}>Meus Ganhos</Text>
      <TouchableOpacity onPress={onManageBankDetailsPress} style={styles.headerActionIcon} activeOpacity={0.92}>
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

  // Adicionado ref para verificar se o componente está montado
  const isMounted = useRef(true);
  // Ref para armazenar a animação composta
  const animationSequenceRef = useRef<Animated.CompositeAnimation | null>(null);


  const fetchData = useCallback(async () => {
    if (isMounted.current) {
      setIsLoading(true);
    }
    try {
      const fetchedDashboardData = await getMyProviderDashboard();
      const fetchedEarnings: EarningsResponseDto = await getMyProviderEarnings();

      if (!isMounted.current) return;

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
      if (isMounted.current) {
        NotificationUIService.showError(err.response?.data?.message || "Não foi possível carregar seus dados de ganhos. Tente novamente mais tarde.", "Erro");
      }
    } finally {
      if (isMounted.current) {
        setIsLoading(false);
        setIsRefreshing(false);
      }
    }
  }, []);

  useEffect(() => {
    isMounted.current = true; // Componente montado
    fetchData();

    // Staggered animation for sections (suave iOS)
    const animationSequence = Animated.stagger(180, [
      Animated.timing(headerAnim, { toValue: 1, duration: 600, useNativeDriver: true }),
      Animated.timing(summaryAnim, { toValue: 1, duration: 700, useNativeDriver: true }),
      Animated.timing(mainChartAnim, { toValue: 1, duration: 700, useNativeDriver: true }),
      Animated.timing(chartSectionAnim, { toValue: 1, duration: 700, useNativeDriver: true }),
      Animated.timing(transactionsSectionAnim, { toValue: 1, duration: 700, useNativeDriver: true }),
    ]);
    animationSequenceRef.current = animationSequence; // Armazenar a referência
    animationSequence.start();

    return () => {
      isMounted.current = false; // Componente desmontado
      // Stop all animations if component unmounts mid-animation
      if (animationSequenceRef.current) {
        animationSequenceRef.current.stop();
      }
    };
  }, [fetchData, headerAnim, summaryAnim, mainChartAnim, chartSectionAnim, transactionsSectionAnim]);

  const onRefresh = useCallback(() => {
    setIsRefreshing(true);
    fetchData();
  }, [fetchData]);

  // A função handleWithdrawalRequest não é mais chamada diretamente pelo EarningsSummaryCard
  // mas pode ser mantida aqui se for usada em outro lugar ou para futuras implementações
  const handleWithdrawalRequest = async () => {
    const amountToWithdraw = earningsData?.availableForWithdrawal ?? dashboardData?.totalEarnings;

    if (!amountToWithdraw || amountToWithdraw <= 0 || (earningsData?.pendingWithdrawals ?? 0) > 0) {
      NotificationUIService.showInfo("Você não possui saldo disponível para saque ou já tem um saque pendente.", "Atenção");
      return;
    }

    Alert.alert( // Kept Alert for confirmation
      "Solicitar Saque",
      `Deseja solicitar o saque de R$ ${amountToWithdraw.toFixed(2).replace('.', ',')} para sua conta bancária cadastrada?`,
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Confirmar Saque",
          onPress: async () => {
            if (isMounted.current) {
              setIsLoading(true);
            }
            try {
              await requestWithdrawal({
                amount: amountToWithdraw,
                bankName: 'Banco do Brasil',
                agencyNumber: '1234',
                accountNumber: '56789-0',
                accountType: 'CONTA_CORRENTE',
                notes: 'Saque solicitado pelo app'
              });
              if (isMounted.current) {
                NotificationUIService.showSuccess("Seu pedido de saque foi enviado com sucesso e será processado em breve! Você será notificado sobre o status.", "Saque Solicitado");
                fetchData();
              }
            } catch (error: any) {
              console.error("Erro ao solicitar saque:", error.response?.data || error.message);
              if (isMounted.current) {
                NotificationUIService.showError(error.response?.data?.message || "Não foi possível solicitar o saque.", "Erro");
              }
            } finally {
              if (isMounted.current) {
                setIsLoading(false);
              }
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
          // REMOVIDO: onWithdrawalRequest={handleWithdrawalRequest}
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
          onPress={() => router.push(PROVIDER_ROUTES.SERVICES_LIST as any)}
          activeOpacity={0.92}
        >
          <Ionicons name="briefcase-outline" size={24} color={ICON_PRIMARY} />
          <Text style={[styles.quickLinkText, { color: TEXT_DARK }]}>Meus Serviços Oferecidos</Text>
          <Ionicons name="chevron-forward-outline" size={20} color={TEXT_MUTED} />
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.quickLinkCard}
          onPress={() => router.push(PROVIDER_ROUTES.REVIEWS as any)}
          activeOpacity={0.92}
        >
          <Ionicons name="star-outline" size={24} color={WARNING_YELLOW} />
          <Text style={[styles.quickLinkText, { color: TEXT_DARK }]}>Minhas Avaliações</Text>
          <Ionicons name="chevron-forward-outline" size={20} color={TEXT_MUTED} />
        </TouchableOpacity>
      </ScrollView>
      <ProviderNudgeContainer /> {/* Added ProviderNudgeContainer */}
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
    padding: 18, // Mais padding iOS
    paddingBottom: 50,
  },
  centeredFeedback: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  loadingText: {
    marginTop: 18,
    fontSize: 17,
    color: TEXT_MUTED,
    fontFamily: Platform.OS === 'ios' ? 'SFProText-Medium' : 'System',
  },
  customHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: ICON_PRIMARY,
    paddingHorizontal: 18,
    paddingVertical: Platform.OS === 'ios' ? 15 : 12,
    paddingTop: Platform.OS === 'ios' ? 55 : 24,
    // iOS Premium Shadow
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.15,
        shadowRadius: 12,
      },
      android: { elevation: 8 },
    }),
  },
  headerBackButton: {
    padding: 8,
    marginRight: 16,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: WHITE,
    flex: 1,
    textAlign: 'center',
    fontFamily: Platform.OS === 'ios' ? 'SFProDisplay-Semibold' : 'System',
  },
  headerActionIcon: {
    padding: 8,
    marginLeft: 16,
  },
  headerActionIconPlaceholder: {
    width: 40,
    marginLeft: 16,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: '600',
    color: TEXT_DARK,
    marginBottom: 18,
    marginTop: 12,
    fontFamily: Platform.OS === 'ios' ? 'SFProDisplay-Semibold' : 'System',
  },
  summaryContainer: {
    backgroundColor: WHITE,
    borderRadius: 16, // Mais arredondado iOS
    padding: 24,
    marginBottom: 24,
    // iOS Premium Shadow
    ...Platform.select({
      ios: { shadowColor: SHADOW_COLOR_SECTION, shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.1, shadowRadius: 12 },
      android: { elevation: 6 },
    }),
  },
  summaryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  summaryCard: {
    width: '48%',
    backgroundColor: BACKGROUND_ALT,
    borderRadius: 12,
    padding: 18,
    marginBottom: 18,
    alignItems: 'center',
    borderWidth: 0.5,
    borderColor: BORDER_SUBTLE,
    // iOS clean shadow
    ...Platform.select({
      ios: { shadowColor: SHADOW_COLOR_CARD, shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 4 },
      android: { elevation: 2 },
    }),
  },
  summaryCardTitle: {
    fontSize: 15,
    color: TEXT_MUTED,
    marginTop: 10,
    marginBottom: 6,
    textAlign: 'center',
    fontFamily: Platform.OS === 'ios' ? 'SFProText-Regular' : 'System',
  },
  summaryCardValue: {
    fontSize: 24, // Maior iOS
    fontWeight: 'bold',
    color: TEXT_DARK,
    textAlign: 'center',
    fontFamily: Platform.OS === 'ios' ? 'SFProDisplay-Bold' : 'System',
  },
  summaryCardSubtitle: {
    fontSize: 13,
    color: TEXT_MUTED,
    marginTop: 3,
    textAlign: 'center',
    fontFamily: Platform.OS === 'ios' ? 'SFProText-Regular' : 'System',
  },
  withdrawalButton: {
    backgroundColor: SUCCESS_GREEN,
    borderRadius: 10,
    paddingVertical: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    // iOS Premium Shadow
    ...Platform.select({
      ios: { shadowColor: SHADOW_COLOR_CARD, shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.2, shadowRadius: 8 },
      android: { elevation: 8 },
    }),
  },
  withdrawalButtonDisabled: {
    backgroundColor: '#A5D6A7',
    opacity: 0.7,
    elevation: 0,
    shadowOpacity: 0,
  },
  withdrawalButtonText: {
    color: WHITE,
    fontSize: 17,
    fontWeight: '600',
    marginLeft: 12,
    fontFamily: Platform.OS === 'ios' ? 'SFProText-Semibold' : 'System',
  },
  chartSection: {
    backgroundColor: WHITE,
    borderRadius: 16,
    padding: 24,
    marginBottom: 24,
    // iOS Premium Shadow
    ...Platform.select({
      ios: { shadowColor: SHADOW_COLOR_SECTION, shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.1, shadowRadius: 12 },
      android: { elevation: 6 },
    }),
  },
  chartContainerPlaceholder: {
    backgroundColor: BACKGROUND_ALT,
    borderRadius: 12,
    width: '100%',
    height: 220, // Maior para iOS
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
    borderWidth: 0.5,
    borderColor: BORDER_SUBTLE,
    borderStyle: 'dashed',
  },
  chartPlaceholderText: {
    fontSize: 17,
    color: TEXT_MUTED,
    marginTop: 12,
    fontFamily: Platform.OS === 'ios' ? 'SFProText-Regular' : 'System',
  },
  transactionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderColor: BORDER_SUBTLE,
  },
  transactionDetails: {
    flex: 1,
    marginLeft: 12,
  },
  transactionDescription: {
    fontSize: 16,
    fontWeight: '500',
    color: TEXT_DARK,
    fontFamily: Platform.OS === 'ios' ? 'SFProText-Medium' : 'System',
  },
  transactionDate: {
    fontSize: 14,
    color: TEXT_MUTED,
    marginTop: 3,
    fontFamily: Platform.OS === 'ios' ? 'SFProText-Regular' : 'System',
  },
  transactionAmount: {
    fontSize: 17,
    fontWeight: 'bold',
    color: TEXT_DARK,
    fontFamily: Platform.OS === 'ios' ? 'SFProDisplay-Bold' : 'System',
  },
  viewAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    marginTop: 12,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderColor: BORDER_SUBTLE,
  },
  viewAllButtonText: {
    fontSize: 17,
    fontWeight: '600',
    color: ICON_PRIMARY,
    marginRight: 6,
    fontFamily: Platform.OS === 'ios' ? 'SFProText-Semibold' : 'System',
  },
  emptyStateContainer: {
    alignItems: 'center',
    paddingVertical: 24,
    backgroundColor: BACKGROUND_ALT,
    borderRadius: 16,
    marginTop: 12,
  },
  emptyText: {
    textAlign: 'center',
    color: TEXT_MUTED,
    fontSize: 16,
    marginTop: 10,
    lineHeight: 22,
    fontFamily: Platform.OS === 'ios' ? 'SFProText-Regular' : 'System',
  },
  quickLinkCard: {
    backgroundColor: WHITE,
    borderRadius: 16,
    paddingVertical: 18,
    paddingHorizontal: 22,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 0.5,
    borderColor: BORDER_SUBTLE,
    // iOS Premium Shadow
    ...Platform.select({
      ios: { shadowColor: SHADOW_COLOR_CARD, shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.08, shadowRadius: 6 },
      android: { elevation: 4 },
    }),
  },
  quickLinkText: {
    fontSize: 17,
    fontWeight: '600',
    color: TEXT_DARK,
    flex: 1,
    marginLeft: 16,
    fontFamily: Platform.OS === 'ios' ? 'SFProText-Semibold' : 'System',
  },
});
