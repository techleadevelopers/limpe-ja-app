// LimpeJaApp/app/(common)/help.tsx
import React, { useState, useMemo, useEffect, useRef } from 'react';
import {
    View,
    Text,
    StyleSheet,
    Linking,
    ScrollView,
    TouchableOpacity,
    TextInput,
    Platform,
    Animated, // Importar Animated para animações
    Alert, // << CORREÇÃO: Importar Alert
} from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';

interface FAQItem {
  id: string;
  question: string;
  answer: string;
  keywords?: string[];
}

const ALL_FAQS: FAQItem[] = [
  { id: 'faq1', question: "Como faço para agendar um serviço?", answer: "Navegue até a tela 'Explorar', utilize a busca ou os filtros para encontrar o profissional ou serviço desejado. Ao encontrar, clique no perfil do profissional e depois no botão 'Agendar Serviço' para escolher data e horário.", keywords: ['agendar', 'serviço', 'marcar', 'contratar'] },
  { id: 'faq2', question: "Posso cancelar um agendamento?", answer: "Sim. Vá para 'Meus Agendamentos', selecione o serviço que deseja cancelar e procure pela opção 'Cancelar Agendamento'. Por favor, esteja ciente das políticas de cancelamento, que podem incluir taxas dependendo da antecedência.", keywords: ['cancelar', 'cancelamento', 'desmarcar'] },
  { id: 'faq3', question: "O pagamento pela plataforma é seguro?", answer: "Com certeza! Utilizamos processadores de pagamento de mercado, com altos padrões de segurança e criptografia para proteger seus dados financeiros. Suas informações de pagamento não são armazenadas diretamente por nós.", keywords: ['pagamento', 'segurança', 'cartão', 'crédito', 'dinheiro'] },
  { id: 'faq4', question: "Como altero meus dados cadastrais?", answer: "Acesse a aba 'Perfil' e procure pela opção 'Editar Perfil'. Lá você poderá atualizar seu nome, telefone e outras informações pessoais.", keywords: ['perfil', 'dados', 'atualizar', 'mudar', 'cadastro'] },
  { id: 'faq5', question: "O que faço se tiver um problema com o serviço prestado?", answer: "Primeiramente, tente conversar com o profissional através do chat no app. Se não conseguirem resolver, entre em contato com nosso suporte através dos canais listados nesta tela de Ajuda, informando os detalhes do agendamento.", keywords: ['problema', 'qualidade', 'suporte', 'reclamação'] },
  { id: 'faq6', question: "Como posso me tornar um profissional LimpeJá?", answer: "Para se tornar um profissional parceiro, acesse a tela de registro e escolha a opção 'Quero Oferecer Serviços'. Preencha suas informações e detalhes dos serviços que você oferece.", keywords: ['profissional', 'parceiro', 'cadastro', 'oferecer', 'serviços'] },
  { id: 'faq7', question: "Quais são as formas de pagamento aceitas?", answer: "Aceitamos pagamentos via cartão de crédito (principais bandeiras) e PIX. Em breve, mais opções estarão disponíveis para sua comodidade.", keywords: ['pagamento', 'formas', 'cartão', 'crédito', 'PIX'] },
];

// Componente para cada item da FAQ com animação de entrada
const AnimatedFaqItem: React.FC<{
    faq: FAQItem;
    delay: number;
}> = ({ faq, delay }) => {
    const fadeAnim = useRef(new Animated.Value(0)).current;
    const slideAnim = useRef(new Animated.Value(20)).current;

    useEffect(() => {
        Animated.parallel([
            Animated.timing(fadeAnim, {
                toValue: 1,
                duration: 400,
                delay: delay,
                useNativeDriver: true,
            }),
            Animated.timing(slideAnim, {
                toValue: 0,
                duration: 400,
                delay: delay,
                useNativeDriver: true,
            }),
        ]).start();
    }, [fadeAnim, slideAnim, delay]);

    return (
        <Animated.View style={[styles.faqItem, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
            <Text style={styles.faqQuestion}>{faq.question}</Text>
            <Text style={styles.faqAnswer}>{faq.answer}</Text>
        </Animated.View>
    );
};

// Componente para os botões de contato com animação de entrada e feedback de toque
const AnimatedContactButton: React.FC<{
    label: string;
    iconName: keyof typeof Ionicons.glyphMap;
    onPress: () => void;
    delay: number;
}> = ({ label, iconName, onPress, delay }) => {
    const fadeAnim = useRef(new Animated.Value(0)).current;
    const slideAnim = useRef(new Animated.Value(20)).current;
    const scaleAnim = useRef(new Animated.Value(1)).current;

    useEffect(() => {
        Animated.parallel([
            Animated.timing(fadeAnim, {
                toValue: 1,
                duration: 400,
                delay: delay,
                useNativeDriver: true,
            }),
            Animated.timing(slideAnim, {
                toValue: 0,
                duration: 400,
                delay: delay,
                useNativeDriver: true,
            }),
        ]).start();
    }, [fadeAnim, slideAnim, delay]);

    const onPressInButton = () => {
        Animated.spring(scaleAnim, { toValue: 0.98, useNativeDriver: true }).start();
    };
    const onPressOutButton = () => {
        Animated.spring(scaleAnim, { toValue: 1, friction: 3, tension: 40, useNativeDriver: true }).start();
    };

    return (
        <Animated.View style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }, { scale: scaleAnim }] }}>
            <TouchableOpacity
                style={styles.contactButton}
                onPress={onPress}
                onPressIn={onPressInButton}
                onPressOut={onPressOutButton}
                activeOpacity={1}
            >
                <Ionicons name={iconName} size={24} color="#007AFF" style={styles.contactIcon} />
                <Text style={styles.contactButtonText}>{label}</Text>
                <Ionicons name="chevron-forward-outline" size={22} color="#C7C7CC" />
            </TouchableOpacity>
        </Animated.View>
    );
};

export default function HelpScreen() {
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState('');

  // Animações
  const headerAnim = useRef(new Animated.Value(0)).current;
  const searchAnim = useRef(new Animated.Value(0)).current;
  const sectionCardAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Animações de entrada
    Animated.stagger(200, [
        Animated.timing(headerAnim, { toValue: 1, duration: 500, useNativeDriver: true }),
        Animated.timing(searchAnim, { toValue: 1, duration: 600, delay: 100, useNativeDriver: true }),
        Animated.timing(sectionCardAnim, { toValue: 1, duration: 700, delay: 200, useNativeDriver: true }),
    ]).start();
  }, [headerAnim, searchAnim, sectionCardAnim]);

  const filteredFaqs = useMemo(() => {
    if (!searchTerm.trim()) {
      return ALL_FAQS;
    }
    const lowerSearchTerm = searchTerm.toLowerCase();
    return ALL_FAQS.filter(faq =>
      faq.question.toLowerCase().includes(lowerSearchTerm) ||
      faq.answer.toLowerCase().includes(lowerSearchTerm) ||
      (faq.keywords && faq.keywords.some(keyword => keyword.toLowerCase().includes(lowerSearchTerm)))
    );
  }, [searchTerm]);

  const handleContactSupportEmail = () => {
    Linking.openURL('mailto:suporte@limpeja.com?subject=Ajuda%20App%20LimpeJá&body=Olá,%20preciso%20de%20ajuda%20com...');
  };

  const handleContactSupportPhone = () => {
    Linking.openURL('tel:+5519999999999');
    Alert.alert("Ligando para o Suporte", "Você será redirecionado para ligar para o nosso número de suporte. (Número de Exemplo)");
  };

  return (
    <View style={styles.outerContainer}>
      <Stack.Screen options={{ headerShown: false }} />

      {/* Custom Header */}
      <Animated.View style={[styles.customHeader, { opacity: headerAnim, transform: [{ translateY: headerAnim.interpolate({ inputRange: [0, 1], outputRange: [-20, 0] }) }] }]}>
          <TouchableOpacity onPress={() => router.back()} style={styles.headerBackButton}>
              <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Central de Ajuda</Text>
          <View style={styles.headerActionIconPlaceholder} /> {/* Placeholder para alinhar */}
      </Animated.View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.container}
        keyboardShouldPersistTaps="handled"
      >
        <Animated.Text style={[styles.mainHeader, { opacity: headerAnim, transform: [{ translateY: headerAnim.interpolate({ inputRange: [0, 1], outputRange: [20, 0] }) }] }]}>
            Como podemos te ajudar?
        </Animated.Text>

        <Animated.View style={[styles.sectionCard, { opacity: sectionCardAnim, transform: [{ translateY: sectionCardAnim.interpolate({ inputRange: [0, 1], outputRange: [20, 0] }) }] }]}>
          <Text style={styles.subHeader}>Perguntas Frequentes (FAQ)</Text>
          <Animated.View style={[styles.searchContainer, { opacity: searchAnim, transform: [{ translateY: searchAnim.interpolate({ inputRange: [0, 1], outputRange: [10, 0] }) }] }]}>
            <Ionicons name="search-outline" size={20} color="#8A8A8E" style={styles.searchIcon} />
            <TextInput
              style={styles.searchInput}
              placeholder="Buscar nas perguntas frequentes..."
              placeholderTextColor="#ADB5BD"
              value={searchTerm}
              onChangeText={setSearchTerm}
            />
            {searchTerm.length > 0 && (
                <TouchableOpacity onPress={() => setSearchTerm('')} style={styles.clearSearchButton}>
                    <Ionicons name="close-circle" size={20} color="#8A8A8E" />
                </TouchableOpacity>
            )}
          {/* << CORREÇÃO: Tag Animated.View fechada corretamente >> */}
          </Animated.View>

          {filteredFaqs.length > 0 ? (
            filteredFaqs.map((faq, index) => (
              <AnimatedFaqItem key={faq.id} faq={faq} delay={index * 50 + 300} />
            ))
          ) : (
            <Text style={styles.noFaqResultsText}>Nenhuma pergunta encontrada para "{searchTerm}".</Text>
          )}
        </Animated.View>

        <Animated.View style={[styles.sectionCard, { opacity: sectionCardAnim, transform: [{ translateY: sectionCardAnim.interpolate({ inputRange: [0, 1], outputRange: [20, 0] }) }] }]}>
          <Text style={styles.subHeader}>Ainda precisa de ajuda?</Text>
          <Text style={styles.contactIntroText}>
            Nossa equipe de suporte está pronta para te atender. Escolha um dos canais abaixo:
          </Text>

          <AnimatedContactButton label="Enviar E-mail para Suporte" iconName="mail-outline" onPress={handleContactSupportEmail} delay={0} />
          <AnimatedContactButton label="Ligar para o Suporte" iconName="call-outline" onPress={handleContactSupportPhone} delay={50} />
          <AnimatedContactButton label="Chat Online com Suporte" iconName="chatbubbles-outline" onPress={() => Alert.alert("Chat Online", "Funcionalidade de chat em breve!")} delay={100} />
        </Animated.View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  outerContainer: {
    flex: 1,
    backgroundColor: '#F0F2F5', // Fundo geral da tela
  },
  scrollView: {
    flex: 1,
  },
  container: {
    padding: 20,
    paddingBottom: 40, // Espaço no final
  },
  customHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#007AFF', // Cor primária do app
    paddingHorizontal: 15,
    paddingVertical: Platform.OS === 'ios' ? 50 : 20, // Ajuste para status bar iOS
    paddingTop: Platform.OS === 'ios' ? 50 : 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 5,
  },
  headerBackButton: {
    marginRight: 15,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFFFFF',
    flex: 1,
    textAlign: 'center',
  },
  headerActionIconPlaceholder: { // Para alinhar o título no centro durante o loading
    width: 24, // Largura do ícone
    marginLeft: 15,
  },
  mainHeader: {
    fontSize: 26,
    fontWeight: 'bold',
    color: '#1C3A5F',
    marginBottom: 25,
    textAlign: 'center',
    marginTop: 10, // Espaço após o header customizado
  },
  sectionCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
    ...Platform.select({
      ios: { shadowColor: 'rgba(0,0,0,0.1)', shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.15, shadowRadius: 6 },
      android: { elevation: 4 },
    }),
  },
  subHeader: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1C3A5F',
    marginBottom: 20,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8F9FA',
    borderRadius: 10, // Mais arredondado
    borderWidth: 1,
    borderColor: '#DEE2E6',
    paddingHorizontal: 10,
    marginBottom: 20,
    ...Platform.select({
        ios: { shadowColor: 'rgba(0,0,0,0.05)', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 3 },
        android: { elevation: 2 },
    }),
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    height: 48, // Altura padrão para inputs
    fontSize: 16,
    color: '#212529',
  },
  clearSearchButton: {
    padding: 5,
  },
  faqItem: {
    marginBottom: 20,
    paddingBottom: 15,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#E9ECEF',
  },
  faqQuestion: {
    fontSize: 17,
    fontWeight: '600',
    color: '#007AFF',
    marginBottom: 8,
  },
  faqAnswer: {
    fontSize: 15,
    lineHeight: 23,
    color: '#495057',
  },
  noFaqResultsText: {
      textAlign: 'center',
      color: '#6C757D',
      fontSize: 15,
      paddingVertical: 15,
  },
  contactIntroText: {
    fontSize: 15,
    color: '#495057',
    marginBottom: 20,
    lineHeight: 22,
  },
  contactButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8F9FA',
    paddingVertical: 15,
    paddingHorizontal: 15,
    borderRadius: 10, // Mais arredondado
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#DEE2E6',
    ...Platform.select({
        ios: { shadowColor: 'rgba(0,0,0,0.05)', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 3 },
        android: { elevation: 2 },
    }),
  },
  contactIcon: {
    marginRight: 15,
  },
  contactButtonText: {
    flex: 1,
    fontSize: 16,
    fontWeight: '500',
    color: '#007AFF',
  },
});