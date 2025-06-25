// LimpeJaApp/utils/ui-helpers.tsx
import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export const renderStars = (rating: number | undefined) => {
  if (rating === undefined || rating === null) return null;
  const stars = [];
  for (let i = 1; i <= 5; i++) {
    stars.push(
      <Ionicons
        key={i}
        name={i <= rating ? "star" : (i - rating < 1 && i - rating > 0 ? "star-half" : "star-outline")}
        size={16}
        color="#FFD700"
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