import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Dimensions,
  Platform,
  TouchableOpacity,
  Animated,
  Easing,
  Image,
  ImageSourcePropType,
  useColorScheme,
    RefreshControl, // <--- ADICIONADO: Importação do RefreshControl

} from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LineChart } from 'react-native-chart-kit';
import { LinearGradient } from 'expo-linear-gradient';

import { metricsService } from '../../../services/metricsService';
import { MetricsSummary, MetricsTimeseriesDataPoint, MetricsFunnel } from '../../../types/backend/metrics';

import { KPIValue } from '../../../components/KPIValue';
import { Skeleton } from '../../../components/Skeleton';
import { EmptyState } from '../../../components/EmptyState';
import Colors from '../../../constants/Colors'; // Import Colors for theming

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const HERO_HEIGHT = SCREEN_HEIGHT * 0.38; // Consistent hero height

// ---------- 3D ICONS (absolute paths) ----------
const Icons3D = {
  heroStats: require('../../../assets/images/3d/uptrend.png'), // Using uptrend for hero
  chart: require('../../../assets/images/3d/uptrend.png'),
  progress: require('../../../assets/images/3d/check.png'),
  funnel: require('../../../assets/images/3d/payments.png'), // Reusing payments as a generic process icon
  woman: require('../../../assets/images/3d/woman.png'), // From missions
  crown: require('../../../assets/images/3d/crown.png'), // From ranking
} satisfies Record<string, ImageSourcePropType>;

const Icon3D = ({
  src,
  size = 28,
  style,
}: { src: ImageSourcePropType; size?: number; style?: any }) => (
  <Image source={src} style={[{ width: size, height: size }, style]} resizeMode="contain" />
);

// ===== Utils =====
const withAlpha = (hex: string, alpha: number) => {
  const h = hex.replace('#', '');
  const full = h.length === 3 ? h.split('').map(c => c + c).join('') : h;
  const int = parseInt(full, 16);
  const r = (int >> 16) & 255;
  const g = (int >> 8) & 255;
  const b = int & 255;
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
};

function useTheme() {
  const scheme = useColorScheme?.() || 'light';
  const theme = (Colors as any)[scheme] || (Colors as any).light;
  return theme as typeof Colors.light;
}

export default function ClientMetricsScreen() {
  const router = useRouter();
  const theme = useTheme();

  const [summary, setSummary] = useState<MetricsSummary | null>(null);
  const [timeseries, setTimeseries] = useState<MetricsTimeseriesDataPoint[]>([]);
  const [funnel, setFunnel] = useState<MetricsFunnel | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const headerAnim = useRef(new Animated.Value(0)).current;
  const contentAnim = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const scrollRef = useRef<ScrollView>(null);

  const fetchMetrics = useCallback(async () => {
    try {
      setLoading(true);
      setError(null); // Clear previous errors
      const [summaryData, timeseriesData, funnelData] = await Promise.all([
        metricsService.getMetricsSummary(),
        metricsService.getMetricsTimeseries('month'),
        metricsService.getMetricsFunnel(),
      ]);
      setSummary(summaryData);
      setTimeseries(timeseriesData);
      setFunnel(funnelData);
    } catch (err) {
      console.error('Failed to fetch metrics:', err);
      setError('Não foi possível carregar as métricas. Tente novamente mais tarde.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    Animated.parallel([
      Animated.timing(headerAnim, {
        toValue: 1,
        duration: 500,
        easing: Easing.out(Easing.ease),
        useNativeDriver: true,
      }),
      Animated.timing(contentAnim, {
        toValue: 1,
        duration: 700,
        delay: 100,
        easing: Easing.out(Easing.ease),
        useNativeDriver: true,
      }),
    ]).start();

    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.02,
          duration: 2000,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 2000,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ])
    ).start();

    fetchMetrics();
  }, [headerAnim, contentAnim, fetchMetrics, pulseAnim]);

  const chartConfig = {
    backgroundGradientFrom: theme.background,
    backgroundGradientTo: theme.background,
    decimalPlaces: 0,
    color: (opacity = 1) => `rgba(74, 144, 226, ${opacity})`,
    labelColor: (opacity = 1) => theme.text,
    strokeWidth: 2,
    barPercentage: 0.5,
    useShadowColorFromDataset: false,
    propsForDots: {
      r: "4",
      strokeWidth: "2",
      stroke: theme.primary,
    },
  };

  if (loading) {
    return (
      <View style={[styles.centeredFeedback, { backgroundColor: theme.background }]}>
        <Stack.Screen options={{ headerShown: false }} />
        <ActivityIndicator size="large" color={theme.primary} />
        <Text style={[styles.loadingText, { color: theme.textMuted }]}>Carregando métricas...</Text>
      </View>
    );
  }

  const chartData = {
    labels: timeseries.map(data => new Date(data.date).getDate().toString()),
    datasets: [
      {
        data: timeseries.map(data => data.bookings),
        color: (opacity = 1) => withAlpha(theme.primary, opacity),
        strokeWidth: 2,
        withDots: true,
      },
      {
        data: timeseries.map(data => data.revenue / 100),
        color: (opacity = 1) => `rgba(76, 175, 80, ${opacity})`,
        strokeWidth: 2,
        withDots: true,
      }
    ],
    legend: ["Agendamentos", "Receita (R$)"]
  };

  const hasData = summary && (summary.totalBookings > 0 || summary.totalRevenue > 0 || summary.completedMissions > 0 || timeseries.length > 0 || funnel);

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <Stack.Screen options={{ headerShown: false }} />

      {/* Header de navegação sobreposto (transparente) */}
      <Animated.View
        style={[
          styles.customHeader,
          {
            opacity: headerAnim,
            transform: [{ translateY: headerAnim.interpolate({ inputRange: [0, 1], outputRange: [-40, 0] }) }],
            backgroundColor: 'transparent',
            borderBottomWidth: 0,
            shadowOpacity: 0,
          },
        ]}
      >
        <TouchableOpacity onPress={() => router.back()} style={styles.headerBackButton} accessibilityLabel="Voltar">
          <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: '#FFFFFF' }]}>Minhas Métricas</Text>
        <View style={styles.headerActionIconPlaceholder} />
      </Animated.View>

      <ScrollView
        ref={scrollRef}
        contentContainerStyle={styles.scrollViewContentContainer}
        refreshControl={
          <RefreshControl refreshing={false} onRefresh={fetchMetrics} tintColor={theme.primary} />
        }
      >
        {/* HERO */}
        <View style={styles.heroWrapper}>
          <Animated.Image
            source={Icons3D.woman}
            style={[
              styles.heroWomanIcon,
              { transform: [{ scale: pulseAnim }] }
            ]}
            resizeMode="contain"
          />

          <LinearGradient
            colors={['rgba(173, 216, 230, 0.7)', 'rgba(74, 145, 226, 0.72)', 'rgba(173, 216, 230, 0.7)']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.heroGradient}
          >
            <Image
              source={Icons3D.heroStats}
              style={{ position: 'absolute', right: 12, top: Platform.OS === 'ios' ? 56 : 40, width: 54, height: 54, opacity: 0.10 }}
              resizeMode="contain"
            />
            <View style={styles.heroContent}>
              <Text style={styles.heroKicker}>DESEMPENHO E INSIGHTS</Text>
              <Text style={styles.heroTitle}>
                Acompanhe seu progresso e resultados!
              </Text>

              <TouchableOpacity style={styles.heroStartButton} onPress={() => scrollRef.current?.scrollToEnd({ animated: true })} accessibilityLabel="Ver Métricas">
                <Text style={styles.heroStartText}>VER MÉTRICAS</Text>
                <Ionicons name="stats-chart" size={16} color={theme.primary} />
              </TouchableOpacity>
            </View>
          </LinearGradient>
        </View>

        {/* Painel branco sobreposto */}
        <Animated.View
          style={[
            styles.panel,
            {
              opacity: contentAnim,
              transform: [{ translateY: contentAnim.interpolate({ inputRange: [0, 1], outputRange: [20, 0] }) }],
              backgroundColor: theme.background,
            },
          ]}
        >
          {error ? (
            <View style={styles.errorContainer}>
              <Ionicons name="alert-circle-outline" size={50} color={theme.error} />
              <Text style={[styles.errorText, { color: theme.textMuted }]}>{error}</Text>
              <TouchableOpacity style={[styles.retryButton, { backgroundColor: theme.primary }]} onPress={fetchMetrics}>
                <Text style={styles.retryButtonText}>Tentar Novamente</Text>
              </TouchableOpacity>
            </View>
          ) : !hasData ? (
            <EmptyState
              title="Nenhuma Métrica Disponível"
              subtitle="Parece que você ainda não tem dados para exibir. Comece a explorar nossos serviços!"
              ctaLabel="Explorar Serviços"
              onPress={() => router.push('/(client)/explore' as any)}
            />
          ) : (
            <>
              {/* Metrics Summary Card */}
              {summary ? (
                <View style={[styles.sectionCard, { backgroundColor: theme.cardBackground }]}>
                  <Text style={[styles.cardTitle, { color: theme.text }]}>Resumo Geral</Text>
                  <View style={styles.summaryGrid}>
                    <View style={[styles.summaryItem, { backgroundColor: theme.background }]}>
                      <KPIValue value={summary.totalBookings} style={[styles.summaryValue, { color: theme.primary }]} />
                      <Text style={[styles.summaryLabel, { color: theme.textMuted }]}>Agendamentos Totais</Text>
                    </View>
                    <View style={[styles.summaryItem, { backgroundColor: theme.background }]}>
                      <KPIValue value={summary.totalRevenue} prefix="R$ " style={[styles.summaryValue, { color: theme.primary }]} />
                      <Text style={[styles.summaryLabel, { color: theme.textMuted }]}>Receita Total</Text>
                    </View>
                    <View style={[styles.summaryItem, { backgroundColor: theme.background }]}>
                      <KPIValue value={summary.averageRating} style={[styles.summaryValue, { color: theme.primary }]} />
                      <Text style={[styles.summaryLabel, { color: theme.textMuted }]}>Avaliação Média</Text>
                    </View>
                    <View style={[styles.summaryItem, { backgroundColor: theme.background }]}>
                      <KPIValue value={summary.completedMissions} style={[styles.summaryValue, { color: theme.primary }]} />
                      <Text style={[styles.summaryLabel, { color: theme.textMuted }]}>Missões Concluídas</Text>
                    </View>
                  </View>
                </View>
              ) : (
                <View style={[styles.sectionCard, { backgroundColor: theme.cardBackground }]}>
                  <Text style={[styles.cardTitle, { color: theme.text }]}>Resumo Geral</Text>
                  <Skeleton height={150} width="100%" radius={12} />
                </View>
              )}

              {/* Timeseries Chart Card (Bookings and Revenue) */}
              {timeseries.length > 0 ? (
                <View style={[styles.sectionCard, { backgroundColor: theme.cardBackground }]}>
                  <Text style={[styles.cardTitle, { color: theme.text }]}>Agendamentos e Receita (Último Mês)</Text>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                    <LineChart
                      data={chartData}
                      width={Math.max(SCREEN_WIDTH - 60, timeseries.length * 40)}
                      height={220}
                      chartConfig={chartConfig}
                      bezier
                      style={styles.chart}
                    />
                  </ScrollView>
                </View>
              ) : (
                <View style={[styles.sectionCard, { backgroundColor: theme.cardBackground }]}>
                  <Text style={[styles.cardTitle, { color: theme.text }]}>Agendamentos e Receita (Último Mês)</Text>
                  <Skeleton height={220} width="100%" radius={16} />
                </View>
              )}

              {/* Conversion Funnel Card */}
              {funnel ? (
                <View style={[styles.sectionCard, { backgroundColor: theme.cardBackground }]}>
                  <Text style={[styles.cardTitle, { color: theme.text }]}>Funil de Conversão</Text>
                  {funnel.steps.map((step, index) => (
                    <View key={index} style={styles.funnelItem}>
                      <Text style={[styles.funnelLabel, { color: theme.text }]}>{step.name}</Text>
                      <Text style={[styles.funnelValue, { color: theme.textMuted }]}>{step.count} ({step.percentage.toFixed(1)}%)</Text>
                      <View style={[styles.funnelProgressBarContainer, { backgroundColor: withAlpha(theme.textMuted, 0.2) }]}>
                        <View style={[styles.funnelProgressBar, { width: `${step.percentage}%`, backgroundColor: theme.primary }]} />
                      </View>
                    </View>
                  ))}
                </View>
              ) : (
                <View style={[styles.sectionCard, { backgroundColor: theme.cardBackground }]}>
                  <Text style style={[styles.cardTitle, { color: theme.text }]}>Funil de Conversão</Text>
                  <Skeleton height={150} width="100%" radius={12} />
                </View>
              )}
            </>
          )}
        </Animated.View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  centeredFeedback: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  loadingText: { marginTop: 10, fontSize: 16 },

  // Header transparente
  customHeader: {
    position: 'absolute',
    top: 0, left: 0, right: 0,
    zIndex: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 15,
    paddingVertical: Platform.OS === 'ios' ? 50 : 20,
    paddingTop: Platform.OS === 'ios' ? 50 : 20,
  },
  headerBackButton: { marginRight: 15 },
  headerTitle: { fontSize: 18, fontWeight: 'bold', flex: 1, textAlign: 'center' },
  headerActionIconPlaceholder: { width: 24, marginLeft: 15 },

  // Scroll
  scrollViewContentContainer: { flexGrow: 1 },

  // Hero
  heroWrapper: { height: HERO_HEIGHT, width: '100%' },
  heroGradient: {
    flex: 1,
    paddingTop: Platform.OS === 'ios' ? 200 : 120,
    paddingHorizontal: 28,
    justifyContent: 'flex-start',
  },
  heroWomanIcon: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 260 : 280,
    left: '60%',
    marginLeft: 0,
    width: 180,
    height: 180,
    zIndex: 10,
  },
  heroContent: {
    flex: 1,
    zIndex: 2,
  },
  heroKicker: { color: '#D7ECFF', letterSpacing: 1.2, fontWeight: '700', fontSize: 12 },
  heroTitle: { color: '#FFFFFF', fontSize: 24, fontWeight: '800', marginTop: 6, lineHeight: 30, maxWidth: '90%' },
  heroStartButton: {
    marginTop: 16, alignSelf: 'flex-start', backgroundColor: '#FFFFFF',
    paddingVertical: 10, paddingHorizontal: 16, borderRadius: 20, flexDirection: 'row', alignItems: 'center', gap: 6,
  },
  heroStartText: { color: '#0A84FF', fontWeight: '800', fontSize: 13 },

  // Panel
  panel: {
    marginTop: -24,
    borderTopLeftRadius: 18,
    borderTopRightRadius: 18,
    paddingTop: 16,
    paddingBottom: 24,
  },

  // Error State
  errorContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 30,
    marginHorizontal: 15,
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 4, elevation: 2,
  },
  errorText: {
    marginTop: 10,
    fontSize: 16,
    textAlign: 'center',
  },
  retryButton: {
    marginTop: 20,
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },

  // Section Cards
  sectionCard: {
    marginHorizontal: 15,
    marginBottom: 14,
    borderRadius: 12,
    padding: 14,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 4, elevation: 2,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 15,
  },
  summaryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  summaryItem: {
    width: '48%',
    borderRadius: 8,
    padding: 15,
    marginBottom: 10,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.04, shadowRadius: 2, elevation: 1,
  },
  summaryValue: {
    fontSize: 22,
    fontWeight: 'bold',
  },
  summaryLabel: {
    fontSize: 13,
    textAlign: 'center',
    marginTop: 5,
  },
  chart: {
    marginVertical: 8,
    borderRadius: 16,
  },
  funnelItem: {
    marginBottom: 15,
  },
  funnelLabel: {
    fontSize: 15,
    fontWeight: '600',
  },
  funnelValue: {
    fontSize: 14,
    marginTop: 4,
  },
  funnelProgressBarContainer: {
    height: 8,
    borderRadius: 4,
    marginTop: 8,
    overflow: 'hidden',
  },
  funnelProgressBar: {
    height: '100%',
    borderRadius: 4,
  },
});