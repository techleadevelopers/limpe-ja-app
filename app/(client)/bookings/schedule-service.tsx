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
    TextInput,
    ImageBackground,
    ScrollView,
} from 'react-native';
import { useTranslation } from 'react-i18next';

import NotificationUIService from '../../../services/notificationUIService';

import { useAuth } from '../../../hooks/useAuth';
import { createBooking } from '../../../services/bookingService';
import { getProviderAvailability, getProviderDetails } from '../../../services/providerService';

import { BookingAddress, BookingDetails, CreateBookingDto, BookingPricing } from '../../../types/backend/bookings';
import {
    ProviderAvailability,
    ProviderDisplayInfo,
    ProviderServiceOffering
} from '../../../types/backend/providers';
import { UserProfile } from '../../../types/backend/users';
import { PricingType } from '../../../types/backend/services';
import { formatDate } from '../../../utils/helpers';
import { formatBRL } from '../../../utils/formatters';

import { useBookingPricing } from '../../../utils/useBookingPricing';
import { useCouponValidation } from '../../../utils/useCouponValidation';
import { generateDailySlots } from '../../../utils/timeSlots';

import AddressSection from '../../../components/client/booking/schedule/AddressSection';
import ProviderBrief from '../../../components/client/booking/schedule/ProviderBrief';
import TimeSlotsSection from '../../../components/client/booking/schedule/TimeSlotsSection';
import ServiceDetailsInput from '../../../components/client/booking/schedule/ServiceDetailsInput';

import ScheduleHeader from '../../../components/client/booking/schedule/ScheduleHeader';
import ScheduleCalendar from '../../../components/client/booking/schedule/ScheduleCalendar';
import NotesInputSection from '../../../components/client/booking/schedule/NotesInputSection';
import ConfirmBookingButton from '../../../components/client/booking/schedule/ConfirmBookingButton';

import { AppColors, AppDurations, AppOffsets, AppShadows, SCREEN_WIDTH, SCREEN_HEIGHT } from '../../../constants/appStyles';



const AnimatedTextInput = Animated.createAnimatedComponent(TextInput);

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
    t: any;
    // ✅ NOVO: Animações para premium entrance no step 2
    reviewEntranceAnim?: Animated.Value;
    reviewStaggerDelay?: number;
}

interface CouponInputSectionProps {
    couponCode: string;
    setCouponCode: React.Dispatch<React.SetStateAction<string>>;
    onApplyCoupon: () => Promise<void>;
    isApplyingCoupon: boolean;
    discountAmount: number;
    couponInputAnim: Animated.Value;
    couponFeedbackAnim: Animated.Value;
    couponFeedbackColor: string;
    couponFeedbackIcon: string;
    t: any;
    // ✅ NOVO: Animação para seção cupom
    cupomEntranceAnim?: Animated.Value;
    cupomStaggerDelay?: number;
}

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
    t,
    reviewEntranceAnim, // ✅ PREMIUM: Animação de entrada suave para review
    reviewStaggerDelay = 0, // Delay para stagger (sequencial)
}: BookingSummaryPreviewProps) => {
    if (!selectedProviderService || !selectedTime) return null;

    const formattedDate = selectedDate.toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' });
    const serviceDetailsText = useMemo(() => {
        if (selectedProviderService.pricingType === PricingType.HOURLY && durationInMinutes) {
            return `${durationInMinutes} ${t('common.minutes_short', { defaultValue: 'min' })}`;
        }
        if (selectedProviderService.pricingType === PricingType.BY_SIZE && squareMeters) {
            return `${squareMeters} m²`;
        }
        return t('common.na', { defaultValue: 'N/A' });
    }, [selectedProviderService, durationInMinutes, squareMeters, t]);

    const finalPriceAnim = useRef(new Animated.Value(0)).current;
    const previousFinalPrice = useRef(finalPrice);

    useEffect(() => {
        if (finalPrice !== previousFinalPrice.current) {
            finalPriceAnim.setValue(0);
            Animated.spring(finalPriceAnim, {
                toValue: 1,
                friction: 3,
                tension: 120,
                useNativeDriver: true,
            }).start();
            previousFinalPrice.current = finalPrice;
        }
    }, [finalPrice, finalPriceAnim]);

    const iconAnim = useRef(new Animated.Value(0)).current;
    useEffect(() => {
        // ✅ PREMIUM: Delay stagger para icons aparecerem sequencialmente
        Animated.sequence([
            Animated.timing(iconAnim, {
                toValue: 1,
                duration: AppDurations.xs, // Ainda mais rápido para ícones
                delay: reviewStaggerDelay + 0, // Sem delay adicional para ícones
                easing: Easing.out(Easing.ease),
                useNativeDriver: true,
            }),
        ]).start();
    }, [iconAnim, reviewStaggerDelay]);

    const animatedIconStyle = {
        opacity: iconAnim,
        transform: [{
            translateX: iconAnim.interpolate({
                inputRange: [0, 1],
                outputRange: [-10, 0] // Movimento menor para mais rápido
            })
        }]
    };

    // ✅ PREMIUM: Animação de entrada suave para o card review (slide up + fade + subtle scale)
    const reviewCardAnim = reviewEntranceAnim ? {
        opacity: reviewEntranceAnim,
        transform: [
            { translateY: reviewEntranceAnim.interpolate({ inputRange: [0, 1], outputRange: [20, 0] }) }, // Menos slide para mais rápido
            { scale: reviewEntranceAnim.interpolate({ inputRange: [0, 1], outputRange: [0.98, 1] }) } // Scale menor
        ]
    } : {};

    return (
        <Animated.View style={[styles.card, { marginTop: 20 }, reviewCardAnim]}>
            <View style={styles.sectionHeaderRow}>
                <Text style={styles.sectionTitlePlain}>
                    {t('schedule_service.review_booking_title', { defaultValue: 'Revisar Agendamento' })}
                </Text>
            </View>
            <View style={styles.summaryItem}>
                <Animated.View style={animatedIconStyle}>
                    <Ionicons name="briefcase-outline" size={20} color={AppColors.primaryInteractive} style={styles.summaryIcon} />
                </Animated.View>
                <Text style={styles.summaryText}>
                    <Text style={styles.summaryLabel}>{t('schedule_service.summary_service', { defaultValue: 'Serviço' })}</Text> {selectedProviderService.service?.name || t('common.na', { defaultValue: 'N/A' })}
                </Text>
            </View>
            <View style={styles.summaryItem}>
                <Animated.View style={animatedIconStyle}>
                    <Ionicons name="person-outline" size={20} color={AppColors.primaryInteractive} style={styles.summaryIcon} />
                </Animated.View>
                <Text style={styles.summaryText}>
                    <Text style={styles.summaryLabel}>{t('schedule_service.summary_provider', { defaultValue: 'Prestador' })}</Text> {provider?.fullName || t('common.na', { defaultValue: 'N/A' })}
                </Text>
            </View>
            <View style={styles.summaryItem}>
                <Animated.View style={animatedIconStyle}>
                    <Ionicons name="calendar-outline" size={20} color={AppColors.primaryInteractive} style={styles.summaryIcon} />
                </Animated.View>
                <Text style={styles.summaryText}>
                    <Text style={styles.summaryLabel}>{t('schedule_service.summary_date_time', { defaultValue: 'Data e Hora' })}</Text> {formattedDate}, {t('common.at', { defaultValue: 'às' })} {selectedTime}
                </Text>
            </View>
            <View style={styles.summaryItem}>
                <Animated.View style={animatedIconStyle}>
                    <Ionicons name="location-outline" size={20} color={AppColors.primaryInteractive} style={styles.summaryIcon} />
                </Animated.View>
                <Text style={styles.summaryText}>
                    <Text style={styles.summaryLabel}>{t('schedule_service.summary_address', { defaultValue: 'Endereço' })}</Text> {address.street || ''}, {address.number || ''} - {address.neighborhood || ''}, {address.city || ''}/{address.state || ''}
                </Text>
            </View>
            {(selectedProviderService.pricingType === PricingType.HOURLY || selectedProviderService.pricingType === PricingType.BY_SIZE) && (
                <View style={styles.summaryItem}>
                    <Animated.View style={animatedIconStyle}>
                        <Ionicons name="timer-outline" size={20} color={AppColors.primaryInteractive} style={styles.summaryIcon} />
                    </Animated.View>
                    <Text style={styles.summaryText}>
                        <Text style={styles.summaryLabel}>{t('schedule_service.summary_service_details', { defaultValue: 'Detalhes do Serviço' })}</Text> {serviceDetailsText}
                    </Text>
                </View>
            )}
            <View style={styles.priceSummary}>
                <Text style={styles.priceLabel}>{t('schedule_service.subtotal', { defaultValue: 'Subtotal' })}</Text>
                <Text style={styles.priceValue}>{formatBRL(subtotal)}</Text>
            </View>
            {discountAmount > 0 && (
                <View style={styles.priceSummary}>
                    <Text style={styles.priceLabel}>{t('schedule_service.discount', { defaultValue: 'Desconto' })}</Text>
                    <Text style={[styles.priceValue, styles.discountValue]}>- {formatBRL(discountAmount)}</Text>
                </View>
            )}
            <View style={styles.totalPriceSummary}>
                <Text style={styles.totalPriceLabel}>{t('schedule_service.total_to_pay', { defaultValue: 'Total a Pagar' })}</Text>
                <Animated.Text style={[styles.totalPriceValue, { transform: [{ scale: finalPriceAnim.interpolate({ inputRange: [0, 1], outputRange: [0.95, 1] }) }] }]}>
                    {formatBRL(finalPrice)}
                </Animated.Text>
            </View>
            <TouchableOpacity onPress={onShowCancellationPolicy} style={styles.cancellationPolicyLink}>
                <Text style={styles.cancellationPolicyText}>{t('schedule_service.cancellation_policy', { defaultValue: 'Política de Cancelamento' })}</Text>
            </TouchableOpacity>
        </Animated.View>
    );
};

const CouponInputSection = ({ couponCode, setCouponCode, onApplyCoupon, isApplyingCoupon, discountAmount, couponInputAnim, couponFeedbackAnim, couponFeedbackColor, couponFeedbackIcon, t, cupomEntranceAnim, cupomStaggerDelay = 0 }: CouponInputSectionProps) => {
    // ✅ PREMIUM: Animação de entrada para cupom (slide up + fade)
    const cupomCardAnim = cupomEntranceAnim ? {
        opacity: cupomEntranceAnim,
        transform: [
            { translateY: cupomEntranceAnim.interpolate({ inputRange: [0, 1], outputRange: [10, 0] }) }, // Menos slide
            { scale: cupomEntranceAnim.interpolate({ inputRange: [0, 1], outputRange: [0.99, 1] }) } // Scale mínimo
        ]
    } : {};

    return (
        <Animated.View style={[styles.card, { marginTop: 20 }, cupomCardAnim]}>
            <Text style={styles.sectionTitle}>{t('schedule_service.coupon_section_title', { defaultValue: 'Cupom de Desconto' })}</Text>
            <Animated.View style={[styles.couponInputContainer, { borderColor: couponInputAnim.interpolate({
                inputRange: [0, 1],
                outputRange: [AppColors.borderNeutral, AppColors.primaryInteractive]
            }) }]}>
                <AnimatedTextInput
                    style={styles.couponInput}
                    placeholder={t('schedule_service.coupon_input_placeholder', { defaultValue: 'Digite o código do cupom' })}
                    placeholderTextColor={couponInputAnim.interpolate({
                        inputRange: [0, 1],
                        outputRange: [AppColors.mediumGray, AppColors.primaryInteractive]
                    })}
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
                        <Text style={styles.applyCouponButtonText}>{t('schedule_service.apply_coupon_button', { defaultValue: 'Aplicar' })}</Text>
                    )}
                </TouchableOpacity>
            </Animated.View>
            {discountAmount > 0 && (
                <Animated.View style={[styles.couponFeedbackContainer, { opacity: couponFeedbackAnim, transform: [{ translateY: couponFeedbackAnim.interpolate({ inputRange: [0, 1], outputRange: [5, 0] }) }] }]}>
                    <Ionicons name={couponFeedbackIcon as any} size={18} color={couponFeedbackColor} />
                    <Text style={[styles.couponAppliedText, { color: couponFeedbackColor }]}>
                        {t('schedule_service.coupon_applied_message', { discountValue: formatBRL(discountAmount), defaultValue: `Cupom aplicado! Desconto de ${formatBRL(discountAmount)}` })}
                    </Text>
                </Animated.View>
            )}
        </Animated.View>
    );
};

// PREMIUM: Cache com TTL (expira >1h) para dados frescos e gerenciamento de memória
const availabilityCache = new Map<string, { 
    available: ProviderAvailability[], 
    occupiedTimes: string[], 
    timestamp: number  // TTL: 1h = 3600000ms
}>();

export default function ScheduleServiceScreen() {
    const router = useRouter();
    const { user } = useAuth();
    const typedUser = user as UserProfile | null;
    const { t } = useTranslation();

    const { providerId, serviceId, servicePrice, couponCode: initialCouponCode } = useLocalSearchParams();
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

    // Usando o hook useCouponValidation
    const {
        couponCode,
        setCouponCode,
        discountAmount,
        isApplyingCoupon,
        couponInputAnim,
        couponFeedbackAnim,
        couponFeedbackColor,
        couponFeedbackIcon,
        handleApplyCoupon,
    } = useCouponValidation(initialCouponCodeString);

    const [panicStatus, setPanicStatus] = useState<'IDLE' | 'RECEIVED' | 'ACKED' | 'DISPATCHED' | 'CLOSED'>('IDLE');

    const [isLoading, setIsLoading] = useState(true);
    const [isBooking, setIsBooking] = useState(false);
    const [isFetchingSlots, setIsFetchingSlots] = useState(false);
    const [isSearchingNextDate, setIsSearchingNextDate] = useState(false); // ✅ NOVO: Flag para prevenir buscas simultâneas

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

    const floatingSummaryAnim = useRef(new Animated.Value(0)).current;

    // ✅ PREMIUM: Animações específicas para step 2 (review) - entrance suave, stagger para cards
    const reviewStepAnim = useRef(new Animated.Value(0)).current; // Controla entrada do step 2 inteiro
    const serviceDetailsAnim = useRef(new Animated.Value(0)).current; // Stagger 1: ServiceDetailsInput
    const notesAnim = useRef(new Animated.Value(0)).current; // Stagger 2: Notes
    const cupomAnim = useRef(new Animated.Value(0)).current; // Stagger 3: Coupon
    const summaryAnim = useRef(new Animated.Value(0)).current; // Stagger 4: Summary

    const [currentStep, setCurrentStep] = useState(1);

    const scrollViewRef = useRef<ScrollView>(null);
    const timeSlotsRef = useRef<View>(null);

    const isMounted = useRef(true);

    const { calculatedSubtotal, finalCalculatedPrice } = useBookingPricing({
        selectedProviderService,
        durationInMinutes,
        squareMeters,
        discountAmount,
    });

    // ✅ CORREÇÃO: Use t() fora do array para evitar re-run do useEffect de slots; fallback para undefined
    const stepDateTimeTitle = useMemo(() => t('schedule_service.progress_step_date_time', { defaultValue: 'Data e Hora' }), [t]);
    const stepReviewTitle = useMemo(() => t('schedule_service.progress_step_complete_review', { defaultValue: 'Revisão' }), [t]);
    const stepTitles = [stepDateTimeTitle, stepReviewTitle];

    const prefetchAvailability = useCallback(async (provId: string | undefined, baseDate: Date) => {
        if (!provId) return;

        const now = Date.now();
        for (const [key, value] of availabilityCache.entries()) {
            if (now - value.timestamp > 3600000) {
                availabilityCache.delete(key);
            }
        }

        const prefetchDates = [];
        for (let offset = -3; offset <= 3; offset++) {
            const prefetchDate = new Date(baseDate);
            prefetchDate.setDate(baseDate.getDate() + offset);
            const dateString = prefetchDate.toISOString().split('T')[0];
            const cacheKey = `${provId}-${dateString}`;
            if (!availabilityCache.has(cacheKey)) {
                prefetchDates.push({ dateString, cacheKey });
            }
        }

        await Promise.allSettled(
            prefetchDates.map(({ dateString, cacheKey }) =>
                getProviderAvailability(provId, dateString).then(response => {
                    availabilityCache.set(cacheKey, { ...response, timestamp: Date.now() });
                })
            )
        );

        if (__DEV__) {
            console.log(`[Prefetch Premium] Cacheado ${prefetchDates.length} dias para ${baseDate.toDateString()}`);
        }
    }, []);

    useEffect(() => {
        isMounted.current = true;

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

        const pulseLoop = Animated.loop(
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
        );

        const rotateLoop = Animated.loop(
            Animated.timing(rotateAnim, {
                toValue: 1,
                duration: 20000,
                easing: Easing.linear,
                useNativeDriver: true,
            })
        );

        const floatLoop = Animated.loop(
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
        );

        const headerGlowLoop = Animated.loop(
            Animated.timing(headerGlowAnim, {
                toValue: 1,
                duration: 3000,
                easing: Easing.inOut(Easing.ease),
                useNativeDriver: false,
            })
        );

        const calendarBreatheLoop = Animated.loop(
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
        );

        pulseLoop.start();
        rotateLoop.start();
        floatLoop.start();
        headerGlowLoop.start();
        calendarBreatheLoop.start();

        return () => {
            isMounted.current = false;
            pulseLoop.stop();
            rotateLoop.stop();
            floatLoop.stop();
            headerGlowLoop.stop();
            calendarBreatheLoop.stop();
        };
    }, []);

    // ✅ PREMIUM: Animação de entrada para step 2 (review) - inicia baixo e sobe suavemente para conforto UX
    // ✅ AJUSTE: Animações paralelas com delays mínimos para entrada quase instantânea (profissional e rápida)
    useEffect(() => {
        if (currentStep === 2) {
            // Reset todos os valores para 0
            reviewStepAnim.setValue(0);
            serviceDetailsAnim.setValue(0);
            notesAnim.setValue(0);
            cupomAnim.setValue(0);
            summaryAnim.setValue(0);

            // ✅ MUDANÇA: Usar parallel em vez de sequence para que todas entrem ao mesmo tempo, com delays mínimos
            // Isso faz a seção de Detalhes do Serviço aparecer imediatamente (delay 0)
            Animated.parallel([
                // Entrada geral do step 2 (rápida)
                Animated.timing(reviewStepAnim, {
                    toValue: 1,
                    duration: AppDurations.xs, // Extra rápido (ex: 100ms)
                    delay: 0, // Sem delay inicial
                    easing: Easing.out(Easing.ease), // Sem back para mais direto
                    useNativeDriver: true,
                }),
                // Detalhes do Serviço: Imediato e rápido (prioridade alta)
                Animated.timing(serviceDetailsAnim, {
                    toValue: 1,
                    duration: AppDurations.xs, // Extra rápido
                    delay: 0, // Entra imediatamente
                    easing: Easing.out(Easing.ease),
                    useNativeDriver: true,
                }),
                // Notes: Delay mínimo
                Animated.timing(notesAnim, {
                    toValue: 1,
                    duration: AppDurations.xs,
                    delay: 50, // 50ms após o primeiro
                    easing: Easing.out(Easing.ease),
                    useNativeDriver: true,
                }),
                // Cupom: Delay mínimo
                Animated.timing(cupomAnim, {
                    toValue: 1,
                    duration: AppDurations.xs,
                    delay: 100, // 100ms
                    easing: Easing.out(Easing.ease),
                    useNativeDriver: true,
                }),
                // Summary: Último, com leve delay para destaque
                Animated.timing(summaryAnim, {
                    toValue: 1,
                    duration: AppDurations.sm, // Um pouco mais lenta para ênfase
                    delay: 150, // 150ms total
                    easing: Easing.out(Easing.back(1.05)),
                    useNativeDriver: true,
                }),
            ]).start();
        } else {
            // Reset para step 1
            reviewStepAnim.setValue(0);
            serviceDetailsAnim.setValue(0);
            notesAnim.setValue(0);
            cupomAnim.setValue(0);
            summaryAnim.setValue(0);
        }
    }, [currentStep]);

    useEffect(() => {
        if (currentStep === 2 && selectedTime && finalCalculatedPrice > 0) {
            Animated.timing(floatingSummaryAnim, {
                toValue: 1,
                duration: AppDurations.xs, // Extra rápido
                easing: Easing.out(Easing.ease),
                useNativeDriver: true,
            }).start();
        } else {
            Animated.timing(floatingSummaryAnim, {
                toValue: 0,
                duration: AppDurations.xs,
                easing: Easing.in(Easing.ease),
                useNativeDriver: true,
            }).start();
        }
    }, [currentStep, selectedTime, finalCalculatedPrice, floatingSummaryAnim]);

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
    }, [provider?.id, prefetchAvailability, scaleAnim]);

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
    }, [provider?.id, prefetchAvailability, scaleAnim]);

    const handleDaySelect = useCallback((dateObj: Date) => {
        Animated.sequence([
            Animated.timing(scaleAnim, { toValue: 0.98, duration: AppDurations.xs, useNativeDriver: true }),
            Animated.spring(scaleAnim, { toValue: 1, friction: 6, useNativeDriver: true }),
        ]).start();

        setSelectedDate(dateObj);
        prefetchAvailability(provider?.id, dateObj);

        setTimeout(() => {
            if (timeSlotsRef.current && scrollViewRef.current) {
                scrollViewRef.current.scrollTo({
                    y: 400,
                    animated: true,
                });
            }
        }, 300);

        setSelectedTime(null);
    }, [provider?.id, prefetchAvailability, scaleAnim]);

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
            NotificationUIService.showInfo(
                t('schedule_service.unavailable_time_slot_message', { defaultValue: 'Horário não disponível.' }),
                t('schedule_service.unavailable_time_slot', { defaultValue: 'Horário Indisponível' })
            );
        }
    }, [displaySlotsInfo, selectionAnim, t]);

    const showCancellationPolicy = useCallback(() => {
        NotificationUIService.showInfo(
            t('schedule_service.cancellation_policy_message', { defaultValue: 'Política de cancelamento: 24h antes sem custo.' }),
            t('schedule_service.cancellation_policy_title', { defaultValue: 'Política de Cancelamento' })
        );
    }, [t]);

    const handlePanic = useCallback(() => {
        Alert.alert(
            t('safety.panic.button_pressed_title', { defaultValue: 'Pânico Ativado' }),
            t('safety.panic.button_pressed_message', { defaultValue: 'Ajuda será enviada em breve.' }),
            [
                { text: t('common.cancel', { defaultValue: 'Cancelar' }), style: 'cancel' },
                { text: t('common.confirm', { defaultValue: 'Confirmar' }), onPress: () => setPanicStatus('RECEIVED') }
            ]
        );
    }, [t]);

    const handleNextStep = useCallback(() => {
        if (currentStep === 1) {
            if (!selectedTime || !address.street || !address.number || !address.neighborhood || !address.city || !address.state) {
                NotificationUIService.showError(
                    t('schedule_service.step1_validation_error', { defaultValue: 'Selecione data, hora e endereço.' }),
                    t('common.error', { defaultValue: 'Erro' })
                );
                return;
            }
        }
        // ✅ PREMIUM: Animação suave na transição para step 2 (fade out step 1 + prepare review entrance)
        // ✅ AJUSTE: Transição ultra-rápida e scroll para topo ao entrar no step 2
        Animated.sequence([
            // Fade e scale rápido para transição
            Animated.parallel([
                Animated.timing(fadeAnim, { toValue: 0, duration: AppDurations.xs, useNativeDriver: true }), // Fade out completo e rápido
                Animated.timing(scaleAnim, { toValue: 0.95, duration: AppDurations.xs, useNativeDriver: true }),
            ]),
        ]).start(() => {
            // Após fade out, muda o step e reseta animações
            setCurrentStep(prev => prev + 1);
            reviewStepAnim.setValue(0);
            serviceDetailsAnim.setValue(0);
            notesAnim.setValue(0);
            cupomAnim.setValue(0);
            summaryAnim.setValue(0);
            
            // ✅ FIX: Scroll para o TOPO imediatamente ao entrar no step 2 (profissional, sem começar embaixo)
            // Usar animated: false para instantâneo, ou true para suave
            setTimeout(() => {
                scrollViewRef.current?.scrollTo({ y: 0, animated: false }); // Instantâneo para evitar "salto"
            }, 50); // Pequeno delay para garantir que o conteúdo novo seja renderizado

            // Fade in suave após scroll
            setTimeout(() => {
                fadeAnim.setValue(1); // Restaura opacidade
                scaleAnim.setValue(1);
            }, 100);
        });
    }, [currentStep, selectedTime, address, t, fadeAnim, scaleAnim]);

    const handlePreviousStep = useCallback(() => {
        if (currentStep > 1) {
            // ✅ PREMIUM: Suave saída do step 2 (fade in step 1)
            // ✅ AJUSTE: Saída rápida e scroll para topo se necessário
            Animated.sequence([
                Animated.timing(reviewStepAnim, { toValue: 0, duration: AppDurations.xs, useNativeDriver: true }),
                Animated.parallel([
                    Animated.timing(fadeAnim, { toValue: 1, duration: AppDurations.xs, useNativeDriver: true }),
                    Animated.timing(scaleAnim, { toValue: 1, duration: AppDurations.xs, useNativeDriver: true }),
                ]),
            ]).start(() => {
                setCurrentStep(prev => prev - 1);
                // Scroll para topo ao voltar para step 1 também (boa UX)
                scrollViewRef.current?.scrollTo({ y: 0, animated: false });
            });
        } else {
            router.back();
        }
    }, [currentStep, router, reviewStepAnim, fadeAnim, scaleAnim]);

    const handleConfirmBooking = useCallback(async () => {
        if (!typedUser?.id || !provider?.id || !selectedProviderService?.id || !selectedDate || !selectedTime ||
            !address.street || !address.number || !address.neighborhood || !address.city || !address.state) {
            NotificationUIService.showError(
                t('schedule_service.booking_error_message', { defaultValue: 'Dados incompletos para agendar.' }),
                t('schedule_service.booking_error_title', { defaultValue: 'Erro no Agendamento' })
            );
            return;
        }

        if (selectedProviderService?.pricingType === PricingType.HOURLY && (durationInMinutes == null || durationInMinutes <= 0)) {
            NotificationUIService.showError(
                t('schedule_service.booking_error_duration_size', { field: t('common.duration', { defaultValue: 'duração' }) }),
                t('schedule_service.booking_error_title', { defaultValue: 'Erro no Agendamento' })
            );
            return;
        }
        if (selectedProviderService?.pricingType === PricingType.BY_SIZE && (squareMeters == null || squareMeters <= 0)) {
            NotificationUIService.showError(
                t('schedule_service.booking_error_duration_size', { field: t('common.area', { defaultValue: 'área' }) }),
                t('schedule_service.booking_error_title', { defaultValue: 'Erro no Agendamento' })
            );
            return;
        }

        let requestedDurationMinutes = 0;
        let requestedSquareMeters = 0;

        if (isMounted.current) {
            setIsBooking(true);
        }

        try {
            if (selectedProviderService.pricingType === PricingType.HOURLY) {
                requestedDurationMinutes = durationInMinutes!;
            } else if (selectedProviderService.pricingType === PricingType.BY_SIZE) {
                requestedSquareMeters = squareMeters!;
            }

            // ✅ PATCH 2.1: Blindagem para selectedDate undefined
            const safeSelectedDate = selectedDate ?? new Date();
            const bookingData: CreateBookingDto = {
                providerId: provider.id,
                providerServiceId: selectedProviderService.id,
                scheduledDate: safeSelectedDate.toISOString().split('T')[0],
                scheduledTime: selectedTime,
                totalPrice: finalCalculatedPrice,
                notes: notes,
                address: {
                    ...address,
                    latitude: address.latitude ?? 0,
                    longitude: address.longitude ?? 0,
                },
                ...(selectedProviderService.pricingType === PricingType.HOURLY && { requestedDurationMinutes }),
                ...(selectedProviderService.pricingType === PricingType.BY_SIZE && { requestedSquareMeters }),
                couponCode: discountAmount > 0 ? couponCode : undefined,
            };

            console.log("Dados de agendamento sendo enviados:", bookingData);

            const newBooking: BookingDetails = await createBooking(bookingData);
            if (!isMounted.current) return;

            router.replace({
                pathname: '/(client)/bookings/success',
                params: {
                    bookingId: newBooking.id,
                    totalPrice: newBooking.totalPrice.toString(),
                    paymentMethod: 'PIX',
                    couponApplied: discountAmount > 0 ? 'true' : 'false',
                    couponCode: discountAmount > 0 ? couponCode : undefined,
                }
            });
            NotificationUIService.showSuccess(
                t('schedule_service.booking_success_message', { defaultValue: 'Agendamento realizado com sucesso!' }),
                t('common.success', { defaultValue: 'Sucesso' })
            );

        } catch (error: any) {
            console.error("Erro ao agendar serviço:", error.response?.data || error.message);
            if (isMounted.current) {
                NotificationUIService.showError(
                    error.response?.data?.message || t('common.network_error', { defaultValue: 'Erro de rede.' }),
                    t('common.error', { defaultValue: 'Erro' })
                );
            }
        } finally {
            if (isMounted.current) {
                setIsBooking(false);
            }
        }
    }, [typedUser, provider, selectedDate, selectedTime, address, selectedProviderService, notes, router, durationInMinutes, squareMeters, finalCalculatedPrice, couponCode, discountAmount, t]);

    useEffect(() => {
        const loadInitialData = async () => {
            if (isMounted.current) {
                setIsLoading(true);
            }

            if (!paramProviderId || !paramServiceId || !typedUser?.id) {
                if (isMounted.current) {
                    NotificationUIService.showError(
                        t('schedule_service.navigation_error_essential_data', { defaultValue: 'Dados essenciais ausentes.' }),
                        t('common.error', { defaultValue: 'Erro' })
                    );
                    router.replace('/explore');
                    setIsLoading(false);
                }
                return;
            }

            try {
                const fetchedProvider = await getProviderDetails(paramProviderId);
                if (!isMounted.current) return;
                setProvider(fetchedProvider);

                const foundService = fetchedProvider.providerServices?.find(
                    ps => ps.id === paramServiceId && ps.service && ps.service.id && ps.service.name
                );

                if (!foundService) {
                    if (isMounted.current) {
                        NotificationUIService.showError(
                            t('schedule_service.service_not_available', { defaultValue: 'Serviço não disponível.' }),
                            t('common.error', { defaultValue: 'Erro' })
                        );
                        router.replace('/explore');
                        setIsLoading(false);
                    }
                    return;
                }
                if (isMounted.current) {
                    setSelectedProviderService(foundService);
                }
                console.log("Serviço carregado:", foundService);

                if (foundService.pricingType === PricingType.HOURLY) {
                    if (isMounted.current) setDurationInMinutes(120);
                } else if (foundService.pricingType === PricingType.BY_SIZE) {
                    if (isMounted.current) setSquareMeters(50);
                }

                const userAddress = typedUser?.clientDetails?.address || typedUser?.providerDetails?.address;
                if (userAddress) {
                    if (isMounted.current) {
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
                    }
                } else {
                    NotificationUIService.showInfo(
                        t('schedule_service.address_needed_message', { defaultValue: 'Informe o endereço para continuar.' }),
                        t('schedule_service.address_needed_title', { defaultValue: 'Endereço Necessário' })
                    );
                }

                if (isMounted.current) {
                    setSelectedDate(new Date());
                }

                const today = new Date();
                const nextMonth = new Date(today.getFullYear(), today.getMonth() + 1, 1);
                const prevMonth = new Date(today.getFullYear(), today.getMonth() - 1, 1);
                await prefetchAvailability(paramProviderId, today);
                await prefetchAvailability(paramProviderId, nextMonth);
                await prefetchAvailability(paramProviderId, prevMonth);

                if (initialCouponCodeString) {
                    setTimeout(() => {
                        if (isMounted.current) handleApplyCoupon();
                    }, 500);
                }

            } catch (error: any) {
                console.error("Erro ao carregar dados iniciais:", error.response?.data || error.message);
                if (isMounted.current) {
                    NotificationUIService.showError(
                        error.response?.data?.message || t('common.network_error', { defaultValue: 'Erro de rede.' }),
                        t('common.error', { defaultValue: 'Erro' })
                    );
                    router.replace('/explore');
                }
            } finally {
                if (isMounted.current) {
                    setIsLoading(false);
                }
            }
        };
        loadInitialData();
    }, [paramProviderId, typedUser?.id, paramServiceId, router, prefetchAvailability, initialCouponCodeString, handleApplyCoupon, t]);

    const animateShine = useCallback(() => {
        shineAnim.setValue(-SCREEN_WIDTH * 0.3);
        const animation = Animated.timing(shineAnim, {
            toValue: SCREEN_WIDTH + (SCREEN_WIDTH * 0.3),
            duration: 3000,
            easing: Easing.linear,
            useNativeDriver: true,
        });
        animation.start(() => {
            if (isMounted.current) animateShine();
        });
        return animation;
    }, [shineAnim]);

    useEffect(() => {
        const shineAnimation = animateShine();
        return () => shineAnimation.stop();
    }, [animateShine]);

    // ✅ CORREÇÃO: UseEffect para slots otimizado - Flag para loop, deps limpas, fallback para slots false
    useEffect(() => {
        let isCancelled = false; // Para cleanup async

        const fetchAndProcessSlotsForDate = async () => {
            if (!provider?.id || !selectedDate || isCancelled) {
                if (isMounted.current && !isCancelled) {
                    setDisplaySlotsInfo([]);
                    setSelectedTime(null);
                }
                return;
            }

            if (isMounted.current) {
                setIsFetchingSlots(true);
            }

            await new Promise(resolve => setTimeout(resolve, 200)); // Delay para animação

            // ✅ PATCH 2.1: Blindagem para selectedDate undefined no useEffect de slots
            const safeSelectedDate = selectedDate ?? new Date();
            const dateString = safeSelectedDate.toISOString().split('T')[0];
            const cacheKey = `${provider.id}-${dateString}`;

            let backendResponse: { available: ProviderAvailability[], occupiedTimes: string[] } | undefined = undefined;
            let fetchAttempts = 0;
            const maxRetries = 2;

            while (fetchAttempts < maxRetries && !backendResponse && !isCancelled) {
                try {
                    if (availabilityCache.has(cacheKey)) {
                        const cached = availabilityCache.get(cacheKey);
                        if (Date.now() - cached!.timestamp < 3600000) {
                            backendResponse = { available: cached!.available, occupiedTimes: cached!.occupiedTimes };
                        } else {
                            availabilityCache.delete(cacheKey);
                        }
                    }

                    if (!backendResponse) {
                        backendResponse = await getProviderAvailability(provider.id, dateString);
                        availabilityCache.set(cacheKey, { ...backendResponse, timestamp: Date.now() });
                    }

                    if (__DEV__) {
                        console.log(`[Slots Premium] Fetch sucesso para ${dateString}:`, {
                            available: backendResponse.available.length,
                            occupied: backendResponse.occupiedTimes.length,
                            configuredSlots: backendResponse.available.map(s => s.startTime) // ✅ CORREÇÃO: Usa s.startTime em vez de s.time (alinhado com tipo ProviderAvailability)
                        });
                    }
                } catch (err: any) {
                    fetchAttempts++;
                    if (__DEV__) {
                        console.warn(`[Slots] Retry ${fetchAttempts}/${maxRetries} para ${dateString}:`, err.message);
                    }
                    if (fetchAttempts >= maxRetries) {
                        console.error(`[Slots] Erro final para ${dateString}:`, err.response?.data || err.message);
                        if (isMounted.current && !isCancelled) {
                            NotificationUIService.showError(
                                t('schedule_service.error_fetching_slots_day', { date: dateString, defaultValue: 'Erro ao carregar horários para este dia. Tente novamente.' }),
                                t('common.error', { defaultValue: 'Erro' })
                            );
                            setDisplaySlotsInfo([]);
                            setIsFetchingSlots(false);
                        }
                        return;
                    }
                    await new Promise(resolve => setTimeout(resolve, 500 * fetchAttempts));
                }
            }

            if (!backendResponse || isCancelled) return;

            // ✅ CORREÇÃO: Filtra entradas inválidas (sem .startTime string) e normaliza shape do backend
            // Usa startTime como time principal (compatível com ProviderAvailability: startTime/endTime)
            const providerConfiguredSlots: ProviderAvailability[] =
              (backendResponse.available || [])
                .map(s => {
                  if (s && typeof s.startTime === 'string' && s.startTime.length > 0) return s; // ✅ CORREÇÃO: Verifica startTime diretamente (sem 'as any')
                  if (s && typeof (s as any).time === 'string' && (s as any).time.length > 0) {
                    // Fallback para time se backend variar (raro, mas blindagem)
                    return { ...s, startTime: (s as any).time };
                  }
                  if (s && typeof s.startTime !== 'string') {
                    // Ignora entradas inválidas sem startTime
                    return null;
                  }
                  return s; // ✅ CORREÇÃO: Mantém se válido, sem forçar time
                })
                .filter(Boolean) as ProviderAvailability[];

            const occupiedTimesFromBackend: string[] = backendResponse.occupiedTimes || [];

            const finalDisplaySlots = generateDailySlots(
                safeSelectedDate,
                providerConfiguredSlots,
                occupiedTimesFromBackend
            );

            const hasRealAvailableSlots = finalDisplaySlots.some(slot => slot.isAvailable);
            if (__DEV__ && !hasRealAvailableSlots) {
                console.warn(`[Slots] Dia ${dateString} sem slots reais (backend: ${providerConfiguredSlots.length} disponíveis):`, 
                    finalDisplaySlots.map(s => ({ time: s.time, available: s.isAvailable })));
                // ✅ SUGESTÃO: Debug generateDailySlots - verifique se horários batem (ex: '08:00' vs '8:00')
            }

            if (isMounted.current && !isCancelled) {
                setDisplaySlotsInfo(finalDisplaySlots);

                Animated.parallel([
                    Animated.timing(fadeAnim, { toValue: 1, duration: AppDurations.xs, useNativeDriver: true }), // Mais rápido
                    Animated.spring(scaleAnim, { toValue: 1, friction: 5, useNativeDriver: true }),
                ]).start();

                if (hasRealAvailableSlots && timeSlotsRef.current && scrollViewRef.current) {
                    setTimeout(() => {
                        scrollViewRef.current?.scrollTo({ y: 400, animated: true });
                    }, 300);
                }

                // LOOP INTELIGENTE: Só se zero slots e não buscando já
                if (!hasRealAvailableSlots && !isSearchingNextDate) {
                    setIsSearchingNextDate(true); // ✅ Flag para bloquear múltiplas buscas

                    NotificationUIService.showInfo(
                        t('schedule_service.searching_next_available', { defaultValue: 'Procurando próximo dia disponível...' }),
                        t('schedule_service.no_slots_title', { defaultValue: 'Buscando Horários' })
                    );

                    let foundAvailableDate = false;
                    const searchPromises = [];

                    for (let i = 1; i <= 7; i++) {
                        searchPromises.push(
                            (async (dayOffset: number) => {
                                if (isCancelled) return null;
                                const searchDate = new Date(selectedDate);
                                searchDate.setDate(selectedDate.getDate() + dayOffset);
                                const searchDateString = searchDate.toISOString().split('T')[0];
                                const searchCacheKey = `${provider.id}-${searchDateString}`;

                                let searchResponse: { available: ProviderAvailability[], occupiedTimes: string[] } | undefined;
                                if (availabilityCache.has(searchCacheKey)) {
                                    const cached = availabilityCache.get(searchCacheKey);
                                    if (Date.now() - cached!.timestamp < 3600000) {
                                        searchResponse = { available: cached!.available, occupiedTimes: cached!.occupiedTimes };
                                    }
                                }

                                if (!searchResponse && !isCancelled) {
                                    try {
                                        searchResponse = await getProviderAvailability(provider.id, searchDateString);
                                        availabilityCache.set(searchCacheKey, { ...searchResponse, timestamp: Date.now() });
                                    } catch (err: any) {
                                        if (__DEV__) console.warn(`[Loop] Erro para +${dayOffset}:`, err.message);
                                        return null;
                                    }
                                }

                                if (isCancelled) return null;

                                const searchSlots = generateDailySlots(
                                    searchDate,
                                    searchResponse?.available || [],
                                    searchResponse?.occupiedTimes || []
                                );

                                if (searchSlots.some(slot => slot.isAvailable)) {
                                    return { date: searchDate, slots: searchSlots };
                                }
                                return null;
                            })(i)
                        );
                    }

                    const results = await Promise.allSettled(searchPromises);
                    for (const result of results) {
                        if (isCancelled) break;
                        if (result.status === 'fulfilled' && result.value) {
                            const { date, slots } = result.value;
                            if (isMounted.current && !isCancelled) {
                                setSelectedDate(date);
                                setDisplaySlotsInfo(slots);
                                foundAvailableDate = true;

                                NotificationUIService.showSuccess(
                                    t('schedule_service.found_available_date', { 
                                        date: date.toLocaleDateString('pt-BR', { day: 'numeric', month: 'short' }),
                                        defaultValue: 'Horários encontrados!' 
                                    }),
                                    t('common.success', { defaultValue: 'Sucesso' })
                                );

                                Animated.sequence([
                                    Animated.timing(scaleAnim, { toValue: 0.98, duration: 150, useNativeDriver: true }),
                                    Animated.spring(scaleAnim, { toValue: 1, friction: 6, useNativeDriver: true }),
                                ]).start();

                                setTimeout(() => {
                                    if (timeSlotsRef.current && scrollViewRef.current) {
                                        scrollViewRef.current.scrollTo({ y: 400, animated: true });
                                    }
                                }, 300);

                                setSelectedTime(null);
                                break;
                            }
                        }
                    }

                    if (!isCancelled && isMounted.current) {
                        setIsSearchingNextDate(false); // ✅ Reset flag
                        if (!foundAvailableDate) {
                            NotificationUIService.showError(
                                t('schedule_service.no_available_nearby', { 
                                    defaultValue: 'Nenhum horário nos próximos 7 dias. Selecione outra data no calendário.' 
                                }),
                                t('common.error', { defaultValue: 'Erro' })
                            );
                        }
                    }
                } else if (hasRealAvailableSlots) {
                    setIsSearchingNextDate(false); // Reset se encontrou no dia atual
                }

                setIsFetchingSlots(false);
            }
        };

        fetchAndProcessSlotsForDate();

        return () => {
            isCancelled = true;
        };
    }, [selectedDate, provider?.id, prefetchAvailability, t, fadeAnim, scaleAnim]);

    const isNextButtonDisabled = useMemo(() => {
        if (currentStep === 1) {
            return !selectedTime || !address.street || !address.number || !address.neighborhood || !address.city || !address.state;
        }
        return false;
    }, [currentStep, selectedTime, address]);

    const isConfirmButtonDisabled = useMemo(() => {
        if (!selectedProviderService) return true;

        const baseDisabled = !selectedTime || !address.street || !address.number || !address.neighborhood || !address.city || !address.state || isBooking;

        if (selectedProviderService.pricingType === PricingType.HOURLY) {
            return baseDisabled || (durationInMinutes == null || durationInMinutes <= 0);
        }
        if (selectedProviderService.pricingType === PricingType.BY_SIZE) {
            return baseDisabled || (squareMeters == null || squareMeters <= 0);
        }
        return baseDisabled;
    }, [selectedTime, address, selectedProviderService, durationInMinutes, squareMeters, isBooking]);

    const confirmButtonText = useMemo(() => {
        if (finalCalculatedPrice > 0) {
            return formatBRL(finalCalculatedPrice);
        } else {
            return t('schedule_service.select_date_time_address', { defaultValue: 'Selecione Data, Hora e Endereço' });
        }
    }, [finalCalculatedPrice, t]);

    if (isLoading) {
        return (
            <View style={styles.centeredFeedback}>
                <Stack.Screen options={{ title: t("common.loading", { defaultValue: 'Carregando' }), headerShown: false }} />
                <ActivityIndicator size="large" color={AppColors.primaryInteractive} />
                <Text style={{ marginTop: 10, color: AppColors.textBody }}>{t('schedule_service.loading_initial_data', { defaultValue: 'Carregando dados iniciais...' })}</Text>
            </View>
        );
    }

    return (
        <View style={styles.fullScreenBackground}>
            <View style={styles.contentWrapper}>
                <Stack.Screen options={{ headerShown: false }} />

                <ScheduleHeader
                    onBackPress={handlePreviousStep}
                    headerTitle={t('schedule_service.header_title', { defaultValue: 'Agendar Serviço' })}
                    fadeAnim={fadeAnim}
                    slideUpAnim={slideUpAnim}
                />
                <View style={styles.stepsPill}>
                    <View key="step1" style={[
                        styles.stepItem, 
                        styles.stepItemGhost, 
                        { marginRight: 6 },
                        currentStep === 1 ? styles.stepItemActive : null
                    ]}>
                        <Text style={[
                            styles.stepGhostText,
                            currentStep === 1 ? styles.stepActiveText : null
                        ]} numberOfLines={1}>
                            {stepTitles[0]}
                        </Text>
                    </View>
                    <View key="step2" style={[
                        styles.stepItem, 
                        currentStep === 2 ? styles.stepItemActive : styles.stepItemGhost,
                        { marginRight: 6 }
                    ]}>
                        <Text style={[
                            styles.stepGhostText,
                            currentStep === 2 ? styles.stepActiveText : null
                        ]} numberOfLines={1}>
                            {stepTitles[1]}
                        </Text>
                    </View>
                </View>

                <Animated.ScrollView
                    ref={scrollViewRef}
                    contentContainerStyle={styles.scrollContentContainer}
                    style={{
                        opacity: fadeAnim,
                        transform: [{ translateY: slideUpAnim }]
                    }}
                    showsVerticalScrollIndicator={false}
                    nestedScrollEnabled={true} // ✅ FIX: Permite FlatList aninhada sem quebrar virtualização
                    // ✅ FIX: Scroll inicial sempre no topo ao montar (evita problemas iniciais)
                    onContentSizeChange={() => {
                        if (currentStep === 1) {
                            scrollViewRef.current?.scrollTo({ y: 0, animated: false });
                        }
                    }}
                >
                    {currentStep === 1 && (
                        <>
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

                            <Animated.View 
                                ref={timeSlotsRef}
                                style={{
                                    transform: [{ scale: scaleAnim }],
                                    opacity: fadeAnim
                                }}
                            >
                                <TimeSlotsSection
                                    titleKey="schedule_service.available_times"
                                    date={selectedDate}
                                    displaySlotsInfo={displaySlotsInfo}
                                    isLoading={isFetchingSlots || isSearchingNextDate} // ✅ Inclui flag na loading
                                    selectedTime={selectedTime}
                                    onTimeSelect={handleTimeSelect}
                                />
                            </Animated.View>

                            <TouchableOpacity
                                style={[styles.nextStepButton, isNextButtonDisabled && styles.nextStepButtonDisabled]}
                                onPress={handleNextStep}
                                disabled={isNextButtonDisabled}
                            >
                                <Text style={styles.nextStepButtonText}>{"Continuar"}</Text>
                            </TouchableOpacity>
                        </>
                    )}

                    {/* ✅ PREMIUM: Wrapper para step 2 com animação global de entrada (inicia baixo, sobe suave) */}
                    {currentStep === 2 && (
                        <Animated.View style={{
                            opacity: reviewStepAnim,
                            transform: [
                                { translateY: reviewStepAnim.interpolate({ inputRange: [0, 1], outputRange: [20, 0] }) }, // Menos slide para rápido
                                { scale: reviewStepAnim.interpolate({ inputRange: [0, 1], outputRange: [0.98, 1] }) } // Scale mínimo
                            ]
                        }}>
                            {selectedProviderService && (
                                <Animated.View style={[{
                                    transform: [{ scale: serviceDetailsAnim }],
                                    opacity: serviceDetailsAnim,
                                    marginTop: 0,
                                }]}>
                                    <ServiceDetailsInput
                                        pricingType={selectedProviderService.pricingType}
                                        durationInMinutes={durationInMinutes}
                                        setDurationInMinutes={setDurationInMinutes}
                                        squareMeters={squareMeters}
                                        setSquareMeters={setSquareMeters}
                                        pricePerUnit={selectedProviderService.price}
                                        finalPrice={calculatedSubtotal}
                                    />
                                </Animated.View>
                            )}

                            <Animated.View style={[styles.card, {
                                transform: [{ scale: notesAnim }],
                                opacity: notesAnim,
                                marginTop: 15,
                            }]}>
                                <NotesInputSection
                                    notes={notes}
                                    setNotes={setNotes}
                                />
                            </Animated.View>

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
                                t={t}
                                cupomEntranceAnim={cupomAnim} // Passa stagger anim
                                cupomStaggerDelay={100} // Delay mínimo
                            />

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
                                t={t}
                                reviewEntranceAnim={summaryAnim} // Passa stagger para summary
                                reviewStaggerDelay={150} // Delay mínimo
                            />
                        </Animated.View>
                    )}
                </Animated.ScrollView>

                {currentStep === 2 && selectedTime && finalCalculatedPrice > 0 && (
                    <Animated.View style={[
                        styles.floatingSummaryContainer,
                        {
                            transform: [{
                                translateY: floatingSummaryAnim.interpolate({
                                    inputRange: [0, 1],
                                    outputRange: [100, 0]
                                })
                            }],
                            opacity: floatingSummaryAnim
                        }
                    ]}>
                        <View style={styles.floatingSummaryContent}>
                            <Text style={styles.floatingSummaryText}>
                                {selectedDate.toLocaleDateString('pt-BR', { day: 'numeric', month: 'short' })} {t('common.at', { defaultValue: 'às' })} {selectedTime}
                            </Text>
                            <Text style={styles.floatingSummaryPrice}>
                                {formatBRL(finalCalculatedPrice)}
                            </Text>
                        </View>
                    </Animated.View>
                )}

                {currentStep === 2 && (
                    <ConfirmBookingButton
                        isButtonDisabled={isConfirmButtonDisabled}
                        onConfirmBooking={handleConfirmBooking}
                        isBooking={isBooking}
                        confirmButtonText={confirmButtonText}
                        selectedTime={selectedTime}
                        hasSelectedServicePrice={!!selectedProviderService?.price}
                    />
                )}
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    fullScreenBackground: {
        flex: 1,
        width: '100%',
        height: '100%',
        backgroundColor: '#FAFAFA',
    },
    contentWrapper: {
        flex: 1,
        backgroundColor: '#FAFAFA',
    },
    centeredFeedback: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#FAFAFA',
    },
    scrollContentContainer: {
        paddingBottom: 120,
        paddingTop: 10,
    },
    stepsPill: {
        marginTop: 30,
        marginBottom: 16,
        alignSelf: 'center',
        backgroundColor: 'rgba(202, 214, 241, 0.8)',
        borderRadius: 40,
        padding: 6,
        flexDirection: 'row',
        shadowColor: '#2f3344e8',
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.57,
        shadowRadius: 2,
        elevation: 6,
         borderWidth: 0.2,
        borderColor: 'rgba(85, 123, 228, 0.86)',
    },
    stepItem: {
        borderRadius: 40,
        paddingVertical: 4,
        paddingHorizontal: 6,
        flexShrink: 1,
        minWidth: 100,
       
    },
    stepItemActive: { 
        backgroundColor: AppColors.primaryInteractive 
    },
    stepActiveText: {
        color: AppColors.white,
        fontWeight: '700',
        fontSize: 11,
        textAlign: 'center',
    },
    stepItemGhost: { 
        backgroundColor: 'transparent' 
    },
    stepGhostText: {
        color: AppColors.mediumGray,
        fontWeight: '600',
        fontSize: 11,
        textAlign: 'center',
    },
    floatingSummaryContainer: {
        position: 'absolute',
        bottom: 80,
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
    /* HEADER LIMPO - sem fundo nem sombra (apenas texto refinado) */
    sectionHeaderRow: {
        marginHorizontal: 20,
        marginTop: 6,
        marginBottom: 8,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'flex-start',
    },
    sectionTitlePlain: {
        fontSize: 18,                 // um pouco menor que antes pra ficar refinado
        fontWeight: Platform.OS === 'ios' ? '600' : '700', // heavy on android, sem exagero no iOS
        color: AppColors.textBody,
        letterSpacing: 0.2,
        textTransform: 'none',
        // sem background, sem sombra
        paddingVertical: 4,
        paddingHorizontal: 0,
    },
    /* Ajuste sutil do card para visual premium: sombras mais suaves, bordas arredondadas */
    card: {
        backgroundColor: AppColors.white,
        borderRadius: 18,            // mais arredondado para look premium
        padding: 18,                 // padding levemente menor
        marginHorizontal: 18,
        marginBottom: 15,
        // sombras mais sutis (reduzidas)
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.06,
        shadowRadius: 12,
        elevation: 3,
    },
    /* Opcional: título das seções internas (se quiser manter o estilo anterior em outros lugares) */
    sectionTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: AppColors.textBody,
        marginBottom: 20,
        textAlign: 'left',
    },
    sectionHeaderTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: AppColors.textBody,
        marginHorizontal: 20,
        marginTop: 25,
        marginBottom: 15,
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
    couponFeedbackContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 10,
        paddingHorizontal: 5,
    },
    couponAppliedText: {
        marginLeft: 8,
        fontSize: 14,
        fontWeight: 'bold',
    },
    summaryItem: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 15,
    },
    summaryIcon: {
        marginRight: 15,
        width: 24,
        height: 24,
        textAlign: 'center',
    },
    summaryText: {
        fontSize: 16,
        color: AppColors.textAuxiliary,
        flex: 1,
    },
    summaryLabel: {
        fontWeight: '600',
        color: AppColors.textBody,
        marginRight: 5,
    },
    priceSummary: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginTop: 10,
        paddingVertical: 10,
        borderTopWidth: 1,
        borderTopColor: AppColors.backgroundNeutral,
    },
    priceLabel: {
        fontSize: 16,
        color: AppColors.textAuxiliary,
    },
    priceValue: {
        fontSize: 16,
        fontWeight: '600',
        color: AppColors.textBody,
    },
    discountValue: {
        color: AppColors.successStandard,
    },
    totalPriceSummary: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginTop: 15,
        paddingTop: 15,
        borderTopWidth: 2,
        borderTopColor: AppColors.primaryInteractive,
    },
    totalPriceLabel: {
        fontSize: 22,
        fontWeight: 'bold',
        color: AppColors.textBody,
    },
    totalPriceValue: {
        fontSize: 24,
        fontWeight: 'bold',
        color: AppColors.primaryInteractive,
    },
    cancellationPolicyLink: {
        marginTop: 20,
        alignSelf: 'flex-start',
    },
    cancellationPolicyText: {
        fontSize: 14,
        color: AppColors.primaryInteractive,
        textDecorationLine: 'underline',
    },
    nextStepButton: {
        backgroundColor: AppColors.primaryInteractive,
        marginHorizontal: 50,
        paddingVertical: 7,
        borderRadius: 15,
        alignItems: 'center',
        marginTop: 30,
        marginBottom: -8,
    },
    nextStepButtonDisabled: {
        backgroundColor: '#94aee688'
    },
    nextStepButtonText: {
        color: AppColors.white,
        fontSize: 16,
        fontWeight: 'bold',
    },
});