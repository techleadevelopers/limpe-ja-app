// Em app/_layout.tsx
import React, { useEffect, useState, useCallback } from 'react';
import { Slot, SplashScreen, useRouter, usePathname } from 'expo-router';
import { AuthProvider } from '../contexts/AuthContext';
import { useAuth } from '../hooks/useAuth';
import { AppProvider } from '../contexts/AppContext';
import { ActivityIndicator, View, StyleSheet, Text } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

console.log("[_layout.tsx] Configuração do Firebase SDK COMENTADA.");

SplashScreen.preventAutoHideAsync();

const WELCOME_SCREEN_VIEWED_KEY = 'welcomeScreenViewed';

function InitialLayout() {
  const { isAuthenticated, isLoading: authIsLoading, user } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  // Estados para controlar o carregamento e o fluxo inicial
  const [storageLoading, setStorageLoading] = useState(true); // Novo: para o carregamento do AsyncStorage
  const [hasViewedWelcome, setHasViewedWelcome] = useState(false); // Novo: estado local para welcomeScreenViewed
  const [initialRouteDecided, setInitialRouteDecided] = useState(false); // Novo: para controlar se a 1ª decisão de rota foi feita

  // 1. Verifica se a welcome screen já foi vista (apenas uma vez no mount)
  useEffect(() => {
    const checkWelcomeStatus = async () => {
      try {
        const value = await AsyncStorage.getItem(WELCOME_SCREEN_VIEWED_KEY);
        setHasViewedWelcome(value === 'true');
        console.log('[InitialLayout] Status da WelcomeScreen lido do AsyncStorage:', value === 'true');
      } catch (e) {
        console.warn("[InitialLayout] Erro ao ler status da welcome screen:", e);
        setHasViewedWelcome(false); // Assume não vista em caso de erro
      } finally {
        setStorageLoading(false); // Finaliza o loading do AsyncStorage
      }
    };
    checkWelcomeStatus();
  }, []);

  // 2. useEffect principal para decisões de navegação
  useEffect(() => {
    // Aguarda todos os carregamentos críticos: AsyncStorage e AuthContext
    if (storageLoading || authIsLoading) {
      console.log(`[InitialLayout] Aguardando: storageLoading=${storageLoading}, authIsLoading=${authIsLoading}`);
      return;
    }

    // Se a rota inicial já foi decidida, não faz mais nada este useEffect
    // a menos que queiramos observar mudanças de autenticação para redirecionar de qualquer lugar (mais complexo).
    // Por agora, vamos focar em estabilizar o fluxo inicial.
    if (initialRouteDecided && pathname !== '/') { // A condição pathname !== '/' é para caso o usuário volte para a raiz
        console.log('[InitialLayout] Rota inicial já decidida, pathname atual:', pathname);
        // Se autenticado e em rota de auth/welcome, redireciona
        if (isAuthenticated) {
            const isAuthOrWelcomeRoute = pathname.startsWith('/(auth)') || pathname === '/welcome';
            if(isAuthOrWelcomeRoute){
                const targetRoute = user?.role === 'client' ? '/(client)/explore' : user?.role === 'provider' ? '/(provider)/dashboard' : '/';
                console.log(`[InitialLayout] Usuário autenticado em rota ${pathname}, redirecionando para ${targetRoute} (pós decisão inicial)`);
                router.replace(targetRoute);
            }
        }
        return;
    }


    SplashScreen.hideAsync();
    console.log('[InitialLayout] Splash nativa escondida.');

    if (!hasViewedWelcome) {
      // Se a welcome screen ainda não foi vista (baseado no AsyncStorage lido uma vez), navega para ela.
      // A WelcomeScreen.tsx será responsável por navegar para o login depois E ATUALIZAR O ASYNCSTORAGE.
      if (pathname !== '/welcome') {
        console.log('[InitialLayout] WelcomeScreen não vista. Redirecionando para /welcome.');
        router.replace('/welcome');
      }
    } else {
      // Welcome screen JÁ foi vista. Procede com a lógica de autenticação.
      console.log('[InitialLayout] WelcomeScreen JÁ vista. Verificando autenticação.');
      if (isAuthenticated) {
        console.log('[InitialLayout] Autenticado. Usuário:', user?.role);
        const targetRoute = user?.role === 'client' ? '/(client)/explore' : user?.role === 'provider' ? '/(provider)/dashboard' : '/(auth)/login'; // Fallback para login se role for estranho
        const isAuthOrWelcomeRoute = pathname.startsWith('/(auth)') || pathname === '/welcome' || pathname === '/';

        if (isAuthOrWelcomeRoute || pathname !== targetRoute) { // Evita loop se já estiver no destino
          console.log(`[InitialLayout] Redirecionando usuário ${user?.role} para ${targetRoute}. Pathname atual: ${pathname}`);
          router.replace(targetRoute);
        }
      } else {
        // Não autenticado e welcome já vista.
        const isAuthRoute = pathname.startsWith('/(auth)');
        if (!isAuthRoute) { // Se não estiver já numa rota de auth (ex: /register)
          console.log('[InitialLayout] Não autenticado e welcome vista. Redirecionando para /(auth)/login.');
          router.replace('/(auth)/login');
        } else {
          console.log('[InitialLayout] Não autenticado e welcome vista. Já em rota de autenticação:', pathname);
        }
      }
    }
    setInitialRouteDecided(true); // Marca que a primeira decisão de rota foi tomada nesta sessão.

  // ATENÇÃO: Reduzir as dependências para evitar re-execuções desnecessárias que causam loop.
  // A lógica aqui é para o roteamento INICIAL. Uma vez decidido, não deveria re-rotear de forma agressiva.
  // 'pathname' é problemático aqui se outras telas (login, welcome) também usam router.replace(),
  // pois cada replace muda o pathname e re-triggera este useEffect.
  // A flag `initialRouteDecided` ajuda a mitigar isso.
  // Se `user` muda (ex: após login), queremos que ele reavalie para o redirecionamento pós-login.
  }, [storageLoading, authIsLoading, hasViewedWelcome, isAuthenticated, user, router, initialRouteDecided, pathname]);


  // Tela de carregamento enquanto o AsyncStorage ou o AuthContext estão carregando.
  if (storageLoading || authIsLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={styles.loadingText}>Preparando LimpeJá...</Text>
      </View>
    );
  }

  return <Slot />; // Renderiza a rota atual determinada pela lógica acima.
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