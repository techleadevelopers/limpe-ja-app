import React, { useRef, useEffect } from 'react';
import { TouchableOpacity, Text, StyleSheet, ActivityIndicator, Platform, View, Animated, Easing, Dimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient'; // Importar LinearGradient
import { AppColors, AppShadows } from '../../../../constants/appStyles';

const SCREEN_WIDTH = Dimensions.get('window').width;

interface ConfirmBookingButtonProps {
  isButtonDisabled: boolean;
  onConfirmBooking: () => void;
  isBooking: boolean;
  confirmButtonText: string;
  selectedTime: string | null;
  hasSelectedServicePrice: boolean;
}

const ConfirmBookingButton: React.FC<ConfirmBookingButtonProps> = ({
  isButtonDisabled,
  onConfirmBooking,
  isBooking,
  confirmButtonText,
  selectedTime,
  hasSelectedServicePrice,
}) => {
  const pulse = useRef(new Animated.Value(1)).current;
  const buttonScaleAnim = useRef(new Animated.Value(1)).current;
  const shineAnim = useRef(new Animated.Value(-SCREEN_WIDTH)).current; // Animação para o brilho

  useEffect(() => {
    if (!isButtonDisabled) {
      // Animação de pulso mais sutil
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulse, { toValue: 1.01, duration: 1500, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
          Animated.timing(pulse, { toValue: 1, duration: 1500, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
        ])
      ).start();

      // Animação de brilho contínuo
      Animated.loop(
        Animated.timing(shineAnim, {
          toValue: SCREEN_WIDTH + 50, // Move o brilho para fora da tela
          duration: 2500, // Duração do brilho
          easing: Easing.linear,
          useNativeDriver: true,
        })
      ).start();

    } else {
      pulse.stopAnimation(); pulse.setValue(1);
      shineAnim.stopAnimation(); shineAnim.setValue(-SCREEN_WIDTH); // Reseta o brilho
    }
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

  return (
    <View style={s.wrap}>
      <Animated.View style={{ transform: [{ scale: pulse }] }}>
        <TouchableOpacity
          style={[s.btn, isButtonDisabled && s.btnDisabled, { transform: [{ scale: buttonScaleAnim }] }]}
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
              {selectedTime && hasSelectedServicePrice ? `Agendar (${confirmButtonText})` : 'Selecione Data, Hora e Endereço'}
            </Text>
          )}
        </TouchableOpacity>
      </Animated.View>
    </View>
  );
};

const s = StyleSheet.create({
  wrap: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    paddingHorizontal: 40, paddingTop: 18, paddingBottom: Platform.OS === 'ios' ? 24 : 24,
    backgroundColor: AppColors.white,
    ...AppShadows.medium,
  },
  btn: {
    backgroundColor: AppColors.primaryInteractive,
    paddingVertical: 14,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center', // Adicionado para centralizar o conteúdo
    overflow: 'hidden', // Importante para o brilho não vazar
    ...AppShadows.medium,
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
    elevation: 6,
  },
  btnDisabled: { backgroundColor: AppColors.primaryInteractive + '50', ...AppShadows.small },
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