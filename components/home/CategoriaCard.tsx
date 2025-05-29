// LimpeJaApp/components/CategoriaCard.tsx
import React from 'react';
import { TouchableOpacity, Text, StyleSheet, View } from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons'; // Necessário para ícones diversos

export interface Categoria {
  id: string;
  nome: string;
  icone: string; // Nome do ícone
  iconType?: 'Ionicons' | 'MaterialCommunityIcons'; // Opcional: para especificar a biblioteca de ícones
  backgroundColor?: string; // Opcional: cor de fundo para o círculo do ícone
  iconColor?: string; // Opcional: cor para o próprio ícone
}

interface CategoriaCardProps {
  item: Categoria;
  onPress: (categoria: Categoria) => void;
}

const CategoriaCard: React.FC<CategoriaCardProps> = ({ item, onPress }) => {
  // Escolhe o componente de ícone com base no tipo
  const IconComponent = item.iconType === 'MaterialCommunityIcons' ? MaterialCommunityIcons : Ionicons;

  return (
    <TouchableOpacity style={styles.cardContainer} onPress={() => onPress(item)}>
      <View style={[styles.iconCircle, { backgroundColor: item.backgroundColor || '#EBF3FF' }]}>
        <IconComponent name={item.icone} size={30} color={item.iconColor || '#007BFF'} />
      </View>
      <Text style={styles.cardText}>{item.nome}</Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  cardContainer: {
    width: 90, // Largura fixa para cada card de categoria
    marginHorizontal: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 15,
  },
  iconCircle: {
    width: 60,
    height: 60,
    borderRadius: 15, // Quadrado levemente arredondado
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
    // Sombra para o círculo do ícone
    shadowColor: 'rgba(0,0,0,0.1)',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.8,
    shadowRadius: 4,
    elevation: 3,
  },
  cardText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#4A5568',
    textAlign: 'center',
  },
});

export default CategoriaCard;