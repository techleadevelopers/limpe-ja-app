// LimpeJaApp/app/(client)/explore/servicos-por-categoria.tsx
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useLocalSearchParams, Stack } from 'expo-router';

export default function ServicosPorCategoriaScreen() {
  const { categoriaId, categoriaNome } = useLocalSearchParams<{ categoriaId: string, categoriaNome: string }>();
  return (
    <View style={styles.container}>
      <Stack.Screen options={{ title: categoriaNome || 'Serviços da Categoria' }} />
      <Text style={styles.title}>Serviços para: {categoriaNome}</Text>
      <Text>ID da Categoria: {categoriaId}</Text>
      {/* TODO: Implementar a lógica para buscar e listar serviços desta categoria */}
    </View>
  );
}
const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, alignItems: 'center' },
  title: { fontSize: 20, fontWeight: 'bold', marginBottom: 10 },
});