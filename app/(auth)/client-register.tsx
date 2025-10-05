import { Ionicons } from '@expo/vector-icons';
import { Stack, useRouter } from 'expo-router';
import React, { useEffect, useRef, useState, useCallback, useMemo } from 'react';
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
import AsyncStorage from '@react-native-async-storage/async-storage';
import { fetchApi } from '../../services/api';
import { AnimatedErrorMessage } from '../../components/auth/components/AnimatedErrorMessage';
import { SafeAreaView } from 'react-native-safe-area-context'; // Imported but not used directly in JSX

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

const REFERRAL_STORAGE_KEY = 'pending-referral';

const debounced = <T extends (...args: any[]) => void>(fn: T, ms = 500) => {
  let timeout: ReturnType<typeof setTimeout> | undefined;
  return (...args: Parameters<T>) => {
    if (timeout) {
      clearTimeout(timeout);
    }
    timeout = setTimeout(() => fn(...args), ms);
  };
};

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
    const [referralCode, setReferralCode] = useState('');
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
    const [cepInputError, setCepInputError] = useState<string | null>(null);
    const [streetError, setStreetError] = useState<string | null>(null);
    const [numberError, setNumberError] = useState<string | null>(null);
    const [neighborhoodError, setNeighborhoodError] = useState<string | null>(null);
    const [cityError, setCityError] = useState<string | null>(null);
    const [stateError, setStateError] = useState<string | null>(null);
    const [complementError, setComplementError] = useState<string | null>(null);


    const router = useRouter();
    const { signUpClient } = useAuth();

    const applyReferral = useCallback(async (code: string) => {
        const trimmed = code.trim();
        if (!trimmed) {
            await AsyncStorage.removeItem(REFERRAL_STORAGE_KEY);
            return;
        }
        await AsyncStorage.setItem(REFERRAL_STORAGE_KEY, trimmed);
        try {
            await fetchApi('/referrals/apply', {
                method: 'POST',
                headers: { 'x-silent': '1' },
                data: { code: trimmed },
            });
        } catch (error) {
            console.warn('[ClientRegisterScreen] Falha ao aplicar código de indicação:', error);
        }
    }, []);

    const referralChangeHandler = useMemo(() =>
        debounced((value: string) => {
            void applyReferral(value);
        }, 600),
    [applyReferral]);

    const mainElementsOpacity = useRef(new Animated.Value(0)).current;
    const mainElementsTranslateY = useRef(new Animated.Value(18)).current;

    // Logo animation shared values (same as login)
    const logoRotateY = useSharedValue(0);
    const logoPulseScale = useSharedValue(1);
    const logoGlow = useSharedValue(0);
    const logoFloatY = useSharedValue(0);

    // Animation for screen entry
    useEffect(() => {
        Animated.parallel([
            Animated.timing(mainElementsOpacity, { toValue: 1, duration: 700, delay: 200, useNativeDriver: true }),
            Animated.timing(mainElementsTranslateY, { toValue: 0, duration: 700, delay: 200, useNativeDriver: true })
        ]).start(() => {
            // Start logo loop animations after entry animation (same as login)
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
            startLogoLoopAnimations();
        });
    }, [mainElementsOpacity, mainElementsTranslateY, logoRotateY, logoPulseScale, logoGlow, logoFloatY]);

    // Estilo animado adicional para o logo (same as login)
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

    // Auto-save to AsyncStorage
    useEffect(() => {
        const saveFormData = async () => {
            try {
                const formData = {
                    email, username, phone, cpf, dateOfBirth, password,
                    referralCode,
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
                    setReferralCode(formData.referralCode || '');
                    setCurrentStep(formData.currentStep || 1);
                    setSubStepAddress(formData.subStepAddress || 1);
                    setGeneralError("Dados carregados automaticamente. Continue seu cadastro.");
                    console.log("Form data loaded from AsyncStorage.");
                }
                const savedReferral: string | undefined = formData.referralCode;
                if (savedReferral) {
                    await applyReferral(savedReferral);
                } else {
                    const storedReferral = await AsyncStorage.getItem(REFERRAL_STORAGE_KEY);
                    if (storedReferral) {
                        setReferralCode(storedReferral);
                        await applyReferral(storedReferral);
                    }
                }
            } catch (e) {
                console.error("Failed to load form data from AsyncStorage", e);
            }
        };
        loadFormData();
    }, [applyReferral]);

    // Automatic and robust CEP fetching: Trigger when exactly 8 digits are entered (debounced for robustness)
    useEffect(() => {
        const cleanedCep = cep.replace(/\D/g, '');
        if (cleanedCep.length === 8 && !isLoadingCep) {
            // Debounce to avoid rapid API calls
            const timer = setTimeout(() => {
                fetchAddressFromCep();
            }, 500);
            return () => clearTimeout(timer);
        } else if (cleanedCep.length > 0 && cleanedCep.length !== 8) {
            // Clear fields if CEP is invalid/incomplete for robustness
            setStreet(''); setNumber(''); setNeighborhood(''); setCity(''); setState(''); setComplement('');
            setCepInputError(cleanedCep.length < 8 ? "CEP incompleto. Digite os 8 dígitos." : null);
        } else if (cleanedCep.length === 0) {
            // Clear on empty
            setStreet(''); setNumber(''); setNeighborhood(''); setCity(''); setState(''); setComplement('');
            setCepInputError(null);
        }
    }, [cep, isLoadingCep]);


    // --- Pure Validation Functions (do not set state, used for `disabled` prop) ---
    const checkStep1Validity = useCallback(() => { // Step 1: Email + Username
        let isValid = true;
        if (!email.trim()) { isValid = false; }
        else {
            const emailRegex = /^[^\s@]+@[^\s@]+\.\S+$/;
            if (!emailRegex.test(email.trim())) { isValid = false; }
        }
        if (!username.trim()) { isValid = false; }
        return isValid;
    }, [email, username]);

    const checkStep2Validity = useCallback(() => { // Step 2: Phone + CPF
        let isValid = true;
        if (!phone.trim()) { isValid = false; }
        else {
            const cleanedPhone = phone.replace(/\D/g, '');
            if (cleanedPhone.length < 10 || cleanedPhone.length > 11) { isValid = false; }
        }
        if (!cpf.trim()) { isValid = false; }
        else {
            const cleanedCpf = cpf.replace(/\D/g, '');
            if (cleanedCpf.length !== 11) { isValid = false; }
        }
        return isValid;
    }, [phone, cpf]);

    const checkStep3Validity = useCallback(() => { // Step 3: DateOfBirth + Password
        let isValid = true;
        if (!dateOfBirth.trim()) { isValid = false; }
        else {
            const dateRegex = /^\d{2}\/\d{2}\/\d{4}$/;
            if (!dateRegex.test(dateOfBirth)) { isValid = false; }
            else {
                const [day, month, year] = dateOfBirth.split('/').map(Number);
                const dateObj = new Date(year, month - 1, day);
                if (isNaN(dateObj.getTime()) || dateObj.getDate() !== day || dateObj.getMonth() !== month - 1 || dateObj.getFullYear() !== year) {
                    isValid = false;
                }
            }
        }
        if (!password.trim()) { isValid = false; }
        else if (password.length < 6) { isValid = false; }
        return isValid;
    }, [dateOfBirth, password]);

    const checkAddressSubStep1Validity = useCallback(() => { // CEP
        const cleanedCep = cep.replace(/\D/g, '');
        return cleanedCep.length === 8;
    }, [cep]);

    const checkAddressSubStep2Validity = useCallback(() => { // Street, Number, Neighborhood, City, State
        let isValid = true;
        if (!street.trim()) { isValid = false; }
        if (!number.trim()) { isValid = false; }
        if (!neighborhood.trim()) { isValid = false; }
        if (!city.trim()) { isValid = false; }
        if (!state.trim()) { isValid = false; }
        else if (state.trim().length !== 2 || !/^[A-Z]{2}$/i.test(state.trim())) { isValid = false; }
        return isValid;
    }, [street, number, neighborhood, city, state]);

    const checkAddressSubStep3Validity = useCallback(() => { // Complement
        return true; // Complement is optional, so always valid from a 'required' perspective
    }, []);

    // --- Validation functions (set state for errors, used for onBlur and handleNext) ---
    const validateStep1 = useCallback(() => { // Step 1: Email + Username
        let isValid = true;
        setEmailError(null);
        setUsernameError(null);

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
        return isValid;
    }, [email, username]);

    const validateStep2 = useCallback(() => { // Step 2: Phone + CPF
        let isValid = true;
        setPhoneError(null);
        setCpfError(null);

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
        return isValid;
    }, [phone, cpf]);

    const validateStep3 = useCallback(() => { // Step 3: DateOfBirth + Password
        let isValid = true;
        setDateOfBirthError(null);
        setPasswordError(null);

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
                if (isNaN(dateObj.getTime()) || dateObj.getDate() !== day || dateObj.getMonth() !== month - 1 || dateObj.getFullYear() !== year) {
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
    }, [dateOfBirth, password]);

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
        setComplementError(null);
        return true;
    }, []);

    const handleNext = () => {
        setGeneralError(null);
        if (currentStep === 1) { // Step 1: Email + Username
            if (validateStep1()) {
                setCurrentStep(2);
            } else {
                setGeneralError('Por favor, preencha e-mail e nome corretamente.');
            }
        } else if (currentStep === 2) { // Step 2: Phone + CPF
            if (validateStep2()) {
                setCurrentStep(3);
            } else {
                setGeneralError('Por favor, preencha telefone e CPF corretamente.');
            }
        } else if (currentStep === 3) { // Step 3: DateOfBirth + Password
            if (validateStep3()) {
                setCurrentStep(4); // New Step 4 for Address
                setSubStepAddress(1);
            } else {
                setGeneralError('Por favor, preencha data de nascimento e senha corretamente.');
            }
        } else if (currentStep === 4) { // Step 4: Address
            if (subStepAddress === 1) {
                if (validateAddressSubStep1()) {
                    if (!isLoadingCep) {
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
                    handleSignUp();
                }
            }
        }
        // Sutil delay para transição suave (premium feel)
        setTimeout(() => {}, 150);
    };

    const handleBack = () => {
        setGeneralError(null);
        // Clear all specific errors when going back
        setEmailError(null);
        setUsernameError(null);
        setPhoneError(null);
        setCpfError(null);
        setDateOfBirthError(null);
        setPasswordError(null);
        setCepInputError(null);
        setStreetError(null);
        setNumberError(null);
        setNeighborhoodError(null);
        setCityError(null);
        setStateError(null);
        setComplementError(null);

        if (currentStep === 4) { // Address step
            if (subStepAddress === 1) {
                setCurrentStep(3);
                setSubStepAddress(1); // Reset substep when leaving address
            } else {
                setSubStepAddress(subStepAddress - 1);
            }
        } else if (currentStep > 1) {
            setCurrentStep(currentStep - 1);
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
            if (limitedText.length <= 10) {
                formattedPhone += `) ${limitedText.substring(2, 6)}`;
                if (limitedText.length >= 7) {
                    formattedPhone += `-${limitedText.substring(6, 10)}`;
                }
            } else {
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
        setCepInputError(null);
        setGeneralError(null);

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
        // These calls will set errors if validation fails
        const step1Valid = validateStep1();
        const step2Valid = validateStep2();
        const step3Valid = validateStep3();
        const subStep1Valid = validateAddressSubStep1();
        const subStep2Valid = validateAddressSubStep2();
        const subStep3Valid = validateAddressSubStep3();

        if (!step1Valid || !step2Valid || !step3Valid || !subStep1Valid || !subStep2Valid || !subStep3Valid) {
            setGeneralError('Por favor, preencha todos os campos obrigatórios corretamente antes de cadastrar.');
            return;
        }

        setIsLoading(true);
        setGeneralError(null);

        try {
            console.log("[ClientRegisterScreen] Tentando obter permissão de localização...");
            let { status } = await Location.requestForegroundPermissionsAsync();
            if (status !== 'granted') {
                setGeneralError('A permissão para acessar a localização foi negada. Por favor, habilite-a nas configurações do seu dispositivo.');
                setIsLoading(false);
                return;
            }
            
            const fullAddress = `${street}, ${number}, ${neighborhood}, ${city}, ${state}, ${cep}`;
            console.log("[ClientRegisterScreen] Geocodificando endereço:", fullAddress);

            const location = await Location.geocodeAsync(fullAddress);
            
            if (!location || location.length === 0) {
                setGeneralError('Não foi possível encontrar as coordenadas para o endereço fornecido. Por favor, verifique o endereço e tente novamente.');
                setIsLoading(false);
                return;
            }

            const { latitude, longitude } = location[0];
            console.log(`[ClientRegisterScreen] Coordenadas obtidas: Latitude=${latitude}, Longitude=${longitude}`);

            const registerData: RegisterClientDto = {
                email: email.trim().toLowerCase(),
                password: password,
                fullName: username.trim(),
                cpf: cpf.replace(/\D/g, ''),
                phone: phone.replace(/\D/g, ''),
                referralCode: referralCode.trim() ? referralCode.trim() : undefined,
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

    // Helper for progress indicator and microcopy (updated for 4 steps)
    const getStepInfo = () => {
        let stepText = '';
        let microcopy = '';
        let totalSteps = 4;

        switch (currentStep) {
            case 1:
                stepText = ` Dados Básicos`;
                microcopy = 'Vamos começar com e-mail e nome. É rápido!';
                break;
            case 2:
                stepText = `Contato e Identidade`;
                microcopy = 'Agora, telefone e CPF para contato e verificação.';
                break;
            case 3:
                stepText = ` Dados Pessoais`;
                microcopy = 'Data de nascimento e senha para segurança.';
                break;
            case 4:
                switch (subStepAddress) {
                    case 1:
                        stepText = `Etapa 4.1 de ${totalSteps}: Endereço`;
                        microcopy = 'Informe seu CEP e buscamos o endereço automaticamente.';
                        break;
                    case 2:
                        stepText = `Etapa 4.2 de ${totalSteps}: Endereço (Detalhes)`;
                        microcopy = 'Confirme e complete os detalhes do seu endereço.';
                        break;
                    case 3:
                        stepText = `Etapa 4.3 de ${totalSteps}: Endereço (Complemento)`;
                        microcopy = 'Adicione um complemento para facilitar a localização (opcional).';
                        break;
                }
                break;
        }
        return { stepText, microcopy };
    };

    const getBackButtonText = () => {
        if (currentStep === 4) {
            if (subStepAddress === 1) return 'Voltar para Dados Pessoais';
            if (subStepAddress === 2) return 'Voltar para CEP';
            if (subStepAddress === 3) return 'Voltar para Detalhes do Endereço';
        } else if (currentStep === 3) {
            return 'Voltar para Contato e Identidade';
        } else if (currentStep === 2) {
            return 'Voltar para Dados Básicos';
        }
        return '';
    };

    const { stepText, microcopy } = getStepInfo();

    return (
        <SafeAreaView style={styles.safeArea}>
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
                            <AnimatedReanimated.Image
                                source={LOGO_IMAGE}
                                style={[styles.logo, animatedLogoStyle]} // Aplica ambos os estilos
                                resizeMode="contain"
                            />
                        </View>

                        <Text style={styles.welcomeSubtitle}>Crie sua conta no LimpeJá !</Text>
                        <Text style={styles.stepIndicatorText}>{stepText}</Text>
                        <Text style={styles.microcopyText}>{microcopy}</Text>

                        {/* Step 1: Email + Username */}
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

                                <View style={styles.inputWrapper}>
                                    <View style={styles.iconCircle}>
                                        <Ionicons name="gift-outline" size={20} color="#00BCD4" />
                                    </View>
                                    <TextInput
                                        style={styles.input}
                                        placeholder="Código de indicação (opcional)"
                                        placeholderTextColor="#A0AEC0"
                                        value={referralCode}
                                        onChangeText={(text) => { setReferralCode(text); referralChangeHandler(text); }}
                                        autoCapitalize="characters"
                                        autoCorrect={false}
                                    />
                                </View>

                                <AnimatedErrorMessage message={generalError} isVisible={!!generalError} centered={true} />

                                {/* Next Button */}
                                <Animated.View style={{transform: [{scale: nextButtonAnims.scaleAnim}]}}>
                                    <TouchableOpacity
                                    style={[styles.nextButton, (isLoading || !checkStep1Validity()) && styles.buttonDisabled]} // Usando a função pura aqui
                                    onPress={handleNext}
                                    onPressIn={nextButtonAnims.onPressIn}
                                    onPressOut={nextButtonAnims.onPressOut}
                                    disabled={isLoading || !checkStep1Validity()} // Usando a função pura aqui
                                    >
                                        <Text style={styles.nextButtonText}>Avançar</Text>
                                    </TouchableOpacity>
                                </Animated.View>
                            </View>
                        )}

                        {/* Step 2: Phone + CPF */}
                        {currentStep === 2 && (
                            <View>
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
                                        onBlur={validateStep2}
                                        keyboardType="phone-pad"
                                        maxLength={15}
                                    />
                                </View>
                                <AnimatedErrorMessage message={phoneError} isVisible={!!phoneError} centered={false} />

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
                                        maxLength={14}
                                    />
                                </View>
                                <AnimatedErrorMessage message={cpfError} isVisible={!!cpfError} centered={false} />

                                <AnimatedErrorMessage message={generalError} isVisible={!!generalError} centered={true} />

                                {/* Navigation Buttons */}
                                <View style={styles.navigationButtons}>
                                    <TouchableOpacity style={[styles.navButton, styles.backButton]} onPress={handleBack}>
                                        <Ionicons name="arrow-back-outline" size={20} color="#00BCD4" />
                                        <Text style={styles.navButtonTextBack}>Voltar</Text>
                                    </TouchableOpacity>
                                    <TouchableOpacity
                                        style={[styles.navButton, styles.finalButton, (isLoading || !checkStep2Validity()) && styles.buttonDisabled]} // Usando a função pura aqui
                                        onPress={handleNext}
                                        disabled={isLoading || !checkStep2Validity()} // Usando a função pura aqui
                                    >
                                        <Text style={styles.navButtonTextNext}>Avançar</Text>
                                        <Ionicons name="arrow-forward-outline" size={20} color="#fff" />
                                    </TouchableOpacity>
                                </View>
                            </View>
                        )}

                        {/* Step 3: DateOfBirth + Password */}
                        {currentStep === 3 && (
                            <View>
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
                                        onBlur={validateStep3}
                                        keyboardType="numeric"
                                        maxLength={10}
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
                                        onBlur={validateStep3}
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
                                        style={[styles.navButton, styles.finalButton, (isLoading || !checkStep3Validity()) && styles.buttonDisabled]} // Usando a função pura aqui
                                        onPress={handleNext}
                                        disabled={isLoading || !checkStep3Validity()} // Usando a função pura aqui
                                    >
                                        <Text style={styles.navButtonTextNext}>Avançar</Text>
                                        <Ionicons name="arrow-forward-outline" size={20} color="#fff" />
                                    </TouchableOpacity>
                                </View>
                            </View>
                        )}

                        {/* Step 4: Endereço (Sub-steps) */}
                        {currentStep === 4 && (
                            <View>
                                {/* Sub-step 1: CEP */}
                                {subStepAddress === 1 && (
                                    <View>
                                        
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
                                                // Removido onBlur para depender da automação via useEffect
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
                                                style={[styles.navButton, styles.finalButton, (isLoadingCep || !checkAddressSubStep1Validity()) && styles.buttonDisabled]} // Usando a função pura aqui
                                                onPress={handleNext}
                                                disabled={isLoadingCep || !checkAddressSubStep1Validity()} // Usando a função pura aqui
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
                                                style={[styles.navButton, styles.finalButton, (isLoading || !checkAddressSubStep2Validity()) && styles.buttonDisabled]} // Usando a função pura aqui
                                                onPress={handleNext}
                                                disabled={isLoading || !checkAddressSubStep2Validity()} // Usando a função pura aqui
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
                                                style={[styles.navButton, styles.finalButton, (isLoading || !checkAddressSubStep3Validity()) && styles.buttonDisabled]} // Usando a função pura aqui
                                                onPress={handleNext}
                                                onPressIn={signUpButtonAnims.onPressIn}
                                                onPressOut={signUpButtonAnims.onPressOut}
                                                disabled={isLoading || !checkAddressSubStep3Validity()} // Usando a função pura aqui
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
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safeArea: {
        flex: 1,
        backgroundColor: '#F7F8FC',
    },
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
        paddingBottom: 120,
    },
    contentWrapper: {
        paddingHorizontal: 55,
        paddingTop: Platform.OS === 'ios' ? 10 : 15,
    },
    logoContainer: {
        alignItems: 'center',
        top: 34,
        left: -8,
    },
    logo: {
        width: 210,
        height: 300,
        resizeMode: 'contain',
        // Adicione as propriedades de sombra estáticas aqui (same as login)
        shadowColor: '#8ca3ac98',
        shadowRadius: 10,
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.8, // Opacidade base para a sombra
    },
    welcomeSubtitle: {
        fontSize: 14,
        color: '#8A94A6',
        textAlign: 'center',
        marginBottom: 30,
        bottom: 90,
    },
    stepIndicatorText: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#1C3A5F',
        textAlign: 'center',
        marginBottom: 5,
        bottom: 100,
    },
    microcopyText: {
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
        borderWidth: 1,
        borderColor: 'transparent',
    },
    inputWrapperError: {
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
    nextButton: {
        backgroundColor: '#40C0F0',
        borderRadius: 28,
        paddingVertical: 5,
        width: '100%',
        left: 0,
        bottom: 75,
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: 10,
        marginBottom: 15,
        shadowColor: '#00BCD4',
        shadowOffset: { width: 0, height: 5 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 10,
    },
    nextButtonText: {
        color: '#FFFFFF',
        fontSize: 16,
        fontWeight: '600',
    },
    buttonDisabled: {
        backgroundColor: '#A0CFFF',
        elevation: 0,
        shadowOpacity: 0,
    },
    cepLoadingIndicator: {
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
        flex: 1,
        marginHorizontal: 5,
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
    backButtonHeader: {
        marginLeft: 15,
        padding: 5,
        flexDirection: 'row',
        alignItems: 'center',
    },
    backButtonHeaderText: {
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