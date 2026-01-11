import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Animated,
  LogBox,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  Linking,
} from 'react-native';

import { toastUserError } from '../../../_shared/errors/uiFeedback';
import ProofCaptureSheet from '../../../components/provider/ProofCaptureSheet';
import { useAuth } from '../../../hooks/useAuth';
import { useBookingStatusMeta } from '../../../hooks/useBookingStatusMeta';
import { useProviderBookings } from '../../../hooks/useProviderBookings';
import { getBookingDetails } from '../../../services/bookingService';
import NotificationUIService from '../../../services/notificationUIService';
import { submitCheckinProof, submitCheckoutProof } from '../../../services/proofService';
import {
    BookingDetails,
    BookingProofPayload,
    BookingProofType,
    BookingStatus
} from '../../../types/backend/bookings';
import { PaymentIntentStatus } from '../../../types/backend/payments';
import dayjs, { Dayjs } from 'dayjs';
import timezone from 'dayjs/plugin/timezone';
import utc from 'dayjs/plugin/utc';

LogBox.ignoreLogs(['Layout children: No route named "index"']);

dayjs.extend(utc);
dayjs.extend(timezone);

const PRIMARY = '#0F62FF';
const BG = '#F1F2F1';
const WHITE = '#FFFFFF';
const TEXT = '#111827';
const MUTED = '#4B5563';
const SUCCESS = PRIMARY;
const WARNING = '#F97316';
const STANDBY = '#E5E7EB';
const ACTIVE_BLUE = PRIMARY;
const DISPLAY_TIMEZONE = 'America/Sao_Paulo';
const IN_PROGRESS_STATUSES = new Set<string>([BookingStatus.STARTED, 'IN_SERVICE']);
const COMPLETED_STATUSES = new Set([BookingStatus.FINISHED]);
const ACTIVE_DASHBOARD_LEAD_SECONDS = 5 * 60;
const WHATSAPP_NUMBER = '5519993223932';
const SERVER_SYNC_DELAY = 2000;
const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

function useAnimatedMount() {
  const fade = useRef(new Animated.Value(0)).current;
  const slide = useRef(new Animated.Value(12)).current;
  useEffect(() => {
    Animated.parallel([
      Animated.timing(fade, { toValue: 1, duration: 300, useNativeDriver: true }),
      Animated.timing(slide, { toValue: 0, duration: 300, useNativeDriver: true }),
    ]).start();
  }, [fade, slide]);
  return { fade, slide };
}

async function tryBeepLocalNotification(title: string, body: string) {
  // Tenta usar expo-notifications (se presente) para emitir notificação local com som padrão
  try {
    // dynamic import to avoid hard dependency at compile time
    const Notifications = (await import('expo-notifications')).default || (await import('expo-notifications'));
    await Notifications.scheduleNotificationAsync({
      content: { title, body, sound: true, priority: 'max' as any },
      trigger: null,
    });
  } catch {
    try {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch {}
  }
}

// ATENÇÃO: Adicionei temporariamente 'paymentIntent' à tipagem local
// Se 'BookingDetails' é um tipo importado, você DEVE corrigi-lo no arquivo de origem
// '../../../types/backend/bookings'
type BookingDetailsWithPaymentIntent = BookingDetails & {
  paymentIntent?: {
    status: PaymentIntentStatus;
  };
};

export default function ActiveBookingDetails() {
  const { bookingId } = useLocalSearchParams<{ bookingId: string }>();
  const router = useRouter();
  const renderHeaderLeft = () => (
    <TouchableOpacity
      testID="activeBookingBackButton"
      onPress={() => {
        if (Platform.OS === 'ios') {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        }
        router.back();
      }}
      style={{
        marginLeft: 10,
        padding: 8,
        borderRadius: 8,
        backgroundColor: 'rgba(255, 255, 255, 0.8)',
      }}
    >
      <Ionicons name="arrow-back" size={20} color={PRIMARY} />
    </TouchableOpacity>
  );
  const defaultHeaderOptions = {
    title: 'Atendimento',
    headerLeft: renderHeaderLeft,
  };
  const { fade, slide } = useAnimatedMount();
  const { user } = useAuth();
  const { statusMap } = useBookingStatusMeta();
  const { start, complete } = useProviderBookings();
  const routerRef = useRef(router);
  useEffect(() => {
    routerRef.current = router;
  }, [router]);

  const [booking, setBooking] = useState<BookingDetailsWithPaymentIntent | null>(null);
  const statusLabel = useMemo(
    () =>
      statusMap[booking?.status ?? '']?.labelProvider ||
      booking?.status ||
      'Em atualização',
    [booking, statusMap],
  );
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState<'NONE' | 'START' | 'COMPLETE'>('NONE');
  const [proofSheetVisible, setProofSheetVisible] = useState(false);
  const [proofSheetType, setProofSheetType] = useState<BookingProofType | null>(null);
  const [proofSubmitting, setProofSubmitting] = useState(false);
  const [clockTick, setClockTick] = useState(Date.now());
  const [finishButtonArmed, setFinishButtonArmed] = useState(false);
  const [isActionSyncing, setIsActionSyncing] = useState(false);

  const providerId =
    (user as any)?.providerDetails?.id ||
    (user as any)?.providerDetails?.providerId ||
    (user as any)?.id;
  const providerIdRef = useRef(providerId);
  useEffect(() => {
    providerIdRef.current = providerId;
  }, [providerId]);

  const fetchDetails = useCallback(
    async ({ showLoading = true } = {}) => {
      if (!bookingId) return;
      if (showLoading) {
        setLoading(true);
      }
      try {
        const data = (await getBookingDetails(bookingId)) as BookingDetailsWithPaymentIntent;
        const providerIdValue = providerIdRef.current;
        if (providerIdValue && data.providerId !== providerIdValue) {
          NotificationUIService.showError('Agendamento nao pertence a este provedor.');
          routerRef.current?.back();
          return;
        }
        setBooking(data);
      } catch (e: any) {
        toastUserError(e, 'Erro ao carregar o agendamento');
      } finally {
        if (showLoading) {
          setLoading(false);
        }
      }
    },
    [bookingId],
  );

  useEffect(() => {
    fetchDetails({ showLoading: true });
  }, [fetchDetails]);

  useEffect(() => {
    if (!bookingId) return;
    const polling = setInterval(() => {
      fetchDetails({ showLoading: false });
    }, 60_000);
    return () => clearInterval(polling);
  }, [bookingId, fetchDetails]);

  useEffect(() => {
    const interval = setInterval(() => setClockTick(Date.now()), 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  const scheduledDateDayjs = useMemo<Dayjs | null>(() => {
    if (!booking?.scheduledDate) return null;
    return dayjs.utc(booking.scheduledDate).tz(DISPLAY_TIMEZONE);
  }, [booking?.scheduledDate]);

  const actualStartSource =
    booking?.actualStartTime ?? booking?.startedAt ?? booking?.scheduledStart ?? booking?.scheduledTime;

  const actualStartDayjs = useMemo<Dayjs | null>(() => {
    if (!actualStartSource) return null;
    return dayjs.utc(actualStartSource).tz(DISPLAY_TIMEZONE);
  }, [actualStartSource]);

  const estimatedEndDayjs = useMemo<Dayjs | null>(() => {
    if (!actualStartDayjs) return null;
    const durationMinutes = booking?.durationMinutes ?? 240;
    return actualStartDayjs.add(durationMinutes, 'minute');
  }, [actualStartDayjs, booking?.durationMinutes]);

  const nowDayjs = useMemo(() => dayjs.utc(clockTick).tz(DISPLAY_TIMEZONE), [clockTick]);

  const displayDateLabel = scheduledDateDayjs?.format('DD/MM/YYYY') ?? '—';
  const displayTimeLabel = actualStartDayjs?.format('HH:mm') ?? '—';

  const nowInfo = useMemo(() => {
    if (!actualStartDayjs) {
      return { withinWindow: false, minutesToStart: undefined as number | undefined };
    }
    const minutesToStart = actualStartDayjs.diff(nowDayjs, 'minute');
    const withinWindow = minutesToStart <= 120 && minutesToStart >= -15;
    return { withinWindow, minutesToStart };
  }, [actualStartDayjs, nowDayjs]);

  const engineActivationReady =
    !!actualStartDayjs &&
    nowInfo.minutesToStart !== undefined &&
    nowInfo.minutesToStart <= 15 &&
    nowInfo.minutesToStart >= -15 &&
    nowInfo.withinWindow;
  const showStartWaitingAlert = !!actualStartDayjs && !engineActivationReady;

  const needsStartAction =
    booking?.status === BookingStatus.CONFIRMED ||
    booking?.status === BookingStatus.ON_THE_WAY ||
    booking?.status === BookingStatus.ARRIVED;

  const serviceStartLabel = actualStartDayjs?.format('HH:mm') ?? null;

  const serviceRemainingMinutes = estimatedEndDayjs
    ? estimatedEndDayjs.diff(nowDayjs, 'minute')
    : undefined;
  const finishActivationReady = estimatedEndDayjs
    ? estimatedEndDayjs.diff(nowDayjs, 'second') <= ACTIVE_DASHBOARD_LEAD_SECONDS
    : false;
  const isTimeOverdue = serviceRemainingMinutes !== undefined && serviceRemainingMinutes < 0;
  const remainingMinutesStyle = isTimeOverdue ? styles.overdueText : styles.engineStandbyText;

  const hasStartPermission = useMemo(() => {
    return booking?.allowedActions?.includes('START_SERVICE') ?? false;
  }, [booking?.allowedActions]);

  const hasCompletePermission = useMemo(() => {
    const inService = booking?.status === BookingStatus.STARTED || booking?.status === 'FINISHED';
    if (inService) return true;
    return booking?.allowedActions?.includes('COMPLETE_SERVICE') ?? false;
  }, [booking?.allowedActions, booking?.status]);

  const checkinProof = booking?.proofs?.find((proof) => proof.type === 'CHECKIN');
  const checkoutProof = booking?.proofs?.find((proof) => proof.type === 'CHECKOUT');
  const proofRequired = booking?.insurance?.proofRequired ?? false;
  const requiresCheckoutVideo =
    booking?.insurance?.planId === 'PREMIUM' ||
    booking?.insurance?.planId === 'TOTAL';
  const startBlocked = proofRequired && !checkinProof;
  const needsCheckoutProof =
    proofRequired &&
    (!checkoutProof || (requiresCheckoutVideo && !checkoutProof.videoUrl));
  const startDisabled =
    !engineActivationReady || !hasStartPermission || submitting !== 'NONE' || startBlocked;
  const completeDisabled =
    !hasCompletePermission || submitting !== 'NONE';
  const finishButtonDisabled = !hasCompletePermission || submitting !== 'NONE';

  const isInProgress = booking ? IN_PROGRESS_STATUSES.has(booking.status) : false;
  const isCompleted = booking ? COMPLETED_STATUSES.has(booking.status) : false;
  const isButtonDisabled = useMemo(
    () => (isInProgress ? completeDisabled : startDisabled),
    [isInProgress, completeDisabled, startDisabled],
  );
  const actionLabel = isInProgress ? 'Finalizar Atendimento' : 'Iniciar Serviço';
  const actionIconName = isInProgress ? 'stop-circle-outline' : 'play-circle-outline';
  const actionButtonStateStyle = isInProgress
    ? styles.primaryActionButtonDanger
    : engineActivationReady
      ? styles.primaryActionButtonActive
      : styles.primaryActionButtonStandby;

  useEffect(() => {
    if (!isInProgress) {
      setFinishButtonArmed(false);
      return;
    }
    if (finishActivationReady && !finishButtonArmed) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
      setFinishButtonArmed(true);
    } else if (!finishActivationReady && finishButtonArmed) {
      setFinishButtonArmed(false);
    }
  }, [finishActivationReady, finishButtonArmed, isInProgress]);

  const renderActionButtons = () => {
    if (isCompleted) {
      return null;
    }
    return (
      <>
        {(isInProgress || needsStartAction) && (
          <View style={styles.actions}>
            <TouchableOpacity
              style={[
                styles.primaryActionButton,
                actionButtonStateStyle,
                isButtonDisabled && styles.primaryActionButtonDisabled,
              ]}
              onPress={isInProgress ? handleComplete : handleStart}
              disabled={isButtonDisabled}
              accessibilityLabel={actionLabel}
              testID={isInProgress ? 'completeJobButton' : 'startJobButton'}
            >
              {submitting === (isInProgress ? 'COMPLETE' : 'START') ? (
                <ActivityIndicator color={WHITE} size="small" />
              ) : (
                <Ionicons name={actionIconName} size={20} color={WHITE} />
              )}
              <Text style={styles.primaryActionButtonText}>{actionLabel}</Text>
            </TouchableOpacity>
            {isInProgress && serviceStartLabel && (
              <Text style={styles.engineStandbyText}>Serviço iniciado às {serviceStartLabel}</Text>
            )}
            {isInProgress && typeof serviceRemainingMinutes === 'number' && (
              <Text style={remainingMinutesStyle}>
                {serviceRemainingMinutes > 0
                  ? `Tempo estimado restante: ${serviceRemainingMinutes} min`
                  : 'Prazo estimado ultrapassado; finalize o atendimento'}
              </Text>
            )}
            {!isInProgress && showStartWaitingAlert && (
              <Text style={styles.engineStandbyText}>Aguardando janela de início</Text>
            )}
          </View>
        )}
        {proofRequired && (
          <View style={styles.proofSection}>
            <Text style={styles.proofHint}>
              {startBlocked
                ? 'Envie o comprovante de check-in antes de iniciar.'
                : 'Check-in registrado.'}
            </Text>
            <TouchableOpacity
              style={styles.proofButton}
              onPress={() => openProofSheet('CHECKIN')}
              accessibilityLabel="Enviar comprovante de check-in"
            >
              <Text style={styles.proofButtonText}>
                {startBlocked
                  ? 'Enviar comprovante de check-in'
                  : 'Atualizar comprovante de check-in'}
              </Text>
            </TouchableOpacity>
            <Text style={styles.proofHint}>
              {needsCheckoutProof
                ? requiresCheckoutVideo
                  ? 'Envie o checkout (vídeo obrigatório) para concluir.'
                  : 'Envie o checkout para concluir.'
                : 'Checkout registrado.'}
            </Text>
            <TouchableOpacity
              style={styles.proofButton}
              onPress={() => openProofSheet('CHECKOUT')}
              accessibilityLabel="Enviar comprovante de checkout"
            >
              <Text style={styles.proofButtonText}>
                {needsCheckoutProof
                  ? 'Enviar comprovante de checkout'
                  : 'Atualizar comprovante de checkout'}
              </Text>
            </TouchableOpacity>
          </View>
        )}
      </>
    );
  };

  const handleStart = useCallback(async () => {
    if (!booking || !bookingId) return;
    if (!hasStartPermission || startBlocked) {
      NotificationUIService.showError('Nao e possivel iniciar este atendimento agora.');
      return;
    }
    setSubmitting('START');
    try {
      const updated = await start(bookingId) as BookingDetailsWithPaymentIntent;
      setBooking(updated);
      NotificationUIService.showSuccess('Servico iniciado.');
      await tryBeepLocalNotification('Servico iniciado', 'Você iniciou o atendimento.');
    } catch (e: any) {
      toastUserError(e, 'Erro ao iniciar o atendimento');
    } finally {
      setSubmitting('NONE');
    }
  }, [booking, bookingId, hasStartPermission, startBlocked, start]);

  const openProofSheet = useCallback((type: BookingProofType) => {
    setProofSheetType(type);
    setProofSheetVisible(true);
  }, []);

  const handleComplete = useCallback(async () => {
    if (!booking || !bookingId) return;
    if (!hasCompletePermission) {
      NotificationUIService.showError('Nao e possivel concluir: verifique status, inicio e pagamento.');
      return;
    }
    if (needsCheckoutProof) {
      openProofSheet('CHECKOUT');
      return;
    }
    setSubmitting('COMPLETE');
    try {
      const updated = await complete(bookingId) as BookingDetailsWithPaymentIntent;
      setBooking(updated);
      NotificationUIService.showSuccess('Servico finalizado.');
      await tryBeepLocalNotification('Servico finalizado', 'Atendimento Concluido com sucesso.');
      setActionSyncing(true);
      await delay(SERVER_SYNC_DELAY);
      await fetchDetails({ showLoading: false });
    } catch (e: any) {
      const message = String(e?.message || '').toLowerCase();
      const isLoyaltyDup =
        message.includes('unique constraint failed') ||
        message.includes('p2002') ||
        message.includes('loyaltytransaction') ||
        message.includes('referenceid');
      const isFinishTooEarly =
        message.includes('cedo') ||
        message.includes('too early') ||
        (message.includes('finish') && message.includes('early'));

      if (isLoyaltyDup) {
        NotificationUIService.showSuccess('Servico finalizado. Pontuacao ja registrada.');
        await fetchDetails({ showLoading: false });
        return;
      }
      if (isFinishTooEarly) {
        Alert.alert(
          'Ainda nao e possivel finalizar',
          'Aguarde alguns minutos para concluir, de acordo com o tempo minimo do Servico.',
          [{ text: 'Entendi', style: 'default' }],
        );
        return;
      }
    } finally {
      setSubmitting('NONE');
      setActionSyncing(false);
    }
  }, [booking, bookingId, complete, fetchDetails, hasCompletePermission, needsCheckoutProof, openProofSheet]);

  const handleProofSubmit = useCallback(
    async (payload: BookingProofPayload) => {
      if (!bookingId || !proofSheetType) return;
      setProofSubmitting(true);
      try {
        if (proofSheetType === 'CHECKIN') {
          await submitCheckinProof(bookingId, payload);
        } else {
          await submitCheckoutProof(bookingId, payload);
        }
        await fetchDetails();
        NotificationUIService.showSuccess('Comprovante enviado', 'O comprovante foi registrado com sucesso.');
        setProofSheetVisible(false);
        setProofSheetType(null);
      } catch (error) {
        toastUserError(error, 'Erro ao enviar comprovante');
        throw error;
      } finally {
        setProofSubmitting(false);
      }
    },
    [bookingId, fetchDetails, proofSheetType],
  );

  const proofCaptureSheet = (
    <ProofCaptureSheet
      visible={proofSheetVisible}
      type={proofSheetType ?? 'CHECKIN'}
      planId={booking?.insurance?.planId ?? null}
      onClose={() => {
        setProofSheetVisible(false);
        setProofSheetType(null);
      }}
      onSubmit={handleProofSubmit}
      isSubmitting={proofSubmitting}
    />
  );

  const handleSupportPress = useCallback(() => {
    Alert.alert(
      'Precisa de ajuda?',
      'Selecione uma opção:',
      [
        { text: 'Problema no endereço / cliente não responde', onPress: () => NotificationUIService.showInfo('Avise o cliente pelo chat e registre o ocorrido.') },
        { text: 'Atraso / trânsito', onPress: () => NotificationUIService.showInfo('Informe o cliente e ajuste o horário se preciso.') },
        { text: 'Falar com suporte', onPress: () => router.push('/provider/messages' as any) },
        { text: 'Fechar', style: 'cancel' },
      ],
      { cancelable: true }
    );
  }, [router]);

  const openWhatsAppSupport = useCallback(() => {
    if (!booking) return;
    const providerName = booking.providerFullName ?? 'prestador';
    const message = encodeURIComponent(
      `Olá, sou o prestador ${providerName} e preciso de ajuda com o agendamento #${booking.id}`,
    );
    const url = `https://wa.me/${WHATSAPP_NUMBER}?text=${message}`;
    Linking.openURL(url).catch(() => {
      NotificationUIService.showError('Não foi possível abrir o WhatsApp.');
    });
  }, [booking]);

  // Se `loading` ou `!booking`
  if (loading || !booking) {
    return (
      <View style={styles.centered}>
        <Stack.Screen options={defaultHeaderOptions} />
        <ActivityIndicator size="large" color={PRIMARY} />
        <Text style={styles.loadingText}>Carregando detalhes...</Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, isInProgress && styles.containerCenter]}>
      <Stack.Screen options={defaultHeaderOptions} />
      {isInProgress ? (
        <View style={styles.dashboardWrapper}>
          <ActiveServiceDashboard
            booking={booking}
            actualStartDayjs={actualStartDayjs}
            estimatedEndDayjs={estimatedEndDayjs}
            finishActivationReady={finishActivationReady}
            finishButtonDisabled={finishButtonDisabled}
            handleComplete={handleComplete}
            needsCheckoutProof={needsCheckoutProof}
            onSupportPress={openWhatsAppSupport}
          />
        </View>
      ) : (
        <Animated.View style={[styles.card, { opacity: fade, transform: [{ translateY: slide }] }]}>
          <View style={styles.row}>
            <Ionicons name="calendar-outline" size={18} color={PRIMARY} style={styles.icon} />
            <Text style={styles.title}>{booking.serviceName}</Text>
          </View>
          <Text style={styles.muted}>Cliente: {booking.clientFullName}</Text>
          <Text style={styles.muted}>Data: {displayDateLabel} às {displayTimeLabel}</Text>
          {estimatedEndDayjs && (
            <Text style={styles.muted}>Término estimado: {estimatedEndDayjs.format('HH:mm')}</Text>
          )}

          {isInProgress && (
            <View style={[styles.banner, { backgroundColor: '#E0F2FE', borderColor: '#7DD3FC' }] }>
              <Ionicons name="time-outline" size={16} color={PRIMARY} />
              <Text style={[styles.bannerText, { color: TEXT }]} testID="jobStatusText">Servico em andamento</Text>
            </View>
          )}
          {isCompleted && (
            <View style={[styles.banner, { backgroundColor: '#DCFCE7', borderColor: '#86EFAC' }]}>
              <Ionicons name="checkmark-circle-outline" size={16} color={SUCCESS} />
              <Text style={[styles.bannerText, { color: TEXT }]} testID="jobStatusText">Concluido</Text>
            </View>
          )}

          {renderActionButtons()}

          {booking.status === BookingStatus.CONFIRMED && !nowInfo.withinWindow && (
            <View style={[styles.banner, { backgroundColor: '#FEF3C7', borderColor: '#FDE68A' }]}>
              <Ionicons name="alert-circle-outline" size={16} color={WARNING} />
              <Text style={[styles.bannerText, { color: TEXT }]}>Aguardando janela de início</Text>
            </View>
          )}

          <View style={{ height: 4 }} />
          <Text style={[styles.muted, { fontSize: 12 }]}>
            Status: {statusLabel}
          </Text>
          <TouchableOpacity style={styles.supportLink} onPress={handleSupportPress} accessibilityRole="button" accessibilityLabel="Acionar suporte ou ajuda">
            <Ionicons name="help-circle-outline" size={16} color={PRIMARY} style={{ marginRight: 6 }} />
            <Text style={[styles.muted, { color: PRIMARY, fontSize: 13, fontWeight: '600' }]}>
              Preciso de ajuda
            </Text>
          </TouchableOpacity>
        </Animated.View>
      )}
      {proofCaptureSheet}
      {isActionSyncing && (
        <View style={styles.syncOverlay}>
          <ActivityIndicator color={PRIMARY} size="small" />
          <Text style={styles.syncText}>Sincronizando atendimento...</Text>
        </View>
      )}
    </View>
  );
}

function ActiveServiceDashboard({
  booking,
  actualStartDayjs,
  estimatedEndDayjs,
  finishActivationReady,
  finishButtonDisabled,
  handleComplete,
  needsCheckoutProof,
  onSupportPress,
}: {
  booking: BookingDetailsWithPaymentIntent;
  actualStartDayjs: Dayjs | null;
  estimatedEndDayjs: Dayjs | null;
  finishActivationReady: boolean;
  finishButtonDisabled: boolean;
  handleComplete: () => void;
  needsCheckoutProof: boolean;
  onSupportPress: () => void;
}) {
  const [timerTick, setTimerTick] = useState(Date.now());
  useEffect(() => {
    const interval = setInterval(() => setTimerTick(Date.now()), 1000);
    return () => clearInterval(interval);
  }, []);
  const pad = (value: number) => String(value).padStart(2, '0');
  const elapsedSeconds = actualStartDayjs
    ? Math.max(0, Math.floor(dayjs.utc(timerTick).tz(DISPLAY_TIMEZONE).diff(actualStartDayjs, 'second')))
    : 0;
  const elapsedLabel = `${pad(Math.floor(elapsedSeconds / 3600))}:${pad(
    Math.floor((elapsedSeconds % 3600) / 60),
  )}:${pad(elapsedSeconds % 60)}`;
  const remainingSeconds = estimatedEndDayjs
    ? Math.max(0, Math.floor(estimatedEndDayjs.diff(dayjs.utc(timerTick).tz(DISPLAY_TIMEZONE), 'second')))
    : undefined;
  const remainingLabel =
    remainingSeconds !== undefined
      ? remainingSeconds > 0
        ? `Tempo restante: ${pad(Math.floor(remainingSeconds / 3600))}:${pad(
            Math.floor((remainingSeconds % 3600) / 60),
          )}:${pad(remainingSeconds % 60)}`
        : 'Tempo estimado ultrapassado'
      : 'Tempo estimado indisponível';
  return (
    <View style={styles.dashboardContainer}>
      <Text style={styles.dashboardModeLabel}>Modo Ativo</Text>
      <Text style={styles.dashboardServiceName}>{booking.serviceName}</Text>
      <View style={styles.dashboardTimerBlock}>
        <Text style={styles.dashboardTimer}>{elapsedLabel}</Text>
        <Text style={styles.dashboardRemaining}>{remainingLabel}</Text>
      </View>
      <TouchableOpacity
        style={[
          styles.dashboardButton,
          finishActivationReady ? styles.dashboardButtonActive : styles.dashboardButtonDisabled,
        ]}
        disabled={finishButtonDisabled}
        onPress={handleComplete}
        accessibilityLabel="Finalizar Atendimento"
        testID="completeJobButton"
      >
        <Text style={styles.dashboardButtonText}>Finalizar Atendimento</Text>
      </TouchableOpacity>
      {needsCheckoutProof && (
        <Text style={styles.dashboardHint}>Checkout pendente; registre o comprovante antes de finalizar.</Text>
      )}
      <Text style={styles.dashboardSupportPrompt}>Precisa de ajuda?</Text>
      <TouchableOpacity onPress={onSupportPress}>
        <Text style={styles.dashboardSupportLink}>Falar com o suporte via WhatsApp</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: BG, padding: 16 },
  containerCenter: { justifyContent: 'center' },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#f1f2f1', padding: 24 },
  loadingText: { marginTop: 12, color: MUTED },
  card: {
    backgroundColor: WHITE,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    ...Platform.select({ ios: { shadowColor: '#000', shadowOpacity: 0.06, shadowOffset: { width: 0, height: 4 }, shadowRadius: 10 }, android: { elevation: 0 } }),
  },
  row: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  icon: { marginRight: 8 },
  title: { fontSize: 18, fontWeight: '700', color: TEXT },
  muted: { color: MUTED, marginTop: 2 },
  supportLink: {
    marginTop: 6,
    flexDirection: 'row',
    alignItems: 'center',
  },
  proofSection: {
    marginTop: 16,
    backgroundColor: WHITE,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    padding: 12,
  },
  proofHint: {
    fontSize: 13,
    color: TEXT,
    marginBottom: 6,
  },
  proofButton: {
    alignSelf: 'flex-start',
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: PRIMARY,
    backgroundColor: '#F3F4F6',
    marginBottom: 10,
  },
  proofButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: PRIMARY,
  },
  dashboardWrapper: {
    flex: 1,
    backgroundColor: BG,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  dashboardContainer: {
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
    marginTop: -10,
    borderRadius: 24,
    backgroundColor: WHITE,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowOffset: { width: 0, height: 6 },
    shadowRadius: 12,
  },
  dashboardModeLabel: {
    color: PRIMARY,
    fontWeight: '600',
    marginBottom: 8,
  },
  dashboardServiceName: {
    color: TEXT,
    fontSize: 22,
    fontWeight: '700',
    marginBottom: 24,
    textAlign: 'center',
  },
  dashboardTimerBlock: {
    alignItems: 'center',
    marginBottom: 24,
    gap: 8,
  },
  dashboardTimer: {
    fontSize: 48,
    fontWeight: '700',
    color: TEXT,
  },
  dashboardRemaining: {
    fontSize: 16,
    color: MUTED,
  },
  dashboardButton: {
    width: '100%',
    paddingVertical: 16,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  dashboardButtonActive: {
    backgroundColor: ACTIVE_BLUE,
  },
  dashboardButtonDisabled: {
    backgroundColor: '#CBD5F5',
  },
  dashboardButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: WHITE,
  },
  dashboardHint: {
    fontSize: 12,
    color: MUTED,
    marginBottom: 12,
    textAlign: 'center',
  },
  dashboardSupportPrompt: {
    fontSize: 14,
    color: TEXT,
    marginTop: 12,
  },
  dashboardSupportLink: {
    fontSize: 15,
    color: PRIMARY,
    fontWeight: '600',
    marginTop: 4,
  },
  syncOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(255,255,255,0.75)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 2,
    borderRadius: 20,
  },
  syncText: {
    marginTop: 8,
    fontSize: 13,
    color: TEXT,
    fontWeight: '600',
  },
  actions: { marginTop: 14, gap: 10 },
  primaryActionButton: {
    width: '100%',
    height: 56,
    borderRadius: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    gap: 10,
  },
  primaryActionButtonActive: {
    backgroundColor: ACTIVE_BLUE,
    borderColor: ACTIVE_BLUE,
  },
  primaryActionButtonStandby: {
    backgroundColor: STANDBY,
    borderColor: STANDBY,
  },
  primaryActionButtonDanger: {
    backgroundColor: '#EF4444',
    borderColor: '#EF4444',
  },
  primaryActionButtonDisabled: {
    opacity: 0.65,
  },
  primaryActionButtonText: {
    marginLeft: 6,
    fontWeight: '700',
    color: WHITE,
  },
  engineStandbyText: {
    marginTop: 8,
    textAlign: 'center',
    color: MUTED,
    fontSize: 13,
    lineHeight: 18,
  },
  overdueText: {
    marginTop: 8,
    textAlign: 'center',
    color: '#DC2626',
    fontSize: 13,
    fontWeight: '600',
  },
  banner: { marginTop: 12, padding: 10, borderRadius: 10, borderWidth: 1, flexDirection: 'row', alignItems: 'center', gap: 8 },
  bannerText: { fontSize: 13, fontWeight: '600' },
});
