// LimpeJaApp/app/(auth)/client-register.tsx
// Este arquivo não precisa de alterações diretas para a correção do AsyncStorage,
// pois a lógica de armazenamento do token está encapsulada no useAuth hook.

import { Ionicons } from '@expo/vector-icons';
import { Stack, useRouter } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
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
    TextInput,
    TouchableOpacity,
    View
} from 'react-native';
import { useAuth } from '../../contexts/AuthContext'; // Importar useAuth do AuthContext
import { CreateAddressDto, RegisterClientDto } from '../../types/backend/auth'; // Importar DTOs

// ATENÇÃO: Substitua pelo caminho correto do seu logo em formato "V" ou "FV" azul
const LOGO_IMAGE = require('../../assets/images/logo2.png'); // << CONFIRMADO: Este é o caminho que você deseja

// CORREÇÃO: Importar AnimatedErrorMessage como exportação nomeada
import { AnimatedErrorMessage } from '../../components/auth/components/AnimatedErrorMessage';


// *** INÍCIO DA INTEGRAÇÃO REAL DA API VIACEP ***
// Removida a mockViaCepApi.
// Nova função para buscar o endereço na API ViaCEP real
const fetchAddressFromRealCepApi = async (cep: string) => {
    const cleanedCep = cep.replace(/\D/g, ''); // Garante que apenas dígitos sejam usados
    if (cleanedCep.length !== 8) {
        // Isso será tratado na função chamadora fetchAddressFromCep
        throw new Error("CEP deve conter 8 dígitos.");
    }

    try {
        const response = await fetch(`https://viacep.com.br/ws/${cleanedCep}/json/`);
        const data = await response.json();

        // A ViaCEP retorna { erro: true } se o CEP não for encontrado
        if (data.erro) {
            throw new Error("CEP não encontrado ou inválido.");
        }

        // Retorna os dados mapeados para os nomes que você espera
        return {
            cep: data.cep,
            logradouro: data.logradouro,
            complemento: data.complemento,
            bairro: data.bairro,
            localidade: data.localidade, // Mapeia para 'cidade'
            uf: data.uf,                 // Mapeia para 'estado'
        };
    } catch (error) {
        console.error("Erro na consulta ViaCEP:", error);
        // Lança um erro mais amigável para o usuário
        throw new Error("Erro ao buscar CEP. Por favor, verifique o número e tente novamente.");
    }
};
// *** FIM DA INTEGRAÇÃO REAL DA API VIACEP ***


export default function ClientRegisterScreen() { // Renomeado de RegisterOptionsScreen
    const [currentStep, setCurrentStep] = useState(1); // 1: Basic Info, 2: Personal Data, 3: Address Info

    // Step 1: Informações Básicas (Email, Nome, Telefone)
    const [email, setEmail] = useState('');
    const [username, setUsername] = useState(''); // Será mapeado para fullName
    const [phone, setPhone] = useState('');
    
    // Step 2: Dados Pessoais (CPF, Data Nascimento, Senha)
    const [cpf, setCpf] = useState('');
    const [dateOfBirth, setDateOfBirth] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);

    // Step 3: Endereço (CEP, Rua, Número)
    const [cep, setCep] = useState('');
    const [street, setStreet] = useState('');
    const [number, setNumber] = useState('');
    const [neighborhood, setNeighborhood] = useState('');
    const [city, setCity] = useState('');
    const [state, setState] = useState('');
    const [complement, setComplement] = useState('');

    const [isLoading, setIsLoading] = useState(false);
    const [isLoadingCep, setIsLoadingCep] = useState(false); // Novo estado para loading do CEP
    const [generalError, setGeneralError] = useState<string | null>(null);

    const router = useRouter();
    const { signUpClient } = useAuth(); // Usar o hook useAuth para acessar signUpClient

    const mainElementsOpacity = useRef(new Animated.Value(0)).current;
    const mainElementsTranslateY = useRef(new Animated.Value(18)).current;

    useEffect(() => {
        Animated.parallel([
            Animated.timing(mainElementsOpacity, { toValue: 1, duration: 700, delay: 200, useNativeDriver: true }),
            Animated.timing(mainElementsTranslateY, { toValue: 0, duration: 700, delay: 200, useNativeDriver: true })
        ]).start();
    }, [mainElementsOpacity, mainElementsTranslateY]);

    const validateStep1 = () => {
        setGeneralError(null);
        if (!email.trim() || !username.trim() || !phone.trim()) {
            setGeneralError('Por favor, preencha todos os campos básicos.');
            return false;
        }
        const emailRegex = /^[^\s@]+@[^\s@]+\.\S+$/;
        if (!emailRegex.test(email.trim())) {
            setGeneralError('Formato de e-mail inválido.');
            return false;
        }
        const cleanedPhone = phone.replace(/\D/g, '');
        if (cleanedPhone.length < 10 || cleanedPhone.length > 11) { 
            setGeneralError('O telefone deve ter 10 ou 11 dígitos.');
            return false;
        }
        return true;
    };

    const validateStep2 = () => {
        setGeneralError(null);
        if (!cpf.trim() || !dateOfBirth.trim() || !password.trim()) {
            setGeneralError('Por favor, preencha todos os campos pessoais.');
            return false;
        }
        const cleanedCpf = cpf.replace(/\D/g, '');
        if (cleanedCpf.length !== 11) {
            setGeneralError('CPF inválido. Deve conter 11 dígitos.');
            return false;
        }
        if (password.length < 6) {
            setGeneralError('A senha deve ter no mínimo 6 caracteres.');
            return false;
        }
        return true;
    };

    const validateStep3 = () => {
        setGeneralError(null);
        // **VALIDAÇÃO ATUALIZADA:** Inclui bairro, cidade e estado
        if (!cep.trim() || !street.trim() || !number.trim() || !neighborhood.trim() || !city.trim() || !state.trim()) {
            setGeneralError('Por favor, preencha todos os campos de endereço (CEP, Rua, Número, Bairro, Cidade, Estado).');
            return false;
        }
        // Validação adicional para o formato do estado (UF) - 2 letras
        if (state.trim().length !== 2 || !/^[A-Z]{2}$/i.test(state.trim())) {
            setGeneralError('O estado (UF) deve ter 2 letras válidas.');
            return false;
        }
        return true;
    };

    const handleNext = () => {
        if (currentStep === 1 && validateStep1()) {
            setCurrentStep(2);
            setGeneralError(null);
        } else if (currentStep === 2 && validateStep2()) {
            setCurrentStep(3);
            setGeneralError(null);
        }
    };

    // Função para formatar telefone (CORRIGIDA E SIMPLIFICADA)
    const formatPhoneNumber = (text: string) => {
        const cleanedText = text.replace(/\D/g, ''); // Remove todos os não-dígitos
        let formattedPhone = '';

        // Limita a entrada de dígitos brutos a 11 (máximo para celular no Brasil)
        const maxDigits = 11;
        const limitedText = cleanedText.substring(0, maxDigits);

        if (limitedText.length > 0) {
            formattedPhone = `(${limitedText.substring(0, 2)}`;
        }
        if (limitedText.length >= 3) {
            if (limitedText.length <= 10) { // Número fixo (10 dígitos) ou celular antigo (8 dígitos após DDD)
                formattedPhone += `) ${limitedText.substring(2, 6)}`;
                if (limitedText.length >= 7) {
                    formattedPhone += `-${limitedText.substring(6, 10)}`;
                }
            } else { // Celular (11 dígitos, o 9º dígito)
                formattedPhone += `) ${limitedText.substring(2, 7)}`;
                if (limitedText.length >= 8) {
                    formattedPhone += `-${limitedText.substring(7, 11)}`;
                }
            }
        }
        return formattedPhone;
    };

    // Função para formatar CPF
    const formatCpf = (text: string) => {
        const cleanedText = text.replace(/\D/g, ''); // Remove todos os não-dígitos
        let formattedCpf = '';

        if (cleanedText.length > 0) {
            formattedCpf = cleanedText.substring(0, 3);
        }
        if (cleanedText.length >= 4) {
            formattedCpf += `.${cleanedText.substring(3, 6)}`;
        }
        if (cleanedText.length >= 7) {
            formattedCpf += `.${cleanedText.substring(6, 9)}`;
        }
        if (cleanedText.length >= 10) {
            formattedCpf += `-${cleanedText.substring(9, 11)}`;
        }
        return formattedCpf;
    };

    // Função para formatar data de nascimento
    const formatDateOfBirth = (text: string) => {
        const cleanedText = text.replace(/\D/g, '');
        let formattedDate = '';

        if (cleanedText.length > 0) {
            formattedDate = cleanedText.substring(0, 2);
        }
        if (cleanedText.length >= 3) {
            formattedDate += `/${cleanedText.substring(2, 4)}`;
        }
        if (cleanedText.length >= 5) {
            formattedDate += `/${cleanedText.substring(4, 8)}`;
        }
        return formattedDate;
    };


    // Função para buscar endereço por CEP (AGORA USANDO A API REAL)
    const fetchAddressFromCep = async () => {
        const cleanedCep = cep.replace(/\D/g, '');
        // Garante que a busca só ocorra com 8 dígitos
        if (cleanedCep.length === 8) {
            setIsLoadingCep(true);
            setGeneralError(null); // Limpa erros anteriores
            try {
                // *** CHAMADA PARA A API REAL ***
                const data = await fetchAddressFromRealCepApi(cleanedCep);
                
                // Preenche os estados com os dados retornados pela ViaCEP
                setStreet(data.logradouro || '');
                setNeighborhood(data.bairro || '');
                setCity(data.localidade || '');
                setState(data.uf || '');
                setComplement(data.complemento || '');

            } catch (error: any) { // Captura o erro da API real (CEP não encontrado, rede, etc.)
                setGeneralError(error.message || "Erro ao buscar CEP. Tente novamente.");
                // Limpa os campos de endereço em caso de erro
                setStreet(''); setNumber(''); setNeighborhood(''); setCity(''); setState(''); setComplement('');
            } finally {
                setIsLoadingCep(false);
            }
        } else if (cleanedCep.length > 0 && cleanedCep.length < 8) {
            setGeneralError("CEP incompleto. Digite os 8 dígitos.");
            // Limpa os campos se o CEP for incompleto para evitar dados parciais
            setStreet(''); setNumber(''); setNeighborhood(''); setCity(''); setState(''); setComplement('');
        } else {
            // Se o campo CEP estiver vazio, limpa os campos de endereço e erros relacionados ao CEP
            setStreet(''); setNumber(''); setNeighborhood(''); setCity(''); setState(''); setComplement('');
            setGeneralError(null);
        }
    };

    const handleSignUp = async () => {
        // Valida todas as etapas antes do registro final
        if (!validateStep1() || !validateStep2() || !validateStep3()) { 
            return;
        }
        setIsLoading(true);
        try {
            // Mapear os dados do formulário para o RegisterClientDto
            const registerData: RegisterClientDto = {
                email: email.trim().toLowerCase(),
                password: password,
                fullName: username.trim(),
                cpf: cpf.replace(/\D/g, ''), // CPF agora é uma propriedade válida em RegisterClientDto
                phone: phone.replace(/\D/g, ''), // Remove não-dígitos antes de enviar
                address: {
                    cep: cep.trim(),
                    street: street.trim(),
                    number: number.trim(),
                    neighborhood: neighborhood.trim(),
                    city: city.trim(), // Mapeado o novo campo de cidade
                    state: state.trim(),
                    complement: complement.trim(), // Usar o campo de complemento
                } as CreateAddressDto, // Cast para garantir conformidade com CreateAddressDto
            };

            // console.log("Dados de endereço a serem enviados:", registerData.address); // Descomente para depurar

            await signUpClient(registerData);

            console.log("[ClientRegisterScreen] Registro de cliente iniciado. AuthContext cuidará do resto.");

        } catch (error: any) {
            console.error("[ClientRegisterScreen] Erro ao registrar cliente:", error);
            setGeneralError(error.message || 'Falha no registro. Por favor, tente novamente.');
        } finally {
            setIsLoading(false);
        }
    };

    const createButtonAnimations = () => {
        const scaleAnim = useRef(new Animated.Value(1)).current;
        const onPressIn = () => Animated.spring(scaleAnim, { toValue: 0.97, useNativeDriver: true, friction: 7 }).start();
        const onPressOut = () => Animated.spring(scaleAnim, { toValue: 1, useNativeDriver: true, friction: 7 }).start();
        return { scaleAnim, onPressIn, onPressOut };
    };

    const signUpButtonAnims = createButtonAnimations();
    const nextButtonAnims = createButtonAnimations(); // Animações para o botão "Avançar"

    // Atualizado para step 3 com validação dos 3 campos principais
    // A validação completa agora está dentro de validateStep3()
    const isSignUpButtonEnabled = currentStep === 3; // O botão fica habilitado se estiver na etapa 3; a validação ocorre no handleSignUp

    return (
        <KeyboardAvoidingView
            behavior={Platform.OS === "ios" ? "padding" : "height"}
            style={styles.keyboardAvoidingContainer}
        >
            <StatusBar barStyle="dark-content" backgroundColor={styles.scrollView.backgroundColor} />
            <ScrollView
                style={styles.scrollView}
                contentContainerStyle={styles.scrollContentContainer}
                keyboardShouldPersistTaps="handled"
            >
                <Stack.Screen options={{ headerShown: false }} />


                <Animated.View style={[styles.contentWrapper, { opacity: mainElementsOpacity, transform: [{translateY: mainElementsTranslateY}] }]}>
                    <View style={styles.logoContainer}>
                        <Image source={LOGO_IMAGE} style={styles.logo} />
                    </View>


                    <Text style={styles.welcomeSubtitle}>Crie sua conta no LimpeJá !</Text>

                    {/* Step 1: Informações Básicas */}
                    {currentStep === 1 && (
                        <View>
                            {/* Email Input */}
                            <View style={styles.inputWrapper}>
                                <View style={styles.iconCircle}>
                                    <Ionicons name="mail-outline" size={20} color="#00BCD4" />
                                </View>
                                <TextInput
                                    style={styles.input}
                                    placeholder="Email"
                                    placeholderTextColor="#A0AEC0"
                                    value={email}
                                    onChangeText={(text) => { setEmail(text); if (generalError) setGeneralError(null);}}
                                    keyboardType="email-address"
                                    autoCapitalize="none"
                                    textContentType="emailAddress"
                                    autoComplete="email"
                                />
                            </View>

                            {/* Nome Completo Input */}
                            <View style={styles.inputWrapper}>
                                <View style={styles.iconCircle}>
                                    <Ionicons name="person-outline" size={20} color="#00BCD4" />
                                </View>
                                <TextInput
                                    style={styles.input}
                                    placeholder="Nome Completo"
                                    placeholderTextColor="#A0AEC0"
                                    value={username}
                                    onChangeText={(text) => { setUsername(text); if (generalError) setGeneralError(null);}}
                                    autoCapitalize="words"
                                    textContentType="name"
                                    autoComplete="name"
                                />
                            </View>

                            {/* Telefone Input */}
                            <View style={styles.inputWrapper}>
                                <View style={styles.iconCircle}>
                                    <Ionicons name="call-outline" size={20} color="#00BCD4" />
                                </View>
                                <TextInput
                                    style={styles.input}
                                    placeholder="Telefone"
                                    placeholderTextColor="#A0AEC0"
                                    value={phone}
                                    onChangeText={(text) => { setPhone(formatPhoneNumber(text)); if (generalError) setGeneralError(null);}}
                                    keyboardType="numeric"
                                />
                            </View>

                            <AnimatedErrorMessage message={generalError} isVisible={!!generalError} centered={true} />

                            {/* Next Button */}
                            <Animated.View style={{transform: [{scale: nextButtonAnims.scaleAnim}]}}>
                                <TouchableOpacity
                                style={[styles.nextButton, isLoading && styles.buttonDisabled]}
                                onPress={handleNext}
                                onPressIn={nextButtonAnims.onPressIn}
                                onPressOut={nextButtonAnims.onPressOut}
                                disabled={isLoading}
                                >
                                    <Text style={styles.nextButtonText}>Avançar</Text>
                                </TouchableOpacity>
                            </Animated.View>
                        </View>
                    )}

                    {/* Step 2: Dados Pessoais */}
                    {currentStep === 2 && (
                        <View>
                            {/* CPF Input */}
                            <View style={styles.inputWrapper}>
                                <View style={styles.iconCircle}>
                                    <Ionicons name="document-text-outline" size={20} color="#00BCD4" />
                                </View>
                                <TextInput
                                    style={styles.input}
                                    placeholder="CPF"
                                    placeholderTextColor="#A0AEC0"
                                    value={cpf}
                                    onChangeText={(text) => { setCpf(formatCpf(text)); if (generalError) setGeneralError(null);}}
                                    keyboardType="numeric"
                                    maxLength={14}
                                />
                            </View>

                            {/* Data de Nascimento Input */}
                            <View style={styles.inputWrapper}>
                                <View style={styles.iconCircle}>
                                    <Ionicons name="calendar-outline" size={20} color="#00BCD4" />
                                </View>
                                <TextInput
                                    style={styles.input}
                                    placeholder="Data de Nascimento (DD/MM/AAAA)"
                                    placeholderTextColor="#A0AEC0"
                                    value={dateOfBirth}
                                    onChangeText={(text) => { setDateOfBirth(formatDateOfBirth(text)); if (generalError) setGeneralError(null);}}
                                    keyboardType="numeric"
                                    maxLength={10}
                                />
                            </View>

                            {/* Password Input */}
                            <View style={styles.inputWrapper}>
                                <View style={styles.iconCircle}>
                                    <Ionicons name="lock-closed-outline" size={20} color="#00BCD4" />
                                </View>
                                <TextInput
                                    style={styles.input}
                                    placeholder="Senha"
                                    placeholderTextColor="#A0AEC0"
                                    value={password}
                                    onChangeText={(text) => { setPassword(text); if (generalError) setGeneralError(null);}}
                                    secureTextEntry={!showPassword}
                                    textContentType="password"
                                />
                                <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={styles.eyeIconTouchable}>
                                    <Ionicons name={showPassword ? "eye-off-outline" : "eye-outline"} size={22} color="#A0AEC0" />
                                </TouchableOpacity>
                            </View>

                            <AnimatedErrorMessage message={generalError} isVisible={!!generalError} centered={true} />

                            {/* Navigation Buttons */}
                            <View style={styles.navigationButtons}>
                            
                                <TouchableOpacity
                                    style={[styles.navButton, styles.nextButton]}
                                    onPress={handleNext}
                                    disabled={isLoading}
                                >
                                    <Text style={styles.navButtonTextNext}>Avançar</Text>
                                    <Ionicons name="arrow-forward-outline" size={20} color="#fff" />
                                </TouchableOpacity>
                            </View>
                        </View>
                    )}

                    {/* Step 3: Endereço */}
                    {currentStep === 3 && (
                        <View>
                            {/* CEP Input */}
                            <View style={styles.inputWrapper}>
                                <View style={styles.iconCircle}>
                                    <Ionicons name="map-outline" size={20} color="#00BCD4" />
                                </View>
                                <TextInput
                                    style={styles.input}
                                    placeholder="CEP"
                                    placeholderTextColor="#A0AEC0"
                                    value={cep}
                                    onChangeText={(text) => { setCep(text.replace(/\D/g, '')); if (generalError) setGeneralError(null);}}
                                    onBlur={fetchAddressFromCep} // Dispara a busca ao perder o foco
                                    keyboardType="numeric"
                                    maxLength={8}
                                />
                                {isLoadingCep && <ActivityIndicator size="small" color="#00BCD4" style={styles.cepLoadingIndicator} />}
                            </View>

                            {/* Rua Input */}
                            <View style={styles.inputWrapper}>
                                <View style={styles.iconCircle}>
                                    <Ionicons name="navigate-outline" size={20} color="#00BCD4" />
                                </View>
                                <TextInput
                                    style={styles.input}
                                    placeholder="Rua"
                                    placeholderTextColor="#A0AEC0"
                                    value={street}
                                    onChangeText={(text) => { setStreet(text); if (generalError) setGeneralError(null);}}
                                    autoCapitalize="words"
                                    // Campo editável para permitir correções
                                />
                            </View>

                            {/* Número Input */}
                            <View style={styles.inputWrapper}>
                                <View style={styles.iconCircle}>
                                    <Ionicons name="home-outline" size={20} color="#00BCD4" />
                                </View>
                                <TextInput
                                    style={styles.input}
                                    placeholder="Número"
                                    placeholderTextColor="#A0AEC0"
                                    value={number}
                                    onChangeText={(text) => { setNumber(text); if (generalError) setGeneralError(null);}}
                                    keyboardType="numeric"
                                />
                            </View>

                            {/* Bairro Input (Adicionado para visualização e edição) */}
                            <View style={styles.inputWrapper}>
                                <View style={styles.iconCircle}>
                                    <Ionicons name="map-marker-outline" size={20} color="#00BCD4" />
                                </View>
                                <TextInput
                                    style={styles.input}
                                    placeholder="Bairro"
                                    placeholderTextColor="#A0AEC0"
                                    value={neighborhood}
                                    onChangeText={(text) => { setNeighborhood(text); if (generalError) setGeneralError(null);}}
                                    autoCapitalize="words"
                                    // Campo editável para permitir correções
                                />
                            </View>

                            {/* Cidade Input (Adicionado para visualização e edição) */}
                            <View style={styles.inputWrapper}>
                                <View style={styles.iconCircle}>
                                    <Ionicons name="business-outline" size={20} color="#00BCD4" />
                                </View>
                                <TextInput
                                    style={styles.input}
                                    placeholder="Cidade"
                                    placeholderTextColor="#A0AEC0"
                                    value={city}
                                    onChangeText={(text) => { setCity(text); if (generalError) setGeneralError(null);}}
                                    autoCapitalize="words"
                                    // Campo editável para permitir correções
                                />
                            </View>

                            {/* Estado (UF) Input (Adicionado para visualização e edição) */}
                            <View style={styles.inputWrapper}>
                                <View style={styles.iconCircle}>
                                    <Ionicons name="globe-outline" size={20} color="#00BCD4" />
                                </View>
                                <TextInput
                                    style={styles.input}
                                    placeholder="Estado (UF)"
                                    placeholderTextColor="#A0AEC0"
                                    value={state}
                                    onChangeText={(text) => { setState(text.toUpperCase()); if (generalError) setGeneralError(null);}} // Converte para maiúsculas
                                    autoCapitalize="characters"
                                    maxLength={2} // UF tem 2 caracteres
                                    // Campo editável para permitir correções
                                />
                            </View>

                            {/* Complemento Input (Adicionado para visualização e edição) */}
                            <View style={styles.inputWrapper}>
                                <View style={styles.iconCircle}>
                                    <Ionicons name="information-circle-outline" size={20} color="#00BCD4" />
                                </View>
                                <TextInput
                                    style={styles.input}
                                    placeholder="Complemento (Opcional)"
                                    placeholderTextColor="#A0AEC0"
                                    value={complement}
                                    onChangeText={(text) => { setComplement(text); if (generalError) setGeneralError(null);}}
                                    autoCapitalize="sentences"
                                />
                            </View>

                            <AnimatedErrorMessage message={generalError} isVisible={!!generalError} centered={true} />

                            {/* Navigation Buttons */}
                            <View style={styles.navigationButtons}>
                                <TouchableOpacity style={[styles.navButton, styles.backButton]} onPress={() => setCurrentStep(2)}>
                                    <Ionicons name="arrow-back-outline" size={20} color="#00BCD4" />
                                    <Text style={styles.navButtonTextBack}>Voltar</Text>
                                </TouchableOpacity>
                                <Animated.View style={{transform: [{scale: signUpButtonAnims.scaleAnim}]}}>
                                    <TouchableOpacity
                                    style={[styles.navButton, styles.finalButton, isLoading && styles.buttonDisabled]}
                                    onPress={handleSignUp}
                                    onPressIn={signUpButtonAnims.onPressIn}
                                    onPressOut={signUpButtonAnims.onPressOut}
                                    disabled={isLoading}
                                    >
                                    {isLoading ? (
                                            <ActivityIndicator color="#FFFFFF" />
                                        ) : (
                                            <>
                                                <Text style={styles.navButtonTextNext}>Cadastrar</Text>
                                                <Ionicons name="checkmark-circle-outline" size={20} color="#fff" />
                                            </>
                                        )}
                                    </TouchableOpacity>
                                </Animated.View>
                            </View>
                        </View>
                    )}
                </Animated.View>
            </ScrollView>
        </KeyboardAvoidingView>
    );
}

// ESTILOS REFEITOS PARA CORRESPONDER À IMAGEM FORNECIDA
const styles = StyleSheet.create({
    keyboardAvoidingContainer: {
        flex: 1,
    },
    scrollView: {
        flex: 1,
        backgroundColor: '#F7F8FC', // Fundo branco ou muito claro como na imagem
    },
    scrollContentContainer: {
        flexGrow: 1,
        justifyContent: 'center',
        paddingBottom: 120,
    },
    contentWrapper: {
        paddingHorizontal: 55,
        paddingTop: Platform.OS === 'ios' ? 20 : 15, // Menos padding no topo
    },
    logoContainer: {
        alignItems: 'center',

        top: 10, // Ajuste para centralizar o logo
        left: -15, // Ajustado para centralizar o logo
    },
    logo: { // Ajuste para o logo V-shape
        width: 240, // Ajustado para o tamanho da imagem
        height: 300, // Ajustado para o tamanho da imagem
        resizeMode: 'contain',
    },
    welcomeTitle: {
        fontSize: 28,
        fontWeight: 'bold',
        color: '#1C3A5F',
        textAlign: 'center',
    },
    welcomeSubtitle: {
        fontSize: 14, // Ajustado
        color: '#8A94A6', // Cinza médio
        textAlign: 'center',
        marginBottom: 30,
        bottom: 110, // Ajustado para centralizar o título
    },
    inputWrapper: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#FFFFFF',
        borderRadius: 28,
        height: 36,
        marginBottom: 9,
        shadowColor: 'rgba(100, 100, 150, 0.15)',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 1,
        shadowRadius: 15,
        elevation: 5,
        paddingLeft: 5,
        paddingRight: 15,
        bottom: 90,
        right: 5,
    },
    iconCircle: {
        width: 50,
        height: 30,
        right: 3,
        borderRadius: 40,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#FFFFFF',
        marginRight: 10,
    },
    input: {
        flex: 1, // Faz com que o TextInput ocupe o espaço restante
        fontSize: 15, // Ajustado
        color: '#2D3748',
        right: 8,
        height: '70%', // Garante que o input preencha a altura do wrapper
        paddingVertical: 0, // Remove padding vertical padrão que pode afetar a altura
    },
    eyeIconTouchable: {
        paddingHorizontal: 15, // Aumenta área de toque e dá espaço da borda
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
    // Novo estilo para o botão "Avançar"
    nextButton: {
        backgroundColor: '#40C0F0',
        borderRadius: 28,
        paddingVertical: 5,
        width: '100%',
        left: 0,
        bottom: 40, // Espaço entre o botão "Avançar" e o próximo input
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: 10,
        marginBottom: 15, // Espaço entre o botão "Avançar" e o "Sign up" (se fosse visível)
        shadowColor: '#00BCD4',
        shadowOffset: { width: 0, height: 5 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 10, // Aumentado para 10
    },
    nextButtonText: {
        color: '#FFFFFF',
        fontSize: 16,
        fontWeight: '600',
    },
    signUpButton: { // Renomeado de signInButton
        backgroundColor: '#00BCD4',
        borderRadius: 28,
        paddingVertical: 10, // Ajustado
        width: '80%', // Ajustado
        left: 31, // Ajustado
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: 10, // Espaço após os inputs/erro, antes era 9
        marginBottom: 25,
        shadowColor: '#00BCD4',
        shadowOffset: { width: 0, height: 5 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 10, // Aumentado para 10
    },
    buttonDisabled: {
        backgroundColor: '#A0CFFF',
        elevation: 0,
        shadowOpacity: 0,
    },
    signUpButtonText: { // Renomeado de signInButtonText
        color: '#FFFFFF',
        fontSize: 16,
        fontWeight: '600',
    },
    cepLoadingIndicator: { // Estilo para o indicador de loading do CEP
        marginLeft: 10,
    },
    navigationButtons: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginTop: 10,
        bottom: 60,
    },
    navButton: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 10,
        paddingHorizontal: 20,
        borderRadius: 28,
        minWidth: 120,
        justifyContent: 'center',
    },
    backButton: {
        backgroundColor: '#F7F8FC',
        borderWidth: 1,
        borderColor: '#00BCD4',
    },
    finalButton: {
        backgroundColor: 'rgba(64, 192, 240, 0.85)',
        shadowColor: '#00BCD4',
        shadowOffset: { width: 0, height: 5 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 10,
    },
    navButtonTextBack: {
        color: '#00BCD4',
        fontSize: 16,
        fontWeight: '600',
        marginLeft: 5,
    },
    navButtonTextNext: {
        color: '#FFFFFF',
        fontSize: 16,
        fontWeight: '600',
        marginRight: 5,
    },
});