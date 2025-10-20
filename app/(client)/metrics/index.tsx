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
  GestureResponderEvent,
} from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LineChart } from 'react-native-chart-kit';
import { LinearGradient } from 'expo-linear-gradient';
import { useTranslation } from 'react-i18next';

import { useQuery } from '@tanstack/react-query';
import { metricsService } from '../../../services/metricsService';
import { getLoyaltyRewards } from '../../../services/loyaltyService';
import { claimMission } from '../../../services/missionService';
import { ClientMetrics } from '../../../types/backend/metrics';
import NotificationUIService from '../../../services/notificationUIService';
import { AnalyticsService } from '../../../services/analyticsService';

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
} as const;

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
  const [isRefreshing, setIsRefreshing] = useState(false);

  const headerAnim = useRef(new Animated.Value(0)).current;
  const contentAnim = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const scrollRef = useRef<ScrollView>(null);

  const { data: metrics, isLoading, isError, refetch, isRefetching } = useQuery<ClientMetrics>({
    queryKey: ['clientMetrics'],
    queryFn: () => metricsService.getClientMetrics(),
    staleTime: 60_000,
    refetchOnWindowFocus: true,
    retry: 1,
  });

  useEffect(() => {
    if (isError) {
      const msg = 'Erro de rede.';
      NotificationUIService.showError(msg, 'Erro');
      Toast.show({ type: 'error', text1: 'Erro', text2: msg });
    }
  }, [isError]);

  const onRefresh = useCallback(async () => {
    setIsRefreshing(true);
    await refetch();
    setIsRefreshing(false);
  }, [refetch]);

  useEffect(() => {
    if (!isReducedMotion) {
      Animated.parallel([
        Animated.timing(headerAnim, {
          toValue: 1,
          duration: 600,
          easing: Easing.out(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.spring(contentAnim, {
          toValue: 1,
          tension: 100,
          friction: 8,
          delay: 200,
          useNativeDriver: true,
        }),
        Animated.loop(
          Animated.sequence([
            Animated.timing(pulseAnim, {
              toValue: 1.05,
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
        ),
      ]).start();
    }
  }, [isReducedMotion]);

  if (isLoading && !isRefetching && !isRefreshing) {
    return (
      <View style={[styles.centeredFeedback, { backgroundColor: theme.background }]}>
        <Stack.Screen options={{ headerShown: false }} />
        <ActivityIndicator size="large" color={theme.primary} />
        <Text style={[styles.loadingText, { color: theme.textMuted }]}>
          {t('common.loading', { defaultValue: 'Carregando' })}
        </Text>
      </View>
    );
  }

  const trend: Array<{ month: string; count: number }> = metrics?.bookings?.monthlyTrend || [];
  const chartData = {
    labels: trend.map(d => d.month?.slice(5, 7) || ''),
    datasets: [
      {
        data: trend.map(d => d.count || 0),
        color: (opacity = 1) => withAlpha(theme.primary, opacity),
        strokeWidth: 2,
        withDots: true,
      },
    ],
    legend: [t('metrics.chart_legend', { defaultValue: 'Agendamentos' })],
  };

  const chartConfig = {
    backgroundGradientFrom: theme.cardBackground || '#FFFFFF',
    backgroundGradientTo: theme.cardBackground || '#FFFFFF',
    decimalPlaces: 0,
    color: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
    labelColor: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
    style: { borderRadius: 16 },
    propsForDots: {
      r: '6',
      strokeWidth: '2',
      stroke: theme.primary,
    },
  };

  const hasData = !!metrics && (
    (metrics.bookings?.total || 0) > 0 ||
    (metrics.points?.balance || 0) > 0 ||
    (metrics.missions?.total || 0) > 0 ||
    (metrics.coupons?.active?.length || 0) > 0
  );

  // Subtle hero gradient (adapted from missions.tsx)
  const heroGradient = [withAlpha(theme.cardBackground || '#FFFFFF', 1), withAlpha(theme.background || '#F6F8FB', 1)];
  
  const { data: rewardsMini } = useQuery({ 
    queryKey: ['rewardsMini'], 
    queryFn: () => getLoyaltyRewards({ limit: 50 }), 
    staleTime: 60000 
  });

  const nextRewardDelta = React.useMemo(() => { 
    const balance = metrics?.points?.balance ?? 0; 
    if (!Array.isArray(rewardsMini) || rewardsMini.length === 0) return null; 
    let minAbove = Infinity; 
    for (const r of rewardsMini) {
      if (typeof (r as any).costPoints === 'number' && (r as any).costPoints > balance) {
        minAbove = Math.min(minAbove, (r as any).costPoints);
      }
    }
    if (!isFinite(minAbove)) return 0; 
    return Math.max(0, minAbove - balance); 
  }, [metrics?.points?.balance, rewardsMini]);

  const spentTotal = (metrics?.bookings?.latest || []).reduce((acc: number, b: any) => acc + (b.totalPrice || 0), 0);

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
        <TouchableOpacity onPress={() => router.back()} style={styles.headerLeft} accessibilityLabel={t('common.back', { defaultValue: 'Voltar' })}>
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
              <Text style={[styles.kicker, { color: withAlpha(theme.text, 0.6) }]}>{t('metrics.hero_kicker', { defaultValue: 'Seu desempenho' })}</Text>
              <Text style={[styles.title, { color: theme.text }]}>{t('metrics.hero_title', { defaultValue: 'Acompanhe seu progresso e conquistas' })}</Text>

              <TouchableOpacity 
                style={[styles.cta, { backgroundColor: theme.primary }]} 
                onPress={() => { 
                  AnalyticsService.trackEvent('metrics_cta_tap');
                  requestAnimationFrame(() => scrollRef.current?.scrollTo({ y: HERO_HEIGHT, animated: true }));
                }} 
                accessibilityLabel={t('metrics.cta_label', { defaultValue: 'Ver Métricas' })}
              >
                <Text style={styles.ctaText}>{t('metrics.cta_text', { defaultValue: 'Ver métricas' })}</Text>
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
          {isError ? (
            <View style={[styles.errorContainer, { backgroundColor: theme.cardBackground }]}>
              <Ionicons name="alert-circle-outline" size={50} color={theme.primary} />
              <Text style={[styles.errorText, { color: theme.text }]}>
                {t('common.network_error', { defaultValue: 'Erro de rede.' })}
              </Text>
              <TouchableOpacity style={[styles.retryButton, { backgroundColor: theme.primary }]} onPress={() => refetch()}>
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
              {metrics ? (
                <View style={[styles.sectionCard, { backgroundColor: theme.cardBackground }]}>
                  <Text style={[styles.cardTitle, { color: theme.text }]}>
                    {t('metrics.summary_title', { defaultValue: 'Resumo' })}
                  </Text>
                  <View style={styles.summaryGrid}>
                    <TouchableOpacity
                      onPress={() => {
                        AnalyticsService.trackEvent('metrics_kpi_tap', { kpi: 'bookings_total' });
                        router.push('/(client)/bookings');
                      }}
                      accessibilityLabel={t('metrics.bookings_label', { defaultValue: 'Agendamentos' })}
                      style={[styles.summaryItem, { backgroundColor: theme.background }]}
                    >
                      <KPIValue value={metrics.bookings?.total ?? 0} style={[styles.summaryValue, { color: theme.primary }]} />
                      <Text style={[styles.summaryLabel, { color: theme.textMuted }]}>
                        {t('metrics.bookings_label', { defaultValue: 'Agendamentos' })}
                      </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      onPress={() => {
                        AnalyticsService.trackEvent('metrics_kpi_tap', { kpi: 'spent_total' });
                        router.push('/(client)/bookings');
                      }}
                      accessibilityLabel={t('metrics.spent_label', { defaultValue: 'Gasto Total' })}
                      style={[styles.summaryItem, { backgroundColor: theme.background }]}
                    >
                      <KPIValue
                        value={spentTotal}
                        prefix="R$ "
                        style={[styles.summaryValue, { color: theme.primary }]}
                      />
                      <Text style={[styles.summaryLabel, { color: theme.textMuted }]}>
                        {t('metrics.spent_label', { defaultValue: 'Gasto Total' })}
                      </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      onPress={() => {
                        AnalyticsService.trackEvent('metrics_kpi_tap', { kpi: 'missions_completed' });
                        router.push('/(client)/missions');
                      }}
                      accessibilityLabel={t('metrics.missions_completed_label', { defaultValue: 'Missões Concluídas' })}
                      style={[styles.summaryItem, { backgroundColor: theme.background }]}
                    >
                      <KPIValue value={metrics.missions?.completed ?? 0} style={[styles.summaryValue, { color: theme.primary }]} />
                      <Text style={[styles.summaryLabel, { color: theme.textMuted }]}>
                        {(metrics.missions?.availableToClaim ?? 0) > 0 && (
                          <Text style={[styles.kpiBadge, { color: theme.primary }]}>
                            Prontas: {metrics.missions?.availableToClaim}{' '}
                          </Text>
                        )}
                        {t('metrics.missions_completed_label', { defaultValue: 'Missões Concluídas' })}
                      </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      onPress={() => {
                        AnalyticsService.trackEvent('metrics_kpi_tap', { kpi: 'coupons_active' });
                        router.push('/(client)/coupons');
                      }}
                      accessibilityLabel={t('metrics.coupons_active_label', { defaultValue: 'Cupons Ativos' })}
                      style={[styles.summaryItem, { backgroundColor: theme.background }]}
                    >
                      <KPIValue value={metrics.coupons?.active?.length ?? 0} style={[styles.summaryValue, { color: theme.primary }]} />
                      <Text style={[styles.summaryLabel, { color: theme.textMuted }]}>
                        {t('metrics.coupons_active_label', { defaultValue: 'Cupons Ativos' })}
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>
              ) : (
                <View style={[styles.sectionCard, { backgroundColor: theme.cardBackground }]}>
                  <Text style={[styles.cardTitle, { color: theme.text }]}>
                    {t('metrics.summary_title', { defaultValue: 'Resumo' })}
                  </Text>
                  <Skeleton height={150} width="100%" radius={12} />
                </View>
              )}

              {/* Timeseries Chart (adapted from missions howCard style) */}
              {(metrics?.bookings?.monthlyTrend?.length || 0) > 0 ? (
                <View style={[styles.sectionCard, { backgroundColor: theme.cardBackground }]}>
                  <Text style={[styles.cardTitle, { color: theme.text }]}>
                    {t('metrics.chart_title', { defaultValue: 'Agendamentos por mês' })}
                  </Text>
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
                  <Text style={[styles.cardTitle, { color: theme.text }]}>
                    {t('metrics.chart_title', { defaultValue: 'Agendamentos por mês' })}
                  </Text>
                  <Skeleton height={220} width="100%" radius={16} />
                </View>
              )}

              {/* Recent Bookings */}
              <View style={[styles.sectionCard, { backgroundColor: theme.cardBackground }]}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Text style={[styles.cardTitle, { color: theme.text }]}>
                    {t('metrics.recent_bookings_title', { defaultValue: 'Últimos agendamentos' })}
                  </Text>
                  <TouchableOpacity
                    onPress={() => {
                      AnalyticsService.trackEvent('metrics_section_view_more', { section: 'bookings' });
                      router.push('/(client)/bookings');
                    }}
                    accessibilityLabel={t('metrics.view_all', { defaultValue: 'Ver todos' })}
                  >
                    <Text style={{ color: theme.primary, fontWeight: '700' }}>
                      {t('common.view_all', { defaultValue: 'Ver todos' })}
                    </Text>
                  </TouchableOpacity>
                </View>
                {(metrics?.bookings?.latest?.length || 0) > 0 ? (
                  (metrics.bookings?.latest || []).slice(0, 5).map((b: any, idx: number) => (
                    <View key={b.id || idx} style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 8 }}>
                      <Text style={{ color: theme.text }} numberOfLines={1}>
                        {b.serviceName}
                      </Text>
                      <Text style={{ color: theme.textMuted }}>
                        {new Date(b.scheduledDate).toLocaleDateString('pt-BR')}
                      </Text>
                    </View>
                  ))
                ) : (
                  <EmptyState
                    title={t('metrics.empty_recent_bookings_title', { defaultValue: 'Sem agendamentos recentes' })}
                    subtitle={t('metrics.empty_recent_bookings_desc', { defaultValue: 'Assim que você fizer agendamentos, eles aparecerão aqui.' })}
                  />
                )}
              </View>

              {/* Points History */}
              <View style={[styles.sectionCard, { backgroundColor: theme.cardBackground }]}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
              <Text style={[styles.cardTitle, { color: theme.text }]}>
                {t('metrics.points_section_title', { defaultValue: 'Pontos recentes' })}
              </Text>
              { typeof nextRewardDelta === "number" && nextRewardDelta > 0 && (
                <Text style={[styles.nextRewardText, { color: theme.textMuted }]}>
                  {t('metrics.next_reward', { defaultValue: 'Faltam' })} {nextRewardDelta} {t('metrics.points_section_title', { defaultValue: 'Pontos' }).toLowerCase()} {t('metrics.next_reward_suffix', { defaultValue: 'para a próxima recompensa' })}
                </Text>
              )}
              <TouchableOpacity
                    onPress={() => {
                      AnalyticsService.trackEvent('metrics_section_view_more', { section: 'points' });
                      router.push('/(client)/wallet/cashback');
                    }}
                    accessibilityLabel={t('metrics.view_all', { defaultValue: 'Ver todos' })}
                  >
                    <Text style={{ color: theme.primary, fontWeight: '700' }}>
                      {t('common.view_all', { defaultValue: 'Ver todos' })}
                    </Text>
                  </TouchableOpacity>
                </View>
                {(metrics?.points?.history?.length || 0) > 0 ? (
                  (metrics.points?.history || []).slice(0, 5).map((h: any, idx: number) => (
                    <View key={h.id || idx} style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 8 }}>
                      <Text style={{ color: theme.text }}>{h.type}</Text>
                      <Text style={{ color: theme.textMuted }}>{h.points} pts</Text>
                    </View>
                  ))
                ) : (
                  <Skeleton height={60} width="100%" radius={12} />
                )}
              </View>

              {/* Missions Grid */}
              <View style={[styles.sectionCard, { backgroundColor: theme.cardBackground }]}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Text style={[styles.cardTitle, { color: theme.text }]}>
                    {t('metrics.missions_section_title', { defaultValue: 'Suas missões' })}
                  </Text>
                  <TouchableOpacity
                    onPress={() => {
                      AnalyticsService.trackEvent('metrics_section_view_more', { section: 'missions' });
                      router.push('/(client)/missions');
                    }}
                    accessibilityLabel={t('metrics.view_all', { defaultValue: 'Ver todas' })}
                  >
                    <Text style={{ color: theme.primary, fontWeight: '700' }}>
                      {t('common.view_all', { defaultValue: 'Ver todas' })}
                    </Text>
                  </TouchableOpacity>
                </View>
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' }}>
                  {(metrics?.missions?.items || []).slice(0, 4).map((m: any) => (
                    <View key={m?.mission?.id} style={{ width: '48%', backgroundColor: withAlpha(theme.textMuted, 0.08), borderRadius: 10, padding: 10, marginBottom: 10 }}>
                      <Text style={{ color: theme.text, fontWeight: '700' }} numberOfLines={2}>
                        {m?.mission?.title || 'Missão'}
                      </Text>
                      <Text style={{ color: theme.textMuted, marginTop: 4 }}>{m?.progressLabel || ''}</Text>
                      <View style={[styles.funnelProgressBarContainer, { marginTop: 8, backgroundColor: withAlpha(theme.textMuted, 0.2) }]}>
                        <View style={[styles.funnelProgressBar, { width: `${Math.max(0, Math.min(100, m?.progressPct || 0))}%`, backgroundColor: theme.primary }]} />
                      </View>
                      {m?.canClaim && (
                        <TouchableOpacity
                          onPress={async () => {
                            try {
                              await claimMission(m?.mission?.id);
                              NotificationUIService.showSuccess(
                                t('missions.claim_success', { defaultValue: 'Recompensa resgatada!' }),
                                t('common.success', { defaultValue: 'Sucesso' })
                              );
                              refetch();
                            } catch (err: any) {
                              NotificationUIService.showError(err?.message || t('common.error', { defaultValue: 'Erro' }));
                            }
                          }}
                          style={{ marginTop: 8, backgroundColor: theme.primary, paddingVertical: 8, borderRadius: 8, alignItems: 'center' }}
                          accessibilityLabel={t('missions.claim', { defaultValue: 'Resgatar' })}
                        >
                          <Text style={{ color: '#fff', fontWeight: '700' }}>
                            {t('missions.claim', { defaultValue: 'Resgatar' })}
                          </Text>
                        </TouchableOpacity>
                      )}
                    </View>
                  ))}
                </View>
              </View>

              {/* Coupons */}
              <View style={[styles.sectionCard, { backgroundColor: theme.cardBackground }]}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Text style={[styles.cardTitle, { color: theme.text }]}>
                    {t('metrics.coupons_title', { defaultValue: 'Seus cupons' })}
                  </Text>
                  <TouchableOpacity
                    onPress={() => {
                      AnalyticsService.trackEvent('metrics_section_view_more', { section: 'coupons' });
                      router.push('/(client)/coupons');
                    }}
                    accessibilityLabel={t('metrics.view_all', { defaultValue: 'Ver todos' })}
                  >
                    <Text style={{ color: theme.primary, fontWeight: '700' }}>
                      {t('common.view_all', { defaultValue: 'Ver todos' })}
                    </Text>
                  </TouchableOpacity>
                </View>
                <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
                  {(metrics?.coupons?.active || []).slice(0, 8).map((c: any) => (
                    <View key={c.id} style={{ paddingVertical: 6, paddingHorizontal: 10, borderRadius: 999, backgroundColor: withAlpha(theme.primary, 0.1), marginRight: 8, marginBottom: 8 }}>
                      <Text style={{ color: theme.primary }}># {c.code}</Text>
                    </View>
                  ))}
                </View>
                {(metrics?.coupons?.used?.length || 0) > 0 && (
                  <View style={{ marginTop: 8 }}>
                    {(metrics?.coupons?.used || []).slice(0, 5).map((c: any) => (
                      <View key={c.id} style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 6 }}>
                        <Text style={{ color: theme.text }}>{c.code}</Text>
                        <Text style={{ color: theme.textMuted }}>
                          {new Date(c.validUntil).toLocaleDateString('pt-BR')}
                        </Text>
                      </View>
                    ))}
                  </View>
                )}
              </View>
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
  kpiBadge: { 
    fontSize: 12,
    fontWeight: '600',
    marginRight: 4
  },
  nextRewardText: {
    fontSize: 12,
    flex: 1,
    marginHorizontal: 8,
  },

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

