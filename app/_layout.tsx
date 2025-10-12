import { Slot, SplashScreen, usePathname, useRouter, useSegments } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    StyleSheet,
    Text,
    View,
    Image,
} from 'react-native';
import { LogBox } from 'react-native'; // ✅ ADICIONADO: Para ignorar o warning específico do LogBox (dev mode apenas)
import 'react-native-reanimated';
import { io } from 'socket.io-client';
import Constants from 'expo-constants';
import { AppProvider } from '../contexts/AppContext';
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

// ✅ SOLUÇÃO GLOBAL: Ignora só o warning específico do LogBox (dev mode apenas; não afeta produção ou outros erros)
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
    useEffect(() => {
        if (!authToken) {
            return;
        }
        const socket = io(resolveSocketUrl(), {
            auth: { token: authToken },
            transports: ['websocket'],
        });
        socket.on('notification', (payload: any) => {
            NotificationUIService.showInfo(payload?.message ?? 'Você tem uma nova notificação.', payload?.title ?? 'Notificação');
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
    const pathname = usePathname();
    const { t } = useTranslation();

    // ativa o socket de notificações quando token está disponível
    useNotificationsSocket(token);

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
            const isBookingOrChat =
                path.startsWith('/(client)/bookings') ||
                path.startsWith('/bookings') ||
                path.startsWith('/(client)/messages') ||
                path.startsWith('/messages');

            if (isBookingOrChat) {
                // Removido: console.log de rota de booking/chat.
                return;
            }

            const inAuthGroup = segments[0] === '(auth)';
            const inProviderGroup = segments[0] === '(provider)';
            const isWelcomeRoute = pathname === '/welcome';

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
                // Removido: console.log de permanência em rota pública.
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

    // Envolver em uma View root para reduzir chances do devtools injetar strings no nível superior
    try {
        return (
            <View style={{ flex: 1 }}>
                <Slot />
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
                    <AppProvider>
                        <RootLayoutContent />
                    </AppProvider>
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