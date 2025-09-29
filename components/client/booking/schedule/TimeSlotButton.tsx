import React, { useRef, useEffect } from 'react';
import { TouchableOpacity, Text, StyleSheet, View, ColorValue, Animated, Easing } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { AppColors, AppShadows } from '../../../../constants/appStyles';

interface TimeSlotButtonProps {
  time: string;
  isSelected: boolean;
  onPress: (time: string) => void;
  isAvailable?: boolean;
  itemWidth?: number;
  /** microdestaque (próximos horários) */
  isRecommended?: boolean;
  /** quando true, usa layout compacto (menor altura/padding/gap) */
  dense?: boolean;
}

const AVAILABLE_GRADIENT_COLORS: readonly [ColorValue, ColorValue] = ['#6dc5ddff', '#659eedff'] as const;

const TimeSlotButton: React.FC<TimeSlotButtonProps> = ({
  time,
  isSelected,
  onPress,
  isAvailable = true,
  itemWidth,
  isRecommended = false,
  dense = false,
}) => {
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const pressAnim = useRef(new Animated.Value(1)).current;
  const shineAnim = useRef(new Animated.Value(-(itemWidth || 60) * 0.5)).current;

  const loopPulseRef = useRef<Animated.CompositeAnimation | null>(null);
  const loopShineRef = useRef<Animated.CompositeAnimation | null>(null);

  useEffect(() => {
    if (isAvailable && !isSelected && isRecommended) {
      loopPulseRef.current = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, { toValue: 1.012, duration: 1200, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
          Animated.timing(pulseAnim, { toValue: 1, duration: 1200, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
        ])
      );
      loopPulseRef.current.start();

      loopShineRef.current = Animated.loop(
        Animated.timing(shineAnim, {
          toValue: (itemWidth || 60) + (itemWidth || 60) * 0.5,
          duration: 2600,
          easing: Easing.linear,
          useNativeDriver: true,
        })
      );
      loopShineRef.current.start();
    } else {
      loopPulseRef.current?.stop();
      pulseAnim.setValue(1);
      loopShineRef.current?.stop();
      shineAnim.setValue(-(itemWidth || 60) * 0.5);
    }

    return () => {
      loopPulseRef.current?.stop();
      loopShineRef.current?.stop();
    };
  }, [isAvailable, isSelected, isRecommended, pulseAnim, shineAnim, itemWidth]);

  const onPressInButton = () => {
    Animated.spring(pressAnim, { toValue: 0.99, useNativeDriver: true }).start();
  };

  const onPressOutButton = () => {
    Animated.spring(pressAnim, { toValue: 1, friction: 6, tension: 90, useNativeDriver: true }).start();
  };

  const showGradient = isAvailable && !isSelected;
  const combinedScale = Animated.multiply(pulseAnim, pressAnim);

  return (
    <Animated.View style={{ transform: [{ scale: combinedScale }], width: itemWidth }}>
      <TouchableOpacity
        onPress={() => isAvailable && onPress(time)}
        disabled={!isAvailable}
        style={[
          styles.buttonBase,
          dense && styles.buttonDense,                               // <— compacto
          !isAvailable ? styles.unavailable : isSelected ? styles.selected : styles.available,
        ]}
        activeOpacity={0.9}
        onPressIn={onPressInButton}
        onPressOut={onPressOutButton}
      >
        {showGradient && (
          <>
            <LinearGradient
              colors={AVAILABLE_GRADIENT_COLORS}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={[styles.gradientFill, dense && styles.gradientFillDense]}
            />
            <Animated.View
              style={[
                styles.shineOverlay,
                dense && { width: 20, opacity: 0.5 },                 // <— brilho mais estreito no modo denso
                { transform: [{ translateX: shineAnim }] },
              ]}
            >
              <LinearGradient
                colors={['rgba(255,255,255,0)', 'rgba(255,255,255,0.18)', 'rgba(255,255,255,0)']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.gradientShine}
              />
            </Animated.View>
          </>
        )}

        {isRecommended && !isSelected && isAvailable && !dense && ( // esconde badge no modo denso
          <View style={styles.badgeRecommended}>
            <Text style={styles.badgeText}>recomendado</Text>
          </View>
        )}

        <Text
          style={[
            styles.text,
            dense && styles.textDense,                                 // <— fonte mais compacta
            isSelected && styles.textSelected,
            !isAvailable && styles.textUnavailable,
            showGradient && styles.textOnGradient,
          ]}
          numberOfLines={1}
          ellipsizeMode="clip"
          maxFontSizeMultiplier={1.1}
          allowFontScaling={false}
        >
          {time}
        </Text>
      </TouchableOpacity>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  buttonBase: {
    marginHorizontal: 6,
    height: 30,
    
    minWidth: 84,
    paddingHorizontal: 12,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
    overflow: 'hidden',
    
    backgroundColor: AppColors.backgroundLight,
  },
  buttonDense: {
    marginHorizontal: 4,
    height: 30,                 // ↓ menor
    minWidth: 78,
    paddingHorizontal: 10,
    borderRadius: 14,
    marginBottom: 8,            // ↓ menos espaço vertical
  },
  available: {
    ...AppShadows.small,
    
    
  },
  gradientFill: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: '#45484b1c',
    
  },
  gradientFillDense: {
    borderRadius: 14,
    borderWidth: 1,
  },
  selected: {
    backgroundColor: AppColors.primaryInteractive,
    ...AppShadows.medium,
  },
  unavailable: {
    backgroundColor: AppColors.backgroundNeutral,
    opacity: 0.55,
    borderRadius: 16,
    shadowColor: '#45484b56',
    shadowOffset: { width: -1, height: 1 },
    shadowOpacity: 1.05,
    shadowRadius: 9,
    elevation: 6,
  },
  text: {
    fontSize: 14,
    lineHeight: 18,
    letterSpacing: 0.2,
    color: AppColors.textBody,
    fontWeight: '600',
    textAlign: 'center',
    includeFontPadding: false,
    textAlignVertical: 'center',
  },
  textDense: {
    fontSize: 13,               // ↓ menor
    lineHeight: 16,
   
  },
  textSelected: { color: AppColors.white, fontWeight: '700' },
  textUnavailable: { color: AppColors.mediumGray },
  textOnGradient: { color: AppColors.primaryDark, fontWeight: '700' },
  shineOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    height: '100%',
    width: 26,
    opacity: 0.55,
  },
  gradientShine: { flex: 1 },
  badgeRecommended: {
    position: 'absolute',
    top: 6,
    right: 8,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 10,
    backgroundColor: 'rgba(255,255,255,0.72)',
  },
  badgeText: {
    fontSize: 9.5,
    fontWeight: '700',
    color: AppColors.textBody,
    textTransform: 'uppercase',
  },
});

export default TimeSlotButton;
