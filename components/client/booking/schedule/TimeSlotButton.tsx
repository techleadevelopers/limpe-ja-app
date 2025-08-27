import React, { useRef, useEffect } from 'react';
import { TouchableOpacity, Text, StyleSheet, View, ColorValue, Animated, Easing } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

interface TimeSlotButtonProps {
  time: string;
  isSelected: boolean;
  onPress: (time: string) => void;
  isAvailable?: boolean;
  itemWidth?: number;
}

const AVAILABLE_GRADIENT_COLORS: readonly [ColorValue, ColorValue] = ['#BFE7FF', '#97CEFF'] as const;

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
    backgroundColor: '#F3F7FD',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 3,
  },
  gradientFill: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 12,
  },
  selected: {
    backgroundColor: '#2A72E7',
    shadowColor: '#2A72E7',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.22,
    shadowRadius: 10,
    elevation: 8,
  },
  unavailable: { backgroundColor: '#EDEFF2', opacity: 0.55, elevation: 0 },
  text: { fontSize: 12, color: '#344255', fontWeight: '600' },       // ↓ fonte levemente menor
  textSelected: { color: '#fff', fontWeight: '700' },
  textUnavailable: { color: '#9AA7B6' },
  textOnGradient: { color: '#174B93', fontWeight: '700' },
});

export default TimeSlotButton;
