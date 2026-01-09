import { Stack, useRouter } from 'expo-router';
import {
    AccessibilityInfo,
    ActivityIndicator,
    Alert,
    Animated,
    Dimensions,
    Easing,
    FlatList,
    Image,
    InteractionManager,
    Platform,
    RefreshControl,
    Share,
    StyleProp,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
    ViewStyle,
} from 'react-native';

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from '@react-navigation/native';
import { Asset } from 'expo-asset';
import * as Location from 'expo-location';
import { PermissionStatus } from 'expo-location';
import { useTranslation } from 'react-i18next';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Icons3D } from '../../../constants/icons3d';
import { getCurrentPosition } from '../../../services/locationService';

import { useAndroidDialog } from '../../../hooks/useAndroidDialog';
import { useAuth } from '../../../hooks/useAuth';
import { getBookingsForUser } from '../../../services/bookingService';
import {
    getOffers,
    getServiceCategories,
    getUserProfile,
    searchProvidersWithLocation,
} from '../../../services/clientService';
import { canReviewBooking } from '../../../services/reviewService';

import {
    getRecommendedProviders,
} from '../../../services/providerService';

import { BookingDetails, BookingStatus } from '../../../types/backend/bookings';
import { Offer } from '../../../types/backend/offers';
import { ProviderDisplayInfo } from '../../../types/backend/providers';
import { VerificationStatus } from '../../../types/backend/auth';
import { Service } from '../../../types/backend/services';
import { UserProfile } from '../../../types/backend/users';

import { alertUserError } from '../../../_shared/errors/uiFeedback';
import { AppColors } from '../../../constants/appStyles';
import { CLIENT_ROUTES } from '../../../constants/routes';
import type { CityStateHint } from '../../../utils/locationFilter';
import { filterByRadiusOrCity, normalizeLocationText } from '../../../utils/locationFilter';

// Importar o formatAddress e getNumericPriceValue
import { formatAddress, getNextAvailableDate } from '../../../utils/formatters';
import { getNumericPriceValue } from '../../../utils/service-helpers';
// --- FIM DAS INTERFACES ---

import ScreenContainer from '@/components/layout/ScreenContainer';
import { useDevice } from '@/utils/responsive';
import CarouselBannerItem from '../../../components/client/explore/home/CarouselBannerItem';
// import CategoriaCard from '../../../components/client/explore/home/CategoriaCard';
import DEFENSE_SOS from '../../../components/client/explore/home/DEFENSE_SOS';
import NavBar from '../../../components/client/explore/home/NavBar';
import NewHeader from '../../../components/client/explore/home/NewHeader';
import PrestadorCard from '../../../components/client/explore/home/PrestadorCard';
import RecomendacaoCard from '../../../components/client/explore/home/RecomendacaoCard';
import SecaoPrestadores from '../../../components/client/explore/home/SecaoPrestadores';
import SecaoRecomendacoes from '../../../components/client/explore/home/SecaoRecomendacoes';
import { normalizeProviderList } from '../../../components/client/explore/home/providerAvailability';
import BottomSlideInCard from '../../../components/common/BottomSlideInCard';
import SmartCouponNudge from '../../../components/coupons/CouponNudge';
import { CouponPill } from '../../../components/coupons/CouponPill';
import { HtmlCouponCard } from '../../../components/coupons/HtmlCouponCard';
import { ReferralBanner } from '../../../components/referrals/ReferralBanner';
import { ReferralSheet } from '../../../components/referrals/ReferralSheet';
import { useTutorial } from '../../../hooks/useTutorial';

// Importar os novos componentes Nudge
import IncentiveNudge from '../../../components/nudges/IncentiveNudge';
import SecurityNudge from '../../../components/nudges/SecurityNudge';

// Fallback local: garante render do RecomendacaoCard mesmo se a API falhar
const FALLBACK_RECOMMENDATIONS: ProviderDisplayInfo[] = [


];

const FALLBACK_CATEGORIES: Service[] = [
  { id: 'residential-basic', name: 'Casa', icon: 'residencial.png' } as Service,
  { id: 'office-standard', name: 'Empresa', icon: 'comercial.png' } as Service,
  { id: 'after-build', name: 'Obras', icon: 'obra.png' } as Service,
  { id: 'windows', name: 'Vidros', icon: 'vidro.png' } as Service,
  { id: 'upholstery', name: 'Estofados', icon: 'estofados.png' } as Service,
  { id: 'office-clean', name: 'Escritório', icon: 'escritorio.png' } as Service,
];
const QA_PANEL_ENABLED = __DEV__ || process.env.EXPO_PUBLIC_ENABLE_QA_PANEL === 'true';
const toNum = (v: any) => (typeof v === 'number' && Number.isFinite(v) ? v : null);
const computeDistanceMeters = (
  baseLat?: number | null,
  baseLon?: number | null,
  targetLat?: number | null,
  targetLon?: number | null,
): number | null => {
  const lat1 = toNum(baseLat);
  const lon1 = toNum(baseLon);
  const lat2 = toNum(targetLat);
  const lon2 = toNum(targetLon);
  if (lat1 == null || lon1 == null || lat2 == null || lon2 == null) return null;
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const R = 6371000;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.sin(dLon / 2) * Math.sin(dLon / 2) * Math.cos(toRad(lat1)) * Math.cos(toRad(lat2));
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

const extractLocationHint = (profile?: UserProfile | null): CityStateHint => {
  const addr =
    profile?.clientDetails?.address ||
    profile?.providerDetails?.address ||
    profile?.address;

  const latitude =
    typeof addr?.latitude === 'number' && isFinite(addr.latitude) ? addr.latitude : undefined;
  const longitude =
    typeof addr?.longitude === 'number' && isFinite(addr.longitude) ? addr.longitude : undefined;

  return {
    city: normalizeLocationText(addr?.city),
    state: normalizeLocationText(addr?.state),
    latitude,
    longitude,
  };
};

const sortByDistanceStable = (items: ProviderDisplayInfo[]): ProviderDisplayInfo[] => {
  return (items || [])
    .map((it, idx) => ({
      it,
      idx,
      dist: Number.isFinite((it as any)?.distance) ? Number((it as any)?.distance) : Number.POSITIVE_INFINITY,
    }))
    .sort((a, b) => {
      if (a.dist !== b.dist) return a.dist - b.dist;
      return a.idx - b.idx;
    })
    .map(({ it }) => it);
};

const getNextAvailableTimestamp = (provider: ProviderDisplayInfo): number | null => {
  const nextCandidate = provider.nextSlot ?? provider.nextAvailable;
  const nextDate = getNextAvailableDate(nextCandidate as any);
  return nextDate ? nextDate.getTime() : null;
};

const sortByDistanceThenAvailabilityStable = (items: ProviderDisplayInfo[]): ProviderDisplayInfo[] => {
  return (items || [])
    .map((it, idx) => ({
      it,
      idx,
      nextTs: getNextAvailableTimestamp(it),
      dist: Number.isFinite((it as any)?.distance) ? Number((it as any)?.distance) : Number.POSITIVE_INFINITY,
    }))
    .sort((a, b) => {
      if (a.dist !== b.dist) return a.dist - b.dist;
      if (Number.isFinite(a.dist) && Number.isFinite(b.dist)) {
        if (a.nextTs != null && b.nextTs != null) {
          if (a.nextTs !== b.nextTs) return a.nextTs - b.nextTs;
        } else if (a.nextTs != null) {
          return -1;
        } else if (b.nextTs != null) {
          return 1;
        }
      }
      return a.idx - b.idx;
    })
    .map(({ it }) => it);
};


const COR_CINZA_FUNDO = '#FFFFFF';
const COR_BORDA_SUAVE = '#c0b5ca92';

const { width: screenWidth } = Dimensions.get('window');

type BannerDataItem = {
  id: string;
  title: string;
  discount: string;
  description: string;
  buttonText: string;
  badgeText: string;
  onPress: () => void;
};

const bannerData: BannerDataItem[] = [
  {
    id: '1',
    title: 'Obtenha Oferta Especial',
    discount: 'Até 40%',
    description: '',
    buttonText: 'Resgatar',
    badgeText: 'Tempo limitado!',
    onPress: () => {},
  },
  {
    id: '2',
    title: 'Outra Grande Oferta',
    discount: 'Economize Muito!',
    description: '',
    buttonText: 'Ver',
    badgeText: 'Exclusivo',
    onPress: () => {},
  },
  {
    id: '3',
    title: 'Última Chance!',
    discount: '75% de Desconto',
    description: 'Para Novos Clientes',
    buttonText: 'Cadastrar',
    badgeText: 'Corra!',
    onPress: () => {},
  },
];

const WELCOME_COUPON_DISMISSED_KEY = '@LimpeJa:WelcomeCouponDismissed';
const WELCOME_COUPON_REDEEMED_KEY = '@LimpeJa:WelcomeCouponRedeemed';
const REFERRAL_BANNER_DISMISSED_KEY = '@LimpeJa:ReferralBannerDismissed';
const PROTOCOL_PREMIUM_SEEN_KEY = '@LimpeJa:ProtocolPremiumSeen_v1';
export default function ExploreClientScreen() {
  const router = useRouter();
  const flatListRef = useRef<FlatList<BannerDataItem>>(null);
  const { t } = useTranslation();
  const { user, isAuthenticated, isLoading } = useAuth();
  const { isLargePhone } = useDevice();

  // Variável para compensar o ajuste do NewHeader para visitantes Android
  const isAndroidVisitor = Platform.OS === 'android' && !isAuthenticated;
  const visitorHowItWorksAdjustment =
    !isAuthenticated && (Platform.OS === 'android' || Platform.OS === 'ios')
      ? {
          marginTop: -15,
          marginBottom: -2,
          transform: [{ scale: 0.92 }, { translateX: 16 }],
        }
      : undefined;

  const navWrap: StyleProp<ViewStyle> = React.useMemo(
    () => (isLargePhone ? { alignSelf: 'center', width: '100%', maxWidth: 820 } : undefined),
    [isLargePhone]
  );
  const exploreTutorial = useTutorial('explore_first_time');
  const {
    isReady: exploreTutorialReady,
    hasSeen: exploreTutorialHasSeen,
    show: showExploreTutorial,
    isVisible: exploreTutorialVisible,
    markSeen: markExploreTutorialSeen,
  } = exploreTutorial;

  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [serviceCategories, setServiceCategories] = useState<Service[]>([]);
  const [recommendations, setRecommendations] = useState<ProviderDisplayInfo[]>([]);
  const [nearbyProviders, setNearbyProviders] = useState<ProviderDisplayInfo[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  // Novo estado para o raio de busca
  const [searchRadiusKm] = useState<number>(50); // Padrão 50 km (como no código original)
  const locationHint = useMemo(() => extractLocationHint(userProfile), [userProfile]);
  const locationHintRef = useRef<CityStateHint>(locationHint);
  const userCoordsRef = useRef<{ latitude: number; longitude: number } | null>(null);
  useEffect(() => {
    locationHintRef.current = locationHint;
  }, [locationHint]);

  const [welcomeCouponOffer, setWelcomeCouponOffer] = useState<Offer | null>(null);
  const [showPersistentCouponPill, setShowPersistentCouponPill] = useState(false);
  const [showReferralSheet, setShowReferralSheet] = useState(false);
  const [pendingReview, setPendingReview] = useState<{
    bookingId: string;
    providerId: string;
    providerName: string;
    providerAvatar?: string | null;
  } | null>(null);

  const [activeBottomPromotion, setActiveBottomPromotion] = useState<'coupon' | 'referral' | null>(null);
  const promotionTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const referralCode = userProfile?.referralCode || 'LIMPEJA123';
  const rewardReferrer = 'Ganhe R$20 ou +300 pts';
  const rewardReferred = 'Seu amigo ganha 20% na primeira reserva';
  const headerAnim = useRef(new Animated.Value(0)).current;
  const categoriesAnim = useRef(new Animated.Value(0)).current;
  // Banner deve aparecer junto ao conteúdo; inicia visível
  const bannerAnim = useRef(new Animated.Value(0)).current;
  const recommendationsAnim = useRef(new Animated.Value(0)).current;
  const providersAnim = useRef(new Animated.Value(0)).current;
  const navBarAnim = useRef(new Animated.Value(0)).current;
  const [reducedMotion, setReducedMotion] = useState(false);

  // Adicionado ref para verificar se o componente está montado
  const isMounted = useRef(true);

  // INTEGRAÇÃO DA LÓGICA DO NEWHEADER: Lógica completa para exibir o nome do usuário (priorizando user do auth e fallback para userProfile)
  const userNameDisplay =
    (user?.clientDetails?.fullName || user?.providerDetails?.fullName || user?.fullName) ??
    (userProfile?.clientDetails?.fullName || userProfile?.providerDetails?.fullName || userProfile?.fullName) ??
    '';

  const { showDialog: showAndroidDialog, dialogElement: androidDialogElement } = useAndroidDialog();

  const showProductsAlert = useCallback(() => {
    const title = 'Produtos de limpeza disponíveis?';
    const message =
      'Os produtos de limpeza que a diarista vai usar já estão separados e acessíveis no local?';
    if (Platform.OS === 'android') {
      showAndroidDialog({
        title,
        message,
        cancelLabel: 'Cancelar',
        confirmLabel: 'Aceitar',
        onConfirm: () => {},
      });
      return;
    }
    Alert.alert(
      title,
      message,
      [
        {
          text: 'Cancelar',
          style: 'cancel',
        },
        {
          text: 'Aceitar',
          style: 'default',
        },
      ]
    );
  }, [showAndroidDialog]);

  const renderCategoriesSection = () => (
    <Animated.View
      style={[
        styles.categoriesSection,
        {
          opacity: categoriesAnim,
          transform: [
            {
              translateY: categoriesAnim.interpolate({
                inputRange: [0, 1],
                outputRange: [-12, 0],
              }),
            },
          ],
        },
      ]}>
      <View style={styles.categoryTitleWrapper}>
        <Text style={styles.categorySectionTitle} allowFontScaling={false}>
          Acesso rápido
        </Text>
        <TouchableOpacity
          onPress={() => router.push('/client/explore/todas-categorias' as any)}
          style={styles.viewAllButton}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
          {/* <Ionicons name="add" size={16} color="#398beeff" style={styles.viewAllIcon} />*/}
        </TouchableOpacity>
      </View>
        {/* <SecaoContainer<Service>
        titulo={t('search.all_categories')}
        onVerTudoPress={() => router.push('/client/explore/todas-categorias' as any)}
        data={categoriesToRender}
        renderItem={({ item }) => {
          if (!item || !item.name) return null;
          return (
            <CategoriaCard item={{ id: item.id, name: item.name, icon: item.icon as any }} />
          );
        }}
        horizontal={true}
        noDataText={t('search.no_results')}
      /> */}
    </Animated.View>
  );

  useEffect(() => {
    let timeout: NodeJS.Timeout | null = null;

    (async () => {
      try {
        const seen = await AsyncStorage.getItem(PROTOCOL_PREMIUM_SEEN_KEY);
        if (isAuthenticated && !seen) {
          timeout = setTimeout(() => {
            showProductsAlert();
          }, 3000);
          await AsyncStorage.setItem(PROTOCOL_PREMIUM_SEEN_KEY, 'true');
        }
      } catch {
        // silencioso se falhar
      }
    })();

    return () => {
      if (timeout) {
        clearTimeout(timeout);
      }
    };
  }, [isAuthenticated, showProductsAlert]);

  useEffect(() => {
    if (!isAuthenticated && exploreTutorialReady && !exploreTutorialHasSeen) {
      showExploreTutorial();
    }
  }, [isAuthenticated, exploreTutorialReady, exploreTutorialHasSeen, showExploreTutorial]);

  const locationFetchStarted = useRef(false);
  const locationFetchDone = useRef(false);

  const loadLocationAndNearby = useCallback(async () => {
    if (locationFetchStarted.current || locationFetchDone.current) return; // evita loop de chamadas
    locationFetchStarted.current = true;
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      const hint = locationHintRef.current;
      const profileCoords =
        typeof hint.latitude === 'number' && typeof hint.longitude === 'number'
          ? { latitude: hint.latitude, longitude: hint.longitude }
          : null;
      let coords = null as null | { latitude: number; longitude: number };
      if (status === PermissionStatus.GRANTED) {
        coords = await getCurrentPosition();
      }
      const coordsToUse = coords || profileCoords;
      if (!coordsToUse) {
        // sem GPS e sem fallback de perfil: marca como concluído para não reentrar em loop
        locationFetchDone.current = true;
        return;
      }
      userCoordsRef.current = coordsToUse;
      if (!locationHintRef.current?.latitude || !locationHintRef.current?.longitude) {
        locationHintRef.current = { ...locationHintRef.current, ...coordsToUse };
      }

      const [nearbyRes, recommendedRes] = await Promise.allSettled([
        coordsToUse
          ? searchProvidersWithLocation({
              latitude: coordsToUse.latitude,
              longitude: coordsToUse.longitude,
              radius: searchRadiusKm,
            })
          : Promise.resolve([] as ProviderDisplayInfo[]),
        getRecommendedProviders(
          coordsToUse
            ? {
                latitude: coordsToUse.latitude,
                longitude: coordsToUse.longitude,
                radius: searchRadiusKm,
              }
            : {}
        ),
      ]);

        if (nearbyRes.status === 'fulfilled' && isMounted.current) {
          setNearbyProviders(normalizeProviderList(Array.isArray(nearbyRes.value) ? nearbyRes.value : []));
        }
        if (recommendedRes.status === 'fulfilled' && isMounted.current && recommendedRes.value.length) {
          setRecommendations(normalizeProviderList(recommendedRes.value));
      }
      locationFetchDone.current = true;
    } catch {
      // silencioso se falhar
    } finally {
      locationFetchDone.current = true; // evita reentrar em loop mesmo em caso de falha
      locationFetchStarted.current = false;
    }
  }, [searchRadiusKm]);
  const triggerLocationRefresh = useCallback(() => {
    locationFetchDone.current = false;
    loadLocationAndNearby();
  }, [loadLocationAndNearby]);



  const fetchData = useCallback(async () => {
  if (!isMounted.current) {
    return;
  }

  setLoading(true);
  setError(null);

  const hint = locationHintRef.current;

  const collectedErrors: string[] = [];
  let hasSuccessfulData = false;

  const runAndTrack = async <T,>(
    label: string,
    runner: () => Promise<T>,
    onSuccess: (value: T) => Promise<void> | void,
    fallbackMessage: string
  ) => {
    try {
      const result = await runner();
      if (!isMounted.current) {
        return;
      }
      await onSuccess(result);
      hasSuccessfulData = true;
    } catch {
      // Se falhar, aplica fallbacks locais para não quebrar o modo visitante
      if (label === 'pending review') {
        setPendingReview(null);
      }
        if (label === 'recommended providers') {
          setRecommendations(normalizeProviderList(FALLBACK_RECOMMENDATIONS));
        }
        if (label === 'nearby providers') {
          setNearbyProviders(normalizeProviderList(FALLBACK_RECOMMENDATIONS));
        }
      // log removido para performance
      collectedErrors.push(fallbackMessage);
    }
  };

  const tasks: Promise<any>[] = [];
  const primaryTasks: Promise<any>[] = [];

  if (isAuthenticated) {
    tasks.push(
      runAndTrack<BookingDetails[]>(
        'pending review',
        () => getBookingsForUser(BookingStatus.COMPLETED),
        async (bookings) => {
          const candidates = bookings.filter(
            (b) => !b.isReviewed && !b.reviewId && b.status === BookingStatus.COMPLETED,
          );

          for (const b of candidates) {
            try {
              const eligibility = await canReviewBooking(b.id);
              if (eligibility?.canReview) {
                setPendingReview({
                  bookingId: b.id,
                  providerId: eligibility.providerId || b.providerId,
                  providerName: eligibility.providerName || b.providerFullName || 'Prestador',
                  providerAvatar: eligibility.providerAvatar ?? b.providerAvatarUrl,
                });
                return;
              }
            } catch {
              // silencioso: n?o bloqueia a UI se um booking falhar
            }
          }

          setPendingReview(null);
        },
        'Erro ao verificar avalia??es pendentes',
      )
    );
  } else {
    setPendingReview(null);
  }


  tasks.push(
    runAndTrack<UserProfile>(
      'user profile',
      () => getUserProfile(),
      profile => {
        setUserProfile(profile);
      },
      'Erro ao carregar perfil'
    )
  );

  tasks.push(
    runAndTrack<Service[]>(
      'service categories',
      () => getServiceCategories(),
      data => setServiceCategories(data),
      'Erro ao carregar categorias'
    )
  );

  const recommendedTask = runAndTrack<ProviderDisplayInfo[]>(
    'recommended providers',
    async () => {
      try {
        const api = await getRecommendedProviders(
          hint.latitude != null && hint.longitude != null
            ? { latitude: hint.latitude, longitude: hint.longitude, radius: searchRadiusKm }
            : ({} as any)
        );
        return (() => {
          const list = Array.isArray(api) ? api : [];
          const seen = new Set<string>();

          const merged = [...list, ...FALLBACK_RECOMMENDATIONS].filter(p => {
            const id = p && typeof p.id === 'string' ? p.id : '';
            if (!id || seen.has(id)) return false;
            seen.add(id);
            return true;
          });

          const currentProviderId =
            (user as any)?.providerDetails?.id || (user as any)?.providerDetails?.providerId;
          const currentProviderEmail = user?.email;

          let idx = -1;
          if (currentProviderId || currentProviderEmail) {
            idx = merged.findIndex(p => {
              if (!p) return false;
              if (currentProviderId && p.id === currentProviderId) return true;
              if (currentProviderEmail && p.email === currentProviderEmail) return true;
              return false;
            });
          } else {
            idx = merged.findIndex(
              p => p && typeof p.fullName === 'string' && /joana/i.test(p.fullName)
            );
          }

          if (idx > 0) {
            const [first] = merged.splice(idx, 1);
            merged.unshift(first);
          }

          return merged;
        })();
      } catch {
        return FALLBACK_RECOMMENDATIONS;
      }
    },
    data => setRecommendations(normalizeProviderList(data)),
    'Erro ao carregar recomendacoes'
  );
  tasks.push(recommendedTask);
  primaryTasks.push(recommendedTask);

  await Promise.race([
    Promise.allSettled(primaryTasks),
    new Promise((resolve) => setTimeout(resolve, 1200)),
  ]);
  if (isMounted.current) {
    setLoading(false); // libera a tela assim que as recomendacoes chegam (ou apos timeout curto)
  }

  await Promise.allSettled(tasks);

  if (isMounted.current) { // Precarregar imagens do banner e do DEFENSE_SOS sem bloquear a primeira render
    InteractionManager.runAfterInteractions(() => {
      Asset.loadAsync([
        require('../../../assets/images/banner6.png'),
        require('../../../assets/images/banner4.png'),
        require('../../../assets/images/banner3.png'),
        Icons3D.support,
      ] as any).catch(() => { });
    });
    const D = 240; // duracao padrao
    const S = 60; // passo de atraso
    if (reducedMotion) {
      headerAnim.setValue(1);
      categoriesAnim.setValue(1);
      bannerAnim.setValue(1);
      recommendationsAnim.setValue(1);
      providersAnim.setValue(1);
      navBarAnim.setValue(1);
    } else {
      Animated.parallel([
        Animated.timing(headerAnim, { toValue: 1, duration: D, delay: 0, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
        Animated.timing(categoriesAnim, { toValue: 1, duration: D, delay: S, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
        Animated.timing(bannerAnim, { toValue: 1, duration: D, delay: S * 2, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
        Animated.timing(recommendationsAnim, { toValue: 1, duration: D, delay: S * 3, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
        Animated.timing(providersAnim, { toValue: 1, duration: D, delay: S * 4, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
        Animated.timing(navBarAnim, { toValue: 1, duration: D, delay: S * 5, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
      ]).start();
    }

    setLoading(false);
    setIsRefreshing(false);

    if (hasSuccessfulData) {
      setError(null);
    } else if (collectedErrors.length > 0) {
      setError(collectedErrors[0]);
      // log removido para performance
    } else {
      setError(t('common.network_error'));
    }
  }
}, [
  t,
  headerAnim,
  categoriesAnim,
  bannerAnim,
  recommendationsAnim,
  providersAnim,
  navBarAnim,
  searchRadiusKm,
  reducedMotion,
  user,
  isAuthenticated,
]);

  // Respeitar "reduzir movimento"
  useEffect(() => {
    let mounted = true;
    AccessibilityInfo.isReduceMotionEnabled?.().then((v: boolean) => {
      if (mounted) setReducedMotion(!!v);
    }).catch(() => { });
    const sub = (AccessibilityInfo as any).addEventListener?.('reduceMotionChanged', (v: boolean) => setReducedMotion(!!v));
    return () => { mounted = false; (sub && sub.remove?.()); };
  }, []);
  useEffect(() => {
    isMounted.current = true; // Componente montado
    fetchData();
    triggerLocationRefresh();
    return () => {
      isMounted.current = false; // Componente desmontado
    };
  }, [fetchData, triggerLocationRefresh]);
  // Refetch quando raio foi salvo no painel do provedor
  useFocusEffect(
    React.useCallback(() => {
      let cancelled = false;
      (async () => {
        try {
          const flag = await AsyncStorage.getItem('@settings:radius:changed');
          if (!cancelled && flag === '1') {
            await AsyncStorage.removeItem('@settings:radius:changed');
            fetchData();
              triggerLocationRefresh();
            }
          } catch { }
        })();
        return () => { cancelled = true; };
    }, [fetchData, triggerLocationRefresh])
  );

  const handleOpenPendingReview = useCallback(() => {
    if (!pendingReview) return;
    router.push({
      pathname: `/common/feedback/${pendingReview.bookingId}`,
      params: {
        providerId: pendingReview.providerId,
        providerName: pendingReview.providerName,
        providerAvatar: pendingReview.providerAvatar || undefined,
      },
    } as any);
  }, [pendingReview, router]);

  useFocusEffect(
    useCallback(() => {
      let cancelled = false;

      const loadAndSetPromotions = async () => {
        const offersData = await getOffers();
        if (cancelled) return;
      // log removido para performance
        const welcomeOffer = offersData.find(
          (offer: any) => offer.target === 'NEW_CLIENTS' && offer.firstBookingOnly
        );
        if (welcomeOffer) {
          if (isMounted.current) setWelcomeCouponOffer(welcomeOffer);
        } else {
          if (isMounted.current) {
            setWelcomeCouponOffer({
              id: 'fake-123',
              couponCode: 'BEMVINDO20',
              title: 'Ganhe 20%OFF !',
              description: 'Use agora e economize',
              target: 'NEW_CLIENTS',
              firstBookingOnly: true,
              validUntil: '2025-12-31T23:59:59.000Z',
            } as any);
          }
        }

        if (promotionTimeoutRef.current) {
          clearTimeout(promotionTimeoutRef.current);
        }

        promotionTimeoutRef.current = setTimeout(async () => {
          if (cancelled || !isMounted.current) return;

          let shouldShowCoupon = false;
          let shouldShowReferral = false;

          if (welcomeOffer && userProfile) {
            const dismissedCoupon = await AsyncStorage.getItem(WELCOME_COUPON_DISMISSED_KEY);
            const redeemedCoupon = await AsyncStorage.getItem(WELCOME_COUPON_REDEEMED_KEY);
            const isNewCustomer = (userProfile.clientDetails?.totalBookings || 0) === 0;
            const isCouponExpired =
              welcomeOffer.validUntil ? new Date(welcomeOffer.validUntil).getTime() < Date.now() : false;

            if (isNewCustomer && !redeemedCoupon && !isCouponExpired) {
              if (!dismissedCoupon) {
                shouldShowCoupon = true;
              } else {
                if (isMounted.current) setShowPersistentCouponPill(true);
              }
            }
          }

          if (isAuthenticated && userProfile?.referralCode) {
            const dismissedReferral = await AsyncStorage.getItem(REFERRAL_BANNER_DISMISSED_KEY);
            if (!dismissedReferral) {
              shouldShowReferral = true;
            }
          }

          if (isMounted.current) {
            if (shouldShowCoupon) {
              setActiveBottomPromotion('coupon');
            } else if (shouldShowReferral) {
              setActiveBottomPromotion('referral');
            } else {
              setActiveBottomPromotion(null);
            }
          }
        }, 5000) as unknown as NodeJS.Timeout;
      };

      if (userProfile !== null) {
        loadAndSetPromotions();
      }

      return () => {
        cancelled = true;
        if (promotionTimeoutRef.current) {
          clearTimeout(promotionTimeoutRef.current);
        }
      };
    }, [userProfile, isAuthenticated])
  );

  const handleProviderPress = useCallback(
    (provider: ProviderDisplayInfo) => {
      router.push({
        pathname: CLIENT_ROUTES.PROVIDER_DETAILS(provider.id),
        params: {
          providerId: provider.id,
          distance: provider.distance != null ? String(provider.distance) : undefined,
        },
      } as any);
    },
    [router]
  );

  const safeServiceCategories = serviceCategories.filter((c) => c && c.name);
  const categoriesToRender = safeServiceCategories.length > 0 ? safeServiceCategories : FALLBACK_CATEGORIES;

  // Filtrar nearbyProviders com base em serviços disponíveis
  const radiusMeters = searchRadiusKm * 1000;
  const filteredNearbyProviders = Array.isArray(nearbyProviders)
    ? nearbyProviders.filter((item) => {
      if (!item || !item.fullName) return false;
      return item.providerServices?.some((service) => {
        const price = getNumericPriceValue(service);
        return price > 0;
      });
    })
    : [];
  const nearbyWithComputedDistance = filteredNearbyProviders.map((item) => {
    if (!item || !userCoordsRef.current) return item;
    const currentDistance = Number(item.distance);
    if (Number.isFinite(currentDistance)) return item;
    const addr = item.address || (item as any).address || {};
    const targetLat = addr.latitude ?? addr.lat ?? addr.location?.lat ?? null;
    const targetLon = addr.longitude ?? addr.lng ?? addr.location?.lng ?? null;
    const computed = computeDistanceMeters(
      userCoordsRef.current.latitude,
      userCoordsRef.current.longitude,
      targetLat,
      targetLon
    );
    if (computed == null) return item;
    return { ...(item as any), distance: computed };
  });
  const nearbyWithinRadius = filterByRadiusOrCity(nearbyWithComputedDistance, radiusMeters, locationHintRef.current);
  const sortedNearbyProviders = sortByDistanceStable(nearbyWithinRadius);
  const activeNearbyProviders = sortedNearbyProviders.filter(
    (provider) =>
      provider?.verificationStatus === VerificationStatus.APPROVED,
  );

  const safeRecommendations = (() => {
    const distanceById = new Map<string, number | null | undefined>(
      activeNearbyProviders.map((p) => [p.id, (p as any)?.distance]),
    );
    const withDistance = (item: ProviderDisplayInfo): ProviderDisplayInfo => {
      if (item == null || typeof item !== 'object') return item;
      let dist = distanceById.get(item.id);
      // Fallback: se veio sem distance, calcula via coordenadas obtidas (GPS/permission) ou hint de perfil
      const baseLat = userCoordsRef.current?.latitude ?? locationHintRef.current?.latitude;
      const baseLon = userCoordsRef.current?.longitude ?? locationHintRef.current?.longitude;
      if ((dist == null || Number.isNaN(dist as any)) && baseLat != null && baseLon != null) {
        const addr = (item as any)?.address || {};
        const targetLat = addr.latitude ?? addr.lat ?? addr.location?.lat ?? null;
        const targetLon = addr.longitude ?? addr.lng ?? addr.location?.lng ?? null;
        const computed = computeDistanceMeters(baseLat, baseLon, targetLat, targetLon);
        if (computed != null) dist = computed;
      }
      if (dist == null || Number.isNaN(dist as any)) return item;
      if (item.distance === dist) return item;
      return { ...(item as any), distance: dist };
    };

    const valid = Array.isArray(recommendations)
      ? recommendations.filter(
          (item) =>
            item &&
            typeof item === 'object' &&
            typeof (item as any).id === 'string' &&
            (item as any).id.trim() !== '' &&
            typeof (item as any).fullName === 'string' &&
            (item as any).fullName.trim() !== '',
        )
        .filter(
          (item) =>
            (item as ProviderDisplayInfo)?.verificationStatus ===
            VerificationStatus.APPROVED,
        )
      : [];
    const hydratedRecs = valid.map(withDistance);
    // Nao filtramos recomendacoes por raio/cidade para nao cortar prestadores aprovados; nearby ja respeita raio.
    const filteredRecs = hydratedRecs;
    const mergedPool = [...filteredRecs, ...activeNearbyProviders];
    const mergedSorted = sortByDistanceThenAvailabilityStable(mergedPool);
    const deduped: ProviderDisplayInfo[] = [];
    const seen = new Set<string>();
    mergedSorted.forEach(it => {
      if (it?.id && !seen.has(it.id)) {
        seen.add(it.id);
        deduped.push(it);
      }
    });
    const mergedFallback = FALLBACK_RECOMMENDATIONS.filter(it => it && it.id && !seen.has(it.id));
    const combined = [...deduped, ...mergedFallback];
    return combined.length > 0 ? combined : FALLBACK_RECOMMENDATIONS;
  })();

  // Usa o mesmo pool unificado de recomendações (recs + nearby + fallback) para os PrestadorCards,
  // garantindo que a seção de prestadores exiba o mesmo universo de providers já deduplicado.
  const prestadoresData = safeRecommendations;

  const renderBannerItem = useCallback(({ item }: { item: BannerDataItem }) => {
    return (
      <CarouselBannerItem title={item.title} discount={item.discount} description={item.description} buttonText={item.buttonText} badgeText={item.badgeText} onPress={item.onPress} />
    );
  }, []);

  const onRefresh = useCallback(() => {
    setIsRefreshing(true);
    fetchData();
    triggerLocationRefresh();
  }, [fetchData, triggerLocationRefresh]);

  const handleUseWelcomeCoupon = useCallback(
    async (code: string) => {
      if (isMounted.current) {
        setActiveBottomPromotion(null);
        setShowPersistentCouponPill(false);
      }
      await AsyncStorage.setItem(WELCOME_COUPON_REDEEMED_KEY, 'true');
      router.push({
        pathname: CLIENT_ROUTES.SCHEDULE_SERVICE,
        params: { couponCode: code },
      } as any);
    },
    [router]
  );

  const handleDismissWelcomeCoupon = useCallback(async () => {
    if (isMounted.current) setActiveBottomPromotion(null);
    await AsyncStorage.setItem(WELCOME_COUPON_DISMISSED_KEY, 'true');
  }, []);

  const handleReopenWelcomeCoupon = useCallback(async () => {
    if (isMounted.current) {
      setShowPersistentCouponPill(false);
      setActiveBottomPromotion('coupon');
    }
  }, []);

  const handleDismissReferralBanner = useCallback(async () => {
    if (isMounted.current) setActiveBottomPromotion(null);
    await AsyncStorage.setItem(REFERRAL_BANNER_DISMISSED_KEY, 'true');
  }, []);

  const handleShareReferral = useCallback(async () => {
    try {
      const result = await Share.share({
        message: `Use meu código de indicação ${referralCode} no LimpeJá e ganhe um desconto na sua primeira reserva!`,
        url: 'https://limpeja.com/referral',
        title: 'Indique um amigo e ganhe no LimpeJá!',
      });
      if (result.action === Share.sharedAction) {
        if (result.activityType) {
        // log removido para performance
      } else {
        // log removido para performance
      }
    } else if (result.action === Share.dismissedAction) {
      // log removido para performance
    }
    } catch (error: any) {
      alertUserError(error, 'Erro ao Compartilhar');
    }
    if (isMounted.current) {
      setShowReferralSheet(false);
      setActiveBottomPromotion(null);
    }
  }, [referralCode]);

  const handleHowItWorksReferral = useCallback(() => {
    if (isMounted.current) {
      setShowReferralSheet(true);
      setActiveBottomPromotion(null);
    }
  }, []);

  if (loading && !isRefreshing) {
    return (
      <View style={styles.loadingContainer}>
        <Stack.Screen options={{ title: t('common.loading'), headerShown: false }} />
        <ActivityIndicator size="large" color={AppColors.primaryInteractive} />
        <Text style={{ marginTop: 10, color: AppColors.textBody }} allowFontScaling={false}>
          {t('common.loading')}
        </Text>
      </View>
    );
  }

  // Em caso de erro na primeira carga, não bloquear a home;
  // o usuário pode usar pull-to-refresh para tentar de novo.

  const rawAddress =
    userProfile?.clientDetails?.address ||
    userProfile?.providerDetails?.address ||
    userProfile?.address;

  // Usar o formatAddress helper
  const addressToDisplay = formatAddress(rawAddress);

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScreenContainer style={styles.screen}>
        <Stack.Screen
          options={{
            headerShown: false,
            headerRight: () => (
              <TouchableOpacity style={styles.shieldIconContainer}></TouchableOpacity>
            ),
          }}
        />

        {/* FlatList ÚNICO com TODO o conteúdo no ListHeaderComponent */}
        <FlatList
          data={[]} // Header-only: data vazia, mas header rola tudo
          renderItem={() => null} // FIX: Adicionado renderItem dummy para FlatList header-only (evita erro TS)
          keyExtractor={() => 'header-only'}
          ListHeaderComponent={(
            <>
              {/* NewHeader ÚNICO */}
              <Animated.View
                style={{
                  opacity: headerAnim,
                  transform: [
                    {
                      translateY:
                        Platform.OS === 'android'
                          ? 0
                          : headerAnim.interpolate({
                              inputRange: [0, 1],
                              outputRange: [-12, 0],
                            }),
                    },
                  ],
                }}>
                {/* Aplica o ajuste de margem inferior para visitantes Android */}
                <View style={[styles.androidHeaderLift, isAndroidVisitor && { marginBottom: 20 }]}>
                  <NewHeader
                    userName={userNameDisplay}
                    userAddress={addressToDisplay}
                    isVisitor={!isAuthenticated}
                  />
                </View>
              </Animated.View>
              {isAuthenticated && (
                <>
                  {/* Carrossel de Banners ÚNICO */}
                  <Animated.View
                    style={[
                      styles.carouselContainer,
                      {
                        opacity: bannerAnim,
                        transform: [{ translateY: 0 }],
                      },
                    ]}>
                    <FlatList<BannerDataItem>
                      ref={flatListRef}
                      data={bannerData}
                      renderItem={renderBannerItem}
                      keyExtractor={(item) => item.id}
                      horizontal
                      pagingEnabled
                      showsHorizontalScrollIndicator={false}
                      snapToInterval={screenWidth}
                      decelerationRate="fast"
                      contentContainerStyle={{ paddingRight: 20 }}
                      nestedScrollEnabled={true} // Melhora scroll aninhado no Android
                    />
                  </Animated.View>
                </>
              )}
              {/*QA_PANEL_ENABLED && (
                <TouchableOpacity
                  style={styles.devPanelBadge}
                  onPress={() => router.push('/dev-panel')}
                  accessibilityRole="button"
                  accessibilityLabel="Abrir painel QA"
                >
                  <Text style={styles.devPanelBadgeText}>Painel QA</Text>
                </TouchableOpacity>
              )}*/}

              {/* NOVO BLOCO CONDICIONAL: Acesso Rápido (Logado) OU Como Funciona (Visitante) */}
              {isAuthenticated ? (
                // Usuário LOGADO: Exibe ACESSO RÁPIDO
                Platform.OS !== 'android' && renderCategoriesSection()
              ) : (
                // Usuário VISITANTE: Exibe COMO FUNCIONA
                <View
                  style={[
                    styles.howItWorksTutorialContainer,
                    visitorHowItWorksAdjustment,
                    { width: '101%', left: -26, },
                  ]}>
                  <Text style={styles.howItWorksTitle} allowFontScaling={false}>
                    Como funciona o LimpeJá
                  </Text>
                  <View style={styles.howItWorksSteps}>
                    <View style={styles.howItWorksStep}>
                      <Image source={Icons3D.provider} style={styles.howItWorksIcon} />
                      <Text style={styles.howItWorksStepLabel} allowFontScaling={false}>
                        Escolha o profissional
                      </Text>
                    </View>
                    <View style={styles.howItWorksStep}>
                      <Image source={Icons3D.calendar} style={styles.howItWorksIcon} />
                      <Text style={styles.howItWorksStepLabel} allowFontScaling={false}>
                        Agende data e hora
                      </Text>
                    </View>
                    <View style={styles.howItWorksStep}>
                      <Image source={Icons3D.payments} style={styles.howItWorksIcon} />
                      <Text style={styles.howItWorksStepLabel} allowFontScaling={false}>
                        Pague via PIX
                      </Text>
                    </View>
                  </View>
  
                </View>
              )}
              {/* FIM NOVO BLOCO CONDICIONAL */}

              {/* ContentWrapper ÚNICO - TODO o conteúdo aqui */}
              <View style={styles.contentWrapper}>
                {error && (
                  <View style={styles.errorBanner}>
                    <Text style={styles.errorBannerTitle} allowFontScaling={false}>
                      {t('common.error', { defaultValue: 'Erro' })}
                    </Text>
                    <Text style={styles.errorBannerText} allowFontScaling={false}>
                      {error}
                    </Text>
                    <TouchableOpacity
                      style={styles.errorBannerCTA}
                      onPress={onRefresh}
                      accessibilityRole="button"
                      accessibilityLabel={t('common.retry', { defaultValue: 'Tentar novamente' })}
                    >
                      <Text style={styles.errorBannerCTAText} allowFontScaling={false}>
                        {t('common.retry', { defaultValue: 'Tentar novamente' })}
                      </Text>
                    </TouchableOpacity>
                  </View>
                )}
                {/* Recomendações ÚNICAS */}
                <Animated.View
                  style={{
                    opacity: recommendationsAnim,
                    transform: [
                      {
                        translateY:
                          Platform.OS === 'android'
                            ? 0
                            : recommendationsAnim.interpolate({
                                inputRange: [0, 1],
                                outputRange: [-12, 0],
                              }),
                      },
                    ],
                  }}>
                  <SecaoRecomendacoes
                    titulo={t('search.recommended_providers')}
                    onVerTudoPress={() => router.push('/client/explore/todos-recomendacoes' as any)}
                    data={safeRecommendations}
                    renderItem={({ item, index }) => {
                      if (!item || !item.id || typeof item.id !== 'string' || !item.fullName || typeof item.fullName !== 'string') {
                        // log removido para performance
                        return null;
                      }
                      return <RecomendacaoCard key={item.id} item={item} />;
                    }}
                    horizontal={true}
                    noDataText={t('search.no_results')}
                  />
                </Animated.View>

                {/* Profissionais por Perto ÚNICOS */}
                <Animated.View
                  style={{
                    opacity: providersAnim,
                    transform: [
                      {
                        translateY:
                          Platform.OS === 'android'
                            ? 0
                            : providersAnim.interpolate({
                                inputRange: [0, 1],
                                outputRange: [-12, 0],
                              }),
                      },
                    ],
                  }}>
                  <SecaoPrestadores
                    titulo={t('search.nearby_providers')}
                    onVerTudoPress={() => router.push('/client/explore/todos-prestadores-proximos' as any)}
                    data={prestadoresData}

                    renderItem={({ item, index }) => {
                      if (!item || !item.id || typeof item.id !== 'string' || !item.fullName || typeof item.fullName !== 'string') {
                        // log removido para performance
                        return null;
                      }
                      return (
                        <PrestadorCard key={item.id} item={item} onPress={() => handleProviderPress(item)} />
                      );
                    }}
                    horizontal={true}
                    noDataText={t('search.no_results')}
                  />

                </Animated.View>

                {isAuthenticated && Platform.OS === 'android' && renderCategoriesSection()}

                {!isAuthenticated && (
                  <Animated.View
                    style={[
                      styles.carouselContainer,
                      {
                        marginTop: 28,
                        opacity: bannerAnim,
                        transform: [
                          {
                            translateY:
                              Platform.OS === 'android'
                                ? 0
                                : bannerAnim.interpolate({
                                    inputRange: [0, 1],
                                    outputRange: [-12, 0],
                                  }),
                          },
                        ],
                      },
                    ]}>
                    <FlatList<BannerDataItem>
                      ref={flatListRef}
                      data={bannerData}
                      renderItem={renderBannerItem}
                      keyExtractor={(item) => item.id}
                      horizontal
                      pagingEnabled
                      showsHorizontalScrollIndicator={false}
                      snapToInterval={screenWidth}
                      decelerationRate="fast"
                      contentContainerStyle={{ paddingHorizontal: 10, paddingRight: 20 }}
                      nestedScrollEnabled={true} // Melhora scroll aninhado no Android
                    />
                  </Animated.View>
                )}

                {/* Spacer para scroll extra (compensa absolutos) */}
                <View style={{ height: 10 }} />
              </View>
            </>
          )}
          style={styles.scrollViewArea}
          contentContainerStyle={{
            paddingBottom: 10, // Padding alto para NavBar + Nudges + FABs
            flexGrow: 1
          }}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={isRefreshing}
              onRefresh={onRefresh}
              tintColor={AppColors.primaryInteractive}
              title={t('common.loading')}
              titleColor={AppColors.primaryInteractive}
            />
          }
          nestedScrollEnabled={true} // Para Android
          removeClippedSubviews={false} // Evita corte de animações
        />

        {/* NavBar ÚNICA */}
        <Animated.View
          style={[
            styles.navBarContainer,
            navWrap,
            {
              transform: [{ translateY: navBarAnim.interpolate({ inputRange: [0, 1], outputRange: [100, 0] }) }]
            },
          ]}
          pointerEvents="box-none"> {/* Não bloqueia scroll */}
          <NavBar welcomeCouponOffer={welcomeCouponOffer} activeBottomPromotion={activeBottomPromotion} setActiveBottomPromotion={setActiveBottomPromotion} />
        </Animated.View>

        {/* DEFENSE_SOS ÚNICO */}
        <DEFENSE_SOS bottomOffset={20} />

        {/* SmartCouponNudge */}
        {welcomeCouponOffer && (
          <SmartCouponNudge
            code={welcomeCouponOffer!.couponCode as string}
            title={welcomeCouponOffer!.title}
            subtitle={welcomeCouponOffer!.description}
            delayMs={3000}
            throttleHours={24}
            showOnRoutes={['/client/explore']}
            onApply={handleUseWelcomeCoupon}
            pointerEvents="box-none" // Não bloqueia scroll
          />
        )}

        {/* BottomSlideInCard para Cupom */}
        {welcomeCouponOffer && (
          <BottomSlideInCard isVisible={activeBottomPromotion === 'coupon'} pointerEvents="box-none">
            <HtmlCouponCard
              code={welcomeCouponOffer!.couponCode as string}
              title={welcomeCouponOffer!.title}
              subtitle={welcomeCouponOffer!.description}
              expiresAt={welcomeCouponOffer!.validUntil}
              onUseNow={handleUseWelcomeCoupon}
              onDismiss={handleDismissWelcomeCoupon}
              isVisible={activeBottomPromotion === 'coupon'}
            />
          </BottomSlideInCard>
        )}

        {/* BottomSlideInCard para Referral */}
        {isAuthenticated && userProfile?.referralCode && (
          <BottomSlideInCard isVisible={activeBottomPromotion === 'referral'} pointerEvents="box-none">
            <ReferralBanner code={referralCode} rewardReferrer={rewardReferrer} rewardReferred={rewardReferred} onShare={handleShareReferral} onHowItWorks={handleHowItWorksReferral} onDismiss={handleDismissReferralBanner} />
          </BottomSlideInCard>
        )}

        {/* CouponPill */}
        {showPersistentCouponPill && activeBottomPromotion !== 'coupon' && welcomeCouponOffer && (
          <CouponPill code={welcomeCouponOffer!.couponCode as string} onOpen={handleReopenWelcomeCoupon} />
        )}

        {/* ReferralSheet */}
        <ReferralSheet
          visible={showReferralSheet}
          onClose={() => setShowReferralSheet(false)}
          code={referralCode}
          rewardReferrer={rewardReferrer}
          rewardReferred={rewardReferred}
          onShare={handleShareReferral}
        />

        {/* Nudge de avaliação (somente se elegível via can-review) */}
        {pendingReview && (
          <TouchableOpacity
            activeOpacity={0.92}
            style={styles.reviewNudge}
            onPress={handleOpenPendingReview}
          >
            <View style={styles.reviewNudgeLeft}>
              {pendingReview.providerAvatar ? (
                <Image
                  source={{ uri: pendingReview.providerAvatar }}
                  style={styles.reviewNudgeAvatar}
                />
              ) : (
                <View style={[styles.reviewNudgeAvatar, styles.reviewNudgeAvatarFallback]}>
                  <Text style={styles.reviewNudgeAvatarFallbackText}>
                    {(pendingReview.providerName || 'P')[0]?.toUpperCase() ?? 'P'}
                  </Text>
                </View>
              )}
              <View style={{ flex: 1 }}>
                <Text style={styles.reviewNudgeTitle} numberOfLines={1} allowFontScaling={false}>
                  Avalie sua experiência
                </Text>
                <Text style={styles.reviewNudgeSubtitle} numberOfLines={2} allowFontScaling={false}>
                  Como foi o serviço com {pendingReview.providerName || 'o prestador'}?
                </Text>
              </View>
            </View>
            <View style={styles.reviewNudgeButton}>
              <Text style={styles.reviewNudgeButtonText}>Avaliar agora</Text>
            </View>
          </TouchableOpacity>
        )}

        {/* Nudges */}
        <SecurityNudge
          delayMs={3500}
          throttleHours={24}
          showOnRoutes={['/client/explore']}
          bottomOffset={120} // Offset para não sobrepor NavBar
          pointerEvents="box-none"
        />

        <IncentiveNudge
          delayMs={5000}
          throttleHours={24}
          showOnRoutes={['/client/explore']}
          bottomOffset={180} // Offset para empilhamento
          points={100}
          pointerEvents="box-none"
        />


        {androidDialogElement}


        
      </ScreenContainer>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F1F2F2',
  },
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    position: 'absolute',
    top: 0,
    bottom: 0,
    right: 0,
    left: 0,
  },
  centeredContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  couponWrapper: {
    width: '90%',
    maxWidth: 400,
    position: 'relative',
  },
  couponCardBackground: {
    height: 260,
    width: '100%',
    borderRadius: 15,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'space-between',
    position: 'relative',
    paddingTop: 20,
    paddingBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 0,
  },
  couponCardImageStyle: {
    borderRadius: 15,
  },
  closeButton: {
    position: 'absolute',
    top: 8,
    right: 19,
    zIndex: 2,
    padding: 4,
  },
  closeButtonText: {
    fontSize: 14,
    color: '#fff',
  },
  logo: {
    width: 85,
    height: 40,
    borderRadius: 8,
    marginBottom: 3,
    resizeMode: 'contain',
  },
  h3: {
    fontSize: 18,
    fontWeight: 'bold',
    lineHeight: 20,
    color: '#fff',
    textAlign: 'center',
    marginBottom: 8,
  },
  h3Subtitle: {
    fontSize: 13,
    fontWeight: 'normal',
    lineHeight: 18,
    color: '#fff',
  },
  couponRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 5,
  },
  cpnCode: {
    borderWidth: 1,
    borderColor: '#fff',
    paddingVertical: 3,
    paddingHorizontal: 4,
    borderTopLeftRadius: 5,
    borderBottomLeftRadius: 5,
    borderRightWidth: 0,
    color: '#3647dfff',
    backgroundColor: 'rgba(255,255,255,0.1)',
    fontSize: 10,
  },
  cpnBtn: {
    borderWidth: 1,
    borderColor: '#fff',
    backgroundColor: '#fff',
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderTopRightRadius: 5,
    borderBottomRightRadius: 5,
  },
  cpnBtnText: {
    color: '#5887feff',
    fontWeight: 'bold',
    fontSize: 10,
  },
  circle: {
    width: 35,
    height: 35,
    borderRadius: 17.5,
    position: 'absolute',
    top: '50%',
    transform: [{ translateY: -17.5 }],
  },
  circle1: { left: -17.5 },
  circle2: { right: -17.5 },
  useNowButton: {
    marginTop: 15,
    width: '50%',
    paddingVertical: 8,
  },
  expiresAtText: {
    fontSize: 11,
    color: '#174df0ff',
    fontWeight: 'bold',
    marginTop: 5,
  },
  screen: {
    flex: 1,
    backgroundColor: '#F1F2F2',
    marginHorizontal: 5,
    paddingTop: Platform.OS === 'android' ? 2 : undefined,
  },
  androidHeaderLift: {
    marginTop: Platform.OS === 'android' ? 0 : 0,
  },
  scrollViewArea: {
    flex: 1,
    zIndex: 1,
  },
  scrollContentContainer: {
    flexGrow: 1,
  },
  contentWrapper: {
    flexGrow: 1,
    backgroundColor: '#F1F2F2',
    paddingTop: 0,
    paddingBottom: 10,
    paddingHorizontal: 2,
  },
  devPanelBadge: {
    alignSelf: 'flex-end',
    borderWidth: 1,
    borderColor: AppColors.primaryInteractive,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: '#fff',
    marginVertical: 8,
  },
  devPanelBadgeText: {
    color: AppColors.primaryInteractive,
    fontWeight: '600',
    fontSize: 12,
  },
  searchComponentContainer: {
    marginHorizontal: 10,
    paddingBottom: 5,
    marginTop: -5,
  },
  categoriesSection: {
    marginTop: 2,
    marginBottom: 5,
    paddingHorizontal: 6,
  },
  categoryTitleWrapper: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 10,
    marginTop: 3,
    marginBottom: -3,
  },
  categorySectionTitle: {
    fontSize: 16.5,
    fontFamily: 'Montserrat-Regular',
    fontWeight: '600',
    // PREMIUM: Estilo de título alinhado
    color: 'rgba(44, 62, 80, 0.85)',
    letterSpacing: 0.5,
    marginBottom: 10,
    right: 200,
  },
  carouselContainer: {
    marginTop: 8,
    marginBottom: 18,
    alignItems: 'center',
    paddingHorizontal: 10,
    width: '100%',
  },
  navBarContainer: {
  position: 'absolute',
  bottom: Platform.OS === 'android' ? 2 : -30,
  left: 0,
  right: 0,
  zIndex: 200,
},
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COR_CINZA_FUNDO,
  },
  shieldIconContainer: {
    padding: 5,
    marginRight: Platform.OS === 'ios' ? 10 : 0,
  },
  miniGridHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 5,
    paddingHorizontal: 21,
    marginTop: 2,
  },
  // Espaçamento adicional para manter a seção "Explore mais serviços" um pouco abaixo do carrossel
  exploreMoreSpacing: {
    marginTop: 16,
  },
  miniGridTitle: {
    fontSize: 15,
    fontFamily: 'Montserrat-Regular',
    fontWeight: '800',
    // PREMIUM: Estilo de título alinhado
    color: 'rgba(44, 62, 80, 0.85)',
    letterSpacing: 0.5,
  },
  sectionSeparator: {
    borderBottomWidth: 1,
    borderBottomColor: COR_BORDA_SUAVE,
    marginVertical: 15,
    right: 21,
    marginHorizontal: 58,
  },
  miniGridBadge: {
    backgroundColor: 'transparent',
    borderRadius: 15,
    paddingHorizontal: 8,
    paddingVertical: 4,
    marginLeft: 10,
    flexDirection: 'row',
    alignItems: 'center',
  },
  miniGridBadgeText: {
    color: '#202633',
    fontSize: 8.4,
    fontWeight: 'bold',
    marginLeft: 3,
  },
  devFab: {
    position: 'absolute',
    right: 16,
    bottom: 160,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 18,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#DDE3EB',
    zIndex: 300,
    elevation: 0,
    
  },
  devFabText: {
    fontSize: 12,
    fontWeight: '800',
    color: AppColors.primaryInteractive,
  },
  couponFab: {
    backgroundColor: 'transparent',
    borderRadius: 25,
    width: 45,
    height: 45,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'absolute',
    top: 15,
    right: 75,
    zIndex: 250,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
      },
      android: {
        elevation: 0,
      },
    }),
  },
  ticketIcon: {
    width: 40,
    height: 40,
  },
  viewAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 4,
  },
  // Desloca levemente o ícone "+" para baixo (~3px)
  viewAllIcon: {
    transform: [{ translateY: 3 }],
  },
  viewAllText: {
    fontSize: 11,
    color: '#007BFF',
    fontFamily: 'Montserrat-Regular',
    fontWeight: '800',
    marginRight: 5,
  },
  radiusFilterContainer: {
    paddingHorizontal: 10,
    marginBottom: 15,
    marginTop: 10,
  },
  radiusFilterTitle: {
    fontSize: 14,
    fontFamily: 'Montserrat-Regular',
    fontWeight: '600',
    color: '#4f5a71c3',
    marginBottom: 8,
  },
  radiusChipsWrapper: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  radiusChip: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 20,
    backgroundColor: '#E6EEF9',
    borderWidth: 1,
    borderColor: '#D1D5DB',
    marginRight: 8,
    marginBottom: 8,
  },
  radiusChipActive: {
    backgroundColor: '#007BFF',
    borderColor: '#007BFF',
  },
  radiusText: {
    fontSize: 12,
    color: '#4f5a71ff',
    fontWeight: '500',
  },
  radiusTextActive: {
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
  errorBanner: {
    backgroundColor: '#FFE6E6',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#FFB0A0',
  },
  errorBannerTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#B22222',
  },
  errorBannerText: {
    marginTop: 6,
    fontSize: 13,
    color: AppColors.textBody,
  },
  errorBannerCTA: {
    marginTop: 10,
    alignSelf: 'flex-start',
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 12,
    backgroundColor: AppColors.primaryInteractive,
  },
  errorBannerCTAText: {
    color: AppColors.white,
    fontWeight: '700',
    fontSize: 13,
  },
  howItWorksTutorialContainer: {
    marginHorizontal: 11,
    marginBottom: Platform.OS === 'android' ? 18 : 12, // Este valor será sobrescrito condicionalmente
    paddingVertical: Platform.OS === 'android' ? 12 : 12,
    paddingHorizontal: 29,
    borderRadius: 18,
    backgroundColor: '#ffffffff',
    borderWidth: Platform.OS === 'android' ? 0 : 1,
    borderColor: COR_BORDA_SUAVE,
    
  },
  howItWorksTitle: {
    fontSize: Platform.OS === 'android' ? 14 : 16,
    fontFamily: 'Montserrat-Regular',
    fontWeight: Platform.OS === 'android' ? '300' : '700',
    color: AppColors.textTitle,
    marginBottom: 10,
  },
  howItWorksSteps: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  howItWorksStep: {
    flex: 1,
    alignItems: 'center',
    paddingHorizontal: 4,
  },
  howItWorksIcon: {
    width: 34,
    height: 34,
    marginBottom: 6,
    resizeMode: 'contain',
  },
  howItWorksStepLabel: {
    fontSize: 12,
    textAlign: 'center',
    color: AppColors.textBody,
  },
  reviewNudge: {
    marginHorizontal: 12,
    marginBottom: 16,
    padding: 14,
    borderRadius: 18,
    backgroundColor: '#0E2A47',
    borderWidth: 1,
    borderColor: '#1A3B63',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    
  },
  reviewNudgeLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 12,
  },
  reviewNudgeAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#123558',
    marginRight: 12,
  },
  reviewNudgeAvatarFallback: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  reviewNudgeAvatarFallbackText: {
    color: '#EAF2FF',
    fontSize: 18,
    fontWeight: '700',
  },
  reviewNudgeTitle: {
    color: '#EAF2FF',
    fontSize: 15,
    fontWeight: '800',
    marginBottom: 2,
  },
  reviewNudgeSubtitle: {
    color: '#C4D8F5',
    fontSize: 12,
    fontWeight: '500',
  },
  reviewNudgeButton: {
    backgroundColor: '#2D8CFF',
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 14,
  },
  reviewNudgeButtonText: {
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: 13,
  },
});
