// components/client/explore/provider/PulsingRing.tsx
import React, { useEffect, useRef } from 'react';
import { Animated, StyleSheet, Easing } from 'react-native';

interface PulsingRingProps {
  delay: number;          // Atraso em ms para fase do anel
  cycleDuration: number;  // Duração total do ciclo (ex: 2000ms)
  size: number;           // Diâmetro do anel
  color: string;
}

const PulsingRing: React.FC<PulsingRingProps> = ({ delay, cycleDuration, size, color }) => {
  const loopDriver = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.timing(loopDriver, {
        toValue: 1,
        duration: cycleDuration,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    );
    loop.start();

    return () => {
      loop.stop();
      loopDriver.setValue(0);
    };
  }, [loopDriver, cycleDuration]);

  // Fase (delay em fração do ciclo)
  const phase = delay / cycleDuration;

  // Valor sempre 0→1→0 em loop, usando módulo
  const progress = Animated.modulo(
    Animated.add(loopDriver, phase),
    1
  );

  // Escala cresce e volta
  const scale = progress.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 1],
  });

  // Opacidade: aparece, fica, desaparece
  const opacity = progress.interpolate({
    inputRange: [0, 0.75, 1],
    outputRange: [0, 1, 0],
  });

  return (
    <Animated.View
      pointerEvents="none"
      style={[
        styles.ring,
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          borderColor: color,
          opacity,
          transform: [
            { translateX: -size / 2 },
            { translateY: -size / 2 },
            { scale },
          ],
        },
      ]}
    />
  );
};

const styles = StyleSheet.create({
  ring: {
    position: 'absolute',
    borderWidth: 2,
    top: '50%',
    left: '50%',
  },
});

export default PulsingRing;
