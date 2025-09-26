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
  AccessibilityInfo, // Importar AccessibilityInfo
} from 'react-native';
import { Stack, useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { LinearGradient } from 'expo-linear-gradient';

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
const HERO_HEIGHT = SCREEN_HEIGHT * 0.42;
const DISCOUNT_PERCENT = 30; // campanha popular (30% OFF)

function useTheme() {
  const scheme = useColorScheme?.() || 'light';
  const theme = (Colors as any)[scheme] || (Colors as any).light;
  return theme as typeof Colors.light;
}

// Hook para verificar se o movimento reduzido está ativado
function useReducedMotion() {
  const [isReducedMotionEnabled, setIsReducedMotionEnabled] = useState(false);

  useEffect(() => {
    const updateReducedMotion = async () => {
      const enabled = await AccessibilityInfo.isReduceMotionEnabled();
      setIsReducedMotionEnabled(enabled);
    };

    updateReducedMotion();

    const subscription = AccessibilityInfo.addEventListener(
      'reduceMotionChanged',
      setIsReducedMotionEnabled
    );

    return () => subscription.remove();
  }, []);

  return isReducedMotionEnabled;
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
        {/* 3D ticket icon, tiny and subtle */}
        <Icon3D src={Icons3D.discountTicket} size={40} style={{ marginRight: 6 }} />
        <View style={styles.pill}>
          <Text style={styles.pillText}>{percent}% OFF</Text>
        </View>
        <Text style={styles.discountTitle}>Economize no próximo serviço</Text>
      </View>

      <View style={styles.priceRow}>
        <View style={styles.priceCol}>
          <Text style={styles.priceLabel}>Preço base</Text>
          <View style={styles.counterRow}>
            <TouchableOpacity onPress={onDecBase} style={styles.counterBtn} accessibilityLabel="Diminuir preço base em dez reais">
              <Ionicons name="remove" size={16} />
            </TouchableOpacity>
            <Text style={styles.priceValue} accessibilityLabel={`Preço base atual: ${formatBRL(base)}`}>{formatBRL(base)}</Text>
            <TouchableOpacity onPress={onIncBase} style={styles.counterBtn} accessibilityLabel="Aumentar preço base em dez reais">
              <Ionicons name="add" size={16} />
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.equalsCol}>
          <Text style={styles.equalsText}>=</Text>
        </View>

        <View style={styles.priceColRight}>
          <Text style={styles.priceLabel}>Com desconto</Text>
          <Text style={styles.discountedValue} accessibilityLabel={`Preço com ${percent} por cento de desconto: ${formatBRL(discounted)}`}>{formatBRL(discounted)}</Text>
          <Text style={styles.economyText} accessibilityLabel={`Você economiza ${formatBRL(base - discounted)}`}>Você economiza {formatBRL(base - discounted)}</Text>
        </View>
      </View>

      <TouchableOpacity style={styles.useDiscountBtn} onPress={onUse} accessibilityLabel={`Usar desconto de ${percent} por cento agora`}>
        <Ionicons name="flash" size={16} color="#FFFFFF" />
        <Text style={styles.useDiscountText}>Usar desconto</Text>
      </TouchableOpacity>

      <Text style={styles.termsText} accessibilityLabel="Desconto aplicado no próximo agendamento elegível. Válido para missões ativas e conforme regras da campanha.">
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
    <View style={styles.prefRow} accessibilityRole="menuitem">
      <View style={styles.prefIconWrap}>
        <Icon3D src={icon3d} size={18} />
      </View>
      <View style={styles.prefTextCol}>
        <Text style={styles.prefTitle}>{title}</Text>
        <Text style={styles.prefSubtitle}>{subtitle}</Text>
      </View>
      <Switch value={value} onValueChange={onValueChange} accessibilityLabel={title} />
    </View>
  );

  return (
    <View style={styles.prefsCard} accessibilityRole="menu">
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
    <View style={styles.howCard} accessibilityRole="list">
      <Text style={styles.howTitle}>Como funciona</Text>
      <View style={styles.howItem}> {/* REMOVIDO: accessibilityRole="listitem" */}
        <Icon3D src={Icons3D.check} size={18} />
        <Text style={styles.howText}>Complete 3 agendamentos no mês e libere 30% OFF no próximo.</Text>
      </View>
      <View style={styles.howItem}> {/* REMOVIDO: accessibilityRole="listitem" */}
        <Icon3D src={Icons3D.time} size={18} />
        <Text style={styles.howText}>Avalie o serviço em até 48h para ganhar pontos bônus.</Text>
      </View>
      <View style={styles.howItem}> {/* REMOVIDO: accessibilityRole="listitem" */}
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
  const { name, estimate } = useLocalSearchParams<{ name?: string; estimate?: string }>();

  const isReducedMotionEnabled = useReducedMotion(); // Usar o hook de movimento reduzido

  const userFirstName =
    (name && String(name).split(' ')[0]) ||
    t?.('common.you', { defaultValue: 'você' }) ||
    'você';

  const activeBg = withAlpha(theme.primary, 0.12);

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
      console.error('Erro ao buscar missões do cliente:', error.response?.data || error.message);
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
    const animationDuration = isReducedMotionEnabled ? 0 : 500; // Reduzir animações
    const pulseToValue = isReducedMotionEnabled ? 1 : 1.02; // Desabilitar pulso

    Animated.parallel([
      Animated.timing(headerAnim, {
        toValue: 1,
        duration: animationDuration,
        easing: Easing.out(Easing.ease),
        useNativeDriver: true,
      }),
      Animated.timing(contentAnim, {
        toValue: 1,
        duration: isReducedMotionEnabled ? 0 : 700,
        delay: isReducedMotionEnabled ? 0 : 100,
        easing: Easing.out(Easing.ease),
        useNativeDriver: true,
      }),
    ]).start();

    if (!isReducedMotionEnabled) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: pulseToValue,
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
    } else {
      pulseAnim.setValue(1); // Resetar para valor padrão se movimento reduzido estiver ativado
    }


    loadMissions();
  }, [headerAnim, contentAnim, loadMissions, pulseAnim, isReducedMotionEnabled]);

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
      console.error('Erro ao resgatar missão:', error.response?.data || error.message);
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
        <ActivityIndicator size="large" color={theme.primary} accessibilityLabel={t('common.loading') || 'Carregando'} />
        <Text style={[styles.loadingText, { color: theme.textMuted }]}>{t('common.loading')}</Text>
      </View>
    );
  }

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
        <TouchableOpacity onPress={() => router.back()} style={styles.headerBackButton} accessibilityLabel={t('common.back') || 'Voltar'}>
          <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: '#FFFFFF' }]}>{t('missions.header_kicker', { defaultValue: 'MISSÕES' })}</Text>
        <View style={styles.headerActionIconPlaceholder} />
      </Animated.View>

      <ScrollView
        ref={scrollRef}
        contentContainerStyle={styles.scrollViewContentContainer}
        refreshControl={
          <RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} tintColor={theme.primary} accessibilityLabel="Atualizar missões" />
        }
      >
        {/* HERO */}
        <View style={styles.heroWrapper}>
          {/* NOVO: Ícone 3D da Mulher, posicionado de forma isolada */}
          <Animated.Image
            source={Icons3D.mascrank}
            style={[
              styles.heroWomanIcon,
              { transform: [{ scale: pulseAnim }] } // Aplica animação de pulso
            ]}
            resizeMode="contain"
            accessibilityLabel="Mascote com coroa, representando um gênio"
          />

          

          <LinearGradient colors={['rgba(173, 216, 230, 0.7)', 'rgba(74, 145, 226, 0.72)', 'rgba(173, 216, 230, 0.7)']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.heroGradient}>
            {/* faint decorative crown (no layout impact) */}
            <Image
              source={Icons3D.heroCrown}
              style={{ position: 'absolute', right: 12, top: Platform.OS === 'ios' ? 56 : 40, width: 54, height: 54, opacity: 0.10 }}
              resizeMode="contain"
              accessible={false} 
            />
            <View style={styles.heroContent}>
              <Text style={styles.heroKicker}>{t('missions.header_kicker', { defaultValue: 'MISSÕES' })}</Text>
              <Text style={styles.heroTitle} accessibilityLabel={t('missions.hero_title', { defaultValue: `Economize como um gênio, ${userFirstName}`, name: userFirstName })}>
                {t('missions.hero_title', { defaultValue: `Economize como um gênio, ${userFirstName}`, name: userFirstName })}
              </Text>

              <TouchableOpacity style={styles.heroStartButton} onPress={onStart} accessibilityLabel={t('common.start') || 'Começar'}>
                <Text style={styles.heroStartText}>{t('common.start', { defaultValue: 'START' })}</Text>
                <Ionicons name="play" size={16} color={theme.primary} />
              </TouchableOpacity>

              {/* Stepper */}
              <View style={styles.stepperRow} accessibilityRole="progressbar" accessibilityValue={{ now: stepIndex + 1, min: 1, max: steps.length }}>
                {steps.map((s, idx) => {
                  const reached = idx <= stepIndex;
                  return (
                    <React.Fragment key={s.key}>
                      <View style={[styles.stepDot, { backgroundColor: reached ? '#FFFFFF' : withAlpha('#FFFFFF', 0.35), borderColor: withAlpha('#FFFFFF', 0.65) }]} accessibilityLabel={reached ? `Passo ${s.label} concluído` : `Passo ${s.label} pendente`} />
                      {idx < steps.length - 1 && <View style={[styles.stepLine, { backgroundColor: withAlpha('#FFFFFF', reached ? 0.7 : 0.25) }]} accessible={false} />} {/* CORRIGIDO: Usar accessible={false} */}
                    </React.Fragment>
                  );
                })}
              </View>
              <View style={styles.stepperLabels}>
                {steps.map((s, idx) => (
                  <Text key={s.key} style={[styles.stepLabel, { opacity: idx <= stepIndex ? 1 : 0.7 }]} numberOfLines={1} accessibilityLabel={s.label}>
                    {s.label}
                  </Text>
                ))}
              </View>
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
                onDismiss={() => { Alert.alert(t('common.info'), t('missions.reminder_dismissed')); }}
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

          {/* Abas */}
          <View style={[styles.tabsContainer, { backgroundColor: theme.cardBackground }]} accessibilityRole="tablist">
            <TouchableOpacity
              style={[styles.tabButton, activeTab === 'ACTIVE' && [styles.tabButtonActive, { backgroundColor: activeBg, borderColor: theme.primary }]]}
              onPress={() => setActiveTab('ACTIVE')}
              accessibilityRole="tab"
              accessibilityState={{ selected: activeTab === 'ACTIVE' }}
              accessibilityLabel={t('missions.tab_active')}
            >
              <Text style={[styles.tabButtonText, { color: theme.text }, activeTab === 'ACTIVE' && { color: theme.primary }]}>{t('missions.tab_active')}</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.tabButton, activeTab === 'CAN_CLAIM' && [styles.tabButtonActive, { backgroundColor: activeBg, borderColor: theme.primary }]]}
              onPress={() => setActiveTab('CAN_CLAIM')}
              accessibilityRole="tab"
              accessibilityState={{ selected: activeTab === 'CAN_CLAIM' }}
              accessibilityLabel={t('missions.tab_can_claim')}
            >
              <Text style={[styles.tabButtonText, { color: theme.text }, activeTab === 'CAN_CLAIM' && { color: theme.primary }]}>{t('missions.tab_can_claim')}</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.tabButton, activeTab === 'CLAIMED' && [styles.tabButtonActive, { backgroundColor: activeBg, borderColor: theme.primary }]]}
              onPress={() => setActiveTab('CLAIMED')}
              accessibilityRole="tab"
              accessibilityState={{ selected: activeTab === 'CLAIMED' }}
              accessibilityLabel={t('missions.tab_claimed')}
            >
              <Text style={[styles.tabButtonText, { color: theme.text }, activeTab === 'CLAIMED' && { color: theme.primary }]}>{t('missions.tab_claimed')}</Text>
            </TouchableOpacity>
          </View>

          {/* Lista de missões */}
          <MissionList
            missions={filteredMissions}
            onClaimMission={handleClaimMission}
            claimingMissionId={claimingMissionId}
            onRefresh={onRefresh}
            isRefreshing={isRefreshing}
          />
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
    zIndex: 20, // Garante que o cabeçalho esteja acima de tudo
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
    paddingTop: Platform.OS === 'ios' ? 280 : 80, // Mantido o paddingTop original
    paddingHorizontal: 28,
    justifyContent: 'flex-start',
  },
  // NOVO: Estilo para o ícone 3D da mulher
  heroWomanIcon: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 280 : 180, // Posição abaixo do cabeçalho de navegação
    left: '48%', // Centraliza horizontalmente
    marginLeft: 0, // Metade da largura para centralizar
    width: 200, // Tamanho grande
    height: 200, // Tamanho grande
    zIndex: 10, // Garante que esteja acima do gradiente, mas abaixo do cabeçalho de navegação
  },
  heroContent: {
    flex: 1,
    zIndex: 2, // Garante que o conteúdo de texto esteja acima do ícone da mulher se houver sobreposição
  },
  heroKicker: { color: '#D7ECFF', letterSpacing: 1.2, fontWeight: '700', fontSize: 10 },
  heroTitle: { color: '#FFFFFF', fontSize: 20, fontWeight: '800', marginTop: 6, lineHeight: 30, maxWidth: '90%' },
  heroStartButton: {
    marginTop: 16, alignSelf: 'flex-start', backgroundColor: '#FFFFFF',
    paddingVertical: 4, paddingHorizontal: 9, borderRadius: 20, flexDirection: 'row', alignItems: 'center', gap: 6,
  },
  heroStartText: { color: '#0A84FF', fontWeight: '800', fontSize: 10 },
  stepperRow: { flexDirection: 'row', alignItems: 'center', marginTop: 26, paddingHorizontal: 88, right: 90, top: 50, },
  stepDot: { width: 10, height: 10, borderRadius: 15, borderWidth: 1.5 },
  stepLine: { flex: 1, height: 2, marginHorizontal: 6 },
  stepperLabels: { flexDirection: 'row', paddingHorizontal: 80, right: 120, top: 50,  justifyContent: 'space-between', marginTop: 8, paddingRight: 10 },
  stepLabel: { color: 'white', fontSize: 8, fontWeight: '600', flex: 1, textAlign: 'center' },

  // Painel
  panel: {
    marginTop: -24,
    borderTopLeftRadius: 18,
    borderTopRightRadius: 18,
    paddingTop: 16,
    paddingBottom: 24,
  },

  // Discount card
  discountCard: {
    marginHorizontal: 15,
    marginBottom: 14,
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    padding: 14,
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

  useDiscountBtn: {
    marginTop: 12,
    backgroundColor: '#0A84FF',
    borderRadius: 10,
    paddingVertical: 10,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
  },
  useDiscountText: { color: '#FFFFFF', fontWeight: '800' },
  termsText: { marginTop: 8, fontSize: 11, color: '#6B7280', textAlign: 'center' },

  // Summary / Reminder
  summaryCard: { marginHorizontal: 15, marginBottom: 10 },
  reminderCard: { marginHorizontal: 15, marginBottom: 10 },

  // Prefs
  prefsCard: {
    marginHorizontal: 15,
    marginBottom: 14,
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    padding: 14,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 4, elevation: 2,
  },
  prefsTitle: { fontSize: 16, fontWeight: '700', color: '#1F2937', marginBottom: 6 },
  prefRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 8 },
  prefIconWrap: { width: 28, alignItems: 'center' },
  prefTextCol: { flex: 1, paddingHorizontal: 10 },
  prefTitle: { fontWeight: '700', color: '#111827' },
  prefSubtitle: { fontSize: 12, color: '#6B7280', marginTop: 2 },

  // How it works
  howCard: {
    marginHorizontal: 15,
    marginBottom: 14,
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    padding: 14,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 4, elevation: 2,
  },
  howTitle: { fontSize: 16, fontWeight: '700', color: '#1F2937', marginBottom: 8 },
  howItem: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 6 },
  howText: { color: '#374151', flex: 1 },

  // Abas
  tabsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginHorizontal: 15,
    marginBottom: 15,
    borderRadius: 10,
    padding: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 2,
    elevation: 2,
  },
  tabButton: { flex: 1, paddingVertical: 10, alignItems: 'center', borderRadius: 8, borderWidth: 1, borderColor: 'transparent' },
  tabButtonActive: {},
  tabButtonText: { fontSize: 14, fontWeight: 'bold' },
});