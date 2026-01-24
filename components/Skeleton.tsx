// components/ui/Skeleton.tsx
// ================================================
import React, { useEffect, useRef } from 'react';
import { Animated, View, useColorScheme, Easing } from 'react-native';
import { useReducedMotion } from '../components/utils/useReducedMotion'; // Certifique-se de que o caminho está correto
import Colors from '../constants/Colors'; // Importe seu arquivo Colors

export const Skeleton = ({ height = 16, width = '100%', radius = 12, style }: { height?: number; width?: number|string; radius?: number; style?: any }) => {
  const reduced = useReducedMotion();
  const anim = useRef(new Animated.Value(0)).current;
  const colorScheme = useColorScheme();
  const themeColors = Colors[colorScheme || 'light'];

  useEffect(() => {
    if (reduced) {
      anim.setValue(0); // Reseta a animação se o movimento for reduzido
      return;
    }

    const loop = Animated.loop(Animated.sequence([
      Animated.timing(anim, {
        toValue: 1,
        duration: 1400, // Conforme effects.md: "barra de luz 1.2–1.6s"
        useNativeDriver: true,
        easing: Easing.ease, // "standard" easing
      }),
      Animated.timing(anim, {
        toValue: 0,
        duration: 0, // Reinicia a animação instantaneamente
        useNativeDriver: true,
      })
    ]));
    loop.start();
    return () => loop.stop();
  }, [reduced, anim]); // Adicionado 'anim' às dependências

  const translate = anim.interpolate({
    inputRange: [0, 1],
    outputRange: [-50, 300] // Ajuste conforme necessário para o efeito de brilho
  });

  return (
    <View style={[{
      overflow: 'hidden',
      backgroundColor: themeColors.lightGrey, // Usando lightGrey para o fundo do skeleton
      height,
      width,
      borderRadius: radius
    }, style]}>
      {!reduced && (
        <Animated.View style={{
          position: 'absolute',
          top: 0,
          bottom: 0,
          width: 80, // Largura da "barra de luz"
          transform: [{ translateX: translate }],
          backgroundColor: `${themeColors.background}59` // Usando background (branco/preto) com opacidade 35% (59 em hex)
        }} />
      )}
    </View>
  );
};
