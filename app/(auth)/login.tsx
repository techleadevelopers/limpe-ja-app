import { Link, Stack, useRouter } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    Animated,
    Dimensions,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    StatusBar,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from 'react-native';

import { LinearGradient } from 'expo-linear-gradient';
import { useAuth } from '../../contexts/AuthContext';
import { UserRole } from '../../types/backend/auth';

import AnimatedReanimated, {
    Easing,
    Extrapolate,
    interpolate,
    useAnimatedStyle,
    useSharedValue,
    withRepeat,
    withTiming,
} from 'react-native-reanimated';

import AuthService from '../../services/authService';

const LOGO_IMAGE = require('../../assets/images/logo2.png');

const SCREEN_WIDTH = Dimensions.get('window').width;
const SCREEN_HEIGHT = Dimensions.get('window').height;

import { AnimatedErrorMessage } from '../../components/auth/components/AnimatedErrorMessage';
import { InputWithIcon } from '../../components/auth/components/InputWithIcon';


export default function LoginScreen() {
    const [phoneNumber, setPhoneNumber] = useState('');
    const [otpCode, setOtpCode] = useState('');
    const [password, setPassword] = useState('');
    // Altera o estado inicial do fluxo de login para 'phoneInput' para iniciar a verificação
    const [loginFlowStep, setLoginFlowStep] = useState<'phoneInput' | 'otpInput' | 'passwordInput'>('phoneInput');
    const [loading, setLoading] = useState(false);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);
    const [timer, setTimer] = useState(0);

    const { isAuthenticated, isLoading: authIsLoading, user, login, setAuthData } = useAuth();
    const router = useRouter();

    const mainElementsOpacity = useRef(new Animated.Value(0)).current;
    const mainElementsTranslateY = useRef(new Animated.Value(18)).current;

    const logoRotateY = useSharedValue(0);
    const logoPulseScale = useSharedValue(1);

    useEffect(() => {
        const startLogoLoopAnimations = () => {
            logoRotateY.value = withRepeat(withTiming(1, { duration: 4000, easing: Easing.inOut(Easing.ease) }), -1, true);
            logoPulseScale.value = withRepeat(withTiming(1.02, { duration: 1500, easing: Easing.inOut(Easing.ease) }), -1, true);
        };

        if (!authIsLoading && isAuthenticated) {
            console.log('[LoginScreen] Usuário autenticado, redirecionando...');
            // O redirecionamento após o login bem-sucedido para usuários existentes
            // (onde isNewUser é false ou indefinido) ainda será feito aqui.
            const targetRoute = user?.role === UserRole.CLIENT ? '/(client)/explore' : user?.role === UserRole.PROVIDER ? '/(provider)/dashboard' : '/';
            router.replace(targetRoute as any);
        } else if (!isAuthenticated) {
            console.log('[LoginScreen] Usuário não autenticado, mostrando tela de login.');
            Animated.parallel([
                Animated.timing(mainElementsOpacity, { toValue: 1, duration: 700, delay: 200, useNativeDriver: true }),
                Animated.timing(mainElementsTranslateY, { toValue: 0, duration: 700, delay: 200, useNativeDriver: true })
            ]).start(() => {
                startLogoLoopAnimations();
            });
        }
    }, [isAuthenticated, authIsLoading, user, router, logoRotateY, logoPulseScale, mainElementsOpacity, mainElementsTranslateY]);

    const createButtonAnimations = () => {
        const scaleAnim = useRef(new Animated.Value(1)).current;
        const onPressIn = () => Animated.spring(scaleAnim, { toValue: 0.97, useNativeDriver: true, friction: 7 }).start();
        const onPressOut = () => Animated.spring(scaleAnim, { toValue: 1, useNativeDriver: true, friction: 7 }).start();
        return { scaleAnim, onPressIn, onPressOut };
    };

    const signInButtonAnims = createButtonAnimations();

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

    // MODIFICAÇÃO PRINCIPAL AQUI: handlePhoneSubmit
    const handlePhoneSubmit = async () => {
        const cleanPhone = phoneNumber.replace(/\D/g, '');
        console.log('[LoginScreen] handlePhoneSubmit: Número de telefone limpo (do input):', cleanPhone);

        if (cleanPhone.length !== 11) {
            setErrorMessage('O número de telefone deve ter 11 dígitos (incluindo o DDD).');
            return;
        }

        setLoading(true);
        setErrorMessage(null);

        try {
            console.log('[LoginScreen] handlePhoneSubmit: Verificando existência do telefone...');
            // Primeiro, verifica se o número de telefone já existe no backend
            const { exists, hasPassword } = await AuthService.checkPhoneNumberExistence(cleanPhone);
            console.log(`[LoginScreen] handlePhoneSubmit: Telefone existe: ${exists}, Tem senha: ${hasPassword}`);

            if (exists) {
                if (hasPassword) {
                    // Se o número existe e tem senha, pede a senha
                    setLoginFlowStep('passwordInput');
                    Alert.alert('Usuário Existente', 'Este número já está cadastrado. Por favor, insira sua senha para continuar.');
                } else {
                    // Se o número existe mas NÃO tem senha (cadastrado via OTP sem senha inicial),
                    // envia OTP para login
                    console.log('[LoginScreen] handlePhoneSubmit: Usuário existente sem senha, solicitando OTP para login.');
                    await AuthService.requestOtp(cleanPhone);
                    setLoginFlowStep('otpInput');
                    setTimer(60);
                    Alert.alert('Código Enviado', `Um código de verificação foi enviado para ${formatPhoneNumber(phoneNumber)}.`);
                }
            } else {
                // Se o número NÃO existe, envia OTP para registro
                console.log('[LoginScreen] handlePhoneSubmit: Novo usuário, solicitando OTP para registro.');
                await AuthService.requestOtp(cleanPhone);
                setLoginFlowStep('otpInput');
                setTimer(60);
                Alert.alert('Código Enviado', `Um código de verificação foi enviado para ${formatPhoneNumber(phoneNumber)}. Você será direcionado para o cadastro.`);
            }
        } catch (error: any) {
            console.error('[LoginScreen] handlePhoneSubmit: Erro no fluxo de telefone:', error.message, error);
            setErrorMessage(error.response?.data?.message || error.message || 'Ocorreu um erro ao verificar o telefone. Tente novamente.');
        } finally {
            setLoading(false);
        }
    };

    const handleOtpSubmit = async () => {
        if (!otpCode || otpCode.length !== 6) {
            setErrorMessage('Por favor, insira o código de 6 dígitos.');
            return;
        }

        setLoading(true);
        setErrorMessage(null);

        try {
            const cleanPhone = phoneNumber.replace(/\D/g, '');
            console.log('[LoginScreen] handleOtpSubmit: Verificando OTP para', cleanPhone, 'com código:', otpCode);
            
            // AQUI ESTÁ A MUDANÇA CRÍTICA: Captura a resposta do login, que agora incluirá isNewUser
            const authResponse = await login({ phoneNumber: cleanPhone, otpCode: otpCode, type: 'otp' });
            console.log('[LoginScreen] handleOtpSubmit: OTP verificado e login realizado. isNewUser:', authResponse?.isNewUser); // Log da flag

            if (authResponse && authResponse.isNewUser) {
                // Se for um novo usuário, redireciona para as opções de registro/cadastro completo
                Alert.alert('Sucesso!', 'Código verificado. Vamos completar seu cadastro!');
                router.replace('/(auth)/register-options' as any); // Redireciona para RegisterOptions
            } else {
                // Se não for um novo usuário (já existente), o redirecionamento
                // será tratado pelo useEffect de useAuth (para explore/dashboard)
                Alert.alert('Sucesso!', 'Login realizado com sucesso!');
                // Não há necessidade de redirecionar explicitamente aqui se o useEffect de useAuth já faz isso.
                // O _layout.tsx já tem a lógica para redirecionar usuários autenticados para a rota correta baseada no papel.
            }

        } catch (error: any) {
            console.error('[LoginScreen] handleOtpSubmit: Erro ao verificar OTP:', error.message, error);
            setErrorMessage(error.message || 'Código OTP inválido ou expirado. Tente novamente.');
        } finally {
            setLoading(false);
        }
    };

    const handlePasswordSubmit = async () => {
        if (!password) {
            setErrorMessage('Por favor, insira sua senha.');
            return;
        }

        setLoading(true);
        setErrorMessage(null);

        try {
            const cleanPhone = phoneNumber.replace(/\D/g, '');
            console.log('[LoginScreen] handlePasswordSubmit: Tentando login com senha para', cleanPhone);
            // Chama o método login do AuthContext com o tipo 'password'
            await login({ phoneNumber: cleanPhone, password: password, type: 'password' });

            Alert.alert('Sucesso!', 'Login realizado com sucesso!');
            // O redirecionamento para usuários existentes será tratado pelo useEffect de useAuth no _layout.tsx
        } catch (error: any) {
            console.error('Erro ao fazer login com senha:', error.message, error);
            setErrorMessage(error.response?.data?.message || error.message || 'Credenciais inválidas. Tente novamente.');
        } finally {
            setLoading(false);
        }
    };

    const handleResendOtp = async () => {
        if (timer > 0) return;

        setLoading(true);
        setErrorMessage(null);

        try {
            const cleanPhone = phoneNumber.replace(/\D/g, '');
            console.log('[LoginScreen] handleResendOtp: Reenviando OTP para:', cleanPhone);
            await AuthService.requestOtp(cleanPhone);

            setTimer(60);
            const interval = setInterval(() => {
                setTimer(prev => {
                    if (prev <= 1) {
                        clearInterval(interval);
                        return 0;
                    }
                    return prev - 1;
                });
            }, 1000);

            Alert.alert('SMS Reenviado', 'Um novo código foi enviado para seu telefone.');
        } catch (error: any) {
            console.error('Erro ao reenviar SMS:', error.message, error);
            setErrorMessage(error.response?.data?.message || error.message || 'Erro ao reenviar código. Tente novamente.');
        } finally {
            setLoading(false);
        }
    };

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
                    <View style={styles.logoContainer}>
                        <AnimatedReanimated.Image
                            source={LOGO_IMAGE}
                            style={[styles.logo, animatedLogoStyle]}
                            resizeMode="contain"
                        />
                    </View>

                    <Text style={styles.welcomeSubtitle}>
                        {loginFlowStep === 'phoneInput' ? 'Entrar com seu telefone' :
                         loginFlowStep === 'otpInput' ? 'Verificar Código OTP' :
                         'Entrar com Senha'}
                    </Text>

                    <>
                        {loginFlowStep === 'phoneInput' && (
                            <InputWithIcon
                                iconName="call-outline"
                                placeholder="(XX) XXXXX-XXXX"
                                value={phoneNumber}
                                onChangeText={(text: string) => {
                                    setPhoneNumber(formatPhoneNumber(text));
                                    if (errorMessage) setErrorMessage(null);
                                }}
                                keyboardType="phone-pad"
                                maxLength={15}
                            />
                        )}
                        {loginFlowStep === 'otpInput' && (
                            <InputWithIcon
                                iconName="mail-outline"
                                placeholder="Código de 6 dígitos"
                                value={otpCode}
                                onChangeText={(text: string) => {
                                    setOtpCode(text);
                                    if (errorMessage) setErrorMessage(null);
                                }}
                                keyboardType="numeric"
                                maxLength={6}
                                textAlign="center"
                                style={styles.otpInput}
                            />
                        )}
                        {loginFlowStep === 'passwordInput' && (
                            <InputWithIcon
                                iconName="lock-closed-outline"
                                placeholder="Sua Senha"
                                value={password}
                                onChangeText={(text: string) => {
                                    setPassword(text);
                                    if (errorMessage) setErrorMessage(null);
                                }}
                                secureTextEntry={true}
                            />
                        )}
                        <AnimatedErrorMessage message={errorMessage} isVisible={!!errorMessage} centered={true} />
                        <Animated.View style={{ transform: [{ scale: signInButtonAnims.scaleAnim }] }}>
                            <TouchableOpacity
                                style={[styles.signInButton, loading && styles.buttonDisabled]}
                                onPress={
                                    loginFlowStep === 'phoneInput' ? handlePhoneSubmit :
                                    loginFlowStep === 'otpInput' ? handleOtpSubmit :
                                    handlePasswordSubmit
                                }
                                onPressIn={signInButtonAnims.onPressIn}
                                onPressOut={signInButtonAnims.onPressOut}
                                disabled={loading}
                            >
                                {loading ? (
                                    <ActivityIndicator color="#FFFFFF" />
                                ) : (
                                    <Text style={styles.signInButtonText}>
                                        {loginFlowStep === 'phoneInput' ? 'Continuar' :
                                         loginFlowStep === 'otpInput' ? 'Verificar Código' :
                                         'Entrar'}
                                    </Text>
                                )}
                            </TouchableOpacity>
                        </Animated.View>

                        {(loginFlowStep === 'otpInput' || loginFlowStep === 'passwordInput') && (
                            <View style={styles.otpActions}>
                                <TouchableOpacity
                                    style={styles.backButton}
                                    onPress={() => {
                                        setLoginFlowStep('phoneInput');
                                        setErrorMessage(null);
                                        setTimer(0);
                                        setPassword('');
                                        setOtpCode('');
                                        console.log('[LoginScreen] Voltou para input de telefone.');
                                    }}
                                >
                                    <Text style={styles.backButtonText}>Voltar</Text>
                                </TouchableOpacity>
                                {loginFlowStep === 'otpInput' && (
                                    <TouchableOpacity
                                        style={[styles.resendButton, timer > 0 && styles.resendButtonDisabled]}
                                        onPress={handleResendOtp}
                                        disabled={timer > 0 || loading}
                                    >
                                        <Text style={[styles.resendButtonText, timer > 0 && styles.resendButtonTextDisabled]}>
                                            {timer > 0 ? `Reenviar em ${timer}s` : 'Reenviar código'}
                                        </Text>
                                    </TouchableOpacity>
                                )}
                            </View>
                        )}
                    </>

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
    inputWrapper: {
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
    iconCircle: {
        width: 50,
        height: 30,
        right: 2,
        borderRadius: 40,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#FFFFFF',
        marginRight: 10,
    },
    input: {
        flex: 1,
        fontSize: 15,
        color: '#2D3748',
        right: 8,
        height: '70%',
        paddingVertical: 0,
    },
    eyeIconTouchable: {
        paddingHorizontal: 15,
        height: '100%',
        justifyContent: 'center',
    },
    inlineErrorMessage: {
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
        letterSpacing: 8,
        fontSize: 18,
    },
    otpActions: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginTop: 20,
        bottom: 40,
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
        backgroundColor: '#E0F7FA',
    },
    resendButtonDisabled: {
        opacity: 0.6,
        backgroundColor: '#CFD8DC',
    },
    resendButtonText: {
        color: '#00BCD4',
        fontSize: 14,
        fontWeight: '600',
    },
    resendButtonTextDisabled: {
        color: '#78909C',
    },
});