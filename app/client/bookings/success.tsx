import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Animated, Easing, Platform, ScrollView, StyleSheet, Text, TouchableOpacity, View, StyleProp, ViewStyle, Dimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import BookingSummaryCard from '../../../components/client/booking/success/BookingSummaryCard';
import ImmediateActionButtons from '../../../components/client/booking/success/ImmediateActionButtons';
import LoyaltyTeaserSection from '../../../components/client/booking/success/LoyaltyTeaserSection';
import MainActionButtons from '../../../components/client/booking/success/MainActionButtons';
import PaymentConfirmationCard from '../../../components/client/booking/success/PaymentConfirmationCard';
import { ReturnCouponCard } from '../../../components/client/booking/success/ReturnCouponCard';
import SecurityInfoSection from '../../../components/client/booking/success/SecurityInfoSection';
import SuccessLoadingError from '../../../components/client/booking/success/SuccessLoadingError';
import NavBar from '../../../components/client/explore/home/NavBar';
import { useAuth } from '../../../hooks/useAuth';
import { CLIENT_ROUTES } from '@/app/_shared/routes';
import { useDevice } from '@/utils/responsive';
import { getBookingDetails } from '../../../services/bookingService';
import { getOffers } from '../../../services/clientService';
import { getMyLoyaltyBalance, LoyaltyBalance } from '../../../services/loyaltyService';
import NotificationUIService from '../../../services/notificationUIService';
import { createPixCharge, fetchPaymentIntent } from '../../../services/paymentService';
import { getProviderDetails } from '../../../services/providerService';
import { getOrCreateConversationForBooking } from '../../../services/chatService';
import { AppColors } from '../../../constants/appStyles';
import { formatAddressLine1, formatAddressLine2 } from '../../../utils/address';
import { sanitizeText } from '../../../utils/formatters';
import { textFix } from '../../../_shared/ui/parity';
import { BookingDetails, BookingStatus } from '../../../types/backend/bookings';
import { Offer } from '../../../types/backend/offers';
import { PaymentIntent, PaymentIntentStatus, PixChargeResponseDto } from '../../../types/backend/payments';
import { ProviderDisplayInfo } from '../../../types/backend/providers';
type SuccessRouteParams = {
  bookingId?: string | string[];
  paymentMethod?: string | string[];
  totalPrice?: string | string[];
  couponApplied?: string | string[];
  couponCode?: string | string[];
};
export const shouldStopPollingForStatus = (
  status?: PaymentIntentStatus | null,
): boolean => status === PaymentIntentStatus.PAID;
const PENDING_PAYMENT_KEY = 'pending_payment';
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
const FINAL_PAYMENT_INTENT_STATUSES: PaymentIntentStatus[] = [
  PaymentIntentStatus.EXPIRED,
  PaymentIntentStatus.REFUNDED,
  PaymentIntentStatus.CHARGEBACK,
];
const isPaymentIntentFinal = (status?: PaymentIntentStatus) =>
  !!status && FINAL_PAYMENT_INTENT_STATUSES.includes(status);
const buildPixChargeFallback = (
  intent: PaymentIntent,
  booking: BookingDetails,
): PixChargeResponseDto => ({
  transactionId: intent.externalChargeId ?? intent.externalOrderId ?? intent.id,
  status: intent.status,
  brCode: intent.qrCodeText ?? '',
  qrCodeImage: intent.qrCodeUrl ?? '',
  expiresAt: intent.expiresAt ?? new Date().toISOString(),
  amount: intent.amount ?? booking.totalPrice,
  description: booking.serviceName || `Agendamento ${booking.id}`,
  bookingId: booking.id,
  providerId: booking.providerId,
  paymentIntent: intent,
});
const SCREEN_HEIGHT = Dimensions.get('window').height;
export default function BookingSuccessScreen() {
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<SuccessRouteParams>();
  const bookingIdParam = extractFirst(params.bookingId);
  const paymentMethodParam = extractFirst(params.paymentMethod)?.toUpperCase();
  const router = useRouter();
  const { user } = useAuth();
  const { isLargePhone } = useDevice();
const [booking, setBooking] = useState<BookingDetails | null>(null);
  const [provider, setProvider] = useState<ProviderDisplayInfo | null>(null);
  const [pixCharge, setPixCharge] = useState<PixChargeResponseDto | null>(null);
  const [paymentIntent, setPaymentIntent] = useState<PaymentIntent | null>(null);
  const [loyaltyBalance, setLoyaltyBalance] = useState<LoyaltyBalance | null>(null);
  const [returnCoupon, setReturnCoupon] = useState<ReturnCouponData | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<string>(paymentMethodParam || 'PIX');
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const savePendingPayment = useCallback(
async (bookingId: string, intent?: PaymentIntent | null) => {
      try {
        await AsyncStorage.setItem(
          PENDING_PAYMENT_KEY,
          JSON.stringify({
            bookingId,
            paymentIntentId: intent?.id ?? null,
          }),
        );
      } catch {
        // ignore persistence failures
      }
    },
    [],
  );
const clearPendingPayment = useCallback(async () => {
    try {
      await AsyncStorage.removeItem(PENDING_PAYMENT_KEY);
    } catch {
      // ignore cleanup failures
    }
  }, []);
  const [error, setError] = useState<string | null>(null);
  const [paid, setPaid] = useState<boolean>(false);
  const [shouldPollIntent, setShouldPollIntent] = useState<boolean>(false);
  const [isRegeneratingPix, setIsRegeneratingPix] = useState<boolean>(false);
  const [pixFallbackActive, setPixFallbackActive] = useState(false);
  const [pixFallbackMessage, setPixFallbackMessage] = useState<string | null>(null);
  const pollRef = useRef<NodeJS.Timeout | null>(null);
  const pollAttemptsRef = useRef<number>(0);
  const onceRef = useRef(false);
  const unauthorizedHandledRef = useRef(false);
  const paymentToastIntentRef = useRef<string | null>(null);
  const MAX_POLL_ATTEMPTS = 12;
  const contentOpacity = useRef(new Animated.Value(0)).current;
  const contentTranslateY = useRef(new Animated.Value(24)).current;
  const navBarAnim = useRef(new Animated.Value(0)).current;
  const bookingId = bookingIdParam;
  const routeTotalPrice = Number(extractFirst(params.totalPrice) ?? '');
  const effectiveTotalPrice =
Number.isFinite(routeTotalPrice) && routeTotalPrice > 0
      ? routeTotalPrice
      : undefined;
  const summaryBooking =
    booking &&
    ({
      ...booking,
      totalPrice:
        effectiveTotalPrice !== undefined
          ? effectiveTotalPrice
          : booking.totalPrice,
    } as BookingDetails);
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
const navWrap: StyleProp<ViewStyle> = useMemo(
() => (isLargePhone ? { alignSelf: 'center', width: '100%', maxWidth: 820 } : undefined),
[isLargePhone],
);
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
Animated.timing(navBarAnim, {
toValue: 1,
duration: 420,
delay: 120,
easing: Easing.out(Easing.cubic),
useNativeDriver: true,
}),
]).start();
}, [contentOpacity, contentTranslateY, navBarAnim]);
const loadData = useCallback(async () => {
if (!bookingId) {
setError('Agendamento não encontrado.');
setIsLoading(false);
return;
}
setIsLoading(true);
setError(null);
setPixFallbackActive(false);
setPixFallbackMessage(null);
pollAttemptsRef.current = 0;
onceRef.current = false;
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
let existingIntent: PaymentIntent | null = null;
try {
existingIntent = await fetchPaymentIntent(bookingId);
} catch (intentError: any) {
const statusCode = intentError?.status ?? intentError?.response?.status;
const intentMessage =
intentError?.message ??
intentError?.response?.data?.message ??
'Não foi possível recuperar o status do pagamento.';
if (statusCode === 401) {
throw intentError;
}
if (statusCode === 404) {
setError(intentMessage);
setIsLoading(false);
setShouldPollIntent(false);
return;
}
}
setPaymentIntent(existingIntent);
const existingStatus = existingIntent?.status;
if (existingIntent) {
setPaid(existingStatus === PaymentIntentStatus.PAID);
setShouldPollIntent(existingStatus !== PaymentIntentStatus.PAID);
} else {
setPaid(false);
}
const shouldReuseIntent =
Boolean(existingIntent && existingStatus && !isPaymentIntentFinal(existingStatus));
if (shouldReuseIntent && existingIntent) {
setPixCharge(buildPixChargeFallback(existingIntent, bookingDetails));
if (
existingStatus &&
existingStatus !== PaymentIntentStatus.PAID &&
!isPaymentIntentFinal(existingStatus)
) {
await savePendingPayment(bookingDetails.id, existingIntent);
} else {
await clearPendingPayment();
}
} else {
setPixCharge(null);
setPaid(false);
try {
const pixResponse = await createPixCharge(user.id, {
amount: bookingDetails.totalPrice,
description: bookingDetails.serviceName || `Agendamento ${bookingDetails.id}`,
bookingId: bookingDetails.id,
providerId: bookingDetails.providerId,
});
setPixCharge(pixResponse ?? null);
const newIntent = pixResponse?.paymentIntent ?? null;
setPaymentIntent(newIntent);
const intentStatus = newIntent?.status;
if (intentStatus === PaymentIntentStatus.PAID) {
setPaid(true);
setShouldPollIntent(false);
} else {
setShouldPollIntent(true);
}
if (
intentStatus &&
intentStatus !== PaymentIntentStatus.PAID &&
!isPaymentIntentFinal(intentStatus)
) {
await savePendingPayment(bookingDetails.id, newIntent);
} else {
await clearPendingPayment();
}
} catch {
setShouldPollIntent(true);
}
}
} else {
setPixCharge(null);
setPaymentIntent(null);
setShouldPollIntent(false);
await clearPendingPayment();
if (normalizedPaymentMethod !== 'PIX') {
setPaid(true);
}
}
} catch (loadError: any) {
const message =
loadError?.message ||
loadError?.response?.data?.message ||
'Não foi possível carregar os detalhes do agendamento.';
await clearPendingPayment();
setError(message);
setIsLoading(false);
setShouldPollIntent(false);
}
}, [bookingId, paymentMethodParam, triggerContentAnimation, user?.id, savePendingPayment, clearPendingPayment]);
useEffect(() => {
loadData();
return () => {
if (pollRef.current) clearInterval(pollRef.current);
};
}, [loadData]);
useEffect(() => {
if (paymentIntent?.status === PaymentIntentStatus.PAID) {
const intentKey = paymentIntent.id ?? booking?.id ?? 'paid';
if (paymentToastIntentRef.current !== intentKey) {
NotificationUIService.showInfo(
'Pagamento confirmado. Seu atendimento está seguro.',
'Pagamento confirmado',
);
paymentToastIntentRef.current = intentKey;
}
} else {
paymentToastIntentRef.current = null;
}
}, [paymentIntent, booking?.id]);
useEffect(() => {
    if (paid) {
      clearPendingPayment();
    }
  }, [paid, clearPendingPayment]);
useEffect(() => {
    if (booking?.status && booking.status !== BookingStatus.PENDING_PAYMENT) {
      clearPendingPayment();
    }
  }, [booking?.status, clearPendingPayment]);
useEffect(() => {
    const status = paymentIntent?.status;
    if (status && (status === PaymentIntentStatus.PAID || isPaymentIntentFinal(status))) {
      clearPendingPayment();
    }
  }, [paymentIntent?.status, clearPendingPayment]);
const startPolling = useCallback(() => {
if (!bookingId || !shouldPollIntent) return;
const poll = async () => {
pollAttemptsRef.current += 1;
try {
const intent = await fetchPaymentIntent(bookingId);
if (!intent) {
if (pollAttemptsRef.current > 20 && pollRef.current) {
clearInterval(pollRef.current);
pollRef.current = null;
setShouldPollIntent(false);
}
return;
}
if (shouldStopPollingForStatus(intent.status)) {
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
          router.push('/client/bookings?highlightNew=true');
        }, 1200);
}
return;
}
if (
pollAttemptsRef.current >= MAX_POLL_ATTEMPTS &&
!pixFallbackActive
) {
if (pollRef.current) {
clearInterval(pollRef.current);
pollRef.current = null;
}
setShouldPollIntent(false);
setPixFallbackActive(true);
try {
const refreshed = await getBookingDetails(bookingId);
setBooking(refreshed);
} catch {
// Silently ignore refresh failures; no user message needed here.
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
'SessALo atualizada',
'Sua sessALo de pagamento foi renovada. Voltamos para a pA!gina inicial para garantir sua seguranA�a.',
);
        setTimeout(() => {
          router.push('/client/explore');
        }, 400);
return;
}
if (status === 404) {
if (pollRef.current) {
clearInterval(pollRef.current);
pollRef.current = null;
}
setShouldPollIntent(false);
setError(err?.message ?? 'Pagamento n�o encontrado.');
return;
}
// log removido para performance
}
};
poll();
      pollRef.current = setInterval(poll, 10000);
}, [bookingId, router, shouldPollIntent, pixFallbackActive]);
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
  if (pollRef.current) {
    clearInterval(pollRef.current);
    pollRef.current = null;
  }
  setShouldPollIntent(false);
  if (Platform.OS === 'ios') {
    try { Haptics.selectionAsync(); } catch {}
  }
  router.push('/client/bookings?highlightNew=true');
}, [router]);
const handleGoHome = useCallback(() => {
  if (pollRef.current) {
    clearInterval(pollRef.current);
    pollRef.current = null;
  }
  setShouldPollIntent(false);
  if (Platform.OS === 'ios') {
    try { Haptics.selectionAsync(); } catch {}
  }
  router.replace('/client/explore' as any);
}, [router]);
const handleAddToCalendar = useCallback(() => {
// Silencioso por enquanto
}, []);
const handleContactProvider = useCallback(async () => {
if (!booking) {
return;
}
try {
const conversation = await getOrCreateConversationForBooking(booking.id);
router.push({
pathname: CLIENT_ROUTES.CHAT(conversation.chatId),
params: {
recipientId: conversation.providerUserId,
recipientName: sanitizeText(conversation.providerFullName),
recipientAvatarUrl: conversation.providerAvatarUrl,
bookingId: booking.id,
},
} as any);
} catch (error) {
alertUserError(error, 'Não foi possível iniciar o chat com o prestador');
}
}, [booking, router]);
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
      setPaymentIntent(pixResponse?.paymentIntent ?? null);
      onceRef.current = false;
      pollAttemptsRef.current = 0;
      if (pixResponse?.paymentIntent?.status === PaymentIntentStatus.PAID) {
        setPaid(true);
        setShouldPollIntent(false);
      } else {
        setPaid(false);
        setShouldPollIntent(true);
      }
      const newIntent = pixResponse?.paymentIntent ?? null;
      const intentStatus = newIntent?.status;
      if (
        intentStatus &&
        intentStatus !== PaymentIntentStatus.PAID &&
        !isPaymentIntentFinal(intentStatus)
      ) {
        await savePendingPayment(booking.id, newIntent);
      } else {
        await clearPendingPayment();
      }
    } catch {
      // silencioso
    } finally {
      setIsRegeneratingPix(false);
    }
  }, [booking, paymentMethod, user?.id, isRegeneratingPix, savePendingPayment, clearPendingPayment]);
const handleLoyaltyLearnMore = useCallback(() => {
router.push('/client/missions' as any);
}, [router]);
const handleSupportCTA = useCallback(() => {
NotificationUIService.showInfo(
'Nossa equipe de suporte já recebeu o caso. Caso precise, podemos acompanhar de perto.',
'Suporte disponível',
);
}, []);
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
<View style={styles.container} testID="booking-success-screen">
<Stack.Screen options={{ title: 'Pagamento', headerShown: false }} />
<LinearGradient
colors={['#f2f2f2', '#ffffff']}
style={styles.background}
/>
<View style={styles.monitoringNotice}>
  <Text style={styles.monitoringText}>
    Este serviço tem monitoramento em tempo real pela equipe de segurança.
  </Text>
</View>
<ScrollView
contentContainerStyle={styles.scrollContent}
showsVerticalScrollIndicator={false}
>
<View testID="booking-success-title">
</View>
<View testID="booking-success-loader">
<SuccessLoadingError
isLoading={isLoading}
error={error}
        headerPrimaryColor={HEADER_PRIMARY_COLOR}
        onRetryPress={loadData}
      />
    </View>
    {isLoading && !error && (
      <View style={styles.loadingActions}>
        <TouchableOpacity style={styles.loadingActionBtn} onPress={handleGoHome} activeOpacity={0.8}>
          <Text style={styles.loadingActionText}>Voltar para início</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.loadingActionBtn} onPress={handleGoToBookings} activeOpacity={0.8}>
          <Text style={styles.loadingActionText}>Ver meus agendamentos</Text>
        </TouchableOpacity>
      </View>
    )}
    {!isLoading && !error && booking ? (
      <>
        {paymentMethod === 'PIX' && (
          <View style={styles.paymentStatusContainer}>
            {paymentIntent?.status === PaymentIntentStatus.PAID ? (
              <View testID="booking-success-primary-cta">
                <PaymentConfirmationCard onPressCta={handleGoToBookings} />
              </View>
            ) : null}
          </View>
        )}

        <BookingSummaryCard
          booking={summaryBooking ?? booking}
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
          insurance={booking.insurance}
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
      </>
    ) : null}
<View style={styles.bottomSpacer} />
</ScrollView>
<Animated.View
style={[
styles.navBarContainer,
navWrap,
{
transform: [{ translateY: navBarAnim.interpolate({ inputRange: [0, 1], outputRange: [100, 0] }) }],
},
]}
pointerEvents="box-none"
>
<NavBar />
</Animated.View>
</View>
);
}
const createStyles = (insetsTop: number) =>
StyleSheet.create({
container: {
flex: 1,
backgroundColor: '#f2f2f2',
paddingTop: Platform.OS === 'android' ? insetsTop - 6 : 0, // Android safe area + spacing
},
  background: {
...StyleSheet.absoluteFillObject,
opacity: 0.6,
},
  monitoringNotice: {
    marginHorizontal: 20,
    marginTop: 15,
    marginBottom: 4,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 12,
    backgroundColor: '#e8f2ff',
    borderWidth: 0.5,
    borderColor: '#cdddf8',
  },
  monitoringText: {
    ...textFix({ fontSize: 12, fontWeight: '600' }),
    color: '#1f4f8a',
    textAlign: 'center',
  },
scrollContent: {
flexGrow: 1,
alignItems: 'center',
justifyContent: 'flex-start',
paddingHorizontal: 17,
paddingTop: SCREEN_HEIGHT * 0.05, // 5% abaixo do aviso
paddingBottom: Platform.OS === 'android' ? 40 : 60,
},
navBarContainer: {
position: 'absolute',
bottom: Platform.OS === 'android' ? 2 : -30,
left: 0,
right: 0,
zIndex: 200,
},
paymentStatusContainer: {
width: '100%',
alignItems: 'center',
marginBottom: 12,
},
pendingStatusText: {
...textFix({ fontSize: 16, fontWeight: '600', lineHeight: 20 }),
color: AppColors.textBody,
textAlign: 'center',
marginBottom: 6,
},
loadingActions: {
  width: '100%',
  paddingHorizontal: 20,
  marginTop: 12,
  gap: 8,
  alignItems: 'center',
},
loadingActionBtn: {
  paddingVertical: 12,
  paddingHorizontal: 18,
  borderRadius: 12,
  backgroundColor: '#e7f0ff',
  borderWidth: 1,
  borderColor: '#c9dcff',
  width: '100%',
  maxWidth: 380,
  alignItems: 'center',
},
loadingActionText: {
  ...textFix({ fontSize: 14, fontWeight: '700' }),
  color: AppColors.primaryInteractive,
},
paymentFallbackCard: {
marginTop: 12,
width: '100%',
padding: 14,
borderRadius: 12,
borderWidth: 1,
borderColor: AppColors.primaryInteractive,
backgroundColor: AppColors.backgroundLight,
},
paymentFallbackText: {
...textFix({ fontSize: 14, lineHeight: 20 }),
color: AppColors.textBody,
},
supportButton: {
marginTop: 10,
alignSelf: 'flex-start',
paddingVertical: 8,
paddingHorizontal: 16,
borderRadius: 999,
backgroundColor: AppColors.primaryInteractive,
},
supportButtonText: {
...textFix({ fontWeight: '700', fontSize: 14 }),
color: AppColors.white,
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
...textFix({ fontWeight: '700', fontSize: 13 }),
color: HEADER_PRIMARY_COLOR,
},
});
