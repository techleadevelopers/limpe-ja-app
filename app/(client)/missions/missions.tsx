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
} from 'react-native';
import { Stack, useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useTranslation } from 'react-i18next';

import Colors from '../../../constants/Colors';
import MissionList from '../../../components/missions/MissionList';
import { MissionReminderCard } from '../../../components/missions/MissionReminderCard';
import { MissionProgressSnack } from '../../../components/missions/MissionProgressSnack';
import {
  claimMission,
  getMyMissions,
  MissionItem as MissionItemType,
  MissionStatus,
  MissionAudience,
  RewardType,
} from '../../../services/missionService';
import Toast from '../../../components/Toast';

// ====== 3D ICONS (absolute paths) ======
const Icons3D = {
  crown: require('/assets/images/3d/crown.png'),
  ticket: require('/assets/images/3d/ticket.png'),
  autoApply: require('/assets/images/3d/ticket3.png'),
  notify: require('/assets/images/3d/notification.png'),
  monthly: require('/assets/images/3d/step2-book-calendar.png'),
  trophy: require('/assets/images/3d/trophy.png'),
} satisfies Record<string, ImageSourcePropType>;

const Icon3D = ({
  src,
  size = 18,
  style,
}: { src: ImageSourcePropType; size?: number; style?: any }) => (
  <Image source={src} style={[{ width: size, height: size }, style]} resizeMode="contain" />
);

// ========== Utils ==========
const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const HERO_HEIGHT = SCREEN_HEIGHT * 0.36;
const DISCOUNT_PERCENT = 30; // campanha popular

const withAlpha = (hex: string, alpha: number) => {
  const h = hex.replace('#', '');
  const f = h.length === 3 ? h.split('').map(c => c + c).join('') : h;
  const int = parseInt(f, 16);
  const r = (int >> 16) & 255, g = (int >> 8) & 255, b = int & 255;
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
};
const formatBRL = (v: number) => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
const calcDiscounted = (base: number, percent: number) => Math.max(0, +(base * (1 - percent / 100)).toFixed(2));

function useTheme() {
  const scheme = useColorScheme?.() || 'light';
  const theme = (Colors as any)[scheme] || (Colors as any).light;
  return theme as typeof Colors.light;
}

// ========== UI subcomponents ==========
function FeaturedDiscountCard({
  percent,
  base,
  onDecBase,
  onIncBase,
  onUse,
}: {
  percent: number;
  base: number;
  onDecBase: () => void;
  onIncBase: () => void;
  onUse: () => void;
}) {
  const discounted = calcDiscounted(base, percent);
  return (
    <View style={styles.discountCard}>
      <View style={styles.discountHeader}>
        {/* 3D ticket (sutil, não altera layout) */}
        <Icon3D src={Icons3D.ticket} size={18} style={{ marginRight: 6 }} />
        <View style={styles.pill}><Text style={styles.pillText}>{percent}% OFF</Text></View>
        <Text style={styles.discountTitle}>Economize no próximo serviço</Text>
      </View>

      <View style={styles.priceRow}>
        <View style={styles.priceCol}>
          <Text style={styles.priceLabel}>Preço base</Text>
          <View style={styles.counterRow}>
            <TouchableOpacity onPress={onDecBase} style={styles.counterBtn} accessibilityLabel="Diminuir preço base">
              <Ionicons name="remove" size={16} />
            </TouchableOpacity>
            <Text style={styles.priceValue}>{formatBRL(base)}</Text>
            <TouchableOpacity onPress={onIncBase} style={styles.counterBtn} accessibilityLabel="Aumentar preço base">
              <Ionicons name="add" size={16} />
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

      <TouchableOpacity style={styles.useDiscountBtn} onPress={onUse}>
        <Ionicons name="flash" size={16} color="#FFFFFF" />
        <Text style={styles.useDiscountText}>Usar desconto</Text>
      </TouchableOpacity>

      <Text style={styles.termsText}>
        Válido no próximo agendamento elegível. Sujeito às regras da campanha e missões ativas.
      </Text>
    </View>
  );
}

function PreferencesSection({
  autoApply,
  setAutoApply,
  pushEnabled,
  setPushEnabled,
  monthlyOptIn,
  setMonthlyOptIn,
}: {
  autoApply: boolean; setAutoApply: (v: boolean) => void;
  pushEnabled: boolean; setPushEnabled: (v: boolean) => void;
  monthlyOptIn: boolean; setMonthlyOptIn: (v: boolean) => void;
}) {
  const Row = ({
    title, subtitle, value, onValueChange, icon3d,
  }: {
    title: string; subtitle: string; value: boolean; onValueChange: (v: boolean) => void; icon3d: ImageSourcePropType;
  }) => (
    <View style={styles.prefRow}>
      <View style={styles.prefIconWrap}><Icon3D src={icon3d} size={18} /></View>
      <View style={styles.prefTextCol}>
        <Text style={styles.prefTitle}>{title}</Text>
        <Text style={styles.prefSubtitle}>{subtitle}</Text>
      </View>
      <Switch value={value} onValueChange={onValueChange} />
    </View>
  );

  return (
    <View style={styles.prefsCard}>
      <Text style={styles.prefsTitle}>Preferências</Text>
      <Row
        title="Aplicar cupons automaticamente"
        subtitle="Aplicamos no checkout quando elegível."
        value={autoApply}
        onValueChange={setAutoApply}
        icon3d={Icons3D.autoApply}
      />
      <Row
        title="Notificar progresso"
        subtitle="Avisa quando faltar pouco para o prêmio."
        value={pushEnabled}
        onValueChange={setPushEnabled}
        icon3d={Icons3D.notify}
      />
      <Row
        title="Missão mensal (3x)"
        subtitle="3 agendamentos no mês liberam 30% OFF."
        value={monthlyOptIn}
        onValueChange={setMonthlyOptIn}
        icon3d={Icons3D.monthly}
      />
    </View>
  );
}

// ========== Screen ==========
export default function MissionsHomeScreen() {
  const theme = useTheme();
  const router = useRouter();
  const { t } = useTranslation();
  const { name, estimate } = useLocalSearchParams<{ name?: string; estimate?: string }>();

  const userFirstName =
    (name && String(name).split(' ')[0]) ||
    t?.('common.you', { defaultValue: 'você' }) || 'você';

  const headerAnim = useRef(new Animated.Value(0)).current;
  const contentAnim = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const scrollRef = useRef<ScrollView>(null);

  // dados
  const [allMissions, setAllMissions] = useState<MissionItemType[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [claimingMissionId, setClaimingMissionId] = useState<string | null>(null);

  // Preferências locais (plugáveis no backend)
  const [prefAutoApply, setPrefAutoApply] = useState(true);
  const [prefPushEnabled, setPrefPushEnabled] = useState(true);
  const [prefMonthlyOptIn, setPrefMonthlyOptIn] = useState(true);

  // simulador 30%
  const [basePrice, setBasePrice] = useState<number>(() => {
    const n = Number(estimate);
    return Number.isFinite(n) && n > 0 ? n : 120;
  });

  const loadMissions = useCallback(async () => {
    setIsRefreshing(true);
    try {
      const fetched = await getMyMissions(MissionAudience.CLIENT);
      setAllMissions(fetched);
    } catch (error: any) {
      console.error('Erro ao buscar missões (home):', error.response?.data || error.message);
      Toast.show({ type: 'error', text1: t('common.error'), text2: t('common.network_error') });
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [t]);

  useEffect(() => {
    Animated.parallel([
      Animated.timing(headerAnim, { toValue: 1, duration: 500, easing: Easing.out(Easing.ease), useNativeDriver: true }),
      Animated.timing(contentAnim, { toValue: 1, duration: 700, delay: 100, easing: Easing.out(Easing.ease), useNativeDriver: true }),
    ]).start();

    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1.02, duration: 2000, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1, duration: 2000, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
      ])
    ).start();

    loadMissions();
  }, [headerAnim, contentAnim, pulseAnim, loadMissions]);

  const onRefresh = useCallback(() => {
    setIsRefreshing(true);
    loadMissions();
  }, [loadMissions]);

  const handleClaimMission = async (missionId: string) => {
    setClaimingMissionId(missionId);
    try {
      const response = await claimMission(missionId);
      if (response.ok) {
        let msg = t('missions.claim_success');
        if (response.rewardType === RewardType.COUPON && response.coupon) {
          msg = t('missions.claim_success_coupon', { code: response.coupon.code, value: response.coupon.value });
        } else if (response.rewardType === RewardType.POINTS && response.pointsGranted) {
          msg = t('missions.claim_success_points', { points: response.pointsGranted });
        }
        Toast.show({ type: 'success', text1: t('common.success'), text2: msg });
        loadMissions();
      } else {
        Toast.show({ type: 'error', text1: t('common.error'), text2: response.reason || t('missions.claim_error') });
      }
    } catch (err: any) {
      Toast.show({ type: 'error', text1: t('common.error'), text2: err?.response?.data?.message || err?.message || t('missions.claim_error') });
    } finally {
      setClaimingMissionId(null);
    }
  };

  // priorizar “prontas pra resgatar”, depois ativas
  const claimable = allMissions.filter(m => m.canClaim && !m.isClaimed);
  const active = allMissions.filter(m => m.progress?.status === MissionStatus.ACTIVE && !m.isClaimed);
  const topMissions = [...claimable, ...active].slice(0, 3);
  const hasAny = allMissions.length > 0;
  const hasProgress = hasAny && allMissions[0].progress;
  const missionsReadyToClaim = claimable[0];

  // passo do stepper
  const steps = [
    { key: 'onboard', label: t('missions.steps.onboard', { defaultValue: 'Cadastro' }) },
    { key: 'book', label: t('missions.steps.book', { defaultValue: 'Agendar' }) },
    { key: 'review', label: t('missions.steps.review', { defaultValue: 'Avaliar' }) },
    { key: 'genius', label: t('missions.steps.genius', { defaultValue: 'Benefícios' }) },
  ];
  const stepIndex =
    missionsReadyToClaim ? 2 :
    allMissions.some(m => m.isClaimed) ? 3 :
    hasAny ? 1 : 0;

  const goAllMissions = () => router.push({ pathname: '/(client)/missions', params: { name: userFirstName, estimate: String(basePrice) } });

  // Loading inicial
  if (isLoading && !isRefreshing) {
    return (
      <View style={[styles.centeredFeedback, { backgroundColor: theme.background }]}>
        <Stack.Screen options={{ headerShown: false }} />
        <ActivityIndicator size="large" color={theme.primary} />
        <Text style={[styles.loadingText, { color: theme.textMuted }]}>{t('common.loading')}</Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <Stack.Screen options={{ headerShown: false }} />

      {/* Header transparente sobre o hero */}
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
        <TouchableOpacity onPress={() => router.back()} style={styles.headerBackButton} accessibilityLabel={t('common.back') || 'Voltar'}>
          <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: '#FFFFFF' }]}>{t('missions.header_kicker', { defaultValue: 'MISSIONS' })}</Text>
        <TouchableOpacity onPress={goAllMissions} style={styles.headerRightBtn}>
          <Text style={styles.headerRightText}>{t('common.see_all', { defaultValue: 'Ver todas' })}</Text>
        </TouchableOpacity>
      </Animated.View>

      <ScrollView ref={scrollRef} contentContainerStyle={styles.scrollViewContentContainer}
        refreshControl={<RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} tintColor={theme.primary} title={t('common.loading')} titleColor={theme.primary} />}
      >
        {/* HERO */}
        <View style={styles.heroWrapper}>
          <LinearGradient colors={[theme.primary, theme.accent]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.heroGradient}>
            {/* coroazinha 3D decorativa, bem suave */}
            <Image
              source={Icons3D.crown}
              style={{ position: 'absolute', right: 12, top: Platform.OS === 'ios' ? 56 : 40, width: 50, height: 50, opacity: 0.10 }}
              resizeMode="contain"
            />
            <View style={styles.heroContent}>
              <Text style={styles.heroKicker}>{t('missions.header_kicker', { defaultValue: 'MISSIONS' })}</Text>
              <Text style={styles.heroTitle}>
                {t('missions.hero_title', { defaultValue: `Economize como um gênio, ${userFirstName}`, name: userFirstName })}
              </Text>

              <TouchableOpacity style={styles.heroStartButton} onPress={goAllMissions}>
                <Text style={styles.heroStartText}>{t('common.start', { defaultValue: 'START' })}</Text>
                <Ionicons name="play" size={16} color={theme.primary} />
              </TouchableOpacity>

              {/* Stepper */}
              <View style={styles.stepperRow}>
                {steps.map((s, idx) => {
                  const reached = idx <= stepIndex;
                  return (
                    <React.Fragment key={s.key}>
                      <View style={[styles.stepDot, { backgroundColor: reached ? '#FFFFFF' : withAlpha('#FFFFFF', 0.35), borderColor: withAlpha('#FFFFFF', 0.65) }]} />
                      {idx < steps.length - 1 && <View style={[styles.stepLine, { backgroundColor: withAlpha('#FFFFFF', reached ? 0.7 : 0.25) }]} />}
                    </React.Fragment>
                  );
                })}
              </View>
              <View style={styles.stepperLabels}>
                {steps.map((s, idx) => (
                  <Text key={s.key} style={[styles.stepLabel, { opacity: idx <= stepIndex ? 1 : 0.7 }]} numberOfLines={1}>
                    {s.label}
                  </Text>
                ))}
              </View>
            </View>
          </LinearGradient>
        </View>

        {/* Painel branco */}
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
          {/* Banner 30% OFF */}
          <FeaturedDiscountCard
            percent={DISCOUNT_PERCENT}
            base={basePrice}
            onDecBase={() => setBasePrice(v => Math.max(50, v - 10))}
            onIncBase={() => setBasePrice(v => Math.min(2000, v + 10))}
            onUse={() => {
              Toast.show({ type: 'success', text1: 'Desconto pronto!', text2: `Aplicaremos ${DISCOUNT_PERCENT}% no próximo agendamento elegível.` });
              router.push('/(client)/explore');
            }}
          />

          {/* Snack progresso geral */}
          {hasProgress && (
            <Animated.View style={[styles.summaryCard, { transform: [{ scale: pulseAnim }] }]}>
              <MissionProgressSnack
                current={allMissions[0].progress!.currentValue}
                goal={allMissions[0].mission.targetValue}
                onView={goAllMissions}
              />
            </Animated.View>
          )}

          {/* Lembrete de resgate */}
          {missionsReadyToClaim && (
            <Animated.View style={[styles.reminderCard, { transform: [{ scale: pulseAnim }] }]}>
              <MissionReminderCard
                missionId={missionsReadyToClaim.mission.id}
                title={missionsReadyToClaim.mission.title}
                deadlineAt={missionsReadyToClaim.mission.updatedAt}
                reward={{ kind: missionsReadyToClaim.mission.rewardType, value: missionsReadyToClaim.mission.rewardValue }}
                onGo={goAllMissions}
                onDismiss={() => Alert.alert(t('common.info'), t('missions.reminder_dismissed'))}
              />
            </Animated.View>
          )}

          {/* Preferências rápidas (com 3D icons) */}
          <PreferencesSection
            autoApply={prefAutoApply}
            setAutoApply={(v) => {
              setPrefAutoApply(v);
              Toast.show({ type: 'success', text1: 'Preferência salva', text2: v ? 'Cupons automáticos ativados.' : 'Aplicação automática desativada.' });
            }}
            pushEnabled={prefPushEnabled}
            setPushEnabled={(v) => {
              setPrefPushEnabled(v);
              Toast.show({ type: 'success', text1: 'Preferência salva', text2: v ? 'Notificações ativas.' : 'Notificações desativadas.' });
            }}
            monthlyOptIn={prefMonthlyOptIn}
            setMonthlyOptIn={(v) => {
              setPrefMonthlyOptIn(v);
              Toast.show({ type: 'success', text1: 'Preferência salva', text2: v ? 'Missão mensal ativada.' : 'Missão mensal desativada.' });
            }}
          />

          {/* Mini-lista (top 3) + CTA ver todas */}
          <View style={styles.miniListHeader}>
            <Text style={styles.miniListTitle}>Suas missões</Text>
            <TouchableOpacity onPress={goAllMissions}><Text style={styles.miniListLink}>Ver todas</Text></TouchableOpacity>
          </View>

          <MissionList
            missions={topMissions}
            onClaimMission={handleClaimMission}
            claimingMissionId={claimingMissionId}
            onRefresh={onRefresh}
            isRefreshing={isRefreshing}
          />

          {/* CTA final — troca ícone simples por 3D trophy (mesmo tamanho visual) */}
          <TouchableOpacity style={styles.bigCTA} onPress={goAllMissions}>
            <Icon3D src={Icons3D.trophy} size={18} style={{ marginRight: 8 }} />
            <Text style={styles.bigCTAText}>Ir para Missões</Text>
          </TouchableOpacity>
        </Animated.View>
      </ScrollView>
    </View>
  );
}

// ========== Styles ==========
const styles = StyleSheet.create({
  container: { flex: 1 },
  centeredFeedback: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  loadingText: { marginTop: 10, fontSize: 16 },

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
  headerRightBtn: { paddingHorizontal: 8, paddingVertical: 6, borderRadius: 8, backgroundColor: withAlpha('#FFFFFF', 0.2) },
  headerRightText: { color: '#FFFFFF', fontWeight: '700', fontSize: 12 },

  scrollViewContentContainer: { flexGrow: 1 },

  // HERO
  heroWrapper: { height: HERO_HEIGHT, width: '100%' },
  heroGradient: { flex: 1, paddingTop: Platform.OS === 'ios' ? 80 : 60, paddingHorizontal: 18, justifyContent: 'flex-start' },
  heroContent: { flex: 1 },
  heroKicker: { color: '#D7ECFF', letterSpacing: 1.2, fontWeight: '700', fontSize: 12 },
  heroTitle: { color: '#FFFFFF', fontSize: 24, fontWeight: '800', marginTop: 6, lineHeight: 30, maxWidth: '90%' },
  heroStartButton: { marginTop: 16, alignSelf: 'flex-start', backgroundColor: '#FFFFFF', paddingVertical: 10, paddingHorizontal: 16, borderRadius: 20, flexDirection: 'row', alignItems: 'center', gap: 6 },
  heroStartText: { color: '#0A84FF', fontWeight: '800', fontSize: 13 },
  stepperRow: { flexDirection: 'row', alignItems: 'center', marginTop: 20 },
  stepDot: { width: 10, height: 10, borderRadius: 5, borderWidth: 1.5 },
  stepLine: { flex: 1, height: 2, marginHorizontal: 6 },
  stepperLabels: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 8, paddingRight: 10 },
  stepLabel: { color: 'white', fontSize: 11, fontWeight: '600', flex: 1, textAlign: 'center' },

  // Painel
  panel: { marginTop: -16, borderTopLeftRadius: 18, borderTopRightRadius: 18, paddingTop: 14, paddingBottom: 24 },

  // Discount card
  discountCard: {
    marginHorizontal: 15, marginBottom: 14, borderRadius: 12, backgroundColor: '#FFFFFF', padding: 14,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 4, elevation: 2,
  },
  discountHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  pill: { backgroundColor: '#0A84FF', paddingVertical: 3, paddingHorizontal: 8, borderRadius: 999, marginRight: 8 },
  pillText: { color: '#FFFFFF', fontWeight: '800', fontSize: 12 },
  discountTitle: { fontSize: 16, fontWeight: '700', color: '#1F2937', flexShrink: 1 },

  priceRow: { flexDirection: 'row', alignItems: 'center', marginTop: 8 },
  priceCol: { flex: 1, alignItems: 'center' },
  priceColRight: { flex: 1.2, alignItems: 'center' },
  priceLabel: { fontSize: 12, color: '#6B7280', marginBottom: 6 },
  counterRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  counterBtn: { backgroundColor: '#F3F4F6', borderRadius: 8, padding: 6 },
  priceValue: { fontSize: 16, fontWeight: '700', color: '#111827', minWidth: 90, textAlign: 'center' },
  equalsCol: { width: 30, alignItems: 'center' },
  equalsText: { fontWeight: '800', fontSize: 16, color: '#6B7280' },
  discountedValue: { fontSize: 18, fontWeight: '800', color: '#059669' },
  economyText: { fontSize: 12, color: '#059669', marginTop: 2 },

  useDiscountBtn: { marginTop: 12, backgroundColor: '#0A84FF', borderRadius: 10, paddingVertical: 10, alignItems: 'center', flexDirection: 'row', justifyContent: 'center', gap: 8 },
  useDiscountText: { color: '#FFFFFF', fontWeight: '800' },
  termsText: { marginTop: 8, fontSize: 11, color: '#6B7280', textAlign: 'center' },

  // Summary / Reminder
  summaryCard: { marginHorizontal: 15, marginBottom: 10 },
  reminderCard: { marginHorizontal: 15, marginBottom: 10 },

  // Prefs
  prefsCard: {
    marginHorizontal: 15, marginBottom: 14, borderRadius: 12, backgroundColor: '#FFFFFF', padding: 14,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 4, elevation: 2,
  },
  prefsTitle: { fontSize: 16, fontWeight: '700', color: '#1F2937', marginBottom: 6 },
  prefRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 8 },
  prefIconWrap: { width: 28, alignItems: 'center' },
  prefTextCol: { flex: 1, paddingHorizontal: 10 },
  prefTitle: { fontWeight: '700', color: '#111827' },
  prefSubtitle: { fontSize: 12, color: '#6B7280', marginTop: 2 },

  // Mini-list header
  miniListHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginHorizontal: 15, marginTop: 6 },
  miniListTitle: { fontSize: 16, fontWeight: '700', color: '#1F2937' },
  miniListLink: { color: '#0A84FF', fontWeight: '700' },

  // CTA final
  bigCTA: { marginHorizontal: 15, marginTop: 6, backgroundColor: '#0A84FF', borderRadius: 12, paddingVertical: 12, alignItems: 'center', flexDirection: 'row', justifyContent: 'center' },
  bigCTAText: { color: '#FFFFFF', fontWeight: '800', marginLeft: 8 },
});
