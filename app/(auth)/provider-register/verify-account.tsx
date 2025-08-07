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
import DocumentUploadScreen from './verification/document-upload';
import ToastMessage from '../../../components/ui/ToastMessage';
import { useAuth } from '../../../hooks/useAuth';
import verificationService from '../../../services/verificationService';
import { DocumentPhotoType } from '../../../types/backend/verification';
import { VerificationStatus, UserRole } from '../../../types/backend/auth';
import { PROVIDER_ROUTES } from '../../../constants/routes'; // Certifique-se de que esta importação está correta

const LOGO_IMAGE = require('../../../assets/images/logo.png');
const HEADER_ICON_IMAGE = require('../../../assets/images/facer.png');

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
    lightBlueBorder: '#B3D9FF',
    successBg: '#E8F5E9',
    errorBg: '#FFEBEE',
};

export default function VerifyAccountScreen() {
    const router = useRouter();
    const { user, setIsRegistrationInProgress, refreshUser } = useAuth();
    const providerId = user?.providerDetails?.id;
    const isApproved = user?.providerDetails?.verificationStatus === VerificationStatus.APPROVED;

    const [isLoading, setIsLoading] = useState(false);
    const [toastMessage, setToastMessage] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);
    const [documentPhotoFront, setDocumentPhotoFront] = useState<string | null>(null);
    const [documentPhotoBack, setDocumentPhotoBack] = useState<string | null>(null);
    const [currentVerificationStep, setCurrentVerificationStep] = useState(0);

    const fadeAnim = useRef(new Animated.Value(0)).current;
    const slideAnim = useRef(new Animated.Value(50)).current;
    const logoScale = useRef(new Animated.Value(0.8)).current;

    useEffect(() => {
        Animated.sequence([
            Animated.delay(500),
            Animated.parallel([
                Animated.timing(fadeAnim, { toValue: 1, duration: 800, useNativeDriver: true }),
                Animated.timing(slideAnim, { toValue: 0, duration: 800, useNativeDriver: true }),
                Animated.spring(logoScale, { toValue: 1, friction: 3, useNativeDriver: true }),
            ]),
        ]).start(() => {
            // Se o provedor já estiver aprovado, pule para a etapa final ou redirecione
            if (isApproved) {
                setCurrentVerificationStep(4); // Ou diretamente redirecione
                router.replace(PROVIDER_ROUTES.DASHBOARD);
            } else {
                setCurrentVerificationStep(2); // Inicia na etapa de upload de documentos
            }
        });
    }, [fadeAnim, slideAnim, logoScale, isApproved, router]);

    // [CORREÇÃO] Efeito para verificar periodicamente o status do provedor
    useEffect(() => {
        let interval: ReturnType<typeof setInterval> | null = null;
        // Só inicia a verificação periódica se o provedor não estiver aprovado
        if (providerId && !isApproved) {
            console.log("[VerifyAccountScreen] Iniciando verificação periódica do status do provedor...");
            interval = setInterval(async () => {
                try {
                    const verificationInfo = await verificationService.getProviderVerificationInfo(providerId);
                    console.log("[VerifyAccountScreen] Status de verificação obtido:", verificationInfo.verificationStatus);
                    if (verificationInfo.verificationStatus === VerificationStatus.APPROVED) {
                        setToastMessage({ message: "Sua conta foi aprovada! Redirecionando para o Dashboard.", type: "success" });
                        await refreshUser(); // Atualiza o estado do usuário no AuthContext
                        // Redireciona imediatamente para o dashboard
                        router.replace(PROVIDER_ROUTES.DASHBOARD);
                    }
                } catch (error) {
                    console.error("[VerifyAccountScreen] Erro ao verificar status:", error);
                    setToastMessage({ message: "Erro ao verificar o status da sua conta.", type: "error" });
                }
            }, 5000); // Verifica a cada 5 segundos
        } else if (isApproved) {
            // Se já estiver aprovado ao montar ou ao mudar o estado, redireciona
            console.log("[VerifyAccountScreen] Provedor já aprovado. Redirecionando para o Dashboard.");
            router.replace(PROVIDER_ROUTES.DASHBOARD);
        }

        return () => {
            if (interval) {
                clearInterval(interval);
                console.log("[VerifyAccountScreen] Verificação periódica interrompida.");
            }
        };
    }, [providerId, isApproved, refreshUser, router]); // Adicionado 'router' às dependências

    const handleStepCompletion = useCallback(async (data: any, step: number) => {
        setIsLoading(true);
        setToastMessage(null);

        try {
            if (!providerId) {
                throw new Error('ID do provedor não encontrado. Faça login novamente.');
            }

            if (step === 2) { // Etapa de upload de documentos
                const documentData = data as { documentPhotoFront: string | null; documentPhotoBack: string | null; selfieWithDocument: string | null };
                setDocumentPhotoFront(documentData.documentPhotoFront);
                setDocumentPhotoBack(documentData.documentPhotoBack);

                if (documentData.documentPhotoFront) {
                    await verificationService.uploadDocumentPhoto(documentData.documentPhotoFront, DocumentPhotoType.FRONT);
                }
                if (documentData.documentPhotoBack) {
                    await verificationService.uploadDocumentPhoto(documentData.documentPhotoBack, DocumentPhotoType.BACK);
                }
                if (documentData.selfieWithDocument) {
                    await verificationService.uploadSelfieWithDocument(documentData.selfieWithDocument);
                }
                
                // Após o upload, o status de verificação será atualizado no backend
                // e o polling no useEffect detectará a mudança.
                setCurrentVerificationStep(4); // Move para a etapa de "verificação em andamento"
            }
        } catch (error: any) {
            console.error("Erro na verificação:", error);
            setToastMessage({ message: error.message || "Erro na verificação. Tente novamente.", type: "error" });
        } finally {
            setIsLoading(false);
        }
    }, [providerId, setIsRegistrationInProgress]); // Removido setIsRegistrationInProgress se não for diretamente usado aqui

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
            case 2:
                return (
                    <DocumentUploadScreen
                        onComplete={(data) => handleStepCompletion(data, 2)}
                        isLoading={isLoading}
                        initialDocumentPhotoFront={documentPhotoFront}
                        initialDocumentPhotoBack={documentPhotoBack}
                    />
                );
            case 4:
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
                {currentVerificationStep === 0 ? (
                    <Animated.View style={[StyleSheet.absoluteFill, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
                        {renderVerificationStep()}
                    </Animated.View>
                ) : (
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
