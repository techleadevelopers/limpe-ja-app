import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import type { TFunction } from 'i18next';

import * as Haptics from 'expo-haptics'; // Adicione esta linha
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
    ActivityIndicator,
    Animated,
    Easing,
    Modal,
    Platform,
    Pressable,
    ScrollView,
    StyleProp,
    StyleSheet,
    Text,
    Alert,
    TextInput,
    TouchableOpacity,
    View,
    ViewStyle,
} from 'react-native';

import { getPricingConfig } from '../../../services/configService';
import NotificationUIService from '../../../services/notificationUIService';

import { useAuth } from '../../../hooks/useAuth';
import { createBooking } from '../../../services/bookingService';
import { getProviderDetails } from '../../../services/providerService';
import { fetchAvailabilityWithCooldown, availabilityCache } from './availabilityCache';
import { getInsurancePlans } from '../../../services/insuranceService';

import { VerificationStatus } from '../../../types/backend/auth';
import {
    BookingAddress,
    BookingDetails,
    BookingInsuranceSnapshot,
    BookingQuoteRequest,
    CreateBookingDto,
    InsurancePlanId,
    InsurancePlanProposal,
} from '../../../types/backend/bookings';
import { ProviderAvailability, ProviderDisplayInfo, ProviderServiceOffering } from '../../../types/backend/providers';
import { UserProfile } from '../../../types/backend/users';
import { formatBRL } from '../../../utils/formatters';

import axios from 'axios';
import { QuoteStatus, useBookingQuote } from '../../../hooks/useBookingQuote';
import { useDebouncedValue } from '../../../hooks/useDebouncedValue';
import { generateDailySlots, TimeSlot } from '../../../utils/timeSlots';
import {
  buildDateTimeForSlot,
  ensureValidSlotISO,
  formatBrazilDateKey,
  normalizeSlotLabel,
  toBrazilDate,
} from '../../../utils/time';

const makeBrazilDateKey = (date?: Date | null): string | null => {
  if (!date || Number.isNaN(date.getTime())) {
    return null;
  }
  return formatBrazilDateKey(date);
};
import { useCouponValidation } from '../../../utils/useCouponValidation';
import { normalizeApiError } from '../../_shared/utils/errors';

import AddressSection from '../../../components/client/booking/schedule/AddressSection';
import ProviderBrief from '../../../components/client/booking/schedule/ProviderBrief';
import TimeSlotsSection from '../../../components/client/booking/schedule/TimeSlotsSection';

import { InsuranceOptionsCard } from '../../../components/booking/InsuranceOptionsCard';
import ConfirmBookingButton from '../../../components/client/booking/schedule/ConfirmBookingButton';
import NotesInputSection from '../../../components/client/booking/schedule/NotesInputSection';
import ScheduleCalendar from '../../../components/client/booking/schedule/ScheduleCalendar';
import ScheduleHeader from '../../../components/client/booking/schedule/ScheduleHeader';
import VerificationNotice from '../../../components/client/explore/provider/VerificationNotice';


import { useDevice } from '@/utils/responsive';
import { AppColors, AppDurations, SCREEN_WIDTH } from '../../../constants/appStyles';

const AnimatedTextInput = Animated.createAnimatedComponent(TextInput);

type NormalizedBookingError = {
  code: string;
  message: string;
  actionable: boolean;
  blockAction: boolean;
};

const hasCompleteAddress = (address: BookingAddress) =>
  Boolean(address.street && address.number && address.neighborhood && address.city && address.state);

const isValidDuration = (duration: number | null | undefined) => typeof duration === 'number' && duration > 0;

const calcMinHourlySlots = (minMinutes: number, stepMinutes: number) => {
  const step = Math.max(stepMinutes, 1);
  return Math.max(1, Math.ceil(minMinutes / step));
};

const normalizeBookingError = (error: any, t: TFunction): NormalizedBookingError => {
  const apiError = normalizeApiError(error);
  const messageIndicator = (error?.response?.data?.message || error?.message || '').toString().toUpperCase();
  let message = apiError.messageHuman;
  let code = apiError.code;
  let blockAction = apiError.blockAction;

  if (axios.isAxiosError(error)) {
    const status = error.response?.status;
    if (status === 401 || status === 403) {
      message = t('schedule_service.session_expired', { defaultValue: 'Sua sessão expirou. Faça login novamente.' });
      code = 'UNAUTHORIZED';
      blockAction = true;
    }
  }

  if (messageIndicator.includes('PIX') && messageIndicator.includes('EXPIRED')) {
    message = t('schedule_service.pix_expired_message', {
      defaultValue: 'Pagamento via PIX expirou. Gere um novo link de pagamento e tente novamente.',
    });
    code = 'PIX_EXPIRED';
    blockAction = true;
  } else if (messageIndicator.includes('NO_PROVIDER') || messageIndicator.includes('AVAILABLE')) {
    message = t('schedule_service.no_provider_available', {
      defaultValue: 'Neste momento não há prestadores disponíveis para o horário selecionado.',
    });
    code = 'NO_PROVIDER_AVAILABLE';
    blockAction = false;
  } else if (messageIndicator.includes('CONFLICT') || messageIndicator.includes('ALREADY_BOOKED')) {
    message = t('schedule_service.slot_conflict_message', {
      defaultValue: 'O horário entrou em conflito. Atualize a agenda ou escolha outro horário.',
    });
    code = 'SLOT_CONFLICT';
    blockAction = false;
  } else if (!message || message.length === 0) {
    message = t('common.network_error', { defaultValue: 'Não foi possível concluir o agendamento. Tente novamente.' });
    code = 'GENERIC';
  }

  const actionable = !blockAction;
  return {
    code,
    message,
    actionable,
    blockAction,
  };
};
const toMinutes = (time: string) => {
  const normalized = normalizeSlotLabel(time);
  const [h, m] = normalized.split(':').map(Number);
  const hours = Number.isFinite(h) ? h : 0;
  const minutes = Number.isFinite(m) ? m : 0;
  return hours * 60 + minutes;
};

const formatTimeFromISO = (iso: string) => {
  const date = new Date(iso);
  const hours = date.getHours().toString().padStart(2, '0');
  const minutes = date.getMinutes().toString().padStart(2, '0');
  return `${hours}:${minutes}`;
};

const getMinutesFromISO = (iso: string) => {
  const date = new Date(iso);
  return date.getHours() * 60 + date.getMinutes();
};

const isHourlyService = (service?: ProviderServiceOffering | null | undefined) =>
  Boolean(service && service.pricePerHour > 0 && !service.needsReview);

const formatHourCount = (hours: number) => (Number.isInteger(hours) ? hours.toString() : hours.toFixed(1));
const PRICING_VERSION = 'v1';
const normalizeCoordinate = (value?: number) => Number((value ?? 0).toFixed(5));
const PRICING_CONFIG_FALLBACK_MINUTES = 240;

const buildQuoteRequestKey = (payload: BookingQuoteRequest) => {
  const normalizedAddress = {
    latitude: normalizeCoordinate(payload.address.latitude),
    longitude: normalizeCoordinate(payload.address.longitude),
    city: payload.address.city?.trim() || null,
    state: payload.address.state?.trim() || null,
    cep: payload.address.cep?.trim() || null,
  };

  const normalizedPayload = {
    pricingVersion: PRICING_VERSION,
    version: PRICING_VERSION,
    providerId: payload.providerId,
    providerServiceId: payload.providerServiceId,
    scheduledDate: payload.scheduledDate,
    scheduledTime: payload.scheduledTime,
    durationMinutes: payload.durationMinutes ?? null,
    insurancePlanId: payload.insurancePlanId ?? null,
    couponCode: payload.couponCode?.trim() || null,
    address: normalizedAddress,
  };

  return JSON.stringify(normalizedPayload);
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
  selectedTimeLabel: string | null;
  address: BookingAddress;
  durationInMinutes: number | null;
  squareMeters: number | null;
  subtotal: number;
  discountAmount: number;
  finalPrice: number;
  insuranceFeeCents: number;
  onShowCancellationPolicy: () => void;
  t: any;
  notes: string;
  setNotes: React.Dispatch<React.SetStateAction<string>>;
  couponInputValue: string;
  setCouponInputValue: React.Dispatch<React.SetStateAction<string>>;
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
  quoteStatus?: QuoteStatus;
  quoteRateLimitRemainingSeconds?: number;
  insuranceLabel: string;
  selectedInsuranceId: string | 'NONE';
  onEditService: () => void;
  onEditProvider: () => void;
  onEditDateTime: () => void;
  onEditAddress: () => void;
  onEditInsurance: () => void;
}

const BookingSummaryPreview = ({
  provider,
  selectedProviderService,
  selectedDate,
  selectedTimeLabel,
  address,
  durationInMinutes,
  squareMeters,
  subtotal,
  discountAmount,
  finalPrice,
  insuranceFeeCents,
  insuranceLabel,
  selectedInsuranceId,
  onShowCancellationPolicy,
  t,
  notes,
  setNotes,
  couponInputValue,
  setCouponInputValue,
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
  quoteStatus,
  quoteRateLimitRemainingSeconds = 0,
  onEditService,
  onEditProvider,
  onEditDateTime,
  onEditAddress,
  onEditInsurance,
}: BookingSummaryPreviewProps) => {
  const hasSelection = Boolean(selectedProviderService && selectedTimeLabel);
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

    if (isHourlyService(selectedProviderService) && durationInMinutes) {
      const hours = (durationInMinutes ?? 0) / 60;
      return `${t('schedule_service.summary_hours', { defaultValue: 'Horas' })}: ${hours}h`;
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

  const changeLabel = t('schedule_service.summary_change_action', { defaultValue: 'Alterar' });
  const addressLine1 = `${address.street || ''}${address.number ? `, ${address.number}` : ''}`.trim();
  const addressLine2 = `${address.neighborhood || ''}${address.city ? ` · ${address.city}` : ''}${address.state ? `/${address.state}` : ''}`.trim();
  const reviewRows = useMemo(() => {
    return [
      {
        key: 'service',
        icon: 'briefcase-outline',
        label: t('schedule_service.summary_service', { defaultValue: 'Serviço' }),
        value: selectedProviderService?.service?.name || t('common.na', { defaultValue: 'N/A' }),
        action: onEditService,
      },
      {
        key: 'provider',
        icon: 'person-outline',
        label: t('schedule_service.summary_provider', { defaultValue: 'Prestador' }),
        value: provider?.fullName || t('common.na', { defaultValue: 'N/A' }),
        action: onEditProvider,
      },
      {
        key: 'datetime',
        icon: 'calendar-outline',
        label: t('schedule_service.summary_date_time', { defaultValue: 'Data e Hora' }),
        value: `${formattedDate}, ${t('common.at', { defaultValue: 'às' })} ${selectedTimeLabel}`,
        action: onEditDateTime,
      },
      {
        key: 'address',
        icon: 'location-outline',
        label: t('schedule_service.summary_address', { defaultValue: 'Endereço' }),
        value: (
          <View>
            <Text style={styles.reviewValueLine}>{addressLine1 || t('common.na', { defaultValue: 'N/A' })}</Text>
            <Text style={styles.reviewValueLine}>{addressLine2 || t('common.na', { defaultValue: 'N/A' })}</Text>
          </View>
        ),
        action: onEditAddress,
      },
      {
        key: 'details',
        icon: 'timer-outline',
        label: t('schedule_service.summary_service_details', { defaultValue: 'Detalhes do Serviço' }),
        value: serviceDetailsText,
        action: onEditService,
      },
      {
        key: 'insurance',
        icon: 'shield-checkmark',
        label: t('schedule_service.summary_insurance_label', { defaultValue: 'Seguro/Proteção' }),
        value: (
          <View style={styles.reviewInsuranceValue}>
            <Text style={styles.reviewRowValue}>{insuranceLabel}</Text>
            <Text style={styles.reviewInsurancePrice}>
              {insuranceFeeCents > 0
                ? `+${formatBRL(insuranceFeeCents / 100)}`
                : t('schedule_service.insurance_none_price', { defaultValue: 'Sem custo' })}
            </Text>
          </View>
        ),
        action: onEditInsurance,
      },
    ];
  }, [
    provider,
    selectedProviderService,
    formattedDate,
    selectedTimeLabel,
    addressLine1,
    addressLine2,
    serviceDetailsText,
    insuranceLabel,
    insuranceFeeCents,
    onEditService,
    onEditProvider,
    onEditDateTime,
    onEditAddress,
    onEditInsurance,
    selectedInsuranceId,
    t,
  ]);

  if (!hasSelection || !selectedProviderService || !selectedTimeLabel) {
    return null;
  }

  return (
    <Animated.View
      style={[
        styles.card,
        styles.reviewCard,
        rCard,
        reviewCardAnim,
      ]}
    >
      <View
        style={[
          styles.sectionHeaderRow,
          styles.reviewSectionHeaderRow,
          { justifyContent: 'center' },
        ]}
      >
        <Text style={[styles.sectionTitlePlain, styles.reviewSectionTitle]}>
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
              value={couponInputValue}
              onChangeText={setCouponInputValue}
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
              disabled={isApplyingCoupon || !couponInputValue}
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
        {reviewRows.map((row) => (
          <View key={row.key} style={styles.reviewRow}>
            <Animated.View style={[styles.reviewRowIconContainer, animatedIconStyle]}>
              <Ionicons name={row.icon as any} size={20} color={AppColors.primaryInteractive} />
            </Animated.View>
            <View style={styles.reviewRowContent}>
              <Text style={styles.reviewRowLabel}>{row.label}</Text>
              {typeof row.value === 'string' ? (
                <Text style={styles.reviewRowValue}>{row.value}</Text>
              ) : (
                row.value
              )}
            </View>
            {row.action && row.key === 'insurance' && (
              <TouchableOpacity onPress={row.action} style={styles.reviewAction}>
                <Text style={styles.reviewActionText}>{changeLabel}</Text>
              </TouchableOpacity>
            )}
          </View>
        ))}

        <View style={styles.paymentBreakdown}>
          <View style={styles.paymentLine}>
            <Text style={styles.paymentLabel}>{t('schedule_service.subtotal', { defaultValue: 'Subtotal' })}</Text>
            <Text style={styles.paymentValue}>{formatBRL(subtotal)}</Text>
          </View>
          {discountAmount > 0 && (
            <View style={styles.paymentLine}>
              <Text style={styles.paymentLabel}>{t('schedule_service.discount', { defaultValue: 'Desconto' })}</Text>
              <Text style={[styles.paymentValue, styles.discountValue]}>- {formatBRL(discountAmount)}</Text>
            </View>
          )}
          {insuranceFeeCents > 0 && (
            <View style={styles.paymentLine}>
              <Text style={styles.paymentLabel}>{t('schedule_service.insurance_fee', { defaultValue: 'Seguro' })}</Text>
              <Text style={styles.paymentValue}>{formatBRL(insuranceFeeCents / 100)}</Text>
            </View>
          )}
          <View style={styles.paymentDivider} />
          <View style={styles.paymentLine}>
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
          <Text style={styles.paymentMicrocopy}>
            {t('schedule_service.payment_microcopy', { defaultValue: 'PIX • Confirmação em instantes' })}
          </Text>
        </View>

        {quoteStatus === 'refreshing' && (
          <Text style={styles.quoteStatusText}>
            {t('schedule_service.quote_refreshing', { defaultValue: 'Atualizando cotaA§ALo...' })}
          </Text>
        )}
        {quoteStatus === 'rateLimited' && quoteRateLimitRemainingSeconds > 0 && (
          <Text style={styles.quoteStatusText}>
            {t('schedule_service.rate_limit_hint', {
              defaultValue: `Tente novamente em ${quoteRateLimitRemainingSeconds}s`,
              seconds: quoteRateLimitRemainingSeconds,
            })}
          </Text>
        )}

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
  const debouncedSelectedDate = useDebouncedValue(selectedDate, 250);
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const selectedTimeLabel = useMemo(
    () => (selectedTime ? formatTimeFromISO(selectedTime) : null),
    [selectedTime],
  );
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
// 1. Estados Principais e de Configuração
  const [notes, setNotes] = useState<string>('');
  const [durationInMinutes, setDurationInMinutes] = useState<number | null>(null);
  const [squareMeters, setSquareMeters] = useState<number | null>(null);
  const [insurancePlanId, setInsurancePlanId] = useState<InsurancePlanId | null>(null);
  const [insuranceCatalog, setInsuranceCatalog] = useState<InsurancePlanProposal[] | null>(null);
  const [insuranceCatalogLoading, setInsuranceCatalogLoading] = useState(false);
  const [insuranceCatalogError, setInsuranceCatalogError] = useState<string | null>(null);
  const [insuranceCatalogReloadTrigger, setInsuranceCatalogReloadTrigger] = useState(0);
  const [minHourlyMinutes, setMinHourlyMinutes] = useState<number | null>(null);
  const [isPricingConfigLoading, setIsPricingConfigLoading] = useState(true);
  const [pricingConfigError, setPricingConfigError] = useState<string | null>(null);
  const [bookingBlockingError, setBookingBlockingError] = useState<NormalizedBookingError | null>(null);
  const [providerRateLimited, setProviderRateLimited] = useState(false);
  const [providerFetchErrorMessage, setProviderFetchErrorMessage] = useState<string | null>(null);
  const [providerReloadTrigger, setProviderReloadTrigger] = useState(0);

  // ✅ POSIÇÃO CORRETA: Declarada antes de ser usada em qualquer lugar
  const [displaySlotsInfo, setDisplaySlotsInfo] = useState<TimeSlot[]>([]);

const availabilityFetchKey = useMemo(() => {
    // Se não tiver provider ou a data for inválida, retorna null e para o fluxo
    if (!provider?.id || !debouncedSelectedDate || isNaN(debouncedSelectedDate.getTime())) {
      return null;
    }
    
    const dateKey = makeBrazilDateKey(debouncedSelectedDate);
    
    // Se o formatador falhar em gerar a string YYYY-MM-DD, para aqui
    if (!dateKey || dateKey.includes('NaN')) {
      return null;
    }
    
    return `${provider.id}-${dateKey}-${providerReloadTrigger}`;
  }, [provider?.id, debouncedSelectedDate, providerReloadTrigger]);

  // ✅ Efeito de Atualização dos Slots (Agora ele "enxerga" a variável declarada acima)
  useEffect(() => {
  if (!selectedProviderService || !isHourlyService(selectedProviderService)) return;

  if (!selectedSlots || selectedSlots.length === 0) {
    setSelectedTime(null);
    setDurationInMinutes(null);
    return;
  }

  const sorted = [...selectedSlots].map(normalizeSlotLabel).sort((a, b) => toMinutes(a) - toMinutes(b));
  const firstTime = sorted[0];
  const normalizedFirstTime = normalizeSlotLabel(firstTime);

  const matchedSlot = displaySlotsInfo?.find(
    (slot) => normalizeSlotLabel(slot.time) === normalizedFirstTime,
  );
  const matchedIso =
    matchedSlot?.fullISO ??
    buildDateTimeForSlot(selectedDate, normalizedFirstTime).toISOString();

  setSelectedTime(ensureValidSlotISO(matchedIso, selectedDate, normalizedFirstTime));
  setDurationInMinutes(sorted.length * 60);
  }, [selectedSlots, selectedProviderService, displaySlotsInfo, selectedDate]);

  const handleReloadProvider = useCallback(() => {
    setProviderRateLimited(false);
    setProviderFetchErrorMessage(null);
    setProviderReloadTrigger((prev) => prev + 1);
  }, []);

  const initialCoupon = (initialCouponCodeString ?? '').trim();
  const [couponInputValue, setCouponInputValue] = useState(initialCoupon);
  const [appliedCouponCode, setAppliedCouponCode] = useState(initialCoupon);

  const [isLoading, setIsLoading] = useState(true);
  const [isBooking, setIsBooking] = useState(false);
  const [isFetchingSlots, setIsFetchingSlots] = useState(false);
  const isSearchingNextDateRef = useRef(false);
  const [isCancellationOverlayVisible, setCancellationOverlayVisible] = useState(false);

  const [currentDisplayMonth, setCurrentDisplayMonth] = useState(new Date());
  const shineAnim = useRef(new Animated.Value(-SCREEN_WIDTH * 0.3)).current;

  // --- Helpers de UI ---
  const shouldBlockBookingRequests = Boolean(bookingBlockingError?.blockAction);
  const isPricingConfigReady = Boolean(minHourlyMinutes && !isPricingConfigLoading);

  const providerNeedsApproval =
    provider?.verificationStatus !== undefined &&
    provider.verificationStatus !== VerificationStatus.APPROVED;

const slotStepMinutes = useMemo(() => {
    if (!displaySlotsInfo || displaySlotsInfo.length < 2) return 60;

    const times = displaySlotsInfo
      .filter((s) => s.isAvailable)
      .map((s) => toMinutes(s.time))
      .sort((a, b) => a - b);

    if (times.length < 2) return 60;

    let step = 60; 
    for (let i = 1; i < times.length; i++) {
      const diff = times[i] - times[i - 1];
      if (diff > 0 && diff < step) step = diff;
    }
    return step;
  }, [displaySlotsInfo.length]);

  const enforcedMinHourlyMinutes = minHourlyMinutes ?? 0;

  const minHourlySlots = useMemo(
    () => calcMinHourlySlots(enforcedMinHourlyMinutes, slotStepMinutes),
    [enforcedMinHourlyMinutes, slotStepMinutes]
  );

  const hourlyBlockMinutes = useMemo(() => {
    // Verificação segura para evitar erros de undefined
    const isHourly = selectedProviderService && isHourlyService(selectedProviderService);
    if (!isHourly || !selectedSlots || selectedSlots.length === 0) {
      return 0;
    }

    const selectedMinutes = selectedSlots.length * slotStepMinutes;
    return Math.max(selectedMinutes, enforcedMinHourlyMinutes);
  }, [selectedProviderService, selectedSlots.length, slotStepMinutes, enforcedMinHourlyMinutes]);

  const hourlyBlockHours = useMemo(() => 
    hourlyBlockMinutes > 0 ? hourlyBlockMinutes / 60 : 0, 
    [hourlyBlockMinutes]
  );
  const hasShownTodayAvailableToastRef = useRef(false);

  const selectionAnim = useRef(new Animated.Value(1)).current;

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideUpAnim = useRef(new Animated.Value(50)).current;
  const scaleAnim = useRef(new Animated.Value(0.95)).current;
  const calendarBreatheAnim = useRef(new Animated.Value(1)).current;

  const floatingSummaryAnim = useRef(new Animated.Value(0)).current;

  const reviewStepAnim = useRef(new Animated.Value(0)).current;
  const serviceDetailsAnim = useRef(new Animated.Value(0)).current;
  const notesAnim = useRef(new Animated.Value(0)).current;
  const cupomAnim = useRef(new Animated.Value(0)).current;
  const summaryAnim = useRef(new Animated.Value(0)).current;

  const slotBadgeScale = useRef(new Animated.Value(1)).current;
  const [dateAvailability, setDateAvailability] = useState<Record<string, boolean>>({});

  const markDateAvailability = useCallback((dateStr: string, hasAvailability: boolean) => {
    setDateAvailability((prev) => {
      if (prev[dateStr] === hasAvailability) {
        return prev;
      }
      return { ...prev, [dateStr]: hasAvailability };
    });
  }, []);

  const [currentStep, setCurrentStep] = useState<number>(1);

  const scrollViewRef = useRef<ScrollView>(null);
  const handleReviewEditStep = useCallback(
    (step: number) => {
      setCurrentStep(step);
      scrollViewRef.current?.scrollTo({ y: 0, animated: true });
    },
    [],
  );
  const handleReviewEditInsurance = useCallback(() => {
    setCurrentStep(2);
    scrollViewRef.current?.scrollTo({ y: 0, animated: true });
  }, []);
  const timeSlotsRef = useRef<View>(null);

  const isMounted = useRef(true);
  const inflightAvailabilityKeyRef = useRef<string | null>(null);
  const lastFetchedAvailabilityKeyRef = useRef<string | null>(null);

  const loadPricingConfig = useCallback(async () => {
    if (!isMounted.current) return;
    setIsPricingConfigLoading(true);
    setPricingConfigError(null);
    setMinHourlyMinutes(null);

    try {
      const cfg = await getPricingConfig();
      if (!isMounted.current) return;

      if (typeof cfg.minHourlyMinutes === 'number' && cfg.minHourlyMinutes > 0) {
        setMinHourlyMinutes(cfg.minHourlyMinutes);
        setPricingConfigError(null);
      } else {
        setMinHourlyMinutes(PRICING_CONFIG_FALLBACK_MINUTES);
        setPricingConfigError(
          t('schedule_service.pricing_config_invalid', {
            defaultValue: 'Não foi possível carregar as regras de agendamento.',
          }),
        );
      }
    } catch (error) {
      if (!isMounted.current) return;
      setMinHourlyMinutes(PRICING_CONFIG_FALLBACK_MINUTES);
      setPricingConfigError(t('common.network_error', { defaultValue: 'Erro de rede.' }));
    } finally {
      if (isMounted.current) {
        setIsPricingConfigLoading(false);
      }
    }
  }, [t]);

  const reloadPricingConfig = useCallback(() => {
    void loadPricingConfig();
  }, [loadPricingConfig]);

  const effectiveDurationInMinutes = useMemo(() => {
    if (isHourlyService(selectedProviderService)) {
    return hourlyBlockMinutes > 0 ? hourlyBlockMinutes : null;
  }

  return durationInMinutes;
}, [selectedProviderService, durationInMinutes, hourlyBlockMinutes]);

  const scheduledDateKey = useMemo(
    () => (selectedDate ? formatBrazilDateKey(selectedDate) : null),
    [selectedDate],
  );

  const isAddressReadyForQuote = useMemo(() => {
    return (
      address.latitude !== 0 &&
      address.longitude !== 0 &&
      Boolean(address.city?.trim()) &&
      Boolean(address.state?.trim()) &&
      Boolean(address.street?.trim()) &&
      Boolean(address.number?.trim())
    );
  }, [address]);

  const quotePayload = useMemo<BookingQuoteRequest | null>(() => {
    if (
      !provider?.id ||
      !selectedProviderService?.id ||
      !scheduledDateKey ||
      !selectedTime ||
      !isAddressReadyForQuote
    ) {
      return null;
    }

    const normalizedSquareMeters =
      squareMeters && squareMeters > 0 ? squareMeters : undefined;

      return {
        providerId: provider.id,
        providerServiceId: selectedProviderService.id,
        scheduledDate: scheduledDateKey,
        scheduledTime: selectedTimeLabel ?? selectedTime,
        durationMinutes: effectiveDurationInMinutes ?? undefined,
      squareMeters: normalizedSquareMeters,
      roomCount: undefined,
      couponCode: appliedCouponCode || undefined,
      insurancePlanId: insurancePlanId ?? null,
      address,
    };
  }, [
    provider?.id,
    selectedProviderService?.id,
    scheduledDateKey,
    selectedTimeLabel,
    isAddressReadyForQuote,
    effectiveDurationInMinutes,
    squareMeters,
    appliedCouponCode,
    insurancePlanId,
    address,
  ]);

  

  const debouncedQuotePayload = useDebouncedValue(quotePayload, 300);

  const stableRequestKey = useMemo(() => {
    if (!debouncedQuotePayload) {
      return '';
    }
    return buildQuoteRequestKey(debouncedQuotePayload);
  }, [debouncedQuotePayload]);

  const {
    quote,
    status: quoteStatus,
    refreshQuote,
    rateLimitResetAt,
  } = useBookingQuote({
    requestKey: stableRequestKey,
    payload: debouncedQuotePayload,
  });

  const quoteLoading = quoteStatus === 'loading' || quoteStatus === 'refreshing';
  const [rateLimitTick, setRateLimitTick] = useState(0);
  useEffect(() => {
    if (!rateLimitResetAt) {
      setRateLimitTick(0);
      return;
    }
    const timer = setInterval(() => {
      setRateLimitTick((prev) => prev + 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [rateLimitResetAt]);

  const rateLimitRemainingSeconds = useMemo(() => {
    if (!rateLimitResetAt) return 0;
    const remainingMs = rateLimitResetAt - Date.now();
    return remainingMs > 0 ? Math.ceil(remainingMs / 1000) : 0;
  }, [rateLimitResetAt, rateLimitTick]);

  const hourlyBasePrice = useMemo(() => {
    return selectedProviderService?.pricePerHour ?? (paramServicePrice ? Number(paramServicePrice) : 0);
  }, [selectedProviderService?.pricePerHour, paramServicePrice]);

  const hourlyBlockPrice = useMemo(() => {
    if (hourlyBlockHours <= 0) return null;
    return hourlyBasePrice * hourlyBlockHours;
  }, [hourlyBlockHours, hourlyBasePrice]);

  const resolvedServicePrice = useMemo(() => {
    if (selectedProviderService?.pricePerHour != null && selectedProviderService.pricePerHour > 0) {
      return selectedProviderService.pricePerHour;
    }
    if (paramServicePrice) {
      const parsed = Number(paramServicePrice);
      return Number.isFinite(parsed) && parsed > 0 ? parsed : undefined;
    }
    return undefined;
  }, [selectedProviderService?.pricePerHour, paramServicePrice]);

  const fallbackFinalPrice =
    hourlyBlockPrice != null && hourlyBlockPrice > 0
      ? hourlyBlockPrice
      : resolvedServicePrice ?? (selectedProviderService?.pricePerHour ?? 0);
  const displaySubtotal = quote?.subtotal ?? fallbackFinalPrice;
  const displayDiscount = quote?.discountAmount ?? 0;
  const insuranceOptions = quote?.insuranceOptions ?? [];
  const quoteHasOptions = quoteStatus === 'success' && insuranceOptions.length > 0;
  const shouldFetchCatalog =
    insuranceOptions.length === 0 &&
    (
      ['success', 'error', 'rateLimited', 'invalid'].includes(quoteStatus) ||
      (quoteStatus === 'idle' && selectedSlots.length > 0)
    );
  const hasCatalogOptions =
    Array.isArray(insuranceCatalog) && insuranceCatalog.length > 0;
  const insuranceOptionsToRender =
    insuranceOptions.length > 0 ? insuranceOptions : hasCatalogOptions ? insuranceCatalog! : [];
  const isInsuranceErrorState =
    Boolean(insuranceCatalogError) && !quoteHasOptions && !hasCatalogOptions;
  const insuranceLoading =
    quoteStatus === 'loading' ||
    quoteStatus === 'refreshing' ||
    (shouldFetchCatalog && insuranceCatalogLoading);
  const isQuoteSettled =
    ['success', 'rateLimited', 'error', 'invalid'].includes(quoteStatus);
  const insuranceOptionsLoaded =
    quoteHasOptions ||
    hasCatalogOptions ||
    isInsuranceErrorState ||
    (isQuoteSettled && !insuranceLoading);
  const selectedInsurancePlan =
    insuranceOptionsToRender.find((plan) => plan.id === insurancePlanId) ?? null;
  const insuranceLabel =
    selectedInsurancePlan?.name ??
    t('schedule_service.insurance_default_label', { defaultValue: 'Sem proteção' });
  const selectedInsuranceId = insurancePlanId ?? 'NONE';
  const insuranceFeeFromQuote =
    quote?.selectedInsurance?.finalPriceCents ?? quote?.insuranceFeeCents ?? 0;
  const insuranceFeeCents =
    selectedInsurancePlan?.finalPriceCents ?? insuranceFeeFromQuote;
  const fallbackServiceCents = Math.round(Math.max(fallbackFinalPrice, 0) * 100);
  const fallbackTotalCents = fallbackServiceCents + insuranceFeeCents;
  const quotedTotalCents =
    typeof quote?.totalCents === 'number' ? quote.totalCents : null;
  const totalCents =
    quotedTotalCents !== null && quotedTotalCents > 0
      ? quotedTotalCents
      : fallbackTotalCents;
  const finalCalculatedPrice = Math.max(totalCents, 0) / 100;
  const displayedInsuranceFeeCents = insuranceFeeCents;
  const reviewInsuranceSnapshot = useMemo<BookingInsuranceSnapshot | null>(() => {
    if (!selectedInsurancePlan) {
      return null;
    }

    return {
      planId: selectedInsurancePlan.id,
      priceCents: selectedInsurancePlan.finalPriceCents ?? 0,
      coverageCents: selectedInsurancePlan.coverageCents,
      deductibleCents: selectedInsurancePlan.deductibleCents,
      riskMultiplierBps: selectedInsurancePlan.riskMultiplierBps,
      proofRequired: selectedInsurancePlan.proofRequired,
      createdAt: new Date().toISOString(),
    };
  }, [selectedInsurancePlan]);

  useEffect(() => {
    if (!shouldFetchCatalog || !provider?.id) {
      setInsuranceCatalog(null);
      setInsuranceCatalogError(null);
      setInsuranceCatalogLoading(false);
      return;
    }

    const providerCompletedBookings =
      provider?.metrics?.totalBookings ?? provider?.monthlyBookingsCount ?? 0;
    const estimateCents = Math.round((quote?.subtotal ?? displaySubtotal) * 100);
    const safeEstimateCents = Math.max(estimateCents, 15000);
    const controller = new AbortController();
    setInsuranceCatalogLoading(true);
    setInsuranceCatalogError(null);

    const fetchInsuranceCatalog = async () => {
      try {
        const plans = await getInsurancePlans(
          {
            clientCompleted: typedUser?.clientDetails?.completedBookingsCount ?? 0,
            estimateTotalCents: safeEstimateCents,
            providerRating: provider?.averageRating ?? 0,
            providerCompletedBookings,
            providerNewProvider: providerCompletedBookings < 5,
          },
          { signal: controller.signal },
        );
        setInsuranceCatalog(plans);
      } catch (error: any) {
        if (error?.name === 'CanceledError') {
          return;
        }
        console.warn('Falha ao carregar planos de proteção:', error);
        const isRateLimit = error?.response?.status === 429;
        setInsuranceCatalogError(
          isRateLimit
            ? t('schedule_service.insurance_catalog_rate_limit', {
                defaultValue:
                  'Estamos recebendo muitas requisições de proteção. Tente novamente em alguns segundos.',
              })
            : t('schedule_service.insurance_catalog_error', {
                defaultValue: 'Não foi possível carregar os planos de proteção.',
              }),
        );
      } finally {
        setInsuranceCatalogLoading(false);
      }
    };

    void fetchInsuranceCatalog();

    return () => controller.abort();
  }, [
    shouldFetchCatalog,
    selectedSlots.length,
    provider?.id,
    quote?.quoteHash,
    quote?.subtotal,
    displaySubtotal,
    provider?.averageRating,
    provider?.metrics?.totalBookings,
    provider?.monthlyBookingsCount,
    typedUser?.clientDetails?.completedBookingsCount,
    t,
    insuranceCatalogReloadTrigger,
  ]);

  const handleInsurancePlanChange = useCallback(
    (planId: InsurancePlanId | null) => {
      setInsurancePlanId(planId);
    },
    [],
  );

  const handleReloadInsuranceCatalog = useCallback(() => {
    setInsuranceCatalogReloadTrigger((prev) => prev + 1);
  }, []);

  const {
    isApplyingCoupon,
    couponInputAnim,
    couponFeedbackAnim,
    couponFeedbackColor,
    couponFeedbackIcon,
    handleApplyCoupon,
  } = useCouponValidation({
    couponValue: couponInputValue,
    onApplyCoupon: async (value) => {
      const normalized = value.trim();
      setAppliedCouponCode(normalized);
      setCouponInputValue(normalized);
    },
  });

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
  const stepInsuranceTitle = useMemo(
    () => t('schedule_service.progress_step_insurance', { defaultValue: 'Seguro' }),
    [t],
  );
  const stepReviewTitle = useMemo(
    () => t('schedule_service.progress_step_complete_review', { defaultValue: 'Revisão' }),
    [t],
  );
  const stepTitlesInternal = [stepDateTimeTitle, stepInsuranceTitle, stepReviewTitle];
  const stepTitles = [stepDateTimeTitle, stepReviewTitle];
  const TOTAL_STEPS = stepTitlesInternal.length;

   const timeSelectionSummaryLabel = useMemo(() => {
  // 1. Verificações de segurança
  const isHourly = selectedProviderService && isHourlyService(selectedProviderService);
  if (!isHourly || hourlyBlockHours <= 0) {
    return null;
  }

  // 2. Formatação do texto de horas (ex: "4 horas" ou "1 hora")
  // Usamos o plural correto baseado no valor
  const hoursText = formatHourCount(hourlyBlockHours);
  const hoursLabel = hourlyBlockHours === 1 
    ? t('common.hour_selected', { defaultValue: 'hora selecionada' }) 
    : t('common.hours_selected', { defaultValue: 'horas selecionadas' });

  // 3. Lógica de Preço (Prioridade: Preço final calculado > Preço do bloco > Preço base)
  const priceToDisplay = finalCalculatedPrice > 0 
    ? finalCalculatedPrice 
    : (hourlyBlockPrice ?? 0);

  // 4. Retorno da String formatada
  // Exemplo: "4 horas selecionadas · Total estimado: R$ 600,00"
  return `${hoursText} ${hoursLabel} · ${t('schedule_service.estimated_total', { defaultValue: 'Total estimado' })}: ${formatBRL(priceToDisplay)}`;
  
}, [
  selectedProviderService, 
  hourlyBlockHours, 
  finalCalculatedPrice, 
  hourlyBlockPrice, 
  t // Adicione t se estiver usando traduções
]);

  const prefetchAvailability = useCallback(async (provId: string | undefined, baseDate: Date) => {
    if (!provId) return;

    const now = Date.now();
    for (const [key, value] of availabilityCache.entries()) {
      if (now - value.timestamp > 3600000) availabilityCache.delete(key);
    }

    const offsets = [-1, 0, 1];
    for (const offset of offsets) {
      const prefetchDate = new Date(baseDate);
      prefetchDate.setDate(baseDate.getDate() + offset);
      const dateString = makeBrazilDateKey(prefetchDate);
      if (!dateString) continue;
      try {
        await fetchAvailabilityWithCooldown(provId, dateString);
      } catch {
        // Silenciar falhas de prefetch
      }
    }
  }, []);

  useEffect(() => {
    if (currentStep === 3 && finalCalculatedPrice > 0 && lastFinalPriceRef.current !== finalCalculatedPrice) {
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

    return () => {
      isMounted.current = false;
    };
  }, [fadeAnim, slideUpAnim, scaleAnim]);

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
    if (currentStep === 3) {
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
    if (currentStep === 3 && selectedTime && finalCalculatedPrice > 0) {
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
  async (dateObj: Date) => {
    // 1. Validação inicial
    if (!provider?.id || !dateObj || isNaN(dateObj.getTime())) return;

    // Limpa trava de requisição anterior
    if (inflightAvailabilityKeyRef) {
      inflightAvailabilityKeyRef.current = null;
    }
    
    setIsFetchingSlots(true); 

    // 2. Feedback visual e tátil
    if (Platform.OS === 'ios') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }

    Animated.sequence([
      Animated.timing(scaleAnim, { toValue: 0.98, duration: 100, useNativeDriver: true }),
      Animated.spring(scaleAnim, { toValue: 1, friction: 6, useNativeDriver: true }),
    ]).start();

    // 3. Reset de estados para o novo dia
    setSelectedDate(dateObj);
    setSelectedTime(null); 
    setSelectedSlots([]); 

    try {
      // 4. Chamada de prefetch apenas para preparar o cache (o efeito principal resolve os slots)
      await prefetchAvailability(provider.id, dateObj);

      // 5. Scroll para a seção de horários
      setTimeout(() => {
        if (scrollViewRef.current) {
          scrollViewRef.current.scrollTo({ y: 480, animated: true });
        }
      }, 600);

    } catch (error: unknown) {
      console.error("[handleDaySelect] Erro na requisição:", error);
      const errorMessage = error instanceof Error ? error.message : String(error);
      if (errorMessage.includes('429')) {
        Alert.alert("Calma aí", "Você está navegando muito rápido.");
      }
    } finally {
      setIsFetchingSlots(false); 
    }
  },
  [
    provider?.id, 
    prefetchAvailability, 
    scaleAnim, 
    setIsFetchingSlots, 
    setDisplaySlotsInfo, 
    setSelectedDate, 
    setSelectedTime, 
    setSelectedSlots
  ] 
);

  const handleTimeSelect = useCallback(
    (slotIso: string) => {
      const selectedSlot = displaySlotsInfo.find((slot) => slot.fullISO === slotIso);

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

      const baseTime = normalizeSlotLabel(selectedSlot.time);
      const requiredSlots = Math.max(minHourlySlots, 4);
      const stepMinutes = Math.max(slotStepMinutes, 1);
      const baseMinutes = toMinutes(baseTime);

      const availableMinutes = new Map<number, string>();
      displaySlotsInfo.forEach((slot) => {
        if (!slot.isAvailable) return;
        const normalizedTime = normalizeSlotLabel(slot.time);
        const minuteValue = toMinutes(normalizedTime);
        if (!availableMinutes.has(minuteValue)) {
          availableMinutes.set(minuteValue, normalizedTime);
        }
      });

      setSelectedSlots((prev) => {
        if (prev.includes(baseTime)) {
          setSelectedTime(null);
          setDurationInMinutes(null);
          return [];
        }
        const sequentialSlots: string[] = [];
        for (let offset = 0; offset < requiredSlots; offset++) {
          const targetMinutes = baseMinutes + offset * stepMinutes;
          const normalizedTime = availableMinutes.get(targetMinutes);
          if (!normalizedTime) {
            NotificationUIService.showInfo(
              t('common.minimum_hours', { defaultValue: 'Mínimo 4h' }),
              t('common.info', { defaultValue: 'Aviso' }),
            );
            return prev;
          }
          sequentialSlots.push(normalizedTime);
        }

        setSelectedTime(ensureValidSlotISO(selectedSlot.fullISO, selectedDate, sequentialSlots[0]));
        setDurationInMinutes(sequentialSlots.length * 60);
        return sequentialSlots;
      });
    },
    [displaySlotsInfo, selectionAnim, t, selectedDate, slotStepMinutes, minHourlySlots],
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

    if (currentStep === 2 && (insuranceLoading || !insuranceOptionsLoaded)) {
      NotificationUIService.showError(
        t('schedule_service.insurance_loading', { defaultValue: 'Carregando planos de protecao...' }),
        t('common.loading', { defaultValue: 'Carregando' }),
      );
      return;
    }

    Animated.sequence([
      Animated.parallel([
        Animated.timing(fadeAnim, { toValue: 0, duration: AppDurations.xs, useNativeDriver: true }),
        Animated.timing(scaleAnim, { toValue: 0.95, duration: AppDurations.xs, useNativeDriver: true }),
      ]),
    ]).start(() => {
    setCurrentStep((prev) => Math.min(prev + 1, TOTAL_STEPS));

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
    insuranceLoading,
    insuranceOptionsLoaded,
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
    if (shouldBlockBookingRequests) {
      if (bookingBlockingError) {
        NotificationUIService.showError(
          bookingBlockingError.message,
          t('common.error', { defaultValue: 'Erro' }),
        );
      }
      return;
    }

    if (
      !typedUser?.id ||
      !provider?.id ||
      !selectedProviderService?.id ||
      !selectedDate ||
      !selectedTime ||
      !hasCompleteAddress(address)
    ) {
      NotificationUIService.showError(
        t('schedule_service.booking_error_message', { defaultValue: 'Dados incompletos para agendar.' }),
        t('schedule_service.booking_error_title', { defaultValue: 'Erro no Agendamento' }),
      );
      return;
    }

    if (!isPricingConfigReady) {
      NotificationUIService.showError(
        t('schedule_service.pricing_config_invalid', {
          defaultValue: 'Não foi possível carregar as regras de agendamento.',
        }),
        t('common.error', { defaultValue: 'Erro' }),
      );
      return;
    }

    if (providerNeedsApproval) {
      NotificationUIService.showError(
        t('schedule_service.provider_pending_message', {
          defaultValue: 'Este profissional ainda está em verificação. Aguarde aprovação para agendar.',
        }),
        t('schedule_service.provider_pending_title', { defaultValue: 'Provedor em verificação' }),
      );
      return;
    }

    if (isHourlyService(selectedProviderService) && !isValidDuration(effectiveDurationInMinutes)) {
      NotificationUIService.showError(
        t('schedule_service.booking_error_duration_size', { field: t('common.duration', { defaultValue: 'duração' }) }),
        t('schedule_service.booking_error_title', { defaultValue: 'Erro no Agendamento' }),
      );
      return;
    }

    let requestedDurationMinutes = 0;

    if (isMounted.current) setIsBooking(true);

    try {
      if (isHourlyService(selectedProviderService)) {
        requestedDurationMinutes = effectiveDurationInMinutes ?? 0;
      }

      const safeSelectedDate = selectedDate ?? new Date();

      const bookingData: CreateBookingDto = {
        providerId: provider.id,
        providerServiceId: selectedProviderService.id,
        scheduledDate: formatBrazilDateKey(safeSelectedDate),
        scheduledTime: selectedTimeLabel ?? (selectedTime ? formatTimeFromISO(selectedTime) : ''),
        totalPrice: finalCalculatedPrice,
        notes,
        address: {
          ...address,
          latitude: address.latitude ?? 0,
          longitude: address.longitude ?? 0,
        },
        requestedDurationMinutes,
        couponCode: quote?.couponApplied ? appliedCouponCode : undefined,
        quoteId: quote?.quoteId,
        quoteHash: quote?.quoteHash,
        quoteExpiresAt: quote?.expiresAt,
      insurancePlanId,
      };

      console.log('[ScheduleService] bookingData.totalPrice', bookingData.totalPrice);
      const newBooking: BookingDetails = await createBooking(bookingData);
      if (!isMounted.current) return;

      const backendTotalPrice = newBooking.totalPrice ?? finalCalculatedPrice;
      const uiTotalPrice =
        Math.abs(backendTotalPrice - finalCalculatedPrice) > 0.01
          ? finalCalculatedPrice
          : backendTotalPrice;
      router.replace({
        pathname: '/client/bookings/success',
        params: {
          bookingId: newBooking.id,
          totalPrice: uiTotalPrice.toString(),
          paymentMethod: 'PIX',
          couponApplied: quote?.couponApplied ? 'true' : 'false',
          couponCode: quote?.couponApplied ? appliedCouponCode : undefined,
        },
      });

      NotificationUIService.showSuccess(
        t('schedule_service.booking_success_message', { defaultValue: 'Agendamento realizado com sucesso!' }),
        t('common.success', { defaultValue: 'Sucesso' }),
      );
    } catch (error: any) {
      if (!isMounted.current) {
        return;
      }

      const isProviderDenied =
        error?.message === 'provider-not-approved' ||
        error?.response?.data?.message === 'provider-not-approved';

      if (isProviderDenied) {
        NotificationUIService.showError(
          t('schedule_service.provider_pending_message', {
            defaultValue: 'Este profissional ainda está em verificação. Aguarde aprovação para agendar.',
          }),
          t('schedule_service.provider_pending_title', { defaultValue: 'Provedor em verificação' }),
        );
        return;
      }

      if (
        axios.isAxiosError(error) &&
        error.response?.status === 409 &&
        error.response.data?.message === 'PRICE_MISMATCH'
      ) {
        await refreshQuote();
        NotificationUIService.showInfo(
          t('schedule_service.quote_price_updated', { defaultValue: 'Preço atualizado' }),
          t('common.success', { defaultValue: 'Sucesso' }),
        );
        return;
      }

      const normalized = normalizeBookingError(error, t);
      if (normalized.blockAction) {
        setBookingBlockingError(normalized);
      } else {
        setBookingBlockingError(null);
      }

      if (normalized.code === 'SLOT_CONFLICT') {
        setSelectedSlots([]);
        setSelectedTime(null);
        setCurrentStep(1);
        scrollViewRef.current?.scrollTo({ y: 0, animated: true });
      }

      NotificationUIService.showError(
        normalized.message,
        t('common.error', { defaultValue: 'Erro' }),
      );
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
    appliedCouponCode,
    quote,
    refreshQuote,
    t,
    effectiveDurationInMinutes,
    providerNeedsApproval,
    bookingBlockingError,
    shouldBlockBookingRequests,
    isPricingConfigReady,
  ]);

  useEffect(() => {
    if (providerRateLimited) {
      return;
    }

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
          void loadPricingConfig();

          const fetchedProvider = await getProviderDetails(paramProviderId);
        if (!isMounted.current) return;

        setProvider(fetchedProvider);

        let foundService = fetchedProvider.providerServices?.find(
          (ps) => ps.id === paramServiceId && ps.service && ps.service.id && ps.service.name,
        );

        if (foundService && !isHourlyService(foundService)) {
          const targetServiceId = foundService.service?.id;

          const hourlyAlternative =
            fetchedProvider.providerServices?.find(
              (ps) =>
                isHourlyService(ps) &&
                ps.service &&
                targetServiceId &&
                ps.service.id === targetServiceId,
            ) || fetchedProvider.providerServices?.find((ps) => isHourlyService(ps));

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

        const defaultDuration =
          typeof foundService.durationMinutes === 'number' && foundService.durationMinutes > 0
            ? foundService.durationMinutes
            : 120;
        if (isMounted.current) setDurationInMinutes(defaultDuration);

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
        await prefetchAvailability(paramProviderId, today);

        if (initialCouponCodeString) {
          setTimeout(() => {
            if (isMounted.current) handleApplyCoupon();
          }, 500);
        }
      } catch (error: any) {
        if (!isMounted.current) return;

        const normalized = normalizeApiError(error);
        if (normalized.blockAction) {
          const blockMessage =
            normalized.code === 'RATE_LIMITED'
              ? t('schedule_service.provider_rate_limited', {
                  defaultValue:
                    'Você atingiu o limite de requisições para obter detalhes deste prestador. Aguarde alguns segundos e tente novamente.',
                })
              : normalized.messageHuman;
          setProviderFetchErrorMessage(blockMessage);
          setProviderRateLimited(true);
          NotificationUIService.showError(blockMessage, t('common.error', { defaultValue: 'Erro' }));
          return;
        }

        NotificationUIService.showError(
          error.response?.data?.message || t('common.network_error', { defaultValue: 'Erro de rede.' }),
          t('common.error', { defaultValue: 'Erro' }),
        );
        router.replace('/client/explore');
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
    t,
    providerRateLimited,
    providerReloadTrigger,
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
  // --- 1. TRAVA DE SEGURANÇA INICIAL ---
  // Se a key for nula ou a data for inválida, limpamos e saímos IMEDIATAMENTE.
  if (!availabilityFetchKey || !debouncedSelectedDate || isNaN(debouncedSelectedDate.getTime())) {
    if (isMounted.current) {
      setDisplaySlotsInfo([]);
      setSelectedTime(null);
    }
    lastFetchedAvailabilityKeyRef.current = null;
    return;
  }

  // --- 2. EVITAR DUPLICIDADE ---
  if (lastFetchedAvailabilityKeyRef.current === availabilityFetchKey) {
    return;
  }
  lastFetchedAvailabilityKeyRef.current = availabilityFetchKey;

  let isCancelled = false;
  const fetchKey = availabilityFetchKey;

  const fetchAndProcessSlotsForDate = async () => {
    // Verificação de segurança dentro da função assíncrona
    if (!fetchKey || isCancelled) return;

    if (inflightAvailabilityKeyRef.current === fetchKey) return;
    inflightAvailabilityKeyRef.current = fetchKey;

    try {
      if (isMounted.current) setIsFetchingSlots(true);

      // Pequeno delay para garantir que o estado se estabilizou
      await new Promise((resolve) => setTimeout(resolve, 50));

      // --- 3. NORMALIZAÇÃO DA DATA ---
      // Usamos o helper para garantir que a string enviada ao backend nunca seja "NaN"
      const dateString = makeBrazilDateKey(debouncedSelectedDate);
      
      if (!dateString || dateString.includes('NaN')) {
        console.warn('[ScheduleService] Abortando: dataString inválida gerada.');
        if (isMounted.current) {
          setDisplaySlotsInfo([]);
          setIsFetchingSlots(false);
        }
        return;
      }

      const cacheKey = `${provider?.id}-${dateString}`;
      const normalizedDateForSlots = toBrazilDate(debouncedSelectedDate);
      const fallbackDayOfWeek = normalizedDateForSlots.getDay();
      console.log('[ScheduleService] ✅ Buscando disponibilidade real para:', dateString);
      console.log('[DEBUG] Chave buscada:', cacheKey);
      console.log(
        '[DEBUG] Chaves disponíveis no cache:',
        Array.from(availabilityCache.keys()),
      );

      let backendResponse: { available: ProviderAvailability[]; occupiedTimes: string[] } | undefined;

      // --- 4. LÓGICA DE CACHE E FETCH ---
      if (availabilityCache.has(cacheKey)) {
        const cached = availabilityCache.get(cacheKey);
        if (cached && Date.now() - cached.timestamp < 3600000) { // 1 hora
          backendResponse = { available: cached.available, occupiedTimes: cached.occupiedTimes };
        }
      }

      if (!backendResponse && provider?.id && !isCancelled) {
        backendResponse = await fetchAvailabilityWithCooldown(provider.id, dateString);
        availabilityCache.set(cacheKey, { ...backendResponse, timestamp: Date.now() });
      }

      if (!backendResponse || isCancelled) {
        if (isMounted.current) setIsFetchingSlots(false);
        return;
      }

      // --- 5. PROCESSAMENTO DE SLOTS ---
      const processedSlots = (backendResponse.available || [])
        .map((slot: any) => {
          if (typeof slot === 'string') {
            const startTime = slot.split('-')[0]?.trim();
            return {
              startTime,
              dayOfWeek: fallbackDayOfWeek,
              isAvailable: slot.includes('(true)'),
            };
          }

          return {
            ...slot,
            startTime: slot.startTime || slot.time || slot.hour || slot.start,
            dayOfWeek:
              typeof slot.dayOfWeek === 'number'
                ? slot.dayOfWeek
                : slot.dayOfWeek
                ? Number(slot.dayOfWeek)
                : fallbackDayOfWeek,
            isAvailable: slot.isAvailable ?? slot.available ?? true,
          };
        })
        .filter((s) => typeof s.startTime === 'string' && s.startTime);

      const providerConfiguredSlots = processedSlots;

      const finalDisplaySlots = generateDailySlots(
        debouncedSelectedDate,
        providerConfiguredSlots,
        backendResponse.occupiedTimes || [],
        selectedProviderService?.durationMinutes || null,
        undefined,
        dateString,
      );

      console.log('[DEBUG] Slots encontrados:', finalDisplaySlots.length);
      const normalizedDisplaySlots = finalDisplaySlots.map((slot) => {
        const normalizedTime = normalizeSlotLabel(slot.time);
        return {
          ...slot,
          time: normalizedTime,
          isAvailable: true,
          fullISO: ensureValidSlotISO(slot.fullISO, debouncedSelectedDate, normalizedTime),
        };
      });

      const slotsForDisplay = normalizedDisplaySlots.filter((slot) => slot.time.endsWith(':00'));

      console.log(
        '[DEBUG] Slots backend disponíveis:',
        finalDisplaySlots.length,
        '→ após filtro hora cheia:',
        slotsForDisplay.length,
      );

      // --- 6. ATUALIZAÇÃO DA UI ---
      if (isMounted.current && !isCancelled) {
        console.log('[DEBUG] Slots renderizados (hora cheia):', slotsForDisplay.length);
        setDisplaySlotsInfo(slotsForDisplay);
        const hasRealAvailableSlots = finalDisplaySlots.some((slot) => slot.isAvailable);
        markDateAvailability(dateString, hasRealAvailableSlots);

        // Feedback visual se encontrar slots
        if (hasRealAvailableSlots) {
          Animated.parallel([
            Animated.timing(fadeAnim, { toValue: 1, duration: 200, useNativeDriver: true }),
            Animated.spring(scaleAnim, { toValue: 1, friction: 5, useNativeDriver: true }),
          ]).start();
        }
      }
    } catch (err) {
      console.error('[ScheduleService] Erro no fluxo de slots:', err);
    } finally {
      if (isMounted.current) setIsFetchingSlots(false);
      inflightAvailabilityKeyRef.current = null;
    }
  };

  fetchAndProcessSlotsForDate();

  return () => {
    isCancelled = true;
  };
}, [
  availabilityFetchKey,
  provider?.id,
  debouncedSelectedDate,
  selectedProviderService,
  t,
  fadeAnim,
  scaleAnim,
  markDateAvailability,
]);

  const isNextButtonDisabled = useMemo(() => {
    if (!isPricingConfigReady) return true;
    if (currentStep === 1) {
      const needMinSlots = isHourlyService(selectedProviderService) && selectedSlots.length < minHourlySlots;

      return selectedSlots.length === 0 || needMinSlots || !hasCompleteAddress(address);
    }
    return false;
  }, [currentStep, selectedSlots, address, selectedProviderService, minHourlySlots, isPricingConfigReady]);

  const isStepTwoContinueDisabled = insuranceLoading || !insuranceOptionsLoaded;

  const isConfirmButtonDisabled = useMemo(() => {
    if (!isPricingConfigReady || !selectedProviderService) return true;

    const baseDisabled =
      selectedSlots.length === 0 || !hasCompleteAddress(address) || isBooking || quoteLoading;

    if (!isHourlyService(selectedProviderService)) {
      return baseDisabled || providerNeedsApproval || shouldBlockBookingRequests;
    }

    return (
      baseDisabled ||
      selectedSlots.length < minHourlySlots ||
      !isValidDuration(durationInMinutes) ||
      providerNeedsApproval ||
      shouldBlockBookingRequests
    );
  }, [
    selectedSlots,
    address,
    selectedProviderService,
    durationInMinutes,
    isBooking,
    providerNeedsApproval,
    minHourlySlots,
    quoteLoading,
    isPricingConfigReady,
    shouldBlockBookingRequests,
  ]);

    const selectedHoursLabel = useMemo(() => {
      if (isHourlyService(selectedProviderService) && hourlyBlockHours > 0) {
        const formattedHours = formatHourCount(hourlyBlockHours);
        const labelSuffix = hourlyBlockHours === 1 ? 'hora' : 'horas';
        return `${formattedHours} ${labelSuffix}`;
      }
      return null;
    }, [selectedProviderService, hourlyBlockHours]);

  const selectedSlotRange = useMemo(() => {
    if (!selectedTime || enforcedMinHourlyMinutes <= 0) {
      return null;
    }

    const startMinutes = getMinutesFromISO(selectedTime);
    const endMinutes = startMinutes + enforcedMinHourlyMinutes;
    const formatHourLabel = (minutes: number) => {
      const normalized = minutes % (24 * 60);
      const hour = Math.floor(normalized / 60);
      return `${hour.toString().padStart(2, '0')}h`;
    };

    return {
      label: `${formatHourLabel(startMinutes)} – ${formatHourLabel(endMinutes)}`,
      hours: Math.max(enforcedMinHourlyMinutes / 60, 1),
    };
  }, [selectedTime, enforcedMinHourlyMinutes]);

  const shouldShowConfirmText = useMemo(
    () =>
      Boolean(
        selectedTime &&
          (finalCalculatedPrice > 0 ||
            hourlyBlockHours > 0 ||
            hourlyBlockPrice !== null ||
            (resolvedServicePrice != null && resolvedServicePrice > 0)),
      ),
    [selectedTime, finalCalculatedPrice, hourlyBlockHours, hourlyBlockPrice, resolvedServicePrice],
  );

  const dimmedDates = useMemo(
    () =>
      Object.keys(dateAvailability).filter((date) => dateAvailability[date] === false),
    [dateAvailability],
  );

  const confirmButtonText = useMemo(() => {
    const isHourly = isHourlyService(selectedProviderService);

    if (isHourly && hourlyBlockHours && hourlyBlockPrice !== null) {
      const displayPrice =
        finalCalculatedPrice > 0 ? Math.max(finalCalculatedPrice, hourlyBlockPrice) : hourlyBlockPrice;
        const hoursLabel =
          hourlyBlockHours === 1 ? '1 hora' : `${formatHourCount(hourlyBlockHours)} horas`;
      if (displayPrice > 0) {
        return `Agendar ${hoursLabel} • ${formatBRL(displayPrice)}`;
      }
    }

    if (finalCalculatedPrice > 0) {
      return `Agendar • ${formatBRL(finalCalculatedPrice)}`;
    }

    return t('schedule_service.select_date_time_address', { defaultValue: 'Selecione Data, Hora e Endereco' });
  }, [selectedProviderService, finalCalculatedPrice, hourlyBlockHours, hourlyBlockPrice, t]);

  const slotBadgeVisible =
    currentStep === 1 && isHourlyService(selectedProviderService) && selectedSlots.length > 0;

  const slotBadgeLabel = `${formatHourCount(hourlyBlockHours)}h`;

  const stepOneContent = useMemo(() => {
    if (currentStep !== 1) return null;
    return (
      <>
        <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
          <ProviderBrief
            provider={provider}
            serviceName={selectedProviderService?.service?.name}
            isLoading={isLoading}
          />
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
          dimmedDates={dimmedDates}
        />

        <Animated.View ref={timeSlotsRef} style={{ transform: [{ scale: scaleAnim }], opacity: fadeAnim }}>
          <View style={styles.timeSlotsHelperContainer}>
            <View style={styles.timeSlotsHelperTexts}>
              <Text style={styles.timeSlotsHelperText}>(cada horário = 1h de serviço).</Text>
              <Text style={styles.timeSlotsHelperSubText}>
                Você pode escolher mais de um horário para aumentar a duração.
              </Text>
            </View>
            {selectedSlotRange && (
              <View style={styles.durationBadgeContainer}>
                <View style={styles.durationBadgeCircle}>
                  <Text style={styles.durationBadgeCircleText}>{`${selectedSlotRange.hours}h`}</Text>
                </View>
                <Text style={styles.durationBadgeLabel}>{selectedSlotRange.label}</Text>
              </View>
            )}
          </View>

          <TimeSlotsSection
            titleKey="schedule_service.available_times"
            date={selectedDate}
            displaySlotsInfo={displaySlotsInfo}
            isLoading={isFetchingSlots}
            selectedTime={selectedTimeLabel}
            onTimeSelect={handleTimeSelect}
            selectedSlots={selectedSlots}
          />
        </Animated.View>
      </>
    );
  }, [
    currentStep,
    scaleAnim,
    fadeAnim,
    provider,
    selectedProviderService,
    isLoading,
    address,
    shineAnim,
    currentDisplayMonth,
    handlePrevMonth,
    handleNextMonth,
    selectedDate,
    handleDaySelect,
    selectionAnim,
    calendarBreatheAnim,
    dimmedDates,
    displaySlotsInfo,
    isFetchingSlots,
    selectedTimeLabel,
    handleTimeSelect,
    selectedSlots,
    selectedSlotRange,
  ]);

  const stepTwoContent = useMemo(() => {
    if (currentStep !== 2) return null;
    return (
      <View style={styles.insuranceStepContainer}>
            {selectedProviderService && (
              <View style={styles.insuranceSection}>
                {insuranceOptionsLoaded ? (
                  <>
                    {isInsuranceErrorState && insuranceCatalogError && (
                      <View style={styles.insuranceErrorBanner}>
                        <Text style={styles.insuranceErrorText}>{insuranceCatalogError}</Text>
                        <TouchableOpacity
                          style={styles.insuranceRetryButton}
                          onPress={handleReloadInsuranceCatalog}
                        >
                          <Text style={styles.insuranceRetryButtonText}>
                            {t('common.retry', { defaultValue: 'Recarregar' })}
                          </Text>
                        </TouchableOpacity>
                      </View>
                    )}
                    <InsuranceOptionsCard
                      insuranceOptions={insuranceOptionsToRender}
                      selectedPlanId={insurancePlanId}
                      onSelectPlan={handleInsurancePlanChange}
                    />
                  </>
                ) : (
                  <View style={styles.insuranceLoadingContainer}>
                    <ActivityIndicator size="small" color={AppColors.primaryInteractive} />
                    <Text style={styles.insuranceLoadingText}>
                      {t('schedule_service.insurance_loading', {
                        defaultValue: 'Carregando planos de proteção…',
                      })}
                    </Text>
                  </View>
                )}
              </View>
            )}
          </View>
    );
  }, [
    currentStep,
    selectedProviderService,
    insuranceOptionsLoaded,
    insuranceOptionsToRender,
    insurancePlanId,
    handleInsurancePlanChange,
    handleReloadInsuranceCatalog,
    insuranceCatalogError,
    isInsuranceErrorState,
    t,
  ]);

  const stepThreeContent = useMemo(() => {
    if (currentStep !== 3) return null;
    return (
      <Animated.View
        style={{
          opacity: reviewStepAnim,
          transform: [
            {
              translateY: reviewStepAnim.interpolate({
                inputRange: [0, 1],
                outputRange: [20, 0],
              }),
            },
            {
              scale: reviewStepAnim.interpolate({
                inputRange: [0, 1],
                outputRange: [0.98, 1],
              }),
            },
          ],
        }}
      >
        {selectedProviderService && (
          <Animated.View
            style={{
              transform: [{ scale: serviceDetailsAnim }],
              opacity: serviceDetailsAnim,
              marginTop: 0,
            }}
          >
            {/* (mantido vazio como no original) */}
          </Animated.View>
        )}

        <BookingSummaryPreview
          provider={provider}
          selectedProviderService={selectedProviderService}
          selectedDate={selectedDate}
          selectedTimeLabel={selectedTimeLabel}
          address={address}
          durationInMinutes={effectiveDurationInMinutes}
          squareMeters={squareMeters}
          subtotal={displaySubtotal}
          discountAmount={displayDiscount}
          insuranceFeeCents={displayedInsuranceFeeCents}
          insuranceLabel={insuranceLabel}
          selectedInsuranceId={selectedInsuranceId}
          finalPrice={finalCalculatedPrice}
          onShowCancellationPolicy={showCancellationPolicy}
          t={t}
          notes={notes}
          setNotes={setNotes}
          couponInputValue={couponInputValue}
          setCouponInputValue={setCouponInputValue}
          onApplyCoupon={handleApplyCoupon}
          isApplyingCoupon={isApplyingCoupon}
          couponInputAnim={couponInputAnim}
          couponFeedbackAnim={couponFeedbackAnim}
          couponFeedbackColor={couponFeedbackColor}
          couponFeedbackIcon={couponFeedbackIcon}
          quoteStatus={quoteStatus}
          quoteRateLimitRemainingSeconds={rateLimitRemainingSeconds}
          reviewEntranceAnim={reviewStepAnim}
          reviewStaggerDelay={0}
          notesAnim={notesAnim}
          cupomAnim={cupomAnim}
          onEditService={() => handleReviewEditStep(1)}
          onEditProvider={() => handleReviewEditStep(1)}
          onEditDateTime={() => handleReviewEditStep(1)}
          onEditAddress={() => handleReviewEditStep(1)}
          onEditInsurance={handleReviewEditInsurance}
          summaryAnim={summaryAnim}
        />
      </Animated.View>
    );
  }, [
    currentStep,
    reviewStepAnim,
    serviceDetailsAnim,
    notesAnim,
    cupomAnim,
    summaryAnim,
    selectedProviderService,
    selectedDate,
    selectedTimeLabel,
    address,
    effectiveDurationInMinutes,
    squareMeters,
    displaySubtotal,
    displayDiscount,
    displayedInsuranceFeeCents,
    insuranceLabel,
    selectedInsuranceId,
    finalCalculatedPrice,
    notes,
    couponInputValue,
    isApplyingCoupon,
    couponInputAnim,
    couponFeedbackAnim,
    couponFeedbackColor,
    couponFeedbackIcon,
    handleApplyCoupon,
    quoteStatus,
    rateLimitRemainingSeconds,
    handleReviewEditStep,
    handleReviewEditInsurance,
    showCancellationPolicy,
    t,
    provider,
  ]);

  const providerRateLimitMessage =
    providerFetchErrorMessage ??
    t('schedule_service.provider_rate_limited', {
      defaultValue:
        'Você atingiu o limite de requisições para obter detalhes deste prestador. Aguarde alguns segundos e tente novamente.',
    });
  const initialLoadingMessage =
    pricingConfigError ??
    t('schedule_service.loading_initial_data', { defaultValue: 'Carregando dados iniciais...' });
  const isInitialSetupBusy = isLoading || (!isPricingConfigReady && !pricingConfigError);

  if (providerRateLimited) {
    return (
      <View style={styles.centeredFeedback}>
        <Stack.Screen options={{ title: t('common.loading', { defaultValue: 'Carregando' }), headerShown: false }} />
        <ActivityIndicator size="large" color={AppColors.primaryInteractive} />
        <Text style={{ marginTop: 10, color: AppColors.textBody }}>{providerRateLimitMessage}</Text>
        <TouchableOpacity style={styles.retryButton} onPress={handleReloadProvider}>
          <Text style={styles.retryButtonText}>
            {t('schedule_service.retry_provider_details', { defaultValue: 'Recarregar prestador' })}
          </Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (isInitialSetupBusy) {
    return (
      <View style={styles.centeredFeedback}>
        <Stack.Screen options={{ title: t('common.loading', { defaultValue: 'Carregando' }), headerShown: false }} />
        <ActivityIndicator size="large" color={AppColors.primaryInteractive} />
        <Text style={{ marginTop: 10, color: AppColors.textBody }}>{initialLoadingMessage}</Text>
        {pricingConfigError && (
          <TouchableOpacity style={styles.retryButton} onPress={reloadPricingConfig}>
            <Text style={styles.retryButtonText}>
              {t('schedule_service.retry_pricing_config', { defaultValue: 'Recarregar regras' })}
            </Text>
          </TouchableOpacity>
        )}
        {providerRateLimited && (
          <TouchableOpacity style={styles.retryButton} onPress={handleReloadProvider}>
            <Text style={styles.retryButtonText}>
              {t('schedule_service.retry_provider_details', { defaultValue: 'Recarregar prestador' })}
            </Text>
          </TouchableOpacity>
        )}
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

        {pricingConfigError && (
          <View style={styles.pricingErrorBanner}>
            <Text style={styles.pricingErrorText}>{pricingConfigError}</Text>
            <TouchableOpacity style={styles.pricingErrorAction} onPress={reloadPricingConfig}>
              <Text style={styles.pricingErrorActionText}>
                {t('schedule_service.retry_pricing_config', { defaultValue: 'Recarregar regras' })}
              </Text>
            </TouchableOpacity>
          </View>
        )}

        {currentStep === 1 && (
          <View style={styles.stepsPill}>
            {stepTitles.map((title, index) => {
              const stepNumber = index + 1;
              const isReviewPill = index === stepTitles.length - 1;
              const isActive = isReviewPill ? currentStep >= 2 : currentStep === 1;
              return (
                <View
                  key={`step-${stepNumber}`}
                  style={[
                    styles.stepItem,
                    isActive ? styles.stepItemActive : styles.stepItemGhost,
                    index < stepTitles.length - 1 ? { marginRight: 6 } : null,
                  ]}
                >
                  <Text style={[styles.stepGhostText, isActive ? styles.stepActiveText : null]} numberOfLines={1}>
                    <Text>{title}</Text>
                  </Text>
                </View>
              );
            })}
          </View>
        )}

        <Animated.ScrollView
          ref={scrollViewRef}
          contentContainerStyle={[styles.scrollContentContainer, { paddingBottom: 90 }]}
          style={{ opacity: fadeAnim, transform: [{ translateY: slideUpAnim }] }}
          showsVerticalScrollIndicator={false}
          nestedScrollEnabled
          removeClippedSubviews={false}
          bounces={currentStep !== 3}
          alwaysBounceVertical={currentStep !== 3}
          onContentSizeChange={() => {
            if (currentStep === 1) {
              scrollViewRef.current?.scrollTo({ y: 0, animated: false });
            }
          }}
        >
          {stepOneContent}
          {stepTwoContent}
          {stepThreeContent}
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
                {t('schedule_service.continue_button', { defaultValue: 'Continuar' })}
              </Text>
            </TouchableOpacity>
          </View>
        )}

        {currentStep === 2 && (
          <View style={styles.bottomNextStepWrap}>
            <TouchableOpacity
              style={[styles.nextStepButton, isStepTwoContinueDisabled && styles.nextStepButtonDisabled]}
              onPress={handleNextStep}
              activeOpacity={0.9}
              disabled={isStepTwoContinueDisabled}
            >
              <Text style={styles.nextStepButtonText}>
                {t('schedule_service.continue_to_review_button', { defaultValue: 'Continuar para revisão' })}
              </Text>
            </TouchableOpacity>
          </View>
        )}

        {currentStep === 3 && selectedSlots.length > 0 && (
          <View style={styles.timeSummaryInline}>
            <Text style={styles.timeSummaryText} numberOfLines={2}>
              {timeSelectionSummaryLabel}
            </Text>
          </View>
        )}

        {currentStep === 3 && providerNeedsApproval && (
          <VerificationNotice
            status={provider?.verificationStatus}
            onLearnMore={() => router.push('/client/explore/security' as any)}
          />
        )}

        {currentStep === 3 && (
          <Animated.View style={confirmButtonAnimatedStyle}>
            <ConfirmBookingButton
              isButtonDisabled={isConfirmButtonDisabled}
              onConfirmBooking={handleConfirmBooking}
              isBooking={isBooking}
              confirmButtonText={confirmButtonText}
              selectedTimeLabel={selectedTimeLabel}
              shouldShowConfirmText={shouldShowConfirmText}
            />
          </Animated.View>
        )}

        {slotBadgeVisible && (
          <TouchableOpacity style={styles.slotBadgeContainer} activeOpacity={0.9}>
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
  retryButton: {
    marginTop: 12,
    paddingVertical: 8,
    paddingHorizontal: 18,
    borderRadius: 12,
    backgroundColor: AppColors.primaryInteractive,
  },
  retryButtonText: {
    color: AppColors.white,
    fontWeight: '700',
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
    fontSize: Platform.OS === 'android' ? 11 : 10,
    textAlign: 'center',
  },
  stepItemGhost: {
    backgroundColor: 'transparent',
  },
  stepGhostText: {
    color: AppColors.mediumGray,
    fontWeight: '600',
    fontSize: Platform.OS === 'android' ? 11 : 10,
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
    
  },
  floatingSummaryContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  floatingSummaryText: {
    fontSize: Platform.OS === 'android' ? 16 : 15,
    fontWeight: '500',
    color: AppColors.textBody,
  },
  floatingSummaryPrice: {
    fontSize: Platform.OS === 'android' ? 18 : 17,
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
        elevation: 0,
      },
    }),
  },
  insuranceStepContainer: {
    marginTop: 20,
    marginBottom: 10,
  },
  insuranceSection: {
    marginTop: 0,
    marginBottom: 10,
  },
  pricingErrorBanner: {
    marginHorizontal: 18,
    marginBottom: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#F87171',
    backgroundColor: '#FFF4F2',
    padding: 12,
  },
  pricingErrorText: {
    fontSize: Platform.OS === 'android' ? 12 : 11,
    color: '#B91C1C',
    marginBottom: 6,
  },
  pricingErrorAction: {
    alignSelf: 'flex-start',
    paddingVertical: 6,
    paddingHorizontal: 12,
    backgroundColor: AppColors.primaryInteractive,
    borderRadius: 8,
  },
  pricingErrorActionText: {
    fontSize: Platform.OS === 'android' ? 13 : 12,
    fontWeight: '700',
    color: AppColors.white,
  },
  insuranceLoadingContainer: {
    paddingVertical: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  insuranceLoadingText: {
    marginTop: 8,
    fontSize: Platform.OS === 'android' ? 13 : 12,
    color: AppColors.textAuxiliary,
  },
  insuranceErrorBanner: {
    backgroundColor: '#FFF4F2',
    borderRadius: 14,
    padding: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#F87171',
  },
  insuranceErrorText: {
    color: AppColors.textAuxiliary,
    fontSize: Platform.OS === 'android' ? 13 : 12,
    marginBottom: 6,
  },
  insuranceRetryButton: {
    alignSelf: 'flex-start',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 10,
    backgroundColor: AppColors.primaryInteractive,
  },
  insuranceRetryButtonText: {
    color: AppColors.white,
    fontWeight: '600',
  },
  reviewInsuranceSummary: {
    marginTop: 16,
    marginHorizontal: 18,
  },
  reviewInsuranceNoneText: {
    fontSize: Platform.OS === 'android' ? 14 : 13,
    fontWeight: '600',
    color: AppColors.textAuxiliary,
  },
  safetyBannerTitle: {
    fontSize: Platform.OS === 'android' ? 12 : 11,
    fontWeight: '800',
    color: AppColors.textBody,
    marginBottom: 2,
  },
  safetyBannerSubtitle: {
    fontSize: Platform.OS === 'android' ? 11 : 10,
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
    fontSize: Platform.OS === 'android' ? 22 : 20,
    fontWeight: Platform.OS === 'ios' ? '600' : '700',
    color: AppColors.textBody,
    letterSpacing: 0.2,
    textTransform: 'none',
    paddingVertical: 4,
    paddingHorizontal: 0,
  },
  reviewCard: {
    marginHorizontal: 12,
    marginBottom: 10,
    paddingVertical: 12,
    paddingHorizontal: 12,
  },
  reviewSectionHeaderRow: {
    marginHorizontal: 0,
    marginTop: 3,
    marginBottom: 6,
  },
  reviewSectionTitle: {
    fontSize: Platform.OS === 'android' ? 18 : 17,
  },
  card: {
    backgroundColor: AppColors.white,
    borderRadius: 18,
    padding: 18,
    marginHorizontal: 18,
    marginBottom: 15,
   
  },
  sectionTitle: {
    fontSize: Platform.OS === 'android' ? 20 : 19,
    fontWeight: 'bold',
    color: AppColors.textBody,
    marginBottom: 20,
    textAlign: 'left',
  },
  sectionHeaderTitle: {
    fontSize: Platform.OS === 'android' ? 20 : 19,
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
    fontSize: Platform.OS === 'android' ? 16 : 15,
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
    fontSize: Platform.OS === 'android' ? 14 : 13,
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
    fontSize: Platform.OS === 'android' ? 14 : 13,
  },
  compactCouponFeedbackContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 6,
    paddingHorizontal: 0,
  },
  compactCouponAppliedText: {
    marginLeft: 6,
    fontSize: Platform.OS === 'android' ?  13 : 12,
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
    fontSize: Platform.OS === 'android' ? 16 : 15,
    color: AppColors.textBody,
    lineHeight: 24,
  },
  summaryLabel: {
    fontSize: Platform.OS === 'android' ? 16 : 15,
    fontWeight: '600',
  },
  reviewRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#F2F4F7',
  },
  reviewRowIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: '#F8FAFB',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  reviewRowContent: {
    flex: 1,
  },
  reviewRowLabel: {
    fontSize: Platform.OS === 'android' ? 11 : 10,
    fontWeight: '600',
    color: AppColors.textAuxiliary,
    textTransform: 'uppercase',
    letterSpacing: 1.1,
    marginBottom: 1,
  },
  reviewRowValue: {
    fontSize: Platform.OS === 'android' ? 15 : 14,
    fontWeight: '700',
    color: '#1A1A1A',
  },
  reviewValueLine: {
    fontSize:  Platform.OS === 'android' ? 14 : 13,
    color: AppColors.textBody,
  },
  reviewAction: {
    paddingHorizontal: 8,
    justifyContent: 'center',
  },
  reviewActionText: {
    fontSize: Platform.OS === 'android' ? 12 : 11,
    fontWeight: '600',
    color: AppColors.primaryInteractive,
  },
  reviewInsuranceValue: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
  },
  reviewInsurancePrice: {
    fontSize: Platform.OS === 'android' ? 14 : 13,
    fontWeight: '800',
    color: AppColors.successStandard,
    backgroundColor: '#E8F5E9',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
    overflow: 'hidden',
    marginLeft: 8,
  },
  priceSummary: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  paymentBreakdown: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: AppColors.backgroundNeutral,
  },
  paymentLine: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  paymentLabel: {
    fontSize: Platform.OS === 'android' ? 14 : 13,
    color: AppColors.textAuxiliary,
  },
  paymentValue: {
    fontSize: Platform.OS === 'android' ? 16 : 15,
    fontWeight: '600',
    color: AppColors.textBody,
  },
  paymentDivider: {
    borderBottomWidth: 1,
    borderBottomColor: AppColors.backgroundNeutral,
    marginVertical: 8,
  },
  paymentMicrocopy: {
    fontSize: Platform.OS === 'android' ? 12 : 11,
    color: AppColors.textAuxiliary,
    textAlign: 'center',
    marginTop: 6,
  },
  timeSlotsHelperContainer: {
    marginHorizontal: 40,
    marginTop: 1,
    marginBottom: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  timeSlotsHelperText: {
    fontSize: Platform.OS === 'android' ? 13 : 13,
    lineHeight: Platform.OS === 'android' ? 20 : 19,
    color: '#6B7280',
    fontWeight: '500',
  },
  timeSlotsHelperSubText: {
    fontSize: Platform.OS === 'android' ? 14 : 13,
    lineHeight: 20,
    color: '#6B7280',
    marginTop: 2,
  },
  timeSlotsHelperTexts: {
    flex: 1,
    paddingRight: 8,
  },
  durationBadgeContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 70,
    top: -10,
    alignSelf: 'flex-end',
    marginRight: 12,
  },
  durationBadgeCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: AppColors.primaryInteractive,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 2,
    marginTop: 2,
    
    ...Platform.select({
      ios: {
        shadowColor: '#0d3b91',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
      },
      android: {
        elevation: 0,
      },
    }),
  },
  durationBadgeCircleText: {
    color: '#fff',
    fontSize: Platform.OS === 'android' ? 14 : 13,
    fontWeight: '800',
  },
  durationBadgeLabel: {
    fontSize: Platform.OS === 'android' ? 12 : 11,
    fontWeight: '600',
    color: '#1f2a44',
    textAlign: 'center',
  },
  timeSummaryInline: {
    paddingHorizontal: 20,
    paddingVertical: 6,
    backgroundColor: 'transparent',
  },
  timeSummaryText: {
    fontSize: Platform.OS === 'android' ? 13 : 12,
    color: AppColors.textAuxiliary,
    textAlign: 'center',
  },
  priceLabel: {
    fontSize: Platform.OS === 'android' ? 15 : 14,
    color: AppColors.textBody,
  },
  priceValue: {
    fontSize: Platform.OS === 'android' ? 16 : 15,
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
    fontSize: Platform.OS === 'android' ? 16 : 15,
    fontWeight: '600',
    color: AppColors.textBody,
  },
  totalPriceValue: {
    fontSize: Platform.OS === 'android' ? 24 : 22,
    fontWeight: 'bold',
    color: AppColors.primaryInteractive,
  },
  quoteStatusText: {
    marginTop: 6,
    fontSize: Platform.OS === 'android' ? 12 : 11,
    color: AppColors.textAuxiliary,
    textAlign: 'center',
  },
  cancellationPolicyLink: {
    marginTop: 12,
    alignSelf: 'center',
  },
  cancellationPolicyText: {
    fontSize: Platform.OS === 'android' ? 12 : 11,
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
    fontSize: Platform.OS === 'android' ? 18 : 17,
    fontWeight: '700',
    color: AppColors.textBody,
  },
  modalList: {
    marginTop: 4,
    marginBottom: 12,
  },
  modalListItem: {
    fontSize: Platform.OS === 'android' ? 14 : 13,
    lineHeight: 20,
    color: AppColors.textBody,
    marginBottom: 6,
  },
  modalFinePrint: {
    fontSize: Platform.OS === 'android' ? 12 : 11,
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
    fontSize: Platform.OS === 'android' ? 14 : 13,
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
    fontSize: Platform.OS === 'android' ? 14 : 13,
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
    fontSize: Platform.OS === 'android' ? 14 : 13,
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
    borderRightWidth: 0,
    borderRightColor: 'transparent',
    borderBottomColor: 'transparent',
    borderBottomWidth: 0,
    borderLeftColor: 'transparent',
    borderLeftWidth: 0,
    
  },
  nextStepButtonDisabled: {
    backgroundColor: `${AppColors.primaryInteractive}50`,
    
  },
  nextStepButtonText: {
    color: AppColors.white,
    fontSize: Platform.OS === 'android' ? 16 : 15,
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
  slotBadgeButton: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#35a4e5ad',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 0,
  },
  slotBadgeText: {
    color: '#FFFFFF',
    fontSize: Platform.OS === 'android' ? 18 : 17,
    fontWeight: '800',
  },
});
