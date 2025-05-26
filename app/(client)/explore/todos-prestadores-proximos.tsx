// LimpeJaApp/app/(client)/explore/todos-prestadores-proximos.tsx
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Stack } from 'expo-router';

export default function TodosPrestadoresProximosScreen() {
  return (
    <View style={styles.container}>
      <Stack.Screen options={{ title: 'Prestadores Próximos' }} />
      <Text style={styles.title}>Todos os Prestadores Próximos</Text>
      {/* TODO: Implementar a lógica para listar todos os prestadores próximos */}
    </View>
  );
}
const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, alignItems: 'center' },
  title: { fontSize: 20, fontWeight: 'bold' },
});