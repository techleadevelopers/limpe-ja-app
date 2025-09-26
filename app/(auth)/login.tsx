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

import Toast from 'react-native-toast-message';

const LOGO_IMAGE = require('../../assets/images/logo2.png');

const SCREEN_WIDTH = Dimensions.get('window').width;
const SCREEN_HEIGHT = Dimensions.get('window').height;

import { AnimatedErrorMessage } from '../../components/auth/components/AnimatedErrorMessage';
import { InputWithIcon } from '../../components/auth/components/InputWithIcon';


export default function LoginScreen() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    
    const [loading, setLoading] = useState(false);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);

    const { isAuthenticated, isLoading: authIsLoading, user, login } = useAuth();
    const router = useRouter();

    const mainElementsOpacity = useRef(new Animated.Value(0)).current;
    const mainElementsTranslateY = useRef(new Animated.Value(18)).current;

    const logoRotateY = useSharedValue(0);
    const logoPulseScale = useSharedValue(1);
    const logoGlow = useSharedValue(0);
    const logoFloatY = useSharedValue(0);

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
            logoGlow.value = withRepeat(
                withTiming(1, { duration: 2000, easing: Easing.inOut(Easing.ease) }),
                -1,
                true
            );
            logoFloatY.value = withRepeat(
                withTiming(1, { duration: 3000, easing: Easing.inOut(Easing.ease) }),
                -1,
                true
            );
        };

        if (!authIsLoading && isAuthenticated) {
            console.log('[LoginScreen] Usuário autenticado, redirecionando...');
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
    }, [isAuthenticated, authIsLoading, user, router, logoRotateY, logoPulseScale, logoGlow, logoFloatY, mainElementsOpacity, mainElementsTranslateY]);

    const createButtonAnimations = () => {
        const scaleAnim = useRef(new Animated.Value(1)).current;
        const onPressIn = () => Animated.spring(scaleAnim, { toValue: 0.97, useNativeDriver: true, friction: 7 }).start();
        const onPressOut = () => Animated.spring(scaleAnim, { toValue: 1, useNativeDriver: true, friction: 7 }).start();
        return { scaleAnim, onPressIn, onPressOut };
    };

    const signInButtonAnims = createButtonAnimations();

    // Estilo animado adicional para o logo
    const animatedLogoStyle = useAnimatedStyle(() => {
        const rotation = interpolate(
            logoRotateY.value,
            [0, 0.5, 1],
            [-5, 0, 5],
            Extrapolate.CLAMP
        );

        const floatY = interpolate(
            logoFloatY.value,
            [0, 0.5, 1],
            [0, -6, 0],
            Extrapolate.CLAMP
        );

        const glowOpacity = interpolate(logoGlow.value, [0, 1], [0.4, 0.9]);

        return {
            transform: [
                { scale: logoPulseScale.value },
                { rotateY: `${rotation}deg` },
                { translateY: floatY }
            ],
            // Apenas shadowOpacity é animada aqui.
            // As outras propriedades de sombra (shadowColor, shadowRadius, shadowOffset)
            // serão definidas no styles.logo estaticamente.
            shadowOpacity: glowOpacity,
        };
    });

    const handleLogin = async () => {
        if (!email.trim() || !password.trim()) {
            setErrorMessage('Por favor, preencha seu e-mail e senha.');
            return;
        }

        setLoading(true);
        setErrorMessage(null);

        try {
            console.log('[LoginScreen] handleLogin: Tentando login com e-mail:', email);
            await login({ email: email.trim(), password: password });

            Toast.show({
                type: 'loginSuccess',
                text1: 'Login realizado!',
                text2: 'Bem-vindo de volta 👋',
                visibilityTime: 2500,
                topOffset: 60
            });
            
        } catch (error: any) {
            console.error('Erro ao fazer login:', error.message, error);
            const errorMessageFromApi = error.response?.data?.message || 'Credenciais inválidas.';
            setErrorMessage(errorMessageFromApi);

            Toast.show({
                type: 'error',
                text1: 'Erro no login',
                text2: errorMessageFromApi,
                visibilityTime: 3000,
                topOffset: 60
            });
        } finally {
            setLoading(false);
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
                            style={[styles.logo, animatedLogoStyle]} // Aplica ambos os estilos
                            resizeMode="contain"
                        />
                    </View>

                    <Text style={styles.welcomeSubtitle}>
                        Entrar com seu e-mail e senha
                    </Text>

                    <>
                        <InputWithIcon
                            iconName="mail-outline"
                            placeholder="Seu E-mail"
                            value={email}
                            onChangeText={(text: string) => {
                                setEmail(text);
                                if (errorMessage) setErrorMessage(null);
                            }}
                            keyboardType="email-address"
                            autoCapitalize="none"
                            textContentType="emailAddress"
                            autoComplete="email"
                        />

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
                        
                        <AnimatedErrorMessage message={errorMessage} isVisible={!!errorMessage} centered={true} />
                        
                        <Animated.View style={{ transform: [{ scale: signInButtonAnims.scaleAnim }] }}>
                            <TouchableOpacity
                                style={[styles.signInButton, loading && styles.buttonDisabled]}
                                onPress={handleLogin}
                                onPressIn={signInButtonAnims.onPressIn}
                                onPressOut={signInButtonAnims.onPressOut}
                                disabled={loading}
                            >
                                {loading ? (
                                    <ActivityIndicator color="#FFFFFF" />
                                ) : (
                                    <Text style={styles.signInButtonText}>
                                        Entrar
                                    </Text>
                                )}
                            </TouchableOpacity>
                        </Animated.View>
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
        paddingTop: Platform.OS === 'ios' ? 20 : 100,
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
        // Adicione as propriedades de sombra estáticas aqui
        shadowColor: '#40C0F0',
        shadowRadius: 20,
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.8, // Opacidade base para a sombra
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