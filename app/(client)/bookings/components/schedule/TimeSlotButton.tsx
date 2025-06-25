// app/(client)/bookings/components/schedule/TimeSlotButton.tsx
import React from 'react';
import { TouchableOpacity, Text, StyleSheet, View } from 'react-native';

interface TimeSlotButtonProps {
  time: string;
  isSelected: boolean;
  onPress: (time: string) => void;
  isAvailable?: boolean; // <<<< Usará esta prop para estilização e desabilitação
  itemWidth?: number;
}

const TimeSlotButton: React.FC<TimeSlotButtonProps> = ({
  time,
  isSelected,
  onPress,
  isAvailable = true, // Default para true se não for fornecido
  itemWidth,
}) => {
  const handlePress = () => {
    if (isAvailable) { // Garante que só pode ser pressionado se estiver disponível
      onPress(time);
    }
  };

  return (
    <TouchableOpacity
      onPress={handlePress}
      disabled={!isAvailable} // <<<< Desabilita o botão se não estiver disponível
      style={[
        styles.buttonBase,
        isSelected && styles.buttonSelected,
        !isAvailable && styles.buttonUnavailable, // <<<< Aplica estilo para indisponível
        itemWidth ? { width: itemWidth } : {},
      ]}
    >
      <Text
        style={[
          styles.textBase,
          isSelected && styles.textSelected,
          !isAvailable && styles.textUnavailable, // <<<< Aplica estilo de texto para indisponível
        ]}
      >
        {time}
      </Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  buttonBase: {
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 6,
    backgroundColor: '#F0F0F0',
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 70,
    margin: 3,
    flex: 1,
  },
  buttonSelected: {
    backgroundColor: '#2A72E7',
  },
  buttonUnavailable: {
    backgroundColor: '#EAEAEA', // Cor de fundo mais clara para indisponível
    opacity: 0.8, // Para tornar mais claro
  },
  textBase: {
    fontSize: 12,
    color: '#333333',
    fontWeight: '500',
  },
  textSelected: {
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
  textUnavailable: {
    color: '#999999', // Cor de texto mais clara para indisponível
  },
});

export default TimeSlotButton;