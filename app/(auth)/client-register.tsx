// LimpeJaApp/app/(auth)/client-register.tsx
import { Ionicons } from '@expo/vector-icons';
import { Stack, useRouter } from 'expo-router';
import React, { useEffect, useRef, useState, useCallback } from 'react'; // Added useCallback
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
    View,
} from 'react-native';
import { useAuth } from '../../contexts/AuthContext';
import { CreateAddressDto, RegisterClientDto } from '../../types/backend/auth';

import * as Location from 'expo-location';
import AsyncStorage from '@react-native-async-storage/async-storage'; // Import AsyncStorage

const LOGO_IMAGE = require('../../assets/images/logo2.png');
import { AnimatedErrorMessage } from '../../components/auth/components/AnimatedErrorMessage';


const fetchAddressFromRealCepApi = async (cep: string) => {
    const cleanedCep = cep.replace(/\D/g, '');
    if (cleanedCep.length !== 8) {
        throw new Error("CEP deve conter 8 dígitos.");
    }

    try {
        const response = await fetch(`https://viacep.com.br/ws/${cleanedCep}/json/`);
        const data = await response.json();

        if (data.erro) {
            throw new Error("CEP não encontrado ou inválido.");
        }

        return {
            cep: data.cep,
            logradouro: data.logradouro,
            complemento: data.complemento,
            bairro: data.bairro,
            localidade: data.localidade,
            uf: data.uf,
        };
    } catch (error) {
        console.error("Erro na consulta ViaCEP:", error);
        throw new Error("Erro ao buscar CEP. Por favor, verifique o número e tente novamente.");
    }
};


export default function ClientRegisterScreen() {
    const [currentStep, setCurrentStep] = useState(1);
    const [subStepAddress, setSubStepAddress] = useState(1); // 1: CEP, 2: Details, 3: Complement

    const [email, setEmail] = useState('');
    const [username, setUsername] = useState('');
    const [phone, setPhone] = useState('');
    const [cpf, setCpf] = useState('');
    const [dateOfBirth, setDateOfBirth] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [cep, setCep] = useState('');
    const [street, setStreet] = useState('');
    const [number, setNumber] = useState('');
    const [neighborhood, setNeighborhood] = useState('');
    const [city, setCity] = useState('');
    const [state, setState] = useState('');
    const [complement, setComplement] = useState('');

    const [isLoading, setIsLoading] = useState(false);
    const [isLoadingCep, setIsLoadingCep] = useState(false);
    const [generalError, setGeneralError] = useState<string | null>(null);

    // Specific error states for inline validation
    const [emailError, setEmailError] = useState<string | null>(null);
    const [usernameError, setUsernameError] = useState<string | null>(null);
    const [phoneError, setPhoneError] = useState<string | null>(null);
    const [cpfError, setCpfError] = useState<string | null>(null);
    const [dateOfBirthError, setDateOfBirthError] = useState<string | null>(null);
    const [passwordError, setPasswordError] = useState<string | null>(null);
    const [cepInputError, setCepInputError] = useState<string | null>(null); // Renamed to avoid conflict with `cep` state
    const [streetError, setStreetError] = useState<string | null>(null);
    const [numberError, setNumberError] = useState<string | null>(null);
    const [neighborhoodError, setNeighborhoodError] = useState<string | null>(null);
    const [cityError, setCityError] = useState<string | null>(null);
    const [stateError, setStateError] = useState<string | null>(null);
    const [complementError, setComplementError] = useState<string | null>(null);


    const router = useRouter();
    const { signUpClient } = useAuth();

    const mainElementsOpacity = useRef(new Animated.Value(0)).current;
    const mainElementsTranslateY = useRef(new Animated.Value(18)).current;

    // Animation for screen entry
    useEffect(() => {
        Animated.parallel([
            Animated.timing(mainElementsOpacity, { toValue: 1, duration: 700, delay: 200, useNativeDriver: true }),
            Animated.timing(mainElementsTranslateY, { toValue: 0, duration: 700, delay: 200, useNativeDriver: true })
        ]).start();
    }, [mainElementsOpacity, mainElementsTranslateY]);

    // Auto-save to AsyncStorage
    useEffect(() => {
        const saveFormData = async () => {
            try {
                const formData = {
                    email, username, phone, cpf, dateOfBirth, password,
                    cep, street, number, neighborhood, city, state, complement,
                    currentStep, subStepAddress
                };
                await AsyncStorage.setItem('clientRegisterFormData', JSON.stringify(formData));
                console.log("Form data saved to AsyncStorage.");
            } catch (e) {
                console.error("Failed to save form data to AsyncStorage", e);
            }
        };
        // Debounce saving to avoid too frequent writes
        const handler = setTimeout(() => {
            saveFormData();
        }, 500); // Save 500ms after last change
        return () => clearTimeout(handler);
    }, [email, username, phone, cpf, dateOfBirth, password, cep, street, number, neighborhood, city, state, complement, currentStep, subStepAddress]);

    // Load from AsyncStorage on component mount
    useEffect(() => {
        const loadFormData = async () => {
            try {
                const savedData = await AsyncStorage.getItem('clientRegisterFormData');
                if (savedData) {
                    const formData = JSON.parse(savedData);
                    setEmail(formData.email || '');
                    setUsername(formData.username || '');
                    setPhone(formData.phone || '');
                    setCpf(formData.cpf || '');
                    setDateOfBirth(formData.dateOfBirth || '');
                    setPassword(formData.password || '');
                    setCep(formData.cep || '');
                    setStreet(formData.street || '');
                    setNumber(formData.number || '');
                    setNeighborhood(formData.neighborhood || '');
                    setCity(formData.city || '');
                    setState(formData.state || '');
                    setComplement(formData.complement || '');
                    setCurrentStep(formData.currentStep || 1);
                    setSubStepAddress(formData.subStepAddress || 1);
                    setGeneralError("Dados carregados automaticamente. Continue seu cadastro.");
                    console.log("Form data loaded from AsyncStorage.");
                }
            } catch (e) {
                console.error("Failed to load form data from AsyncStorage", e);
            }
        };
        loadFormData();
    }, []);


    // Validation functions - now setting specific errors
    const validateStep1 = useCallback(() => {
        let isValid = true;
        setEmailError(null);
        setUsernameError(null);
        setPhoneError(null);

        if (!email.trim()) {
            setEmailError('O e-mail é obrigatório.');
            isValid = false;
        } else {
            const emailRegex = /^[^\s@]+@[^\s@]+\.\S+$/;
            if (!emailRegex.test(email.trim())) {
                setEmailError('Formato de e-mail inválido.');
                isValid = false;
            }
        }

        if (!username.trim()) {
            setUsernameError('O nome completo é obrigatório.');
            isValid = false;
        }

        if (!phone.trim()) {
            setPhoneError('O telefone é obrigatório.');
            isValid = false;
        } else {
            const cleanedPhone = phone.replace(/\D/g, '');
            if (cleanedPhone.length < 10 || cleanedPhone.length > 11) {
                setPhoneError('O telefone deve ter 10 ou 11 dígitos.');
                isValid = false;
            }
        }
        return isValid;
    }, [email, username, phone]);

    const validateStep2 = useCallback(() => {
        let isValid = true;
        setCpfError(null);
        setDateOfBirthError(null);
        setPasswordError(null);

        if (!cpf.trim()) {
            setCpfError('O CPF é obrigatório.');
            isValid = false;
        } else {
            const cleanedCpf = cpf.replace(/\D/g, '');
            if (cleanedCpf.length !== 11) {
                setCpfError('CPF inválido. Deve conter 11 dígitos.');
                isValid = false;
            }
        }

        if (!dateOfBirth.trim()) {
            setDateOfBirthError('A data de nascimento é obrigatória.');
            isValid = false;
        } else {
            const dateRegex = /^\d{2}\/\d{2}\/\d{4}$/;
            if (!dateRegex.test(dateOfBirth)) {
                setDateOfBirthError('Formato de data inválido (DD/MM/AAAA).');
                isValid = false;
            } else {
                const [day, month, year] = dateOfBirth.split('/').map(Number);
                const dateObj = new Date(year, month - 1, day);
                if (dateObj.getDate() !== day || dateObj.getMonth() !== month - 1 || dateObj.getFullYear() !== year) {
                    setDateOfBirthError('Data de nascimento inválida.');
                    isValid = false;
                }
            }
        }

        if (!password.trim()) {
            setPasswordError('A senha é obrigatória.');
            isValid = false;
        } else if (password.length < 6) {
            setPasswordError('A senha deve ter no mínimo 6 caracteres.');
            isValid = false;
        }
        return isValid;
    }, [cpf, dateOfBirth, password]);

    const validateAddressSubStep1 = useCallback(() => { // CEP
        setCepInputError(null);
        const cleanedCep = cep.replace(/\D/g, '');
        if (cleanedCep.length !== 8) {
            setCepInputError("CEP inválido. Digite os 8 dígitos.");
            return false;
        }
        return true;
    }, [cep]);

    const validateAddressSubStep2 = useCallback(() => { // Street, Number, Neighborhood, City, State
        let isValid = true;
        setStreetError(null);
        setNumberError(null);
        setNeighborhoodError(null);
        setCityError(null);
        setStateError(null);

        if (!street.trim()) {
            setStreetError('A rua é obrigatória.');
            isValid = false;
        }
        if (!number.trim()) {
            setNumberError('O número é obrigatório.');
            isValid = false;
        }
        if (!neighborhood.trim()) {
            setNeighborhoodError('O bairro é obrigatório.');
            isValid = false;
        }
        if (!city.trim()) {
            setCityError('A cidade é obrigatória.');
            isValid = false;
        }
        if (!state.trim()) {
            setStateError('O estado é obrigatório.');
            isValid = false;
        } else if (state.trim().length !== 2 || !/^[A-Z]{2}$/i.test(state.trim())) {
            setStateError('O estado (UF) deve ter 2 letras válidas.');
            isValid = false;
        }
        return isValid;
    }, [street, number, neighborhood, city, state]);

    const validateAddressSubStep3 = useCallback(() => { // Complement (optional, so always true unless specific validation is added)
        setComplementError(null); // No specific validation for complement, but clear any previous error
        return true;
    }, []);

    const handleNext = () => {
        setGeneralError(null); // Clear general errors before attempting to advance
        if (currentStep === 1) {
            if (validateStep1()) {
                setCurrentStep(2);
            } else {
                setGeneralError('Por favor, preencha todos os campos básicos corretamente.');
            }
        } else if (currentStep === 2) {
            if (validateStep2()) {
                setCurrentStep(3);
                setSubStepAddress(1); // Reset sub-step when entering address
            } else {
                setGeneralError('Por favor, preencha todos os campos pessoais corretamente.');
            }
        } else if (currentStep === 3) {
            if (subStepAddress === 1) {
                if (validateAddressSubStep1()) {
                    if (!isLoadingCep) { // Only advance if CEP search is not active
                        setSubStepAddress(2);
                    } else {
                        setGeneralError("Aguarde a busca do CEP ser concluída.");
                    }
                } else {
                    setGeneralError("CEP inválido. Digite os 8 dígitos.");
                }
            } else if (subStepAddress === 2) {
                if (validateAddressSubStep2()) {
                    setSubStepAddress(3);
                } else {
                    setGeneralError('Por favor, preencha todos os campos de endereço corretamente.');
                }
            } else if (subStepAddress === 3) {
                if (validateAddressSubStep3()) {
                    handleSignUp(); // Call signup directly if all steps are valid
                }
            }
        }
    };

    const handleBack = () => {
        setGeneralError(null); // Clear general errors when going back
        if (currentStep === 3) {
            if (subStepAddress === 1) {
                setCurrentStep(2);
            } else {
                setSubStepAddress(subStepAddress - 1);
            }
        } else if (currentStep === 2) {
            setCurrentStep(1);
        }
    };

    const formatPhoneNumber = (text: string) => {
        const cleanedText = text.replace(/\D/g, '');
        let formattedPhone = '';
        const maxDigits = 11;
        const limitedText = cleanedText.substring(0, maxDigits);

        if (limitedText.length > 0) {
            formattedPhone = `(${limitedText.substring(0, 2)}`;
        }
        if (limitedText.length >= 3) {
            if (limitedText.length <= 10) { // For 9-digit numbers (like 9xxxx-xxxx)
                formattedPhone += `) ${limitedText.substring(2, 6)}`;
                if (limitedText.length >= 7) {
                    formattedPhone += `-${limitedText.substring(6, 10)}`;
                }
            } else { // For 10-digit numbers (like 9xxxx-xxxxx)
                formattedPhone += `) ${limitedText.substring(2, 7)}`;
                if (limitedText.length >= 8) {
                    formattedPhone += `-${limitedText.substring(7, 11)}`;
                }
            }
        }
        return formattedPhone;
    };

    const formatCpf = (text: string) => {
        const cleanedText = text.replace(/\D/g, '');
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


    const fetchAddressFromCep = async () => {
        const cleanedCep = cep.replace(/\D/g, '');
        setCepInputError(null); // Clear specific CEP error
        setGeneralError(null); // Clear general error

        if (cleanedCep.length === 8) {
            setIsLoadingCep(true);
            try {
                const data = await fetchAddressFromRealCepApi(cleanedCep);
                setStreet(data.logradouro || '');
                setNeighborhood(data.bairro || '');
                setCity(data.localidade || '');
                setState(data.uf || '');
                setComplement(data.complemento || '');
            } catch (error: any) {
                setCepInputError(error.message || "Erro ao buscar CEP. Tente novamente.");
                setStreet(''); setNumber(''); setNeighborhood(''); setCity(''); setState(''); setComplement('');
            } finally {
                setIsLoadingCep(false);
            }
        } else if (cleanedCep.length > 0 && cleanedCep.length < 8) {
            setCepInputError("CEP incompleto. Digite os 8 dígitos.");
            setStreet(''); setNumber(''); setNeighborhood(''); setCity(''); setState(''); setComplement('');
        } else {
            setStreet(''); setNumber(''); setNeighborhood(''); setCity(''); setState(''); setComplement('');
        }
    };

    const handleSignUp = async () => {
        // Ensure all top-level validations pass before attempting signup
        if (!validateStep1() || !validateStep2() || !validateAddressSubStep1() || !validateAddressSubStep2() || !validateAddressSubStep3()) {
            setGeneralError('Por favor, preencha todos os campos obrigatórios corretamente antes de cadastrar.');
            return;
        }

        setIsLoading(true);
        setGeneralError(null);

        try {
            console.log("[ClientRegisterScreen] Tentando obter permissão de localização...");
            let { status } = await Location.requestForegroundPermissionsAsync();
            if (status !== 'granted') {
                throw new Error('A permissão para acessar a localização foi negada. Por favor, habilite-a nas configurações do seu dispositivo.');
            }
            
            const fullAddress = `${street}, ${number}, ${neighborhood}, ${city}, ${state}, ${cep}`;
            console.log("[ClientRegisterScreen] Geocodificando endereço:", fullAddress);

            const location = await Location.geocodeAsync(fullAddress);
            
            if (location.length === 0) {
                throw new Error('Não foi possível encontrar as coordenadas para o endereço fornecido. Por favor, verifique o endereço e tente novamente.');
            }

            const { latitude, longitude } = location[0];
            console.log(`[ClientRegisterScreen] Coordenadas obtidas: Latitude=${latitude}, Longitude=${longitude}`);

            const registerData: RegisterClientDto = {
                email: email.trim().toLowerCase(),
                password: password,
                fullName: username.trim(),
                cpf: cpf.replace(/\D/g, ''),
                phone: phone.replace(/\D/g, ''),
                address: {
                    cep: cep.trim(),
                    street: street.trim(),
                    number: number.trim(),
                    neighborhood: neighborhood.trim(),
                    city: city.trim(),
                    state: state.trim(),
                    complement: complement.trim(),
                    latitude: latitude,
                    longitude: longitude,
                } as CreateAddressDto,
            };

            await signUpClient(registerData);

            console.log("[ClientRegisterScreen] Registro de cliente iniciado.");
            // Optionally clear AsyncStorage after successful registration
            await AsyncStorage.removeItem('clientRegisterFormData');

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
    const nextButtonAnims = createButtonAnimations();

    // Helper for progress indicator and microcopy
    const getStepInfo = () => {
        let stepText = '';
        let microcopy = '';
        let totalSteps = 3; // Basic, Personal, Address

        switch (currentStep) {
            case 1:
                stepText = `Etapa 1 de ${totalSteps}: Dados Básicos`;
                microcopy = 'Precisamos só dos seus dados básicos para começar.';
                break;
            case 2:
                stepText = `Etapa 2 de ${totalSteps}: Dados Pessoais`;
                microcopy = 'Agora, seus dados pessoais para segurança e identificação.';
                break;
            case 3:
                switch (subStepAddress) {
                    case 1:
                        stepText = `Etapa 3.1 de ${totalSteps}: Endereço (CEP)`;
                        microcopy = 'Informe seu CEP e buscamos o endereço automaticamente.';
                        break;
                    case 2:
                        stepText = `Etapa 3.2 de ${totalSteps}: Endereço (Detalhes)`;
                        microcopy = 'Confirme e complete os detalhes do seu endereço.';
                        break;
                    case 3:
                        stepText = `Etapa 3.3 de ${totalSteps}: Endereço (Complemento)`;
                        microcopy = 'Adicione um complemento para facilitar a localização.';
                        break;
                }
                break;
        }
        return { stepText, microcopy };
    };

    const getBackButtonText = () => {
        if (currentStep === 3) {
            if (subStepAddress === 1) return 'Voltar para Dados Pessoais';
            if (subStepAddress === 2) return 'Voltar para CEP';
            if (subStepAddress === 3) return 'Voltar para Detalhes do Endereço';
        } else if (currentStep === 2) {
            return 'Voltar para Dados Básicos';
        }
        return ''; // Should not be shown on step 1
    };

    const { stepText, microcopy } = getStepInfo();

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
                <Stack.Screen
                    options={{
                        headerShown: true,
                        headerTitle: '',
                        headerLeft: () => (
                            currentStep > 1 ? (
                                <TouchableOpacity onPress={handleBack} style={styles.backButtonHeader}>
                                    <Ionicons name="arrow-back-outline" size={24} color="#00BCD4" />
                                    <Text style={styles.backButtonHeaderText}>{getBackButtonText()}</Text>
                                </TouchableOpacity>
                            ) : null
                        ),
                        headerTransparent: true,
                    }}
                />

                <Animated.View style={[styles.contentWrapper, { opacity: mainElementsOpacity, transform: [{translateY: mainElementsTranslateY}] }]}>
                    <View style={styles.logoContainer}>
                        <Image source={LOGO_IMAGE} style={styles.logo} />
                    </View>

                    <Text style={styles.welcomeSubtitle}>Crie sua conta no LimpeJá !</Text>
                    <Text style={styles.stepIndicatorText}>{stepText}</Text>
                    <Text style={styles.microcopyText}>{microcopy}</Text>

                    {/* Step 1: Informações Básicas */}
                    {currentStep === 1 && (
                        <View>
                            {/* Email Input */}
                            <View style={[styles.inputWrapper, emailError ? styles.inputWrapperError : {}]}>
                                <View style={styles.iconCircle}>
                                    <Ionicons name="mail-outline" size={20} color="#00BCD4" />
                                </View>
                                <TextInput
                                    style={styles.input}
                                    placeholder="Email"
                                    placeholderTextColor="#A0AEC0"
                                    value={email}
                                    onChangeText={(text) => { setEmail(text); setEmailError(null); }}
                                    onBlur={validateStep1}
                                    keyboardType="email-address"
                                    autoCapitalize="none"
                                    textContentType="emailAddress"
                                    autoComplete="email"
                                />
                            </View>
                            <AnimatedErrorMessage message={emailError} isVisible={!!emailError} centered={false} />

                            {/* Nome Completo Input */}
                            <View style={[styles.inputWrapper, usernameError ? styles.inputWrapperError : {}]}>
                                <View style={styles.iconCircle}>
                                    <Ionicons name="person-outline" size={20} color="#00BCD4" />
                                </View>
                                <TextInput
                                    style={styles.input}
                                    placeholder="Nome Completo"
                                    placeholderTextColor="#A0AEC0"
                                    value={username}
                                    onChangeText={(text) => { setUsername(text); setUsernameError(null); }}
                                    onBlur={validateStep1}
                                    autoCapitalize="words"
                                    textContentType="name"
                                    autoComplete="name"
                                />
                            </View>
                            <AnimatedErrorMessage message={usernameError} isVisible={!!usernameError} centered={false} />

                            {/* Telefone Input */}
                            <View style={[styles.inputWrapper, phoneError ? styles.inputWrapperError : {}]}>
                                <View style={styles.iconCircle}>
                                    <Ionicons name="call-outline" size={20} color="#00BCD4" />
                                </View>
                                <TextInput
                                    style={styles.input}
                                    placeholder="Telefone (DDD + Número)"
                                    placeholderTextColor="#A0AEC0"
                                    value={phone}
                                    onChangeText={(text) => { setPhone(formatPhoneNumber(text)); setPhoneError(null); }}
                                    onBlur={validateStep1}
                                    keyboardType="phone-pad"
                                    maxLength={15} // (XX) XXXXX-XXXX
                                />
                            </View>
                            <AnimatedErrorMessage message={phoneError} isVisible={!!phoneError} centered={false} />

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
                            <View style={[styles.inputWrapper, cpfError ? styles.inputWrapperError : {}]}>
                                <View style={styles.iconCircle}>
                                    <Ionicons name="document-text-outline" size={20} color="#00BCD4" />
                                </View>
                                <TextInput
                                    style={styles.input}
                                    placeholder="CPF (apenas números)"
                                    placeholderTextColor="#A0AEC0"
                                    value={cpf}
                                    onChangeText={(text) => { setCpf(formatCpf(text)); setCpfError(null); }}
                                    onBlur={validateStep2}
                                    keyboardType="numeric"
                                    maxLength={14} // XXX.XXX.XXX-XX
                                />
                            </View>
                            <AnimatedErrorMessage message={cpfError} isVisible={!!cpfError} centered={false} />

                            {/* Data de Nascimento Input */}
                            <View style={[styles.inputWrapper, dateOfBirthError ? styles.inputWrapperError : {}]}>
                                <View style={styles.iconCircle}>
                                    <Ionicons name="calendar-outline" size={20} color="#00BCD4" />
                                </View>
                                <TextInput
                                    style={styles.input}
                                    placeholder="Data de Nascimento (DD/MM/AAAA)"
                                    placeholderTextColor="#A0AEC0"
                                    value={dateOfBirth}
                                    onChangeText={(text) => { setDateOfBirth(formatDateOfBirth(text)); setDateOfBirthError(null); }}
                                    onBlur={validateStep2}
                                    keyboardType="numeric"
                                    maxLength={10} // DD/MM/AAAA
                                />
                            </View>
                            <AnimatedErrorMessage message={dateOfBirthError} isVisible={!!dateOfBirthError} centered={false} />

                            {/* Password Input */}
                            <View style={[styles.inputWrapper, passwordError ? styles.inputWrapperError : {}]}>
                                <View style={styles.iconCircle}>
                                    <Ionicons name="lock-closed-outline" size={20} color="#00BCD4" />
                                </View>
                                <TextInput
                                    style={styles.input}
                                    placeholder="Senha (mínimo 6 caracteres)"
                                    placeholderTextColor="#A0AEC0"
                                    value={password}
                                    onChangeText={(text) => { setPassword(text); setPasswordError(null); }}
                                    onBlur={validateStep2}
                                    secureTextEntry={!showPassword}
                                    textContentType="password"
                                />
                                <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={styles.eyeIconTouchable}>
                                    <Ionicons name={showPassword ? "eye-off-outline" : "eye-outline"} size={22} color="#A0AEC0" />
                                </TouchableOpacity>
                            </View>
                            <AnimatedErrorMessage message={passwordError} isVisible={!!passwordError} centered={false} />

                            <AnimatedErrorMessage message={generalError} isVisible={!!generalError} centered={true} />

                            {/* Navigation Buttons */}
                            <View style={styles.navigationButtons}>
                                <TouchableOpacity style={[styles.navButton, styles.backButton]} onPress={handleBack}>
                                    <Ionicons name="arrow-back-outline" size={20} color="#00BCD4" />
                                    <Text style={styles.navButtonTextBack}>Voltar</Text>
                                </TouchableOpacity>
                                <TouchableOpacity
                                    style={[styles.navButton, styles.finalButton, isLoading && styles.buttonDisabled]}
                                    onPress={handleNext}
                                    disabled={isLoading}
                                >
                                    <Text style={styles.navButtonTextNext}>Avançar</Text>
                                    <Ionicons name="arrow-forward-outline" size={20} color="#fff" />
                                </TouchableOpacity>
                            </View>
                        </View>
                    )}

                    {/* Step 3: Endereço (Sub-steps) */}
                    {currentStep === 3 && (
                        <View>
                            {/* Sub-step 1: CEP */}
                            {subStepAddress === 1 && (
                                <View>
                                    <Text style={styles.subStepTitle}>1. Informe seu CEP</Text>
                                    <View style={[styles.inputWrapper, cepInputError ? styles.inputWrapperError : {}]}>
                                        <View style={styles.iconCircle}>
                                            <Ionicons name="map-outline" size={20} color="#00BCD4" />
                                        </View>
                                        <TextInput
                                            style={styles.input}
                                            placeholder="CEP (apenas números)"
                                            placeholderTextColor="#A0AEC0"
                                            value={cep}
                                            onChangeText={(text) => { setCep(text.replace(/\D/g, '')); setCepInputError(null); }}
                                            onBlur={fetchAddressFromCep}
                                            keyboardType="numeric"
                                            maxLength={8}
                                        />
                                        {isLoadingCep && <ActivityIndicator size="small" color="#00BCD4" style={styles.cepLoadingIndicator} />}
                                    </View>
                                    <AnimatedErrorMessage message={cepInputError} isVisible={!!cepInputError} centered={false} />
                                    <AnimatedErrorMessage message={generalError} isVisible={!!generalError} centered={true} />
                                    <View style={styles.navigationButtons}>
                                        <TouchableOpacity style={[styles.navButton, styles.backButton]} onPress={handleBack}>
                                            <Ionicons name="arrow-back-outline" size={20} color="#00BCD4" />
                                            <Text style={styles.navButtonTextBack}>Voltar</Text>
                                        </TouchableOpacity>
                                        <TouchableOpacity
                                            style={[styles.navButton, styles.finalButton, (isLoadingCep || !validateAddressSubStep1()) && styles.buttonDisabled]}
                                            onPress={handleNext}
                                            disabled={isLoadingCep || !validateAddressSubStep1()}
                                        >
                                            <Text style={styles.navButtonTextNext}>Próximo</Text>
                                            <Ionicons name="arrow-forward-outline" size={20} color="#fff" />
                                        </TouchableOpacity>
                                    </View>
                                </View>
                            )}

                            {/* Sub-step 2: Detalhes do Endereço */}
                            {subStepAddress === 2 && (
                                <View>
                                    <Text style={styles.subStepTitle}>2. Detalhes do Endereço</Text>
                                    {/* Rua Input */}
                                    <View style={[styles.inputWrapper, streetError ? styles.inputWrapperError : {}]}>
                                        <View style={styles.iconCircle}>
                                            <Ionicons name="navigate-outline" size={20} color="#00BCD4" />
                                        </View>
                                        <TextInput
                                            style={styles.input}
                                            placeholder="Rua"
                                            placeholderTextColor="#A0AEC0"
                                            value={street}
                                            onChangeText={(text) => { setStreet(text); setStreetError(null); }}
                                            onBlur={validateAddressSubStep2}
                                            autoCapitalize="words"
                                        />
                                    </View>
                                    <AnimatedErrorMessage message={streetError} isVisible={!!streetError} centered={false} />

                                    {/* Número Input */}
                                    <View style={[styles.inputWrapper, numberError ? styles.inputWrapperError : {}]}>
                                        <View style={styles.iconCircle}>
                                            <Ionicons name="home-outline" size={20} color="#00BCD4" />
                                        </View>
                                        <TextInput
                                            style={styles.input}
                                            placeholder="Número"
                                            placeholderTextColor="#A0AEC0"
                                            value={number}
                                            onChangeText={(text) => { setNumber(text); setNumberError(null); }}
                                            onBlur={validateAddressSubStep2}
                                            keyboardType="numeric"
                                        />
                                    </View>
                                    <AnimatedErrorMessage message={numberError} isVisible={!!numberError} centered={false} />

                                    {/* Bairro Input */}
                                    <View style={[styles.inputWrapper, neighborhoodError ? styles.inputWrapperError : {}]}>
                                        <View style={styles.iconCircle}>
                                            <Ionicons name="pin-outline" size={20} color="#00BCD4" />
                                        </View>
                                        <TextInput
                                            style={styles.input}
                                            placeholder="Bairro"
                                            placeholderTextColor="#A0AEC0"
                                            value={neighborhood}
                                            onChangeText={(text) => { setNeighborhood(text); setNeighborhoodError(null); }}
                                            onBlur={validateAddressSubStep2}
                                            autoCapitalize="words"
                                        />
                                    </View>
                                    <AnimatedErrorMessage message={neighborhoodError} isVisible={!!neighborhoodError} centered={false} />

                                    {/* Cidade Input */}
                                    <View style={[styles.inputWrapper, cityError ? styles.inputWrapperError : {}]}>
                                        <View style={styles.iconCircle}>
                                            <Ionicons name="business-outline" size={20} color="#00BCD4" />
                                        </View>
                                        <TextInput
                                            style={styles.input}
                                            placeholder="Cidade"
                                            placeholderTextColor="#A0AEC0"
                                            value={city}
                                            onChangeText={(text) => { setCity(text); setCityError(null); }}
                                            onBlur={validateAddressSubStep2}
                                            autoCapitalize="words"
                                        />
                                    </View>
                                    <AnimatedErrorMessage message={cityError} isVisible={!!cityError} centered={false} />

                                    {/* Estado (UF) Input */}
                                    <View style={[styles.inputWrapper, stateError ? styles.inputWrapperError : {}]}>
                                        <View style={styles.iconCircle}>
                                            <Ionicons name="globe-outline" size={20} color="#00BCD4" />
                                        </View>
                                        <TextInput
                                            style={styles.input}
                                            placeholder="Estado (UF)"
                                            placeholderTextColor="#A0AEC0"
                                            value={state}
                                            onChangeText={(text) => { setState(text.toUpperCase()); setStateError(null); }}
                                            onBlur={validateAddressSubStep2}
                                            autoCapitalize="characters"
                                            maxLength={2}
                                        />
                                    </View>
                                    <AnimatedErrorMessage message={stateError} isVisible={!!stateError} centered={false} />
                                    <AnimatedErrorMessage message={generalError} isVisible={!!generalError} centered={true} />
                                    <View style={styles.navigationButtons}>
                                        <TouchableOpacity style={[styles.navButton, styles.backButton]} onPress={handleBack}>
                                            <Ionicons name="arrow-back-outline" size={20} color="#00BCD4" />
                                            <Text style={styles.navButtonTextBack}>Voltar</Text>
                                        </TouchableOpacity>
                                        <TouchableOpacity
                                            style={[styles.navButton, styles.finalButton]}
                                            onPress={handleNext}
                                        >
                                            <Text style={styles.navButtonTextNext}>Próximo</Text>
                                            <Ionicons name="arrow-forward-outline" size={20} color="#fff" />
                                        </TouchableOpacity>
                                    </View>
                                </View>
                            )}

                            {/* Sub-step 3: Complemento */}
                            {subStepAddress === 3 && (
                                <View>
                                    <Text style={styles.subStepTitle}>3. Complemento (Opcional)</Text>
                                    {/* Complemento Input */}
                                    <View style={[styles.inputWrapper, complementError ? styles.inputWrapperError : {}]}>
                                        <View style={styles.iconCircle}>
                                            <Ionicons name="information-circle-outline" size={20} color="#00BCD4" />
                                        </View>
                                        <TextInput
                                            style={styles.input}
                                            placeholder="Ex: Apt 101, Bloco B"
                                            placeholderTextColor="#A0AEC0"
                                            value={complement}
                                            onChangeText={(text) => { setComplement(text); setComplementError(null); }}
                                            onBlur={validateAddressSubStep3}
                                            autoCapitalize="sentences"
                                        />
                                    </View>
                                    <AnimatedErrorMessage message={complementError} isVisible={!!complementError} centered={false} />
                                    <AnimatedErrorMessage message={generalError} isVisible={!!generalError} centered={true} />
                                    {/* Navigation Buttons for final signup */}
                                    <View style={styles.navigationButtons}>
                                        <TouchableOpacity style={[styles.navButton, styles.backButton]} onPress={handleBack}>
                                            <Ionicons name="arrow-back-outline" size={20} color="#00BCD4" />
                                            <Text style={styles.navButtonTextBack}>Voltar</Text>
                                        </TouchableOpacity>
                                        <Animated.View style={{transform: [{scale: signUpButtonAnims.scaleAnim}]}}>
                                            <TouchableOpacity
                                            style={[styles.navButton, styles.finalButton, (isLoading || !validateAddressSubStep3()) && styles.buttonDisabled]}
                                            onPress={handleNext} // Calls handleSignUp internally if all valid
                                            onPressIn={signUpButtonAnims.onPressIn}
                                            onPressOut={signUpButtonAnims.onPressOut}
                                            disabled={isLoading || !validateAddressSubStep3()}
                                            >
                                            {isLoading ? (
                                                    <ActivityIndicator color="#FFFFFF" />
                                                ) : (
                                                    <>
                                                        <Text style={styles.navButtonTextNext}>Finalizar Cadastro</Text>
                                                        <Ionicons name="checkmark-circle-outline" size={20} color="#fff" />
                                                    </>
                                                )}
                                            </TouchableOpacity>
                                        </Animated.View>
                                    </View>
                                </View>
                            )}
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
    welcomeTitle: { // This style is not used in the current client-register.tsx
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
    stepIndicatorText: { // New style for step indicator
        fontSize: 16,
        fontWeight: 'bold',
        color: '#1C3A5F',
        textAlign: 'center',
        marginBottom: 5,
        bottom: 100,
    },
    microcopyText: { // New style for microcopy
        fontSize: 13,
        color: '#6C757D',
        textAlign: 'center',
        marginBottom: 20,
        bottom: 100,
        paddingHorizontal: 10,
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
        borderWidth: 1, // Added for error highlighting
        borderColor: 'transparent', // Default
    },
    inputWrapperError: { // Style for error state
        borderColor: '#E53E3E',
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
    inlineErrorMessage: { // This style is already defined in the component, but I'll make sure it's used correctly.
        color: '#E53E3E',
        fontSize: 13,
        textAlign: 'center',
        marginBottom: 15,
        marginTop: -12,
    },
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
    signUpButton: { // This style is not used in the current client-register.tsx
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
    signUpButtonText: { // This style is not used in the current client-register.tsx
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
        flex: 1, // Make buttons take equal space
        marginHorizontal: 5, // Add some space between them
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
    backButtonHeader: { // Added for the header back button
        marginLeft: 15,
        padding: 5,
        flexDirection: 'row', // To align icon and text
        alignItems: 'center',
    },
    backButtonHeaderText: { // Style for the back button text in header
        color: '#00BCD4',
        fontSize: 14,
        marginLeft: 5,
    },
    subStepTitle: { // Added for sub-step titles
        fontSize: 18,
        fontWeight: 'bold',
        color: '#1C3A5F',
        textAlign: 'center',
        marginBottom: 20,
        bottom: 90,
    }
});