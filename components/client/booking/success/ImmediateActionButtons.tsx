// LimpeJaApp/app/(client)/bookings/components/success/ImmediateActionButtons.tsx
import React, { useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Platform, Animated, Easing } from 'react-native';
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
  // Animações de entrada para a seção
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const translateYAnim = useRef(new Animated.Value(20)).current;
  const scaleAnim = useRef(new Animated.Value(0.95)).current;

  // Animações para os botões
  const button1ScaleAnim = useRef(new Animated.Value(1)).current;
  const button2ScaleAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 500,
        delay: 600, // Atraso para aparecer depois da seção PIX
        easing: Easing.out(Easing.ease),
        useNativeDriver: true,
      }),
      Animated.timing(translateYAnim, {
        toValue: 0,
        duration: 500,
        delay: 600,
        easing: Easing.out(Easing.ease),
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: 500,
        delay: 600,
        easing: Easing.out(Easing.ease),
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const onPressInButton = (animValue: Animated.Value) => {
    Animated.spring(animValue, {
      toValue: 0.95,
      useNativeDriver: true,
    }).start();
  };

  const onPressOutButton = (animValue: Animated.Value) => {
    Animated.spring(animValue, {
      toValue: 1,
      friction: 3,
      tension: 40,
      useNativeDriver: true,
    }).start();
  };

  return (
    <Animated.View
      style={[
        styles.actionButtonsContainerImmediate,
        { opacity: fadeAnim, transform: [{ translateY: translateYAnim }, { scale: scaleAnim }] },
      ]}
    >
      <TouchableOpacity
        style={[styles.actionButtonImmediate, { transform: [{ scale: button1ScaleAnim }] }]}
        onPress={onAddToCalendar}
        onPressIn={() => onPressInButton(button1ScaleAnim)}
        onPressOut={() => onPressOutButton(button1ScaleAnim)}
      >
        <Ionicons name="calendar-outline" size={20} color={headerPrimaryColor} />
        <Text style={styles.actionButtonImmediateText}>Adicionar ao Calendário</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.actionButtonImmediate, { transform: [{ scale: button2ScaleAnim }] }]}
        onPress={onContactProvider}
        onPressIn={() => onPressInButton(button2ScaleAnim)}
        onPressOut={() => onPressOutButton(button2ScaleAnim)}
      >
        <Ionicons name="chatbubbles-outline" size={20} color={headerPrimaryColor} />
        <Text style={styles.actionButtonImmediateText}>Contatar Prestador</Text>
      </TouchableOpacity>
    </Animated.View>
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
    color: '#4A90E2',
    marginLeft: 5,
  },
});