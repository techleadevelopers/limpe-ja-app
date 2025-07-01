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
    // TextInput, // Removido para a barra de busca
    Keyboard, // Adicionado para esconder o teclado
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

import BannerOferta from '../../(client)/ofertas/components/BannerOferta';
import HeaderSuperior from './components/home/HeaderSuperior';
import NavBar from './components/home/NavBar';
import CategoriaCard from './components/home/CategoriaCard';
import SecaoContainer from './components/home/SecaoContainer';
import SecaoPrestadores from './components/home/SecaoPrestadores';
import SecaoRecomendacoes from './components/home/SecaoRecomendacoes';
import PrestadorCard from './components/home/PrestadorCard';
import RecomendacaoCard from './components/home/RecomendacaoCard';

const COR_AZUL_CLARO_UNIFICADA = '#A0D2EB';
const COR_PRIMARIA_ESCURA = '#2C3E50';
const COR_CINZA_FUNDO = '#F4F7FC';
const COR_BORDA_SUAVE = '#E0E0E0';

export default function ExploreClientScreen() {
    const router = useRouter();

    const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
    const [serviceCategories, setServiceCategories] = useState<Service[]>([]);
    const [recommendations, setRecommendations] = useState<ProviderDisplayInfo[]>([]);
    const [providers, setProviders] = useState<ProviderDisplayInfo[]>([]);
    const [currentOffer, setCurrentOffer] = useState<Offer | null>(null);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);
    // const [searchText, setSearchText] = useState<string>(''); // Removido: Estado para o texto da busca

    // Animações
    const headerAnim = useRef(new Animated.Value(0)).current;
    // const searchBarAnim = useRef(new Animated.Value(0)).current; // Removido: Animação para a barra de busca
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

            let nameToDisplay = 'Usuário';
            let addressToDisplay: BookingAddress | null | undefined = undefined;

            if (fetchedUserProfile) {
                if (fetchedUserProfile.role === 'CLIENT' && fetchedUserProfile.clientDetails) {
                    nameToDisplay = fetchedUserProfile.clientDetails.fullName || fetchedUserProfile.fullName || 'Cliente';
                    addressToDisplay = fetchedUserProfile.clientDetails.address;
                } else if (fetchedUserProfile.role === 'PROVIDER' && fetchedUserProfile.providerDetails) {
                    nameToDisplay = fetchedUserProfile.providerDetails.fullName || fetchedUserProfile.fullName || 'Provedor';
                    addressToDisplay = fetchedUserProfile.providerDetails.address;
                }
            }

            const categoriesData = await getServiceCategories();
            setServiceCategories(categoriesData);

            // Chamadas para obter dados de provedores
            const recommendationsData = await getRecommendedProviders();
            setRecommendations(recommendationsData);

            const providersData = await getNearbyProviders();
            setProviders(providersData);

            const offersData = await getOffers();
            if (offersData.length > 0) {
                setCurrentOffer(offersData[0]);
            }

            // Sequência de animações com um pequeno atraso e tipo spring para fluidez
            Animated.sequence([
                Animated.spring(headerAnim, { toValue: 1, damping: 10, stiffness: 100, useNativeDriver: true }),
                Animated.delay(50),
                // Animated.spring(searchBarAnim, { toValue: 1, damping: 10, stiffness: 100, useNativeDriver: true }), // Removido
                // Animated.delay(50), // Removido
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
    }, [headerAnim, categoriesAnim, bannerAnim, recommendationsAnim, providersAnim, navBarAnim]); // searchBarAnim removido

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

    // const handleSearch = () => { // Removido
    // Keyboard.dismiss();
    // Alert.alert("Busca", `Buscando por: "${searchText}"`);
    // };

    // const handleFilter = () => { // Removido
    // Alert.alert("Filtro", "Abrir opções de filtro.");
    // };

    const safeServiceCategories = serviceCategories.filter((c) => c && c.name);
    const safeRecommendations = Array.isArray(recommendations)
        ? recommendations.filter((item) => item && typeof item.fullName === 'string')
        : [];
    const safeProviders = Array.isArray(providers)
        ? providers.filter((item) => item && typeof item.fullName === 'string')
        : [];

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
                    {/*
                    <Animated.View style={[styles.searchBarContainer, { opacity: searchBarAnim, transform: [{ translateY: searchBarAnim.interpolate({ inputRange: [0, 1], outputRange: [-20, 0] }) }] }]}>
                        <View style={styles.searchBar}>
                            <Ionicons name="search" size={20} color="#888" style={styles.searchIcon} />
                            <TextInput
                                style={styles.searchInput}
                                placeholder="Busque por serviço ou profissional..."
                                placeholderTextColor="#888"
                                value={searchText}
                                onChangeText={setSearchText}
                                returnKeyType="search"
                                onSubmitEditing={handleSearch}
                            />
                            <TouchableOpacity onPress={handleFilter} style={styles.filterButton}>
                                <Ionicons name="options-outline" size={24} color={COR_PRIMARIA_ESCURA} />
                            </TouchableOpacity>
                        </View>
                    </Animated.View>
                    */}

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

                    {/* Banner de Oferta Animado */}
                    {currentOffer && (
                        <Animated.View style={{ opacity: bannerAnim, transform: [{ translateY: bannerAnim.interpolate({ inputRange: [0, 1], outputRange: [-20, 0] }) }] }}>
                            <BannerOferta
                                id={currentOffer.id}
                                title={currentOffer.title}
                                description={currentOffer.description}
                                imageUrl={currentOffer.imageUrl || null}
                                discountPercentage={currentOffer.discountPercentage || 0}
                                onPress={() => router.push({
                                    pathname: '/(client)/ofertas/[id]',
                                    params: { id: currentOffer.id }
                                } as any)}
                            />
                        </Animated.View>
                    )}

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
                                        item={item}
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
    // Removidos estilos relacionados à searchBarContainer, searchBar, searchIcon, searchInput, filterButton
    // searchBarContainer: {
    //     paddingVertical: 10,
    //     marginTop: 10,
    // },
    // searchBar: {
    //     flexDirection: 'row',
    //     alignItems: 'center',
    //     backgroundColor: '#fff',
    //     borderRadius: 12,
    //     paddingHorizontal: 15,
    //     paddingVertical: 10,
    //     shadowColor: "#000",
    //     shadowOffset: {
    //         width: 0,
    //         height: 3,
    //     },
    //     shadowOpacity: 0.08,
    //     shadowRadius: 6,
    //     elevation: 5,
    //     borderWidth: 1,
    //     borderColor: COR_BORDA_SUAVE,
    // },
    // searchIcon: {
    //     marginRight: 10,
    // },
    // searchInput: {
    //     flex: 1,
    //     fontSize: 16,
    //     color: COR_PRIMARIA_ESCURA,
    // },
    // filterButton: {
    //     marginLeft: 10,
    //     padding: 5,
    // },
});