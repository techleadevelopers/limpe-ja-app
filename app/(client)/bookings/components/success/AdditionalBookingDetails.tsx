// LimpeJaApp/app/(client)/bookings/components/success/AdditionalBookingDetails.tsx
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

interface AdditionalBookingDetailsProps {
  bookingId: string;
  formattedPaymentValue: string;
  displayPaymentMethod: string;
}

export default function AdditionalBookingDetails({
  bookingId,
  formattedPaymentValue,
  displayPaymentMethod,
}: AdditionalBookingDetailsProps) {
  return (
    <View style={styles.additionalDetailsContainer}>
      <View style={styles.additionalDetailItem}>
        <Text style={styles.additionalDetailLabel}>ID do Agendamento</Text>
        <Text style={styles.additionalDetailValue}>{bookingId || 'N/A'}</Text>
      </View>
      <View style={styles.additionalDetailItem}>
        <Text style={styles.additionalDetailLabel}>Valor Total</Text>
        <Text style={styles.additionalDetailValue}>{formattedPaymentValue}</Text>
      </View>
      <View style={styles.additionalDetailItem}>
        <Text style={styles.additionalDetailLabel}>Método de Pagamento</Text>
        <Text style={styles.additionalDetailValue}>{displayPaymentMethod}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  additionalDetailsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    marginTop: 15,
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
    paddingTop: 20,
  },
  additionalDetailItem: {
    width: '32%',
    alignItems: 'center',
    marginBottom: 15,
  },
  additionalDetailLabel: {
    fontSize: 11,
    color: '#666',
    marginBottom: 5,
    textAlign: 'center',
  },
  additionalDetailValue: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#333',
    textAlign: 'center',
  },
});