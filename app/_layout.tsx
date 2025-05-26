// LimpeJaApp/app/_layout.tsx
import React, { useEffect } from 'react';
import { Slot, SplashScreen, useRouter, usePathname } from 'expo-router'; // Importe usePathname
import { AuthProvider } from '../contexts/AuthContext';     // Ajuste o caminho se não houver 'src/'
import { useAuth } from '../hooks/useAuth';               // Ajuste o caminho se não houver 'src/'
import { ActivityIndicator, View, StyleSheet, Text } from 'react-native';
import { AppProvider } from '../contexts/AppContext';       // Ajuste o caminho se não houver 'src/'

SplashScreen.preventAutoHideAsync();

function InitialLayout() {
  const { isAuthenticated, isLoading, user } = useAuth();
  const router = useRouter();
  const pathname = usePathname(); // Caminho atual, ex: "/login", "/explore", "/explore/provider1"

  useEffect(() => {
    console.log('[_layout InitialLayout] useEffect. isLoading:', isLoading, 'isAuthenticated:', isAuthenticated, 'User role:', user?.role, 'Pathname:', pathname);

    if (isLoading) {
      console.log('[_layout InitialLayout] Still loading.');
      return;
    }

    SplashScreen.hideAsync();

    // Define os prefixos das rotas que estão DENTRO do grupo (auth)
    // O Expo Router normaliza os pathnames removendo os segmentos de grupo como (auth)
    const authRouteActualPrefixes = ['/login', '/register-options', '/client-register', '/provider-register'];
    const isCurrentlyOnAuthRoute = authRouteActualPrefixes.some(prefix => pathname.startsWith(prefix));

    if (isAuthenticated) {
      // Usuário está autenticado
      if (isCurrentlyOnAuthRoute) {
        // Se estiver autenticado E em uma rota de autenticação, redireciona para a home do seu perfil
        console.log('[_layout InitialLayout] Authenticated & on auth route. Redirecting to role home...');
        if (user?.role === 'client') {
          router.replace('/(client)/explore'); // Navega USANDO o grupo para carregar o layout do cliente
        } else if (user?.role === 'provider') {
          router.replace('/(provider)/dashboard'); // Navega USANDO o grupo para carregar o layout do provedor
        } else {
          // Role desconhecido, talvez deslogar ou enviar para uma tela de erro/completar perfil
          console.warn('[_layout InitialLayout] Authenticated user with no/unknown role. Redirecting to login as fallback.');
          router.replace('/(auth)/login');
        }
      }
      // Se autenticado e NÃO em uma rota de autenticação (ex: já em /explore/provider1),
      // significa que o Expo Router já resolveu a rota para uma tela válida dentro de (client) ou (provider).
      // Não precisamos fazer mais redirecionamentos aqui a partir do RootLayout para este caso.
      // A navegação interna é tratada pelos componentes ou pelos layouts dos grupos (client)/(provider).
      console.log('[_layout InitialLayout] Authenticated and not on auth route. Pathname:', pathname, '. Letting Expo Router handle rendering via Slot.');

    } else {
      // Usuário NÃO está autenticado
      if (!isCurrentlyOnAuthRoute) {
        // Se não estiver autenticado E não estiver já em uma rota de autenticação,
        // redireciona para a tela de login.
        // (Exceção: se app/index.tsx (pathname '/') for uma tela pública de boas-vindas, você não faria isso para '/')
        if (pathname !== '/') { // Não redireciona se estiver na raiz pública (se houver)
            console.log('[_layout InitialLayout] Not authenticated & not on auth route or public root. Redirecting to login. Pathname:', pathname);
            router.replace('/(auth)/login');
        } else {
            console.log('[_layout InitialLayout] Not authenticated but on public root path. Staying.');
        }
      } else {
        console.log('[_layout InitialLayout] Not authenticated and already in auth group. No redirect needed by _layout.');
      }
    }
  }, [isAuthenticated, isLoading, user, pathname, router]);

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007bff" />
      </View>
    );
  }

  // Log para ver qual rota o Slot está tentando renderizar
  console.log('[_layout InitialLayout] Rendering Slot for pathname:', pathname);
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
});