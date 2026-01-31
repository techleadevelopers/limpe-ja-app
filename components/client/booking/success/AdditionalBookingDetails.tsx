// LimpeJaApp/app/client/bookings/components/success/AdditionalBookingDetails.tsx
import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated, Easing, Platform, Dimensions } from 'react-native';

const SCREEN_WIDTH = Dimensions.get('window').width;

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
    const entryAnim = Animated.parallel([
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
    ]);
    entryAnim.start();

    return () => entryAnim.stop();
  }, [fadeAnim, translateYAnim, scaleAnim]);

  return (
    <Animated.View
      style={[
        styles.additionalDetailsContainer,
        { opacity: fadeAnim, transform: [{ translateY: translateYAnim }, { scale: scaleAnim }] },
      ]}
    >
      <View style={styles.additionalDetailItem}>
        <Text style={styles.additionalDetailLabel} maxFontSizeMultiplier={1.2}>ID do Agendamento</Text>
        <Text style={styles.additionalDetailValue} numberOfLines={1} maxFontSizeMultiplier={1.2}>{bookingId || 'N/A'}</Text>
      </View>
      <View style={styles.additionalDetailItem}>
        <Text style={styles.additionalDetailLabel} maxFontSizeMultiplier={1.2}>Método de Pagamento</Text>
        <Text style={styles.additionalDetailValue} numberOfLines={1} maxFontSizeMultiplier={1.2}>{displayPaymentMethod}</Text>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  additionalDetailsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between', // Fix: Space-between em vez de space-evenly para evitar overflow no iOS
    flexWrap: 'nowrap', // Fix: No wrap para prevenir scroll horizontal
    marginTop: 15,
    marginBottom: -6,
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
    paddingTop: 20,
    paddingHorizontal: 16, // Fix: Padding fixo para safe areas iOS
    width: '100%',
    maxWidth: SCREEN_WIDTH - 32, // Fix: Ajuste para safe areas laterais no iOS
  },
  additionalDetailItem: {
    flex: 1, // Fix: Flex em vez de width fixa para responsivo no iOS
    alignItems: 'center',
    marginHorizontal: 4, // Espaçamento mínimo sem overflow
    marginBottom: 15,
    minHeight: 60,
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
