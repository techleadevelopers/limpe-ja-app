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

const LOGO_IMAGE = require('../../../assets/images/logo2.png');

const ErrorMessage: React.FC<{ message: string | null }> = ({ message }) => {
    if (!message) return null;
    return <Text style={styles.errorMessage}>{message}</Text>;
};

export default function RegisterProviderScreen() {
    const [currentStep, setCurrentStep] = useState(1);
    // NEW: Sub-step for address
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
    
    const [addressError, setAddressError] = useState<string | null>(null);
    const [generalError, setGeneralError] = useState<string | null>(null);

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
        if (cleanedCep.length !== 8) {
            setAddressError('CEP deve conter 8 dígitos.');
            setStreet('');
            setNeighborhood('');
            setCity('');
            setState('');
            return;
        }

        setCepLoading(true);
        setAddressError(null);
        try {
            const response = await fetch(`https://viacep.com.br/ws/${cleanedCep}/json/`);
            const data = await response.json();

            if (data.erro) {
                setAddressError('CEP não encontrado ou inválido.');
                setStreet('');
                setNeighborhood('');
                setCity('');
                setState('');
            } else {
                setStreet(data.logradouro || '');
                setNeighborhood(data.bairro || '');
                setCity(data.localidade || '');
                setState(data.uf || '');
                setAddressError(null);
            }
        } catch (error) {
            console.error("Erro ao buscar CEP:", error);
            setAddressError('Erro ao buscar CEP. Tente novamente.');
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

    useEffect(() => {
        // No animations related to old Step 4 here anymore
    }, [currentStep]); 

    // MODIFIED: Removed state setters from validation functions
    const pureValidateStep1 = useCallback(() => {
        if (!email.trim() || !username.trim() || !phone.trim()) {
            return false;
        }
        const emailRegex = /^[^\s@]+@[^\s@]+\.\S+$/;
        if (!emailRegex.test(email.trim())) {
            return false;
        }
        const cleanedPhone = phone.replace(/\D/g, '');
        if (cleanedPhone.length < 10 || cleanedPhone.length > 11) {
            return false;
        }
        return true;
    }, [email, username, phone]);

    // MODIFIED: Removed state setters from validation functions
    const pureValidateStep2 = useCallback(() => {
        if (!cpf.trim() || !dateOfBirth.trim() || !password.trim()) {
            return false;
        }
        const cleanedCpf = cpf.replace(/\D/g, '');
        if (cleanedCpf.length !== 11) {
            return false;
        }
        if (password.length < 6) {
            return false;
        }
        const dateRegex = /^\d{2}\/\d{2}\/\d{4}$/;
        if (!dateRegex.test(dateOfBirth)) {
            return false;
        }
        const [day, month, year] = dateOfBirth.split('/').map(Number);
        const dateObj = new Date(year, month - 1, day);
        if (dateObj.getDate() !== day || dateObj.getMonth() !== month - 1 || dateObj.getFullYear() !== year) {
            return false;
        }
        return true;
    }, [cpf, dateOfBirth, password]);

    // MODIFIED: Removed state setters from validation functions
    const validateAddressSubStep1 = useCallback(() => { 
        const cleanedCep = cep.replace(/\D/g, '');
        if (cleanedCep.length !== 8) {
            return false;
        }
        return true;
    }, [cep]);

    // MODIFIED: Removed state setters from validation functions
    const validateAddressSubStep2 = useCallback(() => { 
        if (!street.trim() || !number.trim() || !neighborhood.trim() || !city.trim() || !state.trim()) {
            return false;
        }
        if (state.trim().length !== 2 || !/^[A-Z]{2}$/i.test(state.trim())) {
            return false;
        }
        return true;
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

                    {currentStep === 1 && (
                        <View>
                            <View style={styles.inputWrapper}>
                                <View style={styles.iconCircle}>
                                    <Ionicons name="person-outline" size={20} color="#00BCD4" />
                                </View>
                                <TextInput
                                    style={styles.input}
                                    placeholder="Nome Completo / Nome de Usuário"
                                    placeholderTextColor="#A0AEC0"
                                    value={username}
                                    onChangeText={(text) => { setUsername(text); if (generalError) setGeneralError(null); }}
                                    autoCapitalize="words"
                                    textContentType="name"
                                    autoComplete="name"
                                />
                            </View>

                            <View style={styles.inputWrapper}>
                                <View style={styles.iconCircle}>
                                    <Ionicons name="mail-outline" size={20} color="#00BCD4" />
                                </View>
                                <TextInput
                                    style={styles.input}
                                    placeholder="Email"
                                    placeholderTextColor="#A0AEC0"
                                    value={email}
                                    onChangeText={(text) => { setEmail(text); if (generalError) setGeneralError(null); }}
                                    keyboardType="email-address"
                                    autoCapitalize="none"
                                    textContentType="emailAddress"
                                    autoComplete="email"
                                />
                            </View>

                            <View style={styles.inputWrapper}>
                                <View style={styles.iconCircle}>
                                    <Ionicons name="call-outline" size={20} color="#00BCD4" />
                                </View>
                                <TextInput
                                    style={styles.input}
                                    placeholder="Telefone"
                                    placeholderTextColor="#A0AEC0"
                                    value={phone}
                                    onChangeText={(text) => { setPhone(text); if (generalError) setGeneralError(null); }}
                                    keyboardType="phone-pad"
                                    maxLength={15}
                                />
                            </View>

                            <AnimatedErrorMessage message={generalError} isVisible={!!generalError} centered={true} />
                        </View>
                    )}

                    {currentStep === 2 && (
                        <View>
                            <View style={styles.inputWrapper}>
                                <View style={styles.iconCircle}>
                                    <Ionicons name="card-outline" size={20} color="#00BCD4" />
                                </View>
                                <TextInput
                                    style={styles.input}
                                    placeholder="CPF (apenas números)"
                                    placeholderTextColor="#A0AEC0"
                                    value={cpf}
                                    onChangeText={(text) => { setCpf(text); if (generalError) setGeneralError(null); }}
                                    keyboardType="numeric"
                                    maxLength={11}
                                />
                            </View>

                            <View style={styles.inputWrapper}>
                                <View style={styles.iconCircle}>
                                    <Ionicons name="calendar-outline" size={20} color="#00BCD4" />
                                </View>
                                <TextInput
                                    style={styles.input}
                                    placeholder="Data de Nascimento (DD/MM/AAAA)"
                                    placeholderTextColor="#A0AEC0"
                                    value={dateOfBirth}
                                    onChangeText={(text) => { setDateOfBirth(formatDateForDisplay(text)); if (generalError) setGeneralError(null); }}
                                    keyboardType="numeric"
                                    maxLength={10}
                                />
                            </View>

                            <View style={styles.inputWrapper}>
                                <View style={styles.iconCircle}>
                                    <Ionicons name="lock-closed-outline" size={20} color="#00BCD4" />
                                </View>
                                <TextInput
                                    style={styles.input}
                                    placeholder="Senha"
                                    placeholderTextColor="#A0AEC0"
                                    value={password}
                                    onChangeText={(text) => { setPassword(text); if (generalError) setGeneralError(null); }}
                                    secureTextEntry={!showPassword}
                                    textContentType="password"
                                />
                                <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={styles.eyeIconTouchable}>
                                    <Ionicons name={showPassword ? "eye-off-outline" : "eye-outline"} size={22} color="#A0AEC0" />
                                </TouchableOpacity>
                            </View>

                            <AnimatedErrorMessage message={generalError} isVisible={!!generalError} centered={true} />
                        </View>
                    )}

                    {currentStep === 3 && (
                        <View>
                            {/* Sub-step 1: CEP */}
                            {subStepAddress === 1 && (
                                <View>
                                    <Text style={styles.subStepTitle}>1. Informe seu CEP</Text>
                                    <View style={styles.inputWrapper}>
                                        <View style={styles.iconCircle}>
                                            <Ionicons name="map-outline" size={20} color="#00BCD4" />
                                        </View>
                                        <TextInput
                                            style={styles.input}
                                            placeholder="CEP"
                                            placeholderTextColor="#A0AEC0"
                                            value={cep}
                                            onChangeText={(text) => {
                                                setCep(text);
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
                                            keyboardType="numeric"
                                            maxLength={8}
                                        />
                                        {cepLoading && <ActivityIndicator size="small" color="#00BCD4" style={{ marginLeft: 10 }} />}
                                    </View>
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
                                    <View style={styles.inputWrapper}>
                                        <View style={styles.iconCircle}>
                                            <Ionicons name="navigate-outline" size={20} color="#00BCD4" />
                                        </View>
                                        <TextInput
                                            style={styles.input}
                                            placeholder="Rua"
                                            placeholderTextColor="#A0AEC0"
                                            value={street}
                                            onChangeText={(text) => { setStreet(text); if (addressError) setAddressError(null); }}
                                            autoCapitalize="words"
                                            editable={!cepLoading}
                                        />
                                    </View>

                                    <View style={styles.inputWrapper}>
                                        <View style={styles.iconCircle}>
                                            <Ionicons name="home-outline" size={20} color="#00BCD4" />
                                        </View>
                                        <TextInput
                                            style={styles.input}
                                            placeholder="Número"
                                            placeholderTextColor="#A0AEC0"
                                            value={number}
                                            onChangeText={(text) => { setNumber(text); if (addressError) setAddressError(null); }}
                                            keyboardType="numeric"
                                        />
                                    </View>

                                    <View style={styles.inputWrapper}>
                                        <View style={styles.iconCircle}>
                                            <Ionicons name="business-outline" size={20} color="#00BCD4" />
                                        </View>
                                        <TextInput
                                            style={styles.input}
                                            placeholder="Bairro"
                                            placeholderTextColor="#A0AEC0"
                                            value={neighborhood}
                                            onChangeText={(text) => { setNeighborhood(text); if (addressError) setAddressError(null); }}
                                            autoCapitalize="words"
                                            editable={!cepLoading}
                                        />
                                    </View>

                                    <View style={styles.inputWrapper}>
                                        <View style={styles.iconCircle}>
                                            <Ionicons name="location-outline" size={20} color="#00BCD4" />
                                        </View>
                                        <TextInput
                                            style={styles.input}
                                            placeholder="Cidade"
                                            placeholderTextColor="#A0AEC0"
                                            value={city}
                                            onChangeText={(text) => { setCity(text); if (addressError) setAddressError(null); }}
                                            autoCapitalize="words"
                                            editable={!cepLoading}
                                        />
                                    </View>

                                    <View style={styles.inputWrapper}>
                                        <View style={styles.iconCircle}>
                                            <Ionicons name="location-outline" size={20} color="#00BCD4" />
                                        </View>
                                        <TextInput
                                            style={styles.input}
                                            placeholder="Estado (UF)"
                                            placeholderTextColor="#A0AEC0"
                                            value={state}
                                            onChangeText={(text) => { setState(text); if (addressError) setAddressError(null); }}
                                            autoCapitalize="characters"
                                            maxLength={2}
                                            editable={!cepLoading}
                                        />
                                    </View>

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
    welcomeTitle: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#1D2029',
        textAlign: 'center',
        marginBottom: 6,
    },
    welcomeSubtitle: {
        fontSize: 15,
        color: '#8A94A6',
        textAlign: 'center',
        marginBottom: 30,
        bottom: 140,
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
    signUpButton: {
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
    signUpButtonText: {
        color: '#FFFFFF',
        fontSize: 15,
        fontWeight: '600',
    },
    sectionTitle: {
        fontSize: 22,
        fontWeight: 'bold',
        color: '#1D2029',
        textAlign: 'center',
        marginBottom: 10,
        marginTop: 20,
    },
    sectionSubtitle: {
        fontSize: 15,
        color: '#8A94A6',
        textAlign: 'center',
        marginBottom: 30,
    },
    formSection: {
    },
    label: {
        fontSize: 12,
        fontWeight: '600',
        color: '#495057',
        marginBottom: 7,
        marginTop: 12,
    },
    inputIcon: {
        marginRight: 10,
        color: '#00BCD4',
    },
    inputWrapperServiceDetails: {
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
    inputServiceDetails: {
        flex: 1,
        fontSize: 15,
        color: '#2D3748',
        height: '100%',
        paddingVertical: 0,
    },
    textAreaInputServiceDetails: {
        height: 100,
        paddingTop: 15,
        minHeight: 100,
    },
    errorMessage: {
        color: '#D32F2F',
        fontSize: 12,
        marginTop: -8,
        marginBottom: 10,
        marginLeft: 5,
    },
    avatarPicker: {
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
    avatarImage: {
        width: '100%',
        height: '100%',
    },
    avatarPlaceholder: {
        width: '100%',
        height: '100%',
        justifyContent: 'center',
        alignItems: 'center',
    },
    avatarPlaceholderText: {
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
    nextButtonDisabled: { backgroundColor: '#A0CFFF', elevation: 0, shadowOpacity: 0 },
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