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
  Image,
  ImageSourcePropType,
  Share,
  AccessibilityInfo,
} from 'react-native';
import { Stack, useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Toast from '../../../components/Toast';

import Colors from '../../../constants/Colors';
import { getReferralInfo, type ReferralInfo } from '../../../services/referralService';

// ---------- 3D ICONS (absolute paths) ----------
const Icons3D = {
  heroGift: require('../../../assets/images/3d/gift2.png'),
  discountTicket: require('../../../assets/images/3d/ticket.png'),
  check: require('../../../assets/images/3d/check.png'),
  time: require('../../../assets/images/3d/time.png'),
  button: require('../../../assets/images/3d/button.png'),
  woman: require('../../../assets/images/3d/woman.png'),
  mascrank: require('../../../assets/images/3d/masc-rank.png'), // Reused for consistency
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

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const HERO_HEIGHT = SCREEN_HEIGHT * 0.36; // Consistent with missions.tsx

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

// --- UI Components (adapted from missions.tsx styles and structure) ---

/** Card para exibir o código de indicação e botões de ação (similar to FeaturedDiscountCard) */
function ReferralCodeCard({
  referralCode,
  onCopyCode,
  onShareLink,
  theme,
}: {
  referralCode: string;
  onCopyCode: (code: string) => void;
  onShareLink: (code: string) => void;
  theme: ReturnType<typeof useTheme>;
}) {
  return (
    <View style={[styles.discountCard, { backgroundColor: theme.cardBackground }]}>
      <View style={styles.discountHeader}>
        <Icon3D src={Icons3D.discountTicket} size={30} style={{ marginRight: 12 }} />
        <View style={{ flex: 1 }}>
          <Text style={[styles.discountHeadline, { color: theme.text }]}>Seu Código de Indicação</Text>
          <View style={styles.discountMeta}>
            <Text style={[styles.discountSubText, { color: theme.textSecondary }]}>Compartilhe com amigos</Text>
          </View>
        </View>
      </View>

      <View style={styles.codeContainer}>
        <Text style={[styles.referralCodeText, { color: theme.primary }]}>{referralCode}</Text>
      </View>

      <View style={styles.buttonRow}>
        <TouchableOpacity
          style={[styles.actionButton, { backgroundColor: theme.primary }]}
          onPress={() => onShareLink(referralCode)}
        >
          <Ionicons name="share-social-outline" size={18} color="#FFFFFF" />
          <Text style={styles.actionButtonText}>Compartilhar</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.actionButton, { backgroundColor: theme.accent || theme.primary }]}
          onPress={() => onCopyCode(referralCode)}
        >
          <Ionicons name="copy-outline" size={18} color="#FFFFFF" />
          <Text style={styles.actionButtonText}>Copiar</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

/** Seção de benefícios da indicação (similar to HowItWorks) */
function BenefitsSection({ referrerBenefit, refereeBenefit, theme }: {
  referrerBenefit: string;
  refereeBenefit: string;
  theme: ReturnType<typeof useTheme>;
}) {
  return (
    <View style={[styles.howCard, { backgroundColor: theme.cardBackground }]}>
      <Text style={[styles.howTitle, { color: theme.text }]}>O que vocês ganham?</Text>
      <View style={styles.howItem}>
        <Icon3D src={Icons3D.check} size={18} />
        <Text style={[styles.howText, { color: theme.text }]}>Você: {referrerBenefit}</Text>
      </View>
      <View style={styles.howItem}>
        <Icon3D src={Icons3D.button} size={18} />
        <Text style={[styles.howText, { color: theme.text }]}>Amigo: {refereeBenefit}</Text>
      </View>
    </View>
  );
}

/** Guia “Como funciona” (adapted from HowItWorks) */
function HowItWorksReferral({ theme }: { theme: ReturnType<typeof useTheme> }) {
  return (
    <View style={[styles.howCard, { backgroundColor: theme.cardBackground }]}>
      <Text style={[styles.howTitle, { color: theme.text }]}>Como Funciona</Text>
      <View style={styles.howItem}>
        <Icon3D src={Icons3D.check} size={18} />
        <Text style={[styles.howText, { color: theme.text }]}>Compartilhe seu código com um amigo.</Text>
      </View>
      <View style={styles.howItem}>
        <Icon3D src={Icons3D.time} size={18} />
        <Text style={[styles.howText, { color: theme.text }]}>Amigo usa no primeiro agendamento.</Text>
      </View>
      <View style={styles.howItem}>
        <Icon3D src={Icons3D.button} size={18} />
        <Text style={[styles.howText, { color: theme.text }]}>Ambos recebem o desconto!</Text>
      </View>
    </View>
  );
}

// --- Screen (structure from missions.tsx)
export default function ClientReferralScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const isReducedMotion = useReducedMotion();

  const [referralInfo, setReferralInfo] = useState<ReferralInfo | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const headerAnim = useRef(new Animated.Value(0)).current;
  const contentAnim = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const scrollRef = useRef<ScrollView>(null);

  // --- Load Referral Info
  const loadReferralInfo = useCallback(async () => {
    setIsRefreshing(true);
    try {
      const info = await getReferralInfo();
      setReferralInfo(info);
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

    loadReferralInfo();
  }, [headerAnim, contentAnim, loadReferralInfo, pulseAnim, isReducedMotion]);

  const onRefresh = useCallback(() => {
    setIsRefreshing(true);
    loadReferralInfo();
  }, [loadReferralInfo]);

  const handleCopyCode = useCallback((code: string) => {
    Alert.alert('Código Copiado!', `"${code}" foi copiado para a área de transferência.`);
  }, []);

  const handleShareLink = useCallback(async (code: string) => {
    try {
      const result = await Share.share({
        message: `Use meu código de indicação "${code}" para ganhar R$25 OFF no primeiro serviço!`,
        url: referralInfo?.termsLink,
      });
      if (result.action === Share.sharedAction) {
        Alert.alert('Sucesso!', 'Código compartilhado!');
      }
    } catch (error: any) {
      Alert.alert('Erro ao compartilhar', error.message);
    }
  }, [referralInfo]);

  // --- Loading initial
  if (isLoading && !isRefreshing) {
    return (
      <View style={[styles.centeredFeedback, { backgroundColor: theme.background }]}>
        <Stack.Screen options={{ headerShown: false }} />
        <ActivityIndicator size="large" color={theme.primary} />
        <Text style={[styles.loadingText, { color: theme.textMuted }]}>{t('common.loading')}</Text>
      </View>
    );
  }

  // Subtle hero gradient (adapted from missions.tsx)
  const heroGradient = [
    withAlpha(theme.cardBackground || '#FFFFFF', 1),
    withAlpha(theme.background || '#F6F8FB', 1),
  ] as const; // tuple para satisfazer LinearGradient.colors

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
        <Text style={[styles.headerTitle, { color: theme.text }]}>Indique e Ganhe</Text>
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
              <Text style={[styles.kicker, { color: withAlpha(theme.text, 0.6) }]}>INDICAÇÕES</Text>
              <Text style={[styles.title, { color: theme.text }]}>Convide amigos e ganhe benefícios</Text>

              <TouchableOpacity style={[styles.cta, { backgroundColor: theme.primary }]} onPress={() => { requestAnimationFrame(() => scrollRef.current?.scrollTo({ y: HERO_HEIGHT, animated: true })); }} accessibilityLabel="Começar">
                <Text style={styles.ctaText}>COMPARTILHAR</Text>
                <Ionicons name="share-social" size={14} color="#FFF" />
              </TouchableOpacity>

              {/* Stepper adapted for referral steps */}
              <View style={styles.stepper}>
                {[{ key: 'share', label: 'Compartilhar' }, { key: 'use', label: 'Amigo Usa' }, { key: 'gain', label: 'Ganhem' }].map((s, idx) => {
                  const reached = idx <= 1; // Always show first two as reached for demo
                  return (
                    <React.Fragment key={s.key}>
                      <View style={[styles.stepCircle, { backgroundColor: reached ? theme.primary : withAlpha(theme.text, 0.12), borderColor: withAlpha(theme.text, 0.18) }]} />
                      {idx < 2 && <View style={[styles.stepLine, { backgroundColor: reached ? withAlpha(theme.primary, 0.6) : withAlpha(theme.text, 0.08) }]} />}
                    </React.Fragment>
                  );
                })}
              </View>
            </View>

            <Animated.Image source={Icons3D.heroGift} style={[styles.heroMascot, { transform: [{ scale: pulseAnim }] }]} resizeMode="contain" />
          </LinearGradient>
        </View>

        <Animated.View style={[styles.panel, { transform: [{ translateY: contentAnim.interpolate({ inputRange: [0, 1], outputRange: [20, 0] }) }] }]}>
          {referralInfo && (
            <>
              <ReferralCodeCard
                referralCode={referralInfo.referralCode}
                onCopyCode={handleCopyCode}
                onShareLink={handleShareLink}
                theme={theme}
              />
              <BenefitsSection
                referrerBenefit={referralInfo.referrerBenefit}
                refereeBenefit={referralInfo.refereeBenefit}
                theme={theme}
              />
            </>
          )}

          <HowItWorksReferral theme={theme} />

          {referralInfo && (
            <TouchableOpacity
              style={[styles.termsButton, { borderColor: withAlpha(theme.text, 0.2), backgroundColor: theme.cardBackground }]}
              onPress={() => Alert.alert('Termos', `Link: ${referralInfo.termsLink}`)}
            >
              <Text style={[styles.termsButtonText, { color: theme.textSecondary }]}>Termos e Condições</Text>
              <Ionicons name="chevron-forward" size={18} color={theme.textSecondary} />
            </TouchableOpacity>
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

  // Header (from missions.tsx)
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

  // Hero (adapted from missions.tsx)
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

  // DiscountCard / ReferralCodeCard (adapted from missions.tsx discountCard)
  discountCard: {
    marginHorizontal: 16,
    marginTop: 6,
    borderRadius: 16,
    backgroundColor: '#FFF',
    padding: 16,
    shadowColor: '#000', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.06, shadowRadius: 12, elevation: 6,
  },
  discountHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
  discountHeadline: { fontSize: 16, fontWeight: '700', color: '#111827' },
  discountMeta: { flexDirection: 'row', alignItems: 'center', marginTop: 6 },
  discountSubText: { color: '#6B7280', fontSize: 12 },
  codeContainer: { alignItems: 'center', paddingVertical: 12, borderWidth: 1, borderColor: '#E5E7EB', borderRadius: 8, marginVertical: 12 },
  referralCodeText: { fontSize: 24, fontWeight: '800', textAlign: 'center', letterSpacing: 2 },
  buttonRow: { flexDirection: 'row', gap: 12 },
  actionButton: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 12, borderRadius: 12, gap: 8 },
  actionButtonText: { color: '#FFFFFF', fontWeight: '700', fontSize: 14 },

  // HowItWorks / BenefitsSection (from missions.tsx howCard)
  howCard: {
    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: 16,
    backgroundColor: '#FFF',
    padding: 16,
    shadowColor: '#000', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.04, shadowRadius: 12, elevation: 4,
  },
  howTitle: { fontSize: 16, fontWeight: '700', marginBottom: 8 },
  howItem: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 10 },
  howText: { color: '#374151', flex: 1, fontSize: 14 },

  // Terms Button (simple card-like)
  termsButton: {
    marginHorizontal: 16,
    marginTop: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 12,
    borderWidth: 1,
    backgroundColor: '#FFF',
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 4, elevation: 2,
  },
  termsButtonText: { fontSize: 14, fontWeight: '600' },
});