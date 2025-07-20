import { Stack, useRouter } from 'expo-router';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    Animated,
    Image,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    StatusBar,
    StyleSheet,
    View
} from 'react-native';

// Importações para os componentes de passo de verificação
// import BackgroundCheckStatusScreen from './verification/background-check-status'; // Comentado: Etapa de antecedentes
import DocumentUploadScreen from './verification/document-upload';
import FacialRecognitionScreen from './verification/facial-recognition';

// Importações de serviços e tipos
import ToastMessage from '../../../components/ui/ToastMessage';
import { useAuth } from '../../../hooks/useAuth';
import verificationService from '../../../services/verificationService';
import { DocumentPhotoType } from '../../../types/backend/verification';

const LOGO_IMAGE = require('../../../assets/images/logo.png');
// ADDITION: Import the new header image
const HEADER_ICON_IMAGE = require('../../../assets/images/facer.png');

// Paleta de cores para o design "clean blue light"
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
  overlay: 'rgba(0,0,0,0.4)', //
  shimmer: 'rgba(255,255,255,0.4)', //
  lightBlueBorder: '#B3D9FF', //
  successBg: '#E8F5E9', //
  errorBg: '#FFEBEE', //
};

export default function VerifyAccountScreen() {
  const router = useRouter();
  const { user, updateUser, setIsRegistrationInProgress } = useAuth(); //
  const providerId = user?.providerDetails?.id; //
  const userId = user?.id; //

  const [isLoading, setIsLoading] = useState(false);
  const [toastMessage, setToastMessage] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);

  // Estados para cada etapa
  const [cpf, setCpf] = useState('');
  const [documentPhotoFront, setDocumentPhotoFront] = useState<string | null>(null);
  const [documentPhotoBack, setDocumentPhotoBack] = useState<string | null>(null);
  const [selfieWithDocument, setSelfieWithDocument] = useState<string | null>(null);

  // O fluxo de etapas será: 0 (splash) -> 2 (Documentos) -> 3 (Facial)
  // A etapa 1 (CPF/Antecedentes) será pulada.
  const [currentVerificationStep, setCurrentVerificationStep] = useState(0);

  // Animações
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;
  const logoScale = useRef(new Animated.Value(0.8)).current;

  // Animação de entrada inicial da tela
  useEffect(() => {
    Animated.sequence([
      Animated.delay(500),
      Animated.parallel([
        Animated.timing(fadeAnim, { toValue: 1, duration: 800, useNativeDriver: true }),
        Animated.timing(slideAnim, { toValue: 0, duration: 800, useNativeDriver: true }),
        Animated.spring(logoScale, { toValue: 1, friction: 3, useNativeDriver: true }),
      ]),
    ]).start(() => {
        // Após a splash, vá para a etapa 2 (DocumentUploadScreen), pulando a etapa 1
        setCurrentVerificationStep(2);
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

      // Comentado: Lógica para o passo 1 (CPF/Antecedentes)
      // if (step === 1) {
      //   const cpfData = data as { cpf: string };
      //   setCpf(cpfData.cpf);
      //   await verificationService.submitCpf(cpfData.cpf);
      //   setCurrentVerificationStep(2); // Vai para a etapa de Documentos
      // } else
      if (step === 2) { // Etapa de Upload de Documentos
        const documentData = data as { documentPhotoFront: string | null; documentPhotoBack: string | null };
        setDocumentPhotoFront(documentData.documentPhotoFront);
        setDocumentPhotoBack(documentData.documentPhotoBack);

        if (documentData.documentPhotoFront) {
          // Passa a URI da imagem diretamente para o serviço
          await verificationService.uploadDocumentPhoto(documentData.documentPhotoFront, DocumentPhotoType.FRONT);
        }
        if (documentData.documentPhotoBack) {
          // Passa a URI da imagem diretamente para o serviço
          await verificationService.uploadDocumentPhoto(documentData.documentPhotoBack, DocumentPhotoType.BACK);
        }
        setCurrentVerificationStep(3); // Vai para a etapa de Reconhecimento Facial
      } else if (step === 3) { // Etapa de Reconhecimento Facial
        const selfieData = data as { selfieWithDocument: string | null };
        setSelfieWithDocument(selfieData.selfieWithDocument);
        if (selfieData.selfieWithDocument) {
          // Passa a URI da imagem diretamente para o serviço
          await verificationService.uploadSelfie(selfieData.selfieWithDocument);
        }

        // *** ADIÇÃO CRÍTICA AQUI: Definir isRegistrationInProgress como false ***
        if (setIsRegistrationInProgress) {
            setIsRegistrationInProgress(false);
        }

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
  }, [providerId, router, setIsRegistrationInProgress]);

  // Renderização condicional das etapas
  const renderVerificationStep = () => {
    switch (currentVerificationStep) {
      case 0:
        return (
          <View style={styles.splashContent}>
            <Animated.Image source={LOGO_IMAGE} style={[styles.splashLogo, { transform: [{ scale: logoScale }] }]} />
            <Animated.Text style={[styles.splashText, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
              Iniciando Verificação...
            </Animated.Text>
            <ActivityIndicator size="large" color={Colors.primary} style={styles.splashIndicator} />
          </View>
        );
      // Comentado: Etapa do CPF/Antecedentes
      // case 1:
      //   return (
      //     <BackgroundCheckStatusScreen
      //       onComplete={(data) => handleStepCompletion(data, 1)}
      //       isLoading={isLoading}
      //       initialCpf={cpf}
      //     />
      //   );
      case 2: // Etapa de Upload de Documentos (agora é a primeira após a splash)
        return (
          <DocumentUploadScreen
            onComplete={(data) => handleStepCompletion(data, 2)}
            isLoading={isLoading}
            initialDocumentPhotoFront={documentPhotoFront}
            initialDocumentPhotoBack={documentPhotoBack}
          />
        );
      case 3: // Etapa de Reconhecimento Facial
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
      <Stack.Screen
        options={{
          headerShown: true, // Ensure header is shown to display the icon
          headerTitle: '', // Optionally clear the title if you only want the icon
          headerLeft: () => (
            <Image
              source={HEADER_ICON_IMAGE}
              style={styles.headerIcon} // Apply a style for size and positioning
            />
          ),
          headerStyle: {
            backgroundColor: Colors.background, // Match your screen background
          },
        }}
      />

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
    backgroundColor: Colors.background, //
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
    color: Colors.textPrimary, //
  },
  splashIndicator: {
    marginTop: 20,
  },
  // ADDITION: Style for the header icon
  headerIcon: {
    width: 40, // Adjust size as needed
    height: 40, // Adjust size as needed
    resizeMode: 'contain',
    marginLeft: 15, // Add some left margin for spacing
  },
});