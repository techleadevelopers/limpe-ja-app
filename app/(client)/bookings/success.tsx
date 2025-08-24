// LimpeJaApp/app/(client)/bookings/success.tsx
import { BlurView } from 'expo-blur';
import * as Calendar from 'expo-calendar';
import * as Clipboard from 'expo-clipboard';
import { LinearGradient } from 'expo-linear-gradient';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
    Alert,
    Animated,
    ColorValue,
    Dimensions,
    Easing,
    Platform,
    ScrollView,
    StyleSheet,
    View, // Adicionado
    Text, // Adicionado
    TouchableOpacity // Adicionado
} from 'react-native';
import Toast from 'react-native-toast-message';

// Importar componentes refatorados
import BookingSummaryCard from '../../../components/client/booking/success/BookingSummaryCard';
import MainActionButtons from '../../../components/client/booking/success/MainActionButtons';
import SuccessHeader from '../../../components/client/booking/success/SuccessHeader';
import SuccessLoadingError from '../../../components/client/booking/success/SuccessLoadingError';
import ImmediateActionButtons from '../../../components/client/booking/success/ImmediateActionButtons';
import SecurityInfoSection from '../../../components/client/booking/success/SecurityInfoSection';
import LoyaltyTeaserSection from '../../../components/client/booking/success/LoyaltyTeaserSection';
import { ReturnCouponCard } from '../../../components/coupons/ReturnCouponCard';
// IMPORTANTE: Adicione a interface de props para MissionReminderCard aqui ou no arquivo do componente
interface MissionReminderCardProps {
    missionId: string;
    title: string;
    description?: string; // Adicionado: Propriedade 'description'
    deadlineAt: string;
    reward: { kind: 'COUPON' | 'POINTS'; value: number; };
    onGo: () => void;
    onDismiss: () => void;
}
// Assumindo que MissionReminderCard é um componente React.FC
const MissionReminderCard: React.FC<MissionReminderCardProps> = ({ missionId, title, description, deadlineAt, reward, onGo, onDismiss }) => {
    // Implementação mock para evitar erro de componente não encontrado
    return (
        <View style={{ margin: 15, padding: 15, backgroundColor: '#e0ffe0', borderRadius: 10 }}>
            <Text style={{ fontWeight: 'bold', fontSize: 16 }}>{title}</Text>
            {description && <Text style={{ fontSize: 14, color: '#555' }}>{description}</Text>}
            <Text style={{ fontSize: 12, color: '#777' }}>Prazo: {new Date(deadlineAt).toLocaleDateString()}</Text>
            <Text style={{ fontSize: 12, color: '#777' }}>Recompensa: {reward.value} {reward.kind}</Text>
            <TouchableOpacity onPress={onGo} style={{ marginTop: 10, backgroundColor: '#4CAF50', padding: 8, borderRadius: 5 }}>
                <Text style={{ color: 'white', textAlign: 'center' }}>Ir agora</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={onDismiss} style={{ marginTop: 5, padding: 8, borderRadius: 5, borderWidth: 1, borderColor: '#ccc' }}>
                <Text style={{ textAlign: 'center' }}>Dispensar</Text>
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


const headerPrimaryColor = AppColors.primaryInteractive;
const headerSecondaryColor = AppColors.primaryDark;
const iconColor = AppColors.primaryInteractive;
const successColor = AppColors.successStandard;

const backgroundGradientColors: readonly [ColorValue, ColorValue, ColorValue, ColorValue] = [
    '#E0F7FA',
    '#B3E0FF',
    '#ADD8E6',
    '#CDE8F7',
];

const abstractBlobColors: readonly [ColorValue, ColorValue, ColorValue] = [
    'rgba(173, 216, 230, 0.4)',
    'rgba(65, 153, 225, 0.15)',
    'rgba(133, 168, 231, 0.05)',
];


export default function SuccessScreen() {
    const { bookingId, paymentMethod, totalPrice: totalPriceParam, couponApplied, couponCode: appliedCouponCode } = useLocalSearchParams<{ bookingId?: string; paymentMethod?: string; totalPrice?: string; couponApplied?: string; couponCode?: string }>();
    const router = useRouter();
    const { user } = useAuth();

    const [booking, setBooking] = useState<BookingDetails | null>(null);
    const [providerRating, setProviderRating] = useState<number | undefined>(undefined);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [pixChargeDetails, setPixChargeDetails] = useState<PixChargeResponseDto | null>(null);
    const [pixGenerationError, setPixGenerationError] = useState<string | null>(null);

    // NOVO: Estado para controlar a exibição do ReturnCouponCard
    const [showReturnCouponCard, setShowReturnCouponCard] = useState(false);
    const [returnCouponDetails, setReturnCouponDetails] = useState<{ code: string; title: string; subtitle: string; expiresAt: Date } | null>(null);

    // NOVO: Estado para controlar a exibição do MissionReminderCard
    const [showMissionReminderCard, setShowMissionReminderCard] = useState(false);


    // Animação para o conteúdo principal aparecer suavemente
    const contentOpacity = useRef(new Animated.Value(0)).current;
    const contentTranslateY = useRef(new Animated.Value(50)).current;

    // Animação para a "bolha" de fundo
    const blobTranslateY = useRef(new Animated.Value(0)).current;
    const blobScale = useRef(new Animated.Value(1)).current;
    const blobRotate = useRef(new Animated.Value(0)).current;

    const animateBlob = useCallback(() => {
        Animated.loop(
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
        ).start();
    }, [blobTranslateY, blobScale, blobRotate]);

    useEffect(() => {
        animateBlob();
    }, [animateBlob]);


    const fetchBookingAndProviderDetails = useCallback(async () => {
        console.log("[SuccessScreen] fetchBookingAndProviderDetails - Iniciando fetch.");
        console.log("[SuccessScreen] fetchBookingAndProviderDetails - bookingId:", bookingId);
        console.log("[SuccessScreen] fetchBookingAndProviderDetails - paymentMethod:", paymentMethod);
        console.log("[SuccessScreen] fetchBookingAndProviderDetails - totalPriceParam:", totalPriceParam);
        console.log("[SuccessScreen] fetchBookingAndProviderDetails - couponApplied:", couponApplied);
        console.log("[SuccessScreen] fetchBookingAndProviderDetails - appliedCouponCode:", appliedCouponCode);


        if (!bookingId) {
            setError("ID do agendamento não fornecido.");
            setIsLoading(false);
            return;
        }
        if (!user?.id) {
            setError("Usuário não autenticado ou ID de usuário ausente.");
            setIsLoading(false);
            return;
        }

        setIsLoading(true);
        setError(null);
        setPixGenerationError(null);
        try {
            const fetchedBooking = await getBookingDetails(bookingId);
            setBooking(fetchedBooking);
            console.log("[SuccessScreen] fetchBookingAndProviderDetails - Booking real carregado:", fetchedBooking);
            console.log("[SuccessScreen - DEBUG] Valor de scheduledDate vindo do backend:", fetchedBooking?.scheduledDate);


            if (fetchedBooking?.providerId) {
                const providerDetails: ProviderDisplayInfo = await getProviderDetails(fetchedBooking.providerId);
                setProviderRating(providerDetails.averageRating);
                console.log("[SuccessScreen] fetchBookingAndProviderDetails - Detalhes do provedor carregados para rating.");
            }

            if (paymentMethod === 'PIX' && totalPriceParam && !pixChargeDetails) {
                const amount = parseFloat(totalPriceParam);
                console.log("[SuccessScreen] fetchBookingAndProviderDetails - Tentando gerar PIX. Amount:", amount);

                if (isNaN(amount)) {
                    setPixGenerationError("Valor total inválido para gerar o PIX.");
                    console.error("[SuccessScreen] fetchBookingAndProviderDetails - Erro: Valor total é NaN.");
                    return;
                }

                try {
                    const pixChargeData: CreatePixChargeDto = {
                        amount: amount,
                        description: `Agendamento ${fetchedBooking.serviceName || 'Serviço'} com ${fetchedBooking.providerFullName}`,
                        bookingId: fetchedBooking.id,
                        providerId: fetchedBooking.providerId,
                    };
                    console.log("[SuccessScreen] fetchBookingAndProviderDetails - PixChargeData para backend:", pixChargeData);

                    const pixResponse: PixChargeResponseDto = await createPixCharge(user.id, pixChargeData);
                    setPixChargeDetails(pixResponse);
                    console.log("[SuccessScreen] fetchBookingAndProviderDetails - Resposta PIX recebida:", pixResponse);
                    Toast.show({
                        type: 'success',
                        text1: 'PIX Gerado com Sucesso!',
                        text2: 'Use o código para finalizar o pagamento.',
                        visibilityTime: 4000,
                    });
                } catch (pixErr: any) {
                    console.error("[SuccessScreen] fetchBookingAndProviderDetails - Erro ao gerar PIX (API):", pixErr.response?.data?.message || pixErr.message, pixErr);
                    setPixGenerationError(pixErr.response?.data?.message || "Não foi possível gerar a cobrança PIX.");
                }
            } else {
                console.log("[SuccessScreen] fetchBookingAndProviderDetails - PIX Generation SKIPPED. paymentMethod:", paymentMethod, "totalPriceParam:", totalPriceParam, "pixChargeDetails exists:", !!pixChargeDetails);
            }

            // NOVO: Lógica para exibir o ReturnCouponCard
            // Mock: Se o cupom NÃO foi aplicado nesta reserva, e é a primeira reserva do usuário (ou uma das primeiras)
            const isFirstBooking = (user?.clientDetails?.totalBookings || 0) <= 1; // Verifica se é a 1ª ou 2ª reserva
            const noWelcomeCouponUsed = couponApplied !== 'true';

            if (isFirstBooking && noWelcomeCouponUsed) {
                setReturnCouponDetails({
                    code: "VOLTELOGO10",
                    title: "10% OFF na Próxima!",
                    subtitle: "Sua recompensa por confiar no LimpeJá!",
                    expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
                });
                setShowReturnCouponCard(true);
            }

            // NOVO: Lógica para exibir o MissionReminderCard (Mock)
            if (fetchedBooking.serviceName?.includes('limpeza')) {
                setShowMissionReminderCard(true);
            }


        } catch (err: any) {
            console.error("[SuccessScreen] Erro ao buscar detalhes do agendamento (API):", err.response?.data?.message || err.message, err);
            setError(err.response?.data?.message || "Não foi possível carregar os detalhes do agendamento.");
            setBooking(null);
        } finally {
            setIsLoading(false);
            console.log("[SuccessScreen] fetchBookingAndProviderDetails - Finalizado.");
        }
    }, [bookingId, paymentMethod, totalPriceParam, pixChargeDetails, user?.id, couponApplied, appliedCouponCode, user?.clientDetails?.totalBookings]);


    useEffect(() => {
        const revealDelay = 300;
        const pixGenerationDelay = 2000;

        const timer = setTimeout(() => {
            Animated.parallel([
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
            ]).start(() => {
                setTimeout(() => {
                    fetchBookingAndProviderDetails();
                }, pixGenerationDelay);
            });
        }, revealDelay);

        return () => clearTimeout(timer);
    }, [fetchBookingAndProviderDetails, contentOpacity, contentTranslateY]);

    const handleGoToBookings = useCallback(() => {
        router.replace({ pathname: '/(client)/bookings', params: { highlightNew: true } } as any);
    }, [router]);

    const handleGoHome = useCallback(() => {
        router.replace('/(client)/explore' as any);
    }, [router]);

    const handleAddToCalendar = useCallback(async () => {
        if (!booking) {
            Alert.alert("Erro", "Informações do agendamento não carregadas para adicionar ao calendário.");
            return;
        }
        if (!booking.address) {
            Alert.alert("Erro", "Endereço do agendamento não disponível para adicionar ao calendário.");
            return;
        }

        const [year, month, day] = booking.scheduledDate.split('-').map(Number);
        const [hour, minute] = booking.scheduledTime.split(':').map(Number);
        const startDate = new Date(year, month - 1, day, hour, minute);

        const durationMinutes = booking.serviceDurationMinutes || 60;
        const endDate = new Date(startDate.getTime() + durationMinutes * 60 * 1000);

        try {
            const { status } = await Calendar.requestCalendarPermissionsAsync();
            if (status === 'granted') {
                const defaultCalendar = await Calendar.getDefaultCalendarAsync();
                const eventId = await Calendar.createEventAsync(defaultCalendar.id, {
                    title: `${booking.serviceName} com ${booking.providerFullName}`,
                    location: `${booking.address.street}, ${booking.address.number}, ${booking.address.city}`,
                    notes: `Agendamento ID: ${booking.id} - ${booking.notes || 'Nenhuma observação.'}`,
                    startDate: startDate,
                    endDate: endDate,
                    alarms: [{ relativeOffset: -60 }],
                });
                Toast.show({
                    type: 'success',
                    text1: 'Sucesso!',
                    text2: 'Agendamento adicionado ao seu calendário.',
                    visibilityTime: 4000,
                });
            } else {
                Alert.alert("Permissão Negada", "Não foi possível adicionar ao calendário sem permissão. Por favor, conceda acesso nas configurações do seu dispositivo.");
            }
        } catch (error) {
            console.error("Erro ao adicionar ao calendário:", error);
            Toast.show({
                type: 'error',
                text1: 'Erro ao adicionar ao calendário',
                text2: 'Por favor, tente novamente mais tarde.',
                visibilityTime: 4000,
            });
        }
    }, [booking]);

    const handleContactProvider = useCallback(() => {
        if (booking?.providerId && booking?.providerFullName) {
            router.push({ pathname: '/(client)/messages/[chatId]', params: { chatId: booking.providerId, recipientName: booking.providerFullName } } as any);
        } else {
            Alert.alert("Erro", "ID ou nome do prestador não disponível para iniciar o chat.");
        }
    }, [booking, router]);

    const handleCopyPixQrCode = useCallback(() => {
        if (pixChargeDetails?.brCode) {
            Clipboard.setString(pixChargeDetails.brCode);
            Toast.show({
                type: 'info',
                text1: 'Código PIX copiado!',
                text2: 'Cole no seu aplicativo bancário para finalizar o pagamento.',
                visibilityTime: 4000,
            });
        } else {
            Toast.show({
                type: 'error',
                text1: 'Erro',
                text2: 'Nenhum código PIX disponível para copiar.',
                visibilityTime: 4000,
            });
        }
    }, [pixChargeDetails]);

    // NOVO: Handler para "Rebook Now" do ReturnCouponCard
    const handleRebookNow = useCallback((code: string) => {
        router.push({
            pathname: '/(client)/schedule-service',
            params: { couponCode: code }
        } as any);
        setShowReturnCouponCard(false); // Dispensar o card após usar
    }, [router]);

    // NOVO: Handler para "Ir agora" da MissionReminderCard
    const handleGoToMission = useCallback(() => {
        router.push('/(client)/missions' as any);
        setShowMissionReminderCard(false);
    }, [router]);

    // NOVO: Handler para "Dispensar" da MissionReminderCard
    const handleDismissMissionReminder = useCallback(() => {
        setShowMissionReminderCard(false);
        Toast.show({
            type: 'info',
            text1: 'Lembrete dispensado',
            text2: 'Você pode encontrá-lo na seção de Missões.',
            visibilityTime: 3000,
        });
    }, []);


    if (isLoading || error || pixGenerationError || !booking) {
        return (
            <SuccessLoadingError
                isLoading={isLoading}
                error={error || pixGenerationError}
                headerPrimaryColor={headerPrimaryColor}
                onRetryPress={fetchBookingAndProviderDetails}
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

                        {/* NOVO: Renderiza o ReturnCouponCard se aplicável */}
                        {showReturnCouponCard && returnCouponDetails && (
                            <ReturnCouponCard
                                code={returnCouponDetails.code}
                                title={returnCouponDetails.title}
                                expiresAt={returnCouponDetails.expiresAt.toISOString()}
                                onBookAgain={handleRebookNow}
                            />
                        )}

                        {/* NOVO: Renderiza o MissionReminderCard se aplicável */}
                        {showMissionReminderCard && booking && (
                            <MissionReminderCard
                                // Em um cenário real, você buscaria o ID e detalhes da missão do backend
                                missionId="mock-review-mission"
                                title="Avalie seu serviço!"
                                description="Sua opinião é importante para nós e te ajuda a ganhar recompensas!" // Adicionado 'description'
                                deadlineAt={new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString()}
                                reward={{ kind: 'POINTS', value: 50 }} // Exemplo de recompensa
                                onGo={handleGoToMission}
                                onDismiss={handleDismissMissionReminder}
                            />
                        )}


                        <ImmediateActionButtons
                            onAddToCalendar={handleAddToCalendar}
                            onContactProvider={handleContactProvider}
                            headerPrimaryColor={headerPrimaryColor}
                        />

                        <SecurityInfoSection successColor={successColor} />

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
        ...Platform.select({
            ios: {
                shadowColor: AppColors.black,
                shadowOffset: { width: 0, height: 8 },
                shadowOpacity: 0.1,
                shadowRadius: 12,
            },
            android: {
                elevation: 8,
            },
        }),
    },
});