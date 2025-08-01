// LimpeJaApp/app/welcome.tsx
import React, { useEffect, useCallback } from 'react';
import { View, StyleSheet, Image, Dimensions, Platform, Text } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  Easing,
  withRepeat,
  interpolate,
  Extrapolate,
  runOnJS // <-- IMPORTANTE: Importar runOnJS
} from 'react-native-reanimated';
import { Stack, useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';

const { width, height } = Dimensions.get('window');

const LOGO_IMAGE = require('../assets/images/logo2.png');

const BACKGROUND_COLOR_1 = '#FFFFFF';
const BACKGROUND_COLOR_2 = '#F8F8FF';
const BACKGROUND_COLOR_3 = '#E6F0FF';

const LOGO_WIDTH = 220;
const LOGO_HEIGHT = 220;
const REFLECTION_GAP = 0;
const BOTTOM_MARGIN_FOR_REFLECTION = 0;

export default function WelcomeScreen() {
  const router = useRouter();

  const logoScale = useSharedValue(0.8);
  const logoOpacity = useSharedValue(0);
  const reflectionOpacityAnim = useSharedValue(0.5);

  const logoRotateY = useSharedValue(0);
  const logoPulseScale = useSharedValue(1);
  const reflectionTranslateY = useSharedValue(0);
  const reflectionSkewX = useSharedValue(0);

  // Definindo startLoopAnimations com useCallback para garantir estabilidade da função
  const startLoopAnimations = useCallback(() => {
    console.log("[WelcomeScreen | startLoopAnimations] Iniciando animações de loop...");
    logoRotateY.value = withRepeat(
      withTiming(1, { duration: 4000, easing: Easing.inOut(Easing.ease) }),
      -1,
      true
    );

    logoPulseScale.value = withRepeat(
      withTiming(1.02, { duration: 1500, easing: Easing.inOut(Easing.ease) }),
      -1,
      true
    );

    reflectionTranslateY.value = withRepeat(
      withTiming(10, { duration: 2500, easing: Easing.inOut(Easing.ease) }),
      -1,
      true
    );

    reflectionSkewX.value = withRepeat(
      withTiming(1, { duration: 3000, easing: Easing.inOut(Easing.ease) }),
      -1,
      true
    );
  }, [logoRotateY, logoPulseScale, reflectionTranslateY, reflectionSkewX]);

  useEffect(() => {
    console.log("[WelcomeScreen | useEffect] Componente montado ou dependências alteradas.");
    console.log("[WelcomeScreen | useEffect] Tipo de startLoopAnimations no momento do useEffect:", typeof startLoopAnimations);

    logoOpacity.value = withTiming(1, { duration: 80 });
    logoScale.value = withTiming(1, { duration: 80, easing: Easing.out(Easing.back(1.2)) }, (isFinished) => {
      'worklet'; // <-- IMPORTANTE: Marca este callback como um worklet
      if (isFinished) {
        console.log("[WelcomeScreen | withTiming Callback] Callback de logoScale.value withTiming executado.");
        console.log("[WelcomeScreen | withTiming Callback] Tipo de startLoopAnimations DENTRO do callback (antes de runOnJS):", typeof startLoopAnimations);

        // Usar runOnJS para chamar startLoopAnimations na thread JS principal
        runOnJS(startLoopAnimations)(); // <-- CHAMADA CORRIGIDA AQUI

        console.log("[WelcomeScreen | withTiming Callback] Chamada para runOnJS(startLoopAnimations) feita.");
      }
    });

    reflectionOpacityAnim.value = withRepeat(
      withTiming(0.2, { duration: 2000, easing: Easing.inOut(Easing.ease) }),
      -1,
      true
    );

    const timer = setTimeout(async () => {
      console.log("WelcomeScreen: Redirecionando automaticamente após 4 segundos.");
      router.replace('/(auth)/login');
    }, 4000);

    return () => {
      console.log("[WelcomeScreen | useEffect] Cleanup: Limpando timer.");
      clearTimeout(timer);
    };
  }, [router, logoOpacity, logoScale, reflectionOpacityAnim, startLoopAnimations]); // Mantenha startLoopAnimations aqui

  // Estilo animado para o logo principal
  const animatedLogoStyle = useAnimatedStyle(() => {
    const rotation = interpolate(
      logoRotateY.value,
      [0, 0.5, 1],
      [-5, 0, 5],
      Extrapolate.CLAMP
    );

    return {
      opacity: logoOpacity.value,
      transform: [
        { perspective: 1000 },
        { scale: logoScale.value * logoPulseScale.value },
        { rotateY: `${rotation}deg` },
      ],
    };
  });

  // Estilo animado para o reflexo inferior
  const animatedReflectionStyle = useAnimatedStyle(() => {
    const skew = interpolate(
      reflectionSkewX.value,
      [0, 0.5, 1],
      [-2, 0, 2],
      Extrapolate.CLAMP
    );

    return {
      transform: [
        { scaleX: logoScale.value * logoPulseScale.value },
        { scaleY: logoScale.value * logoPulseScale.value * -1 },
        { perspective: 1000 },
        { rotateX: '20deg' },
        { translateY: reflectionTranslateY.value },
        { skewX: `${skew}deg` },
      ],
      opacity: reflectionOpacityAnim.value,
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
            colors={['rgba(255,255,255,0)', 'rgba(255,255,255,0.4)', 'rgba(255,255,255,0.7)']}
            start={{ x: 0, y: 0 }}
            end={{ x: 0, y: 1 }}
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
    overflow: 'hidden',
  },
  gradientBackground: {
    ...StyleSheet.absoluteFillObject,
    opacity: 1,
  },
  logoAndReflectionGroup: {
    alignItems: 'center',
    flexDirection: 'column',
    marginBottom: BOTTOM_MARGIN_FOR_REFLECTION,
  },
  logoWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
    top: 60,
    marginBottom: REFLECTION_GAP,
  },
  logoImage: {
    width: LOGO_WIDTH,
    height: LOGO_HEIGHT,
    resizeMode: 'contain',
  },
  reflectionWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
    bottom: 124,
    width: LOGO_WIDTH,
    height: LOGO_HEIGHT,
    overflow: 'hidden',
  },
  reflectionGradientOverlay: {
    ...StyleSheet.absoluteFillObject,
  },
});