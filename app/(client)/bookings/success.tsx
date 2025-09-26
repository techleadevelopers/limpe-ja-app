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
    // Implementação mock para evitar erro de componente não encontrado
    // Adicionado maxFontSizeMultiplier para acessibilidade
    return (
        <View style={{ margin: 15, padding: 15, backgroundColor: AppColors.successStandard + '20', borderRadius: 10 }}>
            <Text style={{ fontWeight: 'bold', fontSize: 16, fontFamily: 'Montserrat-Regular', color: AppColors.textBody }} maxFontSizeMultiplier={1.2}>{title}</Text>
            {description && <Text style={{ fontSize: 14, color: AppColors.textAuxiliary, fontFamily: 'Montserrat-Regular' }} maxFontSizeMultiplier={1.2}>{description}</Text>}
            <Text style={{ fontSize: 12, color: AppColors.mediumGray, fontFamily: 'Montserrat-Regular' }} maxFontSizeMultiplier={1.2}>Prazo: {new Date(deadlineAt).toLocaleDateString()}</Text>
            <Text style={{ fontSize: 12, color: AppColors.mediumGray, fontFamily: 'Montserrat-Regular' }} maxFontSizeMultiplier={1.2}>Recompensa: {reward.value} {reward.kind}</Text>
            <TouchableOpacity onPress={onGo} style={{ marginTop: 10, backgroundColor: AppColors.successStandard, padding: 8, borderRadius: 5 }}>
                <Text style={{ color: AppColors.white, textAlign: 'center' }} maxFontSizeMultiplier={1.2}>Ir agora</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={onDismiss} style={{ marginTop: 5, padding: 8, borderRadius: 5, borderWidth: 1, borderColor: AppColors.borderNeutral }}>
                <Text style={{ textAlign: 'center', color: AppColors.textAuxiliary }} maxFontSizeMultiplier={1.2}>Dispensar</Text>
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

const backgroundGradientColors: readonly [ColorValue, ColorValue, ColorValue, ColorValue] = [
    AppColors.backgroundLight,
    AppColors.primaryInteractive + '40',
    AppColors.primaryInteractive + '20',
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
        <LinearGradient
            colors={backgroundGradientColors}
            start={{ x: 0.1, y: 0.1 }}
            end={{ x: 0.9, y: 0.9 }}
            style={styles.screenGradientBackground}
        >
            <Stack.Screen options={{ headerShown: false }} />

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
                    contentContainerStyle={styles.scrollContentContainer}
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
                            <ReturnCouponCard
                                code={returnCouponDetails.code}
                                title={returnCouponDetails.title}
                                subtitle={returnCouponDetails.subtitle}
                                expiresAt={returnCouponDetails.expiresAt} // Passando Date object
                                onRebookNow={handleRebookNow}
                            />
                        )}

                        {showMissionReminderCard && booking && (
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
                        )}


                        <ImmediateActionButtons
                            onAddToCalendar={handleAddToCalendar}
                            onContactProvider={handleContactProvider}
                            headerPrimaryColor={headerPrimaryColor}
                        />


                        <MainActionButtons
                            onGoToBookings={handleGoToBookings}
                            onGoHome={handleGoHome}
                            headerPrimaryColor={headerPrimaryColor}
                        />
                    </Animated.View>
                </ScrollView>
            )}
        </LinearGradient>
    );
}

const styles = StyleSheet.create({
    screenContainer: {
        flex: 1,
        backgroundColor: AppColors.backgroundNeutral,
    },
    screenGradientBackground: {
        flex: 1,
        paddingTop: 50,
    },
    scrollContentContainer: {
        flexGrow: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingBottom: 20,
    },
    mainContentAnimatedWrapper: {
        width: '100%',
        alignItems: 'center',
        backgroundColor: 'transparent',
    },
    animatedBlob: {
        position: 'absolute',
        width: SCREEN_WIDTH * 0.7,
        height: SCREEN_WIDTH * 0.7,
        borderRadius: (SCREEN_WIDTH * 0.7) / 2,
        alignSelf: 'center',
        top: SCREEN_WIDTH * 0.1,
        opacity: 0.4,
        overflow: 'hidden',
        ...AppShadows.medium,
    },
});