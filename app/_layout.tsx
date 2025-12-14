import { Slot, SplashScreen, usePathname, useRouter, useSegments } from 'expo-router';
import React, { useEffect, useState, useRef } from 'react';
import {
    ActivityIndicator,
    StyleSheet,
    Text,
    View,
    Image,
    Animated,
    TouchableOpacity,
    Platform,
    Alert,
} from 'react-native';
import { LogBox } from 'react-native'; // âœ… ADICIONADO: Para ignorar o warning especÃ­fico do LogBox (dev mode apenas)
import 'react-native-reanimated';
import { io } from 'socket.io-client';
import Constants from 'expo-constants';
import { AppProvider } from '../contexts/AppContext';
import PaymentConfirmedOverlay from "../components/global/PaymentConfirmedOverlay";  // 🔵 ADICIONADO
import { AuthProvider, useAuth } from '../contexts/AuthContext';
import { ProviderRegistrationProvider } from '../contexts/ProviderRegistrationContext';
import { AUTH_ROUTES, CLIENT_ROUTES, PROVIDER_ROUTES } from '../constants/routes';
import { UserRole, VerificationStatus } from '../types/backend/auth';
import * as Sentry from '@sentry/react-native';
import Toast from 'react-native-toast-message';
import { toastConfig } from '../components/Toast';
import i18n from '../i18n';
import { I18nextProvider, useTranslation } from 'react-i18next';
import { OverlayPortal } from '../hooks/useOverlayMessage';
import * as Font from 'expo-font';
import NotificationUIService from '../services/notificationUIService';
import AppQueryClientProvider from '../components/provider/query-client-provider';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { getBookingsForUser } from '../services/bookingService';
import { BookingDetails, BookingStatus } from '../types/backend/bookings';
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

const AnimatedLinearGradient = Animated.createAnimatedComponent(LinearGradient as any);

function FloatingActiveServicePill({ enabled }: { enabled: boolean }) {
  const insets = useSafeAreaInsets();
  const router = useRouter();
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
      const inProgress = list.find((b) => b.status === BookingStatus.IN_PROGRESS);
      if (inProgress) candidate = inProgress;
      if (!candidate) {
        const candidates = list.filter((b) => b.status === BookingStatus.CONFIRMED);
        for (const b of candidates) {
          const start = parseDateTime(b.scheduledDate, b.scheduledTime);
          if (Number.isNaN(start.getTime())) continue;
          const diff = minutesBetween(start, now);
          if (diff <= 10 && diff >= -120) { // 10 min antes atÃ© 120 min depois
            candidate = b;
            break;
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
  }, []);

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

  const isInProgress = booking.status === BookingStatus.IN_PROGRESS;
  const cta = isInProgress ? 'Finalizar' : 'Iniciar';
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
        onPress={() => router.push(`/(provider)/active-booking/${booking.id}` as any)}
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
              android: { elevation: 3, shadowColor: 'rgba(0,0,0,0.08)' },
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

// ✓ SOLUÇÃO GLOBAL: Ignora só o warning específico do LogBox (dev mode apenas; não afeta produção ou outros erros)
LogBox.ignoreLogs(['Text strings must be rendered within a <Text>']);

Sentry.init({
    dsn: 'https://947962edb662e5ff655cbcd778ee13b6@o4509792415252480.ingest.us.sentry.io/4509792431898624',
    sendDefaultPii: true,
    replaysSessionSampleRate: 0.1,
    replaysOnErrorSampleRate: 1,
    integrations: [Sentry.mobileReplayIntegration(), Sentry.feedbackIntegration()],
});

SplashScreen.preventAutoHideAsync();

function resolveSocketUrl() {
    const envUrl = (globalThis as any)?.EXPO_PUBLIC_WS_URL
        || (typeof process !== 'undefined' ? process.env?.EXPO_PUBLIC_WS_URL : undefined)
        || (Constants.expoConfig?.extra as any)?.wsUrl
        || (Constants.expoConfig?.extra as any)?.backendWsUrl;
    if (envUrl) {
        return envUrl;
    }
    const apiUrl = (Constants.expoConfig?.extra as any)?.backendApiUrl || '';
    if (typeof apiUrl === 'string' && apiUrl.startsWith('http')) {
        return apiUrl.replace(/^http/, 'ws');
    }
    return 'ws://localhost:3000';
}

function useNotificationsSocket(authToken?: string | null) {
    const isPlayingRef = useRef(false);

    const playAlertSound = async () => {
        if (isPlayingRef.current) return;
        isPlayingRef.current = true;
        try {
            const ExpoAV = await import('expo-av');
            const { Audio } = ExpoAV;
            const sound = new Audio.Sound();
            await sound.loadAsync(require('../assets/sounds/new-booking.mp3'));
            let plays = 0;
            await sound.playAsync();
            sound.setOnPlaybackStatusUpdate((status: any) => {
                if (status?.isLoaded && status.didJustFinish) {
                    plays += 1;
                    if (plays < 3) {
                        sound.replayAsync().catch(() => {
                            isPlayingRef.current = false;
                            sound.unloadAsync().catch(() => {});
                        });
                    } else {
                        sound.unloadAsync().catch(() => {});
                        isPlayingRef.current = false;
                    }
                }
            });
        } catch (err) {
            console.warn('[notifications socket] failed to play mp3 sound:', err);
            isPlayingRef.current = false;
        }
    };

    useEffect(() => {
        if (!authToken) {
            return;
        }

        const socket = io(resolveSocketUrl(), {
            auth: { token: authToken },
            transports: ['websocket'],
        });

        socket.on('notification', async (payload: any) => {
            const title = payload?.title ?? 'Notificacao';
            const message = payload?.message ?? 'Voce tem uma nova notificacao.';
            NotificationUIService.showInfo(message, title);

            // Beep para servico/agendamento (prestador): notificacao local com som padrao + mp3 no foreground.
            const kind = (payload?.type || payload?.category || '').toString().toLowerCase();
            const isService =
                kind.includes('service') ||
                kind.includes('servico') ||
                kind.includes('agendamento') ||
                kind.includes('booking');
            if (isService) {
                try {
                    // Dispara notificação local com som default (background/foreground).
                    const Notifications =
                        (await import('expo-notifications')).default || (await import('expo-notifications'));
                    await (Notifications as any)?.scheduleNotificationAsync?.({
                        content: {
                            title,
                            body: message,
                            sound: 'default',
                            data: payload,
                        },
                        trigger: null,
                    });
                } catch (err) {
                    console.warn('[notifications socket] failed to play sound notification:', err);
                }

                // Toca MP3 custom 3x no foreground para reforcar o alerta sonoro.
                playAlertSound();
            }
        });

        socket.on('mission-progress', () => {
            NotificationUIService.showInfo('Seu progresso nas missões foi atualizado.', 'Missões');
        });

        return () => {
            socket.disconnect();
        };
    }, [authToken]);
}


function RootLayoutContent() {
    const { isAuthenticated, isLoading: authIsLoading, user, token } = useAuth();
    const router = useRouter();
    const segments = useSegments();
    const { paymentOverlayVisible } = useAuth();  // 🔵 ADICIONADO
    const pathname = usePathname();
    const { t } = useTranslation();

    // ativa o socket de notificações quando token está disponível
    useNotificationsSocket(token);
    // one-time local notifications channel (Android). Harmless on iOS.
    useEffect(() => { if (setupNotificationsOnce) { setupNotificationsOnce(); } }, []);
    // Deep-link handler for notification taps (local or push)
    useEffect(() => {
        let sub: any;
        (async () => {
            try {
                const Notifications = (await import('expo-notifications')).default || (await import('expo-notifications'));
                sub = (Notifications as any).addNotificationResponseReceivedListener?.((response: any) => {
                    try {
                        const url = response?.notification?.request?.content?.data?.url as string | undefined;
                        if (url && typeof url === 'string') {
                            (router as any)?.push?.(url);
                        }
                    } catch {}
                });
            } catch {}
        })();
        return () => { try { sub?.remove?.(); } catch {} };
    }, [router]);

    const [appReady, setAppReady] = useState(false);
    const [initializationError, setInitializationError] = useState<string | null>(null);

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
                } catch (err) {
                    // Removido: console.warn('[RootLayoutContent] NotificationUIService.showError falhou:', err);
                }
            } finally {
                setAppReady(true);
                if (!initializationError) {
                    try {
                        await SplashScreen.hideAsync();
                        // Removido: console.log('[RootLayoutContent | prepareApp] Splash screen nativa oculta. Aplicativo pronto para roteamento.');
                    } catch (e) {
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
            const isFeedbackRoute = isPathOrChild('/(common)/feedback', normalizePath(path));
            // Permitir HOME/Explore (e filhas) para guest sem redirecionar de volta para /welcome
            if (!isAuthenticated && (path.includes('/(client)/explore') || path.startsWith('/explore'))) {
                return;
            }
            const inAuthGroup = segments[0] === '(auth)';
            const inProviderGroup = segments[0] === '(provider)';
            const isWelcomeRoute = pathname === '/welcome';

            // Guest: regras específicas de acesso (cadastro obrigatório em rotas protegidas)
            if (!isAuthenticated) {
                const protectedRoutes = [
                    '/(client)/bookings',
                    '/(client)/messages',
                    '/(client)/profile',
                    '/(provider)',
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
                                        router.push('/(auth)/client-register' as any);
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

                // Visitante só pode acessar: welcome, rotas de auth e explore
                if (!isWelcomeRoute && !inAuthGroup && !path.startsWith('/(client)/explore') && !isFeedbackRoute) {
                    router.replace('/welcome');
                    return;
                }

                return;
            }

            const isBookingOrChat =
                path.startsWith('/(client)/bookings') ||
                path.startsWith('/bookings') ||
                path.startsWith('/(client)/messages') ||
                path.startsWith('/messages');

            if (isBookingOrChat) {
                // Removido: console.log de rota de booking/chat.
                return;
            }

            if (isAuthenticated && user?.role === UserRole.PROVIDER && inProviderGroup && !isWelcomeRoute) {
                // Removido: console.log de provedor no grupo.
                return;
            }

            if (!isAuthenticated) {
                if (!inAuthGroup && !isWelcomeRoute) {
                    // Removido: console.log de redirecionamento para /welcome.
                    router.replace('/welcome');
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
                const isCurrentPathInClientGroup = segments[0] === '(client)';

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
    }, [isAuthenticated, user, authIsLoading, router, segments, pathname, appReady]);

    if (!appReady || authIsLoading || initializationError) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#007AFF" />
                {initializationError ? (
                    <Text style={styles.loadingText}>{t("common.error")}: {initializationError}</Text>
                ) : (
                    <Text style={styles.loadingText}>{t("common.loading")} ...</Text>
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
            <AuthProvider>
                <ProviderRegistrationProvider>
                    <AppQueryClientProvider>
                        <AppProvider>
                            <RootLayoutContent />
                        </AppProvider>
                    </AppQueryClientProvider>
                </ProviderRegistrationProvider>
            </AuthProvider>
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

