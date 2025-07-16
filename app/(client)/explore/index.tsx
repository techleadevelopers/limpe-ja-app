// app/(client)/explore/index.tsx
import { Stack, useRouter } from 'expo-router';
import React, { useEffect, useRef, useState, useCallback } from 'react';
import {
    Animated,
    ScrollView,
    StyleSheet,
    View,
    ActivityIndicator,
    Text,
    Alert,
    TouchableOpacity,
    FlatList,
    Dimensions, // Certifique-se de que Dimensions está importado
    Keyboard,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import {
    getServiceCategories,
    getUserProfile,
    getOffers,
} from '../../services/clientService';

import {
    getRecommendedProviders,
    getNearbyProviders,
} from '../../services/providerService';

import { Service } from '../../types/backend/services';
import { ProviderDisplayInfo } from '../../types/backend/providers';
import { Offer } from '../../types/backend/offers';
import { UserProfile } from '../../types/backend/users';
import { BookingAddress } from '../../types/backend/bookings';

import { CLIENT_ROUTES } from '../../../constants/routes';

// Importe o BannerOferta se ainda precisar dele em alguma outra parte do app,
// mas para o carrossel, estamos usando CarouselBannerItem
// import BannerOferta from '../../(client)/ofertas/components/BannerOferta';
// import DefaultBanner from '../../(client)/ofertas/components/DefaultBanner'; // Não será usado com o carrossel fixo

import HeaderSuperior from './components/home/HeaderSuperior';
import NavBar from './components/home/NavBar';
import CategoriaCard from './components/home/CategoriaCard';
import SecaoContainer from './components/home/SecaoContainer';
import SecaoPrestadores from './components/home/SecaoPrestadores';
import SecaoRecomendacoes from './components/home/SecaoRecomendacoes';
import PrestadorCard from './components/home/PrestadorCard';
import RecomendacaoCard from './components/home/RecomendacaoCard';
import CarouselBannerItem from './components/home/CarouselBannerItem'; // Importe o novo componente

const COR_AZUL_CLARO_UNIFICADA = '#A0D2EB';
const COR_PRIMARIA_ESCURA = '#2C3E50';
const COR_CINZA_FUNDO = '#F4F7FC';
const COR_BORDA_SUAVE = '#E0E0E0';

const { width: screenWidth } = Dimensions.get('window');

const bannerData = [
    {
        id: '1',
        title: 'Get Special Offer',
        discount: 'Up to 40%',
        description: 'All Services Available | T&C Applied',
        buttonText: 'Claim',
        badgeText: 'Limited time!',
        backgroundColorStart: '#f5f5dc', // Bege claro
        backgroundColorEnd: '#deb887',   // Bege
    },
    {
        id: '2',
        title: 'Another Great Deal',
        discount: 'Save Big!',
        description: 'On Selected Services Only',
        buttonText: 'View',
        badgeText: 'Exclusive',
        backgroundColorStart: '#e0ffff', // Ciano claro
        backgroundColorEnd: '#afeeee',   // Ciano pálido
    },
    {
        id: '3',
        title: 'Last Chance!',
        discount: '75% Off',
        description: 'For New Customers',
        buttonText: 'Sign Up',
        badgeText: 'Hurry!',
        backgroundColorStart: '#f0f8ff', // Alice Blue
        backgroundColorEnd: '#e6e6fa',   // Lavanda clara
    },
];

export default function ExploreClientScreen() {
    const router = useRouter();
    const flatListRef = useRef<FlatList>(null);
    const [currentIndex, setCurrentIndex] = useState(0);

    const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
    const [serviceCategories, setServiceCategories] = useState<Service[]>([]);
    const [recommendations, setRecommendations] = useState<ProviderDisplayInfo[]>([]);
    const [providers, setProviders] = useState<ProviderDisplayInfo[]>([]);
    const [currentOffer, setCurrentOffer] = useState<Offer | null>(null); // Mantido para compatibilidade, mas não usado pelo carrossel diretamente
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);

    // Animações
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

            // Removido: nameToDisplay e addressToDisplay, pois não são mais diretamente usados aqui
            // ... (restante da lógica de busca de dados)
            const categoriesData = await getServiceCategories();
            setServiceCategories(categoriesData);

            const recommendationsData = await getRecommendedProviders();
            setRecommendations(recommendationsData);

            const providersData = await getNearbyProviders();
            setProviders(providersData);

            const offersData = await getOffers();
            if (offersData.length > 0) {
                // Embora o carrossel seja fixo, mantemos a lógica de currentOffer
                // caso queira usá-la em outro lugar ou adaptar o carrossel no futuro.
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
            const errorMessage = err.message || err.response?.data?.message || "Não foi possível carregar os dados.";
            setError(errorMessage);
            Alert.alert("Erro", errorMessage);
            console.error("[ExploreClientScreen] Erro ao carregar dados:", err.response?.data || err.message);
        } finally {
            setLoading(false);
        }
    }, [headerAnim, categoriesAnim, bannerAnim, recommendationsAnim, providersAnim, navBarAnim]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const handleCategoryPress = useCallback((item: Service) => {
        router.push({
            pathname: '/(client)/explore/category-details',
            params: { id: item.id, name: item.name }
        } as any);
    }, [router]);

    const handleProviderPress = useCallback((provider: ProviderDisplayInfo) => {
        router.push(CLIENT_ROUTES.PROVIDER_DETAILS(provider.id));
    }, [router]);

    const safeServiceCategories = serviceCategories.filter((c) => c && c.name);
    const safeRecommendations = Array.isArray(recommendations)
        ? recommendations.filter((item) => item && typeof item.fullName === 'string')
        : [];
    const safeProviders = Array.isArray(providers)
        ? providers.filter((item) => item && typeof item.fullName === 'string')
        : [];

    const handleBannerPress = useCallback(() => {
        // Lógica para lidar com o clique no banner (pode navegar para uma tela de ofertas ou uma tela genérica)
        Alert.alert('Banner Pressionado', 'Você clicou em um banner! (Este é o handler do carrossel)');
        // Exemplo: router.push('/(client)/ofertas');
    }, []); // Dependência vazia para garantir que a função seja estável

    // Mantenha a viewabilityConfig fora do render ou memoizada para estabilidade
    const viewabilityConfig = useRef({
        itemVisiblePercentThreshold: 50, // 50% do item visível para ser considerado "visível"
    }).current;

    // CORREÇÃO: Envolva onViewableItemsChanged em useCallback com array de dependências vazio
    const onViewableItemsChanged = useCallback(({ viewableItems }) => {
        if (viewableItems.length > 0) {
            // viewableItems[0] representa o item mais à esquerda visível
            // Se você quer o item que está mais no centro/totalmente visível, pode ser necessário ajustar a lógica
            setCurrentIndex(viewableItems[0].index || 0);
        }
    }, []); // ARRAY DE DEPENDÊNCIAS VAZIO: Isso garante que a função onViewableItemsChanged não mude entre renders

    const renderBannerItem = useCallback(({ item }: { item: (typeof bannerData)[0] }) => (
        <CarouselBannerItem
            title={item.title}
            discount={item.discount}
            description={item.description}
            buttonText={item.buttonText}
            badgeText={item.badgeText}
            backgroundColorStart={item.backgroundColorStart}
            backgroundColorEnd={item.backgroundColorEnd}
            onPress={handleBannerPress} // Usa o handler memoizado
        />
    ), [handleBannerPress]); // Adiciona handleBannerPress como dependência do useCallback para renderBannerItem

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
    ), [currentIndex]); // Depende de currentIndex para atualizar a bolinha ativa

    if (loading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={COR_AZUL_CLARO_UNIFICADA} />
                <Text style={{ marginTop: 10 }}>Carregando dados...</Text>
            </View>
        );
    }

    if (error) {
        return (
            <View style={styles.loadingContainer}>
                <Text style={{ color: 'red', textAlign: 'center' }}>{error}</Text>
                <TouchableOpacity onPress={fetchData} style={{ marginTop: 20, padding: 10, backgroundColor: COR_AZUL_CLARO_UNIFICADA, borderRadius: 5 }}>
                    <Text style={{ color: '#fff' }}>Tentar Novamente</Text>
                </TouchableOpacity>
            </View>
        );
    }

    return (
        <View style={styles.screen}>
            <Stack.Screen options={{ headerShown: false }} />
            <ScrollView
                style={styles.scrollViewArea}
                contentContainerStyle={styles.scrollContentContainer}
                showsVerticalScrollIndicator={false}
                keyboardShouldPersistTaps="handled"
            >
                <View style={styles.contentWrapper}>
                    {/* Header Superior Animado */}
                    <Animated.View style={{ opacity: headerAnim, transform: [{ translateY: headerAnim.interpolate({ inputRange: [0, 1], outputRange: [-50, 0] }) }] }}>
                        <HeaderSuperior
                            userName={userProfile?.clientDetails?.fullName || userProfile?.providerDetails?.fullName || userProfile?.fullName || 'Usuário'}
                            userAddress={userProfile?.clientDetails?.address || userProfile?.providerDetails?.address}
                        />
                    </Animated.View>

                    {/* Barra de Busca Animada e Estilizada - REMOVIDA */}
                    {/* ... */}

                    {/* Categorias de Serviço Animadas */}
                    <Animated.View style={{ opacity: categoriesAnim, transform: [{ translateY: categoriesAnim.interpolate({ inputRange: [0, 1], outputRange: [-20, 0] }) }] }}>
                        <SecaoContainer
                            titulo="Categorias de Serviço"
                            onVerTudoPress={() => router.push('/(client)/explore/todas-categorias' as any)}
                            data={safeServiceCategories}
                            renderItem={({ item }) => {
                                if (!item || !item.name) return null;
                                return (
                                    <CategoriaCard
                                        key={item.id}
                                        item={{ id: item.id, name: item.name, icon: item.icon as any }}
                                        onPress={() => handleCategoryPress(item)}
                                    />
                                );
                            }}
                            horizontal={true}
                        />
                    </Animated.View>

                    {/* Novo Carrossel de Banners (substitui o antigo BannerOferta) */}
                    <Animated.View style={[styles.carouselContainer, { opacity: bannerAnim, transform: [{ translateY: bannerAnim.interpolate({ inputRange: [0, 1], outputRange: [-20, 0] }) }] }]}>
                        <FlatList
                            ref={flatListRef}
                            data={bannerData}
                            renderItem={renderBannerItem}
                            keyExtractor={(item) => item.id}
                            horizontal
                            pagingEnabled
                            showsHorizontalScrollIndicator={false}
                            onViewableItemsChanged={onViewableItemsChanged} // Usa a função memoizada
                            viewabilityConfig={viewabilityConfig} // Usa a configuração memoizada
                            snapToInterval={300 + 20} // Largura do item (300) + margem horizontal total (10*2 = 20)
                            decelerationRate="fast"
                        />
                        {renderPagination()}
                    </Animated.View>


                    {/* Recomendações para Você Animadas */}
                    <Animated.View style={{ opacity: recommendationsAnim, transform: [{ translateY: recommendationsAnim.interpolate({ inputRange: [0, 1], outputRange: [-20, 0] }) }] }}>
                        <SecaoRecomendacoes
                            titulo="Recomendações para Você"
                            onVerTudoPress={() => router.push('/(client)/explore/todas-recomendacoes' as any)}
                            data={safeRecommendations}
                            renderItem={({ item }) => {
                                if (!item || !item.fullName) return null;
                                return (
                                    <RecomendacaoCard
                                        key={item.id}
                                        item={{
                                          ...item,
                                          // Garantir que dados do service-details sejam renderizados
                                          profilePhoto: item.avatarUrl || item.profilePhoto,
                                          description: item.bio || item.description,
                                          yearsOfExperience: item.yearsOfExperience,
                                          basePrice: item.basePrice,
                                          serviceTypes: item.specialties || [],
                                          // NÃO incluir pixKey por segurança
                                        }}
                                    />
                                );
                            }}
                            horizontal={true}
                            noDataText="Nenhuma recomendação disponível no momento."
                        />
                    </Animated.View>

                    {/* Profissionais por Perto Animados */}
                    <Animated.View style={{ opacity: providersAnim, transform: [{ translateY: providersAnim.interpolate({ inputRange: [0, 1], outputRange: [-20, 0] }) }] }}>
                        <SecaoPrestadores
                            titulo="Profissionais por Perto"
                            onVerTudoPress={() => router.push('/(client)/explore/todos-prestadores-proximos' as any)}
                            data={safeProviders}
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
                            noDataText="Nenhum prestador disponível no momento."
                        />
                    </Animated.View>
                </View>
            </ScrollView>

            {/* NavBar Animada */}
            <Animated.View style={[styles.navBarContainer, { transform: [{ translateY: navBarAnim.interpolate({ inputRange: [0, 1], outputRange: [100, 0] }) }] }]}>
                <NavBar />
            </Animated.View>
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
        paddingHorizontal: 16,
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
        alignItems: 'center', // Centraliza o FlatList horizontalmente
    },
    pagination: {
        flexDirection: 'row',
        height: 20,
        alignItems: 'center',
        marginTop: 10, // Espaçamento entre o carrossel e os pontos
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
    // Removidos estilos relacionados à searchBarContainer, searchBar, searchIcon, searchInput, filterButton
});