import { Stack, useRouter } from 'expo-router';
import { Image } from 'react-native';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Animated,
  AccessibilityInfo,
  Easing,
  Dimensions,
  FlatList,
  ScrollView,
  InteractionManager,
  StyleSheet,
  StyleProp,
  ViewStyle,
  Text,
  TouchableOpacity,
  View,
  ViewToken,
  RefreshControl,
  Platform,
  Share,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { Ionicons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import { PermissionStatus } from 'expo-location';
import { getCurrentPosition } from '../../../services/locationService';
import { useFocusEffect } from '@react-navigation/native';
import Constants from 'expo-constants';
import { Icons3D } from '../../../constants/icons3d';
import { Asset } from 'expo-asset';
import AsyncStorage from '@react-native-async-storage/async-storage';

import {
  getOffers,
  getServiceCategories,
  getUserProfile,
  searchProvidersWithLocation,
} from '../../../services/clientService';
import { getBookingsForUser } from '../../../services/bookingService';
import { canReviewBooking } from '../../../services/reviewService';
import { useAuth } from '../../../hooks/useAuth';
import { useOverlayMessage } from '../../../hooks/useOverlayMessage';

import {
  getRecommendedProviders,
} from '../../../services/providerService';

import { Offer } from '../../../types/backend/offers';
import { ProviderDisplayInfo } from '../../../types/backend/providers';
import { Service, PricingType } from '../../../types/backend/services';
import { UserProfile } from '../../../types/backend/users';
import { BookingDetails, BookingStatus } from '../../../types/backend/bookings';

import { CLIENT_ROUTES } from '../../../constants/routes';
import { AppColors, AppDurations, AppOffsets, AppShadows, AppTypography, SCREEN_WIDTH } from '../../../constants/appStyles';
import * as Haptics from 'expo-haptics';

// Importar o formatAddress e getNumericPriceValue
import { formatAddress } from '../../../utils/formatters';
import { getNumericPriceValue } from '../../../utils/service-helpers';

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

// --- INTERFACES PARA COMPONENTES (DEFINIDAS AQUI PARA EXEMPLO) ---
interface CarouselBannerItemProps {
  title: string;
  discount: string;
  description: string;
  buttonText: string;
  badgeText: string;
  onPress: () => void;
}

interface SecaoContainerProps<T> {
  titulo: string;
  onVerTudoPress: () => void;
  data: T[];
  renderItem: ({ item, index }: { item: T; index: number }) => React.ReactElement | null;
  horizontal?: boolean;
  titleColor?: string;
  noDataText?: string;
}

interface CategoriaCardProps {
  item: { id: string; name: string; icon: any };
}
// --- FIM DAS INTERFACES ---

import CarouselBannerItem from '../../../components/client/explore/home/CarouselBannerItem';
import CategoriaCard from '../../../components/client/explore/home/CategoriaCard';
import NewHeader from '../../../components/client/explore/home/NewHeader';
import NavBar from '../../../components/client/explore/home/NavBar';
import PrestadorCard from '../../../components/client/explore/home/PrestadorCard';
import RecomendacaoCard from '../../../components/client/explore/home/RecomendacaoCard';
import SecaoContainer from '../../../components/client/explore/home/SecaoContainer';
import SecaoPrestadores from '../../../components/client/explore/home/SecaoPrestadores';
import SecaoRecomendacoes from '../../../components/client/explore/home/SecaoRecomendacoes';
import DEFENSE_SOS from '../../../components/client/explore/home/DEFENSE_SOS';
import { HtmlCouponCard } from '../../../components/coupons/HtmlCouponCard';
import { CouponPill } from '../../../components/coupons/CouponPill';
import { ReferralBanner } from '../../../components/referrals/ReferralBanner';
import { ReferralSheet } from '../../../components/referrals/ReferralSheet';
import BottomSlideInCard from '../../../components/common/BottomSlideInCard';
import SmartCouponNudge from '../../../components/coupons/CouponNudge';
import ScreenContainer from '@/components/layout/ScreenContainer';
import { useDevice } from '@/utils/responsive';
import TutorialOverlay from '../../../components/ui/TutorialOverlay';
import { useTutorial } from '../../../hooks/useTutorial';

// Importar os novos componentes Nudge
import SecurityNudge from '../../../components/nudges/SecurityNudge';
import IncentiveNudge from '../../../components/nudges/IncentiveNudge';

// Importar o novo componente SearchComponent
import SearchComponent from '../../../components/client/explore/home/SearchComponent';

const COR_AZUL_CLARO_UNIFICADA = '#A0D2EB';
const COR_PRIMARIA_ESCURA = '#2C3E50';
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
const EXPLORE_VISITOR_OVERLAY_SEEN_KEY = '@LimpeJa:ExploreVisitorOverlaySeen_dev';

export default function ExploreClientScreen() {
  const router = useRouter();
  const flatListRef = useRef<FlatList<BannerDataItem>>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const { t } = useTranslation();
  const { user, isAuthenticated, isLoading } = useAuth();
  const { showOverlay } = useOverlayMessage();
  const { isLargePhone } = useDevice();
  const navWrap: StyleProp<ViewStyle> = React.useMemo(
    () => (isLargePhone ? { alignSelf: 'center', width: '100%', maxWidth: 820 } : undefined),
    [isLargePhone]
  );
  const exploreTutorial = useTutorial('explore_first_time');

  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [serviceCategories, setServiceCategories] = useState<Service[]>([]);
  const [recommendations, setRecommendations] = useState<ProviderDisplayInfo[]>([]);
  const [nearbyProviders, setNearbyProviders] = useState<ProviderDisplayInfo[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  // Novo estado para o raio de busca
  const [searchRadiusKm, setSearchRadiusKm] = useState<number>(50); // Padrão 50 km (como no código original)
  // Novo estado para o filtro de preço
  const [priceFilter, setPriceFilter] = useState<PricingType | null>(null);

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
  const showVisitorQuickAccess = !isAuthenticated;

  const headerAnim = useRef(new Animated.Value(0)).current;
  const categoriesAnim = useRef(new Animated.Value(0)).current;
  // Banner deve aparecer junto ao conteúdo; inicia visível
  const bannerAnim = useRef(new Animated.Value(1)).current;
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

  const showProductsAlert = useCallback(() => {
    Alert.alert(
      'Produtos de limpeza disponíveis?',
      'Os produtos de limpeza que a diarista vai usar já estão separados e acessíveis no local?',
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
  }, []);

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
    if (!isAuthenticated && exploreTutorial.isReady && !exploreTutorial.hasSeen) {
      exploreTutorial.show();
    }
  }, [isAuthenticated, exploreTutorial.isReady, exploreTutorial.hasSeen, exploreTutorial.show]);

const loadLocationAndNearby = useCallback(async () => {
    try {
        // --- 1. LÓGICA DE PRIORIZAÇÃO DE LOCALIZAÇÃO ---
        let coords: Location.LocationObjectCoords | null = null;
        
        // Obtém o objeto de endereço do perfil (BookingAddress ou similar)
        const rawAddressObject = userProfile?.clientDetails?.address || userProfile?.providerDetails?.address || userProfile?.address;

        let rawAddressString: string | null = null;
        
        if (rawAddressObject) {
            // Converte o OBJETO de endereço em uma STRING formatada
            rawAddressString = formatAddress(rawAddressObject);
        }

        // Tenta obter coordenadas do endereço salvo no perfil (se existir)
        if (rawAddressString) {
            try {
                // Location.geocodeAsync agora recebe a STRING formatada
                const geoResults = await Location.geocodeAsync(rawAddressString);
                
                if (geoResults.length > 0) {
                    coords = { latitude: geoResults[0].latitude, longitude: geoResults[0].longitude, accuracy: 5, altitude: 0, altitudeAccuracy: 0, speed: 0, heading: 0 };
                }
            } catch (e) {
                // console.warn('Falha na geocodificação do endereço do perfil:', e);
            }
        }
        
        // Se ainda não tiver coordenadas, tenta obter do GPS do dispositivo
        if (!coords) {
            const { status } = await Location.requestForegroundPermissionsAsync();
            if (status === PermissionStatus.GRANTED) {
                const location = await Location.getCurrentPositionAsync({});
                coords = location.coords;
            } else {
                // console.log('Permissão de GPS negada e sem endereço de perfil.');
            }
        }
        
        if (!coords || !isMounted.current) return;
        
        // --- 2. CHAMADA À API COM AS COORDENADAS OBTIDAS ---
        // Tipagem explícita para resolver o erro 2493
        const [nearbyRes, recommendedRes] = await Promise.allSettled([
            searchProvidersWithLocation({
                latitude: coords.latitude,
                longitude: coords.longitude,
                radius: searchRadiusKm,
            }),
            getRecommendedProviders({
                latitude: coords.latitude,
                longitude: coords.longitude,
            }),
        ]) as [
            PromiseSettledResult<ProviderDisplayInfo[]>, 
            PromiseSettledResult<ProviderDisplayInfo[]>
        ];
        
        if (nearbyRes.status === 'fulfilled') {
            setNearbyProviders(nearbyRes.value);
        } else {
            setNearbyProviders(FALLBACK_RECOMMENDATIONS);
        }

        if (recommendedRes.status === 'fulfilled') {
            setRecommendations(recommendedRes.value);
        } else {
            setRecommendations(FALLBACK_RECOMMENDATIONS);
        }

    } catch (error) {
        // console.error('Error loading location and nearby providers:', error);
        // silencioso se falhar
    }
// LINHA 352 (AGORA CORRIGIDA):
}, [searchRadiusKm, userProfile]);



const fetchData = useCallback(async () => {
  if (!isMounted.current) {
    return;
  }

  setLoading(true);
  setError(null);

  const collectedErrors: string[] = [];
  let hasSuccessfulData = false;

  const runAndTrack = async <T,>(
    label: string,
    runner: () => Promise<T>,
    onSuccess: (value: T) => Promise<void> | void,
    fallbackMessage: string
  ) => {
// ... (lógica de runAndTrack permanece a mesma)
    try {
      const result = await runner();
      if (!isMounted.current) {
        return;
      }
      await onSuccess(result);
      hasSuccessfulData = true;
    } catch (err: any) {
      // Se falhar, aplica fallbacks locais para não quebrar o modo visitante
      if (label === 'pending review') {
        setPendingReview(null);
      }
      if (label === 'recommended providers') {
        setRecommendations(FALLBACK_RECOMMENDATIONS);
      }
      if (label === 'nearby providers') {
        setNearbyProviders(FALLBACK_RECOMMENDATIONS);
      }
      const message = err?.message || err?.response?.data?.message || t('common.network_error');
      // log removido para performance
      collectedErrors.push(fallbackMessage);
    }
  };

  const tasks: Promise<any>[] = [];

// ... (lógica de tasks para pending review, user profile, service categories e recommended providers permanece a mesma)

  if (isAuthenticated) {
    tasks.push(
// ... (tasks.push para pending review)
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
// ... (tasks.push para service categories)
  );

  tasks.push(
// ... (tasks.push para recommended providers)
  );

  await Promise.allSettled(tasks); // AGUARDA O userProfile SER SETADO

  if (isMounted.current) {
    
    // ⭐ NOVO: Chamada para carregar providers próximos *após* o perfil estar pronto.
    // Isso garante que loadLocationAndNearby use o userProfile mais atualizado.
    // Usamos InteractionManager para não atrasar a renderização inicial, mas garantir que o perfil foi lido.
    InteractionManager.runAfterInteractions(() => {
        if (isMounted.current) {
            loadLocationAndNearby(); 
        }
    });

    // Precarregar imagens do banner e do DEFENSE_SOS sem bloquear a primeira render
    InteractionManager.runAfterInteractions(() => {
      Asset.loadAsync([
        require('../../../assets/images/banner6.png'),
        require('../../../assets/images/banner4.png'),
        require('../../../assets/images/banner3.png'),
        Icons3D.support,
      ] as any).catch(() => { });
    });
    
    const D = 240; // duracao padrao
// ... (código de animações permanece o mesmo)
    const S = 60; // passo de atraso
    if (reducedMotion) {
      headerAnim.setValue(1);
// ...
    } else {
      Animated.parallel([
// ...
      ]).start();
    }

    setLoading(false);
    setIsRefreshing(false);

// ... (lógica de erro permanece a mesma)
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
  reducedMotion,
  user,
    // Adicione loadLocationAndNearby nas dependências do useCallback
    // para garantir que se a definição dela mudar, fetchData mude.
    loadLocationAndNearby 
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
    // loadLocationAndNearby(); // <-- REMOVA ESTA LINHA!
    return () => {
      isMounted.current = false; // Componente desmontado
    };
  }, [fetchData]);
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
            loadLocationAndNearby();
          }
        } catch { }
      })();
      return () => { cancelled = true; };
    }, [fetchData, loadLocationAndNearby])
  );

  const handleOpenPendingReview = useCallback(() => {
    if (!pendingReview) return;
    router.push({
      pathname: '/(common)/feedback/[targetId]',
      params: {
        targetId: pendingReview.bookingId,
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
    }, [userProfile, isAuthenticated, t])
  );

  // Overlay premium de boas-vindas para visitantes (sempre que for visitante)
  useFocusEffect(
    useCallback(() => {
      let cancelled = false;

      const maybeShowVisitorOverlay = async () => {
        if (isLoading || isAuthenticated) {
          return;
        }
        if (cancelled) return;

        showOverlay({
          title: 'Explore o LimpeJá com liberdade',
          subtitle:
            'Você pode conhecer profissionais e serviços antes de criar sua conta. O cadastro só é necessário na hora de agendar.',
          variant: 'info',
          placement: 'center',
          tone: 'soft',
          durationMs: 600000,
          imageSource: require('../../../assets/images/provider.png'),
          imageSize: 106,
          primaryActionLabel: 'OK, entendi',
          onPrimaryAction: showProductsAlert,
        });
      };

      maybeShowVisitorOverlay();

      return () => {
        cancelled = true;
      };
    }, [isAuthenticated, isLoading, showOverlay, showProductsAlert])
  );

  const handleCategoryPress = useCallback(
    (item: Service) => {
      router.push({
        pathname: CLIENT_ROUTES.SEARCH_RESULTS,
        params: { categoryId: item.id, categoryName: item.name },
      } as any);
    },
    [router]
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

  const prioritizeNewest = useCallback(
    <T extends { createdAt?: string | Date; updatedAt?: string | Date; providerServices?: any[] }>(items: T[]) => {
      const withIndex = items.map((item, idx) => ({ item, idx }));
      const getTime = (item: T) => {
        const candidates: Array<string | Date | undefined> = [
          item?.createdAt,
          item?.updatedAt,
          ...(Array.isArray(item?.providerServices)
            ? item.providerServices.map((svc: any) => svc?.createdAt)
            : []),
        ];
        const maxTs = candidates
          .map(v => (v ? new Date(v).getTime() : 0))
          .filter(t => Number.isFinite(t) && t > 0)
          .reduce((max, t) => (t > max ? t : max), 0);
        return maxTs;
      };
      return withIndex
        .sort((a, b) => {
          const timeA = getTime(a.item);
          const timeB = getTime(b.item);
          if (timeA !== timeB) return timeB - timeA; // newer first
          // If no timestamps, keep latest entries first based on original order
          return b.idx - a.idx;
        })
        .map(w => w.item);
    },
    []
  );

  const safeServiceCategories = serviceCategories.filter((c) => c && c.name);
  const categoriesToRender = safeServiceCategories.length > 0 ? safeServiceCategories : FALLBACK_CATEGORIES;

  // Filtrar nearbyProviders com base no priceFilter
  const filteredNearbyProviders = Array.isArray(nearbyProviders)
    ? nearbyProviders.filter((item) => {
      if (!item || !item.fullName) return false;
      if (!priceFilter) return true; // Sem filtro de preço, mostra todos

      // Verifica se o provedor tem algum serviço que corresponda ao tipo de preço
      return item.providerServices?.some((service) => {
        if (service.pricingType === priceFilter) {
          const price = getNumericPriceValue(service);
          return price > 0; // Apenas serviços com preço válido
        }
        return false;
      });
    })
    : [];
  const prioritizedNearbyProviders = prioritizeNewest(filteredNearbyProviders);

  const safeRecommendations = (() => {
    const valid = Array.isArray(recommendations)
      ? recommendations.filter((item) => item && typeof item.fullName === 'string')
      : [];
    const mergedPool = prioritizeNewest([...valid, ...prioritizedNearbyProviders]);
    const deduped: ProviderDisplayInfo[] = [];
    const seen = new Set<string>();
    mergedPool.forEach(it => {
      if (it?.id && !seen.has(it.id)) {
        seen.add(it.id);
        deduped.push(it);
      }
    });
    if (deduped.length === 0) return FALLBACK_RECOMMENDATIONS;
    const mergedFallback = FALLBACK_RECOMMENDATIONS.filter(it => it && it.id && !seen.has(it.id));
    return [...deduped, ...mergedFallback];
  })();

  const viewabilityConfig = useRef({
    itemVisiblePercentThreshold: 50,
  }).current;

  const onViewableItemsChanged = useCallback(({ viewableItems }: { viewableItems: ViewToken[] }) => {
    if (viewableItems.length > 0) {
      setCurrentIndex(viewableItems[0].index || 0);
    }
  }, []);

  const renderBannerItem = useCallback(({ item }: { item: BannerDataItem }) => {
    return (
      <CarouselBannerItem title={item.title} discount={item.discount} description={item.description} buttonText={item.buttonText} badgeText={item.badgeText} onPress={item.onPress} />
    );
  }, []);

  const onRefresh = useCallback(() => {
    setIsRefreshing(true);
    fetchData();
    loadLocationAndNearby();
  }, [fetchData, loadLocationAndNearby]);

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
      Alert.alert('Erro ao Compartilhar', error.message);
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
                <NewHeader
                  userName={userNameDisplay}
                  userAddress={addressToDisplay}
                  isVisitor={!isAuthenticated}
                />

              {/* NOVO BLOCO CONDICIONAL: Acesso Rápido (Logado) OU Como Funciona (Visitante) */}
              {isAuthenticated ? (
                // Usuário LOGADO: Exibe ACESSO RÁPIDO
                <Animated.View
                  style={[
                    styles.categoriesSection, // Reutilize o estilo do Acesso Rápido
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
                      onPress={() => router.push('/(client)/explore/todas-categorias' as any)}
                      style={styles.viewAllButton}
                      hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                      <Ionicons name="add" size={16} color="#398beeff" style={styles.viewAllIcon} />
                    </TouchableOpacity>
                  </View>
                  {/* SecaoContainer do Acesso Rápido (usado duas vezes no seu código original) */}
                  <SecaoContainer<Service>
                    titulo={t('search.all_categories')}
                    onVerTudoPress={() => router.push('/(client)/explore/todas-categorias' as any)}
                    data={categoriesToRender}
                    renderItem={({ item }) => {
                      if (!item || !item.name) return null;
                      return (
                        <CategoriaCard item={{ id: item.id, name: item.name, icon: item.icon as any }} />
                      );
                    }}
                    horizontal={true}
                    noDataText={t('search.no_results')}
                  />
                </Animated.View>
              ) : (
                
                <View style={styles.howItWorksTutorialContainer}>
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
                    onVerTudoPress={() => router.push('/(client)/explore/todos-recomendacoes' as any)}
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
                    onVerTudoPress={() => router.push('/(client)/explore/todos-prestadores-proximos' as any)}
                    data={prioritizedNearbyProviders}

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

                {/* Carrossel de Banners ÚNICO */}
                <Animated.View
                  style={[
                    styles.carouselContainer,
                    {
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
                    onViewableItemsChanged={onViewableItemsChanged}
                    viewabilityConfig={viewabilityConfig}
                    snapToInterval={screenWidth}
                    decelerationRate="fast"
                    contentContainerStyle={{ paddingHorizontal: 10, paddingRight: 20 }}
                    nestedScrollEnabled={true} // Melhora scroll aninhado no Android
                  />
                </Animated.View>

                {/* REMOVER OS DOIS BLOCOS DE ACESSO RÁPIDO DO FINAL DO contentWrapper */}
                {/* Os blocos de "Acesso rápido" para visitante e logado foram movidos para a lógica condicional acima e removidos daqui. */}

                {/* Spacer para scroll extra (compensa absolutos) */}
                <View style={{ height: 20 }} />
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
            showOnRoutes={['/(client)/explore']}
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
          showOnRoutes={['/(client)/explore']}
          bottomOffset={120} // Offset para não sobrepor NavBar
          pointerEvents="box-none"
        />

        <IncentiveNudge
          delayMs={5000}
          throttleHours={24}
          showOnRoutes={['/(client)/explore']}
          bottomOffset={180} // Offset para empilhamento
          points={100}
          pointerEvents="box-none"
        />


        <TutorialOverlay
          visible={exploreTutorial.isVisible}
          title="Explore à vontade"
          subtitle="Navegue pelos profissionais disponíveis e use as categorias para filtrar sua busca."
          iconName="compass-outline"
          onConfirm={exploreTutorial.markSeen}
        />
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
    elevation: 12,
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
    paddingBottom: 20,
    paddingHorizontal: 2,
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
  },
  carouselContainer: {
    marginTop: 10,
    marginBottom: 35,
    alignItems: 'center',
  },
  navBarContainer: {
    position: 'absolute',
    bottom: -30, // AJUSTADO: De -28 para 0
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
    elevation: 6,
    ...AppShadows.small,
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
        elevation: 5,
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
  priceFilterContainer: {
    paddingHorizontal: 10,
    marginBottom: 15,
    marginTop: 10,
  },
  priceFilterOptions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  howItWorksTutorialContainer: {
    marginHorizontal: 11,
    marginBottom: 12,
    paddingVertical: 12,
    paddingHorizontal: 29,
    borderRadius: 18,
    backgroundColor: '#ffffffff',
    borderWidth: 1,
    borderColor: COR_BORDA_SUAVE,
    ...AppShadows.small,
  },
  howItWorksTitle: {
    fontSize: 16,
    fontFamily: 'Montserrat-Regular',
    fontWeight: '700',
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
    ...AppShadows.small,
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