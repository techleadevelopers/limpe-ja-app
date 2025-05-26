// LimpeJaApp/app/(client)/explore/todas-categorias.tsx
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Stack } from 'expo-router';

export default function TodasCategoriasScreen() {
  return (
    <View style={styles.container}>
      <Stack.Screen options={{ title: 'Todas as Categorias' }} />
      <Text style={styles.title}>Todas as Categorias</Text>
      {/* TODO: Implementar a lógica para listar todas as categorias */}
    </View>
  );
}
const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, alignItems: 'center' },
  title: { fontSize: 20, fontWeight: 'bold' },
});