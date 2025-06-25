// app/(client)/explore/components/provider/HeaderSection.tsx
import React from 'react';
import { View, Text, ImageBackground, TouchableOpacity, Platform, Dimensions, StyleSheet } from 'react-native'; // ADICIONADO StyleSheet AQUI
import { Ionicons } from '@expo/vector-icons';

const SCREEN_WIDTH = Dimensions.get('window').width;

// Definindo a interface ProviderDetails para espelhar a ProviderDetailsDto do backend
// Ajuste conforme a estrutura real do seu DTO de provedor.
interface ProviderDetails {
  id: string;
  fullName: string; // Exemplo: renomeado de 'nome'
  avatarUrl?: string; // Alterado de 'imagemUrl' para 'avatarUrl' e opcional
  // Outros campos relevantes do ProviderDetailsDto
}

interface HeaderSectionProps {
  provider: ProviderDetails;
  onBackPress: () => void;
}

const HeaderSection: React.FC<HeaderSectionProps> = ({ provider, onBackPress }) => {
  return (
    // Usando provider.avatarUrl para a imagem de fundo
    <ImageBackground source={{ uri: provider.avatarUrl }} style={styles.headerImage} resizeMode="cover">
      <View style={styles.headerImageOverlay}>
        <View style={styles.topNavContainer}>
          <TouchableOpacity onPress={onBackPress} style={styles.iconButtonBackground}>
            <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.iconButtonBackground}>
            <Ionicons name="bookmark-outline" size={22} color="#FFFFFF" />
          </TouchableOpacity>
        </View>
        {/* REMOVIDO: imageTextDetailsOverlay */}
      </View>
    </ImageBackground>
  );
};

// Estilos movidos para dentro do arquivo para auto-suficiência,
// ou você pode manter a importação de '../../styles/providerStyles' se for um arquivo compartilhado.
// Se 'styles' for importado de um arquivo externo, certifique-se de que ele contenha todos esses estilos.
const styles = StyleSheet.create({ // AGORA StyleSheet.create É RECONHECIDO
  headerImage: {
    width: '100%',
    height: 250, // Altura fixa ou responsiva
    justifyContent: 'flex-end',
  },
  headerImageOverlay: {
    ...StyleSheet.absoluteFillObject, // AGORA StyleSheet.absoluteFillObject É RECONHECIDO
    backgroundColor: 'rgba(0,0,0,0.3)', // Escurece a imagem para melhor contraste
    justifyContent: 'space-between',
    paddingTop: Platform.OS === 'ios' ? 50 : 25, // Ajuste para safe area
  },
  topNavContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 15,
  },
  iconButtonBackground: {
    backgroundColor: 'rgba(0,0,0,0.4)',
    borderRadius: 20,
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  // Se houver outros estilos relacionados a HeaderSection em providerStyles, adicione-os aqui
});

export default HeaderSection;