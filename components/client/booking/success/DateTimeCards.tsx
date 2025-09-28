// LimpeJaApp/app/(client)/bookings/components/success/DateTimeCards.tsx
import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, ColorValue, Animated, Easing } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { AppColors, AppShadows } from '../../../../constants/appStyles'; // Importe AppColors e AppShadows

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
    AppColors.primaryInteractive + '25', // Usando AppColors
    AppColors.primaryInteractive + '29', // Usando AppColors
    AppColors.primaryInteractive + '32', // Usando AppColors
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
    const anim1 = Animated.parallel([
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
    ]);
    anim1.start();

    // Animação para o segundo cartão (Hora) com um pequeno atraso em relação ao primeiro
    const anim2 = Animated.parallel([
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
    ]);
    anim2.start();

    return () => {
      anim1.stop();
      anim2.stop(); // Cleanup premium para performance
    };
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
        <Ionicons name="calendar-outline" size={20} color={AppColors.primaryInteractive} style={styles.contentOverlay} />
        <Text style={[styles.dateTimeLabel, styles.contentOverlay]} numberOfLines={1} maxFontSizeMultiplier={1.2}>Data</Text>
        <Text style={[styles.dateTimeValue, styles.contentOverlay]} numberOfLines={2} maxFontSizeMultiplier={1.2}>{formattedBookingDate}</Text>
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
        <Ionicons name="time-outline" size={20} color={AppColors.primaryInteractive} style={styles.contentOverlay} />
        <Text style={[styles.dateTimeLabel, styles.contentOverlay]} numberOfLines={1} maxFontSizeMultiplier={1.2}>Hora</Text>
        <Text style={[styles.dateTimeValue, styles.contentOverlay]} numberOfLines={1} maxFontSizeMultiplier={1.2}>{formattedBookingTime}</Text>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  dateTimeContainer: {
    flexDirection: 'row',
    justifyContent: 'space-evenly', // Alinhamento premium uniforme
    marginBottom: 25,
    paddingHorizontal: 8, // Espaçamento lógico sem gaps
  },
  dateTimeCard: {
    backgroundColor: AppColors.backgroundLight, // Usando AppColors
    borderRadius: 12,
    paddingVertical: 13,
    paddingHorizontal: 15,
    alignItems: 'center',
    width: '48%', // Ajustado para space-evenly sem overlap
    minHeight: 80, // Touch target confortável
    overflow: 'hidden',
    position: 'relative',
    ...AppShadows.medium, // Usando AppShadows
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
    color: AppColors.textAuxiliary, // Usando AppColors
    marginTop: 8,
  },
  dateTimeValue: {
    fontSize: 13,
    fontWeight: 'bold',
    color: AppColors.textBody, // Usando AppColors
    marginTop: 5,
    textAlign: 'center',
  },
});