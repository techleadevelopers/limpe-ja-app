import React, { useEffect, useRef, useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    ActivityIndicator,
    ScrollView,
    KeyboardAvoidingView,
    Platform,
    StatusBar,
    Animated,
    Dimensions
} from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import AuthService from '../../services/authService';
import { InputWithIcon } from '../../components/auth/components/InputWithIcon';
import { AnimatedErrorMessage } from '../../components/auth/components/AnimatedErrorMessage';

import AnimatedReanimated, {
    Easing,
    Extrapolate,
    interpolate,
    useAnimatedStyle,
    useSharedValue,
    withRepeat,
    withTiming,
} from 'react-native-reanimated';

// Usa a mesma logo do login
const LOGO_IMAGE = require('../../assets/images/logo.png');

const SCREEN_HEIGHT = Dimensions.get('window').height;

export default function ForgotPasswordScreen() {
    const [email, setEmail] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [message, setMessage] = useState<string | null>(null);
    const [isSuccess, setIsSuccess] = useState(false);
    const router = useRouter();

    const mainElementsOpacity = useRef(new Animated.Value(0)).current;
    const mainElementsTranslateY = useRef(new Animated.Value(18)).current;

    // animações da logo
    const logoRotateY = useSharedValue(0);
    const logoPulseScale = useSharedValue(1);

    useEffect(() => {
        Animated.parallel([
            Animated.timing(mainElementsOpacity, { toValue: 1, duration: 700, delay: 200, useNativeDriver: true }),
            Animated.timing(mainElementsTranslateY, { toValue: 0, duration: 700, delay: 200, useNativeDriver: true })
        ]).start(() => {
            logoRotateY.value = withRepeat(withTiming(1, { duration: 4000, easing: Easing.inOut(Easing.ease) }), -1, true);
            logoPulseScale.value = withRepeat(withTiming(1.02, { duration: 1500, easing: Easing.inOut(Easing.ease) }), -1, true);
        });
    }, [mainElementsOpacity, mainElementsTranslateY, logoRotateY, logoPulseScale]);

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

    const createButtonAnimations = () => {
        const scaleAnim = useRef(new Animated.Value(1)).current;
        const onPressIn = () => Animated.spring(scaleAnim, { toValue: 0.97, useNativeDriver: true, friction: 7 }).start();
        const onPressOut = () => Animated.spring(scaleAnim, { toValue: 1, useNativeDriver: true, friction: 7 }).start();
        return { scaleAnim, onPressIn, onPressOut };
    };

    const resetButtonAnims = createButtonAnimations();

    const handleResetPassword = async () => {
        setMessage(null);
        setIsSuccess(false);

        if (!email.trim()) {
            setMessage('Por favor, insira seu e-mail.');
            return;
        }
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email.trim())) {
            setMessage('Por favor, insira um endereço de e-mail válido.');
            return;
        }

        setIsLoading(true);
        try {
            await AuthService.sendPasswordReset(email.trim().toLowerCase());
            setMessage('Um link para redefinir sua senha foi enviado para seu e-mail. Verifique sua caixa de entrada (e spam)!');
            setIsSuccess(true);
        } catch (error: any) {
            console.error("[ForgotPasswordScreen] Erro ao redefinir senha:", error);
            setMessage(error.message || 'Não foi possível enviar o link de redefinição. Tente novamente mais tarde.');
            setIsSuccess(false);
        } finally {
            setIsLoading(false);
        }
    };

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
                    <View style={styles.headerSection}>
                        {/* Logo animada no lugar do cadeado */}
                        <AnimatedReanimated.Image
                            source={LOGO_IMAGE}
                            style={[styles.logo, animatedLogoStyle]}
                            resizeMode="contain"
                        />
                        <Text style={styles.mainTitle}>Redefinir Senha</Text>
                        <Text style={styles.welcomeSubtitle}>
                            Informe o e-mail associado à sua conta e enviaremos um link para você redefinir sua senha.
                        </Text>
                    </View>

                    <InputWithIcon
                        iconName="mail-outline"
                        placeholder="Seu E-mail"
                        value={email}
                        onChangeText={(text: string) => {
                            setEmail(text);
                            if (message) setMessage(null);
                        }}
                        keyboardType="email-address"
                        autoCapitalize="none"
                        textContentType="emailAddress"
                        autoComplete="email"
                    />

                    <AnimatedErrorMessage message={message} isVisible={!!message} centered={true} isSuccess={isSuccess} />

                    <Animated.View style={{ transform: [{ scale: resetButtonAnims.scaleAnim }] }}>
                        <TouchableOpacity
                            style={[styles.signInButton, isLoading && styles.buttonDisabled]}
                            onPress={handleResetPassword}
                            onPressIn={resetButtonAnims.onPressIn}
                            onPressOut={resetButtonAnims.onPressOut}
                            disabled={isLoading}
                        >
                            {isLoading ? (
                                <ActivityIndicator color="#FFFFFF" />
                            ) : (
                                <Text style={styles.signInButtonText}>
                                    Enviar Link de Redefinição
                                </Text>
                            )}
                        </TouchableOpacity>
                    </Animated.View>

                    <View style={styles.backToLoginContainer}>
                        <TouchableOpacity onPress={() => router.back()}>
                            <Text style={styles.backToLoginLink}>Voltar para o Login</Text>
                        </TouchableOpacity>
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
    headerSection: {
        alignItems: 'center',
        marginBottom: 30,
        bottom: 42,
    },
    logo: {
        width: 145,
        height: 200,
        resizeMode: 'contain',
        marginBottom: -25,
        marginTop: 0,
    },
    mainTitle: {
        fontSize: 26,
        fontWeight: 'bold',
        color: '#1C3A5F',
        textAlign: 'center',
        marginBottom: 10,
    },
    welcomeSubtitle: {
        fontSize: 13.5,
        color: '#8A94A6',
        textAlign: 'center',
        marginBottom: 50,
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
    backToLoginContainer: {
        alignItems: 'center',
        marginBottom: 20,
        bottom: 45,
    },
    backToLoginLink: {
        fontSize: 13,
        color: '#007BFF',
        fontWeight: '500',
    },
});
