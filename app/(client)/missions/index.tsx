import React, { useEffect, useState, useCallback } from 'react';
import { View, StyleSheet, Text, ScrollView, TouchableOpacity, Alert, Platform, ActivityIndicator, RefreshControl, Switch, Image, ImageSourcePropType } from 'react-native';
import { Stack, useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useQuery } from '@tanstack/react-query';

import { claimMission, getMyMissions, MissionItem as MissionItemType, MissionStatus, RewardType, MissionAudience } from '../../../services/missionService';
import Toast from '../../../components/Toast';
import MissionList from '../../../components/missions/MissionList';
import { MissionReminderCard } from '../../../components/missions/MissionReminderCard';
import { MissionProgressSnack } from '../../../components/missions/MissionProgressSnack';

import Colors from '../../../constants/Colors';
import { metricsService } from '../../../services/metricsService';
import { ClientMetrics } from '../../../types/backend/metrics';

const Icons3D = {
  discountTicket: require('../../../assets/images/3d/ticket.png'),
  autoApply: require('../../../assets/images/3d/ticket3.png'),
  notify: require('../../../assets/images/3d/notification.png'),
  monthly: require('../../../assets/images/3d/step2-book-calendar.png'),
  check: require('../../../assets/images/3d/check.png'),
  time: require('../../../assets/images/3d/time.png'),
  payments: require('../../../assets/images/3d/payments.png'),
} satisfies Record<string, ImageSourcePropType>;

const Icon3D = ({ src, size = 28, style }: { src: ImageSourcePropType; size?: number; style?: any }) => (
  <Image source={src} style={[{ width: size, height: size }, style]} resizeMode="contain" />
);

const withAlpha = (hex: string, alpha: number) => {
  const h = hex?.replace?.('#', '') || '#FFFFFF';
  const full = h.length === 3 ? h.split('').map(c => c + c).join('') : h;
  const int = parseInt(full, 16);
  const r = (int >> 16) & 255;
  const g = (int >> 8) & 255;
  const b = int & 255;
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
};
const formatBRL = (v: number) => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
const calcDiscounted = (base: number, percent: number) => Math.max(0, +(base * (1 - percent / 100)).toFixed(2));
const DISCOUNT_PERCENT = 30;

function useTheme() {
  const scheme = (Colors as any)?.scheme || 'light';
  const theme = (Colors as any)[scheme] || (Colors as any).light;
  return theme as typeof Colors.light;
}

function FeaturedDiscountCard({ percent, base, onDecBase, onIncBase, onUse }: { percent: number; base: number; onDecBase: () => void; onIncBase: () => void; onUse: () => void; }) {
  const discounted = calcDiscounted(base, percent);
  return (
    <View style={styles.discountCard}>
      <View style={styles.discountHeader}>
        <View style={styles.discountBadge}>
          <Icon3D src={Icons3D.discountTicket} size={30} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.discountHeadline}>Economize no próximo serviço</Text>
          <View style={styles.discountMeta}>
            <View style={styles.pill}><Text style={styles.pillText}>{percent}% OFF</Text></View>
            <Text style={styles.discountSubText}>Oferta válida para suas missões</Text>
          </View>
        </View>
      </View>

      <View style={styles.priceRow}>
        <View style={styles.priceCol}>
          <Text style={styles.priceLabel}>Preço base</Text>
          <View style={styles.counterRow}>
            <TouchableOpacity onPress={onDecBase} style={styles.counterBtn} accessibilityLabel="Diminuir preço base">
              <Ionicons name="remove" size={16} color="#374151" />
            </TouchableOpacity>
            <Text style={styles.priceValue}>{formatBRL(base)}</Text>
            <TouchableOpacity onPress={onIncBase} style={styles.counterBtn} accessibilityLabel="Aumentar preço base">
              <Ionicons name="add" size={16} color="#374151" />
            </TouchableOpacity>
          </View>
        </View>
        <View style={styles.equalsCol}><Text style={styles.equalsText}>=</Text></View>
        <View style={styles.priceColRight}>
          <Text style={styles.priceLabel}>Com desconto</Text>
          <Text style={styles.discountedValue}>{formatBRL(discounted)}</Text>
          <Text style={styles.economyText}>Você economiza {formatBRL(base - discounted)}</Text>
        </View>
      </View>

      <TouchableOpacity style={styles.useDiscountBtn} onPress={onUse} accessibilityLabel="Usar desconto agora">
        <Ionicons name="flash" size={16} color="#FFFFFF" />
        <Text style={styles.useDiscountText}>Usar desconto</Text>
      </TouchableOpacity>
    </View>
  );
}

function PreferencesSection({ autoApply, setAutoApply, pushEnabled, setPushEnabled, monthlyOptIn, setMonthlyOptIn }: { autoApply: boolean; setAutoApply: (v: boolean) => void; pushEnabled: boolean; setPushEnabled: (v: boolean) => void; monthlyOptIn: boolean; setMonthlyOptIn: (v: boolean) => void; }) {
  const Row = ({ title, subtitle, value, onValueChange, icon3d }: { title: string; subtitle: string; value: boolean; onValueChange: (v: boolean) => void; icon3d: ImageSourcePropType; }) => (
    <View style={styles.prefRow}>
      <View style={styles.prefIconWrap}><Icon3D src={icon3d} size={18} /></View>
      <View style={styles.prefTextCol}><Text style={styles.prefTitle}>{title}</Text><Text style={styles.prefSubtitle}>{subtitle}</Text></View>
      <Switch value={value} onValueChange={onValueChange} trackColor={{ false: '#E9ECEF', true: '#4A90E2' }} thumbColor="#FFFFFF" />
    </View>
  );

  return (
    <View style={styles.prefsCard}>
      <Text style={styles.prefsTitle}>Preferências</Text>
      <Row title="Aplicar cupons automaticamente" subtitle="Aplicar automaticamente no checkout" value={autoApply} onValueChange={setAutoApply} icon3d={Icons3D.autoApply} />
      <Row title="Notificar progresso" subtitle="Receba notificações sobre progresso" value={pushEnabled} onValueChange={setPushEnabled} icon3d={Icons3D.notify} />
      <Row title="Missão mensal" subtitle="Participe da missão mensal" value={monthlyOptIn} onValueChange={setMonthlyOptIn} icon3d={Icons3D.monthly} />
    </View>
  );
}

function HowItWorks() {
  return (
    <View style={styles.howCard}>
      <Text style={styles.howTitle}>Como funciona</Text>
      <View style={styles.howItem}><Icon3D src={Icons3D.check} size={18} /><Text style={styles.howText}>Complete 3 agendamentos no mês e libere 30% OFF no próximo.</Text></View>
      <View style={styles.howItem}><Icon3D src={Icons3D.time} size={18} /><Text style={styles.howText}>Avalie em até 48h para ganhar pontos bônus.</Text></View>
      <View style={styles.howItem}><Icon3D src={Icons3D.payments} size={18} /><Text style={styles.howText}>Cupons são entregues no resgate e aplicados no checkout.</Text></View>
    </View>
  );
}

export default function ClientMissionsScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const { estimate } = useLocalSearchParams<{ estimate?: string }>();

  const activeBg = withAlpha(theme.primary, 0.10);

  const [allMissions, setAllMissions] = useState<MissionItemType[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [claimingMissionId, setClaimingMissionId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'ACTIVE' | 'CAN_CLAIM' | 'CLAIMED'>('ACTIVE');

  const [prefAutoApply, setPrefAutoApply] = useState(true);
  const [prefPushEnabled, setPrefPushEnabled] = useState(true);
  const [prefMonthlyOptIn, setPrefMonthlyOptIn] = useState(true);

  const [basePrice, setBasePrice] = useState<number>(() => {
    const n = Number(estimate);
    return Number.isFinite(n) && n > 0 ? n : 120;
  });

  const { data: metrics } = useQuery<ClientMetrics>({
    queryKey: ['clientMetricsForMissions'],
    queryFn: () => metricsService.getClientMetrics(),
    staleTime: 60_000,
    retry: 1,
  });

  const bookingsCompleted = metrics?.bookings?.completed ?? 0;

  const loadMissions = useCallback(async () => {
    setIsRefreshing(true);
    try {
      const fetchedMissions = await getMyMissions(MissionAudience.CLIENT);
      setAllMissions(fetchedMissions);
    } catch (error: any) {
      Toast.show({ type: 'error', text1: t('common.error'), text2: error.response?.data?.message || t('common.network_error') });
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [t]);

  useEffect(() => { loadMissions(); }, [loadMissions]);

  const handleClaimMission = async (missionId: string) => {
    setClaimingMissionId(missionId);
    try {
      const response = await claimMission(missionId);
      if (response.ok) {
        let rewardMessage = '';
        if (response.rewardType === RewardType.COUPON && response.coupon) {
          rewardMessage = t('missions.claim_success_coupon', { code: response.coupon.code, value: response.coupon.value } as any) as string;
        } else if (response.rewardType === RewardType.POINTS && response.pointsGranted) {
          rewardMessage = t('missions.claim_success_points', { points: response.pointsGranted } as any) as string;
        } else {
          rewardMessage = t('missions.claim_success', { defaultValue: 'Resgate concluído!' }) as string;
        }
        Toast.show({ type: 'success', text1: t('common.success'), text2: rewardMessage });
        loadMissions();
      } else {
        Toast.show({ type: 'error', text1: t('common.error'), text2: response.reason || t('missions.claim_error') });
      }
    } catch (error: any) {
      Toast.show({ type: 'error', text1: t('common.error'), text2: error.response?.data?.message || t('missions.claim_error') });
    } finally {
      setClaimingMissionId(null);
    }
  };

  const onRefresh = useCallback(() => { setIsRefreshing(true); loadMissions(); }, [loadMissions]);

  const filteredMissions = allMissions.filter((mission) => {
    switch (activeTab) {
      case 'ACTIVE': return mission.progress?.status === MissionStatus.ACTIVE;
      case 'CAN_CLAIM': return mission.canClaim && !mission.isClaimed;
      case 'CLAIMED': return mission.isClaimed;
      default: return true;
    }
  });

  const missionsReadyToClaim = allMissions.find((m) => m.canClaim && !m.isClaimed);

  if (isLoading && !isRefreshing) {
    return (
      <View style={[styles.centered, { backgroundColor: theme.background }]}>
        <Stack.Screen options={{ headerShown: false }} />
        <ActivityIndicator size="large" color={theme.primary} />
        <Text style={{ marginTop: 8, color: theme.textMuted }}>{t('common.loading')}</Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <Stack.Screen options={{ headerShown: false }} />

      {/* Header alinhado ao Cashback/Cupons */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} accessibilityLabel={t('common.back', { defaultValue: 'Voltar' }) || 'Voltar'}>
          <Ionicons name="arrow-back" size={22} color={theme.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: theme.text }]}>{t('missions.title', { defaultValue: 'Missões' })}</Text>
        <View style={{ width: 22 }} />
      </View>

      <ScrollView contentContainerStyle={{ paddingBottom: insets.bottom + 16 }} refreshControl={<RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} tintColor={theme.primary} />} keyboardShouldPersistTaps="handled">
        <View style={styles.content}>
          <FeaturedDiscountCard percent={DISCOUNT_PERCENT} base={basePrice} onDecBase={() => setBasePrice(v => Math.max(50, v - 10))} onIncBase={() => setBasePrice(v => Math.min(2000, v + 10))} onUse={() => { Toast.show({ type: 'success', text1: 'Desconto pronto!', text2: `Aplicado ${DISCOUNT_PERCENT}%` }); router.push('/(client)/explore'); }} />

          {allMissions.length > 0 && allMissions[0].progress && (
            <View style={styles.summaryCard}>
              <MissionProgressSnack current={allMissions[0].progress.currentValue} goal={allMissions[0].mission.targetValue} onView={() => setActiveTab('ACTIVE')} />
            </View>
          )}

          {missionsReadyToClaim && (
            <View style={styles.reminderCard}>
              <MissionReminderCard missionId={missionsReadyToClaim.mission.id} title={missionsReadyToClaim.mission.title} deadlineAt={missionsReadyToClaim.mission.updatedAt} reward={{ kind: missionsReadyToClaim.mission.rewardType, value: missionsReadyToClaim.mission.rewardValue }} onGo={() => setActiveTab('CAN_CLAIM')} onDismiss={() => Alert.alert(t('common.info'), t('missions.reminder_dismissed', { defaultValue: 'Lembrete dispensado' }))} />
            </View>
          )}

          <PreferencesSection autoApply={prefAutoApply} setAutoApply={setPrefAutoApply} pushEnabled={prefPushEnabled} setPushEnabled={setPrefPushEnabled} monthlyOptIn={prefMonthlyOptIn} setMonthlyOptIn={setPrefMonthlyOptIn} />

          <HowItWorks />

          <View style={[styles.tabsRow, { backgroundColor: theme.cardBackground, borderColor: theme.border }]}>
            <TouchableOpacity style={[styles.tabPill, activeTab === 'ACTIVE' && [styles.tabPillActive, { borderColor: theme.primary }]]} onPress={() => setActiveTab('ACTIVE')}>
              <Text style={[styles.tabText, activeTab === 'ACTIVE' && { color: theme.primary }]}>{t('missions.tab_active', { defaultValue: 'Ativas' })}</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.tabPill, activeTab === 'CAN_CLAIM' && [styles.tabPillActive, { borderColor: theme.primary }]]} onPress={() => setActiveTab('CAN_CLAIM')}>
              <Text style={[styles.tabText, activeTab === 'CAN_CLAIM' && { color: theme.primary }]}>{t('missions.tab_can_claim', { defaultValue: 'Resgatar' })}</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.tabPill, activeTab === 'CLAIMED' && [styles.tabPillActive, { borderColor: theme.primary }]]} onPress={() => setActiveTab('CLAIMED')}>
              <Text style={[styles.tabText, activeTab === 'CLAIMED' && { color: theme.primary }]}>{t('missions.tab_claimed', { defaultValue: 'Resgatadas' })}</Text>
            </TouchableOpacity>
          </View>

          {allMissions.length === 0 && (
            <View style={styles.emptyMissionsContainer}>
              <Text style={[styles.emptyMissionsTitle, { color: theme.text }]}>
                Nenhuma missão disponível ainda.
              </Text>
              <Text style={[styles.emptyMissionsSubtitle, { color: theme.textMuted }]}>
                Complete seu primeiro agendamento para desbloquear missões com descontos.
              </Text>
              {bookingsCompleted === 0 && (
                <TouchableOpacity
                  style={[styles.emptyExploreButton, { backgroundColor: theme.primary }]}
                  onPress={() => router.push('/(client)/explore' as any)}
                  accessibilityRole="button"
                  accessibilityLabel="Explorar serviços"
                >
                  <Text style={styles.emptyExploreButtonText}>Explorar serviços</Text>
                </TouchableOpacity>
              )}
            </View>
          )}

          <MissionList missions={filteredMissions} onClaimMission={handleClaimMission} claimingMissionId={claimingMissionId} onRefresh={onRefresh} isRefreshing={isRefreshing} asStaticList={true} />
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  header: { paddingTop: 80, paddingHorizontal: 16, paddingBottom: 12, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  headerTitle: { fontSize: 17, fontWeight: '800' },
  content: { paddingHorizontal: 16, paddingBottom: 12 },

  discountCard: { borderRadius: 14, backgroundColor: '#FFFFFF', padding: 16, marginBottom: 14, ...Platform.select({ ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.04, shadowRadius: 12 }, android: { elevation: 3 } }) },
  discountHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
  discountBadge: { width: 52, height: 52, borderRadius: 12, backgroundColor: '#F3F6FA', alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  discountHeadline: { fontSize: 16, fontWeight: '700', color: '#111827' },
  discountMeta: { flexDirection: 'row', alignItems: 'center', marginTop: 6 },
  pill: { backgroundColor: '#E8F2FF', paddingVertical: 6, paddingHorizontal: 10, borderRadius: 999, marginRight: 10 },
  pillText: { color: '#0A84FF', fontWeight: '800' },
  discountSubText: { color: '#6B7280', fontSize: 12 },

  priceRow: { flexDirection: 'row', alignItems: 'center', marginTop: 12 },
  priceCol: { flex: 1, alignItems: 'center' },
  priceColRight: { flex: 1, alignItems: 'center' },
  counterRow: { flexDirection: 'row', alignItems: 'center' },
  counterBtn: { backgroundColor: '#F3F4F6', borderRadius: 8, padding: 8 },
  priceLabel: { fontSize: 12, color: '#6B7280', marginBottom: 6 },
  priceValue: { fontSize: 16, fontWeight: '800', color: '#111827', minWidth: 90, textAlign: 'center', marginHorizontal: 12 },
  equalsCol: { width: 34, alignItems: 'center' },
  equalsText: { fontWeight: '800', fontSize: 16, color: '#6B7280' },
  discountedValue: { fontSize: 18, fontWeight: '800', color: '#059669' },
  economyText: { fontSize: 12, color: '#059669', marginTop: 6 },
  useDiscountBtn: { marginTop: 14, backgroundColor: '#0A84FF', borderRadius: 12, paddingVertical: 12, alignItems: 'center', flexDirection: 'row', justifyContent: 'center', gap: 8 },
  useDiscountText: { color: '#FFFFFF', fontWeight: '800' },

  summaryCard: { marginBottom: 12 },
  reminderCard: { marginBottom: 12 },

  prefsCard: { marginBottom: 16, borderRadius: 14, backgroundColor: '#FFFFFF', padding: 14, ...Platform.select({ ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.03, shadowRadius: 10 }, android: { elevation: 3 } }) },
  prefsTitle: { fontSize: 16, fontWeight: '700', color: '#0F172A', marginBottom: 8 },
  prefRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#F2F6FA' },
  prefIconWrap: { width: 28, alignItems: 'center' },
  prefTextCol: { flex: 1, paddingHorizontal: 10 },
  prefTitle: { fontWeight: '700', color: '#0F172A' },
  prefSubtitle: { fontSize: 12, color: '#64748B', marginTop: 2 },

  howCard: { marginBottom: 16, borderRadius: 14, backgroundColor: '#FFFFFF', padding: 14, ...Platform.select({ ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.03, shadowRadius: 10 }, android: { elevation: 3 } }) },
  howTitle: { fontSize: 16, fontWeight: '700', color: '#0F172A', marginBottom: 8 },
  howItem: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 10 },
  howText: { color: '#334155', flex: 1, fontSize: 14 },

  tabsRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 6, borderRadius: 12, borderWidth: 1, marginBottom: 12 },
  tabPill: { flex: 1, alignItems: 'center', paddingVertical: 10, borderRadius: 10, borderWidth: 1, borderColor: 'transparent' },
  tabPillActive: { backgroundColor: '#FFFFFF' },
  tabText: { fontWeight: '700' },
  emptyMissionsContainer: {
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  emptyMissionsTitle: {
    fontSize: 15,
    fontWeight: '700',
    marginTop: 8,
  },
  emptyMissionsSubtitle: {
    fontSize: 13,
    marginTop: 4,
    textAlign: 'center',
  },
  emptyExploreButton: {
    marginTop: 14,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 999,
  },
  emptyExploreButtonText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 14,
  },
});
