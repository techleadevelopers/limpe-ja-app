import React, { useEffect, useRef } from 'react';
import { Animated, Platform, StyleSheet, ViewStyle } from 'react-native';

interface BottomSlideInCardProps {
  isVisible: boolean;
  children: React.ReactNode;
  /** desloca para baixo (ex: para não colar na status bar) */
  topOffset?: number; // default 16..24
  /** desloca da direita (espaço da borda) */
  rightOffset?: number; // default 16

  /** pointerEvents para o container (ex: 'box-none' para não bloquear interações subjacentes) */
  pointerEvents?: 'auto' | 'none' | 'box-none' | 'box-only'; // <-- CORRIGIDO: Tipo literal específico do React Native (resolve erro TS)
}

const BottomSlideInCard: React.FC<BottomSlideInCardProps> = ({
  isVisible,
  children,
  topOffset = Platform.select({ ios: 24, android: 16, default: 16 })!,
  rightOffset = 16,
  pointerEvents, // <-- Desestruturado: Agora com tipo literal
}) => {
  // anima do lado direito (translateX) + leve fade
  const translateX = useRef(new Animated.Value(80)).current;
  const opacity    = useRef(new Animated.Value(0)).current;

  // Fallback lógico para pointerEvents se não fornecido
  const effectivePointerEvents = pointerEvents ?? (isVisible ? 'auto' : 'none');

  useEffect(() => {
    if (isVisible) {
      Animated.parallel([
        Animated.spring(translateX, { toValue: 0, useNativeDriver: true, speed: 18, bounciness: 8 }),
        Animated.timing(opacity, { toValue: 1, duration: 220, useNativeDriver: true }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(translateX, { toValue: 80, duration: 180, useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 0, duration: 180, useNativeDriver: true }),
      ]).start();
    }
  }, [isVisible, translateX, opacity]);

  return (
    <Animated.View
      pointerEvents={effectivePointerEvents} // <-- APLICADO: Usa o valor da prop ou fallback (agora compatível com tipo RN)
      style={[
        styles.container,
        {
          top: topOffset,
          right: rightOffset,
          opacity,
          transform: [{ translateX }],
          display: isVisible ? 'flex' : 'none',
        },
      ]}
    >
      {children}
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: Platform.select({ web: 'fixed', default: 'absolute' }) as ViewStyle['position'],
    zIndex: 9999,
    maxWidth: 420,
    width: 'auto',
    alignSelf: 'flex-end',
  },
});

export default BottomSlideInCard;
