// components/ButtonPositive.tsx
import React from 'react';
import { TouchableOpacity, StyleSheet, Platform, ViewStyle, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

interface ButtonPositiveProps {
  onPress: () => void;
  size?: number;
  iconSize?: number;
  style?: ViewStyle;
}

export default function ButtonPositive({
  onPress,
  size = 60,
  iconSize = 30,
  style,
}: ButtonPositiveProps) {
  const gradientSize = size - 10;
  const borderRadius = size / 2;
  const gradientRadius = gradientSize / 2;

  return (
    <TouchableOpacity
      style={[styles.container, { width: size, height: size, borderRadius }, style]}
      onPress={onPress}
      activeOpacity={0.8}
    >
      <LinearGradient
        colors={['#e3eaefff', '#0097FF']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={{
          width: gradientSize,
          height: gradientSize,
          borderRadius: gradientRadius,
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Ionicons name="add" size={iconSize} color="#FFFFFF" />
      </LinearGradient>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#007AFF',
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.35,
    shadowRadius: 12,
    elevation: 15,
  },
});

