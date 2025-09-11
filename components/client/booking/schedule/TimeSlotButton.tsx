import React, { useRef, useEffect } from 'react';
import { TouchableOpacity, Text, StyleSheet, View, ColorValue, Animated, Easing, Dimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { AppColors, AppShadows } from '../../../../constants/appStyles'; // Importe AppColors e AppShadows

const SCREEN_WIDTH = Dimensions.get('window').width;

interface TimeSlotButtonProps {
  time: string;
  isSelected: boolean;
  onPress: (time: string) => void;
  isAvailable?: boolean;
  itemWidth?: number;
}

// Modificado para um gradiente azul claro robusto, conforme solicitado.
// As cores foram escolhidas para serem azuis claros e com opacidade total (robustas).
const AVAILABLE_GRADIENT_COLORS: readonly [ColorValue, ColorValue] = ['#6dc5ddff', '#659eedff'] as const; // Azul claro robusto

const TimeSlotButton: React.FC<TimeSlotButtonProps> = ({
  time,
  isSelected,
  onPress,
  isAvailable = true,
  itemWidth,
}) => {
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const pressAnim = useRef(new Animated.Value(1)).current; // Animação para feedback ao toque
  // Ajuste o valor inicial e final do brilho para o novo tamanho do item
  const shineAnim = useRef(new Animated.Value(- (itemWidth || 60) * 0.5)).current; // Ajustado

  useEffect(() => {
    if (isAvailable && !isSelected) {
      // Animação de pulso para slots disponíveis
      const loopPulse = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, { toValue: 1.01, duration: 1200, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
          Animated.timing(pulseAnim, { toValue: 1, duration: 1200, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
        ])
      );
      loopPulse.start();

      // Animação de brilho para slots disponíveis
      const loopShine = Animated.loop(
        Animated.timing(shineAnim, {
          toValue: (itemWidth || 60) + (itemWidth || 60) * 0.5, // Move o brilho para fora do botão, ajustado
          duration: 2000, // Duração do brilho
          easing: Easing.linear,
          useNativeDriver: true,
        })
      );
      loopShine.start();

      return () => {
        loopPulse.stop();
        loopShine.stop();
      };
    } else {
      pulseAnim.stopAnimation();
      pulseAnim.setValue(1);
      shineAnim.stopAnimation();
      shineAnim.setValue(- (itemWidth || 60) * 0.5); // Reset ajustado
    }
  }, [isAvailable, isSelected, pulseAnim, shineAnim, itemWidth]);

  const onPressInButton = () => {
    Animated.spring(pressAnim, {
      toValue: 0.95, // Escala sutil ao pressionar
      useNativeDriver: true,
    }).start();
  };

  const onPressOutButton = () => {
    Animated.spring(pressAnim, {
      toValue: 1, // Retorna à escala normal
      friction: 5,
      tension: 80,
      useNativeDriver: true,
    }).start();
  };

  const buttonStyle = [
    styles.buttonBase,
    itemWidth ? { width: itemWidth } : null,
    !isAvailable ? styles.unavailable :
    isSelected  ? styles.selected :
                  { transform: [{ scale: pulseAnim }] } // Aplica pulso apenas se disponível e não selecionado
  ];

  const showGradient = isAvailable && !isSelected;

  return (
    <TouchableOpacity
      onPress={() => isAvailable && onPress(time)}
      disabled={!isAvailable}
      style={[buttonStyle, { transform: [{ scale: pressAnim }] }]} // Aplica animação de press aqui
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
      >
        {time}
      </Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  buttonBase: {
      marginLeft: 9,
    // minWidth: 70, // Removido ou ajustado, pois itemWidth do pai vai controlar
    paddingVertical: 4, // Reduzido
    paddingHorizontal: 8, // Adicionado para controlar o espaçamento horizontal
    borderRadius: 10, // Reduzido
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
    overflow: 'hidden', // Necessário para o efeito de brilho
    backgroundColor: AppColors.backgroundLight,
    ...AppShadows.small,
  },
  gradientFill: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 10, // Ajustado para combinar com o buttonBase
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
    marginTop: 10,
    marginHorizontal: 0,
    left: 4,

         borderTopStartRadius: 44,
           borderBottomStartRadius: 44,
           borderTopEndRadius: 44,
           borderBottomEndRadius: 44,
           
           // Propriedades de sombra mantidas exatamente como fornecidas
           shadowColor: '#45484b56', // Cor da sombra
           shadowOffset: { width: -1, height: 1 }, // Deslocamento vertical mais pronunciado
           shadowOpacity: 1.05, // Opacidade aumentada para robustezs
           shadowRadius: 9, // Raio de desfoque para conforto
           elevation: 6, // Elevação aumentada para robustez no Android
  },
  text: { fontSize: 12, color: AppColors.textBody, fontWeight: '600', }, // Reduzido o tamanho da fonte
  textSelected: { color: AppColors.white, fontWeight: '700', },
  textUnavailable: { color: AppColors.mediumGray },
  textOnGradient: { color: AppColors.primaryDark, fontWeight: '700' },
  shineOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    height: '100%',
    width: 30, // Largura do brilho ajustada
    opacity: 0.7,
  },
  gradientShine: {
    flex: 1,
  }
});

export default TimeSlotButton;