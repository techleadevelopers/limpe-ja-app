// LimpeJaApp/app/(client)/explore/resultados-busca.tsx
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useLocalSearchParams, Stack } from 'expo-router';

export default function ResultadosBuscaScreen() {
  const { termoBusca } = useLocalSearchParams<{ termoBusca: string }>();
  return (
    <View style={styles.container}>
      <Stack.Screen options={{ title: `Resultados para: ${termoBusca}` }} />
      <Text style={styles.title}>Resultados para: "{termoBusca}"</Text>
      {/* TODO: Implementar a lógica de busca e exibição dos resultados */}
    </View>
  );
}
const styles = StyleSheet.create({
  container: { flex: 1, padding: 20 },
  title: { fontSize: 20, fontWeight: 'bold' }
});