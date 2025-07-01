// app/(client)/explore/[providerId].tsx
import React, { useEffect, useState, useRef } from 'react';
import {
    View,
    Text,
    ActivityIndicator,
    ScrollView,
    TouchableOpacity,
    Animated,
    Dimensions,
    Image,
    Alert // Importado Alert aqui
} from 'react-native';
import { useLocalSearchParams, Stack, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

// Importações dos componentes necessários
import HeaderSection from './components/provider/HeaderSection';
import StarRating from './components/provider/StarRating';
import InfoChip from './components/provider/InfoChip';
import ReviewCard from './components/provider/ReviewCard';
import BookServiceButton from './components/provider/BookServiceButton';

// Importações de dados e tipos
import { ProviderDisplayInfo, ProviderReview, VerificationStatus } from '../../types/backend/providers';

// Importação dos estilos
import { styles } from './styles/providerStyles'; // Importa o objeto de estilos completo

// IMPORTAR O SERVIÇO REAL DO BACKEND
import { getProviderDetails } from '../../services/providerService';
import { useAuth } from '../../../hooks/useAuth';
import { checkActiveChatBooking } from '../../services/bookingService';

const SCREEN_WIDTH = Dimensions.get('window').width;

export default function ProviderDetailsScreen() {
    const params = useLocalSearchParams<{ providerId: string }>();
    const providerId = params.providerId;
    const router = useRouter();
    const { user, isAuthenticated } = useAuth();

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

    if (isLoading) {
        return (
            <View style={styles.centeredFeedback}>
                <Stack.Screen options={{ title: "Carregando...", headerTransparent: true, headerTintColor: styles.errorText.color }} />
                <ActivityIndicator size="large" color={styles.errorBackButton.backgroundColor} />
            </View>
        );
    }

    if (error || !provider) {
        return (
            <View style={styles.centeredFeedback}>
                <Stack.Screen options={{ title: "Erro", headerTransparent: false, headerStyle: { backgroundColor: styles.screenContainer.backgroundColor }, headerTintColor: styles.errorText.color }} />
                <Ionicons name="warning-outline" size={48} color={styles.errorText.color} />
                <Text style={styles.errorText}>{error || `Profissional não encontrado.`}</Text>
                <TouchableOpacity style={styles.errorBackButton} onPress={() => router.back()}>
                    <Ionicons name="arrow-back" size={20} color={styles.errorBackButtonText.color} />
                    <Text style={styles.errorBackButtonText}>Voltar</Text>
                </TouchableOpacity>
            </View>
        );
    }

    const firstServicePrice = provider.providerServices && provider.providerServices.length > 0
        ? `R$ ${provider.providerServices[0].price.toFixed(2)}`
        : 'Preço não disponível';

    const firstProviderServiceOfferingId = provider.providerServices && provider.providerServices.length > 0
        ? provider.providerServices[0].id
        : undefined;

    console.log("[ProviderDetailsScreen] ID do serviço oferecido a ser passado para agendamento (firstProviderServiceOfferingId):", firstProviderServiceOfferingId);

    return (
        <View style={styles.screenContainer}>
            <Stack.Screen options={{
                headerTransparent: true,
                title: '',
                headerLeft: () => null,
                headerRight: () => null,
            }} />

            <HeaderSection provider={{ ...provider, avatarUrl: provider.avatarUrl || undefined }} onBackPress={() => router.back()} />

            <ScrollView contentContainerStyle={styles.scrollContentContainer}>
                <Animated.View style={[
                    styles.contentArea,
                    {
                        opacity: mainContentAnim,
                        transform: [{
                            translateY: mainContentAnim.interpolate({ inputRange: [0, 1], outputRange: [50, 0] })
                        }]
                    }
                ]}>
                    <View style={styles.providerInfoWhiteCard}>
                        <View style={styles.providerNameRow}>
                            <Text style={styles.providerNameWhiteCard}>{provider.fullName}</Text>
                            <View style={styles.robustStarContainer}>
                                <StarRating rating={provider.averageRating} size={18} color={styles.priceTextWhiteCard.color} />
                                <Text style={styles.robustReviewsText}>({provider.reviewCount} avaliações)</Text>
                            </View>
                        </View>

                        <View style={styles.locationContainerWhiteCard}>
                            <Ionicons name="location-sharp" size={15} color={styles.locationTextWhiteCard.color} />
                            <Text style={styles.locationTextWhiteCard}>{provider.address?.city || 'N/A'}</Text>
                        </View>

                        <Text style={styles.priceTextWhiteCard}>{firstServicePrice}</Text>
                    </View>

                    <View style={styles.tabContentContainer}>
                        <View style={styles.infoChipsContainer}>
                            {provider.yearsOfExperience !== undefined && (
                                <InfoChip iconName="hourglass-outline" text={`${provider.yearsOfExperience}+ anos`} />
                            )}
                            {provider.verificationStatus === VerificationStatus.APPROVED && (
                                <InfoChip iconName="shield-checkmark-outline" text="Verificado" />
                            )}
                        </View>

                        <Text style={styles.sectionTitle}>Sobre {provider.fullName.split(' ')[0]}</Text>
                        <Text style={styles.descriptionText}>{provider.bio || "Nenhuma descrição detalhada disponível."}</Text>

                        {/* Botões de Ação - Adicionando o botão de chat condicionalmente */}
                        <View style={styles.actionButtonsContainer}>
                            {/* Botão Ligar */}
                            <TouchableOpacity style={styles.actionButton} onPress={() => Alert.alert("Ligar", "Funcionalidade de ligar.")}>
                                <Ionicons name="call-outline" size={24} color="#007AFF" />
                                <Text style={styles.actionButtonText}>Ligar</Text>
                            </TouchableOpacity>

                            {/* Botão Chat - Condicional */}
                            {canInitiateChat ? (
                                <TouchableOpacity style={styles.actionButton} onPress={handleChatPress}>
                                    <Ionicons name="chatbubble-outline" size={24} color="#007AFF" />
                                    <Text style={styles.actionButtonText}>Chat</Text>
                                </TouchableOpacity>
                            ) : (
                                <View style={[styles.actionButton, styles.disabledActionButton]}>
                                    <Ionicons name="chatbubble-outline" size={24} color="#ADB5BD" />
                                    <Text style={[styles.actionButtonText, styles.disabledActionButtonText]}>Chat</Text>
                                </View>
                            )}

                            {/* Botão Mapa */}
                            <TouchableOpacity style={styles.actionButton} onPress={() => Alert.alert("Mapa", "Funcionalidade de mapa.")}>
                                <Ionicons name="map-outline" size={24} color="#007AFF" />
                                <Text style={styles.actionButtonText}>Mapa</Text>
                            </TouchableOpacity>

                            {/* Botão Compartilhar */}
                            <TouchableOpacity style={styles.actionButton} onPress={() => Alert.alert("Compartilhar", "Funcionalidade de compartilhar.")}>
                                <Ionicons name="share-social-outline" size={24} color="#007AFF" />
                                <Text style={styles.actionButtonText}>Compartilhar</Text>
                            </TouchableOpacity>
                        </View>


                        <Text style={[styles.sectionTitle, { marginTop: 15 }]}>Recomendações</Text>
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
                                            avatarUrl: review.client.user.avatarUrl || null, // Garante que avatarUrl pode ser null
                                        } : null, // <--- MUDANÇA AQUI: Passa null se review.client.user for falsy
                                    } : null,
                                    bookingId: review.bookingId,
                                    providerId: review.providerId,
                                };
                                return <ReviewCard key={review.id} review={transformedReview} />;
                            })
                        ) : (
                            <Text style={styles.noReviewsText}>Ainda não há avaliações para {provider.fullName.split(' ')[0]}.</Text>
                        )}
                        <TouchableOpacity style={styles.addReviewButton}>
                            <Ionicons name="add-circle-outline" size={20} color={styles.addReviewButtonText.color} />
                            <Text style={styles.addReviewButtonText}>Deixar uma Avaliação</Text>
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