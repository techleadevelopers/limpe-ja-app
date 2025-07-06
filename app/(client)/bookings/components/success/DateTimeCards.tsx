// LimpeJaApp/app/(client)/bookings/components/success/DateTimeCards.tsx
import React from 'react';
import { View, Text, StyleSheet, ColorValue } from 'react-native'; // Importe ColorValue aqui
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

interface DateTimeCardsProps {
  formattedBookingDate: string;
  formattedBookingTime: string;
  iconColor: string;
}

export default function DateTimeCards({
  formattedBookingDate,
  formattedBookingTime,
  iconColor,
}: DateTimeCardsProps) {
  // Define as cores do gradiente
  // Use 'as const' para que o TypeScript infira um tipo de tupla readonly
  // ou tipar explicitamente para readonly [ColorValue, ColorValue, ColorValue]
  const gradientColors = [
    'rgba(173, 216, 230, 0.25)',
    'rgba(65, 153, 225, 0.29)',
    'rgba(133, 167, 231, 0.32)',
  ] as const; // <-- Adicione 'as const' aqui para resolver o problema de tipagem

  return (
    <View style={styles.dateTimeContainer}>
      {/* Primeiro Card: Data */}
      <View style={styles.dateTimeCard}>
        <LinearGradient
          colors={gradientColors}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.gradientBackground}
        />
        <Ionicons name="calendar-outline" size={20} color={iconColor} style={styles.contentOverlay} />
        <Text style={[styles.dateTimeLabel, styles.contentOverlay]}>Data</Text>
        <Text style={[styles.dateTimeValue, styles.contentOverlay]}>{formattedBookingDate}</Text>
      </View>

      {/* Segundo Card: Hora */}
      <View style={styles.dateTimeCard}>
        <LinearGradient
          colors={gradientColors}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.gradientBackground}
        />
        <Ionicons name="time-outline" size={20} color={iconColor} style={styles.contentOverlay} />
        <Text style={[styles.dateTimeLabel, styles.contentOverlay]}>Hora</Text>
        <Text style={[styles.dateTimeValue, styles.contentOverlay]}>{formattedBookingTime}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  dateTimeContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 25,
    
  },
  dateTimeCard: {
    backgroundColor: '#F5F5F5',
    borderRadius: 12,
    paddingVertical: 13,
    paddingHorizontal: 15,
    alignItems: 'center',
    width: '45%',
    overflow: 'hidden',
    position: 'relative',
     shadowColor: 'rgb(33, 34, 34)',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 5,
        elevation: 8,
  },
  gradientBackground: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 12,
  },
  contentOverlay: {
    zIndex: 1,
  },
  dateTimeLabel: {
    fontSize: 12,
    color: '#666',
    marginTop: 8,
  },
  dateTimeValue: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 5,
    textAlign: 'center',
  },
});