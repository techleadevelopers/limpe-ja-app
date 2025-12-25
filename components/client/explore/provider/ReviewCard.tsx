// components/ReviewCard.tsx
import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { Image, StyleSheet, Text, View } from 'react-native';
// IMPORTAR A INTERFACE CORRETA DO SEU ARQUIVO DE TIPOS GLOBAIS
import { ProviderReview } from '../../../../types/backend/providers'; // <--- CORREÇÃO: Importação correta da interface
import StarRating from './StarRating'; // Importa o componente StarRating

// NÃO PRECISA MAIS DE ReviewEntity AQUI, APENAS A INTERFACE PARA AS PROPS
interface ReviewCardProps {
  review: ProviderReview; // Usando a interface ProviderReview importada
}

const ReviewCard: React.FC<ReviewCardProps> = ({ review }) => {
  // Acesso seguro às propriedades e definição de fallbacks
  const reviewerName = review.client?.fullName || 'Andreia Silveira'; // Acessa com segurança, fallback
  const reviewerImageUrl = review.client?.user?.avatarUrl; // Acessa com segurança, pode ser undefined ou null

  // Formatando a data
  const reviewDate = new Date(review.createdAt).toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });

  return (
    <View key={review.id} style={styles.reviewCard}>
      <View style={styles.reviewHeader}>
        {/* Renderização condicional da imagem do avaliador */}
        {reviewerImageUrl ? (
          <Image source={{ uri: reviewerImageUrl }} style={styles.reviewerImage} />
        ) : (
          <View style={styles.reviewerImagePlaceholder}>
            <Ionicons name="person-circle-outline" size={28} color="#FFF" />
          </View>
        )}
        <View style={styles.reviewHeaderText}>
          <Text style={styles.reviewerName}>{reviewerName}</Text>
          <View style={styles.reviewRatingDate}>
            <StarRating rating={review.rating} size={11} color="#4A90E2" />
            <Text style={styles.reviewDate}>{reviewDate}</Text>
          </View>
        </View>
      </View>
      {/* Certifique-se de que review.comment seja sempre uma string para exibir */}
      <Text style={styles.reviewComment}>{review.comment || ''}</Text>
    </View>
  );
};

// Estilos movidos para dentro do arquivo para auto-suficiência,
// ou você pode manter a importação de '../../styles/providerStyles' se for um arquivo compartilhado.
// Se 'styles' for importado de um arquivo externo, certifique-se de que ele contenha todos esses estilos.
const styles = StyleSheet.create({
  reviewCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    padding: 15,
    paddingHorizontal: 20,
    // left: -1, // REMOVIDO
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 0,
  },
  // CORREÇÃO 3: Header limpo
  reviewHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8, // Ajustado para 8
  },
  reviewerImage: {
    width: 40, 
    height: 40, 
    borderRadius: 20,
    marginRight: 10, 
    // top: 30, // REMOVIDO
    backgroundColor: '#E0E0E0', 
  },
  reviewerImagePlaceholder: {
    width: 40, 
    height: 40, 
    borderRadius: 20,
    marginRight: 10, 
    // top: 18, // REMOVIDO
    backgroundColor: '#999',
    justifyContent: 'center', 
    alignItems: 'center',
  },
  reviewHeaderText: {
    flex: 1,
  },
  reviewerName: {
    fontSize: 15, 
    fontWeight: '600', 
    // left: 2, // REMOVIDO
    // top: 0, // REMOVIDO
    color: '#333'
  },
  reviewRatingDate: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
    // left: 154, // REMOVIDO
    // bottom: 20, // REMOVIDO
  },
  reviewDate: {
    fontSize: 10,
    color: '#777',
    marginLeft: 8,
  },
  // CORREÇÃO 3: Comentário limpo
  reviewComment: {
    fontSize: 13.8,
    // paddingHorizontal: 32, // REMOVIDO
    // left: 22, // REMOVIDO
    color: '#555',
    lineHeight: 20,
    marginTop: 8, // Adicionado marginTop
  },
});

export default ReviewCard;