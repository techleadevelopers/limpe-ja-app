// app/(common)/loyalty.tsx
import React from 'react';
import { View, Text, StyleSheet, ScrollView, ProgressBarAndroid, Platform } from 'react-native';
import ScreenContainer from '../../components/common/ScreenContainer';
import Header from '../../components/common/Header';
import Card from '../../components/common/Card';
import PrimaryButton from '../../components/common/PrimaryButton';
import { colors } from '../../components/common/theme/colors';
import { typography } from '../../components/common/theme/typography';
import Icon from 'react-native-vector-icons/MaterialIcons';
import LinearGradient from 'react-native-linear-gradient';

// Mock de dados
const mockLoyaltyData = {
  currentPoints: 750,
  nextTierPoints: 1000,
  currentTier: 'Bronze',
  nextTier: 'Prata',
  pointsEarnedThisMonth: 150,
  rewardsAvailable: [
    { id: '1', name: '10% de Desconto no Próximo Serviço', points: 500, description: 'Economize no seu próximo agendamento.' },
    { id: '2', name: 'Limpeza de Brinde (até 2h)', points: 1500, description: 'Uma limpeza básica gratuita para você.' },
  ],
  howToEarn: [
    'A cada R$1 gasto em serviços, você ganha 1 ponto.',
    'Indique um amigo e ganhe 50 pontos quando ele completar o primeiro serviço.',
    'Complete pesquisas de satisfação e ganhe 10 pontos.',
  ],
};

const LoyaltyScreen: React.FC = () => {
  const { currentPoints, nextTierPoints, currentTier, nextTier, pointsEarnedThisMonth, rewardsAvailable, howToEarn } = mockLoyaltyData;

  const progress = currentPoints / nextTierPoints;

  return (
    <ScreenContainer>
      <Header title="Programa de Fidelidade" showBackButton={true} />

      <Card style={styles.loyaltySummaryCard}>
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

      <Card style={styles.rewardsCard}>
        <Text style={styles.sectionTitle}>Recompensas Disponíveis</Text>
        {rewardsAvailable.length > 0 ? (
          rewardsAvailable.map((reward) => (
            <View key={reward.id} style={styles.rewardItem}>
              <View style={styles.rewardDetails}>
                <Text style={styles.rewardName}>{reward.name}</Text>
                <Text style={styles.rewardDescription}>{reward.description}</Text>
              </View>
              <View style={styles.rewardPointsContainer}>
                <Text style={styles.rewardPoints}>{reward.points}</Text>
                <Text style={styles.rewardPointsLabel}>pts</Text>
              </View>
              <PrimaryButton
                title="Resgatar"
                onPress={() => console.log('Resgatar', reward.name)}
                style={styles.redeemButton}
                disabled={currentPoints < reward.points}
              />
            </View>
          ))
        ) : (
          <Text style={styles.noRewardsText}>Nenhuma recompensa disponível no momento.</Text>
        )}
      </Card>

      <Card style={styles.howToEarnCard}>
        <Text style={styles.sectionTitle}>Como Ganhar Pontos</Text>
        {howToEarn.map((rule, index) => (
          <View key={index} style={styles.howToEarnItem}>
            <Icon name="star" size={20} color={colors.primary} style={styles.howToEarnIcon} />
            <Text style={styles.howToEarnText}>{rule}</Text>
          </View>
        ))}
      </Card>
    </ScreenContainer>
  );
};

const styles = StyleSheet.create({
  loyaltySummaryCard: {
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
  rewardsCard: {
    marginBottom: 15,
  },
  rewardItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
    marginBottom: 5,
  },
  rewardDetails: {
    flex: 3,
    marginRight: 10,
  },
  rewardName: {
    ...typography.subtitle,
    color: colors.textPrimary,
  },
  rewardDescription: {
    ...typography.bodySmall,
    color: colors.textSecondary,
  },
  rewardPointsContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.backgroundLightest,
    borderRadius: 8,
    paddingVertical: 5,
    marginRight: 10,
  },
  rewardPoints: {
    ...typography.h3,
    fontWeight: 'bold',
    color: colors.primaryDark,
  },
  rewardPointsLabel: {
    ...typography.bodySmall,
    color: colors.textSecondary,
  },
  redeemButton: {
    flex: 2,
    borderRadius: 20, // Botão menor e mais arredondado
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  noRewardsText: {
    ...typography.body,
    color: colors.textSecondary,
    textAlign: 'center',
    marginTop: 10,
  },
  howToEarnCard: {},
  howToEarnItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 10,
  },
  howToEarnIcon: {
    marginRight: 10,
    marginTop: 2,
  },
  howToEarnText: {
    ...typography.bodySmall,
    flex: 1,
    color: colors.textSecondary,
    lineHeight: 20,
  },
});

export default LoyaltyScreen;