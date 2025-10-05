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
  Switch,
} from 'react-native';
import { Stack, useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next'; // Assuming i18n is set up
import { LinearGradient } from 'expo-linear-gradient'; // Mantido caso queira reverter ou usar em outro lugar, mas não será usado no hero

import Colors from '../../../constants/Colors'; // Adjust path as needed
import { getMyCoupons as getMyCouponsService, MyCouponListItem } from '../../../services/couponService';

// Mock Coupon Service (replace with actual backend service)
enum CouponType {
  PERCENTAGE = 'percentage',
  FIXED = 'fixed',
}

enum CouponStatus {
  AVAILABLE = 'available',
  USED = 'used',
  EXPIRED = 'expired',
}

interface CouponItem {
  id: string;
  code: string;
  title: string;
  description: string;
  value: number;
  type: CouponType;
  minOrderValue?: number;
  expiresAt: string;
  status: CouponStatus;
  imageUrl?: string;
  isClaimed?: boolean; // If it's a coupon that needs to be "claimed" first
}

// Mapeadores do backend -> UI local
const normalizeValueType = (vt?: string): 'PERCENT' | 'FIXED' => {
  const t = (vt || '').toUpperCase();
  return t.includes('PERCENT') ? 'PERCENT' : 'FIXED';
};

const deriveStatus = (status?: string, validUntil?: string): 'available' | 'used' | 'expired' => {
  if (status) {
    const s = status.toUpperCase();
    if (s === 'ACTIVE') return 'available';
    if (s === 'EXPIRED' || s === 'INACTIVE') return 'expired';
    if (s === 'USED' || s === 'USED_UP') return 'used';
  }
  if (validUntil && new Date(validUntil).getTime() < Date.now()) return 'expired';
  return 'available';
};

const mapApiToUICoupon = (c: MyCouponListItem): CouponItem => {
  const expiresAt = c.validUntil;
  const mappedStatus = deriveStatus(c.status, expiresAt);
  return {
    id: c.id,
    code: c.code,
    title: c.description ? c.description : `Cupom ${c.code}`,
    description: c.description || '',
    value: c.value,
    type: normalizeValueType(c.valueType) === 'PERCENT' ? CouponType.PERCENTAGE : CouponType.FIXED,
    minOrderValue: c.minOrderValue,
    expiresAt,
    status: mappedStatus === 'available' ? CouponStatus.AVAILABLE : mappedStatus === 'used' ? CouponStatus.USED : CouponStatus.EXPIRED,
    imageUrl: c.imageUrl,
    isClaimed: false,
  };
};

const mockCoupons: CouponItem[] = [
  {
    id: 'cpn001',
    code: 'SAVE15',
    title: '15% OFF no seu próximo serviço!',
    description: 'Válido para serviços acima de R$100. Use até 30/09/2025.',
    value: 15,
    type: CouponType.PERCENTAGE,
    minOrderValue: 100,
    expiresAt: '2025-09-30T23:59:59Z',
    status: CouponStatus.AVAILABLE,
    imageUrl: 'https://images.unsplash.com/photo-1579547621870-071a17951522?q=80&w=2070&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D', // Placeholder
  },
  {
    id: 'cpn002',
    code: 'FRETEGRATIS',
    title: 'Frete Grátis em qualquer serviço!',
    description: 'Aproveite o frete grátis em seu próximo agendamento.',
    value: 0,
    type: CouponType.FIXED,
    expiresAt: '2025-10-15T23:59:59Z',
    status: CouponStatus.AVAILABLE,
    imageUrl: 'https://images.unsplash.com/photo-1509822929063-f36750523063?q=80&w=2070&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D', // Placeholder
  },
  {
    id: 'cpn003',
    code: 'OFF20',
    title: 'R$20 OFF em serviços de limpeza!',
    description: 'Desconto fixo de R$20 em qualquer serviço de limpeza.',
    value: 20,
    type: CouponType.FIXED,
    expiresAt: '2025-08-20T23:59:59Z',
    status: CouponStatus.EXPIRED,
    imageUrl: 'https://images.unsplash.com/photo-1541701494587-c116c4955518?q=80&w=2070&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D', // Placeholder
  },
  {
    id: 'cpn004',
    code: 'USEDCOUPON',
    title: 'Cupom de Boas-Vindas',
    description: 'Você já utilizou este cupom em seu primeiro agendamento.',
    value: 10,
    type: CouponType.PERCENTAGE,
    expiresAt: '2025-07-01T23:59:59Z',
    status: CouponStatus.USED,
    isClaimed: true,
    imageUrl: 'https://images.unsplash.com/photo-1574719033379-3c872477382d?q=80&w=2070&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D', // Placeholder
  },
];

const getMyCoupons = async (): Promise<CouponItem[]> => {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve(mockCoupons);
    }, 800);
  });
};

const claimCoupon = async (couponId: string): Promise<{ success: boolean; message: string }> => {
  return new Promise((resolve) => {
    setTimeout(() => {
      const coupon = mockCoupons.find(c => c.id === couponId);
      if (coupon && coupon.status === CouponStatus.AVAILABLE && !coupon.isClaimed) {
        coupon.isClaimed = true; // Simulate claiming
        resolve({ success: true, message: `Cupom ${coupon.code} resgatado com sucesso!` });
      } else if (coupon && coupon.isClaimed) {
        resolve({ success: false, message: 'Este cupom já foi resgatado.' });
      } else {
        resolve({ success: false, message: 'Cupom não encontrado ou não disponível para resgate.' });
      }
    }, 500);
  });
};


// ---------- 3D ICONS (absolute paths) ----------
const Icons3D = {
  heroCoupon: require('../../../assets/images/3d/ticket3.png'), // Reusing ticket3 from missions
  discount: require('../../../assets/images/3d/ticket.png'), // Reusing ticket from missions
  gift: require('../../../assets/images/3d/gift2.png'), // Reusing gift2 from menu
  check: require('../../../assets/images/3d/check.png'), // From missions
  time: require('../../../assets/images/3d/time.png'), // From missions
  button: require('../../../assets/images/3d/button.png'), // From missions
  woman: require('../../../assets/images/3d/woman.png'), // From missions
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

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const HERO_HEIGHT = SCREEN_HEIGHT * 0.38; // Slightly smaller hero for coupons

function useTheme() {
  const scheme = useColorScheme?.() || 'light';
  const theme = (Colors as any)[scheme] || (Colors as any).light;
  return theme as typeof Colors.light;
}

// --- Components ---

/** Card de cupom individual */
function CouponCard({
  coupon,
  onUseCoupon,
  theme,
}: {
  coupon: CouponItem;
  onUseCoupon: (coupon: CouponItem) => void;
  theme: ReturnType<typeof useTheme>;
}) {
  const isAvailable = coupon.status === (CouponStatus as any).AVAILABLE || (coupon as any).status === 'available';
  const isUsed = coupon.status === (CouponStatus as any).USED || (coupon as any).status === 'used';
  const isExpired = coupon.status === CouponStatus.EXPIRED;

  const buttonText = isAvailable ? 'Usar Cupom' : (isUsed ? 'Cupom Usado' : 'Expirado');
  const buttonDisabled = !isAvailable;
  const buttonAction = isAvailable ? () => onUseCoupon(coupon) : undefined;

  const cardBgColor = isAvailable ? '#FFFFFF' : theme.cardBackground;
  const cardBorderColor = isAvailable ? theme.primary : theme.border;
  const buttonBgColor = isAvailable ? theme.primary : theme.textMuted;
  const buttonTextColor = isAvailable ? '#FFFFFF' : theme.textSecondary;

  return (
    <View style={[styles.couponCard, { backgroundColor: cardBgColor, borderColor: cardBorderColor }]}>
      <View style={styles.couponHeader}>
        <Image source={{ uri: coupon.imageUrl || 'https://via.placeholder.com/60' }} style={styles.couponImage} />
        <View style={styles.couponInfo}>
          <Text style={styles.couponTitle}>{coupon.title}</Text>
          <Text style={styles.couponDescription}>{coupon.description}</Text>
        </View>
      </View>
      <View style={styles.couponDetails}>
        {((coupon as any).valueType === 'PERCENT' || (coupon as any).type === CouponType.PERCENTAGE) ? (
          <Text style={styles.couponValue}>{coupon.value}% OFF</Text>
        ) : (
          <Text style={styles.couponValue}>{formatBRL(coupon.value)} OFF</Text>
        )}
        {coupon.minOrderValue != null && (
          <Text style={styles.couponMinOrder}>Mín. {formatBRL(coupon.minOrderValue)}</Text>
        )}
        <Text style={styles.couponExpiry}>Expira em: {new Date(coupon.expiresAt).toLocaleDateString('pt-BR')}</Text>
      </View>
      <TouchableOpacity
        style={[styles.couponButton, { backgroundColor: buttonBgColor }]}
        onPress={buttonAction}
        disabled={buttonDisabled}
      >
        <Text style={[styles.couponButtonText, { color: buttonTextColor }]}>{buttonText}</Text>
      </TouchableOpacity>
      {!isAvailable && (
        <View style={styles.couponOverlay}>
          <Text style={styles.couponOverlayText}>{isUsed ? 'USADO' : 'EXPIRADO'}</Text>
        </View>
      )}
    </View>
  );
}

/** Seção de preferências rápidas (local state; plugar no backend quando disponível) */
function PreferencesSection({
  autoApply,
  setAutoApply,
}: {
  autoApply: boolean;
  setAutoApply: (v: boolean) => void;
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
        <Text style={styles.prefTitle}>
          {title}
        </Text>
        <Text style={styles.prefSubtitle}>{subtitle}</Text>
      </View>
      <Switch value={value} onValueChange={onValueChange} />
    </View>
  );

  return (
    <View style={styles.prefsCard}>
      <Text style={styles.prefsTitle}>Preferências de Cupom</Text>
      <Row
        title="Aplicar cupons automaticamente"
        subtitle="Sempre que você for elegível, aplicamos na finalização."
        value={autoApply}
        onValueChange={setAutoApply}
        icon3d={Icons3D.heroCoupon} // Reusing a ticket-like icon
      />
    </View>
  );
}

/** Guia “Como funciona” -- alinhado ao backend */
function HowItWorks() {
  return (
    <View style={styles.howCard}>
      <Text style={styles.howTitle}>Como usar seus cupons</Text>
      <View style={styles.howItem}>
        <Icon3D src={Icons3D.check} size={18} />
        <Text style={styles.howText}>Resgate o cupom desejado para ativá-lo em sua conta.</Text>
      </View>
      <View style={styles.howItem}>
        <Icon3D src={Icons3D.time} size={18} />
        <Text style={styles.howText}>Cupons resgatados são aplicados automaticamente no checkout do próximo agendamento elegível.</Text>
      </View>
      <View style={styles.howItem}>
        <Icon3D src={Icons3D.button} size={18} />
        <Text style={styles.howText}>Fique atento às datas de validade e regras de cada cupom.</Text>
      </View>
    </View>
  );
}


export default function ClientCouponsScreen() {
  const router = useRouter();
  const { t } = useTranslation(); // Assuming translation is available
  const theme = useTheme();

  const [allCoupons, setAllCoupons] = useState<CouponItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState<'AVAILABLE' | 'USED' | 'EXPIRED'>('AVAILABLE');

  // Local preference
  const [prefAutoApply, setPrefAutoApply] = useState(true);

  const headerAnim = useRef(new Animated.Value(0)).current;
  const contentAnim = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const scrollRef = useRef<ScrollView>(null);

  // --- Load Coupons
  const loadCoupons = useCallback(async () => {
    setIsRefreshing(true);
    try {
      const fetched = await getMyCouponsService();
      const mapped = fetched.map(mapApiToUICoupon);
      setAllCoupons(mapped);
    } catch (error: any) {
      console.error('Erro ao buscar cupons do cliente:', error.response?.data || error.message);
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

    loadCoupons();
  }, [headerAnim, contentAnim, loadCoupons, pulseAnim]); // Claim desativado (cupons já estão vinculados ao usuário)

  // --- Use Coupon (simulate navigation to checkout or apply)
  const handleUseCoupon = (coupon: CouponItem) => {
    Alert.alert(
      'Usar Cupom',
      `Você será redirecionado para agendar um serviço com o cupom "${coupon.code}" aplicado.`,
      [
        { text: 'Cancelar', style: 'cancel' },
        { text: 'Continuar', onPress: () => router.push({ pathname: '/(client)/bookings/schedule-service', params: { couponCode: coupon.code } } as any) },
      ]
    );
  };

  const onRefresh = useCallback(() => {
    setIsRefreshing(true);
    loadCoupons();
  }, [loadCoupons]);

  // --- Filter coupons based on active tab
  const filteredCoupons = useMemo(() => {
    return allCoupons.filter((coupon) => {
      switch (activeTab) {
        case 'AVAILABLE':
          return coupon.status === CouponStatus.AVAILABLE;
        case 'USED':
          return coupon.status === CouponStatus.USED;
        case 'EXPIRED':
          return coupon.status === CouponStatus.EXPIRED;
        default:
          return true;
      }
    });
  }, [allCoupons, activeTab]);

  // --- Loading initial state
  if (isLoading && !isRefreshing) {
    return (
      <View style={[styles.centeredFeedback, { backgroundColor: '#FFFFFF' }]}>
        <Stack.Screen options={{ headerShown: false }} />
        <ActivityIndicator size="large" color={theme.primary} />
        <Text style={[styles.loadingText, { color: theme.textMuted }]}>Carregando cupons...</Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: '#FFFFFF' }]}>
      <Stack.Screen options={{ headerShown: false }} />

      {/* Header de navegação sobreposto (transparente) */}
      <Animated.View
        style={[
          styles.customHeader,
          {
            opacity: headerAnim,
            transform: [{ translateY: headerAnim.interpolate({ inputRange: [0, 1], outputRange: [-40, 0] }) }],
            backgroundColor: '#FFFFFF', // Fundo branco para o cabeçalho
            borderBottomWidth: 1,
            borderBottomColor: '#eee',
            shadowOpacity: 0, // Remover sombra se não desejado
          },
        ]}
      >
        <TouchableOpacity onPress={() => router.back()} style={styles.headerBackButton} accessibilityLabel={t('common.back') || 'Voltar'}>
          <Ionicons name="arrow-back" size={24} color="#333333" /> {/* Ícone preto */}
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: '#333333' }]}>Meus Cupons</Text> {/* Texto preto */}
        <View style={styles.headerActionIconPlaceholder} />
      </Animated.View>

      <ScrollView
        ref={scrollRef}
        contentContainerStyle={styles.scrollViewContentContainer}
        refreshControl={
          <RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} tintColor={theme.primary} />
        }
      >
      

        {/* Painel branco sobreposto */}
        <Animated.View
          style={[
            styles.panel,
            {
              opacity: contentAnim,
              transform: [{ translateY: contentAnim.interpolate({ inputRange: [0, 1], outputRange: [20, 0] }) }],
              backgroundColor: '#FFFFFF', // Fundo branco para o painel
            },
          ]}
        >
          {/* Preferências essenciais (with 3D icons) */}
          <PreferencesSection
            autoApply={prefAutoApply}
            setAutoApply={(v) => {
              setPrefAutoApply(v);
              Alert.alert('Preferência salva', v ? 'Cupons serão aplicados no checkout.' : 'Aplicação automática desativada.');
            }}
          />

          {/* Como funciona (with 3D bullets) */}
          <HowItWorks />

          {/* Abas */}
          <View style={[styles.tabsContainer, { backgroundColor: theme.cardBackground }]}>
            <TouchableOpacity
              style={[styles.tabButton, activeTab === 'AVAILABLE' && [styles.tabButtonActive, { backgroundColor: withAlpha(theme.primary, 0.12), borderColor: theme.primary }]]}
              onPress={() => setActiveTab('AVAILABLE')}
            >
              <Text style={[styles.tabButtonText, { color: theme.text }, activeTab === 'AVAILABLE' && { color: theme.primary }]}>Disponíveis</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.tabButton, activeTab === 'USED' && [styles.tabButtonActive, { backgroundColor: withAlpha(theme.primary, 0.12), borderColor: theme.primary }]]}
              onPress={() => setActiveTab('USED')}
            >
              <Text style={[styles.tabButtonText, { color: theme.text }, activeTab === 'USED' && { color: theme.primary }]}>Usados</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.tabButton, activeTab === 'EXPIRED' && [styles.tabButtonActive, { backgroundColor: withAlpha(theme.primary, 0.12), borderColor: theme.primary }]]}
              onPress={() => setActiveTab('EXPIRED')}
            >
              <Text style={[styles.tabButtonText, { color: theme.text }, activeTab === 'EXPIRED' && { color: theme.primary }]}>Expirados</Text>
            </TouchableOpacity>
          </View>

          {/* Lista de cupons */}
          {filteredCoupons.length > 0 ? (
            <View style={styles.couponListContainer}>
              {filteredCoupons.map((coupon) => (
                <CouponCard
                  key={coupon.id}
                  coupon={coupon}
                  onUseCoupon={handleUseCoupon}
                  theme={theme}
                />
              ))}
            </View>
          ) : (
            <View style={styles.noCouponsContainer}>
              <Ionicons name="sad-outline" size={48} color={theme.textMuted} />
              <Text style={[styles.noCouponsText, { color: theme.textMuted }]}>
                {activeTab === 'AVAILABLE' ? 'Nenhum cupom disponível no momento.' :
                 activeTab === 'USED' ? 'Você ainda não usou nenhum cupom.' :
                 'Nenhum cupom expirado.'}
              </Text>
            </View>
          )}
        </Animated.View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFFFFF' }, // Definido para branco
  centeredFeedback: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  loadingText: { marginTop: 10, fontSize: 16 },

  // Header
  customHeader: {
    position: 'absolute',
    top: 0, left: 0, right: 0,
    zIndex: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 15,
    paddingVertical: Platform.OS === 'ios' ? 50 : 20,
    paddingTop: Platform.OS === 'ios' ? 50 : -20,
    // Fundo branco e borda adicionados diretamente no componente
  },
  headerBackButton: { marginRight: 15 },
  headerTitle: { fontSize: 18, fontWeight: 'bold', flex: 1, textAlign: 'center' },
  headerActionIconPlaceholder: { width: 24, marginLeft: 15 },

  // Scroll
  scrollViewContentContainer: { flexGrow: 1 },

  // Hero
  heroWrapper: { height: HERO_HEIGHT, width: '100%' },
  heroPlainBackground: { // Novo estilo para o fundo branco do hero
    flex: 1,
    backgroundColor: '#FFFFFF',
    paddingTop: Platform.OS === 'ios' ? 200 : 120,
    paddingHorizontal: 28,
    justifyContent: 'flex-start',
  },
  heroWomanIcon: {
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
  heroKickerWhiteBg: { color: '#6B7280', letterSpacing: 1.2, fontWeight: '700', fontSize: 12 }, // Cor ajustada
  heroTitleWhiteBg: { color: '#1F2937', fontSize: 24, fontWeight: '800', marginTop: 6, lineHeight: 30, maxWidth: '90%' }, // Cor ajustada
  heroStartButtonWhiteBg: { // Botão com fundo branco e texto azul
    marginTop: 16, alignSelf: 'flex-start', backgroundColor: '#E0E0E0', // Cor de fundo mais clara para o botão
    paddingVertical: 10, paddingHorizontal: 16, borderRadius: 20, flexDirection: 'row', alignItems: 'center', gap: 6,
  },
  heroStartTextWhiteBg: { color: '#333333', fontWeight: '800', fontSize: 13 }, // Cor ajustada

  // Panel
  panel: {
    marginTop: -14,
    borderTopLeftRadius: 18,
    borderTopRightRadius: 18,
    paddingTop: 16,
    paddingBottom: 24,
    // Fundo branco definido no componente
  },

  // Coupon Card
  couponListContainer: {
    paddingHorizontal: 15,
    marginBottom: 14,
  },
  couponCard: {
    marginBottom: 12,
    borderRadius: 12,
    borderWidth: 1,
    overflow: 'hidden',
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 4, elevation: 2,
  },
  couponHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  couponImage: {
    width: 60,
    height: 60,
    borderRadius: 8,
    marginRight: 12,
    backgroundColor: '#E0E0E0',
  },
  couponInfo: {
    flex: 1,
  },
  couponTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1F2937',
  },
  couponDescription: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 4,
  },
  couponDetails: {
    padding: 12,
  },
  couponValue: {
    fontSize: 20,
    fontWeight: '800',
    color: '#059669',
    marginBottom: 4,
  },
  couponMinOrder: {
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 4,
  },
  couponExpiry: {
    fontSize: 11,
    color: '#9CA3AF',
  },
  couponButton: {
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  couponButtonText: {
    fontWeight: '800',
    fontSize: 14,
  },
  couponOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  couponOverlayText: {
    color: '#FFFFFF',
    fontSize: 24,
    fontWeight: '900',
    transform: [{ rotate: '-20deg' }],
  },

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

  noCouponsContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 30,
    marginHorizontal: 15,
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 4, elevation: 2,
  },
  noCouponsText: {
    marginTop: 10,
    fontSize: 16,
    textAlign: 'center',
  },
});


