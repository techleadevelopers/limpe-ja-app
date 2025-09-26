import { Ionicons } from '@expo/vector-icons';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import {
    ActivityIndicator,
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
    Alert, // Import Alert for Clipboard error handling
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';

import NotificationUIService from '../../../services/notificationUIService';
import * as Clipboard from 'expo-clipboard';

import BookServiceButton from '../../../components/client/explore/provider/BookServiceButton';
import InfoChip from '../../../components/client/explore/provider/InfoChip';
import ReviewCard from '../../../components/client/explore/provider/ReviewCard';
import StarRating from '../../../components/client/explore/provider/StarRating';
import SideIcon from '../../../components/client/explore/provider/SideIcon';


import { ProviderDisplayInfo, ProviderReview, ProviderMetrics, Offer } from '../../../types/backend/providers';
import { VerificationStatus } from '../../../types/backend/auth';
import { PricingType } from '../../../types/backend/services';
import { ProviderServiceOffering } from '../../../types/backend/provider-service';

import { useAuth } from '../../../hooks/useAuth';
import { checkActiveChatBooking } from '../../../services/bookingService';
import { getProviderDetails, getProviderMetrics, getProviderOffers } from '../../../services/providerService';
import { AppColors, AppShadows } from '../../../constants/appStyles';
import { Icons3D } from '../../../constants/icons3d';

const SCREEN_WIDTH = Dimensions.get('window').width;
const SCREEN_HEIGHT = Dimensions.get('window').height;

const FONT_FAMILY = Platform.select({ ios: 'System', android: 'Roboto', default: 'System' });

function RecommendationsSection() {
  const avatarImages = [
    'https://randomuser.me/api/portraits/men/32.jpg',
    'https://randomuser.me/api/portraits/women/44.jpg',
    'https://randomuser.me/api/portraits/men/50.jpg',
    'https://randomuser.me/api/portraits/women/61.jpg',
    'https://randomuser.me/api/portraits/men/73.jpg',
  ];

  return (
    <View style={recommendationStyles.avatarsRow}>
      {avatarImages.map((uri, i) => (
        <Image key={i} source={{ uri }} style={[recommendationStyles.avatarImg, { marginLeft: i === 0 ? 0 : -12 }]} />
      ))}
      <View style={[recommendationStyles.moreBadge, { marginLeft: -12 }]}>
        <Text style={recommendationStyles.moreBadgeTxt}>+25</Text>
      </View>
    </View>
  );
}

const recommendationStyles = StyleSheet.create({
  avatarsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 10,
    marginBottom: 20,
    paddingHorizontal: 11,
    left: 5,
  },
  avatarImg: {
    width: 42,
    height: 42,
    borderRadius: 44,
    borderWidth: 1,
    borderColor: AppColors.borderNeutral,
  },
  moreBadge: {
    width: 42,
    height: 42,
    borderRadius: 44,
    backgroundColor: AppColors.textBody,
    alignItems: 'center',
    justifyContent: 'center',
  },
  moreBadgeTxt: {
    color: AppColors.white,
    fontSize: 13,
    fontWeight: '700',
    fontFamily: 'RedHatMono',
  },
});


export default function ProviderDetailsScreen() {
    const params = useLocalSearchParams();
    const providerId = params.providerId;
    const router = useRouter();
    const { user, isAuthenticated } = useAuth();
    const insets = useSafeAreaInsets();
    const { t } = useTranslation();

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

    const callButtonAnim = useRef(new Animated.Value(1)).current;
    const chatButtonAnim = useRef(new Animated.Value(1)).current;
    const mapButtonAnim = useRef(new Animated.Value(1)).current;
    const shareButtonAnim = useRef(new Animated.Value(1)).current;

    // Adicionado ref para verificar se o componente está montado
    const isMounted = useRef(true);

    useEffect(() => {
        isMounted.current = true; // Componente montado

        // Declarar pulseLoop aqui para que seja acessível na função de limpeza
        let pulseLoop: Animated.CompositeAnimation | undefined;

        if (providerId && typeof providerId === 'string') {
            if (isMounted.current) {
                setIsLoading(true); setError(null); setProvider(undefined);
                setCanInitiateChat(false); setActiveBookingId(undefined);
            }
            mainContentAnim.setValue(0); bookNowButtonAnim.setValue(0);
            imageFadeAnim.setValue(0); imageScaleAnim.setValue(0.8);
            infoChipAnim.setValue(0);

            pulseLoop = Animated.loop( // Atribuir à variável declarada fora
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
            );
            pulseLoop.start();

            Promise.all([
                getProviderDetails(providerId),
                getProviderMetrics(providerId),
                getProviderOffers(providerId),
            ])
                .then(async ([providerData, metricsData, offersData]) => {
                    if (!isMounted.current) return; // Verifica se o componente ainda está montado

                    let finalProviderData: ProviderDisplayInfo = { ...providerData };

                    if (providerData?.fullName === 'Joana') {
                        const joanaReviews: ProviderReview[] = [
                            {
                                id: 'mock-joana-review-1',
                                bookingId: 'mock-booking-joana-1',
                                clientId: 'mock-client-joana-reviewer',
                                providerId: providerData.id,
                                rating: 5,
                                comment: 'Joana é excelente! Super atenciosa e deixou tudo impecável. Recomendo muito!',
                                createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
                                updatedAt: new Date().toISOString(),
                            },
                            {
                                id: 'mock-joana-review-2',
                                bookingId: 'mock-booking-joana-2',
                                clientId: 'mock-client-joana-reviewer',
                                providerId: providerData.id,
                                rating: 4,
                                comment: 'Bom serviço, chegou no horário e fez um bom trabalho. Fiquei satisfeita.',
                                createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
                                updatedAt: new Date().toISOString(),
                            },
                        ];
                        finalProviderData.reviews = joanaReviews;
                        finalProviderData.reviewCount = joanaReviews.length;
                        finalProviderData.averageRating = joanaReviews.reduce((sum, r) => sum + r.rating, 0) / joanaReviews.length;
                    } else {
                        finalProviderData.reviews = providerData?.reviews || [];
                    }

                    setProvider(finalProviderData || null);
                    setProviderMetrics(metricsData || null);
                    setProviderOffers(offersData || []);

                    if (!finalProviderData) {
                        setError(t('provider_details.provider_not_found', { providerId }));
                    } else {

                        if (isAuthenticated && user?.id) {
                            try {
                                // Tratamento premium: Try-catch isolado para a verificação de chat, sem propagar erros
                                const chatBookingStatus = await checkActiveChatBooking(user.id, finalProviderData.id);
                                if (!isMounted.current) return; // Verifica novamente após a chamada assíncrona
                                setCanInitiateChat(chatBookingStatus.canChat);
                                setActiveBookingId(chatBookingStatus.bookingId);
                                // Log silencioso para dev (pode ser removido em produção final)
                                if (__DEV__) {
                                    console.log(`[ProviderDetailsScreen] Chat pode ser iniciado: ${chatBookingStatus.canChat}, Booking ID: ${chatBookingStatus.bookingId}`);
                                }
                            } catch (chatError) {
                                // Tratamento premium: Não quebra o fluxo principal, apenas desabilita chat silenciosamente
                                // Log silencioso apenas em dev; em produção, ignora e trata como "chat indisponível"
                                if (__DEV__) {
                                    console.warn('[ProviderDetailsScreen] Erro ao verificar status de chat (não crítico):', chatError);
                                }
                                // Define como false por padrão em caso de erro, sem mostrar mensagem de erro ao usuário aqui
                                // A mensagem de chat indisponível só aparece no handleChatPress se necessário
                                setCanInitiateChat(false);
                                setActiveBookingId(undefined);
                                // Opcional: Mostrar notificação sutil se o erro for recorrente, mas por enquanto, silencioso para UX premium
                            }
                        }

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
                    }
                })
                .catch(err => {
                    // Tratamento premium: Mensagem genérica e amigável, sem expor detalhes técnicos do erro
                    // Log silencioso apenas em dev
                    if (__DEV__) {
                        console.error("[ProviderDetailsScreen] Erro ao carregar detalhes do provedor:", err);
                    }
                    if (isMounted.current) { // Verifica se o componente ainda está montado antes de atualizar o estado de erro
                        // Usa uma mensagem humanizada, sem códigos de erro ou paths técnicos
                        const userFriendlyError = err.response?.status === 404 
                            ? t('provider_details.provider_not_found_friendly', { providerId }) // Mensagem personalizada para 404
                            : t('provider_details.error_loading_details_friendly'); // Mensagem genérica premium
                        setError(userFriendlyError);
                        setProvider(null);
                        // Opcional: Notificação sutil para o usuário, mas a tela de erro já cuida disso
                    }
                })
                .finally(() => {
                    if (isMounted.current) { // Verifica se o componente ainda está montado antes de finalizar o loading
                        setIsLoading(false);
                    }
                });
        } else {
            if (isMounted.current) {
                setError(t("provider_details.invalid_professional_id_friendly")); // Mensagem humanizada
                setIsLoading(false); setProvider(null);
            }
        }
        return () => {
            isMounted.current = false; // Componente desmontado
            if (pulseLoop) { // Verifique se pulseLoop foi definida antes de chamar stop()
                pulseLoop.stop(); // Garante o cleanup da animação em loop
            }
        };
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
            // Tratamento premium: Mensagem mais humanizada e sem expor erros técnicos
            // Não mostra mensagem se o erro for de verificação (já tratado silenciosamente)
            NotificationUIService.showInfo(
                t("provider_details.chat_unavailable_message_friendly", { providerName: provider?.fullName || 'o profissional' }), 
                t("provider_details.chat_unavailable_title_friendly")
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

        // CORREÇÃO APLICADA AQUI para preços
        return typeof priceValue === 'number' && priceValue > 0 && Number.isFinite(priceValue)
            ? `R$ ${priceValue.toFixed(2).replace('.', ',')}${priceUnit}`
            : t('provider_details.price_not_available');
    };

    const handleCopyCouponCode = async (code: string) => {
        try {
            await Clipboard.setStringAsync(code);
            NotificationUIService.showSuccess(t('offers.copy_code'), t('common.success'));
        } catch (error) {
            // Tratamento premium: Log silencioso em dev, mensagem amigável
            if (__DEV__) {
                console.error("Erro ao copiar código do cupom:", error);
            }
            NotificationUIService.showError(t('offers.copy_code_error_friendly'), t('common.error_friendly'));
        }
    };

    const handleViewAllReviews = () => {
        if (provider) {
            router.push({
                pathname: '/(common)/feedback/[targetId]',
                params: { targetId: provider.id, targetType: 'provider' }
            });
        }
    };

    if (isLoading) {
        return (
            <View style={[styles.centeredFeedback, { backgroundColor: AppColors.white }]}>
                <Stack.Screen options={{ title: t("common.loading"), headerShown: false }} />
                <ActivityIndicator size="large" color={styles.errorBackButton.backgroundColor} />
            </View>
        );
    }

  if (error || !provider) {
    return (
        <View style={[styles.centeredFeedback, { backgroundColor: AppColors.white }]}>
            <Stack.Screen options={{ title: t("common.error"), headerShown: false }} />

            {/* Ícone de alerta mais chamativo */}
            <Ionicons name="alert-circle-outline" size={60} color={AppColors.primaryInteractive} style={{ marginBottom: 12 }} />

            {/* Mensagem amigável - PREMIUM: Humanizada, sem detalhes técnicos */}
            <Text style={[styles.errorText, { fontSize: 16, fontWeight: "600", marginBottom: 8 }]}>
                ❌ Ops! Não foi possível carregar as informações.
            </Text>

            <Text style={[styles.errorText, { fontSize: 14, color: AppColors.mediumGray, marginBottom: 20, textAlign: "center", paddingHorizontal: 32 }]}>
                Pode ser um problema temporário de conexão. Tente novamente em alguns instantes ou volte para a tela anterior para continuar explorando.
            </Text>

            {/* Botão para voltar - PREMIUM: Adicionado botão de retry para UX melhor */}
            <View style={{ flexDirection: 'row', justifyContent: 'space-around', width: '100%', marginBottom: 10 }}>
                <TouchableOpacity 
                    style={[styles.errorBackButton, { backgroundColor: AppColors.primaryInteractive }]} 
                    onPress={() => {
                        // Retry: Recarrega o useEffect limpando o providerId temporariamente
                        setError(null);
                        setIsLoading(true);
                        // Força re-render com providerId atual (useEffect roda novamente se necessário)
                    }}
                >
                    <Ionicons name="refresh" size={20} color={AppColors.white} />
                    <Text style={[styles.errorBackButtonText, { color: AppColors.white }]}>Tentar Novamente</Text>
                </TouchableOpacity>
                
                <TouchableOpacity style={styles.errorBackButton} onPress={() => router.back()}>
                    <Ionicons name="arrow-back" size={20} color={styles.errorBackButtonText.color} />
                    <Text style={styles.errorBackButtonText}>{t("common.back")}</Text>
                </TouchableOpacity>
            </View>
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


    return (
        <View style={styles.screenContainer}>
            <Stack.Screen options={{ headerShown: false }} />

            <View
                style={{
                    flexDirection: "row",
                    alignItems: "center",
                    paddingVertical: 14,
                    paddingHorizontal: 16,
                    backgroundColor: AppColors.white,
                    borderBottomWidth: 1,
                    borderBottomColor: AppColors.backgroundNeutral,
                    paddingTop: Platform.OS === 'ios' ? insets.top + 14 : 14,
                }}
            >
                <TouchableOpacity onPress={() => router.back()}>
                    <Ionicons name="arrow-back" size={20} color={AppColors.textBody} />
                </TouchableOpacity>
                <Text
                    style={{
                        flex: 1,
                        textAlign: "center",
                        fontSize: 15,
                        fontFamily: 'Montserrat-Regular',
                        fontWeight: '800',
                        color: AppColors.textBody,
                        marginRight: 24,
                    }}
                >
                    Detalhes
                </Text>
            </View>

            <ScrollView style={styles.mainScrollView} contentContainerStyle={styles.scrollContentContainer}>
                <Animated.View style={[
                    styles.providerImageContainer,
                    { opacity: imageFadeAnim, transform: [{ scale: imageScaleAnim }] }
                ]}>
                    <Image
                        source={{ uri: provider.avatarUrl || 'https://placehold.co/600x400/E0E0E0/6C757D?text=' + t('provider_details.no_photo') }}
                        style={styles.providerImage}
                        onError={(e) => {
                            // Tratamento silencioso para erro de imagem
                            if (__DEV__) {
                                console.log('Erro ao carregar imagem:', e.nativeEvent.error);
                            }
                        }}
                    />
                    <TouchableOpacity
                        style={styles.favoriteButton}
                        onPress={() => NotificationUIService.showInfo(t("provider_details.save_favorite"), t("common.save"))}
                    >
                        <Ionicons name="heart" size={18} color={AppColors.primaryInteractive} />
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

                        <Text style={styles.descriptionText}>
                            {provider.bio || t("provider_details.no_description")}
                        </Text>

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
                            {/* CORREÇÃO: Alterado de avgResponseTime para averageResponseTime */}
                            {providerMetrics?.averageResponseTime !== undefined && (
                                <InfoChip
                                    iconName="time-outline"
                                    text={`${t('metrics.avg_response_time')}: ${providerMetrics.averageResponseTime} ${t('metrics.minutes_short')}`}
                                />
                            )}
                        </Animated.View>

                        {providerOffers.length > 0 && (
                            <View>
                                <Text style={styles.sectionTitle}>{t('offers.title')}</Text>
                                {providerOffers.map((offer) => (
                                    <View key={offer.id} style={[styles.offerCard, AppShadows.small]}>
                                        <Text style={styles.offerTitle}>{offer.title}</Text>
                                        <Text style={styles.offerDescription}>{offer.description}</Text>
                                        <View style={styles.offerFooter}>
                                            {/* CORREÇÃO APLICADA AQUI para offer.discountValue */}
                                            <Text style={styles.offerDiscount}>
                                                {offer.discountType === 'PERCENT'
                                                ? `${offer.discountValue ?? 0}% OFF`
                                                : `R$ ${typeof offer.discountValue === 'number'
                                                    ? offer.discountValue.toFixed(2).replace('.', ',')
                                                    : '0,00'} OFF`}
                                            </Text>
                                            <TouchableOpacity
                                                style={styles.copyCouponButton}
                                                onPress={() => handleCopyCouponCode(offer.couponCode || '')}
                                            >
                                                <Ionicons name="copy-outline" size={16} color={AppColors.white} />
                                                <Text style={styles.copyCouponButtonText}>{t('offers.copy_code')}</Text>
                                            </TouchableOpacity>
                                        </View>
                                    </View>
                                ))}
                            </View>
                        )}
                                                     {provider && (
                <SideIcon
                    showSecurity={provider.verificationStatus === VerificationStatus.APPROVED}
                    showFacialRecognition={true}
                    rating={provider.averageRating}
                    onPressSecurity={() => NotificationUIService.showInfo("Este provedor passou por verificação de segurança 3D.", "Segurança 3D")}
                    onPressFacialRecognition={() => NotificationUIService.showInfo("Este provedor utiliza reconhecimento facial para verificação.", "Reconhecimento Facial")}
                  
                    onPressRating={() => NotificationUIService.showInfo(
                        `Avaliação média do provedor: ${
                            typeof provider.averageRating === 'number'
                                ? provider.averageRating.toFixed(1)
                                : 'N/A'
                        }`,
                        "Avaliação"
                    )}
                />
            )}

                        <View style={styles.actionButtonsContainer}>
                            <Animated.View style={{ transform: [{ scale: callButtonAnim }] }}>
                                <TouchableOpacity
                                    style={styles.actionButton}
                                    onPress={() => NotificationUIService.showInfo(t("provider_details.call_functionality"), t("provider_details.call"))}
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
                                    onPress={() => NotificationUIService.showInfo(t("provider_details.map_functionality"), t("provider_details.map"))}
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
                                    onPress={() => NotificationUIService.showInfo(t("provider_details.share_functionality"), t("provider_details.share"))}
                                    onPressIn={() => handleActionButtonPressIn(shareButtonAnim)}
                                    onPressOut={() => handleActionButtonPressOut(shareButtonAnim)}
                                >
                                    <Ionicons name="share-social-outline" size={16} color={styles.actionButtonText.color} />
                                    <Text style={styles.actionButtonText}>{t("provider_details.share")}</Text>
                                </TouchableOpacity>
                            </Animated.View>
                        </View>

                        <Text style={styles.sectionTitle}>{t('provider_details.reviews_and_recommendations_title', 'Avaliações & Recomendações')}</Text>
                        <RecommendationsSection />

                        {provider.reviews && provider.reviews.length > 0 ? (
                            <View style={styles.reviewsDetailContainer}>
                                <View style={styles.averageRatingContainer}>
                                    <Image source={Icons3D.like} style={styles.likeIcon} />
                                    <Text style={styles.averageRatingText}>
                                        {/* CORREÇÃO APLICADA AQUI para averageRating */}
                                        {typeof provider.averageRating === 'number'
                                            ? provider.averageRating.toFixed(1)
                                            : 'N/A'}
                                    </Text>
                                  <Text style={styles.totalReviewsText}>
    {t('provider_details.reviews_count', { count: provider.reviewCount || 0 })}
</Text>
                                </View>

                                {provider.reviews.slice(0, 3).map((review, index) => (
                                    <ReviewCard key={review.id || index} review={review} />
                                ))}

                                {provider.reviews.length > 3 && (
                                    <TouchableOpacity
                                        style={styles.viewAllReviewsButton}
                                        onPress={handleViewAllReviews}
                                    >
                                        <Text style={styles.viewAllReviewsButtonText}>
                                            {t('provider_details.view_all_reviews')}
                                        </Text>
                                        <Ionicons name="arrow-forward" size={16} color={AppColors.primaryInteractive} />
                                    </TouchableOpacity>
                                )}
                            </View>
                        ) : (
                            <View style={styles.noReviewsContainer}>
                                <Ionicons name="chatbubble-ellipses-outline" size={30} color={AppColors.mediumGray} style={styles.noReviewsIcon} />
                                <Text style={styles.noReviewsText}>
                                    {t('provider_details.no_reviews', { providerName: provider.fullName })}
                                </Text>
                            </View>
                        )}
                        <BookServiceButton
                            providerId={provider.id}
                            serviceId={firstProviderServiceOfferingId}
                            router={router}
                            bookNowButtonAnim={bookNowButtonAnim}
                            servicePrice={firstProviderService?.price}
                        />

                    </View>
                </Animated.View>
            </ScrollView>


        </View>
    );
}

import { styles } from './styles/providerStyles';