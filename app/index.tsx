// LimpeJaApp/app/index.tsx
import React, { useEffect } from 'react';
import { View, ActivityIndicator, StyleSheet, Text } from 'react-native';
import { Redirect, useRouter } from 'expo-router';
import { useAuth } from '../hooks/useAuth'; // Ajuste o caminho se 'hooks' não estiver na raiz e sim em 'src/hooks'

export default function IndexScreen() {
  const { isAuthenticated, isLoading, user } = useAuth();
  const router = useRouter(); // Embora Redirect seja usado, ter router pode ser útil para logs

  console.log('[IndexScreen] Renderizando. isLoading:', isLoading, 'isAuthenticated:', isAuthenticated, 'User role:', user?.role);

  // Se o estado de autenticação ainda está carregando, mostre um spinner.
  // O _layout.tsx também faz isso, mas uma verificação aqui não faz mal e cobre casos de transição.
  if (isLoading) {
    console.log('[IndexScreen] AuthContext ainda está carregando (isLoading é true). Mostrando spinner.');
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#007bff" />
        <Text>Carregando App...</Text>
      </View>
    );
  }

  // Se chegou aqui, isLoading é false.
  if (isAuthenticated) {
    // Usuário está autenticado. O _layout.tsx deveria ter redirecionado para a home do perfil.
    // Se, por algum motivo, um usuário autenticado chegar aqui (na rota '/'),
    // redirecionamos novamente para garantir.
    console.log('[IndexScreen] Autenticado. Redirecionando para a home do perfil...');
    if (user?.role === 'client') {
      return <Redirect href="/(client)/explore" />;
    } else if (user?.role === 'provider') {
      return <Redirect href="/(provider)/dashboard" />;
    } else {
      // Autenticado mas sem role ou role desconhecido. Pode ser um problema de dados.
      // Redirecionar para login pode ser um fallback seguro para evitar um estado quebrado.
      console.warn('[IndexScreen] Usuário autenticado mas sem role definido ou role desconhecido. Redirecionando para login.');
      return <Redirect href="/(auth)/login" />;
    }
  } else {
    // Usuário NÃO está autenticado E não está carregando.
    // Esta é a situação mais provável se _layout.tsx logou "Staying." na rota "/".
    // Redireciona para a tela de login.
    console.log('[IndexScreen] Não autenticado. Redirecionando para / (auth)/login.');
    return <Redirect href="/(auth)/login" />;
  }

  // Este ponto não deveria ser alcançado se a lógica acima estiver correta,
  // mas como fallback, podemos mostrar um spinner.
  // return (
  //   <View style={styles.container}>
  //     <ActivityIndicator size="large" />
  //     <Text>Redirecionando...</Text>
  //   </View>
  // );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#e0e0e0', // Cor de fundo para diferenciar da splash ou loading do _layout
  },
});