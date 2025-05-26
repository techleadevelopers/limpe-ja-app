// LimpeJaApp/app/(common)/help.tsx
import React, { useState, useMemo } from 'react';
import { 
    View, 
    Text, 
    StyleSheet, 
    Linking, 
    ScrollView, 
    TouchableOpacity, 
    TextInput,
    Platform
} from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons'; // Para ícones

interface FAQItem {
  id: string;
  question: string;
  answer: string;
  keywords?: string[]; // Para a busca futura
}

const ALL_FAQS: FAQItem[] = [
  { id: 'faq1', question: "Como faço para agendar um serviço?", answer: "Navegue até a tela 'Explorar', utilize a busca ou os filtros para encontrar o profissional ou serviço desejado. Ao encontrar, clique no perfil do profissional e depois no botão 'Agendar Serviço' para escolher data e horário.", keywords: ['agendar', 'serviço', 'marcar', 'contratar'] },
  { id: 'faq2', question: "Posso cancelar um agendamento?", answer: "Sim. Vá para 'Meus Agendamentos', selecione o serviço que deseja cancelar e procure pela opção 'Cancelar Agendamento'. Por favor, esteja ciente das políticas de cancelamento, que podem incluir taxas dependendo da antecedência.", keywords: ['cancelar', 'cancelamento', 'desmarcar'] },
  { id: 'faq3', question: "O pagamento pela plataforma é seguro?", answer: "Com certeza! Utilizamos processadores de pagamento de mercado, com altos padrões de segurança e criptografia para proteger seus dados financeiros. Suas informações de pagamento não são armazenadas diretamente por nós.", keywords: ['pagamento', 'segurança', 'cartão', 'crédito', 'dinheiro'] },
  { id: 'faq4', question: "Como altero meus dados cadastrais?", answer: "Acesse a aba 'Perfil' e procure pela opção 'Editar Perfil'. Lá você poderá atualizar seu nome, telefone e outras informações pessoais.", keywords: ['perfil', 'dados', 'atualizar', 'mudar', 'cadastro'] },
  { id: 'faq5', question: "O que faço se tiver um problema com o serviço prestado?", answer: "Primeiramente, tente conversar com o profissional através do chat no app. Se não conseguirem resolver, entre em contato com nosso suporte através dos canais listados nesta tela de Ajuda, informando os detalhes do agendamento.", keywords: ['problema', 'qualidade', 'suporte', 'reclamação'] },
];

export default function HelpScreen() {
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState('');

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
    // IMPORTANTE: Verifique a viabilidade e custos de um número de suporte telefônico.
    // Este é um placeholder.
    Linking.openURL('tel:+5519999999999'); // Substitua pelo número real ou remova
    Alert.alert("Ligando para o Suporte", "Você será redirecionado para ligar para o nosso número de suporte. (Número de Exemplo)");
  };

  return (
    <View style={styles.outerContainer}>
      <Stack.Screen options={{ title: 'Central de Ajuda' }} />
      <ScrollView 
        style={styles.scrollView} 
        contentContainerStyle={styles.container}
        keyboardShouldPersistTaps="handled"
      >
        <Text style={styles.header}>Central de Ajuda LimpeJá</Text>

        <View style={styles.sectionCard}>
          <Text style={styles.subHeader}>Perguntas Frequentes (FAQ)</Text>
          <View style={styles.searchContainer}>
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
          </View>

          {filteredFaqs.length > 0 ? (
            filteredFaqs.map((faq) => (
              <View key={faq.id} style={styles.faqItem}>
                <Text style={styles.faqQuestion}>{faq.question}</Text>
                <Text style={styles.faqAnswer}>{faq.answer}</Text>
              </View>
            ))
          ) : (
            <Text style={styles.noFaqResultsText}>Nenhuma pergunta encontrada para "{searchTerm}".</Text>
          )}
        </View>

        <View style={styles.sectionCard}>
          <Text style={styles.subHeader}>Ainda precisa de ajuda?</Text>
          <Text style={styles.contactIntroText}>
            Nossa equipe de suporte está pronta para te atender. Escolha um dos canais abaixo:
          </Text>
          
          <TouchableOpacity style={styles.contactButton} onPress={handleContactSupportEmail}>
            <Ionicons name="mail-outline" size={24} color="#007AFF" style={styles.contactIcon} />
            <Text style={styles.contactButtonText}>Enviar E-mail para Suporte</Text>
            <Ionicons name="chevron-forward-outline" size={22} color="#C7C7CC" />
          </TouchableOpacity>

          {/* Descomente se você tiver um número de telefone para suporte */}
          {/* <TouchableOpacity style={styles.contactButton} onPress={handleContactSupportPhone}>
            <Ionicons name="call-outline" size={24} color="#007AFF" style={styles.contactIcon} />
            <Text style={styles.contactButtonText}>Ligar para o Suporte</Text>
            <Ionicons name="chevron-forward-outline" size={22} color="#C7C7CC" />
          </TouchableOpacity> */}

          {/* Exemplo de um futuro chat de suporte */}
          {/* <TouchableOpacity style={styles.contactButton} onPress={() => Alert.alert("Chat Online", "Funcionalidade de chat em breve!")}>
            <Ionicons name="chatbubbles-outline" size={24} color="#007AFF" style={styles.contactIcon} />
            <Text style={styles.contactButtonText}>Chat Online com Suporte</Text>
            <Ionicons name="chevron-forward-outline" size={22} color="#C7C7CC" />
          </TouchableOpacity> */}
        </View>
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
  header: {
    fontSize: 26,
    fontWeight: 'bold',
    color: '#1C3A5F',
    marginBottom: 25,
    textAlign: 'center',
  },
  sectionCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
    ...Platform.select({
      ios: { shadowColor: 'rgba(0,0,0,0.1)', shadowOffset: { width: 0, height: 3 }, shadowOpacity: 1, shadowRadius: 5 },
      android: { elevation: 3 },
    }),
  },
  subHeader: {
    fontSize: 20,
    fontWeight: 'bold', // Era '600'
    color: '#1C3A5F',
    marginBottom: 20, // Aumentado
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8F9FA',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#DEE2E6',
    paddingHorizontal: 10,
    marginBottom: 20,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    height: 45,
    fontSize: 16,
    color: '#212529',
  },
  clearSearchButton: {
    padding: 5,
  },
  faqItem: {
    marginBottom: 20,
    paddingBottom: 15,
    borderBottomWidth: StyleSheet.hairlineWidth, // Linha mais fina
    borderBottomColor: '#E9ECEF',
  },
  faqQuestion: {
    fontSize: 17, // Aumentado
    fontWeight: '600', // Era 'bold'
    color: '#007AFF', // Cor de destaque para a pergunta
    marginBottom: 8,
  },
  faqAnswer: {
    fontSize: 15,
    lineHeight: 23, // Melhorado
    color: '#495057', // Cor mais suave para a resposta
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
    backgroundColor: '#F8F9FA', // Um fundo suave para o botão
    paddingVertical: 15,
    paddingHorizontal: 15,
    borderRadius: 8,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#DEE2E6'
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