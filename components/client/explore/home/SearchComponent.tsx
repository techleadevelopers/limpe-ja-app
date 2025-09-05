// LimpeJaApp/components/client/explore/home/SearchComponent.tsx
import React from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
// Importe AppColors se for usar para cores, ou defina as cores diretamente
// import { AppColors } from '../../../constants/appStyles'; 

interface SearchComponentProps {
  onSearchPress: (query: string) => void;
}

const SearchComponent: React.FC<SearchComponentProps> = ({ onSearchPress }) => {
  const [searchText, setSearchText] = React.useState('');

  return (
    <View style={styles.container}>
      
      <View style={styles.searchBarContainer}>
        <TextInput
          style={styles.searchInput}
          placeholder="Explore serviços de limpeza"
          placeholderTextColor="#8e8e93" // Cor cinza claro para o placeholder
          value={searchText}
          onChangeText={setSearchText}
          returnKeyType="search"
          onSubmitEditing={() => onSearchPress(searchText)}
        />
        <TouchableOpacity
          style={styles.searchButton}
          onPress={() => onSearchPress(searchText)}
          activeOpacity={0.7}
        >
          <Ionicons name="search" size={18} color="#fff" />
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingVertical: 5, // Espaçamento vertical para o conteúdo
    // O padding horizontal será tratado pelo contentWrapper pai
  },
  title: {
    left: 55,
    fontSize: 13,
    fontFamily: 'Montserrat-Thin', // Fonte especificada pelo usuário
    fontWeight: '800', // Peso da fonte especificado pelo usuário
    color: '#4f5a71c3', // Cor especificada pelo usuário
    marginBottom: 15, // Espaçamento abaixo do título e acima da barra de pesquisa
  },
  searchBarContainer: {
    marginHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#e0e0e0', // Cinza claro para o fundo da barra de pesquisa
    borderRadius: 12, // Cantos arredondados
    borderWidth: 1,
    borderColor: '#d1d1d6', // Cor da borda cinza claro
    height: 33, // Altura fixa da barra de pesquisa
    overflow: 'hidden', // Garante que o borderRadius funcione no botão
  },
  searchInput: {
    flex: 1,
    paddingHorizontal: 5,
    fontSize: 13,
    fontWeight: '800', // Peso da fonte especificado pelo usuário
    fontFamily: 'Montserrat-Thin', // Fonte especificada pelo usuário
    color: '#333', // Cor do texto de entrada
  },
  searchButton: {
    backgroundColor: '#5197e3ff', // Azul para o botão de pesquisa
    height: '100%',
    width: 45, // Largura fixa para o botão
    justifyContent: 'center',
    alignItems: 'center',
    borderTopRightRadius: 12, // Arredonda os cantos do botão para combinar com a barra
    borderBottomRightRadius: 12,
  },
});

export default SearchComponent;