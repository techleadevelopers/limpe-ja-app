// LimpeJaApp/app/(client)/bookings/components/success/BookingDetailSection.tsx
import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useRef } from 'react';
import { StyleSheet, Text, View, Animated, Easing } from 'react-native';

interface BookingDetailSectionProps {
  serviceName: string;
  formattedAddressLine1: string;
  formattedAddressLine2: string;
  notes?: string | null;
  iconColor: string;
}

export default function BookingDetailSection({
  serviceName,
  formattedAddressLine1,
  formattedAddressLine2,
  notes,
  iconColor,
}: BookingDetailSectionProps) {
  // Animações de entrada
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const translateYAnim = useRef(new Animated.Value(20)).current;
  const scaleAnim = useRef(new Animated.Value(0.95)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 500,
        delay: 100, // Leve atraso em relação à seção anterior
        easing: Easing.out(Easing.ease),
        useNativeDriver: true,
      }),
      Animated.timing(translateYAnim, {
        toValue: 0,
        duration: 500,
        delay: 100,
        easing: Easing.out(Easing.ease),
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: 500,
        delay: 100,
        easing: Easing.out(Easing.ease),
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  return (
    <Animated.View
      style={[
        styles.detailSection,
        { opacity: fadeAnim, transform: [{ translateY: translateYAnim }, { scale: scaleAnim }] },
      ]}
    >
      <View style={styles.detailItem}>
        <Ionicons name="brush-outline" size={19} color={iconColor} />
        <Text style={styles.detailLabel}>Serviço Contratado</Text>
        <Text style={styles.detailValue}>{serviceName}</Text>
      </View>
      
      <View style={styles.detailItem}>
        <Ionicons name="location-outline" size={19} color={iconColor} />
        <Text style={styles.detailLabel}>Local do Serviço</Text>
        <View style={styles.addressContainer}>
          <Text style={styles.detailValue}>{formattedAddressLine1}</Text>
          <Text style={styles.detailValue}>{formattedAddressLine2}</Text>
        </View>
      </View>
      
      {notes ? (
        <View style={styles.detailItem}>
          <Ionicons name="document-text-outline" size={18} color={iconColor} />
          <Text style={styles.detailLabel}>Observações</Text>
          <Text style={styles.detailValueNotes}>{notes}</Text>
        </View>
      ) : null}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  detailSection: {
    marginBottom: 25,
    paddingHorizontal: 10,
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  detailLabel: {
    fontSize: 13,
    fontFamily: 'Montserrat-Regular',
    color: '#666',
    marginLeft: 16,
    flex: 1,
  },
  addressContainer: {
    flex: 2,
    alignItems: 'flex-end',
  },
  detailValue: {
    fontSize: 13,
    fontFamily: 'Montserrat-Regular',
    fontWeight: 'bold',
    color: '#333',
    textAlign: 'right',
  },
  detailValueNotes: {
    fontSize: 13,
    fontFamily: 'Montserrat-Regular',
    color: '#333',
    flex: 2,
    textAlign: 'right',
    lineHeight: 20,
  },
});