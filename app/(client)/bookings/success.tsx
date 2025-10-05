// LimpeJaApp/app/(client)/bookings/success.tsx
import { BlurView } from 'expo-blur';
import * as Calendar from 'expo-calendar';
import * as Haptics from 'expo-haptics'; 
import * as Sentry from '@sentry/react-native';
import { AccessibilityInfo } from 'react-native'; // ✅ NOVO: Para reduceMotion (A11y)
import { LinearGradient } from 'expo-linear-gradient';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
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
import { SafeAreaView } from 'react-native-safe-area-context';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'; // ✅ ADICIONADO: Import para QueryClient e Provider

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
import { usePaymentIntent, cachePaymentIntent, usePixActions } from './paymentIntentHooks';
import i18n from '../../../i18n';
import { getMyMissions, MissionItem, MissionStatus } from '../../../services/missionService';
import { getMyLoyaltyBalance } from '../../../services/loyaltyService';
import { useQuery } from '@tanstack/react-query'; // ✅ REMOVIDO: useQueryClient() - não mais necessário
import { ReturnCouponCard } from '../../../components/coupons/ReturnCouponCard'; // CORREÇÃO: Importar com chaves, pois é exportação nomeada

// ✅ ADICIONADO: QueryClient instance local para este screen (evita erro sem quebrar app global)
const queryClient = new QueryClient({
    defaultOptions: {
        queries: {
            retry: 2,
            staleTime: 5 * 60 * 1000, // 5 minutos
        },
    },
});

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
        backgroundColor: '#FFFFFF',
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
        color: '#000000',
    };

    const cardSubtitleStyle = {
        fontFamily: 'Montserrat-Regular', // Texto: Regular
        fontSize: 14,
        color: '#666666', // ✅ Fallback para textSecondary (cinza médio, premium e legível)
    };

    const actionButtonStyle = {
        marginTop: 10,
        backgroundColor: '#4CAF50', // Usando cor de sucesso premium (fallback verde)
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
        color: '#FFFFFF',
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
import { CreatePixChargeDto, PixChargeResponseDto, PaymentIntent, PaymentIntentStatus } from '../../../types/backend/payments';

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

// Fundo sólido #f2f2f2 (clean/flat, sem gradient)
const backgroundGradientColors: readonly [ColorValue, ColorValue, ColorValue] = [
    '#f2f2f2', '#f2f2f2', '#f2f2f2'
];

const abstractBlobColors: readonly [ColorValue, ColorValue, ColorValue] = [
    AppColors.primaryInteractive + '40',
    AppColors.primaryInteractive + '15',
    AppColors.primaryInteractive + '05',
];

const mapPaymentIntentStatusToPixStatus = (status: PaymentIntentStatus): PixChargeResponseDto['status'] => {
    switch (status) {
        case PaymentIntentStatus.PAID:
            return 'PAID';
        case PaymentIntentStatus.EXPIRED:
            return 'EXPIRED';
        case PaymentIntentStatus.REFUNDED:
        case PaymentIntentStatus.CHARGEBACK:
            return 'CANCELLED';
        case PaymentIntentStatus.PENDING:
        default:
            return 'PENDING';
    }
};

// ✅ CORREÇÃO: Componente interno (InnerSuccessScreen) - TODOS os hooks e lógica MOVIDOS PARA DENTRO do Provider
function InnerSuccessScreen() {
    const { bookingId, paymentMethod, totalPrice: totalPriceParam, couponApplied, couponCode: appliedCouponCode } = useLocalSearchParams<{ bookingId?: string; paymentMethod?: string; totalPrice?: string; couponApplied?: string; couponCode?: string }>();
    const router = useRouter();
    const { user } = useAuth();

    const { data: loyaltyBalance, isFetching: isFetchingLoyalty } = useQuery({
        queryKey: ['loyalty', 'balance'],
        queryFn: getMyLoyaltyBalance,
        enabled: Boolean(user?.id),
        staleTime: 60000,
        retry: 2,
    });

    const { data: missionItems } = useQuery<MissionItem[]>({
        queryKey: ['missions', user?.id ?? 'anonymous'],
        queryFn: () => getMyMissions(),
        enabled: Boolean(user?.id),
        staleTime: 30000,
        retry: 2,
    });

    const { intent: paymentIntent, loading: isFetchingPaymentIntent, error: paymentIntentError, refresh: refreshPaymentIntent } = usePaymentIntent(bookingId);

    const [missionReminder, setMissionReminder] = useState<MissionItem | null>(null);
    const [showMissionReminderCard, setShowMissionReminderCard] = useState(false);

    const [booking, setBooking] = useState<BookingDetails | null>(null);
    const [provider, setProvider] = useState<ProviderDisplayInfo | null>(null);
    const [providerRating, setProviderRating] = useState<number | undefined>(undefined);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [pixChargeDetails, setPixChargeDetails] = useState<PixChargeResponseDto | null>(null);
    const [pixGenerationError, setPixGenerationError] = useState<string | null>(null);

    const [showReturnCouponCard, setShowReturnCouponCard] = useState(false);
    const [returnCouponDetails, setReturnCouponDetails] = useState<{ code: string; title: string; subtitle: string; expiresAt: Date } | null>(null); // expiresAt é Date

    const { copy: copyPixCode } = usePixActions({ qrCodeText: paymentIntent?.qrCodeText ?? pixChargeDetails?.brCode });
    const missionDeadlineIso = useMemo(() => {
        if (!missionReminder) {
            return new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString();
        }

        const { mission, progress } = missionReminder;
        if (progress?.completedAt) {
            return progress.completedAt;
        }

        if (mission.timeWindowDays) {
            const baseDate = progress?.lastEventAt ? new Date(progress.lastEventAt) : new Date();
            baseDate.setDate(baseDate.getDate() + mission.timeWindowDays);
            return baseDate.toISOString();
        }

        return new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString();
    }, [missionReminder]);

    const missionReward = useMemo(() => {
        if (!missionReminder) {
            return null;
        }

        return {
            kind: missionReminder.mission.rewardType === 'COUPON' ? 'COUPON' : 'POINTS',
            value: missionReminder.mission.rewardValue,
        } as const;
    }, [missionReminder]);

    const contentOpacity = useRef(new Animated.Value(0)).current;
    const contentTranslateY = useRef(new Animated.Value(50)).current;

    const blobTranslateY = useRef(new Animated.Value(0)).current;
    const blobScale = useRef(new Animated.Value(1)).current;
    const blobRotate = useRef(new Animated.Value(0)).current;

    // Adicionado ref para verificar se o componente está montado
    const isMounted = useRef(true);

    // ✅ NOVO: ReduceMotion para A11y (respeita preferências do usuário)
    const reduceMotionRef = useRef(false);
    const dismissedMissionIdsRef = useRef<Set<string>>(new Set());

    useEffect(() => {
        AccessibilityInfo.isReduceMotionEnabled().then((enabled) => {
            reduceMotionRef.current = enabled;
        });
    }, []);

    useEffect(() => {
        if (!paymentIntent || !booking) {
            return;
        }

        if (!paymentIntent.qrCodeText && !pixChargeDetails?.brCode) {
            return;
        }

        const mappedStatus = mapPaymentIntentStatusToPixStatus(paymentIntent.status);
        const computedAmount = paymentIntent.amount ?? paymentIntent.amountCents / 100;
        const computedExpiresAt =
            paymentIntent.expiresAt ?? pixChargeDetails?.expiresAt ?? new Date(Date.now() + 30 * 60 * 1000).toISOString();
        const defaultDescription = sanitizeText(`Agendamento ${booking.serviceName || 'Serviço'} com ${booking.providerFullName}`);

        setPixChargeDetails((previous) => {
            if (previous?.paymentIntent?.updatedAt === paymentIntent.updatedAt && previous?.brCode) {
                return previous;
            }

            return {
                transactionId: paymentIntent.externalRef ?? paymentIntent.id,
                status: mappedStatus,
                brCode: paymentIntent.qrCodeText ?? previous?.brCode ?? '',
                qrCodeImage: paymentIntent.qrCodeUrl ?? previous?.qrCodeImage ?? '',
                expiresAt: computedExpiresAt,
                amount: computedAmount ?? previous?.amount ?? (Number(totalPriceParam) || 0),
                description: previous?.description ?? defaultDescription,
                bookingId: booking.id,
                providerId: booking.providerId,
                paymentIntent,
                brCodeError: previous?.brCodeError,
                expirationDate: previous?.expirationDate,
            };
        });
    }, [paymentIntent, booking, pixChargeDetails?.brCode, pixChargeDetails?.expiresAt, pixChargeDetails?.description, totalPriceParam]);

    // NOVO: Guard para geração de PIX (roda uma vez só)
    const pixRequestedRef = useRef(false);

    const isIntentExpired = useCallback((intent?: PaymentIntent | null) => {
        if (!intent) return false;
        if (intent.status === PaymentIntentStatus.EXPIRED) {
            return true;
        }
        if (intent.expiresAt) {
            return new Date(intent.expiresAt).getTime() <= Date.now();
        }
        return false;
    }, []);

    const isPixExpired = useCallback((details?: PixChargeResponseDto | null) => {
        if (!details) return false;
        if (details.paymentIntent) {
            return isIntentExpired(details.paymentIntent);
        }
        if (!details.expiresAt) {
            return false;
        }
        return new Date(details.expiresAt).getTime() <= Date.now();
    }, [isIntentExpired]);

    // Overlay premium: aviso de expiração/pendência prolongada
    const [showStatusOverlay, setShowStatusOverlay] = useState(false);
    const [statusOverlayText, setStatusOverlayText] = useState<string | null>(null);
    useEffect(() => {
        const intent = paymentIntent ?? null;
        if (!intent) { setShowStatusOverlay(false); setStatusOverlayText(null); return; }
        const expired = isIntentExpired(intent);
        const PENDING_MAX_MS = 10 * 60 * 1000; // 10min
        const pendingTooLong = intent.status === PaymentIntentStatus.PENDING && (Date.now() - new Date(intent.createdAt).getTime() > PENDING_MAX_MS);
        if (expired) {
            setStatusOverlayText('Seu QR Code expirou. Gere um novo para finalizar o pagamento.');
            setShowStatusOverlay(true);
        } else if (pendingTooLong) {
            setStatusOverlayText('Pagamento pendente há alguns minutos. Confirme no seu banco ou gere um novo código.');
            setShowStatusOverlay(true);
        } else {
            setShowStatusOverlay(false);
            setStatusOverlayText(null);
        }
    }, [paymentIntent, isIntentExpired]);

    // I18n do overlay de PaymentIntent (substitui mensagens hardcoded)
    useEffect(() => {
        const intent = paymentIntent ?? null;
        if (!intent) return;
        if (isIntentExpired(intent)) {
            setStatusOverlayText(i18n.t('payments.overlay.expired'));
        } else if (intent.status === PaymentIntentStatus.PENDING && showStatusOverlay) {
            setStatusOverlayText(i18n.t('payments.overlay.pending'));
        }
    }, [paymentIntent, showStatusOverlay, isIntentExpired]);

    const animateBlob = useCallback(() => {
        // ✅ A11y: Pula animação se reduceMotion
        if (reduceMotionRef.current) return null;

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
            if (blobAnimation) blobAnimation.stop(); // Cleanup da animação
        };
    }, [animateBlob]);

    // REFACTOR: fetchBookingAndProviderDetails independente (só busca booking/provider e lógica de coupons/missions)
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
                    console.log("[SuccessScreen] ReturnCoupon ativado - deve animar agora."); // ✅ DEBUG: Log para confirmar
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
    }, [bookingId, user?.id, couponApplied, appliedCouponCode]);

    // NOVO: useEffect separado para geração de PIX (com guard, roda só 1x)
    useEffect(() => {
        if (!booking || paymentMethod !== 'PIX' || !totalPriceParam) {
            return;
        }

        if (isFetchingPaymentIntent) {
            return;
        }

        const amount = Number(totalPriceParam);
        if (Number.isNaN(amount) || amount <= 0) {
            setPixGenerationError('Valor total inválido para gerar o PIX.');
            return;
        }

        const currentIntent = paymentIntent ?? pixChargeDetails?.paymentIntent ?? null;
        const intentExpired = isIntentExpired(currentIntent);
        const pixExpired = isPixExpired(pixChargeDetails);

        const hasUsableIntent = !!currentIntent && !intentExpired;
        const hasUsablePix = !!pixChargeDetails?.brCode && !pixExpired;
        const forcedRegeneration = !currentIntent && !!paymentIntentError;

        if (!forcedRegeneration && (hasUsablePix || (hasUsableIntent && Boolean(paymentIntent?.qrCodeText || pixChargeDetails?.brCode)))) {
            return;
        }

        if (pixRequestedRef.current) {
            return;
        }

        pixRequestedRef.current = true;

        (async () => {
            try {
                const pixChargeData: CreatePixChargeDto = {
                    amount,
                    description: sanitizeText(`Agendamento ${booking.serviceName || 'Serviço'} com ${booking.providerFullName}`),
                    bookingId: booking.id,
                    providerId: booking.providerId,
                };
                const pixResponse = await createPixCharge(user!.id, pixChargeData);
                if (!isMounted.current) return;
                setPixChargeDetails(pixResponse);
                await cachePaymentIntent(booking.id, pixResponse.paymentIntent ?? null);
                refreshPaymentIntent();

                NotificationUIService.showSuccess('Use o código para finalizar o pagamento.', 'PIX Gerado com Sucesso!');
                await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            } catch (e: any) {
                if (!isMounted.current) return;
                setPixGenerationError(e?.response?.data?.message || 'Não foi possível gerar a cobrança PIX.');
            } finally {
                pixRequestedRef.current = false;
            }
        })();
    }, [
        booking,
        paymentMethod,
        totalPriceParam,
        paymentIntent,
        paymentIntentError,
        pixChargeDetails,
        isFetchingPaymentIntent,
        isIntentExpired,
        isPixExpired,
        user?.id,
    ]);


    useEffect(() => {
        if (!missionItems) {
            return;
        }

        const availableMissions = missionItems.filter((mission) => !dismissedMissionIdsRef.current.has(mission.mission.id));

        if (availableMissions.length === 0) {
            setMissionReminder(null);
            setShowMissionReminderCard(false);
            return;
        }

        const actionableMission =
            availableMissions.find((mission) => mission.canClaim || mission.progress?.status === MissionStatus.ACTIVE) ??
            availableMissions[0];

        setMissionReminder(actionableMission);
        setShowMissionReminderCard(true);
    }, [missionItems]);

    // REFACTOR: useEffect de entrada sem pixGenerationDelay (fetch 1x só)
    useEffect(() => {
        // ✅ A11y: Pula animação se reduceMotion
        if (reduceMotionRef.current) {
            fetchBookingAndProviderDetails();
            return;
        }

        const revealDelay = 400; // ✅ AJUSTADO: Aumentado para 400ms (era 300) — dá tempo pro cupom animar após fetch

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
                fetchBookingAndProviderDetails();   // 🚀 sem setTimeout extra pra PIX
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
        // ✅ Haptics: Feedback tátil em CTA principal
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        router.replace({ pathname: '/(client)/bookings', params: { highlightNew: true } } as any);
    }, [router]);

    const handleGoHome = useCallback(() => {
        // ✅ Haptics: Feedback tátil em CTA principal
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        router.replace('/(client)/explore' as any);
    }, [router]);

    const handleAddToCalendar = useCallback(async () => {
        // ✅ A11y: Role e hint para acessibilidade
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
                // ✅ Haptics: Feedback de sucesso
                await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            } else {
                NotificationUIService.showInfo("Não foi possível adicionar ao calendário sem permissão. Por favor, conceda acesso nas configurações do seu dispositivo.", "Permissão Negada");
            }
        } catch (error) {
            console.error("Erro ao adicionar ao calendário:", error);
            NotificationUIService.showError('Por favor, tente novamente mais tarde.', 'Erro ao adicionar ao calendário');
        }
    }, [booking]);

    const handleContactProvider = useCallback(() => {
        // ✅ A11y: Role e hint para botão de chat
        if (!booking?.providerId || !booking?.providerFullName) { // Adicionada validação para booking?.providerId
            NotificationUIService.showError("ID ou nome do prestador não disponível para iniciar o chat.", "Erro");
            return;
        }
        // ✅ Haptics: Feedback tátil em CTA de contato
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
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



    const handleRebookNow = useCallback((code: string) => {
        // ✅ Haptics: Feedback tátil em rebook (premium CTA)
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        router.push({
            pathname: '/(client)/schedule-service',
            params: { couponCode: code }
        } as any);
        setShowReturnCouponCard(false);
    }, [router]);
    const handleNavigateToLoyalty = useCallback(() => {
        router.push('/(common)/loyalty' as any);
    }, [router]);

    const handleGoToMission = useCallback(() => {
        if (missionReminder) {
            dismissedMissionIdsRef.current.add(missionReminder.mission.id);
        }
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        router.push('/(client)/missions' as any);
        setShowMissionReminderCard(false);
    }, [missionReminder, router]);

    const handleDismissMissionReminder = useCallback(() => {
        if (missionReminder) {
            dismissedMissionIdsRef.current.add(missionReminder.mission.id);
        }
        setShowMissionReminderCard(false);
        NotificationUIService.showInfo('Você pode encontrá-lo na seção de Missões.', 'Lembrete dispensado');
    }, [missionReminder]);

        // BONUS: Removido pixGenerationError da condição de erro (não volta ao loader por falha no PIX)
    if (isLoading || error || !booking) {
        return (
            <SuccessLoadingError
                isLoading={isLoading}
                error={error}
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
        <SafeAreaView style={{ flex: 1 }} edges={['left', 'right', 'bottom']}>  {/* Removido 'top' */}
            {/* ✅ Gradiente polido: mais suave e clean com 3 cores e transparência reduzida */}
            <LinearGradient
                colors={backgroundGradientColors}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={[
                    styles.screenGradientBackground,
                    { 
                        flex: 1, // ✅ Garante que o gradient ocupe toda a tela para scroll completo
                        paddingTop: 0  // ✅ ZERADO: Remove o padding fixo de 70/50px
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

        {showStatusOverlay && (
            <View pointerEvents="box-none" style={styles.statusOverlayContainer}>
                <View style={styles.statusOverlayBackdrop} />
                <View style={styles.statusOverlayCard}>
                    <Text style={styles.statusOverlayTitle}>{i18n.t('payments.overlay.title')}</Text>
                    {!!statusOverlayText && (
                        <Text style={styles.statusOverlayText}>{statusOverlayText}</Text>
                    )}
                    <View style={styles.statusOverlayButtons}>
                        <TouchableOpacity
                            style={styles.statusOverlayPrimary}
                            onPress={() => {
                                try { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium); } catch (_) {}
                                copyPixCode();
                            }}
                            accessibilityRole="button"
                            accessibilityLabel={i18n.t('payments.overlay.actions.copy')}
                        >
                            <Text style={styles.statusOverlayPrimaryText}>{i18n.t('payments.overlay.actions.copy')}</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={styles.statusOverlayPrimary}
                            onPress={() => {
                                try { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium); } catch (_) {}
                                refreshPaymentIntent();
                            }}
                            accessibilityRole="button"
                            accessibilityLabel={i18n.t('payments.overlay.actions.refresh')}
                        >
                            <Text style={styles.statusOverlayPrimaryText}>{i18n.t('payments.overlay.actions.refresh')}</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </View>
        )}

                {booking && (
                    <TouchableOpacity
                        onPress={() => router.back()}
                        style={{ position: 'absolute', left: 16, top: Platform.OS === 'ios' ? 12 : 8, zIndex: 100 }}
                        accessibilityLabel={i18n.t('common.back') || 'Voltar'}
                        accessibilityRole="button"
                    >
                        <Ionicons name="arrow-back" size={24} color={headerPrimaryColor as string} />
                    </TouchableOpacity>
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
                                <View
                                    key={showReturnCouponCard ? 'coupon-shown' : 'coupon-hidden'}
                                    style={[styles.sectionSpacer, { marginTop: 0, marginBottom: 20 }]}
                                >
                                    <ReturnCouponCard
                                        code={returnCouponDetails.code}
                                        title={returnCouponDetails.title}
                                        subtitle={returnCouponDetails.subtitle}
                                        expiresAt={returnCouponDetails.expiresAt}
                                        onRebookNow={handleRebookNow}
                                    />
                                </View>
                            )}

                            {showMissionReminderCard && missionReminder && missionReward && (
                                <View style={styles.sectionSpacer}>
                                    <MissionReminderCard
                                        missionId={missionReminder.mission.id}
                                        title={missionReminder.mission.title}
                                        description={missionReminder.mission.description}
                                        deadlineAt={missionDeadlineIso}
                                        reward={missionReward}
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
                            <SecurityInfoSection bookingId={booking?.id} successColor={successColor} />

                            {/* ✅ Adicionado LoyaltyTeaserSection para conteúdo completo (era ausente no render) */}
                            <LoyaltyTeaserSection
                                headerPrimaryColor={headerPrimaryColor}
                                currentPoints={loyaltyBalance?.currentPoints}
                                nextRewardName={loyaltyBalance?.nextReward?.name ?? null}
                                isLoading={isFetchingLoyalty}
                                onPressLearnMore={handleNavigateToLoyalty}
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
        </SafeAreaView>
    );
}

// ✅ CORREÇÃO: Export do wrapper com Provider (envia hooks para dentro do Provider)
export default function SuccessScreen() {
    return (
        <QueryClientProvider client={queryClient}>
            <InnerSuccessScreen />
        </QueryClientProvider>
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
    // ✅ AnimatedBlob polido: menor (0.6x), opacidade reduzida (0.25), sombra leve sem poluir
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
    statusOverlayContainer: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 16,
        zIndex: 999,
    },
    statusOverlayBackdrop: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(0,0,0,0.25)',
    },
    statusOverlayCard: {
        width: '90%',
        maxWidth: 420,
        backgroundColor: '#FFFFFF',
        borderRadius: 16,
        paddingVertical: 20,
        paddingHorizontal: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.08,
        shadowRadius: 20,
        elevation: 4,
        alignItems: 'center',
    },
    statusOverlayTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: '#111',
        marginBottom: 8,
    },
    statusOverlayText: {
        fontSize: 14,
        color: '#444',
        textAlign: 'center',
        lineHeight: 20,
        marginBottom: 16,
    },
    statusOverlayButtons: {
        flexDirection: 'row',
        gap: 12,
    },
    statusOverlayPrimary: {
        backgroundColor: '#007AFF',
        borderRadius: 24,
        paddingVertical: 12,
        paddingHorizontal: 20,
    },
    statusOverlayPrimaryText: {
        color: '#fff',
        fontSize: 14,
        fontWeight: '600',
    },
    // ✅ SectionSpacer: marginBottom aumentado para 12 (padrão premium, ~24px total com paddings)
    sectionSpacer: {
        marginBottom: 12, // Gap consistente e confortável (equivalente a 24px total)
        width: '100%',
        alignItems: 'center',
    },
});
