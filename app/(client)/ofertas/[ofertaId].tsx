// LimpeJaApp/app/(client)/ofertas/[ofertaId].tsx
import React, { useEffect, useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  Image,
  ScrollView,
  Animated, // Importar Animated para animações
  TouchableOpacity,
  Platform,
  Alert, // << CORREÇÃO: Importar Alert
} from 'react-native';
import { useLocalSearchParams, Stack, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

// 1. Defina um tipo para sua Oferta (pode ir para src/types/offer.ts ou similar)
interface OfferDetails {
  id: string;
  title: string;
  description: string;
  imageUrl?: string;
  terms?: string;
  discountPercentage?: number;
  originalPrice?: number;
  discountedPrice?: number;
  validUntil?: string;
}

// 2. Crie uma fonte de dados mockada (substitua por API no futuro)
const MOCK_OFFERS: OfferDetails[] = [
  {
    id: 'primeiraLimpeza30off', // Mesmo ID usado no BannerOferta
    title: '30% OFF na Primeira Limpeza!',
    description: 'Aproveite um super desconto para experimentar nossos serviços de limpeza residencial de alta qualidade. Deixe sua casa brilhando com a ajuda dos nossos profissionais qualificados. Esta é a oportunidade perfeita para conhecer o LimpeJá e desfrutar de um ambiente impecável.',
    imageUrl: 'https://via.placeholder.com/600x300/87CEEB/1E3A5F?text=Super+Oferta+LimpeJ%C3%A1',
    terms: 'Válido apenas para novos clientes. Oferta não acumulativa com outras promoções ou cupons. O agendamento está sujeito à disponibilidade dos profissionais na sua região. Certifique-se de aplicar o cupom no momento da reserva para garantir o desconto.',
    discountPercentage: 30,
    validUntil: '2025-12-31',
  },
  {
    id: 'limpezaEscritorioTop',
    title: 'Pacote Limpeza Escritório Top',
    description: 'Mantenha seu ambiente de trabalho impecável com nosso pacote especial para escritórios. Ideal para empresas que buscam um serviço de limpeza regular e de alta qualidade, garantindo um espaço produtivo e agradável para todos os colaboradores.',
    imageUrl: 'https://via.placeholder.com/600x300/90EE90/006400?text=Limpeza+Escrit%C3%B3rio',
    terms: 'Válido para contratos mensais ou quinzenais. Consulte nossas condições especiais para grandes escritórios e personalização de serviços. A oferta pode variar conforme a área e frequência desejada.',
  },
  {
    id: 'descontoFidelidade10off',
    title: '10% OFF para Clientes Fiéis!',
    description: 'Um agradecimento especial aos nossos clientes mais fiéis! Utilize este desconto nas suas próximas limpezas e continue desfrutando da qualidade LimpeJá. Sua satisfação é a nossa prioridade, e queremos recompensar sua confiança.',
    imageUrl: 'https://via.placeholder.com/600x300/FFD700/8B4513?text=Fidelidade+LimpeJ%C3%A1',
    terms: 'Válido para clientes com 5 ou mais agendamentos concluídos. Desconto aplicável uma vez por mês. Não pode ser combinado com outras promoções ativas.',
    discountPercentage: 10,
    validUntil: '2025-12-31',
  },
  // Adicione mais ofertas mockadas se desejar
];

// Função mockada para buscar detalhes da oferta
const fetchOfferDetailsFromAPI = async (id: string): Promise<OfferDetails | undefined> => {
  console.log(`[DetalhesOfertaScreen] Buscando detalhes para oferta ID: ${id}`);
  // Simula uma chamada de API
  await new Promise(resolve => setTimeout(resolve, 700));
  const foundOffer = MOCK_OFFERS.find(offer => offer.id === id);
  if (!foundOffer) {
    // Para simular erro de API, descomente a linha abaixo
    // throw new Error("Oferta não encontrada ou ID inválido.");
  }
  return foundOffer;
};


export default function DetalhesOfertaScreen() {
  const { ofertaId } = useLocalSearchParams<{ ofertaId: string }>();
  const router = useRouter();

  // 3. Estados para dados da oferta, carregamento e erro
  const [offer, setOffer] = useState<OfferDetails | null | undefined>(undefined); // undefined para estado inicial antes da busca
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Animações
  const headerAnim = useRef(new Animated.Value(0)).current;
  const contentAnim = useRef(new Animated.Value(0)).current;
  const imageAnim = useRef(new Animated.Value(0)).current;
  const ctaButtonScaleAnim = useRef(new Animated.Value(1)).current;

  // 4. useEffect para buscar os dados da oferta
  useEffect(() => {
    // Animação de entrada do cabeçalho
    Animated.timing(headerAnim, {
      toValue: 1,
      duration: 500,
      useNativeDriver: true,
    }).start();

    if (ofertaId) {
      setIsLoading(true);
      setError(null);
      setOffer(undefined); // Limpa a oferta anterior ao buscar uma nova

      fetchOfferDetailsFromAPI(ofertaId)
        .then(data => {
          if (data) {
            setOffer(data);
            // Inicia a animação do conteúdo após carregar os dados
            Animated.stagger(200, [
                Animated.timing(imageAnim, {
                    toValue: 1,
                    duration: 600,
                    useNativeDriver: true,
                }),
                Animated.timing(contentAnim, {
                    toValue: 1,
                    duration: 800,
                    delay: 200,
                    useNativeDriver: true,
                }),
            ]).start();
          } else {
            setOffer(null); // Indica que a oferta não foi encontrada
            setError(`Oferta com ID "${ofertaId}" não encontrada.`);
          }
        })
        .catch(err => {
          console.error("[DetalhesOfertaScreen] Erro ao buscar detalhes da oferta:", err);
          setError(err.message || "Não foi possível carregar os detalhes da oferta.");
          setOffer(null);
        })
        .finally(() => {
          setIsLoading(false);
        });
    } else {
      setError("ID da oferta não fornecido.");
      setIsLoading(false);
      setOffer(null);
    }
  }, [ofertaId, headerAnim, contentAnim, imageAnim]); // Re-executa se o ofertaId mudar

  // Funções para animação do botão CTA ao pressionar
  const onPressInCtaButton = () => {
    Animated.spring(ctaButtonScaleAnim, {
        toValue: 0.96, // Diminui ligeiramente ao pressionar
        useNativeDriver: true,
    }).start();
  };

  const onPressOutCtaButton = () => {
    Animated.spring(ctaButtonScaleAnim, {
        toValue: 1, // Retorna ao tamanho normal
        friction: 3, // Controla a "elasticidade"
        tension: 40, // Controla a velocidade
        useNativeDriver: true,
    }).start();
  };

  // 5. Renderização condicional
  if (isLoading) {
    return (
      <View style={styles.container}>
        <Stack.Screen options={{ headerShown: false }} />
        {/* Custom Header para o estado de loading */}
        <Animated.View style={[styles.customHeader, { opacity: headerAnim, transform: [{ translateY: headerAnim.interpolate({ inputRange: [0, 1], outputRange: [-20, 0] }) }] }]}>
            <TouchableOpacity onPress={() => router.back()} style={styles.headerBackButton}>
                <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Carregando Oferta...</Text>
            <View style={styles.headerActionIconPlaceholder} /> {/* Placeholder para alinhar */}
        </Animated.View>
        <View style={styles.centeredFeedback}>
            <ActivityIndicator size="large" color="#007AFF" />
            <Text style={styles.loadingText}>Carregando detalhes da oferta...</Text>
        </View>
      </View>
    );
  }

  if (error || !offer) {
    return (
      <View style={styles.container}>
        <Stack.Screen options={{ headerShown: false }} />
        {/* Custom Header para o estado de erro */}
        <Animated.View style={[styles.customHeader, { opacity: headerAnim, transform: [{ translateY: headerAnim.interpolate({ inputRange: [0, 1], outputRange: [-20, 0] }) }] }]}>
            <TouchableOpacity onPress={() => router.back()} style={styles.headerBackButton}>
                <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Erro na Oferta</Text>
            <View style={styles.headerActionIconPlaceholder} />
        </Animated.View>
        <View style={styles.centeredFeedback}>
            <Ionicons name="alert-circle-outline" size={60} color="#D32F2F" />
            <Text style={styles.errorText}>{error || `Oferta "${ofertaId}" não encontrada.`}</Text>
            <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
                <Text style={styles.backButtonText}>Voltar</Text>
            </TouchableOpacity>
        </View>
      </View>
    );
  }

  // Se chegou aqui, a oferta foi carregada com sucesso
  return (
    <View style={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />

      {/* Custom Header */}
      <Animated.View style={[styles.customHeader, { opacity: headerAnim, transform: [{ translateY: headerAnim.interpolate({ inputRange: [0, 1], outputRange: [-20, 0] }) }] }]}>
          <TouchableOpacity onPress={() => router.back()} style={styles.headerBackButton}>
              <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>{offer.title || "Detalhes da Oferta"}</Text>
          <TouchableOpacity style={styles.headerActionIcon} onPress={() => Alert.alert("Compartilhar", "Funcionalidade de compartilhamento")}>
              <Ionicons name="share-social-outline" size={24} color="#FFFFFF" />
          </TouchableOpacity>
      </Animated.View>

      <ScrollView style={styles.scrollViewContent}>
        <Animated.View style={[styles.animatedContentWrapper, { opacity: contentAnim, transform: [{ translateY: contentAnim.interpolate({ inputRange: [0, 1], outputRange: [20, 0] }) }] }]}>
          {offer.imageUrl && (
            <Animated.Image
              source={{ uri: offer.imageUrl }}
              style={[styles.offerImage, { opacity: imageAnim }]}
              resizeMode="cover"
            />
          )}

          <View style={styles.contentContainer}>
            <Text style={styles.title}>{offer.title}</Text>

            {offer.discountPercentage && (
                <View style={styles.discountBadgeContainer}>
                    <Text style={styles.discountBadge}>{offer.discountPercentage}% OFF</Text>
                    {/* Opcional: Adicionar um preço original riscado se houver */}
                    {offer.originalPrice && (
                        <Text style={styles.originalPrice}>R$ {offer.originalPrice.toFixed(2)}</Text>
                    )}
                </View>
            )}

            <Text style={styles.description}>{offer.description}</Text>

            {offer.terms && (
                <>
                    <Text style={styles.subHeader}>Termos e Condições:</Text>
                    <Text style={styles.terms}>{offer.terms}</Text>
                </>
            )}

            {offer.validUntil && (
                <Text style={styles.validUntil}>Válido até: {new Date(offer.validUntil).toLocaleDateString('pt-BR')}</Text>
            )}
          </View>
        </Animated.View>
      </ScrollView>

      {/* Botão de Ação Flutuante */}
      <Animated.View style={[styles.ctaButtonContainer, { transform: [{ scale: ctaButtonScaleAnim }] }]}>
          <TouchableOpacity
              style={styles.ctaButton}
              onPress={() => Alert.alert("Agendar", "Navegar para agendamento com esta oferta!")}
              onPressIn={onPressInCtaButton}
              onPressOut={onPressOutCtaButton}
          >
              <Text style={styles.ctaButtonText}>Agendar com esta Oferta</Text>
              <Ionicons name="arrow-forward-circle-outline" size={24} color="#FFFFFF" style={{ marginLeft: 8 }} />
          </TouchableOpacity>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA', // Fundo suave e consistente
  },
  scrollViewContent: {
    flex: 1,
  },
  animatedContentWrapper: {
    // Estilos para a animação do conteúdo
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
    flex: 1, // Para o título ocupar o espaço e centralizar melhor
    textAlign: 'center',
  },
  headerActionIcon: {
    marginLeft: 15,
  },
  headerActionIconPlaceholder: { // Para alinhar o título no centro durante o loading
    width: 24, // Largura do ícone
    marginLeft: 15,
  },
  centeredFeedback: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  loadingText: {
    marginTop: 15,
    fontSize: 16,
    color: '#6C757D',
  },
  errorText: {
    fontSize: 18,
    color: '#D32F2F',
    textAlign: 'center',
    marginBottom: 20,
    fontWeight: '600',
  },
  backButton: {
    backgroundColor: '#007AFF',
    paddingVertical: 12,
    paddingHorizontal: 25,
    borderRadius: 8,
    marginTop: 20,
  },
  backButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  offerImage: {
    width: '100%',
    height: 220, // Aumentado para mais impacto
    borderBottomLeftRadius: 20, // Bordas arredondadas na parte inferior
    borderBottomRightRadius: 20,
    overflow: 'hidden', // Garante que o borderRadius funcione na imagem
    marginBottom: 15, // Espaçamento entre imagem e conteúdo
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 8,
  },
  contentContainer: {
    paddingHorizontal: 20,
    paddingVertical: 10,
  },
  title: {
    fontSize: 28, // Maior para destaque
    fontWeight: 'bold',
    color: '#1C3A5F',
    marginBottom: 10,
    lineHeight: 34,
  },
  discountBadgeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
  },
  discountBadge: {
    fontSize: 18,
    fontWeight: 'bold',
    color: 'white',
    backgroundColor: '#E53935', // Um vermelho vibrante para destaque do desconto
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20, // Mais arredondado
    overflow: 'hidden',
    marginRight: 10,
    shadowColor: '#E53935',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.4,
    shadowRadius: 4,
    elevation: 5,
  },
  originalPrice: {
    fontSize: 16,
    color: '#6C757D',
    textDecorationLine: 'line-through', // Preço riscado
    fontWeight: '500',
  },
  description: {
    fontSize: 16,
    lineHeight: 25,
    color: '#343A40',
    marginBottom: 25,
  },
  subHeader: {
    fontSize: 20, // Um pouco maior
    fontWeight: '700', // Mais negrito
    color: '#1C3A5F',
    marginTop: 15,
    marginBottom: 8,
  },
  terms: {
    fontSize: 14,
    lineHeight: 22,
    color: '#6C757D',
    marginBottom: 20,
    backgroundColor: '#E9ECEF', // Fundo sutil para os termos
    padding: 15,
    borderRadius: 10,
    borderLeftWidth: 4,
    borderLeftColor: '#007AFF', // Detalhe na borda
  },
  validUntil: {
    fontSize: 14,
    fontStyle: 'italic',
    color: '#868E96',
    marginBottom: 100, // Espaço para o botão flutuante
    textAlign: 'center',
  },
  ctaButtonContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 20,
    backgroundColor: '#FFFFFF',
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: '#E0E0E0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -3 },
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 10,
  },
  ctaButton: {
    backgroundColor: '#28A745', // Verde vibrante para CTA
    paddingVertical: 16,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    shadowColor: '#28A745',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 6,
  },
  ctaButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
});