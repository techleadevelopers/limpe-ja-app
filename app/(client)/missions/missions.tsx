import React, { useEffect, useRef, useState, useCallback } from 'react';
import {
  View,
  StyleSheet,
  Text,
  Animated,
  Easing,
  ScrollView,
  TouchableOpacity,
  Alert,
  Platform,
  ActivityIndicator,
  RefreshControl,
  useColorScheme,
  Dimensions,
  Switch,
  Image,
  ImageSourcePropType,
  AccessibilityInfo,
} from 'react-native';
import { Stack, useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import {
  claimMission,
  getMyMissions,
  MissionItem as MissionItemType,
  MissionStatus,
  RewardType,
  MissionAudience,
} from '../../../services/missionService';
import Toast from '../../../components/Toast';
import MissionList from '../../../components/missions/MissionList';
import { MissionReminderCard } from '../../../components/missions/MissionReminderCard';
import { MissionProgressSnack } from '../../../components/missions/MissionProgressSnack';

import Colors from '../../../constants/Colors';

// 3D icons
const Icons3D = {
  heroCrown: require('../../../assets/images/3d/crown.png'),
  discountTicket: require('../../../assets/images/3d/ticket.png'),
  autoApply: require('../../../assets/images/3d/ticket3.png'),
  notify: require('../../../assets/images/3d/notification.png'),
  monthly: require('../../../assets/images/3d/step2-book-calendar.png'),
  check: require('../../../assets/images/3d/check.png'),
  time: require('../../../assets/images/3d/time.png'),
  payments: require('../../../assets/images/3d/payments.png'),
  woman: require('../../../assets/images/3d/woman.png'),
  button: require('../../../assets/images/3d/button.png'),
  mascrank: require('../../../assets/images/3d/masc-rank.png'),
} satisfies Record<string, ImageSourcePropType>;

const Icon3D = ({ src, size = 28, style }: { src: ImageSourcePropType; size?: number; style?: any }) => (
  <Image source={src} style={[{ width: size, height: size }, style]} resizeMode="contain" />
);

// Utils
const withAlpha = (hex: string, alpha: number) => {
  const h = hex.replace('#', '');
  const full = h.length === 3 ? h.split('').map(c => c + c).join('') : h;
  const int = parseInt(full, 16);
  const r = (int >> 16) & 255;
  const g = (int >> 8) & 255;
  const b = int & 255;
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
};
const formatBRL = (v: number) => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
const calcDiscounted = (base: number, percent: number) => Math.max(0, +(base * (1 - percent / 100)).toFixed(2));

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const HERO_HEIGHT = SCREEN_HEIGHT * 0.36;
const DISCOUNT_PERCENT = 30;

function useTheme() {
  const scheme = useColorScheme?.() || 'light';
  const theme = (Colors as any)[scheme] || (Colors as any).light;
  return theme as typeof Colors.light;
}

// Reduced motion
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

// --- UI components (kept logic, adjusted styles) ---
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
            <View style={styles.pill}>
              <Text style={styles.pillText}>{percent}% OFF</Text>
            </View>
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
        <Text style={styles.useDiscountText}>Usar desconto</Text>
        <Ionicons name="chevron-forward" size={16} color="#FFFFFF" />
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

// --- Screen
export default function ClientMissionsScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const isReducedMotion = useReducedMotion();
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

  const headerAnim = useRef(new Animated.Value(0)).current;
  const contentAnim = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const scrollRef = useRef<ScrollView>(null);

  const loadMissions = useCallback(async () => {
    setIsRefreshing(true);
    try {
      const fetched = await getMyMissions(MissionAudience.CLIENT);
      setAllMissions(fetched);
    } catch (err: any) {
      console.error(err);
      Toast.show({ type: 'error', text1: t('common.error'), text2: t('common.network_error') });
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [t]);

  useEffect(() => {
    Animated.parallel([
      Animated.timing(headerAnim, { toValue: 1, duration: isReducedMotion ? 0 : 420, easing: Easing.out(Easing.ease), useNativeDriver: true }),
      Animated.timing(contentAnim, { toValue: 1, duration: isReducedMotion ? 0 : 640, delay: isReducedMotion ? 0 : 80, easing: Easing.out(Easing.ease), useNativeDriver: true }),
    ]).start();

    if (!isReducedMotion) {
      Animated.loop(Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1.02, duration: 2200, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1, duration: 2200, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
      ])).start();
    } else {
      pulseAnim.setValue(1);
    }

    loadMissions();
  }, [headerAnim, contentAnim, loadMissions, pulseAnim, isReducedMotion]);

  const handleClaimMission = async (missionId: string) => {
    setClaimingMissionId(missionId);
    try {
      const res = await claimMission(missionId);
      if (res.ok) {
        Toast.show({ type: 'success', text1: t('common.success'), text2: t('missions.claim_success') });
        loadMissions();
      } else {
        Toast.show({ type: 'error', text1: t('common.error'), text2: res.reason || t('missions.claim_error') });
      }
    } catch (e: any) {
      Toast.show({ type: 'error', text1: t('common.error'), text2: t('missions.claim_error') });
    } finally {
      setClaimingMissionId(null);
    }
  };

  const onRefresh = useCallback(() => { setIsRefreshing(true); loadMissions(); }, [loadMissions]);

  const filteredMissions = allMissions.filter((m) => {
    switch (activeTab) {
      case 'ACTIVE': return m.progress?.status === MissionStatus.ACTIVE;
      case 'CAN_CLAIM': return m.canClaim && !m.isClaimed;
      case 'CLAIMED': return m.isClaimed;
      default: return true;
    }
  });

  const missionsReadyToClaim = allMissions.find((m) => m.canClaim && !m.isClaimed);

  if (isLoading && !isRefreshing) {
    return (
      <View style={[styles.centeredFeedback, { backgroundColor: theme.background }]}>
        <Stack.Screen options={{ headerShown: false }} />
        <ActivityIndicator size="large" color={theme.primary} />
        <Text style={[styles.loadingText, { color: theme.textMuted }]}>{t('common.loading')}</Text>
      </View>
    );
  }

  // hero neutral gradient based on theme (very subtle)
  const heroGradient = [ withAlpha(theme.cardBackground || '#FFFFFF', 1), withAlpha(theme.background || '#F6F8FB', 1) ];

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <Stack.Screen options={{ headerShown: false }} />

      <Animated.View
        style={[
          styles.header,
          {
            paddingTop: Platform.OS === 'ios' ? insets.top + 12 : 12,
            transform: [{ translateY: headerAnim.interpolate({ inputRange: [0, 1], outputRange: [-24, 0] }) }],
          },
        ]}
      >
        <TouchableOpacity onPress={() => router.back()} style={styles.headerLeft} accessibilityLabel={t('common.back') || 'Voltar'}>
          <Ionicons name="arrow-back" size={22} color={theme.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: theme.text }]}>MISSÕES</Text>
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
            <View style={styles.heroTextWrap} />

            <Animated.Image source={Icons3D.mascrank} style={[styles.heroMascot, { transform: [{ scale: pulseAnim }] }]} resizeMode="contain" />
          </LinearGradient>
        </View>

        <Animated.View style={[styles.panel, { transform: [{ translateY: contentAnim.interpolate({ inputRange: [0, 1], outputRange: [20, 0] }) }] }]}>
          <FeaturedDiscountCard percent={DISCOUNT_PERCENT} base={basePrice} onDecBase={() => setBasePrice(v => Math.max(50, v - 10))} onIncBase={() => setBasePrice(v => Math.min(2000, v + 10))} onUse={() => { Toast.show({ type: 'success', text1: 'Desconto pronto!', text2: `Aplicado ${DISCOUNT_PERCENT}%` }); router.push('/(client)/explore'); }} />

          {allMissions.length > 0 && allMissions[0].progress && <MissionProgressSnack current={allMissions[0].progress.currentValue} goal={allMissions[0].mission.targetValue} onView={() => setActiveTab('ACTIVE')} />}

          {missionsReadyToClaim && <MissionReminderCard missionId={missionsReadyToClaim.mission.id} title={missionsReadyToClaim.mission.title} deadlineAt={missionsReadyToClaim.mission.updatedAt} reward={{ kind: missionsReadyToClaim.mission.rewardType, value: missionsReadyToClaim.mission.rewardValue }} onGo={() => setActiveTab('CAN_CLAIM')} onDismiss={() => Alert.alert(t('common.info'), t('missions.reminder_dismissed'))} />}

          <PreferencesSection autoApply={prefAutoApply} setAutoApply={setPrefAutoApply} pushEnabled={prefPushEnabled} setPushEnabled={setPrefPushEnabled} monthlyOptIn={prefMonthlyOptIn} setMonthlyOptIn={setPrefMonthlyOptIn} />

          <HowItWorks />

          <View style={[styles.tabs, { backgroundColor: theme.cardBackground }]}>
            <TouchableOpacity style={[styles.tab, activeTab === 'ACTIVE' && { backgroundColor: activeBg }]} onPress={() => setActiveTab('ACTIVE')}><Text style={[styles.tabText, activeTab === 'ACTIVE' && { color: theme.primary }]}>{t('missions.tab_active')}</Text></TouchableOpacity>
            <TouchableOpacity style={[styles.tab, activeTab === 'CAN_CLAIM' && { backgroundColor: activeBg }]} onPress={() => setActiveTab('CAN_CLAIM')}><Text style={[styles.tabText, activeTab === 'CAN_CLAIM' && { color: theme.primary }]}>{t('missions.tab_can_claim')}</Text></TouchableOpacity>
            <TouchableOpacity style={[styles.tab, activeTab === 'CLAIMED' && { backgroundColor: activeBg }]} onPress={() => setActiveTab('CLAIMED')}><Text style={[styles.tabText, activeTab === 'CLAIMED' && { color: theme.primary }]}>{t('missions.tab_claimed')}</Text></TouchableOpacity>
          </View>

          <MissionList missions={filteredMissions} onClaimMission={handleClaimMission} claimingMissionId={claimingMissionId} onRefresh={onRefresh} isRefreshing={isRefreshing} />
        </Animated.View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  centeredFeedback: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  loadingText: { marginTop: 10, fontSize: 16 },

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

  scrollContent: { paddingBottom: 40 },

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

  panel: {
    marginTop: -24,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingTop: 20,
    paddingBottom: 36,
    paddingHorizontal: 0,
    backgroundColor: 'transparent',
  },

  discountCard: {
    marginHorizontal: 16,
    marginTop: 6,
    borderRadius: 16,
    backgroundColor: '#FFF',
    padding: 16,
    shadowColor: '#000', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.06, shadowRadius: 12, elevation: 6,
  },
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
  priceValue: { fontSize: 16, fontWeight: '800', color: '#111827', minWidth: 90, textAlign: 'center', marginHorizontal: 12 },
  equalsCol: { width: 34, alignItems: 'center' },
  equalsText: { fontWeight: '800', fontSize: 16, color: '#6B7280' },
  discountedValue: { fontSize: 18, fontWeight: '800', color: '#059669' },
  economyText: { fontSize: 12, color: '#059669', marginTop: 6 },

  useDiscountBtn: { marginTop: 14, backgroundColor: '#0A84FF', borderRadius: 12, paddingVertical: 12, alignItems: 'center', flexDirection: 'row', justifyContent: 'center', gap: 8 },
  useDiscountText: { color: '#FFFFFF', fontWeight: '800' },

  prefsCard: { marginHorizontal: 16, marginTop: 16, borderRadius: 16, backgroundColor: '#FFF', padding: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.04, shadowRadius: 12, elevation: 4 },
  prefsTitle: { fontSize: 16, fontWeight: '700', marginBottom: 8 },
  prefRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 10, borderTopWidth: 1, borderTopColor: '#F3F4F6' },
  prefIconWrap: { width: 34, alignItems: 'center' },
  prefTextCol: { flex: 1, paddingHorizontal: 10 },
  prefTitle: { fontWeight: '700' },
  prefSubtitle: { fontSize: 12, color: '#6B7280', marginTop: 4 },

  howCard: { marginHorizontal: 16, marginTop: 16, borderRadius: 16, backgroundColor: '#FFF', padding: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.04, shadowRadius: 12, elevation: 4 },
  howTitle: { fontSize: 16, fontWeight: '700', marginBottom: 8 },
  howItem: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 10 },
  howText: { color: '#374151', flex: 1 },

  tabs: { flexDirection: 'row', marginHorizontal: 16, marginTop: 18, borderRadius: 12, padding: 6, alignItems: 'center', justifyContent: 'space-between' },
  tab: { flex: 1, paddingVertical: 10, alignItems: 'center', borderRadius: 10, marginHorizontal: 6 },
  tabText: { fontWeight: '700', color: '#374151' },

  priceLabel: { fontSize: 14, color: '#6B7280', marginBottom: 8 },

  // mission list spacing is delegated to MissionList component
});
