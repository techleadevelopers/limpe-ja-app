// app/provider/schedule/components/AnimatedTimeSlot.tsx
import React, { useRef, useEffect, useState } from 'react';
import { Animated, StyleSheet, Text, TouchableOpacity, View, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

// Funções utilitárias (assumindo que serão importadas de um local comum)
// Precisamos das funções `parseTime` e `formatTime` do ManageAvailabilityScreen
interface TimeSlot {
  id: string;
  backendId?: string; // ID real do backend
  startTime: string;
  endTime: string;
  hasError?: boolean;
  errorMessage?: string;
}

interface AnimatedTimeSlotProps {
  slot: TimeSlot;
  onOpenPicker: (slotId: string, mode: 'startTime' | 'endTime') => void;
  onRemove: (slotId: string) => void;
  delay: number;
}

// Funções utilitárias duplicadas aqui para garantir que o componente funcione isoladamente.
// O ideal é que `parseTime` e `formatTime` venham de `utils/helpers.ts` se forem genéricas.
// Se forem específicas da disponibilidade, crie um `schedule-helpers.ts`
const parseTime = (timeString: string): Date => {
  const [hours, minutes] = timeString.split(':').map(Number);
  const date = new Date();
  date.setHours(hours, minutes, 0, 0);
  return date;
};

const AnimatedTimeSlot: React.FC<AnimatedTimeSlotProps> = ({ slot, onOpenPicker, onRemove, delay }) => {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(20)).current;
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const errorBorderAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 300,
        delay: delay,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 300,
        delay: delay,
        useNativeDriver: true,
      }),
    ]).start();
  }, [fadeAnim, slideAnim, delay]);

  useEffect(() => {
    Animated.timing(errorBorderAnim, {
      toValue: slot.hasError ? 1 : 0,
      duration: 200,
      useNativeDriver: false,
    }).start();
  }, [slot.hasError, errorBorderAnim]);

  const onPressInButton = () => { Animated.spring(scaleAnim, { toValue: 0.95, useNativeDriver: true }).start(); };
  const onPressOutButton = () => { Animated.spring(scaleAnim, { toValue: 1, friction: 3, tension: 40, useNativeDriver: true }).start(); };

  const handleRemove = () => {
    Alert.alert(
      "Remover Horário",
      `Tem certeza que deseja remover o horário das ${slot.startTime} às ${slot.endTime}?`,
      [
        { text: "Cancelar", style: "cancel" },
        { text: "Remover", style: "destructive", onPress: () => onRemove(slot.id) }
      ]
    );
  };

  const borderColor = errorBorderAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['#DEE2E6', '#F44336'], // De cinza para vermelho
  });

  return (
    <Animated.View style={[
      styles.slotItem,
      { opacity: fadeAnim, transform: [{ translateY: slideAnim }, { scale: scaleAnim }], borderColor: borderColor }
    ]}>
      <TouchableOpacity
        style={styles.timeButton}
        onPress={() => onOpenPicker(slot.id, 'startTime')}
        onPressIn={onPressInButton}
        onPressOut={onPressOutButton}
      >
        <Text style={styles.timeButtonText}>{slot.startTime}</Text>
      </TouchableOpacity>
      <Text style={styles.timeSeparator}>até</Text>
      <TouchableOpacity
        style={styles.timeButton}
        onPress={() => onOpenPicker(slot.id, 'endTime')}
        onPressIn={onPressInButton}
        onPressOut={onPressOutButton}
      >
        <Text style={styles.timeButtonText}>{slot.endTime}</Text>
      </TouchableOpacity>
      <TouchableOpacity onPress={handleRemove} style={styles.removeSlotButton}>
        <Ionicons name="trash-bin-outline" size={22} color="#F44336" />
      </TouchableOpacity>
      {slot.hasError && (
        <View style={styles.slotErrorContainer}>
          {/* AnimatedErrorMessage já está no mesmo diretório, ou pode ser importado */}
          <Text style={styles.errorMessageText}>{slot.errorMessage || "Erro no horário."}</Text>
        </View>
      )}
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  slotItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    justifyContent: 'space-between',
    backgroundColor: '#F8F9FA',
    borderRadius: 8,
    padding: 8,
    borderWidth: 1,
    borderColor: '#DEE2E6',
  },
  slotErrorContainer: {
    position: 'absolute',
    bottom: -20,
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  errorMessageText: { // Estilo para a mensagem de erro direto, sem componente separado
    fontSize: 12,
    color: '#F44336',
    marginTop: 2,
  },
  timeButton: {
    backgroundColor: '#E9F5FF',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#B3D4FC',
    minWidth: 75,
    alignItems: 'center',
  },
  timeButtonText: {
    fontSize: 15,
    fontWeight: '500',
    color: '#0056b3',
  },
  timeSeparator: { marginHorizontal: 8, fontSize: 15, color: '#6C757D' },
  removeSlotButton: { padding: 5, marginLeft: 10 },
});

export default AnimatedTimeSlot;