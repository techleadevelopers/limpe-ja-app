// LimpeJaApp/app/(auth)/test-connection.tsx
import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, TextInput, Button, ScrollView, StyleSheet, Alert } from 'react-native';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { jwtDecode } from 'jwt-decode';

// Importe os DTOs do seu caminho correto
import {
  LoginDto,
  RegisterClientDto,
  RegisterProviderDto,
  ForgotPasswordDto,
  AuthResponseDto,
  MessageResponseDto,
} from '../types/backend/auth'; // Ajuste o caminho se necessário

// Acessa a variável de ambiente configurada no .env
const API_BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL;

const TestConnectionScreen = () => {
  const [loading, setLoading] = useState(false);
  const [response, setResponse] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [currentJwt, setCurrentJwt] = useState<string | null>(null);
  const [currentUserInfo, setCurrentUserInfo] = useState<any>(null);

  // Test Data
  const [testEmail, setTestEmail] = useState('paulo.test@gmail.com');
  const [testPassword, setTestPassword] = useState('password123');
  const [testFullName, setTestFullName] = useState('Paulo Teste');
  const [testPhone, setTestPhone] = useState('11987654321');
  const [testCpf, setTestCpf] = useState('123.456.789-00');
  const [testDateOfBirth, setTestDateOfBirth] = useState('1990-01-01');
  const [testYearsOfExperience, setTestYearsOfExperience] = useState('5');
  const [testAvatarUrl, setTestAvatarUrl] = useState('http://example.com/avatar.jpg');

  // Address Data
  const [testCep, setTestCep] = useState('13026001');
  const [testStreet, setTestStreet] = useState('Rua Uruguaiana');
  const [testNumber, setTestNumber] = useState('922');
  const [testComplement, setTestComplement] = useState('Casa');
  const [testNeighborhood, setTestNeighborhood] = useState('Centro');
  const [testCity, setTestCity] = useState('Campinas');
  const [testState, setTestState] = useState('SP');

  const makeRequest = useCallback(async (method: 'get' | 'post', path: string, data?: any) => {
    setLoading(true);
    setResponse(null);
    setError(null);
    try {
      const res = await axios({
        method,
        url: `${API_BASE_URL}${path}`,
        data,
        headers: currentJwt ? { 'Authorization': `Bearer ${currentJwt}` } : {},
      });
      setResponse(JSON.stringify(res.data, null, 2));

      // If it's login/registration, update the JWT locally
      if (path.includes('/auth/login') || path.includes('/auth/register')) {
        const authResponse: AuthResponseDto = res.data;
        // ADICIONADO: console.log para verificar o valor do token antes de salvar
        console.log('--- Debug test-connection.tsx ---');
        console.log('Valor de authResponse.access_token antes de salvar no AsyncStorage:', authResponse.access_token);
        console.log('---------------------------------');

        if (authResponse.access_token) { // Adicionado um if para garantir que o token não é null/undefined
          await AsyncStorage.setItem('auth_token', authResponse.access_token);
          setCurrentJwt(authResponse.access_token);
          const decoded: any = jwtDecode(authResponse.access_token);
          setCurrentUserInfo(decoded);
          Alert.alert("Sucesso", "Token JWT armazenado e usuário logado!");
        } else {
          console.error('Erro: access_token é undefined ou nulo na resposta da API para login/registro.');
          setError('Erro: Token de acesso não recebido.');
        }
      }
    } catch (err: any) {
      console.error(`Erro na requisição ${path}:`, err);
      if (err.response) {
        setError(`Erro do servidor (${err.response.status}): ${err.response.data.message || JSON.stringify(err.response.data)}`);
      } else if (err.request) {
        setError("Nenhuma resposta do servidor. Verifique se o backend está rodando e o CORS configurado.");
      } else {
        setError(`Erro ao configurar requisição: ${err.message}`);
      }
    } finally {
      setLoading(false);
    }
  }, [currentJwt, API_BASE_URL]);

  useEffect(() => {
    const loadJwt = async () => {
      const token = await AsyncStorage.getItem('auth_token');
      setCurrentJwt(token);
      if (token) {
        try {
          const decoded: any = jwtDecode(token);
          setCurrentUserInfo(decoded);
        } catch (e) {
          console.error("Erro ao decodificar JWT armazenado:", e);
          setCurrentUserInfo(null);
          // Opcional: Remover token inválido
          await AsyncStorage.removeItem('auth_token');
        }
      } else {
        setCurrentUserInfo(null);
      }
    };
    loadJwt();
  }, [loading]); // Recarrega o JWT sempre que uma operação termina

  const testRegisterClient = () => {
    const data: RegisterClientDto = {
      email: testEmail,
      password: testPassword,
      fullName: testFullName,
      phone: testPhone,
      address: {
        cep: testCep,
        street: testStreet,
        number: testNumber,
        complement: testComplement,
        neighborhood: testNeighborhood,
        city: testCity,
        state: testState,
      },
    };
    makeRequest('post', '/auth/register/client', data);
  };

  const testRegisterProvider = () => {
    const data: RegisterProviderDto = {
      email: testEmail,
      password: testPassword,
      fullName: testFullName,
      cpf: testCpf,
      dateOfBirth: testDateOfBirth,
      phone: testPhone,
      address: {
        cep: testCep,
        street: testStreet,
        number: testNumber,
        complement: testComplement,
        neighborhood: testNeighborhood,
        city: testCity,
        state: testState,
      },
      yearsOfExperience: parseInt(testYearsOfExperience),
      avatarUrl: testAvatarUrl,
    };
    makeRequest('post', '/auth/register/provider', data);
  };

  const testLogin = () => {
    const data: LoginDto = {
      email: testEmail,
      password: testPassword,
    };
    makeRequest('post', '/auth/login', data);
  };

  const testForgotPassword = () => {
    const data: ForgotPasswordDto = {
      email: testEmail,
    };
    makeRequest('post', '/auth/forgot-password', data);
  };

  const testGetProfile = () => {
    makeRequest('get', '/auth/profile');
  };

  const testLogout = async () => {
    setLoading(true);
    setResponse(null);
    setError(null);
    try {
      await AsyncStorage.removeItem('auth_token');
      setCurrentJwt(null);
      setCurrentUserInfo(null);
      Alert.alert("Sucesso", "Logout realizado. Token removido.");
    } catch (e: any) {
      setError(`Erro ao fazer logout: ${e.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Testes de Conexão e Autenticação</Text>

      <Text style={styles.label}>Email:</Text>
      <TextInput style={styles.input} value={testEmail} onChangeText={setTestEmail} keyboardType="email-address" />

      <Text style={styles.label}>Senha:</Text>
      <TextInput style={styles.input} value={testPassword} onChangeText={setTestPassword} secureTextEntry />

      <Text style={styles.label}>Nome Completo:</Text>
      <TextInput style={styles.input} value={testFullName} onChangeText={setTestFullName} />

      <Text style={styles.label}>Telefone:</Text>
      <TextInput style={styles.input} value={testPhone} onChangeText={setTestPhone} keyboardType="phone-pad" />

      <Text style={styles.label}>CPF (Provedor):</Text>
      <TextInput style={styles.input} value={testCpf} onChangeText={setTestCpf} />

      <Text style={styles.label}>Data de Nascimento (Provedor - YYYY-MM-DD):</Text>
      <TextInput style={styles.input} value={testDateOfBirth} onChangeText={setTestDateOfBirth} />

      <Text style={styles.label}>Anos de Experiência (Provedor):</Text>
      <TextInput style={styles.input} value={testYearsOfExperience} onChangeText={setTestYearsOfExperience} keyboardType="numeric" />

      <Text style={styles.label}>URL Avatar (Provedor):</Text>
      <TextInput style={styles.input} value={testAvatarUrl} onChangeText={setTestAvatarUrl} />

      <Text style={styles.sectionTitle}>Dados de Endereço</Text>
      <Text style={styles.label}>CEP:</Text>
      <TextInput style={styles.input} value={testCep} onChangeText={setTestCep} keyboardType="numeric" />
      <Text style={styles.label}>Rua:</Text>
      <TextInput style={styles.input} value={testStreet} onChangeText={setTestStreet} />
      <Text style={styles.label}>Número:</Text>
      <TextInput style={styles.input} value={testNumber} onChangeText={setTestNumber} keyboardType="numeric" />
      <Text style={styles.label}>Complemento:</Text>
      <TextInput style={styles.input} value={testComplement} onChangeText={setTestComplement} />
      <Text style={styles.label}>Bairro:</Text>
      <TextInput style={styles.input} value={testNeighborhood} onChangeText={setTestNeighborhood} />
      <Text style={styles.label}>Cidade:</Text>
      <TextInput style={styles.input} value={testCity} onChangeText={setTestCity} />
      <Text style={styles.label}>Estado (UF):</Text>
      <TextInput style={styles.input} value={testState} onChangeText={setTestState} />

      <View style={styles.buttonContainer}>
        <Button title="Registrar Cliente" onPress={testRegisterClient} disabled={loading} />
        <Button title="Registrar Provedor" onPress={testRegisterProvider} disabled={loading} />
        <Button title="Login" onPress={testLogin} disabled={loading} />
        <Button title="Esqueceu Senha" onPress={testForgotPassword} disabled={loading} />
        <Button title="Obter Perfil (Protegido)" onPress={testGetProfile} disabled={loading} />
        <Button title="Logout" onPress={testLogout} disabled={loading} />
      </View>

      {loading && <Text style={styles.loading}>Carregando...</Text>}
      {error && <Text style={styles.error}>{error}</Text>}
      {response && (
        <View style={styles.responseContainer}>
          <Text style={styles.responseText}>Resposta da API:</Text>
          <Text style={styles.responseContent}>{response}</Text>
        </View>
      )}

      <View style={styles.userInfoContainer}>
        <Text style={styles.userInfoTitle}>Informações do JWT (Decodificado):</Text>
        <Text style={styles.userInfoText}>JWT: {currentJwt ? currentJwt.substring(0, 30) + '...' : 'Nenhum'}</Text>
        <Text style={styles.userInfoText}>Email: {currentUserInfo?.email || 'N/A'}</Text>
        <Text style={styles.userInfoText}>Role: {currentUserInfo?.role || 'N/A'}</Text>
        <Text style={styles.userInfoText}>ID: {currentUserInfo?.sub || 'N/A'}</Text>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#f5f5f5',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginTop: 20,
    marginBottom: 10,
  },
  label: {
    fontSize: 16,
    marginBottom: 5,
    marginTop: 10,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    padding: 10,
    borderRadius: 5,
    marginBottom: 10,
    backgroundColor: '#fff',
  },
  buttonContainer: {
    marginTop: 20,
    marginBottom: 20,
    gap: 10, // Espaçamento entre os botões
  },
  loading: {
    textAlign: 'center',
    marginTop: 10,
    fontSize: 16,
    color: 'blue',
  },
  error: {
    color: 'red',
    marginTop: 10,
    textAlign: 'center',
    fontSize: 16,
  },
  responseContainer: {
    backgroundColor: '#e0e0e0',
    padding: 15,
    borderRadius: 5,
    marginTop: 20,
  },
  responseText: {
    fontWeight: 'bold',
    marginBottom: 5,
  },
  responseContent: {
    fontFamily: 'monospace',
    fontSize: 12,
  },
  userInfoContainer: {
    backgroundColor: '#e6ffe6',
    padding: 15,
    borderRadius: 5,
    marginTop: 20,
    marginBottom: 50,
  },
  userInfoTitle: {
    fontWeight: 'bold',
    marginBottom: 5,
  },
  userInfoText: {
    fontSize: 14,
  },
});

export default TestConnectionScreen;