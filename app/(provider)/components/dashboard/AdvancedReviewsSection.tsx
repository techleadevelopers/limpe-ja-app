
import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

interface DetailedRatingBreakdown {
  overall: number;
  punctuality: number;
  quality: number;
  communication: number;
  value: number;
  totalReviews: number;
  recentTrend: 'improving' | 'declining' | 'stable';
  satisfactionRate: number;
  responseTime: number;
}

interface ProviderReview {
  id: string;
  rating: number;
  comment?: string;
  client?: { fullName: string };
  createdAt: string;
}

interface AdvancedReviewsSectionProps {
  reviews?: ProviderReview[];
  providerId?: string;
  onViewAllReviews: () => void;
}

const AdvancedReviewsSection: React.FC<AdvancedReviewsSectionProps> = ({
  reviews,
  providerId,
  onViewAllReviews,
}) => {
  const [ratingBreakdown, setRatingBreakdown] = useState<DetailedRatingBreakdown | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (providerId) {
      loadRatingBreakdown();
    }
  }, [providerId]);

  const loadRatingBreakdown = async () => {
    setIsLoading(true);
    try {
      // Aqui você faria a chamada para o endpoint de breakdown detalhado
      // const breakdown = await getDetailedRatingBreakdown(providerId);
      
      // Mock por enquanto
      const mockBreakdown: DetailedRatingBreakdown = {
        overall: 4.7,
        punctuality: 4.8,
        quality: 4.6,
        communication: 4.9,
        value: 4.5,
        totalReviews: 47,
        recentTrend: 'improving',
        satisfactionRate: 89.4,
        responseTime: 12,
      };
      
      setRatingBreakdown(mockBreakdown);
    } catch (error) {
      console.error('Erro ao carregar breakdown de avaliações:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'improving': return { name: 'trending-up', color: '#28a745' };
      case 'declining': return { name: 'trending-down', color: '#dc3545' };
      default: return { name: 'remove', color: '#6c757d' };
    }
  };

  const renderRatingBar = (label: string, rating: number, maxRating: number = 5) => {
    const percentage = (rating / maxRating) * 100;
    return (
      <View style={styles.ratingBarContainer}>
        <Text style={styles.ratingBarLabel}>{label}</Text>
        <View style={styles.ratingBarBackground}>
          <LinearGradient
            colors={['#007AFF', '#4A90E2']}
            style={[styles.ratingBarFill, { width: `${percentage}%` }]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
          />
        </View>
        <Text style={styles.ratingBarValue}>{rating.toFixed(1)}</Text>
      </View>
    );
  };

  if (isLoading) {
    return (
      <View style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="small" color="#007AFF" />
          <Text style={styles.loadingText}>Carregando insights...</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>
          <Ionicons name="analytics-outline" size={20} color="#007AFF" /> Análise de Avaliações
        </Text>
        <TouchableOpacity onPress={onViewAllReviews}>
          <Text style={styles.viewAllText}>Ver Detalhes</Text>
        </TouchableOpacity>
      </View>

      {ratingBreakdown && (
        <View style={styles.metricsContainer}>
          {/* Métricas principais */}
          <View style={styles.mainMetricsRow}>
            <View style={styles.mainMetricCard}>
              <Text style={styles.mainMetricValue}>{ratingBreakdown.overall}</Text>
              <Text style={styles.mainMetricLabel}>Avaliação Geral</Text>
              <View style={styles.trendContainer}>
                <Ionicons 
                  name={getTrendIcon(ratingBreakdown.recentTrend).name as any} 
                  size={16} 
                  color={getTrendIcon(ratingBreakdown.recentTrend).color} 
                />
                <Text style={[styles.trendText, { color: getTrendIcon(ratingBreakdown.recentTrend).color }]}>
                  {ratingBreakdown.recentTrend === 'improving' ? 'Melhorando' : 
                   ratingBreakdown.recentTrend === 'declining' ? 'Declinando' : 'Estável'}
                </Text>
              </View>
            </View>

            <View style={styles.mainMetricCard}>
              <Text style={styles.mainMetricValue}>{ratingBreakdown.satisfactionRate}%</Text>
              <Text style={styles.mainMetricLabel}>Taxa de Satisfação</Text>
              <Text style={styles.subMetricText}>{ratingBreakdown.totalReviews} avaliações</Text>
            </View>
          </View>

          {/* Breakdown detalhado */}
          <View style={styles.breakdownContainer}>
            <Text style={styles.breakdownTitle}>Detalhamento por Categoria</Text>
            {renderRatingBar('Pontualidade', ratingBreakdown.punctuality)}
            {renderRatingBar('Qualidade', ratingBreakdown.quality)}
            {renderRatingBar('Comunicação', ratingBreakdown.communication)}
            {renderRatingBar('Custo-Benefício', ratingBreakdown.value)}
          </View>

          {/* Tempo de resposta */}
          <View style={styles.responseTimeContainer}>
            <Ionicons name="time-outline" size={16} color="#007AFF" />
            <Text style={styles.responseTimeText}>
              Tempo médio de resposta: {ratingBreakdown.responseTime} min
            </Text>
          </View>
        </View>
      )}

      {/* Reviews recentes */}
      {reviews && reviews.length > 0 && (
        <View style={styles.recentReviewsContainer}>
          <Text style={styles.recentReviewsTitle}>Avaliações Recentes</Text>
          {reviews.slice(0, 2).map((review) => (
            <View key={review.id} style={styles.reviewItem}>
              <View style={styles.reviewHeader}>
                <View style={styles.starsContainer}>
                  {Array.from({ length: review.rating }).map((_, i) => (
                    <Ionicons key={i} name="star" size={14} color="#FFB946" />
                  ))}
                </View>
                <Text style={styles.reviewClientName}>
                  {review.client?.fullName || 'Cliente'}
                </Text>
              </View>
              <Text style={styles.reviewComment} numberOfLines={2}>
                "{review.comment || 'Excelente serviço!'}"
              </Text>
            </View>
          ))}
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 25,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.08,
    shadowRadius: 5,
    elevation: 4,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1A2538',
  },
  viewAllText: {
    fontSize: 14,
    color: '#007AFF',
    fontWeight: '600',
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 20,
  },
  loadingText: {
    marginLeft: 10,
    color: '#4A5568',
  },
  metricsContainer: {
    marginBottom: 20,
  },
  mainMetricsRow: {
    flexDirection: 'row',
    marginBottom: 20,
    gap: 12,
  },
  mainMetricCard: {
    flex: 1,
    backgroundColor: '#F8F9FD',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  mainMetricValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1A2538',
  },
  mainMetricLabel: {
    fontSize: 12,
    color: '#4A5568',
    marginTop: 4,
  },
  trendContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
  },
  trendText: {
    fontSize: 12,
    fontWeight: '600',
    marginLeft: 4,
  },
  subMetricText: {
    fontSize: 12,
    color: '#7A8599',
    marginTop: 4,
  },
  breakdownContainer: {
    marginBottom: 16,
  },
  breakdownTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1A2538',
    marginBottom: 12,
  },
  ratingBarContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  ratingBarLabel: {
    fontSize: 12,
    color: '#4A5568',
    width: 80,
  },
  ratingBarBackground: {
    flex: 1,
    height: 6,
    backgroundColor: '#E2E8F0',
    borderRadius: 3,
    marginHorizontal: 8,
    overflow: 'hidden',
  },
  ratingBarFill: {
    height: '100%',
    borderRadius: 3,
  },
  ratingBarValue: {
    fontSize: 12,
    fontWeight: '600',
    color: '#1A2538',
    width: 30,
    textAlign: 'right',
  },
  responseTimeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EBF5FF',
    padding: 12,
    borderRadius: 8,
  },
  responseTimeText: {
    fontSize: 13,
    color: '#007AFF',
    marginLeft: 8,
    fontWeight: '500',
  },
  recentReviewsContainer: {
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
    paddingTop: 15,
  },
  recentReviewsTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1A2538',
    marginBottom: 12,
  },
  reviewItem: {
    backgroundColor: '#F8F9FD',
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
  },
  reviewHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  starsContainer: {
    flexDirection: 'row',
  },
  reviewClientName: {
    fontSize: 12,
    color: '#4A5568',
    fontWeight: '500',
  },
  reviewComment: {
    fontSize: 13,
    color: '#1A2538',
    fontStyle: 'italic',
    lineHeight: 18,
  },
});

export default AdvancedReviewsSection;
