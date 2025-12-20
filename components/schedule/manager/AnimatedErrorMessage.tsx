// app/provider/schedule/components/AnimatedErrorMessage.tsx
import React, { useEffect, useRef } from 'react';
import { Animated, StyleSheet } from 'react-native';

interface AnimatedErrorMessageProps {
  message: string;
  isVisible: boolean;
}

const AnimatedErrorMessage: React.FC<AnimatedErrorMessageProps> = ({ message, isVisible }) => {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(-10)).current;

  useEffect(() => {
    if (isVisible) {
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(slideAnim, {
          toValue: -10,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [isVisible, fadeAnim, slideAnim]);

  return (
    <Animated.Text style={[styles.errorMessage, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
      {message}
    </Animated.Text>
  );
};

const styles = StyleSheet.create({
  errorMessage: {
    fontSize: 12,
    color: '#F44336', // Vermelho para erro
    marginTop: 2,
  },
});

export default AnimatedErrorMessage;