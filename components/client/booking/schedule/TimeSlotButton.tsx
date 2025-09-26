import React, { useRef, useEffect } from 'react';
import { TouchableOpacity, Text, StyleSheet, View, ColorValue, Animated, Easing, Dimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { AppColors, AppShadows } from '../../../../constants/appStyles';

const SCREEN_WIDTH = Dimensions.get('window').width;

interface TimeSlotButtonProps {
  time: string;
  isSelected: boolean;
  onPress: (time: string) => void;
  isAvailable?: boolean;
  itemWidth?: number;
}

const AVAILABLE_GRADIENT_COLORS: readonly [ColorValue, ColorValue] = ['#6dc5ddff', '#659eedff'] as const;

const TimeSlotButton: React.FC<TimeSlotButtonProps> = ({
  time,
  isSelected,
  onPress,
  isAvailable = true,
  itemWidth,
}) => {
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const pressAnim = useRef(new Animated.Value(1)).current;
  const shineAnim = useRef(new Animated.Value(- (itemWidth || 60) * 0.5)).current;

  // ✅ Correção: Referências para as animações de loop para permitir o cleanup adequado
  const loopPulseRef = useRef<Animated.CompositeAnimation | null>(null);
  const loopShineRef = useRef<Animated.CompositeAnimation | null>(null);

  useEffect(() => {
    if (isAvailable && !isSelected) {
      // Animação de pulso para slots disponíveis
      loopPulseRef.current = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, { toValue: 1.01, duration: 1200, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
          Animated.timing(pulseAnim, { toValue: 1, duration: 1200, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
        ])
      );
      loopPulseRef.current.start();

      // Animação de brilho para slots disponíveis
      loopShineRef.current = Animated.loop(
        Animated.timing(shineAnim, {
          toValue: (itemWidth || 60) + (itemWidth || 60) * 0.5,
          duration: 2000,
          easing: Easing.linear,
          useNativeDriver: true,
        })
      );
      loopShineRef.current.start();
    } else {
      // ✅ Correção: Parar as instâncias de loop e resetar os valores
      loopPulseRef.current?.stop();
      pulseAnim.setValue(1);
      loopShineRef.current?.stop();
      shineAnim.setValue(- (itemWidth || 60) * 0.5);
    }

    // ✅ Correção: Cleanup para parar as animações quando o componente for desmontado ou a condição mudar
    return () => {
      loopPulseRef.current?.stop();
      loopShineRef.current?.stop();
    };
  }, [isAvailable, isSelected, pulseAnim, shineAnim, itemWidth]);

  const onPressInButton = () => {
    Animated.spring(pressAnim, {
      toValue: 0.95,
      useNativeDriver: true,
    }).start();
  };

  const onPressOutButton = () => {
    Animated.spring(pressAnim, {
      toValue: 1,
      friction: 5,
      tension: 80,
      useNativeDriver: true,
    }).start();
  };

  const showGradient = isAvailable && !isSelected;

  // ✅ Correção: Combinando pulseAnim e pressAnim para a escala
  const combinedScale = Animated.multiply(pulseAnim, pressAnim);

  return (
    // ✅ Correção: Envolver TouchableOpacity em Animated.View para aplicar a escala combinada
    <Animated.View style={{ transform: [{ scale: combinedScale }] }}>
      <TouchableOpacity
        onPress={() => isAvailable && onPress(time)}
        disabled={!isAvailable}
        style={[
          styles.buttonBase,
          itemWidth ? { width: itemWidth } : null,
          !isAvailable ? styles.unavailable : isSelected ? styles.selected : null,
          // ✅ Removido o transform daqui, pois já está no Animated.View pai
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
              style={styles.gradientFill}
            />
            <Animated.View style={[styles.shineOverlay, { transform: [{ translateX: shineAnim }] }]}>
              <LinearGradient
                colors={['rgba(255,255,255,0)', 'rgba(255,255,255,0.3)', 'rgba(255,255,255,0)']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.gradientShine}
              />
            </Animated.View>
          </>
        )}
        <Text
          style={[
            styles.text,
            isSelected && styles.textSelected,
            !isAvailable && styles.textUnavailable,
            showGradient && styles.textOnGradient,
          ]}
          maxFontSizeMultiplier={1.2}
        >
          {time}
        </Text>
      </TouchableOpacity>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  buttonBase: {
      marginLeft: 9,
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
    overflow: 'hidden',
    backgroundColor: AppColors.backgroundLight,
    ...AppShadows.small,
  },
  gradientFill: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 10,
    borderWidth: 2.5,
    borderColor : '#45484b56',

  },
  selected: {
    backgroundColor: AppColors.primaryInteractive,
    ...AppShadows.medium,
  },
  unavailable: {
    backgroundColor: AppColors.backgroundNeutral,
    opacity: 0.55,
    // ✅ Correção: Removidos marginTop e left para evitar desalinhamento
    // marginTop: 10,
    // marginHorizontal: 0,
    // left: 4,

    borderTopStartRadius: 44,
    borderBottomStartRadius: 44,
    borderTopEndRadius: 44,
    borderBottomEndRadius: 44,

    shadowColor: '#45484b56',
    shadowOffset: { width: -1, height: 1 },
    shadowOpacity: 1.05,
    shadowRadius: 9,
    elevation: 6,
  },
  text: { fontSize: 12, color: AppColors.textBody, fontWeight: '600', },
  textSelected: { color: AppColors.white, fontWeight: '700', },
  textUnavailable: { color: AppColors.mediumGray },
  textOnGradient: { color: AppColors.primaryDark, fontWeight: '700' },
  shineOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    height: '100%',
    width: 30,
    opacity: 0.7,
  },
  gradientShine: {
    flex: 1,
  }
});

export default TimeSlotButton;