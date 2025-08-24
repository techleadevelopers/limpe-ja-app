// [providerId].tsx
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
    View,
    Easing,
    StyleSheet,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import * as Clipboard from 'expo-clipboard';

// Importações dos componentes necessários
import BookServiceButton from '../../../components/client/explore/provider/BookServiceButton';
import InfoChip from '../../../components/client/explore/provider/InfoChip';
import ReviewCard from '../../../components/client/explore/provider/ReviewCard';
import StarRating from '../../../components/client/explore/provider/StarRating';

// Importações de dados e tipos
import { ProviderDisplayInfo, ProviderReview } from '../../../types/backend/providers';
import { VerificationStatus } from '../../../types/backend/auth';
import { PricingType } from '../../../types/backend/services';
import { ProviderServiceOffering } from '../../../types/backend/provider-service';
import { ProviderMetrics, Offer } from '../../../services/providerService';

// Importação dos serviços de backend
import { useAuth } from '../../../hooks/useAuth';
import { checkActiveChatBooking } from '../../../services/bookingService';
import { getProviderDetails, getProviderMetrics, getProviderOffers } from '../../../services/providerService';
import Toast from '../../../components/Toast';

const SCREEN_WIDTH = Dimensions.get('window').width;

export default function ProviderDetailsScreen() {
    const params = useLocalSearchParams();
    const providerId = params.providerId;
    const router = useRouter();
    const { user, isAuthenticated } = useAuth();
    const insets = useSafeAreaInsets();
    const { t } = useTranslation();

    // --- TODAS AS DECLARAÇÕES DE HOOKS DEVEM ESTAR AQUI NO TOPO ---
    const [provider, setProvider] = useState<ProviderDisplayInfo | null | undefined>(undefined);
    const [providerMetrics, setProviderMetrics] = useState<ProviderMetrics | null>(null);
    const [providerOffers, setProviderOffers] = useState<Offer[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [canInitiateChat, setCanInitiateChat] = useState(false);
    const [activeBookingId, setActiveBookingId] = useState<string | undefined>(undefined);

    const mainContentAnim = useRef(new Animated.Value(0)).current;
    const bookNowButtonAnim = useRef(new Animated.Value(0)).current;
    const imageFadeAnim = useRef(new Animated.Value(0)).current;
    const imageScaleAnim = useRef(new Animated.Value(0.8)).current;
    const infoChipAnim = useRef(new Animated.Value(0)).current;
    const addReviewButtonPulseAnim = useRef(new Animated.Value(1)).current;

    // Animated values for action buttons - MOVIDOS PARA O NÍVEL SUPERIOR
    const callButtonAnim = useRef(new Animated.Value(1)).current;
    const chatButtonAnim = useRef(new Animated.Value(1)).current;
    const mapButtonAnim = useRef(new Animated.Value(1)).current;
    const shareButtonAnim = useRef(new Animated.Value(1)).current;
    // --- FIM DAS DECLARAÇÕES DE HOOKS ---

    useEffect(() => {
        console.log("[ProviderDetailsScreen] useEffect - providerId recebido:", providerId);

        if (providerId && typeof providerId === 'string') {
            setIsLoading(true); setError(null); setProvider(undefined);
            setCanInitiateChat(false); setActiveBookingId(undefined);
            mainContentAnim.setValue(0); bookNowButtonAnim.setValue(0);
            imageFadeAnim.setValue(0); imageScaleAnim.setValue(0.8);
            infoChipAnim.setValue(0);

            Promise.all([
                getProviderDetails(providerId),
                getProviderMetrics(providerId),
                getProviderOffers(providerId),
            ])
                .then(async ([providerData, metricsData, offersData]) => {
                    setProvider(providerData || null);
                    setProviderMetrics(metricsData || null);
                    setProviderOffers(offersData || []);

                    if (!providerData) {
                        setError(t('provider_details.provider_not_found', { providerId }));
                    } else {
                        console.log("[ProviderDetailsScreen] Dados do provedor carregados:", providerData);
                        console.log("[ProviderDetailsScreen] provider.providerServices:", providerData.providerServices);
                        console.log("[ProviderDetailsScreen] provider.providerServices.length:", providerData.providerServices?.length);
                        console.log("[ProviderDetailsScreen] provider.reviews:", providerData.reviews);
                        console.log("[ProviderDetailsScreen] Métricas do provedor:", metricsData);
                        console.log("[ProviderDetailsScreen] Ofertas do provedor:", offersData);

                        if (isAuthenticated && user?.id) {
                            const chatBookingStatus = await checkActiveChatBooking(user.id, providerData.id);
                            setCanInitiateChat(chatBookingStatus.canChat);
                            setActiveBookingId(chatBookingStatus.bookingId);
                            console.log(`[ProviderDetailsScreen] Chat pode ser iniciado: ${chatBookingStatus.canChat}, Booking ID: ${chatBookingStatus.bookingId}`);
                        }

                        // Animações de entrada
                        Animated.parallel([
                            Animated.timing(imageFadeAnim, {
                                toValue: 1,
                                duration: 500,
                                easing: Easing.ease,
                                useNativeDriver: true,
                            }),
                            Animated.spring(imageScaleAnim, {
                                toValue: 1,
                                friction: 8,
                                tension: 100,
                                useNativeDriver: true,
                            }),
                            Animated.stagger(150, [
                                Animated.spring(mainContentAnim, { toValue: 1, damping: 10, stiffness: 100, useNativeDriver: true }),
                                Animated.spring(bookNowButtonAnim, { toValue: 1, damping: 10, stiffness: 100, useNativeDriver: true }),
                                Animated.timing(infoChipAnim, {
                                    toValue: 1,
                                    duration: 600,
                                    easing: Easing.ease,
                                    delay: 200,
                                    useNativeDriver: true,
                                }),
                            ])
                        ]).start();

                        // Animação de pulso para o botão de adicionar avaliação
                        Animated.loop(
                            Animated.sequence([
                                Animated.timing(addReviewButtonPulseAnim, {
                                    toValue: 1.05,
                                    duration: 1000,
                                    easing: Easing.inOut(Easing.ease),
                                    useNativeDriver: true,
                                }),
                                Animated.timing(addReviewButtonPulseAnim, {
                                    toValue: 1,
                                    duration: 1000,
                                    easing: Easing.inOut(Easing.ease),
                                    useNativeDriver: true,
                                }),
                            ])
                        ).start();
                    }
                })
                .catch(err => {
                    console.error("[ProviderDetailsScreen] Erro ao carregar detalhes do provedor:", err);
                    setError(err.response?.data?.message || err.message || t("provider_details.error_loading_details"));
                    setProvider(null);
                })
                .finally(() => setIsLoading(false));
        } else {
            setError(t("provider_details.invalid_professional_id"));
            setIsLoading(false); setProvider(null);
        }
    }, [providerId, isAuthenticated, user?.id, t]);

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
            Alert.alert(
                t("provider_details.chat_unavailable_title"),
                t("provider_details.chat_unavailable_message")
            );
        }
    };

    const handleActionButtonPressIn = (animValue: Animated.Value) => {
        Animated.spring(animValue, {
            toValue: 0.9,
            useNativeDriver: true,
        }).start();
    };

    const handleActionButtonPressOut = (animValue: Animated.Value) => {
        Animated.spring(animValue, {
            toValue: 1,
            friction: 3,
            tension: 40,
            useNativeDriver: true,
        }).start();
    };

    const formatPriceDisplay = (service: ProviderServiceOffering) => {
        let priceValue;
        let priceUnit = '';

        const rawPrice = service.price;
        const price = (typeof rawPrice === 'number') ? rawPrice : (rawPrice as any)?.toNumber?.() ?? 0;

        switch (service.pricingType) {
            case PricingType.HOURLY:
                priceValue = price;
                priceUnit = t('common.per_hour_short');
                break;
            case PricingType.BY_SIZE:
                priceValue = service.pricePerSquareMeter;
                priceUnit = t('common.per_sqm_short');
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
            : t('provider_details.price_not_available');
    };

    const handleCopyCouponCode = async (code: string) => {
        await Clipboard.setStringAsync(code);
        Toast.show({
            type: 'success',
            text1: t('common.success'),
            text2: t('offers.copy_code'),
        });
    };

    // --- Lógica de renderização condicional deve vir DEPOIS das declarações de Hooks ---
    if (isLoading) {
        return (
            <View style={[styles.centeredFeedback, { backgroundColor: 'white' }]}>
                <Stack.Screen options={{ title: t("common.loading"), headerShown: false }} />
                <ActivityIndicator size="large" color={styles.errorBackButton.backgroundColor} />
            </View>
        );
    }

    if (error || !provider) {
        return (
            <View style={[styles.centeredFeedback, { backgroundColor: 'white' }]}>
                <Stack.Screen options={{ title: t("common.error"), headerShown: false }} />
                <Ionicons name="warning-outline" size={48} color={styles.errorText.color} />
                <Text style={styles.errorText}>{error || t("provider_details.provider_not_found")}</Text>
                <TouchableOpacity style={styles.errorBackButton} onPress={() => router.back()}>
                    <Ionicons name="arrow-back" size={20} color={styles.errorBackButtonText.color} />
                    <Text style={styles.errorBackButtonText}>{t("common.back")}</Text>
                </TouchableOpacity>
            </View>
        );
    }

    const firstProviderService = provider.providerServices && provider.providerServices.length > 0
        ? provider.providerServices[0]
        : undefined;

    const firstServicePrice = firstProviderService
        ? formatPriceDisplay(firstProviderService)
        : t('provider_details.price_not_available');

    const firstProviderServiceOfferingId = firstProviderService
        ? firstProviderService.id
        : undefined;

    console.log("[ProviderDetailsScreen] ID do serviço oferecido a ser passado para agendamento (firstProviderServiceOfferingId):", firstProviderServiceOfferingId);
    console.log("[ProviderDetailsScreen] Preço do serviço a ser passado:", firstProviderService?.price);


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
                        onPress={() => Alert.alert(t("common.save"), t("provider_details.save_favorite"))}
                        style={[styles.iconButtonBackground, { marginRight: 15, marginTop: Platform.OS === 'ios' ? insets.top : 15 }]}
                    >
                        <Ionicons name="bookmark-outline" size={20} color="#FFF" />
                    </TouchableOpacity>
                ),
            }} />

            <ScrollView contentContainerStyle={styles.scrollContentContainer}>
                <Animated.View style={[
                    styles.providerImageContainer,
                    { opacity: imageFadeAnim, transform: [{ scale: imageScaleAnim }] }
                ]}>
                    <Image
                        source={{ uri: provider.avatarUrl || 'https://placehold.co/600x400/E0E0E0/6C757D?text=' + t('provider_details.no_photo') }}
                        style={styles.providerImage}
                        onError={(e) => console.log('Erro ao carregar imagem:', e.nativeEvent.error)}
                    />
                    <TouchableOpacity
                        style={styles.favoriteButton}
                        onPress={() => Alert.alert(t("common.save"), t("provider_details.save_favorite"))}
                    >
                        <Ionicons name="heart" size={18} color="#007AFF" />
                    </TouchableOpacity>
                </Animated.View>

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
                                <Text style={styles.robustReviewsText}>{t('provider_details.reviews_count', { count: provider.reviewCount || 0 })}</Text>
                            </View>
                        </View>

                        <View style={styles.locationContainerWhiteCard}>
                            <Ionicons name="location-sharp" size={10} color={styles.locationTextWhiteCard.color} />
                            <Text style={styles.locationTextWhiteCard}>{provider.address?.city || 'N/A'}</Text>
                        </View>

                        <Text style={styles.priceTextWhiteCard}>{firstServicePrice}</Text>
                    </View>

                    <View style={styles.tabContentContainer}>
                        <Animated.View style={[
                            styles.infoChipsContainer,
                            { opacity: infoChipAnim, transform: [{ translateY: infoChipAnim.interpolate({ inputRange: [0, 1], outputRange: [20, 0] }) }] }
                        ]}>
                            {provider.yearsOfExperience !== undefined && provider.yearsOfExperience !== null && (
                                <InfoChip
                                    iconName="hourglass-outline"
                                    text={t('provider_details.years_experience', { count: provider.yearsOfExperience })}
                                />
                            )}
                            {provider.verificationStatus === VerificationStatus.APPROVED && (
                                <InfoChip
                                    iconName="shield-checkmark-outline"
                                    text={t('provider_details.verified')}
                                />
                            )}
                            {providerMetrics?.acceptanceRate !== undefined && (
                                <InfoChip
                                    iconName="checkmark-done-circle-outline"
                                    text={`${t('metrics.acceptance_rate')}: ${providerMetrics.acceptanceRate}%`}
                                />
                            )}
                            {providerMetrics?.avgResponseTime !== undefined && (
                                <InfoChip
                                    iconName="time-outline"
                                    text={`${t('metrics.avg_response_time')}: ${providerMetrics.avgResponseTime} ${t('metrics.minutes_short')}`}
                                />
                            )}
                        </Animated.View>

                        <Text style={styles.sectionTitle}>{t('provider_details.about_provider', { providerName: provider.fullName.split(' ')[0] })}</Text>
                        <Text style={styles.descriptionText}>{provider.bio || t('provider_details.no_description')}</Text>

                        {providerOffers.length > 0 && (
                            <View>
                                <Text style={styles.sectionTitle}>{t('offers.title')}</Text>
                                {providerOffers.map((offer) => (
                                    <View key={offer.id} style={styles.offerCard}>
                                        <Text style={styles.offerTitle}>{offer.title}</Text>
                                        <Text style={styles.offerDescription}>{offer.description}</Text>
                                        <View style={styles.offerFooter}>
                                            <Text style={styles.offerDiscount}>
                                                {offer.discountType === 'PERCENT' ? `${offer.discountValue}% OFF` : `R$ ${offer.discountValue.toFixed(2).replace('.', ',')} OFF`}
                                            </Text>
                                            <TouchableOpacity
                                                style={styles.copyCouponButton}
                                                onPress={() => handleCopyCouponCode(offer.couponCode || '')}
                                            >
                                                <Ionicons name="copy-outline" size={16} color="#FFF" />
                                                <Text style={styles.copyCouponButtonText}>{t('offers.copy_code')}</Text>
                                            </TouchableOpacity>
                                        </View>
                                    </View>
                                ))}
                            </View>
                        )}


                        <View style={styles.actionButtonsContainer}>
                            <Animated.View style={{ transform: [{ scale: callButtonAnim }] }}>
                                <TouchableOpacity
                                    style={styles.actionButton}
                                    onPress={() => Alert.alert(t("provider_details.call"), t("provider_details.call_functionality"))}
                                    onPressIn={() => handleActionButtonPressIn(callButtonAnim)}
                                    onPressOut={() => handleActionButtonPressOut(callButtonAnim)}
                                >
                                    <Ionicons name="call-outline" size={16} color={styles.actionButtonText.color} />
                                    <Text style={styles.actionButtonText}>{t("provider_details.call")}</Text>
                                </TouchableOpacity>
                            </Animated.View>

                            <Animated.View style={{ transform: [{ scale: chatButtonAnim }] }}>
                                {canInitiateChat ? (
                                    <TouchableOpacity
                                        style={styles.actionButton}
                                        onPress={handleChatPress}
                                        onPressIn={() => handleActionButtonPressIn(chatButtonAnim)}
                                        onPressOut={() => handleActionButtonPressOut(chatButtonAnim)}
                                    >
                                        <Ionicons name="chatbubble-outline" size={16} color={styles.actionButtonText.color} />
                                        <Text style={styles.actionButtonText}>{t("provider_details.chat")}</Text>
                                    </TouchableOpacity>
                                ) : (
                                    <View style={[styles.actionButton, styles.disabledActionButton]}>
                                        <Ionicons name="chatbubble-outline" size={16} color={styles.disabledActionButtonText.color} />
                                        <Text style={[styles.actionButtonText, styles.disabledActionButtonText]}>{t("provider_details.chat")}</Text>
                                    </View>
                                )}
                            </Animated.View>

                            <Animated.View style={{ transform: [{ scale: mapButtonAnim }] }}>
                                <TouchableOpacity
                                    style={styles.actionButton}
                                    onPress={() => Alert.alert(t("provider_details.map"), t("provider_details.map_functionality"))}
                                    onPressIn={() => handleActionButtonPressIn(mapButtonAnim)}
                                    onPressOut={() => handleActionButtonPressOut(mapButtonAnim)}
                                >
                                    <Ionicons name="map-outline" size={16} color={styles.actionButtonText.color} />
                                    <Text style={styles.actionButtonText}>{t("provider_details.map")}</Text>
                                </TouchableOpacity>
                            </Animated.View>

                            <Animated.View style={{ transform: [{ scale: shareButtonAnim }] }}>
                                <TouchableOpacity
                                    style={styles.actionButton}
                                    onPress={() => Alert.alert(t("provider_details.share"), t("provider_details.share_functionality"))}
                                    onPressIn={() => handleActionButtonPressIn(shareButtonAnim)}
                                    onPressOut={() => handleActionButtonPressOut(shareButtonAnim)}
                                >
                                    <Ionicons name="share-social-outline" size={16} color={styles.actionButtonText.color} />
                                    <Text style={styles.actionButtonText}>{t("provider_details.share")}</Text>
                                </TouchableOpacity>
                            </Animated.View>
                        </View>

                        <Text style={[styles.sectionTitle, { marginTop: 12 }]}>{t("provider_details.recommendations")}</Text>
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
                            <View style={styles.noReviewsContainer}>
                                <Ionicons name="chatbubbles-outline" size={60} color={styles.noReviewsText.color} style={styles.noReviewsIcon} />
                                <Text style={styles.noReviewsText}>
                                    {t('provider_details.no_reviews', { providerName: provider.fullName.split(' ')[0] })}
                                    {'\n'}
                                    {t('provider_details.be_the_first_review')}
                                </Text>
                            </View>
                        )}
                        <Animated.View style={{ transform: [{ scale: addReviewButtonPulseAnim }] }}>
                            <TouchableOpacity style={styles.addReviewButton}>
                                <Ionicons name="add-circle-outline" size={24} color={styles.addReviewButtonText.color} />
                                <Text style={styles.addReviewButtonText}>{t('provider_details.add_review')}</Text>
                            </TouchableOpacity>
                        </Animated.View>
                    </View>
                </Animated.View>
            </ScrollView>

            <BookServiceButton
                providerId={provider.id}
                serviceId={firstProviderServiceOfferingId}
                router={router}
                bookNowButtonAnim={bookNowButtonAnim}
                servicePrice={firstProviderService?.price}
            />
        </View>
    );
}

// Estilos importados do arquivo providerStyles.ts
import { styles } from './styles/providerStyles';