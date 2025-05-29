// LimpeJaApp/app/(auth)/provider-register/service-details.tsx
import React, { useState, useEffect, useRef } from 'react';
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
    Animated, // Importar Animated para animações
} from 'react-native';
import { useRouter, Stack } from 'expo-router';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker'; // Para upload da foto de perfil
import { useProviderRegistration } from '../../../contexts/ProviderRegistrationContext'; // Importa o contexto

// Componente para exibir mensagens de erro inline
const ErrorMessage: React.FC<{ message: string | null }> = ({ message }) => {
    if (!message) return null;
    return <Text style={styles.errorMessage}>{message}</Text>;
};

// Simulação da API Firebase Storage (substituir pela implementação real)
const mockFirebaseStorageApi = {
    uploadImage: async (uri: string) => {
        await new Promise(resolve => setTimeout(resolve, 1500)); // Simula o tempo de upload
        // Em uma implementação real, você faria o upload para o Firebase Storage aqui
        // Ex: const storageRef = ref(firebaseStorage, `avatars/${Date.now()}-${Math.random()}.jpg`);
        // await uploadBytes(storageRef, await fetch(uri).then(res => res.blob()));
        // const downloadUrl = await getDownloadURL(storageRef);
        // return downloadUrl;
        const mockUrl = `https://firebasestorage.googleapis.com/v0/b/limpeja.appspot.com/o/avatars%2Fmock-avatar-${Date.now()}.jpg?alt=media`;
        console.log("[ServiceDetails] Mock Firebase Storage URL:", mockUrl);
        return mockUrl; // Retorna a URL da imagem mockada
    },
};

export default function ServiceDetailsScreen() {
    const router = useRouter();
    const { serviceDetails, setServiceDetails, submitRegistration } = useProviderRegistration();

    // Estados locais para os campos do formulário
    const [experiencia, setExperiencia] = useState('');
    const [servicosOferecidos, setServicosOferecidos] = useState('');
    const [estruturaPreco, setEstruturaPreco] = useState('');
    const [areasAtendimento, setAreasAtendimento] = useState('');
    const [anosExperiencia, setAnosExperiencia] = useState('');
    const [avatarUri, setAvatarUri] = useState<string | null>(null); // URI local da imagem
    const [avatarUrl, setAvatarUrl] = useState<string | null>(null); // URL da imagem após upload (se já tiver sido feito)

    // Estados para mensagens de erro inline
    const [experienciaError, setExperienciaError] = useState<string | null>(null);
    const [servicosOferecidosError, setServicosOferecidosError] = useState<string | null>(null);
    const [estruturaPrecoError, setEstruturaPrecoError] = useState<string | null>(null);
    const [areasAtendimentoError, setAreasAtendimentoError] = useState<string | null>(null);
    const [anosExperienciaError, setAnosExperienciaError] = useState<string | null>(null);
    const [avatarError, setAvatarError] = useState<string | null>(null);

    const [isSubmitting, setIsSubmitting] = useState(false);

    // Animações para os elementos da tela
    const headerAnim = useRef(new Animated.Value(0)).current;
    const formAnim = useRef(new Animated.Value(0)).current;
    const avatarScaleAnim = useRef(new Animated.Value(1)).current; // Animação para o avatarPicker

    useEffect(() => {
        // Preenche os campos com os dados do contexto se existirem
        if (serviceDetails) {
            setExperiencia(serviceDetails.experiencia);
            setServicosOferecidos(serviceDetails.servicosOferecidos);
            setEstruturaPreco(serviceDetails.estruturaPreco);
            setAreasAtendimento(serviceDetails.areasAtendimento);
            setAnosExperiencia(String(serviceDetails.anosExperiencia));
            setAvatarUri(serviceDetails.avatarUri);
            setAvatarUrl(serviceDetails.avatarUrl || null);
        }

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
                delay: 200,
                useNativeDriver: true,
            }),
        ]).start();
    }, [serviceDetails, headerAnim, formAnim]);

    // Animação para o botão de seleção de imagem
    const onPressInAvatar = () => {
        Animated.spring(avatarScaleAnim, {
            toValue: 0.95,
            useNativeDriver: true,
        }).start();
    };

    const onPressOutAvatar = () => {
        Animated.spring(avatarScaleAnim, {
            toValue: 1,
            friction: 3,
            tension: 40,
            useNativeDriver: true,
        }).start();
    };

    const handlePickImage = async () => {
        const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (permissionResult.granted === false) {
            Alert.alert("Permissão Necessária", "Você precisa permitir o acesso à galeria para escolher uma foto.");
            return;
        }

        const pickerResult = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsEditing: true,
            aspect: [1, 1], // Forçar proporção quadrada para avatar
            quality: 0.7,
        });

        if (!pickerResult.canceled && pickerResult.assets && pickerResult.assets.length > 0) {
            setAvatarUri(pickerResult.assets[0].uri);
            setAvatarError(null); // Limpa o erro ao selecionar imagem
            setAvatarUrl(null); // Reseta a URL do servidor se uma nova imagem local for selecionada
            console.log("[ServiceDetails] Imagem selecionada:", pickerResult.assets[0].uri);
        }
    };

    // Função de validação completa do formulário
    const validateForm = () => {
        let isValid = true;

        if (!experiencia.trim()) { setExperienciaError('Sua experiência é obrigatória.'); isValid = false; } else { setExperienciaError(null); }
        if (!servicosOferecidos.trim()) { setServicosOferecidosError('Liste os serviços que você oferece.'); isValid = false; } else { setServicosOferecidosError(null); }
        if (!estruturaPreco.trim()) { setEstruturaPrecoError('Descreva sua estrutura de preços.'); isValid = false; } else { setEstruturaPrecoError(null); }
        if (!areasAtendimento.trim()) { setAreasAtendimentoError('Informe suas áreas de atendimento.'); isValid = false; } else { setAreasAtendimentoError(null); }
        if (isNaN(Number(anosExperiencia)) || Number(anosExperiencia) < 0 || anosExperiencia.trim() === '') { setAnosExperienciaError('Anos de experiência inválidos.'); isValid = false; } else { setAnosExperienciaError(null); }
        if (!avatarUri) { setAvatarError('Uma foto de perfil é obrigatória.'); isValid = false; } else { setAvatarError(null); }

        return isValid;
    };

    const handleFinalRegister = async () => {
        if (!validateForm()) {
            Alert.alert("Campos Inválidos", "Por favor, corrija os erros nos campos antes de finalizar.");
            return;
        }

        setIsSubmitting(true);
        try {
            let finalAvatarServerUrl: string | null = avatarUrl; // Mantém a URL existente se não houver nova imagem
            if (avatarUri && !avatarUrl) { // Se há uma URI local e ainda não foi feito upload
                finalAvatarServerUrl = await mockFirebaseStorageApi.uploadImage(avatarUri);
            }

            const currentServiceDetails = {
                experiencia: experiencia.trim(),
                servicosOferecidos: servicosOferecidos.trim(),
                estruturaPreco: estruturaPreco.trim(),
                areasAtendimento: areasAtendimento.trim(),
                anosExperiencia: Number(anosExperiencia),
                avatarUri, // URI local (para persistência no contexto)
                avatarUrl: finalAvatarServerUrl, // URL final do servidor
            };

            setServiceDetails(currentServiceDetails); // Salva os detalhes de serviço no contexto
            await submitRegistration(); // Chama a função de submissão final do contexto

            Alert.alert('Cadastro Concluído!', 'Seu perfil de profissional foi criado com sucesso. Bem-vindo(a) ao LimpeJá!');
            router.replace('/(auth)/login'); // Limpa a pilha de cadastro e vai para login
        } catch (error: any) {
            console.error("[ServiceDetails] Erro ao finalizar cadastro:", error);
            Alert.alert('Falha no Cadastro', error.message || 'Não foi possível finalizar seu cadastro. Tente novamente mais tarde.');
        } finally {
            setIsSubmitting(false);
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
            <ScrollView style={styles.scrollView} contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
                <Stack.Screen options={{ title: 'Serviços e Experiência (Etapa 3)' }} />

                {/* Seção do Cabeçalho com Animação */}
                <Animated.View style={[styles.headerSection, headerAnimatedStyle]}>
                    <MaterialCommunityIcons name="briefcase-check-outline" size={60} color="#007AFF" style={styles.headerIcon} />
                    <Text style={styles.mainTitle}>Detalhes dos Seus Serviços</Text>
                    <Text style={styles.subtitle}>Conte-nos mais sobre sua experiência e os serviços que você oferece.</Text>
                </Animated.View>

                {/* Formulário com Animação */}
                <Animated.View style={[styles.formSection, formAnimatedStyle]}>
                    {/* Foto de Perfil */}
                    <Text style={styles.label}>Foto de Perfil *</Text>
                    <TouchableOpacity
                        onPress={handlePickImage}
                        onPressIn={onPressInAvatar}
                        onPressOut={onPressOutAvatar}
                        style={[styles.avatarPicker, { transform: [{ scale: avatarScaleAnim }] }]}
                    >
                        {avatarUri ? (
                            <Image source={{ uri: avatarUri }} style={styles.avatarImage} />
                        ) : (
                            <View style={styles.avatarPlaceholder}>
                                <Ionicons name="camera-outline" size={40} color="#ADB5BD" />
                                <Text style={styles.avatarPlaceholderText}>Toque para escolher uma foto</Text>
                            </View>
                        )}
                    </TouchableOpacity>
                    <ErrorMessage message={avatarError} />

                    {/* Descrição da Experiência */}
                    <Text style={styles.label}>Descreva sua Experiência Profissional *</Text>
                    <TextInput
                        style={styles.textArea}
                        value={experiencia}
                        onChangeText={setExperiencia}
                        onBlur={() => setExperienciaError(experiencia.trim() ? null : 'Sua experiência é obrigatória.')}
                        placeholder="Ex: Tenho 5 anos de experiência com limpeza residencial, sou detalhista e organizada..."
                        multiline
                        numberOfLines={4}
                        maxLength={500}
                    />
                    <ErrorMessage message={experienciaError} />

                    {/* Anos de Experiência */}
                    <Text style={styles.label}>Anos de Experiência *</Text>
                    <View style={styles.inputContainer}>
                        <Ionicons name="hourglass-outline" size={20} color="#8A8A8E" style={styles.inputIcon} />
                        <TextInput
                            style={styles.input}
                            value={anosExperiencia}
                            onChangeText={setAnosExperiencia}
                            onBlur={() => setAnosExperienciaError(isNaN(Number(anosExperiencia)) || Number(anosExperiencia) < 0 || anosExperiencia.trim() === '' ? 'Anos de experiência inválidos.' : null)}
                            placeholder="Ex: 5"
                            keyboardType="number-pad"
                            maxLength={2}
                        />
                    </View>
                    <ErrorMessage message={anosExperienciaError} />

                    {/* Principais Serviços Oferecidos */}
                    <Text style={styles.label}>Principais Serviços Oferecidos *</Text>
                    <TextInput
                        style={styles.textArea}
                        value={servicosOferecidos}
                        onChangeText={setServicosOferecidos}
                        onBlur={() => setServicosOferecidosError(servicosOferecidos.trim() ? null : 'Liste os serviços que você oferece.')}
                        placeholder="Liste os serviços que você realiza (ex: Limpeza padrão, Limpeza pesada, Passar roupas, Limpeza de vidros, etc.)"
                        multiline
                        numberOfLines={3}
                        maxLength={300}
                    />
                    <ErrorMessage message={servicosOferecidosError} />

                    {/* Estrutura de Preços */}
                    <Text style={styles.label}>Sua Estrutura de Preços *</Text>
                    <TextInput
                        style={styles.textArea}
                        value={estruturaPreco}
                        onChangeText={setEstruturaPreco}
                        onBlur={() => setEstruturaPrecoError(estruturaPreco.trim() ? null : 'Descreva sua estrutura de preços.')}
                        placeholder="Descreva como você cobra (ex: R$ XX por hora, preço fixo por tipo de limpeza, pacotes mensais, etc.)"
                        multiline
                        numberOfLines={3}
                        maxLength={300}
                    />
                    <ErrorMessage message={estruturaPrecoError} />

                    {/* Áreas de Atendimento */}
                    <Text style={styles.label}>Principais Áreas/Bairros de Atendimento *</Text>
                    <TextInput
                        style={styles.textArea}
                        value={areasAtendimento}
                        onChangeText={setAreasAtendimento}
                        onBlur={() => setAreasAtendimentoError(areasAtendimento.trim() ? null : 'Informe suas áreas de atendimento.')}
                        placeholder="Ex: Cambuí, Centro (Campinas); Sumaré (cidade inteira)"
                        multiline
                        numberOfLines={3}
                        maxLength={300}
                    />
                    <ErrorMessage message={areasAtendimentoError} />
                </Animated.View>

                {/* Botões de Navegação */}
                <View style={styles.navigationButtons}>
                    <TouchableOpacity style={[styles.navButton, styles.backButton]} onPress={() => router.back()} disabled={isSubmitting}>
                        <Ionicons name="arrow-back-outline" size={20} color="#007AFF" />
                        <Text style={styles.navButtonTextBack}>Voltar</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={[styles.navButton, styles.nextButton, isSubmitting && styles.nextButtonDisabled]}
                        onPress={handleFinalRegister}
                        disabled={isSubmitting}
                    >
                        {isSubmitting ? <ActivityIndicator color="#fff" /> : <Text style={styles.navButtonTextNext}>Finalizar Cadastro</Text>}
                        <Ionicons name="checkmark-circle-outline" size={20} color="#fff" style={{ marginLeft: 8 }} />
                    </TouchableOpacity>
                </View>
            </ScrollView>
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    keyboardAvoidingContainer: { flex: 1, backgroundColor: '#F8F9FA' },
    scrollView: { flex: 1 },
    container: { flexGrow: 1, paddingHorizontal: 25, paddingVertical: 20 },
    headerSection: {
        alignItems: 'center',
        marginBottom: 25,
    },
    headerIcon: { marginBottom: 10 },
    mainTitle: { fontSize: 26, fontWeight: 'bold', color: '#1C3A5F', textAlign: 'center', marginBottom: 8 },
    subtitle: { fontSize: 15, color: '#6C757D', textAlign: 'center', marginBottom: 20, paddingHorizontal: 10 },
    formSection: {
        // Estilos para animação da seção de formulário
    },
    label: { fontSize: 15, fontWeight: '600', color: '#495057', marginBottom: 7, marginTop: 12 },
    inputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#FFFFFF',
        borderWidth: 1,
        borderColor: '#CED4DA',
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
    textArea: {
        backgroundColor: '#FFFFFF',
        borderWidth: 1,
        borderColor: '#CED4DA',
        borderRadius: 10,
        paddingHorizontal: 12,
        paddingVertical: 12, // Ajustado para melhor visualização do texto
        marginBottom: 12,
        fontSize: 16,
        color: '#212529',
        textAlignVertical: 'top', // Garante que o texto comece no topo da caixa
        minHeight: 100, // Altura mínima para text areas
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
        width: 120, // Tamanho um pouco menor para o avatar
        height: 120,
        borderRadius: 60, // Metade da largura/altura para círculo perfeito
        backgroundColor: '#E9ECEF',
        borderColor: '#CED4DA',
        borderWidth: 1,
        alignSelf: 'center',
        marginBottom: 20,
        overflow: 'hidden', // Garante que a imagem não ultrapasse o borderRadius
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
        resizeMode: 'cover', // Importante para que a imagem caiba no espaço sem distorção
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
    navigationButtons: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 30, marginBottom: 20 },
    navButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 14,
        paddingHorizontal: 22,
        borderRadius: 10,
        minWidth: 140,
        ...Platform.select({
            ios: {
                shadowColor: 'rgba(0,0,0,0.1)',
                shadowOffset: { width: 0, height: 3 },
                shadowOpacity: 0.2,
                shadowRadius: 5,
            },
            android: {
                elevation: 4,
            },
        }),
    },
    backButton: { backgroundColor: '#E9ECEF', borderWidth: 1, borderColor: '#CED4DA' },
    nextButton: { backgroundColor: '#28A745' }, // Verde para finalizar
    nextButtonDisabled: { backgroundColor: '#A5D6A7', elevation: 0, shadowOpacity: 0 }, // Estilo para botão desabilitado
    navButtonTextBack: { fontSize: 16, fontWeight: '600', color: '#007AFF', marginLeft: 5 },
    navButtonTextNext: { fontSize: 17, fontWeight: 'bold', color: '#FFFFFF', marginRight: 5 },
});