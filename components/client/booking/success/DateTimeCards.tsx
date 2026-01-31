// LimpeJaApp/app/client/bookings/components/success/DateTimeCards.tsx
import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated, Easing } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { AppColors } from '../../../../constants/appStyles';

interface DateTimeCardsProps {
  formattedBookingDate: string;
  formattedBookingTime: string;
  iconColor: string;
}

// Refatorado para layout inline (ícone + texto), sem cards azuis
export default function DateTimeCards({
  formattedBookingDate,
  formattedBookingTime,
  iconColor,
}: DateTimeCardsProps) {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const translateYAnim = useRef(new Animated.Value(12)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 400, delay: 120, easing: Easing.out(Easing.ease), useNativeDriver: true }),
      Animated.timing(translateYAnim, { toValue: 0, duration: 400, delay: 120, easing: Easing.out(Easing.ease), useNativeDriver: true }),
    ]).start();
  }, [fadeAnim, translateYAnim]);

  return (
    <Animated.View style={[styles.container, { opacity: fadeAnim, transform: [{ translateY: translateYAnim }] }]}>
      <View style={styles.item}>
        <Ionicons name="calendar-outline" size={18} color={iconColor} style={styles.icon} />
        <View style={styles.textGroup}>
          <Text style={styles.label} numberOfLines={1} maxFontSizeMultiplier={1.2}>Data</Text>
          <Text style={styles.value} numberOfLines={1} maxFontSizeMultiplier={1.2}>{formattedBookingDate}</Text>
        </View>
      </View>

      <View style={styles.item}>
        <Ionicons name="time-outline" size={18} color={iconColor} style={styles.icon} />
        <View style={styles.textGroup}>
          <Text style={styles.label} numberOfLines={1} maxFontSizeMultiplier={1.2}>Hora</Text>
          <Text style={styles.value} numberOfLines={1} maxFontSizeMultiplier={1.2}>{formattedBookingTime}</Text>
        </View>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    
    justifyContent: 'space-between',
    paddingHorizontal: 8,
    marginBottom: 8,
    
  },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 10,
  
    paddingVertical: 6,
    paddingHorizontal: 6,
  },
  icon: {
    marginTop: 1,
  },
  textGroup: {
    flexShrink: 1,
  },
  label: {
    fontSize: 12,
    color: AppColors.textAuxiliary,
    marginBottom: 2,
  },
  value: {
    fontSize: 13,
    fontWeight: '700',
    color: AppColors.textBody,
  },
});
