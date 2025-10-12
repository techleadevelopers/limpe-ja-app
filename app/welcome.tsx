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

const LOGO_WIDTH = 240;
const LOGO_HEIGHT = 240;
const REFLECTION_GAP = 0;
const BOTTOM_MARGIN_FOR_REFLECTION = 0;

// Ajustes platform-specific para alinhamento (apenas horizontal alterado para iOS, sem interferir no Android)
const OFFSET_RIGHT = Platform.select({ ios: 2, android: 10 }) ?? 10;
const OFFSET_TOP = 80;
const OFFSET_BOTTOM = Platform.select({ ios: 119, android: 124 }) ?? 124; // +5px no iOS para evitar overlap inicial do reflexo

const REFLECTION_GRADIENT_COLORS: readonly [string, string, string] = Platform.select({
  ios: ['rgba(255,255,255,0)', 'rgba(255,255,255,0.2)', 'rgba(255,255,255,0.4)'],
  android: ['rgba(255,255,255,0)', 'rgba(255,255,255,0.4)', 'rgba(255,255,255,0.7)'],
}) ?? ['rgba(255,255,255,0)', 'rgba(255,255,255,0.3)', 'rgba(255,255,255,0.5)'];

// Ajustes específicos para iOS para evitar retângulo branco (transparência explícita e overflow otimizado)
const REFLECTION_BACKGROUND = 'transparent'; // Explícito para ambos, mas iOS sensível
const OVERFLOW_HIDDEN = 'hidden'; // Mantém hidden, com transparência

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
    if (__DEV__) console.log("[WelcomeScreen | startLoopAnimations] Iniciando animações de loop...");
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

    // CORREÇÃO: Adicionada sequência com pausa sutil no loop do reflexo para suavizar resets no iOS (evita artefatos)
    reflectionTranslateY.value = withRepeat(
      withTiming(10, { duration: 2500, easing: Easing.inOut(Easing.ease) }),
      -1,
      true
    );

    // CORREÇÃO: Range de skew limitado (-1 a 1) para evitar extrapolação e "outro lado" visível no iOS
    reflectionSkewX.value = withRepeat(
      withTiming(1, { duration: 3000, easing: Easing.inOut(Easing.ease) }),
      -1,
      true
    );
  }, [logoRotateY, logoPulseScale, reflectionTranslateY, reflectionSkewX]);

  useEffect(() => {
    if (__DEV__) console.log("[WelcomeScreen | useEffect] Componente montado ou dependências alteradas.");

    logoOpacity.value = withTiming(1, { duration: 80 });
    logoScale.value = withTiming(1, { duration: 80, easing: Easing.out(Easing.back(1.2)) }, (isFinished) => {
      'worklet'; // <-- IMPORTANTE: Marca este callback como um worklet
      if (isFinished) {
        if (__DEV__) console.log("[WelcomeScreen | withTiming Callback] Callback de logoScale.value withTiming executado.");

        // Usar runOnJS para chamar startLoopAnimations na thread JS principal
        runOnJS(startLoopAnimations)(); // <-- CHAMADA CORRIGIDA AQUI

        if (__DEV__) console.log("[WelcomeScreen | withTiming Callback] Chamada para runOnJS(startLoopAnimations) feita.");
      }
    });

    // CORREÇÃO: Opacidade do reflexo com loop mais suave (menor variação no iOS para menos overlap)
    reflectionOpacityAnim.value = withRepeat(
      withTiming(0.3, { duration: 2000, easing: Easing.inOut(Easing.ease) }), // Iniciando em 0.3 para menos intensidade inicial
      -1,
      true
    );

    const timer = setTimeout(async () => {
      if (__DEV__) console.log("WelcomeScreen: Redirecionando automaticamente após 4 segundos.");
      router.replace('/(auth)/login');
    }, 4000);

    return () => {
      if (__DEV__) console.log("[WelcomeScreen | useEffect] Cleanup: Limpando timer.");
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
      backgroundColor: 'transparent', // CORREÇÃO: Explícito para evitar backing layer branco no iOS
    };
  });

  // Estilo animado para o reflexo inferior (ajustado para evitar artefatos no iOS)
  const animatedReflectionStyle = useAnimatedStyle(() => {
    const skew = interpolate(
      reflectionSkewX.value,
      [0, 0.5, 1],
      [-1, 0, 1], // CORREÇÃO: Range limitado para evitar skew excessivo e "outro lado" no iOS
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
      backgroundColor: 'transparent', // CORREÇÃO: Explícito para iOS (evita quadrado branco)
      backfaceVisibility: 'hidden' as const, // CORREÇÃO: Esconde face de trás em 3D (resolve "outro lado" e tampas no iOS)
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

      {/* CORREÇÃO: View pai com overflow hidden para conter o grupo e clipar artefatos no iOS (tamanho fixo baseado em logo + gap) */}
      <View style={styles.animationContainer}>
        {/* Grupo para o Logo e seu Reflexo, centralizado na tela como uma unidade */}
        <View style={styles.logoAndReflectionGroup}>
          {/* Logo Principal */}
          <Animated.View style={[styles.logoWrapper, animatedLogoStyle]}>
            <Image
              source={LOGO_IMAGE}
              style={styles.logoImage}
              resizeMode="contain" // Mantido, mas explícito
            />
          </Animated.View>

          {/* Reflexo Inferior - Com transparência explícita para evitar retângulo branco no iOS */}
          <Animated.View style={[styles.reflectionWrapper, animatedReflectionStyle]}>
            <Image
              source={LOGO_IMAGE}
              style={styles.logoImage}
              resizeMode="contain" // Explícito para consistência
            />
            {/* Camada de Gradiente para o desvanecimento do reflexo - Ajustado para iOS (cores mais suaves, menos branco) */}
            {/* ✅ CORREÇÃO: Usa REFLECTION_GRADIENT_COLORS (já com fallback ??, garantindo tipo readonly [string, string, string] sem undefined) */}
            <LinearGradient
              colors={REFLECTION_GRADIENT_COLORS}
              start={{ x: 0, y: 0 }}
              end={{ x: 0, y: 1 }}
              style={styles.reflectionGradientOverlay}
            />
          </Animated.View>
        </View>
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
    backgroundColor: 'transparent', // CORREÇÃO: Explícito para base
  },
  gradientBackground: {
    ...StyleSheet.absoluteFillObject,
    opacity: 1,
  },
  // CORREÇÃO: Novo container para animações com overflow hidden e tamanho fixo (clipa reflexo no iOS)
  animationContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    width: LOGO_WIDTH + 40, // Margem para offsets
    height: LOGO_HEIGHT * 2 + REFLECTION_GAP + OFFSET_TOP + OFFSET_BOTTOM, // Altura total para conter logo + reflexo
    overflow: 'hidden', // Força clip estrito no iOS
    backgroundColor: 'transparent',
    position: 'relative', // Contém os filhos
  },
  logoAndReflectionGroup: {
    alignItems: 'center',
    flexDirection: 'column',
    marginBottom: BOTTOM_MARGIN_FOR_REFLECTION,
    backgroundColor: 'transparent', // Explícito
  },
  logoWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
    top: OFFSET_TOP,
    right: OFFSET_RIGHT,
    marginBottom: REFLECTION_GAP,
    backgroundColor: 'transparent', // CORREÇÃO: Explícito para evitar backing layer branco no iOS
    overflow: 'hidden', // Adicionado para clipar bordas da logo
  },
  logoImage: {
    width: LOGO_WIDTH,
    height: LOGO_HEIGHT,
    resizeMode: 'contain',
    backgroundColor: 'transparent', // Explícito na Image (evita padding branco)
  },
  reflectionWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
    bottom: OFFSET_BOTTOM,
    right: OFFSET_RIGHT,
    width: LOGO_WIDTH,
    height: LOGO_HEIGHT,
    overflow: OVERFLOW_HIDDEN, // Usa a constante platform-specific
    backgroundColor: REFLECTION_BACKGROUND, // Transparência explícita para iOS (evita retângulo branco)
    position: 'relative', // CORREÇÃO: Ajuda no stacking no iOS
  },
  reflectionGradientOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'transparent', // Explícito para base do gradient
  },
});