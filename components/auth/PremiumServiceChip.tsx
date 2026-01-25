// PremiumServiceChip.tsx
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import React, { useRef } from 'react';
import { Animated, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

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
  label,
  selected,
  onPress,
  iconSet = 'ion',
  iconName,
  disabled,
  style
}) => {
  const scale = useRef(new Animated.Value(1)).current;

  const handlePressIn = () => {
    Animated.spring(scale, { toValue: 0.98, useNativeDriver: true }).start();
  };
  const handlePressOut = () => {
    Animated.spring(scale, { toValue: 1, friction: 6, tension: 120, useNativeDriver: true }).start();
  };

  const IconComp = iconSet === 'ion' ? Ionicons : MaterialCommunityIcons;

  return (
    <Animated.View style={[{ transform: [{ scale }], marginRight: 8, marginBottom: 8 }, style]}>
      <TouchableOpacity
        activeOpacity={0.9}
        onPress={() => {
          Haptics.impactAsync(selected ? Haptics.ImpactFeedbackStyle.Light : Haptics.ImpactFeedbackStyle.Medium);
          onPress();
        }}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        disabled={disabled}
        style={[
          chipStyles.chipContainer,
          selected && chipStyles.chipSelected,
          disabled && chipStyles.chipDisabled,
        ]}
      >
        <View style={[chipStyles.iconWrap, selected && chipStyles.iconWrapSelected]}>
          <IconComp
            name={iconName as any}
            size={20}
            color={selected ? '#1D4ED8' : '#64748B'}
          />
        </View>

        <Text
          style={[chipStyles.chipText, selected && chipStyles.chipTextSelected]}
        >
          {label}
        </Text>
      </TouchableOpacity>
    </Animated.View>
  );
};

const chipStyles = StyleSheet.create({
  chipContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    backgroundColor: '#F8FAFC',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
    minWidth: 120,
  },
  chipSelected: {
    backgroundColor: '#EFF6FF',
    borderColor: '#3B82F6',
  },
  chipDisabled: {
    opacity: 0.5,
  },
  iconWrap: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(59,130,246,0.08)',
  },
  iconWrapSelected: {
    backgroundColor: 'rgba(59,130,246,0.18)',
  },
  chipText: {
    fontSize: 13,
    fontWeight: '500',
    color: '#64748B',
    marginLeft: 8,
  },
  chipTextSelected: {
    color: '#1D4ED8',
  },
});
