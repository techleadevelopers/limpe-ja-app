// LimpeJaApp/utils/ui-helpers.tsx
import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

// Adicione as cores padrão aqui, ou elas podem ser passadas como props quando a função for chamada
const DEFAULT_STAR_FILL_COLOR = '#FFC107'; // WARNING_YELLOW ou um amarelo dourado
const DEFAULT_STAR_OUTLINE_COLOR = '#E0E0E0'; // Um cinza claro para o contorno

export const renderStars = (
  rating: number | undefined,
  fillColor: string = DEFAULT_STAR_FILL_COLOR,     // NOVO: cor para estrelas preenchidas, com default
  outlineColor: string = DEFAULT_STAR_OUTLINE_COLOR // NOVO: cor para estrelas de contorno, com default
) => {
  if (rating === undefined || rating === null) return null;
  const stars = [];
  const roundedRating = Math.round(rating * 2) / 2; // Arredonda para o 0.5 mais próximo

  for (let i = 1; i <= 5; i++) {
    let iconName: 'star' | 'star-half' | 'star-outline' = 'star-outline';
    let starColor = outlineColor; // Cor padrão para estrelas vazias

    if (i <= roundedRating) {
      iconName = "star";
      starColor = fillColor; // Cor para estrelas cheias
    } else if (i - roundedRating === 0.5) {
      iconName = "star-half";
      starColor = fillColor; // Cor para meia estrela
    } else {
      iconName = "star-outline";
      starColor = outlineColor; // Cor para estrelas de contorno
    }

    stars.push(
      <Ionicons
        key={i}
        name={iconName}
        size={16}
        color={starColor} // Usa a cor calculada
        style={{ marginRight: 2 }}
      />
    );
  }
  return <View style={styles.starsContainer}>{stars}</View>;
};

const styles = StyleSheet.create({
  starsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
});