// LimpeJaApp/app/auth/components/AnimatedErrorMessage.tsx
import React, { useEffect, useRef } from 'react';
import { Animated, Text, StyleSheet, StyleProp, ViewStyle } from 'react-native';

interface AnimatedErrorMessageProps {
  message: string | null;
  isVisible: boolean;    // Controla a visibilidade e a animacao
  centered?: boolean;    // Adicionada a propriedade 'centered'
  containerStyle?: StyleProp<ViewStyle>; // Permite ajuste fino onde for usado
}

export const AnimatedErrorMessage: React.FC<AnimatedErrorMessageProps> = ({
  message,
  isVisible,
  centered,
  containerStyle,
}) => {
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: isVisible && message ? 1 : 0,
      duration: 300,
      useNativeDriver: true,
    }).start();
  }, [isVisible, message, fadeAnim]);

  if (!message) {
    return null;
  }

  return (
    <Animated.View style={[internalStyles.container, containerStyle, { opacity: fadeAnim }]}>
      <Text style={[internalStyles.messageText, centered && internalStyles.centeredText]}>{message}</Text>
    </Animated.View>
  );
};

// Estilos especificos para o AnimatedErrorMessage, agora definidos internamente
const internalStyles = StyleSheet.create({
  container: {
    minHeight: 16, // Altura fixa para evitar o "pulo" do layout
    marginTop: 2,
    justifyContent: 'center',
  },
  messageText: {
    color: '#E53E3E',
    fontSize: 11,
    textAlign: 'left', // Alinhado à esquerda geralmente fica melhor abaixo do input
  },
  centeredText: {
    textAlign: 'center',
  },
});
