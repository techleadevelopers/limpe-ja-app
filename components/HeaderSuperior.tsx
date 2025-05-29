// LimpeJaApp/components/HeroHeader.tsx
import React, { useState } from 'react';
import { View, Text, StyleSheet, Platform, TouchableOpacity, TextInput, Keyboard } from 'react-native';
import { Ionicons } from '@expo/vector-icons'; // Ícones principais
import Constants from 'expo-constants';
import { useRouter } from 'expo-router';

// Dados mockados (idealmente viriam de props ou contexto)
const USER_NAME = "Nadia";
const USER_ADDRESS = "Rua Doutor Quirino, N° 58 - Centro - Campinas SP"; // Novo endereço

const HeroHeader: React.FC = () => {
  const router = useRouter();
  const [busca, setBusca] = useState('');

  const handleProfilePress = () => {
    console.log("HeroHeader: Navegando para o perfil.");
    router.push('/(client)/profile' as any);
  };

  const handleMenuPress = () => {
    console.log("Menu pressed");
    alert("Menu não implementado ainda.");
  };

  const handleSearchSubmit = () => {
    Keyboard.dismiss();
    if (busca.trim()) {
      console.log(`HeroHeader: Buscando por "${busca.trim()}"`);
      router.push({
        pathname: '/(client)/explore/search-results',
        params: { query: busca.trim() },
      } as any);
    }
  };

  const handleFilterPress = () => {
    console.log("HeroHeader: Filtros pressionado");
    alert("Funcionalidade de Filtros em breve!");
  };

  return (
    <View style={styles.outerContainer}>
      {/* Padding para a Status Bar */}
      <View style={{ height: Constants.statusBarHeight }} />

      {/* Conteúdo do Header (Perfil, Saudação, Menu) */}
      <View style={styles.headerContent}>
        <TouchableOpacity onPress={handleProfilePress} style={styles.profileIconContainer}>
          <Ionicons name="person-circle" size={44} color="#FFFFFF" />
        </TouchableOpacity>
        <View style={styles.greetingContainer}>
          <Text style={styles.greetingHello}>Olá, {USER_NAME}</Text>
          <Text style={styles.greetingWelcome}>Bem-vinda de volta!</Text>
        </View>
        <TouchableOpacity onPress={handleMenuPress} style={styles.menuIconContainer}>
          <Ionicons name="menu" size={32} color="#FFFFFF" />
        </TouchableOpacity>
      </View>

      {/* NOVO: Seção de Endereço */}
      <View style={styles.addressSection}>
        <Ionicons name="star" size={14} color="#FFD700" style={styles.addressStarIcon} />
        <Text style={styles.addressText} numberOfLines={1} ellipsizeMode="tail">{USER_ADDRESS}</Text>
      </View>

      {/* Barra de Busca - MOVIDA para baixo e substitui a antiga seção de temperatura */}
      <View style={styles.buscaContainer}>
        <Ionicons name="search-outline" size={20} color="#6C757D" style={styles.buscaIcone} />
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
          <Ionicons name="options-outline" size={22} color="#FFFFFF" />
        </TouchableOpacity>
      </View>

      {/* Seção de Temperatura REMOVIDA */}
    </View>
  );
};

const styles = StyleSheet.create({
  outerContainer: {
    backgroundColor: '#5D89E6', // Azul claro/médio principal
    paddingBottom: 24, // Mantido, pode ajustar conforme o visual final
    borderBottomLeftRadius: 28, // Aumentado para mais suavidade
    borderBottomRightRadius: 28, // Aumentado para mais suavidade
    marginBottom: -10,
    ...Platform.select({
      ios: {
        shadowColor: 'rgba(0,0,0,0.2)',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.8,
        shadowRadius: 4,
      },
      android: {
        elevation: 8,
      },
    }),
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    top: 6,
    paddingHorizontal: 20, // Aumentado para alinhar com a busca
    paddingTop: 10, // Removido paddingVertical, agora é paddingTop
    // marginBottom foi removido, o addressSection cuidará do espaçamento
  },
  profileIconContainer: {
    padding: 5,
  },
  greetingContainer: {
    flex: 1,
    marginLeft: 2, // Aumentado
  },
  greetingHello: {
    fontSize: 18, // Mantido
    fontWeight: 'bold',
    color: '#FFFFFF',
    // fontFamily: 'SuaFonte-Bold',
  },
  greetingWelcome: {
    fontSize: 12, // Mantido
    color: '#E0EFFF',
    // fontFamily: 'SuaFonte-Regular',
  },
  menuIconContainer: {
    padding: 5,
  },
  // NOVO: Estilos para a Seção de Endereço
  addressSection: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 25, // Um pouco mais de padding que o headerContent
    marginTop: 8, // Espaço abaixo da saudação
    marginBottom: 15, // Espaço antes da barra de busca
  },
  addressStarIcon: {
    marginRight: 8,
    // Efeito sutil de brilho ou sombra na estrela
    textShadowColor: 'rgba(255, 223, 0, 0.5)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 3,
  },
  addressText: {
    fontSize: 13,
    color: '#FFFFFF', // Branco para bom contraste
    fontWeight: '500',
    flexShrink: 1, // Para o texto quebrar ou usar ellipsize se for muito longo
    // fontFamily: 'SuaFonte-Medium',
  },
  // Estilos da barra de busca (posição ajustada)
  buscaContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 15, // Mantido
    paddingHorizontal: 15,
    height: 50, // Altura ajustada (era 54)
    marginHorizontal: 20,
    // marginTop foi removido, o espaçamento agora é dado pelo marginBottom do addressSection
    // Sombra mantida
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
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(0,0,0,0.05)',
  },
  buscaIcone: {
    marginRight: 10, // Era 12
    fontSize: 20, // Era 22
  },
  buscaInput: {
    flex: 1,
    fontSize: 15, // Era 16
    color: '#343A40',
    height: '100%',
    // fontFamily: 'SuaFonte-Regular',
  },
  filtroBotao: {
    backgroundColor: '#007AFF',
    borderRadius: 12, // Mantido
    padding: 8, // Era 10
    marginLeft: 10,
    height: 40, // Era 44
    width: 40,  // Era 44
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#007AFF',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 6,
  },
  // Estilos da Seção de Temperatura foram REMOVIDOS
});

export default HeroHeader;