// utils/useFadeSlideIn.ts
import { useRef, useEffect } from 'react';
import { Animated, Easing } from 'react-native';
import { useReducedMotion } from './useReducedMotion';

export const useFadeSlideIn = (isVisible: boolean = true) => {
  const opacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(18)).current; // Initial offset based on effects.md (translateY 12-18)

  const reduced = useReducedMotion();

  useEffect(() => {
    if (isVisible) {
      Animated.parallel([
        Animated.timing(opacity, {
          toValue: 1,
          duration: reduced ? 0 : 250, // md duration for cards/sections, short for reduced motion
          easing: Easing.out(Easing.ease), // 'decel' equivalent
          useNativeDriver: true,
        }),
        Animated.timing(translateY, {
          toValue: 0,
          duration: reduced ? 0 : 250, // md duration for cards/sections, short for reduced motion
          easing: Easing.out(Easing.ease), // 'decel' equivalent
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      // Optional: animate out if needed, or just reset for next appearance
      opacity.setValue(0);
      translateY.setValue(18);
    }
  }, [isVisible, opacity, translateY, reduced]);

  return { opacity, translateY };
};