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
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Stack, useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next'; // Assuming i18n is set up

import Colors from '../../../constants/Colors'; // Adjust path as needed
import { getMyCoupons as getMyCouponsService, MyCouponListItem } from '../../../services/couponService';
import * as Haptics from 'expo-haptics';
import NotificationUIService from '../../../services/notificationUIService'; // Haptics premium para interações

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

  const cardBgColor = '#FFFFFF';
  const cardBorderColor = isAvailable ? '#4A90E2' : '#E9ECEF';
  const buttonBgColor = isAvailable ? '#4A90E2' : '#F8F9FA';
  const buttonTextColor = isAvailable ? '#FFFFFF' : '#6B7280';

  return (
    <TouchableOpacity
      onPress={buttonAction}
      disabled={buttonDisabled}
      accessibilityRole="button"
      accessibilityLabel={isAvailable ? `Usar cupom ${coupon.title}` : `${buttonText} - ${coupon.title}`}
      accessibilityHint={isAvailable ? 'Toque para usar este cupom' : 'Cupom não disponível para uso'}
      accessibilityState={{ disabled: buttonDisabled }}
    >
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
          onPress={() => {
            if (Platform.OS === 'ios') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            buttonAction?.();
          }}
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
    </TouchableOpacity>
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
        <Icon3D src={icon3d} size={20} />
      </View>
      <View style={styles.prefTextCol}>
        <Text style={styles.prefTitle}>
          {title}
        </Text>
        <Text style={styles.prefSubtitle}>{subtitle}</Text>
      </View>
      <Switch 
        value={value} 
        onValueChange={(v) => {
          if (Platform.OS === 'ios') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          onValueChange(v);
        }}
        trackColor={{ false: '#E9ECEF', true: '#4A90E2' }}
        thumbColor="#FFFFFF"
      />
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
        <Icon3D src={Icons3D.check} size={20} />
        <Text style={styles.howText}>Resgate o cupom desejado para ativá-lo em sua conta.</Text>
      </View>
      <View style={styles.howItem}>
        <Icon3D src={Icons3D.time} size={20} />
        <Text style={styles.howText}>Cupons resgatados são aplicados automaticamente no checkout do próximo agendamento elegível.</Text>
      </View>
      <View style={styles.howItem}>
        <Icon3D src={Icons3D.button} size={20} />
        <Text style={styles.howText}>Fique atento às datas de validade e regras de cada cupom.</Text>
      </View>
    </View>
  );
}


export default function ClientCouponsScreen() {
  const router = useRouter();
  const { t } = useTranslation(); // Assuming translation is available
  const theme = useTheme();
  const insets = useSafeAreaInsets(); // Robust alignment for iOS

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
      console.error('Erro ao buscar cupons do cliente:', error?.response?.data || error?.message);
      NotificationUIService.showError(error?.response?.data?.message || t('common.network_error', { defaultValue: 'Falha de rede.' }), t('common.error', { defaultValue: 'Erro' }));
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
    if (Platform.OS === 'ios') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    router.push({ pathname: '/(client)/bookings/schedule-service', params: { couponCode: coupon.code } } as any);
    NotificationUIService.showInfo(`Cupom ${coupon.code} pronto para uso no checkout.`, 'Cupom selecionado');
  };

  const onRefresh = useCallback(() => {
    if (Platform.OS === 'ios') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
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
      <View style={[styles.centeredFeedback, { backgroundColor: '#F6F8FB' }]}>
        <Stack.Screen options={{ headerShown: false }} />
        <ActivityIndicator size="large" color="#4A90E2" />
        <Text style={styles.loadingText}>Carregando cupons...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />

      {/* Header de navegação sobreposto (branco premium) */}
      <Animated.View
        style={[
          styles.customHeader,
          {
            opacity: headerAnim,
            transform: [{ translateY: headerAnim.interpolate({ inputRange: [0, 1], outputRange: [-40, 0] }) }],
            paddingTop: Platform.OS === 'ios' ? insets.top + 16 : 16, // Robust insets for iOS
          },
        ]}
      >
        <TouchableOpacity 
          onPress={() => {
            if (Platform.OS === 'ios') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            router.back();
          }} 
          style={styles.headerBackButton} 
          accessibilityLabel="Voltar"
          accessibilityHint="Retorne à tela anterior"
        >
          <Ionicons name="arrow-back" size={24} color="#4A5568" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Meus Cupons</Text>
        <View style={styles.headerActionIconPlaceholder} />
      </Animated.View>

      <ScrollView
        ref={scrollRef}
        contentContainerStyle={styles.scrollViewContentContainer}
        refreshControl={
          <RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} tintColor="#4A90E2" />
        }
        keyboardShouldPersistTaps="handled"
      >
        {/* Hero simplificado (clean branco, sem gradiente) */}
        <View style={styles.heroWrapper}>
          <View style={styles.heroPlainBackground}>
            <View style={styles.heroContent}>
              <Text style={styles.heroKickerWhiteBg}>Economize nos seus serviços</Text>
              <Text style={styles.heroTitleWhiteBg}>Resgate cupons e ganhe descontos exclusivos</Text>
              <TouchableOpacity
                style={styles.heroStartButtonWhiteBg}
                onPress={() => {
                  if (Platform.OS === 'ios') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  scrollRef.current?.scrollTo({ y: 0, animated: true });
                }}
                accessibilityRole="button"
                accessibilityLabel="Explorar cupons"
                accessibilityHint="Role para baixo para ver seus cupons disponíveis."
              >
                <Ionicons name="chevron-down" size={16} color="#4A5568" />
                <Text style={styles.heroStartTextWhiteBg}>Explorar cupons</Text>
              </TouchableOpacity>
            </View>
            <Image source={Icons3D.woman} style={styles.heroWomanIcon} />
          </View>
        </View>

        {/* Painel branco sobreposto (premium clean) */}
        <Animated.View
          style={[
            styles.panel,
            {
              opacity: contentAnim,
              transform: [{ translateY: contentAnim.interpolate({ inputRange: [0, 1], outputRange: [20, 0] }) }],
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

          {/* Abas (pill premium) */}
          <View style={styles.tabsContainer}>
            <TouchableOpacity
              style={[styles.tabButton, activeTab === 'AVAILABLE' && styles.tabButtonActive]}
              onPress={() => {
                if (Platform.OS === 'ios') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                setActiveTab('AVAILABLE');
              }}
              accessibilityRole="tab"
              accessibilityLabel="Cupons disponíveis"
              accessibilityState={{ selected: activeTab === 'AVAILABLE' }}
            >
              <Text style={[styles.tabButtonText, activeTab === 'AVAILABLE' && styles.tabButtonTextActive]}>Disponíveis</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.tabButton, activeTab === 'USED' && styles.tabButtonActive]}
              onPress={() => {
                if (Platform.OS === 'ios') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                setActiveTab('USED');
              }}
              accessibilityRole="tab"
              accessibilityLabel="Cupons usados"
              accessibilityState={{ selected: activeTab === 'USED' }}
            >
              <Text style={[styles.tabButtonText, activeTab === 'USED' && styles.tabButtonTextActive]}>Usados</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.tabButton, activeTab === 'EXPIRED' && styles.tabButtonActive]}
              onPress={() => {
                if (Platform.OS === 'ios') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                setActiveTab('EXPIRED');
              }}
              accessibilityRole="tab"
              accessibilityLabel="Cupons expirados"
              accessibilityState={{ selected: activeTab === 'EXPIRED' }}
            >
              <Text style={[styles.tabButtonText, activeTab === 'EXPIRED' && styles.tabButtonTextActive]}>Expirados</Text>
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
              <Ionicons name="sad-outline" size={48} color="#9CA3AF" />
              <Text style={styles.noCouponsText}>
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
  container: { 
    flex: 1, 
    backgroundColor: '#F6F8FB', // Fundo suave premium
  },
  centeredFeedback: { 
    flex: 1, 
    justifyContent: 'center', 
    alignItems: 'center', 
    paddingTop: 100,
  },
  loadingText: { 
    marginTop: 10, 
    fontSize: 16, 
    color: '#6B7280',
    textAlign: 'center',
  },

  // Header (branco premium, alinhado)
  customHeader: {
    position: 'absolute',
    top: 0, left: 0, right: 0,
    zIndex: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 16,
    backgroundColor: '#FFFFFF',
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E9ECEF',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  headerBackButton: { 
    padding: 8,
  },
  headerTitle: { 
    fontSize: 18, 
    fontWeight: '700', 
    flex: 1, 
    textAlign: 'center',
    letterSpacing: 0.8, // Espaçamento refinado premium
    color: '#4A5568',
  },
  headerActionIconPlaceholder: { 
    width: 24, 
    height: 24, 
  },

  // Scroll
  scrollViewContentContainer: { 
    flexGrow: 1,
    paddingBottom: 40, // Espaçamento inferior confortável
  },

  // Hero (clean branco, sem gradiente, espaçamento premium)
  heroWrapper: { 
    height: HERO_HEIGHT, 
    width: '100%' 
  },
  heroPlainBackground: { 
    flex: 1,
    backgroundColor: '#F6F8FB', // Fundo suave
    paddingTop: Platform.OS === 'ios' ? 120 : 80, // Padding confortável com insets implícito
    paddingHorizontal: 20,
    justifyContent: 'flex-start',
  },
  heroWomanIcon: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 180 : 160, // Posição ajustada para conforto
    right: 20,
    width: 140,
    height: 140,
    zIndex: 10,
  },
  heroContent: {
    flex: 1,
    zIndex: 2,
    paddingHorizontal: 8,
  },
  heroKickerWhiteBg: { 
    color: '#6B7280', 
    letterSpacing: 1.2, 
    fontWeight: '600', 
    fontSize: 14, // Legível premium
  },
  heroTitleWhiteBg: { 
    color: '#4A5568', 
    fontSize: 24, 
    fontWeight: '700', 
    marginTop: 8, 
    lineHeight: 28, // Leitura confortável
    maxWidth: '90%' 
  },
  heroStartButtonWhiteBg: { 
    marginTop: 16, 
    alignSelf: 'flex-start', 
    backgroundColor: '#F8F9FA', // Fundo claro premium
    paddingVertical: 12, 
    paddingHorizontal: 20, 
    borderRadius: 20, 
    flexDirection: 'row', 
    alignItems: 'center', 
    gap: 8,
    borderWidth: 1,
    borderColor: '#E9ECEF',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  heroStartTextWhiteBg: { 
    color: '#4A5568', 
    fontWeight: '600', 
    fontSize: 14,
  },

  // Panel (arredondado superior, premium)
  panel: {
    marginTop: -20, // Overlap suave
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingTop: 24,
    paddingBottom: 24,
    backgroundColor: '#FFFFFF',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -4 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
      },
      android: {
        elevation: 4,
      },
    }),
  },

  // Coupon Card (premium com sombras suaves)
  couponListContainer: {
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  couponCard: {
    marginBottom: 16,
    borderRadius: 16,
    borderWidth: 1,
    overflow: 'hidden',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.06,
        shadowRadius: 8,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  couponHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F8F9FA',
  },
  couponImage: {
    width: 64,
    height: 64,
    borderRadius: 12,
    marginRight: 16,
    backgroundColor: '#F8F9FA',
  },
  couponInfo: {
    flex: 1,
  },
  couponTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#4A5568',
    marginBottom: 4,
  },
  couponDescription: {
    fontSize: 14,
    color: '#6B7280',
    lineHeight: 20,
  },
  couponDetails: {
    padding: 16,
  },
  couponValue: {
    fontSize: 24,
    fontWeight: '700',
    color: '#10B981', // Verde acento para valor
    marginBottom: 8,
  },
  couponMinOrder: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 4,
    fontWeight: '500',
  },
  couponExpiry: {
    fontSize: 13,
    color: '#9CA3AF',
    fontWeight: '500',
  },
  couponButton: {
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: 12,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  couponButtonText: {
    fontWeight: '600',
    fontSize: 16,
  },
  couponOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(249, 250, 251, 0.9)', // Overlay sutil
    justifyContent: 'center',
    alignItems: 'center',
  },
  couponOverlayText: {
    color: '#9CA3AF',
    fontSize: 20,
    fontWeight: '700',
    transform: [{ rotate: '-15deg' }],
  },

  // Prefs (premium spacing)
  prefsCard: {
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: 16,
    backgroundColor: '#FFFFFF',
    padding: 20, // Espaçamento confortável
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.06,
        shadowRadius: 8,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  prefsTitle: { 
    fontSize: 18, 
    fontWeight: '700', 
    color: '#4A5568', 
    marginBottom: 16,
  },
  prefRow: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'space-between', 
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F8F9FA',
  },
  prefIconWrap: { 
    width: 32, 
    alignItems: 'center',
  },
  prefTextCol: { 
    flex: 1, 
    paddingHorizontal: 12,
  },
  prefTitle: { 
    fontWeight: '700', 
    color: '#4A5568',
    fontSize: 16,
  },
  prefSubtitle: { 
    fontSize: 14, 
    color: '#6B7280', 
    marginTop: 2,
    lineHeight: 18,
  },

  // How it works (premium spacing)
  howCard: {
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: 16,
    backgroundColor: '#FFFFFF',
    padding: 20,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.06,
        shadowRadius: 8,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  howTitle: { 
    fontSize: 18, 
    fontWeight: '700', 
    color: '#4A5568', 
    marginBottom: 16,
  },
  howItem: { 
    flexDirection: 'row', 
    alignItems: 'flex-start', 
    gap: 12, 
    marginBottom: 12,
  },
  howText: { 
    color: '#6B7280', 
    flex: 1,
    fontSize: 14,
    lineHeight: 20,
  },

  // Abas (pill premium, espaçamento confortável)
  tabsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginHorizontal: 16,
    marginBottom: 20,
    backgroundColor: '#F8F9FA',
    borderRadius: 20,
    padding: 6,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  tabButton: { 
    flex: 1, 
    paddingVertical: 12, 
    alignItems: 'center', 
    borderRadius: 16, 
    borderWidth: 1, 
    borderColor: 'transparent',
    minWidth: 80, // Largura mínima para toque fácil
  },
  tabButtonActive: { 
    backgroundColor: '#FFFFFF', 
    borderColor: '#4A90E2',
  },
  tabButtonText: { 
    fontSize: 14, 
    fontWeight: '600',
  },
  tabButtonTextActive: { 
    color: '#4A90E2',
  },

  noCouponsContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32, // Espaçamento generoso
    marginHorizontal: 16,
    borderRadius: 16,
    backgroundColor: '#FFFFFF',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.06,
        shadowRadius: 8,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  noCouponsText: {
    marginTop: 12,
    fontSize: 16,
    textAlign: 'center',
    color: '#6B7280',
    lineHeight: 22,
  },
});
