// LimpeJaApp/utils/ui-helpers.tsx
import React from 'react';
import { View, StyleSheet, ColorValue } from 'react-native'; // Adicionado ColorValue
import { Ionicons } from '@expo/vector-icons';

const DEFAULT_STAR_FILL_COLOR: ColorValue = '#FFC107'; // Use ColorValue para consistência
const DEFAULT_STAR_OUTLINE_COLOR: ColorValue = '#E0E0E0'; // Use ColorValue

export const renderStars = (
  rating: number | undefined,
  size: number = 16, // <<< ADICIONADO: Novo parâmetro para o tamanho das estrelas
  fillColor: ColorValue = DEFAULT_STAR_FILL_COLOR, // Alterado para ColorValue
  outlineColor: ColorValue = DEFAULT_STAR_OUTLINE_COLOR // Alterado para ColorValue
): React.ReactNode => { // Adicionado tipo de retorno para clareza
  if (rating === undefined || rating === null) return null;
  const stars = [];
  const roundedRating = Math.round(rating * 2) / 2;

  for (let i = 1; i <= 5; i++) {
    let iconName: 'star' | 'star-half' | 'star-outline' = 'star-outline';
    let starColor: ColorValue = outlineColor; // Usa ColorValue para consistência

    if (i <= roundedRating) {
      iconName = "star";
      starColor = fillColor;
    } else if (i - roundedRating === 0.5) {
      iconName = "star-half";
      starColor = fillColor;
    } else {
      iconName = "star-outline";
      starColor = outlineColor;
    }

    stars.push(
      <Ionicons
        key={i}
        name={iconName}
        size={size} // <<< USANDO O NOVO PARÂMETRO 'size' AQUI
        color={starColor}
        style={{ marginRight: 2 }}
      />
    );
  }
  return <View style={uiHelpersStyles.starsContainer}>{stars}</View>; // Corrigido para uiHelpersStyles
};

const uiHelpersStyles = StyleSheet.create({ // Renomeado para evitar conflito com 'styles' de outros arquivos
  starsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
});