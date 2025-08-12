// LimpeJaApp/components/loyalty/RewardItem.tsx
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import PrimaryButton from '../../common/PrimaryButton'; // Importa o PrimaryButton existente
import { colors } from '../../common/theme/colors'; // Importa as cores existentes
import { typography } from '../../common/theme/typography'; // Importa a tipografia existente

interface Reward {
  id: string;
  name: string;
  points: number;
  description: string;
}

interface RewardItemProps {
  reward: Reward;
  currentPoints: number;
  onRedeem: (rewardId: string) => void; // Callback para quando o botão de resgate for pressionado
}

const RewardItem: React.FC<RewardItemProps> = ({ reward, currentPoints, onRedeem }) => {
  const canRedeem = currentPoints >= reward.points;

  return (
    <View style={styles.rewardItem}>
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
        onPress={() => onRedeem(reward.id)}
        style={styles.redeemButton}
        disabled={!canRedeem}
      />
    </View>
  );
};

const styles = StyleSheet.create({
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
});

export default RewardItem;