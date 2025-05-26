// LimpeJaApp/components/SaudacaoContainer.tsx
import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

const SaudacaoContainer: React.FC = () => {
  const [busca, setBusca] = useState('');
  const router = useRouter();

  const handleSearchSubmit = () => {
    // if (busca.trim()) { // Comentado para o teste
      console.log("SaudacaoContainer: Tentando navegar para /login (TESTE via SearchSubmit)");
      router.push('/(auth)/login'); // TESTE: Navega para login
      // Original:
      // router.push({
      //   pathname: '/(client)/explore/resultados-busca',
      //   params: { termoBusca: busca },
      // });
    // }
  };

  const handleFilterPress = () => {
    console.log("SaudacaoContainer: Tentando navegar para /login (TESTE via FilterPress)");
    router.push('/(auth)/login'); // TESTE: Navega para login
    // Original:
    // router.push('/(client)/explore/filtros-busca');
  };

  return (
    <View style={styles.saudacaoContainer}>
      <Text style={styles.saudacaoOla}>Olá, Usuário Demo!</Text>
      <Text style={styles.saudacaoPergunta}>O que você precisa limpar hoje?</Text>
      <View style={styles.buscaContainer}>
        <Ionicons name="search-outline" size={22} color="#888" style={styles.buscaIcone} />
        <TextInput
          style={styles.buscaInput}
          placeholder="Busque por serviço ou profissional..."
          placeholderTextColor="#A0A0A0"
          value={busca}
          onChangeText={setBusca}
          onSubmitEditing={handleSearchSubmit}
          returnKeyType="search"
        />
        <TouchableOpacity style={styles.filtroBotao} onPress={handleFilterPress}>
          <Ionicons name="options-outline" size={24} color="#FFFFFF" />
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  saudacaoContainer: {
    backgroundColor: '#E0EFFF',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 25,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
  },
  saudacaoOla: {
    fontSize: 28,
    fontWeight: '700',
    color: '#1C3A5F',
  },
  saudacaoPergunta: {
    fontSize: 17,
    color: '#2A5282',
    marginTop: 5,
    marginBottom: 20,
  },
  buscaContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 15,
    paddingHorizontal: 15,
    height: 52,
    shadowColor: '#003D7A',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 4,
  },
  buscaIcone: {
    marginRight: 12,
  },
  buscaInput: {
    flex: 1,
    fontSize: 16,
    color: '#333',
    height: '100%',
  },
  filtroBotao: {
    backgroundColor: '#007AFF',
    borderRadius: 12,
    padding: 10,
    marginLeft: 10,
    height: 44,
    width: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default SaudacaoContainer;