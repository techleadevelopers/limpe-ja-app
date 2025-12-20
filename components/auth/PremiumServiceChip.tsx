// PremiumServiceChip.tsx
import React, { useRef, useEffect } from 'react';
import { TouchableOpacity, View, Text, StyleSheet, Animated, Platform, Easing } from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';

type ChipProps = {
  id: string;
  label: string;
  selected: boolean;
  onPress: () => void;
  iconSet?: 'ion' | 'mci';
  iconName: string;
  disabled?: boolean;
  style?: any;
};

export const PremiumServiceChip: React.FC<ChipProps> = ({
  id,
  label,
  selected,
  onPress,
  iconSet = 'ion',
  iconName,
  disabled,
  style
}) => {
  const scale = useRef(new Animated.Value(1)).current;
  const highlightAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (selected) {
      const loop = Animated.loop(
        Animated.sequence([
          Animated.timing(highlightAnim, {
            toValue: 1,
            duration: 1400,
            useNativeDriver: true,
            easing: Easing.linear,
          }),
          Animated.timing(highlightAnim, {
            toValue: 0,
            duration: 0,
            useNativeDriver: true,
          }),
          Animated.delay(1600),
        ])
      );
      loop.start();
      return () => loop.stop();
    }
    highlightAnim.stopAnimation();
    highlightAnim.setValue(0);
  }, [selected, highlightAnim]);

  const handlePressIn = () => {
    Animated.spring(scale, { toValue: 0.98, useNativeDriver: true }).start();
  };
  const handlePressOut = () => {
    Animated.spring(scale, { toValue: 1, friction: 6, tension: 120, useNativeDriver: true }).start();
  };

  const IconComp = iconSet === 'ion' ? Ionicons : MaterialCommunityIcons;
  const highlightScale = highlightAnim.interpolate({ inputRange: [0, 1], outputRange: [0.85, 1.2] });
  const highlightOpacity = highlightAnim.interpolate({ inputRange: [0, 1], outputRange: [0, 0.35] });

  return (
    <Animated.View style={[{ transform: [{ scale }], width: '48%', marginBottom: 12 }, style]}>
      <TouchableOpacity
        activeOpacity={0.9}
        onPress={() => {
          Haptics.impactAsync(selected ? Haptics.ImpactFeedbackStyle.Light : Haptics.ImpactFeedbackStyle.Medium);
          onPress();
        }}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        disabled={disabled}
        style={[chipStyles.card, disabled && { opacity: 0.5 }]}
      >
        <LinearGradient
          colors={selected ? ['#7DB7FF', '#3B82F6'] : ['#E9EEF6', '#E9EEF6']}
          style={chipStyles.border}
        >
          <View style={[chipStyles.inner, selected && chipStyles.innerSelected]}>
            {selected && (
              <View style={chipStyles.badge}>
                <Ionicons name="checkmark" size={14} color="#fff" />
              </View>
            )}

            <View style={chipStyles.iconWrap}>
              <IconComp
                name={iconName as any}
                size={28}
                color={selected ? '#ffffff' : '#3B82F6'}
              />
              {selected && (
                <Animated.View
                  pointerEvents="none"
                  style={[
                    chipStyles.highlightSquare,
                    {
                      opacity: highlightOpacity,
                      transform: [{ scale: highlightScale }],
                    },
                  ]}
                />
              )}
            </View>

            <Text
              numberOfLines={1}
              style={[chipStyles.label, selected && chipStyles.labelSelected]}
            >
              {label}
            </Text>
          </View>
        </LinearGradient>
      </TouchableOpacity>
    </Animated.View>
  );
};

const chipStyles = StyleSheet.create({
  card: {
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 3,
  },
  border: {
    borderRadius: 16,
    padding: 1.5,
  },
  inner: {
    borderRadius: 14,
    backgroundColor: '#FFFFFF',
    paddingVertical: 16,
    paddingHorizontal: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  innerSelected: {
    backgroundColor: '#3B82F6',
  },
  iconWrap: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(59,130,246,0.08)',
    marginBottom: 8,
    ...Platform.select({
      android: { elevation: 0 },
      ios: { shadowOpacity: 0 },
    }),
  },
  highlightSquare: {
    position: 'absolute',
    width: 52,
    height: 48,
    borderRadius: 10,
    backgroundColor: 'rgba(255,255,255,0.35)',
    top: -4,
    left: -6,
  },
  label: {
    fontSize: 14,
    fontWeight: '700',
    color: '#2C3E50',
  },
  labelSelected: {
    color: '#FFFFFF',
  },
  badge: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: 'rgba(255,255,255,0.25)',
    borderRadius: 10,
    paddingHorizontal: 6,
    paddingVertical: 3,
  },
});
