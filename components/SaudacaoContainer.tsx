// LimpeJaApp/components/SaudacaoContainer.tsx
import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Keyboard, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
// import { BlurView } from 'expo-blur'; // Descomente se quiser um blur real no input da busca

const SaudacaoContainer: React.FC = () => {
  const [busca, setBusca] = useState('');
  const router = useRouter();

  const handleSearchSubmit = () => {
    Keyboard.dismiss(); // Esconde o teclado
    if (busca.trim()) {
      console.log(`SaudacaoContainer: Buscando por "${busca.trim()}"`);
      router.push({
        pathname: '/(client)/explore/search-results', // Rota de resultados da busca
        params: { query: busca.trim() },
      } as any); // Adicionado 'as any' para tipo de rota
    } else {
      // Opcional: feedback se a busca estiver vazia
      // Alert.alert("Busca", "Por favor, digite algo para buscar.");
    }
  };

  const handleFilterPress = () => {
    console.log("SaudacaoContainer: Navegando para filtros de busca");
    // TODO: Implementar navegação para uma tela de filtros se houver
    // router.push('/(client)/explore/filtros-busca');
    alert("Funcionalidade de Filtros em breve!");
  };

  const userName = "Usuário Demo"; // Mock do nome do usuário

  return (
    <View style={styles.outerContainer}>
      <View style={styles.saudacaoContent}>
        <Text style={styles.saudacaoOla}>Olá, {userName}!</Text>
        <Text style={styles.saudacaoPergunta}>O que você precisa limpar hoje? ✨</Text>
        
        {/* Barra de Busca com Efeito Neumorphic/Glassmorphic sutil */}
        <View style={styles.buscaContainer}>
          {/* Se quiser Blur real no input, descomente BlurView e ajuste o estilo */}
          {/* <BlurView intensity={10} tint="light" style={StyleSheet.absoluteFillObject} /> */}
          <Ionicons name="search-outline" size={22} color="#6C757D" style={styles.buscaIcone} />
          <TextInput
            style={styles.buscaInput}
            placeholder="Busque por serviço ou profissional..."
            placeholderTextColor="#ADB5BD"
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
    </View>
  );
};

const styles = StyleSheet.create({
  outerContainer: {
    // Este container pode ter uma imagem de fundo ou um gradiente que se estende
    // para criar um visual mais imersivo. Por enquanto, será apenas um View.
    // A cor de fundo principal da tela (explore/index.tsx) fará o "fundo avançado".
    backgroundColor: 'transparent', // O fundo virá da tela principal (explore/index.tsx)
    paddingBottom: 25, // Espaçamento inferior para a próxima seção
  },
  saudacaoContent: {
    backgroundColor: 'transparent', // O gradiente/fundo virá do HeaderSuperior e da tela
    paddingHorizontal: 20, // Mantido
    paddingTop: 10, // Espaçamento do topo
    // Removidas as bordas arredondadas inferiores, pois o HeaderSuperior já tem um formato.
  },
  saudacaoOla: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1C3A5F',
    marginBottom: 4,
  },
  saudacaoPergunta: {
    fontSize: 17,
    color: '#495057',
    marginBottom: 25,
  },
  buscaContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF', // Fundo branco para o campo de busca
    borderRadius: 15,
    paddingHorizontal: 15,
    height: 58, // Ligeiramente mais alto para um toque premium
    // Sombra para efeito de "flutuação" (neumorphism/glassmorphism sutil)
    ...Platform.select({
      ios: {
        shadowColor: 'rgba(0,0,0,0.1)',
        shadowOffset: { width: 0, height: 5 },
        shadowOpacity: 0.15,
        shadowRadius: 10,
      },
      android: {
        elevation: 8,
      },
    }),
    borderWidth: StyleSheet.hairlineWidth, // Borda fina para um toque mais clean
    borderColor: '#E0E0E0', // Cor da borda
  },
  buscaIcone: {
    marginRight: 12,
  },
  buscaInput: {
    flex: 1,
    fontSize: 16,
    color: '#343A40',
    height: '100%',
  },
  filtroBotao: {
    backgroundColor: '#007AFF',
    borderRadius: 12,
    padding: 10,
    marginLeft: 10,
    height: 48, // Ajustado para ser maior
    width: 48, // Ajustado para ser maior
    justifyContent: 'center',
    alignItems: 'center',
    // Sombra para o botão de filtro
    shadowColor: '#007AFF',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 6,
  },
});

export default SaudacaoContainer;
