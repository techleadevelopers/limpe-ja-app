// LimpeJaApp/app/(auth)/provider-register/index.tsx
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { Stack, useRouter } from 'expo-router';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
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
import { PROVIDER_ROUTES } from '../../../constants/routes';
import { useAuth } from '../../../contexts/AuthContext';
import { useProviderRegistration } from '../../../contexts/ProviderRegistrationContext';
import { RegisterProviderDto } from '../../../types/backend/auth';

import { AnimatedErrorMessage } from '../../../components/auth/components/AnimatedErrorMessage';
import uploadService from '../../../services/uploadService'; 
import * as Location from 'expo-location'; // Importação do expo-location
import AsyncStorage from '@react-native-async-storage/async-storage'; // Import AsyncStorage

const LOGO_IMAGE = require('../../../assets/images/logo2.png');

// ErrorMessage component is not used directly, AnimatedErrorMessage is used
// const ErrorMessage: React.FC<{ message: string | null }> = ({ message }) => {
//     if (!message) return null;
//     return <Text style={styles.errorMessage}>{message}</Text>;
// };

export default function RegisterProviderScreen() {
    const [currentStep, setCurrentStep] = useState(1);
    const [subStepAddress, setSubStepAddress] = useState(1); // 1: CEP, 2: Details

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
    // Complement is not in provider register, but was in client. Keeping consistency if needed.
    // const [complement, setComplement] = useState(''); 
    
    // Specific error states for inline validation
    const [emailError, setEmailError] = useState<string | null>(null);
    const [usernameError, setUsernameError] = useState<string | null>(null);
    const [phoneError, setPhoneError] = useState<string | null>(null);
    const [cpfError, setCpfError] = useState<string | null>(null);
    const [dateOfBirthError, setDateOfBirthError] = useState<string | null>(null);
    const [passwordError, setPasswordError] = useState<string | null>(null);
    const [cepInputError, setCepInputError] = useState<string | null>(null);
    const [streetError, setStreetError] = useState<string | null>(null);
    const [numberError, setNumberError] = useState<string | null>(null);
    const [neighborhoodError, setNeighborhoodError] = useState<string | null>(null);
    const [cityError, setCityError] = useState<string | null>(null);
    const [stateError, setStateError] = useState<string | null>(null);

    const [addressError, setAddressError] = useState<string | null>(null); // This is for general address errors (e.g., CEP not found)
    const [generalError, setGeneralError] = useState<string | null>(null); // This is for general step errors

    const [isLoading, setIsLoading] = useState(false);
    const [cepLoading, setCepLoading] = useState(false); 

    const router = useRouter();
    const { signUpProvider, setIsRegistrationInProgress } = useAuth();
    const { setPersonalDetails: setContextPersonalDetails } = useProviderRegistration(); 

    const mainElementsOpacity = useRef(new Animated.Value(0)).current;
    const mainElementsTranslateY = useRef(new Animated.Value(18)).current;

    const formatDateForDisplay = (text: string) => {
        const cleanedText = text.replace(/\D/g, '');
        let formattedText = '';

        if (cleanedText.length > 0) {
            formattedText += cleanedText.substring(0, 2);
            if (cleanedText.length > 2) {
                formattedText += '/' + cleanedText.substring(2, 4);
            }
            if (cleanedText.length > 4) {
                formattedText += '/' + cleanedText.substring(4, 8);
            }
        }
        return formattedText;
    };

    const fetchAddressByCep = async (inputCep: string) => {
        const cleanedCep = inputCep.replace(/\D/g, '');
        setCepInputError(null); // Clear specific CEP input error
        setAddressError(null); // Clear general address error

        if (cleanedCep.length !== 8) {
            setCepInputError('CEP deve conter 8 dígitos.');
            setStreet('');
            setNeighborhood('');
            setCity('');
            setState('');
            return;
        }

        setCepLoading(true);
        try {
            const response = await fetch(`https://viacep.com.br/ws/${cleanedCep}/json/`);
            const data = await response.json();

            if (data.erro) {
                setCepInputError('CEP não encontrado ou inválido.');
                setStreet('');
                setNeighborhood('');
                setCity('');
                setState('');
            } else {
                setStreet(data.logradouro || '');
                setNeighborhood(data.bairro || '');
                setCity(data.localidade || '');
                setState(data.uf || '');
                setCepInputError(null);
            }
        } catch (error) {
            console.error("Erro ao buscar CEP:", error);
            setCepInputError('Erro ao buscar CEP. Tente novamente.');
        } finally {
            setCepLoading(false);
        }
    };

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
                    cep, street, number, neighborhood, city, state,
                    currentStep, subStepAddress
                };
                await AsyncStorage.setItem('providerRegisterFormData', JSON.stringify(formData));
                console.log("Provider form data saved to AsyncStorage.");
            } catch (e) {
                console.error("Failed to save provider form data to AsyncStorage", e);
            }
        };
        const handler = setTimeout(() => {
            saveFormData();
        }, 500);
        return () => clearTimeout(handler);
    }, [email, username, phone, cpf, dateOfBirth, password, cep, street, number, neighborhood, city, state, currentStep, subStepAddress]);

    // Load from AsyncStorage on component mount
    useEffect(() => {
        const loadFormData = async () => {
            try {
                const savedData = await AsyncStorage.getItem('providerRegisterFormData');
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
                    setCurrentStep(formData.currentStep || 1);
                    setSubStepAddress(formData.subStepAddress || 1);
                    setGeneralError("Dados carregados automaticamente. Continue seu cadastro.");
                    console.log("Provider form data loaded from AsyncStorage.");
                }
            } catch (e) {
                console.error("Failed to load provider form data from AsyncStorage", e);
            }
        };
        loadFormData();
    }, []);

    // MODIFIED: Validation functions to set specific errors
    const pureValidateStep1 = useCallback(() => {
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

    const pureValidateStep2 = useCallback(() => {
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

    const validateAddressSubStep1 = useCallback(() => { 
        setCepInputError(null);
        const cleanedCep = cep.replace(/\D/g, '');
        if (cleanedCep.length !== 8) {
            setCepInputError("CEP inválido. Digite os 8 dígitos.");
            return false;
        }
        return true;
    }, [cep]);

    const validateAddressSubStep2 = useCallback(() => { 
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


    const handleNext = async () => {
        console.log(`[RegisterProvider] handleNext: Tentando avançar do Step ${currentStep}. SubStep: ${subStepAddress}`);
        setGeneralError(null); // Clear previous general errors
        setAddressError(null); // Clear previous address errors

        if (currentStep === 1) {
            if (pureValidateStep1()) {
                setCurrentStep(2);
                console.log("[RegisterProvider] handleNext: Avançando para o Step 2 (Dados Pessoais).");
            } else {
                setGeneralError('Por favor, preencha todos os campos básicos corretamente.'); // Set error here
                console.warn("[RegisterProvider] handleNext: Falha ao avançar: Step 1 inválido.");
            }
        } else if (currentStep === 2) {
            if (pureValidateStep2()) {
                setCurrentStep(3);
                setSubStepAddress(1); // Reset sub-step when entering address
                console.log("[RegisterProvider] handleNext: Avançando para o Step 3 (Endereço).");
            } else {
                setGeneralError('Por favor, preencha todos os campos pessoais corretamente.'); // Set error here
                console.warn("[RegisterProvider] handleNext: Falha ao avançar: Step 2 inválido.");
            }
        } else if (currentStep === 3) {
            if (subStepAddress === 1) {
                if (validateAddressSubStep1()) {
                    if (!cepLoading) {
                        setSubStepAddress(2);
                        console.log("[RegisterProvider] handleNext: Avançando para o Sub-step 2 (Detalhes do Endereço).");
                    } else {
                        setAddressError('Aguarde a busca do CEP ser concluída.'); // Set error here
                    }
                } else {
                    setAddressError("CEP inválido. Digite os 8 dígitos."); // Set error here
                    console.warn("[RegisterProvider] handleNext: Falha ao avançar: Sub-step 1 (CEP) inválido.");
                }
            } else if (subStepAddress === 2) {
                if (validateAddressSubStep2()) {
                    setIsLoading(true); 
                    try {
                        let { status } = await Location.requestForegroundPermissionsAsync();
                        if (status !== 'granted') {
                            throw new Error('A permissão para acessar a localização foi negada. Por favor, habilite-a nas configurações do seu dispositivo.');
                        }
                        
                        const fullAddress = `${street}, ${number}, ${neighborhood}, ${city}, ${state}, ${cep}`;
                        console.log("[RegisterProvider] Geocodificando endereço:", fullAddress);
                        
                        const location = await Location.geocodeAsync(fullAddress);
                        
                        if (location.length === 0) {
                            throw new Error('Não foi possível encontrar as coordenadas para o endereço fornecido. Por favor, verifique o endereço e tente novamente.');
                        }

                        const { latitude, longitude } = location[0];
                        console.log(`[RegisterProvider] Coordenadas obtidas via expo-location: Latitude=${latitude}, Longitude=${longitude}`);

                        const [day, month, year] = dateOfBirth.split('/').map(Number);
                        const formattedDateOfBirth = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;

                        const providerData: RegisterProviderDto = {
                            email: email.trim(),
                            password: password.trim(),
                            fullName: username.trim(),
                            cpf: cpf.trim(),
                            dateOfBirth: formattedDateOfBirth,
                            phone: phone.replace(/\D/g, ''),
                            address: {
                                cep: cep.trim(),
                                street: street.trim(),
                                number: number.trim(),
                                neighborhood: neighborhood.trim(),
                                city: city.trim(),
                                state: state.trim(),
                                complement: '', 
                                latitude,
                                longitude,
                            },
                        };
                        console.log("[RegisterProvider] handleNext (Step 3 - final sub-step): Chamando signUpProvider do AuthContext para registro inicial.");
                        await signUpProvider(providerData);

                        setContextPersonalDetails({
                            email: email.trim(),
                            password: password.trim(),
                            fullName: username.trim(),
                            cpf: cpf.trim(),
                            dateOfBirth: formattedDateOfBirth,
                            phone: phone.replace(/\D/g, ''),
                            address: {
                                cep: cep.trim(),
                                street: street.trim(),
                                number: number.trim(),
                                neighborhood: neighborhood.trim(),
                                city: city.trim(),
                                state: state.trim(),
                                complement: '',
                                latitude,
                                longitude,
                            },
                        });
                        console.log("[RegisterProvider] handleNext (Step 3 - final sub-step): signUpProvider do AuthContext retornou sucesso. Redirecionando para Detalhes do Serviço.");
                        // Clear AsyncStorage after successful registration
                        await AsyncStorage.removeItem('providerRegisterFormData');
                        router.replace('/(auth)/provider-register/service-details');
                    } catch (error: any) {
                        console.error("[RegisterProvider] handleNext (Step 3 - final sub-step): Erro durante o registro inicial:", error.message, error);
                        setAddressError(error.message || 'Falha no registro inicial. Por favor, verifique o endereço e tente novamente.');
                    } finally {
                        setIsLoading(false);
                        console.log("[RegisterProvider] handleNext (Step 3 - final sub-step): isLoading definido como false.");
                    }
                } else {
                    setAddressError('Por favor, preencha todos os campos de endereço corretamente.'); // Set error here
                    console.warn("[RegisterProvider] handleNext: Falha ao avançar: Sub-step 2 (Detalhes do Endereço) inválido.");
                }
            }
        }
    };

    const handleBack = () => {
        setGeneralError(null);
        setAddressError(null);
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

    const createButtonAnimations = () => {
        const scaleAnim = useRef(new Animated.Value(1)).current;
        const onPressIn = () => Animated.spring(scaleAnim, { toValue: 0.97, useNativeDriver: true, friction: 7 }).start();
        const onPressOut = () => Animated.spring(scaleAnim, { toValue: 1, useNativeDriver: true, friction: 7 }).start();
        return { scaleAnim, onPressIn, onPressOut };
    };

    const signUpButtonAnims = createButtonAnimations();
    const nextButtonAnims = createButtonAnimations();

    // These variables now only reflect the validation status, not trigger re-renders
    const isNextButtonEnabledStep1 = pureValidateStep1();
    const isNextButtonEnabledStep2 = pureValidateStep2();
    const isNextButtonEnabledAddressSubStep1 = validateAddressSubStep1() && !cepLoading;
    const isNextButtonEnabledAddressSubStep2 = validateAddressSubStep2();

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
                }
                break;
        }
        return { stepText, microcopy };
    };

    const getBackButtonText = () => {
        if (currentStep === 3) {
            if (subStepAddress === 1) return 'Voltar para Dados Pessoais';
            if (subStepAddress === 2) return 'Voltar para CEP';
        } else if (currentStep === 2) {
            return 'Voltar para Dados Básicos';
        }
        return ''; // Should not be shown on step 1
    };

    const { stepText, microcopy } = getStepInfo();


    const getWelcomeSubtitle = () => {
        switch (currentStep) {
            case 1:
                return 'Informações Básicas';
            case 2:
                return 'Dados Pessoais';
            case 3:
                switch (subStepAddress) {
                    case 1: return 'Endereço: CEP';
                    case 2: return 'Endereço: Detalhes';
                    default: return 'Endereço';
                }
            default:
                return '';
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


    return (
        <KeyboardAvoidingView
            behavior={Platform.OS === "ios" ? "padding" : "height"}
            style={styles.keyboardAvoidingContainer}
        >
            <StatusBar barStyle="dark-content" backgroundColor={styles.scrollView.backgroundColor} />
            <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContentContainer} keyboardShouldPersistTaps="handled" >
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
                <Animated.View style={[styles.contentWrapper, { opacity: mainElementsOpacity, transform: [{ translateY: mainElementsTranslateY }] }]}>
                    <View style={styles.logoContainer}>
                        <Image source={LOGO_IMAGE} style={styles.logo} />
                    </View>

                    <Text style={styles.welcomeSubtitle}>
                        {getWelcomeSubtitle()}
                    </Text>
                    <Text style={styles.stepIndicatorText}>{stepText}</Text>
                    <Text style={styles.microcopyText}>{microcopy}</Text>

                    {currentStep === 1 && (
                        <View>
                            <View style={[styles.inputWrapper, emailError ? styles.inputWrapperError : {}]}>
                                <View style={styles.iconCircle}>
                                    <Ionicons name="person-outline" size={20} color="#00BCD4" />
                                </View>
                                <TextInput
                                    style={styles.input}
                                    placeholder="Nome Completo / Nome de Usuário"
                                    placeholderTextColor="#A0AEC0"
                                    value={username}
                                    onChangeText={(text) => { setUsername(text); setUsernameError(null); }}
                                    onBlur={pureValidateStep1}
                                    autoCapitalize="words"
                                    textContentType="name"
                                    autoComplete="name"
                                />
                            </View>
                            <AnimatedErrorMessage message={usernameError} isVisible={!!usernameError} centered={false} />

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
                                    onBlur={pureValidateStep1}
                                    keyboardType="email-address"
                                    autoCapitalize="none"
                                    textContentType="emailAddress"
                                    autoComplete="email"
                                />
                            </View>
                            <AnimatedErrorMessage message={emailError} isVisible={!!emailError} centered={false} />

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
                                    onBlur={pureValidateStep1}
                                    keyboardType="phone-pad"
                                    maxLength={15}
                                />
                            </View>
                            <AnimatedErrorMessage message={phoneError} isVisible={!!phoneError} centered={false} />

                            <AnimatedErrorMessage message={generalError} isVisible={!!generalError} centered={true} />
                        </View>
                    )}

                    {currentStep === 2 && (
                        <View>
                            <View style={[styles.inputWrapper, cpfError ? styles.inputWrapperError : {}]}>
                                <View style={styles.iconCircle}>
                                    <Ionicons name="card-outline" size={20} color="#00BCD4" />
                                </View>
                                <TextInput
                                    style={styles.input}
                                    placeholder="CPF (apenas números)"
                                    placeholderTextColor="#A0AEC0"
                                    value={cpf}
                                    onChangeText={(text) => { setCpf(formatCpf(text)); setCpfError(null); }}
                                    onBlur={pureValidateStep2}
                                    keyboardType="numeric"
                                    maxLength={14}
                                />
                            </View>
                            <AnimatedErrorMessage message={cpfError} isVisible={!!cpfError} centered={false} />

                            <View style={[styles.inputWrapper, dateOfBirthError ? styles.inputWrapperError : {}]}>
                                <View style={styles.iconCircle}>
                                    <Ionicons name="calendar-outline" size={20} color="#00BCD4" />
                                </View>
                                <TextInput
                                    style={styles.input}
                                    placeholder="Data de Nascimento (DD/MM/AAAA)"
                                    placeholderTextColor="#A0AEC0"
                                    value={dateOfBirth}
                                    onChangeText={(text) => { setDateOfBirth(formatDateForDisplay(text)); setDateOfBirthError(null); }}
                                    onBlur={pureValidateStep2}
                                    keyboardType="numeric"
                                    maxLength={10}
                                />
                            </View>
                            <AnimatedErrorMessage message={dateOfBirthError} isVisible={!!dateOfBirthError} centered={false} />

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
                                    onBlur={pureValidateStep2}
                                    secureTextEntry={!showPassword}
                                    textContentType="password"
                                />
                                <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={styles.eyeIconTouchable}>
                                    <Ionicons name={showPassword ? "eye-off-outline" : "eye-outline"} size={22} color="#A0AEC0" />
                                </TouchableOpacity>
                            </View>
                            <AnimatedErrorMessage message={passwordError} isVisible={!!passwordError} centered={false} />

                            <AnimatedErrorMessage message={generalError} isVisible={!!generalError} centered={true} />
                        </View>
                    )}

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
                                            onChangeText={(text) => {
                                                setCep(text.replace(/\D/g, ''));
                                                setCepInputError(null);
                                                if (text.replace(/\D/g, '').length === 8) {
                                                    fetchAddressByCep(text);
                                                } else {
                                                    setStreet('');
                                                    setNeighborhood('');
                                                    setCity('');
                                                    setState('');
                                                    setAddressError(null);
                                                }
                                            }}
                                            onBlur={() => validateAddressSubStep1()}
                                            keyboardType="numeric"
                                            maxLength={8}
                                        />
                                        {cepLoading && <ActivityIndicator size="small" color="#00BCD4" style={{ marginLeft: 10 }} />}
                                    </View>
                                    <AnimatedErrorMessage message={cepInputError} isVisible={!!cepInputError} centered={false} />
                                    <AnimatedErrorMessage message={addressError} isVisible={!!addressError} centered={true} />
                                    <View style={styles.navigationButtons}>
                                        <TouchableOpacity style={[styles.navButton, styles.backButton]} onPress={handleBack}>
                                            <Ionicons name="arrow-back-outline" size={20} color="#00BCD4" />
                                            <Text style={styles.navButtonTextBack}>Voltar</Text>
                                        </TouchableOpacity>
                                        <TouchableOpacity
                                            style={[styles.navButton, styles.finalButton, (isLoading || !isNextButtonEnabledAddressSubStep1) && styles.buttonDisabled]}
                                            onPress={handleNext}
                                            disabled={isLoading || !isNextButtonEnabledAddressSubStep1}
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
                                            editable={!cepLoading}
                                        />
                                    </View>
                                    <AnimatedErrorMessage message={streetError} isVisible={!!streetError} centered={false} />

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

                                    <View style={[styles.inputWrapper, neighborhoodError ? styles.inputWrapperError : {}]}>
                                        <View style={styles.iconCircle}>
                                            <Ionicons name="business-outline" size={20} color="#00BCD4" />
                                        </View>
                                        <TextInput
                                            style={styles.input}
                                            placeholder="Bairro"
                                            placeholderTextColor="#A0AEC0"
                                            value={neighborhood}
                                            onChangeText={(text) => { setNeighborhood(text); setNeighborhoodError(null); }}
                                            onBlur={validateAddressSubStep2}
                                            autoCapitalize="words"
                                            editable={!cepLoading}
                                        />
                                    </View>
                                    <AnimatedErrorMessage message={neighborhoodError} isVisible={!!neighborhoodError} centered={false} />

                                    <View style={[styles.inputWrapper, cityError ? styles.inputWrapperError : {}]}>
                                        <View style={styles.iconCircle}>
                                            <Ionicons name="location-outline" size={20} color="#00BCD4" />
                                        </View>
                                        <TextInput
                                            style={styles.input}
                                            placeholder="Cidade"
                                            placeholderTextColor="#A0AEC0"
                                            value={city}
                                            onChangeText={(text) => { setCity(text); setCityError(null); }}
                                            onBlur={validateAddressSubStep2}
                                            autoCapitalize="words"
                                            editable={!cepLoading}
                                        />
                                    </View>
                                    <AnimatedErrorMessage message={cityError} isVisible={!!cityError} centered={false} />

                                    <View style={[styles.inputWrapper, stateError ? styles.inputWrapperError : {}]}>
                                        <View style={styles.iconCircle}>
                                            <Ionicons name="location-outline" size={20} color="#00BCD4" />
                                        </View>
                                        <TextInput
                                            style={styles.input}
                                            placeholder="Estado (UF)"
                                            placeholderTextColor="#A0AEC0"
                                            value={state}
                                            onChangeText={(text) => { setState(text); setStateError(null); }}
                                            onBlur={validateAddressSubStep2}
                                            autoCapitalize="characters"
                                            maxLength={2}
                                            editable={!cepLoading}
                                        />
                                    </View>
                                    <AnimatedErrorMessage message={stateError} isVisible={!!stateError} centered={false} />

                                    <AnimatedErrorMessage message={addressError} isVisible={!!addressError} centered={true} />
                                    <View style={styles.navigationButtons}>
                                        <TouchableOpacity style={[styles.navButton, styles.backButton]} onPress={handleBack}>
                                            <Ionicons name="arrow-back-outline" size={20} color="#00BCD4" />
                                            <Text style={styles.navButtonTextBack}>Voltar</Text>
                                        </TouchableOpacity>
                                        <TouchableOpacity
                                            style={[styles.navButton, styles.finalButton, (isLoading || !isNextButtonEnabledAddressSubStep2) && styles.buttonDisabled]}
                                            onPress={handleNext} 
                                            disabled={isLoading || !isNextButtonEnabledAddressSubStep2}
                                        >
                                            {isLoading ? (
                                                <ActivityIndicator color="#FFFFFF" />
                                            ) : (
                                                <>
                                                    <Text style={styles.navButtonTextNext}>Finalizar Endereço</Text>
                                                    <Ionicons name="arrow-forward-outline" size={20} color="#fff" />
                                                </>
                                            )}
                                        </TouchableOpacity>
                                    </View>
                                </View>
                            )}
                        </View>
                    )}

                    {currentStep === 1 && (
                        <Animated.View style={{ transform: [{ scale: nextButtonAnims.scaleAnim }] }}>
                            <TouchableOpacity
                                style={[styles.nextButton, (isLoading || !isNextButtonEnabledStep1) && styles.buttonDisabled]}
                                onPress={handleNext}
                                onPressIn={nextButtonAnims.onPressIn}
                                onPressOut={nextButtonAnims.onPressOut}
                                disabled={isLoading || !isNextButtonEnabledStep1}
                            >
                                <Text style={styles.nextButtonText}>Avançar</Text>
                            </TouchableOpacity>
                        </Animated.View>
                    )}

                    {currentStep === 2 && (
                        <Animated.View style={{ transform: [{ scale: signUpButtonAnims.scaleAnim }] }}>
                            <TouchableOpacity
                                style={[styles.nextButton, (isLoading || !isNextButtonEnabledStep2) && styles.buttonDisabled]}
                                onPress={handleNext}
                                onPressIn={signUpButtonAnims.onPressIn}
                                onPressOut={signUpButtonAnims.onPressOut}
                                disabled={isLoading || !isNextButtonEnabledStep2}
                            >
                                {isLoading ? (
                                    <ActivityIndicator color="#FFFFFF" />
                                ) : (
                                    <Text style={styles.nextButtonText}>Avançar</Text>
                                )}
                            </TouchableOpacity>
                        </Animated.View>
                    )}
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
        paddingBottom: 20,
        paddingTop: 60,
    },
    contentWrapper: {
        paddingHorizontal: 35,
        paddingTop: Platform.OS === 'ios' ? 20 : 15,
    },
    logoContainer: {
        alignItems: 'center',
    },
    logo: {
        width: 230,
        height: 300,
        resizeMode: 'contain',
        bottom: 16,
        right: 15,
    },
    welcomeTitle: { // Not used in this component
        fontSize: 24,
        fontWeight: 'bold',
        color: '#1D2029',
        textAlign: 'center',
        marginBottom: 6,
    },
    welcomeSubtitle: { // Used for step title
        fontSize: 15,
        color: '#8A94A6',
        textAlign: 'center',
        marginBottom: 30,
        bottom: 140,
    },
    stepIndicatorText: { // New style for step indicator
        fontSize: 16,
        fontWeight: 'bold',
        color: '#1C3A5F',
        textAlign: 'center',
        marginBottom: 5,
        bottom: 130, // Adjusted position
    },
    microcopyText: { // New style for microcopy
        fontSize: 13,
        color: '#6C757D',
        textAlign: 'center',
        marginBottom: 20,
        bottom: 130, // Adjusted position
        paddingHorizontal: 10,
    },
    inputWrapper: {
        flexDirection: 'row',
        alignItems: 'center', // Garante alinhamento vertical
        backgroundColor: '#FFFFFF',
        borderRadius: 28,
        height: 36,
        marginBottom: 9,
        shadowColor: 'rgba(100, 100, 150, 0.15)',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 1,
        shadowRadius: 15,
        elevation: 5,
        paddingLeft: 5, // Mantém um padding inicial
        paddingRight: 15,
        bottom: 120, // Posição geral do bloco de input, não afeta o alinhamento interno diretamente
        right: 5, // Posição geral do bloco de input
        borderWidth: 1, // Added for error highlighting
        borderColor: 'transparent', // Default
    },
    inputWrapperError: { // Style for error state
        borderColor: '#E53E3E',
    },
    iconCircle: {
        width: 50,
        height: 30,
        // REMOVIDO: right: 3, // Esta propriedade estava empurrando o ícone para a esquerda
        borderRadius: 40,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#FFFFFF',
        marginRight: 10, // Espaço entre o ícone e o input
    },
    input: {
        flex: 1, // Faz o TextInput ocupar o espaço restante
        fontSize: 15,
        color: '#2D3748',
        // REMOVIDO: right: 18, // Esta propriedade estava empurrando o texto para a esquerda
        height: '70%',
        paddingVertical: 0, // Remove padding vertical padrão que pode afetar a altura
    },
    eyeIconTouchable: {
        paddingHorizontal: 15,
        height: '100%',
        justifyContent: 'center',
    },
    inlineErrorMessage: { // This style is already defined in the component
        color: '#E53E3E',
        fontSize: 13,
        textAlign: 'center',
        marginBottom: 15,
        marginTop: -12,
    },
    nextButton: {
        backgroundColor: '#40C0F0',
        borderRadius: 28,
        paddingVertical: 7,
        width: '100%',
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: 10,
        bottom: 110,
        marginBottom: 15,
        shadowColor: '#00BCD4',
        shadowOffset: { width: 0, height: 5 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 8,
    },
    nextButtonText: {
        color: '#FFFFFF',
        fontSize: 16,
        fontWeight: '600',
    },
    signUpButton: { // Not used in this component
        backgroundColor: '#00BCD4',
        borderRadius: 28,
        paddingVertical: 8,
        bottom: 80,
        width: '100%',
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: 10,
        marginBottom: 25,
        shadowColor: '#00BCD4',
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
    signUpButtonText: { // Not used in this component
        color: '#FFFFFF',
        fontSize: 15,
        fontWeight: '600',
    },
    sectionTitle: { // Not used in this component
        fontSize: 22,
        fontWeight: 'bold',
        color: '#1D2029',
        textAlign: 'center',
        marginBottom: 10,
        marginTop: 20,
    },
    sectionSubtitle: { // Not used in this component
        fontSize: 15,
        color: '#8A94A6',
        textAlign: 'center',
        marginBottom: 30,
    },
    formSection: { // Not used in this component
    },
    label: { // Not used in this component
        fontSize: 12,
        fontWeight: '600',
        color: '#495057',
        marginBottom: 7,
        marginTop: 12,
    },
    inputIcon: { // Not used in this component
        marginRight: 10,
        color: '#00BCD4',
    },
    inputWrapperServiceDetails: { // Not used in this component
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#FFFFFF',
        borderRadius: 28,
        height: 50,
        marginBottom: 20,
        shadowColor: 'rgba(100, 100, 150, 0.15)',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 1,
        shadowRadius: 15,
        elevation: 5,
        paddingLeft: 15,
        paddingRight: 15,
    },
    inputServiceDetails: { // Not used in this component
        flex: 1,
        fontSize: 15,
        color: '#2D3748',
        height: '100%',
        paddingVertical: 0,
    },
    textAreaInputServiceDetails: { // Not used in this component
        height: 100,
        paddingTop: 15,
        minHeight: 100,
    },
    errorMessage: { // This style is already defined in the component
        color: '#D32F2F',
        fontSize: 12,
        marginTop: -8,
        marginBottom: 10,
        marginLeft: 5,
    },
    avatarPicker: { // Not used in this component
        alignItems: 'center',
        justifyContent: 'center',
        width: 120,
        height: 120,
        borderRadius: 60,
        backgroundColor: '#E9ECEF',
        borderColor: '#CED4DA',
        borderWidth: 1,
        alignSelf: 'center',
        marginBottom: 20,
        overflow: 'hidden',
        ...Platform.select({
            ios: {
                shadowColor: 'rgba(0,0,0,0.1)',
                shadowOffset: { width: 0, height: 3 },
                shadowOpacity: 0.15,
                shadowRadius: 5,
            },
            android: {
                elevation: 3,
            },
        }),
    },
    avatarImage: { // Not used in this component
        width: '100%',
        height: '100%',
    },
    avatarPlaceholder: { // Not used in this component
        width: '100%',
        height: '100%',
        justifyContent: 'center',
        alignItems: 'center',
    },
    avatarPlaceholderText: { // Not used in this component
        fontSize: 13,
        color: '#6C757D',
        marginTop: 5,
        textAlign: 'center',
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
        justifyContent: 'center',
        paddingVertical: 10, 
        paddingHorizontal: 20, 
        borderRadius: 28, 
        minWidth: 120, 
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
    nextButtonDisabled: { backgroundColor: '#A0CFFF', elevation: 0, shadowOpacity: 0 }, // This is duplicated by buttonDisabled
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
    backButtonHeader: {
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
    subStepTitle: { 
        fontSize: 18,
        fontWeight: 'bold',
        color: '#1C3A5F',
        textAlign: 'center',
        marginBottom: 20,
        bottom: 90,
    }
});