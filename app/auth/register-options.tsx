// app/auth/register-options.tsx
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { Link, Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useRef } from 'react';
import {
    Animated,
    Image,
    Platform,
    StatusBar,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from 'react-native';
import { AUTH_ROUTES, CLIENT_ROUTES } from '../routes';
// import { LinearGradient } from 'expo-linear-gradient'; // Removido, não será mais usado diretamente nos botões

// Certifique-se que o caminho para o seu logo está correto
const LOGO_IMAGE = require('../../assets/images/logo.png');

export default function ChooseRegistrationTypeScreen() {
    const router = useRouter();
    const { from } = useLocalSearchParams<{ from?: string }>();

    // Animações para elementos da tela
    const logoAnim = useRef(new Animated.Value(0)).current;
    const titleAnim = useRef(new Animated.Value(0)).current;
    const subtitleAnim = useRef(new Animated.Value(0)).current;
    const clientButtonAnim = useRef(new Animated.Value(0)).current;
    const providerButtonAnim = useRef(new Animated.Value(0)).current;
    const loginLinkAnim = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        // Animação de entrada escalonada para todos os elementos
        Animated.sequence([
            Animated.timing(logoAnim, {
                toValue: 1,
                duration: 800,
                useNativeDriver: true,
            }),
            Animated.parallel([
                Animated.timing(titleAnim, {
                    toValue: 1,
                    duration: 500,
                    useNativeDriver: true,
                }),
                Animated.timing(subtitleAnim, {
                    toValue: 1,
                    duration: 500,
                    delay: 100,
                    useNativeDriver: true,
                }),
            ]),
            Animated.stagger(150, [
                Animated.timing(clientButtonAnim, {
                    toValue: 1,
                    duration: 400,
                    useNativeDriver: true,
                }),
                Animated.timing(providerButtonAnim, {
                    toValue: 1,
                    duration: 400,
                    useNativeDriver: true,
                }),
                Animated.timing(loginLinkAnim, {
                    toValue: 1,
                    duration: 300,
                    useNativeDriver: true,
                }),
            ]),
        ]).start();
    }, []);

    // Funções de animação para o "press in/out" dos botões
    const createButtonAnimation = () => {
        const scaleAnim = useRef(new Animated.Value(1)).current;
        const onPressIn = () => Animated.spring(scaleAnim, { toValue: 0.96, useNativeDriver: true, friction: 3 }).start();
        const onPressOut = () => Animated.spring(scaleAnim, { toValue: 1, useNativeDriver: true, friction: 3 }).start();
        return { scaleAnim, onPressIn, onPressOut };
    };

    const clientButtonAnims = createButtonAnimation();
    const providerButtonAnims = createButtonAnimation();

    return (
        <View style={styles.container}>
            <StatusBar barStyle="dark-content" backgroundColor={styles.container.backgroundColor} />
            <Stack.Screen options={{ headerShown: false }} />

            {/* Logo com Animação */}
            <Animated.View
                style={[
                    styles.logoContainer,
                    {
                        opacity: logoAnim,
                        transform: [{ scale: logoAnim.interpolate({ inputRange: [0, 1], outputRange: [0.8, 1] }) }],
                    },
                ]}
            >
                <Image source={LOGO_IMAGE} style={styles.logo} />
            </Animated.View>

            {/* Títulos com Animação */}
            <Animated.Text
                style={[
                    styles.mainTitle,
                    {
                        opacity: titleAnim,
                        transform: [{ translateY: titleAnim.interpolate({ inputRange: [0, 1], outputRange: [20, 0] }) }],
                    },
                ]}
            >
                Bem-vindo(a) ao LimpeJá !
            </Animated.Text>
            <Animated.Text
                style={[
                    styles.subtitle,
                    {
                        opacity: subtitleAnim,
                        transform: [{ translateY: subtitleAnim.interpolate({ inputRange: [0, 1], outputRange: [20, 0] }) }],
                    },
                ]}
            >
                Você é cliente ou prestador?
            </Animated.Text>

            {/* Container para os botões lado a lado */}
            <View style={styles.buttonsRow}>
                {/* Botão "Sou Cliente" com estilo do botão de login */}
                <Animated.View
                    style={[
                        styles.buttonWrapper,
                        {
                            opacity: clientButtonAnim,
                            transform: [{ translateY: clientButtonAnim.interpolate({ inputRange: [0, 1], outputRange: [30, 0] }) }, { scale: clientButtonAnims.scaleAnim }],
                        },
                    ]}
                >
                    <TouchableOpacity
                        style={styles.actionButton} // Usando o estilo do botão de login
                        onPress={() => {
                            clientButtonAnims.onPressOut();
                            router.push(CLIENT_ROUTES.EXPLORE);
                        }}
                        onPressIn={clientButtonAnims.onPressIn}
                        onPressOut={clientButtonAnims.onPressOut}
                    >
                        <Ionicons name="person-outline" size={20} color="#FFFFFF" />
                        <Text style={styles.actionButtonText}>Cliente</Text>
                    </TouchableOpacity>
                </Animated.View>

                {/* Botão "Sou Profissional" com estilo do botão de login */}
                <Animated.View
                    style={[
                        styles.buttonWrapper,
                        {
                            opacity: providerButtonAnim,
                            transform: [{ translateY: providerButtonAnim.interpolate({ inputRange: [0, 1], outputRange: [30, 0] }) }, { scale: providerButtonAnims.scaleAnim }],
                        },
                    ]}
                >
                    <TouchableOpacity
                        style={styles.actionButton} // Usando o estilo do botão de login
                        onPress={() => {
                            providerButtonAnims.onPressOut();
                            router.push(AUTH_ROUTES.PROVIDER_REGISTER); // Rota para o índice do cadastro de profissional
                        }}
                        onPressIn={providerButtonAnims.onPressIn}
                        onPressOut={providerButtonAnims.onPressOut}
                    >
                        <MaterialCommunityIcons name="briefcase-outline" size={20} color="#FFFFFF" />
                        <Text style={styles.actionButtonText}>Profissional</Text>
                    </TouchableOpacity>
                </Animated.View>
            </View>

            {/* Link para Login com Animação */}
            <Animated.View
                style={[
                    styles.loginLinkContainer,
                    {
                        opacity: loginLinkAnim,
                        transform: [{ translateY: loginLinkAnim.interpolate({ inputRange: [0, 1], outputRange: [20, 0] }) }],
                    },
                ]}
            >
                <Text style={styles.loginText}>Já tem uma conta? </Text>
                <Link href={AUTH_ROUTES.LOGIN} asChild>
                    <TouchableOpacity>
                        <Text style={styles.loginLink}>Faça Login</Text>
                    </TouchableOpacity>
                </Link>
            </Animated.View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'transparent',
        padding: 25,
        marginTop: Platform.OS === 'android' ? 40 : 0,
    },
    logoContainer: {
        marginBottom: Platform.OS === 'android' ? 3 : 20,
        marginTop: -80,
    },
    logo: {
        width: Platform.OS === 'android' ? 135 : 170,
        height: Platform.OS === 'android' ? 170 : 160,
        resizeMode: 'contain',
    },
    mainTitle: {
        fontSize: Platform.OS === 'android' ? 25 :28,
        fontWeight: 'bold',
        color: '#1C3A5F',
        textAlign: 'center',
        marginBottom: 10,
    },
    subtitle: {
        fontSize: 16,
        color: '#6C757D',
        textAlign: 'center',
        marginBottom: 40,
        paddingHorizontal: 15,
    },
    // NOVO: Container para os botões ficarem lado a lado
    buttonsRow: {
        flexDirection: 'row',
        justifyContent: 'space-around', // Distribui o espaço uniformemente
        width: '100%',
        maxWidth: 350,
        marginBottom: 20, // Espaço abaixo dos botões
    },
    buttonWrapper: {
        flex: 1, // Permite que os botões ocupem o espaço disponível em sua linha
        marginHorizontal: 8, // Espaçamento entre os botões
    },
    // NOVO: Estilo copiado e adaptado do signInButton do login.tsx
    actionButton: {
        backgroundColor: '#40C0F0', // Cor do botão de login
        borderRadius: 28,          // Borda arredondada do botão de login
        paddingVertical: Platform.OS === 'android' ? 10 : 15,       // Aumentei um pouco para um melhor toque, o do login é 10
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: 52, // Altura mínima para garantir consistência
        flexDirection: 'row', // Para colocar o ícone e o texto lado a lado
        shadowColor: '#007BFF',    // Cor da sombra do botão de login
        shadowOffset: { width: 0, height: 5 }, // Offset da sombra do botão de login
        shadowOpacity: 0.3,        // Opacidade da sombra do botão de login
        shadowRadius: 8,           // Raio da sombra do botão de login
        elevation: 0,              // Elevação para Android do botão de login
    },
    actionButtonText: {
        color: '#FFFFFF',          // Cor do texto do botão de login
        fontSize: Platform.OS === 'android' ? 15 : 16,              // Aumentei para 16, o do login é 14, para se destacar mais
        fontWeight: '600',         // Peso da fonte do botão de login
        marginLeft: 8, // Espaçamento entre o ícone e o texto
    },
    loginLinkContainer: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: Platform.OS === 'android' ? 8 :  30,
    },
    loginText: {
        fontSize: 15,
        color: '#6C757D',
    },
    loginLink: {
        fontSize: 15,
        color: '#007AFF',
        fontWeight: 'bold',
        marginLeft: 5,
    },
});
