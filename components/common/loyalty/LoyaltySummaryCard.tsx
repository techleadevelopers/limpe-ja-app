// LimpeJaApp/components/loyalty/LoyaltySummaryCard.tsx
import React from 'react';
import { View, Text, StyleSheet, ProgressBarAndroid, Platform } from 'react-native';
import Card from '../../common/Card';
import { colors } from '../../common/theme/colors';
import { typography } from '../../common/theme/typography';

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

      {/* Seção de Pontos Atuais */}
      <View style={styles.currentPointsSection}>
        <Text style={styles.currentPointsText}>{currentPoints}</Text>
        <Text style={styles.pointsLabel}>Pontos Atuais</Text>
      </View>

      {/* Seção de Nível e Próximo Nível */}
      <View style={styles.tierProgressionContainer}>
        <View style={styles.tierBox}>
          {/* CORRIGIDO: typography.caption para typography.bodySmall */}
          <Text style={styles.tierBoxLabel}>Nível Atual</Text>
          {/* CORRIGIDO: typography.h4 para typography.subtitle */}
          <Text style={styles.currentTierText}>{currentTier}</Text>
        </View>
        <View style={styles.tierArrow}>
          <Text style={styles.tierArrowText}>→</Text>
        </View>
        <View style={styles.tierBox}>
          {/* CORRIGIDO: typography.caption para typography.bodySmall */}
          <Text style={styles.tierBoxLabel}>Próximo Nível</Text>
          {/* CORRIGIDO: typography.h4 para typography.subtitle */}
          <Text style={styles.nextTierText}>{nextTier}</Text>
        </View>
      </View>

      {/* Barra de Progresso */}
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
        <Text style={styles.progressText}>
          Faltam <Text style={styles.progressHighlight}>{nextTierPoints - currentPoints}</Text> pontos para o nível {nextTier}
        </Text>
      </View>

      {/* Pontos Ganhos no Mês */}
      <View style={styles.pointsEarnedMonthContainer}>
        <Text style={styles.pointsEarnedMonthLabel}>Pontos Ganhos este Mês:</Text>
        <Text style={styles.pointsEarnedMonthValue}>{pointsEarnedThisMonth}</Text>
      </View>
    </Card>
  );
};

const styles = StyleSheet.create({
  card: {
    alignItems: 'center',
    marginBottom: 15,
    paddingVertical: 20,
    borderRadius: 15,
  },
  sectionTitle: {
    ...typography.h3,
    marginBottom: 20,
    color: colors.textPrimary,
    fontWeight: 'bold',
  },
  currentPointsSection: {
    alignItems: 'center',
    marginBottom: 20,
  },
  currentPointsText: {
    ...typography.h1,
    fontSize: 60,
    fontWeight: 'bold',
    color: colors.primaryDark,
  },
  pointsLabel: {
    ...typography.subtitle,
    color: colors.textSecondary,
    marginTop: -10,
  },
  tierProgressionContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    marginBottom: 20,
  },
  tierBox: {
    backgroundColor: colors.backgroundLight,
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 15,
    alignItems: 'center',
    minWidth: 120,
  },
  tierBoxLabel: {
    ...typography.bodySmall, // Alterado de caption para bodySmall
    color: colors.textSecondary,
    marginBottom: 5,
  },
  currentTierText: {
    ...typography.subtitle, // Alterado de h4 para subtitle
    fontWeight: 'bold',
    color: colors.primary,
  },
  nextTierText: {
    ...typography.subtitle, // Alterado de h4 para subtitle
    fontWeight: 'bold',
    color: colors.primaryDark,
  },
  tierArrow: {
    marginHorizontal: 10,
  },
  tierArrowText: {
    fontSize: 30,
    color: colors.textLight,
  },
  progressBarContainer: {
    width: '90%',
    marginBottom: 15,
    alignItems: 'center',
  },
  progressBarIOSBackground: {
    height: 10,
    width: '100%',
    backgroundColor: colors.borderPrimaryLight,
    borderRadius: 5,
    overflow: 'hidden',
  },
  progressBarIOSFill: {
    height: '100%',
    backgroundColor: colors.primary,
    borderRadius: 5,
  },
  progressBarAndroid: {
    width: '100%',
    height: 10,
  },
  progressText: {
    ...typography.bodySmall,
    color: colors.textSecondary,
    marginTop: 8,
    textAlign: 'center',
  },
  progressHighlight: {
    fontWeight: 'bold',
    color: colors.primaryDark,
  },
  pointsEarnedMonthContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 10,
    paddingVertical: 10,
    paddingHorizontal: 20,
    backgroundColor: colors.backgroundLightest,
    borderRadius: 10,
  },
  pointsEarnedMonthLabel: {
    ...typography.body,
    color: colors.textPrimary,
    marginRight: 5,
  },
  pointsEarnedMonthValue: {
    ...typography.body,
    fontWeight: 'bold',
    color: colors.primaryDark,
  },
});

export default LoyaltySummaryCard;