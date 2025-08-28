// LimpeJaApp/app/(client)/explore/index.tsx
import { Stack, useRouter } from 'expo-router';
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
    Share // Importar Share para compartilhamento nativo
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { Ionicons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import AsyncStorage from '@react-native-async-storage/async-storage'; // Importar AsyncStorage
import { useFocusEffect } from '@react-navigation/native'; // Importar useFocusEffect

import {
    getOffers,
    getServiceCategories,
    getUserProfile,
    searchProvidersWithLocation,
} from '../../../services/clientService';
import { useAuth } from '../../../hooks/useAuth'; // Importar useAuth

import {
    getRecommendedProviders,
} from '../../../services/providerService';

import { Offer } from '../../../types/backend/offers';
import { ProviderDisplayInfo } from '../../../types/backend/providers';
import { Service } from '../../../types/backend/services';
import { UserProfile } from '../../../types/backend/users';

import { CLIENT_ROUTES } from '../../../constants/routes';
import { AppColors, AppDurations, AppOffsets, AppShadows, AppTypography, SCREEN_WIDTH } from '../../../constants/appStyles';

// --- INTERFACES PARA COMPONENTES (DEFINIDAS AQUI PARA EXEMPLO) ---
// Idealmente, estas interfaces deveriam estar nos arquivos de seus respectivos componentes.

// Interface para CarouselBannerItem (corrigida para incluir todas as props e onPress)
interface CarouselBannerItemProps {
    title: string;
    discount: string;
    description: string;
    buttonText: string;
    badgeText: string;
    // Removendo background colors, pois agora teremos uma imagem (conforme CarouselBannerItem.tsx)
    onPress: () => void;
}

// Interface genérica para SecaoContainer (agora é realmente genérica)
interface SecaoContainerProps<T> {
    titulo: string;
    onVerTudoPress: () => void;
    data: T[]; // Tornando a prop 'data' genérica
    renderItem: ({ item, index }: { item: T; index: number }) => React.ReactElement | null; // Tornando renderItem genérico
    horizontal?: boolean;
    titleColor?: string;
    noDataText?: string;
}

// Interface para CategoriaCard (corrigida para não incluir onPress, pois é tratado internamente)
interface CategoriaCardProps {
    item: { id: string; name: string; icon: any }; // 'any' para o ícone se o tipo exato não for conhecido
    // onPress: () => void; // Removido, pois a navegação é interna
}

// --- FIM DAS INTERFACES ---

// Importações dos componentes
import CarouselBannerItem from '../../../components/client/explore/home/CarouselBannerItem';
import CategoriaCard from '../../../components/client/explore/home/CategoriaCard';
import HeaderSuperior from '../../../components/client/explore/home/HeaderSuperior';
import NavBar from '../../../components/client/explore/home/NavBar';
import PrestadorCard from '../../../components/client/explore/home/PrestadorCard';
import RecomendacaoCard from '../../../components/client/explore/home/RecomendacaoCard';
import SecaoContainer from '../../../components/client/explore/home/SecaoContainer';
import SecaoPrestadores from '../../../components/client/explore/home/SecaoPrestadores';
import SecaoRecomendacoes from '../../../components/client/explore/home/SecaoRecomendacoes';
// REMOVIDO: import FAB_SOS from '../../../components/client/explore/home/FAB_SOS';
// ADICIONADO:
import DEFENSE_SOS from '../../../components/client/explore/home/DEFENSE_SOS';


// NOVOS COMPONENTES DE CUPOM E REFERRAL
// CORREÇÃO: Alterado de named imports para default imports
import HtmlCouponCard from '../../../components/coupons/HtmlCouponCard';
import { CouponPill } from '../../../components/coupons/CouponPill'; // named
import { ReferralBanner } from '../../../components/referrals/ReferralBanner'; // named
import { ReferralSheet } from '../../../components/referrals/ReferralSheet'; // named
import BottomSlideInCard from '../../../components/common/BottomSlideInCard';

// INJEÇÃO: SmartCouponNudge
import SmartCouponNudge from '../../../components/coupons/CouponNudge';

const COR_AZUL_CLARO_UNIFICADA = '#A0D2EB';
const COR_PRIMARIA_ESCURA = '#2C3E50';
const COR_CINZA_FUNDO = '#F4F7FC';
const COR_BORDA_SUAVE = '#E0E0E0';

const { width: screenWidth } = Dimensions.get('window');

// Define o tipo para os itens do bannerData
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
        title: 'Get Special Offer',
        discount: 'Up to 40%',
        description: 'All Services Available | T&C Applied',
        buttonText: 'Claim',
        badgeText: 'Limited time!',
        onPress: () => console.log('Banner 1 Pressionado'),
    },
    {
        id: '2',
        title: 'Another Great Deal',
        discount: 'Save Big!',
        description: 'On Selected Services Only',
        buttonText: 'View',
        badgeText: 'Exclusive',
        onPress: () => console.log('Banner 2 Pressionado'),
    },
    {
        id: '3',
        title: 'Last Chance!',
        discount: '75% Off',
        description: 'For New Customers',
        buttonText: 'Sign Up',
        badgeText: 'Hurry!',
        onPress: () => console.log('Banner 3 Pressionado'),
    },
];

// Chaves para AsyncStorage
const WELCOME_COUPON_DISMISSED_KEY = '@LimpeJa:WelcomeCouponDismissed';
const WELCOME_COUPON_REDEEMED_KEY = '@LimpeJa:WelcomeCouponRedeemed';
const REFERRAL_BANNER_DISMISSED_KEY = '@LimpeJa:ReferralBannerDismissed'; // NOVO: Chave para o descarte do banner de indicação

export default function ExploreClientScreen() {
    const router = useRouter();
    const flatListRef = useRef<FlatList<BannerDataItem>>(null);
    const [currentIndex, setCurrentIndex] = useState(0);
    const { t } = useTranslation();
    const { user, isAuthenticated } = useAuth(); // Usar o hook useAuth

    const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
    const [serviceCategories, setServiceCategories] = useState<Service[]>([]);
    const [recommendations, setRecommendations] = useState<ProviderDisplayInfo[]>([]);
    const [nearbyProviders, setNearbyProviders] = useState<ProviderDisplayInfo[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);
    const [isRefreshing, setIsRefreshing] = useState(false);

    // Estados para o CouponWelcomeCard e CouponPill
    const [welcomeCouponOffer, setWelcomeCouponOffer] = useState<Offer | null>(null);
    const [showPersistentCouponPill, setShowPersistentCouponPill] = useState(false); // Renomeado para clareza
    const [showReferralSheet, setShowReferralSheet] = useState(false);

    // NOVO ESTADO: Controla qual promoção está ativa no BottomSlideInCard
    const [activeBottomPromotion, setActiveBottomPromotion] = useState<'coupon' | 'referral' | null>(null);
    const promotionTimeoutRef = useRef<NodeJS.Timeout | null>(null); // Para gerenciar o setTimeout

    const referralCode = userProfile?.referralCode || "LIMPEJA123"; // Mock de um código de referência
    const rewardReferrer = "Ganhe R$20 ou +300 pts";
    const rewardReferred = "Seu amigo ganha 20% na 1ª";

    const headerAnim = useRef(new Animated.Value(0)).current;
    const categoriesAnim = useRef(new Animated.Value(0)).current;
    const bannerAnim = useRef(new Animated.Value(0)).current;
    const recommendationsAnim = useRef(new Animated.Value(0)).current;
    const providersAnim = useRef(new Animated.Value(0)).current;
    const navBarAnim = useRef(new Animated.Value(0)).current;
    // Removido referralBannerAnim, pois agora é tratado pelo BottomSlideInCard


    // Função para buscar os dados principais da tela
    const fetchData = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const fetchedUserProfile = await getUserProfile();
            setUserProfile(fetchedUserProfile); // Isso atualiza o estado userProfile

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

            // Lógica para animações de entrada
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

    // Efeito para chamar fetchData uma vez na montagem inicial do componente
    useEffect(() => {
        fetchData();
    }, [fetchData]); // `fetchData` é uma `useCallback` com dependências estáveis, então este efeito rodará uma vez.


    // Use useFocusEffect para disparar a lógica de promoção quando a tela estiver em foco
    useFocusEffect(
        useCallback(() => {
            let cancelled = false;

            const loadAndSetPromotions = async () => {
                // Fetch offers here, as it's specific to promotions
                const offersData = await getOffers();
                const welcomeOffer = offersData.find(offer =>
                    (offer as any).target === 'NEW_CLIENTS' && (offer as any).firstBookingOnly
                );
                setWelcomeCouponOffer(welcomeOffer || null);

                if (promotionTimeoutRef.current) {
                    clearTimeout(promotionTimeoutRef.current);
                }

                // CORREÇÃO: Adicionar type assertion para unknown primeiro e depois para NodeJS.Timeout
                promotionTimeoutRef.current = setTimeout(async () => {
                    if (cancelled) return;

                    let shouldShowCoupon = false;
                    let shouldShowReferral = false;

                    // Verifica a elegibilidade do Cupom
                    // Garante que userProfile não é nulo antes de acessar suas propriedades
                    if (welcomeOffer && userProfile) { 
                        const dismissedCoupon = await AsyncStorage.getItem(WELCOME_COUPON_DISMISSED_KEY);
                        const redeemedCoupon = await AsyncStorage.getItem(WELCOME_COUPON_REDEEMED_KEY);
                        const isNewCustomer = (userProfile.clientDetails?.totalBookings || 0) === 0;
                        const isCouponExpired = welcomeOffer.validUntil ? new Date(welcomeOffer.validUntil).getTime() < Date.now() : false;

                        if (isNewCustomer && !redeemedCoupon && !isCouponExpired) {
                            if (!dismissedCoupon) {
                                shouldShowCoupon = true;
                            } else {
                                setShowPersistentCouponPill(true); // Mostra a pílula se dispensado, mas não resgatado
                            }
                        }
                    }

                    // Verifica a elegibilidade da Indicação (apenas se autenticado e tiver um código de indicação)
                    if (isAuthenticated && userProfile?.referralCode) { 
                        const dismissedReferral = await AsyncStorage.getItem(REFERRAL_BANNER_DISMISSED_KEY);
                        if (!dismissedReferral) {
                            shouldShowReferral = true;
                        }
                    }

                    // Determina qual promoção mostrar (Cupom tem prioridade)
                    if (shouldShowCoupon) {
                        setActiveBottomPromotion('coupon');
                    } else if (shouldShowReferral) {
                        setActiveBottomPromotion('referral');
                    } else {
                        setActiveBottomPromotion(null); // Nenhuma promoção para mostrar
                    }
                }, 5000) as unknown as NodeJS.Timeout; // <-- CORREÇÃO APLICADA AQUI
            };

            // Somente executa a lógica de promoções se o userProfile já estiver carregado
            // Isso evita que a lógica de promoções tente acessar userProfile antes que ele seja populado
            if (userProfile !== null) {
                loadAndSetPromotions();
            }

            return () => {
                cancelled = true;
                if (promotionTimeoutRef.current) {
                    clearTimeout(promotionTimeoutRef.current);
                }
            };
        }, [userProfile, isAuthenticated, t]) // Dependências: userProfile e isAuthenticated. `t` é estável.
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
        // Chamamos fetchData aqui para o RefreshControl.
        // A lógica de promoção será reavaliada pelo useFocusEffect quando a tela focar novamente.
        fetchData();
    }, [fetchData]);

    // Handlers para o Cupom
    const handleUseWelcomeCoupon = useCallback(async (code: string) => {
        setActiveBottomPromotion(null); // Fecha o card
        setShowPersistentCouponPill(false); // Esconde a pílula se usado
        await AsyncStorage.setItem(WELCOME_COUPON_REDEEMED_KEY, 'true'); // Marcar como resgatado
        router.push({
            pathname: CLIENT_ROUTES.SCHEDULE_SERVICE,
            params: { couponCode: code }
        } as any);
    }, [router]);

    const handleDismissWelcomeCoupon = useCallback(async () => {
        setActiveBottomPromotion(null); // Fecha o card
        setShowPersistentCouponPill(true); // Mostrar a pílula após dispensar
        await AsyncStorage.setItem(WELCOME_COUPON_DISMISSED_KEY, 'true'); // Marcar como dispensado
    }, []);

    const handleReopenWelcomeCoupon = useCallback(async () => {
        setShowPersistentCouponPill(false);
        setActiveBottomPromotion('coupon'); // Reabre o card do cupom
        // Opcional: remover a flag de dispensado se o usuário reengajar
        // await AsyncStorage.removeItem(WELCOME_COUPON_DISMISSED_KEY);
    }, []);

    // Handlers para o ReferralBanner
    const handleDismissReferralBanner = useCallback(async () => {
        setActiveBottomPromotion(null); // Fecha o card
        await AsyncStorage.setItem(REFERRAL_BANNER_DISMISSED_KEY, 'true'); // Marca como dispensado
    }, []);

    const handleShareReferral = useCallback(async () => {
        try {
            const result = await Share.share({
                message: `Use meu código de indicação ${referralCode} no LimpeJá e ganhe um desconto na sua primeira reserva!`,
                url: 'https://limpeja.com/referral', // URL para a página de indicação
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
        setShowReferralSheet(false); // Fecha a sheet após a tentativa de compartilhamento
        setActiveBottomPromotion(null); // Fecha o banner após o compartilhamento
    }, [referralCode]);

    const handleHowItWorksReferral = useCallback(() => {
        setShowReferralSheet(true);
        setActiveBottomPromotion(null); // Fecha o banner ao abrir a sheet
    }, []);


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
                        // REMOVIDO: onPress={() => router.push('/(common)/safety/panic' as any)}
                        // O DEFENSE_SOS já lida com a navegação interna ou lógica de SOS
                        style={styles.shieldIconContainer}
                    >
                        {/* O ícone de escudo agora será parte do DEFENSE_SOS se ele o incluir */}
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
                    <Animated.View style={{ opacity: headerAnim, transform: [{ translateY: headerAnim.interpolate({ inputRange: [0, 1], outputRange: [-50, 0] }) }] }}>
                        <HeaderSuperior
                            userName={userProfile?.clientDetails?.fullName || userProfile?.providerDetails?.fullName || userProfile?.fullName || t('common.user')}
                            userAddress={addressToDisplay}
                        />
                    </Animated.View>

                    {/* Categorias de Serviço Animadas */}
                    <Animated.View style={{ opacity: categoriesAnim, transform: [{ translateY: categoriesAnim.interpolate({ inputRange: [0, 1], outputRange: [-20, 0] }) }] }}>
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
                            snapToInterval={screenWidth * 0.85 + 20}
                            decelerationRate="fast"
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
                    </Animated.View>
                </View>
            </ScrollView>

            {/* NavBar Animada */}
            <Animated.View style={[styles.navBarContainer, { transform: [{ translateY: navBarAnim.interpolate({ inputRange: [0, 1], outputRange: [100, 0] }) }] }]}>
                <NavBar />
            </Animated.View>

            {/* NOVO: DEFENSE_SOS */}
            <DEFENSE_SOS />

            {/* INJEÇÃO: SmartCouponNudge (aparece sutil após 3s na rota explore) */}
            {welcomeCouponOffer && (
                <SmartCouponNudge
                    code={(welcomeCouponOffer as any).code}
                    title={welcomeCouponOffer.title}
                    subtitle={welcomeCouponOffer.description}
                    delayMs={3000}
                    throttleHours={24}
                    showOnRoutes={['/(client)/explore']}
                    onApply={handleUseWelcomeCoupon}
                />
            )}

            {/* NOVO: BottomSlideInCard para Cupom ou Indicação (FORA DO SCROLLVIEW) */}
            {/* Renderiza o cupom se activeBottomPromotion for 'coupon' */}
            <BottomSlideInCard isVisible={activeBottomPromotion === 'coupon'}>
                {welcomeCouponOffer && (
                    <HtmlCouponCard
                        code={(welcomeCouponOffer as any).code}
                        title={welcomeCouponOffer.title}
                        subtitle={welcomeCouponOffer.description}
                        expiresAt={welcomeCouponOffer.validUntil}
                        onUseNow={handleUseWelcomeCoupon}
                        onDismiss={handleDismissWelcomeCoupon}
                    />
                )}
            </BottomSlideInCard>

            {/* Renderiza o banner de indicação se activeBottomPromotion for 'referral' */}
            <BottomSlideInCard isVisible={activeBottomPromotion === 'referral'}>
                {isAuthenticated && userProfile?.referralCode && (
                    <ReferralBanner
                        code={referralCode}
                        rewardReferrer={rewardReferrer}
                        rewardReferred={rewardReferred}
                        onShare={handleShareReferral}
                        onHowItWorks={handleHowItWorksReferral}
                        onDismiss={handleDismissReferralBanner} // Passa o manipulador de descarte
                    />
                )}
            </BottomSlideInCard>

            {/* NOVO: Pílula de Cupom Persistente (usando CouponPill) */}
            {showPersistentCouponPill && activeBottomPromotion !== 'coupon' && welcomeCouponOffer && (
                <CouponPill
                    code={(welcomeCouponOffer as any).code}
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
        </View>
    );
}

const styles = StyleSheet.create({
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
    contentWrapper: {
        flexGrow: 1,
        paddingHorizontal: 1,
    },
    navBarContainer: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
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
    carouselContainer: {
        marginTop: 20,
        marginBottom: 20,
        alignItems: 'center',
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
    // Removido referralBannerStyle, pois não está mais na visualização principal
    // Removido couponCardOverlay style, pois não é mais um overlay de tela cheia
});
