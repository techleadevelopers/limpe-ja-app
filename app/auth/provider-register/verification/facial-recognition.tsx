// app/provider/verify-account/facial-recognition.tsx
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import * as ImagePicker from 'expo-image-picker';
import { useEffect, useRef, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    Animated,
    Image,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from 'react-native';
import verificationService from '../../../../services/verificationService';

// Importações das novas imagens
const FACIAL_PLACEHOLDER_IMAGE = require('../../../../assets/images/facial.png');

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

export default function FacialRecognitionScreen({
  onComplete,
  isLoading,
  initialSelfieWithDocument,
}: FacialRecognitionProps) {
  const [selfieWithDocument, setSelfieWithDocument] = useState<string | null>(
    initialSelfieWithDocument || null
  );
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
      setSelfieError('Por favor, envie sua selfie segurando o documento.');
      setIsSelfieValid(false);
    } else {
      setSelfieError(null);
      setIsSelfieValid(true);
    }
  }, [selfieWithDocument]);

  const handlePressIn = () => Animated.spring(buttonScale, { toValue: 0.95, useNativeDriver: true }).start();
  const handlePressOut = () =>
    Animated.spring(buttonScale, { toValue: 1, friction: 3, tension: 40, useNativeDriver: true }).start();

  // ✅ A lógica que você tentou usar no botão (agora existe)
  const isNextButtonEnabled = isSelfieValid && !isLoading && submissionStatus !== 'pending';

  const requestCameraPermissionIfNeeded = async (): Promise<boolean> => {
    // iOS/Android: ImagePicker já pede permissões, mas mantemos explícito
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permissão necessária', 'Precisamos de acesso à câmera para tirar a selfie.');
      return false;
    }
    return true;
  };

  const requestMediaPermissionIfNeeded = async (): Promise<boolean> => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permissão necessária', 'Precisamos de acesso à galeria para selecionar a selfie.');
      return false;
    }
    return true;
  };

  const handlePickSelfie = async (source: 'camera' | 'gallery') => {
    try {
      await Haptics.selectionAsync();

      if (source === 'camera') {
        const ok = await requestCameraPermissionIfNeeded();
        if (!ok) return;

        const res = await ImagePicker.launchCameraAsync({
          mediaTypes: ImagePicker.MediaTypeOptions.Images,
          allowsEditing: true,
          quality: 0.85,
        });

        if (res.canceled) return;
        const uri = res.assets?.[0]?.uri ?? null;
        setSelfieWithDocument(uri);
        setSubmissionStatus('none');
        return;
      }

      const ok = await requestMediaPermissionIfNeeded();
      if (!ok) return;

      const res = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        quality: 0.85,
      });

      if (res.canceled) return;
      const uri = res.assets?.[0]?.uri ?? null;
      setSelfieWithDocument(uri);
      setSubmissionStatus('none');
    } catch (err) {
      console.error(err);
      Alert.alert('Erro', 'Não foi possível selecionar a imagem. Tente novamente.');
    }
  };

  // ✅ Agora existe e resolve o erro TS2304
  const handleSubmitSelfie = async () => {
    try {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

      if (!selfieWithDocument) {
        setSelfieError('Por favor, envie sua selfie segurando o documento.');
        setSubmissionStatus('failed');
        return;
      }

      setSubmissionStatus('pending');

      // Tenta enviar via service se existir um método compatível;
      // se não existir, segue com onComplete para o fluxo pai tratar o upload.
      const svc: any = verificationService as any;

      if (typeof svc.uploadSelfieWithDocument === 'function') {
        await svc.uploadSelfieWithDocument(selfieWithDocument);
      } else if (typeof svc.submitSelfieWithDocument === 'function') {
        await svc.submitSelfieWithDocument({ selfieWithDocument });
      }

      setSubmissionStatus('success');

      // Notifica o fluxo pai
      onComplete({ selfieWithDocument });
    } catch (err) {
      console.error(err);
      setSubmissionStatus('failed');
      Alert.alert('Falha no envio', 'Não foi possível enviar sua selfie agora. Tente novamente.');
    }
  };

  return (
    <View style={styles.container}>
      <Animated.View style={{ opacity: contentFade, transform: [{ translateY: contentSlide }], width: '100%' }}>
        <View style={styles.header}>
          <Text style={styles.title}>Reconhecimento facial</Text>
          <Text style={styles.description}>
            Envie uma selfie segurando o documento para finalizar sua verificação.
          </Text>
        </View>

        <View style={styles.contentWrapper}>
          <Text style={styles.label}>Selfie com documento</Text>

          <View style={styles.imageUploadWrapper}>
            {selfieWithDocument ? (
              <Image source={{ uri: selfieWithDocument }} style={styles.uploadedImage} />
            ) : (
              <Animated.View style={{ transform: [{ scale: pulseAnim }] }}>
                <Image source={FACIAL_PLACEHOLDER_IMAGE} style={styles.facialPlaceholderImage} />
              </Animated.View>
            )}

            <View style={styles.imageUploadButtons}>
              <TouchableOpacity style={styles.uploadButton} onPress={() => handlePickSelfie('camera')}>
                <Ionicons name="camera" size={18} color="#FFFFFF" />
                <Text style={styles.uploadButtonText}>Câmera</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.uploadButton} onPress={() => handlePickSelfie('gallery')}>
                <Ionicons name="image" size={18} color="#FFFFFF" />
                <Text style={styles.uploadButtonText}>Galeria</Text>
              </TouchableOpacity>
            </View>
          </View>

          {!!selfieError && <Text style={styles.errorMessage}>{selfieError}</Text>}

          <Animated.View style={{ transform: [{ scale: buttonScale }], width: '100%' }}>
            <TouchableOpacity
              style={[styles.submitButton, !isNextButtonEnabled && styles.buttonDisabled]}
              onPress={handleSubmitSelfie}
              onPressIn={handlePressIn}
              onPressOut={handlePressOut}
              disabled={!isNextButtonEnabled}
            >
              {isLoading || submissionStatus === 'pending' ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <Text style={styles.submitButtonText}>Enviar Selfie</Text>
              )}
            </TouchableOpacity>
          </Animated.View>

          {submissionStatus !== 'none' && (
            <View
              style={[
                styles.statusBadge,
                submissionStatus === 'success'
                  ? styles.statusSuccess
                  : submissionStatus === 'failed'
                    ? styles.statusFailed
                    : {},
              ]}
            >
              <Ionicons
                name={
                  submissionStatus === 'success'
                    ? 'checkmark-circle'
                    : submissionStatus === 'failed'
                      ? 'warning'
                      : 'information-circle'
                }
                size={20}
                color={
                  submissionStatus === 'success'
                    ? Colors.success
                    : submissionStatus === 'failed'
                      ? Colors.error
                      : Colors.info
                }
              />
              <Text
                style={[
                  styles.statusText,
                  submissionStatus === 'success'
                    ? { color: Colors.success }
                    : submissionStatus === 'failed'
                      ? { color: Colors.error }
                      : { color: Colors.info },
                ]}
              >
                {submissionStatus === 'pending' && 'Enviando selfie...'}
                {submissionStatus === 'success' && 'Selfie enviada com sucesso!'}
                {submissionStatus === 'failed' && 'Falha no envio da selfie. Tente novamente.'}
              </Text>
            </View>
          )}
        </View>
      </Animated.View>
    </View>
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
  headerLogo: {
    width: 280,
    height: 200,
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
  contentWrapper: {
    width: '100%',
    maxWidth: 400,
    alignItems: 'center',
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.textPrimary,
    alignSelf: 'flex-start',
    marginBottom: 8,
    marginTop: 15,
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
    elevation: 0,
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
    elevation: 0,
  },
  uploadButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    marginLeft: 8,
    fontWeight: '600',
  },
});
