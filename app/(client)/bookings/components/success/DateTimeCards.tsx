// LimpeJaApp/app/(client)/bookings/components/success/DateTimeCards.tsx
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

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
  return (
    <View style={styles.dateTimeContainer}>
      <View style={styles.dateTimeCard}>
        <Ionicons name="calendar-outline" size={20} color={iconColor} />
        <Text style={styles.dateTimeLabel}>Data</Text>
        <Text style={styles.dateTimeValue}>{formattedBookingDate}</Text>
      </View>
      <View style={styles.dateTimeCard}>
        <Ionicons name="time-outline" size={20} color={iconColor} />
        <Text style={styles.dateTimeLabel}>Hora</Text>
        <Text style={styles.dateTimeValue}>{formattedBookingTime}</Text>
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
    paddingVertical: 18,
    paddingHorizontal: 15,
    alignItems: 'center',
    width: '48%',
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  dateTimeLabel: {
    fontSize: 12,
    color: '#666',
    marginTop: 8,
  },
  dateTimeValue: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 5,
    textAlign: 'center',
  },
});