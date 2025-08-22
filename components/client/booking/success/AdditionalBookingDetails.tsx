// LimpeJaApp/app/(client)/bookings/components/success/AdditionalBookingDetails.tsx
import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated, Easing } from 'react-native';

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
  // Animações de entrada
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const translateYAnim = useRef(new Animated.Value(20)).current;
  const scaleAnim = useRef(new Animated.Value(0.95)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 500,
        delay: 400, // Atraso para aparecer depois dos cartões de data/hora
        easing: Easing.out(Easing.ease),
        useNativeDriver: true,
      }),
      Animated.timing(translateYAnim, {
        toValue: 0,
        duration: 500,
        delay: 400,
        easing: Easing.out(Easing.ease),
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: 500,
        delay: 400,
        easing: Easing.out(Easing.ease),
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  return (
    <Animated.View
      style={[
        styles.additionalDetailsContainer,
        { opacity: fadeAnim, transform: [{ translateY: translateYAnim }, { scale: scaleAnim }] },
      ]}
    >
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
    </Animated.View>
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