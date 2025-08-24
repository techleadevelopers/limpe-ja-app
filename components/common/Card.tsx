// src/components/Card.tsx
import React from 'react';
import { View, StyleSheet, StyleProp, ViewStyle, useColorScheme } from 'react-native'; // Adicionado useColorScheme e StyleProp
import Colors from '../../constants/Colors'; // Assumindo que Colors.ts está em constants/Colors

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
      // Assumindo que shadowColorCard está definido em Colors.ts para sombras
      shadowColor: theme.shadowColorCard,
      shadowOffset: {
        width: 0,
        height: 2,
      },
      shadowOpacity: 0.25, // Esses valores podem precisar de ajuste com base na sua definição de 'shadows.card'
      shadowRadius: 3.84,
      elevation: 5, // Para Android
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