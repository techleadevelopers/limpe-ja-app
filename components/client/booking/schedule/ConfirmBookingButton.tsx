import React, { useRef, useEffect } from 'react';
import { TouchableOpacity, Text, StyleSheet, ActivityIndicator, Platform, View, Animated, Easing } from 'react-native';

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

  return (
    <View style={s.wrap}>
      <Animated.View style={{ transform: [{ scale: pulse }] }}>
        <TouchableOpacity
          style={[s.btn, isButtonDisabled && s.btnDisabled]}
          onPress={onConfirmBooking}
          disabled={isButtonDisabled}
          activeOpacity={0.9}
        >
          {isBooking ? (
            <ActivityIndicator color="#FFFFFF" />
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
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1, borderTopColor: '#E7EEF9',
    shadowColor: '#000', shadowOffset: { width: 0, height: -3 }, shadowOpacity: 0.08, shadowRadius: 6, elevation: 8,
  },
  btn: {
    backgroundColor: '#2A72E7',
    paddingVertical: 14,
    borderRadius: 16,
    alignItems: 'center',
    shadowColor: '#2A72E7',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 8,
  },
  btnDisabled: { backgroundColor: '#A9C7F6', shadowOpacity: 0 },
  text: { color: '#fff', fontSize: 15, fontWeight: '700' },
});

export default ConfirmBookingButton;
