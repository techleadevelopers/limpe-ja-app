// LimpeJaApp/components/loyalty/RewardItem.tsx
import React, { useEffect, useRef } from 'react';
import { Animated, Easing, Platform, StyleSheet, Text, View } from 'react-native';
import PrimaryButton from '../../common/PrimaryButton';
import { colors } from '../../common/theme/colors';
import { typography } from '../../common/theme/typography';

interface Reward {
  id: string;
  name: string;
  points: number;
  description: string;
}

interface RewardItemProps {
  reward: Reward;
  currentPoints: number;
  onRedeem: (rewardId: string) => void;
  delay?: number;
}

const RewardItem: React.FC<RewardItemProps> = ({ reward, currentPoints, onRedeem, delay = 0 }) => {
  const canRedeem = currentPoints >= reward.points;

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const translateYAnim = useRef(new Animated.Value(20)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 500,
        delay: delay,
        easing: Easing.out(Easing.ease),
        useNativeDriver: true,
      }),
      Animated.timing(translateYAnim, {
        toValue: 0,
        duration: 500,
        delay: delay,
        easing: Easing.out(Easing.ease),
        useNativeDriver: true,
      }),
    ]).start();
  }, [fadeAnim, translateYAnim, delay]);

  return (
    <Animated.View
      style={[
        styles.rewardItemContainer,
        { opacity: fadeAnim, transform: [{ translateY: translateYAnim }] },
      ]}
    >
      <View style={styles.rewardDetails}>
        {/* CORRIGIDO: typography.h4 para typography.subtitle */}
        <Text style={styles.rewardName} numberOfLines={1} ellipsizeMode="tail">{reward.name}</Text>
        <Text style={styles.rewardDescription} numberOfLines={2} ellipsizeMode="tail">{reward.description}</Text>
      </View>

      <View style={styles.pointsAndButton}>
        <View style={styles.rewardPointsContainer}>
          <Text style={styles.rewardPoints}>{reward.points}</Text>
          <Text style={styles.rewardPointsLabel}>pts</Text>
        </View>
        <PrimaryButton
          title={canRedeem ? 'Resgatar' : `${reward.points - currentPoints} pts`}
          onPress={() => onRedeem(reward.id)}
          style={styles.redeemButton}
          disabled={!canRedeem}
        />
      </View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  rewardItemContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.cardBackground,
    borderRadius: 12,
    padding: 15,
    marginBottom: 10,
    ...Platform.select({
      ios: {
        shadowColor: colors.primaryLight,
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.1,
        shadowRadius: 6,
      },
      android: {
        elevation: 0,
      },
    }),
  },
  rewardDetails: {
    flex: 2.5,
    marginRight: 10,
    justifyContent: 'center',
  },
  rewardName: {
    ...typography.subtitle, // Alterado de h4 para subtitle
    color: colors.textPrimary,
    marginBottom: 4,
  },
  rewardDescription: {
    ...typography.bodySmall,
    color: colors.textSecondary,
  },
  pointsAndButton: {
    flex: 1.5,
    flexDirection: 'column',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
  },
  rewardPointsContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    marginBottom: 8,
  },
  rewardPoints: {
    ...typography.h3,
    fontWeight: 'bold',
    color: colors.primaryDark,
    marginRight: 2,
  },
  rewardPointsLabel: {
    ...typography.bodySmall,
    color: colors.textSecondary,
  },
  redeemButton: {
    width: '100%',
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderRadius: 20,
  },
});

export default RewardItem;