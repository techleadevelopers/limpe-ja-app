import { Ionicons } from '@expo/vector-icons';
import { Stack, useRouter } from 'expo-router';
import React, { useEffect, useRef, useState, useCallback, useMemo } from 'react';
import {
    ActivityIndicator,
    Animated,
    Dimensions,
    Easing as RNEasing,
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
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import Constants from 'expo-constants';
import { useAuth } from '../../contexts/AuthContext';
import { CreateAddressDto, RegisterClientDto } from '../../types/backend/auth';

import * as Location from 'expo-location';
import { ensureLocationPermission } from '../../services/locationService';
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

const SCREEN_WIDTH = Dimensions.get('window').width;
const SCREEN_HEIGHT = Dimensions.get('window').height;

/* ---------------------- fim BubblesRN ---------------------- */

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

const fetchAddressByCep = async (inputCep: string) => {
    const cleanedCep = inputCep.replace(/\D/g, '');
    if (cleanedCep.length !== 8) {
        throw new Error('CEP deve conter 8 dígitos.');
    }

    try {
        const response = await fetch(`https://viacep.com.br/ws/${cleanedCep}/json/`);
        const data = await response.json();

        if (data.erro) {
            throw new Error('CEP não encontrado ou inválido.');
        }

        return {
            cep: data.cep,
            logradouro: data.logradouro || '',
            complemento: data.complemento || '',
            bairro: data.bairro || '',
            localidade: data.localidade || '',
            uf: data.uf || '',
        };
    } catch (error) {
        console.error("Erro ao buscar CEP:", error);
        throw new Error('Erro ao buscar CEP. Tente novamente.');
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
  const [cepLoading, setCepLoading] = useState(false);
  const [generalError, setGeneralError] = useState<string | null>(null);

    // Refs de UX para focar senha e rolar até o campo em caso de erro (sem alterar a UI)
    const scrollRef = useRef<ScrollView | null>(null);
    const passwordInputRef = useRef<TextInput | null>(null);
    const [passwordInputY, setPasswordInputY] = useState<number>(0);

    // Adicionadas: Refs e estados Y para todos os inputs (corrigindo "Cannot find name")
    const usernameInputRef = useRef<TextInput | null>(null);
    const [usernameInputY, setUsernameInputY] = useState(0);
    const emailInputRef = useRef<TextInput | null>(null);
    const [emailInputY, setEmailInputY] = useState(0);
    const phoneInputRef = useRef<TextInput | null>(null);
    const [phoneInputY, setPhoneInputY] = useState(0);
    const cpfInputRef = useRef<TextInput | null>(null);
    const [cpfInputY, setCpfInputY] = useState(0);
    const cepInputRef = useRef<TextInput | null>(null);
    const [cepInputY, setCepInputY] = useState(0);
    const streetInputRef = useRef<TextInput | null>(null);
    const [streetInputY, setStreetInputY] = useState(0);
    const numberInputRef = useRef<TextInput | null>(null);
    const [numberInputY, setNumberInputY] = useState(0);
    const neighborhoodInputRef = useRef<TextInput | null>(null);
    const [neighborhoodInputY, setNeighborhoodInputY] = useState(0);
    const cityInputRef = useRef<TextInput | null>(null);
    const [cityInputY, setCityInputY] = useState(0);
    const stateInputRef = useRef<TextInput | null>(null);
    const [stateInputY, setStateInputY] = useState(0);

    // Adicionadas e movidas para cima: Estados de erro (corrigindo uso antes da declaração e block scope)
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

    const HAPTICS_ON_ERROR = useMemo(() => {
        try { return Boolean((Constants.expoConfig?.extra as any)?.hapticsOnError ?? true); } catch { return true; }
    }, []);
    const hapticSelect = useCallback(() => { if (HAPTICS_ON_ERROR) Haptics.selectionAsync(); }, [HAPTICS_ON_ERROR]);

    // Auto-scroll/focus ao detectar erro (mantém passo atual visível) - Agora usa declarações corretas
    useEffect(() => {
    if (!generalError) return;
    try {
      if (currentStep === 1) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.\S+$/;
        let targetY = !username.trim() ? usernameInputY : (!email.trim() || !emailRegex.test(email.trim()) ? emailInputY : usernameInputY);
        let targetRef = !username.trim() ? usernameInputRef.current : (!email.trim() || !emailRegex.test(email.trim()) ? emailInputRef.current : usernameInputRef.current);
        if (scrollRef.current) scrollRef.current.scrollTo({ y: Math.max(targetY - 120, 0), animated: true });
        setTimeout(() => { hapticSelect(); targetRef?.focus(); }, 120);
      } else if (currentStep === 2) {
        const cleanedPhone = phone.replace(/\D/g, '');
        const cleanedCpf = cpf.replace(/\D/g, '');
        const phoneOk = phone.trim() && (cleanedPhone.length >= 10 && cleanedPhone.length <= 11);
        const cpfOk = cpf.trim() && cleanedCpf.length === 11;
        let targetY = !phoneOk ? phoneInputY : (!cpfOk ? cpfInputY : phoneInputY);
        let targetRef = !phoneOk ? phoneInputRef.current : (!cpfOk ? cpfInputRef.current : phoneInputRef.current);
        if (scrollRef.current) scrollRef.current.scrollTo({ y: Math.max(targetY - 120, 0), animated: true });
        setTimeout(() => { hapticSelect(); targetRef?.focus(); }, 120);
      } else if (currentStep === 5) {
        if (subStepAddress === 1 && cepInputError) {
          if (scrollRef.current) scrollRef.current.scrollTo({ y: Math.max(cepInputY - 120, 0), animated: true });
          setTimeout(() => { hapticSelect(); cepInputRef.current?.focus(); }, 120);
        } else if (subStepAddress === 2 && (streetError || numberError || neighborhoodError || cityError || stateError)) {
          const ufOk = state.trim().length === 2 && /^[A-Za-z]{2}$/.test(state.trim());
          const pick = !street.trim() ? { y: streetInputY, ref: streetInputRef.current }
            : (!number.trim() ? { y: numberInputY, ref: numberInputRef.current }
            : (!neighborhood.trim() ? { y: neighborhoodInputY, ref: neighborhoodInputRef.current }
            : (!city.trim() ? { y: cityInputY, ref: cityInputRef.current }
            : (!ufOk ? { y: stateInputY, ref: stateInputRef.current } : { y: streetInputY, ref: streetInputRef.current }))));
          if (scrollRef.current) scrollRef.current.scrollTo({ y: Math.max(pick.y - 120, 0), animated: true });
          setTimeout(() => { hapticSelect(); pick.ref?.focus(); }, 120);
        }
      }
    } catch {}
  // deps relevantes
  }, [generalError, currentStep, subStepAddress, username, email, phone, cpf, cepInputError, streetError, numberError, neighborhoodError, cityError, stateError, hapticSelect]);

    useEffect(() => {
        if (currentStep === 3 && (passwordError || generalError)) {
            try {
                if (scrollRef.current) {
                    const y = Math.max(passwordInputY - 120, 0);
                    scrollRef.current.scrollTo({ y, animated: true });
                }
                setTimeout(() => { hapticSelect(); passwordInputRef.current?.focus(); }, 150);
            } catch {}
        }
    }, [currentStep, passwordError, generalError, passwordInputY, hapticSelect]);

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
            let parsedFormData: any | null = null;
            try {
                const savedData = await AsyncStorage.getItem('clientRegisterFormData');
                if (savedData) {
                    parsedFormData = JSON.parse(savedData);
                    setEmail(parsedFormData.email || '');
                    setUsername(parsedFormData.username || '');
                    setPhone(parsedFormData.phone || '');
                    setCpf(parsedFormData.cpf || '');
                    setDateOfBirth(parsedFormData.dateOfBirth || '');
                    setPassword(parsedFormData.password || '');
                    setCep(parsedFormData.cep || '');
                    setStreet(parsedFormData.street || '');
                    setNumber(parsedFormData.number || '');
                    setNeighborhood(parsedFormData.neighborhood || '');
                    setCity(parsedFormData.city || '');
                    setState(parsedFormData.state || '');
                    setComplement(parsedFormData.complement || '');
                    setReferralCode(parsedFormData.referralCode || '');
                    setCurrentStep(parsedFormData.currentStep || 1);
                    setSubStepAddress(parsedFormData.subStepAddress || 1);
                    setGeneralError("Dados carregados automaticamente. Continue seu cadastro.");
                }
                const savedReferral: string | undefined = parsedFormData?.referralCode;
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
        if (cleanedCep.length === 8 && !cepLoading) {
            // Debounce to avoid rapid API calls
            const timer = setTimeout(() => {
                fetchAddressByCepApi(cep);
            }, 500);
            return () => clearTimeout(timer);
        } else if (cleanedCep.length > 0 && cleanedCep.length !== 8) {
            // Clear fields if CEP is invalid/incomplete for robustness
            setStreet(''); setNumber(''); setNeighborhood(''); setCity(''); setState(''); setComplement('');
            setCepInputError(cleanedCep.length < 8 ? "CEP incompleto. Digite os 8 dígitos." : null);
            setGeneralError(null);
        } else if (cleanedCep.length === 0) {
            // Clear on empty
            setStreet(''); setNumber(''); setNeighborhood(''); setCity(''); setState(''); setComplement('');
            setCepInputError(null);
            setGeneralError(null);
        }
    }, [cep, cepLoading]);

    const fetchAddressByCepApi = async (inputCep: string) => {
        setCepInputError(null);
        setGeneralError(null);

        const cleanedCep = inputCep.replace(/\D/g, '');
        if (cleanedCep.length !== 8) {
            setCepInputError('CEP deve conter 8 dígitos.');
            setStreet(''); setNumber(''); setNeighborhood(''); setCity(''); setState(''); setComplement('');
            return;
        }

        setCepLoading(true);
        try {
            const data = await fetchAddressByCep(inputCep);
            setStreet(data.logradouro);
            setNeighborhood(data.bairro);
            setCity(data.localidade);
            setState(data.uf);
            setComplement(data.complemento);
            setCepInputError(null);
        } catch (error: any) {
            console.error("Erro ao buscar CEP:", error);
            setCepInputError(error.message || 'Erro ao buscar CEP. Tente novamente.');
            setStreet(''); setNumber(''); setNeighborhood(''); setCity(''); setState(''); setComplement('');
        } finally {
            setCepLoading(false);
        }
    };

    // --- PURE VALIDATION FUNCTIONS (NO STATE SETTERS) FOR DISABLED PROP ---
    const checkStep1Validity = useCallback(() => { // Step 1: Username + Email
        let valid = true;
        if (!username.trim()) valid = false;
        if (!email.trim()) valid = false;
        else {
            const emailRegex = /^[^\s@]+@[^\s@]+\.\S+$/;
            if (!emailRegex.test(email.trim())) valid = false;
        }
        return valid;
    }, [email, username]);

    const checkStep2Validity = useCallback(() => { // Step 2: Phone + CPF
        let valid = true;
        const cleanedPhone = phone.replace(/\D/g, '');
        if (!phone.trim() || (cleanedPhone.length < 10 || cleanedPhone.length > 11)) valid = false;
        const cleanedCpf = cpf.replace(/\D/g, '');
        if (!cpf.trim() || cleanedCpf.length !== 11) valid = false;
        return valid;
    }, [phone, cpf]);

    const checkStep3Validity = useCallback(() => { // Step 3: DateOfBirth + Password
        let valid = true;
        if (!dateOfBirth.trim()) valid = false;
        else {
            const dateRegex = /^\d{2}\/\d{2}\/\d{4}$/;
            if (!dateRegex.test(dateOfBirth)) valid = false;
            else {
                const [day, month, year] = dateOfBirth.split('/').map(Number);
                const dateObj = new Date(year, month - 1, day);
                if (isNaN(dateObj.getTime()) || dateObj.getDate() !== day || dateObj.getMonth() !== month - 1 || dateObj.getFullYear() !== year) valid = false;
            }
        }
        if (!password.trim() || password.length < 6) valid = false;
        return valid;
    }, [dateOfBirth, password]);

    const checkStep4Validity = useCallback(() => { // Step 4: Referral Code (opcional, sempre válido)
        return true; // Sempre válido, pois é opcional
    }, []);

    const checkAddressSubStep1Validity = useCallback(() => {
        const cleanedCep = cep.replace(/\D/g, '');
        return cleanedCep.length === 8;
    }, [cep]);

    const checkAddressSubStep2Validity = useCallback(() => {
        let valid = true;
        if (!street.trim()) valid = false;
        if (!number.trim()) valid = false;
        if (!neighborhood.trim()) valid = false;
        if (!city.trim()) valid = false;
        if (!state.trim() || state.trim().length !== 2 || !/^[A-Z]{2}$/i.test(state.trim())) valid = false;
        return valid;
    }, [street, number, neighborhood, city, state]);

    const checkAddressSubStep3Validity = useCallback(() => {
        return true; // Complement is optional
    }, []);

    // --- BLUR HANDLERS (SET SPECIFIC ERRORS) ---
    const handleEmailBlur = useCallback(() => {
        if (!email.trim()) {
            setEmailError('O e-mail é obrigatório.');
        } else {
            const emailRegex = /^[^\s@]+@[^\s@]+\.\S+$/;
            if (!emailRegex.test(email.trim())) {
                setEmailError('Formato de e-mail inválido.');
            } else {
                setEmailError(null);
            }
        }
    }, [email]);

    const handleUsernameBlur = useCallback(() => {
        if (!username.trim()) {
            setUsernameError('O nome completo é obrigatório.');
        } else {
            setUsernameError(null);
        }
    }, [username]);

    const handlePhoneBlur = useCallback(() => {
        if (!phone.trim()) {
            setPhoneError('O telefone é obrigatório.');
        } else {
            const cleanedPhone = phone.replace(/\D/g, '');
            if (cleanedPhone.length < 10 || cleanedPhone.length > 11) {
                setPhoneError('O telefone deve ter 10 ou 11 dígitos.');
            } else {
                setPhoneError(null);
            }
        }
    }, [phone]);

    const handleCpfBlur = useCallback(() => {
        const cleanedCpf = cpf.replace(/\D/g, '');
        if (!cpf.trim()) {
            setCpfError('O CPF é obrigatório.');
        } else if (cleanedCpf.length !== 11) {
            setCpfError('CPF inválido. Deve conter 11 dígitos.');
        } else {
            setCpfError(null);
        }
    }, [cpf]);

    const handleDateOfBirthBlur = useCallback(() => {
        if (!dateOfBirth.trim()) {
            setDateOfBirthError('A data de nascimento é obrigatória.');
        } else {
            const dateRegex = /^\d{2}\/\d{2}\/\d{4}$/;
            if (!dateRegex.test(dateOfBirth)) {
                setDateOfBirthError('Formato de data inválido (DD/MM/AAAA).');
            } else {
                const [day, month, year] = dateOfBirth.split('/').map(Number);
                const dateObj = new Date(year, month - 1, day);
                if (isNaN(dateObj.getTime()) || dateObj.getDate() !== day || dateObj.getMonth() !== month - 1 || dateObj.getFullYear() !== year) {
                    setDateOfBirthError('Data de nascimento inválida.');
                } else {
                    setDateOfBirthError(null);
                }
            }
        }
    }, [dateOfBirth]);

    const handlePasswordBlur = useCallback(() => {
        if (!password.trim()) {
            setPasswordError('A senha é obrigatória.');
        } else if (password.length < 6) {
            setPasswordError('A senha deve ter no mínimo 6 caracteres.');
        } else {
            setPasswordError(null);
        }
    }, [password]);

    const handleReferralBlur = useCallback(() => {
        // Opcional, sem erro específico
    }, []);

    const handleCepBlur = useCallback(() => {
        const cleanedCep = cep.replace(/\D/g, '');
        if (cleanedCep.length !== 8) {
            setCepInputError("CEP inválido. Digite os 8 dígitos.");
        } else {
            setCepInputError(null);
        }
    }, [cep]);

    const handleStreetBlur = useCallback(() => {
        if (!street.trim()) {
            setStreetError('A rua é obrigatória.');
        } else {
            setStreetError(null);
        }
    }, [street]);

    const handleNumberBlur = useCallback(() => {
        if (!number.trim()) {
            setNumberError('O número é obrigatório.');
        } else {
            setNumberError(null);
        }
    }, [number]);

    const handleNeighborhoodBlur = useCallback(() => {
        if (!neighborhood.trim()) {
            setNeighborhoodError('O bairro é obrigatório.');
        } else {
            setNeighborhoodError(null);
        }
    }, [neighborhood]);

    const handleCityBlur = useCallback(() => {
        if (!city.trim()) {
            setCityError('A cidade é obrigatória.');
        } else {
            setCityError(null);
        }
    }, [city]);

    const handleStateBlur = useCallback(() => {
        if (!state.trim()) {
            setStateError('O estado é obrigatório.');
        } else if (state.trim().length !== 2 || !/^[A-Z]{2}$/i.test(state.trim())) {
            setStateError('O estado (UF) deve ter 2 letras válidas.');
        } else {
            setStateError(null);
        }
    }, [state]);

    const handleComplementBlur = useCallback(() => {
        setComplementError(null); // Optional, no error
    }, []);

    const handleNext = async () => {
        console.log(`[ClientRegister] handleNext: Tentando avançar do Step ${currentStep}. SubStep: ${subStepAddress}`);
        setGeneralError(null);
        // Simple guard to avoid double-taps
        if (isLoading) {
            return;
        }

        if (currentStep === 1) { // Step 1: Username + Email
            const isValid = checkStep1Validity();
            if (!isValid) {
                handleUsernameBlur();
                handleEmailBlur();
                setGeneralError('Por favor, preencha nome e e-mail corretamente.');
                console.warn("[ClientRegister] handleNext: Falha ao avançar: Step 1 inválido.");
                return;
            }
            setCurrentStep(2);
            console.log("[ClientRegister] handleNext: Avançando para o Step 2 (Telefone + CPF).");
        } else if (currentStep === 2) { // Step 2: Phone + CPF
            const isValid = checkStep2Validity();
            if (!isValid) {
                handlePhoneBlur();
                handleCpfBlur();
                setGeneralError('Por favor, preencha telefone e CPF corretamente.');
                console.warn("[ClientRegister] handleNext: Falha ao avançar: Step 2 inválido.");
                return;
            }
            setCurrentStep(3);
            console.log("[ClientRegister] handleNext: Avançando para o Step 3 (Data + Senha).");
        } else if (currentStep === 3) { // Step 3: DateOfBirth + Password
            const isValid = checkStep3Validity();
            if (!isValid) {
                handleDateOfBirthBlur();
                handlePasswordBlur();
                setGeneralError('Por favor, preencha data de nascimento e senha corretamente.');
                console.warn("[ClientRegister] handleNext: Falha ao avançar: Step 3 inválido.");
                return;
            }
            setCurrentStep(4); // Step 4: Referral
            console.log("[ClientRegister] handleNext: Avançando para o Step 4 (Código de Indicação).");
        } else if (currentStep === 4) { // Step 4: Referral Code (opcional)
            const isValid = checkStep4Validity();
            if (!isValid) {
                handleReferralBlur();
                setGeneralError('Por favor, verifique o código de indicação.');
                console.warn("[ClientRegister] handleNext: Falha ao avançar: Step 4 inválido.");
                return;
            }
            setCurrentStep(5); // Step 5: Address
            setSubStepAddress(1);
            console.log("[ClientRegister] handleNext: Avançando para o Step 5 (Endereço).");
        } else if (currentStep === 5) { // Step 5: Address
            if (subStepAddress === 1) {
                const isValid = checkAddressSubStep1Validity();
                if (!isValid) {
                    handleCepBlur();
                    setGeneralError("CEP inválido. Digite os 8 dígitos.");
                    console.warn("[ClientRegister] handleNext: Falha ao avançar: Sub-step 1 (CEP) inválido.");
                    return;
                }
                if (cepLoading) {
                    setGeneralError('Aguarde a busca do CEP ser concluída.');
                    return;
                }
                setSubStepAddress(2);
                console.log("[ClientRegister] handleNext: Avançando para o Sub-step 2 (Detalhes do Endereço).");
            } else if (subStepAddress === 2) {
                const isValid = checkAddressSubStep2Validity();
                if (!isValid) {
                    handleStreetBlur();
                    handleNumberBlur();
                    handleNeighborhoodBlur();
                    handleCityBlur();
                    handleStateBlur();
                    setGeneralError('Por favor, preencha todos os campos de endereço corretamente.');
                    console.warn("[ClientRegister] handleNext: Falha ao avançar: Sub-step 2 (Detalhes do Endereço) inválido.");
                    return;
                }
                setSubStepAddress(3);
                console.log("[ClientRegister] handleNext: Avançando para o Sub-step 3 (Complemento).");
            } else if (subStepAddress === 3) {
                const isValid = checkAddressSubStep3Validity();
                if (!isValid) {
                    handleComplementBlur();
                    setGeneralError('Por favor, verifique o complemento.');
                    console.warn("[ClientRegister] handleNext: Falha ao avançar: Sub-step 3 inválido.");
                    return;
                }
                setIsLoading(true);
                try {
                    const ok = await ensureLocationPermission();
                    if (!ok) {
                        setGeneralError('A permissão para acessar a localização foi negada. Por favor, habilite-a nas configurações do seu dispositivo.');
                        setIsLoading(false);
                        return;
                    }

                    const fullAddress = `${street.trim()}, ${number.trim()}, ${neighborhood.trim()}, ${city.trim()}, ${state.trim()}, ${cep.trim()}`;
                    console.log("[ClientRegister] Geocodificando endereço:", fullAddress);

                    const location = await Location.geocodeAsync(fullAddress);
                    if (!location || location.length === 0) {
                        setGeneralError('Não foi possível encontrar as coordenadas para o endereço fornecido. Por favor, verifique o endereço e tente novamente.');
                        setIsLoading(false);
                        return;
                    }

                    const { latitude, longitude } = location[0];
                    console.log(`[ClientRegister] Coordenadas obtidas via expo-location: Latitude=${latitude}, Longitude=${longitude}`);

                    const [day, month, year] = dateOfBirth.split('/').map(Number);
                    const formattedDateOfBirth = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;

                    // @ts-ignore - Suprimir erro TS se dateOfBirth não estiver no tipo RegisterClientDto (ajustar tipo no backend se necessário)
                    const registerData: RegisterClientDto = {
                        email: email.trim(),
                        password: password.trim(),
                        fullName: username.trim(),
                        cpf: cpf.replace(/\D/g, ''),
                        dateOfBirth: formattedDateOfBirth,
                        phone: phone.replace(/\D/g, ''),
                        referralCode: referralCode.trim() || undefined,
                        address: {
                            cep: cep.trim(),
                            street: street.trim(),
                            number: number.trim(),
                            neighborhood: neighborhood.trim(),
                            city: city.trim(),
                            state: state.trim(),
                            complement: complement.trim(),
                            latitude,
                            longitude,
                        } as CreateAddressDto,
                    };
                    console.log("[ClientRegister] handleNext (Step 5 - final sub-step): Chamando signUpClient do AuthContext para registro inicial.");
                    await signUpClient(registerData);

                    // Clear AsyncStorage after successful registration
                    await AsyncStorage.removeItem('clientRegisterFormData');
                    console.log("[ClientRegister] handleNext (Step 5 - final sub-step): signUpClient do AuthContext retornou sucesso. Redirecionando para explore autenticado.");
                    router.replace('/(client)/explore'); // Após cadastro + login automático, leva o cliente direto para a HOME autenticada
                } catch (error: any) {
                    console.error("[ClientRegister] handleNext (Step 5 - final sub-step): Erro durante o registro inicial:", error.message, error);
                    const msg = (error?.message || '').toLowerCase();
                    if (msg.includes('no results') || msg.includes('not find') || msg.includes('encontrar')) {
                        setGeneralError('Não foi possível encontrar as coordenadas para este endereço. Verifique os dados e tente novamente.');
                    } else {
                        setGeneralError(error.message || 'Falha no registro inicial. Por favor, verifique o endereço e tente novamente.');
                    }
                } finally {
                    setIsLoading(false);
                    console.log("[ClientRegister] handleNext (Step 5 - final sub-step): isLoading definido como false.");
                }
            }
        }
        // Sutil delay para transição suave (premium feel)
        await new Promise(resolve => setTimeout(resolve, 150));
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

        if (currentStep === 1) {
            // No Step 1, voltar para a tela anterior (ex: seleção de tipo de usuário)
            router.back();
        } else if (currentStep === 5) { // Address step (agora Step 5)
            if (subStepAddress === 1) {
                setCurrentStep(4);
                setSubStepAddress(1); // Reset substep when leaving address
            } else {
                setSubStepAddress(subStepAddress - 1);
            }
        } else if (currentStep > 1) {
            setCurrentStep(currentStep - 1);
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
    const isNextButtonEnabledStep1 = checkStep1Validity();
    const isNextButtonEnabledStep2 = checkStep2Validity();
    const isNextButtonEnabledStep3 = checkStep3Validity();
    const isNextButtonEnabledStep4 = checkStep4Validity();
    const isNextButtonEnabledAddressSubStep1 = checkAddressSubStep1Validity() && !cepLoading;
    const isNextButtonEnabledAddressSubStep2 = checkAddressSubStep2Validity();
    const isNextButtonEnabledAddressSubStep3 = checkAddressSubStep3Validity();

    // Helper for progress indicator and microcopy (updated for 5 steps)
    const getStepInfo = () => {
        let stepText = '';
        let microcopy = '';
        let totalSteps = 5;

        switch (currentStep) {
            case 1:
                stepText = `Dados Básicos`;
                microcopy = 'Vamos começar com seu nome e e-mail. É rápido!';
                break;
            case 2:
                stepText = `Contato e Identidade`;
                microcopy = 'Agora, telefone e CPF para contato e verificação.';
                break;
            case 3:
                stepText = `Dados Pessoais`;
                microcopy = 'Data de nascimento e senha para segurança.';
                break;
            case 4:
                stepText = `Código de Indicação`;
                microcopy = 'Insira um código de indicação se tiver um (opcional). Isso pode dar benefícios no app!';
                break;
            case 5:
                switch (subStepAddress) {
                    case 1:
                        stepText = `Endereço (CEP)`;
                        microcopy = 'Informe seu CEP e buscamos o endereço automaticamente.';
                        break;
                    case 2:
                        stepText = `Endereço (Detalhes)`;
                        microcopy = 'Confirme e complete os detalhes do seu endereço.';
                        break;
                    case 3:
                        stepText = `Endereço (Complemento)`;
                        microcopy = 'Adicione um complemento para facilitar a localização (opcional).';
                        break;
                }
                break;
        }
        return { stepText, microcopy };
    };

    const getBackButtonText = () => {
        if (currentStep === 5) {
            if (subStepAddress === 1) return 'Voltar para Código de Indicação';
            if (subStepAddress === 2) return 'Voltar para CEP';
            if (subStepAddress === 3) return 'Voltar para Detalhes do Endereço';
        } else if (currentStep === 4) {
            return 'Voltar para Dados Pessoais';
        } else if (currentStep === 3) {
            return 'Voltar para Contato e Identidade';
        } else if (currentStep === 2) {
            return 'Voltar para Dados Básicos';
        }
        return '';
    };

    const { stepText, microcopy } = getStepInfo();

    const getWelcomeSubtitle = () => {
        switch (currentStep) {
            case 1:
                return '';
            case 2:
                return '';
            case 3:
                return '';
            case 4:
                return 'Indicação Opcional';
            case 5:
                switch (subStepAddress) {
                    case 1: return 'Endereço: CEP';
                    case 2: return 'Endereço: Detalhes';
                    case 3: return 'Endereço: Complemento';
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

    return (
        <SafeAreaView style={styles.safeArea}>
            <KeyboardAvoidingView
                behavior={Platform.OS === "ios" ? "padding" : "height"}
                style={styles.keyboardAvoidingContainer}
            >
                <StatusBar barStyle="dark-content" backgroundColor={styles.scrollView.backgroundColor} />

                <LinearGradient
                    colors={['#F0F4F8', '#E2E8F0', '#F7FAFC']}
                    style={StyleSheet.absoluteFillObject}
                />

                <ScrollView ref={scrollRef} style={styles.scrollView} contentContainerStyle={styles.scrollContentContainer} keyboardShouldPersistTaps="handled" >
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
                            <AnimatedReanimated.Image
                                source={LOGO_IMAGE}
                                style={[styles.logo, animatedLogoStyle]} // Aplica ambos os estilos
                                resizeMode="contain"
                            />
                        </View>

                        <Text style={styles.welcomeSubtitle}>
                            {getWelcomeSubtitle()}
                        </Text>
                        <Text style={styles.stepIndicatorText}>{stepText}</Text>
                        <Text style={styles.microcopyText}>{microcopy}</Text>

                        {/* Step 1: Name + Email */}
                        {currentStep === 1 && (
                            <View style={styles.stepContent}>
                                <View style={[styles.inputWrapper, usernameError ? styles.inputWrapperError : {}]} onLayout={(e) => setUsernameInputY(e.nativeEvent.layout.y)}>
                                    <View style={styles.iconCircle}>
                                        <Ionicons name="person-outline" size={23} color="#00BCD4" />
                                    </View>
                                    <TextInput
                                        ref={usernameInputRef}
                                        style={styles.input}
                                        placeholder="Nome Completo"
                                        placeholderTextColor="#A0AEC0"
                                        value={username}
                                        onChangeText={(text) => { setUsername(text); setUsernameError(null); }}
                                        onBlur={handleUsernameBlur}
                                        autoCapitalize="words"
                                        textContentType="name"
                                        autoComplete="name"
                                    />
                                </View>
                                <AnimatedErrorMessage message={usernameError} isVisible={!!usernameError} centered={false} />

                                <View style={[styles.inputWrapper, emailError ? styles.inputWrapperError : {}]} onLayout={(e) => setEmailInputY(e.nativeEvent.layout.y)}>
                                    <View style={styles.iconCircle}>
                                        <Ionicons name="mail-outline" size={23} color="#00BCD4" />
                                    </View>
                                    <TextInput
                                        ref={emailInputRef}
                                        style={styles.input}
                                        placeholder="Email"
                                        placeholderTextColor="#A0AEC0"
                                        value={email}
                                        onChangeText={(text) => { setEmail(text); setEmailError(null); }}
                                        onBlur={handleEmailBlur}
                                        keyboardType="email-address"
                                        autoCapitalize="none"
                                        textContentType="emailAddress"
                                        autoComplete="email"
                                    />
                                </View>
                                <AnimatedErrorMessage message={emailError} isVisible={!!emailError} centered={false} />

                                <AnimatedErrorMessage message={generalError} isVisible={!!generalError} centered={true} />

                                {/* Navigation Buttons for Step 1 */}
                                <View style={styles.navigationButtons}>
                                    <TouchableOpacity style={[styles.navButton, styles.backButton]} onPress={handleBack}>
                                        <Ionicons name="arrow-back-outline" size={18} color="#00BCD4" />
                                        <Text style={styles.navButtonTextBack}>Voltar</Text>
                                    </TouchableOpacity>
                                    <TouchableOpacity
                                        style={[styles.navButton, styles.finalButton, (isLoading || !isNextButtonEnabledStep1) && styles.buttonDisabled]}
                                        onPress={handleNext}
                                        disabled={isLoading || !isNextButtonEnabledStep1}
                                    >
                                        <Text style={styles.navButtonTextNext}>Avançar</Text>
                                        <Ionicons name="arrow-forward-outline" size={20} color="#fff" />
                                    </TouchableOpacity>
                                </View>
                            </View>
                        )}

                        {/* Step 2: Phone + CPF */}
                        {currentStep === 2 && (
                            <View style={styles.stepContent}>
                                <View style={[styles.inputWrapper, phoneError ? styles.inputWrapperError : {}]} onLayout={(e) => setPhoneInputY(e.nativeEvent.layout.y)}>
                                    <View style={styles.iconCircle}>
                                        <Ionicons name="call-outline" size={23} color="#00BCD4" />
                                    </View>
                                    <TextInput
                                        ref={phoneInputRef}
                                        style={styles.input}
                                        placeholder="Telefone (DDD + Número)"
                                        placeholderTextColor="#A0AEC0"
                                        value={phone}
                                        onChangeText={(text) => { setPhone(formatPhoneNumber(text)); setPhoneError(null); }}
                                        onBlur={handlePhoneBlur}
                                        keyboardType="phone-pad"
                                        maxLength={15}
                                    />
                                </View>
                                <AnimatedErrorMessage message={phoneError} isVisible={!!phoneError} centered={false} />

                                <View style={[styles.inputWrapper, cpfError ? styles.inputWrapperError : {}]} onLayout={(e) => setCpfInputY(e.nativeEvent.layout.y)}>
                                    <View style={styles.iconCircle}>
                                        <Ionicons name="card-outline" size={23} color="#00BCD4" />
                                    </View>
                                    <TextInput
                                        ref={cpfInputRef}
                                        style={styles.input}
                                        placeholder="CPF (apenas números)"
                                        placeholderTextColor="#A0AEC0"
                                        value={cpf}
                                        onChangeText={(text) => { setCpf(formatCpf(text)); setCpfError(null); }}
                                        onBlur={handleCpfBlur}
                                        keyboardType="numeric"
                                        maxLength={14}
                                    />
                                </View>
                                <AnimatedErrorMessage message={cpfError} isVisible={!!cpfError} centered={false} />

                                <AnimatedErrorMessage message={generalError} isVisible={!!generalError} centered={true} />

                                {/* Navigation Buttons for Step 2 */}
                                <View style={styles.navigationButtons}>
                                    <TouchableOpacity style={[styles.navButton, styles.backButton]} onPress={handleBack}>
                                        <Ionicons name="arrow-back-outline" size={20} color="#00BCD4" />
                                        <Text style={styles.navButtonTextBack}>Voltar</Text>
                                    </TouchableOpacity>
                                    <TouchableOpacity
                                        style={[styles.navButton, styles.finalButton, (isLoading || !isNextButtonEnabledStep2) && styles.buttonDisabled]}
                                        onPress={handleNext}
                                        disabled={isLoading || !isNextButtonEnabledStep2}
                                    >
                                        <Text style={styles.navButtonTextNext}>Avançar</Text>
                                        <Ionicons name="arrow-forward-outline" size={20} color="#fff" />
                                    </TouchableOpacity>
                                </View>
                            </View>
                        )}

                        {/* Step 3: DateOfBirth + Password */}
                        {currentStep === 3 && (
                            <View style={styles.stepContent}>
                                <View style={[styles.inputWrapper, dateOfBirthError ? styles.inputWrapperError : {}]}>
                                    <View style={styles.iconCircle}>
                                        <Ionicons name="calendar-outline" size={23} color="#00BCD4" />
                                    </View>
                                    <TextInput
                                        style={styles.input}
                                        placeholder="Data de Nascimento (DD/MM/AAAA)"
                                        placeholderTextColor="#A0AEC0"
                                        value={dateOfBirth}
                                        onChangeText={(text) => { setDateOfBirth(formatDateForDisplay(text)); setDateOfBirthError(null); }}
                                        onBlur={handleDateOfBirthBlur}
                                        keyboardType="numeric"
                                        maxLength={10}
                                    />
                                </View>
                                <AnimatedErrorMessage message={dateOfBirthError} isVisible={!!dateOfBirthError} centered={false} />

                                <View style={[styles.inputWrapper, passwordError ? styles.inputWrapperError : {}]} onLayout={(e) => setPasswordInputY(e.nativeEvent.layout.y)}>
                                    <View style={styles.iconCircle}>
                                        <Ionicons name="lock-closed-outline" size={23} color="#00BCD4" />
                                    </View>
                                    <TextInput
                                        ref={passwordInputRef}
                                        style={styles.input}
                                        placeholder="Senha (mínimo 6 caracteres)"
                                        placeholderTextColor="#A0AEC0"
                                        value={password}
                                        onChangeText={(text) => { setPassword(text); setPasswordError(null); }}
                                        onBlur={handlePasswordBlur}
                                        secureTextEntry={!showPassword}
                                        textContentType="password"
                                    />
                                    <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={styles.eyeIconTouchable}>
                                        <Ionicons name={showPassword ? "eye-off-outline" : "eye-outline"} size={22} color="#A0AEC0" />
                                    </TouchableOpacity>
                                </View>
                                <AnimatedErrorMessage message={passwordError} isVisible={!!passwordError} centered={false} />

                                <AnimatedErrorMessage message={generalError} isVisible={!!generalError} centered={true} />

                                {/* Navigation Buttons for Step 3 */}
                                <View style={styles.navigationButtons}>
                                    <TouchableOpacity style={[styles.navButton, styles.backButton]} onPress={handleBack}>
                                        <Ionicons name="arrow-back-outline" size={20} color="#00BCD4" />
                                        <Text style={styles.navButtonTextBack}>Voltar</Text>
                                    </TouchableOpacity>
                                    <TouchableOpacity
                                        style={[styles.navButton, styles.finalButton, (isLoading || !isNextButtonEnabledStep3) && styles.buttonDisabled]}
                                        onPress={handleNext}
                                        disabled={isLoading || !isNextButtonEnabledStep3}
                                    >
                                        {isLoading ? (
                                            <ActivityIndicator color="#FFFFFF" />
                                        ) : (
                                            <>
                                                <Text style={styles.navButtonTextNext}>Avançar</Text>
                                                <Ionicons name="arrow-forward-outline" size={20} color="#fff" />
                                            </>
                                        )}
                                    </TouchableOpacity>
                                </View>
                            </View>
                        )}

                        {/* Step 4: Referral Code (opcional, 1 input) */}
                        {currentStep === 4 && (
                            <View style={styles.stepContent}>
                                <View style={styles.inputWrapper}>
                                    <View style={styles.iconCircle}>
                                        <Ionicons name="gift-outline" size={23} color="#00BCD4" />
                                    </View>
                                    <TextInput
                                        style={styles.input}
                                        placeholder="Código de indicação (opcional)"
                                        placeholderTextColor="#A0AEC0"
                                        value={referralCode}
                                        onChangeText={(text) => { setReferralCode(text); referralChangeHandler(text); }}
                                        onBlur={handleReferralBlur}
                                        autoCapitalize="characters"
                                        autoCorrect={false}
                                    />
                                </View>

                                <AnimatedErrorMessage message={generalError} isVisible={!!generalError} centered={true} />

                                {/* Navigation Buttons for Step 4 */}
                                <View style={styles.navigationButtons}>
                                    <TouchableOpacity style={[styles.navButton, styles.backButton]} onPress={handleBack}>
                                        <Ionicons name="arrow-back-outline" size={20} color="#00BCD4" />
                                        <Text style={styles.navButtonTextBack}>Voltar</Text>
                                    </TouchableOpacity>
                                    <TouchableOpacity
                                        style={[styles.navButton, styles.finalButton, (isLoading || !isNextButtonEnabledStep4) && styles.buttonDisabled]}
                                        onPress={handleNext}
                                        disabled={isLoading || !isNextButtonEnabledStep4}
                                    >
                                        <Text style={styles.navButtonTextNext}>Avançar</Text>
                                        <Ionicons name="arrow-forward-outline" size={20} color="#fff" />
                                    </TouchableOpacity>
                                </View>
                            </View>
                        )}

                        {/* Step 5: Endereço (Sub-steps) */}
                        {currentStep === 5 && (
                            <View style={styles.stepContent}>
                                {/* Sub-step 1: CEP */}
                                {subStepAddress === 1 && (
                                    <View style={styles.subStepContainer}>
                                        <View style={[styles.inputWrapper, cepInputError ? styles.inputWrapperError : {}]} onLayout={(e) => setCepInputY(e.nativeEvent.layout.y)}>
                                            <View style={styles.iconCircle}>
                                                <Ionicons name="map-outline" size={23} color="#00BCD4" />
                                            </View>
                                            <TextInput
                                                ref={cepInputRef}
                                                style={styles.input}
                                                placeholder="CEP (apenas números)"
                                                placeholderTextColor="#A0AEC0"
                                                value={cep}
                                                onChangeText={(text) => {
                                                    setCep(text.replace(/\D/g, ''));
                                                    setCepInputError(null);
                                                    setGeneralError(null);
                                                    if (text.replace(/\D/g, '').length < 8) {
                                                        setStreet(''); setNumber(''); setNeighborhood(''); setCity(''); setState(''); setComplement('');
                                                    }
                                                }}
                                                onBlur={handleCepBlur}
                                                keyboardType="numeric"
                                                maxLength={8}
                                            />
                                            {cepLoading && <ActivityIndicator size="small" color="#00BCD4" style={{ marginLeft: 10 }} />}
                                        </View>
                                        <AnimatedErrorMessage message={cepInputError} isVisible={!!cepInputError} centered={false} />
                                        <AnimatedErrorMessage message={generalError} isVisible={!!generalError} centered={true} />
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
                                    <View style={styles.subStepContainer}>
                                        <View style={[styles.inputWrapper, streetError ? styles.inputWrapperError : {}]} onLayout={(e) => setStreetInputY(e.nativeEvent.layout.y)}>
                                            <View style={styles.iconCircle}>
                                                <Ionicons name="navigate-outline" size={23} color="#00BCD4" />
                                            </View>
                                            <TextInput
                                                ref={streetInputRef}
                                                style={styles.input}
                                                placeholder="Rua"
                                                placeholderTextColor="#A0AEC0"
                                                value={street}
                                                onChangeText={(text) => { setStreet(text); setStreetError(null); }}
                                                onBlur={handleStreetBlur}
                                                autoCapitalize="words"
                                                editable={!cepLoading}
                                            />
                                        </View>
                                        <AnimatedErrorMessage message={streetError} isVisible={!!streetError} centered={false} />

                                        <View style={[styles.inputWrapper, numberError ? styles.inputWrapperError : {}]} onLayout={(e) => setNumberInputY(e.nativeEvent.layout.y)}>
                                            <View style={styles.iconCircle}>
                                                <Ionicons name="home-outline" size={23} color="#00BCD4" />
                                            </View>
                                            <TextInput
                                                ref={numberInputRef}
                                                style={styles.input}
                                                placeholder="Número"
                                                placeholderTextColor="#A0AEC0"
                                                value={number}
                                                onChangeText={(text) => { setNumber(text); setNumberError(null); }}
                                                onBlur={handleNumberBlur}
                                                keyboardType="numeric"
                                            />
                                        </View>
                                        <AnimatedErrorMessage message={numberError} isVisible={!!numberError} centered={false} />

                                        <View style={[styles.inputWrapper, neighborhoodError ? styles.inputWrapperError : {}]} onLayout={(e) => setNeighborhoodInputY(e.nativeEvent.layout.y)}>
                                            <View style={styles.iconCircle}>
                                                <Ionicons name="business-outline" size={23} color="#00BCD4" />
                                            </View>
                                            <TextInput
                                                ref={neighborhoodInputRef}
                                                style={styles.input}
                                                placeholder="Bairro"
                                                placeholderTextColor="#A0AEC0"
                                                value={neighborhood}
                                                onChangeText={(text) => { setNeighborhood(text); setNeighborhoodError(null); }}
                                                onBlur={handleNeighborhoodBlur}
                                                autoCapitalize="words"
                                                editable={!cepLoading}
                                            />
                                        </View>
                                        <AnimatedErrorMessage message={neighborhoodError} isVisible={!!neighborhoodError} centered={false} />

                                        <View style={[styles.inputWrapper, cityError ? styles.inputWrapperError : {}]} onLayout={(e) => setCityInputY(e.nativeEvent.layout.y)}>
                                            <View style={styles.iconCircle}>
                                                <Ionicons name="location-outline" size={23} color="#00BCD4" />
                                            </View>
                                            <TextInput
                                                ref={cityInputRef}
                                                style={styles.input}
                                                placeholder="Cidade"
                                                placeholderTextColor="#A0AEC0"
                                                value={city}
                                                onChangeText={(text) => { setCity(text); setCityError(null); }}
                                                onBlur={handleCityBlur}
                                                autoCapitalize="words"
                                                editable={!cepLoading}
                                            />
                                        </View>
                                        <AnimatedErrorMessage message={cityError} isVisible={!!cityError} centered={false} />

                                        <View style={[styles.inputWrapper, stateError ? styles.inputWrapperError : {}]} onLayout={(e) => setStateInputY(e.nativeEvent.layout.y)}>
                                            <View style={styles.iconCircle}>
                                                <Ionicons name="location-outline" size={23} color="#00BCD4" />
                                            </View>
                                            <TextInput
                                                ref={stateInputRef}
                                                style={styles.input}
                                                placeholder="Estado (UF)"
                                                placeholderTextColor="#A0AEC0"
                                                value={state}
                                                onChangeText={(text) => { setState(text); setStateError(null); }}
                                                onBlur={handleStateBlur}
                                                autoCapitalize="characters"
                                                maxLength={2}
                                                editable={!cepLoading}
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
                                                style={[styles.navButton, styles.finalButton, (isLoading || !isNextButtonEnabledAddressSubStep2) && styles.buttonDisabled]}
                                                onPress={handleNext}
                                                disabled={isLoading || !isNextButtonEnabledAddressSubStep2}
                                            >
                                                <Text style={styles.navButtonTextNext}>Próximo</Text>
                                                <Ionicons name="arrow-forward-outline" size={20} color="#fff" />
                                            </TouchableOpacity>
                                        </View>
                                    </View>
                                )}

                                {/* Sub-step 3: Complemento (Opcional) */}
                                {subStepAddress === 3 && (
                                    <View style={styles.subStepContainer}>
                                        <View style={styles.inputWrapper}>
                                            <View style={styles.iconCircle}>
                                                <Ionicons name="information-circle-outline" size={23} color="#00BCD4" />
                                            </View>
                                            <TextInput
                                                style={styles.input}
                                                placeholder="Complemento (opcional, ex: Apt 101, Bloco B)"
                                                placeholderTextColor="#A0AEC0"
                                                value={complement}
                                                onChangeText={(text) => { setComplement(text); setComplementError(null); }}
                                                onBlur={handleComplementBlur}
                                                autoCapitalize="sentences"
                                                editable={!cepLoading}
                                            />
                                        </View>
                                        <AnimatedErrorMessage message={complementError} isVisible={!!complementError} centered={false} />

                                        <AnimatedErrorMessage message={generalError} isVisible={!!generalError} centered={true} />
                                        <View style={styles.navigationButtons}>
                                            <TouchableOpacity style={[styles.navButton, styles.backButton]} onPress={handleBack}>
                                                <Ionicons name="arrow-back-outline" size={20} color="#00BCD4" />
                                                <Text style={styles.navButtonTextBack}>Voltar</Text>
                                            </TouchableOpacity>
                                            <TouchableOpacity
                                                style={[styles.navButton, styles.finalButton, (isLoading || !isNextButtonEnabledAddressSubStep3) && styles.buttonDisabled]}
                                                onPress={handleNext}
                                                disabled={isLoading || !isNextButtonEnabledAddressSubStep3}
                                            >
                                                {isLoading ? (
                                                    <ActivityIndicator color="#FFFFFF" />
                                                ) : (
                                                    <>
                                                        <Text style={styles.navButtonTextNext}>Finalizar</Text>
                                                        <Ionicons name="arrow-forward-outline" size={20} color="#fff" />
                                                    </>
                                                )}
                                            </TouchableOpacity>
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
        backgroundColor: 'transparent',
    },
    keyboardAvoidingContainer: {
        flex: 1,
    },
    scrollView: {
        flex: 1,
        backgroundColor: 'transparent', // alterado para transparente conforme pedido
    },
    scrollContentContainer: {
        flexGrow: 1,
        justifyContent: 'center', // Centraliza verticalmente o conteúdo todo
        alignItems: 'center',
        paddingBottom: 60,
        paddingTop: 20,
    },
    contentWrapper: {
        flex: 1,
        width: '100%',
        maxWidth: 380, // Ajustado para centralização perfeita em telas médias
        paddingHorizontal: 40, // Padding menor para centro exato
        paddingTop: Platform.OS === 'ios' ? 20 : 15,
        alignItems: 'center',
        bottom: 80,
    },
    stepContent: {
        width: '100%',
        alignItems: 'center', // Força centralização dos inputs
    },
    subStepContainer: {
        width: '100%',
        alignItems: 'center', // Centraliza sub-steps
    },
    logoContainer: {
        alignItems: 'center',
        marginBottom: 20, // Logo mais próxima
        top: 110,
        right: 10,
    },
    logo: {
        width: 180,
        height: 250,
        resizeMode: 'contain',
        shadowColor: '#8ca3ac98',
        shadowRadius: 12,
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.8,
    },
    welcomeSubtitle: {
        fontSize: 16,
        color: '#8A94A6',
        textAlign: 'center',
        marginBottom: 8,
        bottom: 0,
        fontWeight: '500',
        width: '100%',
    },
    stepIndicatorText: {
        fontSize: 22,
        fontWeight: 'bold',
        color: '#1C3A5F',
        textAlign: 'center',
        marginBottom: 8,
        width: '100%',
    },
    microcopyText: {
        fontSize: 14,
        color: '#6C757D',
        textAlign: 'center',
        marginBottom: 30,
        paddingHorizontal: 20,
        lineHeight: 20,
        width: '100%',
    },
    inputWrapper: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#FFFFFF',
        borderRadius: 28,
        height: 45,
        bottom: 10,
        marginBottom: 10, // Espaço mínimo para o erro ficar colado abaixo
        shadowColor: 'rgba(100, 100, 150, 0.15)',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 12,
        elevation: 4,
        paddingHorizontal: 0,
        borderWidth: 1,
        borderColor: 'transparent',
        width: '100%',
    },
    inputWrapperError: {
        borderColor: '#f85c5c46',
        borderWidth: 2,
        backgroundColor: '#FFF5F5',
    },
    iconCircle: {
        width: 45,
        height: 45,
        right: 3,
        borderRadius: 80,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#F0F8FF',
        marginRight: 12,
        shadowColor: '#00BCD4',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 4,
        elevation: 3,
    },
    input: {
        flex: 1,
        fontSize: 14,
        color: '#2D3748',
        paddingVertical: 0,
        paddingHorizontal: 0,
    },
    eyeIconTouchable: {
        paddingHorizontal: 8,
        height: '100%',
        justifyContent: 'center',
    },
    navigationButtons: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        width: '100%',
        marginTop: 32,
        marginBottom: 20,
    },
    navButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 14,
        paddingHorizontal: 24,
        borderRadius: 28,
        minWidth: 120,
        bottom: 20,
        flex: 1,
        marginHorizontal: 8,
    },
    backButton: {
        backgroundColor: '#F7F8FC',
        borderWidth: 1,
        borderColor: '#00BCD4',
    },
    finalButton: {
        backgroundColor: '#40C0F0',
        shadowColor: '#00BCD4',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 6,
    },
    navButtonTextBack: {
        color: '#00BCD4',
        fontSize: 16,
        fontWeight: '600',
        marginLeft: 6,
    },
    navButtonTextNext: {
        color: '#FFFFFF',
        fontSize: 16,
        fontWeight: '600',
        marginRight: 6,
    },
    buttonDisabled: {
        backgroundColor: '#A0CFFF',
        elevation: 0,
        shadowOpacity: 0,
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
        marginBottom: 24,
        marginTop: 8,
        width: '100%',
    }
});
