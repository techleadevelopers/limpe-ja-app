// LimpeJaApp/components/ServiceCard.tsx
import React from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export interface Prestador {
  id: string;
  nome: string; // Nome do serviço ou do prestador
  especialidade: string; // Título do serviço
  avaliacao: number;
  numeroAvaliacoes: number;
  preco: string; // Ex: "$200 $250"
  imagemUrl: string;
}

interface ServiceCardProps {
  item: Prestador;
  onPress: (prestador: Prestador) => void;
}

const ServiceCard: React.FC<ServiceCardProps> = ({ item, onPress }) => {
  const renderStars = (rating: number) => {
    const stars = [];
    for (let i = 1; i <= 5; i++) {
      stars.push(
        <Ionicons
          key={i}
          name={i <= rating ? 'star' : 'star-outline'}
          size={14}
          color="#FFD700" // Cor dourada para as estrelas
          style={styles.starIcon}
        />
      );
    }
    return <View style={styles.starContainer}>{stars}</View>;
  };

  // Divide o preço para aplicar estilo diferente
  const prices = item.preco.split(' ');
  const originalPrice = prices.length > 1 ? prices[0] : null;
  const discountedPrice = prices.length > 1 ? prices[1] : prices[0];


  return (
    <TouchableOpacity style={styles.cardContainer} onPress={() => onPress(item)}>
      <Image source={{ uri: item.imagemUrl }} style={styles.serviceImage} />
      <View style={styles.infoContainer}>
        <View style={styles.ratingRow}>
          {renderStars(item.avaliacao)}
          <Text style={styles.reviewsText}>({item.numeroAvaliacoes} Reviews)</Text>
        </View>
        <Text style={styles.serviceTitle}>{item.especialidade}</Text>
        <View style={styles.priceRow}>
          {originalPrice && <Text style={styles.originalPrice}>{originalPrice}</Text>}
          <Text style={styles.discountedPrice}>{discountedPrice}</Text>
        </View>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  cardContainer: {
    width: 180, // Largura de cada card de serviço
    backgroundColor: '#FFFFFF', // Fundo claro para os cards
    borderRadius: 15,
    marginRight: 15,
    overflow: 'hidden',
    shadowColor: 'rgba(0,0,0,0.1)', // Sombra sutil
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.8,
    shadowRadius: 6,
    elevation: 4,
    marginBottom: 10, // Para visibilidade da sombra
  },
  serviceImage: {
    width: '100%',
    height: 120, // Altura da imagem do card
    resizeMode: 'cover',
  },
  infoContainer: {
    padding: 10,
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 5,
  },
  starContainer: {
    flexDirection: 'row',
    marginRight: 5,
  },
  starIcon: {
    marginRight: 2,
  },
  reviewsText: {
    fontSize: 12,
    color: '#718096',
  },
  serviceTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2D3748',
    marginBottom: 5,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  originalPrice: {
    fontSize: 12,
    color: '#718096',
    textDecorationLine: 'line-through',
    marginRight: 5,
  },
  discountedPrice: {
    fontSize: 14,
    fontWeight: '600',
    color: '#007BFF', // Azul para o preço
  },
});

export default ServiceCard;