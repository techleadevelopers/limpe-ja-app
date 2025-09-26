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
    ScrollView, // ADICIONADO: Para ref no Animated.ScrollView (tipagem)
} from 'react-native';
import { useTranslation } from 'react-i18next';

import NotificationUIService from '../../../services/notificationUIService';

import { useAuth } from '../../../hooks/useAuth';
import { createBooking } from '../../../services/bookingService';
import { getProviderAvailability, getProviderDetails } from '../../../services/providerService';
// import { applyCoupon } from '../../../services/clientService'; // Removido, agora no hook

import { BookingAddress, BookingDetails, CreateBookingDto, BookingPricing } from '../../../types/backend/bookings';
import {
    ProviderAvailability,
    ProviderDisplayInfo,
    ProviderServiceOffering
} from '../../../types/backend/providers';
import { UserProfile } from '../../../types/backend/users';
import { PricingType } from '../../../types/backend/services';
import { formatDate } from '../../../utils/helpers';
// Importar formatBRL para formatação monetária consistente
import { formatBRL } from '../../../utils/formatters';

// Novos hooks e utilitários
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

import backImage from '../../../assets/images/back.png';

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
}: BookingSummaryPreviewProps) => {
    if (!selectedProviderService || !selectedTime) return null;

    const formattedDate = selectedDate.toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' });
    const serviceDetailsText = useMemo(() => {
        if (selectedProviderService.pricingType === PricingType.HOURLY && durationInMinutes) {
            return `${durationInMinutes} ${t('common.minutes_short', { maxFontSizeMultiplier: 1.2 })}`;
        }
        if (selectedProviderService.pricingType === PricingType.BY_SIZE && squareMeters) {
            return `${squareMeters} m²`;
        }
        return 'N/A';
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
            <Text style={styles.sectionTitle} maxFontSizeMultiplier={1.2}>{t('schedule_service.review_booking_title')}</Text>
            <View style={styles.summaryItem}>
                <Animated.View style={animatedIconStyle}>
                    <Ionicons name="briefcase-outline" size={20} color={AppColors.primaryInteractive} style={styles.summaryIcon} />
                </Animated.View>
                <Text style={styles.summaryText} maxFontSizeMultiplier={1.2}>
                    <Text style={styles.summaryLabel} maxFontSizeMultiplier={1.2}>{t('schedule_service.summary_service')}</Text> {selectedProviderService.service?.name}
                </Text>
            </View>
            <View style={styles.summaryItem}>
                <Animated.View style={animatedIconStyle}>
                    <Ionicons name="person-outline" size={20} color={AppColors.primaryInteractive} style={styles.summaryIcon} />
                </Animated.View>
                <Text style={styles.summaryText} maxFontSizeMultiplier={1.2}>
                    <Text style={styles.summaryLabel} maxFontSizeMultiplier={1.2}>{t('schedule_service.summary_provider')}</Text> {provider?.fullName}
                </Text>
            </View>
            <View style={styles.summaryItem}>
                <Animated.View style={animatedIconStyle}>
                    <Ionicons name="calendar-outline" size={20} color={AppColors.primaryInteractive} style={styles.summaryIcon} />
                </Animated.View>
                <Text style={styles.summaryText} maxFontSizeMultiplier={1.2}>
                    <Text style={styles.summaryLabel} maxFontSizeMultiplier={1.2}>{t('schedule_service.summary_date_time')}</Text> {formattedDate}, {t('common.at', { maxFontSizeMultiplier: 1.2 })} {selectedTime}
                </Text>
            </View>
            <View style={styles.summaryItem}>
                <Animated.View style={animatedIconStyle}>
                    <Ionicons name="location-outline" size={20} color={AppColors.primaryInteractive} style={styles.summaryIcon} />
                </Animated.View>
                <Text style={styles.summaryText} maxFontSizeMultiplier={1.2}>
                    <Text style={styles.summaryLabel} maxFontSizeMultiplier={1.2}>{t('schedule_service.summary_address')}</Text> {address.street}, {address.number} - {address.neighborhood}, {address.city}/{address.state}
                </Text>
            </View>
            {(selectedProviderService.pricingType === PricingType.HOURLY || selectedProviderService.pricingType === PricingType.BY_SIZE) && (
                <View style={styles.summaryItem}>
                    <Animated.View style={animatedIconStyle}>
                        <Ionicons name="timer-outline" size={20} color={AppColors.primaryInteractive} style={styles.summaryIcon} />
                    </Animated.View>
                    <Text style={styles.summaryText} maxFontSizeMultiplier={1.2}>
                        <Text style={styles.summaryLabel} maxFontSizeMultiplier={1.2}>{t('schedule_service.summary_service_details')}</Text> {serviceDetailsText}
                    </Text>
                </View>
            )}
            <View style={styles.priceSummary}>
                <Text style={styles.priceLabel} maxFontSizeMultiplier={1.2}>{t('schedule_service.subtotal')}</Text>
                <Text style={styles.priceValue} maxFontSizeMultiplier={1.2}>{formatBRL(subtotal)}</Text>
            </View>
            {discountAmount > 0 && (
                <View style={styles.priceSummary}>
                    <Text style={styles.priceLabel} maxFontSizeMultiplier={1.2}>{t('schedule_service.discount')}</Text>
                    <Text style={[styles.priceValue, styles.discountValue]} maxFontSizeMultiplier={1.2}>- {formatBRL(discountAmount)}</Text>
                </View>
            )}
            <View style={styles.totalPriceSummary}>
                <Text style={styles.totalPriceLabel} maxFontSizeMultiplier={1.2}>{t('schedule_service.total_to_pay')}</Text>
                <Animated.Text style={[styles.totalPriceValue, { transform: [{ scale: finalPriceAnim.interpolate({ inputRange: [0, 1], outputRange: [0.95, 1] }) }] }]} maxFontSizeMultiplier={1.2}>
                    {formatBRL(finalPrice)}
                </Animated.Text>
            </View>
            <TouchableOpacity onPress={onShowCancellationPolicy} style={styles.cancellationPolicyLink}>
                <Text style={styles.cancellationPolicyText} maxFontSizeMultiplier={1.2}>{t('schedule_service.cancellation_policy')}</Text>
            </TouchableOpacity>
        </Animated.View>
    );
};

const CouponInputSection = ({ couponCode, setCouponCode, onApplyCoupon, isApplyingCoupon, discountAmount, couponInputAnim, couponFeedbackAnim, couponFeedbackColor, couponFeedbackIcon, t }: CouponInputSectionProps) => {
    return (
        <Animated.View style={[styles.card, { marginTop: 20 }]}>
            <Text style={styles.sectionTitle} maxFontSizeMultiplier={1.2}>{t('schedule_service.coupon_section_title')}</Text>
            <Animated.View style={[styles.couponInputContainer, { borderColor: couponInputAnim.interpolate({
                inputRange: [0, 1],
                outputRange: [AppColors.borderNeutral, AppColors.primaryInteractive]
            }) }]}>
                <AnimatedTextInput
                    style={styles.couponInput}
                    placeholder={t('schedule_service.coupon_input_placeholder')}
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
                    maxFontSizeMultiplier={1.2} // Adicionado para consistência
                />
                <TouchableOpacity
                    style={styles.applyCouponButton}
                    onPress={onApplyCoupon}
                    disabled={isApplyingCoupon || !couponCode}
                >
                    {isApplyingCoupon ? (
                        <ActivityIndicator size="small" color={AppColors.white} />
                    ) : (
                        <Text style={styles.applyCouponButtonText} maxFontSizeMultiplier={1.2}>{t('schedule_service.apply_coupon_button')}</Text>
                    )}
                </TouchableOpacity>
            </Animated.View>
            {discountAmount > 0 && (
                <Animated.View style={[styles.couponFeedbackContainer, { opacity: couponFeedbackAnim, transform: [{ translateY: couponFeedbackAnim.interpolate({ inputRange: [0, 1], outputRange: [10, 0] }) }] }]}>
                    <Ionicons name={couponFeedbackIcon as any} size={18} color={couponFeedbackColor} />
                    <Text style={[styles.couponAppliedText, { color: couponFeedbackColor }]} maxFontSizeMultiplier={1.2}>
                        {t('schedule_service.coupon_applied_message', { discountValue: formatBRL(discountAmount), maxFontSizeMultiplier: 1.2 })}
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

    const [currentStep, setCurrentStep] = useState(1);

    // ADICIONADO: Refs para scroll suave no step moderno (data → timeslot)
    const scrollViewRef = useRef<ScrollView>(null);
    const timeSlotsRef = useRef<View>(null);

    // Adicionado ref para verificar se o componente está montado
    const isMounted = useRef(true);

    // Usando o hook useBookingPricing
    const { calculatedSubtotal, finalCalculatedPrice } = useBookingPricing({
        selectedProviderService,
        durationInMinutes,
        squareMeters,
        discountAmount,
    });

    const stepTitles = [t('schedule_service.progress_step_date_time'), t('schedule_service.progress_step_complete_review')];

    // PREMIUM: Prefetch com TTL e limpeza de cache antigo (evita dados velhos, paralelo com allSettled)
    const prefetchAvailability = useCallback(async (provId: string | undefined, baseDate: Date) => {
        if (!provId) return;

        // Limpa cache antigo (>1h) antes de prefetch (premium: gerencia memória)
        const now = Date.now();
        for (const [key, value] of availabilityCache.entries()) {
            if (now - value.timestamp > 3600000) { // 1h TTL
                availabilityCache.delete(key);
            }
        }

        // Pré-carrega baseDate e +/- 3 dias (paralelo para robustez e velocidade)
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

        // Fetch paralelo: Não falha se um dia errar (allSettled premium)
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
        isMounted.current = true; // Componente montado

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

        // Animações de loop
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
                useNativeDriver: false, // Correctly false for color-related animation
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

        // Cleanup das animações ao desmontar o componente ou ao re-renderizar
        return () => {
            isMounted.current = false; // Componente desmontado
            pulseLoop.stop();
            rotateLoop.stop();
            floatLoop.stop();
            headerGlowLoop.stop();
            calendarBreatheLoop.stop();
        };
    }, []);

    useEffect(() => {
        if (currentStep === 2 && selectedTime && finalCalculatedPrice > 0) {
            Animated.timing(floatingSummaryAnim, {
                toValue: 1,
                duration: AppDurations.md,
                easing: Easing.out(Easing.ease),
                useNativeDriver: true,
            }).start();
        } else {
            Animated.timing(floatingSummaryAnim, {
                toValue: 0,
                duration: AppDurations.md,
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

    // ALTERADO: handleDaySelect moderno - animação, scroll suave para timeslots, prefetch adjacente, reset time
    const handleDaySelect = useCallback((dateObj: Date) => {
        // Animação suave no calendário (usando existentes)
        Animated.sequence([
            Animated.timing(scaleAnim, { toValue: 0.98, duration: AppDurations.xs, useNativeDriver: true }),
            Animated.spring(scaleAnim, { toValue: 1, friction: 6, useNativeDriver: true }),
        ]).start();

        setSelectedDate(dateObj);

        // Pré-carrega slots para datas próximas (conforto em mudanças rápidas)
        prefetchAvailability(provider?.id, dateObj);

        // Scroll suave até timeslots após ~300ms (tempo de fetch + animação), guiando o usuário
        setTimeout(() => {
            if (timeSlotsRef.current && scrollViewRef.current) {
                scrollViewRef.current.scrollTo({
                    y: 400, // Ajuste este valor baseado na posição real dos timeslots no seu layout (teste em dispositivo)
                    animated: true,
                });
            }
        }, 300);

        // Reset selectedTime para forçar re-seleção (foco no step atual)
        setSelectedTime(null);
    }, [provider?.id, scaleAnim, prefetchAvailability]);

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
            NotificationUIService.showInfo(t('schedule_service.unavailable_time_slot_message'), t('schedule_service.unavailable_time_slot'));
        }
    }, [displaySlotsInfo, selectionAnim, t]);

    // O handleApplyCoupon foi movido para o useCouponValidation hook

    const showCancellationPolicy = useCallback(() => {
        NotificationUIService.showInfo(t('schedule_service.cancellation_policy_message'), t('schedule_service.cancellation_policy_title'));
    }, [t]);

    const handlePanic = useCallback(() => {
        Alert.alert(
            t('safety.panic.button_pressed_title'),
            t('safety.panic.button_pressed_message'),
            [
                { text: t('common.cancel'), style: 'cancel' },
                { text: t('common.confirm'), onPress: () => setPanicStatus('RECEIVED') }
            ]
        );
    }, [t]);

    const handleNextStep = useCallback(() => {
        if (currentStep === 1) {
            if (!selectedTime || !address.street || !address.number || !address.neighborhood || !address.city || !address.state) {
                NotificationUIService.showError(t('schedule_service.step1_validation_error'), t('common.error'));
                return;
            }
        }
        setCurrentStep(prev => prev + 1);
    }, [currentStep, selectedTime, address, t]);

    const handlePreviousStep = useCallback(() => {
        if (currentStep > 1) {
            setCurrentStep(prev => prev - 1);
        } else {
            router.back();
        }
    }, [currentStep, router]);


    const handleConfirmBooking = useCallback(async () => {
        if (!typedUser?.id || !provider?.id || !selectedProviderService?.id || !selectedDate || !selectedTime ||
            !address.street || !address.number || !address.neighborhood || !address.city || !address.state) {
            NotificationUIService.showError(t('schedule_service.booking_error_message'), t('schedule_service.booking_error_title'));
            return;
        }

        if (selectedProviderService?.pricingType === PricingType.HOURLY && (durationInMinutes == null || durationInMinutes <= 0)) {
            NotificationUIService.showError(t('schedule_service.booking_error_duration_size', { field: t('common.duration') }), t('schedule_service.booking_error_title'));
            return;
        }
        if (selectedProviderService?.pricingType === PricingType.BY_SIZE && (squareMeters == null || squareMeters <= 0)) {
            NotificationUIService.showError(t('schedule_service.booking_error_duration_size', { field: t('common.area') }), t('schedule_service.booking_error_title'));
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

            const bookingData: CreateBookingDto = {
                providerId: provider.id,
                providerServiceId: selectedProviderService.id,
                scheduledDate: selectedDate.toISOString().split('T')[0],
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
                    // ATENÇÃO: paymentMethod está fixo como 'PIX'. Considere torná-lo dinâmico
                    // se você planeja oferecer múltiplas opções de pagamento.
                    paymentMethod: 'PIX', // PONTO DE ATENÇÃO: Hardcoded payment method
                    couponApplied: discountAmount > 0 ? 'true' : 'false',
                    couponCode: discountAmount > 0 ? couponCode : undefined,
                }
            });
            NotificationUIService.showSuccess(t('schedule_service.booking_success_message'), t('common.success'));

        } catch (error: any) {
            console.error("Erro ao agendar serviço:", error.response?.data || error.message);
            if (isMounted.current) {
                NotificationUIService.showError(error.response?.data?.message || t('common.network_error'), t('common.error'));
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
                    NotificationUIService.showError(t('schedule_service.navigation_error_essential_data'), t('common.error'));
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
                        NotificationUIService.showError(t('schedule_service.service_not_available'), t('common.error'));
                        router.replace('/explore');
                        setIsLoading(false);
                    }
                    return;
                }
                if (isMounted.current) {
                    setSelectedProviderService(foundService);
                }
                console.log("Serviço carregado:", foundService);

                if(foundService.pricingType === PricingType.HOURLY) {
                    if (isMounted.current) setDurationInMinutes(120);
                } else if(foundService.pricingType === PricingType.BY_SIZE) {
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
                    NotificationUIService.showInfo(t('schedule_service.address_needed_message'), t('schedule_service.address_needed_title'));
                }

                if (isMounted.current) {
                    setSelectedDate(new Date());
                }

                const today = new Date();
                const nextMonth = new Date(today.getFullYear(), today.getMonth() + 1, 1);
                const prevMonth = new Date(today.getFullYear(), today.getMonth() - 1, 1);
                await prefetchAvailability(paramProviderId, today); // Agora expandido para +/-3 dias
                await prefetchAvailability(paramProviderId, nextMonth);
                await prefetchAvailability(paramProviderId, prevMonth);

                if (initialCouponCodeString) {
                    // Chamar o handleApplyCoupon do hook useCouponValidation
                    setTimeout(() => {
                        if (isMounted.current) handleApplyCoupon();
                    }, 500);
                }

            } catch (error: any) {
                console.error("Erro ao carregar dados iniciais:", error.response?.data || error.message);
                if (isMounted.current) {
                    NotificationUIService.showError(error.response?.data?.message || t('common.network_error'), t('common.error'));
                    router.replace('/explore');
                }
            } finally {
                if (isMounted.current) {
                    setIsLoading(false);
                }
            }
        };
        loadInitialData();
    }, [paramProviderId, typedUser?.id, paramServiceId, router, prefetchAvailability, t, initialCouponCodeString, handleApplyCoupon]); // Adicionado handleApplyCoupon às dependências

    const animateShine = useCallback(() => {
        shineAnim.setValue(-SCREEN_WIDTH * 0.3);
        const animation = Animated.timing(shineAnim, {
            toValue: SCREEN_WIDTH + (SCREEN_WIDTH * 0.3),
            duration: 3000,
            easing: Easing.linear,
            useNativeDriver: true,
        });
        animation.start(() => {
            if (isMounted.current) animateShine(); // Loop apenas se o componente ainda estiver montado
        });
        return animation; // Retorna a animação para poder pará-la
    }, [shineAnim]);

    useEffect(() => {
        const shineAnimation = animateShine();
        return () => shineAnimation.stop(); // Cleanup
    }, [animateShine]);

    // PREMIUM: UseEffect para fetch de slots - Prioriza selectedDate com retry, loop só se zero slots reais
    useEffect(() => {
        const fetchAndProcessSlotsForDate = async () => {
            if (!provider?.id || !selectedDate) {
                if (isMounted.current) {
                    setDisplaySlotsInfo([]);
                    setSelectedTime(null);
                }
                return;
            }

            if (isMounted.current) {
                setIsFetchingSlots(true);
            }

            // Delay suave para animação (mantido, mas opcional em prod para real-time)
            await new Promise(resolve => setTimeout(resolve, 200));

            const dateString = selectedDate.toISOString().split('T')[0];
            const cacheKey = `${provider.id}-${dateString}`;

            // PRIORIDADE 1: Fetch/Retry para selectedDate (premium: garante captura real do dia escolhido)
            let backendResponse: { available: ProviderAvailability[], occupiedTimes: string[] } | undefined = undefined;
            let fetchAttempts = 0;
            const maxRetries = 2; // Retry se falhar (ex: rede fraca)

            while (fetchAttempts < maxRetries && !backendResponse) {
                try {
                    if (availabilityCache.has(cacheKey)) {
                        const cached = availabilityCache.get(cacheKey);
                        if (Date.now() - cached!.timestamp < 3600000) { // Cache fresco?
                            backendResponse = { available: cached!.available, occupiedTimes: cached!.occupiedTimes };
                        } else {
                            availabilityCache.delete(cacheKey); // Expira cache velho
                        }
                    }

                    if (!backendResponse) {
                        backendResponse = await getProviderAvailability(provider.id, dateString);
                        availabilityCache.set(cacheKey, { ...backendResponse, timestamp: Date.now() });
                    }

                    if (__DEV__) {
                        console.log(`[Slots Premium] Fetch sucesso para ${dateString}:`, {
                            available: backendResponse.available.length,
                            occupied: backendResponse.occupiedTimes.length
                        });
                    }
                } catch (err: any) {
                    fetchAttempts++;
                    if (__DEV__) {
                        console.warn(`[Slots] Retry ${fetchAttempts}/${maxRetries} para ${dateString}:`, err.message);
                    }
                    if (fetchAttempts >= maxRetries) {
                        console.error(`[Slots] Erro final para ${dateString}:`, err.response?.data || err.message);
                        if (isMounted.current) {
                            NotificationUIService.showError(
                                t('schedule_service.error_fetching_slots_day', { date: dateString, defaultValue: 'Erro ao carregar horários para este dia. Tente novamente.' }),
                                t('common.error')
                            );
                            setDisplaySlotsInfo([]); // Fallback: Sem slots
                            setIsFetchingSlots(false);
                        }
                        return;
                    }
                    // Delay entre retries (rede)
                    await new Promise(resolve => setTimeout(resolve, 500 * fetchAttempts));
                }
            }

            if (!backendResponse) return; // Sem dados após retries

            const providerConfiguredSlots: ProviderAvailability[] = backendResponse.available || [];
            const occupiedTimesFromBackend: string[] = backendResponse.occupiedTimes || [];

            // GERAÇÃO MELHORADA: Validação extra para garantir isAvailable correto (premium: evita falso "zero slots")
            const finalDisplaySlots = generateDailySlots(
                selectedDate,
                providerConfiguredSlots,
                occupiedTimesFromBackend
            );

            // VALIDAÇÃO PREMIUM: Check rigoroso - só considera "zero slots" se realmente nenhum disponível
            const hasRealAvailableSlots = finalDisplaySlots.some(slot => slot.isAvailable);
            if (__DEV__ && !hasRealAvailableSlots) {
                console.warn(`[Slots] Dia ${dateString} sem slots reais:`, finalDisplaySlots.map(s => ({ time: s.time, available: s.isAvailable })));
            }

            if (isMounted.current) {
                setDisplaySlotsInfo(finalDisplaySlots);

                // Animação fade-in (mantida)
                Animated.parallel([
                    Animated.timing(fadeAnim, { toValue: 1, duration: AppDurations.sm, useNativeDriver: true }),
                    Animated.spring(scaleAnim, { toValue: 1, friction: 5, useNativeDriver: true }),
                ]).start();

                // SCROLL SUAVE PARA TIMESLOTS (mantido, mas só se tem slots)
                if (hasRealAvailableSlots && timeSlotsRef.current && scrollViewRef.current) {
                    setTimeout(() => {
                        scrollViewRef.current?.scrollTo({ y: 400, animated: true });
                    }, 300);
                }

                // LOOP INTELIGENTE: SÓ SE ZERO SLOTS REAIS NO DIA SELECIONADO
                if (!hasRealAvailableSlots) {
                    // Notificação progressiva (premium: UX informativa)
                    NotificationUIService.showInfo(
                        t('schedule_service.searching_next_available', { defaultValue: 'Procurando próximo dia disponível...' }),
                        t('schedule_service.no_slots_title', { defaultValue: 'Buscando Horários' })
                    );

                    let foundAvailableDate = false;
                    const searchPromises = []; // Paralelo para velocidade

                    // Busca paralela +1 a +7 dias (premium: allSettled, não falha total)
                    for (let i = 1; i <= 7; i++) {
                        searchPromises.push(
                            (async (dayOffset: number) => {
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

                                if (!searchResponse) {
                                    try {
                                        searchResponse = await getProviderAvailability(provider.id, searchDateString);
                                        availabilityCache.set(searchCacheKey, { ...searchResponse, timestamp: Date.now() });
                                    } catch (err: any) {
                                        if (__DEV__) console.warn(`[Loop] Erro para +${dayOffset}:`, err.message);
                                        return null; // Pula dia com erro
                                    }
                                }

                                const searchSlots = generateDailySlots(
                                    searchDate,
                                    searchResponse?.available || [],
                                    searchResponse?.occupiedTimes || []
                                );

                                // Retorna {date, slots} se tem disponíveis
                                if (searchSlots.some(slot => slot.isAvailable)) {
                                    return { date: searchDate, slots: searchSlots };
                                }
                                return null;
                            })(i)
                        );
                    }

                    // Executa buscas paralelas e processa a primeira com slots
                    const results = await Promise.allSettled(searchPromises);
                    for (const result of results) {
                        if (result.status === 'fulfilled' && result.value) {
                            const { date, slots } = result.value;
                            if (isMounted.current) {
                                setSelectedDate(date); // Atualiza data automaticamente
                                setDisplaySlotsInfo(slots);
                                foundAvailableDate = true;

                                // Sucesso premium: Notificação + animação + scroll
                                NotificationUIService.showSuccess(
                                    t('schedule_service.found_available_date', { 
                                        date: date.toLocaleDateString('pt-BR', { day: 'numeric', month: 'short' }),
                                        defaultValue: 'Horários encontrados!' 
                                    }),
                                    t('common.success')
                                );

                                // Animação de transição suave
                                Animated.sequence([
                                    Animated.timing(scaleAnim, { toValue: 0.98, duration: 150, useNativeDriver: true }),
                                    Animated.spring(scaleAnim, { toValue: 1, friction: 6, useNativeDriver: true }),
                                ]).start();

                                // Scroll para timeslots
                                setTimeout(() => {
                                    if (timeSlotsRef.current && scrollViewRef.current) {
                                        scrollViewRef.current.scrollTo({ y: 400, animated: true });
                                    }
                                }, 300);

                                // Reset time para nova data
                                setSelectedTime(null);
                                break;
                            }
                        }
                    }

                    if (!foundAvailableDate) {
                        // Fallback premium: Erro amigável + opção manual
                        NotificationUIService.showError(
                            t('schedule_service.no_available_nearby', { 
                                defaultValue: 'Nenhum horário nos próximos 7 dias. Selecione outra data no calendário.' 
                            }),
                            t('common.error')
                        );
                        // Opcional: Volta para data original ou abre calendário expandido
                    }
                }

                setIsFetchingSlots(false);
            }
        };

        fetchAndProcessSlotsForDate();
    }, [selectedDate, provider?.id, t, fadeAnim, scaleAnim]); // Dependências mantidas

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
            return t('schedule_service.select_date_time_address');
        }
    }, [finalCalculatedPrice, t]);

    if (isLoading) {
        return (
            <View style={styles.centeredFeedback}>
                <Stack.Screen options={{ title: t("common.loading"), headerShown: false }} />
                <ActivityIndicator size="large" color={AppColors.primaryInteractive} />
                <Text style={{ marginTop: 10, color: AppColors.textBody }} maxFontSizeMultiplier={1.2}>{t('schedule_service.loading_initial_data')}</Text>
            </View>
        );
    }

    return (
        <View style={styles.fullScreenBackground}>
            <View style={styles.contentWrapper}>
                <Stack.Screen options={{ headerShown: false }} />

                <ScheduleHeader
                    onBackPress={handlePreviousStep}
                    headerTitle={t('schedule_service.header_title')}
                    fadeAnim={fadeAnim}
                    slideUpAnim={slideUpAnim}
                    showBackButton={currentStep > 1}
                />
                {/* Tabs Pill para steps, igual ao tema Round Trip: "Data e Hora" ativo/ghost, "Revisão Completa" */}
                <View style={styles.stepsPill}>
                    <View style={[
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
                    <View style={[
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

                {/* ALTERADO: Animated.ScrollView com ref para scroll suave no step */}
                <Animated.ScrollView
                    ref={scrollViewRef} // Ref para scroll automático até timeslots
                    contentContainerStyle={styles.scrollContentContainer}
                    style={{
                        opacity: fadeAnim,
                        transform: [{ translateY: slideUpAnim }]
                    }}
                    showsVerticalScrollIndicator={false}
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

                            {/* ALTERADO: Ref na View dos timeslots para scroll preciso */}
                            <Animated.View 
                                ref={timeSlotsRef} // Ref para posicionar o scroll
                                style={{
                                    transform: [{ scale: scaleAnim }],
                                    opacity: fadeAnim
                                }}
                            >
                                <TimeSlotsSection
                                    titleKey="schedule_service.available_times"
                                    date={selectedDate}
                                    displaySlotsInfo={displaySlotsInfo}
                                    isLoading={isFetchingSlots}
                                    selectedTime={selectedTime}
                                    onTimeSelect={handleTimeSelect}
                                />
                            </Animated.View>

                            <TouchableOpacity
                                style={[styles.nextStepButton, isNextButtonDisabled && styles.nextStepButtonDisabled]}
                                onPress={handleNextStep}
                                disabled={isNextButtonDisabled}
                            >
                                <Text style={styles.nextStepButtonText} maxFontSizeMultiplier={1.2}>{"Continuar"}</Text>
                            </TouchableOpacity>
                        </>
                    )}

                    {currentStep === 2 && (
                        <>
                            {selectedProviderService && (
                                <Animated.View style={[{
                                    transform: [{ scale: scaleAnim }],
                                    opacity: fadeAnim,
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
                                transform: [{ scale: scaleAnim }],
                                opacity: fadeAnim,
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
                            />
                        </>
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
                            <Text style={styles.floatingSummaryText} maxFontSizeMultiplier={1.2}>
                                {selectedDate.toLocaleDateString('pt-BR', { day: 'numeric', month: 'short' })} {t('common.at', { maxFontSizeMultiplier: 1.2 })} {selectedTime}
                            </Text>
                            <Text style={styles.floatingSummaryPrice} maxFontSizeMultiplier={1.2}>
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
                        hasSelectedServicePrice={selectedProviderService?.price != null}
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
        backgroundColor: '#FAFAFA', // Fundo branco com tom leve de cinza para look premium moderno (iOS/Android)
    },
    contentWrapper: {
        flex: 1,
        backgroundColor: '#FAFAFA', // Mantém o fundo leve e premium
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
    // Estilos para Tabs Pill dos steps, igual ao tema Round Trip (header)
    stepsPill: {
        marginTop: 30,
        marginBottom: 3,
        alignSelf: 'center',
        backgroundColor: 'rgba(202, 214, 241, 0.8)', // Fundo semi-transparente como no header
        borderRadius: 40,
        padding: 6,
        flexDirection: 'row',
                shadowColor: '#2f3344e8', // Cor da sombra
        shadowOffset: { width: 0, height: 1 }, // Deslocamento vertical mais pronunciado
        shadowOpacity: 0.17, // Opacidade aumentada para robustezs
        shadowRadius: 9, // Raio de desfoque para conforto
        elevation: 6, // Elevação aumentada para robustez no Android
    },
    stepItem: {
        borderRadius: 40,
        paddingVertical: 5,
        paddingHorizontal: 9,
        flexShrink: 1,
        minWidth: 100, // Largura mínima para acomodar textos longos
        borderWidth: 1,
        borderColor: AppColors.borderNeutral,
    },
    stepItemActive: { 
        backgroundColor: AppColors.primaryInteractive // Fundo azul para ativo, como Round Trip
    },
    stepActiveText: {
        color: AppColors.white, // Texto branco no ativo para contraste
        fontWeight: '700',
        fontSize: 10, // Tamanho maior para legibilidade dos textos dos steps
        textAlign: 'center',
    },
    stepItemGhost: { 
        backgroundColor: 'transparent' 
    },
    stepGhostText: {
        color: AppColors.mediumGray, // Cinza para ghosts, como no header
        fontWeight: '600',
        fontSize: 10,
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
    card: {
        backgroundColor: AppColors.white, // Cards brancos com sombra leve, mantidos como solicitado
        borderRadius: 15,
        padding: 20,
        marginHorizontal: 20,
        marginBottom: 15,
        ...AppShadows.medium, // Sombra leve para tom premium
    },
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
        marginHorizontal: 20,
        paddingVertical: 15,
        borderRadius: 15,
        alignItems: 'center',
        marginTop: 30,
        marginBottom: 20,
    },
    nextStepButtonDisabled: {
        backgroundColor: AppColors.mediumGray,
    },
    nextStepButtonText: {
        color: AppColors.white,
        fontSize: 18,
        fontWeight: 'bold',
    },
});