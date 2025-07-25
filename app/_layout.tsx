// LimpeJaApp/app/_layout.tsx
import { Slot, SplashScreen, usePathname, useRouter, useSegments } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, View, Alert } from 'react-native';
import 'react-native-reanimated';
import { AppProvider } from '../contexts/AppContext';
import { AuthProvider, useAuth } from '../contexts/AuthContext';

// REMOVIDO: Importação da Promise de inicialização do Firebase
// import { firebaseInitializationPromise } from '../config/firebaseClient';

import { AUTH_ROUTES, CLIENT_ROUTES, PROVIDER_ROUTES } from '../constants/routes';
// CORREÇÃO: Caminho de importação para ProviderRegistrationContext
import { ProviderRegistrationProvider, useProviderRegistration } from '../contexts/ProviderRegistrationContext'; // <--- CAMINHO CORRIGIDO AQUI

import { UserRole, VerificationStatus } from '../types/backend/auth';

// Previne que a splash screen nativa se esconda automaticamente
SplashScreen.preventAutoHideAsync();

// Componente principal do layout que gerencia o estado inicial e redirecionamento
function RootLayoutContent() {
    const { isAuthenticated, isLoading: authIsLoading, user, isRegistrationInProgress } = useAuth();
    const { isRegistrationInProgress: providerRegIsLoading } = useProviderRegistration();
    const router = useRouter();
    const segments = useSegments();
    const pathname = usePathname();

    const [appReady, setAppReady] = useState(false);
    const [initializationError, setInitializationError] = useState<string | null>(null);

    useEffect(() => {
        const prepareApp = async () => {
            console.log('[RootLayoutContent | prepareApp] Iniciando processo de preparação do aplicativo.');
            try {
                // Lógica de inicialização normal do aplicativo (carregar assets, fontes, etc.)
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

        const decideAndRedirect = async () => {
            console.log(`[RootLayoutContent | decideAndRedirect] Estado da Decisão:`);
            console.log(`   - Autenticado: ${isAuthenticated}`);
            console.log(`   - Função do Usuário: ${user?.role || 'N/A'}`);
            console.log(`   - Caminho Atual: '${pathname}'`);
            console.log(`   - No Grupo de Autenticação: ${inAuthGroup}`);
            console.log(`   - É Rota de Boas-Vindas: ${isWelcomeRoute}`);
            console.log(`   - Registro de Provedor em Andamento: ${isRegistrationInProgress}`);
            console.log(`   - Status de Verificação do Provedor: ${user?.providerDetails?.verificationStatus || 'N/A'}`);

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

            const currentPath = pathname as string;
            const normalizePath = (path: string) => {
                let p = path.trim();
                if (p.endsWith('/') && p.length > 1 && !/\/\(\w+\)\/$/.test(p)) {
                    p = p.slice(0, -1);
                }
                return p;
            };
            const cleanedCurrentPath = normalizePath(currentPath);
            const authServiceDetailsStep = normalizePath(AUTH_ROUTES.SERVICE_DETAILS_STEP);
            const authVerifyAccountStep = normalizePath(AUTH_ROUTES.VERIFY_ACCOUNT_STEP);

            const isProviderPendingVerification = user?.role === UserRole.PROVIDER &&
                user?.providerDetails?.verificationStatus !== VerificationStatus.APPROVED;

            console.log(`[RootLayoutContent | decideAndRedirect] Provider Flow Check:`);
            console.log(`   - user.role: ${user?.role}`);
            console.log(`   - isRegistrationInProgress (AuthContext): ${isRegistrationInProgress}`);
            console.log(`   - isProviderPendingVerification (calculated): ${isProviderPendingVerification}`);

            if (user?.role === UserRole.PROVIDER) {
                if (isRegistrationInProgress) {
                    if (cleanedCurrentPath !== authServiceDetailsStep && cleanedCurrentPath !== authVerifyAccountStep) {
                        console.log(`[RootLayoutContent | decideAndRedirect] AÇÃO: Provedor (${user.email}) com registro em andamento, fora da página de detalhes/verificação. Redirecionando para: '${authServiceDetailsStep}'.`);
                        router.replace(authServiceDetailsStep as any);
                        console.groupEnd();
                        return;
                    }
                    console.log(`[RootLayoutContent | decideAndRedirect] INFO: Provedor (${user.email}) com registro em andamento, corretamente na página de detalhes. Permitindo prosseguir.`);
                    console.groupEnd();
                    return;
                }

                if (isProviderPendingVerification) {
                    if (cleanedCurrentPath !== authVerifyAccountStep) {
                        console.log(`[RootLayoutContent | decideAndRedirect] AÇÃO: Provedor (${user.email}) pendente de verificação, fora da página de verificação. Redirecionando para: '${authVerifyAccountStep}'.`);
                        router.replace(authVerifyAccountStep as any);
                        console.groupEnd();
                        return;
                    }
                    console.log(`[RootLayoutContent | decideAndRedirect] INFO: Provedor (${user.email}) pendente de verificação, corretamente na página de verificação. Permitindo prosseguir.`);
                    console.groupEnd();
                    return;
                }
            }

            let targetRoute: string | null = null;
            let shouldPerformRedirect = false;

            const isCurrentPathInClientGroup = segments[0] === '(client)';
            const isCurrentPathInProviderGroup = segments[0] === '(provider)';
            const isCurrentPathInCommonGroup = segments[0] === '(common)';

            console.log(`[RootLayoutContent | decideAndRedirect] General Role-Based Redirection Check:`);
            console.log(`   - Current segment: ${segments[0]}`);

            if (user?.role === UserRole.ADMIN) {
                targetRoute = CLIENT_ROUTES.EXPLORE;
                if (!isCurrentPathInClientGroup && !isCurrentPathInCommonGroup && !isCurrentPathInProviderGroup) {
                    shouldPerformRedirect = true;
                }
            } else if (user?.role === UserRole.CLIENT) {
                targetRoute = CLIENT_ROUTES.EXPLORE;
                if (!isCurrentPathInClientGroup && !isCurrentPathInCommonGroup) {
                    shouldPerformRedirect = true;
                }
            } else if (user?.role === UserRole.PROVIDER) {
                targetRoute = PROVIDER_ROUTES.DASHBOARD;
                if (!isCurrentPathInProviderGroup && !isCurrentPathInCommonGroup) {
                    shouldPerformRedirect = true;
                }
            } else {
                console.warn('[RootLayoutContent | decideAndRedirect] AVISO: Usuário autenticado com função desconhecida ou nula. Redirecionando para login.');
                targetRoute = AUTH_ROUTES.LOGIN;
                shouldPerformRedirect = true;
            }

            if (targetRoute) {
                const normalizedTargetRoute = normalizePath(targetRoute);
                const targetBase = normalizedTargetRoute.replace(/\/\(\w+\)/, '');
                const currentPathBase = cleanedCurrentPath.replace(/\/\(\w+\)/, '');

                console.log(`[RootLayoutContent | decideAndRedirect] Final Redirection Evaluation:`);
                console.log(`   - Proposed targetRoute (normalized): '${normalizedTargetRoute}'`);
                console.log(`   - current pathname (normalized): '${cleanedCurrentPath}'`);
                console.log(`   - targetBase: '${targetBase}'`);
                console.log(`   - currentPathBase: '${currentPathBase}'`);
                console.log(`   - inAuthGroup: ${inAuthGroup}`);
                console.log(`   - shouldPerformRedirect (pre-final check): ${shouldPerformRedirect}`);

                if (cleanedCurrentPath === normalizedTargetRoute || (normalizedTargetRoute.includes('/(') && currentPathBase === targetBase)) {
                    shouldPerformRedirect = false;
                    console.log(`[RootLayoutContent | decideAndRedirect] INFO: Já na rota alvo ou equivalente. Não é necessário redirecionar.`);
                }

                if (inAuthGroup && !normalizedTargetRoute.includes('/(') && cleanedCurrentPath !== normalizedTargetRoute) {
                    shouldPerformRedirect = true;
                    console.log(`[RootLayoutContent | decideAndRedirect] INFO: Usuário autenticado no grupo (auth), redirecionando para rota alvo fora do grupo (auth).`);
                }
            } else {
                shouldPerformRedirect = false;
                console.log(`[RootLayoutContent | decideAndRedirect] INFO: Nenhuma rota alvo válida determinada. No redirect needed.`);
            }

            if (shouldPerformRedirect && targetRoute && cleanedCurrentPath !== normalizePath(targetRoute)) {
                console.log(`[RootLayoutContent | decideAndRedirect] AÇÃO: Redirecionamento final ${user?.role || 'N/A'} de '${cleanedCurrentPath}' para: '${normalizePath(targetRoute)}'`);
                router.replace(normalizePath(targetRoute) as any);
                console.groupEnd();
                return;
            } else {
                console.log(`[RootLayoutContent | decideAndRedirect] INFO: Usuário ${user?.role || 'N/A'} já está na rota correta ('${cleanedCurrentPath}') ou nenhuma ação de redirecionamento foi necessária. Final shouldPerformRedirect: ${shouldPerformRedirect}.`);
                console.groupEnd();
            }
        };

        decideAndRedirect();

    }, [isAuthenticated, user, authIsLoading, router, segments, pathname, isRegistrationInProgress, appReady, providerRegIsLoading]); // Removido firebaseReady das dependências

    // Renderiza o indicador de carregamento se o app não estiver pronto ou houver erro de inicialização
    // Removido !firebaseReady da condição
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

// O _layout.tsx DEVE ter um export default para o componente que encapsula tudo
export default function RootLayout() { // <--- ESTE É O COMPONENTE EXPORTADO POR PADRÃO
    return (
        <AuthProvider>
            <ProviderRegistrationProvider>
                <AppProvider>
                    <RootLayoutContent /> {/* Renderiza o componente que contém a lógica */}
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
