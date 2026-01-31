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
import { useTranslation } from 'react-i18next';
import type { TFunction } from 'i18next';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Icons3D } from '../../../constants/icons3d';
import { useAndroidDialog } from '../../../hooks/useAndroidDialog';
import { useAuth } from '../../../hooks/useAuth';
import { useLocationBasedProviders } from '../../../hooks/useLocationBasedProviders';
import { getBookingsForUser } from '../../../services/bookingService';
import {
    getServiceCategories,
    getUserProfile,
    searchProvidersWithLocation,
} from '../../../services/clientService';
import {
    getRecommendedProviders,
} from '../../../services/providerService';
import { api } from '../../../services/api';

import { BookingDetails, BookingStatus } from '../../../types/backend/bookings';
import { ProviderDisplayInfo, ProviderVisibilityStatus } from '../../../types/backend/providers';
import { VerificationStatus } from '../../../types/backend/auth';
import { Service } from '../../../types/backend/services';
import { UserProfile } from '../../../types/backend/users';

import { AppColors } from '../../../constants/appStyles';
import { CLIENT_ROUTES } from '../../../constants/routes';
import type { CityStateHint } from '../../../utils/locationFilter';
import { filterByRadiusOrCity, normalizeLocationText } from '../../../utils/locationFilter';

// Importar o formatAddress e getNumericPriceValue
import { formatAddress, getNextAvailableDate } from '../../../utils/formatters';
import { getNumericPriceValue } from '../../../utils/service-helpers';
// --- FIM DAS INTERFACES ---

import ScreenContainer from '@/components/layout/ScreenContainer';
import { FALLBACK_CATEGORIES, FALLBACK_RECOMMENDATIONS } from '@app/client/explore/data/homeFallbacks';
import { ExploreFetchResult, useExploreData } from '@app/client/explore/hooks/useExploreData';
import debounce from 'lodash/debounce';
import { useDevice } from '@/utils/responsive';
import CarouselBannerItem from '../../../components/client/explore/home/CarouselBannerItem';
import CategoriaCard from '../../../components/client/explore/home/CategoriaCard';
import DEFENSE_SOS from '../../../components/client/explore/home/DEFENSE_SOS';
import NavBar from '../../../components/client/explore/home/NavBar';
import NewHeader from '../../../components/client/explore/home/NewHeader';
import PrestadorCard from '../../../components/client/explore/home/PrestadorCard';
import RecomendacaoCard from '../../../components/client/explore/home/RecomendacaoCard';
import SecaoPrestadores from '../../../components/client/explore/home/SecaoPrestadores';
import SecaoRecomendacoes from '../../../components/client/explore/home/SecaoRecomendacoes';
import SecaoContainer from '../../../components/client/explore/home/SecaoContainer';
import { normalizeProviderList } from '../../../components/client/explore/home/providerAvailability';
import { useTutorial } from '../../../hooks/useTutorial';
import PostBookingReview from '../../../components/PostBookingReview';

const PROTOCOL_PREMIUM_SEEN_KEY = 'protocol_premium_seen';
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

// Adicione esta função auxiliar para calcular distância entre duas coordenadas
const calculateDistanceMeters = (lat1: number, lon1: number, lat2: number, lon2: number) => {
  const R = 6371e3; // Raio da terra em metros
  const φ1 = (lat1 * Math.PI) / 180;
  const φ2 = (lat2 * Math.PI) / 180;
  const Δφ = ((lat2 - lat1) * Math.PI) / 180;
  const Δλ = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c; // Retorna em metros
};


const COR_CINZA_FUNDO = '#FFFFFF';
const COR_BORDA_SUAVE = '#c0b5ca92';

const { width: screenWidth } = Dimensions.get('window');
const BANNER_WIDTH = Math.max(0, screenWidth - 24);

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

type ProviderWithKey = ProviderDisplayInfo & { key: string };
type CategoryWithKey = Service & { key: string };

const MemoizedSecaoRecomendacoes = React.memo(SecaoRecomendacoes);
const MemoizedSecaoPrestadores = React.memo(SecaoPrestadores);
const MemoizedCategoriaCard = React.memo(CategoriaCard);
const MemoizedRecomendacaoCard = React.memo(RecomendacaoCard);
const MemoizedPrestadorCard = React.memo(PrestadorCard);

export default function ExploreClientScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const primaryBanner = bannerData[0];
  const { user, isAuthenticated } = useAuth();
  const { isLargePhone } = useDevice();

  // Variável para compensar o ajuste do NewHeader para visitantes Android
  const isAndroidVisitor = Platform.OS === 'android' && !isAuthenticated;
  const navWrap: StyleProp<ViewStyle> = React.useMemo(
    () => (isLargePhone ? { alignSelf: 'center', width: '100%', maxWidth: 820 } : undefined),
    [isLargePhone]
  );
  const exploreTutorial = useTutorial('explore_first_time');
  const {
    isReady: exploreTutorialReady,
    hasSeen: exploreTutorialHasSeen,
    show: showExploreTutorial,
  } = exploreTutorial;

  const [pendingReview, setPendingReview] = useState<{
    bookingId: string;
    providerId: string;
    providerName: string;
    providerAvatar?: string | null;
  } | null>(null);
  // Novo estado para o raio de busca
  const [searchRadiusKm] = useState<number>(50); // Padrão 50 km (como no código original)
  const locationHintRef = useRef<CityStateHint>(extractLocationHint(null));

  useFocusEffect(
    useCallback(() => {
      let isActive = true;

      const fetchPendingReview = async () => {
        try {
          const response = await api.get('/bookings/pending-review');
          if (!isActive) return;
          const data = response?.data;
          if (!data || data.isReviewed) {
            setPendingReview(null);
            return;
          }
          setPendingReview({
            bookingId: data.id,
            providerId: data.provider?.id || data.providerId,
            providerName:
              data.provider?.fullName || data.providerFullName || 'Prestador',
            providerAvatar: data.provider?.avatarUrl || data.providerAvatarUrl || null,
          });
        } catch (err) {
          if (!isActive) return;
          setPendingReview(null);
          console.log('Nenhuma avaliação pendente.');
        }
      };

      if (isAuthenticated) {
        fetchPendingReview();
      } else {
        setPendingReview(null);
      }

      return () => {
        isActive = false;
      };
    }, [isAuthenticated])
  );

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

  const {
    userProfile,
    serviceCategories,
    recommendations,
    loading,
    error,
    refreshing: isRefreshing,
    fetchData,
  } = useExploreData({
    isMountedRef: isMounted,
    locationHintRef,
    searchRadiusKm,
    user,
    networkErrorMessage: t('common.network_error'),
  });

  const locationHint = useMemo(() => extractLocationHint(userProfile), [userProfile]);
  useEffect(() => {
    locationHintRef.current = locationHint;
  }, [locationHint]);

  const {
    providers: locationProviders,
    location: locationCoords,
    isLoading: isLocationLoading,
    error: locationError,
    refresh: refreshLocationProviders,
  } = useLocationBasedProviders({
    radiusKm: searchRadiusKm,
    fallbackLocation: locationHint,
  });

  useEffect(() => {
    if (locationCoords) {
      locationHintRef.current = {
        ...locationHintRef.current,
        latitude: locationCoords.latitude,
        longitude: locationCoords.longitude,
      };
    }
  }, [locationCoords]);

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

  const triggerLocationRefresh = useCallback(() => {
    refreshLocationProviders();
  }, [refreshLocationProviders]);

  const handleDataLoaded = useCallback(
    (_result: ExploreFetchResult) => {
      if (!isMounted.current) {
        return;
      }

      InteractionManager.runAfterInteractions(() => {
        Asset.loadAsync([
          require('../../../assets/images/banner6.png'),
          require('../../../assets/images/banner4.png'),
          require('../../../assets/images/banner3.png'),
          Icons3D.support,
        ] as any).catch(() => {});
      });

      const D = 240;
      const S = 60;
      if (reducedMotion) {
        headerAnim.setValue(1);
        categoriesAnim.setValue(1);
        bannerAnim.setValue(1);
        recommendationsAnim.setValue(1);
        providersAnim.setValue(1);
        navBarAnim.setValue(1);
        return;
      }

      Animated.parallel([
        Animated.timing(headerAnim, {
          toValue: 1,
          duration: D,
          delay: 0,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.timing(categoriesAnim, {
          toValue: 1,
          duration: D,
          delay: S,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.timing(bannerAnim, {
          toValue: 1,
          duration: D,
          delay: S * 2,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.timing(recommendationsAnim, {
          toValue: 1,
          duration: D,
          delay: S * 3,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.timing(providersAnim, {
          toValue: 1,
          duration: D,
          delay: S * 4,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.timing(navBarAnim, {
          toValue: 1,
          duration: D,
          delay: S * 5,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
      ]).start();
    },
    [
      bannerAnim,
      categoriesAnim,
      headerAnim,
      isMounted,
      navBarAnim,
      providersAnim,
      reducedMotion,
      recommendationsAnim,
    ]
  );



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
    fetchData()
      .then(handleDataLoaded)
      .catch(() => {});
    triggerLocationRefresh();
    return () => {
      isMounted.current = false; // Componente desmontado
    };
  }, [fetchData, handleDataLoaded, triggerLocationRefresh]);
  // Refetch quando raio foi salvo no painel do provedor
  useFocusEffect(
    React.useCallback(() => {
      let cancelled = false;
      (async () => {
        try {
          const flag = await AsyncStorage.getItem('@settings:radius:changed');
          if (!cancelled && flag === '1') {
            await AsyncStorage.removeItem('@settings:radius:changed');
            fetchData()
              .then((result) => {
                if (!cancelled) {
                  handleDataLoaded(result);
                }
              })
              .catch(() => {});
            triggerLocationRefresh();
          }
        } catch {
          // ignore
        }
      })();
      return () => {
        cancelled = true;
      };
    }, [fetchData, handleDataLoaded, triggerLocationRefresh])
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

  const handleViewAllCategories = useCallback(() => {
    router.push('/client/explore/todas-categorias' as any);
  }, [router]);

  const safeServiceCategories = useMemo(
    () => serviceCategories.filter((c: Service) => c && c.name),
    [serviceCategories]
  );
  const categoriesToRender = useMemo(
    () =>
      safeServiceCategories.length > 0 ? safeServiceCategories : FALLBACK_CATEGORIES,
    [safeServiceCategories]
  );
  const processedCategories = useMemo<CategoryWithKey[]>(
    () =>
      categoriesToRender.map((cat, idx) => ({
        ...cat,
        key: cat.id ?? `category-${idx}`,
      })),
    [categoriesToRender]
  );

  const radiusMeters = searchRadiusKm * 1000;
  const normalizedNearbyProviders = Array.isArray(locationProviders)
    ? normalizeProviderList(locationProviders)
    : [];
  const filteredNearbyProviders = normalizedNearbyProviders.filter((item) => {
    if (!item || !item.fullName) return false;
    return item.providerServices?.some((service) => {
      const price = getNumericPriceValue(service);
      return price > 0;
    });
  });
  const nearbyWithinRadius = filterByRadiusOrCity(
    filteredNearbyProviders,
    radiusMeters,
    locationHintRef.current,
  );
  const sortedNearbyProviders = sortByDistanceStable(nearbyWithinRadius);
  const activeNearbyProviders = sortedNearbyProviders.filter(
    (provider) =>
      provider?.verificationStatus === VerificationStatus.APPROVED &&
      provider?.visibilityStatus === ProviderVisibilityStatus.VISIBLE,
  );

  const safeRecommendations = useMemo(() => {
    // 1. Pega as recomendações brutas
    const rawRecommendations = Array.isArray(recommendations) ? recommendations : [];
    
    // 2. Define a localização de referência (Prioridade: GPS em tempo real > Endereço do Perfil)
    const currentLoc = locationCoords || locationHint;
    const userLat = currentLoc?.latitude;
    const userLon = currentLoc?.longitude;

    const valid = rawRecommendations
      .filter(
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
          (item as ProviderDisplayInfo)?.verificationStatus === VerificationStatus.APPROVED &&
          (item as ProviderDisplayInfo)?.visibilityStatus === ProviderVisibilityStatus.VISIBLE,
      )
      // --- AQUI ESTÁ A MÁGICA QUE FALTAVA ---
      .map((item) => {
        // Se a API já mandou a distância, usa ela
        if (typeof (item as any).distance === 'number') return item;

        // Se não mandou, vamos tentar calcular manualmente
        const provLat = (item as any).address?.latitude || (item as any).latitude;
        const provLon = (item as any).address?.longitude || (item as any).longitude;

        // Só calcula se tivermos a localização do User E do Prestador
        if (userLat && userLon && provLat && provLon) {
          const distMeters = calculateDistanceMeters(userLat, userLon, provLat, provLon);
          // Retorna o item com a distância injetada
          return { ...item, distance: distMeters };
        }
        
        return item;
      });

    // 3. Junta com os próximos (que já têm distância garantida pelo hook useLocationBasedProviders)
    const mergedPool = [...valid, ...activeNearbyProviders];
    const mergedSorted = sortByDistanceThenAvailabilityStable(mergedPool);
    
    const deduped: ProviderDisplayInfo[] = [];
    const seen = new Set<string>();
    
    mergedSorted.forEach((it) => {
      if (it?.id && !seen.has(it.id)) {
        seen.add(it.id);
        deduped.push(it);
      }
    });

    const mergedFallback = FALLBACK_RECOMMENDATIONS.filter(
      (it) => it && it.id && !seen.has(it.id),
    );
    
    const combined = [...deduped, ...mergedFallback];
    return combined.length > 0 ? combined : FALLBACK_RECOMMENDATIONS;
  }, [recommendations, activeNearbyProviders, locationHint, locationCoords]);

  const processedRecommendations = useMemo<ProviderWithKey[]>(
    () =>
      safeRecommendations.map((item, idx) => ({
        ...item,
        key: item.id ?? `provider-${idx}-${item.fullName ?? 'provider'}`,
      })),
    [safeRecommendations]
  );

  const prestadoresData = processedRecommendations;

  useEffect(() => {
    const startTime = Date.now();
    return () => {
      const renderTime = Date.now() - startTime;
      if (renderTime > 100) {
        console.warn(`ExploreScreen render took ${renderTime}ms`);
      }
    };
  }, [loading, processedRecommendations.length, processedCategories.length]);

  const keyExtractor = useCallback(
    (item: ProviderWithKey, index: number) =>
      item?.id ? `item-${item.id}` : `item-${index}`,
    []
  );

  const debouncedRefresh = useMemo(
    () =>
      debounce(() => {
        fetchData({ isRefresh: true })
          .then(handleDataLoaded)
          .catch(() => {});
      }, 1000),
    [fetchData, handleDataLoaded]
  );

  useEffect(() => {
    return () => {
      debouncedRefresh.cancel();
    };
  }, [debouncedRefresh]);

  const onRefresh = useCallback(() => {
    debouncedRefresh();
    triggerLocationRefresh();
  }, [debouncedRefresh, triggerLocationRefresh]);

  const globalError = error ?? locationError;

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
          keyExtractor={keyExtractor}
          ListHeaderComponent={
            <ListHeader
              headerAnim={headerAnim}
              categoriesAnim={categoriesAnim}
              bannerAnim={bannerAnim}
              recommendationsAnim={recommendationsAnim}
              providersAnim={providersAnim}
              isAuthenticated={isAuthenticated}
              isAndroidVisitor={isAndroidVisitor}
              primaryBanner={primaryBanner}
              processedCategories={processedCategories}
              processedRecommendations={processedRecommendations}
              prestadoresData={prestadoresData}
              handleProviderPress={handleProviderPress}
              handleViewAllCategories={handleViewAllCategories}
              globalError={globalError}
              onRefresh={onRefresh}
              t={t}
              router={router}
              userName={userNameDisplay}
              addressToDisplay={addressToDisplay}
            />
          }
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
          removeClippedSubviews={Platform.OS === 'android'} // Evita corte de animações em Android
          initialNumToRender={1}
          maxToRenderPerBatch={5}
          windowSize={5}
          updateCellsBatchingPeriod={50}
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
          <NavBar />
        </Animated.View>

        {/* DEFENSE_SOS ÚNICO */}
        <DEFENSE_SOS bottomOffset={20} />

        {pendingReview && (
          <PostBookingReview
            visible
            bookingId={pendingReview.bookingId}
            providerName={pendingReview.providerName}
            providerAvatar={pendingReview.providerAvatar}
            navigation={{ goBack: () => router.back() } as any}
            onClose={() => setPendingReview(null)}
          />
        )}

        {/* Nudge de avaliação (somente se elegível via can-review) */}
        {androidDialogElement}


        
      </ScreenContainer>
    </SafeAreaView>
  );
}

type ListHeaderProps = {
  headerAnim: Animated.Value;
  categoriesAnim: Animated.Value;
  bannerAnim: Animated.Value;
  recommendationsAnim: Animated.Value;
  providersAnim: Animated.Value;
  isAuthenticated: boolean;
  isAndroidVisitor: boolean;
  primaryBanner?: BannerDataItem;
  processedCategories: CategoryWithKey[];
  processedRecommendations: ProviderWithKey[];
  prestadoresData: ProviderWithKey[];
  handleProviderPress: (provider: ProviderDisplayInfo) => void;
  handleViewAllCategories: () => void;
  globalError: string | null;
  onRefresh: () => void;
  t: TFunction;
  router: ReturnType<typeof useRouter>;
  userName: string;
  addressToDisplay: string;
};

const ListHeader = React.memo<ListHeaderProps>(
  ({
    headerAnim,
    categoriesAnim,
    bannerAnim,
    recommendationsAnim,
    providersAnim,
    isAuthenticated,
    isAndroidVisitor,
    primaryBanner,
    processedCategories,
    processedRecommendations,
    prestadoresData,
    handleProviderPress,
    handleViewAllCategories,
    globalError,
    onRefresh,
    t,
    router,
    userName,
    addressToDisplay,
  }) => (
    <>
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
        <View style={[styles.androidHeaderLift, isAndroidVisitor && { marginBottom: 20 }]}>
          <NewHeader userName={userName} userAddress={addressToDisplay} isVisitor={!isAuthenticated} />
        </View>
      </Animated.View>

      <Animated.View
        style={[
          styles.categoriesSection,
          !isAuthenticated && styles.visitorCategoriesSectionSpacing,
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
          <Text style={styles.categorySectionTitle}>Dia a dia</Text>
          <TouchableOpacity
            onPress={handleViewAllCategories}
            style={styles.viewAllButton}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
            {/* <Ionicons name="add" size={16} color="#398beeff" style={styles.viewAllIcon} />*/}
          </TouchableOpacity>
        </View>
        <SecaoContainer<Service>
          titulo={t('search.all_categories')}
          onVerTudoPress={handleViewAllCategories}
          data={processedCategories}
          renderItem={({ item }) => {
            if (!item || !item.name) return null;
            return <MemoizedCategoriaCard item={{ id: item.id, name: item.name, icon: item.icon as any }} />;
          }}
          horizontal={true}
          noDataText={t('search.no_results')}
        />
      </Animated.View>

      <View style={styles.contentWrapper}>
        {globalError && (
          <View style={styles.errorBanner}>
            <Text style={styles.errorBannerTitle} allowFontScaling={false}>
              {t('common.error', { defaultValue: 'Erro' })}
            </Text>
            <Text style={styles.errorBannerText} allowFontScaling={false}>
              {globalError}
            </Text>
            <TouchableOpacity
              style={styles.errorBannerCTA}
              onPress={onRefresh}
              accessibilityRole="button"
              accessibilityLabel={t('common.retry', { defaultValue: 'Tentar novamente' })}>
              <Text style={styles.errorBannerCTAText} allowFontScaling={false}>
                {t('common.retry', { defaultValue: 'Tentar novamente' })}
              </Text>
            </TouchableOpacity>
          </View>
        )}

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
          <MemoizedSecaoRecomendacoes
            titulo={t('search.recommended_providers')}
            onVerTudoPress={() => router.push('/client/explore/todos-recomendacoes' as any)}
            data={processedRecommendations}
            renderItem={({ item }) => {
              if (!item || !item.id || typeof item.id !== 'string' || !item.fullName || typeof item.fullName !== 'string') {
                return null;
              }
              return <MemoizedRecomendacaoCard key={item.id} item={item} />;
            }}
            horizontal={true}
            titleColor="rgba(95, 118, 141, 0.7)"
            noDataText={t('search.no_results')}
          />
        </Animated.View>

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
          <MemoizedSecaoPrestadores
            titulo={t('search.nearby_providers')}
            onVerTudoPress={() => router.push('/client/explore/todos-prestadores-proximos' as any)}
            data={prestadoresData}
            renderItem={({ item }) => {
              if (!item || !item.id || typeof item.id !== 'string' || !item.fullName || typeof item.fullName !== 'string') {
                return null;
              }
              return <MemoizedPrestadorCard key={item.id} item={item} onPress={() => handleProviderPress(item)} />;
            }}
            horizontal={true}
            noDataText={t('search.no_results')}
          />
        </Animated.View>

        {!isAuthenticated && primaryBanner && (
          <Animated.View style={[styles.carouselContainer, { opacity: bannerAnim, marginTop: 18 }]}>
            <CarouselBannerItem
              title={primaryBanner.title}
              discount={primaryBanner.discount}
              description={primaryBanner.description}
              buttonText={primaryBanner.buttonText}
              badgeText={primaryBanner.badgeText}
              onPress={primaryBanner.onPress}
            />
          </Animated.View>
        )}

        <View style={{ height: 10 }} />
      </View>
    </>
  )
);

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
    paddingBottom: 62,
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
    marginBottom: -15,
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
  visitorCategoriesSectionSpacing: {
    marginTop: -12,
  },
  categorySectionTitle: {
    fontSize: Platform.OS === 'android' ? 15 : 15.5,
    fontFamily: 'Montserrat-Regular',
    fontWeight: '600',
    color: 'rgba(95, 118, 141, 0.7)',
    letterSpacing: 0.5,
    marginBottom: 8,
    left: 5,
  },
  carouselContainer: {
    marginTop: 8,
    marginBottom: 18,
    alignItems: 'center',
    width: BANNER_WIDTH,
    alignSelf: 'center',
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
    marginBottom: Platform.OS === 'android' ? 18 : 12,
    paddingVertical: Platform.OS === 'android' ? 12 : 12,
    paddingHorizontal: 26,
    borderRadius: 18,
    backgroundColor: '#ffffffff',
    borderWidth: Platform.OS === 'android' ? 0 : 1,
    borderColor: COR_BORDA_SUAVE,
    width: '80%',
    alignSelf: 'center',
    
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
    fontSize: 11,
    textAlign: 'center',
    color: AppColors.textBody,
    fontFamily: 'Montserrat-Regular', // ✅ AGORA O ANDROID VAI ACHAR
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
