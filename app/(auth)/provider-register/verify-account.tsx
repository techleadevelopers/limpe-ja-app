// app/(provider)/verify-account.tsx
import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  Alert,
  TouchableOpacity,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Animated,
  StatusBar,
  Image,
} from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';

// Importações para os componentes de passo de verificação
import BackgroundCheckStatusScreen from './verify-account/background-check-status';
import DocumentUploadScreen from './verify-account/document-upload';
import FacialRecognitionScreen from './verify-account/facial-recognition';

// Importações de serviços e tipos (do seu projeto, certifique-se de que os caminhos estão corretos)
import { verificationService } from '../../services/verificationService'; // Seu serviço de verificação
import { UpdateProviderProfileDto } from '../../types/backend/providers'; // Para bio/pixKey (se usar aqui)
import { UserRole, VerificationStatus } from '@prisma/client'; // Importar do prisma/client
import { useAuth } from '../../contexts/AuthContext'; // Para obter providerId/userId
import ToastMessage from '../../../components/ui/ToastMessage'; // Seu componente ToastMessage

const LOGO_IMAGE = require('../../../assets/images/logo.png'); // Ajuste o caminho se necessário

// Paleta de cores para o design "clean blue light"
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
  overlay: 'rgba(0,0,0,0.4)',
  shimmer: 'rgba(255,255,255,0.4)',
  lightBlueBorder: '#B3D9FF', // Um azul para bordas sutis
  successBg: '#E8F5E9',
  errorBg: '#FFEBEE',
};


export default function VerifyAccountScreen() {
  const router = useRouter();
  const { user, updateUser } = useAuth(); // Para obter user.providerId e user.userId
  const providerId = user?.providerId; // Assumindo que providerId está no user do AuthContext
  const userId = user?.userId; // Assumindo que userId está no user do AuthContext

  const [isLoading, setIsLoading] = useState(false);
  const [toastMessage, setToastMessage] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);

  // Estados para cada etapa
  const [cpf, setCpf] = useState('');
  const [documentPhotoFront, setDocumentPhotoFront] = useState<string | null>(null);
  const [documentPhotoBack, setDocumentPhotoBack] = useState<string | null>(null); // Adicionado back
  const [selfieWithDocument, setSelfieWithDocument] = useState<string | null>(null);

  const [currentVerificationStep, setCurrentVerificationStep] = useState(0); // 0: Splash, 1: CPF, 2: Document Photo, 3: Selfie

  // Animações
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current; // Inicia mais abaixo
  const logoScale = useRef(new Animated.Value(0.8)).current;

  // Animação de entrada inicial da tela
  useEffect(() => {
    Animated.sequence([
      Animated.delay(500), // Pequeno delay antes de iniciar
      Animated.parallel([
        Animated.timing(fadeAnim, { toValue: 1, duration: 800, useNativeDriver: true }),
        Animated.timing(slideAnim, { toValue: 0, duration: 800, useNativeDriver: true }),
        Animated.spring(logoScale, { toValue: 1, friction: 3, useNativeDriver: true }),
      ]),
    ]).start(() => {
        // Após a animação de splash, transiciona para o primeiro passo
        setCurrentVerificationStep(1);
    });
  }, [fadeAnim, slideAnim, logoScale]);


  // Handler para avançar ou finalizar a verificação
  const handleStepCompletion = useCallback(async (data: any, step: number) => {
    setIsLoading(true);
    setToastMessage(null);

    try {
      if (!providerId) {
        throw new Error('ID do provedor não encontrado. Faça login novamente.');
      }

      if (step === 1) { // Dados do CPF
        setCpf(data.cpf);
        await verificationService.submitCpfForBackgroundCheck(providerId, data.cpf);
        setCurrentVerificationStep(2);
      } else if (step === 2) { // Upload de Documentos
        setDocumentPhotoFront(data.documentPhotoFront);
        setDocumentPhotoBack(data.documentPhotoBack);
        if (data.documentPhotoFront) await verificationService.uploadDocumentPhoto(providerId, data.documentPhotoFront, 'FRONT');
        if (data.documentPhotoBack) await verificationService.uploadDocumentPhoto(providerId, data.documentPhotoBack, 'BACK');
        setCurrentVerificationStep(3);
      } else if (step === 3) { // Selfie com Documento (Finaliza o fluxo de upload)
        setSelfieWithDocument(data.selfieWithDocument);
        if (data.selfieWithDocument) await verificationService.uploadSelfieWithDocument(providerId, data.selfieWithDocument);
        
        // Aqui, o backend já teria atualizado o status para PENDING_MANUAL_REVIEW ou APPROVED
        setToastMessage({ message: "Informações enviadas para análise!", type: "success" });
        Alert.alert(
          "Verificação Enviada!",
          "Suas informações estão sob análise. Você será notificado quando sua conta for ativada.",
          [{ text: "OK", onPress: () => router.replace('/(provider)/dashboard' as any) }]
        );
      }
    } catch (error: any) {
      console.error("Erro na verificação:", error);
      setToastMessage({ message: error.message || "Erro na verificação. Tente novamente.", type: "error" });
    } finally {
      setIsLoading(false);
    }
  }, [providerId, router]);


  // Renderização condicional das etapas
  const renderVerificationStep = () => {
    switch (currentVerificationStep) {
      case 0: // Splash Screen de verificação
        return (
          <View style={styles.splashContent}>
            <Animated.Image source={LOGO_IMAGE} style={[styles.splashLogo, { transform: [{ scale: logoScale }] }]} />
            <Animated.Text style={[styles.splashText, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
              Iniciando Verificação...
            </Animated.Text>
            <ActivityIndicator size="large" color={Colors.primary} style={styles.splashIndicator} />
          </View>
        );
      case 1:
        return (
          <BackgroundCheckStatusScreen
            onComplete={(data) => handleStepCompletion(data, 1)}
            isLoading={isLoading}
            initialCpf={cpf}
          />
        );
      case 2:
        return (
          <DocumentUploadScreen
            onComplete={(data) => handleStepCompletion(data, 2)}
            isLoading={isLoading}
            initialDocumentPhotoFront={documentPhotoFront}
            initialDocumentPhotoBack={documentPhotoBack}
          />
        );
      case 3:
        return (
          <FacialRecognitionScreen
            onComplete={(data) => handleStepCompletion(data, 3)}
            isLoading={isLoading}
            initialSelfieWithDocument={selfieWithDocument}
          />
        );
      default:
        return null;
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={styles.keyboardAvoidingContainer}
    >
      <StatusBar barStyle="dark-content" backgroundColor={Colors.background} />
      <Stack.Screen options={{ headerShown: false }} />

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContentContainer}
        keyboardShouldPersistTaps="handled"
      >
        <Animated.View style={[StyleSheet.absoluteFill, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
            {renderVerificationStep()}
        </Animated.View>
      </ScrollView>

      {toastMessage && (
        <ToastMessage
          message={toastMessage.message}
          type={toastMessage.type}
          onHide={() => setToastMessage(null)}
        />
      )}
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  keyboardAvoidingContainer: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  scrollContentContainer: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingBottom: 40,
    paddingHorizontal: 25,
  },
  splashContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  splashLogo: {
    width: 250,
    height: 250,
    resizeMode: 'contain',
    marginBottom: 20,
  },
  splashText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: Colors.textPrimary,
  },
  splashIndicator: {
    marginTop: 20,
  },
});