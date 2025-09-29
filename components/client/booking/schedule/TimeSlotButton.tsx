// TimeSlotButton.tsx (ajustado para badges e animações só no modo "ver todos" - slots limpos no modo oculto)
import React, { useRef, useEffect } from 'react';
import { TouchableOpacity, Text, StyleSheet, View, ColorValue, Animated, Easing } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { AppColors, AppShadows } from '../../../../constants/appStyles';

interface TimeSlotButtonProps {
  time: string;  // <— Reforçado: obrigatório e string (alinhado com SlotItem)
  isSelected: boolean;
  onPress: (time: string) => void;
  isAvailable: boolean;  // <— Reforçado: obrigatório e boolean (alinhado com SlotItem)
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
  isAvailable,
  itemWidth,
  isRecommended = false,
  dense = false,
}) => {
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const pressAnim = useRef(new Animated.Value(1)).current;
  const shineAnim = useRef(new Animated.Value(-(itemWidth || 60) * 0.5)).current;

  const loopPulseRef = useRef<Animated.CompositeAnimation | null>(null);
  const loopShineRef = useRef<Animated.CompositeAnimation | null>(null);

  // <— AJUSTE PREMIUM: Animações e brilho só no modo "dense" (ver todos); no modo oculto, slots 100% limpos e sem interferência visual
  useEffect(() => {
    if (isAvailable && !isSelected && isRecommended && dense) {  // <— NOVO: && dense (só anima no modo "ver todos")
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
  }, [isAvailable, isSelected, isRecommended, dense, pulseAnim, shineAnim, itemWidth]);  // <— NOVO: dense nas deps

  const onPressInButton = () => {
    Animated.spring(pressAnim, { toValue: 0.99, useNativeDriver: true }).start();
  };

  const onPressOutButton = () => {
    Animated.spring(pressAnim, { toValue: 1, friction: 6, tension: 90, useNativeDriver: true }).start();
  };

  const showGradient = isAvailable && !isSelected && dense;  // <— NOVO: Gradient só no modo dense (ver todos); no modo oculto, cor plana sem interferência
  const combinedScale = Animated.multiply(pulseAnim, pressAnim);

  // <— AJUSTE PREMIUM: Badge só no modo dense (ver todos) e para recomendados não selecionados/disponíveis
  // No modo oculto (!dense), NADA dentro do slot (sem badge, sem brilho, slots limpos e premium)
  const showBadge = isRecommended && !isSelected && isAvailable && dense;

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
                dense && { width: 18, opacity: 0.5 },                 // <— brilho mais estreito no modo denso (reduzido para anti-overlap)
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

        {/* Badge com condição reforçada: SÓ aparece no modo dense (ver todos); no modo oculto, slot vazio e limpo */}
        {showBadge && (
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
          // <— Removido paddingTop (causava erro TS); espaço via lineHeight no estilo text
        >
          {time}
        </Text>
      </TouchableOpacity>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  buttonBase: {
    marginHorizontal: 1,
    height: 30,
    
    minWidth: 84,
    paddingHorizontal: 12,
    paddingVertical: 4,  // <— Adicionado sutil para centralizar texto verticalmente (sem aumentar altura)
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,  // <— Reduzido de 12 para 8 (melhor alinhamento vertical, evita vazamento)
    overflow: 'hidden',
    
    backgroundColor: AppColors.backgroundLight,
  },
  buttonDense: {
    marginHorizontal: 4,
    height: 30,                 // ↓ menor
    minWidth: 78,
    paddingHorizontal: 10,
    paddingVertical: 3,         // <— Sutil no dense também
    borderRadius: 14,
    marginBottom: 6,            // <— Reduzido de 8 para 6 (compacto sem vazamento)
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
    lineHeight: 20,  // <— Aumentado de 18 para 20 (espaço vertical ao texto sem paddingTop)
    letterSpacing: 0.2,
    color: AppColors.textBody,
    fontWeight: '600',
    textAlign: 'center',
    includeFontPadding: false,
    textAlignVertical: 'center',
  },
  textDense: {
    fontSize: 13,               // ↓ menor
    lineHeight: 17,             // <— Ajustado para 17 (espaço no dense sem overlap)
   
  },
  textSelected: { color: AppColors.white, fontWeight: '700' },
  textUnavailable: { color: AppColors.mediumGray },
  textOnGradient: { color: AppColors.primaryDark, fontWeight: '700' },
  shineOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    height: '100%',
    width: 20,  // <— Reduzido de 26 para 20 (anti-overlap no texto)
    opacity: 0.55,
  },
  gradientShine: { flex: 1 },
  badgeRecommended: {
    position: 'absolute',
    top: -2,  // <— Ajustado de 6 para -2 (sobe para fora do botão, evita overlap no texto)
    right: 8,
    paddingHorizontal: 4,  // <— Reduzido de 6 para 4 (equilíbrio, mais espaço para texto)
    paddingVertical: 1,  // <— Reduzido de 2 para 1 (menor altura)
    borderRadius: 10,
    backgroundColor: 'rgba(255,255,255,0.72)',
    minWidth: 45,  // <— Adicionado para garantir espaço mínimo ao texto longo sem corte
  },
  badgeText: {
    fontSize: 7.5,  // <— Reduzido de 8 para 7.5 (cabe "recomendado" completo sem cortar)
    fontWeight: '700',
    color: AppColors.textBody,
    textTransform: 'uppercase',
    letterSpacing: 0.1,  // <— Adicionado para compactar texto (evita corte no final)
  },
});

export default TimeSlotButton;