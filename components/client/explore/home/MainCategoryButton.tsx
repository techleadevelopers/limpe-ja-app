// components/client/explore/home/MainCategoryButton.tsx
import React, { useRef } from 'react'; // Importar useRef
import { TouchableOpacity, Text, StyleSheet, View, Animated, Easing } from 'react-native'; // Importar Animated, Easing
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
  const scaleAnim = useRef(new Animated.Value(1)).current; // Animação de escala

  const onPressInButton = () => {
    Animated.spring(scaleAnim, {
      toValue: 0.95, // Escala sutil ao pressionar
      useNativeDriver: true,
      friction: 5, // Mais "mola"
      tension: 80, // Retorno rápido
    }).start();
  };

  const onPressOutButton = () => {
    Animated.spring(scaleAnim, {
      toValue: 1, // Retorna à escala normal
      friction: 5,
      tension: 80,
      useNativeDriver: true,
    }).start();
  };

  return (
    <TouchableOpacity
      style={[styles.container, { backgroundColor, transform: [{ scale: scaleAnim }] }]} // Aplica a animação de escala
      onPress={onPress}
      onPressIn={onPressInButton}
      onPressOut={onPressOutButton}
      activeOpacity={0.7}
    >
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
