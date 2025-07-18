// LimpeJaApp/app/_layout.tsx
import { Slot, SplashScreen, usePathname, useRouter, useSegments } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import 'react-native-reanimated';
import { AppProvider } from '../contexts/AppContext';
import { AuthProvider, useAuth } from '../contexts/AuthContext';

// NOVO: Importa o arquivo de configuração do Firebase e a Promise de inicialização
import { firebaseInitializationPromise } from '../config/firebaseClient'; // <--- IMPORTAÇÃO CRÍTICA AQUI

import { AUTH_ROUTES, CLIENT_ROUTES, PROVIDER_ROUTES } from '../constants/routes';
import { ProviderRegistrationProvider, useProviderRegistration } from '../contexts/ProviderRegistrationContext';
import { UserRole, VerificationStatus } from '../types/backend/auth';

SplashScreen.preventAutoHideAsync();

function InitialLayout() {
    const { isAuthenticated, isLoading: authIsLoading, user, isRegistrationInProgress } = useAuth(); 
    const { isRegistrationInProgress: providerRegIsLoading } = useProviderRegistration(); 
    const router = useRouter();
    const segments = useSegments();
    const pathname = usePathname();

    const [appReady, setAppReady] = useState(false); 
    const [firebaseReady, setFirebaseReady] = useState(false); // NOVO: Estado para a prontidão do Firebase

    useEffect(() => {
        const prepareApp = async () => {
            console.log('[InitialLayout | prepareApp] Iniciando processo de preparação do aplicativo.');
            try {
                // NOVO: Espera pela inicialização do Firebase antes de continuar
                console.log('[InitialLayout | prepareApp] Aguardando inicialização do Firebase...');
                await firebaseInitializationPromise; // Espera que a Promise do firebaseClient.ts resolva
                setFirebaseReady(true); // Marca o Firebase como pronto
                console.log('[InitialLayout | prepareApp] Firebase inicializado e pronto.');

                // Aqui você pode carregar assets, fontes, etc., se necessário antes de esconder a splash
            } catch (e) {
                console.error('[InitialLayout | prepareApp] ERRO FATAL durante a inicialização do Firebase:', e);
                // Em caso de erro fatal no Firebase, você pode querer exibir uma tela de erro ou sair.
                // Alert.alert("Erro de Configuração", "O aplicativo não pôde iniciar devido a um erro de configuração do Firebase.");
                // process.exit(1); 
            } finally {
                setAppReady(true); 
                await SplashScreen.hideAsync(); 
                console.log('[InitialLayout | prepareApp] Splash screen nativa oculta. Aplicativo pronto para roteamento.');
            }
        };
        prepareApp();
    }, []); 

    useEffect(() => {
        console.groupCollapsed(`[InitialLayout | useEffect] Ciclo de Redirecionamento - Caminho: ${pathname}`);
        console.log(`- appReady: ${appReady}`);
        console.log(`- firebaseReady: ${firebaseReady}`); // NOVO: Log do estado do Firebase
        console.log(`- authIsLoading: ${authIsLoading}`);
        console.log(`- isAuthenticated: ${isAuthenticated}`);
        console.log(`- user: ${user?.email ? user.email + ' (Função: ' + user.role + ')' : 'nulo/indefinido'}`);
        console.log(`- isRegistrationInProgress (AuthContext): ${isRegistrationInProgress}`);
        console.log(`- Caminho atual: '${pathname}'`);

        // Condições de saída antecipada: app não pronto, Firebase não pronto, ou autenticando
        if (!appReady || !firebaseReady || authIsLoading || (isAuthenticated && !user?.role && !user?.clientDetails && !user?.providerDetails)) {
            console.warn(`[InitialLayout | useEffect] Saída Antecipada: Estado do componente não pronto. appReady=${appReady}, firebaseReady=${firebaseReady}, authIsLoading=${authIsLoading}, isAuthenticated=${isAuthenticated}, userHasProfile=${!!user?.role}`);
            console.groupEnd(); 
            return;
        }

        console.log('[InitialLayout | useEffect] Estado pronto para decisão de redirecionamento.');

        const inAuthGroup = segments[0] === '(auth)'; 
        const isWelcomeRoute = pathname === '/welcome';
        
        const decideAndRedirect = async () => {
            console.log(`[InitialLayout | decideAndRedirect] Estado da Decisão:`);
            console.log(`  - Autenticado: ${isAuthenticated}`);
            console.log(`  - Função do Usuário: ${user?.role || 'N/A'}`);
            console.log(`  - Caminho Atual: '${pathname}'`); 
            console.log(`  - No Grupo de Autenticação: ${inAuthGroup}`);
            console.log(`  - É Rota de Boas-Vindas: ${isWelcomeRoute}`);
            console.log(`  - Registro de Provedor em Andamento: ${isRegistrationInProgress}`);
            console.log(`  - Status de Verificação do Provedor: ${user?.providerDetails?.verificationStatus || 'N/A'}`);

            if (!isAuthenticated) {
                if (!inAuthGroup && !isWelcomeRoute) {
                    console.log('[InitialLayout | decideAndRedirect] AÇÃO: Usuário NÃO autenticado e fora do grupo (auth) ou /welcome. Redirecionando para /welcome (Fluxo fixo).');
                    router.replace('/welcome');
                    console.groupEnd();
                    return; 
                }
                console.log('[InitialLayout | decideAndRedirect] INFO: Usuário NÃO autenticado e já em /welcome ou no grupo (auth). Permitindo permanência.');
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

            console.log(`[InitialLayout | decideAndRedirect] Provider Flow Check:`);
            console.log(`  - user.role: ${user?.role}`);
            console.log(`  - isRegistrationInProgress (AuthContext): ${isRegistrationInProgress}`);
            console.log(`  - isProviderPendingVerification (calculated): ${isProviderPendingVerification}`);

            if (user?.role === UserRole.PROVIDER) {
                if (isRegistrationInProgress) { 
                    if (cleanedCurrentPath !== authServiceDetailsStep && cleanedCurrentPath !== authVerifyAccountStep) {
                        console.log(`[InitialLayout | decideAndRedirect] AÇÃO: Provedor (${user.email}) com registro em andamento, fora da página de detalhes/verificação. Redirecionando para: '${authServiceDetailsStep}'.`);
                        router.replace(authServiceDetailsStep as any);
                        console.groupEnd();
                        return;
                    }
                    console.log(`[InitialLayout | decideAndRedirect] INFO: Provedor (${user.email}) com registro em andamento, corretamente na página de detalhes. Permitindo prosseguir.`);
                    console.groupEnd();
                    return;
                }

                if (isProviderPendingVerification) { 
                    if (cleanedCurrentPath !== authVerifyAccountStep) {
                        console.log(`[InitialLayout | decideAndRedirect] AÇÃO: Provedor (${user.email}) pendente de verificação, fora da página de verificação. Redirecionando para: '${authVerifyAccountStep}'.`);
                        router.replace(authVerifyAccountStep as any);
                        console.groupEnd();
                        return;
                    }
                    console.log(`[InitialLayout | decideAndRedirect] INFO: Provedor (${user.email}) pendente de verificação, corretamente na página de verificação. Permitindo prosseguir.`);
                    console.groupEnd();
                    return;
                }
            }

            let targetRoute: string | null = null; 
            let shouldPerformRedirect = false;

            const isCurrentPathInClientGroup = segments[0] === '(client)';
            const isCurrentPathInProviderGroup = segments[0] === '(provider)';
            const isCurrentPathInCommonGroup = segments[0] === '(common)';

            console.log(`[InitialLayout | decideAndRedirect] General Role-Based Redirection Check:`);
            console.log(`  - Current segment: ${segments[0]}`);

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
                console.warn('[InitialLayout | decideAndRedirect] AVISO: Usuário autenticado com função desconhecida ou nula. Redirecionando para login.');
                targetRoute = AUTH_ROUTES.LOGIN;
                shouldPerformRedirect = true;
            }

            if (targetRoute) {
                const normalizedTargetRoute = normalizePath(targetRoute);
                const targetBase = normalizedTargetRoute.replace(/\/\(\w+\)/, ''); 
                const currentPathBase = cleanedCurrentPath.replace(/\/\(\w+\)/, ''); 

                console.log(`[InitialLayout | decideAndRedirect] Final Redirection Evaluation:`);
                console.log(`  - Proposed targetRoute (normalized): '${normalizedTargetRoute}'`);
                console.log(`  - current pathname (normalized): '${cleanedCurrentPath}'`);
                console.log(`  - targetBase: '${targetBase}'`);
                console.log(`  - currentPathBase: '${currentPathBase}'`);
                console.log(`  - inAuthGroup: ${inAuthGroup}`);
                console.log(`  - shouldPerformRedirect (pre-final check): ${shouldPerformRedirect}`);

                if (cleanedCurrentPath === normalizedTargetRoute || (normalizedTargetRoute.includes('/(') && currentPathBase === targetBase)) {
                    shouldPerformRedirect = false;
                    console.log(`[InitialLayout | decideAndRedirect] INFO: Já na rota alvo ou equivalente. Não é necessário redirecionar.`);
                }
                
                if (inAuthGroup && !normalizedTargetRoute.includes('/(') && cleanedCurrentPath !== normalizedTargetRoute) {
                    shouldPerformRedirect = true;
                    console.log(`[InitialLayout | decideAndRedirect] INFO: Usuário autenticado no grupo (auth), redirecionando para rota alvo fora do grupo (auth).`);
                }
            } else {
                shouldPerformRedirect = false; 
                console.log(`[InitialLayout | decideAndRedirect] INFO: Nenhuma rota alvo válida determinada. No redirect needed.`);
            }

            if (shouldPerformRedirect && targetRoute && cleanedCurrentPath !== normalizePath(targetRoute)) {
                console.log(`[InitialLayout | decideAndRedirect] AÇÃO: Redirecionamento final ${user?.role || 'N/A'} de '${cleanedCurrentPath}' para: '${normalizePath(targetRoute)}'`);
                router.replace(normalizePath(targetRoute) as any);
                console.groupEnd();
                return; 
            } else {
                console.log(`[InitialLayout | decideAndRedirect] INFO: Usuário ${user?.role || 'N/A'} já está na rota correta ('${cleanedCurrentPath}') ou nenhuma ação de redirecionamento foi necessária. Final shouldPerformRedirect: ${shouldPerformRedirect}.`);
                console.groupEnd();
            }
        };

        decideAndRedirect();

    }, [isAuthenticated, user, authIsLoading, router, segments, pathname, isRegistrationInProgress, appReady, providerRegIsLoading]); 

    // Renderiza o indicador de carregamento se o app não estiver pronto ou Firebase não estiver pronto
    if (!appReady || !firebaseReady || authIsLoading) { // NOVO: Adicionado !firebaseReady à condição
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#007AFF" />
                <Text style={styles.loadingText}>carregando ...</Text>
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
                    <InitialLayout />
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
