import React, { useRef } from 'react';
import { TouchableOpacity, Text, StyleSheet, View, Animated } from 'react-native';
import { AppColors, AppShadows } from '../../../../constants/appStyles';

type Props = {
  time: string;
  isSelected: boolean;
  onPress: (time: string) => void;
  isAvailable: boolean;
  itemWidth?: number;
  // Controle de espaçamento existente
  isRecommended?: boolean;
  dense?: boolean;
  noHorizontalMargin?: boolean;
};

export default function TimeSlotButton({
  time,
  isSelected,
  onPress,
  isAvailable,
  itemWidth,
  dense = false,
  noHorizontalMargin = false,
}: Props) {
  const pressAnim = useRef(new Animated.Value(1)).current;

  const onPressIn = () => {
    Animated.spring(pressAnim, { toValue: 0.98, useNativeDriver: true }).start();
  };

  const onPressOut = () => {
    Animated.spring(pressAnim, {
      toValue: 1,
      friction: 6,
      tension: 90,
      useNativeDriver: true,
    }).start();
  };

  // Margem horizontal baseada nas props (compat RN antigos sem 'gap')
  const horizontalMargin = noHorizontalMargin ? 0 : 4;

  return (
    <Animated.View style={{ transform: [{ scale: pressAnim }], width: itemWidth }}>
      <TouchableOpacity
        onPress={() => isAvailable && onPress(time)}
        disabled={!isAvailable}
        style={[
          styles.buttonBase,
          {
            marginHorizontal: horizontalMargin,
            minWidth: dense ? 80 : 84,
          },
          !isAvailable ? styles.unavailable : isSelected ? styles.selected : styles.available,
        ]}
        activeOpacity={0.9}
        onPressIn={onPressIn}
        onPressOut={onPressOut}
      >
        <View>
          <Text
            style={[
              styles.text,
              { marginRight: 4 },
              isSelected && styles.textSelected,
              !isAvailable && styles.textUnavailable,
            ]}
            numberOfLines={1}
            ellipsizeMode="clip"
            maxFontSizeMultiplier={1.1}
            allowFontScaling={false}
          >
            {time}
          </Text>
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  buttonBase: {
    height: 30,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
    overflow: 'hidden',
    backgroundColor: AppColors.backgroundLight,
  },
  available: {
    ...AppShadows.small,
  },
  selected: {
    backgroundColor: AppColors.primaryInteractive,
    ...AppShadows.medium,
  },
  unavailable: {
    backgroundColor: AppColors.backgroundNeutral,
    opacity: 0.55,
    borderRadius: 16,
  },
  text: {
    fontSize: 12.5,
    fontWeight: '800',
    color: AppColors.textBody,
    letterSpacing: -0.2,
    lineHeight: 16,
  },
  textSelected: {
    color: AppColors.white,
  },
  textUnavailable: {
    color: '#a2acbb',
  },
});

