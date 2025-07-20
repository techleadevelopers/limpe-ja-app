// app/(auth)/provider-register/verification/document-upload.tsx
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import * as ImagePicker from 'expo-image-picker';
import { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Alert, Animated, Image, Platform, StyleSheet, Text, TouchableOpacity, View } from 'react-native'; // Added Platform
import { DocumentPhotoType } from '../../../../backend-cleaning/src/verification/dto/upload-document.dto';
import AnimatedErrorMessage from '../../../../components/schedule/manager/AnimatedErrorMessage';
import colors from '../../../../constants/Colors';
import { SIZES } from '../../../../constants/theme';
import verificationService from '../../../../services/verificationService';

// Importações das novas imagens para uso nesta tela
const FACE_ICON = require('../../../../assets/images/face.png'); // Imagem para o cabeçalho do DocumentUploadScreen e FacialRecognitionScreen
const PARTE_FRENTE_IMAGE = require('../../../../assets/images/partefrente.png'); // Imagem para o placeholder da frente do documento
const PARTE_TRAS_IMAGE = require('../../../../assets/images/partetras.png'); // Imagem para o placeholder do verso do documento
const FACIAL_PLACEHOLDER_IMAGE = require('../../../../assets/images/facial.png'); // Imagem para o placeholder da selfie (assumindo que 'facial.png' é o arquivo correto)


const Colors = colors.light;

interface DocumentUploadProps {
  onComplete: (data: { documentPhotoFront: string | null; documentPhotoBack: string | null }) => void;
  isLoading: boolean;
  initialDocumentPhotoFront?: string | null;
  initialDocumentPhotoBack?: string | null;
}

export default function DocumentUploadScreen({
  onComplete,
  isLoading,
  initialDocumentPhotoFront,
  initialDocumentPhotoBack,
}: DocumentUploadProps) {
  const [documentPhotoFront, setDocumentPhotoFront] = useState<string | null>(initialDocumentPhotoFront || null);
  const [documentPhotoBack, setDocumentPhotoBack] = useState<string | null>(initialDocumentPhotoBack || null);
  const [frontError, setFrontError] = useState<string | null>(null);
  const [backError, setBackError] = useState<string | null>(null);
  const [submissionStatus, setSubmissionStatus] = useState<'none' | 'pending' | 'success' | 'failed'>('none');
  // New state to store validation result for button
  const [areDocumentsValid, setAreDocumentsValid] = useState(false);

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

  // Effect to validate documents whenever photos change
  useEffect(() => {
    let isValid = true;
    if (!documentPhotoFront) {
      setFrontError("Por favor, envie a frente do seu documento.");
      isValid = false;
    } else {
      setFrontError(null);
    }
    if (!documentPhotoBack) {
      setBackError("Por favor, envie o verso do seu documento.");
      isValid = false;
    } else {
      setBackError(null);
    }
    setAreDocumentsValid(isValid); // Update the state that controls the button
  }, [documentPhotoFront, documentPhotoBack]); // Dependencies on photo URIs

  const handlePressIn = () => Animated.spring(buttonScale, { toValue: 0.95, useNativeDriver: true }).start();
  const handlePressOut = () => Animated.spring(buttonScale, { toValue: 1, friction: 3, tension: 40, useNativeDriver: true }).start();

  const pickImage = async (setImage: React.Dispatch<React.SetStateAction<string | null>>, setError: React.Dispatch<React.SetStateAction<string | null>>) => {
    setError(null);
    if (Platform.OS === 'ios' || Platform.OS === 'android') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
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

  const takePhoto = async (setImage: React.Dispatch<React.SetStateAction<string | null>>, setError: React.Dispatch<React.SetStateAction<string | null>>) => {
    setError(null);
    if (Platform.OS === 'ios' || Platform.OS === 'android') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
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

  const handleSubmitDocuments = async () => {
    if (Platform.OS === 'ios' || Platform.OS === 'android') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    // Use the state variable for validation
    if (!areDocumentsValid) {
      // Re-run validation to ensure errors are displayed immediately on submit attempt
      // if the user tries to submit without completing all fields
      let isValidOnSubmit = true;
      if (!documentPhotoFront) {
        setFrontError("Por favor, envie a frente do seu documento.");
        isValidOnSubmit = false;
      }
      if (!documentPhotoBack) {
        setBackError("Por favor, envie o verso do seu documento.");
        isValidOnSubmit = false;
      }
      if (!isValidOnSubmit) return;
    }
    setSubmissionStatus('pending');
    try {
      if (documentPhotoFront) {
        await verificationService.uploadDocumentPhoto(documentPhotoFront, DocumentPhotoType.FRONT);
      }
      if (documentPhotoBack) {
        await verificationService.uploadDocumentPhoto(documentPhotoBack, DocumentPhotoType.BACK);
      }
      setSubmissionStatus('success');
      onComplete({ documentPhotoFront, documentPhotoBack });
    } catch (error: any) {
      setSubmissionStatus('failed');
      setFrontError(error.message || "Erro ao fazer upload dos documentos. Tente novamente.");
      setBackError(error.message || "Erro ao fazer upload dos documentos. Tente novamente.");
    }
  };

  // The button's disabled state now uses the `areDocumentsValid` state
  const isNextButtonEnabled = areDocumentsValid && !isLoading && submissionStatus !== 'pending';

  return (
    <Animated.View style={[styles.container, { opacity: contentFade, transform: [{ translateY: contentSlide }] }]}>
      <View style={styles.header}>
        <Animated.View style={{ transform: [{ scale: pulseAnim }] }}>
          {/* Using FACE_ICON for the header icon */}
          <Image source={FACE_ICON} style={styles.headerIcon} />
        </Animated.View>
        <Text style={styles.title}>Envio de Documentos</Text>
        <Text style={styles.description}>
          Precisamos de fotos nítidas da frente e do verso do seu documento de identidade (RG ou CNH).
        </Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.label}>Frente do Documento</Text>
        <View style={styles.imageUploadWrapper}>
          {documentPhotoFront ? (
            <Image source={{ uri: documentPhotoFront }} style={styles.uploadedImage} />
          ) : (
            // Using PARTE_FRENTE_IMAGE for the front document placeholder
            <Image source={PARTE_FRENTE_IMAGE} style={styles.placeholderImage} />
          )}
          <View style={styles.imageUploadButtons}>
            <TouchableOpacity style={styles.uploadButton} onPress={() => takePhoto(setDocumentPhotoFront, setFrontError)} disabled={isLoading || submissionStatus === 'success'}>
              <Ionicons name="camera-outline" size={24} color="#fff" />
              <Text style={styles.uploadButtonText}>Tirar Foto</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.uploadButton} onPress={() => pickImage(setDocumentPhotoFront, setFrontError)} disabled={isLoading || submissionStatus === 'success'}>
              <Ionicons name="folder-open-outline" size={24} color="#fff" />
              <Text style={styles.uploadButtonText}>Galeria</Text>
            </TouchableOpacity>
          </View>
        </View>
        {frontError && <AnimatedErrorMessage message={frontError} isVisible={!!frontError} />}

        <Text style={styles.label}>Verso do Documento</Text>
        <View style={styles.imageUploadWrapper}>
          {documentPhotoBack ? (
            <Image source={{ uri: documentPhotoBack }} style={styles.uploadedImage} />
          ) : (
            // Using PARTE_TRAS_IMAGE for the back document placeholder
            <Image source={PARTE_TRAS_IMAGE} style={styles.placeholderImage} />
          )}
          <View style={styles.imageUploadButtons}>
            <TouchableOpacity style={styles.uploadButton} onPress={() => takePhoto(setDocumentPhotoBack, setBackError)} disabled={isLoading || submissionStatus === 'success'}>
              <Ionicons name="camera-outline" size={24} color="#fff" />
              <Text style={styles.uploadButtonText}>Tirar Foto</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.uploadButton} onPress={() => pickImage(setDocumentPhotoBack, setBackError)} disabled={isLoading || submissionStatus === 'success'}>
              <Ionicons name="folder-open-outline" size={24} color="#fff" />
              <Text style={styles.uploadButtonText}>Galeria</Text>
            </TouchableOpacity>
          </View>
        </View>
        {backError && <AnimatedErrorMessage message={backError} isVisible={!!backError} />}

        <Animated.View style={{ transform: [{ scale: buttonScale }] }}>
          <TouchableOpacity
            style={[styles.submitButton, (!isNextButtonEnabled) && styles.buttonDisabled]}
            onPress={handleSubmitDocuments}
            onPressIn={handlePressIn}
            onPressOut={handlePressOut}
            disabled={!isNextButtonEnabled}
          >
            {isLoading || submissionStatus === 'pending' ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text style={styles.submitButtonText}>Próxima Etapa</Text>
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
              color={submissionStatus === 'success' ? Colors.secondary :
                    submissionStatus === 'failed' ? Colors.error : Colors.info}
            />
            <Text style={[styles.statusText,
                  submissionStatus === 'success' ? { color: Colors.secondary } :
                  submissionStatus === 'failed' ? { color: Colors.error } : { color: Colors.info }]}>
              {submissionStatus === 'pending' && "Enviando documentos..."}
              {submissionStatus === 'success' && "Documentos enviados com sucesso!"}
              {submissionStatus === 'failed' && "Falha no envio dos documentos. Tente novamente."}
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
    padding: SIZES.paddingSmall,
    backgroundColor: Colors.background,
  },
  header: {
    alignItems: 'center',
    marginBottom: SIZES.padding,
    marginTop: SIZES.padding * 8,
  },
  // Novo estilo para o ícone do cabeçalho
  headerIcon: {
    width: 200, // Ajuste o tamanho conforme necessário
    height: 200, // Ajuste o tamanho conforme necessário
    resizeMode: 'contain',
  },
  title: {
    fontSize: SIZES.h1 - 4,
    fontWeight: 'bold',
    color: Colors.textPrimary,
    marginTop: SIZES.base * 2,
    marginBottom: SIZES.base,
    textAlign: 'center',
  },
  description: {
    fontSize: SIZES.body3,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: SIZES.body3 + 6,
  },
  card: {
    backgroundColor: Colors.cardBackground,
    borderRadius: SIZES.radius,
    padding: SIZES.padding,
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
    fontSize: SIZES.body3,
    fontWeight: '600',
    color: Colors.textPrimary,
    alignSelf: 'flex-start',
    marginBottom: SIZES.base,
    marginTop: SIZES.base * 2,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.primaryLight,
    borderRadius: SIZES.radius,
    height: 50,
    marginBottom: SIZES.base * 2,
    paddingHorizontal: SIZES.paddingSmall,
    borderWidth: 1,
    borderColor: Colors.lightBlueBorder,
    width: '100%',
  },
  inputIcon: {
    marginRight: SIZES.base,
  },
  input: {
    flex: 1,
    fontSize: SIZES.body3,
    color: Colors.textPrimary,
  },
  errorMessage: {
    color: Colors.error,
    fontSize: SIZES.body4,
    marginBottom: SIZES.base * 2,
    alignSelf: 'flex-start',
  },
  submitButton: {
    backgroundColor: Colors.primaryGradientStart,
    borderRadius: SIZES.radius,
    paddingVertical: SIZES.paddingSmall,
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 15,
    elevation: 10,
    marginTop: SIZES.padding,
  },
  submitButtonText: {
    color: '#FFFFFF',
    fontSize: SIZES.h3,
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
    paddingVertical: SIZES.base * 1.5,
    paddingHorizontal: SIZES.paddingSmall,
    borderRadius: SIZES.radius,
    marginTop: SIZES.padding,
    width: '100%',
    justifyContent: 'center',
    backgroundColor: Colors.primaryLight,
    borderWidth: 1,
    borderColor: Colors.lightBlueBorder,
  },
  statusSuccess: {
    backgroundColor: Colors.successBg,
    borderColor: Colors.secondary,
  },
  statusFailed: {
    backgroundColor: Colors.errorBg,
    borderColor: Colors.error,
  },
  statusText: {
    fontSize: SIZES.body4,
    fontWeight: '600',
    marginLeft: SIZES.base,
    color: Colors.textPrimary,
  },
  imageUploadWrapper: {
    flexDirection: 'column',
    alignItems: 'center',
    backgroundColor: Colors.primaryLight,
    borderRadius: SIZES.radius,
    paddingVertical: SIZES.paddingSmall,
    marginBottom: SIZES.base * 2,
    width: '100%',
    borderWidth: 1,
    borderColor: Colors.lightBlueBorder,
  },
  uploadedImage: {
    width: '70%',
    height: 160,
    borderRadius: SIZES.radius / 2,
    resizeMode: 'cover',
    marginBottom: SIZES.base * 2,
    borderWidth: 1,
    borderColor: Colors.textSecondary,
  },
  // Novo estilo para as imagens de placeholder
  placeholderImage: {
    width: '90%', // Ajuste o tamanho conforme necessário
    height: 130, // Ajuste o tamanho conforme necessário
    resizeMode: 'contain', // Use 'contain' para não cortar a imagem se ela tiver proporções diferentes
    marginBottom: SIZES.base * 2,
    opacity: 0.6, // Opacifica para parecer um placeholder
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
    paddingVertical: SIZES.base * 1.5,
    paddingHorizontal: SIZES.paddingSmall,
    borderRadius: 20,
    marginHorizontal: SIZES.base / 2,
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
    fontSize: SIZES.body4,
    marginLeft: SIZES.base,
    fontWeight: '600',
  },
});