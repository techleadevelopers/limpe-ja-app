// LimpeJaApp/app/(client)/explore/search-results.tsx
import React from 'react';
import { View, Text, StyleSheet, FlatList } from 'react-native';
import { useLocalSearchParams, Stack } from 'expo-router';

export default function SearchResultsScreen() {
  const params = useLocalSearchParams(); // { query: 'faxina', location: 'centro', date: '...' }
  // TODO: Buscar dados da API com base nos params
  const mockResults = [
    { id: '1', name: 'Profissional A', rating: 4.5, price: 'R$50/hr' },
    { id: '2', name: 'Profissional B', rating: 4.8, price: 'R$60/hr' },
  ];

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ title: `Resultados para "${params.query || 'Busca'}"` }} />
      <Text style={styles.title}>Resultados da Busca</Text>
      <Text>Buscando por: {JSON.stringify(params)}</Text>
      {/* TODO: Implementar UI de resultados, filtros, mapa */}
      <FlatList
        data={mockResults}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View style={styles.item}>
            <Text>{item.name} - Avaliação: {item.rating} - {item.price}</Text>
          </View>
        )}
      />
    </View>
  );
}
const styles = StyleSheet.create({
  container: { flex: 1, padding: 10 },
  title: { fontSize: 20, fontWeight: 'bold', marginBottom: 10 },
  item: { padding: 10, borderBottomWidth: 1, borderBottomColor: '#eee'},
});