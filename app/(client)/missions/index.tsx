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
import { useTranslation } from 'react-i18next';
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

// ---------- 3D ICONS (absolute paths) ----------
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
const formatBRL = (v: number) => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
const calcDiscounted = (base: number, percent: number) => Math.max(0, +(base * (1 - percent / 100)).toFixed(2));

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const HERO_HEIGHT = SCREEN_HEIGHT * 0.28; // mais compacto e consistente
const DISCOUNT_PERCENT = 30; // campanha popular (30% OFF)

function useTheme() {
  const scheme = useColorScheme?.() || 'light';
  const theme = (Colors as any)[scheme] || (Colors as any).light;
  return theme as typeof Colors.light;
}

/** Card de destaque com 30% OFF + simulador de preço */
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
        <Icon3D src={Icons3D.discountTicket} size={36} style={{ marginRight: 10 }} />
        <View style={styles.pill}>
          <Text style={styles.pillText}>{percent}% OFF</Text>
        </View>
        <Text style={styles.discountTitle}>Economize no próximo serviço</Text>
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

        <View style={styles.equalsCol}>
          <Text style={styles.equalsText}>=</Text>
        </View>

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

      <Text style={styles.termsText}>
        Desconto aplicado no próximo agendamento elegível. Válido para missões ativas e conforme regras da campanha.
      </Text>
    </View>
  );
}

/** Seção de preferências rápidas (local state; plugar no backend quando disponível) */
function PreferencesSection({
  autoApply,
  setAutoApply,
  pushEnabled,
  setPushEnabled,
  monthlyOptIn,
  setMonthlyOptIn,
}: {
  autoApply: boolean;
  setAutoApply: (v: boolean) => void;
  pushEnabled: boolean;
  setPushEnabled: (v: boolean) => void;
  monthlyOptIn: boolean;
  setMonthlyOptIn: (v: boolean) => void;
}) {
  const Row = ({
    title,
    subtitle,
    value,
    onValueChange,
    icon3d,
  }: {
    title: string;
    subtitle: string;
    value: boolean;
    onValueChange: (v: boolean) => void;
    icon3d: ImageSourcePropType;
  }) => (
    <View style={styles.prefRow}>
      <View style={styles.prefIconWrap}>
        <Icon3D src={icon3d} size={18} />
      </View>
      <View style={styles.prefTextCol}>
        <Text style={styles.prefTitle}>{title}</Text>
        <Text style={styles.prefSubtitle}>{subtitle}</Text>
      </View>
      <Switch
        value={value}
        onValueChange={(v) => {
          if (Platform.OS === 'ios') {
            // leve feedback nativo se quiser
          }
          onValueChange(v);
        }}
        trackColor={{ false: '#E9ECEF', true: '#4A90E2' }}
        thumbColor="#FFFFFF"
      />
    </View>
  );

  return (
    <View style={styles.prefsCard}>
      <Text style={styles.prefsTitle}>Preferências</Text>
      <Row
        title="Aplicar cupons automaticamente"
        subtitle="Sempre que você for elegível, aplicamos na finalização."
        value={autoApply}
        onValueChange={setAutoApply}
        icon3d={Icons3D.autoApply}
      />
      <Row
        title="Notificar progresso"
        subtitle="Receba avisos quando faltar pouco para o prêmio."
        value={pushEnabled}
        onValueChange={setPushEnabled}
        icon3d={Icons3D.notify}
      />
      <Row
        title="Participar da missão mensal"
        subtitle="3 agendamentos no mês liberam 30% OFF no próximo."
        value={monthlyOptIn}
        onValueChange={setMonthlyOptIn}
        icon3d={Icons3D.monthly}
      />
    </View>
  );
}

/** Guia “Como funciona” -- alinhado ao backend */
function HowItWorks() {
  return (
    <View style={styles.howCard}>
      <Text style={styles.howTitle}>Como funciona</Text>
      <View style={styles.howItem}>
        <Icon3D src={Icons3D.check} size={18} />
        <Text style={styles.howText}>Complete 3 agendamentos no mês e libere 30% OFF no próximo.</Text>
      </View>
      <View style={styles.howItem}>
        <Icon3D src={Icons3D.time} size={18} />
        <Text style={styles.howText}>Avalie o serviço em até 48h para ganhar pontos bônus.</Text>
      </View>
      <View style={styles.howItem}>
        <Icon3D src={Icons3D.payments} size={18} />
        <Text style={styles.howText}>Cupom/pontos são entregues no “Resgatar” e aplicados no checkout.</Text>
      </View>
    </View>
  );
}

export default function ClientMissionsScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const { name, estimate } = useLocalSearchParams<{ name?: string; estimate?: string }>();

  const userFirstName =
    (name && String(name).split(' ')[0]) ||
    t?.('common.you', { defaultValue: 'você' }) ||
    'você';

  const activeBg = withAlpha(theme.primary, 0.08);

  const [allMissions, setAllMissions] = useState<MissionItemType[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [claimingMissionId, setClaimingMissionId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'ACTIVE' | 'CAN_CLAIM' | 'CLAIMED'>('ACTIVE');

  // Preferências locais (plugáveis no backend depois)
  const [prefAutoApply, setPrefAutoApply] = useState(true);
  const [prefPushEnabled, setPrefPushEnabled] = useState(true);
  const [prefMonthlyOptIn, setPrefMonthlyOptIn] = useState(true);

  // Simulador de preço para o banner 30% OFF
  const [basePrice, setBasePrice] = useState<number>(() => {
    const n = Number(estimate);
    return Number.isFinite(n) && n > 0 ? n : 120; // default popular
  });

  const headerAnim = useRef(new Animated.Value(0)).current;
  const contentAnim = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const scrollRef = useRef<ScrollView>(null);

  // --- Carregar missões
  const loadMissions = useCallback(async () => {
    setIsRefreshing(true);
    try {
      const fetchedMissions = await getMyMissions(MissionAudience.CLIENT);
      setAllMissions(fetchedMissions);
    } catch (error: any) {
      Toast.show({
        type: 'error',
        text1: t('common.error'),
        text2: error.response?.data?.message || t('common.network_error'),
      });
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [t]);

  useEffect(() => {
    Animated.parallel([
      Animated.timing(headerAnim, {
        toValue: 1,
        duration: 420,
        easing: Easing.out(Easing.ease),
        useNativeDriver: true,
      }),
      Animated.timing(contentAnim, {
        toValue: 1,
        duration: 600,
        delay: 80,
        easing: Easing.out(Easing.ease),
        useNativeDriver: true,
      }),
    ]).start();

    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.015,
          duration: 1800,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1800,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ])
    ).start();

    loadMissions();
  }, [headerAnim, contentAnim, loadMissions, pulseAnim]);

  // --- Claim
  const handleClaimMission = async (missionId: string) => {
    setClaimingMissionId(missionId);
    try {
      const response = await claimMission(missionId);
      if (response.ok) {
        let rewardMessage = '';
        if (response.rewardType === RewardType.COUPON && response.coupon) {
          rewardMessage = t('missions.claim_success_coupon', {
            code: response.coupon.code,
            value: response.coupon.value,
          });
        } else if (response.rewardType === RewardType.POINTS && response.pointsGranted) {
          rewardMessage = t('missions.claim_success_points', { points: response.pointsGranted });
        } else {
          rewardMessage = t('missions.claim_success');
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

  const onRefresh = useCallback(() => {
    setIsRefreshing(true);
    loadMissions();
  }, [loadMissions]);

  // --- Filtros de aba
  const filteredMissions = allMissions.filter((mission) => {
    switch (activeTab) {
      case 'ACTIVE':
        return mission.progress?.status === MissionStatus.ACTIVE;
      case 'CAN_CLAIM':
        return mission.canClaim && !mission.isClaimed;
      case 'CLAIMED':
        return mission.isClaimed;
      default:
        return true;
    }
  });

  const missionsReadyToClaim = allMissions.find((m) => m.canClaim && !m.isClaimed);

  // --- Stepper (igual ao mock, 4 pontos)
  const steps = [
    { key: 'onboard', label: t('missions.steps.onboard', { defaultValue: 'Cadastro' }) },
    { key: 'book', label: t('missions.steps.book', { defaultValue: 'Agendar' }) },
    { key: 'review', label: t('missions.steps.review', { defaultValue: 'Avaliar' }) },
    { key: 'genius', label: t('missions.steps.genius', { defaultValue: 'Benefícios' }) },
  ];
  const stepIndex =
    missionsReadyToClaim ? 2 :
    allMissions.some((m) => m.isClaimed) ? 3 :
    allMissions.length > 0 ? 1 : 0;

  const onStart = () => {
    setActiveTab('ACTIVE');
    requestAnimationFrame(() => scrollRef.current?.scrollTo({ y: HERO_HEIGHT, animated: true }));
  };

  // --- Preferências (mock persist local)
  useEffect(() => {
    // Pode persistir no futuro (PreferencesService)
  }, [prefAutoApply, prefPushEnabled, prefMonthlyOptIn]);

  // --- Loading inicial
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

      {/* Header branco premium (consistente com Cupons) */}
      <Animated.View
        style={[
          styles.customHeader,
          {
            opacity: headerAnim,
            transform: [{ translateY: headerAnim.interpolate({ inputRange: [0, 1], outputRange: [-40, 0] }) }],
            paddingTop: Platform.OS === 'ios' ? insets.top + 12 : 12,
          },
        ]}
      >
        <TouchableOpacity
          onPress={() => {
            router.back();
          }}
          style={styles.headerBackButton}
          accessibilityLabel={t('common.back') || 'Voltar'}
        >
          <Ionicons name="arrow-back" size={22} color="#475569" />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: '#0F172A' }]}>{t('missions.header_kicker', { defaultValue: 'MISSÕES' })}</Text>
        <View style={styles.headerActionIconPlaceholder} />
      </Animated.View>

      <ScrollView
        ref={scrollRef}
        contentContainerStyle={styles.scrollViewContentContainer}
        refreshControl={
          <RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} tintColor={theme.primary} />
        }
        keyboardShouldPersistTaps="handled"
      >
        {/* HERO - REFATORADO: sem gradiente azul, layout fixo e alinhado */}
        <View style={[styles.heroBlock, { backgroundColor: theme.cardBackground }]}>
          <View style={styles.heroInner}>
            <View style={styles.heroTextCol}>
              <Text style={styles.heroKickerAlt}>{t('missions.header_kicker', { defaultValue: 'MISSÕES' })}</Text>
              <Text style={styles.heroTitleAlt}>
                {t('missions.hero_title', { defaultValue: `Economize como um gênio, ${userFirstName}`, name: userFirstName })}
              </Text>

              <TouchableOpacity style={[styles.heroStartButtonAlt, { backgroundColor: theme.primary }]} onPress={onStart} accessibilityLabel={t('common.start') || 'Começar'}>
                <Text style={[styles.heroStartTextAlt]}>{t('common.start', { defaultValue: 'COMEÇAR' })}</Text>
                <Ionicons name="play" size={14} color="#FFFFFF" />
              </TouchableOpacity>

              <View style={styles.stepperRowAlt}>
                {steps.map((s, idx) => {
                  const reached = idx <= stepIndex;
                  return (
                    <React.Fragment key={s.key}>
                      <View style={[styles.stepDotAlt, { backgroundColor: reached ? theme.primary : '#E6EEF8' }]} />
                      {idx < steps.length - 1 && <View style={[styles.stepLineAlt, { backgroundColor: reached ? withAlpha(theme.primary, 0.12) : '#F1F5F9' }]} />}
                    </React.Fragment>
                  );
                })}
              </View>
            </View>

            {/* Ilustração fixa à direita */}
            <Animated.Image
              source={Icons3D.mascrank}
              style={[styles.heroIllustration, { transform: [{ scale: pulseAnim }] }]}
              resizeMode="contain"
            />
          </View>
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
          {/* Banner 30% OFF + Simulador */}
          <FeaturedDiscountCard
            percent={DISCOUNT_PERCENT}
            base={basePrice}
            onDecBase={() => setBasePrice((v) => Math.max(50, v - 10))}
            onIncBase={() => setBasePrice((v) => Math.min(2000, v + 10))}
            onUse={() => {
              Toast.show({ type: 'success', text1: 'Desconto pronto!', text2: `Vamos aplicar ${DISCOUNT_PERCENT}% no próximo agendamento elegível.` });
              router.push('/(client)/explore');
            }}
          />

          {/* Snack progresso geral */}
          {allMissions.length > 0 && allMissions[0].progress && (
            <Animated.View style={[styles.summaryCard, { transform: [{ scale: pulseAnim }] }]}>
              <MissionProgressSnack
                current={allMissions[0].progress.currentValue}
                goal={allMissions[0].mission.targetValue}
                onView={() => setActiveTab('ACTIVE')}
              />
            </Animated.View>
          )}

          {/* Lembrete de claim */}
          {missionsReadyToClaim && (
            <Animated.View style={[styles.reminderCard, { transform: [{ scale: pulseAnim }] }]}>
              <MissionReminderCard
                missionId={missionsReadyToClaim.mission.id}
                title={missionsReadyToClaim.mission.title}
                deadlineAt={missionsReadyToClaim.mission.updatedAt}
                reward={{ kind: missionsReadyToClaim.mission.rewardType, value: missionsReadyToClaim.mission.rewardValue }}
                onGo={() => setActiveTab('CAN_CLAIM')}
                onDismiss={() => { Alert.alert(t('common.info'), t('missions.reminder_dismissed', { defaultValue: 'Lembrete dispensado' })); }}
              />
            </Animated.View>
          )}

          {/* Preferências essenciais (with 3D icons) */}
          <PreferencesSection
            autoApply={prefAutoApply}
            setAutoApply={(v) => {
              setPrefAutoApply(v);
              Toast.show({ type: 'success', text1: 'Preferência salva', text2: v ? 'Cupons serão aplicados no checkout.' : 'Aplicação automática desativada.' });
            }}
            pushEnabled={prefPushEnabled}
            setPushEnabled={(v) => {
              setPrefPushEnabled(v);
              Toast.show({ type: 'success', text1: 'Preferência salva', text2: v ? 'Você receberá avisos de progresso.' : 'Notificações desativadas.' });
            }}
            monthlyOptIn={prefMonthlyOptIn}
            setMonthlyOptIn={(v) => {
              setPrefMonthlyOptIn(v);
              Toast.show({ type: 'success', text1: 'Preferência salva', text2: v ? 'Missão mensal ativada.' : 'Você saiu da missão mensal.' });
            }}
          />

          {/* Como funciona (with 3D bullets) */}
          <HowItWorks />

          {/* Abas - agora usando t(...) com defaultValue para evitar exibir chaves */}
          <View style={[styles.tabsContainer, { backgroundColor: theme.cardBackground }]}>
            <TouchableOpacity
              style={[styles.tabButton, activeTab === 'ACTIVE' && [styles.tabButtonActive, { backgroundColor: activeBg, borderColor: theme.primary }]]}
              onPress={() => setActiveTab('ACTIVE')}
            >
              <Text style={[styles.tabButtonText, { color: theme.text }, activeTab === 'ACTIVE' && { color: theme.primary }]}>
                {t('missions.tab_active', { defaultValue: 'Ativas' })}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.tabButton, activeTab === 'CAN_CLAIM' && [styles.tabButtonActive, { backgroundColor: activeBg, borderColor: theme.primary }]]}
              onPress={() => setActiveTab('CAN_CLAIM')}
            >
              <Text style={[styles.tabButtonText, { color: theme.text }, activeTab === 'CAN_CLAIM' && { color: theme.primary }]}>
                {t('missions.tab_can_claim', { defaultValue: 'Resgatar' })}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.tabButton, activeTab === 'CLAIMED' && [styles.tabButtonActive, { backgroundColor: activeBg, borderColor: theme.primary }]]}
              onPress={() => setActiveTab('CLAIMED')}
            >
              <Text style={[styles.tabButtonText, { color: theme.text }, activeTab === 'CLAIMED' && { color: theme.primary }]}>
                {t('missions.tab_claimed', { defaultValue: 'Resgatadas' })}
              </Text>
            </TouchableOpacity>
          </View>

          {/* Lista de missões */}
          <MissionList
            missions={filteredMissions}
            onClaimMission={handleClaimMission}
            claimingMissionId={claimingMissionId}
            onRefresh={onRefresh}
            isRefreshing={isRefreshing}
            asStaticList={true}
          />
        </Animated.View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { 
    flex: 1,
  },
  centeredFeedback: { 
    flex: 1, 
    justifyContent: 'center', 
    alignItems: 'center' 
  },
  loadingText: { 
    marginTop: 10, 
    fontSize: 16,
    color: '#64748B'
  },

  // Header (branco premium)
  customHeader: {
    position: 'absolute',
    top: 0, left: 0, right: 0,
    zIndex: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 5,
    backgroundColor: '#FFFFFF',
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#EEF2F7',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.04,
        shadowRadius: 8,
      },
      android: {
        elevation: 3,
      },
    }),
  },
  headerBackButton: { 
    padding: 8,
  },
  headerTitle: { 
    fontSize: 15, 
    fontWeight: '700', 
    flex: 1, 
    textAlign: 'center',
    letterSpacing: 0.6,
  },
  headerActionIconPlaceholder: { 
    width: 28, 
    height: 28, 
  },

  // Scroll
  scrollViewContentContainer: { 
    flexGrow: 1,
    paddingBottom: 60,
  },

  // HERO REFACTORED
  heroBlock: {
    height: HERO_HEIGHT,
    width: '100%',
    paddingHorizontal: 18,
    marginTop: 74,
    justifyContent: 'center',
    // leve sombra para separar do fundo
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.03,
        shadowRadius: 12,
      },
      android: {
        elevation: 2,
      },
    }),
    borderRadius: 16,
    alignSelf: 'center',
    overflow: 'hidden',
  },
  heroInner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    height: '100%',
  },
  heroTextCol: {
    flex: 1,
    paddingVertical: 12,
    paddingRight: 12,
  },
  heroKickerAlt: {
    color: '#94A3B8',
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 1,
  },
  heroTitleAlt: {
    color: '#0F172A',
    fontSize: 20,
    fontWeight: '800',
    marginTop: 8,
    lineHeight: 26,
  },
  heroStartButtonAlt: {
    marginTop: 12,
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    minWidth: 110,
  },
  heroStartTextAlt: {
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: 13,
    marginRight: 6,
  },
  heroIllustration: {
    width: SCREEN_WIDTH * 0.32,
    height: HERO_HEIGHT * 0.9,
    marginLeft: 6,
  },
  stepperRowAlt: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 14,
  },
  stepDotAlt: { width: 9, height: 9, borderRadius: 9 },
  stepLineAlt: { flex: 1, height: 2, marginHorizontal: 8, borderRadius: 4 },

  // Panel
  panel: {
    marginTop: 12,
    borderTopLeftRadius: 22,
    borderTopRightRadius: 22,
    paddingTop: 22,
    paddingBottom: 32,
    backgroundColor: '#FFFFFF',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -4 },
        shadowOpacity: 0.04,
        shadowRadius: 10,
      },
      android: {
        elevation: 4,
      },
    }),
  },

  // Discount card
  discountCard: {
    marginHorizontal: 18,
    marginBottom: 14,
    borderRadius: 14,
    backgroundColor: '#FFFFFF',
    padding: 16,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.04,
        shadowRadius: 12,
      },
      android: {
        elevation: 3,
      },
    }),
  },
  discountHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  pill: { backgroundColor: '#0B76FF', paddingVertical: 6, paddingHorizontal: 10, borderRadius: 999, marginRight: 8 },
  pillText: { color: '#FFFFFF', fontWeight: '800', fontSize: 13 },
  discountTitle: { fontSize: 15, fontWeight: '700', color: '#0F172A', flexShrink: 1 },

  priceRow: { flexDirection: 'row', alignItems: 'center', marginTop: 8 },
  priceCol: { flex: 1, alignItems: 'center' },
  priceColRight: { flex: 1.2, alignItems: 'center' },
  priceLabel: { fontSize: 12, color: '#64748B', marginBottom: 6 },
  counterRow: { flexDirection: 'row', alignItems: 'center' },
  counterBtn: { backgroundColor: '#F8FAFC', borderRadius: 8, padding: 6 },
  priceValue: { fontSize: 16, fontWeight: '700', color: '#0F172A', minWidth: 90, textAlign: 'center' },
  equalsCol: { width: 30, alignItems: 'center' },
  equalsText: { fontWeight: '800', fontSize: 16, color: '#64748B' },
  discountedValue: { fontSize: 18, fontWeight: '800', color: '#059669' },
  economyText: { fontSize: 12, color: '#059669', marginTop: 4 },

  useDiscountBtn: {
    marginTop: 12,
    backgroundColor: '#0B76FF',
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
  },
  useDiscountText: { color: '#FFFFFF', fontWeight: '800' },
  termsText: { marginTop: 10, fontSize: 12, color: '#64748B', textAlign: 'center' },

  // Summary / Reminder
  summaryCard: { marginHorizontal: 18, marginBottom: 12 },
  reminderCard: { marginHorizontal: 18, marginBottom: 12 },

  // Prefs
  prefsCard: {
    marginHorizontal: 18,
    marginBottom: 16,
    borderRadius: 14,
    backgroundColor: '#FFFFFF',
    padding: 14,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.03,
        shadowRadius: 10,
      },
      android: {
        elevation: 3,
      },
    }),
  },
  prefsTitle: { fontSize: 16, fontWeight: '700', color: '#0F172A', marginBottom: 8 },
  prefRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#F2F6FA' },
  prefIconWrap: { width: 28, alignItems: 'center' },
  prefTextCol: { flex: 1, paddingHorizontal: 10 },
  prefTitle: { fontWeight: '700', color: '#0F172A' },
  prefSubtitle: { fontSize: 12, color: '#64748B', marginTop: 2 },

  // How it works
  howCard: {
    marginHorizontal: 18,
    marginBottom: 16,
    borderRadius: 14,
    backgroundColor: '#FFFFFF',
    padding: 14,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.03,
        shadowRadius: 10,
      },
      android: {
        elevation: 3,
      },
    }),
  },
  howTitle: { fontSize: 16, fontWeight: '700', color: '#0F172A', marginBottom: 8 },
  howItem: { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
  howText: { color: '#334155', flex: 1, fontSize: 14 },

  // Abas
  tabsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginHorizontal: 18,
    marginBottom: 16,
    backgroundColor: '#F8FAFC',
    borderRadius: 18,
    padding: 6,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.03,
        shadowRadius: 6,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  tabButton: { flex: 1, paddingVertical: 12, alignItems: 'center', borderRadius: 14, borderWidth: 1, borderColor: 'transparent', minWidth: 80 },
  tabButtonActive: { backgroundColor: '#FFFFFF', borderColor: '#0B76FF' },
  tabButtonText: { fontSize: 14, fontWeight: '600', color: '#0F172A' },
});