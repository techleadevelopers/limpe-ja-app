import React from 'react';
import { TouchableOpacity, Text, StyleSheet, ActivityIndicator, Platform, View } from 'react-native';

interface ConfirmBookingButtonProps {
  isButtonDisabled: boolean;
  onConfirmBooking: () => void;
  isBooking: boolean;
  confirmButtonText: string;
  selectedTime: string | null;
  hasSelectedServicePrice: boolean; // Para verificar se o preço do serviço está disponível
}

const ConfirmBookingButton: React.FC<ConfirmBookingButtonProps> = ({
  isButtonDisabled,
  onConfirmBooking,
  isBooking,
  confirmButtonText,
  selectedTime,
  hasSelectedServicePrice,
}) => {
  return (
    <View style={styles.confirmButtonWrapper}>
      <TouchableOpacity
        style={[
          styles.confirmButton,
          isButtonDisabled && styles.confirmButtonDisabled
        ]}
        onPress={onConfirmBooking}
        disabled={isButtonDisabled}
      >
        {isBooking ? (
          <ActivityIndicator color="#FFFFFF" />
        ) : (
          <Text style={styles.confirmButtonText}>
            {selectedTime && hasSelectedServicePrice ?
              `Agendar (${confirmButtonText})` :
              "Selecione Data, Hora e Endereço"
            }
          </Text>
        )}
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  confirmButtonWrapper: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    borderRadius: 40,
    paddingHorizontal: 25,
    paddingVertical: Platform.OS === 'ios' ? 25 : 42,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -3 },
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 8,
  },
  confirmButton: {
    backgroundColor: '#2A72E7',
    paddingVertical: 7,
    width: '90%',
    borderRadius: 12,
    bottom: 25,
    left: 12,
    alignItems: 'center',
  },
  confirmButtonDisabled: {
    backgroundColor: '#A0C7F2',
  },
  confirmButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
});

export default ConfirmBookingButton;