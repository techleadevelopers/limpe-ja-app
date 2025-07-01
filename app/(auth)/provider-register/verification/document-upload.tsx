// app/(provider)/verify-account/document-upload.tsx
import React, { useState, useRef, useEffect } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, TouchableOpacity, Animated, Image, Alert } from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as ImagePicker from 'expo-image-picker';
import * as Haptics from 'expo-haptics';
import { verificationService } from '../../../services/verificationService'; // Seu serviço real

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

interface DocumentUploadProps {
  onComplete: (data: { documentPhotoFront: string | null; documentPhotoBack: string | null }) => void;
  isLoading: boolean;
  initialDocumentPhotoFront?: string | null;
  initialDocumentPhotoBack?: string | null;
}

export default function DocumentUploadScreen({ onComplete, isLoading, initialDocumentPhotoFront, initialDocumentPhotoBack }: DocumentUploadProps) {
  const [documentPhotoFront, setDocumentPhotoFront] = useState<string | null>(initialDocumentPhotoFront || null);
  const [documentPhotoBack, setDocumentPhotoBack] = useState<string | null>(initialDocumentPhotoBack || null);
  const [documentError, setDocumentError] = useState<string | null>(null);
  const [uploadingStage, setUploadingStage] = useState<'none' | 'front_pending' | 'back_pending' | 'complete' | 'failed'>('none');

  const buttonScale = useRef(new Animated.Value(1)).current;
  const contentFade = useRef(new Animated.Value(0)).current;
  const contentSlide = useRef(new Animated.Value(20)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(contentFade, { toValue: 1, duration: 600, useNativeDriver: true, delay: 100 }),
      Animated.timing(contentSlide, { toValue: 0, duration: 600, useNativeDriver: true, delay: 100 }),
    ]).start();
  }, [contentFade, contentSlide]);

  const handlePressIn = () => Animated.spring(buttonScale, { toValue: 0.95, useNativeDriver: true }).start();
  const handlePressOut = () => Animated.spring(buttonScale, { toValue: 1, friction: 3, tension: 40, useNativeDriver: true }).start();

  const pickImage = async (setImage: React.Dispatch<React.SetStateAction<string | null>>) => {
    setDocumentError(null);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.8,
    });
    if (!result.canceled) {
      setImage(result.assets[0].uri);
    }
  };

  const takePhoto = async (setImage: React.Dispatch<React.SetStateAction<string | null>>) => {
    setDocumentError(null);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const permissionResult = await ImagePicker.requestCameraPermissionsAsync();
    if (permissionResult.granted === false) {
      Alert.alert("Permissão Necessária", "Você precisa permitir o acesso à câmera para tirar fotos.");
      return;
    }
    let result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.8,
    });
    if (!result.canceled) {
      setImage(result.assets[0].uri);
    }
  };

  const validateUploads = () => {
    if (!documentPhotoFront) {
      setDocumentError("Por favor, envie a foto da frente do seu documento.");
      return false;
    }
    if (!documentPhotoBack) {
      setDocumentError("Por favor, envie a foto do verso do seu documento.");
      return false;
    }
    setDocumentError(null);
    return true;
  };

  const handleSubmitDocuments = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    if (!validateUploads()) {
      return;
    }
    setUploadingStage('front_pending');
    try {
      // Mock de upload para o serviço de verificação
      // verificationService.uploadDocumentPhoto(providerId, file, type)
      await verificationService.uploadDocumentPhoto("mock-provider-id", documentPhotoFront!, 'FRONT');
      setUploadingStage('back_pending');
      await verificationService.uploadDocumentPhoto("mock-provider-id", documentPhotoBack!, 'BACK');
      setUploadingStage('complete');
      onComplete({ documentPhotoFront, documentPhotoBack });
    } catch (error: any) {
      setUploadingStage('failed');
      setDocumentError(error.message || "Erro ao fazer upload dos documentos. Tente novamente.");
    }
  };

  const isNextButtonEnabled = validateUploads() && !isLoading && uploadingStage !== 'complete';

  return (
    <Animated.View style={[styles.container, { opacity: contentFade, transform: [{ translateY: contentSlide }] }]}>
      <View style={styles.header}>
        <Ionicons name="finger-print-outline" size={60} color={Colors.primary} />
        <Text style={styles.title}>Documentos de Identidade</Text>
        <Text style={styles.description}>
          Envie fotos nítidas da frente e do verso do seu documento de identidade (RG ou CNH).
        </Text>
      </View>

      <View style={styles.card}>
        {/* Upload da Frente do Documento */}
        <Text style={styles.label}>Foto da Frente do Documento</Text>
        <View style={styles.imageUploadWrapper}>
          {documentPhotoFront ? (
            <Image source={{ uri: documentPhotoFront }} style={styles.uploadedImage} />
          ) : (
            <MaterialCommunityIcons name="card-account-details-outline" size={80} color={Colors.textSecondary} />
          )}
          <View style={styles.imageUploadButtons}>
            <TouchableOpacity style={styles.uploadButton} onPress={() => takePhoto(setDocumentPhotoFront)} disabled={isLoading || uploadingStage === 'complete'}>
              <Ionicons name="camera-outline" size={24} color="#fff" />
              <Text style={styles.uploadButtonText}>Tirar Foto</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.uploadButton} onPress={() => pickImage(setDocumentPhotoFront)} disabled={isLoading || uploadingStage === 'complete'}>
              <Ionicons name="folder-open-outline" size={24} color="#fff" />
              <Text style={styles.uploadButtonText}>Galeria</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Upload do Verso do Documento */}
        <Text style={styles.label}>Foto do Verso do Documento</Text>
        <View style={styles.imageUploadWrapper}>
          {documentPhotoBack ? (
            <Image source={{ uri: documentPhotoBack }} style={styles.uploadedImage} />
          ) : (
            <MaterialCommunityIcons name="card-account-details-outline" size={80} color={Colors.textSecondary} style={{ transform: [{ scaleX: -1 }] }} /> {/* Inverte para simular o verso */}
          )}
          <View style={styles.imageUploadButtons}>
            <TouchableOpacity style={styles.uploadButton} onPress={() => takePhoto(setDocumentPhotoBack)} disabled={isLoading || uploadingStage === 'complete'}>
              <Ionicons name="camera-outline" size={24} color="#fff" />
              <Text style={styles.uploadButtonText}>Tirar Foto</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.uploadButton} onPress={() => pickImage(setDocumentPhotoBack)} disabled={isLoading || uploadingStage === 'complete'}>
              <Ionicons name="folder-open-outline" size={24} color="#fff" />
              <Text style={styles.uploadButtonText}>Galeria</Text>
            </TouchableOpacity>
          </View>
        </View>

        {documentError && <Text style={styles.errorMessage}>{documentError}</Text>}

        <Animated.View style={{ transform: [{ scale: buttonScale }] }}>
          <TouchableOpacity
            style={[styles.submitButton, (!isNextButtonEnabled || isLoading) && styles.buttonDisabled]}
            onPress={handleSubmitDocuments}
            onPressIn={handlePressIn}
            onPressOut={handlePressOut}
            disabled={!isNextButtonEnabled || isLoading}
          >
            {isLoading || uploadingStage !== 'none' ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text style={styles.submitButtonText}>Enviar Documentos</Text>
            )}
          </TouchableOpacity>
        </Animated.View>

        {uploadingStage !== 'none' && (
          <View style={[styles.statusBadge,
                        uploadingStage === 'complete' ? styles.statusSuccess :
                        uploadingStage === 'failed' ? styles.statusFailed : {}]}>
            <Ionicons
              name={uploadingStage === 'complete' ? "checkmark-circle" :
                    uploadingStage === 'failed' ? "warning" : "information-circle"}
              size={20}
              color={uploadingStage === 'complete' ? Colors.success :
                     uploadingStage === 'failed' ? Colors.error : Colors.info}
            />
            <Text style={[styles.statusText,
                          uploadingStage === 'complete' ? { color: Colors.success } :
                          uploadingStage === 'failed' ? { color: Colors.error } : { color: Colors.info }]}>
              {uploadingStage === 'front_pending' && "Enviando frente do documento..."}
              {uploadingStage === 'back_pending' && "Enviando verso do documento..."}
              {uploadingStage === 'complete' && "Documentos enviados! Prossiga."}
              {uploadingStage === 'failed' && "Erro no upload dos documentos. Tente novamente."}
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
    marginTop: 15, // Espaçamento entre campos
  },
  inputWrapper: { // Reutilizado do verify-account para CPF
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
  consentText: { // Reutilizado, mas não para esta tela
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
  imageUploadWrapper: { // Novo estilo para o contêiner de upload de imagem
    flexDirection: 'column',
    alignItems: 'center',
    backgroundColor: Colors.primaryLight, // Fundo levemente azulado
    borderRadius: 10,
    paddingVertical: 20,
    marginBottom: 15, // Espaçamento entre os dois uploads de imagem
    width: '100%',
    borderWidth: 1,
    borderColor: Colors.lightBlueBorder,
  },
  uploadedImage: {
    width: '90%',
    height: 180,
    borderRadius: 8,
    resizeMode: 'cover', // Melhor para fotos de documento
    marginBottom: 15,
    borderWidth: 1,
    borderColor: Colors.textSecondary, // Borda para a imagem
  },
  imageUploadButtons: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '90%',
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