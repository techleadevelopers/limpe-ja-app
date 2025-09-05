// components/client/explore/home/MainCategoryButton.tsx
import React from 'react';
import { TouchableOpacity, Text, StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

// Define um tipo para os nomes de ícones do Ionicons
type IoniconsName = keyof typeof Ionicons.glyphMap;

interface MainCategoryButtonProps {
  title: string;
  iconName: IoniconsName; // Usando o tipo específico de Ionicons
  backgroundColor: string;
  onPress: () => void;
}

export default function MainCategoryButton({ title, iconName, backgroundColor, onPress }: MainCategoryButtonProps) {
  return (
    <TouchableOpacity style={[styles.container, { backgroundColor }]} onPress={onPress}>
      <Ionicons name={iconName} size={30} color="#FFF" />
      <Text style={styles.title}>{title}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    width: 100,
    height: 100,
    borderRadius: 15,
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  title: {
    marginTop: 8,
    fontSize: 14,
    fontWeight: 'bold',
    color: '#FFF',
  },
});