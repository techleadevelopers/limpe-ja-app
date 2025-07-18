// LimpeJaApp/app/(common)/help.tsx
import { Ionicons } from '@expo/vector-icons';
import { Stack, useRouter } from 'expo-router';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
    ActivityIndicator, // Importar Animated para animações
    Alert,
    Animated,
    Linking,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';

// Importar o serviço de FAQ
import { getFaqs } from '../../services/faqService'; // Importa a função getFaqs

// Interface FAQItem - MANTIDA AQUI (se o backend não tiver um DTO específico)
interface FAQItem {
  id: string;
  question: string;
  answer: string;
  keywords?: string[];
}

// REMOVIDO: const ALL_FAQS (será substituído por dados da API)

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
  const [faqs, setFaqs] = useState<FAQItem[]>([]); // Estado para FAQs reais
  const [isLoadingFaqs, setIsLoadingFaqs] = useState(true); // Estado de carregamento das FAQs

  // Animações
  const headerAnim = useRef(new Animated.Value(0)).current;
  const searchAnim = useRef(new Animated.Value(0)).current;
  const sectionCardAnim = useRef(new Animated.Value(0)).current;

  // Função para carregar FAQs da API
  const loadFaqs = useCallback(async () => {
    setIsLoadingFaqs(true);
    try {
        const fetchedFaqs = await getFaqs(); // CHAMA API REAL
        setFaqs(fetchedFaqs);
    } catch (error: any) {
        console.error("Erro ao buscar FAQs:", error.response?.data || error.message);
        Alert.alert("Erro", error.response?.data?.message || "Não foi possível carregar as perguntas frequentes.");
        setFaqs([]); // Garante que a lista esteja vazia em caso de erro
    } finally {
        setIsLoadingFaqs(false);
        // Animações de entrada após o carregamento
        Animated.stagger(200, [
            Animated.timing(headerAnim, { toValue: 1, duration: 500, useNativeDriver: true }),
            Animated.timing(searchAnim, { toValue: 1, duration: 600, delay: 100, useNativeDriver: true }),
            Animated.timing(sectionCardAnim, { toValue: 1, duration: 700, delay: 200, useNativeDriver: true }),
        ]).start();
    }
  }, [headerAnim, searchAnim, sectionCardAnim]); // Adiciona dependências de animação

  useEffect(() => {
    loadFaqs(); // Chama loadFaqs ao montar
  }, [loadFaqs]); // Dependência loadFaqs

  const filteredFaqs = useMemo(() => {
    if (!searchTerm.trim()) {
      return faqs; // Usar o estado 'faqs'
    }
    const lowerSearchTerm = searchTerm.toLowerCase();
    return faqs.filter(faq => // Usar o estado 'faqs'
      faq.question.toLowerCase().includes(lowerSearchTerm) ||
      faq.answer.toLowerCase().includes(lowerSearchTerm) ||
      (faq.keywords && faq.keywords.some(keyword => keyword.toLowerCase().includes(lowerSearchTerm)))
    );
  }, [searchTerm, faqs]); // Adicionar faqs às dependências

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
          </Animated.View>

          {isLoadingFaqs ? ( // Mostrar indicador de carregamento
            <View style={styles.loadingFaqsContainer}>
              <ActivityIndicator size="small" color="#007AFF" />
              <Text style={styles.loadingText}>Carregando FAQs...</Text> {/* Usar styles.loadingText */}
            </View>
          ) : filteredFaqs.length > 0 ? (
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
    backgroundColor: '#F0F2F5',
  },
  scrollView: {
    flex: 1,
  },
  container: {
    padding: 20,
    paddingBottom: 40,
  },
  customHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#007AFF',
    paddingHorizontal: 15,
    paddingVertical: Platform.OS === 'ios' ? 50 : 20,
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
  headerActionIconPlaceholder: {
    width: 24,
    marginLeft: 15,
  },
  mainHeader: {
    fontSize: 26,
    fontWeight: 'bold',
    color: '#1C3A5F',
    marginBottom: 25,
    textAlign: 'center',
    marginTop: 10,
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
    borderRadius: 10,
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
    height: 48,
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
    borderRadius: 10,
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
  loadingFaqsContainer: { // NOVO ESTILO: Container para o loading das FAQs
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 20,
  },
  loadingText: { // <<--- CORREÇÃO: Adicionada definição para loadingText aqui
    marginTop: 10,
    fontSize: 16,
    color: '#555',
  },
});