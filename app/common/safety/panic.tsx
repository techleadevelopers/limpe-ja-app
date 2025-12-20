// LimpeJaApp/app/common/safety/panic.tsx
import React, { useState, useEffect, useRef, useCallback } from 'react'; // Adicionado useCallback
import { View, Text, TouchableOpacity, StyleSheet, Alert, ActivityIndicator, Animated, Easing } from 'react-native';
import type * as Location from 'expo-location';
import { ensureLocationPermission, getCurrentPosition } from '../../../services/locationService';
import { useMutation } from '@tanstack/react-query';
import { reportPanic } from '../../../services/safetyService';
import { ReportPanicDto, PanicType } from '../../../types/backend/safety';
import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';

export default function PanicScreen() {
  const [countdown, setCountdown] = useState(5);
  const [isCounting, setIsCounting] = useState(false);
  const [location, setLocation] = useState<Location.LocationObjectCoords | null>(null);
  const { t } = useTranslation();

  // Animações
  const headerAnim = useRef(new Animated.Value(0)).current;
  const descriptionAnim = useRef(new Animated.Value(0)).current;
  const locationStatusAnim = useRef(new Animated.Value(0)).current;
  const buttonAnim = useRef(new Animated.Value(0)).current;
  const warningTextAnim = useRef(new Animated.Value(0)).current;

  const panicButtonScaleAnim = useRef(new Animated.Value(1)).current;
  const cancelButtonScaleAnim = useRef(new Animated.Value(1)).current;
  const countdownPulseAnim = useRef(new Animated.Value(1)).current;

  const reportPanicMutation = useMutation({
    mutationFn: (data: ReportPanicDto) => reportPanic(data),
    onSuccess: () => {
      Alert.alert(t('safety.panic.alert_sent_title'), t('safety.panic.alert_sent_message'));
      router.back();
    },
    onError: (error: any) => {
      Alert.alert(t('common.error'), `${t('safety.panic.send_alert_error')}: ${error.message || t('common.unknown_error')}`);
      setIsCounting(false);
      // Reset animations on error
      Animated.parallel([
        Animated.timing(panicButtonScaleAnim, { toValue: 1, duration: 200, useNativeDriver: true }),
        Animated.timing(cancelButtonScaleAnim, { toValue: 1, duration: 200, useNativeDriver: true }),
        Animated.timing(countdownPulseAnim, { toValue: 1, duration: 200, useNativeDriver: true }),
      ]).start();
    },
  });

  // Definido handleSendPanic antes do useEffect
  const handleSendPanic = useCallback(() => {
    if (!location) {
      Alert.alert(t('common.error'), t('safety.panic.location_not_available'));
      setIsCounting(false);
      return;
    }

    const panicData: ReportPanicDto = {
      type: PanicType.OTHER,
      latitude: location.latitude,
      longitude: location.longitude,
      message: t('safety.panic.automatic_alert_message'),
    };
    reportPanicMutation.mutate(panicData);
  }, [location, reportPanicMutation, t]);

  useEffect(() => {
    (async () => {
      const ok = await ensureLocationPermission();
      if (!ok) {
        Alert.alert(t('safety.panic.location_permission_denied'), t('safety.panic.location_permission_message'));
        return;
      }
      const coords = await getCurrentPosition();
      if (coords) setLocation(coords);
    })();

    // Animações de entrada da tela
    Animated.stagger(150, [
      Animated.timing(headerAnim, { toValue: 1, duration: 500, easing: Easing.out(Easing.ease), useNativeDriver: true }),
      Animated.timing(descriptionAnim, { toValue: 1, duration: 500, easing: Easing.out(Easing.ease), useNativeDriver: true }),
      Animated.timing(locationStatusAnim, { toValue: 1, duration: 500, easing: Easing.out(Easing.ease), useNativeDriver: true }),
      Animated.timing(buttonAnim, { toValue: 1, duration: 600, easing: Easing.out(Easing.ease), useNativeDriver: true }),
      Animated.timing(warningTextAnim, { toValue: 1, duration: 500, easing: Easing.out(Easing.ease), useNativeDriver: true }),
    ]).start();
  }, [t, headerAnim, descriptionAnim, locationStatusAnim, buttonAnim, warningTextAnim]);

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
      countdownPulseAnim.stopAnimation();
      countdownPulseAnim.setValue(1);
    } else if (!isCounting) {
      countdownPulseAnim.stopAnimation();
      countdownPulseAnim.setValue(1);
    }
    return () => clearInterval(timer);
  }, [isCounting, countdown, location, countdownPulseAnim, handleSendPanic]); // handleSendPanic é uma dependência do useCallback

  const handleInitiatePanic = () => {
    if (!location) {
      Alert.alert(t('safety.panic.location_not_available_title'), t('safety.panic.location_not_available_message'));
      return;
    }
    setIsCounting(true);
    setCountdown(5);
  };

  const handleCancelPanic = () => {
    setIsCounting(false);
    setCountdown(5);
    Alert.alert(t('safety.panic.alert_cancelled_title'), t('safety.panic.alert_cancelled_message'));
  };

  // Feedback de toque para botões
  const onPressInButton = (anim: Animated.Value) => { Animated.spring(anim, { toValue: 0.95, useNativeDriver: true }).start(); };
  const onPressOutButton = (anim: Animated.Value) => { Animated.spring(anim, { toValue: 1, friction: 3, tension: 40, useNativeDriver: true }).start(); };

  return (
    <View style={styles.container}>
      <Animated.Text style={[styles.header, { opacity: headerAnim, transform: [{ translateY: headerAnim.interpolate({ inputRange: [0, 1], outputRange: [-20, 0] }) }] }]}>{t('safety.panic.button_title')}</Animated.Text>
      <Animated.Text style={[styles.description, { opacity: descriptionAnim, transform: [{ translateY: descriptionAnim.interpolate({ inputRange: [0, 1], outputRange: [-10, 0] }) }] }]}>
        {t('safety.panic.description')}
      </Animated.Text>

      {!location && (
        <Animated.View style={[styles.locationStatus, { opacity: locationStatusAnim }]}>
          <ActivityIndicator size="small" color="#007bff" />
          <Text style={styles.locationText}>{t('safety.panic.getting_location')}</Text>
        </Animated.View>
      )}
      {location && (
        <Animated.View style={[styles.locationStatus, { opacity: locationStatusAnim }]}>
          <Text style={styles.locationText}>{t('safety.panic.location_obtained')}: {location.latitude.toFixed(4)}, {location.longitude.toFixed(4)}</Text>
        </Animated.View>
      )}

      {isCounting ? (
        <Animated.View style={[styles.countdownContainer, { opacity: buttonAnim, transform: [{ scale: countdownPulseAnim }] }]}>
          <Text style={styles.countdownText}>{countdown}</Text>
          <Text style={styles.countdownLabel}>{t('safety.panic.alert_will_be_sent')}</Text>
          <TouchableOpacity
            style={[styles.button, styles.cancelButton, { transform: [{ scale: cancelButtonScaleAnim }] }]}
            onPress={handleCancelPanic}
            onPressIn={() => onPressInButton(cancelButtonScaleAnim)}
            onPressOut={() => onPressOutButton(cancelButtonScaleAnim)}
            disabled={reportPanicMutation.isPending}
          >
            <Text style={styles.buttonText}>{t('common.cancel')}</Text>
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
            <Text style={styles.buttonText}>{t('safety.panic.activate_panic')}</Text>
          )}
        </TouchableOpacity>
      )}

      <Animated.Text style={[styles.warningText, { opacity: warningTextAnim }]}>
        {t('safety.panic.warning_text')}
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
