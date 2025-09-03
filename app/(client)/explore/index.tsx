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
    Share
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { Ionicons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from '@react-navigation/native';
import Constants from 'expo-constants'; // Importar Constants
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
import { Service } from '../../../types/backend/services';
import { UserProfile } from '../../../types/backend/users';
import HorizontalMiniGrid from '../../../components/client/explore/home/HorizontalMiniGrid'; // Importado

import { CLIENT_ROUTES } from '../../../constants/routes';
import { AppColors, AppDurations, AppOffsets, AppShadows, AppTypography, SCREEN_WIDTH } from '../../../constants/appStyles';

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
import HeaderSuperior from '../../../components/client/explore/home/HeaderSuperior';
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
import SecurityNudge from '../../../components/nudges/SecurityNudge'; // Assumindo o caminho
import IncentiveNudge from '../../../components/nudges/IncentiveNudge'; // Assumindo o caminho

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
        title: 'Obtenha Oferta Especial', // Traduzido
        discount: 'Até 40%', // Traduzido
        description: 'Todos os Serviços Disponíveis | Termos e Condições Aplicados', // Traduzido
        buttonText: 'Resgatar', // Traduzido
        badgeText: 'Tempo limitado!', // Traduzido
        onPress: () => console.log('Banner 1 Pressionado'),
    },
    {
        id: '2',
        title: 'Outra Grande Oferta', // Traduzido
        discount: 'Economize Muito!', // Traduzido
        description: '', // Traduzido
        buttonText: 'Ver', // Traduzido
        badgeText: 'Exclusivo', // Traduzido
        onPress: () => console.log('Banner 2 Pressionado'),
    },
    {
        id: '3',
        title: 'Última Chance!', // Traduzido
        discount: '75% de Desconto', // Traduzido
        description: 'Para Novos Clientes', // Traduzido
        buttonText: 'Cadastrar', // Traduzido
        badgeText: 'Corra!', // Traduzido
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


    const fetchData = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const fetchedUserProfile = await getUserProfile();
            setUserProfile(fetchedUserProfile);

            console.log('[ExploreClientScreen] Perfil do usuário carregado:', fetchedUserProfile);

            const categoriesData = await getServiceCategories();
            setServiceCategories(categoriesData);

            const recommendationsData = await getRecommendedProviders();
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
                Alert.alert(t('common.error'), t('common.network_error'));
            }

            let providersData: ProviderDisplayInfo[] = [];
            if (locationCoords) {
                providersData = await searchProvidersWithLocation({
                    latitude: locationCoords.latitude,
                    longitude: locationCoords.longitude,
                    radius: 50,
                }) as ProviderDisplayInfo[];
            }
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
            setError(errorMessage);
            Alert.alert(t("common.error"), errorMessage);
            console.error("[ExploreClientScreen] Erro ao carregar dados:", err.response?.data || err.message);
        } finally {
            setLoading(false);
            setIsRefreshing(false);
        }
    }, [t, headerAnim, categoriesAnim, bannerAnim, recommendationsAnim, providersAnim, navBarAnim]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    useFocusEffect(
        useCallback(() => {
            let cancelled = false;

            const loadAndSetPromotions = async () => {
                const offersData = await getOffers();
                console.log("DEBUG | offersData:", offersData);
                const welcomeOffer = offersData.find(offer =>
                    (offer as any).target === 'NEW_CLIENTS' && (offer as any).firstBookingOnly
                );
                if (welcomeOffer) {
  setWelcomeCouponOffer(welcomeOffer);
} else {
  // MOCK: cupom fake só para debug visual
  setWelcomeCouponOffer({
    id: "fake-123",
    couponCode: "BEMVINDO10",
    title: "Ganhe 10% na sua 1ª limpeza!",
    description: "Use agora e economize",
    target: "NEW_CLIENTS",
    firstBookingOnly: true,
    validUntil: "2025-12-31T23:59:59.000Z"
  } as any);
}


                if (promotionTimeoutRef.current) {
                    clearTimeout(promotionTimeoutRef.current);
                }

                promotionTimeoutRef.current = setTimeout(async () => {
                    if (cancelled) return;

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
                                setShowPersistentCouponPill(true);
                            }
                        }
                    }

                    if (isAuthenticated && userProfile?.referralCode) {
                        const dismissedReferral = await AsyncStorage.getItem(REFERRAL_BANNER_DISMISSED_KEY);
                        if (!dismissedReferral) {
                            shouldShowReferral = true;
                        }
                    }

                    if (shouldShowCoupon) {
                        setActiveBottomPromotion('coupon');
                    } else if (shouldShowReferral) {
                        setActiveBottomPromotion('referral');
                    } else {
                        setActiveBottomPromotion(null);
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
    const safeNearbyProviders = Array.isArray(nearbyProviders)
        ? nearbyProviders.filter((item) => item && typeof item.fullName === 'string')
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
        setActiveBottomPromotion(null);
        setShowPersistentCouponPill(false);
        await AsyncStorage.setItem(WELCOME_COUPON_REDEEMED_KEY, 'true');
        router.push({
            pathname: CLIENT_ROUTES.SCHEDULE_SERVICE,
            params: { couponCode: code }
        } as any);
    }, [router]);

    const handleDismissWelcomeCoupon = useCallback(async () => {
        setActiveBottomPromotion(null);
        setShowPersistentCouponPill(true);
        await AsyncStorage.setItem(WELCOME_COUPON_DISMISSED_KEY, 'true');
    }, []);

    const handleReopenWelcomeCoupon = useCallback(async () => {
        setShowPersistentCouponPill(false);
        setActiveBottomPromotion('coupon');
    }, []);

    const handleDismissReferralBanner = useCallback(async () => {
        setActiveBottomPromotion(null);
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
        setShowReferralSheet(false);
        setActiveBottomPromotion(null);
    }, [referralCode]);

    const handleHowItWorksReferral = useCallback(() => {
        setShowReferralSheet(true);
        setActiveBottomPromotion(null);
    }, []);

       // DEBUG: logando cupom carregado
   console.log("DEBUG | welcomeCouponOffer:", welcomeCouponOffer);

    if (loading && !isRefreshing) {
        return (
            <View style={styles.loadingContainer}>
                <Stack.Screen options={{ headerShown: false }} />
                <ActivityIndicator size="large" color={AppColors.primaryInteractive} />
                <Text style={{ marginTop: 10, color: AppColors.textBody }}>{t("common.loading")}</Text>
            </View>
        );
    }

    if (error) {
        return (
            <View style={styles.loadingContainer}>
                <Text style={{ color: AppColors.errorRed, textAlign: 'center' }}>{error}</Text>
                <TouchableOpacity onPress={fetchData} style={{ marginTop: 20, padding: 10, backgroundColor: AppColors.primaryInteractive, borderRadius: 5 }}>
                    <Text style={{ color: AppColors.white }}>{t("common.tryAgain")}</Text>
                </TouchableOpacity>
            </View>
        );
    }

    const addressToDisplay = userProfile?.clientDetails?.address || userProfile?.providerDetails?.address || userProfile?.address;

    return (
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
                <View style={styles.contentWrapper}>
                    {/* Header Superior Animado */}
                    <Animated.View style={[styles.headerContainer, { opacity: headerAnim, transform: [{ translateY: headerAnim.interpolate({ inputRange: [0, 1], outputRange: [-50, 0] }) }] }]}>
                        <HeaderSuperior
                            userName={userProfile?.clientDetails?.fullName || userProfile?.providerDetails?.fullName || userProfile?.fullName || t('common.user')}
                            userAddress={addressToDisplay}
                        />
                    </Animated.View>

                    {/*
                      ALTERAÇÃO 1: O Bloco de categorias foi MOVIDO para fora do ScrollView.
                      O espaço que ele ocupava precisa ser compensado.
                      (A estrutura JSX já reflete isso, o componente Animated.View das categorias está fora do ScrollView, abaixo)
                    */}

                    {/* Novo Carrossel de Banners */}
                    {/* ALTERAÇÃO 2: Adicionamos um marginTop para compensar o espaço das categorias flutuantes */}
                    <Animated.View style={[styles.carouselContainer, {  opacity: bannerAnim, transform: [{ translateY: bannerAnim.interpolate({ inputRange: [0, 1], outputRange: [-20, 0] }) }] }]}>
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
                            // ALTERAÇÃO AQUI: snapToInterval ajustado para alinhar corretamente
                            snapToInterval={screenWidth - 20} // (screenWidth - 40) + 10 (margin esquerdo) + 10 (margin direito)
                            decelerationRate="fast"
                            // ALTERAÇÃO AQUI: Adicionado paddingHorizontal para alinhar com as bordas da tela
                            contentContainerStyle={{ paddingHorizontal: 10 }}
                        />
                        {renderPagination()}
                    </Animated.View>

                    {/* Recomendações para Você Animadas */}
                    <Animated.View style={{  opacity: recommendationsAnim, transform: [{ translateY: recommendationsAnim.interpolate({ inputRange: [0, 1], outputRange: [-20, 0] }) }] }}>
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
                        {/* INJEÇÃO: Separador sutil após Recomendações */}
                        <View style={styles.sectionSeparator} />
                    </Animated.View>

                    {/* Profissionais por Perto Animados */}
                    <Animated.View style={{ opacity: providersAnim, transform: [{ translateY: providersAnim.interpolate({ inputRange: [0, 1], outputRange: [-20, 0] }) }] }}>
                        <SecaoPrestadores
                            titulo={t("search.nearby_providers")}
                            onVerTudoPress={() => router.push('/(client)/explore/todos-prestadores-proximos' as any)}
                            data={safeNearbyProviders}
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
                        {/* INJEÇÃO: Separador sutil após Profissionais por Perto */}
                        <View style={styles.sectionSeparator} />
                    </Animated.View>

                    {/* INJEÇÃO: HorizontalMiniGrid com Badges */}
                    <Animated.View style={{ opacity: providersAnim, transform: [{ translateY: providersAnim.interpolate({ inputRange: [0, 1], outputRange: [-20, 0] }) }] }}>
                        {/* NOVO: Título para a seção de mini-cards */}
                        <View style={styles.miniGridHeader}>
                            {/* ÚNICA ALTERAÇÃO AQUI: De "explore_actions_title" para "explore_section.title" */}
                            <Text style={styles.miniGridTitle}>{t("explore_section.title")}</Text>
                            {/* INJEÇÃO: Compromisso para "badges nos mini cards" sem alterar HorizontalMiniGrid */}
                            {welcomeCouponOffer && activeBottomPromotion !== 'coupon' && (
  <TouchableOpacity
    onPress={() => setActiveBottomPromotion('coupon')}
    style={styles.couponFab}
    activeOpacity={0.85}
  >
    <Image
      source={Icons3D.ticket}
      style={styles.ticketIcon}
      resizeMode="contain"
    />
  </TouchableOpacity>
)}
                        </View>
                        <HorizontalMiniGrid />
                    </Animated.View>
                </View> {/* Fim de contentWrapper */}
            </ScrollView> {/* Fim de ScrollView */}

            {/* ALTERAÇÃO 3: O contêiner das categorias agora está AQUI, fora e sobre o ScrollView */}
            <Animated.View style={[styles.categoriesCard, {left: -5,  opacity: categoriesAnim, transform: [{ translateY: categoriesAnim.interpolate({ inputRange: [0, 1], outputRange: [-20, 0] }) }] }]}>
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
                />
            </Animated.View>

            {/* NavBar Animada */}
            <Animated.View style={[styles.navBarContainer, { transform: [{ translateY: navBarAnim.interpolate({ inputRange: [0, 1], outputRange: [100, 0] }) }] }]}>
                <NavBar />
            </Animated.View>

            {/* NOVO: DEFENSE_SOS */}
            <DEFENSE_SOS />



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
                        visible={activeBottomPromotion === 'coupon'} // Adicione esta linha
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
              bottomOffset={84} // sobe para não sobrepor o Security
              points={100}
            />
        </View>
    );
}

const styles = StyleSheet.create({
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
    // A sombra e o borderRadius agora são aplicados diretamente ao ImageBackground
  },
  couponCardBackground: { // Estilos aplicados ao ImageBackground
    height: 260, // Altura fixa para garantir que a imagem de fundo seja totalmente visível
    width: '100%', // Ocupa a largura total do couponWrapper
    borderRadius: 15, // Aplica o borderRadius ao contêiner da imagem
    overflow: 'hidden', // Essencial para que o borderRadius funcione na imagem de fundo
    alignItems: 'center', // Centraliza o conteúdo horizontalmente
    justifyContent: 'space-between', // Distribui o conteúdo verticalmente
    position: 'relative',
    paddingTop: 20, // Espaçamento do conteúdo a partir do topo do cupom
    paddingBottom: 10, // Espaçamento do conteúdo a partir da base do cupom
    // Sombra aplicada diretamente aqui
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 12,
  },
  couponCardImageStyle: { // Estilos aplicados diretamente à imagem dentro do ImageBackground
    borderRadius: 15, // Aplica o borderRadius à imagem em si
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
    color: '#3647dfff', // Cor ajustada para melhor contraste
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
        backgroundColor: COR_CINZA_FUNDO,
    },
    scrollViewArea: {
        flex: 1,
    },
    scrollContentContainer: {
        paddingBottom: 90,
        flexGrow: 1,
    },
    headerContainer: {
        marginHorizontal: 1,
        // O zIndex aqui é importante para que o header fique abaixo das categorias
        zIndex: 1, // Mantido, mas zIndex das categorias é maior
    },
    contentWrapper: {
        flexGrow: 1,
        marginHorizontal: 10,
    },
    // ALTERAÇÃO 4: Estilo completamente novo para o container flutuante das categorias
    categoriesCard: {
        position: 'absolute',
        // O valor de 'top' precisa ser ajustado para alinhar perfeitamente abaixo do header.
        // Um bom ponto de partida é a altura do header - um pouco para sobrepor.
        // Vamos estimar um valor e você pode ajustá-lo.
        top: (Constants.statusBarHeight + 70), // AJUSTE ESTE VALOR PARA O ALINHAMENTO PERFEITO
        left: 0,
        right: 0,
        zIndex: 100, // zIndex alto para garantir que flutue sobre tudo
        paddingHorizontal: 20,
        backgroundColor: 'transparent',
        // Removendo sombras e elevações conforme solicitado ("AGORA SEM FUNDO BRANCO E SOMBRA")
        ...Platform.select({
            ios: {
                shadowColor: '#2C3E50',
                shadowOffset: { width: 5, height: 7 },
                shadowOpacity: 0,
                shadowRadius: 3,
            },
            android: {
                elevation: 4,
            },
        }),
        // Removendo marginTop/marginBottom que não são relevantes para position: 'absolute'
        // A posição é controlada por 'top', 'left', 'right'.
    },
    // ALTERAÇÃO 5: Adicionar marginTop para o carrossel
    carouselContainer: {
        // Este valor deve ser suficiente para que o carrossel não fique escondido sob as categorias.
        // A altura da linha de categorias é de aprox. 50-60px (ícone + texto).
        marginTop: 100, // AJUSTE CONFORME NECESSÁRIO
        marginBottom: 10,
   
        alignItems: 'center',
    },
    navBarContainer: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        zIndex: 200, // NavBar deve ficar sobre tudo, exceto modais
        shadowColor: "#000",
        shadowOffset: {
            width: 0,
            height: -5,
        },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 10,
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
    // NOVO: Estilos para o título da seção de mini-cards
    miniGridHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 5, // Espaçamento abaixo do título
        paddingHorizontal: 16, // Alinhamento com outros títulos de seção
        marginTop: 2, // Espaçamento acima do título para separar da seção anterior
    },
    miniGridTitle: {
        fontSize: 15,
        fontFamily: 'Montserrat-Regular',
        fontWeight: '800',
        color: '#4f5a71ff', // Cor consistente com outros títulos
    },
    // INJEÇÃO: Estilo para o separador de seção
    sectionSeparator: {
        borderBottomWidth: 1,
        borderBottomColor: COR_BORDA_SUAVE, // Uma cor suave para a linha
        marginVertical: 15, // Espaçamento vertical para a linha
        right: 21,
        marginHorizontal: 58, // Alinha com o padding dos títulos
    },
    // INJEÇÃO: Estilos para o "badge" da seção de mini-cards
    miniGridBadge: {
       backgroundColor: 'transparent',
        borderRadius: 15,
        paddingHorizontal: 8,
        paddingVertical: 4,
        marginLeft: 10, // Espaçamento entre o título e o badge
        flexDirection: 'row',
        alignItems: 'center',
    },
    miniGridBadgeText: {
        color: '#202633',
        fontSize: 8.4,
        fontWeight: 'bold',
        marginLeft: 3, // Espaçamento entre o ícone e o texto
    },
    // Novo estilo para o FAB do cupom
    couponFab: {
      backgroundColor: AppColors.primaryInteractive, // Cor de fundo do botão
      borderRadius: 25, // Metade da largura/altura para torná-lo circular
      width: 50, // Largura do botão
      height: 50, // Altura do botão
      justifyContent: 'center',
      alignItems: 'center',
      // Posição flutuante (ajuste conforme necessário)
      position: 'absolute',
      bottom: 20, // Distância do fundo
      right: 20, // Distância da direita
      zIndex: 100, // Para garantir que esteja acima de outros elementos
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
      width: 30, // Tamanho do ícone do ticket
      height: 30, // Tamanho do ícone do ticket
      tintColor: AppColors.white, // Cor do ícone
    },
});