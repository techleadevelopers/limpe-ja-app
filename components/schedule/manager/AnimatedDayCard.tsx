// app/provider/schedule/components/AnimatedDayCard.tsx
import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useRef } from 'react';
import { Animated, Platform, StyleSheet, Switch, Text, TouchableOpacity, View } from 'react-native'; // <--- CORRIGIDO: Adicionado Platform

// Importa o componente AnimatedTimeSlot
import AnimatedTimeSlot from './AnimatedTimeSlot'; //

interface TimeSlot {
  id: string;
  backendId?: string;
  startTime: string;
  endTime: string;
  hasError?: boolean;
  errorMessage?: string;
}

interface DailyAvailability {
  dayName: string;
  dayIndex: number;
  isAvailable: boolean;
  slots: TimeSlot[];
}

interface AnimatedDayCardProps {
  day: DailyAvailability;
  dayIdx: number;
  onToggleAvailability: (dayIndex: number, value: boolean) => void;
  onAddSlot: (dayIndex: number) => void;
  onOpenPicker: (dayIdx: number, slotId: string, mode: 'startTime' | 'endTime') => void;
  onRemoveSlot: (dayIndex: number, slotId: string) => void;
  delay: number;
}

const AnimatedDayCard: React.FC<AnimatedDayCardProps> = ({ day, dayIdx, onToggleAvailability, onAddSlot, onOpenPicker, onRemoveSlot, delay }) => {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(20)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 500,
        delay: delay,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 500,
        useNativeDriver: true,
      }),
    ]).start();
  }, [fadeAnim, slideAnim, delay]);

  return (
    <Animated.View style={[styles.dayCard, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
      <View style={styles.dayHeader}>
        <Text style={styles.dayName}>{day.dayName}</Text>
        <Switch
          trackColor={{ false: "#CED4DA", true: "#82c7ff" }}
          thumbColor={day.isAvailable ? "#007AFF" : "#f4f3f4"}
          ios_backgroundColor="#E9ECEF"
          onValueChange={(value) => onToggleAvailability(dayIdx, value)}
          value={day.isAvailable}
        />
      </View>

      {day.isAvailable && (
        <View style={styles.slotsContainer}>
          {day.slots.length === 0 && (
            <Text style={styles.noSlotsText}>Nenhum horário definido para este dia.</Text>
          )}
          {day.slots.map((slot, slotIndex) => (
            <AnimatedTimeSlot
              key={slot.id}
              slot={slot}
              onOpenPicker={(slotId, mode) => onOpenPicker(dayIdx, slotId, mode)}
              onRemove={(slotId) => onRemoveSlot(dayIdx, slotId)}
              delay={slotIndex * 50}
            />
          ))}
          <TouchableOpacity style={styles.addSlotButton} onPress={() => onAddSlot(dayIdx)}>
            <Ionicons name="add-circle-outline" size={22} color="#007AFF" />
            <Text style={styles.addSlotButtonText}>Adicionar Horário</Text>
          </TouchableOpacity>
        </View>
      )}
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  dayCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 15,
    marginBottom: 15,
    // Estilos de sombra para Android e iOS
    ...Platform.select({
      ios: { shadowColor: 'rgba(0,0,0,0.1)', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.15, shadowRadius: 6 },
      android: { elevation: 0 },
    }),
  },
  dayHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  dayName: { fontSize: 18, fontWeight: 'bold', color: '#343A40' },
  slotsContainer: { marginTop: 10, borderTopWidth: 1, borderTopColor: '#E9ECEF', paddingTop: 15 },
  noSlotsText: { textAlign: 'center', color: '#868E96', fontStyle: 'italic', paddingVertical: 10 },
  addSlotButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    marginTop: 10,
    backgroundColor: '#F8F9FA',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#DEE2E6',
    ...Platform.select({
      ios: { shadowColor: 'rgba(0,0,0,0.03)', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.1, shadowRadius: 2 },
      android: { elevation: 0 },
    }),
  },
  addSlotButtonText: { fontSize: 15, color: '#007AFF', marginLeft: 8, fontWeight: '600' },
});

export default AnimatedDayCard;