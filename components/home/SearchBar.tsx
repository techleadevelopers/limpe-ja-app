// LimpeJaApp/components/SearchBar.tsx
import React from 'react';
import { View, TextInput, StyleSheet, TouchableOpacity, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export default function SearchBar() {
  return (
    <View style={styles.container}>
      <View style={styles.searchWrapper}>
        <Ionicons name="search-outline" size={20} color="#718096" style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search"
          placeholderTextColor="#A0AEC0"
        />
      </View>
      <TouchableOpacity style={styles.seeAllButton}>
        <Text style={styles.seeAllText}>See All</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  searchWrapper: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF', // Fundo claro para a barra de pesquisa
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 15,
    shadowColor: 'rgba(0,0,0,0.05)', // Sombra sutil
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.8,
    shadowRadius: 4,
    elevation: 2,
  },
  searchIcon: {
    marginRight: 10,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#2D3748',
  },
  seeAllButton: {
    marginLeft: 15,
    paddingVertical: 10,
    paddingHorizontal: 15,
    backgroundColor: '#EBF3FF', // Fundo azul claro para o botão
    borderRadius: 10,
  },
  seeAllText: {
    color: '#007BFF',
    fontWeight: '600',
    fontSize: 14,
  },
});