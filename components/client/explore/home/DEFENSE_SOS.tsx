import React, { useRef, useEffect } from 'react';
import { TouchableOpacity, StyleSheet, Animated, Easing, Platform, Image } from 'react-native';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';

interface DefenseSOSProps {
  bottomOffset?: number; // distância do rodapé (px)
}

const DEFENSE_SOS: React.FC<DefenseSOSProps> = ({ bottomOffset = 20 }) => {
  const router = useRouter();

  // animações (iguais ao FAB_SOS)
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const pulseAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // pulso / glow contínuo
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
  }, [pulseAnim]);

  const onPressIn = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
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
    router.push('/(common)/safety/defense' as any); // ajuste a rota se necessário
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
      style={[styles.fabContainer, { bottom: bottomOffset + (Platform.OS === 'ios' ? 30 : 50) }]}
      onPress={handlePress}
      onPressIn={onPressIn}
      onPressOut={onPressOut}
      activeOpacity={0.85}
      accessibilityLabel="Botão Defesa"
      accessibilityRole="button"
    >
      {/* Glow/Pulso Azul */}
      <Animated.View
        style={[
          styles.fabGlow,
          {
            opacity: glowOpacity,
            transform: [{ scale: glowScale }],
          },
        ]}
      />
      {/* Botão */}
      <Animated.View style={[styles.fabButton, { transform: [{ scale: scaleAnim }] }]}>
        <Image
          source={require('../../assets/images/3d/panic-sos.png')}
          style={{ width: 30, height: 30, tintColor: '#FFFFFF' }}
        />
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
  // Glow azul (confortável, suave)
  fabGlow: {
    position: 'absolute',
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#D0E8FF', // glow azul claro
    alignSelf: 'center',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  // Botão azul
  fabButton: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#0A84FF', // azul principal (iOS-like)
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 8,
    // borda sutil para contraste em fundos claros
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.25)',
  },
});

export default DEFENSE_SOS;