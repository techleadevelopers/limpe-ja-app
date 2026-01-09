import React, { useEffect, useRef } from 'react';
import { TouchableOpacity, Text, StyleSheet, View, Animated } from 'react-native';
import { AppColors, AppShadows } from '../../../../constants/appStyles';

type Props = {
  time: string;
  isSelected: boolean;
  onPress: (time: string) => void;
  isAvailable: boolean;
  itemWidth?: number;

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

  React.useEffect(() => {
    console.log('[TimeSlotButton] render', { time, isAvailable, isSelected });
  }, [time, isAvailable, isSelected]);

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

  // ✅ Espaçamento vai no WRAPPER (evita “estourar” e cortar o último item da linha)
  const horizontalPad = noHorizontalMargin ? 0 : 6;

  const formatSlotLabel = (value: string) => {
    if (!value) return value;
    const [hour, minute] = value.split(':');
    if (minute === '00') {
      return `${hour}h`;
    }
    return `${hour}h${minute}`;
  };

  return (
    <Animated.View
      style={[
        styles.cellWrap,
        {
          transform: [{ scale: pressAnim }],
          paddingHorizontal: horizontalPad,
          
          width: itemWidth,
        },
      ]}
    >
      <TouchableOpacity
        onPress={() => isAvailable && onPress(time)}
        disabled={!isAvailable}
        style={[
          styles.buttonBase,
          // ✅ Botão ocupa a célula inteira (sem marginHorizontal aqui)
          // ✅ minWidth menor pra não “forçar” o layout a vazar
          { minWidth: dense ? 40 : 40, minHeight: 44 },
          !isAvailable ? styles.unavailable : isSelected ? styles.selected : styles.available,
        ]}
        activeOpacity={0.9}
        onPressIn={onPressIn}
        onPressOut={onPressOut}
      >
        <View style={styles.textRow}>
          <Text
            style={[styles.text, isSelected && styles.textSelected, !isAvailable && styles.textUnavailable]}
            numberOfLines={1}
            ellipsizeMode="clip"
            maxFontSizeMultiplier={1.1}
            allowFontScaling={false}
          >
            {formatSlotLabel(time)}
          </Text>
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  // ✅ wrapper “célula”
  cellWrap: {
    // ajuda em grids (evita overflow)
    flexShrink: 1,
  },

  buttonBase: {
    height: 44,
    paddingHorizontal: 10,
    paddingVertical: 0,
    left: 9,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,

    // ✅ crucial: botão não pode vazar da célula
    width: '70%',
    flexShrink: 1,

    overflow: 'hidden',
    backgroundColor: AppColors.backgroundLight,
  },

  textRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    // ✅ garante centralização real e evita “empurrão” lateral
    width: '100%',
  },

  available: {
    
  },
  selected: {
    backgroundColor: AppColors.primaryInteractive,
    
  },
  unavailable: {
    backgroundColor: AppColors.backgroundNeutral,
    opacity: 0.55,
    borderRadius: 16,
  },

  text: {
    fontSize: 11.5,
    fontWeight: '800',
    color: AppColors.textBody,
    letterSpacing: -0.2,
    lineHeight: 16,
    textAlign: 'center',
  },
  textSelected: {
    color: AppColors.white,
  },
  textUnavailable: {
    color: '#a2acbb',
  },
});
