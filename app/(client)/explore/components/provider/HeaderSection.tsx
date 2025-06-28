// app/(client)/explore/components/provider/HeaderSection.tsx
import React from 'react';
import { View, Text, ImageBackground, TouchableOpacity, Platform, Dimensions, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

// Remover a definição de SCREEN_WIDTH aqui, pois já está em providerStyles
// const SCREEN_WIDTH = Dimensions.get('window').width; 

// Importa os estilos do arquivo externo.
// É CRUCIAL que este import esteja correto e que o arquivo exista.
import { styles } from '../../styles/providerStyles'; 

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
    // O estilo headerImage agora inclui as margens e o borderRadius
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

// Se você está importando os estilos de '../../styles/providerStyles',
// este StyleSheet.create não é mais necessário aqui e deve ser removido.
// Mantendo o código como você forneceu, mas com a observação:
// Se você está usando import { styles } from '../../styles/providerStyles';
// então a linha 'const styles = StyleSheet.create({...});' abaixo deveria ser REMOVIDA
// ou renomeada para evitar conflito e garantir que os estilos do providerStyles sejam usados.
// Para este exemplo, vou manter o que você enviou, mas tenha isso em mente.
const internalStyles = StyleSheet.create({ // Renomeado para evitar conflito se 'styles' for importado
  headerImage: {
    width: '100%',
    height: 250, // Altura fixa ou responsiva
    justifyContent: 'flex-end',
  },
  headerImageOverlay: {
    ...StyleSheet.absoluteFillObject,
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
});

export default HeaderSection;