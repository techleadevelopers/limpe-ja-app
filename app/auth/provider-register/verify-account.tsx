import { Stack, useRouter } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import {
    ActivityIndicator,
    Animated,
    Image,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    StatusBar,
    StyleSheet,
    Text,
    TouchableOpacity, // Adicionado para o botão de tentar novamente
    View
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { showUserError } from '../../../_shared/errors/userError';
import ToastMessage from '../../../components/ui/ToastMessage';
import { useAuth } from '../../../hooks/useAuth';
import verificationService from '../../../services/verificationService';
import { VerificationStatus } from '../../../types/backend/auth';
import { DocumentPhotoType } from '../../../types/backend/verification';
import { PROVIDER_ROUTES } from '../../_shared/routes';
import DocumentUploadScreen from './verification/document-upload';

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
    const stepFadeAnim = useRef(new Animated.Value(1)).current;
    const stepTranslateAnim = useRef(new Animated.Value(0)).current;
    const scannerAnim = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        Animated.sequence([
            Animated.delay(500),
            Animated.parallel([
                Animated.timing(fadeAnim, { toValue: 1, duration: 800, useNativeDriver: true }),
                Animated.timing(slideAnim, { toValue: 0, duration: 800, useNativeDriver: true }),
                // Animated.spring(logoScale, { toValue: 1, friction: 3, useNativeDriver: true }), // logoScale intentionally disabled
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

    useEffect(() => {
        stepFadeAnim.setValue(0);
        stepTranslateAnim.setValue(20);
        Animated.parallel([
            Animated.timing(stepFadeAnim, { toValue: 1, duration: 400, useNativeDriver: true }),
            Animated.timing(stepTranslateAnim, { toValue: 0, duration: 400, useNativeDriver: true }),
        ]).start();
    }, [currentVerificationStep, stepFadeAnim, stepTranslateAnim]);

    useEffect(() => {
        const loop = Animated.loop(
            Animated.sequence([
                Animated.timing(scannerAnim, {
                    toValue: 1,
                    duration: 1200,
                    useNativeDriver: true,
                }),
                Animated.timing(scannerAnim, {
                    toValue: 0,
                    duration: 0,
                    useNativeDriver: true,
                }),
            ])
        );
        loop.start();
        return () => loop.stop();
    }, [scannerAnim]);

    // Efeito para verificar periodicamente o status do provedor
    useEffect(() => {
        let interval: ReturnType<typeof setInterval> | null = null;
        let isMounted = true;
        // Só inicia a verificação periódica se o provedor não estiver aprovado ou rejeitado
        if (providerId && !isApproved && user?.providerDetails?.verificationStatus !== VerificationStatus.REJECTED) {
            console.log("[VerifyAccountScreen] Iniciando verificação periódica do status do provedor...");
            interval = setInterval(async () => {
                try {
                    const verificationInfo = await verificationService.getProviderVerificationInfo(providerId);
                    if (!isMounted) return;
                    console.log("[VerifyAccountScreen] Status de verificação obtido:", verificationInfo.verificationStatus);
                    
                    if (verificationInfo.verificationStatus === VerificationStatus.APPROVED) {
                        setToastMessage({ message: "Sua conta foi aprovada! Redirecionando para o Dashboard.", type: "success" });
                        if (interval) clearInterval(interval); // Parar polling
                        await refreshUser(); // Atualiza o estado do usuário no AuthContext
                        if (!isMounted) return;
                        router.replace(PROVIDER_ROUTES.DASHBOARD);
                    } else if (verificationInfo.verificationStatus === VerificationStatus.REJECTED) {
                        setToastMessage({ message: `Sua verificação foi rejeitada.`, type: "error" });
                        if (interval) clearInterval(interval); // Parar polling
                        await refreshUser(); // Atualiza o estado para refletir a rejeição e o motivo
                        if (!isMounted) return;
                        setCurrentVerificationStep(5); // Nova etapa para exibir o motivo da rejeição e opções
                    } else if (verificationInfo.verificationStatus === VerificationStatus.PENDING_MANUAL_REVIEW) {
                        if (!isMounted) return;
                        // Se o status mudar para revisão manual, atualiza a UI para refletir isso
                        setCurrentVerificationStep(4); // Mantém na tela de "verificação em andamento"
                        setToastMessage({ message: "Seus documentos estão sob revisão manual. Você será notificado em breve.", type: "info" });
                    }
                    // Para outros status (PENDING_DOCUMENTS_UPLOAD, PENDING_BACKGROUND_CHECK), continua o polling
                    // e a tela permanece no passo de upload ou análise.

                } catch (error) {
                    if (!isMounted) return;
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
            isMounted = false;
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
        if (isSubmittingDocuments) {
            return (
                <View style={styles.analysisContent}>
                    <View style={styles.analysisLogoWrapper}>
                        <Animated.View style={[
                            styles.scannerBar,
                            {
                                transform: [
                                    {
                                        translateX: scannerAnim.interpolate({
                                            inputRange: [0, 1],
                                            outputRange: [-180, 180],
                                        }),
                                    },
                                ],
                            },
                        ]} />
                    </View>
                    <Text style={styles.analysisText}>Validando seus documentos</Text>
                    <Text style={styles.analysisSubText}>Nossa inteligência está processando suas fotos com scanner ativo.</Text>
                    <ActivityIndicator size="large" color={Colors.primary} style={styles.analysisIndicator} />
                </View>
            );
        }

        switch (currentVerificationStep) {
            case 0:
                return (
                    <View style={styles.splashContent}>
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
                    <Animated.View style={[styles.analysisContent, { opacity: stepFadeAnim }]}>
                        <View style={styles.analysisLogoWrapper}>
                            <Image source={HEADER_ICON_IMAGE} style={styles.analysisLogoSmall} />
                            <Animated.View style={[
                                styles.scannerBar,
                                {
                                    transform: [
                                        {
                                            translateX: scannerAnim.interpolate({
                                                inputRange: [0, 1],
                                                outputRange: [-220, 220],
                                            }),
                                        },
                                    ],
                                },
                            ]} />
                        </View>
                        <Text style={styles.analysisText}>Análise em andamento</Text>
                        <View style={styles.statusCard}>
                            <ActivityIndicator size="small" color={Colors.primary} />
                            <Text style={styles.statusCardText}>
                                Nossa IA está validando suas fotos. Isso geralmente leva menos de 2 minutos.
                            </Text>
                        </View>
                        <Text style={styles.helperText}>Você pode fechar o app, avisaremos quando estiver pronto.</Text>
                    </Animated.View>
                );
            case 5: // Tela de Rejeição com foco em Conversão
                return (
                    <View style={styles.analysisContent}>
                        <Ionicons name="alert-circle" size={80} color={Colors.error} />
                        <Text style={[styles.analysisText, { color: Colors.error }]}>Ops! Algo precisa ser ajustado</Text>
                        <View style={styles.rejectionCard}>
                            <Text style={styles.rejectionReasonText}>
                                {rejectionReason || 'As fotos enviadas estão sem nitidez ou cortadas.'}
                            </Text>
                        </View>
                        <TouchableOpacity 
                            style={styles.retryButton} 
                            onPress={() => {
                                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                                setDocumentPhotoFront(null);
                                setDocumentPhotoBack(null);
                                setToastMessage(null);
                                setCurrentVerificationStep(2);
                            }}
                        >
                            <Text style={styles.retryButtonText}>Tirar novas fotos</Text>
                        </TouchableOpacity>
                    </View>
                );
            default:
                return null;
        }
    };

    const stepContent = renderVerificationStep();

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
                <Animated.View
                    style={[
                        styles.stepWrapper,
                        {
                            opacity: stepFadeAnim,
                            transform: [{ translateY: stepTranslateAnim }],
                        },
                    ]}
                >
                    {stepContent}
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
        width: '100%',
    },
    splashLogo: {
        width: 150,
        height: 150,
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
        width: 220,
        height: 220,
        resizeMode: 'contain',
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
    analysisLogoWrapper: {
        marginBottom: 20,
        alignItems: 'center',
        justifyContent: 'center',
        overflow: 'hidden',
        position: 'relative',
    },
    analysisLogoSmall: {
        width: 180,
        height: 180,
        resizeMode: 'contain',
    },
    scannerBar: {
        position: 'absolute',
        top: '45%',
        width: '80%',
        height: 6,
        backgroundColor: 'rgba(64, 192, 240, 0.6)',
        borderRadius: 6,
    },
    headerIcon: {
        width: 40,
        height: 40,
        resizeMode: 'contain',
        marginLeft: 15,
    },
    statusCard: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: Colors.primaryLight,
        padding: 16,
        borderRadius: 14,
        marginVertical: 12,
        width: '90%',
        justifyContent: 'center',
    },
    statusCardText: {
        marginLeft: 12,
        flex: 1,
        fontSize: 15,
        color: Colors.textPrimary,
    },
    helperText: {
        fontSize: 14,
        color: Colors.textSecondary,
        textAlign: 'center',
        marginTop: 10,
        paddingHorizontal: 24,
    },
    rejectionCard: {
        backgroundColor: Colors.errorBg,
        borderRadius: 14,
        borderWidth: 1,
        borderColor: Colors.error,
        padding: 16,
        marginVertical: 12,
        width: '100%',
    },
    stepWrapper: {
        flexGrow: 1,
        width: '100%',
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
