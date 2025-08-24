// utils/usePressScale.ts
import { useRef } from 'react';
import { Animated } from 'react-native';

export const usePressScale = () => {
  const scale = useRef(new Animated.Value(1)).current;

  const onPressIn = () => {
    Animated.spring(scale, {
      toValue: 0.96, // toValue 0.96 from effects.md
      damping: 15, // Between 14-16 from effects.md
      stiffness: 240, // Between 220-260 from effects.md
      useNativeDriver: true,
    }).start();
  };

  const onPressOut = () => {
    Animated.spring(scale, {
      toValue: 1, // Return to 1.0 with same spring
      damping: 15,
      stiffness: 240,
      useNativeDriver: true,
    }).start();
  };

  return { scale, onPressIn, onPressOut };
};