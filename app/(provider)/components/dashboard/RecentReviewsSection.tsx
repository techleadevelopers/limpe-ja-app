// app/(provider)/components/dashboard/RecentReviewsSection.tsx
import React, { useRef, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated, Platform, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient'; // Adicionado para efeito Glassmorphic sutil
import { BlurView } from 'expo-blur'; // Adicionado para efeito Glassmorphic sutil

// 1. Importe ProviderReview do seu local central de tipos.
//    Ajuste o caminho se a sua pasta 'types' não estiver na raiz do projeto.
interface ProviderReview {
  id: string;
  clientName: string;
  rating: number;
  comment?: string;
  serviceName: string;
  date: string;
  avatarUrl?: string;
  // Adicionado: ID do agendamento relacionado, para linkar aos detalhes do serviço
  bookingId?: string;
}

// Helper para formatar a data (pode ser movido para um utilitário)
const formatDate = (isoDateString: string): string => {
  const date = new Date(isoDateString);
  const now = new Date();
  const diffTime = Math.abs(now.getTime() - date.getTime());
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return 'Hoje';
  if (diffDays === 1) return 'Ontem';
  if (diffDays < 7) return `Há ${diffDays} dias`;

  return date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' });
};

interface RecentReviewItemProps {
  review: ProviderReview;
  index: number;
  onPressReview: (reviewId: string, bookingId?: string) => void; // Para navegar para detalhes da avaliação/agendamento
}

const RecentReviewItem: React.FC<RecentReviewItemProps> = ({ review, index, onPressReview }) => {
  const itemAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(1)).current; // Para feedback de toque

  useEffect(() => {
    Animated.timing(itemAnim, {
      toValue: 1,
      duration: 300,
      delay: index * 50,
      useNativeDriver: true,
    }).start();
  }, [itemAnim, index]);

  const handlePressIn = () => {
    Animated.spring(scaleAnim, { toValue: 0.98, useNativeDriver: true }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scaleAnim, { toValue: 1, friction: 3, tension: 40, useNativeDriver: true }).start();
  };

  // Determina o emoji baseado na avaliação
  const getRatingEmoji = (rating: number) => {
    if (rating >= 4) return '😊'; // Feliz
    if (rating >= 3) return '😐'; // Neutro
    return '😞'; // Triste
  };

  return (
    <Animated.View
      style={[
        styles.reviewCardWrapper,
        { opacity: itemAnim, transform: [{ translateY: itemAnim.interpolate({ inputRange: [0, 1], outputRange: [20, 0] }) }, { scale: scaleAnim }] },
      ]}
    >
      <TouchableOpacity
        onPress={() => onPressReview(review.id, review.bookingId)}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        activeOpacity={1} // Controlado pela animação
        style={styles.reviewCardTouchable}
      >
        <LinearGradient
          colors={['#F0F8FF', '#E6F0FF']} // Gradiente suave para o card
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.reviewCardGradient}
        >
          <BlurView intensity={Platform.OS === 'ios' ? 5 : 15} tint="light" style={StyleSheet.absoluteFillObject} />

          <View style={styles.reviewHeader}>
            <View style={styles.clientInfo}>
              {review.avatarUrl ? (
                <Image source={{ uri: review.avatarUrl }} style={styles.clientAvatar} />
              ) : (
                <View style={styles.clientAvatarPlaceholder}>
                  <Ionicons name="person-circle-outline" size={30} color="#868E96" />
                </View>
              )}
              <View>
                <Text style={styles.reviewClientName}>{review.clientName}</Text>
                <Text style={styles.reviewDate}>{formatDate(review.date)}</Text>
              </View>
            </View>
            <View style={styles.starRating}>
              {[...Array(5)].map((_, i) => (
                <Ionicons
                  key={i}
                  name={i < review.rating ? 'star' : 'star-outline'}
                  size={18}
                  color="#FCCA46"
                />
              ))}
              <Text style={styles.ratingEmoji}>{getRatingEmoji(review.rating)}</Text>
            </View>
          </View>
          <Text style={styles.reviewComment}>{review.comment || 'Nenhum comentário fornecido.'}</Text>
          <Text style={styles.reviewService}>Serviço: {review.serviceName}</Text>
          {review.bookingId && (
            <TouchableOpacity style={styles.viewBookingLink}>
              <Text style={styles.viewBookingText}>Ver Agendamento</Text>
              <Ionicons name="open-outline" size={14} color="#007AFF" />
            </TouchableOpacity>
          )}
        </LinearGradient>
      </TouchableOpacity>
    </Animated.View>
  );
};

interface RecentReviewsSectionProps {
  contentAnim: Animated.Value;
  recentReviews: ProviderReview[];
  onViewAllReviewsPress: () => void;
  // Adicionado: função para navegar para detalhes da avaliação/agendamento
  onPressReview: (reviewId: string, bookingId?: string) => void;
}

const RecentReviewsSection: React.FC<RecentReviewsSectionProps> = ({
  contentAnim,
  recentReviews,
  onViewAllReviewsPress,
  onPressReview,
}) => {
  const buttonScale = useRef(new Animated.Value(1)).current;

  const onPressIn = () => {
    Animated.spring(buttonScale, {
      toValue: 0.95,
      useNativeDriver: true,
    }).start();
  };

  const onPressOut = () => {
    Animated.spring(buttonScale, {
      toValue: 1,
      friction: 3,
      tension: 40,
      useNativeDriver: true,
    }).start();
  };

  return (
    <Animated.View
      style={[
        styles.sectionContainer,
        { opacity: contentAnim, transform: [{ translateY: contentAnim.interpolate({ inputRange: [0, 1], outputRange: [20, 0] }) }] },
      ]}
    >
      <Text style={styles.sectionTitle}>Últimas Avaliações</Text>
      {recentReviews.length > 0 ? (
        recentReviews.map((review, index) => (
          <RecentReviewItem key={review.id} review={review} index={index} onPressReview={onPressReview} />
        ))
      ) : (
        <View style={styles.emptyStateContainer}>
          <Ionicons name="chatbox-outline" size={60} color="#CED4DA" style={styles.emptyStateIcon} />
          <Text style={styles.emptyStateText}>Nenhuma avaliação recente para exibir.</Text>
          <Text style={styles.emptyStateSubText}>Quando novas avaliações chegarem, elas aparecerão aqui!</Text>
          <TouchableOpacity style={styles.emptyStateCta} onPress={() => {/* Implementar navegação para solicitar avaliação */}}>
            <Text style={styles.emptyStateCtaText}>Peça uma avaliação agora!</Text>
            <Ionicons name="happy-outline" size={18} color="#007AFF" />
          </TouchableOpacity>
        </View>
      )}
      <Animated.View style={{ transform: [{ scale: buttonScale }] }}>
        <TouchableOpacity
          style={styles.viewAllButton}
          onPress={onViewAllReviewsPress}
          onPressIn={onPressIn}
          onPressOut={onPressOut}
          activeOpacity={1}
        >
          <Text style={styles.viewAllButtonText}>Ver Todas as Avaliações</Text>
          <Ionicons name="arrow-forward-outline" size={18} color="#007AFF" />
        </TouchableOpacity>
      </Animated.View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  sectionContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 15,
    marginBottom: 20,
    ...Platform.select({
      ios: { shadowColor: 'rgba(0,0,0,0.08)', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.15, shadowRadius: 8 },
      android: { elevation: 6 },
    }),
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1C3A5F',
    marginBottom: 15,
  },
  emptyStateContainer: {
    alignItems: 'center',
    paddingVertical: 30,
    backgroundColor: '#F8F9FA',
    borderRadius: 10,
    marginHorizontal: 10,
    borderWidth: 1,
    borderColor: '#E9ECEF',
  },
  emptyStateIcon: {
    marginBottom: 10,
  },
  emptyStateText: {
    fontSize: 14,
    color: '#868E96',
    textAlign: 'center',
    fontWeight: '600',
    marginBottom: 5,
  },
  emptyStateSubText: {
    fontSize: 14,
    color: '#ADB5BD',
    textAlign: 'center',
    marginBottom: 15,
  },
  emptyStateCta: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EBF5FF',
    paddingVertical: 8,
    paddingHorizontal: 15,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#007AFF',
  },
  emptyStateCtaText: {
    color: '#007AFF',
    fontSize: 14,
    fontWeight: 'bold',
    marginRight: 5,
  },
  viewAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    marginTop: 10,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: '#E9ECEF',
  },
  viewAllButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#007AFF',
    marginRight: 5,
  },
  reviewCardWrapper: {
    marginBottom: 10,
    borderRadius: 8,
    overflow: 'hidden',
    ...Platform.select({
      ios: { shadowColor: 'rgba(0,0,0,0.05)', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 3 },
      android: { elevation: 2 },
    }),
  },
  reviewCardTouchable: {
    flex: 1,
  },
  reviewCardGradient: {
    padding: 12,
  },
  reviewHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  clientInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  clientAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    marginRight: 8,
    backgroundColor: '#CED4DA',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.5)',
  },
  clientAvatarPlaceholder: {
    width: 36,
    height: 36,
    borderRadius: 18,
    marginRight: 8,
    backgroundColor: '#E9ECEF',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.5)',
  },
  reviewClientName: {
    fontSize: 15,
    fontWeight: '600',
    color: '#212529',
  },
  reviewDate: {
    fontSize: 12,
    color: '#868E96',
  },
  starRating: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  ratingEmoji: {
    fontSize: 18,
    marginLeft: 5,
  },
  reviewComment: {
    fontSize: 14,
    color: '#495057',
    marginBottom: 5,
    lineHeight: 20,
  },
  reviewService: {
    fontSize: 12,
    color: '#868E96',
    fontStyle: 'italic',
  },
  viewBookingLink: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    justifyContent: 'flex-end',
  },
  viewBookingText: {
    fontSize: 13,
    color: '#007AFF',
    fontWeight: '600',
    marginRight: 5,
  },
});

export default RecentReviewsSection;