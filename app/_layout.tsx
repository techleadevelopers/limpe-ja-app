// LimpeJaApp/app/_layout.tsx
import React, { useEffect, useState, useCallback } from 'react';
import { Slot, SplashScreen, useRouter, usePathname, useSegments } from 'expo-router';
import { AuthProvider } from '../contexts/AuthContext';
import { useAuth } from '../hooks/useAuth';
import { AppProvider } from '../contexts/AppContext';
import { ActivityIndicator, View, StyleSheet, Text } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

import { UserRole } from './types/backend/auth'; // AJUSTE O CAMINHO SE NECESSÁRIO!

SplashScreen.preventAutoHideAsync();

const WELCOME_SCREEN_VIEWED_KEY = 'welcomeScreenViewed';

function InitialLayout() {
  const { isAuthenticated, isLoading: authIsLoading, user } = useAuth();
  const router = useRouter();
  const segments = useSegments();
  const pathname = usePathname();

  const [storageLoading, setStorageLoading] = useState(true);

  const checkWelcomeStatus = useCallback(async () => {
    try {
      const value = await AsyncStorage.getItem(WELCOME_SCREEN_VIEWED_KEY);
      return value === 'true';
    } catch (e) {
      console.warn("[InitialLayout] Error reading welcome screen status:", e);
      return false;
    }
  }, []);

  useEffect(() => {
    const loadAndHideSplash = async () => {
      await checkWelcomeStatus();
      setStorageLoading(false);
      SplashScreen.hideAsync();
      console.log('[InitialLayout] Native splash hidden.');
    };
    loadAndHideSplash();
  }, [checkWelcomeStatus]);

  useEffect(() => {
    if (storageLoading || authIsLoading || (isAuthenticated && !user?.role)) {
      console.log(`[InitialLayout] Still loading or user object incomplete. Waiting: storageLoading=${storageLoading}, authIsLoading=${authIsLoading}, isAuthenticated=${isAuthenticated}, userHasRole=${!!user?.role}`);
      return;
    }

    const inAuthGroup = segments[0] === '(auth)';
    const isWelcomeRoute = pathname === '/welcome';

    // Verifica se o caminho atual está em um grupo específico
    const isCurrentPathInClientGroup = segments[0] === '(client)';
    const isCurrentPathInProviderGroup = segments[0] === '(provider)';
    const isCurrentPathInCommonGroup = segments[0] === '(common)'; // Rotas comuns como settings, help, notifications

    const decideAndRedirect = async () => {
        const currentHasViewedWelcome = await checkWelcomeStatus();
        console.log(`[InitialLayout] Deciding route (Final State): Auth=${isAuthenticated}, Role=${user?.role}, Path=${pathname}, InAuthGroup=${inAuthGroup}, IsWelcome=${isWelcomeRoute}, HasViewedWelcome=${currentHasViewedWelcome}`);

        if (!currentHasViewedWelcome && !isWelcomeRoute) {
            console.log('[InitialLayout] WelcomeScreen not viewed. Redirecionando para /welcome.');
            router.replace('/welcome');
            return;
        }

        if (!isAuthenticated) {
            if (!inAuthGroup && !isWelcomeRoute) {
                console.log('[InitialLayout] Not authenticated and outside auth/welcome group. Redirecionando para /(auth)/login.');
                router.replace('/(auth)/login');
            } else {
                console.log('[InitialLayout] Not authenticated, staying on auth or welcome route.');
            }
            return;
        }

        // Se está autenticado (isAuthenticated é true)
        let targetRoute: string;
        let shouldPerformRedirect = false; // Flag para controlar o redirecionamento final

        if (user?.role === UserRole.ADMIN) {
            if (user?.clientDetails) {
                targetRoute = '/(client)/explore';
                // Se o ADMIN tem perfil de cliente, ele deve ir para o explore do cliente.
                // Redireciona se não estiver já no grupo cliente ou em uma rota comum.
                if (!isCurrentPathInClientGroup && !isCurrentPathInCommonGroup) {
                    shouldPerformRedirect = true;
                }
            } else if (user?.providerDetails) {
                targetRoute = '/(provider)/dashboard';
                // Se o ADMIN tem perfil de provedor, ele deve ir para o dashboard do provedor.
                // Redireciona se não estiver já no grupo provedor ou em uma rota comum.
                if (!isCurrentPathInProviderGroup && !isCurrentPathInCommonGroup) {
                    shouldPerformRedirect = true;
                }
            } else {
                // ADMIN sem detalhes específicos de cliente/provedor (pode ser um admin puro ou perfis não linkados).
                if (isCurrentPathInClientGroup || isCurrentPathInCommonGroup) {
                    targetRoute = pathname; // Permite que ele permaneça no caminho atual relacionado ao cliente/comum
                    console.log(`[InitialLayout] Admin (sem perfil específico) permanecendo no caminho relacionado ao cliente/comum: ${pathname}`);
                    shouldPerformRedirect = false; // Não há necessidade de redirecionamento
                } else if (isCurrentPathInProviderGroup) {
                    console.warn('[InitialLayout] Usuário ADMIN sem perfil de provedor associado tentando acessar rota de provedor. Redirecionando para rota de cliente por padrão.');
                    // CORREÇÃO AQUI: Se é ADMIN sem perfil de provedor, deve ir para a rota de cliente, NÃO de provedor.
                    targetRoute = '/(client)/explore'; // <--- CORREÇÃO!
                    shouldPerformRedirect = true; // Força o redirecionamento para o explore do cliente
                } else {
                    // Fallback padrão se o caminho não for reconhecido ou for a raiz
                    console.warn('[InitialLayout] Usuário ADMIN sem perfil de cliente/provedor associado detectado no frontend. Redirecionando para rota de cliente por padrão.');
                    targetRoute = '/(client)/explore';
                    shouldPerformRedirect = true;
                }
            }
        } else if (user?.role === UserRole.CLIENT) {
            targetRoute = '/(client)/explore';
            // Se o CLIENT já estiver no grupo cliente ou comum, permite que ele permaneça.
            // Se estiver no grupo provedor, redireciona para o explore do cliente.
            if (!isCurrentPathInClientGroup && !isCurrentPathInCommonGroup) {
                shouldPerformRedirect = true;
            }
        } else if (user?.role === UserRole.PROVIDER) {
            targetRoute = '/(provider)/dashboard';
            // Se o PROVIDER já estiver no grupo provedor ou comum, permite que ele permaneça.
            // Se estiver no grupo cliente, redireciona para o dashboard do provedor.
            if (!isCurrentPathInProviderGroup && !isCurrentPathInCommonGroup) {
                shouldPerformRedirect = true;
            }
        } else {
            console.warn('[InitialLayout] Usuário autenticado com role desconhecido ou nulo. Redirecionando para login.');
            targetRoute = '/(auth)/login';
            shouldPerformRedirect = true;
        }

        // Condições adicionais para redirecionamento (ex: vindo do grupo de autenticação/boas-vindas)
        if (inAuthGroup || isWelcomeRoute) {
            shouldPerformRedirect = true;
        }

        // Se o targetRoute for o pathname atual, não redirecionar, a menos que seja forçado
        if (targetRoute === pathname) {
            shouldPerformRedirect = false; // Já está na rota correta
        }
        
        // Se o targetRoute for a raiz de um grupo e o pathname for uma sub-rota desse grupo, não redirecionar
        // Ex: targetRoute = '/(client)/explore', pathname = '/explore/some-id'
        const targetBase = targetRoute.replace(/\/\(\w+\)/, ''); // Remove o grupo, ex: '/explore'
        if (targetRoute.startsWith('/(') && pathname.startsWith(targetBase) && pathname !== targetBase) {
               shouldPerformRedirect = false;
        }


        // Ação final de redirecionamento
        if (shouldPerformRedirect) {
            console.log(`[InitialLayout] Redirecionando ${user?.role} de ${pathname} para: ${targetRoute}`);
            router.replace(targetRoute as any);
        } else {
            console.log(`[InitialLayout] Usuário ${user?.role} já na rota correta (${pathname}). Permanecendo.`);
        }
    };

    decideAndRedirect();

  }, [isAuthenticated, user, storageLoading, authIsLoading, router, segments, pathname, checkWelcomeStatus]);

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
      <AppProvider>
        <InitialLayout />
      </AppProvider>
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