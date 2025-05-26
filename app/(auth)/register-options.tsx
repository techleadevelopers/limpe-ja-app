// LimpeJaApp/app/(auth)/register-options.tsx
import React from 'react';
import { 
    View, 
    Text, 
    StyleSheet, 
    TouchableOpacity, 
    Platform, 
    ScrollView // Adicionado para caso o conteúdo cresça
} from 'react-native';
import { Link, useRouter, Stack } from 'expo-router';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons'; // Ícones

export default function RegisterOptionsScreen() {
  const router = useRouter();

  return (
    <ScrollView contentContainerStyle={styles.scrollViewContainer}>
      <View style={styles.container}>
        <Stack.Screen options={{ title: 'Criar Nova Conta' }} />
        
        <View style={styles.headerSection}>
          {/* Você pode adicionar seu logo aqui se desejar */}
          {/* <Image source={require('../../../assets/images/logo_limpeja.png')} style={styles.logo} /> */}
          <MaterialCommunityIcons name="account-plus-outline" size={64} color="#007AFF" style={styles.headerIcon} />
          <Text style={styles.mainTitle}>Bem-vindo(a) ao LimpeJá!</Text>
          <Text style={styles.title}>Como você gostaria de começar?</Text>
          <Text style={styles.subtitle}>Escolha o tipo de perfil que melhor descreve você:</Text>
        </View>

        <TouchableOpacity 
          style={[styles.optionCard, styles.clientCard]} 
          onPress={() => router.push('/(auth)/client-register')}
          activeOpacity={0.7}
        >
          <View style={styles.iconContainer}>
            <Ionicons name="home-outline" size={38} color="#FFFFFF" />
          </View>
          <View style={styles.textContainer}>
            <Text style={styles.optionTitle}>Quero Contratar Serviços</Text>
            <Text style={styles.optionDescription}>
              Encontre profissionais qualificados para limpeza residencial, comercial e muito mais. Agende com facilidade e segurança.
            </Text>
          </View>
          <Ionicons name="chevron-forward-outline" size={24} color="#FFFFFF" style={styles.chevronIcon} />
        </TouchableOpacity>

        <TouchableOpacity 
          style={[styles.optionCard, styles.providerCard]} 
          onPress={() => router.push('/(auth)/provider-register')} // Navega para o início do fluxo de cadastro do provedor
          activeOpacity={0.7}
        >
          <View style={styles.iconContainer}>
            <MaterialCommunityIcons name="briefcase-outline" size={38} color="#FFFFFF" />
          </View>
          <View style={styles.textContainer}>
            <Text style={styles.optionTitle}>Quero Oferecer Serviços</Text>
            <Text style={styles.optionDescription}>
              Junte-se à nossa plataforma! Cadastre seus serviços de limpeza, defina seus horários e alcance mais clientes.
            </Text>
          </View>
          <Ionicons name="chevron-forward-outline" size={24} color="#FFFFFF" style={styles.chevronIcon} />
        </TouchableOpacity>
        
        <View style={styles.loginLinkContainer}>
          <Text style={styles.loginText}>Já tem uma conta? </Text>
          <Link href="/(auth)/login" asChild>
            <TouchableOpacity>
                <Text style={styles.loginLink}>Faça Login</Text>
            </TouchableOpacity>
          </Link>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scrollViewContainer: {
    flexGrow: 1, // Garante que o ScrollView ocupe espaço mesmo com pouco conteúdo
    backgroundColor: '#F8F9FA', // Fundo geral da tela
  },
  container: {
    flex: 1,
    justifyContent: 'center', // Centraliza verticalmente se houver espaço
    alignItems: 'center',
    padding: 20,
    paddingVertical: 30, // Mais padding vertical
  },
  headerSection: {
    alignItems: 'center',
    marginBottom: 30,
  },
  headerIcon: {
    marginBottom: 15,
  },
  mainTitle: {
    fontSize: 26, // Um pouco maior
    fontWeight: 'bold',
    color: '#1C3A5F',
    textAlign: 'center',
    marginBottom: 8,
  },
  title: {
    fontSize: 20, // Ajustado
    fontWeight: '600', // Era 'bold'
    color: '#343A40',
    textAlign: 'center',
    marginBottom: 10, // Reduzido
  },
  subtitle: {
    fontSize: 15,
    color: '#6C757D',
    textAlign: 'center',
    marginBottom: 25, // Aumentado
    paddingHorizontal: 10, // Para não ficar muito largo
  },
  optionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    borderRadius: 15, // Bordas mais arredondadas
    marginVertical: 12,
    width: '100%', // Ocupa mais da largura
    minHeight: 120, // Altura mínima para melhor toque
    ...Platform.select({
      ios: {
        shadowColor: 'rgba(0,0,0,0.1)',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 1,
        shadowRadius: 8,
      },
      android: {
        elevation: 5,
      },
    }),
  },
  clientCard: {
    backgroundColor: '#007AFF', // Azul primário para cliente
  },
  providerCard: {
    backgroundColor: '#34C759', // Verde para provedor (exemplo)
  },
  iconContainer: {
    marginRight: 18,
    // backgroundColor: 'rgba(255,255,255,0.15)', // Um leve destaque para o ícone (opcional)
    // padding: 10,
    // borderRadius: 30,
  },
  textContainer: {
    flex: 1, // Para o texto ocupar o espaço restante
  },
  optionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 6,
  },
  optionDescription: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.9)',
    lineHeight: 20,
  },
  chevronIcon: {
      marginLeft: 10,
      opacity: 0.8,
  },
  loginLinkContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 30, // Mais espaço acima
  },
  loginText: {
    fontSize: 15,
    color: '#6C757D',
  },
  loginLink: {
    fontSize: 15,
    color: '#007AFF',
    fontWeight: 'bold',
    marginLeft: 5,
  },
});