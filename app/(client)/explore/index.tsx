// LimpeJaApp/app/(client)/explore/index.tsx
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

// Importar os novos componentes Nudge
import SecurityNudge from '../../../components/nudges/SecurityNudge';
import IncentiveNudge from '../../../components/nudges/IncentiveNudge';

// Importar o novo componente SearchComponent
import SearchComponent from '../../../components/client/explore/home/SearchComponent';

const COR_AZUL_CLARO_UNIFICADA = '#A0D2EB';
const COR_PRIMARIA_ESCURA = '#2C3E50';
const COR_CINZA_FUNDO = '#F4F7FC';
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
        description: 'Todos os Serviços Disponíveis | Termos e Condições Aplicados',
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
        title: 'Última Chance!',
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

    const [activeBottomPromotion, setActiveBottomPromotion] = useState<'coupon' | 'referral' | null>(null);
    const promotionTimeoutRef = useRef<NodeJS.Timeout | null>(null);

    const referralCode = userProfile?.referralCode || "LIMPEJA123";
    const rewardReferrer = "Ganhe R$20 ou +300 pts";
    const rewardReferred = "Seu amigo ganha 20% na 1ª";

    const headerAnim = useRef(new Animated.Value(0)).current;
    const categoriesAnim = useRef(new Animated.Value(0)).current;
    const bannerAnim = useRef(new Animated.Value(0)).current;
    const recommendationsAnim = useRef(new Animated.Value(0)).current;
    const providersAnim = useRef(new Animated.Value(0)).current;
    const navBarAnim = useRef(new Animated.Value(0)).current;

    // Adicionado ref para verificar se o componente está montado
    const isMounted = useRef(true);


    const fetchData = useCallback(async () => {
        if (isMounted.current) {
            setLoading(true);
            setError(null);
        }
        try {
            const fetchedUserProfile = await getUserProfile();
            if (!isMounted.current) return;
            setUserProfile(fetchedUserProfile);

            console.log('[ExploreClientScreen] Perfil do usuário carregado:', fetchedUserProfile);

            const categoriesData = await getServiceCategories();
            if (!isMounted.current) return;
            setServiceCategories(categoriesData);

            const recommendationsData = await getRecommendedProviders();
            if (!isMounted.current) return;
            setRecommendations(recommendationsData);

            let locationCoords: Location.LocationObjectCoords | null = null;
            try {
                let { status } = await Location.requestForegroundPermissionsAsync();
                if (status !== 'granted') {
                    Alert.alert(t('safety.panic.location_permission_denied'), t('safety.panic.location_permission_message'));
                } else {
                    const currentLocation = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High });
                    locationCoords = currentLocation.coords;
                    console.log('[ExploreClientScreen] Localização obtida:', locationCoords);
                }
            } catch (locError) {
                console.error('[ExploreClientScreen] Erro ao obter localização:', locError);
                // Não exibir alerta de erro de rede aqui, pois é um erro de localização
                // Alert.alert(t('common.error'), t('common.network_error'));
            }

            let providersData: ProviderDisplayInfo[] = [];
            if (locationCoords) {
                providersData = await searchProvidersWithLocation({
                    latitude: locationCoords.latitude,
                    longitude: locationCoords.longitude,
                    radius: searchRadiusKm * 1000,
                }) as ProviderDisplayInfo[];
            }
            if (!isMounted.current) return;
            setNearbyProviders(providersData);

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
        } catch (err: any) {
            const errorMessage = err.message || err.response?.data?.message || t("common.network_error");
            if (isMounted.current) {
                setError(errorMessage);
                Alert.alert(t("common.error"), errorMessage);
            }
            console.error("[ExploreClientScreen] Erro ao carregar dados:", err.response?.data || err.message);
        } finally {
            if (isMounted.current) {
                setLoading(false);
                setIsRefreshing(false);
            }
        }
    }, [t, headerAnim, categoriesAnim, bannerAnim, recommendationsAnim, providersAnim, navBarAnim, searchRadiusKm]);

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
                console.log("DEBUG | offersData:", offersData);
                const welcomeOffer = offersData.find(offer =>
                    (offer as any).target === 'NEW_CLIENTS' && (offer as any).firstBookingOnly
                );
                if (welcomeOffer) {
                    if (isMounted.current) setWelcomeCouponOffer(welcomeOffer);
                } else {
                    if (isMounted.current) {
                        setWelcomeCouponOffer({
                            id: "fake-123",
                            couponCode: "BEMVINDO20",
                            title: "Ganhe 20%OFF !",
                            description: "Use agora e economize",
                            target: "NEW_CLIENTS",
                            firstBookingOnly: true,
                            validUntil: "2025-12-31T23:59:59.000Z"
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
                        const isCouponExpired = welcomeOffer.validUntil ? new Date(welcomeOffer.validUntil).getTime() < Date.now() : false;

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

    const handleCategoryPress = useCallback((item: Service) => {
        router.push({
            pathname: CLIENT_ROUTES.SEARCH_RESULTS,
            params: { categoryId: item.id, categoryName: item.name }
        } as any);
    }, [router]);

    const handleProviderPress = useCallback((provider: ProviderDisplayInfo) => {
        router.push(CLIENT_ROUTES.PROVIDER_DETAILS(provider.id));
    }, [router]);

    const safeServiceCategories = serviceCategories.filter((c) => c && c.name);
    const safeRecommendations = Array.isArray(recommendations)
        ? recommendations.filter((item) => item && typeof item.fullName === 'string')
        : [];
    
    // Filtrar nearbyProviders com base no priceFilter
    const filteredNearbyProviders = Array.isArray(nearbyProviders)
        ? nearbyProviders.filter((item) => {
            if (!item || !item.fullName) return false;
            if (!priceFilter) return true; // Sem filtro de preço, mostra todos

            // Verifica se o provedor tem algum serviço que corresponda ao tipo de preço
            return item.providerServices?.some(service => {
                if (service.pricingType === priceFilter) {
                    const price = getNumericPriceValue(service);
                    return price > 0; // Apenas serviços com preço válido
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

    const renderPagination = useCallback(() => (
        <View style={styles.pagination}>
            {bannerData.map((_, index) => (
                <View
                    key={index}
                    style={[
                        styles.paginationDot,
                        index === currentIndex ? styles.paginationDotActive : styles.paginationDotInactive,
                    ]}
                />
            ))}
        </View>
    ), [currentIndex]);

    const onRefresh = useCallback(() => {
        setIsRefreshing(true);
        fetchData();
    }, [fetchData]);

    const handleUseWelcomeCoupon = useCallback(async (code: string) => {
        if (isMounted.current) {
            setActiveBottomPromotion(null);
            setShowPersistentCouponPill(false);
        }
        await AsyncStorage.setItem(WELCOME_COUPON_REDEEMED_KEY, 'true');
        router.push({
            pathname: CLIENT_ROUTES.SCHEDULE_SERVICE,
            params: { couponCode: code }
        } as any);
    }, [router]);

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

    console.log("DEBUG | welcomeCouponOffer:", welcomeCouponOffer);

    if (loading && !isRefreshing) {
        return (
            <View style={styles.loadingContainer}>
                <Stack.Screen options={{ title: t("common.loading"), headerShown: false }} />
                <ActivityIndicator size="large" color={AppColors.primaryInteractive} />
                <Text style={{ marginTop: 10, color: AppColors.textBody }} allowFontScaling={false}>{t("common.loading")}</Text>
            </View>
        );
    }

    if (error) {
        return (
            <View style={styles.loadingContainer}>
                <Text style={{ color: AppColors.errorRed, textAlign: 'center' }} allowFontScaling={false}>{error}</Text>
                <TouchableOpacity onPress={fetchData} style={{ marginTop: 20, padding: 10, backgroundColor: AppColors.primaryInteractive, borderRadius: 5 }}>
                    <Text style={{ color: AppColors.white }} allowFontScaling={false}>{t("common.tryAgain")}</Text>
                </TouchableOpacity>
            </View>
        );
    }

    const rawAddress =
        userProfile?.clientDetails?.address ||
        userProfile?.providerDetails?.address ||
        userProfile?.address;

    // Usar o formatAddress helper
    const addressToDisplay = formatAddress(rawAddress);

    return (
        <SafeAreaView style={styles.safeArea}>
            <View style={styles.screen}>
                <Stack.Screen options={{
                    headerShown: false,
                    headerRight: () => (
                        <TouchableOpacity
                            style={styles.shieldIconContainer}
                        >
                        </TouchableOpacity>
                    ),
                }} />

                {/* Cabeçalho roxo que fica no fundo */}
                <NewHeader
                    userName={
                        userProfile?.clientDetails?.fullName ||
                        userProfile?.providerDetails?.fullName ||
                        userProfile?.fullName ||
                        t('common.user')
                    }
                    userAddress={addressToDisplay}
                />

                <ScrollView
                    style={styles.scrollViewArea}
                    contentContainerStyle={styles.scrollContentContainer}
                    showsVerticalScrollIndicator={false}
                    keyboardShouldPersistTaps="handled"
                    refreshControl={
                        <RefreshControl
                            refreshing={isRefreshing}
                            onRefresh={onRefresh}
                            tintColor={AppColors.primaryInteractive}
                            title={t("common.loading")}
                            titleColor={AppColors.primaryInteractive}
                        />
                    }
                >
                    {/* O conteúdo principal da Home começa aqui, com o fundo branco e bordas arredondadas */}
                    <View style={styles.contentWrapper}>
                        {/* Seção de Filtro por Raio */}
                        {/*
                        <Animated.View style={[styles.radiusFilterContainer, { opacity: providersAnim, transform: [{ translateY: providersAnim.interpolate({ inputRange: [0, 1], outputRange: [-20, 0] }) }] }]}>
                            <Text style={styles.radiusFilterTitle} allowFontScaling={false}>{t("search.search_radius")}</Text>
                            <View style={styles.radiusChipsWrapper}>
                                {[1, 2, 4, 10, 25, 50].map(km => (
                                    <TouchableOpacity
                                        key={km}
                                        onPress={() => { setSearchRadiusKm(km); fetchData(); }}
                                        style={[styles.radiusChip, searchRadiusKm === km && styles.radiusChipActive]}
                                        hitSlop={{ top: 5, bottom: 5, left: 5, right: 5 }}
                                    >
                                        <Text style={searchRadiusKm === km ? styles.radiusTextActive : styles.radiusText} allowFontScaling={false}>{km} km</Text>
                                    </TouchableOpacity>
                                ))}
                            </View>
                        </Animated.View>
                        */}

                        {/* Seção de Filtro por Preço */}
                        {/*
                        <Animated.View style={[styles.priceFilterContainer, { opacity: providersAnim, transform: [{ translateY: providersAnim.interpolate({ inputRange: [0, 1], outputRange: [-20, 0] }) }] }]}>
                            <Text style={styles.radiusFilterTitle} allowFontScaling={false}>{t("search.price_type")}</Text>
                            <View style={styles.priceFilterOptions}>
                                <TouchableOpacity
                                    onPress={() => setPriceFilter(priceFilter === PricingType.HOURLY ? null : PricingType.HOURLY)}
                                    style={[styles.radiusChip, priceFilter === PricingType.HOURLY && styles.radiusChipActive]}
                                    hitSlop={{ top: 5, bottom: 5, left: 5, right: 5 }}
                                >
                                    <Text style={priceFilter === PricingType.HOURLY ? styles.radiusTextActive : styles.radiusText} allowFontScaling={false}>{t("common.hourly")}</Text>
                                </TouchableOpacity>
                                <TouchableOpacity
                                    onPress={() => setPriceFilter(priceFilter === PricingType.BY_SIZE ? null : PricingType.BY_SIZE)}
                                    style={[styles.radiusChip, priceFilter === PricingType.BY_SIZE && styles.radiusChipActive]}
                                    hitSlop={{ top: 5, bottom: 5, left: 5, right: 5 }}
                                >
                                    <Text style={priceFilter === PricingType.BY_SIZE ? styles.radiusTextActive : styles.radiusText} allowFontScaling={false}>{t("common.per_sqm")}</Text>
                                </TouchableOpacity>
                                <TouchableOpacity
                                    onPress={() => setPriceFilter(priceFilter === PricingType.FIXED_PRICE ? null : PricingType.FIXED_PRICE)}
                                    style={[styles.radiusChip, priceFilter === PricingType.FIXED_PRICE && styles.radiusChipActive]}
                                    hitSlop={{ top: 5, bottom: 5, left: 5, right: 5 }}
                                >
                                    <Text style={priceFilter === PricingType.FIXED_PRICE ? styles.radiusTextActive : styles.radiusText} allowFontScaling={false}>{t("common.fixed_price")}</Text>
                                </TouchableOpacity>
                            </View>
                        </Animated.View>
                        */}

                        {/* Seção de Categorias */}
                        <Animated.View style={[styles.categoriesSection, { opacity: categoriesAnim, transform: [{ translateY: categoriesAnim.interpolate({ inputRange: [0, 1], outputRange: [-20, 0] }) }] }]}>
                            <View style={styles.categoryTitleWrapper}>
                                <Text style={styles.categorySectionTitle} allowFontScaling={false}>{t("search.all_categories")}</Text>
                                <TouchableOpacity
                                    onPress={() => router.push('/(client)/explore/todas-categorias' as any)}
                                    style={styles.viewAllButton}
                                    hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                                >
                                    <Ionicons name="chevron-forward" size={14} color="#007BFF" />
                                </TouchableOpacity>
                            </View>
                            <SecaoContainer<Service>
                                titulo={t("search.all_categories")}
                                onVerTudoPress={() => router.push('/(client)/explore/todas-categorias' as any)}
                                data={safeServiceCategories}
                                renderItem={({ item }) => {
                                    if (!item || !item.name) return null;
                                    return (
                                        <CategoriaCard
                                            item={{ id: item.id, name: item.name, icon: item.icon as any }}
                                        />
                                    );
                                }}
                                horizontal={true}
                                noDataText={t("search.no_results")}
                            />
                        </Animated.View>

                        {/* Novo Carrossel de Banners */}
                        <Animated.View style={[styles.carouselContainer, { opacity: bannerAnim, transform: [{ translateY: bannerAnim.interpolate({ inputRange: [0, 1], outputRange: [-20, 0] }) }] }]}>
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
                                snapToInterval={screenWidth} // Alterado para screenWidth para melhor controle
                                decelerationRate="fast"
                                contentContainerStyle={{ paddingHorizontal: 10, paddingRight: 20 }} // Adicionado paddingRight para compensar snapToInterval
                            />
                            {renderPagination()}
                        </Animated.View>

                        {/* Recomendações para Você Animadas */}
                        <Animated.View style={{ opacity: recommendationsAnim, transform: [{ translateY: recommendationsAnim.interpolate({ inputRange: [0, 1], outputRange: [-20, 0] }) }] }}>
                            <SecaoRecomendacoes
                                titulo={t("search.recommended_providers")}
                                onVerTudoPress={() => router.push('/(client)/explore/todos-recomendacoes' as any)}
                                data={safeRecommendations}
                                renderItem={({ item }) => {
                                    if (!item || !item.fullName) return null;

                                    return (
                                        <RecomendacaoCard
                                            key={item.id}
                                            item={item}
                                        />
                                    );
                                }}
                                horizontal={true}
                                noDataText={t("search.no_results")}
                            />
                        
                        </Animated.View>

                        {/* Profissionais por Perto Animados */}
                        <Animated.View style={{ opacity: providersAnim, transform: [{ translateY: providersAnim.interpolate({ inputRange: [0, 1], outputRange: [-20, 0] }) }] }}>
                            <SecaoPrestadores
                                titulo={t("search.nearby_providers")}
                                onVerTudoPress={() => router.push('/(client)/explore/todos-prestadores-proximos' as any)}
                                data={filteredNearbyProviders} // Usar os provedores filtrados
                                renderItem={({ item }) => {
                                    if (!item || !item.fullName) return null;
                                    return (
                                        <PrestadorCard
                                            key={item.id}
                                            item={item}
                                            onPress={() => handleProviderPress(item)}
                                        />
                                    );
                                }}
                                horizontal={true}
                                noDataText={t("search.no_results")}
                            />
                            <View style={styles.sectionSeparator} />
                        </Animated.View>

                        {/* INJEÇÃO: HorizontalMiniGrid com Badges */}
                        <Animated.View style={{ opacity: providersAnim, transform: [{ translateY: providersAnim.interpolate({ inputRange: [0, 1], outputRange: [-20, 0] }) }] }}>
                            <View style={styles.miniGridHeader}>
                                <Text style={styles.miniGridTitle} allowFontScaling={false}>{t("explore_section.title")}</Text>
                            </View>
                            <HorizontalMiniGrid />
                        </Animated.View>
                    </View>
                </ScrollView>

                {/* NavBar Animada */}
                <Animated.View style={[styles.navBarContainer, { transform: [{ translateY: navBarAnim.interpolate({ inputRange: [0, 1], outputRange: [100, 0] }) }] }]}>
                    <NavBar
                        welcomeCouponOffer={welcomeCouponOffer}
                        activeBottomPromotion={activeBottomPromotion}
                        setActiveBottomPromotion={setActiveBottomPromotion}
                    />
                </Animated.View>

                {/* NOVO: DEFENSE_SOS <DEFENSE_SOS />*/}
                

                {/* INJEÇÃO: SmartCouponNudge (aparece sutil após 3s na rota explore) */}
                {welcomeCouponOffer && (
                    <SmartCouponNudge
                        code={welcomeCouponOffer!.couponCode as string}
                        title={welcomeCouponOffer!.title}
                        subtitle={welcomeCouponOffer!.description}
                        delayMs={3000}
                        throttleHours={24}
                        showOnRoutes={['/(client)/explore']}
                        onApply={handleUseWelcomeCoupon}
                    />
                )}

                {/* NOVO: BottomSlideInCard para Cupom ou Indicação (FORA DO SCROLLVIEW) */}
                {welcomeCouponOffer && (
                    <BottomSlideInCard isVisible={activeBottomPromotion === 'coupon'}>
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

                {isAuthenticated && userProfile?.referralCode && (
                    <BottomSlideInCard isVisible={activeBottomPromotion === 'referral'}>
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

                {showPersistentCouponPill && activeBottomPromotion !== 'coupon' && welcomeCouponOffer && (
                    <CouponPill
                        code={welcomeCouponOffer!.couponCode as string}
                        onOpen={handleReopenWelcomeCoupon}
                    />
                )}

                {/* NOVO: ReferralSheet */}
                <ReferralSheet
                    visible={showReferralSheet}
                    onClose={() => setShowReferralSheet(false)}
                    code={referralCode}
                    rewardReferrer={rewardReferrer}
                    rewardReferred={rewardReferred}
                    onShare={handleShareReferral}
                />

                {/* Nudges inteligentes (empilhados com delay e offset) - Adicionados aqui */}
                <SecurityNudge
                    delayMs={3500}
                    throttleHours={24}
                    showOnRoutes={['/(client)/explore']}
                    bottomOffset={20}
                />

                <IncentiveNudge
                    delayMs={5000}
                    throttleHours={24}
                    showOnRoutes={['/(client)/explore']}
                    bottomOffset={84}
                    points={100}
                />
            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safeArea: {
        flex: 1,
        backgroundColor: 'transparent',
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
        backgroundColor: 'transparent',
        marginHorizontal: 15,
    },
    scrollViewArea: {
        flex: 1,
        zIndex: 1,
    },
    scrollContentContainer: {
        paddingBottom: 90,
        flexGrow: 1,
    },
    contentWrapper: {
        flexGrow: 1,
        marginTop: (Constants.statusBarHeight + 10 + 80) * -1 + 60,
        backgroundColor: '#fff',
        borderTopLeftRadius: 60,
        borderTopRightRadius: 60,
        paddingTop: 30,
        paddingHorizontal: 2,
        ...Platform.select({
            ios: {
                shadowColor: '#000',
                shadowOffset: { width: 0, height: -5 },
                shadowOpacity: 0.1,
                shadowRadius: 5,
            },
            android: {
                elevation: 5,
            },
        }),
    },
    searchComponentContainer: {
        marginHorizontal: 10,
        paddingBottom: 15,
    },
    categoriesSection: {
        marginTop: 2,
        marginBottom: -10,
        paddingHorizontal: 0,

    },
    categoryTitleWrapper: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 10,
        marginBottom: 5,

    },
    categorySectionTitle: {
        fontSize: 14,
        fontFamily: 'Montserrat-Regular',
        fontWeight: '600',
        color: '#4f5a71c3',
        
    },
    carouselContainer: {
        marginTop: 20,
        marginBottom: 10,
        alignItems: 'center',
    },
    navBarContainer: {
        position: 'absolute',
        bottom: 0,
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
    pagination: {
        flexDirection: 'row',
        height: 20,
        alignItems: 'center',
        marginTop: 10,
    },
    paginationDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        marginHorizontal: 5,
    },
    paginationDotActive: {
        backgroundColor: COR_AZUL_CLARO_UNIFICADA,
    },
    paginationDotInactive: {
        backgroundColor: '#ddd',
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
    miniGridTitle: {
        fontSize: 15,
        fontFamily: 'Montserrat-Regular',
        fontWeight: '800',
        color: '#4f5a71ff',
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
    }
});