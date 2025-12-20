import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { View, StyleSheet, ScrollView, Animated, Platform } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';

import { useAuth } from '../../../hooks/useAuth';
import SuccessHeader from '../../../components/client/booking/success/SuccessHeader';
import BookingSummaryCard from '../../../components/client/booking/success/BookingSummaryCard';
import MainActionButtons from '../../../components/client/booking/success/MainActionButtons';
import ImmediateActionButtons from '../../../components/client/booking/success/ImmediateActionButtons';
import SecurityInfoSection from '../../../components/client/booking/success/SecurityInfoSection';
import LoyaltyTeaserSection from '../../../components/client/booking/success/LoyaltyTeaserSection';
import { ReturnCouponCard } from '../../../components/client/booking/success/ReturnCouponCard';
import SuccessLoadingError from '../../../components/client/booking/success/SuccessLoadingError';

import { fetchPaymentIntent, createPixCharge } from '../../../services/paymentService';
import { getBookingDetails } from '../../../services/bookingService';
import { getProviderDetails } from '../../../services/providerService';
import { getMyLoyaltyBalance, LoyaltyBalance } from '../../../services/loyaltyService';
import { getOffers } from '../../../services/clientService';
import NotificationUIService from '../../../services/notificationUIService';

import { formatAddressLine1, formatAddressLine2 } from '../../../utils/address';
import { AppColors } from '../../../constants/appStyles';

import { PaymentIntentStatus, PixChargeResponseDto } from '../../../types/backend/payments';
import { BookingDetails } from '../../../types/backend/bookings';
import { ProviderDisplayInfo } from '../../../types/backend/providers';
import { Offer } from '../../../types/backend/offers';

type SuccessRouteParams = {
  bookingId?: string | string[];
  paymentMethod?: string | string[];
  totalPrice?: string | string[];
  couponApplied?: string | string[];
  couponCode?: string | string[];
};

type ReturnCouponData = {
  code: string;
  title: string;
  subtitle?: string | null;
  expiresAt?: Date | null;
};

const extractFirst = (value?: string | string[]): string | undefined => {
  if (Array.isArray(value)) return value[0];
  return value;
};

const HEADER_PRIMARY_COLOR = AppColors.primaryInteractive;
const HEADER_SECONDARY_COLOR = AppColors.primaryDark;
const SUCCESS_COLOR = AppColors.successStandard;

export default function BookingSuccessScreen() {
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<SuccessRouteParams>();
  const bookingIdParam = extractFirst(params.bookingId);
  const paymentMethodParam = extractFirst(params.paymentMethod)?.toUpperCase();

  const router = useRouter();
  const { user } = useAuth();

  const [booking, setBooking] = useState<BookingDetails | null>(null);
  const [provider, setProvider] = useState<ProviderDisplayInfo | null>(null);
  const [pixCharge, setPixCharge] = useState<PixChargeResponseDto | null>(null);
  const [loyaltyBalance, setLoyaltyBalance] = useState<LoyaltyBalance | null>(null);
  const [returnCoupon, setReturnCoupon] = useState<ReturnCouponData | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<string>(paymentMethodParam || 'PIX');
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [paid, setPaid] = useState<boolean>(false);
  const [shouldPollIntent, setShouldPollIntent] = useState<boolean>(false);
  const [isRegeneratingPix, setIsRegeneratingPix] = useState<boolean>(false);

  const pollRef = useRef<NodeJS.Timeout | null>(null);
  const pollAttemptsRef = useRef<number>(0);
  const onceRef = useRef(false);
  const unauthorizedHandledRef = useRef(false);

  const contentOpacity = useRef(new Animated.Value(0)).current;
  const contentTranslateY = useRef(new Animated.Value(24)).current;

  const bookingId = bookingIdParam;

  const formattedAddressLine1 = useMemo(
    () => formatAddressLine1(booking?.address as any),
    [booking],
  );
  const formattedAddressLine2 = useMemo(
    () => formatAddressLine2(booking?.address as any),
    [booking],
  );

  const providerRating = provider?.averageRating ?? undefined;
  const styles = useMemo(() => createStyles(insets.top), [insets.top]);

  const triggerContentAnimation = useCallback(() => {
    Animated.parallel([
      Animated.timing(contentOpacity, {
        toValue: 1,
        duration: 420,
        useNativeDriver: true,
      }),
      Animated.timing(contentTranslateY, {
        toValue: 0,
        duration: 420,
        useNativeDriver: true,
      }),
    ]).start();
  }, [contentOpacity, contentTranslateY]);

  const loadData = useCallback(async () => {
    if (!bookingId) {
      setError('Agendamento não encontrado.');
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const bookingDetails = await getBookingDetails(bookingId);
      if (!bookingDetails) {
        throw new Error('Agendamento não encontrado.');
      }
      // log removido para performance
      setBooking(bookingDetails);

      const normalizedPaymentMethod =
        paymentMethodParam ||
        (bookingDetails as any)?.paymentMethod?.toString()?.toUpperCase?.() ||
        'PIX';

      setPaymentMethod(normalizedPaymentMethod);
      setIsLoading(false);
      triggerContentAnimation();

      getProviderDetails(bookingDetails.providerId)
        .then(setProvider)
        .catch(() => {});

      getMyLoyaltyBalance()
        .then(setLoyaltyBalance)
        .catch(() => {});

      getOffers()
        .then((offers: Offer[]) => {
          if (!Array.isArray(offers)) return;
          const candidate = offers.find(offer => offer?.couponCode && offer.target !== 'NEW_CLIENTS');
          if (candidate?.couponCode) {
            setReturnCoupon({
              code: candidate.couponCode,
              title: candidate.title || 'Cupom especial para sua próxima reserva',
              subtitle: candidate.description ?? undefined,
              expiresAt: candidate.validUntil ? new Date(candidate.validUntil) : undefined,
            });
          }
        })
        .catch(() => {});

      if (normalizedPaymentMethod === 'PIX' && user?.id) {
        try {
          const pixResponse = await createPixCharge(user.id, {
            amount: bookingDetails.totalPrice,
            description: bookingDetails.serviceName || `Agendamento ${bookingDetails.id}`,
            bookingId: bookingDetails.id,
            providerId: bookingDetails.providerId,
          });
          setPixCharge(pixResponse ?? null);
          const intentStatus = pixResponse?.paymentIntent?.status;
          if (intentStatus === PaymentIntentStatus.PAID) {
            setPaid(true);
            setShouldPollIntent(false);
          } else {
            setShouldPollIntent(true);
          }
        } catch {
          setShouldPollIntent(true);
        }
      } else {
        setPixCharge(null);
        setShouldPollIntent(false);
        if (normalizedPaymentMethod !== 'PIX') {
          setPaid(true);
        }
      }
    } catch (loadError: any) {
      const message =
        loadError?.message ||
        loadError?.response?.data?.message ||
        'Não foi possível carregar os detalhes do agendamento.';
      setError(message);
      setIsLoading(false);
      setShouldPollIntent(false);
    }
  }, [bookingId, paymentMethodParam, triggerContentAnimation, user?.id]);

  useEffect(() => {
    loadData();
    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, [loadData]);

  const startPolling = useCallback(() => {
    if (!bookingId || !shouldPollIntent) return;
    const poll = async () => {
      try {
        const intent = await fetchPaymentIntent(bookingId);
        if (!intent) {
          pollAttemptsRef.current += 1;
          if (pollAttemptsRef.current > 20 && pollRef.current) {
            clearInterval(pollRef.current);
            pollRef.current = null;
            setShouldPollIntent(false);
          }
          return;
        }
        if (intent.status === PaymentIntentStatus.PAID) {
          setPaid(true);
          if (!onceRef.current) {
            onceRef.current = true;
            if (pollRef.current) {
              clearInterval(pollRef.current);
              pollRef.current = null;
            }
            setShouldPollIntent(false);
            try {
              await getBookingDetails(bookingId);
            } catch {
              // ignore
            }
            setTimeout(() => {
              router.replace('/client/bookings?highlightNew=true' as any);
            }, 1200);
          }
        }
      } catch (err: any) {
        const status = err?.status ?? err?.response?.status;
        if (status === 401 && !unauthorizedHandledRef.current) {
          unauthorizedHandledRef.current = true;
          if (pollRef.current) {
            clearInterval(pollRef.current);
            pollRef.current = null;
          }
          setShouldPollIntent(false);
          NotificationUIService.showInfo(
            'Sessão atualizada',
            'Sua sessão de pagamento foi renovada. Voltamos para a página inicial para garantir sua segurança.'
          );
          setTimeout(() => {
            router.replace('/client/explore' as any);
          }, 400);
          return;
        }
        // log removido para performance
      }
    };
    poll();
    pollRef.current = setInterval(poll, 3000);
  }, [bookingId, router, shouldPollIntent]);

  useEffect(() => {
    pollAttemptsRef.current = 0;
    if (pollRef.current) {
      clearInterval(pollRef.current);
      pollRef.current = null;
    }
    if (shouldPollIntent) {
      startPolling();
    }
    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, [startPolling, shouldPollIntent]);

  useEffect(() => {}, [booking, paid, paymentMethod, isLoading, error, shouldPollIntent]);

  const handleGoToBookings = useCallback(() => {
    if (Platform.OS === 'ios') {
      try { Haptics.selectionAsync(); } catch {}
    }
    router.replace('/client/bookings?highlightNew=true' as any);
  }, [router]);

  const handleGoHome = useCallback(() => {
    if (Platform.OS === 'ios') {
      try { Haptics.selectionAsync(); } catch {}
    }
    router.replace('/client/explore' as any);
  }, [router]);

  const handleAddToCalendar = useCallback(() => {
    // Silencioso por enquanto
  }, []);

  const handleContactProvider = useCallback(() => {
    if (!booking) {
      return;
    }
    router.push({
      pathname: '/client/messages/[chatId]',
      params: {
        chatId: booking.providerId,
        recipientName: provider?.fullName || booking.providerFullName || 'Prestador',
      },
    } as any);
  }, [booking, provider, router]);

  const handleRegeneratePix = useCallback(async () => {
    if (!booking || paymentMethod !== 'PIX' || !user?.id || isRegeneratingPix) {
      return;
    }
    setIsRegeneratingPix(true);
    try {
      const pixResponse = await createPixCharge(user.id, {
        amount: booking.totalPrice,
        description: booking.serviceName || `Agendamento ${booking.id}`,
        bookingId: booking.id,
        providerId: booking.providerId,
      });
      setPixCharge(pixResponse ?? null);
      onceRef.current = false;
      pollAttemptsRef.current = 0;
      if (pixResponse?.paymentIntent?.status === PaymentIntentStatus.PAID) {
        setPaid(true);
        setShouldPollIntent(false);
      } else {
        setPaid(false);
        setShouldPollIntent(true);
      }
    } catch {
      // silencioso
    } finally {
      setIsRegeneratingPix(false);
    }
  }, [booking, paymentMethod, user?.id, isRegeneratingPix]);


  const handleLoyaltyLearnMore = useCallback(() => {
    router.push('/client/missions' as any);
  }, [router]);

  const handleRebookNow = useCallback(
    (code: string) => {
      if (!booking) return;
      router.push({
        pathname: '/client/bookings/schedule-service',
        params: {
          providerId: booking.providerId,
          serviceId: booking.providerServiceId,
          couponCode: code,
        },
      } as any);
    },
    [booking, router],
  );

  const loyaltyPoints = loyaltyBalance?.currentPoints ?? 0;
  const nextRewardName = loyaltyBalance?.nextReward?.name ?? null;

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ title: 'Pagamento', headerShown: false }} />
      <LinearGradient
        colors={['#f2f2f2', '#ffffff']}
        style={styles.background}
      />
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <SuccessHeader
          successColor={SUCCESS_COLOR}
          headerPrimaryColor={HEADER_PRIMARY_COLOR}
          headerSecondaryColor={HEADER_SECONDARY_COLOR}
        />

        <SuccessLoadingError
          isLoading={isLoading}
          error={error}
          headerPrimaryColor={HEADER_PRIMARY_COLOR}
          onRetryPress={loadData}
        />

        {!isLoading && !error && booking ? (
          <>
            <BookingSummaryCard
              booking={booking}
              provider={provider}
              providerRating={providerRating}
              pixChargeDetails={pixCharge}
              paymentMethod={paymentMethod}
              contentOpacity={contentOpacity}
              contentTranslateY={contentTranslateY}
              iconColor={HEADER_PRIMARY_COLOR}
              successColor={SUCCESS_COLOR}
              headerPrimaryColor={HEADER_PRIMARY_COLOR}
              formattedAddressLine1={formattedAddressLine1}
              formattedAddressLine2={formattedAddressLine2}
              onRegeneratePix={paymentMethod === 'PIX' ? handleRegeneratePix : undefined}
              isRegeneratingPix={isRegeneratingPix}
            />

            <ImmediateActionButtons
              onAddToCalendar={handleAddToCalendar}
              onContactProvider={handleContactProvider}
              headerPrimaryColor={HEADER_PRIMARY_COLOR}
            />

            {!!loyaltyBalance && (
              <LoyaltyTeaserSection
                headerPrimaryColor={HEADER_PRIMARY_COLOR}
                currentPoints={loyaltyPoints}
                nextRewardName={nextRewardName}
                isLoading={false}
                onPressLearnMore={handleLoyaltyLearnMore}
              />
            )}

            {returnCoupon ? (
              <ReturnCouponCard
                code={returnCoupon.code}
                title={returnCoupon.title}
                subtitle={returnCoupon.subtitle ?? undefined}
                expiresAt={returnCoupon.expiresAt ?? undefined}
                onRebookNow={handleRebookNow}
              />
            ) : null}

            <MainActionButtons
              onGoToBookings={handleGoToBookings}
              onGoHome={handleGoHome}
              headerPrimaryColor={HEADER_PRIMARY_COLOR}
            />

            <SecurityInfoSection successColor={SUCCESS_COLOR} bookingId={booking.id} />
          </>
        ) : null}

        <View style={styles.bottomSpacer} />
      </ScrollView>
    </View>
  );
}

const createStyles = (insetsTop: number) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: '#f2f2f2',
      paddingTop: Platform.OS === 'android' ? insetsTop + 16 : 0, // Android safe area + spacing
    },
    background: {
      ...StyleSheet.absoluteFillObject,
      opacity: 0.6,
    },
    scrollContent: {
      flexGrow: 1,
      alignItems: 'center',
      justifyContent: 'flex-start',
      paddingHorizontal: 20,
      paddingTop: Platform.OS === 'android' ? 24 : 10, // Android extra spacing
      paddingBottom: 50,
    },
    bottomSpacer: {
      height: 32,
    },
    devChip: {
      marginTop: 12,
      paddingHorizontal: 14,
      paddingVertical: 10,
      borderRadius: 999,
      backgroundColor: '#E7F0FF',
      borderWidth: 1,
      borderColor: '#B6CCFF',
      alignSelf: 'center',
    },
    devChipText: {
      color: HEADER_PRIMARY_COLOR,
      fontWeight: '700',
      fontSize: 13,
    },
  });
