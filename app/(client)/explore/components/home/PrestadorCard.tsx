// app/(client)/explore/components/home/PrestadorCard.tsx
import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useRef } from 'react';
import { Animated, Dimensions, Image, StyleSheet, Text, TouchableOpacity, View, Platform } from 'react-native';

// Importa ProviderDisplayInfo diretamente do caminho correto
import { ProviderDisplayInfo } from '../../../../types/backend/providers'; // AJUSTE O CAMINHO CONFORME A ESTRUTURA REAL DO SEU PROJETO

const SCREEN_WIDTH = Dimensions.get('window').width;

interface PrestadorCardProps {
  item: ProviderDisplayInfo;
  onPress: (prestadorId: string) => void;
}

const PrestadorCard: React.FC<PrestadorCardProps> = ({ item, onPress }) => {
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(20)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 400,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 400,
        useNativeDriver: true,
      }),
    ]).start();
  }, [fadeAnim, slideAnim]);

  const onPressInCard = () => {
    Animated.spring(scaleAnim, { toValue: 0.97, useNativeDriver: true }).start();
  };

  const onPressOutCard = () => {
    Animated.spring(scaleAnim, { toValue: 1, friction: 4, tension: 50, useNativeDriver: true }).start();
  };

  const renderStars = (rating: number | undefined) => {
    const stars = [];
    const actualRating = rating !== undefined ? rating : 0;
    for (let i = 1; i <= 5; i++) {
      stars.push(
        <Ionicons
          key={i}
          name={i <= actualRating ? 'star' : 'star-outline'}
          size={14}
          color="#007BFF" // Estrelas azuis
          style={styles.starIcon}
        />
      );
    }
    return <View style={styles.starContainer}>{stars}</View>;
  };

  // Extrai a especialidade e o preço do primeiro serviço oferecido
  const primaryService = item.providerServices && item.providerServices.length > 0 ? item.providerServices[0] : null;
  const specialtyName = primaryService && primaryService.service ? primaryService.service.name : 'Serviço não especificado';
  // CORREÇÃO AQUI: REMOVIDO .toNumber()
  const servicePrice = primaryService ? `R$ ${primaryService.price.toFixed(2).replace('.', ',')}` : 'N/A';

  const avatarSource = item.avatarUrl ? { uri: item.avatarUrl } : require('../../../../../assets/images/default-avatar.png');

  return (
    <Animated.View style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}>
      <TouchableOpacity
        style={[styles.cardContainer, { transform: [{ scale: scaleAnim }] }]}
        onPress={() => onPress(item.id)} // item.id existe em ProviderDisplayInfo
        onPressIn={onPressInCard}
        onPressOut={onPressOutCard}
        activeOpacity={0.95}
      >
        {/* Imagem Principal */}
        <View style={styles.imageWrapper}>
          <Image source={avatarSource} style={styles.cardImage} />
          {item.distance && (
            <View style={styles.distanceTag}>
              <Ionicons name="location-outline" size={14} color="#FFF" />
              <Text style={styles.distanceText}>{item.distance}</Text>
            </View>
          )}
          {/* Ícone de Favoritar */}
          <TouchableOpacity style={styles.favoriteIconContainer}>
            <Ionicons
              name={"heart-outline"}
              size={24}
              color={"#FFF"}
            />
          </TouchableOpacity>
        </View>

        {/* Container de Detalhes Abaixo da Imagem */}
        <View style={styles.detailsContainer}>
          {/* Linha de Avaliação */}
          <View style={styles.ratingRow}>
            {renderStars(item.averageRating)}
            <Text style={styles.reviewsText}>({item.reviewCount || 0} Avaliações)</Text>
          </View>

          {/* Título Principal (nome do prestador) */}
          <Text style={styles.cardTitle} numberOfLines={1}>{item.fullName}</Text>

          {/* Especialidade (abaixo do nome, essencial) */}
          <View style={styles.specialtyRow}>
            <Ionicons name="briefcase-outline" size={16} color="#B0B0B0" />
            <Text style={styles.specialtyText} numberOfLines={1}>{specialtyName}</Text>
          </View>

          {/* Seção de Verificado e Preço */}
          <View style={styles.verificationPriceRow}>
            {/* CORREÇÃO AQUI: Usando item.verificationStatus */}
            {item.verificationStatus === 'APPROVED' && (
              <View style={styles.verifiedBadge}>
                <Ionicons name="shield-checkmark" size={14} color="#FFF" />
                <Text style={styles.verifiedBadgeText}>Verificado</Text>
              </View>
            )}
            <Text style={styles.priceText}>{servicePrice}</Text>
          </View>
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  cardContainer: {
    width: 280,
    backgroundColor: '#FFFFFF',
    borderRadius: 15,
    marginRight: 15,
    marginBottom: 15,
    overflow: 'hidden',
    ...Platform.select({
        ios: { shadowColor: '#000000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.10, shadowRadius: 6 },
        android: { elevation: 5 },
    }),
  },
  imageWrapper: {
    width: '100%',
    height: 160,
    backgroundColor: '#E0E0E0',
    borderTopLeftRadius: 15,
    borderTopRightRadius: 15,
    overflow: 'hidden',
    position: 'relative',
  },
  cardImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  distanceTag: {
    position: 'absolute',
    top: 12,
    left: 12,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
    flexDirection: 'row',
    alignItems: 'center',
  },
  distanceText: {
    color: '#FFF',
    fontSize: 13,
    fontWeight: '600',
    marginLeft: 6,
  },
  favoriteIconContainer: {
    position: 'absolute',
    top: 12,
    right: 12,
    padding: 6,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    borderRadius: 50,
  },
  detailsContainer: {
    paddingVertical: 15,
    paddingHorizontal: 16,
    backgroundColor: '#FFFFFF',
    borderBottomLeftRadius: 15,
    borderBottomRightRadius: 15,
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
    color: "#4A90E2",
  },
  reviewsText: {
    fontSize: 12,
    color: '#6C757D',
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1A202C',
    marginBottom: 4,
  },
  specialtyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  specialtyText: {
    fontSize: 14,
    color: '#4A5568',
    marginLeft: 6,
    flexShrink: 1,
  },
  verificationPriceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#F0F0FF',
  },
  verifiedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#4A90E2',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
  },
  verifiedBadgeText: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: '600',
    marginLeft: 5,
  },
  priceText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#007BFF',
  },
});

export default PrestadorCard;