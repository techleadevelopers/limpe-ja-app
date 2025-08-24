// utils/useReducedMotion.ts
import { useState, useEffect } from 'react';
import { AccessibilityInfo } from 'react-native';

export const useReducedMotion = () => {
  const [reduced, setReduced] = useState(false);

  useEffect(() => {
    const checkReducedMotion = async () => {
      try {
        const isReduced = await AccessibilityInfo.isReduceMotionEnabled();
        setReduced(isReduced);
      } catch (error) {
        console.error('Failed to get reduced motion preference', error);
        // Default to false or handle error appropriately
      }
    };

    checkReducedMotion();

    const listener = AccessibilityInfo.addEventListener(
      'reduceMotionChanged',
      setReduced
    );

    return () => {
      listener.remove();
    };
  }, []);

  return reduced;
};