// LimpeJaApp/app/_layout.tsx
import { Slot, SplashScreen, usePathname, useRouter, useSegments } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    StyleSheet,
    Text,
    View,
    // Alert, // Removed
    Image,
} from 'react-native';
import 'react-native-reanimated';
import { io } from 'socket.io-client';
import Constants from 'expo-constants';
import { AppProvider } from '../contexts/AppContext';
import { AuthProvider, useAuth } from '../contexts/AuthContext';
import { ProviderRegistrationProvider } from '../contexts/ProviderRegistrationContext';
import { AUTH_ROUTES, CLIENT_ROUTES, PROVIDER_ROUTES } from '../constants/routes';
import { UserRole, VerificationStatus } from '../types/backend/auth';
import * as Sentry from '@sentry/react-native';
import Toast from 'react-native-toast-message'; // Importar Toast diretamente
import { toastConfig } from '../components/Toast'; // Importar a configuração do Toast
import i18n from '../i18n'; // Importar a instância do i18n
import { I18nextProvider, useTranslation } from 'react-i18next'; // Importar I18nextProvider e useTranslation

// >>> INJETADO: expo-font <<<
import * as Font from 'expo-font';

// Import NotificationUIService
import NotificationUIService from '../services/notificationUIService'; // Added
import AppQueryClientProvider from '../components/provider/query-client-provider';

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
    const { t } = useTranslation(); // Usar hook de tradução

    const [appReady, setAppReady] = useState(false);
    const [initializationError, setInitializationError] = useState<string | null>(null);

    useEffect(() => {
        const prepareApp = async () => {
            console.log('[RootLayoutContent | prepareApp] Iniciando processo de preparação do aplicativo.');
            try {
                // >>> FONTES OTIMIZADAS: Carregando apenas as fontes essenciais <<<
                await Font.loadAsync({
                    'Montserrat-Regular': require('../assets/fonts/Montserrat-Regular.ttf'),
                    'Montserrat-Thin': require('../assets/fonts/Montserrat-Thin.ttf'),
                });

                console.log('[RootLayoutContent | prepareApp] Fontes essenciais carregadas e inicialização básica concluída.');
            } catch (e: any) {
                console.error('[RootLayoutContent | prepareApp] ERRO FATAL durante a inicialização do aplicativo:', e);
                setInitializationError(e.message || 'Erro desconhecido na inicialização.');
                NotificationUIService.showError(t("common.generic_error"), t("common.error")); // Modified
            } finally {
                setAppReady(true);
                if (!initializationError) {
                    await SplashScreen.hideAsync();
                    console.log('[RootLayoutContent | prepareApp] Splash screen nativa oculta. Aplicativo pronto para roteamento.');
                }
            }
        };
        prepareApp();
    }, [t, initializationError]);

    useEffect(() => {
        console.groupCollapsed(`[RootLayoutContent | useEffect] Ciclo de Redirecionamento - Caminho: ${pathname}`);
        console.log(`- appReady: ${appReady}`);
        console.log(`- authIsLoading: ${authIsLoading}`);
        console.log(`- isAuthenticated: ${isAuthenticated}`);
        console.log(`- user: ${user?.email ? user.email + ' (Função: ' + user.role + ')' : 'nulo/indefinido'}`);
        console.log(`- user.providerDetails.verificationStatus: ${user?.providerDetails?.verificationStatus}`);
        console.log(`- Caminho atual: '${pathname}'`);

        if (initializationError) {
            console.error(`[RootLayoutContent | useEffect] Erro de inicialização detectado: ${initializationError}. Bloqueando roteamento.`);
            console.groupEnd();
            return;
        }

        if (!appReady || authIsLoading || (isAuthenticated && !user?.role && !user?.clientDetails && !user?.providerDetails)) {
            console.warn(`[RootLayoutContent | useEffect] Saída Antecipada: Estado do componente não pronto. appReady=${appReady}, authIsLoading=${authIsLoading}, isAuthenticated=${isAuthenticated}, userHasProfile=${!!user?.role}`);
            console.groupEnd();
            return;
        }

        console.log('[RootLayoutContent | useEffect] Estado pronto para decisão de redirecionamento.');

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
                console.log(`[RootLayoutContent | decideAndRedirect] INFO: Rota de booking/chat detectada (${path}). Evitando redirecionamento.`);
                console.groupEnd();
                return;
            }

            const inAuthGroup = segments[0] === '(auth)';
            const inProviderGroup = segments[0] === '(provider)';
            const isWelcomeRoute = pathname === '/welcome';

            // ADIÇÃO: Verifica se o usuário é um provedor e está no grupo (provider)
            // Se sim, permite a navegação para qualquer rota dentro desse grupo sem redirecionar
            if (isAuthenticated && user?.role === UserRole.PROVIDER && inProviderGroup && !isWelcomeRoute) {
                console.log(`[RootLayoutContent | decideAndRedirect] INFO: Provedor já no grupo (provider). Permitindo navegação interna.`);
                console.groupEnd();
                return;
            }

            if (!isAuthenticated) {
                if (!inAuthGroup && !isWelcomeRoute) {
                    console.log('[RootLayoutContent | decideAndRedirect] AÇÃO: Usuário NÃO autenticado. Redirecionando para /welcome.');
                    router.replace('/welcome');
                    console.groupEnd();
                    return;
                }
                console.log('[RootLayoutContent | decideAndRedirect] INFO: Usuário NÃO autenticado e já em rota pública. Permitindo permanência.');
                console.groupEnd();
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
                        cleanedCurrentPath.startsWith(normalizePath(PROVIDER_ROUTES.EARNINGS)) ||
                        cleanedCurrentPath.startsWith(normalizePath(PROVIDER_ROUTES.MESSAGES_LIST)) ||
                        cleanedCurrentPath.startsWith(normalizePath(PROVIDER_ROUTES.PROFILE)) ||
                        cleanedCurrentPath.startsWith(normalizePath(PROVIDER_ROUTES.SERVICES_LIST)) ||
                        cleanedCurrentPath.startsWith(normalizePath(PROVIDER_ROUTES.BOOKINGS_LIST)) ||
                        cleanedCurrentPath.startsWith(normalizePath(PROVIDER_ROUTES.SCHEDULE)) ||
                        cleanedCurrentPath.startsWith(normalizePath(PROVIDER_ROUTES.WITHDRAW)) || // ADICIONADO: Permitir rota de saque
                        cleanedCurrentPath.startsWith(normalizePath(PROVIDER_ROUTES.REVIEWS)); // ADICIONADO: Permitir rota de avaliações

                    if (!isAllowedProviderRoute) {
                        console.log(`[RootLayoutContent | decideAndRedirect] AÇÃO: Provedor APROVADO fora das rotas permitidas. Redirecionando para o Dashboard.`);
                        router.replace(targetDashboardPath as any);
                    }
                } else if (isPendingInitialReview) {
                    if (cleanedCurrentPath !== authServiceDetailsStep) {
                        console.log(`[RootLayoutContent | decideAndRedirect] AÇÃO: Provedor com registro inicial pendente. Redirecionando para detalhes do serviço: '${authServiceDetailsStep}'.`);
                        router.replace(authServiceDetailsStep as any);
                    }
                } else if (isPendingDocsUpload) {
                    if (cleanedCurrentPath !== providerRegistrationVerifyAccountPath) {
                        console.log(`[RootLayoutContent | decideAndRedirect] AÇÃO: Provedor com verificação de documentos pendente. Redirecionando para: '${providerRegistrationVerifyAccountPath}'.`);
                        router.replace(providerRegistrationVerifyAccountPath as any);
                    }
                } else {
                    console.log(`[RootLayoutContent | decideAndRedirect] INFO: Provedor autenticado com status inesperado. Redirecionando para a tela de verificação de documentos.`);
                    if (cleanedCurrentPath !== providerRegistrationVerifyAccountPath) {
                        router.replace(providerRegistrationVerifyAccountPath as any);
                    }
                }
                console.groupEnd();
                return;
            }

            if (user?.role && (user.role === UserRole.ADMIN || user.role === UserRole.CLIENT)) {
                const targetRoute = normalizePath(CLIENT_ROUTES.EXPLORE);
                const isCurrentPathInClientGroup = segments[0] === '(client)';

                if (cleanedCurrentPath !== targetRoute && !isCurrentPathInClientGroup) {
                    console.log(`[RootLayoutContent | decideAndRedirect] AÇÃO: Usuário ${user?.role} fora da rota de cliente. Redirecionando para: '${targetRoute}'.`);
                    router.replace(targetRoute as any);
                }
                console.groupEnd();
                return;
            }

            console.log(`[RootLayoutContent | decideAndRedirect] INFO: Nenhuma ação de redirecionamento necessária. Fim do ciclo.`);
            console.groupEnd();
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

    return (
        <>
            <Slot />
            <Toast config={toastConfig} />
        </>
    );
}

export default Sentry.wrap(function RootLayout() {
    return (
        <I18nextProvider i18n={i18n}> {/* Envolver com I18nextProvider */}
            <AuthProvider>
                <ProviderRegistrationProvider>
                    <AppProvider>
                        <RootLayoutContent />
                    </AppProvider>
                </ProviderRegistrationProvider>
            </AuthProvider> {/* FIX: Adicionada a tag de fechamento para AuthProvider */}
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
        // exemplo: você pode trocar depois por 'DMSans-Regular'
        // fontFamily: 'DMSans-Regular',
    },
    toastContainer: { // Este estilo será sobrescrito pela configuração do Toast.tsx
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#4CAF50',
        borderRadius: 8,
        padding: 10,
        minHeight: 60,
    },
    toastImage: { // Este estilo será sobrescrito pela configuração do Toast.tsx
        width: 36,
        height: 36,
        marginRight: 10,
        resizeMode: 'contain',
    },
    toastTitle: { // Este estilo será sobrescrito pela configuração do Toast.tsx
        color: '#fff',
        fontWeight: 'bold',
        fontSize: 15,
    },
    toastSubtitle: { // Este estilo será sobrescrito pela configuração do Toast.tsx
        color: '#fff',
        fontSize: 13,
    },
});

