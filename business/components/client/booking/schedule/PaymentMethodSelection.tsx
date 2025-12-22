import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface PaymentMethodSelectionProps {
  onSelectPixPayment: () => void;
}

const PaymentMethodSelection: React.FC<PaymentMethodSelectionProps> = ({ onSelectPixPayment }) => {
  return (
    <View style={styles.paymentMethodSelectionContainer}>
      <Text style={styles.paymentMethodTitle}>Selecione o Método de Pagamento</Text>
      <TouchableOpacity style={styles.paymentOptionButton} onPress={onSelectPixPayment}>
        <Ionicons name="qr-code-outline" size={28} color="#007AFF" />
        <Text style={styles.paymentOptionText}>PIX</Text>
        <Ionicons name="chevron-forward" size={20} color="#666" style={styles.paymentOptionArrow} />
      </TouchableOpacity>
      {/* Você pode adicionar outras opções de pagamento aqui (ex: Cartão de Crédito) */}
    </View>
  );
};

const styles = StyleSheet.create({
  paymentMethodSelectionContainer: {
    marginTop: 25,
    paddingHorizontal: 15,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    paddingVertical: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 4,
    marginHorizontal: 15,
  },
  paymentMethodTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#111',
    marginBottom: 20,
    textAlign: 'center',
  },
  paymentOptionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F7F9FC',
    borderRadius: 10,
    paddingVertical: 15,
    paddingHorizontal: 20,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#E9EDF0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  paymentOptionText: {
    flex: 1,
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginLeft: 15,
  },
  paymentOptionArrow: {
    marginLeft: 10,
  },
});

export default PaymentMethodSelection;