import React, { useRef, useEffect } from 'react';
import { TouchableOpacity, Text, StyleSheet, View, ColorValue, Animated, Easing } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { AppColors, AppShadows } from '../../../../constants/appStyles'; // Importe AppColors e AppShadows

interface TimeSlotButtonProps {
  time: string;
  isSelected: boolean;
  onPress: (time: string) => void;
  isAvailable?: boolean;
  itemWidth?: number;
}

const AVAILABLE_GRADIENT_COLORS: readonly [ColorValue, ColorValue] = [AppColors.primaryInteractive + '40', AppColors.primaryInteractive + '20'] as const; // Usando AppColors

const TimeSlotButton: React.FC<TimeSlotButtonProps> = ({
  time,
  isSelected,
  onPress,
  isAvailable = true,
  itemWidth,
}) => {
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (isAvailable && !isSelected) {
      const loop = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, { toValue: 1.03, duration: 1200, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
          Animated.timing(pulseAnim, { toValue: 1, duration: 1200, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
        ])
      );
      loop.start();
      return () => loop.stop();
    } else {
      pulseAnim.stopAnimation();
      pulseAnim.setValue(1);
    }
  }, [isAvailable, isSelected, pulseAnim]);

  const buttonStyle = [styles.buttonBase, itemWidth ? { width: itemWidth } : null];
  const showGradient = isAvailable && !isSelected;

  return (
    <TouchableOpacity
      onPress={() => isAvailable && onPress(time)}
      disabled={!isAvailable}
      style={
        !isAvailable ? [buttonStyle, styles.unavailable] :
        isSelected  ? [buttonStyle, styles.selected] :
                      [buttonStyle, { transform: [{ scale: pulseAnim }] }]}
      activeOpacity={0.9}
    >
      {showGradient && (
        <LinearGradient
          colors={AVAILABLE_GRADIENT_COLORS}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.gradientFill}
        />
      )}
      <Text
        style={[
          styles.text,
          isSelected && styles.textSelected,
          !isAvailable && styles.textUnavailable,
          showGradient && styles.textOnGradient,
        ]}
      >
        {time}
      </Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  buttonBase: {
    minWidth: 76,              // ↓ um pouco menor
    paddingVertical: 7,        // ↓
    paddingHorizontal: 10,
    borderRadius: 12,          // ↓ canto mais compacto
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
    overflow: 'hidden',
    backgroundColor: AppColors.backgroundLight, // Usando AppColors
    ...AppShadows.small, // Usando AppShadows
  },
  gradientFill: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 12,
  },
  selected: {
    backgroundColor: AppColors.primaryInteractive, // Usando AppColors
    ...AppShadows.medium, // Usando AppShadows
  },
  unavailable: { backgroundColor: AppColors.backgroundNeutral, opacity: 0.55, elevation: 0 }, // Usando AppColors
  text: { fontSize: 12, color: AppColors.textBody, fontWeight: '600' },       // ↓ fonte levemente menor // Usando AppColors
  textSelected: { color: AppColors.white, fontWeight: '700' }, // Usando AppColors
  textUnavailable: { color: AppColors.mediumGray }, // Usando AppColors
  textOnGradient: { color: AppColors.primaryDark, fontWeight: '700' }, // Usando AppColors
});

export default TimeSlotButton;