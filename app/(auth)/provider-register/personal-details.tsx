// LimpeJaApp/app/(auth)/provider-register/personal-details.tsx
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
} from 'react-native';
import { useRouter, Stack } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';

// TODO: Criar e usar um Contexto para o formulário de cadastro de provedor
// Exemplo: import { useProviderRegistration } from '../../../contexts/ProviderRegistrationContext';

export default function PersonalDetailsScreen() {
  const router = useRouter();
  // const { personalDetails, setPersonalDetails } = useProviderRegistration(); // Exemplo de uso do Contexto

  // Estados locais para os campos do formulário
  // No futuro, estes viriam/seriam salvos no ProviderRegistrationContext
  const [nomeCompleto, setNomeCompleto] = useState(''); // personalDetails.nomeCompleto || ''
  const [cpf, setCpf] = useState('');
  const [dataNascimento, setDataNascimento] = useState<Date | undefined>(undefined);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [telefone, setTelefone] = useState('');
  const [cep, setCep] = useState('');
  const [endereco, setEndereco] = useState('');
  const [numero, setNumero] = useState('');
  const [complemento, setComplemento] = useState('');
  const [bairro, setBairro] = useState('');
  const [cidade, setCidade] = useState('');
  const [estado, setEstado] = useState('');

  const [isSubmitting, setIsSubmitting] = useState(false);

  // Função para buscar endereço pelo CEP (placeholder)
  const fetchAddressFromCep = async (value: string) => {
    if (value.replace(/\D/g, '').length === 8) {
      console.log(`[PersonalDetails] Buscando CEP: ${value}`);
      // TODO: Implementar chamada à API de CEP (ex: ViaCEP)
      // Exemplo:
      // const response = await fetch(`https://viacep.com.br/ws/${value}/json/`);
      // const data = await response.json();
      // if (!data.erro) {
      //   setEndereco(data.logradouro);
      //   setBairro(data.bairro);
      //   setCidade(data.localidade);
      //   setEstado(data.uf);
      // } else {
      //   Alert.alert("CEP não encontrado.");
      // }
      Alert.alert("Busca de CEP", "Funcionalidade de busca de CEP a ser implementada.");
    }
  };

  const onDateChange = (event: DateTimePickerEvent, selectedDateValue?: Date) => {
    if (Platform.OS === 'android') {
        setShowDatePicker(false);
    }
    if (event.type === 'set' && selectedDateValue) {
      setDataNascimento(selectedDateValue);
    } else if (event.type === 'dismissed' && Platform.OS === 'ios') {
      setShowDatePicker(false);
    }
  };

  const handleNext = () => {
    // Validação básica
    if (!nomeCompleto.trim() || !cpf.trim() || !dataNascimento || !telefone.trim() || !cep.trim() || !endereco.trim() || !numero.trim() || !bairro.trim() || !cidade.trim() || !estado.trim()) {
      Alert.alert("Campos Obrigatórios", "Por favor, preencha todos os campos obrigatórios de dados pessoais e endereço.");
      return;
    }
    // TODO: Adicionar validações mais específicas (formato CPF, telefone, CEP, data)

    setIsSubmitting(true);
    const personalData = {
      nomeCompleto: nomeCompleto.trim(),
      cpf: cpf.trim().replace(/\D/g, ''), // Remove não dígitos
      dataNascimento: dataNascimento.toISOString().split('T')[0], // Formato YYYY-MM-DD
      telefone: telefone.trim().replace(/\D/g, ''),
      endereco: { cep: cep.trim().replace(/\D/g, ''), logradouro: endereco.trim(), numero: numero.trim(), complemento: complemento.trim(), bairro: bairro.trim(), cidade: cidade.trim(), estado: estado.trim().toUpperCase() }
    };

    console.log("[PersonalDetails] Dados Pessoais Coletados:", personalData);
    // TODO: Salvar 'personalData' no Contexto de Cadastro do Provedor
    // setPersonalDetails(personalData);

    // Simulação
    setTimeout(() => {
      setIsSubmitting(false);
      router.push('/(auth)/provider-register/service-details');
    }, 1000);
  };

  return (
    <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.keyboardAvoidingContainer}
    >
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
        <Stack.Screen options={{ title: 'Dados Pessoais (2/X)' }} /> 
        {/* X = número total de etapas */}

        <View style={styles.headerSection}>
            <Ionicons name="person-circle-outline" size={48} color="#007AFF" style={styles.headerIcon} />
            <Text style={styles.mainTitle}>Seus Dados Pessoais</Text>
            <Text style={styles.subtitle}>Precisamos de algumas informações para criar seu perfil de profissional.</Text>
        </View>

        {/* Nome Completo */}
        <Text style={styles.label}>Nome Completo*</Text>
        <View style={styles.inputContainer}>
            <Ionicons name="person-outline" size={20} color="#8A8A8E" style={styles.inputIcon} />
            <TextInput style={styles.input} value={nomeCompleto} onChangeText={setNomeCompleto} placeholder="Conforme seu documento" textContentType="name" autoComplete="name"/>
        </View>

        {/* CPF */}
        <Text style={styles.label}>CPF*</Text>
        <View style={styles.inputContainer}>
            <Ionicons name="document-text-outline" size={20} color="#8A8A8E" style={styles.inputIcon} />
            <TextInput style={styles.input} value={cpf} onChangeText={setCpf} placeholder="000.000.000-00" keyboardType="numeric" maxLength={14} /* TODO: Adicionar máscara */ />
        </View>
        
        {/* Data de Nascimento */}
        <Text style={styles.label}>Data de Nascimento*</Text>
        <TouchableOpacity style={styles.datePickerButton} onPress={() => setShowDatePicker(true)}>
            <Ionicons name="calendar-outline" size={20} color="#007AFF" style={styles.inputIcon} />
            <Text style={styles.datePickerButtonText}>
            {dataNascimento ? dataNascimento.toLocaleDateString('pt-BR') : "Toque para selecionar"}
            </Text>
        </TouchableOpacity>
        {showDatePicker && (
            <DateTimePicker
            value={dataNascimento || new Date(2000, 0, 1)} // Data padrão para o picker
            mode="date"
            display={Platform.OS === 'ios' ? "spinner" : "default"}
            onChange={onDateChange}
            maximumDate={new Date(new Date().setFullYear(new Date().getFullYear() - 18))} // Ex: mínimo 18 anos
            />
        )}

        {/* Telefone */}
        <Text style={styles.label}>Telefone para Contato*</Text>
        <View style={styles.inputContainer}>
            <Ionicons name="call-outline" size={20} color="#8A8A8E" style={styles.inputIcon} />
            <TextInput style={styles.input} value={telefone} onChangeText={setTelefone} placeholder="(XX) XXXXX-XXXX" keyboardType="phone-pad" textContentType="telephoneNumber" maxLength={15} />
        </View>

        {/* Endereço */}
        <Text style={styles.sectionHeader}>Endereço</Text>
        <Text style={styles.label}>CEP*</Text>
        <View style={styles.inputContainer}>
            <Ionicons name="map-outline" size={20} color="#8A8A8E" style={styles.inputIcon} />
            <TextInput style={styles.input} value={cep} onChangeText={setCep} placeholder="00000-000" keyboardType="numeric" maxLength={9} onBlur={() => fetchAddressFromCep(cep)} />
        </View>
        
        <Text style={styles.label}>Rua/Avenida*</Text>
        <TextInput style={styles.input} value={endereco} onChangeText={setEndereco} placeholder="Nome da sua rua ou avenida" textContentType="streetAddressLine1" />
        
        <Text style={styles.label}>Número*</Text>
        <TextInput style={styles.input} value={numero} onChangeText={setNumero} placeholder="Ex: 123 A" keyboardType="default" />
        
        <Text style={styles.label}>Complemento (opcional)</Text>
        <TextInput style={styles.input} value={complemento} onChangeText={setComplemento} placeholder="Apto, Bloco, Casa, etc." textContentType="streetAddressLine2" />

        <Text style={styles.label}>Bairro*</Text>
        <TextInput style={styles.input} value={bairro} onChangeText={setBairro} placeholder="Seu bairro" textContentType="sublocality" />

        <Text style={styles.label}>Cidade*</Text>
        <TextInput style={styles.input} value={cidade} onChangeText={setCidade} placeholder="Sua cidade" textContentType="addressCity" />
        
        <Text style={styles.label}>Estado* (UF)</Text>
        <TextInput style={styles.input} value={estado} onChangeText={setEstado} placeholder="Ex: SP" autoCapitalize="characters" maxLength={2} textContentType="addressState" />


        {/* Botões de Navegação */}
        <View style={styles.navigationButtons}>
            <TouchableOpacity style={[styles.navButton, styles.backButton]} onPress={() => router.back()} disabled={isSubmitting}>
                <Ionicons name="arrow-back-outline" size={20} color="#007AFF" />
                <Text style={styles.navButtonTextBack}>Voltar</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.navButton, styles.nextButton, isSubmitting && styles.nextButtonDisabled]} onPress={handleNext} disabled={isSubmitting}>
                {isSubmitting ? <ActivityIndicator color="#fff" /> : <Text style={styles.navButtonTextNext}>Próximo</Text>}
                <Ionicons name="arrow-forward-outline" size={20} color="#fff" />
            </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

// Estilos (adaptados da tela de ClientRegister e melhorados)
const styles = StyleSheet.create({
  keyboardAvoidingContainer: { flex: 1, backgroundColor: '#F8F9FA' },
  scrollView: { flex: 1 },
  container: { flexGrow: 1, paddingHorizontal: 25, paddingVertical: 20 },
  headerSection: { alignItems: 'center', marginBottom: 25, },
  headerIcon: { marginBottom: 10, },
  mainTitle: { fontSize: 24, fontWeight: 'bold', color: '#1C3A5F', textAlign: 'center', marginBottom: 8, },
  subtitle: { fontSize: 15, color: '#6C757D', textAlign: 'center', marginBottom: 20, paddingHorizontal:10 },
  sectionHeader: { fontSize: 20, fontWeight: 'bold', color: '#1C3A5F', marginTop: 25, marginBottom: 15, borderTopWidth:1, borderTopColor: '#DEE2E6', paddingTop: 20},
  label: { fontSize: 15, fontWeight: '600', color: '#495057', marginBottom: 7, marginTop: 10, },
  inputContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#CED4DA', borderRadius: 8, height: 50, paddingHorizontal: 12, marginBottom: 10, },
  inputIcon: { marginRight: 10, },
  input: { flex: 1, height: '100%', fontSize: 16, color: '#212529', },
  datePickerButton: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#CED4DA', borderRadius: 8, height: 50, paddingHorizontal: 12, marginBottom: 10, justifyContent: 'space-between' },
  datePickerButtonText: { fontSize: 16, color: '#212529', },
  navigationButtons: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 30, marginBottom: 20 },
  navButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 12, paddingHorizontal: 20, borderRadius: 8, minWidth: 120, },
  backButton: { backgroundColor: '#E9ECEF', borderWidth:1, borderColor: '#CED4DA'},
  nextButton: { backgroundColor: '#007AFF' },
  nextButtonDisabled: { backgroundColor: '#A0CFFF' },
  navButtonTextBack: { fontSize: 16, fontWeight: '600', color: '#007AFF', marginLeft: 5 },
  navButtonTextNext: { fontSize: 16, fontWeight: 'bold', color: '#FFFFFF', marginRight: 5 },
});