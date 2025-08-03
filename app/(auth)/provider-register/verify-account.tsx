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
    View,
    Text
} from 'react-native';

// Importações para os componentes de passo de verificação
// REMOVIDO: import BackgroundCheckStatusScreen from './verification/background-check-status';
import DocumentUploadScreen from './verification/document-upload';
// REMOVIDO: import FacialRecognitionScreen from './verification/facial-recognition';

// Importações de serviços e tipos
import ToastMessage from '../../../components/ui/ToastMessage';
import { useAuth } from '../../../hooks/useAuth';
import verificationService from '../../../services/verificationService';
import { DocumentPhotoType } from '../../../types/backend/verification';

const LOGO_IMAGE = require('../../../assets/images/logo.png');
const HEADER_ICON_IMAGE = require('../../../assets/images/facer.png');

const Colors = {
    primary: '#007AFF', // Azul primário
    primaryLight: '#EBF3FF', // Azul claro
    primaryGradientStart: '#007AFF', //
    primaryGradientEnd: '#40C0F0', //
    background: '#F8F9FA', // Fundo principal
    cardBackground: '#FFFFFF', // Fundo de cartões
    textPrimary: '#2D3748', // Texto escuro
    textSecondary: '#6C757D', // Texto cinza
    success: '#28A745', // Verde de sucesso
    error: '#DC3545', // Vermelho de erro
    warning: '#FFC107', // Amarelo de alerta
    info: '#17A2B8', // Azul de informação
    overlay: 'rgba(0,0,0,0.4)', // Overlay escuro
    shimmer: 'rgba(255,255,255,0.4)', //
    lightBlueBorder: '#B3D9FF', //
    successBg: '#E8F5E9', //
    errorBg: '#FFEBEE', //
};

export default function VerifyAccountScreen() {
    const router = useRouter();
    const { user, setIsRegistrationInProgress } = useAuth();
    const providerId = user?.providerDetails?.id;

    const [isLoading, setIsLoading] = useState(false);
    const [toastMessage, setToastMessage] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);

    const [documentPhotoFront, setDocumentPhotoFront] = useState<string | null>(null);
    const [documentPhotoBack, setDocumentPhotoBack] = useState<string | null>(null);

    // O fluxo de etapas será: 0 (splash) -> 2 (Documentos) -> 4 (Análise)
    // A etapa 1 (CPF/Antecedentes) e 3 (Reconhecimento Facial) foram removidas.
    const [currentVerificationStep, setCurrentVerificationStep] = useState(0);

    // Animações para a tela de splash inicial
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
            // Após a splash, vá para a etapa 2 (DocumentUploadScreen)
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

            // Etapa de Upload de Documentos
            if (step === 2) {
                const documentData = data as { documentPhotoFront: string | null; documentPhotoBack: string | null };
                setDocumentPhotoFront(documentData.documentPhotoFront);
                setDocumentPhotoBack(documentData.documentPhotoBack);

                if (documentData.documentPhotoFront) {
                    await verificationService.uploadDocumentPhoto(documentData.documentPhotoFront, DocumentPhotoType.FRONT);
                }
                if (documentData.documentPhotoBack) {
                    await verificationService.uploadDocumentPhoto(documentData.documentPhotoBack, DocumentPhotoType.BACK);
                }

                // Após subir os documentos, vá para a tela de "Verificação em andamento" (Etapa 4)
                setCurrentVerificationStep(4);

                // Define a verificação como concluída no contexto de autenticação
                if (setIsRegistrationInProgress) {
                    setIsRegistrationInProgress(false);
                }

            }
        } catch (error: any) {
            console.error("Erro na verificação:", error);
            setToastMessage({ message: error.message || "Erro na verificação. Tente novamente.", type: "error" });
        } finally {
            setIsLoading(false);
        }
    }, [providerId, setIsRegistrationInProgress]);

    // Renderização condicional das etapas
    const renderVerificationStep = () => {
        switch (currentVerificationStep) {
            case 0:
                // Tela de splash inicial com a logo e a animação
                return (
                    <View style={styles.splashContent}>
                        <Animated.Image source={LOGO_IMAGE} style={[styles.splashLogo, { transform: [{ scale: logoScale }] }]} />
                        <Animated.Text style={[styles.splashText, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
                            Iniciando Verificação...
                        </Animated.Text>
                        <ActivityIndicator size="large" color={Colors.primary} style={styles.splashIndicator} />
                    </View>
                );
            case 2:
                // Tela de upload de documentos
                return (
                    <DocumentUploadScreen
                        onComplete={(data) => handleStepCompletion(data, 2)}
                        isLoading={isLoading}
                        initialDocumentPhotoFront={documentPhotoFront}
                        initialDocumentPhotoBack={documentPhotoBack}
                    />
                );
            case 4:
                // Tela de "Verificação em andamento" com o logo e o carregamento
                return (
                    <View style={styles.analysisContent}>
                        <Image source={LOGO_IMAGE} style={styles.analysisLogo} />
                        <Text style={styles.analysisText}>Verificação em andamento</Text>
                        <ActivityIndicator size="large" color={Colors.primary} style={styles.analysisIndicator} />
                    </View>
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
                    headerShown: true,
                    headerTitle: '',
                    headerLeft: () => (
                        <Image source={HEADER_ICON_IMAGE} style={styles.headerIcon} />
                    ),
                    headerStyle: {
                        backgroundColor: Colors.background,
                    },
                }}
            />
            <ScrollView
                style={styles.scrollView}
                contentContainerStyle={styles.scrollContentContainer}
                keyboardShouldPersistTaps="handled"
            >
                {/* A animação de entrada da tela é aplicada somente na primeira renderização (currentVerificationStep === 0) */}
                {currentVerificationStep === 0 ? (
                    <Animated.View style={[StyleSheet.absoluteFill, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
                        {renderVerificationStep()}
                    </Animated.View>
                ) : (
                    // Nas outras etapas, o conteúdo é renderizado diretamente
                    renderVerificationStep()
                )}
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
        width: '100%',
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
    // Estilos para a nova tela de análise
    analysisContent: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        width: '100%',
    },
    analysisLogo: {
        width: 250,
        height: 250,
        resizeMode: 'contain',
        marginBottom: 20,
    },
    analysisText: {
        fontSize: 20,
        fontWeight: 'bold',
        color: Colors.textPrimary,
        marginBottom: 20,
    },
    analysisIndicator: {
        marginTop: 20,
    },
    headerIcon: {
        width: 40,
        height: 40,
        resizeMode: 'contain',
        marginLeft: 15,
    },
});