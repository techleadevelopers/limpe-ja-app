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
// Importa a função de inicialização do Sentry
import { initSentry } from '../components/common/utils/sentry'; // Ajuste o caminho se o seu sentry.ts estiver em outro local

SplashScreen.preventAutoHideAsync();

function RootLayoutContent() {
    const { isAuthenticated, isLoading: authIsLoading, user, isRegistrationInProgress } = useAuth();
    const router = useRouter();
    const segments = useSegments();
    const pathname = usePathname();

    const [appReady, setAppReady] = useState(false);
    const [initializationError, setInitializationError] = useState<string | null>(null);

    useEffect(() => {
        const prepareApp = async () => {
            console.log('[RootLayoutContent | prepareApp] Iniciando processo de preparação do aplicativo.');
            try {
                // Inicializa Sentry e outras ferramentas de monitoramento/analytics
                initSentry(); // <--- Adição da inicialização do Sentry
                // Se houver Amplitude ou outras ferramentas, inicialize-as aqui também
                // initAmplitude();

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
        console.groupCollapsed(`[RootLayoutContent | useEffect] Ciclo de Redirecionamento - Caminho: ${pathname}`);
        console.log(`- appReady: ${appReady}`);
        console.log(`- authIsLoading: ${authIsLoading}`);
        console.log(`- isAuthenticated: ${isAuthenticated}`);
        console.log(`- user: ${user?.email ? user.email + ' (Função: ' + user.role + ')' : 'nulo/indefinido'}`);
        console.log(`- user.providerDetails.verificationStatus: ${user?.providerDetails?.verificationStatus}`);
        console.log(`- isRegistrationInProgress (AuthContext): ${isRegistrationInProgress}`);
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

        const inAuthGroup = segments[0] === '(auth)';
        const isWelcomeRoute = pathname === '/welcome';
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

        const isProviderPendingVerification = user?.role === UserRole.PROVIDER && user?.providerDetails?.verificationStatus !== VerificationStatus.APPROVED;

        console.log(`[RootLayoutContent | decideAndRedirect] Provider Flow Check:`);
        console.log(`   - user.role: ${user?.role}`);
        console.log(`   - user.providerDetails.verificationStatus: ${user?.providerDetails?.verificationStatus}`);
        console.log(`   - isRegistrationInProgress (AuthContext): ${isRegistrationInProgress}`);
        console.log(`   - isProviderPendingVerification (calculated): ${isProviderPendingVerification}`);

        const decideAndRedirect = async () => {
            if (!isAuthenticated) {
                if (!inAuthGroup && !isWelcomeRoute) {
                    console.log('[RootLayoutContent | decideAndRedirect] AÇÃO: Usuário NÃO autenticado e fora do grupo (auth) ou /welcome. Redirecionando para /welcome (Fluxo fixo).');
                    router.replace('/welcome');
                    console.groupEnd();
                    return;
                }
                console.log('[RootLayoutContent | decideAndRedirect] INFO: Usuário NÃO autenticado e já em /welcome ou no grupo (auth). Permitindo permanência.');
                console.groupEnd();
                return;
            }

            // Ações de redirecionamento para provedores. A prioridade é do status de verificação.
            if (user?.role === UserRole.PROVIDER) {
                // 1. Provedor APROVADO: Redirecionar para o dashboard
                if (user?.providerDetails?.verificationStatus === VerificationStatus.APPROVED) {
                    const targetDashboardPath = normalizePath(PROVIDER_ROUTES.DASHBOARD);
                    if (cleanedCurrentPath !== targetDashboardPath) {
                        console.log(`[RootLayoutContent | decideAndRedirect] AÇÃO: Provedor (${user.email}) APROVADO. Redirecionando para o Dashboard: '${targetDashboardPath}'.`);
                        router.replace(targetDashboardPath as any);
                        console.groupEnd();
                        return;
                    }
                    console.log(`[RootLayoutContent | decideAndRedirect] INFO: Provedor (${user.email}) APROVADO e já no Dashboard. Permitindo permanência.`);
                    console.groupEnd();
                    return;
                }

                // 2. Provedor com registro em andamento: Redirecionar para o passo correto
                // Se o status for PENDING_INITIAL_REVIEW, redirecionar para service-details
                if (user?.providerDetails?.verificationStatus === VerificationStatus.PENDING_INITIAL_REVIEW) {
                    if (cleanedCurrentPath !== authServiceDetailsStep) {
                        console.log(`[RootLayoutContent | decideAndRedirect] AÇÃO: Provedor (${user.email}) com registro inicial pendente, redirecionando para a etapa de detalhes do serviço: '${authServiceDetailsStep}'.`);
                        router.replace(authServiceDetailsStep as any);
                        console.groupEnd();
                        return;
                    }
                }
                
                // Se o status for PENDING_DOCUMENTS_UPLOAD ou outros, redirecionar para verify-account
                if (isProviderPendingVerification) {
                    if (cleanedCurrentPath !== providerRegistrationVerifyAccountPath) {
                        console.log(`[RootLayoutContent | decideAndRedirect] AÇÃO: Provedor (${user.email}) pendente de verificação, fora da página de verificação. Redirecionando para: '${providerRegistrationVerifyAccountPath}'.`);
                        router.replace(providerRegistrationVerifyAccountPath as any);
                        console.groupEnd();
                        return;
                    }
                }

                // Casos de borda: O provedor está autenticado mas com um status inesperado, redirecionar para a página de verificação como padrão.
                // Isso evita loops infinitos se a lógica acima não for atendida.
                if (inAuthGroup && cleanedCurrentPath !== authServiceDetailsStep && cleanedCurrentPath !== providerRegistrationVerifyAccountPath) {
                    console.log(`[RootLayoutContent | decideAndRedirect] AÇÃO: Provedor (${user.email}) com status pendente inesperado. Redirecionando para a tela de verificação: '${providerRegistrationVerifyAccountPath}'.`);
                    router.replace(providerRegistrationVerifyAccountPath as any);
                    console.groupEnd();
                    return;
                }
                
                console.log(`[RootLayoutContent | decideAndRedirect] INFO: Provedor (${user.email}) em uma rota de registro válida. Permitindo prosseguir.`);
                console.groupEnd();
                return;
            }

            // Lógica para outros papéis (CLIENTE, ADMIN)
            let targetRoute: string | null = null;
            let shouldPerformRedirect = false;

            const isCurrentPathInClientGroup = segments[0] === '(client)';
            const isCurrentPathInProviderGroup = segments[0] === '(provider)';
            const isCurrentPathInCommonGroup = segments[0] === '(common)';

            console.log(`[RootLayoutContent | decideAndRedirect] General Role-Based Redirection Check:`);
            console.log(`   - Current segment: ${segments[0]}`);

            if (user?.role === UserRole.ADMIN || user?.role === UserRole.CLIENT) {
                targetRoute = CLIENT_ROUTES.EXPLORE;
                if (!isCurrentPathInClientGroup && !isCurrentPathInCommonGroup) {
                    shouldPerformRedirect = true;
                }
            }
            
            if (shouldPerformRedirect && targetRoute) {
                const normalizedTargetRoute = normalizePath(targetRoute);
                console.log(`[RootLayoutContent | decideAndRedirect] AÇÃO: Redirecionamento final ${user?.role || 'N/A'} de '${cleanedCurrentPath}' para: '${normalizedTargetRoute}'`);
                router.replace(normalizedTargetRoute as any);
                console.groupEnd();
                return;
            } else {
                console.log(`[RootLayoutContent | decideAndRedirect] INFO: Usuário ${user?.role || 'N/A'} já está na rota correta ('${cleanedCurrentPath}') ou nenhuma ação de redirecionamento foi necessária. Final shouldPerformRedirect: ${shouldPerformRedirect}.`);
                console.groupEnd();
            }
        };

        decideAndRedirect();

    }, [isAuthenticated, user, authIsLoading, router, segments, pathname, isRegistrationInProgress, appReady]);

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