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
// REMOVIDO: import auth from '@react-native-firebase/auth'; // Não usaremos mais a API namespaced diretamente
// NOVO: Importa getAuth e signInWithPhoneNumber da API modular do Firebase Auth
import { getAuth, signInWithPhoneNumber } from 'firebase/auth'; // API Modular para Web e Nativo
// Importa a instância do authClient do firebaseClient.ts (se precisar para getAuth(app) em algum caso)
// import { authClient } from '../config/firebaseClient'; // Não precisaremos mais de authClient aqui diretamente

import { LinearGradient } from 'expo-linear-gradient';
import { useAuth } from '../../contexts/AuthContext';
import { UserRole } from '../../types/backend/auth';

// Importações do Reanimated (mantidas)
import AnimatedReanimated, {
    Easing,
    Extrapolate,
    interpolate,
    useAnimatedStyle,
    useSharedValue,
    withRepeat,
    withTiming,
} from 'react-native-reanimated';

const LOGO_IMAGE = require('../../assets/images/logo2.png');

const SCREEN_WIDTH = Dimensions.get('window').width;
const SCREEN_HEIGHT = Dimensions.get('window').height;

import { AnimatedErrorMessage } from '../../components/auth/components/AnimatedErrorMessage';
import { InputWithIcon } from '../../components/auth/components/InputWithIcon';


export default function LoginScreen() {
    const [phoneNumber, setPhoneNumber] = useState('');
    const [otpCode, setOtpCode] = useState('');
    const [confirmationResult, setConfirmationResult] = useState<any>(null); 
    const [otpStep, setOtpStep] = useState<'phone' | 'otp'>('phone'); 
    const [otpLoading, setOtpLoading] = useState(false); 
    const [otpErrorMessage, setOtpErrorMessage] = useState<string | null>(null); 
    const [timer, setTimer] = useState(0); 

    const { loginWithFirebaseIdToken, isAuthenticated, isLoading: authIsLoading, user } = useAuth(); 
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
            const targetRoute = user?.role === UserRole.CLIENT ? '/(client)/explore' : user?.role === UserRole.PROVIDER ? '/(provider)/dashboard' : '/';
            router.replace(targetRoute as any);
        } else if (!isAuthenticated) {
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

    // --- FUNÇÃO handlePhoneSubmit (AGORA USA FIREBASE AUTH ESPECÍFICO PARA PLATAFORMA) ---
    const handlePhoneSubmit = async () => {
        const cleanPhone = phoneNumber.replace(/\D/g, '');
        const fullPhoneNumber = `+55${cleanPhone}`; 

        if (!cleanPhone || cleanPhone.length < 11) {
            setOtpErrorMessage('Por favor, insira um número de telefone válido (DDD + 9 dígitos).');
            return;
        }

        setOtpLoading(true);
        setOtpErrorMessage(null);

        try {
            // CORREÇÃO: Usar getAuth() e signInWithPhoneNumber da API modular
            const authInstance = getAuth(); // Obtém a instância de autenticação do Firebase
            const confirmation = await signInWithPhoneNumber(authInstance, fullPhoneNumber); 
            
            setConfirmationResult(confirmation); 
            setOtpStep('otp'); 
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

            Alert.alert('Código Enviado', `Um código de verificação foi enviado para ${formatPhoneNumber(phoneNumber)}.`);

        } catch (error: any) {
            console.error('Erro ao iniciar Firebase Phone Auth:', error);
            let firebaseErrorMessage = 'Erro desconhecido. Tente novamente.';
            if (error.code === 'auth/invalid-phone-number') {
                firebaseErrorMessage = 'Número de telefone inválido.';
            } else if (error.code === 'auth/too-many-requests') {
                firebaseErrorMessage = 'Muitas tentativas. Tente novamente mais tarde.';
            } else if (error.code === 'auth/app-not-authorized') {
                firebaseErrorMessage = 'Seu app não está autorizado para usar Firebase Phone Auth. Verifique SHA-1/SHA-256 no console Firebase.';
            } else if (error.code === 'auth/quota-exceeded') {
                firebaseErrorMessage = 'Cota de SMS excedida para este telefone. Tente novamente em 24h.';
            } else if (error.code === 'auth/web-storage-unsupported') { 
                firebaseErrorMessage = 'Armazenamento web não suportado ou cookies desativados. Ative os cookies do navegador.';
            }
            setOtpErrorMessage(firebaseErrorMessage);
        } finally {
            setOtpLoading(false);
        }
    };

    // --- FUNÇÃO handleOtpSubmit (USA FIREBASE AUTH E ENVIA ID TOKEN PARA BACKEND) ---
    const handleOtpSubmit = async () => {
        if (!otpCode || otpCode.length < 6) {
            setOtpErrorMessage('Por favor, insira o código de 6 dígitos.');
            return;
        }
        if (!confirmationResult) {
            setOtpErrorMessage('Erro de sessão. Por favor, reinicie o processo de envio do código.');
            return;
        }

        setOtpLoading(true);
        setOtpErrorMessage(null);

        try {
            // 1. Confirma o código OTP com o Firebase
            const userCredential = await confirmationResult.confirm(otpCode);
            const firebaseUser = userCredential.user;
            const idToken = await firebaseUser.getIdToken(); 

            console.log('[LoginScreen] Firebase OTP verificado com sucesso. Enviando ID Token para o backend.');

            // 2. Envia o ID Token do Firebase para o seu backend para login/registro final
            await loginWithFirebaseIdToken(idToken);

            Alert.alert('Sucesso!', 'Login realizado com sucesso!');

        } catch (error: any) {
            console.error('Erro ao verificar OTP com Firebase ou backend:', error);
            let errorMessage = 'Código OTP inválido ou expirado. Tente novamente.';
            if (error.code === 'auth/invalid-verification-code') {
                errorMessage = 'O código de verificação é inválido.';
            } else if (error.code === 'auth/code-expired') {
                errorMessage = 'O código expirou. Por favor, solicite um novo.';
            } else if (error.response?.data?.message) { 
                errorMessage = error.response.data.message;
            }
            setOtpErrorMessage(errorMessage);
        } finally {
            setOtpLoading(false);
        }
    };

    // --- FUNÇÃO handleResendOtp (USA FIREBASE AUTH NOVAMENTE) ---
    const handleResendOtp = async () => {
        if (timer > 0) return; 

        setOtpLoading(true);
        setOtpErrorMessage(null);

        try {
            const cleanPhone = phoneNumber.replace(/\D/g, '');
            const fullPhoneNumber = `+55${cleanPhone}`;

            // CORREÇÃO: Usar getAuth() e signInWithPhoneNumber da API modular para reenviar
            const authInstance = getAuth();
            const newConfirmation = await signInWithPhoneNumber(authInstance, fullPhoneNumber);
            
            setConfirmationResult(newConfirmation); 
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
            console.error('Erro ao reenviar SMS:', error);
            let firebaseErrorMessage = 'Erro ao reenviar código. Tente novamente.';
            if (error.code === 'auth/too-many-requests') {
                firebaseErrorMessage = 'Muitas tentativas de reenvio. Espere antes de tentar novamente.';
            } else if (error.code === 'auth/invalid-phone-number') {
                firebaseErrorMessage = 'Número de telefone inválido para reenvio.';
            }
            setOtpErrorMessage(firebaseErrorMessage);
        } finally {
            setOtpLoading(false);
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
                        {otpStep === 'phone' ? 'Entrar com seu telefone' : 'Verificar Código OTP'}
                    </Text>

                    <>
                        {otpStep === 'phone' ? (
                            <InputWithIcon
                                iconName="call-outline"
                                placeholder="(XX) XXXXX-XXXX"
                                value={phoneNumber}
                                onChangeText={(text: string) => {
                                    setPhoneNumber(formatPhoneNumber(text));
                                    if (otpErrorMessage) setOtpErrorMessage(null);
                                }}
                                keyboardType="phone-pad"
                                maxLength={15}
                            />
                        ) : (
                            <InputWithIcon
                                iconName="lock-closed-outline"
                                placeholder="Código de 6 dígitos"
                                value={otpCode}
                                onChangeText={(text: string) => {
                                    setOtpCode(text);
                                    if (otpErrorMessage) setOtpErrorMessage(null);
                                }}
                                keyboardType="numeric"
                                maxLength={6}
                                textAlign="center"
                                style={styles.otpInput}
                            />
                        )}

                        <AnimatedErrorMessage message={otpErrorMessage} isVisible={!!otpErrorMessage} centered={true} />

                        <Animated.View style={{ transform: [{ scale: signInButtonAnims.scaleAnim }] }}>
                            <TouchableOpacity
                                style={[styles.signInButton, otpLoading && styles.buttonDisabled]}
                                onPress={otpStep === 'phone' ? handlePhoneSubmit : handleOtpSubmit}
                                onPressIn={signInButtonAnims.onPressIn}
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
                                        setTimer(0);
                                    }}
                                >
                                    <Text style={styles.backButtonText}>Voltar</Text>
                                </TouchableOpacity>

                                <TouchableOpacity
                                    style={[styles.resendButton, timer > 0 && styles.resendButtonDisabled]}
                                    onPress={handleResendOtp}
                                    disabled={timer > 0 || otpLoading}
                                >
                                    <Text style={[styles.resendButtonText, timer > 0 && styles.resendButtonTextDisabled]}>
                                        {timer > 0 ? `Reenviar em ${timer}s` : 'Reenviar código'}
                                    </Text>
                                </TouchableOpacity>
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