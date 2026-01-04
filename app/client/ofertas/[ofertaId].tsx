// LimpeJaApp/app/client/ofertas/[ofertaId].tsx
import { Ionicons } from '@expo/vector-icons';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react'; // Adicionado useCallback
import {
    ActivityIndicator,
    Alert,
    Animated,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from 'react-native';

// <--- ADICIONADO: Importar o serviço de ofertas e sua tipagem
import { setSafeError } from '../../../_shared/errors/uiFeedback';
import { getOfferDetails } from '../../../services/offerService'; // Importa a função getOfferDetails
import { Offer } from '../../../types/backend/offers'; // Importa a interface Offer
import { formatDate } from '../../../utils/helpers'; // Para formatar datas

// REMOVIDO: interface OfferDetails local
// REMOVIDO: MOCK_OFFERS
// REMOVIDO: fetchOfferDetailsFromAPI mockada

export default function DetalhesOfertaScreen() {
  const { ofertaId } = useLocalSearchParams<{ ofertaId: string }>();
  const router = useRouter();

  // 3. Estados para dados da oferta, carregamento e erro
  const [offer, setOffer] = useState<Offer | null>(null); // <--- CORREÇÃO: Tipo para Offer
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Animações
  const headerAnim = useRef(new Animated.Value(0)).current;
  const contentAnim = useRef(new Animated.Value(0)).current;
  const imageAnim = useRef(new Animated.Value(0)).current;
  const ctaButtonScaleAnim = useRef(new Animated.Value(1)).current;

  // Função para buscar os dados da oferta real
  const fetchOfferData = useCallback(async () => {
    if (!ofertaId) {
      setError("ID da oferta não fornecido.");
      setIsLoading(false);
      setOffer(null);
      return;
    }
    setIsLoading(true);
    setError(null);
    setOffer(null); // Limpa a oferta anterior ao buscar uma nova

    try {
      const fetchedOffer: Offer = await getOfferDetails(ofertaId); // <--- CHAMA API REAL
      if (fetchedOffer) {
        setOffer(fetchedOffer);
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
    } catch (err: any) {
      console.error("[DetalhesOfertaScreen] Erro ao buscar detalhes da oferta:", err.response?.data || err.message);
      setSafeError(setError, err);
      setOffer(null);
    } finally {
      setIsLoading(false);
    }
  }, [ofertaId, contentAnim, imageAnim]); // Depende do ofertaId e das animações

  useEffect(() => {
    // Animação de entrada do cabeçalho
    Animated.timing(headerAnim, {
      toValue: 1,
      duration: 500,
      useNativeDriver: true,
    }).start();

    fetchOfferData(); // Chama a busca de dados na montagem

  }, [fetchOfferData, headerAnim]); // Depende de fetchOfferData e headerAnim

  // Funções para animação do botão CTA ao pressionar
  const onPressInCtaButton = () => {
    Animated.spring(ctaButtonScaleAnim, {
        toValue: 0.96,
        useNativeDriver: true,
    }).start();
  };

  const onPressOutCtaButton = () => {
    Animated.spring(ctaButtonScaleAnim, {
        toValue: 1,
        friction: 3,
        tension: 40,
        useNativeDriver: true,
    }).start();
  };

  // Renderização condicional
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
                    {offer.originalPrice && (
                        <Text style={styles.originalPrice}>R$ {offer.originalPrice.toFixed(2).replace('.', ',')}</Text>
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
                <Text style={styles.validUntil}>Válido até: {formatDate(offer.validUntil, { day: '2-digit', month: '2-digit', year: 'numeric' })}</Text>
            )}
          </View>
        </Animated.View>
      </ScrollView>

      {/* Botão de Ação Flutuante */}
      <Animated.View style={[styles.ctaButtonContainer, { transform: [{ scale: ctaButtonScaleAnim }] }]}>
          <TouchableOpacity
              style={styles.ctaButton}
              onPress={() => Alert.alert("Agendar", `Navegar para agendamento do serviço da oferta: ${offer.id}!`)}
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
    backgroundColor: '#F8F9FA',
  },
  scrollViewContent: {
    flexGrow: 1, // Permite que o conteúdo se expanda para preencher a tela e role
  },
  animatedContentWrapper: {
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
    elevation: 0,
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
  headerActionIcon: {
    marginLeft: 15,
  },
  headerActionIconPlaceholder: {
    width: 24,
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
    height: 220,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
    overflow: 'hidden',
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 0,
  },
  contentContainer: {
    paddingHorizontal: 20,
    paddingVertical: 10,
  },
  title: {
    fontSize: 28,
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
    backgroundColor: '#E53935',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    overflow: 'hidden',
    marginRight: 10,
    shadowColor: '#E53935',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.4,
    shadowRadius: 4,
    elevation: 0,
  },
  originalPrice: {
    fontSize: 16,
    color: '#6C757D',
    textDecorationLine: 'line-through',
    fontWeight: '500',
  },
  description: {
    fontSize: 16,
    lineHeight: 25,
    color: '#343A40',
    marginBottom: 25,
  },
  subHeader: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1C3A5F',
    marginTop: 15,
    marginBottom: 8,
  },
  terms: {
    fontSize: 14,
    lineHeight: 22,
    color: '#6C757D',
    marginBottom: 20,
    backgroundColor: '#E9ECEF',
    padding: 15,
    borderRadius: 10,
    borderLeftWidth: 4,
    borderLeftColor: '#007AFF',
  },
  validUntil: {
    fontSize: 14,
    fontStyle: 'italic',
    color: '#868E96',
    marginBottom: 100,
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
    elevation: 0,
  },
  ctaButton: {
    backgroundColor: '#28A745',
    paddingVertical: 16,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    shadowColor: '#28A745',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 0,
  },
  ctaButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
});
