// PremiumServiceChip.tsx
import React, { useRef, useEffect } from 'react';
import { TouchableOpacity, View, Text, StyleSheet, Animated, Platform, StyleProp, ViewStyle } from 'react-native';
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
  // CORREÇÃO: Usamos 'any' para o estilo para evitar o conflito de tipos complexos 
  // ao misturar StyleProp com AnimatedProps.
  style?: any; 
};

export const PremiumServiceChip: React.FC<ChipProps> = ({
  id, label, selected, onPress, iconSet = 'ion', iconName, disabled, style
}) => {
  const scale = useRef(new Animated.Value(1)).current;
  const sheen = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (selected) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(sheen, { toValue: 1, duration: 1600, useNativeDriver: true }),
          Animated.timing(sheen, { toValue: 0, duration: 0, useNativeDriver: true }),
          Animated.delay(2200),
        ])
      ).start();
    } else {
      sheen.stopAnimation();
      sheen.setValue(0);
    }
  }, [selected]);

  const handlePressIn = () => {
    Animated.spring(scale, { toValue: 0.98, useNativeDriver: true }).start();
  };
  const handlePressOut = () => {
    Animated.spring(scale, { toValue: 1, friction: 6, tension: 120, useNativeDriver: true }).start();
  };

  const IconComp = iconSet === 'ion' ? Ionicons : MaterialCommunityIcons;

  const sheenTranslate = sheen.interpolate({ inputRange: [0, 1], outputRange: [-120, 160] });

  return (
    // Aplicamos o estilo externo (style) aqui, que contém as animações de stagger
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
        {/* Borda em degradê / anel de seleção */}
        <LinearGradient
          colors={selected ? ['#7DB7FF', '#3B82F6'] : ['#E9EEF6', '#E9EEF6']}
          style={chipStyles.border}
        >
          {/* Corpo frosted */}
          <View style={[chipStyles.inner, selected && chipStyles.innerSelected]}>
            {/* Badge check */}
            {selected && (
              <View style={chipStyles.badge}>
                <Ionicons name="checkmark" size={14} color="#fff" />
              </View>
            )}

            {/* Ícone */}
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
                    chipStyles.sheen,
                    { transform: [{ translateX: sheenTranslate }, { rotate: '-20deg' }] },
                  ]}
                />
              )}
            </View>

            {/* Label */}
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
  sheen: {
    position: 'absolute',
    top: -8,
    left: 0,
    width: 60,
    height: 60,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.26)',
    opacity: 0.45,
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