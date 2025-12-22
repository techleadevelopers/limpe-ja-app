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
    Text,
    TouchableOpacity // Adicionado para o botão de tentar novamente
} from 'react-native';
import DocumentUploadScreen from './verification/document-upload';
import ToastMessage from '../../../components/ui/ToastMessage';
import { useAuth } from '../../../hooks/useAuth';
import verificationService from '../../../services/verificationService';
import { showUserError } from '../../_shared/errors/userError';
import { DocumentPhotoType } from '../../../types/backend/verification';
import { VerificationStatus, UserRole } from '../../../types/backend/auth';
import { PROVIDER_ROUTES } from '../../routes';

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
    const rejectionReason = user?.providerDetails?.rejectionReason; // Obter o motivo da rejeição

    const [isLoading, setIsLoading] = useState(false);
    const [toastMessage, setToastMessage] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);
    const [documentPhotoFront, setDocumentPhotoFront] = useState<string | null>(null);
    const [documentPhotoBack, setDocumentPhotoBack] = useState<string | null>(null);
    const [currentVerificationStep, setCurrentVerificationStep] = useState(0);
    
    // Novo estado para o loading específico de "Confirmando Identidade"
    const [isSubmittingDocuments, setIsSubmittingDocuments] = useState(false);

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
                // Inicia na etapa de upload de documentos, ou exibe o status atual
                if (user?.providerDetails?.verificationStatus === VerificationStatus.REJECTED) {
                    setCurrentVerificationStep(5); // Exibe tela de rejeição
                } else if (user?.providerDetails?.verificationStatus === VerificationStatus.PENDING_MANUAL_REVIEW) {
                    setCurrentVerificationStep(4); // Mantém na tela de "verificação em andamento"
                } else {
                    setCurrentVerificationStep(2); // Inicia na etapa de upload de documentos
                }
            }
        });
    }, [fadeAnim, slideAnim, logoScale, isApproved, router, user?.providerDetails?.verificationStatus]);

    // Efeito para verificar periodicamente o status do provedor
    useEffect(() => {
        let interval: ReturnType<typeof setInterval> | null = null;
        // Só inicia a verificação periódica se o provedor não estiver aprovado ou rejeitado
        if (providerId && !isApproved && user?.providerDetails?.verificationStatus !== VerificationStatus.REJECTED) {
            console.log("[VerifyAccountScreen] Iniciando verificação periódica do status do provedor...");
            interval = setInterval(async () => {
                try {
                    const verificationInfo = await verificationService.getProviderVerificationInfo(providerId);
                    console.log("[VerifyAccountScreen] Status de verificação obtido:", verificationInfo.verificationStatus);
                    
                    if (verificationInfo.verificationStatus === VerificationStatus.APPROVED) {
                        setToastMessage({ message: "Sua conta foi aprovada! Redirecionando para o Dashboard.", type: "success" });
                        if (interval) clearInterval(interval); // Parar polling
                        await refreshUser(); // Atualiza o estado do usuário no AuthContext
                        router.replace(PROVIDER_ROUTES.DASHBOARD);
                    } else if (verificationInfo.verificationStatus === VerificationStatus.REJECTED) {
                        setToastMessage({ message: `Sua verificação foi rejeitada.`, type: "error" });
                        if (interval) clearInterval(interval); // Parar polling
                        await refreshUser(); // Atualiza o estado para refletir a rejeição e o motivo
                        setCurrentVerificationStep(5); // Nova etapa para exibir o motivo da rejeição e opções
                    } else if (verificationInfo.verificationStatus === VerificationStatus.PENDING_MANUAL_REVIEW) {
                        // Se o status mudar para revisão manual, atualiza a UI para refletir isso
                        setCurrentVerificationStep(4); // Mantém na tela de "verificação em andamento"
                        setToastMessage({ message: "Seus documentos estão sob revisão manual. Você será notificado em breve.", type: "info" });
                    }
                    // Para outros status (PENDING_DOCUMENTS_UPLOAD, PENDING_BACKGROUND_CHECK), continua o polling
                    // e a tela permanece no passo de upload ou análise.

                } catch (error) {
                    console.error("[VerifyAccountScreen] Erro ao verificar status:", error);
                    setToastMessage({ message: "Erro ao verificar o status da sua conta. Tente novamente mais tarde.", type: "error" });
                    // Em caso de erro na API, pode-se parar o polling ou aumentar o intervalo
                    // if (interval) clearInterval(interval);
                }
            }, 5000); // Verifica a cada 5 segundos
        } else if (isApproved) {
            // Se já estiver aprovado ao montar ou ao mudar o estado, redireciona
            console.log("[VerifyAccountScreen] Provedor já aprovado. Redirecionando para o Dashboard.");
            router.replace(PROVIDER_ROUTES.DASHBOARD);
        } else if (user?.providerDetails?.verificationStatus === VerificationStatus.REJECTED) {
            // Se já estiver rejeitado ao montar, exibe a tela de rejeição
            setCurrentVerificationStep(5);
        }


        return () => {
            if (interval) {
                clearInterval(interval);
                console.log("[VerifyAccountScreen] Verificação periódica interrompida.");
            }
        };
    }, [providerId, isApproved, refreshUser, router, user?.providerDetails?.verificationStatus]);

    const handleStepCompletion = useCallback(async (data: any, step: number) => {
        setIsLoading(true);
        setToastMessage(null);

        try {
            if (!providerId) {
                throw new Error('ID do provedor não encontrado. Faça login novamente.');
            }

            if (step === 2) { // Etapa de upload de documentos
                // Inicia o loading robusto de "Confirmando Identidade"
                setIsSubmittingDocuments(true);
                
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
                // A transição para a próxima tela será controlada aqui
                setIsSubmittingDocuments(false); // Fim do loading de submissão
                setCurrentVerificationStep(4); // Move para a etapa de "verificação em andamento"
                setToastMessage({ message: "Documentos enviados com sucesso! Estamos analisando.", type: "success" });
            }
        } catch (error: any) {
            console.error("Erro na verificação:", error);
            setIsSubmittingDocuments(false); // Certifique-se de desativar o loading em caso de erro
            const normalized = showUserError(error, 'Erro no cadastro');
            setToastMessage({ message: normalized.message, type: 'error' });
        } finally {
            setIsLoading(false);
        }
    }, [providerId, setIsRegistrationInProgress]);

    const renderVerificationStep = () => {
        // Renderiza o loading robusto para "Confirmando Identidade"
        if (isSubmittingDocuments) {
            return (
                <View style={styles.analysisContent}>
                    <Image source={LOGO_IMAGE} style={styles.analysisLogo} />
                    <Text style={styles.analysisText}>Confirmando Identidade?</Text>
                    <Text style={styles.analysisSubText}>Estamos processando seus documentos...</Text>
                    <ActivityIndicator size="large" color={Colors.primary} style={styles.analysisIndicator} />
                </View>
            );
        }

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
                        <Text style={styles.analysisSubText}>Seus documentos estão sendo analisados. Isso pode levar alguns minutos.</Text>
                        <ActivityIndicator size="large" color={Colors.primary} style={styles.analysisIndicator} />
                    </View>
                );
            case 5: // Nova etapa para rejeição
                return (
                    <View style={styles.analysisContent}>
                        <Image source={LOGO_IMAGE} style={styles.analysisLogo} />
                        <Text style={styles.analysisText}>Verificação Rejeitada</Text>
                        <Text style={styles.rejectionReasonText}>
                            {rejectionReason || 'Não foi possível aprovar sua conta. Entre em contato com o suporte para mais detalhes.'}
                        </Text>
                        <TouchableOpacity style={styles.retryButton} onPress={() => {
                            // Limpa os estados de documentos para permitir novo upload
                            setDocumentPhotoFront(null);
                            setDocumentPhotoBack(null);
                            setCurrentVerificationStep(2); // Volta para a etapa de upload
                            setToastMessage(null); // Limpa qualquer toast anterior
                        }}>
                            <Text style={styles.retryButtonText}>Tentar Novamente</Text>
                        </TouchableOpacity>
                        {/* Opcional: Botão para contato com suporte */}
                        {/* <TouchableOpacity onPress={() => router.push(COMMON_ROUTES.HELP)}>
                            <Text style={styles.contactSupportText}>Contatar Suporte</Text>
                        </TouchableOpacity> */}
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
        marginBottom: 10, // Ajustado para dar espaço ao subtexto
    },
    analysisSubText: { // Novo estilo para subtexto
        fontSize: 16,
        color: Colors.textSecondary,
        textAlign: 'center',
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
    rejectionReasonText: { // Novo estilo para motivo de rejeição
        fontSize: 16,
        color: Colors.error,
        textAlign: 'center',
        marginBottom: 20,
        paddingHorizontal: 10,
    },
    retryButton: { // Novo estilo para botão de tentar novamente
        backgroundColor: Colors.primary,
        paddingVertical: 12,
        paddingHorizontal: 25,
        borderRadius: 8,
        marginTop: 20,
    },
    retryButtonText: { // Novo estilo para texto do botão de tentar novamente
        color: Colors.cardBackground,
        fontSize: 16,
        fontWeight: 'bold',
    },
    contactSupportText: { // Estilo opcional para contato com suporte
        color: Colors.primary,
        fontSize: 14,
        marginTop: 10,
        textDecorationLine: 'underline',
    },
});
