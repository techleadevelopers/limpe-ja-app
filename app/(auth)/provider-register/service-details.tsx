import React, { useState, useEffect, useRef, useCallback } from 'react';
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
    Image,
    Animated,
    StatusBar,
} from 'react-native';
import { useRouter, Stack } from 'expo-router';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useProviderRegistration } from '../../../contexts/ProviderRegistrationContext';
// Certifique-se de que AUTH_ROUTES está importado corretamente para a rota de verificação
import { PROVIDER_ROUTES, AUTH_ROUTES } from '../../../constants/routes'; 
import { useAuth } from '../../../hooks/useAuth';

// Componente para exibir mensagens de erro inline
const ErrorMessage: React.FC<{ message: string | null }> = ({ message }) => {
    if (!message) return null;
    return <Text style={styles.errorMessage}>{message}</Text>;
};

// Componente reutilizável para inputs com ícone (Com ajuste para onBlur)
interface InputWithIconProps {
    label: string;
    value: string;
    onChangeText: (text: string) => void;
    placeholder: string;
    error: string | null;
    iconName: keyof typeof Ionicons.glyphMap | keyof typeof MaterialCommunityIcons.glyphMap;
    iconLibrary: 'Ionicons' | 'MaterialCommunityIcons';
    keyboardType?: 'default' | 'numeric' | 'email-address' | 'phone-pad';
    multiline?: boolean;
    numberOfLines?: number;
    maxLength?: number;
    textAlignVertical?: 'auto' | 'top' | 'bottom' | 'center';
    onBlur?: () => void;
    onFocus?: () => void;
    accessibilityLabel: string;
}

const InputWithIcon: React.FC<InputWithIconProps> = ({
    label,
    value,
    onChangeText,
    placeholder,
    error,
    iconName,
    iconLibrary,
    keyboardType = 'default',
    multiline = false,
    numberOfLines = 1,
    maxLength,
    textAlignVertical: propTextAlignVertical = 'center',
    onBlur,
    onFocus,
    accessibilityLabel,
}) => {
    const [isFocused, setIsFocused] = useState(false);

    const handleFocus = () => {
        setIsFocused(true);
        onFocus?.();
    };

    const handleBlur = () => {
        setIsFocused(false);
        onBlur?.();
    };

    const IconComponent = iconLibrary === 'Ionicons' ? Ionicons : MaterialCommunityIcons;

    const finalTextAlignVertical: 'auto' | 'top' | 'bottom' | 'center' = multiline ? 'top' : propTextAlignVertical;

    return (
        <View>
            <Text style={styles.label}>{label}</Text>
            <View style={[
                styles.inputWrapper,
                isFocused && styles.inputWrapperFocused,
                error && styles.inputWrapperError,
                multiline && { height: 'auto', minHeight: 50 + (numberOfLines - 1) * 20 }
            ]}>
                <View style={styles.iconCircle}>
                    <IconComponent name={iconName as any} size={20} color={isFocused ? '#007BFF' : '#6C757D'} />
                </View>
                <TextInput
                    style={[
                        styles.input,
                        multiline && styles.textAreaInput,
                        multiline && { minHeight: 50 + (numberOfLines - 1) * 20, height: 'auto' }
                    ]}
                    value={value}
                    onChangeText={onChangeText}
                    onFocus={handleFocus}
                    onBlur={handleBlur}
                    placeholder={placeholder}
                    keyboardType={keyboardType}
                    multiline={multiline}
                    numberOfLines={numberOfLines}
                    maxLength={maxLength}
                    textAlignVertical={finalTextAlignVertical}
                    placeholderTextColor="#A0AEC0"
                    accessibilityLabel={accessibilityLabel}
                />
            </View>
            {maxLength && multiline && (
                <Text style={styles.charCounter}>
                    {value.length}/{maxLength}
                </Text>
            )}
            <ErrorMessage message={error} />
        </View>
    );
};


const mockFirebaseStorageApi = {
    uploadImage: async (uri: string) => {
        console.log("[mockFirebaseStorageApi] Iniciando upload simulado para:", uri);
        await new Promise(resolve => setTimeout(resolve, 1500));
        const mockUrl = `https://firebasestorage.googleapis.com/v0/b/limpeja.appspot.com/o/avatars%2Fmock-avatar-${Date.now()}.jpg?alt=media`;
        console.log("[mockFirebaseStorageApi] Mock Firebase Storage URL gerada:", mockUrl);
        return mockUrl;
    },
};

const MOCK_AREA_SUGGESTIONS = [
    'Campinas, SP', 'São Paulo, SP', 'Rio de Janeiro, RJ', 'Belo Horizonte, MG',
    'Porto Alegre, RS', 'Curitiba, PR', 'Barão Geraldo, Campinas, SP', 'Sousas, Campinas, SP',
    'Centro, Campinas, SP', 'Sumaré, SP', 'Hortolândia, SP', 'Valinhos, SP', 'Vinhedo, SP',
];

// ATUALIZADO: Renomeado a função exportada para refletir o contexto de provedor
export default function ProviderServiceDetailsFormScreen() {
    const router = useRouter();
    const { serviceDetails, setServiceDetails, submitRegistration, personalDetails: pdFromContext } = useProviderRegistration();
    const { setIsRegistrationInProgress } = useAuth(); // Obtenha setIsRegistrationInProgress do useAuth

    // Estados locais para os campos do formulário da Etapa 3
    const [experiencia, setExperiencia] = useState('');
    const [descricaoTrabalho, setDescricaoTrabalho] = useState('');
    const [estruturaPreco, setEstruturaPreco] = useState('');
    const [areasAtendimento, setAreasAtendimento] = useState('');
    const [anosExperiencia, setAnosExperiencia] = useState('');
    const [pixKey, setPixKey] = useState('');
    const [avatarUri, setAvatarUri] = useState<string | null>(null);
    const [avatarUrl, setAvatarUrl] = useState<string | null>(null);

    const [areaSuggestions, setAreaSuggestions] = useState<string[]>([]);
    const [showAreaSuggestions, setShowAreaSuggestions] = useState(false);

    const [experienciaError, setExperienciaError] = useState<string | null>(null);
    const [descricaoTrabalhoError, setDescricaoTrabalhoError] = useState<string | null>(null);
    const [estruturaPrecoError, setEstruturaPrecoError] = useState<string | null>(null);
    const [areasAtendimentoError, setAreasAtendimentoError] = useState<string | null>(null);
    const [anosExperienciaError, setAnosExperienciaError] = useState<string | null>(null);
    const [pixKeyError, setPixKeyError] = useState<string | null>(null);
    const [avatarError, setAvatarError] = useState<string | null>(null);

    const [isSubmitting, setIsSubmitting] = useState(false);

    const headerAnim = useRef(new Animated.Value(0)).current;
    const formAnim = useRef(new Animated.Value(0)).current;
    const avatarScaleAnim = useRef(new Animated.Value(1)).current;

    const createButtonAnimations = () => {
        const scaleAnim = useRef(new Animated.Value(1)).current;
        const onPressIn = () => Animated.spring(scaleAnim, { toValue: 0.97, useNativeDriver: true, friction: 7 }).start();
        const onPressOut = () => Animated.spring(scaleAnim, { toValue: 1, useNativeDriver: true, friction: 7 }).start();
        return { scaleAnim, onPressIn, onPressOut };
    };

    const finalizarButtonAnims = createButtonAnimations();


    useEffect(() => {
        // ATUALIZADO: Logs para refletir o novo nome da função
        console.log("[ProviderServiceDetailsFormScreen] Componente montado ou serviceDetails atualizado."); 
        // Carrega os dados do contexto se existirem (para o caso de o usuário voltar ou editar)
        if (serviceDetails) {
            console.log("[ProviderServiceDetailsFormScreen] Carregando serviceDetails do contexto:", serviceDetails); 
            setExperiencia(serviceDetails.experiencia || '');
            setDescricaoTrabalho(serviceDetails.servicosOferecidos || ''); // Usando servicosOferecidos do contexto
            setEstruturaPreco(serviceDetails.estruturaPreco || '');
            setAreasAtendimento(serviceDetails.areasAtendimento || '');
            setAnosExperiencia(String(serviceDetails.anosExperiencia || ''));
            setPixKey(serviceDetails.pixKey || '');
            setAvatarUri(serviceDetails.avatarUri || null);
            setAvatarUrl(serviceDetails.avatarUrl || null);
        }

        Animated.stagger(200, [
            Animated.timing(headerAnim, {
                toValue: 1,
                duration: 600,
                useNativeDriver: true,
            }),
            Animated.timing(formAnim, {
                toValue: 1,
                duration: 800,
                delay: 200,
                useNativeDriver: true,
            }),
        ]).start(() => console.log("[ProviderServiceDetailsFormScreen] Animações iniciais concluídas.")); 
    }, [serviceDetails, headerAnim, formAnim]);

    const onPressInAvatar = () => {
        console.log("[Avatar] Animação de pressionar avatar: In.");
        Animated.spring(avatarScaleAnim, {
            toValue: 0.95,
            useNativeDriver: true,
        }).start();
    };

    const onPressOutAvatar = () => {
        console.log("[Avatar] Animação de pressionar avatar: Out.");
        Animated.spring(avatarScaleAnim, {
            toValue: 1,
            friction: 3,
            tension: 40,
            useNativeDriver: true,
        }).start();
    };

    const handlePickImage = async () => {
        console.log("[ImagePicker] Tentando escolher imagem...");
        const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (permissionResult.granted === false) {
            Alert.alert("Permissão Necessária", "Você precisa permitir o acesso à galeria para escolher uma foto.");
            console.warn("[ImagePicker] Permissão da galeria negada.");
            return;
        }

        const pickerResult = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsEditing: true,
            aspect: [1, 1],
            quality: 0.7,
        });

        if (!pickerResult.canceled && pickerResult.assets && pickerResult.assets.length > 0) {
            setAvatarUri(pickerResult.assets[0].uri);
            setAvatarError(null);
            setAvatarUrl(null); // Limpar avatarUrl para forçar novo upload se a URI mudar
            console.log("[ImagePicker] Imagem selecionada com URI:", pickerResult.assets[0].uri);
        } else {
            console.log("[ImagePicker] Seleção de imagem cancelada ou falhou.");
        }
    };

    const handleAreasAtendimentoChange = useCallback((text: string) => {
        setAreasAtendimento(text);
        if (text.length > 2) {
            const filteredSuggestions = MOCK_AREA_SUGGESTIONS.filter(area =>
                area.toLowerCase().includes(text.toLowerCase())
            ).slice(0, 5);
            setAreaSuggestions(filteredSuggestions);
            setShowAreaSuggestions(true);
        } else {
            setAreaSuggestions([]);
            setShowAreaSuggestions(false);
        }
        setAreasAtendimentoError(null);
    }, []);

    const handleSelectAreaSuggestion = useCallback((suggestion: string) => {
        setAreasAtendimento(suggestion);
        setShowAreaSuggestions(false);
        setAreaSuggestions([]);
    }, []);

    const validateForm = () => {
        console.log("[Validation] Iniciando validação do formulário de detalhes do serviço.");
        let isValid = true;

        if (!experiencia.trim()) { setExperienciaError('Sua experiência é obrigatória.'); isValid = false; console.log("[Validation] Erro: Experiência vazia."); } else { setExperienciaError(null); }
        if (!descricaoTrabalho.trim()) { setDescricaoTrabalhoError('Descreva seu trabalho e serviços.'); isValid = false; console.log("[Validation] Erro: Descrição do Trabalho vazia."); } else { setDescricaoTrabalhoError(null); }
        if (!estruturaPreco.trim()) { setEstruturaPrecoError('Descreva sua estrutura de preços.'); isValid = false; console.log("[Validation] Erro: Estrutura de Preços vazia."); } else { setEstruturaPrecoError(null); }
        if (!areasAtendimento.trim()) { setAreasAtendimentoError('Informe suas áreas de atendimento.'); isValid = false; console.log("[Validation] Erro: Áreas de Atendimento vazias."); } else { setAreasAtendimentoError(null); }
        if (isNaN(Number(anosExperiencia)) || Number(anosExperiencia) < 0 || anosExperiencia.trim() === '') { setAnosExperienciaError('Anos de experiência inválidos.'); isValid = false; console.log("[Validation] Erro: Anos de Experiência inválidos."); } else { setAnosExperienciaError(null); }
        if (!pixKey.trim()) { setPixKeyError('A chave PIX é obrigatória para pagamentos.'); isValid = false; console.log("[Validation] Erro: Chave PIX vazia."); } else { setPixKeyError(null); }
        if (!avatarUri) { setAvatarError('Uma foto de perfil é obrigatória.'); isValid = false; console.log("[Validation] Erro: Avatar não selecionado."); } else { setAvatarError(null); }

        console.log("[Validation] Validação do formulário concluída. Válido:", isValid);
        return isValid;
    };

    const handleFinalRegister = async () => {
        console.log("[FinalRegistration] Botão 'Finalizar Cadastro' pressionado.");
        if (!validateForm()) {
            Alert.alert("Campos Inválidos", "Por favor, corrija os erros nos campos antes de finalizar.");
            console.warn("[FinalRegistration] Validação do formulário falhou. Abortando submissão.");
            return;
        }

        setIsSubmitting(true);
        console.log("[FinalRegistration] isSubmitting definido como true.");
        try {
            let finalAvatarServerUrl: string | null = avatarUrl;
            if (avatarUri && !avatarUrl) {
                console.log("[FinalRegistration] Avatar URI presente, mas URL do servidor ausente. Iniciando upload.");
                finalAvatarServerUrl = await mockFirebaseStorageApi.uploadImage(avatarUri);
                console.log("[FinalRegistration] Upload de avatar concluído. URL:", finalAvatarServerUrl);
            } else if (avatarUrl) {
                console.log("[FinalRegistration] Avatar URL já presente. Não é necessário fazer upload novamente.");
            } else {
                console.warn("[FinalRegistration] Nenhuma URI ou URL de avatar para processar.");
            }

            const currentServiceDetails = {
                experiencia: experiencia.trim(),
                servicosOferecidos: descricaoTrabalho.trim(), // Salvando como servicosOferecidos para o contexto
                estruturaPreco: estruturaPreco.trim(),
                areasAtendimento: areasAtendimento.trim(),
                anosExperiencia: Number(anosExperiencia),
                pixKey: pixKey.trim(),
                avatarUri,
                avatarUrl: finalAvatarServerUrl,
            };
            console.log("[FinalRegistration] Detalhes do serviço a serem salvos no contexto:", currentServiceDetails);

            setServiceDetails(currentServiceDetails); // Salva os detalhes do serviço no contexto
            console.log("[FinalRegistration] Detalhes do serviço salvos no contexto ProviderRegistrationContext.");

            console.log("[FinalRegistration] Chamando submitRegistration do ProviderRegistrationContext.");
            // submitRegistration no contexto deve reunir personalDetails, addressDetails e serviceDetails
            await submitRegistration();
            console.log("[FinalRegistration] submitRegistration concluído.");

            // CORREÇÃO: Definir isRegistrationInProgress como false após a submissão bem-sucedida
            // Isso é crucial para que o _layout.tsx não redirecione o usuário de volta
            // para o fluxo de registro após a conclusão.
            setIsRegistrationInProgress(false); 

            // Exibe um alerta de sucesso. A navegação será tratada pelo _layout.tsx
            // para a tela de verificação de conta, que é o próximo passo.
            Alert.alert(
              "Cadastro Concluído!",
              "Seu perfil de provedor foi finalizado com sucesso! Redirecionando para a verificação de conta.",
              [{ text: "OK", onPress: () => {
                    // Navega para a tela de verificação de conta
                    router.replace(AUTH_ROUTES.VERIFY_ACCOUNT_STEP as any);
                }}]
            );

        } catch (error: any) {
            console.error("[FinalRegistration] Erro ao finalizar cadastro:", error);
            Alert.alert('Falha no Cadastro', error.message || 'Não foi possível finalizar seu cadastro. Tente novamente mais tarde.');
            // Em caso de erro, é prudente limpar a flag para que o usuário possa tentar novamente ou sair do fluxo.
            setIsRegistrationInProgress(false);
        } finally {
            setIsSubmitting(false);
            console.log("[FinalRegistration] isSubmitting definido como false. Processo de registro finalizado.");
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

    return (
        <KeyboardAvoidingView
            behavior={Platform.OS === "ios" ? "padding" : "height"}
            style={styles.keyboardAvoidingContainer}
        >
            <StatusBar barStyle="dark-content" backgroundColor={styles.keyboardAvoidingContainer.backgroundColor} />
            <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContentContainer} keyboardShouldPersistTaps="handled">
                {/* O Stack.Screen options aqui só é relevante se esta for uma tela própria no navigator */}
                <Stack.Screen options={{ title: 'Detalhes do Serviço do Provedor' }} />

                <Animated.View style={[styles.contentWrapper, headerAnimatedStyle]}>
                    {/* Título e subtítulo da seção - ATUALIZADOS */}
                    <Text style={styles.sectionTitle}>Detalhes do Serviço do Provedor</Text>
                    <Text style={styles.sectionSubtitle}>
                        Descreva os serviços que você oferece, sua experiência e como os clientes podem te encontrar.
                    </Text>

                    <Animated.View style={[styles.formSection, formAnimatedStyle]}>
                        {/* Foto de Perfil */}
                        <Text style={styles.label}>Foto de Perfil *</Text>
                        <TouchableOpacity
                            onPress={handlePickImage}
                            onPressIn={onPressInAvatar}
                            onPressOut={onPressOutAvatar}
                            style={[styles.avatarPicker, { transform: [{ scale: avatarScaleAnim }] }]}
                            accessibilityLabel="Toque para escolher ou alterar sua foto de perfil"
                        >
                            {avatarUri ? (
                                <Image source={{ uri: avatarUri }} style={styles.avatarImage} resizeMode="cover" />
                            ) : (
                                <View style={styles.avatarPlaceholder}>
                                    <Ionicons name="camera-outline" size={40} color="#ADB5BD" />
                                    <Text style={styles.avatarPlaceholderText}>Toque para escolher uma foto</Text>
                                </View>
                            )}
                        </TouchableOpacity>
                        <ErrorMessage message={avatarError} />

                        {/* Anos de Experiência */}
                        <InputWithIcon
                            label="Anos de Experiência "
                            value={anosExperiencia}
                            onChangeText={setAnosExperiencia}
                            onBlur={() => setAnosExperienciaError(isNaN(Number(anosExperiencia)) || Number(anosExperiencia) < 0 || anosExperiencia.trim() === '' ? 'Anos de experiência inválidos.' : null)}
                            placeholder="Ex: 5"
                            keyboardType="numeric"
                            maxLength={2}
                            iconName="briefcase-outline"
                            iconLibrary="Ionicons"
                            error={anosExperienciaError}
                            accessibilityLabel="Anos de experiência profissional"
                        />

                        {/* Descrição do Trabalho (Antigo Principais Serviços Oferecidos) */}
                        <InputWithIcon
                            label="Descrição do Trabalho "
                            value={descricaoTrabalho}
                            onChangeText={setDescricaoTrabalho}
                            onBlur={() => setDescricaoTrabalhoError(descricaoTrabalho.trim() ? null : 'Descreva seu trabalho e serviços.')}
                            placeholder="Ex: Ofereço serviços de limpeza residencial e comercial."
                            multiline
                            numberOfLines={4}
                            maxLength={500}
                            iconName="clipboard-text-outline"
                            iconLibrary="MaterialCommunityIcons"
                            error={descricaoTrabalhoError}
                            accessibilityLabel="Descrição detalhada dos serviços que você oferece"
                        />

                        {/* Descrição da Experiência Profissional (Mantido, mas avalie a necessidade com "Descrição do Trabalho") */}
                        <InputWithIcon
                            label="Descreva sua Experiência Profissional "
                            value={experiencia}
                            onChangeText={setExperiencia}
                            onBlur={() => setExperienciaError(experiencia.trim() ? null : 'Sua experiência é obrigatória.')}
                            placeholder="Ex: Tenho 5 anos de experiência com limpeza residencial..."
                            multiline
                            numberOfLines={4}
                            maxLength={500}
                            iconName="text-box-outline"
                            iconLibrary="MaterialCommunityIcons"
                            error={experienciaError}
                            accessibilityLabel="Sua experiência profissional e histórico"
                        />

                        {/* Estrutura de Preços */}
                        <InputWithIcon
                            label="Preço do Serviço"
                            value={estruturaPreco}
                            onChangeText={setEstruturaPreco}
                            onBlur={() => setEstruturaPrecoError(estruturaPreco.trim() ? null : 'Descreva sua estrutura de preços.')}
                            placeholder="Preço do seu Serviço...."
                            multiline
                            numberOfLines={3}
                            maxLength={300}
                            iconName="currency-usd"
                            iconLibrary="MaterialCommunityIcons"
                            error={estruturaPrecoError}
                            accessibilityLabel="Descrição da sua estrutura de preços e valores"
                        />

                        {/* Áreas de Atendimento com Sugestão */}
                        <InputWithIcon
                            label="Localização"
                            value={areasAtendimento}
                            onChangeText={handleAreasAtendimentoChange}
                            onFocus={() => areasAtendimento.length > 2 && setShowAreaSuggestions(true)}
                            onBlur={() => {
                                setAreasAtendimentoError(areasAtendimento.trim() ? null : 'Informe suas áreas de atendimento.');
                                setTimeout(() => setShowAreaSuggestions(false), 200);
                            }}
                            placeholder="Ex: Campinas, SP; Centro; Sumaré"
                            iconName="location-outline"
                            iconLibrary="Ionicons"
                            error={areasAtendimentoError}
                            accessibilityLabel="Cidades, bairros ou regiões onde você atende"
                        />

                        {/* Lista de Sugestões de Área de Atendimento */}
                        {showAreaSuggestions && areaSuggestions.length > 0 && (
                            <View style={styles.suggestionsContainer}>
                                {areaSuggestions.map((suggestion, index) => (
                                    <TouchableOpacity
                                        key={index}
                                        style={styles.suggestionItem}
                                        onPress={() => handleSelectAreaSuggestion(suggestion)}
                                        accessibilityLabel={`Sugestão de área: ${suggestion}`}
                                    >
                                        <Text style={styles.suggestionText}>{suggestion}</Text>
                                    </TouchableOpacity>
                                ))}
                            </View>
                        )}

                        {/* Chave PIX */}
                        <InputWithIcon
                            label="Chave PIX *"
                            value={pixKey}
                            onChangeText={setPixKey}
                            onBlur={() => setPixKeyError(pixKey.trim() ? null : 'A chave PIX é obrigatória.')}
                            placeholder="Sua chave PIX (CPF, Telefone, Email, Aleatória)"
                            iconName="key-outline"
                            iconLibrary="Ionicons"
                            error={pixKeyError}
                            accessibilityLabel="Sua chave PIX para recebimento de pagamentos"
                        />
                    </Animated.View>

                    {/* Botão de Finalizar Cadastro (modificado) */}
                    <View style={styles.finalizarButtonContainer}>
                        <Animated.View style={{ transform: [{ scale: finalizarButtonAnims.scaleAnim }] }}>
                            <TouchableOpacity
                                style={[styles.finalizarButton, isSubmitting && styles.finalizarButtonDisabled]}
                                onPress={handleFinalRegister}
                                disabled={isSubmitting}
                                accessibilityLabel={isSubmitting ? "Finalizando cadastro, aguarde" : "Finalizar cadastro e salvar informações"}
                            >
                                {isSubmitting ? (
                                    <ActivityIndicator color="#FFFFFF" />
                                ) : (
                                    <Text style={styles.finalizarButtonText}>Finalizar Cadastro</Text>
                                )}
                            </TouchableOpacity>
                        </Animated.View>
                    </View>
                </Animated.View>
            </ScrollView>
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    keyboardAvoidingContainer: {
        flex: 1,
        backgroundColor: '#F7F8FC', // Fundo branco ou muito claro como na imagem
    },
    scrollView: {
        flex: 1,
    },
    scrollContentContainer: {
        flexGrow: 1,
        justifyContent: 'center',
        paddingBottom: 20,
    },
    contentWrapper: {
        paddingHorizontal: 35,
        paddingTop: Platform.OS === 'ios' ? 20 : 15,
    },
    sectionTitle: { // Título da seção de detalhes de serviço
        fontSize: 24, // Aumentado para mais destaque
        fontWeight: 'bold',
        color: '#1D2029',
        textAlign: 'center',
        marginBottom: 10, // Espaçamento após o título
        marginTop: 20,
    },
    sectionSubtitle: { // Subtítulo da seção de detalhes de serviço
        fontSize: 15,
        color: '#8A94A6',
        textAlign: 'center',
        marginBottom: 30, // Espaçamento maior antes dos campos
    },
    formSection: {
        // Estilos para animação da seção de formulário (mantido para compatibilidade)
    },
    label: {
        fontSize: 15,
        fontWeight: '600',
        color: '#495057',
        marginBottom: 7,
        marginTop: 12,
    },
    // Estilos para inputWrapper e input dentro do componente InputWithIcon
    inputWrapper: { // Este é o contêiner branco pill-shape com sombra e ícone
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#FFFFFF',
        borderRadius: 28, // Totalmente arredondado
        height: 50, // Altura do input
        marginBottom: 20,
        shadowColor: 'rgba(100, 100, 150, 0.15)', // Sombra mais suave
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 1,
        shadowRadius: 15,
        elevation: 5,
        paddingLeft: 15, // Padding para o círculo do ícone
        paddingRight: 15, // Padding para o TextInput
        borderWidth: 1, // Adiciona borda para feedback visual
        borderColor: 'transparent', // Borda inicial transparente
    },
    inputWrapperFocused: { // Estilo para inputWrapper quando focado
        borderColor: '#007BFF', // Borda azul quando focado
        shadowColor: 'rgba(0, 123, 255, 0.2)', // Sombra azul mais proeminente
        shadowOpacity: 0.8,
        shadowRadius: 10,
        elevation: 8,
    },
    inputWrapperError: { // Estilo para inputWrapper quando há erro
        borderColor: '#D32F2F', // Borda vermelha quando há erro
        shadowColor: 'rgba(211, 47, 47, 0.2)', // Sombra vermelha
        shadowOpacity: 0.8,
        shadowRadius: 10,
        elevation: 8,
    },
    iconCircle: { // Estilo para o círculo do ícone dentro do inputWrapper
        width: 50,
        height: 50,
        borderRadius: 40,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#FFFFFF',
        shadowColor: 'rgba(178, 139, 202, 0.1)', // Sombra mais sutil (de roxo claro)
        shadowOffset: { width: 0, height: 2 }, // Sombra mais suave
        shadowOpacity: 0.5, // Reduzida opacidade
        shadowRadius: 3, // Raio menor para sombra mais discreta
        elevation: 2, // Elevação menor para Android
        marginRight: 10,
    },
    input: { // Estilo para o TextInput dentro do inputWrapper
        flex: 1,
        fontSize: 15,
        color: '#2D3748',
        height: '100%', // Preenche a altura do wrapper
        paddingVertical: 0, // Remove padding vertical padrão
    },
    textAreaInput: { // Estilo específico para TextInputs multiline
        height: 'auto', // Altura ajustável
        minHeight: 100, // Altura mínima para text areas
        paddingTop: 15, // Padding para alinhar texto ao topo em multiline
        paddingBottom: 15,
    },
    errorMessage: { // Erro específico para campos
        color: '#D32F2F',
        fontSize: 12,
        marginTop: -15, // Ajustado para ficar mais próximo do input
        marginBottom: 10,
        marginLeft: 5,
    },
    charCounter: { // Contador de caracteres
        fontSize: 12,
        color: '#8A94A6',
        textAlign: 'right',
        marginTop: -15, // Alinha com o erro ou abaixo do input
        marginBottom: 10,
        marginRight: 5,
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
        marginTop: 15, // Ajuste para espaçamento
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
    // Estilos para sugestões de área de atendimento
    suggestionsContainer: {
        backgroundColor: '#FFFFFF',
        borderRadius: 10,
        marginTop: -15, // Ajusta para sobrepor o input visualmente
        marginBottom: 20,
        shadowColor: 'rgba(0,0,0,0.1)',
        shadowOffset: { width: 0, height: 5 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 3,
        maxHeight: 150, // Limita a altura da lista de sugestões
    },
    suggestionItem: {
        paddingVertical: 12,
        paddingHorizontal: 15,
        borderBottomWidth: 1,
        borderBottomColor: '#F0F0F0',
    },
    suggestionText: {
        fontSize: 15,
        color: '#495057',
    },
    // NOVO: Container para o botão Finalizar Cadastro, centralizado
    finalizarButtonContainer: {
        alignItems: 'center', // Centraliza o botão horizontalmente
        marginTop: 30,
        marginBottom: 20,
    },
    // NOVO: Estilos para o botão Finalizar Cadastro, baseado no botão de login
    finalizarButton: {
        backgroundColor: 'rgba(64, 192, 240, 0.85)', // Cor principal do botão de login
        borderRadius: 28,
        paddingVertical: 10,
        width: '100%', // Ocupa a largura total do container
        minWidth: 200, // Garante uma largura mínima se o container for muito pequeno
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: '#007BFF', // Sombra do botão de login
        shadowOffset: { width: 0, height: 5 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 8,
    },
    // NOVO: Estilos para o botão Finalizar Cadastro quando desabilitado
    finalizarButtonDisabled: {
        backgroundColor: '#A0CFFF', // Cor do botão desabilitado do login
        elevation: 0,
        shadowOpacity: 0,
    },
    // NOVO: Estilos para o texto do botão Finalizar Cadastro
    finalizarButtonText: {
        color: '#FFFFFF',
        fontSize: 14,
        fontWeight: '600',
    },
});
