import React, { useRef, useEffect } from 'react';
import { TouchableOpacity, Text, StyleSheet, ActivityIndicator, Platform, View, Animated, Easing } from 'react-native';
import { AppColors, AppShadows } from '../../../../constants/appStyles'; // Importe AppColors e AppShadows

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
  const buttonScaleAnim = useRef(new Animated.Value(1)).current; // Nova animação para o scale no press

  useEffect(() => {
    if (!isButtonDisabled) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulse, { toValue: 1.02, duration: 2000, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
          Animated.timing(pulse, { toValue: 1, duration: 2000, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
        ])
      ).start();
    } else {
      pulse.stopAnimation(); pulse.setValue(1);
    }
  }, [isButtonDisabled, pulse]);

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
          onPressIn={onPressInButton} // Adicionado onPressIn
          onPressOut={onPressOutButton} // Adicionado onPressOut
        >
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
    paddingHorizontal: 20, paddingTop: 18, paddingBottom: Platform.OS === 'ios' ? 24 : 28,
    backgroundColor: AppColors.white, // Usando AppColors
    borderTopWidth: 1, borderTopColor: AppColors.borderNeutral, // Usando AppColors
    ...AppShadows.medium, // Usando AppShadows
  },
  btn: {
    backgroundColor: AppColors.primaryInteractive, // Usando AppColors
    paddingVertical: 14,
    borderRadius: 16,
    alignItems: 'center',
    ...AppShadows.medium, // Usando AppShadows
  },
  btnDisabled: { backgroundColor: AppColors.primaryInteractive + '50', ...AppShadows.small }, // Usando AppColors e AppShadows
  text: { color: AppColors.white, fontSize: 15, fontWeight: '700' }, // Usando AppColors
});

export default ConfirmBookingButton;