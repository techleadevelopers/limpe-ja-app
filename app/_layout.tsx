// LimpeJaApp/app/_layout.tsx
import React, { useEffect, useState, useCallback } from 'react';
import { Slot, SplashScreen, useRouter, usePathname, useSegments } from 'expo-router';
import { AuthProvider } from '../contexts/AuthContext';
import { AppProvider } from '../contexts/AppContext';
import { ActivityIndicator, View, StyleSheet, Text } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

import { UserRole } from './types/backend/auth'; // AJUSTE O CAMINHO SE NECESSÁRIO!

// CORRIGIDO: Caminho de importação para as rotas
import { AUTH_ROUTES, CLIENT_ROUTES, PROVIDER_ROUTES } from '../constants/routes'; 

// CORRIGIDO: Caminho de importação para ProviderRegistrationProvider
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
    console.log(`[InitialLayout useEffect] Triggered. Current states: storageLoading=${storageLoading}, authIsLoading=${authIsLoading}, isAuthenticated=${isAuthenticated}, user=${user?.email}, isRegistrationInProgress=${isRegistrationInProgress}, pathname=${pathname}`);

    // Se ainda está carregando o armazenamento ou autenticação, ou o objeto de usuário está incompleto, espere.
    if (storageLoading || authIsLoading || (isAuthenticated && !user?.role)) {
      console.log(`[InitialLayout useEffect] Early exit: Still loading or user object incomplete. storageLoading=${storageLoading}, authIsLoading=${authIsLoading}, isAuthenticated=${isAuthenticated}, userHasRole=${!!user?.role}`);
      return;
    }

    console.log(`[InitialLayout useEffect] Proceeding to decideAndRedirect. isAuthenticated=${isAuthenticated}`);

    const inAuthGroup = segments[0] === '(auth)';
    const isWelcomeRoute = pathname === '/welcome';

    const decideAndRedirect = async () => {
      const currentHasViewedWelcome = await checkWelcomeStatus();
      console.log(`[InitialLayout] decideAndRedirect called. Final State for decision: Auth=${isAuthenticated}, Role=${user?.role}, Path=${pathname}, InAuthGroup=${inAuthGroup}, IsWelcome=${isWelcomeRoute}, HasViewedWelcome=${currentHasViewedWelcome}, IsRegistrationInProgress=${isRegistrationInProgress}`);

      // 1. Prioridade máxima: Tela de Boas-Vindas (se ainda não vista e não estamos nela)
      if (!currentHasViewedWelcome && !isWelcomeRoute) {
          console.log('[InitialLayout] WelcomeScreen not viewed. Redirecionando para /welcome.');
          router.replace('/welcome');
          return;
      }

      // 2. Prioridade alta: Fluxo de Registro em Andamento
      // Se o usuário está autenticado E o registro ainda está em andamento,
      // ele DEVE permanecer nas rotas específicas do fluxo de registro.
      // Qualquer outra rota (como `/dashboard` antes do fim do fluxo) deve ser redirecionada para a próxima etapa de registro.
      const isPartOfRegistrationFlowRoutes = 
        pathname.startsWith(AUTH_ROUTES.PROVIDER_REGISTER_STEP1) || 
        pathname.startsWith(AUTH_ROUTES.CLIENT_REGISTER) ||
        pathname === AUTH_ROUTES.SERVICE_DETAILS_STEP || 
        pathname === AUTH_ROUTES.VERIFY_ACCOUNT_STEP;    

      if (isAuthenticated && isRegistrationInProgress) {
        if (!isPartOfRegistrationFlowRoutes) {
          // Se o usuário está autenticado, registro em andamento, mas NÃO está em uma rota de registro,
          // redirecione-o para a próxima etapa do registro.
          console.log(`[InitialLayout] Usuário autenticado e registro em andamento, mas em rota inesperada (${pathname}). Redirecionando para a próxima etapa de registro.`);
          router.replace(AUTH_ROUTES.SERVICE_DETAILS_STEP as any); 
          return;
        } else {
          console.log(`[InitialLayout] Usuário autenticado e registro em andamento em rota de registro (${pathname}). Permitindo prosseguir.`);
          return; 
        }
      }


      // 3. Checagem de Autenticação Geral (Só prossegue se o registro NÃO estiver em andamento)
      if (!isAuthenticated) {
          console.log(`[InitialLayout] User is NOT authenticated. Current path: ${pathname}. InAuthGroup: ${inAuthGroup}. IsWelcomeRoute: ${isWelcomeRoute}`);
          if (!inAuthGroup && !isWelcomeRoute) {
              console.log('[InitialLayout] Not authenticated and outside auth/welcome group. Redirecionando para /(auth)/login.');
              router.replace(AUTH_ROUTES.LOGIN as any); 
          } else {
              console.log('[InitialLayout] Not authenticated, staying on auth or welcome route.');
          }
          return;
      }

      // A partir daqui, o usuário está autenticado (isAuthenticated é true) E o registro NÃO está mais em andamento (isRegistrationInProgress é false).
      // Agora, a lógica de redirecionamento baseada na função do usuário pode ser aplicada.
      let targetRoute: string;
      let shouldPerformRedirect = false;

      // Verifica se o caminho atual está em um grupo específico
      const isCurrentPathInClientGroup = segments[0] === '(client)';
      const isCurrentPathInProviderGroup = segments[0] === '(provider)';
      const isCurrentPathInCommonGroup = segments[0] === '(common)';

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
              if (isCurrentPathInClientGroup || isCurrentPathInCommonGroup) {
                  targetRoute = pathname;
                  console.log(`[InitialLayout] Admin (sem perfil específico) permanecendo no caminho relacionado ao cliente/comum: ${pathname}`);
                  shouldPerformRedirect = false;
              } else if (isCurrentPathInProviderGroup) {
                  console.warn('[InitialLayout] Usuário ADMIN sem perfil de provedor associado tentando acessar rota de provedor. Redirecionando para rota de cliente por padrão.');
                  targetRoute = CLIENT_ROUTES.EXPLORE;
                  shouldPerformRedirect = true;
              } else {
                  console.warn('[InitialLayout] Usuário ADMIN sem perfil de cliente/provedor associado detectado no frontend. Redirecionando para rota de cliente por padrão.');
                  targetRoute = CLIENT_ROUTES.EXPLORE;
                  shouldPerformRedirect = true;
              }
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
          console.warn('[InitialLayout] Usuário autenticado com role desconhecido ou nulo. Redirecionando para login.');
          targetRoute = AUTH_ROUTES.LOGIN;
          shouldPerformRedirect = true;
      }

      // Condições adicionais para redirecionamento (ex: vindo do grupo de autenticação/boas-vindas)
      if (inAuthGroup || isWelcomeRoute) {
          shouldPerformRedirect = true;
      }

      // Evitar redirecionamento se já estiver na rota alvo ou em uma sub-rota dela
      const targetBase = targetRoute.replace(/\/\(\w+\)/, '');
      if (pathname === targetRoute || (targetRoute.startsWith('/(') && pathname.startsWith(targetBase) && pathname !== targetBase)) {
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