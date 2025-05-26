// LimpeJaApp/app/(auth)/provider-register/index.tsx
import React from 'react';
import { 
    View, 
    Text, 
    StyleSheet, 
    TouchableOpacity, 
    ScrollView, 
    Platform 
} from 'react-native';
import { useRouter, Stack, Link } from 'expo-router';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';

// Itens para listas de benefícios e requisitos
const ListItem: React.FC<{ text: string; iconName: keyof typeof Ionicons.glyphMap }> = ({ text, iconName }) => (
  <View style={styles.listItem}>
    <Ionicons name={iconName} size={22} color="#007AFF" style={styles.listItemIcon} />
    <Text style={styles.listItemText}>{text}</Text>
  </View>
);

export default function ProviderRegisterStep1Screen() {
  const router = useRouter();

  const handleNextStep = () => {
    // Navega para a próxima etapa do cadastro de provedor
    router.push('/(auth)/provider-register/personal-details');
  };

  return (
    <View style={styles.outerContainer}>
      <Stack.Screen options={{ title: 'Seja um Parceiro LimpeJá' }} />
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.container}>
        
        <View style={styles.headerSection}>
          <MaterialCommunityIcons name="account-tie-woman" size={64} color="#007AFF" style={styles.headerIcon} />
          <Text style={styles.mainTitle}>Torne-se um Profissional LimpeJá!</Text>
          <Text style={styles.subtitle}>
            Faça parte da nossa rede de profissionais de limpeza e conquiste mais clientes.
            O cadastro é simples e rápido.
          </Text>
        </View>

        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>Vantagens de ser um Parceiro:</Text>
          <ListItem iconName="rocket-outline" text="Alcance mais clientes em sua região." />
          <ListItem iconName="calendar-clear-outline" text="Tenha flexibilidade para definir seus horários." />
          <ListItem iconName="shield-checkmark-outline" text="Receba pagamentos de forma segura pela plataforma." />
          <ListItem iconName="trending-up-outline" text="Aumente sua visibilidade e reputação profissional." />
        </View>

        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>O que você vai precisar para o cadastro:</Text>
          <ListItem iconName="person-outline" text="Seus dados pessoais básicos." />
          <ListItem iconName="document-text-outline" text="Informações sobre os serviços que você oferece." />
          <ListItem iconName="camera-outline" text="Uma foto de perfil profissional (opcional, mas recomendado)." />
          <ListItem iconName="card-outline" text="Dados bancários para recebimento (opcional nesta etapa inicial)." />
          <Text style={styles.infoText}>
            Alguns documentos podem ser solicitados posteriormente para verificação e segurança da plataforma.
          </Text>
        </View>
        
        <View style={styles.termsContainer}>
            <Text style={styles.termsText}>Ao prosseguir, você concorda com nossos </Text>
            <Link href="/termos-provedor" asChild><TouchableOpacity><Text style={styles.linkText}>Termos para Profissionais</Text></TouchableOpacity></Link>
            <Text style={styles.termsText}> e nossa </Text>
            <Link href="/privacidade" asChild><TouchableOpacity><Text style={styles.linkText}>Política de Privacidade</Text></TouchableOpacity></Link>
            <Text style={styles.termsText}>.</Text>
        </View>

        <TouchableOpacity style={styles.ctaButton} onPress={handleNextStep}>
          <Text style={styles.ctaButtonText}>Iniciar Cadastro</Text>
          <Ionicons name="arrow-forward-circle-outline" size={24} color="#FFFFFF" />
        </TouchableOpacity>

        <Link href="/(auth)/register-options" asChild>
            <TouchableOpacity style={styles.backButton}>
                <Ionicons name="arrow-back-outline" size={20} color="#007AFF" style={{marginRight: 5}}/>
                <Text style={styles.backButtonText}>Voltar para opções de cadastro</Text>
            </TouchableOpacity>
        </Link>

      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  outerContainer: {
    flex: 1,
    backgroundColor: '#F0F2F5', // Fundo geral suave
  },
  scrollView: {
    flex: 1,
  },
  container: {
    flexGrow: 1,
    padding: 20,
    paddingBottom: 40, // Espaço no final
  },
  headerSection: {
    alignItems: 'center',
    marginBottom: 30,
    paddingHorizontal: 10,
  },
  headerIcon: {
    marginBottom: 15,
  },
  mainTitle: {
    fontSize: 24, // Tamanho bom para título principal
    fontWeight: 'bold',
    color: '#1C3A5F',
    textAlign: 'center',
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 16,
    color: '#495057',
    textAlign: 'center',
    lineHeight: 23,
  },
  sectionCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
    ...Platform.select({
      ios: { shadowColor: 'rgba(0,0,0,0.08)', shadowOffset: { width: 0, height: 3 }, shadowOpacity: 1, shadowRadius: 6 },
      android: { elevation: 3 },
    }),
  },
  sectionTitle: {
    fontSize: 19, // Aumentado
    fontWeight: 'bold', // Era '600'
    color: '#1C3A5F',
    marginBottom: 18, // Mais espaço
  },
  listItem: {
    flexDirection: 'row',
    alignItems: 'flex-start', // Alinha pelo topo se o texto tiver múltiplas linhas
    marginBottom: 12,
  },
  listItemIcon: {
    marginRight: 12,
    marginTop: 2, // Pequeno ajuste para alinhar com o texto
  },
  listItemText: {
    flex: 1, // Para o texto quebrar linha corretamente
    fontSize: 15,
    color: '#343A40',
    lineHeight: 22,
  },
  infoText: {
    fontSize: 13,
    color: '#6C757D',
    marginTop: 15,
    fontStyle: 'italic',
    textAlign: 'center',
  },
  termsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    alignItems: 'center',
    marginVertical: 25,
    paddingHorizontal: 10,
  },
  termsText: {
    fontSize: 13,
    color: '#6C757D',
    lineHeight: 18,
    textAlign: 'center',
  },
  linkText: {
    fontSize: 13,
    color: '#007AFF',
    fontWeight: '600',
    textDecorationLine: 'underline',
    lineHeight: 18,
  },
  ctaButton: {
    flexDirection: 'row',
    backgroundColor: '#007AFF', // Cor primária de ação
    paddingVertical: 16,
    paddingHorizontal: 25,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 52,
    ...Platform.select({
      ios: { shadowColor: 'rgba(0,122,255,0.3)', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 1, shadowRadius: 6 },
      android: { elevation: 4 },
    }),
  },
  ctaButtonText: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: 'bold',
    marginRight: 10,
  },
  backButton: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: 15,
      marginTop: 20,
  },
  backButtonText: {
      fontSize: 15,
      color: '#007AFF',
      fontWeight: '600',
  }
});