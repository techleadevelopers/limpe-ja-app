import React, { useState, useRef, useEffect } from 'react';
import {
    View,
    Text,
    TextInput,
    StyleSheet,
    ActivityIndicator,
    Alert,
    TouchableOpacity,
    ScrollView,
    KeyboardAvoidingView,
    Platform,
    Image,
    Animated,
    StatusBar,
    Dimensions,
} from 'react-native';
import { Link, useRouter, Stack } from 'expo-router';
import { useAuth } from '../../contexts/AuthContext'; // Assumindo que useAuth está em ../../contexts/AuthContext
import { Ionicons } from '@expo/vector-icons';
import { UserRole } from '../types/backend/auth'; // Assumindo este caminho
import { LinearGradient } from 'expo-linear-gradient';
// CORREÇÃO: Importação padrão para 'api'
import api from '../services/api'; // Importa a instância da API

// Importações do Reanimated para as novas animações
import AnimatedReanimated, {
    useSharedValue,
    useAnimatedStyle,
    withTiming,
    Easing,
    withRepeat,
    interpolate,
    Extrapolate,
} from 'react-native-reanimated';

const LOGO_IMAGE = require('../../assets/images/logo2.png');

// Constantes para animações e layout
const SCREEN_WIDTH = Dimensions.get('window').width;
const SCREEN_HEIGHT = Dimensions.get('window').height;

// Componente AnimatedErrorMessage (mantido como estava, mas pode ser movido para um arquivo separado)
// CORREÇÃO: Importação nomeada de AnimatedErrorMessage
import { AnimatedErrorMessage } from './components/AnimatedErrorMessage';

// Novo componente InputWithIcon (criado para este arquivo, pode ser movido para um arquivo separado)
// CORREÇÃO: Importação nomeada de InputWithIcon
import { InputWithIcon } from './components/InputWithIcon';


export default function LoginScreen() {
    // Novos estados para o fluxo OTP (mantidos)
    const [phoneNumber, setPhoneNumber] = useState('');
    const [otpCode, setOtpCode] = useState('');
    const [otpStep, setOtpStep] = useState<'phone' | 'otp'>('phone'); // Controla o passo no fluxo OTP
    const [otpLoading, setOtpLoading] = useState(false); // Para as operações de OTP
    const [otpErrorMessage, setOtpErrorMessage] = useState<string | null>(null); // Para erros específicos do OTP
    const [timer, setTimer] = useState(0); // Timer para reenviar OTP

    const { login, isAuthenticated, isLoading: authIsLoading, user } = useAuth();
    const router = useRouter();

    const mainElementsOpacity = useRef(new Animated.Value(0)).current;
    const mainElementsTranslateY = useRef(new Animated.Value(18)).current;

    // Valores compartilhados para as animações da logo (Reanimated)
    const logoRotateY = useSharedValue(0);
    const logoPulseScale = useSharedValue(1);

    useEffect(() => {
        const startLogoLoopAnimations = () => {
            logoRotateY.value = withRepeat(
                withTiming(1, { duration: 4000, easing: Easing.inOut(Easing.ease) }),
                -1,
                true
            );

            logoPulseScale.value = withRepeat(
                withTiming(1.02, { duration: 1500, easing: Easing.inOut(Easing.ease) }),
                -1,
                true
            );
        };

        if (!authIsLoading && isAuthenticated) {
            const targetRoute = user?.role === UserRole.CLIENT ? '/(client)/explore' : user?.role === UserRole.PROVIDER ? '/(provider)/dashboard' : '/';
            router.replace(targetRoute as any);
        } else if (!isAuthenticated) {
            Animated.parallel([
                Animated.timing(mainElementsOpacity, {
                    toValue: 1,
                    duration: 700,
                    delay: 200,
                    useNativeDriver: true
                }),
                Animated.timing(mainElementsTranslateY, {
                    toValue: 0,
                    duration: 700,
                    delay: 200,
                    useNativeDriver: true
                })
            ]).start(() => {
                startLogoLoopAnimations();
            });
        }
    }, [isAuthenticated, authIsLoading, user, router, logoRotateY, logoPulseScale, mainElementsOpacity, mainElementsTranslateY]);

    const createButtonAnimations = () => {
        const scaleAnimButton = useRef(new Animated.Value(1)).current;
        const onPressIn = () => Animated.spring(scaleAnimButton, { toValue: 0.97, useNativeDriver: true, friction: 7 }).start();
        const onPressOut = () => Animated.spring(scaleAnimButton, { toValue: 1, useNativeDriver: true, friction: 7 }).start();
        return { scaleAnim: scaleAnimButton, onPressIn, onPressOut };
    };

    const signInButtonAnims = createButtonAnimations();

    // Estilo animado para a logo principal (Reanimated)
    const animatedLogoStyle = useAnimatedStyle(() => {
        const rotation = interpolate(
            logoRotateY.value,
            [0, 0.5, 1],
            [-5, 0, 5],
            Extrapolate.CLAMP
        );

        return {
            transform: [
                { scale: logoPulseScale.value },
                { rotateY: `${rotation}deg` },
            ],
        };
    });

    // --- FUNÇÕES OTP INICIAM AQUI (mantidas e ajustadas) ---

    const formatPhoneNumber = (value: string) => {
        const cleaned = value.replace(/\D/g, '');

        if (cleaned.length <= 2) {
            return `(${cleaned}`;
        } else if (cleaned.length <= 7) {
            return `(${cleaned.slice(0, 2)}) ${cleaned.slice(2)}`;
        } else if (cleaned.length <= 11) {
            return `(${cleaned.slice(0, 2)}) ${cleaned.slice(2, 7)}-${cleaned.slice(7)}`;
        } else {
            return `(${cleaned.slice(0, 2)}) ${cleaned.slice(2, 7)}-${cleaned.slice(7, 11)}`;
        }
    };

    const handlePhoneSubmit = async () => {
        const cleanPhone = phoneNumber.replace(/\D/g, '');
        if (!cleanPhone || cleanPhone.length < 11) {
            setOtpErrorMessage('Por favor, insira um número de telefone válido (DDD + 9 dígitos).');
            return;
        }

        setOtpLoading(true);
        setOtpErrorMessage(null);

        try {
            // Chamada real para o backend para enviar o SMS
            // Ajuste o endpoint '/auth/send-otp' conforme a sua API
            const response = await api.post('/auth/send-otp', { phone: cleanPhone });

            if (response.status === 200) { // Ou outro status de sucesso que sua API retorne
                setOtpStep('otp');
                setTimer(60); // Inicia o timer para reenviar

                // Countdown timer
                const interval = setInterval(() => {
                    setTimer(prev => {
                        if (prev <= 1) {
                            clearInterval(interval);
                            return 0;
                        }
                        return prev - 1;
                    });
                }, 1000);

                Alert.alert('SMS Enviado', `Código de verificação enviado para ${phoneNumber}`);
            } else {
                setOtpErrorMessage(response.data.message || 'Erro ao enviar SMS. Tente novamente.');
            }

        } catch (error: any) {
            console.error('Erro ao enviar SMS:', error);
            setOtpErrorMessage(error.response?.data?.message || 'Erro ao enviar SMS. Verifique o número e tente novamente.');
        } finally {
            setOtpLoading(false);
        }
    };

    const handleOtpSubmit = async () => {
        if (!otpCode || otpCode.length < 6) {
            setOtpErrorMessage('Por favor, insira o código de 6 dígitos.');
            return;
        }

        setOtpLoading(true);
        setOtpErrorMessage(null);

        try {
            const cleanPhone = phoneNumber.replace(/\D/g, '');

            // Chamada real para o backend para verificar o OTP
            // Ajuste o endpoint '/auth/verify-otp' conforme a sua API
            const response = await api.post('/auth/verify-otp', {
                phone: cleanPhone,
                otpCode: otpCode,
            });

            if (response.status === 200 && response.data.access_token) { // Supondo que sua API retorna um access_token
                // Login bem-sucedido
                await login({
                    phone: cleanPhone,
                    otp: otpCode,
                });

                // Redirecionamento é tratado no useEffect principal
            } else {
                setOtpErrorMessage(response.data.message || 'Código inválido. Tente novamente.');
            }

        } catch (error: any) {
            console.error('Erro ao validar OTP:', error);
            setOtpErrorMessage(error.response?.data?.message || 'Erro ao validar código. Tente novamente.');
        } finally {
            setOtpLoading(false);
        }
    };

    const handleResendOtp = async () => {
        if (timer > 0) return; // Impede o reenvio se o timer ainda estiver ativo

        setOtpLoading(true);
        setOtpErrorMessage(null); // Limpa mensagens de erro anteriores

        try {
            const cleanPhone = phoneNumber.replace(/\D/g, '');
            // Chamada real para o backend para reenviar o SMS
            // Ajuste o endpoint '/auth/resend-otp' conforme a sua API
            const response = await api.post('/auth/resend-otp', { phone: cleanPhone });

            if (response.status === 200) {
                setTimer(60); // Reinicia o timer

                const interval = setInterval(() => {
                    setTimer(prev => {
                        if (prev <= 1) {
                            clearInterval(interval);
                            return 0;
                        }
                        return prev - 1;
                    });
                }, 1000);

                Alert.alert('SMS Reenviado', 'Novo código enviado para seu telefone.');
            } else {
                setOtpErrorMessage(response.data.message || 'Erro ao reenviar SMS. Tente novamente.');
            }
        } catch (error: any) {
            console.error('Erro ao reenviar SMS:', error);
            setOtpErrorMessage(error.response?.data?.message || 'Erro ao reenviar SMS. Tente novamente.');
        } finally {
            setOtpLoading(false);
        }
    };

    // --- FUNÇÕES OTP TERMINAM AQUI ---


    // LOADING ORIGINAL MANTIDO
    if (authIsLoading || (!authIsLoading && isAuthenticated)) {
        return (
            <View style={styles.fullScreenLoadingContainer}>
                <ActivityIndicator size="large" color="#007BFF" />
                <Text style={styles.fullScreenLoadingText}>Carregando sua sessão...</Text>
            </View>
        );
    }

    return (
        <KeyboardAvoidingView
            behavior={Platform.OS === "ios" ? "padding" : "height"}
            style={styles.keyboardAvoidingContainer}
        >
            <StatusBar barStyle="dark-content" backgroundColor={styles.scrollView.backgroundColor} />

            {/* Fundo com gradiente */}
            <LinearGradient
                colors={['#F0F4F8', '#E2E8F0', '#F7FAFC']}
                style={StyleSheet.absoluteFillObject}
            />

            <ScrollView
                style={styles.scrollView}
                contentContainerStyle={styles.scrollContentContainer}
                keyboardShouldPersistTaps="handled"
                showsVerticalScrollIndicator={false}
            >
                <Stack.Screen options={{ headerShown: false }} />

                <Animated.View style={[
                    styles.contentWrapper,
                    {
                        opacity: mainElementsOpacity,
                        transform: [{ translateY: mainElementsTranslateY }]
                    }
                ]}>
                    {/* LOGO COM DIMENSÕES ORIGINAIS RESTAURADAS */}
                    <View style={styles.logoContainer}>
                        <AnimatedReanimated.Image source={LOGO_IMAGE} style={[styles.logo, animatedLogoStyle]} />
                    </View>

                    <Text style={styles.welcomeSubtitle}>
                        {/* Subtítulo ajustado para o fluxo OTP */}
                        {otpStep === 'phone' ? 'Entrar com seu telefone' : 'Verificar Código OTP'}
                    </Text>

                    {/* --- Seção de Login com Telefone/OTP (agora a única opção) --- */}
                    <>
                        {otpStep === 'phone' ? (
                            <InputWithIcon
                                iconName="call-outline" // CORREÇÃO: Usar iconName e nome do Ionicons
                                placeholder="(XX) XXXXX-XXXX"
                                value={phoneNumber}
                                onChangeText={(text: string) => { // CORREÇÃO: Tipagem do 'text'
                                    setPhoneNumber(formatPhoneNumber(text));
                                    if (otpErrorMessage) setOtpErrorMessage(null);
                                }}
                                keyboardType="phone-pad"
                                maxLength={15} // Ex: (99) 99999-9999
                            />
                        ) : (
                            <InputWithIcon
                                iconName="lock-closed-outline" // CORREÇÃO: Usar iconName e nome do Ionicons
                                placeholder="Código de 6 dígitos"
                                value={otpCode}
                                onChangeText={(text: string) => { // CORREÇÃO: Tipagem do 'text'
                                    setOtpCode(text);
                                    if (otpErrorMessage) setOtpErrorMessage(null);
                                }}
                                keyboardType="numeric"
                                maxLength={6}
                                textAlign="center"
                                style={styles.otpInput} // Estilo específico para OTP
                            />
                        )}

                        {/* CORREÇÃO: Passar isVisible para AnimatedErrorMessage e 'centered' */}
                        <AnimatedErrorMessage message={otpErrorMessage} isVisible={!!otpErrorMessage} centered={true} />

                        <Animated.View style={{ transform: [{ scale: signInButtonAnims.scaleAnim }] }}>
                            <TouchableOpacity
                                style={[styles.signInButton, otpLoading && styles.buttonDisabled]}
                                onPress={otpStep === 'phone' ? handlePhoneSubmit : handleOtpSubmit}
                                onPressIn={signInButtonAnims.onPressIn} // Reutilizando animações de botão
                                onPressOut={signInButtonAnims.onPressOut}
                                disabled={otpLoading}
                            >
                                {otpLoading ? (
                                    <ActivityIndicator color="#FFFFFF" />
                                ) : (
                                    <Text style={styles.signInButtonText}>
                                        {otpStep === 'phone' ? 'Enviar Código' : 'Verificar Código'}
                                    </Text>
                                )}
                            </TouchableOpacity>
                        </Animated.View>

                        {otpStep === 'otp' && (
                            <View style={styles.otpActions}>
                                <TouchableOpacity
                                    style={styles.backButton}
                                    onPress={() => {
                                        setOtpStep('phone');
                                        setOtpErrorMessage(null);
                                        setTimer(0); // Reseta o timer ao voltar
                                    }}
                                >
                                    <Text style={styles.backButtonText}>Voltar</Text>
                                </TouchableOpacity>

                                <TouchableOpacity
                                    style={[styles.resendButton, timer > 0 && styles.resendButtonDisabled]}
                                    onPress={handleResendOtp}
                                    disabled={timer > 0 || otpLoading} // Desabilita se estiver carregando ou timer ativo
                                >
                                    <Text style={[styles.resendButtonText, timer > 0 && styles.resendButtonTextDisabled]}>
                                        {timer > 0 ? `Reenviar em ${timer}s` : 'Reenviar código'}
                                    </Text>
                                </TouchableOpacity>
                            </View>
                        )}
                    </>

                    {/* Footer e links de cadastro/senha esquecida - Mantidos */}
                    <View style={styles.signUpContainer}>
                        <Text style={styles.signUpText}>Não tem uma conta? </Text>
                        <Link href="/(auth)/register-options" asChild>
                            <TouchableOpacity>
                                <Text style={styles.signUpLink}>Cadastre-se aqui</Text>
                            </TouchableOpacity>
                        </Link>
                    </View>

                    <View style={styles.forgotPasswordContainer}>
                        <Link href="/(auth)/forgot-password" asChild>
                            <TouchableOpacity>
                                <Text style={styles.forgotPasswordLink}>Esqueceu a senha?</Text>
                            </TouchableOpacity>
                        </Link>
                    </View>
                </Animated.View>
            </ScrollView>
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    keyboardAvoidingContainer: {
        flex: 1,
    },
    scrollView: {
        flex: 1,
        backgroundColor: '#F7F8FC',
    },
    scrollContentContainer: {
        flexGrow: 1,
        justifyContent: 'center',
        paddingBottom: 10,
    },
    contentWrapper: {
        paddingHorizontal: 49,
        paddingTop: Platform.OS === 'ios' ? 20 : 15,
        bottom: 100,
    },

    logoContainer: {
        top: 90,
        right: 10,
        alignItems: 'center',
    },
    logo: {
        width: 205,
        height: 310,
        resizeMode: 'contain',
    },
    welcomeSubtitle: {
        fontSize: 13.5,
        color: '#8A94A6',
        textAlign: 'center',
        marginBottom: 50,
        bottom: 42,
    },
    inputWrapper: { // Este estilo é definido dentro de InputWithIcon.tsx
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#FFFFFF',
        borderRadius: 28,
        height: 33,
        bottom: 55,
        marginBottom: 10,
        shadowColor: 'rgba(100, 100, 150, 0.15)',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 1,
        shadowRadius: 15,
        elevation: 5,
        paddingLeft: 5,
        paddingRight: 15,
    },
    iconCircle: { // Este estilo é definido dentro de InputWithIcon.tsx
        width: 50,
        height: 30,
        right: 2,
        borderRadius: 40,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#FFFFFF',
        marginRight: 10,
    },
    input: { // Este estilo é definido dentro de InputWithIcon.tsx
        flex: 1,
        fontSize: 15,
        color: '#2D3748',
        right: 8,
        height: '70%',
        paddingVertical: 0,
    },
    eyeIconTouchable: { // Este estilo é definido dentro de InputWithIcon.tsx
        paddingHorizontal: 15,
        height: '100%',
        justifyContent: 'center',
    },
    inlineErrorMessage: { // Este estilo é definido dentro de AnimatedErrorMessage.tsx
        color: '#E53E3E',
        fontSize: 13,
        textAlign: 'center',
        marginBottom: 15,
        marginTop: -12,
    },
    signInButton: {
        backgroundColor: 'rgba(64, 192, 240, 0.85)',
        borderRadius: 28,
        paddingVertical: 4,
        width: '100%',
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: 10,
        bottom: 55,
        marginBottom: 25,
        shadowColor: '#007BFF',
        shadowOffset: { width: 0, height: 5 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 8,
    },
    buttonDisabled: {
        backgroundColor: '#A0CFFF',
        elevation: 0,
        shadowOpacity: 0,
    },
    signInButtonText: {
        color: '#FFFFFF',
        fontSize: 14,
        fontWeight: '600',
    },
    signUpContainer: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        bottom: 40,
        paddingBottom: 18,
        paddingTop: 15,
    },
    signUpText: {
        fontSize: 12,
        color: '#718096',
    },
    signUpLink: {
        fontSize: 14,
        color: '#007BFF',
        fontWeight: '600',
        marginLeft: 4,
    },
    forgotPasswordContainer: {
        alignItems: 'center',
        marginBottom: 20,
        bottom: 45,
    },
    forgotPasswordLink: {
        fontSize: 13,
        color: '#007BFF',
        fontWeight: '500',
    },
    fullScreenLoadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#F7F8FC',
    },
    fullScreenLoadingText: {
        marginTop: 13,
        fontSize: 14,
        color: '#4A5568',
    },
    otpInput: {
        letterSpacing: 8, // Para espaçamento entre os dígitos do OTP
        fontSize: 18, // Ajuste o tamanho da fonte para o OTP
    },
    otpActions: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginTop: 20,
        bottom: 40, // Ajuste a posição para alinhar com o layout existente
        paddingHorizontal: 10,
    },
    backButton: {
        paddingVertical: 10,
        paddingHorizontal: 15,
        borderRadius: 20,
        backgroundColor: '#E2E8F0',
    },
    backButtonText: {
        color: '#4A5568',
        fontSize: 14,
        fontWeight: '500',
    },
    resendButton: {
        paddingVertical: 10,
        paddingHorizontal: 15,
        borderRadius: 20,
        backgroundColor: '#E0F7FA', // Um tom mais claro para o botão de reenviar
    },
    resendButtonDisabled: {
        opacity: 0.6,
        backgroundColor: '#CFD8DC', // Cor mais opaca quando desabilitado
    },
    resendButtonText: {
        color: '#00BCD4', // Cor primária do app
        fontSize: 14,
        fontWeight: '600',
    },
    resendButtonTextDisabled: {
        color: '#78909C', // Cor mais suave quando desabilitado
    },
});