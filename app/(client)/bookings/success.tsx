// LimpeJaApp/app/(client)/bookings/success.tsx
import { BlurView } from 'expo-blur';
import * as Calendar from 'expo-calendar';
import * as Clipboard from 'expo-clipboard';
import { LinearGradient } from 'expo-linear-gradient';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
    Animated,
    ColorValue,
    Dimensions,
    Easing,
    Platform,
    ScrollView,
    StyleSheet,
    View,
    Text,
    TouchableOpacity
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context'; // Fix: Import para safe areas iOS

// Import NotificationUIService
import NotificationUIService from '../../../services/notificationUIService';

// Importar componentes refatorados
import BookingSummaryCard from '../../../components/client/booking/success/BookingSummaryCard';
import MainActionButtons from '../../../components/client/booking/success/MainActionButtons';
import SuccessHeader from '../../../components/client/booking/success/SuccessHeader';
import SuccessLoadingError from '../../../components/client/booking/success/SuccessLoadingError';
import ImmediateActionButtons from '../../../components/client/booking/success/ImmediateActionButtons';
import SecurityInfoSection from '../../../components/client/booking/success/SecurityInfoSection';
import LoyaltyTeaserSection from '../../../components/client/booking/success/LoyaltyTeaserSection';
import { ReturnCouponCard } from '../../../components/coupons/ReturnCouponCard'; // CORREÇÃO: Importar com chaves, pois é exportação nomeada

// IMPORTANTE: Adicione a interface de props para MissionReminderCard aqui ou no arquivo do componente
interface MissionReminderCardProps {
    missionId: string;
    title: string;
    description?: string;
    deadlineAt: string;
    reward: { kind: 'COUPON' | 'POINTS'; value: number; };
    onGo: () => void;
    onDismiss: () => void;
}
// Assumindo que MissionReminderCard é um componente React.FC
const MissionReminderCard: React.FC<MissionReminderCardProps> = ({ missionId, title, description, deadlineAt, reward, onGo, onDismiss }) => {
    // ✅ Estilo premium para o card: fundo branco, bordas arredondadas, sombra suave
    const cardContainerStyle = {
        backgroundColor: AppColors.white || '#FFFFFF',
        borderRadius: 18,
        padding: 16,
        marginHorizontal: 18,
        marginBottom: 12, // Gap interno para premium feel
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.06,
        shadowRadius: 12,
        elevation: 3, // Sombra sutil no Android
    };

    // ✅ Tipografia iOS-like: pesos variados para hierarchy
    const cardTitleStyle = {
        fontFamily: 'Montserrat-SemiBold', // Título: SemiBold
        fontSize: 16,
        color: AppColors.textBody || '#000000',
    };

    const cardSubtitleStyle = {
        fontFamily: 'Montserrat-Regular', // Texto: Regular
        fontSize: 14,
        color: '#666666', // ✅ Fallback para textSecondary (cinza médio, premium e legível)
    };

    const actionButtonStyle = {
        marginTop: 10,
        backgroundColor: AppColors.successStandard, // Usando cor de sucesso premium
        padding: 12,
        borderRadius: 12, // Bordas mais arredondadas
        fontFamily: 'Montserrat-Medium', // Ações: Medium
    };

    const dismissButtonStyle = {
        marginTop: 8,
        padding: 12,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#E5E5E5', // ✅ Fallback para borderLight (borda clara e sutil)
        fontFamily: 'Montserrat-Medium', // Ações: Medium
    };

    const textStyle = {
        fontSize: 12,
        color: '#666666', // ✅ Fallback para textSecondary (prazo e recompensa: cinza médio)
        fontFamily: 'Montserrat-Regular', // Texto secundário: Regular
    };

    const actionTextStyle = {
        color: AppColors.white || '#FFFFFF',
        textAlign: 'center' as const, // ✅ Fix TS: Literal 'center' para compatibilidade com TextStyle
        fontSize: 14,
        fontFamily: 'Montserrat-Medium', // Texto de ação: Medium
    };

    const dismissTextStyle = {
        textAlign: 'center' as const, // ✅ Fix TS: Literal 'center' para compatibilidade com TextStyle
        color: '#666666', // ✅ Fallback para textSecondary (consistente e sutil no dismiss)
        fontSize: 14,
        fontFamily: 'Montserrat-Medium', // Texto de dismiss: Medium
    };

    // Adicionado maxFontSizeMultiplier para acessibilidade
    return (
        <View style={cardContainerStyle}>
            <Text style={cardTitleStyle} maxFontSizeMultiplier={1.2}>{title}</Text>
            {description && <Text style={cardSubtitleStyle} maxFontSizeMultiplier={1.2}>{description}</Text>}
            <Text style={textStyle} maxFontSizeMultiplier={1.2}>Prazo: {new Date(deadlineAt).toLocaleDateString()}</Text>
            <Text style={textStyle} maxFontSizeMultiplier={1.2}>Recompensa: {reward.value} {reward.kind}</Text>
            <TouchableOpacity onPress={onGo} style={actionButtonStyle}>
                <Text style={actionTextStyle} maxFontSizeMultiplier={1.2}>Ir agora</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={onDismiss} style={dismissButtonStyle}>
                <Text style={dismissTextStyle} maxFontSizeMultiplier={1.2}>Dispensar</Text>
            </TouchableOpacity>
        </View>
    );
};

// Importar serviços e tipagens
import { getBookingDetails } from '../../../services/bookingService';
import { getProviderDetails } from '../../../services/providerService';
import { BookingDetails } from '../../../types/backend/bookings';
import { ProviderDisplayInfo } from '../../../types/backend/providers';

// NOVO: Importar serviços e tipagens para PIX
import { useAuth } from '../../../hooks/useAuth';
import { createPixCharge } from '../../../services/paymentService';
import { CreatePixChargeDto, PixChargeResponseDto } from '../../../types/backend/payments';

// Importar a lógica de formatação de endereço
import { formatAddressLine1, formatAddressLine2 } from '../../../utils/address';

// Import AppStyles
import { AppColors, AppDurations, AppOffsets, AppShadows, AppTypography, SCREEN_WIDTH, SCREEN_HEIGHT } from '../../../constants/appStyles';

// Importar utilitários de formatação e normalização
import { formatPriceBRL, formatDateTime, sanitizeText } from '../../../utils/formatters';
import { normalizeBooking, normalizeProvider, normalizeUser } from '../../../utils/normalize';

const headerPrimaryColor = AppColors.primaryInteractive;
const headerSecondaryColor = AppColors.primaryDark;
const iconColor = AppColors.primaryInteractive;
const successColor = AppColors.successStandard;

// ✅ Polimento do gradiente: 3 cores mais suaves, transparência menor para clean look
const backgroundGradientColors: readonly [ColorValue, ColorValue, ColorValue] = [
    AppColors.backgroundLight,
    AppColors.primaryInteractive + '25',
    AppColors.backgroundLight,
];

const abstractBlobColors: readonly [ColorValue, ColorValue, ColorValue] = [
    AppColors.primaryInteractive + '40',
    AppColors.primaryInteractive + '15',
    AppColors.primaryInteractive + '05',
];

export default function SuccessScreen() {
    const { bookingId, paymentMethod, totalPrice: totalPriceParam, couponApplied, couponCode: appliedCouponCode } = useLocalSearchParams<{ bookingId?: string; paymentMethod?: string; totalPrice?: string; couponApplied?: string; couponCode?: string }>();
    const router = useRouter();
    const { user } = useAuth();

    const [booking, setBooking] = useState<BookingDetails | null>(null);
    const [provider, setProvider] = useState<ProviderDisplayInfo | null>(null);
    const [providerRating, setProviderRating] = useState<number | undefined>(undefined);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [pixChargeDetails, setPixChargeDetails] = useState<PixChargeResponseDto | null>(null);
    const [pixGenerationError, setPixGenerationError] = useState<string | null>(null);

    const [showReturnCouponCard, setShowReturnCouponCard] = useState(false);
    const [returnCouponDetails, setReturnCouponDetails] = useState<{ code: string; title: string; subtitle: string; expiresAt: Date } | null>(null); // expiresAt é Date

    const [showMissionReminderCard, setShowMissionReminderCard] = useState(false);

    const contentOpacity = useRef(new Animated.Value(0)).current;
    const contentTranslateY = useRef(new Animated.Value(50)).current;

    const blobTranslateY = useRef(new Animated.Value(0)).current;
    const blobScale = useRef(new Animated.Value(1)).current;
    const blobRotate = useRef(new Animated.Value(0)).current;

    // Adicionado ref para verificar se o componente está montado
    const isMounted = useRef(true);

    const animateBlob = useCallback(() => {
        const blobLoop = Animated.loop(
            Animated.parallel([
                Animated.timing(blobTranslateY, {
                    toValue: -20,
                    duration: 4000,
                    easing: Easing.inOut(Easing.ease),
                    useNativeDriver: true,
                }),
                Animated.timing(blobScale, {
                    toValue: 1.1,
                    duration: 4000,
                    easing: Easing.inOut(Easing.ease),
                    useNativeDriver: true,
                }),
                Animated.timing(blobRotate, {
                    toValue: 1,
                    duration: 10000,
                    easing: Easing.linear,
                    useNativeDriver: true,
                }),
            ])
        );
        blobLoop.start();
        return blobLoop; // Retorna a animação para cleanup
    }, [blobTranslateY, blobScale, blobRotate]);

    useEffect(() => {
        isMounted.current = true; // Define como montado
        const blobAnimation = animateBlob();
        return () => {
            isMounted.current = false; // Define como desmontado no cleanup
            blobAnimation.stop(); // Cleanup da animação
        };
    }, [animateBlob]);

    const fetchBookingAndProviderDetails = useCallback(async () => {
        console.log("[SuccessScreen] fetchBookingAndProviderDetails - Iniciando fetch.");

        if (!bookingId) {
            if (isMounted.current) {
                setError("ID do agendamento não fornecido.");
                setIsLoading(false);
            }
            return;
        }
        if (!user?.id) {
            if (isMounted.current) {
                setError("Usuário não autenticado ou ID de usuário ausente.");
                setIsLoading(false);
            }
            return;
        }

        if (isMounted.current) {
            setIsLoading(true);
            setError(null);
            setPixGenerationError(null);
        }

        try {
            const rawBooking = await getBookingDetails(bookingId);
            if (!isMounted.current) return;
            const fetchedBooking = normalizeBooking(rawBooking); // Normaliza o booking
            setBooking(fetchedBooking);
            console.log("[SuccessScreen] fetchBookingAndProviderDetails - Booking real carregado:", fetchedBooking);

            if (fetchedBooking?.providerId) {
                const rawProvider = await getProviderDetails(fetchedBooking.providerId);
                if (!isMounted.current) return;
                const providerDetails = normalizeProvider(rawProvider); // Normaliza o provedor
                setProvider(providerDetails);
                setProviderRating(providerDetails.averageRating ?? undefined);
                console.log("[SuccessScreen] fetchBookingAndProviderDetails - Detalhes do provedor carregados para rating.");
            }

            if (paymentMethod === 'PIX' && totalPriceParam && !pixChargeDetails) {
                const amount = Number(totalPriceParam); // Converte para número de forma segura
                console.log("[SuccessScreen] fetchBookingAndProviderDetails - Tentando gerar PIX. Amount:", amount);

                if (isNaN(amount) || amount <= 0) {
                    if (isMounted.current) {
                        setPixGenerationError("Valor total inválido para gerar o PIX.");
                    }
                    console.error("[SuccessScreen] fetchBookingAndProviderDetails - Erro: Valor total é NaN ou <= 0.");
                    return;
                }

                try {
                    const pixChargeData: CreatePixChargeDto = {
                        amount: amount,
                        description: sanitizeText(`Agendamento ${fetchedBooking.serviceName || 'Serviço'} com ${fetchedBooking.providerFullName}`),
                        bookingId: fetchedBooking.id,
                        providerId: fetchedBooking.providerId,
                    };
                    console.log("[SuccessScreen] fetchBookingAndProviderDetails - PixChargeData para backend:", pixChargeData);

                    const pixResponse: PixChargeResponseDto = await createPixCharge(user.id, pixChargeData);
                    if (!isMounted.current) return;
                    setPixChargeDetails(pixResponse);
                    console.log("[SuccessScreen] fetchBookingAndProviderDetails - Resposta PIX recebida:", pixResponse);
                    NotificationUIService.showSuccess('Use o código para finalizar o pagamento.', 'PIX Gerado com Sucesso!');
                } catch (pixErr: any) {
                    console.error("[SuccessScreen] fetchBookingAndProviderDetails - Erro ao gerar PIX (API):", pixErr.response?.data || pixErr.message, pixErr);
                    if (isMounted.current) {
                        setPixGenerationError(pixErr.response?.data?.message || "Não foi possível gerar a cobrança PIX.");
                    }
                }
            } else {
                console.log("[SuccessScreen] fetchBookingAndProviderDetails - PIX Generation SKIPPED. paymentMethod:", paymentMethod, "totalPriceParam:", totalPriceParam, "pixChargeDetails exists:", !!pixChargeDetails);
            }

            // NOVO: Lógica para exibir o ReturnCouponCard
            const isFirstBooking = (user?.clientDetails?.totalBookings || 0) <= 1;
            const noWelcomeCouponUsed = couponApplied !== 'true';

            if (isFirstBooking && noWelcomeCouponUsed) {
                if (isMounted.current) {
                    setReturnCouponDetails({
                        code: "VOLTELOGO10",
                        title: "10% OFF na Próxima!",
                        subtitle: "Sua recompensa por confiar no LimpeJá!",
                        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // Passando Date object
                    });
                    setShowReturnCouponCard(true);
                }
            }

            // NOVO: Lógica para exibir o MissionReminderCard (Mock)
            if (fetchedBooking.serviceName?.includes('limpeza')) {
                if (isMounted.current) {
                    setShowMissionReminderCard(true);
                }
            }

        } catch (err: any) {
            console.error("[SuccessScreen] Erro ao buscar detalhes do agendamento (API):", err.response?.data?.message || err.message, err);
            if (isMounted.current) {
                setError(err.response?.data?.message || "Não foi possível carregar os detalhes do agendamento.");
                setBooking(null);
            }
        } finally {
            if (isMounted.current) {
                setIsLoading(false);
            }
            console.log("[SuccessScreen] fetchBookingAndProviderDetails - Finalizado.");
        }
    }, [bookingId, paymentMethod, totalPriceParam, pixChargeDetails, user?.id, couponApplied, appliedCouponCode]);

    useEffect(() => {
        const revealDelay = 300;
        const pixGenerationDelay = 2000;

        const entryAnimation = Animated.parallel([
            Animated.timing(contentOpacity, {
                toValue: 1,
                duration: AppDurations.lg,
                easing: Easing.out(Easing.ease),
                useNativeDriver: true,
            }),
            Animated.timing(contentTranslateY, {
                toValue: 0,
                duration: AppDurations.lg,
                easing: Easing.out(Easing.ease),
                useNativeDriver: true,
            }),
        ]);

        const timer = setTimeout(() => {
            entryAnimation.start(() => {
                setTimeout(() => {
                    fetchBookingAndProviderDetails();
                }, pixGenerationDelay);
            });
        }, revealDelay);

        return () => {
            clearTimeout(timer);
            entryAnimation.stop(); // Garante que a animação para se o componente for desmontado
        };
    }, [fetchBookingAndProviderDetails, contentOpacity, contentTranslateY]);

    const handleRetry = useCallback(() => {
        fetchBookingAndProviderDetails();
    }, [fetchBookingAndProviderDetails]);

    const handleGoToBookings = useCallback(() => {
        router.replace({ pathname: '/(client)/bookings', params: { highlightNew: true } } as any);
    }, [router]);

    const handleGoHome = useCallback(() => {
        router.replace('/(client)/explore' as any);
    }, [router]);

    const handleAddToCalendar = useCallback(async () => {
        if (!booking) {
            NotificationUIService.showError("Informações do agendamento não carregadas para adicionar ao calendário.", "Erro");
            return;
        }
        if (!booking.address) {
            NotificationUIService.showError("Endereço do agendamento não disponível para adicionar ao calendário.", "Erro");
            return;
        }

        const startDate = new Date(`${booking.scheduledDate}T${booking.scheduledTime}`);
        if (isNaN(startDate.getTime())) {
            NotificationUIService.showError("Data ou hora do agendamento inválida.", "Erro");
            return;
        }

        const durationMinutes = booking.serviceDurationMinutes || 60;
        const endDate = new Date(startDate.getTime() + durationMinutes * 60 * 1000);

        try {
            const { status } = await Calendar.requestCalendarPermissionsAsync();
            if (status === 'granted') {
                const defaultCalendar = await Calendar.getDefaultCalendarAsync();
                const eventId = await Calendar.createEventAsync(defaultCalendar.id, {
                    title: sanitizeText(`${booking.serviceName} com ${booking.providerFullName}`),
                    location: sanitizeText(`${booking.address.street}, ${booking.address.number}, ${booking.address.city}`),
                    notes: sanitizeText(`Agendamento ID: ${booking.id} - ${booking.notes || 'Nenhuma observação.'}`),
                    startDate: startDate,
                    endDate: endDate,
                    alarms: [{ relativeOffset: -60 }],
                });
                NotificationUIService.showSuccess('Agendamento adicionado ao seu calendário.', 'Sucesso!');
            } else {
                NotificationUIService.showInfo("Não foi possível adicionar ao calendário sem permissão. Por favor, conceda acesso nas configurações do seu dispositivo.", "Permissão Negada");
            }
        } catch (error) {
            console.error("Erro ao adicionar ao calendário:", error);
            NotificationUIService.showError('Por favor, tente novamente mais tarde.', 'Erro ao adicionar ao calendário');
        }
    }, [booking]);

    const handleContactProvider = useCallback(() => {
        if (!booking?.providerId || !booking?.providerFullName) { // Adicionada validação para booking?.providerId
            NotificationUIService.showError("ID ou nome do prestador não disponível para iniciar o chat.", "Erro");
            return;
        }
        router.push({
            pathname: '/(client)/messages/[chatId]',
            params: {
                chatId: booking.providerId,
                recipientId: booking.providerId,
                recipientName: sanitizeText(booking.providerFullName),
                recipientAvatarUrl: provider?.avatarUrl,
            },
        } as any);
    }, [booking, provider, router]);

    const handleCopyPixQrCode = useCallback(async () => {
        if (pixChargeDetails?.brCode) {
            try {
                await Clipboard.setStringAsync(pixChargeDetails.brCode);
                NotificationUIService.showInfo('Cole no seu aplicativo bancário para finalizar o pagamento.', 'Código PIX copiado!');
            } catch (error) {
                console.error("Erro ao copiar código PIX:", error);
                NotificationUIService.showError('Não foi possível copiar o código PIX.', 'Erro');
            }
        } else {
            NotificationUIService.showError('Nenhum código PIX disponível para copiar.', 'Erro');
        }
    }, [pixChargeDetails]);

    const handleRebookNow = useCallback((code: string) => {
        router.push({
            pathname: '/(client)/schedule-service',
            params: { couponCode: code }
        } as any);
        setShowReturnCouponCard(false);
    }, [router]);

    const handleGoToMission = useCallback(() => {
        router.push('/(client)/missions' as any);
        setShowMissionReminderCard(false);
    }, [router]);

    const handleDismissMissionReminder = useCallback(() => {
        setShowMissionReminderCard(false);
        NotificationUIService.showInfo('Você pode encontrá-lo na seção de Missões.', 'Lembrete dispensado');
    }, []);

    if (isLoading || error || pixGenerationError || !booking) {
        return (
            <SuccessLoadingError
                isLoading={isLoading}
                error={error || pixGenerationError}
                headerPrimaryColor={headerPrimaryColor}
                onRetryPress={handleRetry}
            />
        );
    }

    const blobZIndex = -1;

    const userAddress = booking.address;
    const formattedAddressLine1 = userAddress ? formatAddressLine1(userAddress) : '';
    const formattedAddressLine2 = userAddress ? formatAddressLine2(userAddress) : '';

    return (
        <SafeAreaView style={{ flex: 1 }} edges={['top', 'left', 'right', 'bottom']}> {/* ✅ SafeAreaView global cobre topo, laterais e bottom para iOS/Android premium */}
            {/* ✅ Gradiente polido: mais suave e clean com 3 cores e transparência reduzida */}
            <LinearGradient
                colors={backgroundGradientColors}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={[
                    styles.screenGradientBackground,
                    { 
                        flex: 1, // ✅ Garante que o gradient ocupe toda a tela para scroll completo
                        paddingTop: Platform.OS === 'ios' ? 70 : 50 // Fix: PaddingTop maior para iOS safe area top
                    }
                ]}
            >
                <Stack.Screen options={{ headerShown: false }} />

                {/* ✅ AnimatedBlob premium: menor, mais opaco sutil, sombra leve sem poluir */}
                <Animated.View
                    style={[
                        styles.animatedBlob,
                        {
                            transform: [
                                { translateY: blobTranslateY },
                                { scale: blobScale },
                                { rotate: blobRotate.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '360deg'] }) },
                            ],
                            zIndex: blobZIndex,
                        },
                    ]}
                >
                    <LinearGradient
                        colors={abstractBlobColors}
                        start={{ x: 0.2, y: 0.2 }}
                        end={{ x: 0.8, y: 0.8 }}
                        style={StyleSheet.absoluteFillObject}
                    />
                    <BlurView intensity={30} tint="light" style={StyleSheet.absoluteFillObject} />
                </Animated.View>

                {booking && (
                    <ScrollView
                        style={{ flex: 1 }} // ✅ ScrollView com flex:1 para ocupar espaço disponível e scroll fluido
                        contentContainerStyle={styles.scrollContentContainer} // Sem flexGrow:1 para evitar travar scroll
                        showsVerticalScrollIndicator={true} // ✅ Ativado para debug (pode desativar depois)
                        showsHorizontalScrollIndicator={false} // Fix: Desabilita scroll horizontal no iOS
                        horizontal={false} // Fix: Força só vertical
                        bounces={Platform.OS === 'ios' ? true : false} // Fix: Bounce vertical OK no iOS, mas sem lateral
                        keyboardShouldPersistTaps="handled" // Fix: Melhor touch no iOS com teclado
                        contentInsetAdjustmentBehavior={Platform.OS === 'ios' ? 'automatic' : 'never'} // Fix: Ajusta safe areas iOS automaticamente
                        contentInset={Platform.OS === 'ios' ? { bottom: 40 } : {}} // ✅ contentInset bottom para evitar corte em iOS com notch
                        scrollIndicatorInsets={Platform.OS === 'ios' ? { bottom: 40 } : {}} // ✅ scrollIndicatorInsets para indicador de scroll sem corte
                        nestedScrollEnabled={true} // ✅ Permite scroll aninhado se houver (mas evite inner ScrollViews)
                    >
                        <Animated.View
                            style={[
                                styles.mainContentAnimatedWrapper,
                                { opacity: contentOpacity, transform: [{ translateY: contentTranslateY }] },
                            ]}
                        >
                            <SuccessHeader
                                headerPrimaryColor={headerPrimaryColor}
                                headerSecondaryColor={headerSecondaryColor}
                                successColor={successColor}
                            />

                            <BookingSummaryCard
                                booking={booking}
                                provider={provider}
                                providerRating={providerRating}
                                pixChargeDetails={pixChargeDetails}
                                paymentMethod={paymentMethod}
                                contentOpacity={contentOpacity}
                                contentTranslateY={contentTranslateY}
                                iconColor={iconColor}
                                successColor={successColor}
                                headerPrimaryColor={headerPrimaryColor}
                                formattedAddressLine1={formattedAddressLine1}
                                formattedAddressLine2={formattedAddressLine2}
                            />

                            {showReturnCouponCard && returnCouponDetails && (
                                <View style={[styles.sectionSpacer, { marginTop: 0 }]}> {/* FIX: marginTop: 0 para zerar gap com PIX acima */}
                                    <ReturnCouponCard
                                        code={returnCouponDetails.code}
                                        title={returnCouponDetails.title}
                                        subtitle={returnCouponDetails.subtitle}
                                        expiresAt={returnCouponDetails.expiresAt} // Passando Date object
                                        onRebookNow={handleRebookNow}
                                    />
                                </View>
                            )}

                            {showMissionReminderCard && booking && (
                                <View style={styles.sectionSpacer}> {/* Fix: Mesmo para mission, gap lógico */}
                                    <MissionReminderCard
                                        // Em um cenário real, você buscaria o ID e detalhes da missão do backend
                                        missionId="mock-review-mission"
                                        title="Avalie seu serviço!"
                                        description="Sua opinião é importante para nós e te ajuda a ganhar recompensas!"
                                        deadlineAt={new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString()}
                                        reward={{ kind: 'POINTS', value: 50 }}
                                        onGo={handleGoToMission}
                                        onDismiss={handleDismissMissionReminder}
                                    />
                                </View>
                            )}

                            <ImmediateActionButtons
                                onAddToCalendar={handleAddToCalendar}
                                onContactProvider={handleContactProvider}
                                headerPrimaryColor={headerPrimaryColor}
                            />

                            {/* ✅ Adicionado SecurityInfoSection para conteúdo completo (era ausente no render) */}
                            <SecurityInfoSection successColor={successColor} />

                            {/* ✅ Adicionado LoyaltyTeaserSection para conteúdo completo (era ausente no render) */}
                            <LoyaltyTeaserSection headerPrimaryColor={headerPrimaryColor} />

                            <MainActionButtons
                                onGoToBookings={handleGoToBookings}
                                onGoHome={handleGoHome}
                                headerPrimaryColor={headerPrimaryColor}
                            />
                        </Animated.View>
                    </ScrollView>
                )}
            </LinearGradient>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    screenContainer: {
        flex: 1,
        backgroundColor: AppColors.backgroundNeutral,
    },
    screenGradientBackground: {
        flex: 1,
        maxWidth: '100%', // Fix: Previne overflow lateral no iOS
    },
    scrollContentContainer: {
        position: 'relative',
        // ✅ Removido flexGrow:1 para evitar travar scroll; agora usa paddingBottom para expansão natural
        justifyContent: 'flex-start', // Fix: Mudado de 'center' para top-down lógico, reduz gaps
        alignItems: 'center',
        paddingBottom: 60, // ✅ Aumentado para 60px (era 40) para gap final maior, garante scroll até o fim sem cortes (compensa safe area + extra)
        paddingHorizontal: 0, // Fix: Sem padding extra aqui, gerenciado nos filhos
        
    },
    mainContentAnimatedWrapper: {
        width: '100%',
        maxWidth: '100%', // Fix: Previne overflow
        alignItems: 'center',
        backgroundColor: 'transparent',
    },
    // ✅ AnimatedBlob polido: menor (0.6x), opacidade reduzida (0.25), sombra sutil, elevation 0 no Android
    animatedBlob: {
        position: 'absolute',
        width: SCREEN_WIDTH * 0.6,
        height: SCREEN_WIDTH * 0.6,
        borderRadius: (SCREEN_WIDTH * 0.6) / 2,
        alignSelf: 'center',
        left: 0,
        right: 0, // Fix: Centraliza horizontalmente sem overflow
        marginHorizontal: 'auto',
        top: SCREEN_WIDTH * 0.15,
        opacity: 0.25, // Reduzido de 0.4 para não disputar com cards
        overflow: 'hidden',
        // Sombra premium: suave e iOS-like, sem poluir Android
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.04,
        shadowRadius: 18,
        elevation: 0, // Remove sombra excessiva no Android
    },
    // ✅ SectionSpacer: marginBottom aumentado para 12 (padrão premium, ~24px total com paddings)
    sectionSpacer: {
        marginBottom: 12, // Gap consistente e confortável (equivalente a 24px total)
        width: '100%',
        alignItems: 'center',
    },
});