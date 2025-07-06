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
    Alert,
    Platform // Importado Platform aqui para ajustes de safe area
} from 'react-native';
import { useLocalSearchParams, Stack, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context'; // Importado para safe area

// Importações dos componentes necessários
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
    const params = useLocalSearchParams();
    const providerId = params.providerId;
    const router = useRouter();
    const { user, isAuthenticated } = useAuth();
    const insets = useSafeAreaInsets(); // Hook para safe area

    // CORREÇÃO DE TIPAGEM: Permite que 'provider' seja ProviderDisplayInfo, null ou undefined
    const [provider, setProvider] = useState<ProviderDisplayInfo | null | undefined>(undefined);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [canInitiateChat, setCanInitiateChat] = useState(false);
    const [activeBookingId, setActiveBookingId] = useState<string | undefined>(undefined);

    const mainContentAnim = useRef(new Animated.Value(0)).current;
    const bookNowButtonAnim = useRef(new Animated.Value(0)).current;

    // Dados mockados para a mini sessão de fotos (substitua por dados reais do provedor se disponível)
    const mockPhotos = [
        'https://images.unsplash.com/photo-1549227318-c2b64d06a090?w=600&auto=format&fit=crop&q=60&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8MTR8fGxpYnJhcnl8ZW58MHx8MHx8fDA%3D',
        'https://images.unsplash.com/photo-1583485088000-332f553861ae?w=600&auto=format&fit=crop&q=60&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8MTl8fGxpYnJhcnl8ZW58MHx8MHx8fDA%3D',
        'https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=600&auto=format&fit=crop&q=60&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8NHx8b2ZmaWNlfGVufDB8fDB8fHww%3D',
        'https://images.unsplash.com/photo-1628109923889-4e782627e351?w=600&auto=format&fit=crop&q=60&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8Nnx8b2ZmaWNlJTIwY2xlYW5pb Maudie?w=600&auto=format&fit=crop&q=60&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8MTB8fG9mZmljZSUyMGNsZWFuaW5nfGVufDB8fDB8fDA%3D',
    ];


    useEffect(() => {
        console.log("[ProviderDetailsScreen] useEffect - providerId recebido:", providerId);

        if (providerId && typeof providerId === 'string') {
            setIsLoading(true); setError(null); setProvider(undefined);
            setCanInitiateChat(false); setActiveBookingId(undefined);
            mainContentAnim.setValue(0); bookNowButtonAnim.setValue(0);

            getProviderDetails(providerId)
                .then(async (data) => {
                    setProvider(data || null); // CORREÇÃO: data pode ser null se não encontrado
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
            setError("ID do profissional inválido."); setIsLoading(false); setProvider(null); // CORREÇÃO: setProvider(null)
        }
    }, [providerId, isAuthenticated, user?.id]);

    const handleChatPress = () => {
        // CORREÇÃO: Adicionada checagem para 'provider' ser não-nulo e não-indefinido
        if (provider && user && activeBookingId) {
            router.push({
                pathname: '/(client)/messages/[chatId]',
                params: {
                    chatId: activeBookingId,
                    recipientName: provider.fullName, // Acesso seguro
                    recipientId: provider.id, // Acesso seguro
                    recipientAvatarUrl: provider.avatarUrl, // Acesso seguro
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
                <Stack.Screen options={{ title: "Carregando...", headerShown: false }} /> {/* Header oculto para tela de loading */}
                <ActivityIndicator size="large" color={styles.errorBackButton.backgroundColor} />
            </View>
        );
    }

    if (error || !provider) { // Se houver erro ou provedor for null, exibe a tela de erro
        return (
            <View style={styles.centeredFeedback}>
                <Stack.Screen options={{ title: "Erro", headerShown: false }} /> {/* Header oculto para tela de erro */}
                <Ionicons name="warning-outline" size={48} color={styles.errorText.color} />
                <Text style={styles.errorText}>{error || `Profissional não encontrado.`}</Text>
                <TouchableOpacity style={styles.errorBackButton} onPress={() => router.back()}>
                    <Ionicons name="arrow-back" size={20} color={styles.errorBackButtonText.color} />
                    <Text style={styles.errorBackButtonText}>Voltar</Text>
                </TouchableOpacity>
            </View>
        );
    }

    // A partir daqui, 'provider' é garantidamente do tipo 'ProviderDisplayInfo'
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
                headerLeft: () => (
                    <TouchableOpacity
                        onPress={() => router.back()}
                        style={[styles.iconButtonBackground, { marginLeft: 20, marginTop: Platform.OS === 'ios' ? insets.top : 20 }]}
                    >
                        <Ionicons name="arrow-back" size={24} color="#FFF" />
                    </TouchableOpacity>
                ),
                headerRight: () => (
                    <TouchableOpacity
                        onPress={() => Alert.alert("Salvar", "Funcionalidade de salvar/favoritar.")}
                        style={[styles.iconButtonBackground, { marginRight: 20, marginTop: Platform.OS === 'ios' ? insets.top : 20 }]}
                    >
                        <Ionicons name="bookmark-outline" size={24} color="#FFF" />
                    </TouchableOpacity>
                ),
            }} />

            <ScrollView contentContainerStyle={styles.scrollContentContainer}>
                {/* Imagem do provedor no topo do card */}
                <View style={styles.providerImageContainer}>
                    <Image
                        source={{ uri: provider.avatarUrl || 'https://placehold.co/600x400/E0E0E0/6C757D?text=Sem+Foto' }}
                        style={styles.providerImage}
                        onError={(e) => console.log('Erro ao carregar imagem:', e.nativeEvent.error)}
                    />
                    {/* Botão de coração/favoritar na imagem */}
                    <TouchableOpacity
                        style={styles.favoriteButton}
                        onPress={() => Alert.alert("Favoritar", "Funcionalidade de favoritar.")}
                    >
                        <Ionicons name="heart" size={20} color="#007AFF" /> {/* Cor de coração vibrante */}
                    </TouchableOpacity>
                </View>

                {/* Mini sessão de fotos adicionada AQUI, AGORA ACIMA DO contentArea */}
                <View style={styles.photoSectionContainer}>
                    <View style={styles.photoSectionHeader}>
                        <Text style={styles.photoSectionTitle}>Fotos</Text>
                        {/* Rating removido conforme solicitado */}
                    </View>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.photoScrollView}>
                        {mockPhotos.map((photoUri, index) => (
                            <TouchableOpacity key={index} style={styles.thumbnailContainer} onPress={() => Alert.alert("Visualizar Foto", `Foto ${index + 1}`)}>
                                <Image source={{ uri: photoUri }} style={styles.thumbnailImage} />
                            </TouchableOpacity>
                        ))}
                    </ScrollView>
                </View>
                {/* Fim da mini sessão de fotos */}

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
                        {/* Preço em destaque */}
                        <Text style={styles.priceTextWhiteCard}>{firstServicePrice}</Text>

                        <View style={styles.providerNameRow}>
                            <Text style={styles.providerNameWhiteCard}>{provider.fullName}</Text>
                            <View style={styles.robustStarContainer}>
                                <StarRating rating={provider.averageRating} size={15} color={styles.priceTextWhiteCard.color} />
                                <Text style={styles.robustReviewsText}>({provider.reviewCount} avaliações)</Text>
                            </View>
                        </View>

                        <View style={styles.locationContainerWhiteCard}>
                            <Ionicons name="location-sharp" size={12} color={styles.locationTextWhiteCard.color} />
                            <Text style={styles.locationTextWhiteCard}>{provider.address?.city || 'N/A'}</Text>
                        </View>
                    </View>

                    <View style={styles.tabContentContainer}>
                        <View style={styles.infoChipsContainer}>
                            {/* CORREÇÃO: Acesso seguro à propriedade 'yearsOfExperience' */}
                            {provider.yearsOfExperience !== undefined && provider.yearsOfExperience !== null && (
                                <InfoChip iconName="hourglass-outline" text={`${provider.yearsOfExperience}+ anos`} />
                            )}
                            {/* CORREÇÃO: Acesso seguro à propriedade 'verificationStatus' */}
                            {provider.verificationStatus === VerificationStatus.APPROVED && (
                                <InfoChip iconName="shield-checkmark-outline" text="Verificado" />
                            )}
                        </View>

                        {/* Text "Sobre Carolina" */}
                        <Text style={styles.sectionTitle}>Sobre {provider.fullName.split(' ')[0]}</Text>
                        {/* CORREÇÃO: Acesso seguro à propriedade 'bio' */}
                        <Text style={styles.descriptionText}>{provider.bio || "Nenhuma descrição detalhada disponível."}</Text>

                        {/* Botões de Ação - Adicionando o botão de chat condicionalmente */}
                        <View style={styles.actionButtonsContainer}>
                            {/* Botão Ligar */}
                            <TouchableOpacity style={styles.actionButton} onPress={() => Alert.alert("Ligar", "Funcionalidade de ligar.")}>
                                <Ionicons name="call-outline" size={18} color={styles.actionButtonText.color} />
                                <Text style={styles.actionButtonText}>Ligar</Text>
                            </TouchableOpacity>

                            {/* Botão Chat - Condicional */}
                            {canInitiateChat ? (
                                <TouchableOpacity style={styles.actionButton} onPress={handleChatPress}>
                                    <Ionicons name="chatbubble-outline" size={18} color={styles.actionButtonText.color} />
                                    <Text style={styles.actionButtonText}>Chat</Text>
                                </TouchableOpacity>
                            ) : (
                                <View style={[styles.actionButton, styles.disabledActionButton]}>
                                    <Ionicons name="chatbubble-outline" size={18} color={styles.disabledActionButtonText.color} />
                                    <Text style={[styles.actionButtonText, styles.disabledActionButtonText]}>Chat</Text>
                                </View>
                            )}

                            {/* Botão Mapa */}
                            <TouchableOpacity style={styles.actionButton} onPress={() => Alert.alert("Mapa", "Funcionalidade de mapa.")}>
                                <Ionicons name="map-outline" size={18} color={styles.actionButtonText.color} />
                                <Text style={styles.actionButtonText}>Mapa</Text>
                            </TouchableOpacity>

                            {/* Botão Compartilhar */}
                            <TouchableOpacity style={styles.actionButton} onPress={() => Alert.alert("Compartilhar", "Funcionalidade de compartilhar.")}>
                                <Ionicons name="share-social-outline" size={18} color={styles.actionButtonText.color} />
                                <Text style={styles.actionButtonText}>Compartilhar</Text>
                            </TouchableOpacity>
                        </View>

                        <Text style={[styles.sectionTitle, { marginTop: 15 }]}>Recomendações</Text>
                        {/* CORREÇÃO: Acesso seguro à propriedade 'reviews' */}
                        {provider.reviews && provider.reviews.length > 0 ? (
                            provider.reviews.map((review: ProviderReview) => { // CORREÇÃO: Adicionada tipagem explícita para 'review'
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
                            // CORREÇÃO: Acesso seguro à propriedade 'fullName'
                            <Text style={styles.noReviewsText}>Ainda não há avaliações para {provider.fullName.split(' ')[0]}.</Text>
                        )}
                        <TouchableOpacity style={styles.addReviewButton}>
                            <Ionicons name="add-circle-outline" size={18} color={styles.addReviewButtonText.color} />
                            <Text style={styles.addReviewButtonText}>Deixar uma Avaliação</Text>
                        </TouchableOpacity>
                    </View>
                </Animated.View>
            </ScrollView>

            <BookServiceButton
                // CORREÇÃO: Acesso seguro à propriedade 'id'
                providerId={provider.id}
                serviceId={firstProviderServiceOfferingId}
                router={router}
                bookNowButtonAnim={bookNowButtonAnim}
            />
        </View>
    );
}