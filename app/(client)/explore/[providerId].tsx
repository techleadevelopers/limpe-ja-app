import { Ionicons } from '@expo/vector-icons';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    Animated,
    Dimensions,
    Image,
    Platform,
    ScrollView,
    Text,
    TouchableOpacity,
    View
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

// Importações dos componentes necessários
import BookServiceButton from '../../../components/client/explore/provider/BookServiceButton';
import InfoChip from '../../../components/client/explore/provider/InfoChip'; // <-- O componente InfoChip deve ser modificado para aceitar o prop 'colors'
import ReviewCard from '../../../components/client/explore/provider/ReviewCard';
import StarRating from '../../../components/client/explore/provider/StarRating';

// Importações de dados e tipos
import { ProviderDisplayInfo, ProviderReview, ProviderServiceOffering } from '../../../types/backend/providers';
import { VerificationStatus } from '../../../types/backend/auth';
import { PricingType } from '../../../types/backend/services';

// Importação dos serviços de backend
import { useAuth } from '../../../hooks/useAuth';
import { checkActiveChatBooking } from '../../../services/bookingService';
import { getProviderDetails } from '../../../services/providerService';
import { LinearGradient } from 'expo-linear-gradient'; // Importar LinearGradient

const SCREEN_WIDTH = Dimensions.get('window').width;

export default function ProviderDetailsScreen() {
    const params = useLocalSearchParams();
    const providerId = params.providerId;
    const router = useRouter();
    const { user, isAuthenticated } = useAuth();
    const insets = useSafeAreaInsets();

    const [provider, setProvider] = useState<ProviderDisplayInfo | null | undefined>(undefined);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [canInitiateChat, setCanInitiateChat] = useState(false);
    const [activeBookingId, setActiveBookingId] = useState<string | undefined>(undefined);

    const mainContentAnim = useRef(new Animated.Value(0)).current;
    const bookNowButtonAnim = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        console.log("[ProviderDetailsScreen] useEffect - providerId recebido:", providerId);

        if (providerId && typeof providerId === 'string') {
            setIsLoading(true); setError(null); setProvider(undefined);
            setCanInitiateChat(false); setActiveBookingId(undefined);
            mainContentAnim.setValue(0); bookNowButtonAnim.setValue(0);

            getProviderDetails(providerId)
                .then(async (data) => {
                    setProvider(data || null);
                    if (!data) {
                        setError(`Profissional com ID "${providerId}" não encontrado.`);
                    } else {
                        console.log("[ProviderDetailsScreen] Dados do provedor carregados:", data);
                        console.log("[ProviderDetailsScreen] provider.providerServices:", data.providerServices);
                        console.log("[ProviderDetailsScreen] provider.providerServices.length:", data.providerServices?.length);
                        console.log("[ProviderDetailsScreen] provider.reviews:", data.reviews);

                        if (isAuthenticated && user?.id) {
                            const chatBookingStatus = await checkActiveChatBooking(user.id, data.id);
                            setCanInitiateChat(chatBookingStatus.canChat);
                            setActiveBookingId(chatBookingStatus.bookingId);
                            console.log(`[ProviderDetailsScreen] Chat pode ser iniciado: ${chatBookingStatus.canChat}, Booking ID: ${chatBookingStatus.bookingId}`);
                        }

                        Animated.stagger(150, [
                            Animated.spring(mainContentAnim, { toValue: 1, damping: 10, stiffness: 100, useNativeDriver: true }),
                            Animated.spring(bookNowButtonAnim, { toValue: 1, damping: 10, stiffness: 100, useNativeDriver: true })
                        ]).start();
                    }
                })
                .catch(err => {
                    console.error("[ProviderDetailsScreen] Erro ao carregar detalhes do provedor:", err);
                    setError(err.response?.data?.message || err.message || "Erro ao carregar os detalhes do profissional.");
                    setProvider(null);
                })
                .finally(() => setIsLoading(false));
        } else {
            setError("ID do profissional inválido."); setIsLoading(false); setProvider(null);
        }
    }, [providerId, isAuthenticated, user?.id]);

    const handleChatPress = () => {
        if (provider && user && activeBookingId) {
            router.push({
                pathname: '/(client)/messages/[chatId]',
                params: {
                    chatId: activeBookingId,
                    recipientName: provider.fullName,
                    recipientId: provider.id,
                    recipientAvatarUrl: provider.avatarUrl,
                    bookingId: activeBookingId
                }
            });
        } else {
            Alert.alert("Chat Indisponível", "O chat só pode ser iniciado para agendamentos confirmados ou em andamento.");
        }
    };

    const formatPriceDisplay = (service: ProviderServiceOffering) => {
        let priceValue;
        let priceUnit = '';

        const rawPrice = service.price;
        const price = (typeof rawPrice === 'number') ? rawPrice : (rawPrice as any)?.toNumber?.() ?? 0;

        switch (service.pricingType) {
            case PricingType.HOURLY:
                priceValue = price;
                priceUnit = '/h';
                break;
            case PricingType.BY_SIZE:
                priceValue = service.pricePerSquareMeter;
                priceUnit = '/m²';
                break;
            case PricingType.FIXED_PRICE:
            case PricingType.CUSTOM_QUOTE:
            default:
                priceValue = price;
                priceUnit = '';
                break;
        }

        return priceValue !== undefined && priceValue !== null && priceValue > 0
            ? `R$ ${priceValue.toFixed(2).replace('.', ',')}${priceUnit}`
            : 'Preço não disponível';
    };

    if (isLoading) {
        return (
            <View style={[styles.centeredFeedback, { backgroundColor: 'white' }]}>
                <Stack.Screen options={{ title: "Carregando...", headerShown: false }} />
                <ActivityIndicator size="large" color={styles.errorBackButton.backgroundColor} />
            </View>
        );
    }

    if (error || !provider) {
        return (
            <View style={[styles.centeredFeedback, { backgroundColor: 'white' }]}>
                <Stack.Screen options={{ title: "Erro", headerShown: false }} />
                <Ionicons name="warning-outline" size={48} color={styles.errorText.color} />
                <Text style={styles.errorText}>{error || `Profissional não encontrado.`}</Text>
                <TouchableOpacity style={styles.errorBackButton} onPress={() => router.back()}>
                    <Ionicons name="arrow-back" size={20} color={styles.errorBackButtonText.color} />
                    <Text style={styles.errorBackButtonText}>Voltar</Text>
                </TouchableOpacity>
            </View>
        );
    }

    const firstProviderService = provider.providerServices && provider.providerServices.length > 0
        ? provider.providerServices[0]
        : undefined;

    const firstServicePrice = firstProviderService
        ? formatPriceDisplay(firstProviderService)
        : 'Preço não disponível';

    const firstProviderServiceOfferingId = firstProviderService
        ? firstProviderService.id
        : undefined;

    console.log("[ProviderDetailsScreen] ID do serviço oferecido a ser passado para agendamento (firstProviderServiceOfferingId):", firstProviderServiceOfferingId);

    return (
        <View style={[styles.screenContainer, { backgroundColor: 'white' }]}>
            <Stack.Screen options={{
                headerTransparent: true,
                title: '',
                headerLeft: () => (
                    <TouchableOpacity
                        onPress={() => router.back()}
                        style={[styles.iconButtonBackground, { marginLeft: 15, marginTop: Platform.OS === 'ios' ? insets.top : 15 }]}
                    >
                        <Ionicons name="arrow-back" size={20} color="#FFF" />
                    </TouchableOpacity>
                ),
                headerRight: () => (
                    <TouchableOpacity
                        onPress={() => Alert.alert("Salvar", "Funcionalidade de salvar/favoritar.")}
                        style={[styles.iconButtonBackground, { marginRight: 15, marginTop: Platform.OS === 'ios' ? insets.top : 15 }]}
                    >
                        <Ionicons name="bookmark-outline" size={20} color="#FFF" />
                    </TouchableOpacity>
                ),
            }} />

            <ScrollView contentContainerStyle={styles.scrollContentContainer}>
                <View style={styles.providerImageContainer}>
                    <Image
                        source={{ uri: provider.avatarUrl || 'https://placehold.co/600x400/E0E0E0/6C757D?text=Sem+Foto' }}
                        style={styles.providerImage}
                        onError={(e) => console.log('Erro ao carregar imagem:', e.nativeEvent.error)}
                    />
                    <TouchableOpacity
                        style={styles.favoriteButton}
                        onPress={() => Alert.alert("Favoritar", "Funcionalidade de favoritar.")}
                    >
                        <Ionicons name="heart" size={18} color="#007AFF" />
                    </TouchableOpacity>
                </View>

                <Animated.View style={[
                    styles.contentArea,
                    {
                        opacity: mainContentAnim,
                        transform: [{
                            translateY: mainContentAnim.interpolate({ inputRange: [0, 1], outputRange: [40, 0] })
                        }]
                    }
                ]}>
                    <View style={styles.providerInfoWhiteCard}>
                        <View style={styles.providerNameRow}>
                            <Text style={styles.providerNameWhiteCard}>{provider.fullName}</Text>
                            <View style={styles.robustStarContainer}>
                                <StarRating rating={provider.averageRating} size={13} color={styles.priceTextWhiteCard.color} />
                                <Text style={styles.robustReviewsText}>({provider.reviewCount} avaliações)</Text>
                            </View>
                        </View>

                        <View style={styles.locationContainerWhiteCard}>
                            <Ionicons name="location-sharp" size={10} color={styles.locationTextWhiteCard.color} />
                            <Text style={styles.locationTextWhiteCard}>{provider.address?.city || 'N/A'}</Text>
                        </View>

                        <Text style={styles.priceTextWhiteCard}>{firstServicePrice}</Text>
                    </View>

                    <View style={styles.tabContentContainer}>
                        <View style={styles.infoChipsContainer}>
                            {provider.yearsOfExperience !== undefined && provider.yearsOfExperience !== null && (
                                <InfoChip
                                    iconName="hourglass-outline"
                                    text={`${provider.yearsOfExperience}+ anos`}
                                    colors={['#7694f6ff', '#67adfdff', '#5c93ecff']}
                                />
                            )}
                            {provider.verificationStatus === VerificationStatus.APPROVED && (
                                <InfoChip
                                    iconName="shield-checkmark-outline"
                                    text="Verificado"
                                    colors={['#7694f6ff', '#67adfdff', '#5c93ecff']}
                                />
                            )}
                        </View>

                        <Text style={styles.sectionTitle}>Sobre {provider.fullName.split(' ')[0]}</Text>
                        <Text style={styles.descriptionText}>{provider.bio || "Nenhuma descrição detalhada disponível."}</Text>

                        <View style={styles.actionButtonsContainer}>
                            <TouchableOpacity style={styles.actionButton} onPress={() => Alert.alert("Ligar", "Funcionalidade de ligar.")}>
                                <Ionicons name="call-outline" size={16} color={styles.actionButtonText.color} />
                                <Text style={styles.actionButtonText}>Ligar</Text>
                            </TouchableOpacity>

                            {canInitiateChat ? (
                                <TouchableOpacity style={styles.actionButton} onPress={handleChatPress}>
                                    <Ionicons name="chatbubble-outline" size={16} color={styles.actionButtonText.color} />
                                    <Text style={styles.actionButtonText}>Chat</Text>
                                </TouchableOpacity>
                            ) : (
                                <View style={[styles.actionButton, styles.disabledActionButton]}>
                                    <Ionicons name="chatbubble-outline" size={16} color={styles.disabledActionButtonText.color} />
                                    <Text style={[styles.actionButtonText, styles.disabledActionButtonText]}>Chat</Text>
                                </View>
                            )}

                            <TouchableOpacity style={styles.actionButton} onPress={() => Alert.alert("Mapa", "Funcionalidade de mapa.")}>
                                <Ionicons name="map-outline" size={16} color={styles.actionButtonText.color} />
                                <Text style={styles.actionButtonText}>Mapa</Text>
                            </TouchableOpacity>

                            <TouchableOpacity style={styles.actionButton} onPress={() => Alert.alert("Compartilhar", "Funcionalidade de compartilhar.")}>
                                <Ionicons name="share-social-outline" size={16} color={styles.actionButtonText.color} />
                                <Text style={styles.actionButtonText}>Compartilhar</Text>
                            </TouchableOpacity>
                        </View>

                        <Text style={[styles.sectionTitle, { marginTop: 12 }]}>Recomendações</Text>
                        {provider.reviews && provider.reviews.length > 0 ? (
                            provider.reviews.map((review: ProviderReview) => {
                                const transformedReview = {
                                    id: review.id,
                                    rating: review.rating,
                                    comment: review.comment || '',
                                    createdAt: review.createdAt,
                                    updatedAt: review.updatedAt,
                                    clientId: review.clientId,
                                    client: review.client ? {
                                        id: review.client.id,
                                        fullName: review.client.fullName,
                                        user: review.client.user ? {
                                            id: review.client.user.id,
                                            avatarUrl: review.client.user.avatarUrl || null,
                                        } : null,
                                    } : null,
                                    bookingId: review.bookingId,
                                    providerId: review.providerId,
                                };
                                return <ReviewCard key={review.id} review={transformedReview} />;
                            })
                        ) : (
                            <Text style={styles.noReviewsText}>Ainda não há avaliações para {provider.fullName.split(' ')[0]}.</Text>
                        )}
                        <TouchableOpacity style={[styles.addReviewButton, styles.compactAddReviewButton]}>
                            <Ionicons name="add-circle-outline" size={24} color={styles.addReviewButtonText.color} />
                        </TouchableOpacity>
                    </View>
                </Animated.View>
            </ScrollView>

            <BookServiceButton
                providerId={provider.id}
                serviceId={firstProviderServiceOfferingId}
                router={router}
                bookNowButtonAnim={bookNowButtonAnim}
            />
        </View>
    );
}

// Estilos
import { styles } from './styles/providerStyles';