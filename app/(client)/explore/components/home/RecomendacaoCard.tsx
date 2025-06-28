// src/app/(client)/explore/components/home/RecomendacaoCard.tsx

import React from 'react';
import { View, Text, Image, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient'; 
import { useRouter } from 'expo-router';

import { ProviderDisplayInfo } from '../../../../types/backend/providers';
import { CLIENT_ROUTES } from '../../../../../constants/routes';

interface RecomendacaoCardProps {
  item: ProviderDisplayInfo;
}

const RecomendacaoCard: React.FC<RecomendacaoCardProps> = ({ item }) => {
  const router = useRouter();

  if (!item || !item.fullName || !item.id) {
    console.warn('[RecomendacaoCard] Item inválido ou incompleto. Render ignorado:', item);
    return null;
  }

  const renderStars = (rating: number | undefined) => {
    const stars = [];
    const actualRating = rating ?? 0;
    const fullStars = Math.floor(actualRating);
    const hasHalfStar = actualRating % 1 !== 0;

    for (let i = 0; i < 5; i++) {
      let iconName: keyof typeof Ionicons.glyphMap = 'star-outline';
      if (i < fullStars) iconName = 'star';
      else if (hasHalfStar && i === fullStars) iconName = 'star-half';

      stars.push(
        <Ionicons
          key={i}
          name={iconName}
          size={16}
          color="#4A90E2"
          style={styles.ratingStarIcon}
        />
      );
    }
    return <View style={styles.ratingStarContainer}>{stars}</View>;
  };

  const handleCardPress = () => {
    try {
      router.push(CLIENT_ROUTES.PROVIDER_DETAILS(item.id));
    } catch (err) {
      console.error('[RecomendacaoCard] Erro ao navegar:', err);
    }
  };

  const avatarSource = item.avatarUrl
    ? { uri: item.avatarUrl }
    : require('../../../../../assets/images/default-avatar.png');

  // Cálculo de preço: REMOVIDO .toNumber() conforme a correção anterior, para alinhamento com a tipagem
  const averagePrice = item.providerServices && item.providerServices.length > 0
    ? item.providerServices.reduce((sum, service) => sum + service.price, 0) / item.providerServices.length
    : 0;

  const shortBio = item.bio ? `${item.bio.substring(0, 70)}${item.bio.length > 70 ? '...' : ''}` : 'Nenhuma descrição disponível.';


  return (
    <TouchableOpacity style={styles.cardContainer} onPress={handleCardPress}>
      <Image source={avatarSource} style={styles.cardImage} />

      <View style={styles.contentArea}>
        <Text style={styles.providerName}>{item.fullName}</Text>

        <Text style={styles.providerBio}>{shortBio}</Text>

        <View style={styles.serviceTagsContainer}>
          {item.providerServices && item.providerServices.slice(0, 2).map((ps, index) => (
            // CORREÇÃO AQUI: Verificação defensiva para 'ps.service'
            <View key={index} style={styles.serviceTag}>
              {ps.service && <Text style={styles.serviceTagText}>{ps.service.name}</Text>}
            </View>
          ))}
          {item.providerServices && item.providerServices.length > 2 && (
            <View style={styles.serviceTag}>
              <Text style={styles.serviceTagText}>+{item.providerServices.length - 2}</Text>
            </View>
          )}
        </View>

        <View style={styles.priceContainer}>
          {averagePrice > 0 ? (
            <>
              <Text style={styles.priceLabel}>A partir de</Text>
              <Text style={styles.priceText}>R$ {averagePrice.toFixed(2).replace('.', ',')}</Text>
            </>
          ) : (
            <Text style={styles.noPriceText}>Preço a consultar</Text>
          )}
        </View>

        <View style={styles.ratingAndReviewsContainer}>
          {renderStars(item.averageRating)}
          {item.reviewCount !== undefined && item.reviewCount > 0 && (
            <Text style={styles.reviewsCountText}>{item.reviewCount} Avaliações</Text>
          )}
          {item.reviewCount === 0 && (
            <Text style={styles.reviewsCountText}>Sem avaliações</Text>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  cardContainer: {
    width: 220,
    borderRadius: 10,
    overflow: 'hidden',
    marginRight: 15,
    marginBottom: -5,
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 5,
  },
  cardImage: {
    width: '100%',
    height: 150,
    resizeMode: 'cover',
  },
  contentArea: {
    padding: 15,
    flexGrow: 1,
  },
  providerName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 5,
  },
  providerBio: {
    fontSize: 13,
    color: '#666',
    lineHeight: 18,
    marginBottom: 10,
  },
  serviceTagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 10,
  },
  serviceTag: {
    backgroundColor: '#E0E0E0',
    borderRadius: 5,
    paddingHorizontal: 8,
    paddingVertical: 4,
    marginRight: 5,
    marginBottom: 5,
  },
  serviceTagText: {
    fontSize: 11,
    color: '#555',
    fontWeight: '500',
  },
  priceContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginBottom: 10,
  },
  priceLabel: {
    fontSize: 12,
    color: '#888',
    marginRight: 5,
  },
  priceText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  noPriceText: {
    fontSize: 14,
    color: '#888',
  },
  ratingAndReviewsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  ratingStarContainer: {
    flexDirection: 'row',
    marginRight: 5,
  },
  ratingStarIcon: {
    marginRight: 1,
  },
  reviewsCountText: {
    fontSize: 12,
    color: '#888',
  },
});

export default RecomendacaoCard;