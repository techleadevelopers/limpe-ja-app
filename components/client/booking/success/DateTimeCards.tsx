// LimpeJaApp/app/(client)/bookings/components/success/DateTimeCards.tsx
import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, ColorValue, Animated, Easing } from 'react-native';
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
  const gradientColors = [
    'rgba(173, 216, 230, 0.25)',
    'rgba(65, 153, 225, 0.29)',
    'rgba(133, 167, 231, 0.32)',
  ] as const;

  // Animações de entrada para cada cartão
  const card1FadeAnim = useRef(new Animated.Value(0)).current;
  const card1TranslateYAnim = useRef(new Animated.Value(20)).current;
  const card1ScaleAnim = useRef(new Animated.Value(0.95)).current;

  const card2FadeAnim = useRef(new Animated.Value(0)).current;
  const card2TranslateYAnim = useRef(new Animated.Value(20)).current;
  const card2ScaleAnim = useRef(new Animated.Value(0.95)).current;

  useEffect(() => {
    // Animação para o primeiro cartão (Data)
    Animated.parallel([
      Animated.timing(card1FadeAnim, {
        toValue: 1,
        duration: 500,
        delay: 200, // Atraso para aparecer depois da seção de detalhes
        easing: Easing.out(Easing.ease),
        useNativeDriver: true,
      }),
      Animated.timing(card1TranslateYAnim, {
        toValue: 0,
        duration: 500,
        delay: 200,
        easing: Easing.out(Easing.ease),
        useNativeDriver: true,
      }),
      Animated.timing(card1ScaleAnim, {
        toValue: 1,
        duration: 500,
        delay: 200,
        easing: Easing.out(Easing.ease),
        useNativeDriver: true,
      }),
    ]).start();

    // Animação para o segundo cartão (Hora) com um pequeno atraso em relação ao primeiro
    Animated.parallel([
      Animated.timing(card2FadeAnim, {
        toValue: 1,
        duration: 500,
        delay: 300, // Atraso adicional
        easing: Easing.out(Easing.ease),
        useNativeDriver: true,
      }),
      Animated.timing(card2TranslateYAnim, {
        toValue: 0,
        duration: 500,
        delay: 300,
        easing: Easing.out(Easing.ease),
        useNativeDriver: true,
      }),
      Animated.timing(card2ScaleAnim, {
        toValue: 1,
        duration: 500,
        delay: 300,
        easing: Easing.out(Easing.ease),
        useNativeDriver: true,
      }),
    ]).start();
  }, []);


  return (
    <View style={styles.dateTimeContainer}>
      {/* Primeiro Card: Data */}
      <Animated.View
        style={[
          styles.dateTimeCard,
          { opacity: card1FadeAnim, transform: [{ translateY: card1TranslateYAnim }, { scale: card1ScaleAnim }] },
        ]}
      >
        <LinearGradient
          colors={gradientColors}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.gradientBackground}
        />
        <Ionicons name="calendar-outline" size={20} color={iconColor} style={styles.contentOverlay} />
        <Text style={[styles.dateTimeLabel, styles.contentOverlay]}>Data</Text>
        <Text style={[styles.dateTimeValue, styles.contentOverlay]}>{formattedBookingDate}</Text>
      </Animated.View>

      {/* Segundo Card: Hora */}
      <Animated.View
        style={[
          styles.dateTimeCard,
          { opacity: card2FadeAnim, transform: [{ translateY: card2TranslateYAnim }, { scale: card2ScaleAnim }] },
        ]}
      >
        <LinearGradient
          colors={gradientColors}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.gradientBackground}
        />
        <Ionicons name="time-outline" size={20} color={iconColor} style={styles.contentOverlay} />
        <Text style={[styles.dateTimeLabel, styles.contentOverlay]}>Hora</Text>
        <Text style={[styles.dateTimeValue, styles.contentOverlay]}>{formattedBookingTime}</Text>
      </Animated.View>
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