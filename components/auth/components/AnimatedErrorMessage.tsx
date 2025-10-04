// LimpeJaApp/app/(auth)/components/AnimatedErrorMessage.tsx
import React, { useEffect, useRef } from 'react';
import { Animated, Text, StyleSheet } from 'react-native';

interface AnimatedErrorMessageProps {
  message: string | null;
  isVisible: boolean;    // Controla a visibilidade e a animação
  centered?: boolean;    // Adicionada a propriedade 'centered'
}

export const AnimatedErrorMessage: React.FC<AnimatedErrorMessageProps> = ({
  message,
  isVisible,
  centered,
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
    <Animated.View style={[internalStyles.container, { opacity: fadeAnim }]}>
      <Text style={[internalStyles.messageText, centered && internalStyles.centeredText]}>{message}</Text>
    </Animated.View>
  );
};

// Estilos específicos para o AnimatedErrorMessage, agora definidos internamente
const internalStyles = StyleSheet.create({
  container: {
    bottom: -20,
    paddingVertical: 8,
    paddingHorizontal: 10,
    // Removido backgroundColor e borderRadius daqui se você quiser que o componente pai controle isso
    // ou se o estilo 'inlineErrorMessage' do pai já faz isso.
    // Para manter a UI original, vou manter o que estava no seu código.
    // O 'marginBottom' e 'marginTop' do pai serão aplicados via prop 'style' se necessário.
  },
  messageText: {
    color: '#E53E3E', // Cor do erro
    fontSize: 11,
    textAlign: 'center', // Padrão para erros centralizados
    marginBottom: 5, // Mantenha se for parte do estilo padrão do erro, senão remova
    marginTop: -32, // Mantenha se for parte do estilo padrão do erro, senão remova
  },
  centeredText: {
    textAlign: 'center',
  },
});