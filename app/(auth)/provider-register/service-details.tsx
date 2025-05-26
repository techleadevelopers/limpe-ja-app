// LimpeJaApp/app/(auth)/provider-register/service-details.tsx
import React, { useState, useContext } from 'react'; // useContext para o futuro FormContext
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
  Image
} from 'react-native';
import { useRouter, Stack } from 'expo-router';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker'; // Para upload da foto de perfil

// TODO: Criar e usar um Contexto para o formulário de cadastro de provedor
// Exemplo: import { useProviderRegistration } from '../../../contexts/ProviderRegistrationContext';

export default function ServiceDetailsScreen() {
  const router = useRouter();
  // const { personalDetails, serviceDetails, setServiceDetails, submitRegistration } = useProviderRegistration(); // Exemplo de uso do Contexto

  // Estados locais para os campos do formulário
  // No futuro, estes viriam/seriam salvos no ProviderRegistrationContext
  const [experiencia, setExperiencia] = useState('');
  const [servicosOferecidos, setServicosOferecidos] = useState(''); // Ex: "Limpeza residencial, Passar roupa, Limpeza de janelas"
  const [estruturaPreco, setEstruturaPreco] = useState(''); // Ex: "R$ 50/hora para limpeza padrão, pacotes disponíveis"
  const [areasAtendimento, setAreasAtendimento] = useState(''); // Ex: "Bairro Cambuí, Centro - Campinas"
  const [anosExperiencia, setAnosExperiencia] = useState('');
  const [avatarUri, setAvatarUri] = useState<string | null>(null);

  const [isSubmitting, setIsSubmitting] = useState(false);

  const handlePickImage = async () => {
    // Pedir permissão para acessar a galeria
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
      console.log("[ServiceDetails] Imagem selecionada:", pickerResult.assets[0].uri);
    }
  };

  const handleFinalRegister = async () => {
    // Validação básica
    if (!experiencia.trim() || !servicosOferecidos.trim() || !estruturaPreco.trim() || !areasAtendimento.trim() || !anosExperiencia.trim()) {
      Alert.alert("Campos Obrigatórios", "Por favor, preencha todos os campos sobre seus serviços e experiência.");
      return;
    }
    if (isNaN(Number(anosExperiencia)) || Number(anosExperiencia) < 0) {
        Alert.alert("Valor Inválido", "Anos de experiência deve ser um número positivo.");
        return;
    }

    setIsSubmitting(true);
    const currentServiceDetails = {
      experiencia: experiencia.trim(),
      servicosOferecidos: servicosOferecidos.trim(),
      estruturaPreco: estruturaPreco.trim(),
      areasAtendimento: areasAtendimento.trim(),
      anosExperiencia: Number(anosExperiencia),
      avatarUri, // URI local da imagem, precisa ser feito upload para o backend
    };

    console.log("[ServiceDetails] Detalhes do Serviço Coletados:", currentServiceDetails);
    // TODO: Coletar 'personalDetails' do Contexto
    // const allRegistrationData = { ...personalDetails, ...currentServiceDetails };
    // console.log("[ServiceDetails] Dados Completos para Registro:", allRegistrationData);
    // TODO: Implementar lógica de upload do avatarUri para seu backend e obter a URL final
    // TODO: Chamar o authService.registerProvider(allRegistrationDataComAvatarUrlFinal);
    // try {
    //   await submitRegistration(currentServiceDetails); // Função do contexto que lida com tudo
    //   Alert.alert('Cadastro Concluído!', 'Seu perfil de profissional foi criado. Bem-vindo(a) ao LimpeJá! Você será redirecionado para o login.');
    //   router.replace('/(auth)/login'); 
    // } catch (error: any) {
    //   Alert.alert('Falha no Cadastro', error.message || 'Não foi possível finalizar seu cadastro.');
    // } finally {
    //   setIsSubmitting(false);
    // }

    // Simulação de sucesso
    setTimeout(() => {
      Alert.alert('Sucesso (Simulado)', 'Cadastro de profissional concluído! Por favor, faça o login.');
      router.replace('/(auth)/login'); // Limpa a pilha de cadastro e vai para login
      setIsSubmitting(false);
    }, 1500);
  };

  return (
    <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.keyboardAvoidingContainer}
    >
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
        <Stack.Screen options={{ title: 'Serviços e Experiência (3/X)' }} /> 
        {/* X = número total de etapas */}

        <View style={styles.headerSection}>
            <MaterialCommunityIcons name="briefcase-check-outline" size={48} color="#007AFF" style={styles.headerIcon} />
            <Text style={styles.mainTitle}>Detalhes dos Seus Serviços</Text>
            <Text style={styles.subtitle}>Conte-nos mais sobre sua experiência e os serviços que você oferece.</Text>
        </View>

        {/* Foto de Perfil */}
        <Text style={styles.label}>Foto de Perfil (Recomendado)</Text>
        <TouchableOpacity onPress={handlePickImage} style={styles.avatarPicker}>
          {avatarUri ? (
            <Image source={{ uri: avatarUri }} style={styles.avatarImage} />
          ) : (
            <View style={styles.avatarPlaceholder}>
              <Ionicons name="camera-outline" size={40} color="#ADB5BD" />
              <Text style={styles.avatarPlaceholderText}>Toque para escolher uma foto</Text>
            </View>
          )}
        </TouchableOpacity>

        {/* Descrição da Experiência */}
        <Text style={styles.label}>Descreva sua Experiência Profissional*</Text>
        <TextInput 
            style={[styles.input, styles.textArea]} 
            value={experiencia} 
            onChangeText={setExperiencia} 
            placeholder="Ex: Tenho 5 anos de experiência com limpeza residencial, sou detalhista e organizada..." 
            multiline 
            numberOfLines={4}
            maxLength={500}
        />

        {/* Anos de Experiência */}
        <Text style={styles.label}>Anos de Experiência*</Text>
        <View style={styles.inputContainer}>
            <Ionicons name="hourglass-outline" size={20} color="#8A8A8E" style={styles.inputIcon} />
            <TextInput style={styles.input} value={anosExperiencia} onChangeText={setAnosExperiencia} placeholder="Ex: 5" keyboardType="number-pad" maxLength={2}/>
        </View>

        {/* Principais Serviços Oferecidos */}
        <Text style={styles.label}>Principais Serviços Oferecidos*</Text>
        <TextInput 
            style={[styles.input, styles.textArea]} 
            value={servicosOferecidos} 
            onChangeText={setServicosOferecidos} 
            placeholder="Liste os serviços que você realiza (ex: Limpeza padrão, Limpeza pesada, Passar roupas, Limpeza de vidros, etc.)" 
            multiline 
            numberOfLines={3}
            maxLength={300}
        />

        {/* Estrutura de Preços */}
        <Text style={styles.label}>Sua Estrutura de Preços*</Text>
        <TextInput 
            style={[styles.input, styles.textArea]} 
            value={estruturaPreco} 
            onChangeText={setEstruturaPreco} 
            placeholder="Descreva como você cobra (ex: R$ XX por hora, preço fixo por tipo de limpeza, pacotes mensais, etc.)" 
            multiline 
            numberOfLines={3}
            maxLength={300}
        />
        
        {/* Áreas de Atendimento */}
        <Text style={styles.label}>Principais Áreas/Bairros de Atendimento*</Text>
        <TextInput 
            style={[styles.input, styles.textArea]} 
            value={areasAtendimento} 
            onChangeText={setAreasAtendimento} 
            placeholder="Ex: Cambuí, Centro (Campinas); Sumaré (cidade inteira)" 
            multiline 
            numberOfLines={3}
            maxLength={300}
        />

        {/* TODO: Opção para upload de documentos (RG, Comprovante de Residência, etc.) - Pode ser uma etapa posterior ou opcional aqui */}
        {/* <Text style={styles.label}>Documentos (Opcional nesta etapa)</Text> */}
        {/* <Button title="Anexar Documentos" onPress={() => Alert.alert("WIP", "Upload de documentos")} /> */}


        {/* Botões de Navegação */}
        <View style={styles.navigationButtons}>
            <TouchableOpacity style={[styles.navButton, styles.backButton]} onPress={() => router.back()} disabled={isSubmitting}>
                <Ionicons name="arrow-back-outline" size={20} color="#007AFF" />
                <Text style={styles.navButtonTextBack}>Voltar</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.navButton, styles.nextButton, isSubmitting && styles.nextButtonDisabled]} onPress={handleFinalRegister} disabled={isSubmitting}>
                {isSubmitting ? <ActivityIndicator color="#fff" /> : <Text style={styles.navButtonTextNext}>Finalizar Cadastro</Text>}
                <Ionicons name="checkmark-circle-outline" size={20} color="#fff" style={{marginLeft: 8}} />
            </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

// Estilos adaptados e melhorados
const styles = StyleSheet.create({
  keyboardAvoidingContainer: { flex: 1, backgroundColor: '#F8F9FA' },
  scrollView: { flex: 1 },
  container: { flexGrow: 1, paddingHorizontal: 25, paddingVertical: 20 },
  headerSection: { alignItems: 'center', marginBottom: 25, },
  headerIcon: { marginBottom: 10, },
  mainTitle: { fontSize: 24, fontWeight: 'bold', color: '#1C3A5F', textAlign: 'center', marginBottom: 8, },
  subtitle: { fontSize: 15, color: '#6C757D', textAlign: 'center', marginBottom: 20, paddingHorizontal:10 },
  label: { fontSize: 16, fontWeight: '600', color: '#495057', marginBottom: 8, marginTop: 15, },
  inputContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#CED4DA', borderRadius: 8, height: 50, paddingHorizontal: 12, marginBottom: 15, },
  inputIcon: { marginRight: 10, },
  input: { flex: 1, height: '100%', fontSize: 16, color: '#212529', paddingVertical: Platform.OS === 'ios' ? 12 : 0 }, // Ajuste de paddingVertical
  textArea: {
    minHeight: 100,
    height: 'auto', // Para crescer conforme o texto, mas com minHeight
    textAlignVertical: 'top',
    paddingTop: 12, // Padding interno para multiline
  },
  avatarPicker: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 130,
    height: 130,
    borderRadius: 65,
    backgroundColor: '#E9ECEF',
    borderColor: '#CED4DA',
    borderWidth: 1,
    alignSelf: 'center',
    marginBottom: 20,
    overflow: 'hidden', // Para a imagem não ultrapassar o borderRadius
  },
  avatarImage: {
    width: '100%',
    height: '100%',
  },
  avatarPlaceholderText: {
    fontSize: 13,
    color: '#6C757D',
    marginTop: 5,
    textAlign: 'center',
  },
  navigationButtons: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 30, marginBottom: 20 },
  navButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 14, paddingHorizontal: 20, borderRadius: 8, minWidth: 140, },
  backButton: { backgroundColor: '#E9ECEF', borderWidth:1, borderColor: '#CED4DA'},
  nextButton: { backgroundColor: '#28A745' }, // Verde para finalizar
  nextButtonDisabled: { backgroundColor: '#A5D6A7' },
  navButtonTextBack: { fontSize: 16, fontWeight: '600', color: '#007AFF', marginLeft: 5 },
  navButtonTextNext: { fontSize: 16, fontWeight: 'bold', color: '#FFFFFF', marginRight: 5 },
});