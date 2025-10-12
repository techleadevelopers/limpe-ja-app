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
  RefreshControl,
  AccessibilityInfo,
} from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LineChart } from 'react-native-chart-kit';
import { LinearGradient } from 'expo-linear-gradient';
import { useTranslation } from 'react-i18next';

import { metricsService } from '../../../services/metricsService';
import { MetricsSummary, MetricsTimeseriesDataPoint, MetricsFunnel } from '../../../types/backend/metrics';

import { KPIValue } from '../../../components/KPIValue';
import { Skeleton } from '../../../components/Skeleton';
import { EmptyState } from '../../../components/EmptyState';
import Toast from '../../../components/Toast';
import Colors from '../../../constants/Colors';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const HERO_HEIGHT = SCREEN_HEIGHT * 0.36; // Consistent with missions.tsx

// ---------- 3D ICONS (absolute paths) ----------
const Icons3D = {
  heroStats: require('../../../assets/images/3d/uptrend.png'),
  chart: require('../../../assets/images/3d/uptrend.png'),
  progress: require('../../../assets/images/3d/check.png'),
  funnel: require('../../../assets/images/3d/payments.png'),
  woman: require('../../../assets/images/3d/woman.png'),
  crown: require('../../../assets/images/3d/crown.png'),
  mascrank: require('../../../assets/images/3d/masc-rank.png'), // Reused for hero consistency
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

// Reduced motion (adapted from missions.tsx)
function useReducedMotion() {
  const [reduced, setReduced] = useState(false);
  useEffect(() => {
    (async () => {
      const enabled = await AccessibilityInfo.isReduceMotionEnabled();
      setReduced(enabled);
    })();
    const sub = AccessibilityInfo.addEventListener('reduceMotionChanged', (v) => setReduced(v));
    return () => sub?.remove?.();
  }, []);
  return reduced;
}

export default function ClientMetricsScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const theme = useTheme();
  const isReducedMotion = useReducedMotion();

  const [summary, setSummary] = useState<MetricsSummary | null>(null);
  const [timeseries, setTimeseries] = useState<MetricsTimeseriesDataPoint[]>([]);
  const [funnel, setFunnel] = useState<MetricsFunnel | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const headerAnim = useRef(new Animated.Value(0)).current;
  const contentAnim = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const scrollRef = useRef<ScrollView>(null);

  const fetchMetrics = useCallback(async () => {
    setIsRefreshing(true);
    try {
      setError(null);
      const [summaryData, timeseriesData, funnelData] = await Promise.all([
        metricsService.getMetricsSummary(),
        metricsService.getMetricsTimeseries('month'),
        metricsService.getMetricsFunnel(),
      ]);
      setSummary(summaryData);
      setTimeseries(timeseriesData);
      setFunnel(funnelData);
    } catch (err: any) {
      Toast.show({
        type: 'error',
        text1: t('common.error'),
        text2: 'Não foi possível carregar as métricas. Tente novamente.',
      });
      setError('Não foi possível carregar as métricas. Tente novamente mais tarde.');
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  }, [t]);

  useEffect(() => {
    Animated.parallel([
      Animated.timing(headerAnim, {
        toValue: 1,
        duration: isReducedMotion ? 0 : 420,
        easing: Easing.out(Easing.ease),
        useNativeDriver: true,
      }),
      Animated.timing(contentAnim, {
        toValue: 1,
        duration: isReducedMotion ? 0 : 640,
        delay: isReducedMotion ? 0 : 80,
        easing: Easing.out(Easing.ease),
        useNativeDriver: true,
      }),
    ]).start();

    if (!isReducedMotion) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.02,
            duration: 2200,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 2200,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
        ])
      ).start();
    } else {
      pulseAnim.setValue(1);
    }

    fetchMetrics();
  }, [headerAnim, contentAnim, fetchMetrics, pulseAnim, isReducedMotion]);

  const onRefresh = useCallback(() => {
    fetchMetrics();
  }, [fetchMetrics]);

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

  if (loading && !isRefreshing) {
    return (
      <View style={[styles.centeredFeedback, { backgroundColor: theme.background }]}>
        <Stack.Screen options={{ headerShown: false }} />
        <ActivityIndicator size="large" color={theme.primary} />
        <Text style={[styles.loadingText, { color: theme.textMuted }]}>{t('common.loading')}</Text>
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
    legend: ["Agendamentos", "Gasto Total (R$)"],
  };

  const hasData = summary && (summary.totalBookings > 0 || summary.totalRevenue > 0 || summary.completedMissions > 0 || timeseries.length > 0 || funnel);

  // Subtle hero gradient (adapted from missions.tsx)
  const heroGradient = [withAlpha(theme.cardBackground || '#FFFFFF', 1), withAlpha(theme.background || '#F6F8FB', 1)];

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <Stack.Screen options={{ headerShown: false }} />

      <Animated.View
        style={[
          styles.header,
          {
            paddingTop: Platform.OS === 'ios' ? 12 : 12,
            transform: [{ translateY: headerAnim.interpolate({ inputRange: [0, 1], outputRange: [-24, 0] }) }],
          },
        ]}
      >
        <TouchableOpacity onPress={() => router.back()} style={styles.headerLeft} accessibilityLabel={t('common.back') || 'Voltar'}>
          <Ionicons name="arrow-back" size={22} color={theme.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: theme.text }]}>{t('metrics.title', { defaultValue: 'Minhas Métricas' })}</Text>
        <View style={styles.headerRight} />
      </Animated.View>

      <ScrollView
        ref={scrollRef}
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} tintColor={theme.primary} />}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.heroWrapper}>
          <LinearGradient colors={heroGradient} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={[styles.hero, { backgroundColor: heroGradient[0] }]}>
            <View style={styles.heroTextWrap}>
              <Text style={[styles.kicker, { color: withAlpha(theme.text, 0.6) }]}>{t('metrics.hero_kicker', { defaultValue: 'SEU DESEMPENHO' })}</Text>
              <Text style={[styles.title, { color: theme.text }]}>{t('metrics.hero_title', { defaultValue: 'Acompanhe seu progresso e conquistas' })}</Text>

              <TouchableOpacity style={[styles.cta, { backgroundColor: theme.primary }]} onPress={() => { requestAnimationFrame(() => scrollRef.current?.scrollTo({ y: HERO_HEIGHT, animated: true })); }} accessibilityLabel={t('metrics.cta_label', { defaultValue: 'Ver Métricas' })}>
                <Text style={styles.ctaText}>{t('metrics.cta_text', { defaultValue: 'VER MÉTRICAS' })}</Text>
                <Ionicons name="stats-chart" size={14} color="#FFF" />
              </TouchableOpacity>

              {/* Stepper for client progress (adapted from missions.tsx) */}
              <View style={styles.stepper}>
                {[
                  { key: 'explore', label: t('metrics.steps.explore', { defaultValue: 'Explorar' }) },
                  { key: 'book', label: t('metrics.steps.book', { defaultValue: 'Agendar' }) },
                  { key: 'review', label: t('metrics.steps.review', { defaultValue: 'Avaliar' }) },
                  { key: 'achieve', label: t('metrics.steps.achieve', { defaultValue: 'Conquistas' }) },
                ].map((s, idx) => {
                  const reached = idx <= 2; // Demo: first three steps reached
                  return (
                    <React.Fragment key={s.key}>
                      <View style={[styles.stepCircle, { backgroundColor: reached ? theme.primary : withAlpha(theme.text, 0.12), borderColor: withAlpha(theme.text, 0.18) }]} />
                      {idx < 3 && <View style={[styles.stepLine, { backgroundColor: reached ? withAlpha(theme.primary, 0.6) : withAlpha(theme.text, 0.08) }]} />}
                    </React.Fragment>
                  );
                })}
              </View>
            </View>

            <Animated.Image source={Icons3D.mascrank} style={[styles.heroMascot, { transform: [{ scale: pulseAnim }] }]} resizeMode="contain" />
          </LinearGradient>
        </View>

        <Animated.View style={[styles.panel, { transform: [{ translateY: contentAnim.interpolate({ inputRange: [0, 1], outputRange: [20, 0] }) }] }]}>
          {error ? (
            <View style={[styles.errorContainer, { backgroundColor: theme.cardBackground }]}>
              <Ionicons name="alert-circle-outline" size={50} color={theme.primary} />
              <Text style={[styles.errorText, { color: theme.text }]}>{error}</Text>
              <TouchableOpacity style={[styles.retryButton, { backgroundColor: theme.primary }]} onPress={fetchMetrics}>
                <Text style={styles.retryButtonText}>Tentar Novamente</Text>
              </TouchableOpacity>
            </View>
          ) : !hasData ? (
            <EmptyState
              title={t('metrics.empty_title', { defaultValue: 'Nenhuma Métrica Ainda' })}
              subtitle={t('metrics.empty_subtitle', { defaultValue: 'Comece a usar nossos serviços para ver seu progresso!' })}
              ctaLabel={t('metrics.empty_cta', { defaultValue: 'Explorar Serviços' })}
              onPress={() => router.push('/(client)/explore')}
            />
          ) : (
            <>
              {/* Summary Card (adapted from missions discountCard) */}
              {summary ? (
                <View style={[styles.sectionCard, { backgroundColor: theme.cardBackground }]}>
                  <Text style={[styles.cardTitle, { color: theme.text }]}>{t('metrics.summary_title', { defaultValue: 'Resumo Geral' })}</Text>
                  <View style={styles.summaryGrid}>
                    <View style={[styles.summaryItem, { backgroundColor: theme.background }]}>
                      <KPIValue value={summary.totalBookings} style={[styles.summaryValue, { color: theme.primary }]} />
                      <Text style={[styles.summaryLabel, { color: theme.textMuted }]}>{t('metrics.bookings_label', { defaultValue: 'Agendamentos' })}</Text>
                    </View>
                    <View style={[styles.summaryItem, { backgroundColor: theme.background }]}>
                      <KPIValue value={summary.totalRevenue} prefix="R$ " style={[styles.summaryValue, { color: theme.primary }]} />
                      <Text style={[styles.summaryLabel, { color: theme.textMuted }]}>{t('metrics.spent_label', { defaultValue: 'Gasto Total' })}</Text>
                    </View>
                    <View style={[styles.summaryItem, { backgroundColor: theme.background }]}>
                      <KPIValue value={summary.averageRating} style={[styles.summaryValue, { color: theme.primary }]} />
                      <Text style={[styles.summaryLabel, { color: theme.textMuted }]}>{t('metrics.rating_label', { defaultValue: 'Avaliação Média' })}</Text>
                    </View>
                    <View style={[styles.summaryItem, { backgroundColor: theme.background }]}>
                      <KPIValue value={summary.completedMissions} style={[styles.summaryValue, { color: theme.primary }]} />
                      <Text style={[styles.summaryLabel, { color: theme.textMuted }]}>{t('metrics.missions_label', { defaultValue: 'Missões' })}</Text>
                    </View>
                  </View>
                </View>
              ) : (
                <View style={[styles.sectionCard, { backgroundColor: theme.cardBackground }]}>
                  <Text style={[styles.cardTitle, { color: theme.text }]}>{t('metrics.summary_title', { defaultValue: 'Resumo Geral' })}</Text>
                  <Skeleton height={150} width="100%" radius={12} />
                </View>
              )}

              {/* Timeseries Chart (adapted from missions howCard style) */}
              {timeseries.length > 0 ? (
                <View style={[styles.sectionCard, { backgroundColor: theme.cardBackground }]}>
                  <Text style={[styles.cardTitle, { color: theme.text }]}>{t('metrics.chart_title', { defaultValue: 'Agendamentos e Gastos (Mês)' })}</Text>
                  <LineChart
                    data={chartData}
                    width={SCREEN_WIDTH - 32}
                    height={220}
                    chartConfig={chartConfig}
                    bezier
                    style={styles.chart}
                  />
                </View>
              ) : (
                <View style={[styles.sectionCard, { backgroundColor: theme.cardBackground }]}>
                  <Text style={[styles.cardTitle, { color: theme.text }]}>{t('metrics.chart_title', { defaultValue: 'Agendamentos e Gastos (Mês)' })}</Text>
                  <Skeleton height={220} width="100%" radius={16} />
                </View>
              )}

              {/* Funnel Card (adapted from missions prefsCard) */}
              {funnel ? (
                <View style={[styles.sectionCard, { backgroundColor: theme.cardBackground }]}>
                  <Text style={[styles.cardTitle, { color: theme.text }]}>{t('metrics.funnel_title', { defaultValue: 'Funil de Conversão' })}</Text>
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
                  <Text style={[styles.cardTitle, { color: theme.text }]}>{t('metrics.funnel_title', { defaultValue: 'Funil de Conversão' })}</Text>
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

  // Header (adapted from missions.tsx)
  header: {
    position: 'absolute',
    top: 0, left: 0, right: 0,
    zIndex: 30,
    height: 76,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    backgroundColor: 'transparent',
  },
  headerLeft: { width: 44, height: 44, justifyContent: 'center' },
  headerRight: { width: 44 },
  headerTitle: { fontSize: 16, fontWeight: '800', textAlign: 'center' },

  // Scroll
  scrollContent: { paddingBottom: 40 },

  // Hero (from missions.tsx)
  heroWrapper: { height: HERO_HEIGHT, width: '100%' },
  hero: {
    flex: 1,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
    paddingHorizontal: 20,
    paddingTop: 22,
    overflow: 'hidden',
    justifyContent: 'center',
  },
  heroTextWrap: { maxWidth: SCREEN_WIDTH * 0.62 },
  kicker: { fontSize: 12, fontWeight: '700', marginBottom: 8 },
  title: { fontSize: 24, fontWeight: '800', lineHeight: 30, marginBottom: 14 },
  cta: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 14, paddingVertical: 10, borderRadius: 999, alignSelf: 'flex-start' },
  ctaText: { color: '#FFF', fontWeight: '800', marginRight: 8 },

  stepper: { flexDirection: 'row', alignItems: 'center', marginTop: 20 },
  stepCircle: { width: 10, height: 10, borderRadius: 8, borderWidth: 1 },
  stepLine: { height: 2, flex: 1, marginHorizontal: 8, borderRadius: 2 },

  heroMascot: { position: 'absolute', right: 18, top: 24, width: 140, height: 140 },

  // Panel (from missions.tsx)
  panel: {
    marginTop: -24,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingTop: 20,
    paddingBottom: 36,
    paddingHorizontal: 0,
    backgroundColor: 'transparent',
  },

  // Error Container (simple card)
  errorContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 30,
    marginHorizontal: 15,
    borderRadius: 12,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 4, elevation: 2,
  },
  errorText: { marginTop: 10, fontSize: 16, textAlign: 'center' },
  retryButton: { marginTop: 20, paddingVertical: 10, paddingHorizontal: 20, borderRadius: 8 },
  retryButtonText: { color: '#fff', fontSize: 16, fontWeight: '600' },

  // Section Cards (from missions discountCard / howCard)
  sectionCard: {
    marginHorizontal: 16,
    marginTop: 6,
    borderRadius: 16,
    backgroundColor: '#FFF',
    padding: 16,
    shadowColor: '#000', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.06, shadowRadius: 12, elevation: 6,
  },
  cardTitle: { fontSize: 16, fontWeight: '700', marginBottom: 15 },
  summaryGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
  summaryItem: {
    width: '48%',
    borderRadius: 8,
    padding: 15,
    marginBottom: 10,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.04, shadowRadius: 2, elevation: 1,
  },
  summaryValue: { fontSize: 22, fontWeight: 'bold' },
  summaryLabel: { fontSize: 13, textAlign: 'center', marginTop: 5 },
  chart: { marginVertical: 8, borderRadius: 16 },
  funnelItem: { marginBottom: 15 },
  funnelLabel: { fontSize: 15, fontWeight: '600' },
  funnelValue: { fontSize: 14, marginTop: 4 },
  funnelProgressBarContainer: { height: 8, borderRadius: 4, marginTop: 8, overflow: 'hidden' },
  funnelProgressBar: { height: '100%', borderRadius: 4 },
});