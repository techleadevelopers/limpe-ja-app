// LimpeJaApp/app/(common)/safety/panic.tsx
import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert, ActivityIndicator, Animated, Easing } from 'react-native';
import * as Location from 'expo-location';
import { useMutation } from '@tanstack/react-query';
import { reportPanic } from '../../../services/safetyService';
import { ReportPanicDto, PanicType } from '../../../types/backend/safety';
import { router } from 'expo-router';

export default function PanicScreen() {
  const [countdown, setCountdown] = useState(5);
  const [isCounting, setIsCounting] = useState(false);
  const [location, setLocation] = useState<Location.LocationObjectCoords | null>(null);

  // Animações
  const headerAnim = useRef(new Animated.Value(0)).current;
  const descriptionAnim = useRef(new Animated.Value(0)).current;
  const locationStatusAnim = useRef(new Animated.Value(0)).current;
  const buttonAnim = useRef(new Animated.Value(0)).current; // Para o botão principal/countdown
  const warningTextAnim = useRef(new Animated.Value(0)).current;

  const panicButtonScaleAnim = useRef(new Animated.Value(1)).current; // Para feedback de toque no botão principal
  const cancelButtonScaleAnim = useRef(new Animated.Value(1)).current; // Para feedback de toque no botão cancelar
  const countdownPulseAnim = useRef(new Animated.Value(1)).current; // Para o pulso do contador

  const reportPanicMutation = useMutation({
    mutationFn: (data: ReportPanicDto) => reportPanic(data),
    onSuccess: () => {
      Alert.alert('Alerta Enviado', 'Seu alerta de pânico foi enviado à equipe de segurança. Ajuda está a caminho.');
      router.back();
    },
    onError: (error: any) => {
      Alert.alert('Erro', `Não foi possível enviar o alerta: ${error.message || 'Erro desconhecido'}`);
      setIsCounting(false); // Allow retrying
      // Reset animations on error
      Animated.parallel([
        Animated.timing(panicButtonScaleAnim, { toValue: 1, duration: 200, useNativeDriver: true }),
        Animated.timing(cancelButtonScaleAnim, { toValue: 1, duration: 200, useNativeDriver: true }),
        Animated.timing(countdownPulseAnim, { toValue: 1, duration: 200, useNativeDriver: true }),
      ]).start();
    },
  });

  useEffect(() => {
    (async () => {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permissão de Localização Negada', 'Para sua segurança, precisamos da sua localização para enviar um alerta de pânico.');
        return;
      }
      let currentLocation = await Location.getCurrentPositionAsync({});
      setLocation(currentLocation.coords);
    })();

    // Animações de entrada da tela
    Animated.stagger(150, [
      Animated.timing(headerAnim, { toValue: 1, duration: 500, easing: Easing.out(Easing.ease), useNativeDriver: true }),
      Animated.timing(descriptionAnim, { toValue: 1, duration: 500, easing: Easing.out(Easing.ease), useNativeDriver: true }),
      Animated.timing(locationStatusAnim, { toValue: 1, duration: 500, easing: Easing.out(Easing.ease), useNativeDriver: true }),
      Animated.timing(buttonAnim, { toValue: 1, duration: 600, easing: Easing.out(Easing.ease), useNativeDriver: true }),
      Animated.timing(warningTextAnim, { toValue: 1, duration: 500, easing: Easing.out(Easing.ease), useNativeDriver: true }),
    ]).start();
  }, []);

  useEffect(() => {
    let timer: ReturnType<typeof setInterval>;
    if (isCounting && countdown > 0) {
      timer = setInterval(() => {
        setCountdown((prev) => prev - 1);
      }, 1000);
      // Iniciar pulso do contador
      Animated.loop(
        Animated.sequence([
          Animated.timing(countdownPulseAnim, { toValue: 1.1, duration: 400, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
          Animated.timing(countdownPulseAnim, { toValue: 1, duration: 400, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
        ])
      ).start();
    } else if (isCounting && countdown === 0) {
      handleSendPanic();
      countdownPulseAnim.stopAnimation(); // Parar o pulso ao zerar
      countdownPulseAnim.setValue(1); // Resetar o valor
    } else if (!isCounting) {
      countdownPulseAnim.stopAnimation(); // Parar o pulso ao cancelar
      countdownPulseAnim.setValue(1); // Resetar o valor
    }
    return () => clearInterval(timer);
  }, [isCounting, countdown, location, countdownPulseAnim]);

  const handleInitiatePanic = () => {
    if (!location) {
      Alert.alert('Localização Não Disponível', 'Aguarde enquanto obtemos sua localização ou verifique as permissões.');
      return;
    }
    setIsCounting(true);
    setCountdown(5); // Reset countdown
  };

  const handleCancelPanic = () => {
    setIsCounting(false);
    setCountdown(5);
    Alert.alert('Alerta Cancelado', 'O envio do alerta de pânico foi cancelado.');
  };

  const handleSendPanic = () => {
    if (!location) {
      Alert.alert('Erro', 'Localização não disponível para enviar o alerta.');
      setIsCounting(false);
      return;
    }

    const panicData: ReportPanicDto = {
      type: PanicType.OTHER, // Or allow user to select type
      latitude: location.latitude,
      longitude: location.longitude,
      message: 'Alerta de pânico acionado automaticamente.',
    };
    reportPanicMutation.mutate(panicData);
  };

  // Feedback de toque para botões
  const onPressInButton = (anim: Animated.Value) => { Animated.spring(anim, { toValue: 0.95, useNativeDriver: true }).start(); };
  const onPressOutButton = (anim: Animated.Value) => { Animated.spring(anim, { toValue: 1, friction: 3, tension: 40, useNativeDriver: true }).start(); };

  return (
    <View style={styles.container}>
      <Animated.Text style={[styles.header, { opacity: headerAnim, transform: [{ translateY: headerAnim.interpolate({ inputRange: [0, 1], outputRange: [-20, 0] }) }] }]}>Botão de Pânico</Animated.Text>
      <Animated.Text style={[styles.description, { opacity: descriptionAnim, transform: [{ translateY: descriptionAnim.interpolate({ inputRange: [0, 1], outputRange: [-10, 0] }) }] }]}>
        Em caso de emergência, pressione o botão abaixo. Um alerta será enviado imediatamente à nossa equipe de segurança com sua localização.
      </Animated.Text>

      {!location && (
        <Animated.View style={[styles.locationStatus, { opacity: locationStatusAnim }]}>
          <ActivityIndicator size="small" color="#007bff" />
          <Text style={styles.locationText}>Obtendo sua localização...</Text>
        </Animated.View>
      )}
      {location && (
        <Animated.View style={[styles.locationStatus, { opacity: locationStatusAnim }]}>
          <Text style={styles.locationText}>Localização obtida: {location.latitude.toFixed(4)}, {location.longitude.toFixed(4)}</Text>
        </Animated.View>
      )}

      {isCounting ? (
        <Animated.View style={[styles.countdownContainer, { opacity: buttonAnim, transform: [{ scale: countdownPulseAnim }] }]}>
          <Text style={styles.countdownText}>{countdown}</Text>
          <Text style={styles.countdownLabel}>Alerta será enviado em...</Text>
          <TouchableOpacity
            style={[styles.button, styles.cancelButton, { transform: [{ scale: cancelButtonScaleAnim }] }]}
            onPress={handleCancelPanic}
            onPressIn={() => onPressInButton(cancelButtonScaleAnim)}
            onPressOut={() => onPressOutButton(cancelButtonScaleAnim)}
            disabled={reportPanicMutation.isPending}
          >
            <Text style={styles.buttonText}>Cancelar</Text>
          </TouchableOpacity>
        </Animated.View>
      ) : (
        <TouchableOpacity
          style={[styles.button, styles.panicButton, { opacity: buttonAnim, transform: [{ scale: panicButtonScaleAnim }] }]}
          onPress={handleInitiatePanic}
          onPressIn={() => onPressInButton(panicButtonScaleAnim)}
          onPressOut={() => onPressOutButton(panicButtonScaleAnim)}
          disabled={!location || reportPanicMutation.isPending}
        >
          {reportPanicMutation.isPending ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.buttonText}>ACIONAR PÂNICO</Text>
          )}
        </TouchableOpacity>
      )}

      <Animated.Text style={[styles.warningText, { opacity: warningTextAnim }]}>
        Use este recurso apenas em situações de emergência real. O uso indevido pode resultar em penalidades.
      </Animated.Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#f8f8f8',
  },
  header: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#dc3545',
    marginBottom: 20,
  },
  description: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 40,
    color: '#555',
    lineHeight: 24,
  },
  locationStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  locationText: {
    fontSize: 14,
    color: '#777',
    marginLeft: 5,
  },
  button: {
    width: 250,
    height: 250,
    borderRadius: 125,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 10,
  },
  panicButton: {
    backgroundColor: '#dc3545',
  },
  cancelButton: {
    backgroundColor: '#6c757d',
    width: 180,
    height: 60,
    borderRadius: 30,
    marginTop: 30,
  },
  buttonText: {
    color: '#fff',
    fontSize: 22,
    fontWeight: 'bold',
  },
  countdownContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    width: 250,
    height: 250,
    borderRadius: 125,
    backgroundColor: '#ffc107',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 10,
  },
  countdownText: {
    fontSize: 80,
    fontWeight: 'bold',
    color: '#fff',
  },
  countdownLabel: {
    fontSize: 18,
    color: '#fff',
    marginTop: -10,
  },
  warningText: {
    fontSize: 12,
    color: '#888',
    textAlign: 'center',
    marginTop: 40,
    paddingHorizontal: 20,
  },
});