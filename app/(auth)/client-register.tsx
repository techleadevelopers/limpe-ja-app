// LimpeJaApp/app/(auth)/client-register.tsx
import React, { useState, useRef, useEffect } from 'react';
import {
    View,
    Text,
    TextInput,
    StyleSheet,
    Alert,
    TouchableOpacity,
    ScrollView,
    Platform,
    KeyboardAvoidingView,
    ActivityIndicator,
    Animated, // Importar Animated para animações
} from 'react-native';
import { Stack, useRouter, Link } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
// import { registerClient } from '../../services/authService'; // Importar o authService real
// import { useAuth } from '../../hooks/useAuth'; // Ajuste o caminho se necessário (para o signIn real)

// Componente para exibir mensagens de erro inline com animação
const AnimatedErrorMessage: React.FC<{ message: string | null }> = ({ message }) => {
    const fadeAnim = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        if (message) {
            Animated.timing(fadeAnim, {
                toValue: 1,
                duration: 300,
                useNativeDriver: true,
            }).start();
        } else {
            Animated.timing(fadeAnim, {
                toValue: 0,
                duration: 200,
                useNativeDriver: true,
            }).start();
        }
    }, [message, fadeAnim]);

    if (!message) return null;

    return (
        <Animated.Text style={[styles.errorMessage, { opacity: fadeAnim }]}>
            {message}
        </Animated.Text>
    );
};

// Simulação do authService.ts para demonstração
// Em um ambiente real, você importaria do seu arquivo services/authService.ts
const mockAuthService = {
    registerClient: async (userData: any) => {
        await new Promise(resolve => setTimeout(resolve, 1500)); // Simula delay de rede
        // Simulação de sucesso para qualquer dado válido
        if (userData.email === 'erro@limpeja.com') { // Simula um e-mail já cadastrado
            throw new Error("Este e-mail já está cadastrado. Tente fazer login ou use outro e-mail.");
        }
        return { success: true, user: { id: 'new_client_id', email: userData.email, name: userData.name, role: 'client' } };
    },
};

export default function ClientRegisterScreen() {
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [phone, setPhone] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [agreedToTerms, setAgreedToTerms] = useState(false);
    const [isLoading, setIsLoading] = useState(false);

    // Estados para mensagens de erro inline
    const [nameError, setNameError] = useState<string | null>(null);
    const [emailError, setEmailError] = useState<string | null>(null);
    const [phoneError, setPhoneError] = useState<string | null>(null);
    const [passwordError, setPasswordError] = useState<string | null>(null);
    const [confirmPasswordError, setConfirmPasswordError] = useState<string | null>(null);
    const [termsError, setTermsError] = useState<string | null>(null);

    const router = useRouter();
    // const { signIn } = useAuth(); // Para usar o signIn real após o registro

    // Animações para os elementos da tela
    const headerAnim = useRef(new Animated.Value(0)).current;
    const formAnim = useRef(new Animated.Value(0)).current;

    // Animações para bordas dos inputs ao focar
    const nameBorderAnim = useRef(new Animated.Value(0)).current;
    const emailBorderAnim = useRef(new Animated.Value(0)).current;
    const phoneBorderAnim = useRef(new Animated.Value(0)).current;
    const passwordBorderAnim = useRef(new Animated.Value(0)).current;
    const confirmPasswordBorderAnim = useRef(new Animated.Value(0)).current;

    // Animação para o checkbox de termos
    const termsCheckboxScaleAnim = useRef(new Animated.Value(1)).current;

    useEffect(() => {
        // Animações de entrada
        Animated.stagger(200, [
            Animated.timing(headerAnim, {
                toValue: 1,
                duration: 600,
                useNativeDriver: true,
            }),
            Animated.timing(formAnim, {
                toValue: 1,
                duration: 800,
                delay: 200, // Atraso para aparecer depois do cabeçalho
                useNativeDriver: true,
            }),
        ]).start();
    }, [headerAnim, formAnim]);

    // Função para animar a borda do input ao focar/desfocar
    const animateInputBorder = (animationValue: Animated.Value, isFocused: boolean, hasError: boolean) => {
        if (hasError) return; // Não anima se houver erro
        Animated.timing(animationValue, {
            toValue: isFocused ? 1 : 0,
            duration: 200,
            useNativeDriver: false, // Border color não suporta native driver
        }).start();
    };

    const getInputBorderColor = (animationValue: Animated.Value, hasError: boolean) => {
        if (hasError) return '#D32F2F'; // Vermelho para erro
        return animationValue.interpolate({
            inputRange: [0, 1],
            outputRange: ['#CED4DA', '#007AFF'], // Cinza para normal, azul para focado
        });
    };

    // Função para formatar Telefone
    const handlePhoneChange = (text: string) => {
        const cleanedText = text.replace(/\D/g, ''); // Remove não-dígitos
        let formattedPhone = cleanedText;
        if (cleanedText.length > 0) formattedPhone = `(${cleanedText}`;
        if (cleanedText.length > 2) formattedPhone = `(${cleanedText.substring(0, 2)}) ${cleanedText.substring(2)}`;
        if (cleanedText.length > 7) formattedPhone = `${formattedPhone.substring(0, 9)}-${cleanedText.substring(7)}`;
        if (cleanedText.length > 11) formattedPhone = `${formattedPhone.substring(0, 15)}`; // (XX) XXXXX-XXXX
        setPhone(formattedPhone.substring(0, 15));
        setPhoneError(null);
    };

    // Função de validação completa do formulário
    const validateForm = () => {
        let isValid = true;

        // Validação Nome
        if (!name.trim()) { setNameError('Nome completo é obrigatório.'); isValid = false; } else { setNameError(null); }

        // Validação Email
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!email.trim()) { setEmailError('Email é obrigatório.'); isValid = false; }
        else if (!emailRegex.test(email.trim())) { setEmailError('Email inválido.'); isValid = false; }
        else { setEmailError(null); }

        // Validação Telefone
        if (!phone.replace(/\D/g, '').match(/^\d{10,11}$/)) { setPhoneError('Telefone inválido.'); isValid = false; } else { setPhoneError(null); }

        // Validação Senha
        if (password.length < 6) { setPasswordError('A senha deve ter pelo menos 6 caracteres.'); isValid = false; } else { setPasswordError(null); }

        // Validação Confirmar Senha
        if (password !== confirmPassword) { setConfirmPasswordError('As senhas não coincidem.'); isValid = false; } else { setConfirmPasswordError(null); }

        // Validação Termos
        if (!agreedToTerms) { setTermsError('Você deve aceitar os termos.'); isValid = false; } else { setTermsError(null); }

        return isValid;
    };

    const handleRegister = async () => {
        if (!validateForm()) {
            Alert.alert("Campos Inválidos", "Por favor, corrija os erros nos campos antes de prosseguir.");
            return;
        }

        setIsLoading(true);
        try {
            const userData = {
                name: name.trim(),
                email: email.trim().toLowerCase(),
                password,
                phone: phone.replace(/\D/g, ''), // Salva apenas os dígitos
            };
            console.log("[ClientRegister] Tentando registrar com dados:", userData);

            // Chama a função de registro simulada
            const response = await mockAuthService.registerClient(userData);

            if (response.success) {
                // Em um cenário real, você faria o signIn aqui:
                // await signIn(response.user, response.tokens);
                Alert.alert('Sucesso!', 'Sua conta foi criada com sucesso! Agora você pode fazer login.');
                router.replace('/(auth)/login'); // Redireciona para o login
            } else {
                // Isso deve ser tratado pelo catch, mas é um fallback
                Alert.alert('Erro', 'Não foi possível registrar. Tente novamente.');
            }
        } catch (error: any) {
            console.error("[ClientRegister] Erro no registro:", error);
            Alert.alert('Erro no Registro', error.message || 'Não foi possível registrar. Tente novamente mais tarde.');
        } finally {
            setIsLoading(false);
        }
    };

    // Estilos animados para o cabeçalho e o formulário
    const headerAnimatedStyle = {
        opacity: headerAnim,
        transform: [{ translateY: headerAnim.interpolate({ inputRange: [0, 1], outputRange: [20, 0] }) }],
    };

    const formAnimatedStyle = {
        opacity: formAnim,
        transform: [{ scale: formAnim.interpolate({ inputRange: [0, 1], outputRange: [0.98, 1] }) }],
    };

    // Animação para o botão de registro ao pressionar
    const registerButtonScaleAnim = useRef(new Animated.Value(1)).current;
    const onPressInRegisterButton = () => {
        Animated.spring(registerButtonScaleAnim, {
            toValue: 0.96,
            useNativeDriver: true,
        }).start();
    };
    const onPressOutRegisterButton = () => {
        Animated.spring(registerButtonScaleAnim, {
            toValue: 1,
            friction: 3,
            tension: 40,
            useNativeDriver: true,
        }).start();
    };

    // Animação para o checkbox de termos
    const onToggleTerms = () => {
        setAgreedToTerms(!agreedToTerms);
        setTermsError(null);
        Animated.sequence([
            Animated.timing(termsCheckboxScaleAnim, { toValue: 1.2, duration: 100, useNativeDriver: true }),
            Animated.timing(termsCheckboxScaleAnim, { toValue: 1, duration: 100, useNativeDriver: true }),
        ]).start();
    };


    return (
        <KeyboardAvoidingView
            behavior={Platform.OS === "ios" ? "padding" : "height"}
            style={styles.keyboardAvoidingContainer}
        >
            <ScrollView
                style={styles.scrollView}
                contentContainerStyle={styles.container}
                keyboardShouldPersistTaps="handled"
            >
                <Stack.Screen options={{ title: 'Criar Conta de Cliente' }} />

                {/* Seção do Cabeçalho com Animação */}
                <Animated.View style={[styles.headerContainer, headerAnimatedStyle]}>
                    <Ionicons name="person-add-outline" size={60} color="#007AFF" />
                    <Text style={styles.title}>Crie sua Conta no LimpeJá</Text>
                    <Text style={styles.subtitle}>É rápido, fácil e abre portas para um mundo de limpeza e praticidade!</Text>
                </Animated.View>

                {/* Formulário com Animação */}
                <Animated.View style={[styles.formSection, formAnimatedStyle]}>
                    {/* Nome Completo */}
                    <Text style={styles.label}>Nome Completo *</Text>
                    <Animated.View style={[styles.inputContainer, { borderColor: getInputBorderColor(nameBorderAnim, !!nameError) as any }]}>
                        <Ionicons name="person-outline" size={18} color="#8A8A8E" style={styles.inputIcon} />
                        <TextInput
                            style={styles.input}
                            placeholder="Seu nome completo"
                            value={name}
                            onChangeText={setName}
                            onBlur={() => { setNameError(name.trim() ? null : 'Nome completo é obrigatório.'); animateInputBorder(nameBorderAnim, false, !!nameError); }}
                            onFocus={() => animateInputBorder(nameBorderAnim, true, !!nameError)}
                            autoCapitalize="words"
                            textContentType="name"
                        />
                    </Animated.View>
                    <AnimatedErrorMessage message={nameError} />

                    {/* Email */}
                    <Text style={styles.label}>Email *</Text>
                    <Animated.View style={[styles.inputContainer, { borderColor: getInputBorderColor(emailBorderAnim, !!emailError) as any }]}>
                        <Ionicons name="mail-outline" size={20} color="#8A8A8E" style={styles.inputIcon} />
                        <TextInput
                            style={styles.input}
                            placeholder="seu.email@exemplo.com"
                            value={email}
                            onChangeText={setEmail}
                            onBlur={() => {
                                const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
                                setEmailError(email.trim() && emailRegex.test(email.trim()) ? null : 'Email inválido.');
                                animateInputBorder(emailBorderAnim, false, !!emailError);
                            }}
                            onFocus={() => animateInputBorder(emailBorderAnim, true, !!emailError)}
                            keyboardType="email-address"
                            autoCapitalize="none"
                            textContentType="emailAddress"
                            autoComplete="email"
                        />
                    </Animated.View>
                    <AnimatedErrorMessage message={emailError} />

                    {/* Telefone */}
                    <Text style={styles.label}>Telefone *</Text>
                    <Animated.View style={[styles.inputContainer, { borderColor: getInputBorderColor(phoneBorderAnim, !!phoneError) as any }]}>
                        <Ionicons name="call-outline" size={20} color="#8A8A8E" style={styles.inputIcon} />
                        <TextInput
                            style={styles.input}
                            placeholder="(XX) XXXXX-XXXX"
                            value={phone}
                            onChangeText={handlePhoneChange}
                            onBlur={() => { setPhoneError(phone.replace(/\D/g, '').match(/^\d{10,11}$/) ? null : 'Telefone inválido.'); animateInputBorder(phoneBorderAnim, false, !!phoneError); }}
                            onFocus={() => animateInputBorder(phoneBorderAnim, true, !!phoneError)}
                            keyboardType="phone-pad"
                            textContentType="telephoneNumber"
                            maxLength={15}
                        />
                    </Animated.View>
                    <AnimatedErrorMessage message={phoneError} />

                    {/* Senha */}
                    <Text style={styles.label}>Senha *</Text>
                    <Animated.View style={[styles.inputContainer, { borderColor: getInputBorderColor(passwordBorderAnim, !!passwordError) as any }]}>
                        <Ionicons name="lock-closed-outline" size={20} color="#8A8A8E" style={styles.inputIcon} />
                        <TextInput
                            style={styles.input}
                            placeholder="Mínimo 6 caracteres"
                            value={password}
                            onChangeText={setPassword}
                            onBlur={() => { setPasswordError(password.length >= 6 ? null : 'A senha deve ter pelo menos 6 caracteres.'); animateInputBorder(passwordBorderAnim, false, !!passwordError); }}
                            onFocus={() => animateInputBorder(passwordBorderAnim, true, !!passwordError)}
                            secureTextEntry={!showPassword}
                            textContentType="newPassword"
                        />
                        <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={styles.eyeIcon}>
                            <Ionicons name={showPassword ? "eye-off-outline" : "eye-outline"} size={24} color="#8A8A8E" />
                        </TouchableOpacity>
                    </Animated.View>
                    <AnimatedErrorMessage message={passwordError} />

                    {/* Confirmar Senha */}
                    <Text style={styles.label}>Confirmar Senha *</Text>
                    <Animated.View style={[styles.inputContainer, { borderColor: getInputBorderColor(confirmPasswordBorderAnim, !!confirmPasswordError) as any }]}>
                        <Ionicons name="lock-closed-outline" size={20} color="#8A8A8E" style={styles.inputIcon} />
                        <TextInput
                            style={styles.input}
                            placeholder="Repita a senha"
                            value={confirmPassword}
                            onChangeText={setConfirmPassword}
                            onBlur={() => { setConfirmPasswordError(password === confirmPassword ? null : 'As senhas não coincidem.'); animateInputBorder(confirmPasswordBorderAnim, false, !!confirmPasswordError); }}
                            onFocus={() => animateInputBorder(confirmPasswordBorderAnim, true, !!confirmPasswordError)}
                            secureTextEntry={!showConfirmPassword}
                            textContentType="newPassword"
                        />
                        <TouchableOpacity onPress={() => setShowConfirmPassword(!showConfirmPassword)} style={styles.eyeIcon}>
                            <Ionicons name={showConfirmPassword ? "eye-off-outline" : "eye-outline"} size={24} color="#8A8A8E" />
                        </TouchableOpacity>
                    </Animated.View>
                    <AnimatedErrorMessage message={confirmPasswordError} />

                    {/* Checkbox de Termos e Condições */}
                    <TouchableOpacity style={styles.termsCheckboxContainer} onPress={onToggleTerms}>
                        <Animated.View style={{ transform: [{ scale: termsCheckboxScaleAnim }] }}>
                            <Ionicons name={agreedToTerms ? "checkbox" : "square-outline"} size={24} color={agreedToTerms ? "#007AFF" : "#8A8A8E"} />
                        </Animated.View>
                        <View style={styles.termsTextContainer}>
                            <Text style={styles.termsText}>Eu li e concordo com os </Text>
                            {/* << CORREÇÃO: Adicionada asserção de tipo 'as any' para suprimir erro de rota >> */}
                            <Link href={"/(common)/termos" as any} asChild><TouchableOpacity><Text style={styles.linkText}>Termos de Serviço</Text></TouchableOpacity></Link>
                            <Text style={styles.termsText}> e a </Text>
                            {/* << CORREÇÃO: Adicionada asserção de tipo 'as any' para suprimir erro de rota >> */}
                            <Link href={"/(common)/privacidade" as any} asChild><TouchableOpacity><Text style={styles.linkText}>Política de Privacidade</Text></TouchableOpacity></Link>
                            <Text style={styles.termsText}>.</Text>
                        </View>
                    </TouchableOpacity>
                    <AnimatedErrorMessage message={termsError} />

                    {/* Botão de Registro */}
                    <TouchableOpacity
                        style={[styles.registerButton, (isLoading || !agreedToTerms) && styles.registerButtonDisabled, { transform: [{ scale: registerButtonScaleAnim }] }]}
                        onPress={handleRegister}
                        onPressIn={onPressInRegisterButton}
                        onPressOut={onPressOutRegisterButton}
                        disabled={isLoading || !agreedToTerms}
                    >
                        {isLoading ? (
                            <ActivityIndicator color="#fff" />
                        ) : (
                            <Text style={styles.registerButtonText}>Criar Minha Conta</Text>
                        )}
                    </TouchableOpacity>
                </Animated.View>

                {/* Link para Login */}
                <View style={styles.loginLinkContainer}>
                    <Text style={styles.loginText}>Já tem uma conta? </Text>
                    <Link href="/(auth)/login" asChild>
                        <TouchableOpacity>
                            <Text style={styles.loginLink}>Faça Login</Text>
                        </TouchableOpacity>
                    </Link>
                </View>
            </ScrollView>
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    keyboardAvoidingContainer: { flex: 1, backgroundColor: '#F8F9FA' },
    scrollView: { flex: 1 },
    container: { flexGrow: 1, justifyContent: 'center', paddingHorizontal: 25, paddingVertical: 20 },
    headerContainer: {
        alignItems: 'center',
        marginBottom: 25,
    },
    title: { fontSize: 26, fontWeight: 'bold', color: '#1C3A5F', marginTop: 8, marginBottom: 6, textAlign: 'center' },
    subtitle: { fontSize: 15, color: '#6C757D', textAlign: 'center', lineHeight: 22, marginBottom: 20 },
    formSection: {
        // Estilos para animação da seção de formulário (já aplicada via Animated.View)
    },
    label: { fontSize: 15, fontWeight: '600', color: '#495057', marginBottom: 7, marginTop: 12 },
    inputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#FFFFFF',
        borderWidth: 1,
        // borderColor será animado
        borderRadius: 10,
        height: 52,
        paddingHorizontal: 12,
        marginBottom: 12,
        ...Platform.select({
            ios: {
                shadowColor: 'rgba(0,0,0,0.05)',
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.1,
                shadowRadius: 3,
            },
            android: {
                elevation: 2,
            },
        }),
    },
    inputIcon: { marginRight: 10 },
    input: { flex: 1, height: '100%', fontSize: 16, color: '#212529' },
    eyeIcon: { paddingLeft: 10 },
    errorMessage: {
        color: '#D32F2F', // Vermelho para erros
        fontSize: 12,
        marginTop: -8, // Aproxima do campo
        marginBottom: 10,
        marginLeft: 5,
    },
    termsCheckboxContainer: {
        flexDirection: 'row',
        alignItems: 'flex-start', // Alinha o checkbox com o início do texto
        marginVertical: 20,
    },
    termsTextContainer: { flexDirection: 'row', flexWrap: 'wrap', marginLeft: 10, flex: 1 },
    termsText: { fontSize: 13, color: '#6C757D', lineHeight: 19 },
    linkText: { fontSize: 13, color: '#007AFF', fontWeight: '600', textDecorationLine: 'underline', lineHeight: 19 },
    registerButton: {
        backgroundColor: '#007AFF',
        paddingVertical: 15,
        borderRadius: 10,
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: 15,
        minHeight: 52,
        ...Platform.select({
            ios: {
                shadowColor: 'rgba(0,122,255,0.3)', // Sombra azulada
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.3,
                shadowRadius: 5,
            },
            android: {
                elevation: 6,
            },
        }),
    },
    registerButtonDisabled: { backgroundColor: '#A0CFFF', elevation: 0, shadowOpacity: 0 },
    registerButtonText: { color: '#FFFFFF', fontSize: 17, fontWeight: 'bold' },
    loginLinkContainer: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', marginTop: 25, paddingBottom: 20 },
    loginText: { fontSize: 15, color: '#6C757D' },
    loginLink: { fontSize: 15, color: '#007AFF', fontWeight: 'bold', marginLeft: 5 }
});