import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { View, StyleSheet } from 'react-native'; // Removido Text, Image pois não são usados aqui
// Removida importação de styles de '../../styles/providerStyles'

interface StarRatingProps {
  rating: number;
  size?: number;
  color?: string;
}

const StarRating: React.FC<StarRatingProps> = ({ rating, size = 16, color = '#FFD700' }) => { // Reduzindo o default size para 16, que é mais comum para ícones de estrela
  const stars = [];
  const fullStars = Math.floor(rating);
  const halfStar = rating % 1 >= 0.5;
  const emptyStars = 5 - fullStars - (halfStar ? 1 : 0);

  // Função auxiliar para renderizar uma estrela com espaçamento
  const renderStar = (name: any, key: string) => (
    <Ionicons key={key} name={name} size={size} color={color} style={styles.starIcon} />
  );

  for (let i = 0; i < fullStars; i++) stars.push(renderStar("star", `full_${i}`));
  if (halfStar) stars.push(renderStar("star-half-sharp", "half"));
  for (let i = 0; i < emptyStars; i++) stars.push(renderStar("star-outline", `empty_${i}`));

  return <View style={styles.starRatingContainer}>{stars}</View>;
};

// Estilos definidos LOCALMENTE para o StarRating, baseados nos do RecomendacaoCard
const styles = StyleSheet.create({
  starRatingContainer: {
    flexDirection: 'row',
    marginRight: 5, // Ajustado para dar um pequeno espaçamento se necessário
    alignItems: 'center', // Para garantir que todas as estrelas estejam alinhadas verticalmente
  },
  starIcon: {
    marginRight: 1, // Espaçamento entre as estrelas individuais
  },
});

export default StarRating;