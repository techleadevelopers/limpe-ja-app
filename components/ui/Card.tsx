// LimpeJaApp/src/components/ui/Card.tsx
import React from 'react';
import { View, StyleSheet, ViewStyle, Pressable } from 'react-native';
import Colors from '../../constants/Colors';
import { useColorScheme } from 'react-native';

interface CardProps {
  children: React.ReactNode;
  style?: ViewStyle;
  onPress?: () => void;
  // Outras props como elevation, shadow, etc.
}

const Card: React.FC<CardProps> = ({ children, style, onPress }) => {
  const colorScheme = useColorScheme() || 'light';
  const themeColors = Colors[colorScheme];

  const cardStyle = [
    styles.cardBase,
    {
      backgroundColor: colorScheme === 'light' ? themeColors.background : themeColors.lightGrey, // Exemplo
      borderColor: colorScheme === 'light' ? themeColors.lightGrey : themeColors.darkGrey,
    },
    style,
  ];

  if (onPress) {
    return (
      <Pressable style={({ pressed }) => [cardStyle, pressed && styles.pressed]} onPress={onPress}>
        {children}
      </Pressable>
    );
  }

  return <View style={cardStyle}>{children}</View>;
};

const styles = StyleSheet.create({
  cardBase: {
    borderRadius: 10,
    padding: 15,
    borderWidth: 1,
    // Sombras (podem variar por plataforma)
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.20,
    shadowRadius: 1.41,
    elevation: 2, // Para Android
    marginBottom: 16, // Espaçamento padrão
  },
  pressed: {
    opacity: 0.8,
  }
});

export default Card;