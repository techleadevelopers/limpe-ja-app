import { Ionicons } from '@expo/vector-icons';
import * as Clipboard from 'expo-clipboard';
import { LinearGradient } from 'expo-linear-gradient';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    Animated,
    Dimensions,
    Easing,
    Platform,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
    TextInput, // Adicionado para o campo de cupom
} from 'react-native';
import { useTranslation } from 'react-i18next'; // Importar i18n
import Toast from '../../../components/Toast'; // Importar Toast

// --- IMPORTAÇÕES DE SERVIÇOS E TIPAGENS DO SEU BACKEND REAL ---
import { useAuth } from '../../../hooks/useAuth';
import { createBooking } from '../../../services/bookingService';
import { getProviderAvailability, getProviderDetails } from '../../../services/providerService';
import { applyCoupon } from '../../../services/clientService'; // NOVO: Importar applyCoupon

// Tipagens do seu backend original
import { BookingAddress, BookingDetails, CreateBookingDto, BookingPricing } from '../../../types/backend/bookings'; // Importar BookingPricing
import {
    ProviderAvailability,
    ProviderDisplayInfo,
    ProviderServiceOffering
} from '../../../types/backend/providers';
import { UserProfile } from '../../../types/backend/users'; // Verifique o caminho correto para UserProfile
import { PricingType } from '../../../types/backend/services';
import { formatDate } from '../../../utils/helpers';

// --- Importar COMPONENTES DE UI ---
import AddressSection from '../../../components/client/booking/schedule/AddressSection';
import ProviderBrief from '../../../components/client/booking/schedule/ProviderBrief';
import TimeSlotsSection from '../../../components/client/booking/schedule/TimeSlotsSection';
import ServiceDetailsInput from '../../../components/client/booking/schedule/ServiceDetailsInput';

// NOVOS COMPONENTES IMPORTADOS
import ScheduleHeader from '../../../components/client/booking/schedule/ScheduleHeader';
import ScheduleCalendar from '../../../components/client/booking/schedule/ScheduleCalendar';
import NotesInputSection from '../../../components/client/booking/schedule/NotesInputSection';
import ConfirmBookingButton from '../../../components/client/booking/schedule/ConfirmBookingButton';
import { PanicBanner } from '../../../components/safety/PanicBanner'; // NOVO: Importar PanicBanner


// Import AppStyles
import { AppColors, AppDurations, AppOffsets, AppShadows, AppTypography, SCREEN_WIDTH, SCREEN_HEIGHT } from '../../../constants/appStyles';


// --- NOVAS INTERFACES PARA AS PROPS DOS COMPONENTES ---
interface BookingSummaryPreviewProps {
    provider: ProviderDisplayInfo | null;
    selectedProviderService: ProviderServiceOffering | null;
    selectedDate: Date;
    selectedTime: string | null;
    address: BookingAddress;
    durationInMinutes: number | null;
    squareMeters: number | null;
    subtotal: number;
    discountAmount: number;
    finalPrice: number;
    onShowCancellationPolicy: () => void;
    t: any; // Adicionar prop t para i18n
}

interface CouponInputSectionProps {
    couponCode: string;
    setCouponCode: React.Dispatch<React.SetStateAction<string>>;
    onApplyCoupon: () => Promise<void>;
    isApplyingCoupon: boolean;
    discountAmount: number;
    couponInputAnim: Animated.Value; // Nova prop para animação
    couponFeedbackAnim: Animated.Value; // Nova prop para feedback de cupom
    couponFeedbackColor: string; // Nova prop para cor do feedback
    couponFeedbackIcon: string; // Nova prop para ícone do feedback
    t: any; // Adicionar prop t para i18n
}
// --- FIM NOVAS INTERFACES ---

// --- NOVOS COMPONENTES PERSONALIZADOS PARA ESTA TELA ---
// Componente para o resumo de confirmação final
const BookingSummaryPreview = ({
    provider,
    selectedProviderService,
    selectedDate,
    selectedTime,
    address,
    durationInMinutes,
    squareMeters,
    subtotal,
    discountAmount,
    finalPrice,
    onShowCancellationPolicy,
    t, // Receber t
}: BookingSummaryPreviewProps) => { // Aplicando a interface aqui
    if (!selectedProviderService || !selectedTime) return null;

    const formattedDate = selectedDate.toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' });
    const serviceDetailsText = useMemo(() => {
        if (selectedProviderService.pricingType === PricingType.HOURLY && durationInMinutes) {
            return `${durationInMinutes} ${t('common.minutes_short')}`; // Traduzir "minutos"
        }
        if (selectedProviderService.pricingType === PricingType.BY_SIZE && squareMeters) {
            return `${squareMeters} m²`;
        }
        return 'N/A';
    }, [selectedProviderService, durationInMinutes, squareMeters, t]);

    // Animação para o preço final
    const finalPriceAnim = useRef(new Animated.Value(0)).current;
    const previousFinalPrice = useRef(finalPrice);

    useEffect(() => {
        if (finalPrice !== previousFinalPrice.current) {
            finalPriceAnim.setValue(0); // Reset animation
            Animated.spring(finalPriceAnim, {
                toValue: 1,
                friction: 5,
                tension: 80,
                useNativeDriver: true,
            }).start();
            previousFinalPrice.current = finalPrice;
        }
    }, [finalPrice, finalPriceAnim]);

    // Animação para os ícones do resumo
    const iconAnim = useRef(new Animated.Value(0)).current;
    useEffect(() => {
        Animated.timing(iconAnim, {
            toValue: 1,
            duration: AppDurations.md,
            delay: 100,
            easing: Easing.out(Easing.ease),
            useNativeDriver: true,
        }).start();
    }, []);

    const animatedIconStyle = {
        opacity: iconAnim,
        transform: [{
            translateX: iconAnim.interpolate({
                inputRange: [0, 1],
                outputRange: [-20, 0]
            })
        }]
    };

    return (
        <Animated.View style={[styles.card, { marginTop: 20 }]}>
            <Text style={styles.sectionTitle}>{t('schedule_service.review_booking_title')}</Text>
            <View style={styles.summaryItem}>
                <Animated.View style={animatedIconStyle}>
                    <Ionicons name="briefcase-outline" size={20} color={AppColors.primaryInteractive} style={styles.summaryIcon} />
                </Animated.View>
                <Text style={styles.summaryText}>
                    <Text style={styles.summaryLabel}>{t('schedule_service.summary_service')}</Text> {selectedProviderService.service?.name}
                </Text>
            </View>
            <View style={styles.summaryItem}>
                <Animated.View style={animatedIconStyle}>
                    <Ionicons name="person-outline" size={20} color={AppColors.primaryInteractive} style={styles.summaryIcon} />
                </Animated.View>
                <Text style={styles.summaryText}>
                    <Text style={styles.summaryLabel}>{t('schedule_service.summary_provider')}</Text> {provider?.fullName}
                </Text>
            </View>
            <View style={styles.summaryItem}>
                <Animated.View style={animatedIconStyle}>
                    <Ionicons name="calendar-outline" size={20} color={AppColors.primaryInteractive} style={styles.summaryIcon} />
                </Animated.View>
                <Text style={styles.summaryText}>
                    <Text style={styles.summaryLabel}>{t('schedule_service.summary_date_time')}</Text> {formattedDate}, {t('common.at')} {selectedTime}
                </Text>
            </View>
            <View style={styles.summaryItem}>
                <Animated.View style={animatedIconStyle}>
                    <Ionicons name="location-outline" size={20} color={AppColors.primaryInteractive} style={styles.summaryIcon} />
                </Animated.View>
                <Text style={styles.summaryText}>
                    <Text style={styles.summaryLabel}>{t('schedule_service.summary_address')}</Text> {address.street}, {address.number} - {address.neighborhood}, {address.city}/{address.state}
                </Text>
            </View>
            {(selectedProviderService.pricingType === PricingType.HOURLY || selectedProviderService.pricingType === PricingType.BY_SIZE) && (
                <View style={styles.summaryItem}>
                    <Animated.View style={animatedIconStyle}>
                        <Ionicons name="timer-outline" size={20} color={AppColors.primaryInteractive} style={styles.summaryIcon} />
                    </Animated.View>
                    <Text style={styles.summaryText}>
                        <Text style={styles.summaryLabel}>{t('schedule_service.summary_service_details')}</Text> {serviceDetailsText}
                    </Text>
                </View>
            )}
            <View style={styles.priceSummary}>
                <Text style={styles.priceLabel}>{t('schedule_service.subtotal')}</Text>
                <Text style={styles.priceValue}>R$ {subtotal.toFixed(2).replace('.', ',')}</Text>
            </View>
            {discountAmount > 0 && (
                <View style={styles.priceSummary}>
                    <Text style={styles.priceLabel}>{t('schedule_service.discount')}</Text>
                    <Text style={[styles.priceValue, styles.discountValue]}>- R$ {discountAmount.toFixed(2).replace('.', ',')}</Text>
                </View>
            )}
            <View style={styles.totalPriceSummary}>
                <Text style={styles.totalPriceLabel}>{t('schedule_service.total_to_pay')}</Text>
                <Animated.Text style={[styles.totalPriceValue, { transform: [{ scale: finalPriceAnim.interpolate({ inputRange: [0, 1], outputRange: [0.95, 1] }) }] }]}>
                    R$ {finalPrice.toFixed(2).replace('.', ',')}
                </Animated.Text>
            </View>
            <TouchableOpacity onPress={onShowCancellationPolicy} style={styles.cancellationPolicyLink}>
                <Text style={styles.cancellationPolicyText}>{t('schedule_service.cancellation_policy')}</Text>
            </TouchableOpacity>
        </Animated.View>
    );
};

// Componente para o campo de cupom
const CouponInputSection = ({ couponCode, setCouponCode, onApplyCoupon, isApplyingCoupon, discountAmount, couponInputAnim, couponFeedbackAnim, couponFeedbackColor, couponFeedbackIcon, t }: CouponInputSectionProps) => { // Aplicando a interface aqui
    return (
        <Animated.View style={[styles.card, { marginTop: 20 }]}>
            <Text style={styles.sectionTitle}>{t('schedule_service.coupon_section_title')}</Text>
            <Animated.View style={[styles.couponInputContainer, { borderColor: couponInputAnim.interpolate({
                inputRange: [0, 1],
                outputRange: [AppColors.borderNeutral, AppColors.primaryInteractive]
            }) }]}>
                <TextInput
                    style={styles.couponInput}
                    placeholder={t('schedule_service.coupon_input_placeholder')}
                    value={couponCode}
                    onChangeText={setCouponCode}
                    autoCapitalize="characters"
                    editable={!isApplyingCoupon}
                    onFocus={() => Animated.timing(couponInputAnim, { toValue: 1, duration: AppDurations.xs, useNativeDriver: false }).start()}
                    onBlur={() => Animated.timing(couponInputAnim, { toValue: 0, duration: AppDurations.xs, useNativeDriver: false }).start()}
                />
                <TouchableOpacity
                    style={styles.applyCouponButton}
                    onPress={onApplyCoupon}
                    disabled={isApplyingCoupon || !couponCode}
                >
                    {isApplyingCoupon ? (
                        <ActivityIndicator size="small" color={AppColors.white} />
                    ) : (
                        <Text style={styles.applyCouponButtonText}>{t('schedule_service.apply_coupon_button')}</Text>
                    )}
                </TouchableOpacity>
            </Animated.View>
            {discountAmount > 0 && (
                <Animated.View style={[styles.couponFeedbackContainer, { opacity: couponFeedbackAnim, transform: [{ translateY: couponFeedbackAnim.interpolate({ inputRange: [0, 1], outputRange: [10, 0] }) }] }]}>
                    <Ionicons name={couponFeedbackIcon as any} size={18} color={couponFeedbackColor} />
                    <Text style={[styles.couponAppliedText, { color: couponFeedbackColor }]}>
                        {t('schedule_service.coupon_applied_message', { discountValue: discountAmount.toFixed(2).replace('.', ',') })}
                    </Text>
                </Animated.View>
            )}
        </Animated.View>
    );
};


// Cache para disponibilidade do provedor por data
const availabilityCache = new Map<string, { available: ProviderAvailability[], occupiedTimes: string[] }>();

export default function ScheduleServiceScreen() {
    const router = useRouter();
    const { user } = useAuth();
    const typedUser = user as UserProfile | null;
    const { t } = useTranslation(); // Inicializar i18n

    // CAPTURA DOS PARÂMETROS DA URL
    const { providerId, serviceId, servicePrice, couponCode: initialCouponCode } = useLocalSearchParams(); // NOVO: Captura couponCode

    // NARROWING DOS TIPOS: Garante que os IDs e o preço sejam strings simples, não arrays.
    const paramProviderId = Array.isArray(providerId) ? providerId[0] : providerId;
    const paramServiceId = Array.isArray(serviceId) ? serviceId[0] : serviceId;
    const paramServicePrice = Array.isArray(servicePrice) ? servicePrice[0] : servicePrice;
    const initialCouponCodeString = Array.isArray(initialCouponCode) ? initialCouponCode[0] : initialCouponCode;


    const [provider, setProvider] = useState<ProviderDisplayInfo | null>(null);
    const [selectedProviderService, setSelectedProviderService] = useState<ProviderServiceOffering | null>(null);
    const [selectedDate, setSelectedDate] = useState<Date>(new Date());
    const [selectedTime, setSelectedTime] = useState<string | null>(null);
    const [address, setAddress] = useState<BookingAddress>({
        street: '',
        number: '',
        complement: null,
        neighborhood: '',
        city: '',
        state: '',
        cep: '',
        latitude: 0,
        longitude: 0,
    });
    const [notes, setNotes] = useState<string>('');
    const [durationInMinutes, setDurationInMinutes] = useState<number | null>(null);
    const [squareMeters, setSquareMeters] = useState<number | null>(null);

    // --- NOVOS ESTADOS PARA CUPOM E DESCONTO ---
    const [couponCode, setCouponCode] = useState<string>(initialCouponCodeString || ''); // NOVO: Inicializa com o cupom da URL
    const [discountAmount, setDiscountAmount] = useState<number>(0);
    const [isApplyingCoupon, setIsApplyingCoupon] = useState<boolean>(false);
    const couponInputAnim = useRef(new Animated.Value(0)).current; // Animação para a borda do input de cupom
    const couponFeedbackAnim = useRef(new Animated.Value(0)).current; // Animação para o feedback de cupom
    const [couponFeedbackColor, setCouponFeedbackColor] = useState(AppColors.successStandard); // Cor do feedback (sucesso/erro)
    const [couponFeedbackIcon, setCouponFeedbackIcon] = useState('checkmark-circle'); // Ícone do feedback
    // --- FIM NOVOS ESTADOS ---

    // NOVO: Estado para o PanicBanner
    const [panicStatus, setPanicStatus] = useState<'IDLE' | 'RECEIVED' | 'ACKED' | 'DISPATCHED' | 'CLOSED'>('IDLE');


    const [isLoading, setIsLoading] = useState(true);
    const [isBooking, setIsBooking] = useState(false);
    const [isFetchingSlots, setIsFetchingSlots] = useState(false);

    const [currentDisplayMonth, setCurrentDisplayMonth] = useState(new Date());
    const shineAnim = useRef(new Animated.Value(-SCREEN_WIDTH * 0.3)).current;

    const [displaySlotsInfo, setDisplaySlotsInfo] = useState<
        Array<{ time: string; isAvailable: boolean }>
    >([]);

    const selectionAnim = useRef(new Animated.Value(1)).current;

    const fadeAnim = useRef(new Animated.Value(0)).current;
    const slideUpAnim = useRef(new Animated.Value(50)).current;
    const scaleAnim = useRef(new Animated.Value(0.95)).current;
    const pulseAnim = useRef(new Animated.Value(1)).current;
    const rotateAnim = useRef(new Animated.Value(0)).current;
    const backgroundFloatAnim = useRef(new Animated.Value(0)).current;
    const headerGlowAnim = useRef(new Animated.Value(0)).current;
    const calendarBreatheAnim = useRef(new Animated.Value(1)).current;

    // --- Lógica de cálculo de preço usando useMemo ---
    const calculatedSubtotal = useMemo(() => {
        if (!selectedProviderService || selectedProviderService.price == null) {
            return 0;
        }

        switch (selectedProviderService.pricingType) {
            case PricingType.HOURLY:
                if (durationInMinutes != null && durationInMinutes > 0) {
                    return (durationInMinutes / 60) * selectedProviderService.price;
                }
                break;
            case PricingType.BY_SIZE:
                if (squareMeters != null && squareMeters > 0) {
                    return squareMeters * selectedProviderService.price;
                }
                break;
            default:
                return selectedProviderService.price;
        }
        return 0;
    }, [selectedProviderService, durationInMinutes, squareMeters]);

    // Preço final após aplicar o desconto
    const finalCalculatedPrice = useMemo(() => {
        const priceAfterDiscount = calculatedSubtotal - discountAmount;
        return priceAfterDiscount > 0 ? priceAfterDiscount : 0;
    }, [calculatedSubtotal, discountAmount]);
    // --- Fim da lógica de cálculo de preço ---

    // --- NOVO: Lógica para o indicador de progresso ---
    const currentStep = useMemo(() => {
        if (!selectedTime) return 1; // Seleção de data/hora
        if (!selectedProviderService || (selectedProviderService.pricingType === PricingType.HOURLY && (durationInMinutes == null || durationInMinutes <= 0)) || (selectedProviderService.pricingType === PricingType.BY_SIZE && (squareMeters == null || squareMeters <= 0))) return 2; // Detalhes do serviço
        return 3; // Confirmação
    }, [selectedTime, selectedProviderService, durationInMinutes, squareMeters]);

    const stepTitles = [t('schedule_service.progress_step_date_time'), t('schedule_service.progress_step_service_details'), t('schedule_service.progress_step_confirmation')]; // Traduzir títulos
    // --- FIM NOVO: Lógica para o indicador de progresso ---

    // MOVIDO PARA CIMA: Declaração de prefetchAvailability
    const prefetchAvailability = useCallback(async (provId: string | undefined, date: Date) => {
        if (!provId) return;

        const dateString = date.toISOString().split('T')[0];
        const cacheKey = `${provId}-${dateString}`;

        if (availabilityCache.has(cacheKey)) {
            return;
        }

        try {
            const response = await getProviderAvailability(provId, dateString);
            availabilityCache.set(cacheKey, response);
        } catch (error) {
            console.error(`[Prefetch] Erro ao pré-carregar disponibilidade para ${dateString}:`, error);
        }
    }, []);

    useEffect(() => {
        Animated.parallel([
            Animated.timing(fadeAnim, {
                toValue: 1,
                duration: AppDurations.lg,
                easing: Easing.out(Easing.ease),
                useNativeDriver: true,
            }),
            Animated.timing(slideUpAnim, {
                toValue: 0,
                duration: AppDurations.lg,
                delay: 200,
                easing: Easing.out(Easing.back(1.2)),
                useNativeDriver: true,
            }),
            Animated.spring(scaleAnim, {
                toValue: 1,
                friction: 8,
                tension: 100,
                delay: 400,
                useNativeDriver: true,
            }),
        ]).start();

        const startPulse = () => {
            Animated.loop(
                Animated.sequence([
                    Animated.timing(pulseAnim, {
                        toValue: 1.02,
                        duration: 2000,
                        easing: Easing.inOut(Easing.ease),
                        useNativeDriver: true,
                    }),
                    Animated.timing(pulseAnim, {
                        toValue: 1,
                        duration: 2000,
                        easing: Easing.inOut(Easing.ease),
                        useNativeDriver: true,
                    }),
                ])
            ).start();
        };

        const startRotation = () => {
            Animated.loop(
                Animated.timing(rotateAnim, {
                    toValue: 1,
                    duration: 20000,
                    easing: Easing.linear,
                    useNativeDriver: true,
                })
            ).start();
        };

        const startFloating = () => {
            Animated.loop(
                Animated.sequence([
                    Animated.timing(backgroundFloatAnim, {
                        toValue: 1,
                        duration: 4000,
                        easing: Easing.inOut(Easing.ease),
                        useNativeDriver: true,
                    }),
                    Animated.timing(backgroundFloatAnim, {
                        toValue: 0,
                        duration: 4000,
                        easing: Easing.inOut(Easing.ease),
                        useNativeDriver: true,
                    }),
                ])
            ).start();
        };

        const startHeaderGlow = () => {
            Animated.loop(
                Animated.timing(headerGlowAnim, {
                    toValue: 1,
                    duration: 3000,
                    easing: Easing.inOut(Easing.ease),
                    useNativeDriver: false,
                })
            ).start();
        };

        const startCalendarBreathe = () => {
            Animated.loop(
                Animated.sequence([
                    Animated.timing(calendarBreatheAnim, {
                        toValue: 1.005,
                        duration: 3000,
                        easing: Easing.inOut(Easing.ease),
                        useNativeDriver: true,
                    }),
                    Animated.timing(calendarBreatheAnim, {
                        toValue: 1,
                        duration: 3000,
                        easing: Easing.inOut(Easing.ease),
                        useNativeDriver: true,
                    }),
                ])
            ).start();
        };

        startPulse();
        startRotation();
        startFloating();
        startHeaderGlow();
        startCalendarBreathe();
    }, []);

    const handlePrevMonth = useCallback(() => {
        Animated.sequence([
            Animated.timing(scaleAnim, { toValue: 0.98, duration: AppDurations.xs, useNativeDriver: true }),
            Animated.spring(scaleAnim, { toValue: 1, friction: 6, useNativeDriver: true }),
        ]).start();

        setCurrentDisplayMonth(prev => {
            const newDate = new Date(prev.getFullYear(), prev.getMonth() - 1, 1);
            prefetchAvailability(provider?.id, newDate);
            return newDate;
        });
    }, [provider?.id, scaleAnim, prefetchAvailability]);

    const handleNextMonth = useCallback(() => {
        Animated.sequence([
            Animated.timing(scaleAnim, { toValue: 0.98, duration: AppDurations.xs, useNativeDriver: true }),
            Animated.spring(scaleAnim, { toValue: 1, friction: 6, useNativeDriver: true }),
        ]).start();

        setCurrentDisplayMonth(prev => {
            const newDate = new Date(prev.getFullYear(), prev.getMonth() + 1, 1);
            prefetchAvailability(provider?.id, newDate);
            return newDate;
        });
    }, [provider?.id, scaleAnim, prefetchAvailability]);

    const handleDaySelect = useCallback((dateObj: Date) => {
        setSelectedDate(dateObj);
    }, []);

    const handleTimeSelect = useCallback((time: string) => {
        const selectedSlot = displaySlotsInfo.find(slot => slot.time === time);
        if (selectedSlot?.isAvailable) {
            Animated.sequence([
                Animated.timing(selectionAnim, {
                    toValue: 1.08,
                    duration: AppDurations.xs,
                    easing: Easing.out(Easing.ease),
                    useNativeDriver: true
                }),
                Animated.spring(selectionAnim, {
                    toValue: 1,
                    friction: 5,
                    tension: 80,
                    useNativeDriver: true
                }),
            ]).start();

            setSelectedTime(time);
        } else {
            Alert.alert(t('schedule_service.unavailable_time_slot'), t('schedule_service.unavailable_time_slot_message'));
        }
    }, [displaySlotsInfo, selectionAnim, t]);

    // --- NOVO: Função para aplicar cupom ---
    const handleApplyCoupon = useCallback(async () => {
        if (!couponCode) {
            Toast.show({
                type: 'error',
                text1: t('common.error'),
                text2: t('offers.invalid_coupon'),
            });
            return;
        }
        setIsApplyingCoupon(true);
        couponFeedbackAnim.setValue(0); // Reset animation

        try {
            // Em um cenário real, você precisaria de um bookingId temporário ou de um endpoint para validar o cupom sem criar o agendamento
            // Por simplicidade, vamos simular que o bookingId já existe ou que a validação de cupom é independente
            // Se o backend exigir um bookingId, você precisaria criá-lo primeiro (ex: um bookingId temporário ou rascunho)
            // Para este exemplo, vamos usar um bookingId mock ou assumir que a API de cupom não precisa de um bookingId para validação inicial
            const mockBookingId = 'mock-booking-id-for-coupon-validation'; // Substitua por um bookingId real se necessário

            const result = await applyCoupon(mockBookingId, couponCode); // Chamar a API real
            const newDiscount = result.discountValue || 0;

            setDiscountAmount(newDiscount);
            setCouponFeedbackColor(AppColors.successStandard); // Sucesso
            setCouponFeedbackIcon('checkmark-circle');
            Toast.show({
                type: 'success',
                text1: t('common.success'),
                text2: t('offers.coupon_applied_success', { value: newDiscount.toFixed(2).replace('.', ',') }),
            });

            Animated.timing(couponFeedbackAnim, {
                toValue: 1,
                duration: AppDurations.sm,
                easing: Easing.out(Easing.ease),
                useNativeDriver: true,
            }).start(() => {
                setTimeout(() => {
                    Animated.timing(couponFeedbackAnim, {
                        toValue: 0,
                        duration: AppDurations.sm,
                        easing: Easing.in(Easing.ease),
                        useNativeDriver: true,
                    }).start();
                }, 3000); // Esconde o feedback após 3 segundos
            });

        } catch (error: any) {
            console.error("Erro ao aplicar cupom:", error.response?.data || error.message);
            setDiscountAmount(0);
            setCouponFeedbackColor(AppColors.errorRed); // Erro
            setCouponFeedbackIcon('close-circle');
            Toast.show({
                type: 'error',
                text1: t('common.error'),
                text2: error.response?.data?.message || t('offers.invalid_coupon'),
            });
            Animated.timing(couponFeedbackAnim, {
                toValue: 1,
                duration: AppDurations.sm,
                easing: Easing.out(Easing.ease),
                useNativeDriver: true,
            }).start(() => {
                setTimeout(() => {
                    Animated.timing(couponFeedbackAnim, {
                        toValue: 0,
                        duration: AppDurations.sm,
                        easing: Easing.in(Easing.ease),
                        useNativeDriver: true,
                    }).start();
                }, 3000);
            });
        } finally {
            setIsApplyingCoupon(false);
        }
    }, [couponCode, couponFeedbackAnim, t]);
    // --- FIM NOVO: Função para aplicar cupom ---

    // --- NOVO: Função para exibir política de cancelamento ---
    const showCancellationPolicy = useCallback(() => {
        Alert.alert(
            t('schedule_service.cancellation_policy_title'),
            t('schedule_service.cancellation_policy_message')
        );
    }, [t]);
    // --- FIM NOVO: Função para exibir política de cancelamento ---

    // NOVO: Handler para o botão de pânico
    const handlePanic = useCallback(() => {
        Alert.alert(
            t('safety.panic.button_pressed_title'),
            t('safety.panic.button_pressed_message'),
            [
                { text: t('common.cancel'), style: 'cancel' },
                { text: t('common.confirm'), onPress: () => setPanicStatus('RECEIVED') } // Mock status update
            ]
        );
    }, [t]);


    const handleConfirmBooking = useCallback(async () => {
        // Validações iniciais
        if (!typedUser?.id || !provider?.id || !selectedProviderService?.id || !selectedDate || !selectedTime ||
            !address.street || !address.number || !address.neighborhood || !address.city || !address.state) {
            Alert.alert(t('schedule_service.booking_error_title'), t('schedule_service.booking_error_message'));
            return;
        }

        let requestedDurationMinutes = 0;
        let requestedSquareMeters = 0;

        // Validação adicional para campos dinâmicos
        if (selectedProviderService.pricingType === PricingType.HOURLY && (durationInMinutes == null || durationInMinutes <= 0)) {
            Alert.alert(t('schedule_service.booking_error_title'), t('schedule_service.booking_error_duration_size', { field: t('common.duration') })); // Traduzir "duração"
            return;
        }
        if (selectedProviderService.pricingType === PricingType.BY_SIZE && (squareMeters == null || squareMeters <= 0)) {
            Alert.alert(t('schedule_service.booking_error_title'), t('schedule_service.booking_error_duration_size', { field: t('common.area') })); // Traduzir "área"
            return;
        }

        setIsBooking(true);

        try {
            if (selectedProviderService.pricingType === PricingType.HOURLY) {
                requestedDurationMinutes = durationInMinutes!;
            } else if (selectedProviderService.pricingType === PricingType.BY_SIZE) {
                requestedSquareMeters = squareMeters!;
            }

            const bookingData: CreateBookingDto = {
                providerId: provider.id,
                providerServiceId: selectedProviderService.id,
                scheduledDate: selectedDate.toISOString().split('T')[0],
                scheduledTime: selectedTime,
                totalPrice: finalCalculatedPrice, // Usa o preço final calculado
                notes: notes,
                address: {
                    ...address,
                    latitude: address.latitude ?? 0,
                    longitude: address.longitude ?? 0,
                },
                ...(selectedProviderService.pricingType === PricingType.HOURLY && { requestedDurationMinutes }),
                ...(selectedProviderService.pricingType === PricingType.BY_SIZE && { requestedSquareMeters }),
                couponCode: discountAmount > 0 ? couponCode : undefined, // Envia o cupom se houver desconto
            };

            const newBooking: BookingDetails = await createBooking(bookingData);

            router.replace({
                pathname: '/(client)/bookings/success',
                params: {
                    bookingId: newBooking.id,
                    totalPrice: newBooking.totalPrice.toString(),
                    paymentMethod: 'PIX', // Pode ser dinâmico no futuro
                    // NOVO: Passar info do cupom para a tela de sucesso, se aplicável
                    couponApplied: discountAmount > 0 ? 'true' : 'false',
                    couponCode: discountAmount > 0 ? couponCode : undefined,
                }
            });
            Toast.show({
                type: 'success',
                text1: t('common.success'),
                text2: t('schedule_service.booking_success_message'),
            });

        } catch (error: any) {
            console.error("Erro ao agendar serviço:", error.response?.data || error.message);
            Alert.alert(t('common.error'), error.response?.data?.message || t('common.network_error'));
        } finally {
            setIsBooking(false);
        }
    }, [typedUser, provider, selectedDate, selectedTime, address, selectedProviderService, notes, router, durationInMinutes, squareMeters, finalCalculatedPrice, couponCode, discountAmount, t]);

    useEffect(() => {
        const loadInitialData = async () => {
            setIsLoading(true);

            if (!paramProviderId || !paramServiceId || !typedUser?.id) {
                Alert.alert(t('common.error'), t('schedule_service.navigation_error_essential_data'));
                router.replace('/explore');
                setIsLoading(false);
                return;
            }

            try {
                const fetchedProvider = await getProviderDetails(paramProviderId);
                setProvider(fetchedProvider);

                const foundService = fetchedProvider.providerServices?.find(
                    ps => ps.id === paramServiceId && ps.service && ps.service.id && ps.service.name
                );

                if (!foundService) {
                    Alert.alert(t('common.error'), t('schedule_service.service_not_available'));
                    router.replace('/explore');
                    setIsLoading(false);
                    return;
                }
                setSelectedProviderService(foundService);
                console.log("Serviço carregado:", foundService);

                if(foundService.pricingType === PricingType.HOURLY) {
                    setDurationInMinutes(120);
                } else if(foundService.pricingType === PricingType.BY_SIZE) {
                    setSquareMeters(50);
                }

                const userAddress = typedUser?.clientDetails?.address || typedUser?.providerDetails?.address;
                if (userAddress) {
                    setAddress({
                        street: userAddress.street || '',
                        number: userAddress.number || '',
                        complement: userAddress.complement || null,
                        neighborhood: userAddress.neighborhood || '',
                        city: userAddress.city || '',
                        state: userAddress.state || '',
                        cep: userAddress.cep || '',
                        latitude: userAddress.latitude ?? 0,
                        longitude: userAddress.longitude ?? 0
                    });
                } else {
                    Alert.alert(
                        t('schedule_service.address_needed_title'),
                        t('schedule_service.address_needed_message')
                    );
                }

                setSelectedDate(new Date());

                const today = new Date();
                const nextMonth = new Date(today.getFullYear(), today.getMonth() + 1, 1);
                const prevMonth = new Date(today.getFullYear(), today.getMonth() - 1, 1);
                await prefetchAvailability(paramProviderId, today);
                await prefetchAvailability(paramProviderId, nextMonth);
                await prefetchAvailability(paramProviderId, prevMonth);

                // NOVO: Se houver couponCode na URL, tenta aplicar
                if (initialCouponCodeString) {
                    setCouponCode(initialCouponCodeString);
                    // Pequeno delay para garantir que o componente esteja montado e o estado atualizado
                    setTimeout(() => handleApplyCoupon(), 500);
                }

            } catch (error: any) {
                console.error("Erro ao carregar dados iniciais:", error.response?.data || error.message);
                Alert.alert(t('common.error'), error.response?.data?.message || t('common.network_error'));
                router.replace('/explore');
            } finally {
                setIsLoading(false);
            }
        };
        loadInitialData();
    }, [paramProviderId, typedUser?.id, paramServiceId, router, prefetchAvailability, t, initialCouponCodeString]); // Adicionado initialCouponCodeString

    const animateShine = useCallback(() => {
        shineAnim.setValue(-SCREEN_WIDTH * 0.3);
        Animated.timing(shineAnim, {
            toValue: SCREEN_WIDTH + (SCREEN_WIDTH * 0.3),
            duration: 3000,
            easing: Easing.linear,
            useNativeDriver: true,
        }).start(() => animateShine());
    }, [shineAnim]);

    useEffect(() => {
        animateShine();
    }, [animateShine]);

    useEffect(() => {
        const fetchAndProcessSlotsForDate = async () => {
            if (!provider?.id || !selectedDate) {
                setDisplaySlotsInfo([]);
                setSelectedTime(null);
                return;
            }

            setIsFetchingSlots(true);
            const dateString = selectedDate.toISOString().split('T')[0];
            const cacheKey = `${provider.id}-${dateString}`;

            let backendResponse: { available: ProviderAvailability[], occupiedTimes: string[] } | undefined;
            if (availabilityCache.has(cacheKey)) {
                backendResponse = availabilityCache.get(cacheKey);
            } else {
                try {
                    backendResponse = await getProviderAvailability(provider.id, dateString);
                    availabilityCache.set(cacheKey, backendResponse);
                } catch (err: any) {
                    console.error("Erro ao carregar horários para data:", err.response?.data || err.message);
                    Alert.alert(t('common.error'), err.response?.data?.message || t('schedule_service.error_fetching_slots'));
                    setDisplaySlotsInfo([]);
                    setIsFetchingSlots(false);
                    return;
                }
            }

            const providerConfiguredSlots: ProviderAvailability[] = backendResponse?.available || [];
            const occupiedTimesFromBackend: string[] = backendResponse?.occupiedTimes || [];
            const dayOfWeekSelected = selectedDate.getDay();

            const configuredStartTimesForSelectedDay = new Set(
                providerConfiguredSlots
                    .filter(configSlot => configSlot.dayOfWeek === dayOfWeekSelected)
                    .map(configSlot => configSlot.startTime)
            );

            const allDisplayableTimes: string[] = [];
            const startHour = 8;
            const endHour = 20;

            for (let h = startHour; h < endHour; h++) {
                for (let m = 0; m < 60; m += 30) {
                    allDisplayableTimes.push(`${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`);
                }
            }

            const finalDisplaySlots: Array<{ time: string; isAvailable: boolean }> = allDisplayableTimes.map(time => {
                const [hours, minutes] = time.split(':').map(Number);
                const slotDateTime = new Date(selectedDate);
                slotDateTime.setHours(hours, minutes, 0, 0);

                const isPast = slotDateTime.getTime() < new Date().getTime();
                const isConfiguredByProvider = configuredStartTimesForSelectedDay.has(time);
                const isSlotOccupied = occupiedTimesFromBackend.includes(time);

                return {
                    time: time,
                    isAvailable: isConfiguredByProvider && !isSlotOccupied && !isPast,
                };
            });

            setDisplaySlotsInfo(finalDisplaySlots);
            setIsFetchingSlots(false);
        };
        fetchAndProcessSlotsForDate();
    }, [selectedDate, provider?.id, t]);

    const isButtonDisabled = !selectedTime || !selectedProviderService || isBooking ||
        !address.street || !address.number || !address.neighborhood || !address.city || !address.state ||
        (selectedProviderService?.pricingType === PricingType.HOURLY && (durationInMinutes == null || durationInMinutes <= 0)) ||
        (selectedProviderService?.pricingType === PricingType.BY_SIZE && (squareMeters == null || squareMeters <= 0));

    // --- Lógica do texto do botão de confirmação usando useMemo ---
    const confirmButtonText = useMemo(() => {
        if (finalCalculatedPrice > 0) {
            return `R$ ${finalCalculatedPrice.toFixed(2).replace('.', ',')}`;
        } else {
            return t('schedule_service.select_date_time_address');
        }
    }, [finalCalculatedPrice, t]);
    // --- Fim da lógica do texto do botão de confirmação ---

    // Mova o retorno condicional para *depois* de todas as declarações de Hooks
    if (isLoading) {
        return (
            <View style={styles.centeredFeedback}>
                <Stack.Screen options={{ title: t("common.loading"), headerShown: false }} />
                <ActivityIndicator size="large" color={AppColors.primaryInteractive} />
                <Text style={{ marginTop: 10, color: AppColors.textBody }}>{t('schedule_service.loading_initial_data')}</Text>
            </View>
        );
    }

    return (
        <View style={styles.screenContainer}>
            <Stack.Screen options={{ headerShown: false }} />

            <Animated.View style={[
                styles.backgroundDecoration,
                {
                    transform: [
                        {
                            translateY: backgroundFloatAnim.interpolate({
                                inputRange: [0, 1],
                                outputRange: [-20, 20]
                            })
                        },
                        {
                            rotate: rotateAnim.interpolate({
                                inputRange: [0, 1],
                                outputRange: ['0deg', '360deg']
                            })
                        }
                    ]
                }
            ]}>
                <LinearGradient
                    colors={['rgba(66, 165, 245, 0.08)', 'rgba(144, 202, 249, 0.06)']}
                    style={styles.decorationGradient}
                />
            </Animated.View>

            <Animated.View style={[
                styles.backgroundDecoration2,
                {
                    transform: [
                        {
                            translateX: backgroundFloatAnim.interpolate({
                                inputRange: [0, 1],
                                outputRange: [10, -10]
                            })
                        },
                        { scale: calendarBreatheAnim }
                    ]
                }
            ]}>
                <LinearGradient
                    colors={['rgba(121, 134, 203, 0.05)', 'rgba(129, 140, 248, 0.08)']}
                    style={styles.decorationGradient}
                />
            </Animated.View>

            <ScheduleHeader
                onBackPress={() => router.back()}
                headerTitle={t('schedule_service.header_title')}
                fadeAnim={fadeAnim}
                slideUpAnim={slideUpAnim}
            />
            {/* NOVO: Indicador de Progresso Multi-Etapas */}
            <View style={styles.progressBarContainer}>
                {stepTitles.map((title, index) => (
                    <View key={index} style={styles.progressStep}>
                        <Animated.View style={[
                            styles.progressDot,
                            currentStep >= index + 1 ? styles.progressDotActive : null,
                            {
                                backgroundColor: currentStep >= index + 1 ?
                                    fadeAnim.interpolate({
                                        inputRange: [0, 1],
                                        outputRange: ['#D0D0D0', AppColors.primaryInteractive]
                                    }) : '#D0D0D0'
                            }
                        ]} />
                        <Animated.Text style={[
                            styles.progressText,
                            currentStep >= index + 1 ? styles.progressTextActive : null,
                            {
                                color: currentStep >= index + 1 ?
                                    fadeAnim.interpolate({
                                        inputRange: [0, 1],
                                        outputRange: ['#888', AppColors.primaryInteractive]
                                    }) : '#888',
                                fontWeight: currentStep >= index + 1 ? 'bold' : 'normal'
                            }
                        ]}>
                            {title}
                        </Animated.Text>
                    </View>
                ))}
            </View>
            {/* FIM NOVO: Indicador de Progresso Multi-Etapas */}

            <Animated.ScrollView
                contentContainerStyle={styles.scrollContentContainer}
                style={{
                    opacity: fadeAnim,
                    transform: [{ translateY: slideUpAnim }]
                }}
                showsVerticalScrollIndicator={false}
            >
                {/* NOVO: PanicBanner */}
                <Animated.View style={{
                    transform: [{ scale: scaleAnim }],
                    opacity: fadeAnim,
                    marginHorizontal: 20, // Adiciona margem para alinhar com outros cards
                    marginBottom: 15, // Espaçamento abaixo do banner
                }}>
                    <PanicBanner onPanic={handlePanic} status={panicStatus} />
                </Animated.View>

                <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
                    <ProviderBrief
                        provider={provider}
                        serviceName={selectedProviderService?.service?.name}
                        isLoading={isLoading}
                    />
                </Animated.View>

                <Animated.View style={{
                    transform: [{ scale: scaleAnim }],
                    opacity: fadeAnim
                }}>
                    <AddressSection
                        address={address}
                        setAddress={setAddress}
                        shineAnim={shineAnim}
                        isLoading={isLoading}
                        isInputMode={!address.street || !address.number || !address.neighborhood || !address.city || !address.state}
                    />
                </Animated.View>

                <ScheduleCalendar
                    currentDisplayMonth={currentDisplayMonth}
                    onPrevMonth={handlePrevMonth}
                    onNextMonth={handleNextMonth}
                    selectedDate={selectedDate}
                    onDaySelect={handleDaySelect}
                    fadeAnim={fadeAnim}
                    slideUpAnim={slideUpAnim}
                    selectionAnim={selectionAnim}
                    calendarBreatheAnim={calendarBreatheAnim}
                />

                <Animated.View style={{
                    transform: [{ scale: scaleAnim }],
                    opacity: fadeAnim
                }}>
                    <TimeSlotsSection
                        title={`${t('schedule_service.available_times')} - ${selectedDate.toLocaleDateString('pt-BR', { day: 'numeric', month: 'long' })}`}
                        displaySlotsInfo={displaySlotsInfo}
                        isLoading={isFetchingSlots}
                        selectedTime={selectedTime}
                        onTimeSelect={handleTimeSelect}
                    />
                </Animated.View>

                {/* NOVO: Título "Detalhes do Serviço" (Individual) */}


                {selectedProviderService && (
                    <Animated.View style={[{ // <--- AQUI: Removido 'styles.card'
                        transform: [{ scale: scaleAnim }],
                        opacity: fadeAnim,
                        marginTop: 0, // O espaçamento superior é dado pelo título da seção
                    }]}>
                        <ServiceDetailsInput
                            pricingType={selectedProviderService.pricingType}
                            durationInMinutes={durationInMinutes}
                            setDurationInMinutes={setDurationInMinutes}
                            squareMeters={squareMeters}
                            setSquareMeters={setSquareMeters}
                            pricePerUnit={selectedProviderService.price}
                            finalPrice={calculatedSubtotal} // Usa o subtotal aqui
                        />
                    </Animated.View>
                )}

                {/* NOVO: NotesInputSection encapsulado em um card */}
                {/* Mantido o card aqui, pois a imagem sugere que o campo de input de observações está dentro de um card */}
                <Animated.View style={[styles.card, {
                    transform: [{ scale: scaleAnim }],
                    opacity: fadeAnim,
                    marginTop: 15, // Espaçamento entre a seção anterior e este card
                }]}>
                    <NotesInputSection
                        notes={notes}
                        setNotes={setNotes}
                        fadeAnim={fadeAnim}
                        slideUpAnim={slideUpAnim}
                    />
                </Animated.View>

                {/* NOVO: Seção de Cupom de Desconto */}
                <CouponInputSection
                    couponCode={couponCode}
                    setCouponCode={setCouponCode}
                    onApplyCoupon={handleApplyCoupon}
                    isApplyingCoupon={isApplyingCoupon}
                    discountAmount={discountAmount}
                    couponInputAnim={couponInputAnim}
                    couponFeedbackAnim={couponFeedbackAnim}
                    couponFeedbackColor={couponFeedbackColor}
                    couponFeedbackIcon={couponFeedbackIcon}
                    t={t} // Passar t para o componente
                />
                {/* FIM NOVO: Seção de Cupom de Desconto */}

                {/* NOVO: Resumo de Confirmação Final */}
                <BookingSummaryPreview
                    provider={provider}
                    selectedProviderService={selectedProviderService}
                    selectedDate={selectedDate}
                    selectedTime={selectedTime}
                    address={address}
                    durationInMinutes={durationInMinutes}
                    squareMeters={squareMeters}
                    subtotal={calculatedSubtotal}
                    discountAmount={discountAmount}
                    finalPrice={finalCalculatedPrice}
                    onShowCancellationPolicy={showCancellationPolicy}
                    t={t} // Passar t para o componente
                />
                {/* FIM NOVO: Resumo de Confirmação Final */}

            </Animated.ScrollView>

            {/* NOVO: Resumo Flutuante do Agendamento (Sticky Bottom Bar) */}
            {selectedTime && finalCalculatedPrice > 0 && (
                <View style={styles.floatingSummaryContainer}>
                    <View style={styles.floatingSummaryContent}>
                        <Text style={styles.floatingSummaryText}>
                            {selectedDate.toLocaleDateString('pt-BR', { day: 'numeric', month: 'short' })} {t('common.at')} {selectedTime}
                        </Text>
                        <Text style={styles.floatingSummaryPrice}>
                            R$ {finalCalculatedPrice.toFixed(2).replace('.', ',')}
                        </Text>
                    </View>
                </View>
            )}
            {/* FIM NOVO: Resumo Flutuante do Agendamento */}

            <ConfirmBookingButton
                isButtonDisabled={isButtonDisabled}
                onConfirmBooking={handleConfirmBooking}
                isBooking={isBooking}
                confirmButtonText={confirmButtonText}
                selectedTime={selectedTime}
                hasSelectedServicePrice={selectedProviderService?.price != null}
            />
        </View>
    );
}

const styles = StyleSheet.create({
    screenContainer: {
        flex: 1,
        backgroundColor: AppColors.backgroundLight,
    },
    centeredFeedback: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: AppColors.backgroundLight
    },
    scrollContentContainer: {
        paddingBottom: 120,
        paddingTop: 10,
    },
    backgroundDecoration: {
        position: 'absolute',
        top: SCREEN_HEIGHT * 0.1,
        right: -SCREEN_WIDTH * 0.2,
        width: SCREEN_WIDTH * 0.6,
        height: SCREEN_WIDTH * 0.6,
        borderRadius: SCREEN_WIDTH * 0.3,
        overflow: 'hidden',
    },
    backgroundDecoration2: {
        position: 'absolute',
        bottom: SCREEN_HEIGHT * 0.3,
        left: -SCREEN_WIDTH * 0.15,
        width: SCREEN_WIDTH * 0.5,
        height: SCREEN_WIDTH * 0.5,
        borderRadius: SCREEN_WIDTH * 0.25,
        overflow: 'hidden',
    },
    decorationGradient: {
        flex: 1,
    },
    // --- NOVOS ESTILOS ---
    progressBarContainer: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingVertical: 15,
        backgroundColor: AppColors.white,
        borderBottomWidth: 1,
        borderBottomColor: AppColors.backgroundNeutral,
        ...AppShadows.small,
    },
    progressStep: {
        alignItems: 'center',
        flex: 1,
    },
    progressDot: {
        width: 10,
        height: 10,
        borderRadius: 5,
        backgroundColor: AppColors.borderNeutral,
        marginBottom: 5,
    },
    progressDotActive: {
        backgroundColor: AppColors.primaryInteractive,
    },
    progressText: {
        fontSize: 12,
        color: AppColors.mediumGray,
        textAlign: 'center',
    },
    progressTextActive: {
        fontWeight: 'bold',
        color: AppColors.primaryInteractive,
    },
    floatingSummaryContainer: {
        position: 'absolute',
        bottom: 80, // Acima do ConfirmBookingButton
        left: 0,
        right: 0,
        backgroundColor: 'rgba(255, 255, 255, 0.95)',
        paddingVertical: 10,
        paddingHorizontal: 20,
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
        ...AppShadows.medium,
    },
    floatingSummaryContent: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    floatingSummaryText: {
        fontSize: 16,
        fontWeight: '500',
        color: AppColors.textBody,
    },
    floatingSummaryPrice: {
        fontSize: 18,
        fontWeight: 'bold',
        color: AppColors.primaryInteractive,
    },
    card: {
        backgroundColor: AppColors.white,
        borderRadius: 15,
        padding: 20, // Aumentado o padding para mais espaço interno
        marginHorizontal: 20,
        marginBottom: 15,
        // Sombra aprimorada para um visual mais suave e moderno
        ...AppShadows.medium,
    },
    sectionTitle: {
        fontSize: 20, // Título maior
        fontWeight: 'bold',
        color: AppColors.textBody,
        marginBottom: 20, // Mais espaço abaixo do título
        textAlign: 'left', // Alinhamento à esquerda para um visual mais limpo
    },
    // NOVO: Estilo para o título de seção que não está dentro de um card
    sectionHeaderTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: AppColors.textBody,
        marginHorizontal: 20,
        marginTop: 25, // Espaçamento maior em relação à seção anterior
        marginBottom: 15, // Espaçamento antes do primeiro card desta seção
    },
    couponInputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: AppColors.borderNeutral,
        borderRadius: 10,
        overflow: 'hidden',
    },
    couponInput: {
        flex: 1,
        paddingVertical: 12,
        paddingHorizontal: 15,
        fontSize: 14,
        color: AppColors.textBody,
    },
    applyCouponButton: {
        backgroundColor: AppColors.primaryInteractive,
        paddingVertical: 12,
        paddingHorizontal: 20,
        justifyContent: 'center',
        alignItems: 'center',
        borderTopRightRadius: 10,
        borderBottomRightRadius: 10,
    },
    applyCouponButtonText: {
        color: AppColors.white,
        fontWeight: 'bold',
        fontSize: 16,
    },
    couponFeedbackContainer: { // Novo estilo para o container de feedback do cupom
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 10,
        paddingHorizontal: 5,
    },
    couponAppliedText: {
        marginLeft: 8, // Espaçamento entre ícone e texto
        fontSize: 14,
        fontWeight: 'bold',
    },
    summaryItem: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 15, // Aumentado para mais espaçamento
    },
    summaryIcon: {
        marginRight: 15, // Aumentado para mais espaço entre ícone e texto
        width: 24, // Tamanho fixo para ícones para consistência
        height: 24,
        textAlign: 'center', // Centralizar ícone se ele for menor que o espaço
    },
    summaryText: {
        fontSize: 16, // Tamanho de fonte padrão para itens de resumo
        color: AppColors.textAuxiliary,
        flex: 1, // Permite que o texto ocupe o espaço restante
    },
    summaryLabel: {
        fontWeight: '600', // Um pouco mais bold
        color: AppColors.textBody,
        marginRight: 5, // Espaço entre label e valor
    },
    priceSummary: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginTop: 10,
        paddingVertical: 10, // Aumentado para mais espaçamento
        borderTopWidth: 1,
        borderTopColor: AppColors.backgroundNeutral,
    },
    priceLabel: {
        fontSize: 16,
        color: AppColors.textAuxiliary,
    },
    priceValue: {
        fontSize: 16,
        fontWeight: '600', // Um pouco mais bold
        color: AppColors.textBody,
    },
    discountValue: {
        color: AppColors.successStandard,
    },
    totalPriceSummary: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginTop: 15, // Mais espaço antes do total
        paddingTop: 15, // Mais espaço acima da linha
        borderTopWidth: 2,
        borderTopColor: AppColors.primaryInteractive, // Linha mais destacada para o total
    },
    totalPriceLabel: {
        fontSize: 22, // Bem maior para destaque
        fontWeight: 'bold',
        color: AppColors.textBody,
    },
    totalPriceValue: {
        fontSize: 24, // O maior de todos para o valor final
        fontWeight: 'bold',
        color: AppColors.primaryInteractive, // Cor de destaque para o valor final
    },
    cancellationPolicyLink: {
        marginTop: 20, // Mais espaço acima do link
        alignSelf: 'flex-start',
    },
    cancellationPolicyText: {
        fontSize: 14,
        color: AppColors.primaryInteractive,
        textDecorationLine: 'underline',
    },
    // --- FIM NOVOS ESTILOS ---
});