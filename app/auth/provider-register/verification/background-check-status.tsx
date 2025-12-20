// app/auth/provider-register/background-check-status.tsx
import { Ionicons } from '@expo/vector-icons'; //
import * as Haptics from 'expo-haptics'; //
import React, { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Animated, Platform, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native'; // // Added Platform
import verificationService from '../../../../services/verificationService'; //

// Paleta de cores (repetida para clareza, em um projeto real viria de Colors.ts)
const Colors = {
  primary: '#007AFF', //
  primaryLight: '#EBF3FF', //
  primaryGradientStart: '#007AFF', //
  primaryGradientEnd: '#40C0F0', //
  background: '#F8F9FA', //
  cardBackground: '#FFFFFF', //
  textPrimary: '#2D3748', //
  textSecondary: '#6C757D', //
  success: '#28A745', //
  error: '#DC3545', //
  warning: '#FFC107', //
  info: '#17A2B8', //
  lightBlueBorder: '#B3D9FF', //
  successBg: '#E8F5E9', //
  errorBg: '#FFEBEE', //
};

interface BackgroundCheckStatusProps {
  onComplete: (data: { cpf: string }) => void; //
  isLoading: boolean; //
  initialCpf?: string; //
}

export default function BackgroundCheckStatusScreen({ onComplete, isLoading, initialCpf }: BackgroundCheckStatusProps) {
  const [cpf, setCpf] = useState(initialCpf || ''); //
  const [cpfError, setCpfError] = useState<string | null>(null); //
  const [isCpfSubmitted, setIsCpfSubmitted] = useState(false); //
  const [submissionStatus, setSubmissionStatus] = useState<'pending' | 'success' | 'failed' | null>(null); //
  const [isCpfValid, setIsCpfValid] = useState(false); // New state to store validation result

  const buttonScale = useRef(new Animated.Value(1)).current; //
  const contentFade = useRef(new Animated.Value(0)).current; //
  const contentSlide = useRef(new Animated.Value(20)).current; //

  useEffect(() => { //
    Animated.parallel([ //
      Animated.timing(contentFade, { toValue: 1, duration: 600, useNativeDriver: true, delay: 100 }), //
      Animated.timing(contentSlide, { toValue: 0, duration: 600, useNativeDriver: true, delay: 100 }), //
    ]).start(); //
  }, [contentFade, contentSlide]); //

  // Effect to validate CPF whenever 'cpf' changes
  useEffect(() => {
    const cleanedCpf = cpf.replace(/\D/g, '');
    const isValid = cleanedCpf.length === 11 && !isNaN(Number(cleanedCpf));
    setIsCpfValid(isValid); // Update the state

    if (!isValid && cleanedCpf.length > 0 && cleanedCpf.length < 11) {
        setCpfError("CPF inválido. Deve conter 11 dígitos numéricos.");
    } else if (!isValid && cleanedCpf.length === 0) {
        setCpfError(null); // Clear error if input is empty
    } else if (isValid) {
        setCpfError(null);
    }
  }, [cpf]); // Dependency on cpf ensures validation runs when cpf changes

  const handlePressIn = () => {
    if (Platform.OS === 'ios' || Platform.OS === 'android') { //
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); //
    }
    Animated.spring(buttonScale, { toValue: 0.95, useNativeDriver: true }).start(); //
  };

  const handlePressOut = () => {
    Animated.spring(buttonScale, { toValue: 1, friction: 3, tension: 40, useNativeDriver: true }).start(); //
  };

  const handleSubmitCpf = async () => {
    if (Platform.OS === 'ios' || Platform.OS === 'android') { //
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium); //
    }
    // Check if valid before proceeding
    if (!isCpfValid) {
        setCpfError("CPF inválido. Deve conter 11 dígitos numéricos.");
        return;
    }
    setSubmissionStatus('pending'); //
    try {
      await verificationService.submitCpf(cpf); //
      setSubmissionStatus('success'); //
      setIsCpfSubmitted(true); //
      onComplete({ cpf }); //
    } catch (error: any) {
      setSubmissionStatus('failed'); //
      setCpfError(error.message || "Erro ao submeter CPF. Tente novamente."); //
    }
  };

  return (
    <Animated.View style={[styles.container, { opacity: contentFade, transform: [{ translateY: contentSlide }] }]}>
      <View style={styles.header}>
        <Ionicons name="shield-checkmark-outline" size={60} color={Colors.primary} />
        <Text style={styles.title}>Verificação de Antecedentes</Text>
        <Text style={styles.description}>
          Para sua segurança e a de nossos clientes, precisamos verificar seu CPF.
        </Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.label}>CPF (apenas números)</Text>
        <View style={styles.inputWrapper}>
          <Ionicons name="document-text-outline" size={20} color={Colors.textSecondary} style={styles.inputIcon} />
          <TextInput
            style={styles.input}
            placeholder="000.000.000-00"
            placeholderTextColor={Colors.textSecondary}
            keyboardType="numeric"
            maxLength={11}
            value={cpf}
            onChangeText={(text) => { setCpf(text); /* Error clearing is now in useEffect */ }}
            editable={!isLoading && !isCpfSubmitted}
          />
        </View>
        {cpfError && <Text style={styles.errorMessage}>{cpfError}</Text>}

        <Text style={styles.consentText}>
          Ao prosseguir, você concorda que a LimpeJá realize uma consulta de antecedentes criminais em seu nome para fins de segurança da plataforma.
        </Text>

        <Animated.View style={{ transform: [{ scale: buttonScale }] }}>
          <TouchableOpacity
            style={[styles.submitButton, (!isCpfValid || isLoading || isCpfSubmitted) && styles.buttonDisabled]}
            onPress={handleSubmitCpf}
            onPressIn={handlePressIn}
            onPressOut={handlePressOut}
            disabled={!isCpfValid || isLoading || isCpfSubmitted}
          >
            {isLoading && submissionStatus === 'pending' ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text style={styles.submitButtonText}>
                {isCpfSubmitted ? "CPF Submetido" : "Submeter CPF para Análise"}
              </Text>
            )}
          </TouchableOpacity>
        </Animated.View>

        {submissionStatus && (
          <View style={[styles.statusBadge,
                        submissionStatus === 'success' ? styles.statusSuccess :
                        submissionStatus === 'failed' ? styles.statusFailed : {}]}>
            <Ionicons
              name={submissionStatus === 'success' ? "checkmark-circle" :
                    submissionStatus === 'failed' ? "warning" : "information-circle"}
              size={20}
              color={submissionStatus === 'success' ? Colors.success :
                     submissionStatus === 'failed' ? Colors.error : Colors.info}
            />
            <Text style={[styles.statusText,
                          submissionStatus === 'success' ? { color: Colors.success } :
                          submissionStatus === 'failed' ? { color: Colors.error } : { color: Colors.info }]}>
              {submissionStatus === 'pending' && "Analisando CPF..."}
              {submissionStatus === 'success' && "Consulta de CPF concluída! Prossiga."}
              {submissionStatus === 'failed' && "Problemas detectados no CPF. Tente novamente ou entre em contato."}
            </Text>
          </View>
        )}
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
    backgroundColor: Colors.background,
  },
  header: {
    alignItems: 'center',
    marginBottom: 30,
  },
  title: {
    fontSize: 26,
    fontWeight: 'bold',
    color: Colors.textPrimary,
    marginTop: 15,
    marginBottom: 10,
    textAlign: 'center',
  },
  description: {
    fontSize: 16,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
  },
  card: {
    backgroundColor: Colors.cardBackground,
    borderRadius: 15,
    padding: 25,
    width: '100%',
    maxWidth: 400,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.1,
    shadowRadius: 20,
    elevation: 8,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.primaryLight,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.textPrimary,
    alignSelf: 'flex-start',
    marginBottom: 8,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.primaryLight,
    borderRadius: 10,
    height: 50,
    marginBottom: 15,
    paddingHorizontal: 15,
    borderWidth: 1,
    borderColor: Colors.lightBlueBorder,
    width: '100%',
  },
  inputIcon: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: Colors.textPrimary,
  },
  errorMessage: {
    color: Colors.error,
    fontSize: 13,
    marginBottom: 15,
    alignSelf: 'flex-start',
  },
  consentText: {
    fontSize: 13,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginTop: 10,
    lineHeight: 18,
    marginBottom: 20,
  },
  submitButton: {
    backgroundColor: Colors.primaryGradientStart,
    borderRadius: 10,
    paddingVertical: 15,
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 15,
    elevation: 10,
  },
  submitButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
  buttonDisabled: {
    backgroundColor: '#C0DFFF',
    opacity: 0.7,
    elevation: 0,
    shadowOpacity: 0,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 15,
    borderRadius: 10,
    marginTop: 20,
    width: '100%',
    justifyContent: 'center',
    backgroundColor: Colors.primaryLight,
    borderWidth: 1,
    borderColor: Colors.lightBlueBorder,
  },
  statusSuccess: {
    backgroundColor: Colors.successBg,
    borderColor: Colors.success,
  },
  statusFailed: {
    backgroundColor: Colors.errorBg,
    borderColor: Colors.error,
  },
  statusText: {
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 10,
    color: Colors.textPrimary,
  },
});