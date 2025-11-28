import { Link, Stack, useRouter } from 'expo-router';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
    ActivityIndicator,
    Animated,
    Dimensions,
    Easing as RNEasing,
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

/**
 * BubblesRN - componente inline para efeito de bolhas.
 * Se preferir, mova para components/BubblesRN.tsx e importe.
 */
type BubbleSpec = {
    key: string;
    left: number; // 0..1
    size: number;
    duration: number;
    delay: number;
    horizontalOffset: number;
    blurRadius: number;
};

type BubblesRNProps = {
    countMin?: number;
    countMax?: number;
    bubbleMin?: number;
    bubbleMax?: number;
    bubbleColor?: string;
    bubbleBorderColor?: string;   // Adicionado para suporte a bordas
    bubbleBorderWidth?: number;   // Adicionado para suporte a bordas
    style?: any;
    pointerEvents?: any;
};

const rand = (min: number, max: number) => min + Math.random() * (max - min);
const randInt = (min: number, max: number) => Math.floor(rand(min, max + 1));

function BubblesRN({
    countMin = 22,
    countMax = 44,
    bubbleMin = 6,
    bubbleMax = 16,
    bubbleColor = 'rgba(3,112,255,0.85)',
    bubbleBorderColor = 'rgba(29, 175, 242, 1)',  // Default para borda azul
    bubbleBorderWidth = 2,  // Default para espessura da borda
    style,
    pointerEvents = 'none',
}: BubblesRNProps) {
    const specs: BubbleSpec[] = useMemo(() => {
        const count = countMin + Math.floor(Math.random() * (countMax - countMin + 1));
        // debug: mostrar quantas bolhas foram criadas
        console.log('[BubblesRN] creating', count, 'bubbles');
        const arr: BubbleSpec[] = [];
        for (let i = 0; i < count; i++) {
            const size = randInt(bubbleMin, bubbleMax);
            const left = rand(0, 1);
            const duration = randInt(3500, 10000);
            const delay = randInt(0, 7000);
            const horizontalOffset = rand(6, 28);
            const blurRadius = randInt(0, 2);
            arr.push({
                key: `b-${i}-${Date.now()}`,
                left,
                size,
                duration,
                delay,
                horizontalOffset,
                blurRadius,
            });
        }
        return arr;
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    return (
        <View style={[bubblesStyles.container, style]} pointerEvents={pointerEvents}>
            {specs.map((s) => (
                <Bubble key={s.key} spec={s} color={bubbleColor} borderColor={bubbleBorderColor} borderWidth={bubbleBorderWidth} />
            ))}
        </View>
    );
}

function Bubble({ spec, color, borderColor, borderWidth }: { spec: BubbleSpec; color: string; borderColor: string; borderWidth: number }) {
    const translateY = useRef(new Animated.Value(0)).current;
    const wobble = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        const toValue = - (SCREEN_HEIGHT + spec.size + 40);

        const mainAnim = Animated.sequence([
            Animated.delay(spec.delay),
            Animated.loop(
                Animated.timing(translateY, {
                    toValue,
                    duration: spec.duration,
                    easing: RNEasing.linear,
                    useNativeDriver: true,
                }),
                { iterations: -1 }
            )
        ]);

        const wobbleAnim = Animated.loop(
            Animated.timing(wobble, {
                toValue: 1,
                duration: Math.max(300, Math.floor(spec.duration / 8)),
                easing: RNEasing.linear,
                useNativeDriver: true,
            }),
            { iterations: -1 }
        );

        mainAnim.start();
        wobbleAnim.start();

        return () => {
            translateY.stopAnimation();
            wobble.stopAnimation();
        };
    }, [spec, translateY, wobble]);

    const wobbleX = wobble.interpolate({
        inputRange: [0, 0.5, 1],
        outputRange: [0, spec.horizontalOffset / 2, 0],
        extrapolate: 'clamp',
    });

    const initialLeft = spec.left * SCREEN_WIDTH - spec.size / 2;

    const animatedStyle = {
        transform: [
            { translateY: translateY },
            { translateX: wobbleX },
            { scale: wobble.interpolate({ inputRange: [0, 0.5, 1], outputRange: [1, 0.98, 1] }) },
        ],
        opacity: 0.9,
    };

    const bubbleStyle = {
        position: 'absolute' as const,
        left: initialLeft,
        bottom: -spec.size - 10,
        width: spec.size,
        height: spec.size,
        borderRadius: spec.size / 2,
        backgroundColor: color,
        borderColor: borderColor,  // Adicionado para borda
        borderWidth: borderWidth,  // Adicionado para espessura da borda
        ...Platform.select({
            ios: {
                shadowColor: color,
                shadowOffset: { width: 0, height: 0 },
                shadowOpacity: 0.6,
                shadowRadius: spec.blurRadius + 2,
            },
            android: {
                elevation: spec.blurRadius + 2,
            },
        }),
    };

    return (
        <Animated.View style={[bubbleStyle, animatedStyle]} />
    );
}

const bubblesStyles = StyleSheet.create({
    container: {
        ...StyleSheet.absoluteFillObject,
        overflow: 'hidden',
    },
});

/* ---------------------- fim BubblesRN ---------------------- */

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

            {/* Bubbles background: transparente, apenas bolhas azuis */}
            <BubblesRN
              countMin={52}
              countMax={65}
              bubbleMin={6}
              bubbleMax={16}
              bubbleColor={'rgba(29, 118, 242, 0.11)'}
              bubbleBorderColor = {'rgba(29, 93, 242, 0.18)'}
              bubbleBorderWidth ={0.5}
              style={{ ...StyleSheet.absoluteFillObject, zIndex: 0 }}
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
        backgroundColor: 'transparent', // alterado para transparente conforme pedido
    },
    scrollContentContainer: {
        flexGrow: 1,
        justifyContent: 'center',
        paddingBottom: 10,
    },
    contentWrapper: {
        paddingHorizontal: 49,
        paddingTop: Platform.OS === 'ios' ? 60 : 100,
        bottom: 100,
        zIndex: 2, // garante estar acima das bolhas
        backgroundColor: 'transparent',
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
        shadowColor: '#8ca3ac98',
        shadowRadius: 10,
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
        // **ALTERAÇÃO AQUI: 44 * 0.95 = 41.8**
        height: 41.8, 
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
        paddingVertical: 8,
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
        fontSize: 15,
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
        fontSize: 13,
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
        fontSize: 14,
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