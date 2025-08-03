import { Slot, SplashScreen, usePathname, useRouter, useSegments } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    StyleSheet,
    Text,
    View,
    Alert
} from 'react-native';
import 'react-native-reanimated';
import { AppProvider } from '../contexts/AppContext';
import { AuthProvider, useAuth } from '../contexts/AuthContext';
import { ProviderRegistrationProvider } from '../contexts/ProviderRegistrationContext';
import { AUTH_ROUTES, CLIENT_ROUTES, PROVIDER_ROUTES } from '../constants/routes';
import { UserRole, VerificationStatus } from '../types/backend/auth';

// Previne que a splash screen nativa se esconda automaticamente
SplashScreen.preventAutoHideAsync();

// Componente principal do layout que gerencia o estado inicial e redirecionamento
function RootLayoutContent() {
    const { isAuthenticated, isLoading: authIsLoading, user, isRegistrationInProgress, refreshUser } = useAuth();
    const router = useRouter();
    const segments = useSegments();
    const pathname = usePathname();

    const [appReady, setAppReady] = useState(false);
    const [initializationError, setInitializationError] = useState<string | null>(null);

    useEffect(() => {
        const prepareApp = async () => {
            console.log('[RootLayoutContent | prepareApp] Iniciando processo de preparação do aplicativo.');
            try {
                console.log('[RootLayoutContent | prepareApp] Inicialização básica do aplicativo concluída.');
            } catch (e: any) {
                console.error('[RootLayoutContent | prepareApp] ERRO FATAL durante a inicialização do aplicativo:', e);
                setInitializationError(e.message || 'Erro desconhecido na inicialização.');
                Alert.alert("Erro de Configuração", "O aplicativo não pôde iniciar devido a um erro de configuração. Por favor, tente novamente mais tarde.");
            } finally {
                setAppReady(true);
                if (!initializationError) {
                    await SplashScreen.hideAsync();
                    console.log('[RootLayoutContent | prepareApp] Splash screen nativa oculta. Aplicativo pronto para roteamento.');
                }
            }
        };
        prepareApp();
    }, []);

    useEffect(() => {
        // Log de início do ciclo
        console.groupCollapsed(`[RootLayoutContent | useEffect] Ciclo de Redirecionamento - Caminho: ${pathname}`);
        console.log(`- appReady: ${appReady}`);
        console.log(`- authIsLoading: ${authIsLoading}`);
        console.log(`- isAuthenticated: ${isAuthenticated}`);
        console.log(`- user: ${user?.email ? user.email + ' (Função: ' + user.role + ')' : 'nulo/indefinido'}`);
        console.log(`- user.providerDetails.verificationStatus: ${user?.providerDetails?.verificationStatus}`);
        console.log(`- isRegistrationInProgress (AuthContext): ${isRegistrationInProgress}`);
        console.log(`- Caminho atual: '${pathname}'`);

        // Saída antecipada se a inicialização falhou ou o app não está pronto
        if (initializationError) {
            console.error(`[RootLayoutContent | useEffect] Erro de inicialização detectado: ${initializationError}. Bloqueando roteamento.`);
            console.groupEnd();
            return;
        }

        // Saída se o aplicativo ainda não estiver pronto ou a autenticação estiver carregando.
        if (!appReady || authIsLoading) {
            console.warn(`[RootLayoutContent | useEffect] Saída Antecipada: Estado do componente não pronto. appReady=${appReady}, authIsLoading=${authIsLoading}.`);
            console.groupEnd();
            return;
        }

        console.log('[RootLayoutContent | useEffect] Estado pronto para decisão de redirecionamento.');

        const inAuthGroup = segments[0] === '(auth)';
        const normalizePath = (path: string) => {
            let p = path.trim();
            if (p.endsWith('/') && p.length > 1 && !/\/\(\w+\)\/$/.test(p)) {
                p = p.slice(0, -1);
            }
            return p;
        };
        const cleanedCurrentPath = normalizePath(pathname);
        const authServiceDetailsStep = normalizePath(AUTH_ROUTES.SERVICE_DETAILS_STEP);
        const providerRegistrationVerifyAccountPath = normalizePath(AUTH_ROUTES.VERIFY_ACCOUNT_STEP);
        const providerDashboardPath = normalizePath(PROVIDER_ROUTES.DASHBOARD);
        const clientExplorePath = normalizePath(CLIENT_ROUTES.EXPLORE);
        const authLoginPath = normalizePath(AUTH_ROUTES.LOGIN);

        const isProvider = user?.role === UserRole.PROVIDER;
        const isApproved = isProvider && user?.providerDetails?.verificationStatus === VerificationStatus.APPROVED;
        const isPendingVerification = isProvider && user?.providerDetails?.verificationStatus !== VerificationStatus.APPROVED;

        const decideAndRedirect = () => {
            if (!isAuthenticated) {
                const targetPath = inAuthGroup ? cleanedCurrentPath : '/welcome';
                if (cleanedCurrentPath !== targetPath) {
                    console.log(`[RootLayoutContent | decideAndRedirect] AÇÃO: Usuário NÃO autenticado. Redirecionando para '${targetPath}'.`);
                    router.replace(targetPath as any);
                } else {
                    console.log(`[RootLayoutContent | decideAndRedirect] INFO: Usuário NÃO autenticado e já na rota correta. Permitindo permanência.`);
                }
                console.groupEnd();
                return;
            }

            if (isProvider) {
                if (isApproved) {
                    const targetPath = providerDashboardPath;
                    if (cleanedCurrentPath !== targetPath) {
                        console.log(`[RootLayoutContent | decideAndRedirect] AÇÃO: Provedor APROVADO. Redirecionando para o Dashboard.`);
                        router.replace(targetPath as any);
                    } else {
                        console.log(`[RootLayoutContent | decideAndRedirect] INFO: Provedor APROVADO e já no Dashboard. Permitindo permanência.`);
                    }
                    console.groupEnd();
                    return;
                } else if (isRegistrationInProgress) {
                    const targetPath = authServiceDetailsStep;
                    if (cleanedCurrentPath !== targetPath) {
                        console.log(`[RootLayoutContent | decideAndRedirect] AÇÃO: Provedor com registro em andamento. Redirecionando para: '${targetPath}'.`);
                        router.replace(targetPath as any);
                    } else {
                        console.log(`[RootLayoutContent | decideAndRedirect] INFO: Provedor com registro em andamento e na página correta. Permitindo prosseguir.`);
                    }
                    console.groupEnd();
                    return;
                } else if (isPendingVerification) {
                    const targetPath = providerRegistrationVerifyAccountPath;
                    if (cleanedCurrentPath !== targetPath) {
                        console.log(`[RootLayoutContent | decideAndRedirect] AÇÃO: Provedor pendente de verificação. Redirecionando para: '${targetPath}'.`);
                        router.replace(targetPath as any);
                    } else {
                        console.log(`[RootLayoutContent | decideAndRedirect] INFO: Provedor pendente de verificação e na página correta. Permitindo prosseguir.`);
                    }
                    console.groupEnd();
                    return;
                } else {
                    // CATCH-ALL para provedores que estão em um estado indefinido,
                    // redireciona para o fluxo de verificação para reavaliar.
                    console.log('[RootLayoutContent | decideAndRedirect] AVISO: Provedor autenticado, mas fora do fluxo esperado. Redirecionando para a verificação.');
                    router.replace(providerRegistrationVerifyAccountPath as any);
                    console.groupEnd();
                    return;
                }
            }

            if (user?.role === UserRole.CLIENT || user?.role === UserRole.ADMIN) {
                const targetPath = clientExplorePath;
                if (cleanedCurrentPath !== targetPath) {
                    console.log(`[RootLayoutContent | decideAndRedirect] AÇÃO: Usuário CLIENTE/ADMIN. Redirecionando para: '${targetPath}'.`);
                    router.replace(targetPath as any);
                } else {
                    console.log(`[RootLayoutContent | decideAndRedirect] INFO: Usuário CLIENTE/ADMIN e já na rota correta. Permitindo permanência.`);
                }
                console.groupEnd();
                return;
            }

            // Caso de borda para usuário autenticado sem role ou com role desconhecido
            if (isAuthenticated) {
                console.warn('[RootLayoutContent | decideAndRedirect] AVISO: Usuário autenticado com função desconhecida. Redirecionando para login.');
                router.replace(authLoginPath as any);
                console.groupEnd();
                return;
            }

            console.log(`[RootLayoutContent | decideAndRedirect] INFO: Nenhuma ação de redirecionamento necessária. Finalizando ciclo.`);
            console.groupEnd();
        };

        decideAndRedirect();

    }, [isAuthenticated, user, authIsLoading, router, segments, pathname, isRegistrationInProgress, appReady]);

    // Renderiza o indicador de carregamento se o app não estiver pronto
    if (!appReady || authIsLoading || initializationError) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#007AFF" />
                {initializationError ? (
                    <Text style={styles.loadingText}>Erro crítico: {initializationError}</Text>
                ) : (
                    <Text style={styles.loadingText}>carregando ...</Text>
                )}
            </View>
        );
    }

    return <Slot />;
}

export default function RootLayout() {
    return (
        <AuthProvider>
            <ProviderRegistrationProvider>
                <AppProvider>
                    <RootLayoutContent />
                </AppProvider>
            </ProviderRegistrationProvider>
        </AuthProvider>
    );
}

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
});