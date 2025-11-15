import React, { useRef, useEffect } from 'react';
import { TouchableOpacity, StyleSheet, Animated, Easing, Platform, Image } from 'react-native';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';

// Importe o objeto Icons3D
// Certifique-se de que o caminho para 'icons3d' está correto em relação a este arquivo.
// Ex: Se icons3d.ts está em 'LimpeJaApp/constants/icons3d.ts'
// e DEFENSE_SOS.tsx está em 'LimpeJaApp/components/client/explore/home/DEFENSE_SOS.tsx',
// o caminho relativo é '../../../../constants/icons3d'.
import { Icons3D } from '../../../../constants/icons3d'; 

interface DefenseSOSProps {
  bottomOffset?: number; // distância do rodapé (px)
}

const DEFENSE_SOS: React.FC<DefenseSOSProps> = ({ bottomOffset = 20 }) => {
  const router = useRouter();

  // animações (iguais ao FAB_SOS)
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const pulseAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // pulso / glow contínuo - EXATAMENTE O MESMO EFEITO ROBUSTO DO FAB_SOS
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1500, // Mesma duração
          easing: Easing.inOut(Easing.ease), // Mesmo easing
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 0,
          duration: 1500, // Mesma duração
          easing: Easing.inOut(Easing.ease), // Mesmo easing
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, [pulseAnim]); // A dependência pulseAnim é segura aqui, pois é um useRef.current

  const onPressIn = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    Animated.spring(scaleAnim, {
      toValue: 0.9,
      useNativeDriver: true,
      friction: 3, // Ajuste para consistência
      tension: 40, // Ajuste para consistência
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
    // Navega para a tela de defesa/segurança
    router.push('/(client)/messages/limpeja' as any); 
  };

  // Interpolação para a opacidade do glow - EXATAMENTE A MESMA DO FAB_SOS
  const glowOpacity = pulseAnim.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: [0, 0.5, 0],
  });

  // Interpolação para a escala do glow - EXATAMENTE A MESMA DO FAB_SOS
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
      {/* Botão Principal */}
      <Animated.View style={[styles.fabButton, { transform: [{ scale: scaleAnim }] }]}>
        <Image
          source={Icons3D.support} // Usa a imagem 'docCheck2' do seu objeto Icons3D
          style={{ width: 50, height: 50 }} // <--- tintColor REMOVIDO AQUI
        />
      </Animated.View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  fabContainer: {
    position: 'absolute',
    right: 40,
    // Ajuste o zIndex para garantir que o FAB esteja acima de outros elementos
    zIndex: 1000, 
  },
  // Glow azul (confortável, suave) - Cor diferente do FAB_SOS, mas o efeito é o mesmo
  fabGlow: {
    position: 'absolute',
    width: 69,
    height: 69,
    borderRadius: 32,
    backgroundColor: '#a0caf1ff', // glow azul claro
    alignSelf: 'center',
    top: -2,
    left: -3,
    right: 0,
    bottom: 0,
  },
  // Botão azul
  fabButton: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#97c2ee5d', // azul principal (iOS-like)
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
