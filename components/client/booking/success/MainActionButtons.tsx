// LimpeJaApp/app/(client)/bookings/components/success/MainActionButtons.tsx
import React, { useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Platform, Animated, Easing } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { AppColors, AppShadows } from '../../../../constants/appStyles'; // Importe AppColors e AppShadows

interface MainActionButtonsProps {
  onGoToBookings: () => void;
  onGoHome: () => void;
  headerPrimaryColor: string;
}

export default function MainActionButtons({
  onGoToBookings,
  onGoHome,
  headerPrimaryColor,
}: MainActionButtonsProps) {
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
        delay: 900, // Atraso para aparecer depois da seção de fidelidade
        easing: Easing.out(Easing.ease),
        useNativeDriver: true,
      }),
      Animated.timing(translateYAnim, {
        toValue: 0,
        duration: 500,
        delay: 900,
        easing: Easing.out(Easing.ease),
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: 500,
        delay: 900,
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
        styles.actionButtonsContainerNew,
        { opacity: fadeAnim, transform: [{ translateY: translateYAnim }, { scale: scaleAnim }] },
      ]}
    >
      <TouchableOpacity
        style={[styles.downloadButton, { backgroundColor: AppColors.primaryInteractive, transform: [{ scale: button1ScaleAnim }] }]}
        onPress={onGoToBookings}
        onPressIn={() => onPressInButton(button1ScaleAnim)}
        onPressOut={() => onPressOutButton(button1ScaleAnim)}
      >
        <Ionicons name="list-outline" size={18} color={AppColors.white} style={{ marginRight: 10 }} />
        <Text style={styles.downloadButtonText}>Ver Meus Agendamentos</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.downloadButton, styles.secondaryDownloadButton, { transform: [{ scale: button2ScaleAnim }] }]}
        onPress={onGoHome}
        onPressIn={() => onPressInButton(button2ScaleAnim)}
        onPressOut={() => onPressOutButton(button2ScaleAnim)}
      >
        <Ionicons name="home-outline" size={18} color={AppColors.primaryInteractive} style={{ marginRight: 10 }} />
        <Text style={[styles.downloadButtonText, { color: AppColors.primaryInteractive }]}>Voltar para o Início</Text>
      </TouchableOpacity>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  actionButtonsContainerNew: {
    width: '98%',
    alignItems: 'center',
    paddingVertical: 15,
    bottom: 13,
    marginBottom: 0,
  },
  downloadButton: {
    flexDirection: 'row',
    paddingVertical: 6,
    paddingHorizontal: 25,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    width: '90%',
    marginBottom: 20,
    marginTop :-1,
    ...AppShadows.medium, // Usando AppShadows
  },
  downloadButtonText: {
    color: AppColors.white, // Usando AppColors
    fontSize: 13,
    fontWeight: '600',
  },
  secondaryDownloadButton: {
    backgroundColor: AppColors.white, // Usando AppColors
    bottom: 12,
    ...AppShadows.small, // Usando AppShadows
  },
});