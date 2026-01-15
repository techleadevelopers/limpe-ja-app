import * as Sentry from '@sentry/react-native';
import Constants from 'expo-constants';
import * as Font from 'expo-font';
import { LinearGradient } from 'expo-linear-gradient';
import { Slot, SplashScreen, usePathname, useRouter, useSegments } from 'expo-router';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { I18nextProvider, useTranslation } from 'react-i18next';
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
} from 'react-native';
import 'react-native-reanimated';
import { SafeAreaProvider, useSafeAreaInsets } from 'react-native-safe-area-context';
import Toast from 'react-native-toast-message';
import AsyncStorage from '@react-native-async-storage/async-storage';
import PaymentConfirmedOverlay from "../components/global/PaymentConfirmedOverlay"; // 🔵 ADICIONADO
import AppQueryClientProvider from '../components/provider/query-client-provider';
import { toastConfig } from '../components/Toast';
import { AUTH_ROUTES, CLIENT_ROUTES, PROVIDER_ROUTES } from '../constants/routes';
import { AppProvider } from '../contexts/AppContext';
import { AuthProvider, useAuth } from '../contexts/AuthContext';
import { ProviderRegistrationProvider } from '../contexts/ProviderRegistrationContext';
import { OverlayPortal } from '../hooks/useOverlayMessage';
import { useBookingStatusMeta } from '../hooks/useBookingStatusMeta';
import i18n from '../i18n';
import { getBookingsForUser } from '../services/bookingService';
import NotificationUIService from '../services/notificationUIService';
import authService from '../services/authService';
import { acquireDevicePushToken, registerDevicePushToken } from '../services/pushService';
import { requestNotificationPermissions } from '../utils/permissions';
import { UserRole, VerificationStatus } from '../types/backend/auth';
import { useNotificationsSocket } from '../hooks/useNotificationsSocket';
import { BookingDetails, BookingStatus } from '../types/backend/bookings';
import { initializeObservability } from '../services/observability';
// Optional local notifications setup (Android channel) â€“ safe, no-op on iOS if unavailable
let setupNotificationsOnce: (() => Promise<void>) | null = (async () => {
  try {
    // dynamic import to avoid compile-time hard dependency
    const Notifications = (await import('expo-notifications')).default || (await import('expo-notifications'));
    if ((Notifications as any)?.setNotificationChannelAsync) {
      await (Notifications as any).setNotificationChannelAsync('high-priority', {
        name: 'High Priority',
        importance: (Notifications as any).AndroidImportance?.MAX ?? 5,
        sound: 'default',
        vibrationPattern: [0, 250, 250, 250],
        lockscreenVisibility: 1,
      });
    }
  } catch {}
  setupNotificationsOnce = null;
});

function parseDateTime(dateIso: string, timeHHmm: string): Date {
  try {
    const d = new Date(dateIso);
    if (Number.isNaN(d.getTime())) return new Date(NaN);
    const [hh, mm] = (timeHHmm || '00:00').split(':').map((n) => parseInt(n, 10));
    const dt = new Date(d);
    dt.setHours(hh || 0, mm || 0, 0, 0);
    return dt;
  } catch {
    return new Date(NaN);
  }
}

function minutesBetween(a: Date, b: Date): number {
  return Math.round((a.getTime() - b.getTime()) / 60000);
}

type NotificationData = Record<string, unknown>;

const AnimatedLinearGradient = Animated.createAnimatedComponent(LinearGradient as any);
const NOTIFICATION_PERMISSION_FLAG = 'notifications_permission_requested';

const safeParseNotificationPayload = (value?: unknown): NotificationData | undefined => {
  if (!value) return undefined;
  if (typeof value === 'string') {
    try {
      return JSON.parse(value);
    } catch {
      return undefined;
    }
  }
  if (typeof value === 'object') {
    return value as NotificationData;
  }
  return undefined;
};

const normalizeNotificationPayload = (payload?: NotificationData): NotificationData => {
  if (!payload) return {};
  const normalized: NotificationData = { ...payload };
  [
    safeParseNotificationPayload(payload.payload),
    safeParseNotificationPayload(payload.data),
    safeParseNotificationPayload((payload.appEvent as NotificationData | undefined)?.payload),
  ].forEach((entry) => {
    if (entry) {
      Object.assign(normalized, entry);
    }
  });
  return normalized;
};

const pickStringValue = (value?: unknown): string | undefined => {
  if (typeof value === 'string' && value.trim().length > 0) {
    return value.trim();
  }
  if (typeof value === 'number' && Number.isFinite(value)) {
    return String(value);
  }
  return undefined;
};

const getBookingIdFromPayload = (payload?: NotificationData): string | undefined => {
  const normalized = normalizeNotificationPayload(payload);
  const booking = normalized.booking as NotificationData | undefined;
  const candidates = [
    normalized.bookingId,
    normalized.booking_id,
    booking?.id,
    booking?._id,
    booking?.bookingId,
    booking?.booking_id,
  ];
  for (const candidate of candidates) {
    const value = pickStringValue(candidate);
    if (value) {
      return value;
    }
  }
  return undefined;
};

const getMissionIdFromPayload = (payload?: NotificationData): string | undefined => {
  const normalized = normalizeNotificationPayload(payload);
  const candidates = [
    normalized.missionId,
    normalized.mission_id,
    normalized.payload?.missionId,
    normalized.appEvent?.missionId,
  ];
  for (const candidate of candidates) {
    const value = pickStringValue(candidate);
    if (value) {
      return value;
    }
  }
  return undefined;
};

const getTypeFromPayload = (payload?: NotificationData): string | undefined => {
  const normalized = normalizeNotificationPayload(payload);
  const candidates = [
    normalized.type,
    normalized.notificationType,
    normalized.payloadType,
    (payload?.appEvent as NotificationData | undefined)?.type,
  ];
  for (const candidate of candidates) {
    const value = pickStringValue(candidate);
    if (value) {
      return value.toUpperCase();
    }
  }
  return undefined;
};

const getStatusFromPayload = (payload?: NotificationData): string | undefined => {
  const normalized = normalizeNotificationPayload(payload);
  const candidates = [
    normalized.status,
    normalized.booking?.status,
    normalized.payload?.status,
    (payload?.appEvent as NotificationData | undefined)?.status,
  ];
  for (const candidate of candidates) {
    const value = pickStringValue(candidate);
    if (value) {
      return value.toUpperCase();
    }
  }
  return undefined;
};

const getPaymentStatusFromPayload = (payload?: NotificationData): string | undefined => {
  const normalized = normalizeNotificationPayload(payload);
  const candidates = [
    normalized.paymentStatus,
    normalized.payload?.paymentStatus,
    normalized.data?.paymentStatus,
    (payload?.appEvent as NotificationData | undefined)?.paymentStatus,
  ];
  for (const candidate of candidates) {
    const value = pickStringValue(candidate);
    if (value) {
      return value.toUpperCase();
    }
  }
  return undefined;
};

function FloatingActiveServicePill({
    enabled,
}: {
    enabled: boolean;
}): React.ReactElement | null {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { statusMap } = useBookingStatusMeta();
  const [booking, setBooking] = React.useState<BookingDetails | null>(null);
  const [timeLabel, setTimeLabel] = React.useState<string>('');
  const [hidden, setHidden] = React.useState<boolean>(false);

  const reflectionX = React.useRef(new Animated.Value(-80)).current;
  const tremble = React.useRef(new Animated.Value(0)).current;
  const scale = React.useRef(new Animated.Value(1)).current;

  const fetchActiveCandidate = React.useCallback(async () => {
    try {
      const list = await getBookingsForUser();
      const now = new Date();
      let candidate: BookingDetails | null = null;
      const actionCandidate = list.find((b) =>
        b.allowedActions?.some((action) =>
          ['START_SERVICE', 'COMPLETE_SERVICE'].includes(action),
        ),
      );
      if (actionCandidate) {
        candidate = actionCandidate;
      }
      if (!candidate) {
        const actionableStatuses = [
          BookingStatus.CONFIRMED,
          BookingStatus.ON_THE_WAY,
          BookingStatus.ARRIVED,
          BookingStatus.STARTED,
        ];
        const fallback = list.filter((b) => {
          const meta = statusMap[b.status];
          if (meta) return meta.requiresAction;
          return actionableStatuses.includes(b.status);
        });
        const nextStarted = fallback.find((b) => b.status === BookingStatus.STARTED);
        if (nextStarted) {
          candidate = nextStarted;
        }
        if (!candidate) {
          const confirmed = fallback.filter((b) => b.status === BookingStatus.CONFIRMED);
          for (const b of confirmed) {
            const start = parseDateTime(b.scheduledDate, b.scheduledTime);
            if (Number.isNaN(start.getTime())) continue;
            const diff = minutesBetween(start, now);
            if (diff <= 10 && diff >= -120) {
              candidate = b;
              break;
            }
          }
        }
      }
      if (candidate) {
        setBooking(candidate);
        setTimeLabel(candidate.scheduledTime?.slice(0,5) || '');
      } else {
        setBooking(null);
      }
    } catch {}
  }, [statusMap]);


  React.useEffect(() => {
    if (!enabled) return;
    fetchActiveCandidate();
    const id = setInterval(fetchActiveCandidate, 60_000);
    return () => clearInterval(id);
  }, [enabled, fetchActiveCandidate]);

  React.useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(reflectionX, { toValue: 140, duration: 1600, useNativeDriver: true }),
        Animated.timing(reflectionX, { toValue: -80, duration: 0, useNativeDriver: true }),
      ])
    ).start();
  }, [reflectionX]);

  React.useEffect(() => {
    if (booking) {
      setHidden(false);
    }
  }, [booking?.id]);

  const onPressIn = () => {
    Animated.parallel([
      Animated.spring(scale, { toValue: 0.97, useNativeDriver: true }),
      Animated.sequence([
        Animated.timing(tremble, { toValue: 1, duration: 40, useNativeDriver: true }),
        Animated.timing(tremble, { toValue: -1, duration: 40, useNativeDriver: true }),
        Animated.timing(tremble, { toValue: 0, duration: 40, useNativeDriver: true }),
      ]),
    ]).start();
  };

  const onPressOut = () => {
    Animated.spring(scale, { toValue: 1, friction: 4, tension: 50, useNativeDriver: true }).start();
  };

  if (!enabled || !booking || hidden) return null;

  const isStarted = booking.status === BookingStatus.STARTED;
  const cta = isStarted ? 'Finalizar' : 'Iniciar';
  const rotate = tremble.interpolate({ inputRange: [-1, 1], outputRange: ['-0.5deg', '0.5deg'] });

  return (
    <Animated.View
      style={{
        position: 'absolute',
        right: 16,
        bottom: (insets?.bottom || 0) + 18,
        transform: [{ scale }, { rotate }],
        zIndex: 40,
      }}
    >
      <TouchableOpacity
        activeOpacity={0.95}
        onPressIn={onPressIn}
        onPressOut={onPressOut}
        onPress={() => router.push(`/provider/active-booking/${booking.id}` as any)}
        accessibilityRole="button"
        accessibilityLabel={`${cta} serviço`}
        style={{ borderRadius: 999 }}
      >
        <LinearGradient
          colors={['#4F8BFF', '#2F6BFF']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={{
            paddingVertical: 12,
            paddingHorizontal: 14,
            borderRadius: 999,
            minWidth: 200,
            overflow: 'hidden',
            ...Platform.select({
              ios: { shadowColor: '#000', shadowOpacity: 0.12, shadowOffset: { width: 0, height: 6 }, shadowRadius: 12 },
              android: { elevation: 0, shadowColor: 'rgba(0,0,0,0.08)' },
            }),
          }}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <Text style={{ color: '#fff', fontWeight: '700' }}>{`Serviço às ${timeLabel}`}</Text>
            <Text style={{ color: '#DCE7FF', marginLeft: 8, fontWeight: '600' }}>{`• ${cta}`}</Text>
            
          </View>
          <AnimatedLinearGradient
            colors={['rgba(255,255,255,0.0)', 'rgba(255,255,255,0.25)', 'rgba(255,255,255,0.0)']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={{
              position: 'absolute',
              top: 0,
              bottom: 0,
              width: 60,
              transform: [{ translateX: reflectionX }],
            }}
          />
        </LinearGradient>
      </TouchableOpacity>
      <TouchableOpacity
        onPress={() => setHidden(true)}
        accessibilityLabel="Fechar atalho de serviço ativo"
        accessibilityRole="button"
        style={{
          position: 'absolute',
          top: -6,
          right: -6,
          width: 22,
          height: 22,
          borderRadius: 11,
          backgroundColor: 'rgba(0,0,0,0.15)',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Text style={{ color: '#fff', fontSize: 12, fontWeight: '700' }}>×</Text>
      </TouchableOpacity>
    </Animated.View>
  );
}

initializeObservability();

SplashScreen.preventAutoHideAsync();


const QA_PANEL_ENABLED = typeof __DEV__ !== 'undefined' && __DEV__
  ? true
  : process.env.EXPO_PUBLIC_ENABLE_QA_PANEL === 'true';

const PENDING_PAYMENT_KEY = 'pending_payment';

function RootLayoutContent() {
    const { isAuthenticated, isLoading: authIsLoading, user, token } = useAuth();
    const router = useRouter();
    const segments = useSegments();
    const { paymentOverlayVisible } = useAuth();  // 🔵 ADICIONADO
    const pathname = usePathname();
    const { t } = useTranslation();
    const lastPushTokenRef = useRef<string | null>(null);
    const [notificationPermissionRequested, setNotificationPermissionRequested] = useState(false);
    const registerPushToken = useCallback(
        async (token?: string) => {
            if (!isAuthenticated) {
                return;
            }
            try {
                const resolvedToken = token ?? (await acquireDevicePushToken());
                if (!resolvedToken) {
                    return;
                }
                if (lastPushTokenRef.current === resolvedToken) {
                    return;
                }
                lastPushTokenRef.current = resolvedToken;
                await authService.updateFcmToken(resolvedToken);
                registerDevicePushToken(resolvedToken).catch(() => {});
            } catch (error) {
                if (__DEV__) {
                    console.warn('[RootLayout] Falha ao registrar token de push:', error);
                }
            }
        },
        [isAuthenticated],
    );
    const playSecurityAlarm = useCallback(async () => {
        try {
            const { Audio } = await import('expo-av');
            const sound = new Audio.Sound();
            await sound.loadAsync(require('../assets/sounds/new-booking.mp3'));
            await sound.playAsync();
            sound.setOnPlaybackStatusUpdate((status: any) => {
                if (status?.didJustFinish) {
                    sound.unloadAsync().catch(() => {});
                }
            });
        } catch (error) {
            if (__DEV__) {
                console.warn('[RootLayout] Falha ao tocar alerta de seguran�a:', error);
            }
        }
    }, []);
    const handleNotificationDeepLink = useCallback(
        (payload?: NotificationData): boolean => {
            if (!payload) {
                return false;
            }
            const bookingId = getBookingIdFromPayload(payload);
            const missionId = getMissionIdFromPayload(payload);
            const type = getTypeFromPayload(payload);
            const status = getStatusFromPayload(payload);
            const paymentStatus = getPaymentStatusFromPayload(payload);
            const title =
                pickStringValue(payload.title ?? payload.appEvent?.title) ??
                t('common.notification', { defaultValue: 'Notifica��o' });
            const message =
                pickStringValue(payload.message ?? payload.body) ??
                t('common.notification_received', { defaultValue: 'Voc� recebeu uma nova notifica��o.' });
            if (type === 'PANIC_ALERT') {
                NotificationUIService.showError(message, title);
                if (user?.role === UserRole.ADMIN) {
                    playSecurityAlarm();
                    router.push('/common/safety/panic' as any);
                }
                return true;
            }
            if (bookingId && (status === BookingStatus.STARTED || type === 'STARTED')) {
                router.push(CLIENT_ROUTES.BOOKING_DETAILS(bookingId) as any);
                return true;
            }
            if (bookingId && type?.includes('PROOF')) {
                router.push({
                    pathname: CLIENT_ROUTES.BOOKING_DETAILS(bookingId),
                    params: { highlight: 'proofs' },
                } as any);
                NotificationUIService.showInfo(
                    message || t('notifications.proof_sent', { defaultValue: 'Fotos do servi�o enviadas.' }),
                    title || t('notifications.proof', { defaultValue: 'Comprovantes' }),
                );
                return true;
            }
            if (missionId) {
                router.push({
                    pathname: CLIENT_ROUTES.MISSIONS,
                    params: { focus: 'confetti' },
                } as any);
                NotificationUIService.showSuccess(
                    message || t('missions.completed', { defaultValue: 'Miss�o conclu�da!' }),
                    title || t('missions.missions', { defaultValue: 'Miss�es' }),
                );
                return true;
            }
            if (bookingId && paymentStatus === 'FAILED') {
                router.push({
                    pathname: CLIENT_ROUTES.BOOKING_DETAILS(bookingId),
                    params: { highlight: 'payment' },
                } as any);
                NotificationUIService.showError(
                    message || t('payments.failed', { defaultValue: 'Pagamento falhou.' }),
                    title || t('payments.payment', { defaultValue: 'Pagamento' }),
                );
                return true;
            }
            return false;
        },
        [router, user?.role, playSecurityAlarm, t],
    );
    const handleForegroundNotification = useCallback(
        (notification?: any) => {
            const payload = notification?.request?.content?.data ?? {};
            const type = getTypeFromPayload(payload);
            const title =
                pickStringValue(payload.title) ??
                notification?.request?.content?.title ??
                t('common.notification', { defaultValue: 'Notifica��o' });
            const body =
                pickStringValue(payload.message ?? notification?.request?.content?.body) ??
                t('common.notification_received', { defaultValue: 'Voc� recebeu uma nova atualiza��o.' });
            if (type === 'PANIC_ALERT') {
                NotificationUIService.showError(body, title);
                if (user?.role === UserRole.ADMIN) {
                    playSecurityAlarm();
                    handleNotificationDeepLink(payload);
                }
                return;
            }
            NotificationUIService.showInfo(body, title);
        },
        [handleNotificationDeepLink, playSecurityAlarm, t, user?.role],
    );
    const [appReady, setAppReady] = useState(false);
    const [initializationError, setInitializationError] = useState<string | null>(null);

    const navigatePendingPayment = useCallback(async () => {
        if (!appReady || !isAuthenticated || user?.role !== UserRole.CLIENT) {
            return false;
        }
        try {
            const payload = await AsyncStorage.getItem(PENDING_PAYMENT_KEY);
            if (!payload) {
                return false;
            }
            const parsed = JSON.parse(payload) as { bookingId?: string };
            const bookingId = parsed?.bookingId;
            if (!bookingId) {
                await AsyncStorage.removeItem(PENDING_PAYMENT_KEY);
                return false;
            }
            router.replace({
                pathname: '/client/bookings/success',
                params: {
                    bookingId,
                    paymentMethod: 'PIX',
                },
            } as any);
            return true;
        } catch {
            return false;
        }
    }, [appReady, isAuthenticated, router, user?.role]);

    // ativa o socket de notificações somente quando o app estiver pronto e o token disponível,
    // evitando chamadas de overlay enquanto o layout inicial ainda está escondido.
    useNotificationsSocket(appReady ? token : null);
    // one-time local notifications channel (Android). Harmless on iOS.
    useEffect(() => { if (setupNotificationsOnce) { setupNotificationsOnce(); } }, []);
    useEffect(() => {
        if (!appReady || !isAuthenticated || notificationPermissionRequested) {
            return;
        }
        let cancelled = false;
        (async () => {
            try {
                const stored = await AsyncStorage.getItem(NOTIFICATION_PERMISSION_FLAG);
                if (stored === '1') {
                    await registerPushToken();
                } else {
                    const granted = await requestNotificationPermissions();
                    if (granted) {
                        await registerPushToken();
                    }
                }
            } catch (error) {
                if (__DEV__) {
                    console.warn('[RootLayout] Falha ao solicitar permissoes de notificacao:', error);
                }
            } finally {
                if (!cancelled) {
                    setNotificationPermissionRequested(true);
                }
                try {
                    await AsyncStorage.setItem(NOTIFICATION_PERMISSION_FLAG, '1');
                } catch {
                    // ignore
                }
            }
        })();
        return () => { cancelled = true; };
    }, [appReady, isAuthenticated, notificationPermissionRequested, registerPushToken]);
    useEffect(() => {
        if (!appReady || !isAuthenticated) {
            return;
        }
        let sub: any;
        (async () => {
            try {
                const Notifications = (await import('expo-notifications')).default || (await import('expo-notifications'));
                sub = Notifications.addDevicePushTokenListener((event: any) => {
                    const token = event?.data;
                    if (typeof token === 'string' && token) {
                        registerPushToken(token);
                    }
                });
            } catch {}
        })();
        return () => {
            try {
                sub?.remove?.();
            } catch {}
        };
    }, [appReady, isAuthenticated, registerPushToken]);

    useEffect(() => {
        let sub: any;
        (async () => {
            try {
                const Notifications = (await import('expo-notifications')).default || (await import('expo-notifications'));
                sub = Notifications.addNotificationReceivedListener((notification: any) => {
                    handleForegroundNotification(notification);
                });
            } catch {}
        })();
        return () => {
            try {
                sub?.remove?.();
            } catch {}
        };
    }, [handleForegroundNotification]);

    // Deep-link handler for notification taps (local or push)
    const navigateFromChatNotification = useCallback(
        (payload: Record<string, any> | undefined) => {
            if (!payload) return false;
            const normalize = (value: unknown): Record<string, unknown> | undefined => {
                if (!value) return undefined;
                if (typeof value === 'string') {
                    try {
                        return JSON.parse(value);
                    } catch {
                        return undefined;
                    }
                }
                if (typeof value === 'object') return value as Record<string, unknown>;
                return undefined;
            };
            const chatPayload = normalize(payload.payload);
            const type =
                payload.type ??
                chatPayload?.type ??
                payload?.appEvent?.type ??
                payload?.notificationType;
            const chatId =
                chatPayload?.chatId ??
                payload.chatId ??
                chatPayload?.chat_id ??
                payload.chat_id;
            if (type !== 'CHAT_MESSAGE' || !chatId) return false;
            const recipientId =
                chatPayload?.senderId ??
                chatPayload?.sender_id ??
                payload.senderId ??
                payload.sender_id;
            const recipientName =
                chatPayload?.senderFullName ??
                chatPayload?.sender_name ??
                chatPayload?.providerFullName ??
                chatPayload?.clientFullName ??
                '';
            const recipientAvatarUrl =
                chatPayload?.senderAvatarUrl ??
                chatPayload?.sender_avatar_url ??
                chatPayload?.providerAvatarUrl ??
                chatPayload?.clientAvatarUrl;
            const bookingId =
                chatPayload?.bookingId ??
                chatPayload?.booking_id ??
                payload.bookingId ??
                payload.booking_id;

            const destination =
                user?.role === UserRole.PROVIDER
                    ? PROVIDER_ROUTES.PROVIDER_CHAT(chatId)
                    : CLIENT_ROUTES.CHAT(chatId);

            (router as any)?.push?.({
                pathname: destination,
                params: {
                    chatId,
                    recipientId,
                    recipientName: recipientName || undefined,
                    recipientAvatarUrl,
                    bookingId,
                },
            } as any);
            return true;
        },
        [router, user?.role],
    );

    useEffect(() => {
        let sub: any;
        (async () => {
            try {
                const Notifications =
                    (await import('expo-notifications')).default ||
                    (await import('expo-notifications'));
                sub = (Notifications as any).addNotificationResponseReceivedListener?.(
                    (response: any) => {
                        try {
                            const payload = response?.notification?.request?.content?.data ?? {};
                            if (navigateFromChatNotification(payload)) {
                                return;
                            }
                            if (handleNotificationDeepLink(payload)) {
                                return;
                            }
                            const url = (
                                payload?.appEvent?.targetUrl ??
                                payload?.url ??
                                payload?.deeplink
                            ) as string | undefined;
                            if (url && typeof url === 'string') {
                                (router as any)?.push?.(url);
                            }
                        } catch {}
                    },
                );
            } catch {}
        })();
        return () => {
            try {
                sub?.remove?.();
            } catch {}
        };
    }, [router, navigateFromChatNotification, handleNotificationDeepLink]);

    useEffect(() => {
        const prepareApp = async () => {
            // Removido: console.log('[RootLayoutContent | prepareApp] Iniciando processo de preparação do aplicativo.');
            try {
                await Font.loadAsync({
                    'Montserrat-Regular': require('../assets/fonts/Montserrat-Regular.ttf'),
                    'Montserrat-Thin': require('../assets/fonts/Montserrat-Thin.ttf'),
                });
                // Removido: console.log('[RootLayoutContent | prepareApp] Fontes essenciais carregadas e inicialização básica concluída.');
            } catch (e: any) {
                // Removido: console.error('[RootLayoutContent | prepareApp] ERRO FATAL durante a inicialização do aplicativo:', e);
                setInitializationError(e?.message ?? 'Erro desconhecido na inicialização.');
                try {
                    NotificationUIService.showError(t("common.generic_error"), t("common.error"));
                } catch {
                    // Removido: console.warn('[RootLayoutContent] NotificationUIService.showError falhou:', err);
                }
            } finally {
                setAppReady(true);
                if (!initializationError) {
                    try {
                        await SplashScreen.hideAsync();
                        // Removido: console.log('[RootLayoutContent | prepareApp] Splash screen nativa oculta. Aplicativo pronto para roteamento.');
                    } catch {
                        // Removido: console.warn('[RootLayoutContent | prepareApp] Falha ao esconder splash:', e);
                    }
                }
            }
        };
        prepareApp();
    }, [t, initializationError]);

    useEffect(() => {
        if (!appReady || Platform.OS !== 'android') {
            return;
        }

        const existingDefaultProps = (Text as any).defaultProps || {};
        const existingStyle = existingDefaultProps.style;
        const baseStyleArray = existingStyle
            ? Array.isArray(existingStyle)
                ? existingStyle
                : [existingStyle]
            : [];

        (Text as any).defaultProps = {
            ...existingDefaultProps,
            allowFontScaling: false,
            style: [
                ...baseStyleArray,
                {
                    includeFontPadding: false,
                    textAlignVertical: 'center',
                    fontFamily: 'Montserrat-Regular',
                },
            ],
        };
    }, [appReady]);

    useEffect(() => {
        // Removido: Todo o bloco de console.groupCollapsed e logs verbosos para evitar erro no LogBox.
        // Se precisar debugar, adicione de volta com if (__DEV__) para modo dev apenas.
        // Exemplo de log mínimo mantido só para erros:
        if (initializationError) {
            console.error(`[RootLayoutContent] Erro de inicialização: ${initializationError}`);
            return;
        }

        if (!appReady || authIsLoading || (isAuthenticated && !user?.role && !user?.clientDetails && !user?.providerDetails)) {
            // Removido: console.warn de saída antecipada.
            return;
        }

        // Removido: console.log de estado pronto.

        const normalizePath = (path: string | undefined | null) => {
            if (typeof path !== 'string') {
                return '';
            }
            let p = path.trim();
            if (p.endsWith('/') && p.length > 1 && !/\/\(\w+\)\/$/.test(p)) {
                p = p.slice(0, -1);
            }
            return p;
        };
        const cleanedCurrentPath = normalizePath(pathname);
        const isPathOrChild = (basePath: string, currentPath: string) => {
            const base = normalizePath(basePath);
            const cur = normalizePath(currentPath);
            if (!base) return false;
            return cur === base || cur.startsWith(base + '/');
        };
        const authServiceDetailsStep = normalizePath(AUTH_ROUTES.SERVICE_DETAILS_STEP);
        const providerRegistrationVerifyAccountPath = normalizePath(AUTH_ROUTES.VERIFY_ACCOUNT_STEP);

        const decideAndRedirect = async () => {
            const path = pathname ?? '';
            const isFeedbackRoute = isPathOrChild('/common/feedback', normalizePath(path));

            if (await navigatePendingPayment()) {
                return;
            }

            const normalizedPath = normalizePath(path);
            if (QA_PANEL_ENABLED && normalizedPath === '/dev-panel') {
                return;
            }
            // Permitir HOME/Explore (e filhas) para guest sem redirecionar de volta para /register-options
            if (!isAuthenticated && (path.includes('/client/explore') || path.startsWith('/explore'))) {
                return;
            }
            const registerOptionsPath = '/auth/register-options';
            const inAuthGroup = segments[0] === 'auth';
            const inProviderGroup = segments[0] === 'provider';
            const isRegisterRoute = pathname === registerOptionsPath;

            // Guest: regras específicas de acesso (cadastro obrigatório em rotas protegidas)
            if (!isAuthenticated) {
                const protectedRoutes = [
                    '/client/bookings',
                    '/client/messages',
                    '/client/profile',
                    '/provider',
                    '/bookings',
                    '/messages',
                ];

                const isProtected =
                    protectedRoutes.some((r) => path.startsWith(r)) || path.includes('/agendar');

                if (isProtected) {
                    // Ação protegida em modo guest: alerta nativo e navegação para cadastro de cliente
                    Alert.alert(
                        'Cadastro necessário',
                        'Crie seu cadastro para agendar serviços de limpeza',
                        [
                            {
                                text: 'Continuar',
                                onPress: () => {
                                    try {
                                        router.push('/auth/client-register' as any);
                                    } catch {}
                                },
                            },
                            {
                                text: 'Cancelar',
                                style: 'cancel',
                            },
                        ],
                    );
                    return;
                }

                // Visitante só pode acessar: register-options, rotas de auth e explore
                if (!isRegisterRoute && !inAuthGroup && !path.startsWith('/client/explore') && !isFeedbackRoute) {
                    router.replace(registerOptionsPath as any);
                    return;
                }

                return;
            }

            const isBookingOrChat =
                path.startsWith('/client/bookings') ||
                path.startsWith('/bookings') ||
                path.startsWith('/client/messages') ||
                path.startsWith('/messages');

            if (isBookingOrChat) {
                // Removido: console.log de rota de booking/chat.
                return;
            }

            if (isAuthenticated && user?.role === UserRole.PROVIDER && inProviderGroup) {
                // Removido: console.log de provedor no grupo.
                return;
            }

            if (!isAuthenticated) {
                if (!inAuthGroup && !isRegisterRoute) {
                    // Removido: console.log de redirecionamento para /welcome.
                    router.replace(registerOptionsPath as any);
                    return;
                }
                // Removido: console.log de permanÃªncia em rota pÃºblica.
                return;
            }

            if (user?.role === UserRole.PROVIDER) {
                const verificationStatus = user?.providerDetails?.verificationStatus;
                const isApproved = verificationStatus === VerificationStatus.APPROVED;
                const isPendingInitialReview = verificationStatus === VerificationStatus.PENDING_INITIAL_REVIEW;
                const isPendingDocsUpload =
                    verificationStatus === VerificationStatus.PENDING_DOCUMENTS_UPLOAD ||
                    verificationStatus === VerificationStatus.PENDING_MANUAL_REVIEW;

                if (isApproved) {
                    const targetDashboardPath = normalizePath(PROVIDER_ROUTES.DASHBOARD);
                    const isAllowedProviderRoute =
                        cleanedCurrentPath === targetDashboardPath ||
                        isPathOrChild(PROVIDER_ROUTES.EARNINGS, cleanedCurrentPath) ||
                        isPathOrChild(PROVIDER_ROUTES.MESSAGES_LIST, cleanedCurrentPath) ||
                        isPathOrChild(PROVIDER_ROUTES.PROFILE, cleanedCurrentPath) ||
                        isPathOrChild(PROVIDER_ROUTES.SERVICES_LIST, cleanedCurrentPath) ||
                        isPathOrChild(PROVIDER_ROUTES.ACTIVE_BOOKING, cleanedCurrentPath) ||
                        isPathOrChild(PROVIDER_ROUTES.SCHEDULE, cleanedCurrentPath) ||
                        isPathOrChild(PROVIDER_ROUTES.WITHDRAW, cleanedCurrentPath) ||
                        isPathOrChild(PROVIDER_ROUTES.REVIEWS, cleanedCurrentPath);

                    if (!isAllowedProviderRoute) {
                        // Removido: console.log de redirecionamento para Dashboard.
                        router.replace(targetDashboardPath as any);
                    }
                } else if (isPendingInitialReview) {
                    if (cleanedCurrentPath !== authServiceDetailsStep) {
                        // Removido: console.log de redirecionamento para detalhes do serviço.
                        router.replace(authServiceDetailsStep as any);
                    }
                } else if (isPendingDocsUpload) {
                    if (cleanedCurrentPath !== providerRegistrationVerifyAccountPath) {
                        // Removido: console.log de redirecionamento para verificação de docs.
                        router.replace(providerRegistrationVerifyAccountPath as any);
                    }
                } else {
                    // Removido: console.log de status inesperado.
                    if (cleanedCurrentPath !== providerRegistrationVerifyAccountPath) {
                        router.replace(providerRegistrationVerifyAccountPath as any);
                    }
                }
                return;
            }

            if (user?.role && (user.role === UserRole.ADMIN || user.role === UserRole.CLIENT)) {
                const targetRoute = normalizePath(CLIENT_ROUTES.EXPLORE);
                const isCurrentPathInClientGroup = segments[0] === 'client';

                if (isFeedbackRoute) {
                    return;
                }

                if (cleanedCurrentPath !== targetRoute && !isCurrentPathInClientGroup) {
                    // Removido: console.log de redirecionamento para explore.
                    router.replace(targetRoute as any);
                }
                return;
            }

            // Removido: console.log de nenhuma ação necessária.
        };

        decideAndRedirect();
    }, [isAuthenticated, user, authIsLoading, router, segments, pathname, appReady, initializationError, navigatePendingPayment]);

    if (!appReady || authIsLoading || initializationError) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#007AFF" />
                {initializationError ? (
                    <Text style={styles.loadingText}>{t("common.error")}: {initializationError}</Text>
                ) : (
                    <Text style={styles.loadingText}>{t("common.loading")}</Text>
                )}
            </View>
        );
    }

    // Envolver em uma View root para reduzir chances do devtools injetar strings no nÃ­vel superior
    try {
        return (
            <View style={{ flex: 1 }}>
                <Slot />
                <PaymentConfirmedOverlay visible={paymentOverlayVisible} />
                {/* Pílula flutuante global (sem banner no dashboard) */}
                {user?.role === UserRole.PROVIDER && (
                  <FloatingActiveServicePill enabled={true} />
                )}
                {/* Proteções simples: só renderizar OverlayPortal/Toast se existirem */}
                <OverlayPortal />
                <Toast config={toastConfig} />
            </View>
        );
    } catch (renderErr) {
        // Evitar que uma string de erro venha a ser renderizada fora de <Text> pelo LogBox
        // Removido: console.error para evitar loop de logs.
        return (
            <View style={styles.loadingContainer}>
                <Text style={styles.loadingText}>{t("common.error")}: {(renderErr as any)?.message ?? String(renderErr)}</Text>

            </View>
        );
    }
}

export default Sentry.wrap(function RootLayout() {
    return (
        <I18nextProvider i18n={i18n}>
            <SafeAreaProvider>
                <AuthProvider>
                    <ProviderRegistrationProvider>
                        <AppQueryClientProvider>
                            <AppProvider>
                                <RootLayoutContent />
                            </AppProvider>
                        </AppQueryClientProvider>
                    </ProviderRegistrationProvider>
                </AuthProvider>
            </SafeAreaProvider>
        </I18nextProvider>
    );
});

const styles = StyleSheet.create({
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#FFFFFF',
    },
    loadingText: {
        marginTop: 10,
        fontSize: 16,
        color: '#333333',
    },
    toastContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#4CAF50',
        borderRadius: 8,
        padding: 10,
        minHeight: 60,
    },
    toastImage: {
        width: 36,
        height: 36,
        marginRight: 10,
        resizeMode: 'contain',
    },
    toastTitle: {
        color: '#fff',
        fontWeight: 'bold',
        fontSize: 15,
    },
    toastSubtitle: {
        color: '#fff',
        fontSize: 13,
    },
});

