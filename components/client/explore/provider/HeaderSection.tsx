// app/client/explore/components/provider/HeaderSection.tsx
import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { ImageBackground, Platform, StyleSheet, TouchableOpacity, View } from 'react-native';

// Importa os estilos do arquivo externo.
// É CRUCIAL que este import esteja correto e que o arquivo exista.
import { styles } from '../../../../styles/providerStyles';

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
    <View style={internalStyles.container}> {/* Adicionado um container para posicionar os botões acima */}
      <View style={internalStyles.topNavContainer}> {/* Movido para fora do ImageBackground */}
        <TouchableOpacity onPress={onBackPress} style={styles.iconButtonBackground}>
          <Ionicons name="arrow-back" size={20} color="#FFFFFF" />
        </TouchableOpacity>
        <TouchableOpacity style={styles.iconButtonBackground}>
          <Ionicons name="bookmark-outline" size={20} color="#FFFFFF" />
        </TouchableOpacity>
      </View>

      {/* Usando provider.avatarUrl para a imagem de fundo */}
      {/* O estilo headerImage agora inclui as margens e o borderRadius */}
      <ImageBackground source={{ uri: provider.avatarUrl }} style={styles.headerImage} resizeMode="cover">
        <View style={styles.headerImageOverlay}>
          {/* REMOVIDO: imageTextDetailsOverlay */}
        </View>
      </ImageBackground>
    </View>
  );
};

const internalStyles = StyleSheet.create({
  container: {
    width: '100%',
    marginTop: 25,
  },
  headerImage: {
    width: '100%',
    height: 250, // Altura fixa ou responsiva
    justifyContent: 'flex-end',
  },
  headerImageOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.3)', // Escurece a imagem para melhor contraste
    justifyContent: 'space-between',
  },
  topNavContainer: { // Estilos para posicionar os botões flutuantes
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 30,
    position: 'absolute', // Posiciona os botões de forma absoluta
    top: Platform.OS === 'ios' ? 6 : -10, // Ajuste para safe area
    width: '100%', // Garante que o container ocupe a largura total para justify-content
    zIndex: 1, // Garante que os botões fiquem acima da imagem
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