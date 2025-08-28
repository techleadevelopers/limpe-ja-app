import React, { useEffect, useRef, useState, useCallback, useMemo } from 'react';
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
  Share, // Import Share for sharing functionality
} from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next'; // Assuming i18n is set up
import { LinearGradient } from 'expo-linear-gradient';

import Colors from '../../../constants/Colors'; // Adjust path as needed

// Mock Referral Service (replace with actual backend service)
interface ReferralInfo {
  referralCode: string;
  referrerBenefit: string;
  refereeBenefit: string;
  termsLink: string;
}

const mockReferralData: ReferralInfo = {
  referralCode: 'AMIGO2025',
  referrerBenefit: 'R$25 OFF no seu próximo serviço',
  refereeBenefit: 'R$25 OFF no primeiro serviço',
  termsLink: 'https://example.com/termos-referral', // Placeholder link
};

const getReferralInfo = async (): Promise<ReferralInfo> => {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve(mockReferralData);
    }, 800);
  });
};

// ---------- 3D ICONS (absolute paths) ----------
const Icons3D = {
  heroGift: require('../../../assets/images/3d/gift2.png'), // Reusing gift2 from menu
  discountTicket: require('../../../assets/images/3d/ticket.png'), // Reusing ticket from missions
  check: require('../../../assets/images/3d/check.png'), // From missions
  time: require('../../../assets/images/3d/time.png'), // From missions
  button: require('../../../assets/images/3d/button.png'), // From missions
  woman: require('../../../assets/images/3d/woman.png'), // From missions (for hero if needed, but gift is better here)
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
const HERO_HEIGHT = SCREEN_HEIGHT * 0.38; // Consistent with coupons screen

function useTheme() {
  const scheme = useColorScheme?.() || 'light';
  const theme = (Colors as any)[scheme] || (Colors as any).light;
  return theme as typeof Colors.light;
}

// --- Components ---

/** Card para exibir o código de indicação e botões de ação */
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
    <View style={[styles.card, { backgroundColor: theme.cardBackground, borderColor: theme.border }]}>
      <Text style={[styles.cardTitle, { color: theme.text }]}>Seu Código de Indicação</Text>
      <View style={[styles.codeContainer, { backgroundColor: theme.background }]}>
        <Icon3D src={Icons3D.discountTicket} size={24} style={styles.codeIcon} />
        <Text style={[styles.referralCodeText, { color: theme.primary }]}>{referralCode}</Text>
        <TouchableOpacity onPress={() => onCopyCode(referralCode)} style={styles.copyButton}>
          <Ionicons name="copy-outline" size={20} color={theme.textSecondary} />
        </TouchableOpacity>
      </View>
      <View style={styles.buttonRow}>
        <TouchableOpacity
          style={[styles.actionButton, { backgroundColor: theme.primary }]}
          onPress={() => onShareLink(referralCode)}
        >
          <Ionicons name="share-social-outline" size={18} color="#FFFFFF" />
          <Text style={styles.actionButtonText}>Compartilhar Link</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.actionButton, { backgroundColor: theme.accent }]}
          onPress={() => onCopyCode(referralCode)}
        >
          <Ionicons name="copy-outline" size={18} color="#FFFFFF" />
          <Text style={styles.actionButtonText}>Copiar Código</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

/** Seção de benefícios da indicação */
function BenefitsSection({ referrerBenefit, refereeBenefit, theme }: {
  referrerBenefit: string;
  refereeBenefit: string;
  theme: ReturnType<typeof useTheme>;
}) {
  return (
    <View style={[styles.card, { backgroundColor: theme.cardBackground, borderColor: theme.border }]}>
      <Text style={[styles.cardTitle, { color: theme.text }]}>O que vocês ganham?</Text>
      <View style={styles.benefitItem}>
        <Ionicons name="person-outline" size={20} color={theme.primary} />
        <Text style={[styles.benefitText, { color: theme.text }]}>Você: {referrerBenefit}</Text>
      </View>
      <View style={styles.benefitItem}>
        <Ionicons name="person-add-outline" size={20} color={theme.primary} />
        <Text style={[styles.benefitText, { color: theme.text }]}>Seu Amigo: {refereeBenefit}</Text>
      </View>
    </View>
  );
}


/** Guia “Como funciona” */
function HowItWorksReferral({ theme }: { theme: ReturnType<typeof useTheme> }) {
  return (
    <View style={[styles.card, { backgroundColor: theme.cardBackground, borderColor: theme.border }]}>
      <Text style={[styles.cardTitle, { color: theme.text }]}>Como Funciona</Text>
      <View style={styles.howItem}>
        <Icon3D src={Icons3D.check} size={18} />
        <Text style={[styles.howText, { color: theme.text }]}>1. Compartilhe seu código com um amigo.</Text>
      </View>
      <View style={styles.howItem}>
        <Icon3D src={Icons3D.time} size={18} />
        <Text style={[styles.howText, { color: theme.text }]}>2. Seu amigo usa o código no primeiro agendamento.</Text>
      </View>
      <View style={styles.howItem}>
        <Icon3D src={Icons3D.button} size={18} />
        <Text style={[styles.howText, { color: theme.text }]}>3. Ambos recebem um desconto exclusivo!</Text>
      </View>
    </View>
  );
}


export default function ClientReferralScreen() {
  const router = useRouter();
  const { t } = useTranslation(); // Assuming translation is available
  const theme = useTheme();

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
      console.error('Erro ao buscar informações de indicação:', error.response?.data || error.message);
      Alert.alert(t('common.error'), error.response?.data?.message || t('common.network_error'));
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [t]);

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

    loadReferralInfo();
  }, [headerAnim, contentAnim, loadReferralInfo, pulseAnim]);

  const onRefresh = useCallback(() => {
    setIsRefreshing(true);
    loadReferralInfo();
  }, [loadReferralInfo]);

  const handleCopyCode = useCallback((code: string) => {
    // In a real app, you'd use Clipboard.setString(code) from @react-native-clipboard/clipboard
    Alert.alert('Código Copiado!', `"${code}" foi copiado para a sua área de transferência.`);
    console.log(`Copied: ${code}`); // For demonstration
  }, []);

  const handleShareLink = useCallback(async (code: string) => {
    try {
      const result = await Share.share({
        message: `Use meu código de indicação "${code}" para ganhar um desconto no seu primeiro serviço! Link: [Seu link de indicação aqui]`, // Replace with actual referral link
        url: mockReferralData.termsLink, // Optional URL to share
      });
      if (result.action === Share.sharedAction) {
        if (result.activityType) {
          // shared with activity type of result.activityType
          Alert.alert('Sucesso!', 'Código de indicação compartilhado!');
        } else {
          // shared
          Alert.alert('Sucesso!', 'Código de indicação compartilhado!');
        }
      } else if (result.action === Share.dismissedAction) {
        // dismissed
      }
    } catch (error: any) {
      Alert.alert('Erro ao compartilhar', error.message);
    }
  }, []);


  // --- Loading initial state
  if (isLoading && !isRefreshing) {
    return (
      <View style={[styles.centeredFeedback, { backgroundColor: theme.background }]}>
        <Stack.Screen options={{ headerShown: false }} />
        <ActivityIndicator size="large" color={theme.primary} />
        <Text style={[styles.loadingText, { color: theme.textMuted }]}>Carregando informações de indicação...</Text>
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
        <Text style={[styles.headerTitle, { color: '#FFFFFF' }]}>Indique e Ganhe</Text>
        <View style={styles.headerActionIconPlaceholder} />
      </Animated.View>

      <ScrollView
        ref={scrollRef}
        contentContainerStyle={styles.scrollViewContentContainer}
        refreshControl={
          <RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} tintColor={theme.primary} />
        }
      >
        {/* HERO */}
        <View style={styles.heroWrapper}>
          <Animated.Image
            source={Icons3D.heroGift}
            style={[
              styles.heroIcon,
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
              source={Icons3D.heroGift} // Using heroGift icon as subtle background
              style={{ position: 'absolute', right: 12, top: Platform.OS === 'ios' ? 56 : 40, width: 54, height: 54, opacity: 0.10 }}
              resizeMode="contain"
            />
            <View style={styles.heroContent}>
              <Text style={styles.heroKicker}>PROGRAMA DE INDICAÇÃO</Text>
              <Text style={styles.heroTitle}>
                Convide amigos e ganhe benefícios exclusivos!
              </Text>

              <TouchableOpacity style={styles.heroStartButton} onPress={() => scrollRef.current?.scrollToEnd({ animated: true })} accessibilityLabel="Compartilhar Agora">
                <Text style={styles.heroStartText}>COMPARTILHAR AGORA</Text>
                <Ionicons name="share-social" size={16} color={theme.primary} />
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
              style={[styles.termsButton, { borderColor: theme.border }]}
              onPress={() => Alert.alert('Termos e Condições', 'Redirecionar para: ' + referralInfo.termsLink)} // In real app, use Linking.openURL
            >
              <Text style={[styles.termsButtonText, { color: theme.textSecondary }]}>
                Ver Termos e Condições
              </Text>
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
  heroIcon: { // New style for the main hero 3D icon
    position: 'absolute',
    top: Platform.OS === 'ios' ? 260 : 280, // Adjusted position
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

  // General Card Style
  card: {
    marginHorizontal: 15,
    marginBottom: 14,
    borderRadius: 12,
    borderWidth: 1,
    overflow: 'hidden',
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 4, elevation: 2,
    padding: 14,
  },
  cardTitle: { fontSize: 16, fontWeight: '700', marginBottom: 10 }, // Color set by theme

  // Referral Code Card specifics
  codeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 12,
    borderRadius: 8,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  codeIcon: {
    marginRight: 10,
  },
  referralCodeText: {
    flex: 1,
    fontSize: 20,
    fontWeight: '900',
    textAlign: 'center',
  },
  copyButton: {
    padding: 5,
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    gap: 10, // Adjust gap between buttons
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 10,
    gap: 8,
  },
  actionButtonText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 14,
  },

  // Benefits Section specifics
  benefitItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    gap: 8,
  },
  benefitText: {
    fontSize: 14,
  },

  // How it works specifics
  howItem: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 6 },
  howText: { flex: 1 }, // Color set by theme

  // Terms Button
  termsButton: {
    marginHorizontal: 15,
    marginTop: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 12,
    borderWidth: 1,
    backgroundColor: '#FFFFFF',
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 4, elevation: 2,
  },
  termsButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
});