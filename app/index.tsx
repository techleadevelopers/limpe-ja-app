// LimpeJaApp/app/index.tsx
import React from 'react';
import { View, ActivityIndicator, StyleSheet, Text } from 'react-native';
// Remova Redirect e useAuth daqui se o _layout.tsx for o único a lidar com a navegação inicial.
// Mantenha apenas um indicador de carregamento ou uma tela inicial simples.

export default function IndexScreen() {
  // Este componente só será visto brevemente ou se não houver redirecionamento imediato.
  // A lógica pesada de autenticação e redirecionamento deve estar no _layout.tsx.
  console.log('[IndexScreen] Renderizando. Este é o ponto de entrada padrão.');

  return (
    <View style={styles.container}>
      <ActivityIndicator size="large" color="#007bff" />
      <Text>Iniciando Limpejá...</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#e0e0e0',
  },
});