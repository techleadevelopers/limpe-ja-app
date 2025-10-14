import { Ionicons } from '@expo/vector-icons';
import { Stack, useRouter } from 'expo-router';
import React, { useCallback, useEffect, useRef, useState, useMemo } from 'react';
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
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuth } from '../../../contexts/AuthContext';
import { useProviderRegistration } from '../../../contexts/ProviderRegistrationContext';
import { RegisterProviderDto } from '../../../types/backend/auth';

import { AnimatedErrorMessage } from '../../../components/auth/components/AnimatedErrorMessage';
import * as Location from 'expo-location';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { SafeAreaView } from 'react-native-safe-area-context';

import AnimatedReanimated, {
  Easing,
  Extrapolate,
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';

const LOGO_IMAGE = require('../../../assets/images/logo2.png');

const SCREEN_WIDTH = Dimensions.get('window').width;
const SCREEN_HEIGHT = Dimensions.get('window').height;

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
  // Geocode helpers: cache + in-flight guard
  const geocodeCache = useRef(new Map<string, { latitude: number; longitude: number }>()).current;
  const isGeocodingRef = useRef(false);

  const router = useRouter();
  const { signUpProvider, setIsRegistrationInProgress } = useAuth();
  const { setPersonalDetails: setContextPersonalDetails } = useProviderRegistration();

  const mainElementsOpacity = useRef(new Animated.Value(0)).current;
  const mainElementsTranslateY = useRef(new Animated.Value(18)).current;

  // Logo animation shared values (same as login)
  const logoRotateY = useSharedValue(0);
  const logoPulseScale = useSharedValue(1);
  const logoGlow = useSharedValue(0);
  const logoFloatY = useSharedValue(0);

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
    setCepInputError(null);
    setAddressError(null);

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
          // Removida a mensagem de carregamento para não exibir o erro vermelho
          console.log("Provider form data loaded from AsyncStorage.");
        }
      } catch (e) {
        console.error("Failed to load provider form data from AsyncStorage", e);
      }
    };
    loadFormData();
  }, []);

  // Automatic and robust CEP fetching: Trigger when exactly 8 digits are entered (debounced for robustness)
  useEffect(() => {
    const cleanedCep = cep.replace(/\D/g, '');
    if (cleanedCep.length === 8 && !cepLoading) {
      // Debounce to avoid rapid API calls
      const timer = setTimeout(() => {
        fetchAddressByCep(cep);
      }, 500);
      return () => clearTimeout(timer);
    } else if (cleanedCep.length > 0 && cleanedCep.length !== 8) {
      // Clear fields if CEP is invalid/incomplete for robustness
      setStreet(''); setNumber(''); setNeighborhood(''); setCity(''); setState('');
      setCepInputError(cleanedCep.length < 8 ? "CEP incompleto. Digite os 8 dígitos." : null);
      setAddressError(null);
    } else if (cleanedCep.length === 0) {
      // Clear on empty
      setStreet(''); setNumber(''); setNeighborhood(''); setCity(''); setState('');
      setCepInputError(null);
      setAddressError(null);
    }
  }, [cep, cepLoading]);

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

  const handleNext = async () => {
    console.log(`[RegisterProvider] handleNext: Tentando avançar do Step ${currentStep}. SubStep: ${subStepAddress}`);
    setGeneralError(null);
    setAddressError(null);
    // Simple guard to avoid double-taps triggering multiple geocode calls
    if (isLoading) {
      return;
    }

    if (currentStep === 1) { // Step 1: Username + Email
      const isValid = checkStep1Validity();
      if (!isValid) {
        handleUsernameBlur();
        handleEmailBlur();
        setGeneralError('Por favor, preencha nome e e-mail corretamente.');
        console.warn("[RegisterProvider] handleNext: Falha ao avançar: Step 1 inválido.");
        return;
      }
      setCurrentStep(2);
      console.log("[RegisterProvider] handleNext: Avançando para o Step 2 (Telefone + CPF).");
    } else if (currentStep === 2) { // Step 2: Phone + CPF
      const isValid = checkStep2Validity();
      if (!isValid) {
        handlePhoneBlur();
        handleCpfBlur();
        setGeneralError('Por favor, preencha telefone e CPF corretamente.');
        console.warn("[RegisterProvider] handleNext: Falha ao avançar: Step 2 inválido.");
        return;
      }
      setCurrentStep(3);
      console.log("[RegisterProvider] handleNext: Avançando para o Step 3 (Data + Senha).");
    } else if (currentStep === 3) { // Step 3: DateOfBirth + Password
      const isValid = checkStep3Validity();
      if (!isValid) {
        handleDateOfBirthBlur();
        handlePasswordBlur();
        setGeneralError('Por favor, preencha data de nascimento e senha corretamente.');
        console.warn("[RegisterProvider] handleNext: Falha ao avançar: Step 3 inválido.");
        return;
      }
      setCurrentStep(4); // New Step 4 for Address
      setSubStepAddress(1);
      console.log("[RegisterProvider] handleNext: Avançando para o Step 4 (Endereço).");
    } else if (currentStep === 4) { // Step 4: Address
      if (subStepAddress === 1) {
        const isValid = checkAddressSubStep1Validity();
        if (!isValid) {
          handleCepBlur();
          setAddressError("CEP inválido. Digite os 8 dígitos.");
          console.warn("[RegisterProvider] handleNext: Falha ao avançar: Sub-step 1 (CEP) inválido.");
          return;
        }
        if (cepLoading) {
          setAddressError('Aguarde a busca do CEP ser concluída.');
          return;
        }
        setSubStepAddress(2);
        console.log("[RegisterProvider] handleNext: Avançando para o Sub-step 2 (Detalhes do Endereço).");
      } else if (subStepAddress === 2) {
        const isValid = checkAddressSubStep2Validity();
        if (!isValid) {
          handleStreetBlur();
          handleNumberBlur();
          handleNeighborhoodBlur();
          handleCityBlur();
          handleStateBlur();
          setAddressError('Por favor, preencha todos os campos de endereço corretamente.');
          console.warn("[RegisterProvider] handleNext: Falha ao avançar: Sub-step 2 (Detalhes do Endereço) inválido.");
          return;
        }
        setIsLoading(true);
        try {
          let { status } = await Location.requestForegroundPermissionsAsync();
          if (status !== 'granted') {
            setAddressError('A permissão para acessar a localização foi negada. Por favor, habilite-a nas configurações do seu dispositivo.');
            setIsLoading(false);
            return;
          }

          const fullAddress = `${street.trim()}, ${number.trim()}, ${neighborhood.trim()}, ${city.trim()}, ${state.trim()}, ${cep.trim()}`;
          console.log("[RegisterProvider] Geocodificando endereço:", fullAddress);

          // Geocode with cache + bounded retries (rate-limit safe)
          const geocodeWithBackoff = async (address: string): Promise<{ latitude: number; longitude: number }> => {
            if (geocodeCache.has(address)) {
              const cached = geocodeCache.get(address)!;
              console.log('[RegisterProvider] Geocode cache hit:', cached);
              return cached;
            }
            if (isGeocodingRef.current) {
              // Wait briefly if another call is in-flight to avoid burst
              await new Promise(r => setTimeout(r, 400));
              if (geocodeCache.has(address)) return geocodeCache.get(address)!;
            }
            isGeocodingRef.current = true;
            let lastErr: any = null;
            for (let attempt = 1; attempt <= 3; attempt++) {
              try {
                const res = await Location.geocodeAsync(address);
                if (res && res.length > 0) {
                  const coords = { latitude: res[0].latitude, longitude: res[0].longitude };
                  geocodeCache.set(address, coords);
                  isGeocodingRef.current = false;
                  return coords;
                }
                lastErr = new Error('No results from geocoder');
              } catch (e: any) {
                lastErr = e;
                const msg = (e?.message || '').toLowerCase();
                const isRate = msg.includes('rate limit') || msg.includes('too many');
                const delay = isRate ? 1200 * attempt : 400 * attempt;
                console.warn(`[RegisterProvider] Geocode attempt ${attempt} failed:`, e?.message || e);
                await new Promise(r => setTimeout(r, delay));
              }
            }
            isGeocodingRef.current = false;
            throw lastErr ?? new Error('Geocoding failed');
          };

          const { latitude, longitude } = await geocodeWithBackoff(fullAddress);
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
          console.log("[RegisterProvider] handleNext (Step 4 - final sub-step): Chamando signUpProvider do AuthContext para registro inicial.");
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
          console.log("[RegisterProvider] handleNext (Step 4 - final sub-step): signUpProvider do AuthContext retornou sucesso. Redirecionando para Detalhes do Serviço.");
          // Clear AsyncStorage after successful registration
          await AsyncStorage.removeItem('providerRegisterFormData');
          router.replace('/(auth)/provider-register/service-details');
        } catch (error: any) {
          console.error("[RegisterProvider] handleNext (Step 4 - final sub-step): Erro durante o registro inicial:", error.message, error);
          const msg = (error?.message || '').toLowerCase();
          const isRate = msg.includes('rate limit') || msg.includes('too many');
          if (isRate) {
            setAddressError('Geocodificação temporariamente indisponível por excesso de tentativas. Aguarde alguns segundos e toque em Finalizar novamente.');
          } else if (msg.includes('no results') || msg.includes('not find') || msg.includes('encontrar')) {
            setAddressError('Não foi possível encontrar as coordenadas para este endereço. Verifique os dados e tente novamente.');
          } else {
            setAddressError(error.message || 'Falha no registro inicial. Por favor, verifique o endereço e tente novamente.');
          }
        } finally {
          setIsLoading(false);
          console.log("[RegisterProvider] handleNext (Step 4 - final sub-step): isLoading definido como false.");
        }
      }
    }
    // Sutil delay para transição suave (premium feel)
    await new Promise(resolve => setTimeout(resolve, 150));
  };

  const handleBack = () => {
    setGeneralError(null);
    setAddressError(null);
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

    if (currentStep === 1) {
      // No Step 1, voltar para a tela anterior (ex: seleção de tipo de usuário)
      router.back();
    } else if (currentStep === 4) { // Address step
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
  const isNextButtonEnabledAddressSubStep1 = checkAddressSubStep1Validity() && !cepLoading;
  const isNextButtonEnabledAddressSubStep2 = checkAddressSubStep2Validity();

  // Helper for progress indicator and microcopy (updated for 4 steps)
  const getStepInfo = () => {
    let stepText = '';
    let microcopy = '';
    let totalSteps = 4;

    switch (currentStep) {
      case 1:
        stepText = `Dados Básicos`;
        microcopy = 'Vamos começar com seu nome e e-mail. É rápido!';
        break;
      case 2:
        stepText = ` Contato e Identidade`;
        microcopy = 'Agora, telefone e CPF para contato e verificação.';
        break;
      case 3:
        stepText = `Dados Pessoais`;
        microcopy = 'Data de nascimento e senha para segurança.';
        break;
      case 4:
        switch (subStepAddress) {
          case 1:
            stepText = ` Endereço (CEP)`;
            microcopy = 'Informe seu CEP e buscamos o endereço automaticamente.';
            break;
          case 2:
            stepText = `Endereço (Detalhes)`;
            microcopy = 'Confirme e complete os detalhes do seu endereço.';
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
                <View style={[styles.inputWrapper, usernameError ? styles.inputWrapperError : {}]}>
                  <View style={styles.iconCircle}>
                    <Ionicons name="person-outline" size={23} color="#00BCD4" />
                  </View>
                  <TextInput
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

                <View style={[styles.inputWrapper, emailError ? styles.inputWrapperError : {}]}>
                  <View style={styles.iconCircle}>
                    <Ionicons name="mail-outline" size={23} color="#00BCD4" />
                  </View>
                  <TextInput
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

                {/* Navigation Buttons for Step 1: Back + Next (agora com botão de voltar integrado) */}
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
                <View style={[styles.inputWrapper, phoneError ? styles.inputWrapperError : {}]}>
                  <View style={styles.iconCircle}>
                    <Ionicons name="call-outline" size={23} color="#00BCD4" />
                  </View>
                  <TextInput
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

                <View style={[styles.inputWrapper, cpfError ? styles.inputWrapperError : {}]}>
                  <View style={styles.iconCircle}>
                    <Ionicons name="card-outline" size={23} color="#00BCD4" />
                  </View>
                  <TextInput
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

                {/* Navigation Buttons for Step 2: Back + Next */}
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

                <View style={[styles.inputWrapper, passwordError ? styles.inputWrapperError : {}]}>
                  <View style={styles.iconCircle}>
                    <Ionicons name="lock-closed-outline" size={23} color="#00BCD4" />
                  </View>
                  <TextInput
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
                {/* Erro inline da senha fica EXATAMENTE abaixo do input */}
                <AnimatedErrorMessage message={passwordError} isVisible={!!passwordError} centered={false} />

                <AnimatedErrorMessage message={generalError} isVisible={!!generalError} centered={true} />

                {/* Navigation Buttons for Step 3: Back + Next */}
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

            {/* Step 4: Endereço (Sub-steps) */}
            {currentStep === 4 && (
              <View style={styles.stepContent}>
                {/* Sub-step 1: CEP */}
                {subStepAddress === 1 && (
                  <View style={styles.subStepContainer}>
                    <View style={[styles.inputWrapper, cepInputError ? styles.inputWrapperError : {}]}>
                      <View style={styles.iconCircle}>
                        <Ionicons name="map-outline" size={23} color="#00BCD4" />
                      </View>
                      <TextInput
                        style={styles.input}
                        placeholder="CEP (apenas números)"
                        placeholderTextColor="#A0AEC0"
                        value={cep}
                        onChangeText={(text) => {
                          setCep(text.replace(/\D/g, ''));
                          setCepInputError(null);
                          setAddressError(null);
                          // Removido o fetch manual aqui; agora é gerenciado pelo useEffect
                          if (text.replace(/\D/g, '').length < 8) {
                            setStreet('');
                            setNeighborhood('');
                            setCity('');
                            setState('');
                          }
                        }}
                        // Removido onBlur para depender da automação via useEffect
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
                  <View style={styles.subStepContainer}>
                    <View style={[styles.inputWrapper, streetError ? styles.inputWrapperError : {}]}>
                      <View style={styles.iconCircle}>
                        <Ionicons name="navigate-outline" size={23} color="#00BCD4" />
                      </View>
                      <TextInput
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

                    <View style={[styles.inputWrapper, numberError ? styles.inputWrapperError : {}]}>
                      <View style={styles.iconCircle}>
                        <Ionicons name="home-outline" size={23} color="#00BCD4" />
                      </View>
                      <TextInput
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

                    <View style={[styles.inputWrapper, neighborhoodError ? styles.inputWrapperError : {}]}>
                      <View style={styles.iconCircle}>
                        <Ionicons name="business-outline" size={23} color="#00BCD4" />
                      </View>
                      <TextInput
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

                    <View style={[styles.inputWrapper, cityError ? styles.inputWrapperError : {}]}>
                      <View style={styles.iconCircle}>
                        <Ionicons name="location-outline" size={23} color="#00BCD4" />
                      </View>
                      <TextInput
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

                    <View style={[styles.inputWrapper, stateError ? styles.inputWrapperError : {}]}>
                      <View style={styles.iconCircle}>
                        <Ionicons name="location-outline" size={23} color="#00BCD4" />
                      </View>
                      <TextInput
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
    top: 130,
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
    // bottom: 20, // REMOVIDO para alinhar com os steps anteriores
    backgroundColor: '#FFFFFF',
    borderRadius: 28,
    height: 45,
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