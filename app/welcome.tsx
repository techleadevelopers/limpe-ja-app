// LimpeJaApp/app/welcome.tsx
import React, { useEffect } from 'react';
import { View, StyleSheet, Image, Dimensions, Platform, Text } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  Easing,
  withRepeat,
  interpolate,
  Extrapolate,
} from 'react-native-reanimated';
import { Stack, useRouter } from 'expo-router';
// AsyncStorage não é mais usado para marcar 'viewed' neste cenário e foi removido para evitar problemas.
// import AsyncStorage from '@react-native-async-storage/async-storage'; 
import { LinearGradient } from 'expo-linear-gradient';

const { width, height } = Dimensions.get('window');

const LOGO_IMAGE = require('../assets/images/logo2.png');
// WELCOME_SCREEN_VIEWED_KEY e sua lógica foram removidos, pois o fluxo agora é fixo (4s e redireciona).
// const WELCOME_SCREEN_VIEWED_KEY = 'welcomeScreenViewed';

const BACKGROUND_COLOR_1 = '#FFFFFF';
const BACKGROUND_COLOR_2 = '#F8F8FF';
const BACKGROUND_COLOR_3 = '#E6F0FF';

// Define as dimensões do logo para facilitar o cálculo e a responsividade
const LOGO_WIDTH = 220;
const LOGO_HEIGHT = 220;
const REFLECTION_GAP = 0; // Espaçamento entre o logo e o reflexo
const BOTTOM_MARGIN_FOR_REFLECTION = 0; // Nova margem inferior para o grupo logo+reflexo

export default function WelcomeScreen() {
  const router = useRouter();

  // Valores compartilhados existentes
  const logoScale = useSharedValue(0.8);
  const logoOpacity = useSharedValue(0);
  const reflectionOpacityAnim = useSharedValue(0.5);

  // Novos valores compartilhados para as animações adicionais
  const logoRotateY = useSharedValue(0); // Para rotação sutil do logo
  const logoPulseScale = useSharedValue(1); // Para pulso de escala do logo
  const reflectionTranslateY = useSharedValue(0); // Para flutuação vertical do reflexo
  const reflectionSkewX = useSharedValue(0); // Para efeito de ondulação/distorção do reflexo

  // REMOVIDO: reflectionHueRotate, pois é a causa mais provável de crash em nativo
  // const reflectionHueRotate = useSharedValue(0); 

  useEffect(() => {
    // Função para iniciar as animações de loop
    const startLoopAnimations = () => {
      // Animação de rotação sutil do logo
      logoRotateY.value = withRepeat(
        withTiming(1, { duration: 4000, easing: Easing.inOut(Easing.ease) }),
        -1,
        true
      );

      // Animação de pulso de escala do logo
      logoPulseScale.value = withRepeat(
        withTiming(1.02, { duration: 1500, easing: Easing.inOut(Easing.ease) }),
        -1,
        true
      );

      // Animação de flutuação vertical do reflexo
      reflectionTranslateY.value = withRepeat(
        withTiming(10, { duration: 2500, easing: Easing.inOut(Easing.ease) }), // Move 10px para cima e para baixo
        -1,
        true
      );

      // Animação de distorção (skew) do reflexo para efeito de ondulação
      reflectionSkewX.value = withRepeat(
        withTiming(1, { duration: 3000, easing: Easing.inOut(Easing.ease) }), // Distorce ligeiramente
        -1,
        true
      );

      // REMOVIDO: Animação de rotação de matiz (hue) para o reflexo
      // reflectionHueRotate.value = withRepeat(
      //   withTiming(360, { duration: 5000, easing: Easing.linear }), 
      //   -1,
      //   false 
      // );
    };

    // Animação de entrada do logo
    logoOpacity.value = withTiming(1, { duration: 80 });
    logoScale.value = withTiming(1, { duration: 80, easing: Easing.out(Easing.back(1.2)) }, () => {
      // Inicia as animações de loop após a animação de entrada
      startLoopAnimations();
    });

    // Animação de opacidade para o reflexo, tornando-o sutil e robusto
    reflectionOpacityAnim.value = withRepeat(
      withTiming(0.2, { duration: 2000, easing: Easing.inOut(Easing.ease) }),
      -1, // Repetição infinita
      true // Inverter a animação de volta
    );

    // Temporizador para redirecionamento automático
    const timer = setTimeout(async () => {
      console.log("WelcomeScreen: Redirecionando automaticamente após 4 segundos."); // Log corrigido para 4s
      // REMOVIDO: Linha do AsyncStorage para WELCOME_SCREEN_VIEWED_KEY (não é mais usada)
      // await AsyncStorage.setItem(WELCOME_SCREEN_VIEWED_KEY, 'true');
      // console.log("WelcomeScreen: WELCOME_SCREEN_VIEWED_KEY set to 'true' via auto-redirect.");
      router.replace('/(auth)/login');
    }, 4000); // <-- Temporizador ajustado para 4 segundos

    return () => clearTimeout(timer);
  }, [router, logoOpacity, logoScale, reflectionOpacityAnim, logoRotateY, logoPulseScale, reflectionTranslateY, reflectionSkewX]); // Dependências ajustadas

  // Estilo animado para o logo principal
  const animatedLogoStyle = useAnimatedStyle(() => {
    // Interpolar o valor para a rotação em Y
    const rotation = interpolate(
      logoRotateY.value,
      [0, 0.5, 1], // Intervalos da animação (0 a 1)
      [-5, 0, 5], // Graus de rotação (-5deg a +5deg)
      Extrapolate.CLAMP // Previne que os valores extrapolem
    );

    return {
      transform: [
        { scale: logoScale.value * logoPulseScale.value }, // Combina escala de entrada e pulso
        { rotateY: `${rotation}deg` }, // Rotação em Y
      ],
      opacity: logoOpacity.value,
    };
  });

  // Estilo animado para o reflexo inferior
  const animatedReflectionStyle = useAnimatedStyle(() => {
    // Interpolar o valor para o skew em X
    const skew = interpolate(
      reflectionSkewX.value,
      [0, 0.5, 1],
      [-2, 0, 2], // Skew de -2deg a +2deg
      Extrapolate.CLAMP
    );

    return {
      // Aplicar a mesma escala do logo para responsividade
      transform: [
        { scaleX: logoScale.value * logoPulseScale.value }, // Escala combinada
        { scaleY: logoScale.value * logoPulseScale.value * -1 }, // Inverter verticalmente para criar o reflexo
        { perspective: 1000 },
        { rotateX: '20deg' }, // Inclinar o reflexo ligeiramente para trás
        { translateY: reflectionTranslateY.value }, // Flutuação vertical
        { skewX: `${skew}deg` }, // Efeito de ondulação
      ],
      opacity: reflectionOpacityAnim.value, // Aplicar a opacidade animada
      // REMOVIDO: filter com hue-rotate (causa provável de crash em nativo)
      // filter: Platform.OS === 'web' ? `hue-rotate(${reflectionHueRotate.value}deg)` : undefined, 
    };
  });

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
      {/* Ajustado o posicionamento para ficar no centro exato da tela */}
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
    justifyContent: 'center', // Centraliza o conteúdo (logoAndReflectionGroup) vertical e horizontalmente
    overflow: 'hidden',
  },
  gradientBackground: {
    ...StyleSheet.absoluteFillObject,
    opacity: 1,
  },
  // Grupo para o logo e seu reflexo, centralizado como uma única unidade
  logoAndReflectionGroup: {
    alignItems: 'center', // Centraliza os itens filhos (logo e reflexo) horizontalmente dentro do grupo
    flexDirection: 'column', // Empilha o logo e o reflexo verticalmente
    // Ajuste fino para a margem inferior do grupo, empurrando-o ligeiramente para cima se necessário
    // Se o logo já está no centro do container por causa do 'justifyContent: center' no container,
    // este marginBotom irá empurrar o grupo inteiro para cima para dar a impressão de
    // que o reflexo tem 'margem inferior pouca'.
    marginBottom: BOTTOM_MARGIN_FOR_REFLECTION,
  },
  logoWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
    top: 30, // Mantém o posicionamento existente
    marginBottom: REFLECTION_GAP, // Espaçamento entre o logo e o reflexo
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
    bottom: 164, // Mantém o posicionamento existente
    width: LOGO_WIDTH,
    height: LOGO_HEIGHT,
    overflow: 'hidden',
  },
  reflectionGradientOverlay: {
    ...StyleSheet.absoluteFillObject,
  },
});