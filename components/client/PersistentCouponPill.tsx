// LimpeJaApp/components/client/PersistentCouponPill.tsx
import React, { useRef, useEffect } from 'react';
import { Animated, StyleSheet, TouchableOpacity, Easing } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';

import { AppColors, AppDurations, AppOffsets } from '../../constants/appStyles';

interface PersistentCouponPillProps {
  onPress: () => void;
}

const PersistentCouponPill: React.FC<PersistentCouponPillProps> = ({ onPress }) => {
  const { t } = useTranslation();
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideUpAnim = useRef(new Animated.Value(AppOffsets.translateY)).current;
  const scaleAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: AppDurations.md,
        easing: Easing.out(Easing.ease),
        useNativeDriver: true,
      }),
      Animated.timing(slideUpAnim, {
        toValue: 0,
        duration: AppDurations.md,
        easing: Easing.out(Easing.ease),
        useNativeDriver: true,
      }),
    ]).start();
  }, [fadeAnim, slideUpAnim]);

  const onPressIn = () => {
    Animated.spring(scaleAnim, { toValue: AppOffsets.scalePress, useNativeDriver: true }).start();
  };

  const onPressOut = () => {
    Animated.spring(scaleAnim, { toValue: 1, friction: 3, tension: 40, useNativeDriver: true }).start();
  };

  return (
    <Animated.View style={[styles.pillContainer, { opacity: fadeAnim, transform: [{ translateY: slideUpAnim }, { scale: scaleAnim }] }]}>
      <TouchableOpacity
        onPress={onPress}
        onPressIn={onPressIn}
        onPressOut={onPressOut}
        style={styles.pillButton}
        accessibilityLabel={t('offers.reopen_coupon_card')}
      >
        <Ionicons name="gift-outline" size={24} color={AppColors.white} />
      </TouchableOpacity>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  pillContainer: {
    position: 'absolute',
    bottom: 100, // Ajuste a posição conforme necessário para não sobrepor a NavBar
    right: 20,
  },
  pillButton: {
    backgroundColor: AppColors.primaryInteractive,
    borderRadius: 30,
    width: 60,
    height: 60,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default PersistentCouponPill;
