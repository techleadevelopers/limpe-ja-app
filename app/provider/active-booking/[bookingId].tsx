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
import * as ImagePicker from 'expo-image-picker';
import verificationService from '../../../services/verificationService';
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

const buildScheduledIso = (date?: string | null, time?: string | null) => {
  if (!date) {
    return time ?? null;
  }
  const trimmedTime = (time ?? '00:00:00').trim();
  if (trimmedTime.includes('T')) {
    return trimmedTime;
  }
  const timeWithSeconds =
    trimmedTime.split(':').length === 2 ? `${trimmedTime}:00` : trimmedTime;
  const needsZone = !/[Zz]$/.test(timeWithSeconds) && !/[+\-]\d/.test(timeWithSeconds);
  const normalizedTime = needsZone ? `${timeWithSeconds}Z` : timeWithSeconds;
  return `${date}T${normalizedTime}`;
};

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
  // Tenta usar expo-notifications (se presente) para emitir notificaÃ§Ã£o local com som padrÃ£o
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

// ATENÃÃO: Adicionei temporariamente 'paymentIntent' Ã  tipagem local
// Se 'BookingDetails' Ã© um tipo importado, vocÃª DEVE corrigi-lo no arquivo de origem
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
  const { start, complete, onTheWay, arrive } = useProviderBookings();
  const routerRef = useRef(router);
  useEffect(() => {
    routerRef.current = router;
  }, [router]);

  const [booking, setBooking] = useState<BookingDetailsWithPaymentIntent | null>(null);
  const statusLabel = useMemo(
    () =>
      statusMap[booking?.status ?? '']?.labelProvider ||
      booking?.status ||
      'Em atualizaÃ§Ã£o',
    [booking, statusMap],
  );
  useEffect(() => {
    console.log('Status atual:', booking?.status);
  }, [booking?.status]);
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

  const scheduledStartIso = useMemo(() => {
    if (booking?.scheduledStart) {
      return booking.scheduledStart;
    }
    return buildScheduledIso(booking?.scheduledDate, booking?.scheduledTime);
  }, [booking?.scheduledDate, booking?.scheduledStart, booking?.scheduledTime]);

  const actualStartSource =
    booking?.startedAt ?? booking?.actualStartTime ?? booking?.scheduledStart ?? booking?.scheduledTime;

  const actualStartDayjs = useMemo<Dayjs | null>(() => {
    if (!actualStartSource) return null;
    return dayjs.utc(actualStartSource).tz(DISPLAY_TIMEZONE);
  }, [actualStartSource]);

  const estimatedEndDayjs = useMemo<Dayjs | null>(() => {
    if (!actualStartDayjs) return null;
    const durationMinutes = booking?.durationMinutes ?? 240;
    return actualStartDayjs.add(durationMinutes, 'minute');
  }, [actualStartDayjs, booking?.durationMinutes]);

  const scheduledStartDayjs = useMemo<Dayjs | null>(() => {
    if (!scheduledStartIso) return null;
    return dayjs.utc(scheduledStartIso).tz(DISPLAY_TIMEZONE);
  }, [scheduledStartIso]);

  const scheduledEndDayjs = useMemo<Dayjs | null>(() => {
    if (booking?.scheduledEndTime) {
      return dayjs.utc(booking.scheduledEndTime).tz(DISPLAY_TIMEZONE);
    }
    if (!scheduledStartDayjs) {
      return null;
    }
    const durationMinutes =
      booking?.durationMinutes ?? booking?.serviceDurationMinutes ?? null;
    if (!durationMinutes || durationMinutes <= 0) {
      return null;
    }
    return scheduledStartDayjs.add(durationMinutes, 'minute');
  }, [
    booking?.scheduledEndTime,
    booking?.durationMinutes,
    booking?.serviceDurationMinutes,
    scheduledStartDayjs,
  ]);

  const terminationDisplayDayjs = scheduledEndDayjs ?? estimatedEndDayjs;
  const nowDayjs = useMemo(() => dayjs(clockTick).tz(DISPLAY_TIMEZONE), [clockTick]);

  const displayDateLabel =
    scheduledStartDayjs?.format('DD/MM/YYYY') ??
    scheduledDateDayjs?.format('DD/MM/YYYY') ??
    '—';
  const displayTimeLabel = booking?.scheduledStart
    ? new Date(booking.scheduledStart).toLocaleTimeString('pt-BR', {
        hour: '2-digit',
        minute: '2-digit',
        timeZone: 'America/Sao_Paulo',
      })
    : scheduledStartDayjs?.format('HH:mm') ?? '—';
  const terminationLabel = booking?.scheduledEndTime
    ? new Date(booking.scheduledEndTime).toLocaleTimeString('pt-BR', {
        hour: '2-digit',
        minute: '2-digit',
        timeZone: 'America/Sao_Paulo',
      })
    : terminationDisplayDayjs?.format('HH:mm');
  const diffInMinutes =
    scheduledStartDayjs != null ? nowDayjs.diff(scheduledStartDayjs, 'minute') : undefined;
  const canStart =
    booking?.status === BookingStatus.CONFIRMED &&
    diffInMinutes !== undefined &&
    diffInMinutes >= -50 &&
    diffInMinutes <= 20;
  const checkinProof = booking?.proofs?.find((proof) => proof.type === 'CHECKIN');
  const hasCheckinProof = !!checkinProof?.photos?.length;
  const primaryActionLabel = useMemo(() => {
    switch (booking?.status) {
      case BookingStatus.CONFIRMED:
        return 'Iniciar deslocamento';
      case BookingStatus.ON_THE_WAY:
        return 'Cheguei no local';
      case BookingStatus.ARRIVED:
        return 'Iniciar Atendimento';
      default:
        return 'Iniciar Atendimento';
    }
  }, [booking?.status]);
  const primaryActionActive =
    booking?.status === BookingStatus.CONFIRMED ? canStart : true;
  const primaryActionDisabled =
    submitting !== 'NONE' ||
    (booking?.status === BookingStatus.CONFIRMED && !canStart);
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
  const hasCompletePermission = useMemo(() => {
    const inService = booking?.status === BookingStatus.STARTED || booking?.status === 'FINISHED';
    if (inService) return true;
    return booking?.allowedActions?.includes('COMPLETE_SERVICE') ?? false;
  }, [booking?.allowedActions, booking?.status]);

  const checkoutProof = booking?.proofs?.find((proof) => proof.type === 'CHECKOUT');
  const proofRequired = booking?.status === BookingStatus.CONFIRMED;
  const requiresCheckoutVideo =
    booking?.insurance?.planId === 'PREMIUM' ||
    booking?.insurance?.planId === 'TOTAL';
  const needsCheckoutProof =
    proofRequired &&
    (!checkoutProof || (requiresCheckoutVideo && !checkoutProof.videoUrl));
  const finishButtonDisabled = !hasCompletePermission || submitting !== 'NONE';

  const isInProgress = booking ? IN_PROGRESS_STATUSES.has(booking.status) : false;
  const isCompleted = booking ? COMPLETED_STATUSES.has(booking.status) : false;
  const actionLabel = isInProgress ? 'Finalizar Atendimento' : primaryActionLabel;
  const actionIconName = isInProgress ? 'stop-circle-outline' : 'play-circle-outline';
  const actionButtonStateStyle = isInProgress
    ? styles.primaryActionButtonDanger
    : primaryActionActive
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
    const isCheckinStage = booking?.status === BookingStatus.ARRIVED;
    const primaryButtonHandler = isInProgress ? handleComplete : handleStart;
    return (
      <>
        {(isInProgress || needsStartAction) && (
          <View style={styles.actions}>
            <TouchableOpacity
              style={[styles.primaryActionButton, actionButtonStateStyle]}
              onPress={primaryButtonHandler}
              disabled={isInProgress ? finishButtonDisabled : primaryActionDisabled}
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
            {!isInProgress && booking?.status === BookingStatus.CONFIRMED && !canStart && (
              <Text style={styles.engineStandbyText}>Janela oficial: {serviceStartLabel ?? '—'}</Text>
            )}
          </View>
        )}
        {isCheckinStage && (
          <View style={styles.proofSection}>
            <Text style={styles.proofHint}>
              {hasCheckinProof
                ? 'Check-in registrado. Atualize se precisar ajustar.'
                : 'Envie o comprovante de check-in antes de iniciar.'}
            </Text>
            {hasCheckinProof && (
              <TouchableOpacity
                style={styles.proofButton}
                onPress={handleCheckinPhoto}
                disabled={proofSubmitting}
                accessibilityLabel="Atualizar comprovante de entrada"
              >
                <Text style={styles.proofButtonText}>Atualizar comprovante de entrada</Text>
              </TouchableOpacity>
            )}
          </View>
        )}
      </>
    );
  };

  const handleStart = useCallback(async () => {
    if (!booking || !bookingId) return;
    console.log('Dados do agendamento antes de iniciar:', booking.id);

    setSubmitting('START');
    try {
      const parseCoord = (value?: string | number | null) => {
        const numeric = Number(value ?? 0);
        return Number.isFinite(numeric) ? numeric : 0;
      };
      const buildLocationPayload = () => ({
        lat: parseCoord(booking.address?.latitude),
        lng: parseCoord(booking.address?.longitude),
        capturedAt: new Date().toISOString(),
      });
      const prevStatus = booking.status;
      let updated: BookingDetailsWithPaymentIntent | null = null;
      let successMessage = 'Status atualizado.';
      if (booking.status === BookingStatus.CONFIRMED) {
        successMessage = 'Deslocamento iniciado.';
        updated = (await onTheWay(bookingId)) as BookingDetailsWithPaymentIntent;
      } else if (booking.status === BookingStatus.ON_THE_WAY) {
        successMessage = 'Chegada registrada.';
        const locationPayload = buildLocationPayload();
        updated = (await arrive(bookingId, locationPayload)) as BookingDetailsWithPaymentIntent;
      } else if (booking.status === BookingStatus.ARRIVED) {
        successMessage = 'Serviço iniciado.';
        const locationPayload = buildLocationPayload();
        updated = (await start(bookingId, locationPayload)) as BookingDetailsWithPaymentIntent;
      } else {
        return;
      }

      if (updated) {
        setBooking(updated);
        await fetchDetails({ showLoading: false });
        if (prevStatus === BookingStatus.CONFIRMED && updated.status === BookingStatus.ON_THE_WAY) {
          NotificationUIService.showSuccess('Boa viagem!', 'Estamos monitorando seu trajeto para sua segurança.');
        } else if (updated.status === BookingStatus.ARRIVED) {
          NotificationUIService.showSuccess('Que bom que você chegou!', 'Prepare-se para iniciar o serviço.');
        } else if (updated.status === BookingStatus.STARTED) {
          NotificationUIService.showSuccess('Serviço iniciado! Bom trabalho, estamos por aqui se precisar.');
        } else {
          NotificationUIService.showSuccess(successMessage);
        }
        if (updated.status === BookingStatus.STARTED) {
          await tryBeepLocalNotification('Serviço iniciado', 'Você iniciou o atendimento.');
        }
      }
    } catch (error: any) {
      console.error('Falha ao atualizar status do agendamento', error?.response?.data ?? error);
      toastUserError(error, 'Erro ao atualizar o status do agendamento');
    } finally {
      setSubmitting('NONE');
      }
  }, [arrive, booking, bookingId, fetchDetails, onTheWay, start]);
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
      setIsActionSyncing(true);
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
      setIsActionSyncing(false);
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

  const handleCheckinPhoto = useCallback(async () => {
    if (!bookingId) return;
    const cameraPermission = await ImagePicker.requestCameraPermissionsAsync();
    const libraryPermission = await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (cameraPermission.status !== 'granted' && libraryPermission.status !== 'granted') {
      NotificationUIService.showError('Conceda acesso Ã  cÃ¢mera ou galeria para enviar a foto.');
      return;
    }

    const launchPicker = async (source: 'camera' | 'library') => {
      setSubmitting('START');
      setProofSubmitting(true);
      try {
        const options = {
          mediaTypes: ImagePicker.MediaTypeOptions.Images,
          quality: 0.7,
          allowsEditing: false,
        };
        const result =
          source === 'camera'
            ? await ImagePicker.launchCameraAsync(options)
            : await ImagePicker.launchImageLibraryAsync(options);
        if (result.canceled || !result.assets?.length) {
          return;
        }
        const uri = result.assets[0].uri;
        const uploadResult = await verificationService.uploadImageToCloud(uri, 'documentFront');
        if (!uploadResult?.url) {
          throw new Error('NÃ£o foi possÃ­vel obter a URL do upload.');
        }
        await submitCheckinProof(bookingId, { photos: [uploadResult.url] });
        await fetchDetails({ showLoading: false });
        NotificationUIService.showSuccess('Foto enviada', 'Check-in registrado com sucesso.');
      } catch (error: any) {
        console.error('Erro no upload de check-in', error);
        toastUserError(error, 'Erro ao enviar a foto de check-in');
      } finally {
        setSubmitting('NONE');
        setProofSubmitting(false);
      }
    };

    Alert.alert('Enviar foto do local', 'Selecione a origem da imagem', [
      { text: 'Tirar foto', onPress: () => launchPicker('camera') },
      { text: 'Escolher da galeria', onPress: () => launchPicker('library') },
      { text: 'Cancelar', style: 'cancel' },
    ]);
  }, [bookingId, fetchDetails]);

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
      'Selecione uma opÃ§Ã£o:',
      [
        { text: 'Problema no endereÃ§o / cliente nÃ£o responde', onPress: () => NotificationUIService.showInfo('Avise o cliente pelo chat e registre o ocorrido.') },
        { text: 'Atraso / trÃ¢nsito', onPress: () => NotificationUIService.showInfo('Informe o cliente e ajuste o horÃ¡rio se preciso.') },
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
      `OlÃ¡, sou o prestador ${providerName} e preciso de ajuda com o agendamento #${booking.id}`,
    );
    const url = `https://wa.me/${WHATSAPP_NUMBER}?text=${message}`;
    Linking.openURL(url).catch(() => {
      NotificationUIService.showError('NÃ£o foi possÃ­vel abrir o WhatsApp.');
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
      {booking.status === BookingStatus.ON_THE_WAY && (
        <View style={styles.monitoringMessage}>
          <Text style={styles.monitoringMessageText}>
            Estamos monitorando seu deslocamento para garantir sua segurança.
          </Text>
        </View>
      )}
      {isInProgress ? (
        <View style={styles.dashboardWrapper}>
          <View style={[styles.card, styles.dashboardCardLayout]}>
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
        </View>
      ) : (
        <Animated.View style={[styles.card, { opacity: fade, transform: [{ translateY: slide }] }]}>
          <View style={styles.row}>
            <Ionicons name="calendar-outline" size={20} color={PRIMARY} style={styles.icon} />
            <Text style={styles.title}>{booking.serviceName}</Text>
          </View>
          <Text style={styles.muted}>Cliente: {booking.clientFullName}</Text>
          <Text style={styles.muted}>Data: {displayDateLabel} às {displayTimeLabel}</Text>
          {(terminationLabel || terminationDisplayDayjs) && (
            <Text style={styles.muted}>Término estimado: {terminationLabel ?? terminationDisplayDayjs?.format('HH:mm')}</Text>
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

          {booking.status === BookingStatus.CONFIRMED && !canStart && (
            <View style={[styles.banner, { backgroundColor: '#FEF3C7', borderColor: '#FDE68A' }]}>
              <Ionicons name="alert-circle-outline" size={16} color={WARNING} />
              <Text style={[styles.bannerText, { color: TEXT }]}>Aguardando janela de início</Text>
            </View>
          )}
          {booking.status === BookingStatus.ON_THE_WAY && (
            <View style={[styles.banner, { backgroundColor: '#E0F2FE', borderColor: '#7DD3FC' }]}>
              <Ionicons name="car-outline" size={16} color={PRIMARY} />
              <Text style={[styles.bannerText, { color: TEXT }]}>
                Trajeto em curso — boa viagem! Estamos monitorando seu deslocamento para garantir sua segurança.
              </Text>
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
      : 'Tempo estimado indisponÃ­vel';
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
          styles.dashboardButtonLift,
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
  container: {
    flex: 1,
    backgroundColor: BG,
    padding: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  containerCenter: { justifyContent: 'center', },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#f1f2f1', padding: 24, },
  loadingText: { marginTop: 12, color: MUTED },
  card: {
   
    
  },
  row: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  icon: { marginRight: 4 },
  title: {
    fontSize: Platform.OS === 'android' ? 17 : 18,
    fontWeight: Platform.OS === 'android' ? '700' : '600',
    color: TEXT,
  },
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
    paddingHorizontal: 16,
    paddingTop: 24,
    paddingBottom: 16,
  },
  dashboardCardLayout: {
    width: '100%',
    
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOpacity: 0.06,
        shadowOffset: { width: 0, height: 4 },
        shadowRadius: 10,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  dashboardContainer: {
    width: '100%',
    marginHorizontal: 30, 
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
    paddingVertical: 14,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  dashboardButtonLift: {
    marginTop: -14,
  },
  dashboardButtonActive: {
    backgroundColor: ACTIVE_BLUE,
  },
  dashboardButtonDisabled: {
    backgroundColor: '#CBD5F5',
  },
  dashboardButtonText: {
    fontSize: 15,
    paddingHorizontal: 15,
    paddingVertical: -4,
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
  monitoringMessage: {
    width: '100%',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#E0F2FE',
    borderRadius: 12,
    marginTop: 4,
    borderWidth: 1,
    borderColor: '#7DD3FC',
    alignItems: 'center',
    marginBottom: 20,
  },
  monitoringMessageText: {
    fontSize: 13,
    color: TEXT,
    textAlign: 'center',
    fontWeight: '600',
  },
});
