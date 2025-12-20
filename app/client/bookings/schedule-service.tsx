import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Animated,
  Easing,
  Platform,
  Pressable,
  ScrollView,
  StyleProp,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  ViewStyle,
  Modal,
} from 'react-native';
import { useTranslation } from 'react-i18next';

import NotificationUIService from '../../../services/notificationUIService';

import { useAuth } from '../../../hooks/useAuth';
import { createBooking } from '../../../services/bookingService';
import { getProviderAvailability, getProviderDetails } from '../../../services/providerService';

import { BookingAddress, BookingDetails, CreateBookingDto } from '../../../types/backend/bookings';
import { ProviderAvailability, ProviderDisplayInfo, ProviderServiceOffering } from '../../../types/backend/providers';
import { UserProfile } from '../../../types/backend/users';
import { PricingType } from '../../../types/backend/services';
import { formatBRL } from '../../../utils/formatters';

import { useBookingPricing } from '../../../utils/useBookingPricing';
import { useCouponValidation } from '../../../utils/useCouponValidation';
import { generateDailySlots } from '../../../utils/timeSlots';

import AddressSection from '../../../components/client/booking/schedule/AddressSection';
import ProviderBrief from '../../../components/client/booking/schedule/ProviderBrief';
import TimeSlotsSection from '../../../components/client/booking/schedule/TimeSlotsSection';

import ScheduleHeader from '../../../components/client/booking/schedule/ScheduleHeader';
import ScheduleCalendar from '../../../components/client/booking/schedule/ScheduleCalendar';
import NotesInputSection from '../../../components/client/booking/schedule/NotesInputSection';
import ConfirmBookingButton from '../../../components/client/booking/schedule/ConfirmBookingButton';

import { AppColors, AppDurations, AppShadows, SCREEN_WIDTH } from '../../../constants/appStyles';
import { useDevice } from '@/utils/responsive';

const AnimatedTextInput = Animated.createAnimatedComponent(TextInput);

const MIN_HOURLY_MINUTES = 240; // 4h reais
const MIN_HOURLY_SLOTS = 4;

const toMinutes = (time: string) => {
  const [h, m] = time.split(':').map(Number);
  return h * 60 + m;
};

const SafetyReminderBanner = () => (
  <View style={styles.safetyBannerContainer}>
    <LinearGradient
      colors={['#EAF3FF', '#DCEBFF']}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.safetyBannerCard}
    >
      <View style={styles.safetyBannerLeft}>
        <View style={styles.safetyBannerIconBadge}>
          <Ionicons name="shield-checkmark" size={18} color="#fff" />
        </View>

        <View style={{ flex: 1 }}>
          <Text style={styles.safetyBannerSubtitle} numberOfLines={3}>
            Guarde objetos de alto valor e mantenha itens pessoais protegidos durante o serviço de limpeza.
          </Text>
        </View>
      </View>
    </LinearGradient>
  </View>
);

const SERVICE_OPTIONS = [
  { id: 'residencial', label: 'Residencial', icon: 'home', set: 'ion' },
  { id: 'comercial', label: 'Comercial', icon: 'office-building', set: 'mci' },
  { id: 'escritorio', label: 'Escritório', icon: 'desktop-outline', set: 'ion' },
  { id: 'pos_obra', label: 'Pós-Obra', icon: 'hammer-wrench', set: 'mci' },
];

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
  notes: string;
  setNotes: React.Dispatch<React.SetStateAction<string>>;
  couponCode: string;
  setCouponCode: React.Dispatch<React.SetStateAction<string>>;
  onApplyCoupon: () => Promise<void>;
  isApplyingCoupon: boolean;
  couponInputAnim: Animated.Value;
  couponFeedbackAnim: Animated.Value;
  couponFeedbackColor: string;
  couponFeedbackIcon: string;
  reviewEntranceAnim?: Animated.Value;
  reviewStaggerDelay?: number;
  notesAnim?: Animated.Value;
  cupomAnim?: Animated.Value;
  summaryAnim?: Animated.Value;
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
  notes,
  setNotes,
  couponCode,
  setCouponCode,
  onApplyCoupon,
  isApplyingCoupon,
  couponInputAnim,
  couponFeedbackAnim,
  couponFeedbackColor,
  couponFeedbackIcon,
  reviewEntranceAnim,
  reviewStaggerDelay = 0,
  notesAnim,
  cupomAnim,
  summaryAnim,
}: BookingSummaryPreviewProps) => {
  const hasSelection = Boolean(selectedProviderService && selectedTime);
  const { isLargePhone } = useDevice();

  const rCard: StyleProp<ViewStyle> = useMemo(
    () => (isLargePhone ? { alignSelf: 'center', width: '100%', maxWidth: 820 } : undefined),
    [isLargePhone],
  );

  const formattedDate = selectedDate.toLocaleDateString('pt-BR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  });

  const serviceDetailsText = useMemo(() => {
    if (!selectedProviderService) return t('common.na', { defaultValue: 'N/A' });

    if (selectedProviderService.pricingType === PricingType.HOURLY && durationInMinutes) {
      const hours = durationInMinutes / 60;
      return `${t('schedule_service.summary_hours', { defaultValue: 'Horas' })}: ${hours}h`;
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
    Animated.sequence([
      Animated.timing(iconAnim, {
        toValue: 1,
        duration: AppDurations.xs,
        delay: reviewStaggerDelay,
        easing: Easing.out(Easing.ease),
        useNativeDriver: true,
      }),
    ]).start();
  }, [iconAnim, reviewStaggerDelay]);

  const animatedIconStyle = {
    opacity: iconAnim,
    transform: [
      {
        translateX: iconAnim.interpolate({
          inputRange: [0, 1],
          outputRange: [-10, 0],
        }),
      },
    ],
  };

  const reviewCardAnim = reviewEntranceAnim
    ? {
        opacity: reviewEntranceAnim,
        transform: [
          {
            translateY: reviewEntranceAnim.interpolate({
              inputRange: [0, 1],
              outputRange: [20, 0],
            }),
          },
          {
            scale: reviewEntranceAnim.interpolate({
              inputRange: [0, 1],
              outputRange: [0.98, 1],
            }),
          },
        ],
      }
    : {};

  const notesSectionAnim = notesAnim
    ? {
        opacity: notesAnim,
        transform: [
          {
            translateY: notesAnim.interpolate({
              inputRange: [0, 1],
              outputRange: [10, 0],
            }),
          },
        ],
      }
    : {};

  const cupomSectionAnim = cupomAnim
    ? {
        opacity: cupomAnim,
        transform: [
          {
            translateY: cupomAnim.interpolate({
              inputRange: [0, 1],
              outputRange: [10, 0],
            }),
          },
        ],
      }
    : {};

  const summarySectionAnim = summaryAnim
    ? {
        opacity: summaryAnim,
        transform: [
          {
            translateY: summaryAnim.interpolate({
              inputRange: [0, 1],
              outputRange: [10, 0],
            }),
          },
        ],
      }
    : {};

  const formattedAddress = useMemo(() => {
    return `${address.street || ''}, ${address.number || ''} - ${address.neighborhood || ''}, ${address.city || ''}/${address.state || ''}`.trim();
  }, [address]);

  if (!hasSelection || !selectedProviderService || !selectedTime) {
    return null;
  }

  return (
    <Animated.View style={[styles.card, rCard, { marginTop: 20 }, reviewCardAnim]}>
      <View style={[styles.sectionHeaderRow, { justifyContent: 'center' }]}>
        <Text style={[styles.sectionTitlePlain, { textAlign: 'center' }]}>
          {t('schedule_service.review_booking_title', { defaultValue: 'Revise seu agendamento' })}
        </Text>
      </View>

      {false && (
        <Animated.View style={[styles.compactSection, cupomSectionAnim]}>
          <Text style={styles.compactSectionTitle}>
            {t('schedule_service.coupon_section_title', { defaultValue: 'Cupom de Desconto' })}
          </Text>

          <Animated.View
            style={[
              styles.compactCouponInputContainer,
              {
                borderColor: couponInputAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [AppColors.borderNeutral, AppColors.primaryInteractive],
                }),
              },
            ]}
          >
            <AnimatedTextInput
              style={styles.compactCouponInput}
              placeholder={t('schedule_service.coupon_input_placeholder', { defaultValue: 'Digite o código do cupom' })}
              placeholderTextColor={couponInputAnim.interpolate({
                inputRange: [0, 1],
                outputRange: [AppColors.mediumGray, AppColors.primaryInteractive],
              })}
              value={couponCode}
              onChangeText={setCouponCode}
              autoCapitalize="characters"
              editable={!isApplyingCoupon}
              onFocus={() =>
                Animated.timing(couponInputAnim, {
                  toValue: 1,
                  duration: AppDurations.xs,
                  useNativeDriver: false,
                }).start()
              }
              onBlur={() =>
                Animated.timing(couponInputAnim, {
                  toValue: 0,
                  duration: AppDurations.xs,
                  useNativeDriver: false,
                }).start()
              }
            />

            <TouchableOpacity
              style={styles.compactApplyCouponButton}
              onPress={onApplyCoupon}
              disabled={isApplyingCoupon || !couponCode}
            >
              {isApplyingCoupon ? (
                <ActivityIndicator size="small" color={AppColors.white} />
              ) : (
                <Text style={styles.compactApplyCouponButtonText}>
                  {t('schedule_service.apply_coupon_button', { defaultValue: 'Aplicar' })}
                </Text>
              )}
            </TouchableOpacity>
          </Animated.View>

          {discountAmount > 0 && (
            <Animated.View
              style={[
                styles.compactCouponFeedbackContainer,
                {
                  opacity: couponFeedbackAnim,
                  transform: [
                    {
                      translateY: couponFeedbackAnim.interpolate({
                        inputRange: [0, 1],
                        outputRange: [5, 0],
                      }),
                    },
                  ],
                },
              ]}
            >
              <Ionicons name={couponFeedbackIcon as any} size={16} color={couponFeedbackColor} />
              <Text style={[styles.compactCouponAppliedText, { color: couponFeedbackColor }]}>
                {t('schedule_service.coupon_applied_message', {
                  discountValue: formatBRL(discountAmount),
                  defaultValue: `Cupom aplicado! Desconto de ${formatBRL(discountAmount)}`,
                })}
              </Text>
            </Animated.View>
          )}
        </Animated.View>
      )}

      <Animated.View style={[styles.summarySection, summarySectionAnim]}>
        <View style={styles.summaryItem}>
          <Animated.View style={animatedIconStyle}>
            <Ionicons name="briefcase-outline" size={20} color={AppColors.primaryInteractive} style={styles.summaryIcon} />
          </Animated.View>
          <Text style={styles.summaryText}>
            <Text style={styles.summaryLabel}>{t('schedule_service.summary_service', { defaultValue: 'Serviço' })}</Text>{' '}
            <Text>{selectedProviderService.service?.name || t('common.na', { defaultValue: 'N/A' })}</Text>
          </Text>
        </View>

        <View style={styles.summaryItem}>
          <Animated.View style={animatedIconStyle}>
            <Ionicons name="person-outline" size={20} color={AppColors.primaryInteractive} style={styles.summaryIcon} />
          </Animated.View>
          <Text style={styles.summaryText}>
            <Text style={styles.summaryLabel}>{t('schedule_service.summary_provider', { defaultValue: 'Prestador' })}</Text>{' '}
            <Text>{provider?.fullName || t('common.na', { defaultValue: 'N/A' })}</Text>
          </Text>
        </View>

        <View style={styles.summaryItem}>
          <Animated.View style={animatedIconStyle}>
            <Ionicons name="calendar-outline" size={20} color={AppColors.primaryInteractive} style={styles.summaryIcon} />
          </Animated.View>
          <Text style={styles.summaryText}>
            <Text style={styles.summaryLabel}>{t('schedule_service.summary_date_time', { defaultValue: 'Data e Hora' })}</Text>{' '}
            <Text>
              {formattedDate}, {t('common.at', { defaultValue: 'às' })} {selectedTime || ''}
            </Text>
          </Text>
        </View>

        <View style={styles.summaryItem}>
          <Animated.View style={animatedIconStyle}>
            <Ionicons name="location-outline" size={20} color={AppColors.primaryInteractive} style={styles.summaryIcon} />
          </Animated.View>
          <Text style={styles.summaryText}>
            <Text style={styles.summaryLabel}>{t('schedule_service.summary_address', { defaultValue: 'Endereço' })}</Text>{' '}
            <Text>{formattedAddress || t('common.na', { defaultValue: 'N/A' })}</Text>
          </Text>
        </View>

        {(selectedProviderService.pricingType === PricingType.HOURLY ||
          selectedProviderService.pricingType === PricingType.BY_SIZE) && (
          <View style={styles.summaryItem}>
            <Animated.View style={animatedIconStyle}>
              <Ionicons name="timer-outline" size={20} color={AppColors.primaryInteractive} style={styles.summaryIcon} />
            </Animated.View>
            <Text style={styles.summaryText}>
              <Text style={styles.summaryLabel}>
                {t('schedule_service.summary_service_details', { defaultValue: 'Detalhes do Serviço' })}
              </Text>{' '}
              <Text>{serviceDetailsText}</Text>
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
          <Animated.Text
            style={[
              styles.totalPriceValue,
              {
                transform: [
                  {
                    scale: finalPriceAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: [0.95, 1],
                    }),
                  },
                ],
              },
            ]}
          >
            {formatBRL(finalPrice)}
          </Animated.Text>
        </View>

        <SafetyReminderBanner />

        <TouchableOpacity onPress={onShowCancellationPolicy} style={styles.cancellationPolicyLink}>
          <Text style={styles.cancellationPolicyText}>
            {t('schedule_service.cancellation_policy', { defaultValue: 'Política de Cancelamento' })}
          </Text>
        </TouchableOpacity>
      </Animated.View>

      <Animated.View style={[styles.compactSection, styles.notesFinalSection, notesSectionAnim]}>
        <NotesInputSection notes={notes} setNotes={setNotes} compactMode={true} showTitle={false} />
      </Animated.View>
    </Animated.View>
  );
};

// PREMIUM: Cache com TTL (expira >1h) para dados frescos e gerenciamento de memória
const availabilityCache = new Map<
  string,
  {
    available: ProviderAvailability[];
    occupiedTimes: string[];
    timestamp: number; // TTL: 1h = 3600000ms
  }
>();

export default function ScheduleServiceScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const typedUser = user as UserProfile | null;
  const { t } = useTranslation();
  const { isLargePhone } = useDevice();

  const navWrap: StyleProp<ViewStyle> = useMemo(
    () => (isLargePhone ? { alignSelf: 'center', width: '100%', maxWidth: 820 } : undefined),
    [isLargePhone],
  );

  const { providerId, serviceId, servicePrice, couponCode: initialCouponCode } = useLocalSearchParams();

  const paramProviderId = Array.isArray(providerId) ? providerId[0] : providerId;
  const paramServiceId = Array.isArray(serviceId) ? serviceId[0] : serviceId;
  const paramServicePrice = Array.isArray(servicePrice) ? servicePrice[0] : servicePrice;
  const initialCouponCodeString = Array.isArray(initialCouponCode) ? initialCouponCode[0] : initialCouponCode;

  const [provider, setProvider] = useState<ProviderDisplayInfo | null>(null);
  const [selectedProviderService, setSelectedProviderService] = useState<ProviderServiceOffering | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [selectedSlots, setSelectedSlots] = useState<string[]>([]);
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

  useEffect(() => {
    if (!selectedProviderService || selectedProviderService.pricingType !== PricingType.HOURLY) return;

    if (!selectedSlots || selectedSlots.length === 0) {
      setSelectedTime(null);
      setDurationInMinutes(null);
      return;
    }

    const sorted = [...selectedSlots].sort((a, b) => toMinutes(a) - toMinutes(b));

    setSelectedTime(sorted[0]);
    setDurationInMinutes(sorted.length * 60);
  }, [selectedSlots, selectedProviderService]);

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

  const [isLoading, setIsLoading] = useState(true);
  const [isBooking, setIsBooking] = useState(false);
  const [isFetchingSlots, setIsFetchingSlots] = useState(false);
  const [isSearchingNextDate, setIsSearchingNextDate] = useState(false);
  const [isCancellationOverlayVisible, setCancellationOverlayVisible] = useState(false);

  const [currentDisplayMonth, setCurrentDisplayMonth] = useState(new Date());
  const shineAnim = useRef(new Animated.Value(-SCREEN_WIDTH * 0.3)).current;

  const [displaySlotsInfo, setDisplaySlotsInfo] = useState<{ time: string; isAvailable: boolean }[]>([]);

  const slotStepMinutes = useMemo(() => {
    const times = displaySlotsInfo
      .filter((s) => s.isAvailable)
      .map((s) => s.time)
      .sort((a, b) => toMinutes(a) - toMinutes(b));

    let step = 60; // fallback
    for (let i = 1; i < times.length; i++) {
      const diff = toMinutes(times[i]) - toMinutes(times[i - 1]);
      if (diff > 0) step = Math.min(step, diff);
    }
    return step;
  }, [displaySlotsInfo]);

  const minHourlySlots = Math.ceil(MIN_HOURLY_MINUTES / slotStepMinutes);
  const hasShownTodayAvailableToastRef = useRef(false);

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

  const reviewStepAnim = useRef(new Animated.Value(0)).current;
  const serviceDetailsAnim = useRef(new Animated.Value(0)).current;
  const notesAnim = useRef(new Animated.Value(0)).current;
  const cupomAnim = useRef(new Animated.Value(0)).current;
  const summaryAnim = useRef(new Animated.Value(0)).current;

  const slotBadgeScale = useRef(new Animated.Value(1)).current;
  const slotBadgePulse = useRef(new Animated.Value(0)).current;

  const [currentStep, setCurrentStep] = useState<number>(1);

  const scrollViewRef = useRef<ScrollView>(null);
  const timeSlotsRef = useRef<View>(null);

  const isMounted = useRef(true);

  const effectiveDurationInMinutes = useMemo(() => {
    if (selectedProviderService?.pricingType === PricingType.HOURLY) {
      return selectedSlots.length > 0 ? selectedSlots.length * 60 : null;
    }
    return durationInMinutes;
  }, [selectedProviderService?.pricingType, selectedSlots, durationInMinutes]);

  const { calculatedSubtotal, finalCalculatedPrice } = useBookingPricing({
    selectedProviderService,
    durationInMinutes: effectiveDurationInMinutes,
    squareMeters,
    discountAmount,
    slotCount: selectedSlots.length,
  });

  const totalHours = useMemo(() => {
    if (selectedProviderService?.pricingType === PricingType.HOURLY) return selectedSlots.length;
    return null;
  }, [selectedProviderService?.pricingType, selectedSlots.length]);

  const hourlyBasePrice = useMemo(() => {
    return selectedProviderService?.price ?? (paramServicePrice ? Number(paramServicePrice) : 0);
  }, [selectedProviderService?.price, paramServicePrice]);

  const hourlyTotalPrice = useMemo(() => {
    if (selectedProviderService?.pricingType === PricingType.HOURLY && totalHours && totalHours > 0) {
      return hourlyBasePrice * totalHours;
    }
    return null;
  }, [selectedProviderService?.pricingType, hourlyBasePrice, totalHours]);

  const priceChangeAnim = useRef(new Animated.Value(0)).current;
  const lastFinalPriceRef = useRef<number>(finalCalculatedPrice);

  const confirmButtonAnimatedStyle = useMemo(
    () => ({
      transform: [
        {
          scale: priceChangeAnim.interpolate({
            inputRange: [0, 1],
            outputRange: [1, 1.03],
          }),
        },
      ],
      opacity: priceChangeAnim.interpolate({
        inputRange: [0, 1],
        outputRange: [1, 0.85],
      }),
    }),
    [priceChangeAnim],
  );

  const stepDateTimeTitle = useMemo(
    () => t('schedule_service.progress_step_date_time', { defaultValue: 'Data e Hora' }),
    [t],
  );
  const stepReviewTitle = useMemo(
    () => t('schedule_service.progress_step_complete_review', { defaultValue: 'Revisão' }),
    [t],
  );
  const stepTitles = [stepDateTimeTitle, stepReviewTitle];

  const timeSelectionSummaryLabel = useMemo(() => {
    if (!selectedProviderService) return null;

    if (selectedProviderService.pricingType === PricingType.HOURLY && selectedSlots.length > 0) {
      const hours = selectedSlots.length;
      const hoursLabel = hours === 1 ? 'hora selecionada' : 'horas selecionadas';
      const price = finalCalculatedPrice > 0 ? finalCalculatedPrice : hourlyTotalPrice ?? finalCalculatedPrice;
      return `${hours} ${hoursLabel} · Total estimado: ${formatBRL(price)}`;
    }

    if (selectedProviderService.pricingType === PricingType.BY_SIZE && squareMeters && finalCalculatedPrice > 0) {
      return `${squareMeters} m² · Total estimado: ${formatBRL(finalCalculatedPrice)}`;
    }

    return null;
  }, [selectedProviderService, selectedSlots.length, squareMeters, finalCalculatedPrice, hourlyTotalPrice]);

  const prefetchAvailability = useCallback(async (provId: string | undefined, baseDate: Date) => {
    if (!provId) return;

    const now = Date.now();
    for (const [key, value] of availabilityCache.entries()) {
      if (now - value.timestamp > 3600000) availabilityCache.delete(key);
    }

    const prefetchDates: { dateString: string; cacheKey: string }[] = [];

    for (let offset = -3; offset <= 3; offset++) {
      const prefetchDate = new Date(baseDate);
      prefetchDate.setDate(baseDate.getDate() + offset);

      const dateString = prefetchDate.toISOString().split('T')[0];
      const cacheKey = `${provId}-${dateString}`;

      if (!availabilityCache.has(cacheKey)) prefetchDates.push({ dateString, cacheKey });
    }

    await Promise.allSettled(
      prefetchDates.map(({ dateString, cacheKey }) =>
        getProviderAvailability(provId, dateString).then((response) => {
          availabilityCache.set(cacheKey, { ...response, timestamp: Date.now() });
        }),
      ),
    );
  }, []);

  useEffect(() => {
    if (currentStep === 2 && finalCalculatedPrice > 0 && lastFinalPriceRef.current !== finalCalculatedPrice) {
      priceChangeAnim.setValue(0);
      Animated.sequence([
        Animated.timing(priceChangeAnim, {
          toValue: 1,
          duration: AppDurations.xs,
          easing: Easing.out(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(priceChangeAnim, {
          toValue: 0,
          duration: AppDurations.xs,
          easing: Easing.out(Easing.ease),
          useNativeDriver: true,
        }),
      ]).start();
    }

    lastFinalPriceRef.current = finalCalculatedPrice;
  }, [currentStep, finalCalculatedPrice, priceChangeAnim]);

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
      ]),
    );

    const rotateLoop = Animated.loop(
      Animated.timing(rotateAnim, {
        toValue: 1,
        duration: 20000,
        easing: Easing.linear,
        useNativeDriver: true,
      }),
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
      ]),
    );

    const headerGlowLoop = Animated.loop(
      Animated.timing(headerGlowAnim, {
        toValue: 1,
        duration: 3000,
        easing: Easing.inOut(Easing.ease),
        useNativeDriver: false,
      }),
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
      ]),
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
  }, [fadeAnim, slideUpAnim, scaleAnim, pulseAnim, rotateAnim, backgroundFloatAnim, headerGlowAnim, calendarBreatheAnim]);

  useEffect(() => {
    if (currentStep !== 2 || selectedProviderService?.pricingType !== PricingType.HOURLY || selectedSlots.length === 0) {
      slotBadgePulse.stopAnimation();
      return;
    }

    slotBadgePulse.setValue(0);

    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(slotBadgePulse, {
          toValue: 1,
          duration: 1500,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(slotBadgePulse, {
          toValue: 0,
          duration: 1500,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ]),
    );

    loop.start();
    return () => loop.stop();
  }, [currentStep, selectedProviderService?.pricingType, selectedSlots.length, slotBadgePulse]);

  useEffect(() => {
    if (selectedSlots.length === 0) {
      slotBadgeScale.setValue(1);
      return;
    }

    Animated.sequence([
      Animated.spring(slotBadgeScale, { toValue: 1.08, useNativeDriver: true, friction: 4 }),
      Animated.spring(slotBadgeScale, { toValue: 1, useNativeDriver: true, friction: 4 }),
    ]).start();
  }, [selectedSlots.length, slotBadgeScale]);

  useEffect(() => {
    if (currentStep === 2) {
      reviewStepAnim.setValue(0);
      serviceDetailsAnim.setValue(0);
      notesAnim.setValue(0);
      cupomAnim.setValue(0);
      summaryAnim.setValue(0);

      Animated.parallel([
        Animated.timing(reviewStepAnim, {
          toValue: 1,
          duration: AppDurations.xs,
          delay: 0,
          easing: Easing.out(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(serviceDetailsAnim, {
          toValue: 1,
          duration: AppDurations.xs,
          delay: 0,
          easing: Easing.out(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(notesAnim, {
          toValue: 1,
          duration: AppDurations.xs,
          delay: 50,
          easing: Easing.out(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(cupomAnim, {
          toValue: 1,
          duration: AppDurations.xs,
          delay: 100,
          easing: Easing.out(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(summaryAnim, {
          toValue: 1,
          duration: AppDurations.sm,
          delay: 150,
          easing: Easing.out(Easing.back(1.05)),
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      reviewStepAnim.setValue(0);
      serviceDetailsAnim.setValue(0);
      notesAnim.setValue(0);
      cupomAnim.setValue(0);
      summaryAnim.setValue(0);
    }
  }, [currentStep, reviewStepAnim, serviceDetailsAnim, notesAnim, cupomAnim, summaryAnim]);

  useEffect(() => {
    if (currentStep === 2 && selectedTime && finalCalculatedPrice > 0) {
      Animated.timing(floatingSummaryAnim, {
        toValue: 1,
        duration: AppDurations.xs,
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

    setCurrentDisplayMonth((prev) => {
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

    setCurrentDisplayMonth((prev) => {
      const newDate = new Date(prev.getFullYear(), prev.getMonth() + 1, 1);
      prefetchAvailability(provider?.id, newDate);
      return newDate;
    });
  }, [provider?.id, prefetchAvailability, scaleAnim]);

  const handleDaySelect = useCallback(
    (dateObj: Date) => {
      Animated.sequence([
        Animated.timing(scaleAnim, { toValue: 0.98, duration: AppDurations.xs, useNativeDriver: true }),
        Animated.spring(scaleAnim, { toValue: 1, friction: 6, useNativeDriver: true }),
      ]).start();

      setSelectedDate(dateObj);
      prefetchAvailability(provider?.id, dateObj);
      setSelectedTime(null);

      setTimeout(() => {
        const hasAvailable = displaySlotsInfo.some((slot) => slot.isAvailable);
        if (timeSlotsRef.current && scrollViewRef.current && displaySlotsInfo.length > 0 && hasAvailable) {
          scrollViewRef.current.scrollTo({ y: 400, animated: true });
        }
      }, 800);
    },
    [provider?.id, prefetchAvailability, scaleAnim, displaySlotsInfo],
  );

  const handleTimeSelect = useCallback(
    (time: string) => {
      const selectedSlot = displaySlotsInfo.find((slot) => slot.time === time);

      if (!selectedSlot?.isAvailable) {
        NotificationUIService.showInfo(
          t('schedule_service.unavailable_time_slot_message', { defaultValue: 'Horario nao disponivel.' }),
          t('schedule_service.unavailable_time_slot', { defaultValue: 'Horario Indisponivel' }),
        );
        return;
      }

      Animated.sequence([
        Animated.timing(selectionAnim, {
          toValue: 1.08,
          duration: AppDurations.xs,
          easing: Easing.out(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.spring(selectionAnim, {
          toValue: 1,
          friction: 5,
          tension: 80,
          useNativeDriver: true,
        }),
      ]).start();

      const expandToMinSlots = (baseTime: string) => {
        const availableTimes = displaySlotsInfo
          .filter((s) => s.isAvailable)
          .map((s) => s.time)
          .sort((a, b) => toMinutes(a) - toMinutes(b));

        const index = availableTimes.indexOf(baseTime);
        if (index === -1) return [baseTime];

        const result: string[] = [baseTime];

        // ➡️ para frente
        for (let i = index + 1; i < availableTimes.length && result.length < minHourlySlots; i++) {
          const last = result[result.length - 1];
          if (toMinutes(availableTimes[i]) - toMinutes(last) === slotStepMinutes) {
            result.push(availableTimes[i]);
          } else {
            break;
          }
        }

        // ⬅️ para trás
        for (let i = index - 1; i >= 0 && result.length < minHourlySlots; i--) {
          const first = result[0];
          if (toMinutes(first) - toMinutes(availableTimes[i]) === slotStepMinutes) {
            result.unshift(availableTimes[i]);
          } else {
            break;
          }
        }

        return result.sort((a, b) => toMinutes(a) - toMinutes(b));
      };

      if (selectedProviderService?.pricingType === PricingType.HOURLY) {
        setSelectedSlots((prev) => {
          const current = prev ?? [];
          const alreadySelected = current.includes(time);

          if (alreadySelected) {
            setSelectedTime(null);
            setDurationInMinutes(null);
            return [];
          }

          const next = expandToMinSlots(time);

          if (next.length < MIN_HOURLY_SLOTS) {
            NotificationUIService.showError(
              t('schedule_service.min_hourly_block', {
                defaultValue:
                  'Este horario nao possui 4h disponiveis. Selecione um horario com pelo menos 4h contiguas.',
              }),
              t('schedule_service.min_hourly_block_title', { defaultValue: 'Minimo de 4h' }),
            );
            setSelectedTime(null);
            setDurationInMinutes(null);
            return [];
          }

          setSelectedTime(next[0]);
          setDurationInMinutes(next.length * 60);

          return next;
        });
        return;
      }

      if (selectedProviderService) {
        setSelectedSlots((prev) => {
          if (!prev || prev.length === 0) {
            setSelectedTime(time);
            setDurationInMinutes(60);
            return [time];
          }

          if (prev.includes(time)) {
            const next = prev.filter((t0) => t0 !== time).sort();
            if (next.length === 0) {
              setSelectedTime(null);
              setDurationInMinutes(null);
            } else {
              setSelectedTime(next[0]);
              setDurationInMinutes(next.length * 60);
            }
            return next;
          }

          const sorted = [...prev].sort();
          const first = sorted[0];
          const last = sorted[sorted.length - 1];

          const m = toMinutes(time);
          const firstM = toMinutes(first);
          const lastM = toMinutes(last);

          let next: string[];

          if (m === lastM + 60) next = [...sorted, time];
          else if (m === firstM - 60) next = [time, ...sorted];
          else next = [time];

          next = next.sort();
          setSelectedTime(next[0]);
          setDurationInMinutes(next.length * 60);
          return next;
        });
      } else {
        setSelectedSlots([]);
        setSelectedTime(time);
      }
    },
    [displaySlotsInfo, selectionAnim, t, selectedProviderService, minHourlySlots, slotStepMinutes],
  );

  const showCancellationPolicy = useCallback(() => setCancellationOverlayVisible(true), []);
  const hideCancellationPolicy = useCallback(() => setCancellationOverlayVisible(false), []);

  const handleNextStep = useCallback(() => {
    if (currentStep === 1) {
      if (
        selectedSlots.length === 0 ||
        !address.street ||
        !address.number ||
        !address.neighborhood ||
        !address.city ||
        !address.state
      ) {
        NotificationUIService.showError(
          t('schedule_service.step1_validation_error', { defaultValue: 'Selecione data, hora e endereço.' }),
          t('common.error', { defaultValue: 'Erro' }),
        );
        return;
      }
    }

    Animated.sequence([
      Animated.parallel([
        Animated.timing(fadeAnim, { toValue: 0, duration: AppDurations.xs, useNativeDriver: true }),
        Animated.timing(scaleAnim, { toValue: 0.95, duration: AppDurations.xs, useNativeDriver: true }),
      ]),
    ]).start(() => {
      setCurrentStep((prev) => prev + 1);

      reviewStepAnim.setValue(0);
      serviceDetailsAnim.setValue(0);
      notesAnim.setValue(0);
      cupomAnim.setValue(0);
      summaryAnim.setValue(0);

      setTimeout(() => {
        scrollViewRef.current?.scrollTo({ y: 0, animated: false });
      }, 50);

      setTimeout(() => {
        fadeAnim.setValue(1);
        scaleAnim.setValue(1);
      }, 100);
    });
  }, [
    currentStep,
    selectedSlots.length,
    address,
    t,
    fadeAnim,
    scaleAnim,
    reviewStepAnim,
    serviceDetailsAnim,
    notesAnim,
    cupomAnim,
    summaryAnim,
  ]);

  const handlePreviousStep = useCallback(() => {
    if (currentStep > 1) {
      Animated.sequence([
        Animated.timing(reviewStepAnim, { toValue: 0, duration: AppDurations.xs, useNativeDriver: true }),
        Animated.parallel([
          Animated.timing(fadeAnim, { toValue: 1, duration: AppDurations.xs, useNativeDriver: true }),
          Animated.timing(scaleAnim, { toValue: 1, duration: AppDurations.xs, useNativeDriver: true }),
        ]),
      ]).start(() => {
        setCurrentStep((prev) => prev - 1);
        scrollViewRef.current?.scrollTo({ y: 0, animated: false });
      });
    } else {
      router.back();
    }
  }, [currentStep, router, reviewStepAnim, fadeAnim, scaleAnim]);

  const handleConfirmBooking = useCallback(async () => {
    if (
      !typedUser?.id ||
      !provider?.id ||
      !selectedProviderService?.id ||
      !selectedDate ||
      !selectedTime ||
      !address.street ||
      !address.number ||
      !address.neighborhood ||
      !address.city ||
      !address.state
    ) {
      NotificationUIService.showError(
        t('schedule_service.booking_error_message', { defaultValue: 'Dados incompletos para agendar.' }),
        t('schedule_service.booking_error_title', { defaultValue: 'Erro no Agendamento' }),
      );
      return;
    }

    if (
      selectedProviderService?.pricingType === PricingType.HOURLY &&
      (effectiveDurationInMinutes === null || effectiveDurationInMinutes === undefined || effectiveDurationInMinutes <= 0)
    ) {
      NotificationUIService.showError(
        t('schedule_service.booking_error_duration_size', { field: t('common.duration', { defaultValue: 'duração' }) }),
        t('schedule_service.booking_error_title', { defaultValue: 'Erro no Agendamento' }),
      );
      return;
    }

    if (
      selectedProviderService?.pricingType === PricingType.BY_SIZE &&
      (squareMeters === null || squareMeters === undefined || squareMeters <= 0)
    ) {
      NotificationUIService.showError(
        t('schedule_service.booking_error_duration_size', { field: t('common.area', { defaultValue: 'área' }) }),
        t('schedule_service.booking_error_title', { defaultValue: 'Erro no Agendamento' }),
      );
      return;
    }

    let requestedDurationMinutes = 0;
    let requestedSquareMeters = 0;

    if (isMounted.current) setIsBooking(true);

    try {
      if (selectedProviderService.pricingType === PricingType.HOURLY) {
        requestedDurationMinutes = effectiveDurationInMinutes!;
      } else if (selectedProviderService.pricingType === PricingType.BY_SIZE) {
        requestedSquareMeters = squareMeters!;
      }

      const safeSelectedDate = selectedDate ?? new Date();

      const bookingData: CreateBookingDto = {
        providerId: provider.id,
        providerServiceId: selectedProviderService.id,
        scheduledDate: safeSelectedDate.toISOString().split('T')[0],
        scheduledTime: selectedTime,
        totalPrice: finalCalculatedPrice,
        notes,
        address: {
          ...address,
          latitude: address.latitude ?? 0,
          longitude: address.longitude ?? 0,
        },
        ...(selectedProviderService.pricingType === PricingType.HOURLY && { requestedDurationMinutes }),
        ...(selectedProviderService.pricingType === PricingType.BY_SIZE && { requestedSquareMeters }),
        couponCode: discountAmount > 0 ? couponCode : undefined,
      };

      const newBooking: BookingDetails = await createBooking(bookingData);
      if (!isMounted.current) return;

      router.replace({
        pathname: '/client/bookings/success',
        params: {
          bookingId: newBooking.id,
          totalPrice: newBooking.totalPrice.toString(),
          paymentMethod: 'PIX',
          couponApplied: discountAmount > 0 ? 'true' : 'false',
          couponCode: discountAmount > 0 ? couponCode : undefined,
        },
      });

      NotificationUIService.showSuccess(
        t('schedule_service.booking_success_message', { defaultValue: 'Agendamento realizado com sucesso!' }),
        t('common.success', { defaultValue: 'Sucesso' }),
      );
    } catch (error: any) {
      if (isMounted.current) {
        NotificationUIService.showError(
          error.response?.data?.message || t('common.network_error', { defaultValue: 'Erro de rede.' }),
          t('common.error', { defaultValue: 'Erro' }),
        );
      }
    } finally {
      if (isMounted.current) setIsBooking(false);
    }
  }, [
    typedUser,
    provider,
    selectedDate,
    selectedTime,
    address,
    selectedProviderService,
    notes,
    router,
    squareMeters,
    finalCalculatedPrice,
    couponCode,
    discountAmount,
    t,
    effectiveDurationInMinutes,
  ]);

  useEffect(() => {
    const loadInitialData = async () => {
      if (isMounted.current) setIsLoading(true);

      if (!paramProviderId || !paramServiceId || !typedUser?.id) {
        if (isMounted.current) {
          NotificationUIService.showError(
            t('schedule_service.navigation_error_essential_data', { defaultValue: 'Dados essenciais ausentes.' }),
            t('common.error', { defaultValue: 'Erro' }),
          );
          router.replace('/client/explore');
          setIsLoading(false);
        }
        return;
      }

      try {
        const fetchedProvider = await getProviderDetails(paramProviderId);
        if (!isMounted.current) return;

        setProvider(fetchedProvider);

        let foundService = fetchedProvider.providerServices?.find(
          (ps) => ps.id === paramServiceId && ps.service && ps.service.id && ps.service.name,
        );

        if (foundService && foundService.pricingType !== PricingType.HOURLY) {
          const targetServiceId = foundService.service?.id;

          const hourlyAlternative =
            fetchedProvider.providerServices?.find(
              (ps) =>
                ps.pricingType === PricingType.HOURLY &&
                ps.service &&
                targetServiceId &&
                ps.service.id === targetServiceId,
            ) || fetchedProvider.providerServices?.find((ps) => ps.pricingType === PricingType.HOURLY);

          if (hourlyAlternative) foundService = hourlyAlternative;
        }

        if (!foundService) {
          if (isMounted.current) {
            NotificationUIService.showError(
              t('schedule_service.service_not_available', { defaultValue: 'Serviço não disponível.' }),
              t('common.error', { defaultValue: 'Erro' }),
            );
            router.replace('/client/explore');
            setIsLoading(false);
          }
          return;
        }

        if (isMounted.current) setSelectedProviderService(foundService);

        if (foundService.pricingType === PricingType.HOURLY) {
          const defaultDuration =
            typeof foundService.durationMinutes === 'number' && foundService.durationMinutes > 0
              ? foundService.durationMinutes
              : 120;
          if (isMounted.current) setDurationInMinutes(defaultDuration);
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
              longitude: userAddress.longitude ?? 0,
            });
          }
        } else {
          NotificationUIService.showInfo(
            t('schedule_service.address_needed_message', { defaultValue: 'Informe o endereço para continuar.' }),
            t('schedule_service.address_needed_title', { defaultValue: 'Endereço Necessário' }),
          );
        }

        if (isMounted.current) setSelectedDate(new Date());

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
        if (isMounted.current) {
          NotificationUIService.showError(
            error.response?.data?.message || t('common.network_error', { defaultValue: 'Erro de rede.' }),
            t('common.error', { defaultValue: 'Erro' }),
          );
          router.replace('/client/explore');
        }
      } finally {
        if (isMounted.current) setIsLoading(false);
      }
    };

    loadInitialData();
  }, [
    paramProviderId,
    paramServiceId,
    typedUser,
    router,
    prefetchAvailability,
    initialCouponCodeString,
    handleApplyCoupon,
    t,
  ]);

  const animateShine = useCallback(() => {
    shineAnim.setValue(-SCREEN_WIDTH * 0.3);

    const animation = Animated.timing(shineAnim, {
      toValue: SCREEN_WIDTH + SCREEN_WIDTH * 0.3,
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

  useEffect(() => {
    let isCancelled = false;

    const fetchAndProcessSlotsForDate = async () => {
      if (!provider?.id || !selectedDate || isCancelled) {
        if (isMounted.current && !isCancelled) {
          setDisplaySlotsInfo([]);
          setSelectedTime(null);
        }
        return;
      }

      if (isMounted.current) setIsFetchingSlots(true);

      await new Promise((resolve) => setTimeout(resolve, 200));

      const safeSelectedDate = selectedDate ?? new Date();
      const dateString = safeSelectedDate.toISOString().split('T')[0];
      const cacheKey = `${provider.id}-${dateString}`;

      let backendResponse: { available: ProviderAvailability[]; occupiedTimes: string[] } | undefined;
      let fetchAttempts = 0;
      const maxRetries = 2;

      while (fetchAttempts < maxRetries && !backendResponse && !isCancelled) {
        try {
          if (availabilityCache.has(cacheKey)) {
            const cached = availabilityCache.get(cacheKey);
            if (cached && Date.now() - cached.timestamp < 3600000) {
              backendResponse = { available: cached.available, occupiedTimes: cached.occupiedTimes };
            } else {
              availabilityCache.delete(cacheKey);
            }
          }

          if (!backendResponse) {
            backendResponse = await getProviderAvailability(provider.id, dateString);
            availabilityCache.set(cacheKey, { ...backendResponse, timestamp: Date.now() });
          }
        } catch (err: any) {
          fetchAttempts++;
          if (fetchAttempts >= maxRetries) {
            if (isMounted.current && !isCancelled) {
              NotificationUIService.showError(
                t('schedule_service.error_fetching_slots_day', {
                  date: dateString,
                  defaultValue: 'Erro ao carregar horários para este dia. Tente novamente.',
                }),
                t('common.error', { defaultValue: 'Erro' }),
              );
              setDisplaySlotsInfo([]);
              setIsFetchingSlots(false);
            }
            return;
          }
          await new Promise((resolve) => setTimeout(resolve, 500 * fetchAttempts));
        }
      }

      if (!backendResponse || isCancelled) return;

      const providerConfiguredSlots: ProviderAvailability[] = (backendResponse.available || [])
        .map((s) => {
          if (s && typeof s.startTime === 'string' && s.startTime.length > 0) return s;
          if (s && typeof (s as any).time === 'string' && (s as any).time.length > 0) {
            return { ...s, startTime: (s as any).time };
          }
          if (s && typeof s.startTime !== 'string') return null;
          return s;
        })
        .filter(Boolean) as ProviderAvailability[];

      const occupiedTimesFromBackend: string[] = backendResponse.occupiedTimes || [];

      let requiredDurationMin: number | null = null;
      if (selectedProviderService) {
        if (selectedProviderService.durationMinutes) requiredDurationMin = selectedProviderService.durationMinutes;
      }

      const finalDisplaySlots = generateDailySlots(
        safeSelectedDate,
        providerConfiguredSlots,
        occupiedTimesFromBackend,
        requiredDurationMin,
      );

      const hasRealAvailableSlots = finalDisplaySlots.some((slot) => slot.isAvailable);

      if (isMounted.current && !isCancelled) {
        setDisplaySlotsInfo(finalDisplaySlots);

        if (!hasShownTodayAvailableToastRef.current) {
          try {
            const anyAvailable = finalDisplaySlots.some((s) => s?.isAvailable);
            if (anyAvailable) {
              hasShownTodayAvailableToastRef.current = true;
              NotificationUIService.showSuccess(
                t('schedule_service.found_available_date', { defaultValue: 'Horários encontrados!' }),
                t('common.success', { defaultValue: 'Sucesso' }),
              );
            }
          } catch {}
        }

        Animated.parallel([
          Animated.timing(fadeAnim, { toValue: 1, duration: AppDurations.xs, useNativeDriver: true }),
          Animated.spring(scaleAnim, { toValue: 1, friction: 5, useNativeDriver: true }),
        ]).start();

        if (hasRealAvailableSlots && timeSlotsRef.current && scrollViewRef.current) {
          requestAnimationFrame(() => {
            setTimeout(() => {
              scrollViewRef.current?.scrollTo({ y: 400, animated: true });
            }, 200);
          });
        }

        if (!hasRealAvailableSlots && !isSearchingNextDate) {
          setIsSearchingNextDate(true);

          let foundAvailableDate = false;
          const searchPromises: Promise<{ date: Date; slots: { time: string; isAvailable: boolean }[] } | null>[] = [];

          for (let i = 1; i <= 7; i++) {
            searchPromises.push(
              (async (dayOffset: number) => {
                if (isCancelled) return null;

                const searchDate = new Date(selectedDate);
                searchDate.setDate(selectedDate.getDate() + dayOffset);

                const searchDateString = searchDate.toISOString().split('T')[0];
                const searchCacheKey = `${provider.id}-${searchDateString}`;

                let searchResponse: { available: ProviderAvailability[]; occupiedTimes: string[] } | undefined;

                if (availabilityCache.has(searchCacheKey)) {
                  const cached = availabilityCache.get(searchCacheKey);
                  if (cached && Date.now() - cached.timestamp < 3600000) {
                    searchResponse = { available: cached.available, occupiedTimes: cached.occupiedTimes };
                  }
                }

                if (!searchResponse && !isCancelled) {
                  try {
                    searchResponse = await getProviderAvailability(provider.id, searchDateString);
                    availabilityCache.set(searchCacheKey, { ...searchResponse, timestamp: Date.now() });
                  } catch {
                    return null;
                  }
                }

                if (isCancelled) return null;

                const searchSlots = generateDailySlots(
                  searchDate,
                  searchResponse?.available || [],
                  searchResponse?.occupiedTimes || [],
                  requiredDurationMin,
                );

                if (searchSlots.some((slot) => slot.isAvailable)) {
                  return { date: searchDate, slots: searchSlots };
                }
                return null;
              })(i),
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
                    defaultValue: 'Horários encontrados!',
                  }),
                  t('common.success', { defaultValue: 'Sucesso' }),
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
            setIsSearchingNextDate(false);
            if (!foundAvailableDate) {
              NotificationUIService.showError(
                t('schedule_service.no_available_nearby', {
                  defaultValue: 'Nenhum horário nos próximos 7 dias. Selecione outra data no calendário.',
                }),
                t('common.error', { defaultValue: 'Erro' }),
              );
            }
          }
        } else if (hasRealAvailableSlots) {
          setIsSearchingNextDate(false);
        }

        setIsFetchingSlots(false);
      }
    };

    fetchAndProcessSlotsForDate();

    return () => {
      isCancelled = true;
    };
  }, [selectedDate, provider?.id, selectedProviderService, prefetchAvailability, t, fadeAnim, scaleAnim, isSearchingNextDate]);

  const isNextButtonDisabled = useMemo(() => {
    if (currentStep === 1) {
      const needMinSlots = selectedProviderService?.pricingType === PricingType.HOURLY && selectedSlots.length < MIN_HOURLY_SLOTS;

      return (
        selectedSlots.length === 0 ||
        needMinSlots ||
        !address.street ||
        !address.number ||
        !address.neighborhood ||
        !address.city ||
        !address.state
      );
    }
    return false;
  }, [currentStep, selectedSlots, address, selectedProviderService?.pricingType]);

  const isConfirmButtonDisabled = useMemo(() => {
    if (!selectedProviderService) return true;

    const baseDisabled =
      selectedSlots.length === 0 ||
      !address.street ||
      !address.number ||
      !address.neighborhood ||
      !address.city ||
      !address.state ||
      isBooking;

    if (selectedProviderService.pricingType === PricingType.HOURLY) {
      return baseDisabled || selectedSlots.length < MIN_HOURLY_SLOTS || !durationInMinutes || durationInMinutes <= 0;
    }

    if (selectedProviderService.pricingType === PricingType.BY_SIZE) {
      return baseDisabled || !squareMeters || squareMeters <= 0;
    }

    return baseDisabled;
  }, [selectedSlots, address, selectedProviderService, durationInMinutes, squareMeters, isBooking]);

  const selectedHoursLabel = useMemo(() => {
    if (selectedProviderService?.pricingType === PricingType.HOURLY && totalHours && totalHours > 0) {
      return `${totalHours} ${totalHours === 1 ? 'hora' : 'horas'}`;
    }
    return null;
  }, [selectedProviderService?.pricingType, totalHours]);

  const confirmButtonText = useMemo(() => {
    const isHourly = selectedProviderService?.pricingType === PricingType.HOURLY;
    const hasHours = isHourly && totalHours && totalHours > 0;

    const priceForDisplay = hasHours
      ? finalCalculatedPrice > 0
        ? finalCalculatedPrice
        : hourlyTotalPrice ?? finalCalculatedPrice
      : finalCalculatedPrice;

    if (hasHours && priceForDisplay > 0) {
      const hoursLabel = selectedHoursLabel ?? `${totalHours} ${totalHours === 1 ? 'hora' : 'horas'}`;
      return `Agendar ${hoursLabel} • ${formatBRL(priceForDisplay)}/h`;
    }

    if (finalCalculatedPrice > 0) {
      return isHourly ? `${formatBRL(finalCalculatedPrice)}/h` : formatBRL(finalCalculatedPrice);
    }

    return t('schedule_service.select_date_time_address', { defaultValue: 'Selecione Data, Hora e Endereco' });
  }, [selectedProviderService?.pricingType, totalHours, hourlyTotalPrice, finalCalculatedPrice, selectedHoursLabel, t]);

  const slotBadgeVisible =
    currentStep === 1 && selectedProviderService?.pricingType === PricingType.HOURLY && selectedSlots.length > 0;

  const slotBadgeLabel = `${selectedSlots.length}h`;

  const slotBadgeGlowOpacity = slotBadgePulse.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: [0, 0.45, 0],
  });

  const slotBadgeGlowScale = slotBadgePulse.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 1.2],
  });

  if (isLoading) {
    return (
      <View style={styles.centeredFeedback}>
        <Stack.Screen options={{ title: t('common.loading', { defaultValue: 'Carregando' }), headerShown: false }} />
        <ActivityIndicator size="large" color={AppColors.primaryInteractive} />
        <Text style={{ marginTop: 10, color: AppColors.textBody }}>
          {t('schedule_service.loading_initial_data', { defaultValue: 'Carregando dados iniciais...' })}
        </Text>
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

        {currentStep === 1 && (
          <View style={styles.stepsPill}>
            <View
              key="step1"
              style={[
                styles.stepItem,
                styles.stepItemGhost,
                { marginRight: 6 },
                currentStep === 1 ? styles.stepItemActive : null,
              ]}
            >
              <Text style={[styles.stepGhostText, currentStep === 1 ? styles.stepActiveText : null]} numberOfLines={1}>
                <Text>{stepTitles[0]}</Text>
              </Text>
            </View>

            <View
              key="step2"
              style={[styles.stepItem, currentStep === 2 ? styles.stepItemActive : styles.stepItemGhost, { marginRight: 6 }]}
            >
              <Text style={[styles.stepGhostText, currentStep === 2 ? styles.stepActiveText : null]} numberOfLines={1}>
                <Text>{stepTitles[1]}</Text>
              </Text>
            </View>
          </View>
        )}

        <Animated.ScrollView
          ref={scrollViewRef}
          contentContainerStyle={[styles.scrollContentContainer, { paddingBottom: 90 }]}
          style={{ opacity: fadeAnim, transform: [{ translateY: slideUpAnim }] }}
          showsVerticalScrollIndicator={false}
          nestedScrollEnabled
          removeClippedSubviews={false}
          bounces={currentStep !== 2}
          alwaysBounceVertical={currentStep !== 2}
          onContentSizeChange={() => {
            if (currentStep === 1) {
              scrollViewRef.current?.scrollTo({ y: 0, animated: false });
            }
          }}
        >
          {currentStep === 1 && (
            <>
              <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
                <ProviderBrief provider={provider} serviceName={selectedProviderService?.service?.name} isLoading={isLoading} />
              </Animated.View>

              <Animated.View style={{ transform: [{ scale: scaleAnim }], opacity: fadeAnim }}>
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

              <Animated.View ref={timeSlotsRef} style={{ transform: [{ scale: scaleAnim }], opacity: fadeAnim }}>
                <View style={styles.timeSlotsHelperContainer}>
                  <Text style={styles.timeSlotsHelperText}>(cada horário = 1h de serviço).</Text>
                  <Text style={styles.timeSlotsHelperSubText}>
                    Você pode escolher mais de um horário para aumentar a duração.
                  </Text>
                </View>

                <TimeSlotsSection
                  titleKey="schedule_service.available_times"
                  date={selectedDate}
                  displaySlotsInfo={displaySlotsInfo}
                  isLoading={isFetchingSlots || isSearchingNextDate}
                  selectedTime={selectedTime}
                  onTimeSelect={handleTimeSelect}
                  selectedSlots={selectedSlots}
                />
              </Animated.View>
            </>
          )}

          {currentStep === 2 && (
            <Animated.View
              style={{
                opacity: reviewStepAnim,
                transform: [
                  { translateY: reviewStepAnim.interpolate({ inputRange: [0, 1], outputRange: [20, 0] }) },
                  { scale: reviewStepAnim.interpolate({ inputRange: [0, 1], outputRange: [0.98, 1] }) },
                ],
              }}
            >
              {selectedProviderService && (
                <Animated.View style={{ transform: [{ scale: serviceDetailsAnim }], opacity: serviceDetailsAnim, marginTop: 0 }}>
                  {/* (mantido vazio como no original) */}
                </Animated.View>
              )}

              <BookingSummaryPreview
                provider={provider}
                selectedProviderService={selectedProviderService}
                selectedDate={selectedDate}
                selectedTime={selectedTime}
                address={address}
                durationInMinutes={effectiveDurationInMinutes}
                squareMeters={squareMeters}
                subtotal={calculatedSubtotal}
                discountAmount={discountAmount}
                finalPrice={finalCalculatedPrice}
                onShowCancellationPolicy={showCancellationPolicy}
                t={t}
                notes={notes}
                setNotes={setNotes}
                couponCode={couponCode}
                setCouponCode={setCouponCode}
                onApplyCoupon={handleApplyCoupon}
                isApplyingCoupon={isApplyingCoupon}
                couponInputAnim={couponInputAnim}
                couponFeedbackAnim={couponFeedbackAnim}
                couponFeedbackColor={couponFeedbackColor}
                couponFeedbackIcon={couponFeedbackIcon}
                reviewEntranceAnim={reviewStepAnim}
                reviewStaggerDelay={0}
                notesAnim={notesAnim}
                cupomAnim={cupomAnim}
                summaryAnim={summaryAnim}
              />
            </Animated.View>
          )}
        </Animated.ScrollView>

        {currentStep === 1 && (
          <View style={styles.bottomNextStepWrap}>
            <TouchableOpacity
              style={[styles.nextStepButton, isNextButtonDisabled && styles.nextStepButtonDisabled]}
              onPress={handleNextStep}
              disabled={isNextButtonDisabled}
              activeOpacity={0.9}
            >
              <Text style={styles.nextStepButtonText}>
                {(() => {
                  const isHourly = selectedProviderService?.pricingType === PricingType.HOURLY;
                  const hours = totalHours ?? 0;
                  const basePrice = selectedProviderService?.price ?? (paramServicePrice ? Number(paramServicePrice) : 0);

                  const priceForDisplay =
                    isHourly && hours > 0
                      ? finalCalculatedPrice > 0
                        ? finalCalculatedPrice
                        : hourlyTotalPrice ?? basePrice * hours
                      : finalCalculatedPrice > 0
                      ? finalCalculatedPrice
                      : basePrice;

                  if (isHourly && hours > 0) {
                    const hoursLabel = hours === 1 ? 'hora' : 'horas';
                    return `Agendar ${hours} ${hoursLabel} • ${formatBRL(priceForDisplay)}`;
                  }

                  if (priceForDisplay > 0) {
                    return `Agendar • ${formatBRL(priceForDisplay)}${isHourly ? '/h' : ''}`;
                  }

                  return 'Agendar';
                })()}
              </Text>
            </TouchableOpacity>
          </View>
        )}

        {currentStep === 2 && selectedSlots.length > 0 && (
          <View style={styles.timeSummaryInline}>
            <Text style={styles.timeSummaryText} numberOfLines={2}>
              {timeSelectionSummaryLabel}
            </Text>
          </View>
        )}

        {currentStep === 2 && (
          <Animated.View style={confirmButtonAnimatedStyle}>
            <ConfirmBookingButton
              isButtonDisabled={isConfirmButtonDisabled}
              onConfirmBooking={handleConfirmBooking}
              isBooking={isBooking}
              confirmButtonText={confirmButtonText}
              selectedTime={selectedTime}
              hasSelectedServicePrice={!!selectedProviderService?.price}
            />
          </Animated.View>
        )}

        {slotBadgeVisible && (
          <TouchableOpacity style={styles.slotBadgeContainer} activeOpacity={0.9}>
            <Animated.View style={[styles.slotBadgeGlow, { opacity: slotBadgeGlowOpacity, transform: [{ scale: slotBadgeGlowScale }] }]} />
            <Animated.View style={[styles.slotBadgeButton, { transform: [{ scale: slotBadgeScale }] }]}>
              <Text style={styles.slotBadgeText}>{slotBadgeLabel}</Text>
            </Animated.View>
          </TouchableOpacity>
        )}
      </View>

      <Modal visible={isCancellationOverlayVisible} transparent animationType="fade" onRequestClose={hideCancellationPolicy}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeaderRow}>
              <View style={styles.modalIconBadge}>
                <Ionicons name="shield-checkmark" size={18} color={AppColors.white} />
              </View>
              <Text style={styles.modalTitle}>
                {t('schedule_service.cancellation_policy_title', { defaultValue: 'Política de Cancelamento e Pagamento' })}
              </Text>
            </View>

            <View style={styles.modalList}>
              <Text style={styles.modalListItem}>• Cancelamento sem custo até 24h antes do início.</Text>
              <Text style={styles.modalListItem}>
                • Após 24h, pode haver retenção parcial para compensar bloqueio de agenda.
              </Text>
              <Text style={styles.modalListItem}>
                • Pagamento via PIX confirmado no app; o repasse ao prestador ocorre só após conclusão.
              </Text>
              <Text style={styles.modalListItem}>
                • O serviço é monitorado: o prestador inicia e encerra pelo app, garantindo tempo contratado.
              </Text>
              <Text style={styles.modalListItem}>
                • Segurança: KYC com documentos e selfie, verificação de antecedentes e dados protegidos.
              </Text>
            </View>

            <Text style={styles.modalFinePrint}>
              Precisa alterar algo? Reagende ou cancele com antecedência. Em emergências, fale com o suporte pelo app.
            </Text>

            <Pressable onPress={hideCancellationPolicy} style={styles.modalAction}>
              <Text style={styles.modalActionText}>{t('common.got_it', { defaultValue: 'Entendi' })}</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
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
    paddingBottom: 40,
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
    backgroundColor: AppColors.primaryInteractive,
  },
  stepActiveText: {
    color: AppColors.white,
    fontWeight: '700',
    fontSize: 11,
    textAlign: 'center',
  },
  stepItemGhost: {
    backgroundColor: 'transparent',
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
  safetyBannerContainer: {
    width: '100%',
    alignSelf: 'center',
    marginTop: 30,
    marginBottom: 4,
  },
  safetyBannerCard: {
    flex: 1,
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 14,
    flexDirection: 'row',
    alignItems: 'center',
    ...AppShadows.medium,
  },
  safetyBannerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  safetyBannerIconBadge: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: AppColors.primaryInteractive,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOpacity: 0.12,
        shadowRadius: 6,
        shadowOffset: { width: 0, height: 3 },
      },
      android: {
        elevation: 3,
      },
    }),
  },
  safetyBannerTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: AppColors.textBody,
    marginBottom: 2,
  },
  safetyBannerSubtitle: {
    fontSize: 11,
    color: AppColors.textAuxiliary,
    lineHeight: 16,
  },
  sectionHeaderRow: {
    marginHorizontal: 20,
    marginTop: 6,
    marginBottom: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-start',
  },
  sectionTitlePlain: {
    fontSize: 22,
    fontWeight: Platform.OS === 'ios' ? '600' : '700',
    color: AppColors.textBody,
    letterSpacing: 0.2,
    textTransform: 'none',
    paddingVertical: 4,
    paddingHorizontal: 0,
  },
  card: {
    backgroundColor: AppColors.white,
    borderRadius: 18,
    padding: 18,
    marginHorizontal: 18,
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 3,
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
  compactSection: {
    marginBottom: 12,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: AppColors.backgroundNeutral,
  },
  compactSectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: AppColors.textBody,
    marginBottom: 8,
    marginHorizontal: 0,
  },
  compactCouponInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: AppColors.borderNeutral,
    borderRadius: 8,
    overflow: 'hidden',
    height: 40,
  },
  compactCouponInput: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 12,
    fontSize: 14,
    color: AppColors.textBody,
  },
  compactApplyCouponButton: {
    backgroundColor: AppColors.primaryInteractive,
    paddingVertical: 8,
    paddingHorizontal: 16,
    justifyContent: 'center',
    alignItems: 'center',
    borderTopRightRadius: 8,
    borderBottomRightRadius: 8,
    minWidth: 70,
  },
  compactApplyCouponButtonText: {
    color: AppColors.white,
    fontWeight: '600',
    fontSize: 14,
  },
  compactCouponFeedbackContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 6,
    paddingHorizontal: 0,
  },
  compactCouponAppliedText: {
    marginLeft: 6,
    fontSize: 13,
    fontWeight: '500',
  },
  summarySection: {
    marginTop: 8,
  },
  summaryItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  summaryIcon: {
    marginRight: 12,
  },
  summaryText: {
    flex: 1,
    fontSize: 16,
    color: AppColors.textBody,
    lineHeight: 24,
  },
  summaryLabel: {
    fontSize: 16,
    fontWeight: '600',
  },
  priceSummary: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  timeSlotsHelperContainer: {
    marginHorizontal: 40,
    marginTop: 1,
    marginBottom: 10,
  },
  timeSlotsHelperText: {
    fontSize: 14,
    lineHeight: 20,
    color: '#6B7280',
    fontWeight: '500',
  },
  timeSlotsHelperSubText: {
    fontSize: 14,
    lineHeight: 20,
    color: '#6B7280',
    marginTop: 2,
  },
  timeSummaryInline: {
    paddingHorizontal: 20,
    paddingVertical: 6,
    backgroundColor: 'transparent',
  },
  timeSummaryText: {
    fontSize: 13,
    color: AppColors.textAuxiliary,
    textAlign: 'center',
  },
  priceLabel: {
    fontSize: 15,
    color: AppColors.textBody,
  },
  priceValue: {
    fontSize: 16,
    fontWeight: '600',
    color: AppColors.textBody,
  },
  discountValue: {
    color: AppColors.primaryInteractive,
  },
  totalPriceSummary: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: AppColors.backgroundNeutral,
  },
  totalPriceLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: AppColors.textBody,
  },
  totalPriceValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: AppColors.primaryInteractive,
  },
  cancellationPolicyLink: {
    marginTop: 12,
    alignSelf: 'center',
  },
  cancellationPolicyText: {
    fontSize: 12,
    color: AppColors.primaryInteractive,
    textDecorationLine: 'underline',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.25)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  modalCard: {
    width: '100%',
    maxWidth: 420,
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 20,
    shadowColor: '#0f172a',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.12,
    shadowRadius: 24,
    elevation: 12,
  },
  modalHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  modalIconBadge: {
    width: 34,
    height: 34,
    borderRadius: 10,
    backgroundColor: AppColors.primaryInteractive,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: AppColors.textBody,
  },
  modalList: {
    marginTop: 4,
    marginBottom: 12,
  },
  modalListItem: {
    fontSize: 14,
    lineHeight: 20,
    color: AppColors.textBody,
    marginBottom: 6,
  },
  modalFinePrint: {
    fontSize: 12,
    lineHeight: 18,
    color: AppColors.mediumGray,
    marginBottom: 14,
  },
  modalAction: {
    alignSelf: 'flex-start',
    backgroundColor: AppColors.primaryInteractive,
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 14,
  },
  modalActionText: {
    color: AppColors.white,
    fontSize: 14,
    fontWeight: '600',
  },
  notesFinalSection: {
    marginTop: 15,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: AppColors.backgroundNeutral,
    paddingBottom: 0,
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
    fontSize: 14,
  },
  bottomNextStepWrap: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: 24,
    paddingTop: 12,
    paddingBottom: Platform.OS === 'ios' ? 28 : 24,
    backgroundColor: AppColors.white,
    ...AppShadows.medium,
  },
  nextStepButton: {
    backgroundColor: AppColors.primaryInteractive,
    paddingVertical: 14,
    paddingHorizontal: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 24,
    marginTop: 6,
    marginBottom: 2,
    borderRadius: 44,
    overflow: 'hidden',
    ...AppShadows.medium,
    borderRightWidth: 0,
    borderRightColor: 'transparent',
    borderBottomColor: 'transparent',
    borderBottomWidth: 0,
    borderLeftColor: 'transparent',
    borderLeftWidth: 0,
    shadowColor: AppColors.black,
  },
  nextStepButtonDisabled: {
    backgroundColor: `${AppColors.primaryInteractive}50`,
    ...AppShadows.small,
  },
  nextStepButtonText: {
    color: AppColors.white,
    fontSize: 16,
    fontWeight: '700',
  },
  slotBadgeContainer: {
    position: 'absolute',
    right: 22,
    bottom: 180,
    zIndex: 50,
    alignItems: 'center',
    justifyContent: 'center',
  },
  slotBadgeGlow: {
    position: 'absolute',
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#FFCDD2',
  },
  slotBadgeButton: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#E53935',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 8,
  },
  slotBadgeText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '800',
  },
});
