// app/(provider)/verify-account/facial-recognition.tsx
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import * as ImagePicker from 'expo-image-picker';
import React, { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Alert, Animated, Image, Platform, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import verificationService from '../../../../services/verificationService';

// Importações das novas imagens
const FACIAL_PLACEHOLDER_IMAGE = require('../../../../assets/images/facial-Photoroom.png');

// Paleta de cores (repetida para clareza)
const Colors = {
  primary: '#007AFF',
  primaryLight: '#EBF3FF',
  primaryGradientStart: '#007AFF',
  primaryGradientEnd: '#40C0F0',
  background: '#F8F9FA',
  cardBackground: '#FFFFFF',
  textPrimary: '#2D3748',
  textSecondary: '#6C757D',
  success: '#28A745',
  error: '#DC3545',
  warning: '#FFC107',
  info: '#17A2B8',
  lightBlueBorder: '#B3D9FF',
  successBg: '#E8F5E9',
  errorBg: '#FFEBEE',
};

interface FacialRecognitionProps {
  onComplete: (data: { selfieWithDocument: string | null }) => void;
  isLoading: boolean;
  initialSelfieWithDocument?: string | null;
}

export default function FacialRecognitionScreen({ onComplete, isLoading, initialSelfieWithDocument }: FacialRecognitionProps) {
  const [selfieWithDocument, setSelfieWithDocument] = useState<string | null>(initialSelfieWithDocument || null);
  const [selfieError, setSelfieError] = useState<string | null>(null);
  const [submissionStatus, setSubmissionStatus] = useState<'none' | 'pending' | 'success' | 'failed'>('none');
  const [isSelfieValid, setIsSelfieValid] = useState(false);

  const buttonScale = useRef(new Animated.Value(1)).current;
  const contentFade = useRef(new Animated.Value(0)).current;
  const contentSlide = useRef(new Animated.Value(20)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(contentFade, { toValue: 1, duration: 600, useNativeDriver: true, delay: 100 }),
      Animated.timing(contentSlide, { toValue: 0, duration: 600, useNativeDriver: true, delay: 100 }),
    ]).start();

    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1.1, duration: 800, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1, duration: 800, useNativeDriver: true }),
      ])
    ).start();
  }, [contentFade, contentSlide, pulseAnim]);

  useEffect(() => {
    if (!selfieWithDocument) {
      setSelfieError("Por favor, envie sua selfie segurando o documento.");
      setIsSelfieValid(false);
    } else {
      setSelfieError(null);
      setIsSelfieValid(true);
    }
  }, [selfieWithDocument]);

  const handlePressIn = () => Animated.spring(buttonScale, { toValue: 0.95, useNativeDriver: true }).start();
  const handlePressOut = () => Animated.spring(buttonScale, { toValue: 1, friction: 3, tension: 40, useNativeDriver: true }).start();

  const pickImage = async (setImage: React.Dispatch<React.SetStateAction<string | null>>) => {
    setSelfieError(null);
    if (Platform.OS === 'ios' || Platform.OS === 'android') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images, // Corrigido para MediaTypeOptions para compatibilidade
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.8,
    });
    if (!result.canceled) {
      setImage(result.assets[0].uri);
    }
  };

  const takePhoto = async (setImage: React.Dispatch<React.SetStateAction<string | null>>) => {
    setSelfieError(null);
    if (Platform.OS === 'ios' || Platform.OS === 'android') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    const permissionResult = await ImagePicker.requestCameraPermissionsAsync();
    if (permissionResult.granted === false) {
      Alert.alert("Permissão Necessária", "Você precisa permitir o acesso à câmera para tirar fotos.");
      return;
    }
    let result = await ImagePicker.launchCameraAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images, // Corrigido para MediaTypeOptions para compatibilidade
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.8,
    });
    if (!result.canceled) {
      setImage(result.assets[0].uri);
    }
  };

  const handleSubmitSelfie = async () => {
    if (Platform.OS === 'ios' || Platform.OS === 'android') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    if (!isSelfieValid) {
      setSelfieError("Por favor, envie sua selfie segurando o documento.");
      return;
    }
    setSubmissionStatus('pending');
    try {
      if (selfieWithDocument) {
        await verificationService.uploadSelfie(selfieWithDocument);
      }
      setSubmissionStatus('success');
      onComplete({ selfieWithDocument });
    } catch (error: any) {
      setSubmissionStatus('failed');
      setSelfieError(error.message || "Erro ao fazer upload da selfie. Tente novamente.");
    }
  };

  // === CORREÇÃO AQUI: Lógica de habilitação do botão ===
  // O botão deve estar habilitado se a selfie for válida E não houver nenhuma submissão em andamento (pending).
  // `isLoading` (vindo de props) também deve ser considerado.
  const isNextButtonEnabled = isSelfieValid && !isLoading && submissionStatus !== 'pending';


  return (
    <Animated.View style={[styles.container, { opacity: contentFade, transform: [{ translateY: contentSlide }] }]}>
      <View style={styles.header}>
        {/* Substituído Ionicons pela logo2.png */}
        
        <Text style={styles.title}>Selfie com Documento</Text> {/* Título atualizado para clareza */}
        <Text style={styles.description}>
          Tire uma selfie clara segurando seu documento de identidade ao lado do rosto. Esta foto será usada para confirmar sua identidade.
        </Text>
      </View>

      {/* Removido o estilo 'card' do View principal */}
      <View style={styles.contentWrapper}>
        
        <View style={styles.imageUploadWrapper}>
          {selfieWithDocument ? (
            <Image source={{ uri: selfieWithDocument }} style={styles.uploadedImage} />
          ) : (
            // Substituído Ionicons pela imagem facial.png
            <Image source={FACIAL_PLACEHOLDER_IMAGE} style={styles.facialPlaceholderImage} />
          )}
          <View style={styles.imageUploadButtons}>
            <TouchableOpacity style={styles.uploadButton} onPress={() => takePhoto(setSelfieWithDocument)} disabled={isLoading || submissionStatus === 'success'}>
              <Ionicons name="camera-outline" size={24} color="#fff" />
              <Text style={styles.uploadButtonText}>Tirar Foto</Text>
            </TouchableOpacity>
            {/* Botão "Galeria" removido para forçar tirar foto, ou pode ser readicionado se permitido */}
            {/* <TouchableOpacity style={styles.uploadButton} onPress={() => pickImage(setSelfieWithDocument)} disabled={isLoading || submissionStatus === 'success'}>
              <Ionicons name="folder-open-outline" size={24} color="#fff" />
              <Text style={styles.uploadButtonText}>Galeria</Text>
            </TouchableOpacity> */}
          </View>
        </View>

        {selfieError && <Text style={styles.errorMessage}>{selfieError}</Text>}

        <Animated.View style={{ transform: [{ scale: buttonScale }] }}>
          <TouchableOpacity
            style={[styles.submitButton, (!isNextButtonEnabled) && styles.buttonDisabled]}
            onPress={handleSubmitSelfie}
            onPressIn={handlePressIn}
            onPressOut={handlePressOut}
            disabled={!isNextButtonEnabled} // Usando a nova lógica de habilitação
          >
            {isLoading || submissionStatus === 'pending' ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text style={styles.submitButtonText}>Enviar Selfie</Text>
            )}
          </TouchableOpacity>
        </Animated.View>

        {submissionStatus !== 'none' && (
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
              {submissionStatus === 'pending' && "Enviando selfie..."}
              {submissionStatus === 'success' && "Selfie enviada com sucesso!"}
              {submissionStatus === 'failed' && "Falha no envio da selfie. Tente novamente."}
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
    marginBottom: 10,
  },
  headerLogo: { // Novo estilo para a logo no cabeçalho
    width: 280, // Ajuste o tamanho conforme necessário
    height: 200, // Ajuste o tamanho conforme necessário
    resizeMode: 'contain',
    marginBottom: 5,
    bottom: 30,
  },
  title: {
    fontSize: 24,
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
  // Removido o estilo 'card' e criado 'contentWrapper' para manter o layout sem o card visual
  contentWrapper: {
    width: '100%',
    maxWidth: 400,
    alignItems: 'center',
    // Não tem background, sombra ou borda aqui
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.textPrimary,
    alignSelf: 'flex-start',
    marginBottom: 8,
    marginTop: 15,
  },
  inputWrapper: { // Não usado diretamente, mas mantido se for um estilo global
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
  input: { // Não usado diretamente, mas mantido se for um estilo global
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
  submitButton: {
    backgroundColor: Colors.primaryGradientStart,
    borderRadius: 10,
    paddingVertical: 8,
    paddingHorizontal: 35,
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 15,
    elevation: 10,
    marginTop: 20,
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
  imageUploadWrapper: {
    flexDirection: 'column',
    alignItems: 'center',
    
    borderRadius: 10,
    paddingVertical: 20,
    marginBottom: 1,
    width: '100%',
    
  },
  uploadedImage: {
    width: '100%',
    height: 180,
    borderRadius: 8,
    resizeMode: 'cover',
    marginBottom: 5,
    borderWidth: 1,
    borderColor: Colors.textSecondary,
  },
  facialPlaceholderImage: {
    width: 200,
    height: 300,
    resizeMode: 'contain',
    marginBottom: 15,
    marginTop: -40,
  },
  imageUploadButtons: {
    flexDirection: 'row',
    justifyContent: 'center',
    width: '70%',
  },
  uploadButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.primary,
    paddingVertical: 10,
    paddingHorizontal: 15,
    borderRadius: 20,
    marginHorizontal: 5,
    flex: 1,
    justifyContent: 'center',
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 5,
    elevation: 5,
  },
  uploadButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    marginLeft: 8,
    fontWeight: '600',
  },
});