import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Platform, TouchableOpacity, TextInput, Keyboard } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Constants from 'expo-constants';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  Easing,
} from 'react-native-reanimated';

import { UserProfile } from '../../../../types/backend/users'; // Importar UserProfile para tipar o endereço

// Define e exporta a interface das props para que outros componentes possam importá-la
export interface HeaderSuperiorProps {
  userName: string;
  userAddress?: UserProfile['address']; // NOVO: Endereço completo, tipado
}

// REMOVIDO: const USER_ADDRESS = "Rua Doutor Quirino, N° 58 - Centro - Campinas SP"; // Será substituído por props

const HERO_GRADIENT_START = 'rgba(135, 175, 255, 0.9)';
const HERO_GRADIENT_END = 'rgba(100, 140, 235, 0.9)';

// O componente agora aceita as props tipadas
const HeroHeader: React.FC<HeaderSuperiorProps> = ({ userName, userAddress }) => { // <<== ADICIONADO userAddress
  const router = useRouter();
  const [busca, setBusca] = useState('');

  const reflexTranslateX = useSharedValue(-200);
  const reflexTranslateY = useSharedValue(-200);
  const reflexRotate = useSharedValue(0);

  useEffect(() => {
    reflexTranslateX.value = withRepeat(
      withTiming(200, { duration: 4000, easing: Easing.linear }),
      -1,
      true
    );
    reflexTranslateY.value = withRepeat(
      withTiming(200, { duration: 4000, easing: Easing.linear }),
      -1,
      true
    );
    reflexRotate.value = withRepeat(
      withTiming(360, { duration: 8000, easing: Easing.linear }),
      -1,
      true
    );
  }, []);

  const animatedReflexStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: reflexTranslateX.value },
      { translateY: reflexTranslateY.value },
      { rotateZ: `${reflexRotate.value}deg` },
    ],
  }));

  const handleProfilePress = () => {
    console.log("HeroHeader: Navegando para o perfil.");
    router.push('/(client)/profile' as any);
  };

  const handleMenuPress = () => {
    console.log("HeroHeader: Abrindo o menu lateral (DrawerMenu).");
    router.push('/(client)/drawer' as any);
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
    console.log("Funcionalidade de Filtros em breve!");
  };

  // Formata o endereço a partir do objeto userAddress
  const formattedAddress = userAddress ?
    `${userAddress.street || ''}, ${userAddress.number || ''} - ${userAddress.neighborhood || ''} - ${userAddress.city || ''} ${userAddress.state || ''}`.trim().replace(/,?\s*-\s*$/, '') : // Remove vírgula/traço final se campos vazios
    'Endereço não disponível';

  return (
    <LinearGradient
      colors={[HERO_GRADIENT_START, HERO_GRADIENT_END]}
      start={{ x: 0.0, y: 0.0 }}
      end={{ x: 1.0, y: 1.0 }}
      style={styles.outerContainerGradient}
    >
      <Animated.View style={[styles.animatedReflex, animatedReflexStyle]}>
        <LinearGradient
          colors={['rgba(255, 255, 255, 0)', 'rgba(255, 255, 255, 0.3)', 'rgba(255, 255, 255, 0)']}
          start={{ x: 0, y: 0.5 }}
          end={{ x: 1, y: 0.5 }}
          style={styles.reflexGradient}
        />
      </Animated.View>

      <View style={{ height: Constants.statusBarHeight }} />

      <View style={styles.headerContent}>
        <TouchableOpacity onPress={handleProfilePress} style={styles.profileIconContainer}>
          <Ionicons name="person-circle" size={44} color="#FFFFFF" />
        </TouchableOpacity>
        <View style={styles.greetingContainer}>
          <Text style={styles.greetingHello}>Olá, {userName}</Text>
          <Text style={styles.greetingWelcome}>Bem-vinda de volta!</Text>
        </View>
        <TouchableOpacity onPress={handleMenuPress} style={styles.menuIconContainer}>
          <Ionicons name="menu" size={32} color="#FFFFFF" />
        </TouchableOpacity>
      </View>

      {/* Seção de Endereço - AGORA USANDO DADOS REAIS */}
      <View style={styles.addressSection}>
        <Ionicons name="star" size={14} color="#FFD700" style={styles.addressStarIcon} />
        <Text style={styles.addressText} numberOfLines={1} ellipsizeMode="tail">{formattedAddress}</Text>
      </View>

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
          <Ionicons name="options-outline" size={18} color="#FFFFFF" />
        </TouchableOpacity>
      </View>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  outerContainerGradient: {
    paddingBottom: 15,
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
    marginBottom: -10,
    width: '100%',
    overflow: 'hidden',
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
  animatedReflex: {
    ...StyleSheet.absoluteFillObject,
    width: 200,
    height: 300,
    borderRadius: 150,
    opacity: 0.8,
  },
  reflexGradient: {
    width: '100%',
    height: '100%',
    borderRadius: 150,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    top: 6,
    paddingHorizontal: 15,
    marginTop: -15,
  },
  profileIconContainer: {
    padding: 5,
  },
  greetingContainer: {
    flex: 1,
    marginLeft: 2,
  },
  greetingHello: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  greetingWelcome: {
    fontSize: 12,
    color: '#E0EFFF',
  },
  menuIconContainer: {
    padding: 5,
  },
  addressSection: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 25,
    marginTop: 8,
    marginBottom: 15,
  },
  addressStarIcon: {
    marginRight: 8,
    textShadowColor: 'rgba(255, 223, 0, 0.5)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 3,
  },
  addressText: {
    fontSize: 13,
    color: '#FFFFFF',
    fontWeight: '500',
    flexShrink: 1,
  },
  buscaContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 15,
    marginTop: -5,
    paddingHorizontal: 15,
    height: 38,
    marginHorizontal: 20,
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
    marginRight: 10,
    fontSize: 18,
  },
  buscaInput: {
    flex: 1,
    fontSize: 14,
    color: '#343A40',
    height: '100%',
  },
  filtroBotao: {
    backgroundColor: '#007AFF',
    borderRadius: 12,
    padding: 8,
    marginLeft: 10,
    height: 33,
    width: 35,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#007AFF',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 6,
  },
});

export default HeroHeader;