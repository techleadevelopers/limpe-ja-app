// LimpeJaApp/app/(auth)/provider-register/personal-details.tsx
import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Alert,
  TouchableOpacity,
  ScrollView,
  Platform,
  KeyboardAvoidingView,
  ActivityIndicator,
  Animated,
} from 'react-native';
import { useRouter, Stack } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useProviderRegistration } from '../../../contexts/ProviderRegistrationContext';

// Importando os novos componentes
import { InputWithIcon } from './components/InputWithIcon';
import { StandardInput } from './components/StandardInput';
import { DatePickerInput } from './components/DatePickerInput';
import { SectionHeader } from './components/SectionHeader';

// Simulação da API ViaCEP
// Mover esta mock para app/(auth)/api/addressService.ts conforme a documentação
const mockViaCepApi = {
  getEndereco: async (cep: string) => {
    const cleanedCep = cep.replace(/\D/g, '');
    await new Promise(resolve => setTimeout(resolve, 800)); // Simula latência da rede

    if (cleanedCep === '01001000') {
      return {
        cep: '01001-000',
        logradouro: 'Praça da Sé',
        complemento: 'lado ímpar',
        bairro: 'Sé',
        localidade: 'São Paulo',
        uf: 'SP',
        erro: false,
      };
    } else if (cleanedCep === '99999999') {
      return { erro: true };
    } else if (cleanedCep === '60000000') {
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
    return { erro: true };
  },
};

export default function PersonalDetailsScreen() {
  const router = useRouter();
  const { personalDetails, setPersonalDetails } = useProviderRegistration();

  const [nomeCompleto, setNomeCompleto] = useState('');
  const [cpf, setCpf] = useState('');
  const [dataNascimento, setDataNascimento] = useState<Date | undefined>(undefined);
  const [telefone, setTelefone] = useState('');
  const [cep, setCep] = useState('');
  const [logradouro, setLogradouro] = useState('');
  const [numero, setNumero] = useState('');
  const [complemento, setComplemento] = useState('');
  const [bairro, setBairro] = useState('');
  const [cidade, setCidade] = useState('');
  const [estado, setEstado] = useState('');

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

  // Animation for the header section
  const headerAnimatedOpacity = useRef(new Animated.Value(0)).current;
  const headerAnimatedTranslateY = useRef(new Animated.Value(20)).current;

  useEffect(() => {
    // Fill fields from context
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

    // Start header animations
    Animated.parallel([
      Animated.timing(headerAnimatedOpacity, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }),
      Animated.timing(headerAnimatedTranslateY, {
        toValue: 0,
        duration: 600,
        useNativeDriver: true,
      }),
    ]).start();
  }, [personalDetails]);

  // Function to format CPF and validate
  const handleCpfChange = (text: string) => {
    const cleanedText = text.replace(/\D/g, '');
    let formattedCpf = cleanedText;
    if (cleanedText.length > 3) formattedCpf = `${cleanedText.substring(0, 3)}.${cleanedText.substring(3)}`;
    if (cleanedText.length > 6) formattedCpf = `${formattedCpf.substring(0, 7)}.${cleanedText.substring(6)}`;
    if (cleanedText.length > 9) formattedCpf = `${formattedCpf.substring(0, 11)}-${cleanedText.substring(9)}`;
    setCpf(formattedCpf.substring(0, 14));
    setCpfError(null);
  };

  // Function to format Phone and validate
  const handleTelefoneChange = (text: string) => {
    const cleanedText = text.replace(/\D/g, '');
    let formattedPhone = cleanedText;
    if (cleanedText.length > 0) formattedPhone = `(${cleanedText}`;
    if (cleanedText.length > 2) formattedPhone = `(${cleanedText.substring(0, 2)}) ${cleanedText.substring(2)}`;
    if (cleanedText.length > 7) formattedPhone = `${formattedPhone.substring(0, 9)}-${cleanedText.substring(7)}`;
    if (cleanedText.length > 11) formattedPhone = `${formattedPhone.substring(0, 15)}`;
    setTelefone(formattedPhone.substring(0, 15));
    setTelefoneError(null);
  };

  // Function to format CEP and fetch address
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
        const data = await mockViaCepApi.getEndereco(cleanedCep);
        if (!data.erro) {
          setLogradouro(data.logradouro || '');
          setBairro(data.bairro || '');
          setCidade(data.localidade || '');
          setEstado(data.uf || '');
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

  const onDateChange = (selectedDateValue?: Date) => {
    setDataNascimento(selectedDateValue);
    setDataNascimentoError(null);
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
    opacity: headerAnimatedOpacity,
    transform: [{ translateY: headerAnimatedTranslateY }],
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

        <View>
          <InputWithIcon
            label="Nome Completo *"
            iconName="person-outline"
            placeholder="Conforme seu documento"
            value={nomeCompleto}
            onChangeText={setNomeCompleto}
            onBlur={() => setNomeCompletoError(nomeCompleto.trim() ? null : 'Nome completo é obrigatório.')}
            textContentType="name"
            autoComplete="name"
            errorMessage={nomeCompletoError}
            animationDelay={0} // Staggered animation delay
          />

          <InputWithIcon
            label="CPF *"
            iconName="document-text-outline"
            placeholder="000.000.000-00"
            value={cpf}
            onChangeText={handleCpfChange}
            onBlur={() => setCpfError(cpf.replace(/\D/g, '').match(/^\d{11}$/) ? null : 'CPF inválido.')}
            keyboardType="numeric"
            maxLength={14}
            errorMessage={cpfError}
            animationDelay={50} // Staggered animation delay
          />

          <DatePickerInput
            label="Data de Nascimento *"
            value={dataNascimento}
            onChange={onDateChange}
            maximumDate={new Date(new Date().setFullYear(new Date().getFullYear() - 18))}
            errorMessage={dataNascimentoError}
            animationDelay={100} // Staggered animation delay
          />

          <InputWithIcon
            label="Telefone para Contato *"
            iconName="call-outline"
            placeholder="(XX) XXXXX-XXXX"
            value={telefone}
            onChangeText={handleTelefoneChange}
            onBlur={() => setTelefoneError(telefone.replace(/\D/g, '').match(/^\d{10,11}$/) ? null : 'Telefone inválido.')}
            keyboardType="phone-pad"
            textContentType="telephoneNumber"
            maxLength={15}
            errorMessage={telefoneError}
            animationDelay={150} // Staggered animation delay
          />

          <SectionHeader title="Endereço" animationDelay={200} />

          <InputWithIcon
            label="CEP *"
            iconName="map-outline"
            placeholder="00000-000"
            value={cep}
            onChangeText={handleCepChange}
            onBlur={fetchAddressFromCep}
            keyboardType="numeric"
            maxLength={9}
            errorMessage={cepError}
            animationDelay={250} // Staggered animation delay
            rightComponent={isLoadingCep ? <ActivityIndicator size="small" color="#007AFF" style={styles.activityIndicator} /> : null}
          />

          <StandardInput
            label="Logradouro *"
            placeholder="Nome da sua rua ou avenida"
            value={logradouro}
            onChangeText={setLogradouro}
            onBlur={() => setLogradouroError(logradouro.trim() ? null : 'Logradouro é obrigatório.')}
            textContentType="streetAddressLine1"
            editable={!isLoadingCep && cep.replace(/\D/g, '').length === 8}
            errorMessage={logradouroError}
            animationDelay={300} // Staggered animation delay
          />

          <StandardInput
            label="Número *"
            placeholder="Ex: 123 A"
            value={numero}
            onChangeText={setNumero}
            onBlur={() => setNumeroError(numero.trim() ? null : 'Número é obrigatório.')}
            keyboardType="default"
            editable={!isLoadingCep && cep.replace(/\D/g, '').length === 8}
            errorMessage={numeroError}
            animationDelay={350} // Staggered animation delay
          />

          <StandardInput
            label="Complemento (opcional)"
            placeholder="Apto, Bloco, Casa, etc."
            value={complemento}
            onChangeText={setComplemento}
            textContentType="streetAddressLine2"
            editable={!isLoadingCep && cep.replace(/\D/g, '').length === 8}
            animationDelay={400} // Staggered animation delay
          />

          <StandardInput
            label="Bairro *"
            placeholder="Seu bairro"
            value={bairro}
            onChangeText={setBairro}
            onBlur={() => setBairroError(bairro.trim() ? null : 'Bairro é obrigatório.')}
            textContentType="sublocality"
            editable={!isLoadingCep && cep.replace(/\D/g, '').length === 8}
            errorMessage={bairroError}
            animationDelay={450} // Staggered animation delay
          />

          <StandardInput
            label="Cidade *"
            placeholder="Sua cidade"
            value={cidade}
            onChangeText={setCidade}
            onBlur={() => setCidadeError(cidade.trim() ? null : 'Cidade é obrigatória.')}
            textContentType="addressCity"
            editable={!isLoadingCep && cep.replace(/\D/g, '').length === 8}
            errorMessage={cidadeError}
            animationDelay={500} // Staggered animation delay
          />

          <StandardInput
            label="Estado * (UF)"
            placeholder="Ex: SP"
            value={estado}
            onChangeText={setEstado}
            onBlur={() => setEstadoError(estado.trim().match(/^[A-Z]{2}$/) ? null : 'Estado inválido (ex: SP).')}
            autoCapitalize="characters"
            maxLength={2}
            textContentType="addressState"
            editable={!isLoadingCep && cep.replace(/\D/g, '').length === 8}
            errorMessage={estadoError}
            animationDelay={550} // Staggered animation delay
          />
        </View>

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