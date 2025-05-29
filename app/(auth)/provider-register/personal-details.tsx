// LimpeJaApp/app/(auth)/provider-register/personal-details.tsx
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
  Animated, // Importar Animated para animações
} from 'react-native';
import { useRouter, Stack } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { useProviderRegistration } from '../../../contexts/ProviderRegistrationContext'; // Importe o contexto

// Componente para exibir mensagens de erro inline
const ErrorMessage: React.FC<{ message: string | null }> = ({ message }) => {
  if (!message) return null;
  return <Text style={styles.errorMessage}>{message}</Text>;
};

// Simulação da API ViaCEP
// Em um ambiente real, você faria uma requisição HTTP para um serviço como ViaCEP.
const mockViaCepApi = {
  getEndereco: async (cep: string) => {
    // Remove caracteres não numéricos
    const cleanedCep = cep.replace(/\D/g, '');
    await new Promise(resolve => setTimeout(resolve, 800)); // Simula latência da rede

    if (cleanedCep === '01001000') { // CEP de exemplo para sucesso
      return {
        cep: '01001-000',
        logradouro: 'Praça da Sé',
        complemento: 'lado ímpar',
        bairro: 'Sé',
        localidade: 'São Paulo',
        uf: 'SP',
        erro: false,
      };
    } else if (cleanedCep === '99999999') { // CEP de exemplo para erro
      return { erro: true };
    } else if (cleanedCep === '60000000') { // Outro CEP de exemplo
      return {
        cep: '60000-000',
        logradouro: 'Avenida Beira Mar',
        complemento: '',
        bairro: 'Meireles',
        localidade: 'Fortaleza',
        uf: 'CE',
        erro: false,
      };
    }
    // Caso o CEP não seja nenhum dos mocks, simula não encontrado
    return { erro: true };
  },
};

export default function PersonalDetailsScreen() {
  const router = useRouter();
  // Utiliza o contexto de registro do provedor para gerenciar os dados
  const { personalDetails, setPersonalDetails } = useProviderRegistration();

  // Estados locais para os campos do formulário
  const [nomeCompleto, setNomeCompleto] = useState('');
  const [cpf, setCpf] = useState('');
  const [dataNascimento, setDataNascimento] = useState<Date | undefined>(undefined);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [telefone, setTelefone] = useState('');
  const [cep, setCep] = useState('');
  const [logradouro, setLogradouro] = useState('');
  const [numero, setNumero] = useState('');
  const [complemento, setComplemento] = useState('');
  const [bairro, setBairro] = useState('');
  const [cidade, setCidade] = useState('');
  const [estado, setEstado] = useState('');

  // Estados para mensagens de erro inline
  const [nomeCompletoError, setNomeCompletoError] = useState<string | null>(null);
  const [cpfError, setCpfError] = useState<string | null>(null);
  const [dataNascimentoError, setDataNascimentoError] = useState<string | null>(null);
  const [telefoneError, setTelefoneError] = useState<string | null>(null);
  const [cepError, setCepError] = useState<string | null>(null);
  const [logradouroError, setLogradouroError] = useState<string | null>(null);
  const [numeroError, setNumeroError] = useState<string | null>(null);
  const [bairroError, setBairroError] = useState<string | null>(null);
  const [cidadeError, setCidadeError] = useState<string | null>(null);
  const [estadoError, setEstadoError] = useState<string | null>(null);

  const [isLoadingCep, setIsLoadingCep] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Animações para os elementos da tela
  const headerAnim = useRef(new Animated.Value(0)).current;
  const inputSectionAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Preenche os campos com os dados do contexto se existirem
    if (personalDetails) {
      setNomeCompleto(personalDetails.nomeCompleto);
      setCpf(personalDetails.cpf);
      setDataNascimento(new Date(personalDetails.dataNascimento));
      setTelefone(personalDetails.telefone);
      setCep(personalDetails.endereco.cep);
      setLogradouro(personalDetails.endereco.logradouro);
      setNumero(personalDetails.endereco.numero);
      setComplemento(personalDetails.endereco.complemento);
      setBairro(personalDetails.endereco.bairro);
      setCidade(personalDetails.endereco.cidade);
      setEstado(personalDetails.endereco.estado);
    }

    // Inicia as animações de entrada
    Animated.stagger(200, [
      Animated.timing(headerAnim, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }),
      Animated.timing(inputSectionAnim, {
        toValue: 1,
        duration: 800,
        delay: 200, // Atraso para aparecer depois do cabeçalho
        useNativeDriver: true,
      }),
    ]).start();
  }, [personalDetails, headerAnim, inputSectionAnim]);

  // Função para formatar CPF e validar
  const handleCpfChange = (text: string) => {
    const cleanedText = text.replace(/\D/g, ''); // Remove não-dígitos
    let formattedCpf = cleanedText;
    if (cleanedText.length > 3) {
      formattedCpf = `${cleanedText.substring(0, 3)}.${cleanedText.substring(3)}`;
    }
    if (cleanedText.length > 6) {
      formattedCpf = `${formattedCpf.substring(0, 7)}.${cleanedText.substring(6)}`;
    }
    if (cleanedText.length > 9) {
      formattedCpf = `${formattedCpf.substring(0, 11)}-${cleanedText.substring(9)}`;
    }
    setCpf(formattedCpf.substring(0, 14)); // Limita ao tamanho do CPF formatado
    setCpfError(null); // Limpa erro ao digitar
  };

  // Função para formatar Telefone e validar
  const handleTelefoneChange = (text: string) => {
    const cleanedText = text.replace(/\D/g, ''); // Remove não-dígitos
    let formattedPhone = cleanedText;
    if (cleanedText.length > 0) formattedPhone = `(${cleanedText}`;
    if (cleanedText.length > 2) formattedPhone = `(${cleanedText.substring(0, 2)}) ${cleanedText.substring(2)}`;
    if (cleanedText.length > 7) formattedPhone = `${formattedPhone.substring(0, 9)}-${cleanedText.substring(7)}`;
    if (cleanedText.length > 11) formattedPhone = `${formattedPhone.substring(0, 15)}`; // (XX) XXXXX-XXXX
    setTelefone(formattedPhone.substring(0, 15));
    setTelefoneError(null);
  };

  // Função para formatar CEP e buscar endereço
  const handleCepChange = (text: string) => {
    const cleanedText = text.replace(/\D/g, '');
    setCep(cleanedText);
    setCepError(null);
  };

  const fetchAddressFromCep = async () => {
    const cleanedCep = cep.replace(/\D/g, '');
    if (cleanedCep.length === 8) {
      setIsLoadingCep(true);
      try {
        // @ts-ignore // Ignorando para a simulação, pois a estrutura de 'data' pode variar
        const data = await mockViaCepApi.getEndereco(cleanedCep);
        if (!data.erro) {
          setLogradouro(data.logradouro || ''); // << CORREÇÃO
          setBairro(data.bairro || '');       // << CORREÇÃO
          setCidade(data.localidade || '');   // << CORREÇÃO
          setEstado(data.uf || '');         // << CORREÇÃO
          setComplemento(data.complemento || '');
          setCepError(null);
        } else {
          setCepError("CEP não encontrado ou inválido.");
          setLogradouro(''); setNumero(''); setComplemento(''); setBairro(''); setCidade(''); setEstado('');
        }
      } catch (error) {
        setCepError("Erro ao buscar CEP. Tente novamente.");
        setLogradouro(''); setNumero(''); setComplemento(''); setBairro(''); setCidade(''); setEstado('');
      } finally {
        setIsLoadingCep(false);
      }
    } else if (cleanedCep.length > 0 && cleanedCep.length < 8) {
      setCepError("CEP incompleto.");
    }
  };

  const onDateChange = (event: DateTimePickerEvent, selectedDateValue?: Date) => {
    setShowDatePicker(Platform.OS === 'ios'); 
    if (event.type === 'set' && selectedDateValue) {
      setDataNascimento(selectedDateValue);
      setDataNascimentoError(null);
    }
  };

  const validateForm = () => {
    let isValid = true;
    if (!nomeCompleto.trim()) { setNomeCompletoError('Nome completo é obrigatório.'); isValid = false; } else { setNomeCompletoError(null); }
    if (!cpf.replace(/\D/g, '').match(/^\d{11}$/)) { setCpfError('CPF inválido.'); isValid = false; } else { setCpfError(null); }
    if (!dataNascimento) { setDataNascimentoError('Data de nascimento é obrigatória.'); isValid = false; } else { setDataNascimentoError(null); }
    if (!telefone.replace(/\D/g, '').match(/^\d{10,11}$/)) { setTelefoneError('Telefone inválido.'); isValid = false; } else { setTelefoneError(null); }
    if (!cep.replace(/\D/g, '').match(/^\d{8}$/)) { setCepError('CEP inválido.'); isValid = false; } else { setCepError(null); }
    if (!logradouro.trim()) { setLogradouroError('Logradouro é obrigatório.'); isValid = false; } else { setLogradouroError(null); }
    if (!numero.trim()) { setNumeroError('Número é obrigatório.'); isValid = false; } else { setNumeroError(null); }
    if (!bairro.trim()) { setBairroError('Bairro é obrigatório.'); isValid = false; } else { setBairroError(null); }
    if (!cidade.trim()) { setCidadeError('Cidade é obrigatória.'); isValid = false; } else { setCidadeError(null); }
    if (!estado.trim().match(/^[A-Z]{2}$/)) { setEstadoError('Estado inválido (ex: SP).'); isValid = false; } else { setEstadoError(null); }
    return isValid;
  };

  const handleNext = () => {
    if (!validateForm()) {
      Alert.alert("Campos Inválidos", "Por favor, corrija os erros nos campos antes de prosseguir.");
      return;
    }

    setIsSubmitting(true);
    const personalData = {
      nomeCompleto: nomeCompleto.trim(),
      cpf: cpf.replace(/\D/g, ''),
      dataNascimento: dataNascimento!.toISOString().split('T')[0],
      telefone: telefone.replace(/\D/g, ''),
      endereco: {
        cep: cep.replace(/\D/g, ''),
        logradouro: logradouro.trim(),
        numero: numero.trim(),
        complemento: complemento.trim(),
        bairro: bairro.trim(),
        cidade: cidade.trim(),
        estado: estado.trim().toUpperCase(),
      },
    };

    setPersonalDetails(personalData);

    setTimeout(() => {
      setIsSubmitting(false);
      router.push('/(auth)/provider-register/service-details');
    }, 800);
  };

  const headerAnimatedStyle = {
    opacity: headerAnim,
    transform: [{ translateY: headerAnim.interpolate({ inputRange: [0, 1], outputRange: [20, 0] }) }],
  };

  const inputSectionAnimatedStyle = {
    opacity: inputSectionAnim,
    transform: [{ scale: inputSectionAnim.interpolate({ inputRange: [0, 1], outputRange: [0.98, 1] }) }],
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={styles.keyboardAvoidingContainer}
    >
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.container}
        keyboardShouldPersistTaps="handled"
      >
        <Stack.Screen options={{ title: 'Dados Pessoais (Etapa 2)' }} />

        <Animated.View style={[styles.headerSection, headerAnimatedStyle]}>
          <Ionicons name="person-circle-outline" size={60} color="#007AFF" style={styles.headerIcon} />
          <Text style={styles.mainTitle}>Seus Dados Pessoais</Text>
          <Text style={styles.subtitle}>Precisamos de algumas informações para criar seu perfil de profissional.</Text>
        </Animated.View>

        <Animated.View style={[styles.inputSection, inputSectionAnimatedStyle]}>
          <Text style={styles.label}>Nome Completo *</Text>
          <View style={styles.inputContainer}>
            <Ionicons name="person-outline" size={18} color="#8A8A8E" style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="Conforme seu documento"
              value={nomeCompleto}
              onChangeText={setNomeCompleto}
              onBlur={() => setNomeCompletoError(nomeCompleto.trim() ? null : 'Nome completo é obrigatório.')}
              textContentType="name"
              autoComplete="name"
            />
          </View>
          <ErrorMessage message={nomeCompletoError} />

          <Text style={styles.label}>CPF *</Text>
          <View style={styles.inputContainer}>
            <Ionicons name="document-text-outline" size={20} color="#8A8A8E" style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="000.000.000-00"
              value={cpf}
              onChangeText={handleCpfChange}
              onBlur={() => setCpfError(cpf.replace(/\D/g, '').match(/^\d{11}$/) ? null : 'CPF inválido.')}
              keyboardType="numeric"
              maxLength={14}
            />
          </View>
          <ErrorMessage message={cpfError} />

          <Text style={styles.label}>Data de Nascimento *</Text>
          <TouchableOpacity style={styles.datePickerButton} onPress={() => setShowDatePicker(true)}>
            <Ionicons name="calendar-outline" size={20} color="#007AFF" style={styles.inputIcon} />
            <Text style={styles.datePickerButtonText}>
              {dataNascimento ? dataNascimento.toLocaleDateString('pt-BR') : "Toque para selecionar"}
            </Text>
            <Ionicons name="chevron-down-outline" size={20} color="#8A8A8E" />
          </TouchableOpacity>
          {showDatePicker && (
            <DateTimePicker
              value={dataNascimento || new Date(2000, 0, 1)}
              mode="date"
              display={Platform.OS === 'ios' ? "spinner" : "default"}
              onChange={onDateChange}
              maximumDate={new Date(new Date().setFullYear(new Date().getFullYear() - 18))}
            />
          )}
          <ErrorMessage message={dataNascimentoError} />

          <Text style={styles.label}>Telefone para Contato *</Text>
          <View style={styles.inputContainer}>
            <Ionicons name="call-outline" size={20} color="#8A8A8E" style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="(XX) XXXXX-XXXX"
              value={telefone}
              onChangeText={handleTelefoneChange}
              onBlur={() => setTelefoneError(telefone.replace(/\D/g, '').match(/^\d{10,11}$/) ? null : 'Telefone inválido.')}
              keyboardType="phone-pad"
              textContentType="telephoneNumber"
              maxLength={15}
            />
          </View>
          <ErrorMessage message={telefoneError} />

          <Text style={styles.sectionHeader}>Endereço</Text>

          <Text style={styles.label}>CEP *</Text>
          <View style={styles.inputContainer}>
            <Ionicons name="map-outline" size={20} color="#8A8A8E" style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="00000-000"
              value={cep}
              onChangeText={handleCepChange}
              onBlur={fetchAddressFromCep}
              keyboardType="numeric"
              maxLength={9}
            />
            {isLoadingCep && <ActivityIndicator size="small" color="#007AFF" style={styles.activityIndicator} />}
          </View>
          <ErrorMessage message={cepError} />

          <Text style={styles.label}>Logradouro *</Text>
          <TextInput // Input para Logradouro
            style={[styles.input, styles.textInputStyle]} // Aplicando estilo base e específico
            placeholder="Nome da sua rua ou avenida"
            value={logradouro}
            onChangeText={setLogradouro}
            onBlur={() => setLogradouroError(logradouro.trim() ? null : 'Logradouro é obrigatório.')}
            textContentType="streetAddressLine1"
            editable={!isLoadingCep && cep.replace(/\D/g, '').length === 8}
          />
          <ErrorMessage message={logradouroError} />

          <Text style={styles.label}>Número *</Text>
          <TextInput // Input para Número
            style={[styles.input, styles.textInputStyle]} // Aplicando estilo base e específico
            placeholder="Ex: 123 A"
            value={numero}
            onChangeText={setNumero}
            onBlur={() => setNumeroError(numero.trim() ? null : 'Número é obrigatório.')}
            keyboardType="default"
            editable={!isLoadingCep && cep.replace(/\D/g, '').length === 8}
          />
          <ErrorMessage message={numeroError} />

          <Text style={styles.label}>Complemento (opcional)</Text>
          <TextInput // Input para Complemento
            style={[styles.input, styles.textInputStyle]} // Aplicando estilo base e específico
            placeholder="Apto, Bloco, Casa, etc."
            value={complemento}
            onChangeText={setComplemento}
            textContentType="streetAddressLine2"
            editable={!isLoadingCep && cep.replace(/\D/g, '').length === 8}
          />

          <Text style={styles.label}>Bairro *</Text>
          <TextInput // Input para Bairro
            style={[styles.input, styles.textInputStyle]} // Aplicando estilo base e específico
            placeholder="Seu bairro"
            value={bairro}
            onChangeText={setBairro}
            onBlur={() => setBairroError(bairro.trim() ? null : 'Bairro é obrigatório.')}
            textContentType="sublocality"
            editable={!isLoadingCep && cep.replace(/\D/g, '').length === 8}
          />
          <ErrorMessage message={bairroError} />

          <Text style={styles.label}>Cidade *</Text>
          <TextInput // Input para Cidade
            style={[styles.input, styles.textInputStyle]} // Aplicando estilo base e específico
            placeholder="Sua cidade"
            value={cidade}
            onChangeText={setCidade}
            onBlur={() => setCidadeError(cidade.trim() ? null : 'Cidade é obrigatória.')}
            textContentType="addressCity"
            editable={!isLoadingCep && cep.replace(/\D/g, '').length === 8}
          />
          <ErrorMessage message={cidadeError} />

          <Text style={styles.label}>Estado * (UF)</Text>
          <TextInput // Input para Estado
            style={[styles.input, styles.textInputStyle]} // Aplicando estilo base e específico
            placeholder="Ex: SP"
            value={estado}
            onChangeText={setEstado}
            onBlur={() => setEstadoError(estado.trim().match(/^[A-Z]{2}$/) ? null : 'Estado inválido (ex: SP).')}
            autoCapitalize="characters"
            maxLength={2}
            textContentType="addressState"
            editable={!isLoadingCep && cep.replace(/\D/g, '').length === 8}
          />
          <ErrorMessage message={estadoError} />
        </Animated.View>

        <View style={styles.navigationButtons}>
          <TouchableOpacity style={[styles.navButton, styles.backButton]} onPress={() => router.back()} disabled={isSubmitting}>
            <Ionicons name="arrow-back-outline" size={20} color="#007AFF" />
            <Text style={styles.navButtonTextBack}>Voltar</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.navButton, styles.nextButton, isSubmitting && styles.nextButtonDisabled]}
            onPress={handleNext}
            disabled={isSubmitting}
          >
            {isSubmitting ? <ActivityIndicator color="#fff" /> : <Text style={styles.navButtonTextNext}>Próximo</Text>}
            <Ionicons name="arrow-forward-outline" size={20} color="#fff" style={{ marginLeft: 8 }} />
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
  inputSection: {
    // Estilos para animação da seção de inputs
  },
  sectionHeader: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1C3A5F',
    marginTop: 25,
    marginBottom: 15,
    borderTopWidth: 1,
    borderTopColor: '#DEE2E6',
    paddingTop: 20,
  },
  label: { fontSize: 15, fontWeight: '600', color: '#495057', marginBottom: 7, marginTop: 12 },
  inputContainer: { // Estilo para inputs que já têm um ícone dentro (CPF, Telefone, CEP)
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#CED4DA',
    borderRadius: 10,
    height: 52,
    paddingHorizontal: 12,
    marginBottom: 0, // Removido para que o ErrorMessage controle o espaçamento
  },
  textInputStyle: { // Estilo base para TextInputs que não estão em um inputContainer com ícone
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#CED4DA',
    borderRadius: 10,
    height: 52,
    paddingHorizontal: 15, // Padding um pouco maior pois não tem ícone
    fontSize: 16,
    color: '#212529',
    marginBottom: 0, // Removido para que o ErrorMessage controle o espaçamento
    ...Platform.select({ // Adiciona sombra igual aos inputContainers
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
  input: { flex: 1, height: '100%', fontSize: 16, color: '#212529' }, // Usado nos TextInputs dentro de inputContainer
  errorMessage: {
    color: '#D32F2F',
    fontSize: 12,
    marginTop: 4, // Pequeno espaço acima da mensagem de erro
    marginBottom: 10, // Espaço abaixo da mensagem de erro
    marginLeft: 5,
  },
  datePickerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#CED4DA',
    borderRadius: 10,
    height: 52,
    paddingHorizontal: 12,
    marginBottom: 0, // Removido para que o ErrorMessage controle o espaçamento
    justifyContent: 'space-between',
    ...Platform.select({ // Adiciona sombra igual aos inputContainers
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
  datePickerButtonText: { fontSize: 16, color: '#212529', flex:1 }, // flex:1 para ocupar espaço
  activityIndicator: { marginLeft: 10 },
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
  nextButton: { backgroundColor: '#007AFF' },
  nextButtonDisabled: { backgroundColor: '#A0CFFF', elevation: 0, shadowOpacity: 0 },
  navButtonTextBack: { fontSize: 16, fontWeight: '600', color: '#007AFF', marginLeft: 5 },
  navButtonTextNext: { fontSize: 17, fontWeight: 'bold', color: '#FFFFFF', marginRight: 5 },
});