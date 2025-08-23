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
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { Ionicons } from '@expo/vector-icons';
import * as Location from 'expo-location';

import {
    getOffers,
    getServiceCategories,
    getUserProfile,
    searchProvidersWithLocation,
} from '../../../services/clientService';

import {
    getRecommendedProviders,
} from '../../../services/providerService';

import { Offer } from '../../../types/backend/offers';
import { ProviderDisplayInfo } from '../../../types/backend/providers';
import { Service } from '../../../types/backend/services';
import { UserProfile } from '../../../types/backend/users';

import { CLIENT_ROUTES } from '../../../constants/routes';

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
import FAB_SOS from '../../../components/client/explore/home/FAB_SOS';

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
    backgroundColorStart: string; // Mantido aqui, mas não passado para CarouselBannerItem
    backgroundColorEnd: string;   // Mantido aqui, mas não passado para CarouselBannerItem
    onPress: () => void; // Adicionado para corresponder a CarouselBannerItemProps
};

const bannerData: BannerDataItem[] = [ // Explicitamente tipado
    {
        id: '1',
        title: 'Get Special Offer',
        discount: 'Up to 40%',
        description: 'All Services Available | T&C Applied',
        buttonText: 'Claim',
        badgeText: 'Limited time!',
        backgroundColorStart: '#f5f5dc',
        backgroundColorEnd: '#deb887',
        onPress: () => console.log('Banner 1 Pressionado'), // Adicionado onPress
    },
    {
        id: '2',
        title: 'Another Great Deal',
        discount: 'Save Big!',
        description: 'On Selected Services Only',
        buttonText: 'View',
        badgeText: 'Exclusive',
        backgroundColorStart: '#e0ffff',
        backgroundColorEnd: '#afeeee',
        onPress: () => console.log('Banner 2 Pressionado'), // Adicionado onPress
    },
    {
        id: '3',
        title: 'Last Chance!',
        discount: '75% Off',
        description: 'For New Customers',
        buttonText: 'Sign Up',
        badgeText: 'Hurry!',
        backgroundColorStart: '#f0f8ff',
        backgroundColorEnd: '#e6e6fa',
        onPress: () => console.log('Banner 3 Pressionado'), // Adicionado onPress
    },
];

export default function ExploreClientScreen() {
    const router = useRouter();
    const flatListRef = useRef<FlatList<BannerDataItem>>(null); // Tipado com BannerDataItem
    const [currentIndex, setCurrentIndex] = useState(0);
    const { t } = useTranslation();

    const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
    const [serviceCategories, setServiceCategories] = useState<Service[]>([]);
    const [recommendations, setRecommendations] = useState<ProviderDisplayInfo[]>([]);
    const [nearbyProviders, setNearbyProviders] = useState<ProviderDisplayInfo[]>([]); // Corrigido para ProviderDisplayInfo[]
    const [currentOffer, setCurrentOffer] = useState<Offer | null>(null);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);
    const [isRefreshing, setIsRefreshing] = useState(false);

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
                // Correção para o Erro 3: Adicionar asserção de tipo
                providersData = await searchProvidersWithLocation({
                    latitude: locationCoords.latitude,
                    longitude: locationCoords.longitude,
                    radius: 50, // Raio de busca em km
                }) as ProviderDisplayInfo[];
            }
            setNearbyProviders(providersData);

            const offersData = await getOffers();
            if (offersData.length > 0) {
                setCurrentOffer(offersData.length > 0 ? offersData.slice(0, 1)[0] : null);
            }

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

    // Correção para o Erro do CarouselBannerItem: Passar apenas as props esperadas
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

    if (loading && !isRefreshing) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={COR_AZUL_CLARO_UNIFICADA} />
                <Text style={{ marginTop: 10 }}>{t("common.loading")}</Text>
            </View>
        );
    }

    if (error) {
        return (
            <View style={styles.loadingContainer}>
                <Text style={{ color: 'red', textAlign: 'center' }}>{error}</Text>
                <TouchableOpacity onPress={fetchData} style={{ marginTop: 20, padding: 10, backgroundColor: COR_AZUL_CLARO_UNIFICADA, borderRadius: 5 }}>
                    <Text style={{ color: '#fff' }}>{t("common.tryAgain")}</Text>
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
                        onPress={() => router.push('/(common)/safety/panic' as any)}
                        style={styles.shieldIconContainer}
                    >
                        <Ionicons name="shield-outline" size={24} color={COR_PRIMARIA_ESCURA} />
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
                        tintColor={COR_AZUL_CLARO_UNIFICADA}
                        title={t("common.loading")}
                        titleColor={COR_AZUL_CLARO_UNIFICADA}
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
                        <SecaoContainer<Service> // Explicitamente tipado para Service
                            titulo={t("search.all_categories")}
                            onVerTudoPress={() => router.push('/(client)/explore/todas-categorias' as any)}
                            data={safeServiceCategories}
                            renderItem={({ item }) => {
                                if (!item || !item.name) return null;
                                return (
                                    <CategoriaCard
                                        // A propriedade 'key' é tratada pelo SecaoContainer
                                        item={{ id: item.id, name: item.name, icon: item.icon as any }}
                                        // Removido onPress, pois CategoriaCard agora lida com a navegação internamente
                                    />
                                );
                            }}
                            horizontal={true}
                        />
                    </Animated.View>

                    {/* Novo Carrossel de Banners */}
                    <Animated.View style={[styles.carouselContainer, { opacity: bannerAnim, transform: [{ translateY: bannerAnim.interpolate({ inputRange: [0, 1], outputRange: [-20, 0] }) }] }]}>
                        <FlatList<BannerDataItem> // Tipado com BannerDataItem
                            ref={flatListRef}
                            data={bannerData}
                            renderItem={renderBannerItem}
                            keyExtractor={(item) => item.id}
                            horizontal
                            pagingEnabled
                            showsHorizontalScrollIndicator={false}
                            onViewableItemsChanged={onViewableItemsChanged}
                            viewabilityConfig={viewabilityConfig}
                            snapToInterval={screenWidth * 0.85 + 20} // Ajustado para corresponder à largura do banner + margin
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

            {/* FAB SOS */}
            <FAB_SOS />
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
});