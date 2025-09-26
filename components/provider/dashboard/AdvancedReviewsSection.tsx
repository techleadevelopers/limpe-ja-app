import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

// Tipagens do projeto
import { ProviderReview } from '../../../types/backend/providers';

interface DetailedRatingBreakdown {
  overall: number;
  punctuality: number;
  quality: number;
  communication: number;
  value: number;
  totalReviews: number;
  recentTrend: 'improving' | 'declining' | 'stable';
  satisfactionRate: number; // 0–100
  responseTime: number;     // minutos
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
    if (providerId) loadRatingBreakdown();
  }, [providerId]);

  const loadRatingBreakdown = async () => {
    setIsLoading(true);
    try {
      // TODO: integrar com API real
      const mock: DetailedRatingBreakdown = {
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
      setRatingBreakdown(mock);
    } catch (e) {
      console.error('Erro ao carregar breakdown de avaliações:', e);
    } finally {
      setIsLoading(false);
    }
  };

  const getTrend = (trend: DetailedRatingBreakdown['recentTrend']) => {
    switch (trend) {
      case 'improving': return { icon: 'trending-up' as keyof typeof Ionicons.glyphMap, color: '#28a745', text: 'Melhorando' };
      case 'declining': return { icon: 'trending-down' as keyof typeof Ionicons.glyphMap, color: '#dc3545', text: 'Declinando' };
      default:          return { icon: 'remove' as keyof typeof Ionicons.glyphMap,      color: '#6c757d', text: 'Estável' };
    }
  };

  const renderRatingBar = (label: string, rating: number, max = 5) => {
    const pct = Math.min(100, Math.max(0, (rating / max) * 100));
    return (
      <View style={styles.ratingRow}>
        <Text style={styles.ratingLabel} numberOfLines={1}>{label}</Text>
        <View style={styles.ratingBarBg}>
          <LinearGradient
            colors={['#007AFF', '#4A90E2']}
            style={[styles.ratingBarFill, { width: `${pct}%` }]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
          />
        </View>
        <Text style={styles.ratingValue}>{rating.toFixed(1)}</Text>
      </View>
    );
  };

  if (isLoading) {
    return (
      <View style={styles.container}>
        <View style={styles.loadingBox}>
          <ActivityIndicator size="small" color="#007AFF" />
          <Text style={styles.loadingText}>Carregando insights…</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>
          <Ionicons name="analytics-outline" size={18} color="#007AFF" />{' '}
          Análise de Avaliações
        </Text>
        <TouchableOpacity onPress={onViewAllReviews} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
          <Text style={styles.link}>Ver Detalhes</Text>
        </TouchableOpacity>
      </View>

      {!!ratingBreakdown && (
        <View style={styles.metricsWrap}>
          {/* Dois “pilares” principais — tamanhos iguais */}
          <View style={styles.mainRow}>
            <View style={styles.pillar}>
              <Text style={styles.pillarValue}>{ratingBreakdown.overall.toFixed(1)}</Text>
              <Text style={styles.pillarLabel}>Avaliação Geral</Text>
              <View style={styles.trendRow}>
                <Ionicons
                  name={getTrend(ratingBreakdown.recentTrend).icon} // Removed as any
                  size={14}
                  color={getTrend(ratingBreakdown.recentTrend).color}
                />
                <Text style={[styles.trendText, { color: getTrend(ratingBreakdown.recentTrend).color }]}>
                  {getTrend(ratingBreakdown.recentTrend).text}
                </Text>
              </View>
            </View>

            <View style={styles.pillar}>
              <Text style={styles.pillarValue}>{ratingBreakdown.satisfactionRate.toFixed(1)}%</Text>
              <Text style={styles.pillarLabel}>Taxa de Satisfação</Text>
              <Text style={styles.pillarSub}>{ratingBreakdown.totalReviews} avaliações</Text>
            </View>
          </View>

          {/* Breakdown */}
          <View style={styles.breakdownBox}>
            <Text style={styles.breakdownTitle}>Detalhamento por Categoria</Text>
            {renderRatingBar('Pontualidade',   ratingBreakdown.punctuality)}
            {renderRatingBar('Qualidade',      ratingBreakdown.quality)}
            {renderRatingBar('Comunicação',    ratingBreakdown.communication)}
            {renderRatingBar('Custo-Benefício', ratingBreakdown.value)}
          </View>

          {/* Tempo de resposta */}
          <View style={styles.responseBox}>
            <Ionicons name="time-outline" size={16} color="#007AFF" />
            <Text style={styles.responseText}>
              Tempo médio de resposta: {ratingBreakdown.responseTime} min
            </Text>
          </View>
        </View>
      )}

      {/* Recentes */}
      {!!reviews?.length && (
        <View style={styles.recentBox}>
          <Text style={styles.recentTitle}>Avaliações Recentes</Text>
          {reviews.slice(0, 2).map((review) => (
            <View key={review.id} style={styles.reviewCard}>
              <View style={styles.reviewHead}>
                <View style={styles.stars}>
                  {Array.from({ length: Math.round(review.rating ?? 0) }).map((_, i) => (
                    <Ionicons key={i} name="star" size={14} color="#FFB946" />
                  ))}
                </View>
                <Text style={styles.clientName}>
                  {review.client?.fullName || 'Cliente'}
                </Text>
              </View>
              <Text style={styles.reviewText} numberOfLines={2}>
                “{review.comment || 'Excelente serviço!'}”
              </Text>
            </View>
          ))}
        </View>
      )}
    </View>
  );
};

const CARD_BG = '#FFFFFF';
const SOFT_BG = '#F6F8FD';
const BORDER = '#E6ECF4';
const TEXT_DARK = '#1A2538';
const TEXT_MUTED = '#7A8599';

const styles = StyleSheet.create({
  container: {
    marginBottom: 20,
    backgroundColor: CARD_BG,
    borderRadius: 14,
    padding: 16,
    ...Platform.select({
      ios:    { shadowColor: '#000', shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.08, shadowRadius: 6 },
      android:{ elevation: 4 },
    }),
  },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  title: {
    fontSize: 16,
    fontWeight: '700',
    color: TEXT_DARK,
  },
  link: {
    fontSize: 13,
    fontWeight: '700',
    color: '#007AFF',
  },

  // Métricas principais (pilares)
  metricsWrap: { marginTop: 4 },
  mainRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  pillar: {
    flex: 1,
    height: 168, // altura uniforme (como no mock)
    backgroundColor: SOFT_BG,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 10,
  },
  pillarValue: {
    fontSize: 28,      // maior pra dar destaque
    lineHeight: 34,
    fontWeight: '800',
    color: TEXT_DARK,
  },
  pillarLabel: {
    marginTop: 6,
    fontSize: 12,
    color: '#4A5568',
    textAlign: 'center',
  },
  pillarSub: {
    marginTop: 6,
    fontSize: 12,
    color: TEXT_MUTED,
  },
  trendRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
  },
  trendText: {
    marginLeft: 4,
    fontSize: 12,
    fontWeight: '700',
  },

  // Breakdown
  breakdownBox: {
    backgroundColor: CARD_BG,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: BORDER,
    padding: 12,
    marginBottom: 12,
  },
  breakdownTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: TEXT_DARK,
    marginBottom: 10,
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    minHeight: 18,
  },
  ratingLabel: {
    width: 110,            // largura fixa p/ alinhamento
    fontSize: 12,
    color: '#4A5568',
  },
  ratingBarBg: {
    flex: 1,
    height: 8,             // altura uniforme
    backgroundColor: '#E8EDF6',
    borderRadius: 999,
    overflow: 'hidden',
    marginHorizontal: 10,
  },
  ratingBarFill: {
    height: '100%',
    borderRadius: 999,
  },
  ratingValue: {
    width: 36,             // largura fixa p/ colunar
    textAlign: 'right',
    fontSize: 12,
    fontWeight: '700',
    color: TEXT_DARK,
  },

  // Tempo de resposta
  responseBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EBF5FF',
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 12,
  },
  responseText: {
    marginLeft: 8,
    fontSize: 13,
    color: '#007AFF',
    fontWeight: '600',
  },

  // Recentes
  recentBox: {
    borderTopWidth: 1,
    borderTopColor: BORDER,
    paddingTop: 14,
    marginTop: 6,
  },
  recentTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: TEXT_DARK,
    marginBottom: 10,
  },
  reviewCard: {
    backgroundColor: SOFT_BG,
    borderRadius: 10,
    padding: 12,
    marginBottom: 8,
  },
  reviewHead: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  stars: { flexDirection: 'row' },
  clientName: {
    fontSize: 12,
    color: '#4A5568',
    fontWeight: '600',
  },
  reviewText: {
    fontSize: 13,
    color: TEXT_DARK,
    fontStyle: 'italic',
    lineHeight: 18,
  },

  // Loading
  loadingBox: {
    paddingVertical: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: { marginLeft: 10, color: '#4A5568' },
});

export default AdvancedReviewsSection;