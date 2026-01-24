import { LinearGradient } from 'expo-linear-gradient';
import React, { useEffect, useRef } from 'react';
import { ActivityIndicator, Animated, Dimensions, Easing, Platform, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { AppColors } from '../../../../constants/appStyles';

const SCREEN_WIDTH = Dimensions.get('window').width;

interface ConfirmBookingButtonProps {
  isButtonDisabled: boolean;
  onConfirmBooking: () => void;
  isBooking: boolean;
  confirmButtonText: string;
  selectedTimeLabel: string | null;
  shouldShowConfirmText: boolean;
}

const ConfirmBookingButton: React.FC<ConfirmBookingButtonProps> = ({
  isButtonDisabled,
  onConfirmBooking,
  isBooking,
  confirmButtonText,
  selectedTimeLabel,
  shouldShowConfirmText,
}) => {
  const pulse = useRef(new Animated.Value(1)).current;
  const buttonScaleAnim = useRef(new Animated.Value(1)).current;
  const shineAnim = useRef(new Animated.Value(-SCREEN_WIDTH)).current;

  // Referências para as animações de loop para permitir o cleanup adequado
  const pulseLoopRef = useRef<Animated.CompositeAnimation | null>(null);
  const shineLoopRef = useRef<Animated.CompositeAnimation | null>(null);

  useEffect(() => {
    if (!isButtonDisabled) {
      // Animação de pulso mais sutil
      pulseLoopRef.current = Animated.loop(
        Animated.sequence([
          Animated.timing(pulse, { toValue: 1.01, duration: 1500, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
          Animated.timing(pulse, { toValue: 1, duration: 1500, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
        ])
      );
      pulseLoopRef.current.start();

      // Animação de brilho contínuo
      shineLoopRef.current = Animated.loop(
        Animated.timing(shineAnim, {
          toValue: SCREEN_WIDTH + 50, // Move o brilho para fora da tela
          duration: 2500, // Duração do brilho
          easing: Easing.linear,
          useNativeDriver: true,
        })
      );
      shineLoopRef.current.start();

    } else {
      // ✅ Correção: Parar as instâncias de loop e resetar os valores
      pulseLoopRef.current?.stop();
      pulse.setValue(1);
      shineLoopRef.current?.stop();
      shineAnim.setValue(-SCREEN_WIDTH);
    }

    // ✅ Correção: Cleanup para parar as animações quando o componente for desmontado ou a condição mudar
    return () => {
      pulseLoopRef.current?.stop();
      shineLoopRef.current?.stop();
    };
  }, [isButtonDisabled, pulse, shineAnim]);

  const onPressInButton = () => {
    Animated.spring(buttonScaleAnim, {
      toValue: 0.98, // Efeito de pressionar
      useNativeDriver: true,
    }).start();
  };

  const onPressOutButton = () => {
    Animated.spring(buttonScaleAnim, {
      toValue: 1, // Volta ao estado normal
      friction: 3,
      tension: 40,
      useNativeDriver: true,
    }).start();
  };

  // ✅ Correção: Combinar as animações de escala (pulse e press)
  const combinedScale = Animated.multiply(pulse, buttonScaleAnim);

  return (
    <View style={s.wrap}>
      {/* ✅ Correção: Aplicar a escala combinada diretamente ao TouchableOpacity */}
      <TouchableOpacity
        style={[s.btn, isButtonDisabled && s.btnDisabled, { transform: [{ scale: combinedScale }] }]}
        onPress={onConfirmBooking}
        disabled={isButtonDisabled}
        activeOpacity={0.9}
        onPressIn={onPressInButton}
        onPressOut={onPressOutButton}
      >
        {!isButtonDisabled && ( // Apenas mostra o brilho se o botão não estiver desabilitado
          <Animated.View style={[s.shineOverlay, { transform: [{ translateX: shineAnim }] }]}>
            <LinearGradient
              colors={['rgba(255,255,255,0)', 'rgba(255,255,255,0.3)', 'rgba(255,255,255,0)']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={s.gradientShine}
            />
          </Animated.View>
        )}
        {isBooking ? (
          <ActivityIndicator color={AppColors.white} />
        ) : (
          <Text style={s.text}>
            {selectedTimeLabel && shouldShowConfirmText ? confirmButtonText : 'Selecione Data, Hora e Endereço'}
          </Text>
        )}
      </TouchableOpacity>
    </View>
  );
};

const s = StyleSheet.create({
  wrap: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: 40,
    paddingTop: 18,
    paddingBottom: Platform.OS === 'ios' ? 55 : 39,
    backgroundColor: AppColors.white,
    
  },
  btn: {
    backgroundColor: AppColors.primaryInteractive,
    paddingVertical: 14,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center', // Adicionado para centralizar o conteúdo
    overflow: 'hidden', // Importante para o brilho não vazar
    
    borderRightWidth: 0,
    borderRightColor: '#45484b56',
    borderTopStartRadius: 44,
    borderBottomStartRadius: 44,
    borderTopEndRadius: 44,
    borderBottomEndRadius: 44,
    borderBottomColor: '#45484b56',
    borderBottomWidth: 0.1,
    borderLeftColor: '#45484b56',
    borderLeftWidth: 1,
    shadowColor: '#45484b56',
    shadowOffset: { width: -1, height: 1 },
    shadowOpacity: 3.55,
    shadowRadius: 35,
    elevation: 0,
  },
  btnDisabled: { backgroundColor: AppColors.primaryInteractive + '50',  },
  text: { color: AppColors.white, fontSize: 15, fontWeight: '700' },
  shineOverlay: {
    position: 'absolute',
    top: 0,
    left: -50, // Começa um pouco antes da borda
    height: '100%',
    width: 100, // Largura do brilho
    opacity: 0.7,
  },
  gradientShine: {
    flex: 1,
  }
});

export default ConfirmBookingButton;


