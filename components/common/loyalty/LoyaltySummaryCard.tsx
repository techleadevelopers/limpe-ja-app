// LimpeJaApp/components/loyalty/LoyaltySummaryCard.tsx
import React from 'react';
import { View, Text, StyleSheet, ProgressBarAndroid, Platform } from 'react-native';
import Card from '../../common/Card'; // Importa o Card existente
import { colors } from '../../common/theme/colors'; // Importa as cores existentes
import { typography } from '../../common/theme/typography'; // Importa a tipografia existente

interface LoyaltySummaryCardProps {
  currentPoints: number;
  nextTierPoints: number;
  currentTier: string;
  nextTier: string;
  pointsEarnedThisMonth: number;
}

const LoyaltySummaryCard: React.FC<LoyaltySummaryCardProps> = ({
  currentPoints,
  nextTierPoints,
  currentTier,
  nextTier,
  pointsEarnedThisMonth,
}) => {
  const progress = currentPoints / nextTierPoints;

  return (
    <Card style={styles.card}>
      <Text style={styles.sectionTitle}>Seu Status de Fidelidade</Text>
      <View style={styles.pointsContainer}>
        <Text style={styles.currentPointsText}>{currentPoints}</Text>
        <Text style={styles.pointsLabel}>Pontos</Text>
      </View>

      <View style={styles.tierInfo}>
        <Text style={styles.tierLabel}>Nível Atual: <Text style={styles.currentTierText}>{currentTier}</Text></Text>
        <Text style={styles.tierLabel}>Próximo Nível: <Text style={styles.nextTierText}>{nextTier}</Text></Text>
      </View>

      <View style={styles.progressBarContainer}>
        {Platform.OS === 'ios' ? (
          <View style={styles.progressBarIOSBackground}>
            <View style={[styles.progressBarIOSFill, { width: `${progress * 100}%` }]} />
          </View>
        ) : (
          <ProgressBarAndroid
            styleAttr="Horizontal"
            indeterminate={false}
            progress={progress}
            color={colors.primary}
            style={styles.progressBarAndroid}
          />
        )}
        <Text style={styles.progressText}>{currentPoints}/{nextTierPoints} pontos para o nível {nextTier}</Text>
      </View>
      <Text style={styles.pointsEarnedMonth}>Pontos Ganhos este Mês: {pointsEarnedThisMonth}</Text>
    </Card>
  );
};

const styles = StyleSheet.create({
  card: {
    alignItems: 'center',
    marginBottom: 15,
  },
  sectionTitle: {
    ...typography.h3,
    marginBottom: 10,
    color: colors.textPrimary,
  },
  pointsContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginBottom: 10,
  },
  currentPointsText: {
    ...typography.h1,
    fontSize: 48,
    fontWeight: 'bold',
    color: colors.primaryDark,
  },
  pointsLabel: {
    ...typography.subtitle,
    color: colors.textSecondary,
    marginLeft: 5,
  },
  tierInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    paddingHorizontal: 20,
    marginBottom: 15,
  },
  tierLabel: {
    ...typography.body,
    color: colors.textPrimary,
  },
  currentTierText: {
    fontWeight: 'bold',
    color: colors.primary,
  },
  nextTierText: {
    fontWeight: 'bold',
    color: colors.primaryDark,
  },
  progressBarContainer: {
    width: '100%',
    marginBottom: 10,
    alignItems: 'center',
  },
  progressBarIOSBackground: {
    height: 8,
    width: '90%',
    backgroundColor: colors.borderPrimaryLight,
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressBarIOSFill: {
    height: '100%',
    backgroundColor: colors.primary,
    borderRadius: 4,
  },
  progressBarAndroid: {
    width: '90%',
    height: 8,
  },
  progressText: {
    ...typography.bodySmall,
    color: colors.textSecondary,
    marginTop: 5,
  },
  pointsEarnedMonth: {
    ...typography.bodySmall,
    color: colors.textPrimary,
    marginTop: 10,
    fontWeight: '600',
  },
});

export default LoyaltySummaryCard;