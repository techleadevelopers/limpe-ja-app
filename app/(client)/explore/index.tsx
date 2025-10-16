import { Stack, useRouter } from 'expo-router';
import { Image } from 'react-native';

import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Animated,
  Dimensions,
  FlatList,
  ScrollView,
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
  SafeAreaView
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { Ionicons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import { PermissionStatus } from 'expo-modules-core';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from '@react-navigation/native';
import Constants from 'expo-constants';
import { Icons3D } from '../../../constants/icons3d';

import {
  getOffers,
  getServiceCategories,
  getUserProfile,
  searchProvidersWithLocation,
} from '../../../services/clientService';
import { useAuth } from '../../../hooks/useAuth';

import {
  getRecommendedProviders,
} from '../../../services/providerService';

import { Offer } from '../../../types/backend/offers';
import { ProviderDisplayInfo } from '../../../types/backend/providers';
import { Service, PricingType } from '../../../types/backend/services';
import { UserProfile } from '../../../types/backend/users';
import HorizontalMiniGrid from '../../../components/client/explore/home/HorizontalMiniGrid';

import { CLIENT_ROUTES } from '../../../constants/routes';
import { AppColors, AppDurations, AppOffsets, AppShadows, AppTypography, SCREEN_WIDTH } from '../../../constants/appStyles';

// Importar o formatAddress e getNumericPriceValue
import { formatAddress } from '../../../utils/formatters';
import { getNumericPriceValue } from '../../../utils/service-helpers';

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
    onPress: () => console.log('Banner 1 Pressionado'),
  },
  {
    id: '2',
    title: 'Outra Grande Oferta',
    discount: 'Economize Muito!',
    description: '',
    buttonText: 'Ver',
    badgeText: 'Exclusivo',
    onPress: () => console.log('Banner 2 Pressionado'),
  },
  {
    id: '3',
    title: 'Ultima Chance!',
    discount: '75% de Desconto',
    description: 'Para Novos Clientes',
    buttonText: 'Cadastrar',
    badgeText: 'Corra!',
    onPress: () => console.log('Banner 3 Pressionado'),
  },
];

const WELCOME_COUPON_DISMISSED_KEY = '@LimpeJa:WelcomeCouponDismissed';
const WELCOME_COUPON_REDEEMED_KEY = '@LimpeJa:WelcomeCouponRedeemed';
const REFERRAL_BANNER_DISMISSED_KEY = '@LimpeJa:ReferralBannerDismissed';

export default function ExploreClientScreen() {
  const router = useRouter();
  const flatListRef = useRef<FlatList<BannerDataItem>>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const { t } = useTranslation();
  const { user, isAuthenticated } = useAuth();
  const { isLargePhone } = useDevice();
  const navWrap: StyleProp<ViewStyle> = React.useMemo(
    () => (isLargePhone ? { alignSelf: 'center', width: '100%', maxWidth: 820 } : undefined),
    [isLargePhone]
  );

  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [serviceCategories, setServiceCategories] = useState<Service[]>([]);
  const [recommendations, setRecommendations] = useState<ProviderDisplayInfo[]>([]);
  const [nearbyProviders, setNearbyProviders] = useState<ProviderDisplayInfo[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  // Novo estado para o raio de busca
  const [searchRadiusKm, setSearchRadiusKm] = useState<number>(50); // Padr�o 50 km (como no c�digo original)
  // Novo estado para o filtro de pre�o
  const [priceFilter, setPriceFilter] = useState<PricingType | null>(null);

  const [welcomeCouponOffer, setWelcomeCouponOffer] = useState<Offer | null>(null);
  const [showPersistentCouponPill, setShowPersistentCouponPill] = useState(false);
  const [showReferralSheet, setShowReferralSheet] = useState(false);

  const [activeBottomPromotion, setActiveBottomPromotion] = useState<'coupon' | 'referral' | null>(null);
  const promotionTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const referralCode = userProfile?.referralCode || 'LIMPEJA123';
  const rewardReferrer = 'Ganhe R$20 ou +300 pts';
  const rewardReferred = 'Seu amigo ganha 20% na 1�';

  const headerAnim = useRef(new Animated.Value(0)).current;
  const categoriesAnim = useRef(new Animated.Value(0)).current;
  const bannerAnim = useRef(new Animated.Value(0)).current;
  const recommendationsAnim = useRef(new Animated.Value(0)).current;
  const providersAnim = useRef(new Animated.Value(0)).current;
  const navBarAnim = useRef(new Animated.Value(0)).current;

  // Adicionado ref para verificar se o componente est� montado
  const isMounted = useRef(true);

  // INTEGRA��O DA L�GICA DO NEWHEADER: L�gica completa para exibir o nome do usu�rio (priorizando user do auth e fallback para userProfile)
  const userNameDisplay = (user?.clientDetails?.fullName || user?.providerDetails?.fullName || user?.fullName) ?? 
                          (userProfile?.clientDetails?.fullName || userProfile?.providerDetails?.fullName || userProfile?.fullName) ?? 
                          t('common.user');

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
      onSuccess: (value: T) => void,
      fallbackMessage: string
    ) => {
      try {
        const result = await runner();
        if (!isMounted.current) {
          return;
        }
        onSuccess(result);
        hasSuccessfulData = true;
      } catch (err: any) {
        const message = err?.message || err?.response?.data?.message || t('common.network_error');
        console.warn(`[ExploreClientScreen] ${label} failed:`, message);
        collectedErrors.push(fallbackMessage);
      }
    };

    await runAndTrack<UserProfile>(
      'user profile',
      () => getUserProfile(),
      profile => {
        console.log('[ExploreClientScreen] User profile loaded:', profile);
        setUserProfile(profile);
      },
      'Erro ao carregar perfil'
    );

    await runAndTrack<Service[]>(
      'service categories',
      () => getServiceCategories(),
      data => setServiceCategories(data),
      'Erro ao carregar categorias'
    );

    await runAndTrack<ProviderDisplayInfo[]>(
      'recommended providers',
      () => getRecommendedProviders(),
      data => setRecommendations(data),
      'Erro ao carregar recomenda��es'
    );

    let locationCoords: Location.LocationObjectCoords | null = null;
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== PermissionStatus.GRANTED) {
        Alert.alert(
          t('safety.panic.location_permission_denied'),
          t('safety.panic.location_permission_message')
        );
      } else {
        const currentLocation = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High });
        locationCoords = currentLocation.coords;
        console.log('[ExploreClientScreen] Location obtained:', locationCoords);
      }
    } catch (locError) {
      console.error('[ExploreClientScreen] Error fetching location:', locError);
    }

    if (locationCoords) {
      await runAndTrack<ProviderDisplayInfo[]>(
        'nearby providers',
        () =>
          searchProvidersWithLocation({
            latitude: locationCoords!.latitude,
            longitude: locationCoords!.longitude,
            radius: searchRadiusKm * 1000,
          }),
        data => setNearbyProviders(data),
        'Erro ao carregar provedores pr�ximos'
      );
    }

    if (isMounted.current) {
      Animated.sequence([
        Animated.spring(headerAnim, { toValue: 1, damping: 10, stiffness: 100, useNativeDriver: true }),
        Animated.delay(50),
        Animated.spring(categoriesAnim, { toValue: 1, damping: 10, stiffness: 100, useNativeDriver: true }),
        Animated.delay(50),
        Animated.spring(bannerAnim, { toValue: 1, damping: 10, stiffness: 100, useNativeDriver: true }),
        Animated.delay(50),
        Animated.spring(recommendationsAnim, { toValue: 1, damping: 10, stiffness: 100, useNativeDriver: true }),
        Animated.delay(50),
        Animated.spring(providersAnim, { toValue: 1, damping: 10, stiffness: 100, useNativeDriver: true }),
        Animated.delay(50),
        Animated.spring(navBarAnim, { toValue: 1, damping: 10, stiffness: 100, useNativeDriver: true }),
      ]).start();

      setLoading(false);
      setIsRefreshing(false);

      if (hasSuccessfulData) {
        setError(null);
      } else if (collectedErrors.length > 0) {
        setError(collectedErrors[0]);
        console.warn('[ExploreClientScreen] erro silencioso na home:', collectedErrors[0]);
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
  ]);
  useEffect(() => {
    isMounted.current = true; // Componente montado
    fetchData();
    return () => {
      isMounted.current = false; // Componente desmontado
    };
  }, [fetchData]);

  useFocusEffect(
    useCallback(() => {
      let cancelled = false;

      const loadAndSetPromotions = async () => {
        const offersData = await getOffers();
        if (cancelled) return;
        console.log('DEBUG | offersData:', offersData);
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
      router.push(CLIENT_ROUTES.PROVIDER_DETAILS(provider.id));
    },
    [router]
  );

  const safeServiceCategories = serviceCategories.filter((c) => c && c.name);
  const safeRecommendations = Array.isArray(recommendations)
    ? recommendations.filter((item) => item && typeof item.fullName === 'string')
    : [];

  // Filtrar nearbyProviders com base no priceFilter
  const filteredNearbyProviders = Array.isArray(nearbyProviders)
    ? nearbyProviders.filter((item) => {
        if (!item || !item.fullName) return false;
        if (!priceFilter) return true; // Sem filtro de pre�o, mostra todos

        // Verifica se o provedor tem algum servi�o que corresponda ao tipo de pre�o
        return item.providerServices?.some((service) => {
          if (service.pricingType === priceFilter) {
            const price = getNumericPriceValue(service);
            return price > 0; // Apenas servi�os com pre�o v�lido
          }
          return false;
        });
      })
    : [];

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
      <CarouselBannerItem
        title={item.title}
        discount={item.discount}
        description={item.description}
        buttonText={item.buttonText}
        badgeText={item.badgeText}
        onPress={item.onPress}
      />
    );
  }, []);

  const onRefresh = useCallback(() => {
    setIsRefreshing(true);
    fetchData();
  }, [fetchData]);

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
        message: `Use meu c�digo de indica��o ${referralCode} no LimpeJ� e ganhe um desconto na sua primeira reserva!`,
        url: 'https://limpeja.com/referral',
        title: 'Indique um amigo e ganhe no LimpeJ�!',
      });
      if (result.action === Share.sharedAction) {
        if (result.activityType) {
          console.log(`Compartilhado via ${result.activityType}`);
        } else {
          console.log('Compartilhado');
        }
      } else if (result.action === Share.dismissedAction) {
        console.log('Compartilhamento cancelado');
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

  console.log('DEBUG | welcomeCouponOffer:', welcomeCouponOffer);

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

  // Em caso de erro na primeira carga, n�o bloquear a home;
  // o usu�rio pode usar pull-to-refresh para tentar de novo.

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

        {/* FlatList �NICO com TODO o conte�do no ListHeaderComponent */}
        <FlatList
          data={[]} // Header-only: data vazia, mas header rola tudo
          renderItem={() => null} // ? FIX: Adicionado renderItem dummy para FlatList header-only (evita erro TS)
          keyExtractor={() => 'header-only'}
          ListHeaderComponent={(
            <>
              {/* NewHeader �NICO */}
              <NewHeader
                userName={userNameDisplay}
                userAddress={addressToDisplay}
              />

              {/* ContentWrapper �NICO - TODO o conte�do aqui */}
              <View style={styles.contentWrapper}>
                {/* Se��o de Categorias */}
                <Animated.View
                  style={[
                    styles.categoriesSection,
                    { 
                      opacity: categoriesAnim, 
                      transform: [{ translateY: categoriesAnim.interpolate({ inputRange: [0, 1], outputRange: [-20, 0] }) }] 
                    },
                  ]}>
                  <View style={styles.categoryTitleWrapper}>
                    <Text style={styles.categorySectionTitle} allowFontScaling={false}>
                      {t('search.all_categories')}
                    </Text>
                    <TouchableOpacity
                      onPress={() => router.push('/(client)/explore/todas-categorias' as any)}
                      style={styles.viewAllButton}
                      hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                      <Ionicons name="add" size={16} color="#398beeff" />
                    </TouchableOpacity>
                  </View>
                  <SecaoContainer<Service>
                    titulo={t('search.all_categories')}
                    onVerTudoPress={() => router.push('/(client)/explore/todas-categorias' as any)}
                    data={safeServiceCategories}
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

                {/* Carrossel de Banners �NICO */}
                <Animated.View
                  style={[
                    styles.carouselContainer,
                    { 
                      opacity: bannerAnim, 
                      transform: [{ translateY: bannerAnim.interpolate({ inputRange: [0, 1], outputRange: [-20, 0] }) }] 
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

                {/* Recomenda��es �NICAS */}
                <Animated.View
                  style={{
                    opacity: recommendationsAnim,
                    transform: [{ translateY: recommendationsAnim.interpolate({ inputRange: [0, 1], outputRange: [-20, 0] }) }],
                  }}>
                  <SecaoRecomendacoes
                    titulo={t('search.recommended_providers')}
                    onVerTudoPress={() => router.push('/(client)/explore/todos-recomendacoes' as any)}
                    data={safeRecommendations}
                    renderItem={({ item, index }) => {
                      if (!item || !item.id || typeof item.id !== 'string' || !item.fullName || typeof item.fullName !== 'string') {
                        console.warn('[ExploreClientScreen] Item de recomenda��o inv�lido filtrado:', item);
                        return null;
                      }
                      return <RecomendacaoCard key={item.id} item={item} />;
                    }}
                    horizontal={true}
                    noDataText={t('search.no_results')}
                  />
                </Animated.View>

                {/* Profissionais por Perto �NICOS */}
                <Animated.View
                  style={{
                    opacity: providersAnim,
                    transform: [{ translateY: providersAnim.interpolate({ inputRange: [0, 1], outputRange: [-20, 0] }) }],
                  }}>
                  <SecaoPrestadores
                    titulo={t('search.nearby_providers')}
                    onVerTudoPress={() => router.push('/(client)/explore/todos-prestadores-proximos' as any)}
                    data={filteredNearbyProviders}
                    renderItem={({ item, index }) => {
                      if (!item || !item.id || typeof item.id !== 'string' || !item.fullName || typeof item.fullName !== 'string') {
                        console.warn('[ExploreClientScreen] Item de prestador inv�lido filtrado:', item);
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

                {/* HorizontalMiniGrid �NICO */}
                <Animated.View
                  style={{
                    opacity: providersAnim,
                    transform: [{ translateY: providersAnim.interpolate({ inputRange: [0, 1], outputRange: [-20, 0] }) }],
                  }}>
                  <View style={styles.miniGridHeader}>
                    <Text style={styles.miniGridTitle} allowFontScaling={false}>
                      {t('explore_section.title')}
                    </Text>
                  </View>
                  <HorizontalMiniGrid />
                </Animated.View>

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
          removeClippedSubviews={false} // Evita corte de anima��es
        />

        {/* NavBar �NICA */}
        <Animated.View
          style={[
            styles.navBarContainer,
            navWrap,
            { 
              transform: [{ translateY: navBarAnim.interpolate({ inputRange: [0, 1], outputRange: [100, 0] }) }] 
            },
          ]}
          pointerEvents="box-none"> {/* N�o bloqueia scroll */}
          <NavBar
            welcomeCouponOffer={welcomeCouponOffer}
            activeBottomPromotion={activeBottomPromotion}
            setActiveBottomPromotion={setActiveBottomPromotion}
          />
        </Animated.View>

        {/* DEFENSE_SOS �NICO */}
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
            pointerEvents="box-none" // N�o bloqueia scroll
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
            <ReferralBanner
              code={referralCode}
              rewardReferrer={rewardReferrer}
              rewardReferred={rewardReferred}
              onShare={handleShareReferral}
              onHowItWorks={handleHowItWorksReferral}
              onDismiss={handleDismissReferralBanner}
            />
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

        {/* Nudges */}
        <SecurityNudge
          delayMs={3500}
          throttleHours={24}
          showOnRoutes={['/(client)/explore']}
          bottomOffset={120} // Offset para n�o sobrepor NavBar
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
      </ScreenContainer>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#FFFFFF',
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
    backgroundColor: '#FFFFFF',
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
    backgroundColor: '#fff',
    paddingTop: 0,
    paddingBottom: 80,
    paddingHorizontal: 2,
  },
  searchComponentContainer: {
    marginHorizontal: 10,
    paddingBottom: 5,
    marginTop: -5,
  },
  categoriesSection: {
    marginTop: 2,
    marginBottom: -5,
    paddingHorizontal: 6,
  },
  categoryTitleWrapper: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 10,
    marginTop: 1,
    marginBottom: 2,
  },
  categorySectionTitle: {
    fontSize: 16.5,
    fontFamily: 'Montserrat-Regular',
    fontWeight: '600',
    // PREMIUM: Estilo de t�tulo alinhado
    color: 'rgba(44, 62, 80, 0.85)',
    letterSpacing: 0.5,
  },
  carouselContainer: {
    marginTop: 10,
    marginBottom: 10,
    alignItems: 'center',
  },
  navBarContainer: {
    position: 'absolute',
    bottom: -15, // AJUSTADO: De -28 para 0
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
  // REMOVIDO: Estilos de pagina��o (n�o mais necess�rios)
  // pagination: {
  //   flexDirection: 'row',
  //   height: 20,
  //   alignItems: 'center',
  //   marginTop: 10,
  // },
  // paginationDot: {
  //   width: 8,
  //   height: 8,
  //   borderRadius: 4,
  //   marginHorizontal: 5,
  // },
  // paginationDotActive: {
  //   backgroundColor: COR_AZUL_CLARO_UNIFICADA,
  // },
  // paginationDotInactive: {
  //   backgroundColor: '#ddd',
  // },
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
  miniGridTitle: {
    fontSize: 15,
    fontFamily: 'Montserrat-Regular',
    fontWeight: '800',
    // PREMIUM: Estilo de t�tulo alinhado
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
});
