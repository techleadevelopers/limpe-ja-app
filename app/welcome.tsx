import React, { useEffect } from 'react';
import { View, StyleSheet, Image, Dimensions, Platform, Text } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  Easing,
  withRepeat,
} from 'react-native-reanimated';
import { Stack, useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LinearGradient } from 'expo-linear-gradient';

const { width, height } = Dimensions.get('window');

const LOGO_IMAGE = require('../assets/images/logo2.png');
const WELCOME_SCREEN_VIEWED_KEY = 'welcomeScreenViewed';

const BACKGROUND_COLOR_1 = '#FFFFFF';
const BACKGROUND_COLOR_2 = '#F8F8FF';
const BACKGROUND_COLOR_3 = '#E6F0FF';

// Define logo dimensions for easier calculation and responsiveness
const LOGO_WIDTH = 250;
const LOGO_HEIGHT = 250;
const REFLECTION_GAP = 10; // Espaçamento entre o logo e o reflexo

export default function WelcomeScreen() {
  const router = useRouter();

  const logoScale = useSharedValue(0.8);
  const logoOpacity = useSharedValue(0);
  const reflectionOpacityAnim = useSharedValue(0.5); // Opacidade geral para o reflexo

  useEffect(() => {
    // Animação de entrada do logo
    logoOpacity.value = withTiming(1, { duration: 80 });
    logoScale.value = withTiming(1, { duration: 80, easing: Easing.out(Easing.back(1.2)) });

    // Animação de opacidade para o reflexo, tornando-o sutil e robusto
    reflectionOpacityAnim.value = withRepeat(
      withTiming(0.2, { duration: 2000, easing: Easing.inOut(Easing.ease) }), // Opacidade máxima mais baixa para sutileza
      -1, // Repetição infinita
      true // Inverter a animação de volta
    );

    // Temporizador para redirecionamento automático
    const timer = setTimeout(async () => {
      console.log("WelcomeScreen: Redirecionando automaticamente após 6 segundos.");
      try {
        await AsyncStorage.setItem(WELCOME_SCREEN_VIEWED_KEY, 'true');
        console.log("WelcomeScreen: WELCOME_SCREEN_VIEWED_KEY set to 'true' via auto-redirect.");
        router.replace('/(auth)/login');
      } catch (e) {
        console.warn("WelcomeScreen: Erro ao salvar status no AsyncStorage durante auto-redirect", e);
        router.replace('/(auth)/login');
      }
    }, 6000);

    return () => clearTimeout(timer);
  }, []);

  // Estilo animado para o logo principal
  const animatedLogoStyle = useAnimatedStyle(() => ({
    transform: [{ scale: logoScale.value }],
    opacity: logoOpacity.value,
  }));

  // NOVO: Estilo animado para o reflexo inferior
  const animatedReflectionStyle = useAnimatedStyle(() => ({
    // Aplicar a mesma escala do logo para responsividade
    transform: [
      { scaleX: logoScale.value },
      { scaleY: logoScale.value * -1 }, // Inverter verticalmente para criar o reflexo
      { perspective: 1000 }, // Necessário para que rotateX tenha um efeito 3D
      { rotateX: '20deg' }, // Inclinar o reflexo ligeiramente para trás (ajuste conforme necessário)
    ],
    opacity: reflectionOpacityAnim.value, // Aplicar a opacidade animada
  }));

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />

      <LinearGradient
        colors={[BACKGROUND_COLOR_1, BACKGROUND_COLOR_2, BACKGROUND_COLOR_3]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.gradientBackground}
      />

      {/* Grupo para o Logo e seu Reflexo, centralizado na tela como uma unidade */}
      <View style={styles.logoAndReflectionGroup}>
        {/* Logo Principal */}
        <Animated.View style={[styles.logoWrapper, animatedLogoStyle]}>
          <Image
            source={LOGO_IMAGE}
            style={styles.logoImage}
          />
        </Animated.View>

        {/* Reflexo Inferior */}
        <Animated.View style={[styles.reflectionWrapper, animatedReflectionStyle]}>
          <Image
            source={LOGO_IMAGE}
            style={styles.logoImage}
          />
          {/* Camada de Gradiente para o desvanecimento do reflexo */}
          <LinearGradient
            colors={['rgba(255,255,255,0)', 'rgba(255,255,255,0.4)', 'rgba(255,255,255,0.7)']} // Desvanece de transparente para branco mais opaco
            start={{ x: 0, y: 0 }} // Começa no topo da imagem do reflexo (que é a parte inferior do logo original)
            end={{ x: 0, y: 1 }} // Termina na parte inferior da imagem do reflexo (que é a parte superior do logo original, invertida)
            style={styles.reflectionGradientOverlay}
          />
        </Animated.View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden', // Garante que nada saia dos limites do contêiner
  },
  gradientBackground: {
    ...StyleSheet.absoluteFillObject, // Preenche todo o espaço do contêiner pai
    opacity: 1,
  },
  // Grupo para o logo e seu reflexo, centralizado como uma única unidade
  logoAndReflectionGroup: {
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'column', // Empilha o logo e o reflexo verticalmente
  },
  logoWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: REFLECTION_GAP, // Adiciona um espaçamento abaixo do logo
  },
  logoImage: {
    width: LOGO_WIDTH,
    height: LOGO_HEIGHT,
    resizeMode: 'contain',
  },
  // Estilos para o contêiner do reflexo
  reflectionWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
    width: LOGO_WIDTH, // Garante que o reflexo tenha as mesmas dimensões do logo
    height: LOGO_HEIGHT,
    overflow: 'hidden', // Crucial para cortar o reflexo em suas bordas
  },
  reflectionGradientOverlay: {
    ...StyleSheet.absoluteFillObject, // Preenche todo o espaço do contêiner do reflexo
  },
});