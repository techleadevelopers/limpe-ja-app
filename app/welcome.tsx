// app/welcome.tsx
import React, { useEffect } from 'react';
import { View, StyleSheet, Image, Dimensions, Platform } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import { Stack, useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';

const { width, height } = Dimensions.get('window');

// Assumindo que 'icon.png' é o seu logo e que ele é azul,
// vamos usar tintColor para deixá-lo branco conforme a imagem.
const LOGO_IMAGE = require('../assets/images/icon.png');
const WELCOME_SCREEN_VIEWED_KEY = 'welcomeScreenViewed';

const PRIMARY_BLUE = '#2A72E7'; // Cor azul principal do fundo da imagem
const WHITE_COLOR = '#FFFFFF'; // Cor branca para o círculo e o logo

export default function WelcomeScreen() {
  const router = useRouter();

  // Valores compartilhados para animação do círculo do logo
  const logoCircleScale = useSharedValue(0.8); // Começa menor
  const logoCircleOpacity = useSharedValue(0); // Começa invisível

  useEffect(() => {
    // Animação de entrada do círculo do logo
    logoCircleOpacity.value = withTiming(1, { duration: 800 }); // Aparece gradualmente
    logoCircleScale.value = withTiming(1, { duration: 800, easing: Easing.out(Easing.back(1.2)) }); // Escala com um pequeno "bounce"

    // Define a duração da tela de splash antes de navegar
    const SPLASH_DURATION = 2500; // 2.5 segundos
    const timer = setTimeout(async () => {
      try {
        // Marca que a tela de boas-vindas já foi visualizada
        await AsyncStorage.setItem(WELCOME_SCREEN_VIEWED_KEY, 'true');
      } catch (e) {
        console.warn("WelcomeScreen: Erro ao salvar status no AsyncStorage", e);
      }
      // Navega para a tela de login após a duração do splash
      router.replace('/(auth)/login');
    }, SPLASH_DURATION);

    // Limpa o timer se o componente for desmontado antes do tempo
    return () => clearTimeout(timer);
  }, [router]); // 'router' é uma dependência para o useEffect

  // Estilo animado para o círculo do logo
  const animatedLogoCircleStyle = useAnimatedStyle(() => ({
    transform: [{ scale: logoCircleScale.value }],
    opacity: logoCircleOpacity.value,
  }));

  return (
    <View style={styles.container}>
      {/* Configurações da tela de navegação (sem cabeçalho) */}
      <Stack.Screen options={{ headerShown: false }} />

      {/* Fundo azul sólido que cobre toda a tela */}
      <View style={styles.solidBackground} />

      {/* Círculo branco animado contendo o logo */}
      <Animated.View style={[styles.logoCircle, animatedLogoCircleStyle]}>
        <Image
          source={LOGO_IMAGE}
          style={styles.logoImage} // Aplica tintColor para deixar o logo branco
        />
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden', // Garante que o conteúdo não vaze
  },
  solidBackground: {
    ...StyleSheet.absoluteFillObject, // Cobre toda a área da tela
    backgroundColor: PRIMARY_BLUE, // Fundo azul sólido conforme a imagem
  },
  logoCircle: {
    width: 150, // Diâmetro do círculo branco
    height: 150,
    borderRadius: 75, // Metade da largura/altura para um círculo perfeito
    backgroundColor: WHITE_COLOR, // Fundo branco para o círculo
    alignItems: 'center',
    justifyContent: 'center',
    // Borda branca ao redor do círculo
    borderWidth: 2,
    borderColor: WHITE_COLOR,
    // Efeito de brilho azul ao redor do círculo
    shadowColor: PRIMARY_BLUE, // Cor do brilho
    shadowOffset: { width: 0, height: 0 }, // Sem deslocamento para um brilho uniforme
    shadowOpacity: 0.5, // Opacidade do brilho (ajuste para intensidade)
    shadowRadius: 15, // Espalhamento do brilho (ajuste para tamanho)
    elevation: 15, // Sombra para Android (deve ser similar ao shadowRadius)
  },
  logoImage: {
    width: 80, // Tamanho do logo dentro do círculo
    height: 80,
    resizeMode: 'contain', // Garante que o logo se ajuste sem cortar
    tintColor: WHITE_COLOR, // Muda a cor do logo para branco
  },
});