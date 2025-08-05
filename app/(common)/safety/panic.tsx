// LimpeJaApp/app/(common)/safety/panic.tsx
import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert, ActivityIndicator } from 'react-native';
import * as Location from 'expo-location';
import { useMutation } from '@tanstack/react-query';
import { reportPanic } from '../../../services/safetyService';
import { ReportPanicDto, PanicType } from '../../../types/backend/safety';
import { router } from 'expo-router';

export default function PanicScreen() {
  const [countdown, setCountdown] = useState(5);
  const [isCounting, setIsCounting] = useState(false);
  const [location, setLocation] = useState<Location.LocationObjectCoords | null>(null);

  const reportPanicMutation = useMutation({
    mutationFn: (data: ReportPanicDto) => reportPanic(data),
    onSuccess: () => {
      Alert.alert('Alerta Enviado', 'Seu alerta de pânico foi enviado à equipe de segurança. Ajuda está a caminho.');
      router.back();
    },
    onError: (error) => {
      Alert.alert('Erro', `Não foi possível enviar o alerta: ${error.message}`);
      setIsCounting(false); // Allow retrying
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
  }, []);

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (isCounting && countdown > 0) {
      timer = setInterval(() => {
        setCountdown((prev) => prev - 1);
      }, 1000);
    } else if (isCounting && countdown === 0) {
      handleSendPanic();
    }
    return () => clearInterval(timer);
  }, [isCounting, countdown, location]);

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

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Botão de Pânico</Text>
      <Text style={styles.description}>
        Em caso de emergência, pressione o botão abaixo. Um alerta será enviado imediatamente à nossa equipe de segurança com sua localização.
      </Text>

      {!location && (
        <View style={styles.locationStatus}>
          <ActivityIndicator size="small" color="#007bff" />
          <Text style={styles.locationText}>Obtendo sua localização...</Text>
        </View>
      )}
      {location && (
        <View style={styles.locationStatus}>
          <Text style={styles.locationText}>Localização obtida: {location.latitude.toFixed(4)}, {location.longitude.toFixed(4)}</Text>
        </View>
      )}

      {isCounting ? (
        <View style={styles.countdownContainer}>
          <Text style={styles.countdownText}>{countdown}</Text>
          <Text style={styles.countdownLabel}>Alerta será enviado em...</Text>
          <TouchableOpacity
            style={[styles.button, styles.cancelButton]}
            onPress={handleCancelPanic}
            disabled={reportPanicMutation.isPending}
          >
            <Text style={styles.buttonText}>Cancelar</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <TouchableOpacity
          style={[styles.button, styles.panicButton]}
          onPress={handleInitiatePanic}
          disabled={!location || reportPanicMutation.isPending}
        >
          {reportPanicMutation.isPending ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.buttonText}>ACIONAR PÂNICO</Text>
          )}
        </TouchableOpacity>
      )}

      <Text style={styles.warningText}>
        Use este recurso apenas em situações de emergência real. O uso indevido pode resultar em penalidades.
      </Text>
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