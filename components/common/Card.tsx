// src/components/Card.tsx
import React from 'react';
import { View, StyleSheet, StyleProp, ViewStyle, useColorScheme } from 'react-native'; // Adicionado useColorScheme e StyleProp
import Colors from '../../constants/Colors'; // Assumindo que Colors.ts está em constants/Colors
import { shadow } from '../../app/_shared/ui/parity';

// Hook para acessar as cores do tema atual (reutilizado dos outros componentes)
function useTheme() {
  const scheme = useColorScheme?.() || 'light';
  const theme = (Colors as any)[scheme] || (Colors as any).light;
  return theme as typeof Colors.light;
}

interface CardProps {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>; // Alterado para StyleProp<ViewStyle>
}

const Card: React.FC<CardProps> = ({ children, style }) => {
  const theme = useTheme(); // Obtém o tema atual

  // Estilos dinâmicos baseados no tema
  const dynamicStyles = StyleSheet.create({
    themedCard: {
      backgroundColor: theme.cardBackground, // Usa theme.cardBackground
      ...shadow(2),
      // Mantém a cor personalizada do card mesmo quando a sombra vem do helper
      shadowColor: theme.shadowColorCard,
    },
  });

  return <View style={[styles.card, dynamicStyles.themedCard, style]}>{children}</View>;
};

const styles = StyleSheet.create({
  card: {
    borderRadius: 12,
    padding: 15,
    marginVertical: 8,
    // As sombras são agora tratadas dinamicamente via dynamicStyles.themedCard
  },
});

export default Card;
