// LimpeJaApp/app/_layout.tsx
import React, { useEffect, useState, useCallback } from 'react';
import 'react-native-reanimated';
import { Slot, SplashScreen, useRouter, usePathname, useSegments } from 'expo-router';
import { AuthProvider } from '../contexts/AuthContext';
import { AppProvider } from '../contexts/AppContext';
import { ActivityIndicator, View, StyleSheet, Text } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

import { UserRole } from './types/backend/auth'; 

// Importação das rotas
import { AUTH_ROUTES, CLIENT_ROUTES, PROVIDER_ROUTES } from '../constants/routes'; 

// Importação do ProviderRegistrationProvider
import { ProviderRegistrationProvider } from '../contexts/ProviderRegistrationContext'; 

// Importa useAuth
import { useAuth } from '../hooks/useAuth';

SplashScreen.preventAutoHideAsync();

const WELCOME_SCREEN_VIEWED_KEY = 'welcomeScreenViewed';

function InitialLayout() {
    const { isAuthenticated, isLoading: authIsLoading, user, isRegistrationInProgress } = useAuth();
    const router = useRouter();
    const segments = useSegments();
    const pathname = usePathname();

    const [storageLoading, setStorageLoading] = useState(true);

    const checkWelcomeStatus = useCallback(async () => {
        try {
            const value = await AsyncStorage.getItem(WELCOME_SCREEN_VIEWED_KEY);
            console.log(`[InitialLayout | checkWelcomeStatus] Welcome screen viewed status: ${value}`);
            return value === 'true';
        } catch (e) {
            // --- CORREÇÃO DO ERRO DE TIPO: Tratamento de 'e' como tipo 'unknown' ---
            let errorMessage = 'An unknown error occurred.';
            if (e instanceof Error) {
                errorMessage = e.message;
            } else if (typeof e === 'string') {
                errorMessage = e;
            }
            console.error(`[InitialLayout | checkWelcomeStatus] ERROR: Failed to read welcome screen status: ${errorMessage}`);
            // --- FIM DA CORREÇÃO ---
            return false;
        }
    }, []);

    useEffect(() => {
        const loadAndHideSplash = async () => {
            console.log('[InitialLayout | useEffect Init] Initiating splash screen process.');
            await checkWelcomeStatus(); // Ensures welcome status is loaded before hiding splash
            setStorageLoading(false);
            SplashScreen.hideAsync();
            console.log('[InitialLayout | useEffect Init] Native splash screen hidden. Storage loading complete.');
        };
        loadAndHideSplash();
    }, [checkWelcomeStatus]); // Dependency array ensures this runs once or when checkWelcomeStatus changes

    useEffect(() => {
        // --- LOG: Current states on useEffect trigger ---
        console.groupCollapsed(`[InitialLayout | useEffect] Triggered Cycle - Path: ${pathname}`);
        console.log(`- storageLoading: ${storageLoading}`);
        console.log(`- authIsLoading: ${authIsLoading}`);
        console.log(`- isAuthenticated: ${isAuthenticated}`);
        console.log(`- user: ${user?.email ? user.email + ' (Role: ' + user.role + ')' : 'null/undefined'}`);
        console.log(`- isRegistrationInProgress (AuthContext): ${isRegistrationInProgress}`);
        console.log(`- current pathname: ${pathname}`);

        // --- Early Exit Condition ---
        if (storageLoading || authIsLoading || (isAuthenticated && !user?.role)) {
            console.warn(`[InitialLayout | useEffect] Early Exit: Component state not ready. Details: storageLoading=${storageLoading}, authIsLoading=${authIsLoading}, isAuthenticated=${isAuthenticated}, userHasRole=${!!user?.role}`);
            console.groupEnd(); // End group for this decision cycle
            return;
        }

        console.log('[InitialLayout | useEffect] State ready. Proceeding to decideAndRedirect logic.');

        const inAuthGroup = segments[0] === '(auth)';
        const isWelcomeRoute = pathname === '/welcome';

        const decideAndRedirect = async () => {
            const currentHasViewedWelcome = await checkWelcomeStatus();

            // --- LOG: Final State for Redirection Decision ---
            console.log(`[InitialLayout | decideAndRedirect] Decision State:`);
            console.log(`  - Authenticated: ${isAuthenticated}`);
            console.log(`  - User Role: ${user?.role || 'N/A'}`);
            console.log(`  - Current Path: '${pathname}'`); // Adicionar aspas para ver espaços exatos
            console.log(`  - In Auth Group: ${inAuthGroup}`);
            console.log(`  - Is Welcome Route: ${isWelcomeRoute}`);
            console.log(`  - Has Viewed Welcome: ${currentHasViewedWelcome}`);
            console.log(`  - Is Registration In Progress (AuthContext): ${isRegistrationInProgress}`);
            console.log(`  - Provider Verification Status: ${user?.providerDetails?.verificationStatus || 'N/A'}`);

            // --- REDIRECTION PRIORITIES ---

            // 1. Welcome Screen: If not viewed and not currently on it.
            if (!currentHasViewedWelcome && !isWelcomeRoute) {
                console.log('[InitialLayout | decideAndRedirect] ACTION: Redirecting to /welcome (Welcome screen not viewed).');
                router.replace('/welcome');
                console.groupEnd(); // End group for this decision cycle
                return; // CRITICAL: Exit immediately after redirect
            } else if (isWelcomeRoute) {
                console.log('[InitialLayout | decideAndRedirect] INFO: User is on /welcome route. Permitting stay.');
                console.groupEnd(); // End group for this decision cycle
                return; // CRITICAL: Stay on welcome route if already there.
            }

            // 2. Unauthenticated State: If not authenticated.
            if (!isAuthenticated) {
                if (!inAuthGroup) { // If not authenticated AND not in a general auth group (like /login, /register-options)
                    console.log('[InitialLayout | decideAndRedirect] ACTION: User NOT authenticated and outside (auth) group. Redirecting to /(auth)/login.');
                    router.replace(AUTH_ROUTES.LOGIN as any);
                    console.groupEnd(); // End group for this decision cycle
                    return;
                }
                console.log('[InitialLayout | decideAndRedirect] INFO: User NOT authenticated but is within (auth) group. Permitting stay.');
                console.groupEnd(); // End group for this decision cycle
                return;
            }

            // --- From here, the user is AUTHENTICATED ---

            // 3. Provider Registration/Verification Flow: High priority for providers in specific states.
            const currentPath = pathname as string;
            
            // --- Normalização de strings para comparação robusta ---
            const normalizePath = (path: string) => {
                let p = path.trim(); // Remove espaços em branco nas extremidades
                // Se for a rota raiz de um grupo (e.g., /(auth)), não remova a barra final.
                // Caso contrário, remova a barra final se existir para evitar inconsistências.
                if (p.endsWith('/') && p.length > 1 && !/\/\(\w+\)\/$/.test(p)) {
                    p = p.slice(0, -1);
                }
                return p;
            };

            const cleanedCurrentPath = normalizePath(currentPath);
            const authRegisterStep1 = normalizePath(AUTH_ROUTES.PROVIDER_REGISTER_STEP1);
            const authServiceDetailsStep = normalizePath(AUTH_ROUTES.SERVICE_DETAILS_STEP);
            const authVerifyAccountStep = normalizePath(AUTH_ROUTES.VERIFY_ACCOUNT_STEP);

            // --- LOGS DE DEBURAÇÃO CRÍTICOS PARA ANÁLISE DE STRINGS NORMALIZADAS ---
            console.log(`[DEBUG PATH COMPARISON] Current Path (raw): '${currentPath}'`);
            console.log(`[DEBUG PATH COMPARISON] Current Path (normalized): '${cleanedCurrentPath}'`);
            console.log(`[DEBUG PATH COMPARISON] AUTH_ROUTES.PROVIDER_REGISTER_STEP1 (normalized): '${authRegisterStep1}'`);
            console.log(`[DEBUG PATH COMPARISON] AUTH_ROUTES.SERVICE_DETAILS_STEP (normalized): '${authServiceDetailsStep}'`);
            console.log(`[DEBUG PATH COMPARISON] AUTH_ROUTES.VERIFY_ACCOUNT_STEP (normalized): '${authVerifyAccountStep}'`);
            console.log(`[DEBUG PATH COMPARISON] Current Path === AUTH_ROUTES.VERIFY_ACCOUNT_STEP? ${cleanedCurrentPath === authVerifyAccountStep}`);
            
            const isProviderPendingVerification = user?.role === UserRole.PROVIDER && 
                                                    user?.providerDetails?.verificationStatus !== 'APPROVED';

            console.log(`[InitialLayout | decideAndRedirect] Provider Flow Check:`);
            console.log(`  - user.role: ${user?.role}`);
            console.log(`  - isRegistrationInProgress (from AuthContext): ${isRegistrationInProgress}`);
            console.log(`  - isProviderPendingVerification (calculated): ${isProviderPendingVerification}`);

            // LÓGICA REVISADA PARA PROVEDOR:
            if (user?.role === UserRole.PROVIDER) {
                if (isRegistrationInProgress) {
                    // Se o registro inicial ainda está em progresso (ex: acabou de se cadastrar, mas ainda não chegou na verificação)
                    // Leva para a tela de detalhes de serviço, se não estiver nela.
                    if (cleanedCurrentPath !== authServiceDetailsStep && cleanedCurrentPath !== authVerifyAccountStep) {
                        console.log(`[InitialLayout | decideAndRedirect] ACTION: Provider (${user.email}) registration in progress, not on service details/verification page ('${pathname}'). Redirecting to: '${authServiceDetailsStep}'.`);
                        router.replace(authServiceDetailsStep as any);
                        console.groupEnd();
                        return;
                    } else if (cleanedCurrentPath === authServiceDetailsStep) {
                        console.log(`[InitialLayout | decideAndRedirect] INFO: Provider (${user.email}) registration in progress, correctly on service details page ('${pathname}'). Permitting to proceed.`);
                        console.groupEnd();
                        return;
                    }
                    // Se isRegistrationInProgress for true e ele estiver na tela de verify-account, ele segue para a próxima condição (isProviderPendingVerification)
                    // ou para a lógica geral se ambos forem falsos.
                }

                if (isProviderPendingVerification) {
                    // Provedor precisa verificar ou está em processo.
                    // Se NÃO está na tela de verificação, redirecione para ela.
                    if (cleanedCurrentPath !== authVerifyAccountStep) {
                        console.log(`[InitialLayout | decideAndRedirect] ACTION: Provider (${user.email}) pending verification, not on verification page ('${pathname}'). Redirecting to: '${authVerifyAccountStep}'.`);
                        router.replace(authVerifyAccountStep as any);
                        console.groupEnd();
                        return;
                    } else {
                        // Já está na tela de verificação. Permitir que permaneça.
                        console.log(`[InitialLayout | decideAndRedirect] INFO: Provider (${user.email}) pending verification, correctly on verification page ('${pathname}'). Permitting to proceed.`);
                        console.groupEnd();
                        return;
                    }
                }
                // Se isRegistrationInProgress é false E isProviderPendingVerification é false (status 'APPROVED'),
                // o fluxo continua para a lógica geral abaixo, que o levará para o dashboard do provedor.
            }

            // --- From here, user is AUTHENTICATED and NOT a provider with pending initial registration or pending verification. ---
            // (Isso inclui provedores com status 'APPROVED' agora)
            let targetRoute: string | null = null; 
            let shouldPerformRedirect = false;

            const isCurrentPathInClientGroup = segments[0] === '(client)';
            const isCurrentPathInProviderGroup = segments[0] === '(provider)';
            const isCurrentPathInCommonGroup = segments[0] === '(common)';

            console.log(`[InitialLayout | decideAndRedirect] General Role-Based Redirection Check:`);
            console.log(`  - Current segment: ${segments[0]}`);

            if (user?.role === UserRole.ADMIN) {
                if (user?.clientDetails) {
                    targetRoute = CLIENT_ROUTES.EXPLORE;
                    if (!isCurrentPathInClientGroup && !isCurrentPathInCommonGroup) {
                        shouldPerformRedirect = true;
                    }
                } else if (user?.providerDetails) {
                    targetRoute = PROVIDER_ROUTES.DASHBOARD;
                    if (!isCurrentPathInProviderGroup && !isCurrentPathInCommonGroup) {
                        shouldPerformRedirect = true;
                    }
                } else {
                    targetRoute = CLIENT_ROUTES.EXPLORE; 
                    if (!isCurrentPathInClientGroup && !isCurrentPathInCommonGroup && !isCurrentPathInProviderGroup) { 
                        shouldPerformRedirect = true;
                    }
                    console.warn('[InitialLayout | decideAndRedirect] WARNING: Authenticated ADMIN user without associated client/provider profile. Defaulting to client route or staying if on a common/client/provider route.');
                }
            } else if (user?.role === UserRole.CLIENT) {
                targetRoute = CLIENT_ROUTES.EXPLORE;
                if (!isCurrentPathInClientGroup && !isCurrentPathInCommonGroup) {
                    shouldPerformRedirect = true;
                }
            } else if (user?.role === UserRole.PROVIDER) {
                // Este bloco agora só será alcançado se user.providerDetails.verificationStatus FOR 'APPROVED'
                targetRoute = PROVIDER_ROUTES.DASHBOARD;
                if (!isCurrentPathInProviderGroup && !isCurrentPathInCommonGroup) {
                    shouldPerformRedirect = true;
                }
            } else {
                console.warn('[InitialLayout | decideAndRedirect] WARNING: Authenticated user with unknown or null role. Redirecting to login.');
                targetRoute = AUTH_ROUTES.LOGIN;
                shouldPerformRedirect = true;
            }

            if (targetRoute) {
                const normalizedTargetRoute = normalizePath(targetRoute);
                const targetBase = normalizedTargetRoute.replace(/\/\(\w+\)/, ''); 
                const currentPathBase = cleanedCurrentPath.replace(/\/\(\w+\)/, ''); 

                console.log(`[InitialLayout | decideAndRedirect] Final Redirection Evaluation:`);
                console.log(`  - Proposed targetRoute (normalized): '${normalizedTargetRoute}'`);
                console.log(`  - current pathname (normalized): '${cleanedCurrentPath}'`);
                console.log(`  - targetBase: '${targetBase}'`);
                console.log(`  - currentPathBase: '${currentPathBase}'`);
                console.log(`  - inAuthGroup: ${inAuthGroup}`);
                console.log(`  - shouldPerformRedirect (pre-final check): ${shouldPerformRedirect}`);

                if (cleanedCurrentPath === normalizedTargetRoute || (normalizedTargetRoute.includes('/(') && currentPathBase === targetBase)) {
                    shouldPerformRedirect = false;
                    console.log(`[InitialLayout | decideAndRedirect] INFO: Already on target route or its equivalent base. No redirect needed.`);
                }
                
                if (inAuthGroup && !normalizedTargetRoute.includes('/(') && cleanedCurrentPath !== normalizedTargetRoute) {
                    shouldPerformRedirect = true;
                    console.log(`[InitialLayout | decideAndRedirect] INFO: Authenticated user in (auth) group, redirecting to non-(auth) target route.`);
                }
            } else {
                shouldPerformRedirect = false; 
                console.log(`[InitialLayout | decideAndRedirect] INFO: No valid target route determined. No redirect needed.`);
            }

            if (shouldPerformRedirect && targetRoute && cleanedCurrentPath !== normalizePath(targetRoute)) {
                console.log(`[InitialLayout | decideAndRedirect] ACTION: Final redirecting ${user?.role || 'N/A'} from '${cleanedCurrentPath}' to: '${normalizePath(targetRoute)}'`);
                router.replace(normalizePath(targetRoute) as any);
                console.groupEnd();
                return; 
            } else {
                console.log(`[InitialLayout | decideAndRedirect] INFO: User ${user?.role || 'N/A'} is already on the correct route ('${cleanedCurrentPath}') or no redirection action was necessary. Final shouldPerformRedirect: ${shouldPerformRedirect}.`);
                console.groupEnd();
            }
        };

        decideAndRedirect();

    }, [isAuthenticated, user, storageLoading, authIsLoading, router, segments, pathname, checkWelcomeStatus, isRegistrationInProgress]);

    if (storageLoading || authIsLoading) {
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