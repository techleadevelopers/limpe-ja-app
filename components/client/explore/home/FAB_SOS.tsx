// LimpeJaApp/app/components/client/explore/home/FAB_SOS.tsx
import React, { useRef } from 'react';
import { TouchableOpacity, StyleSheet, Animated, Easing, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics'; // Importar Haptics

interface FAB_SOSProps {
  bottomOffset?: number; // Offset from the bottom of the screen
}

const FAB_SOS: React.FC<FAB_SOSProps> = ({ bottomOffset = 20 }) => {
  const router = useRouter();
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const pulseAnim = useRef(new Animated.Value(0)).current; // Para o efeito de glow/pulso

  React.useEffect(() => {
    // Animação de pulso para o glow
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1500,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 0,
          duration: 1500,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, []);

  const onPressIn = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); // Feedback háptico
    Animated.spring(scaleAnim, {
      toValue: 0.9,
      useNativeDriver: true,
      friction: 3,
    }).start();
  };

  const onPressOut = () => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      useNativeDriver: true,
      friction: 3,
      tension: 40,
    }).start();
  };

  const handlePress = () => {
    router.push('/(common)/safety/panic' as any);
  };

  const glowOpacity = pulseAnim.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: [0, 0.5, 0],
  });

  const glowScale = pulseAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 1.2],
  });

  return (
    <TouchableOpacity
      style={[styles.fabContainer, { bottom: bottomOffset + (Platform.OS === 'ios' ? 30 : 0) }]} // Ajuste para safe area do iOS
      onPress={handlePress}
      onPressIn={onPressIn}
      onPressOut={onPressOut}
      activeOpacity={0.8}
      accessibilityLabel="Botão de Emergência SOS"
      accessibilityRole="button"
    >
      <Animated.View
        style={[
          styles.fabGlow,
          {
            opacity: glowOpacity,
            transform: [{ scale: glowScale }],
          },
        ]}
      />
      <Animated.View style={[styles.fabButton, { transform: [{ scale: scaleAnim }] }]}>
        <Ionicons name="warning" size={32} color="#FFFFFF" />
      </Animated.View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  fabContainer: {
    position: 'absolute',
    right: 20,
    zIndex: 1000,
  },
  fabGlow: {
    position: 'absolute',
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#FFCDD2', // Cor de glow
    alignSelf: 'center',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  fabButton: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#E53935', // Cor base do FAB
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 8,
  },
});

export default FAB_SOS;