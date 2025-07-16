// LimpeJaApp/app/(client)/bookings/components/success/ImmediateActionButtons.tsx
import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface ImmediateActionButtonsProps {
  onAddToCalendar: () => void;
  onContactProvider: () => void;
  headerPrimaryColor: string;
}

export default function ImmediateActionButtons({
  onAddToCalendar,
  onContactProvider,
  headerPrimaryColor,
}: ImmediateActionButtonsProps) {
  return (
    <View style={styles.actionButtonsContainerImmediate}>
      <TouchableOpacity style={styles.actionButtonImmediate} onPress={onAddToCalendar}>
        <Ionicons name="calendar-outline" size={20} color={headerPrimaryColor} />
        <Text style={styles.actionButtonImmediateText}>Adicionar ao Calendário</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.actionButtonImmediate} onPress={onContactProvider}>
        <Ionicons name="chatbubbles-outline" size={20} color={headerPrimaryColor} />
        <Text style={styles.actionButtonImmediateText}>Contatar Prestador</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  actionButtonsContainerImmediate: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
    marginTop: 15,
    marginBottom: 20,
    paddingHorizontal: 20,
  },
  actionButtonImmediate: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#E8F5E9',
    borderRadius: 10,
    paddingVertical: 4,
    marginHorizontal: 8,
    ...Platform.select({
      ios: {
        shadowColor: 'rgba(0,0,0,0.1)',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 3,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  actionButtonImmediateText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#4A90E2', // Using headerPrimaryColor directly
    marginLeft: 5,
  },
});