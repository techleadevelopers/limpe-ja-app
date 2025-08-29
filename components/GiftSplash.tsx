import React, { useEffect, useRef } from 'react';
import { View, Animated, Image, StyleSheet } from 'react-native';
import { Icons3D } from '@/constants/icons3d';
import { UnifiedTheme } from '@/constants/UnifiedTheme';

export default function GiftSplash({ onFinish }: { onFinish: () => void }) {
  const scale = useRef(new Animated.Value(0)).current;
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Animação de entrada (bounce suave)
    Animated.sequence([
      Animated.parallel([
        Animated.spring(scale, {
          toValue: 1,
          tension: 40,
          friction: 6,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 1,
          duration: 500,
          useNativeDriver: true,
        }),
      ]),
      Animated.delay(2000), // Fica visível 2s
      Animated.timing(opacity, {
        toValue: 0,
        duration: 600,
        useNativeDriver: true,
      }),
    ]).start(onFinish);
  }, [scale, opacity, onFinish]);

  return (
    <Animated.View style={[styles.container, { opacity, transform: [{ scale }] }]}>
      <Image source={Icons3D.gift} style={styles.giftIcon} />
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: UnifiedTheme.colors.overlay,
    zIndex: 999,
  },
  giftIcon: {
    width: 140,
    height: 140,
    resizeMode: 'contain',
  },
});
