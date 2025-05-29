import React, { useEffect, useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  ImageBackground,
  ScrollView,
  TouchableOpacity,
  Platform,
  Alert,
  Animated,
  Dimensions,
  Image, // Para fotos de perfil nas avaliações
} from 'react-native';
import { useLocalSearchParams, Stack, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

const SCREEN_WIDTH = Dimensions.get('window').width;

// --- Interfaces e Dados Mock ---
interface Review {
  id: string;
  reviewerName: string;
  reviewerImageUrl?: string;
  rating: number;
  comment: string;
  date: string;
}

interface ProviderDetails {
  id: string;
  nome: string;
  especialidade: string;
  avaliacao: number;
  precoHora: string;
  imagemUrl: string;
  numeroAvaliacoes?: number;
  isVerificado?: boolean;
  descricaoCompleta?: string;
  servicosOferecidos?: Array<{ nome: string; preco?: string; descricao?: string }>;
  cidade?: string;
  anosExperiencia?: number;
  disponibilidadeObservacao?: string;
  reviews?: Review[]; // Adicionando avaliações mock

  // Adicionando estes campos para o texto e preços do print, se necessário
  servicoPrincipal?: string;
  precoOriginal?: string;
  precoComDesconto?: string;
}

const TODOS_OS_PRESTADORES_DETALHES: ProviderDetails[] = [
  {
    id: 'provider1',
    nome: 'Ana Oliveira',
    especialidade: 'Limpeza Residencial Detalhada',
    avaliacao: 5.0, // Para 5 estrelas como no print
    precoHora: 'R$ 60-80',
    imagemUrl: 'https://randomuser.me/api/portraits/women/43.jpg',
    numeroAvaliacoes: 240, // Ajustado para 240 reviews como no print
    isVerificado: true,
    descricaoCompleta: 'It is a long established fact that a reader will be distracted by the readable content of a page when looking at its layout. The point of using Lorem Ipsum is that it has a more-or-less normal distribution of letter', // Texto exato do print
    servicosOferecidos: [{ nome: 'Limpeza Padrão Completa' }, { nome: 'Limpeza Pesada Detalhada' }, { nome: 'Organização de Armários' }],
    cidade: 'Campinas, SP',
    anosExperiencia: 5,
    reviews: [
      { id: 'rev1_1', reviewerName: 'Juliana M.', reviewerImageUrl: 'https://picsum.photos/seed/juliana_m/100/100', rating: 5, comment: 'A Ana é fantástica! Minha casa nunca esteve tão limpa. Super recomendo!', date: '20/05/2025' },
      { id: 'rev1_2', reviewerName: 'Ricardo F.', reviewerImageUrl: 'https://picsum.photos/seed/ricardo_f/100/100', rating: 4.5, comment: 'Ótimo serviço, muito profissional e atenciosa aos detalhes. Contratarei novamente.', date: '15/05/2025' },
    ],
    servicoPrincipal: 'Limpeza de Sala de Estar',
    precoOriginal: '$230',
    precoComDesconto: '$200',
  },
  {
    id: 'provider2',
    nome: 'Carlos Silva',
    especialidade: 'Higienização Comercial',
    avaliacao: 4.9,
    precoHora: 'R$ 75',
    imagemUrl: 'https://picsum.photos/seed/carlos_silva_higieniza/700/500',
    numeroAvaliacoes: 88,
    isVerificado: false,
    descricaoCompleta: 'Serviços de limpeza e higienização para ambientes comerciais, escritórios e lojas. Equipe treinada, discrição e eficiência para manter seu local de trabalho sempre apresentável e saudável. Horários flexíveis.',
    cidade: 'Valinhos, SP',
    anosExperiencia: 8,
    reviews: [
      { id: 'rev2_1', reviewerName: 'Empresa X', rating: 5, comment: 'Carlos e sua equipe são excelentes. Nosso escritório está sempre impecável.', date: '10/05/2025' },
    ],
    servicoPrincipal: 'Limpeza de Escritório',
    precoOriginal: '$150',
    precoComDesconto: '$120',
  },
  {
    id: 'provider3',
    nome: 'Mariana Costa',
    especialidade: 'Expert em Pós-Obra',
    avaliacao: 4.7,
    precoHora: 'R$ 90+',
    imagemUrl: 'https://picsum.photos/seed/mariana_costa_posobra/700/500',
    numeroAvaliacoes: 55,
    isVerificado: true,
    descricaoCompleta: 'Especializada na remoção de sujeira pesada, respingos de tinta e resíduos de construção. Deixo seu imóvel novo ou recém-reformado impecável e pronto para uso, com equipamento e produtos específicos.',
    cidade: 'Vinhedo, SP',
    anosExperiencia: 3,
    // Sem reviews mock para variar
    servicoPrincipal: 'Limpeza Pós-Construção',
    precoOriginal: '$300',
    precoComDesconto: '$250',
  },
];

const fetchProviderDetailsFromAPI = async (id: string): Promise<ProviderDetails | undefined> => {
  await new Promise(resolve => setTimeout(resolve, 600));
  return TODOS_OS_PRESTADORES_DETALHES.find(p => p.id === id);
};

// --- Componente ---
export default function ProviderDetailsScreen() {
  const params = useLocalSearchParams<{ providerId: string }>();
  const providerId = params.providerId;
  const router = useRouter();

  const [provider, setProvider] = useState<ProviderDetails | null | undefined>(undefined);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'Overview' | 'Details'>('Overview');

  const mainContentAnim = useRef(new Animated.Value(0)).current; // For opacity and slide
  const bookNowButtonAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (providerId && typeof providerId === 'string') {
      setIsLoading(true); setError(null); setProvider(undefined);
      mainContentAnim.setValue(0); bookNowButtonAnim.setValue(0);

      fetchProviderDetailsFromAPI(providerId)
        .then(data => {
          setProvider(data || null);
          if (!data) {
            setError(`Profissional com ID "${providerId}" não encontrado.`);
          } else {
            // Start animations after data is set and component is ready to render actual content
            Animated.stagger(100, [
              Animated.timing(mainContentAnim, { toValue: 1, duration: 500, useNativeDriver: true }),
              Animated.timing(bookNowButtonAnim, { toValue: 1, duration: 400, useNativeDriver: true })
            ]).start();
          }
        })
        .catch(err => { setError(err.message || "Erro ao carregar."); setProvider(null); })
        .finally(() => setIsLoading(false));
    } else {
      setError("ID do profissional inválido."); setIsLoading(false); setProvider(null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [providerId]);


  // --- Renderização ---
  if (isLoading) {
    return (
      <View style={styles.centeredFeedback}>
        <Stack.Screen options={{ title: "Carregando...", headerTransparent: true, headerTintColor: '#333' }} />
        <ActivityIndicator size="large" color="#007AFF" />
      </View>
    );
  }
  if (error || !provider) {
    return (
      <View style={styles.centeredFeedback}>
        <Stack.Screen options={{ title: "Erro", headerTransparent: false, headerStyle: { backgroundColor: '#FFFFFF' }, headerTintColor: '#333' }} />
        <Ionicons name="warning-outline" size={48} color="#D32F2F" />
        <Text style={styles.errorText}>{error || `Profissional não encontrado.`}</Text>
        <TouchableOpacity style={styles.errorBackButton} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={20} color="#fff" />
          <Text style={styles.errorBackButtonText}>Voltar</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // Função para renderizar estrelas com cor personalizável e "sofisticação"
  const renderStars = (rating: number, size: number = 14, color: string = '#007AFF') => { // Cor padrão agora é azul
    const stars = [];
    const fullStars = Math.floor(rating);
    const halfStar = rating % 1 >= 0.5;
    const emptyStars = 5 - fullStars - (halfStar ? 1 : 0);

    for (let i = 0; i < fullStars; i++) stars.push(<Ionicons key={`full_${i}`} name="star" size={size} color={color} />);
    if (halfStar) stars.push(<Ionicons key="half" name="star-half-sharp" size={size} color={color} />);
    for (let i = 0; i < emptyStars; i++) stars.push(<Ionicons key={`empty_${i}`} name="star-outline" size={size} color={color} />);
    return stars;
  };

  return (
    <View style={styles.screenContainer}>
      <Stack.Screen options={{ headerTransparent: true, title: '', headerLeft: () => null, headerRight: () => null }} />
      <ScrollView contentContainerStyle={styles.scrollContentContainer}>
        <ImageBackground source={{ uri: provider.imagemUrl }} style={styles.headerImage} resizeMode="cover">
          <View style={styles.headerImageOverlay}>
            <View style={styles.topNavContainer}>
              <TouchableOpacity onPress={() => router.back()} style={styles.iconButtonBackground}>
                <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
              </TouchableOpacity>
              <TouchableOpacity style={styles.iconButtonBackground}>
                <Ionicons name="bookmark-outline" size={22} color="#FFFFFF" />
              </TouchableOpacity>
            </View>
            <View style={styles.imageTextDetailsOverlay}>
              <View style={styles.nameAndLocationContainer}>
                <Text style={styles.providerNameOnImage} numberOfLines={2}>{provider.nome}</Text>
                <View style={styles.locationOnImageContainer}>
                  <Ionicons name="location-sharp" size={16} color="#E0E0E0" />
                  <Text style={styles.locationTextOnImage}>{provider.cidade || 'N/A'}</Text>
                </View>
              </View>
              <Text style={styles.priceTextOnImage}>{provider.precoHora.replace('/h', '')}</Text>
            </View>
          </View>
        </ImageBackground>

        <Animated.View style={[
          styles.contentArea,
          {
            opacity: mainContentAnim,
            transform: [{
              translateY: mainContentAnim.interpolate({ inputRange: [0, 1], outputRange: [20, 0] })
            }]
          }
        ]}>
          <View style={styles.tabBar}>
            <TouchableOpacity style={[styles.tabItem, activeTab === 'Overview' && styles.activeTabItem]} onPress={() => setActiveTab('Overview')}>
              <Text style={[styles.tabText, activeTab === 'Overview' && styles.activeTabText]}>Visão Geral</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.tabItem, activeTab === 'Details' && styles.activeTabItem]} onPress={() => setActiveTab('Details')}>
              <Text style={[styles.tabText, activeTab === 'Details' && styles.activeTabText]}>Detalhes</Text>
            </TouchableOpacity>
          </View>

          {activeTab === 'Overview' && (
            <View style={styles.tabContentContainer}>
              {/* Seção de Estrelas Robustas e Sofisticadas (Azuis) - Abaixo do Overview/Detalhes */}
              {/* As estrelas azuis e o texto "240 avaliações" (mantendo o tamanho menor e fonte mais moderna) */}
              <View style={styles.robustStarContainer}>
                {renderStars(provider.avaliacao, 20, '#007AFF')} {/* Estrelas maiores e azuis */}
                <Text style={styles.robustReviewsText}>({provider.numeroAvaliacoes} avaliações)</Text>
              </View>

              <View style={styles.infoChipsContainer}>
                {provider.anosExperiencia !== undefined && (
                  <View style={styles.infoChip}><Ionicons name="hourglass-outline" size={16} color="#555" /><Text style={styles.infoChipText}>{provider.anosExperiencia}+ anos</Text></View>
                )}
                {provider.isVerificado && (
                  <View style={styles.infoChip}><Ionicons name="shield-checkmark-outline" size={16} color="#555" /><Text style={styles.infoChipText}>Verificado</Text></View>
                )}
                {/* O chip de avaliação duplicaria, então mantemos apenas as estrelas robustas acima */}
                {/* <View style={styles.infoChip}><Ionicons name="star-outline" size={16} color="#555" /><Text style={styles.infoChipText}>{provider.avaliacao.toFixed(1)} ({provider.numeroAvaliacoes} {provider.numeroAvaliacoes === 1 ? 'avaliação' : 'avaliações'})</Text></View> */}
              </View>

              <Text style={styles.sectionTitle}>Sobre {provider.nome.split(' ')[0]}</Text>
              <Text style={styles.descriptionText}>{provider.descricaoCompleta || "Nenhuma descrição detalhada disponível."}</Text>

              {/* Botões de Ação (Ligar, Chat, Mapa, Compartilhar) - Abaixo da descrição do prestador */}
              <View style={styles.actionButtonsContainer}>
                <TouchableOpacity style={styles.actionButton}>
                  <Ionicons name="call-outline" size={24} color="#666" />
                  <Text style={styles.actionButtonText}>Ligar</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.actionButton}>
                  <Ionicons name="chatbox-ellipses-outline" size={24} color="#666" />
                  <Text style={styles.actionButtonText}>Chat</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.actionButton}>
                  <Ionicons name="map-outline" size={24} color="#666" />
                  <Text style={styles.actionButtonText}>Mapa</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.actionButton}>
                  <Ionicons name="share-social-outline" size={24} color="#666" />
                  <Text style={styles.actionButtonText}>Share</Text>
                </TouchableOpacity>
              </View>


              <Text style={[styles.sectionTitle, { marginTop: 25 }]}>O que dizem os clientes</Text>
              {provider.reviews && provider.reviews.length > 0 ? (
                provider.reviews.map(review => (
                  <View key={review.id} style={styles.reviewCard}>
                    <View style={styles.reviewHeader}>
                      {review.reviewerImageUrl ?
                        <Image source={{ uri: review.reviewerImageUrl }} style={styles.reviewerImage} /> :
                        <View style={styles.reviewerImagePlaceholder}><Ionicons name="person-circle-outline" size={24} color="#FFF" /></View>
                      }
                      <View style={styles.reviewHeaderText}>
                        <Text style={styles.reviewerName}>{review.reviewerName}</Text>
                        <View style={styles.reviewRatingDate}>
                          {/* Estrelas das reviews agora serão azuis com o mesmo tamanho */}
                          <View style={styles.starRatingContainer}>{renderStars(review.rating, 14, '#007AFF')}</View>
                          <Text style={styles.reviewDate}>{review.date}</Text>
                        </View>
                      </View>
                    </View>
                    <Text style={styles.reviewComment}>{review.comment}</Text>
                  </View>
                ))
              ) : (
                <Text style={styles.noReviewsText}>Ainda não há avaliações para {provider.nome.split(' ')[0]}.</Text>
              )}
              <TouchableOpacity style={styles.addReviewButton}>
                <Ionicons name="add-circle-outline" size={20} color="#007AFF" />
                <Text style={styles.addReviewButtonText}>Deixar uma Avaliação</Text>
              </TouchableOpacity>

            </View>
          )}

          {activeTab === 'Details' && (
            <View style={styles.tabContentContainer}>
              <Text style={styles.sectionTitle}>Serviços Oferecidos</Text>
              {provider.servicosOferecidos && provider.servicosOferecidos.length > 0 ? (
                provider.servicosOferecidos.map((serv, index) => (
                  <View key={index} style={styles.serviceItemCard}>
                    <Text style={styles.serviceName}>{serv.nome}</Text>
                    {serv.descricao && <Text style={styles.serviceDescription}>{serv.descricao}</Text>}
                    {serv.preco && <Text style={styles.servicePriceTag}>{serv.preco}</Text>}
                  </View>
                ))
              ) : (<Text style={styles.noDetailsText}>Nenhum serviço específico detalhado.</Text>)}

              {provider.disponibilidadeObservacao && (
                <>
                  <Text style={[styles.sectionTitle, { marginTop: 25 }]}>Observações de Disponibilidade</Text>
                  <Text style={styles.availabilityText}>{provider.disponibilidadeObservacao}</Text>
                </>
              )}
            </View>
          )}
        </Animated.View>
      </ScrollView>

      <Animated.View style={[
        styles.bookNowButtonWrapper,
        {
          opacity: bookNowButtonAnim,
          transform: [{
            translateY: bookNowButtonAnim.interpolate({ inputRange: [0, 1], outputRange: [100, 0] })
          }]
        }
      ]}>
        {/* Botão "Agendar Serviço" - Ajustado para ser fiel ao print */}
        <TouchableOpacity style={styles.bookServiceButton} onPress={() => router.push({ pathname: `/(client)/bookings/schedule-service`, params: { providerId: provider.id } })}>
          <Text style={styles.bookServiceButtonText}>Agendar Serviço</Text>
        </TouchableOpacity>
      </Animated.View>
    </View>
  );
}

// --- Estilos ---
const styles = StyleSheet.create({
  screenContainer: { flex: 1, backgroundColor: '#FFFFFF' }, // Fundo geral claro
  centeredFeedback: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20, backgroundColor: '#F8F9FA' },
  loadingText: { marginTop: 12, fontSize: 16, color: '#555' },
  errorText: { fontSize: 17, color: '#D32F2F', textAlign: 'center', marginBottom: 25 },
  errorBackButton: { backgroundColor: '#007AFF', paddingVertical: 12, paddingHorizontal: 30, borderRadius: 25, flexDirection: 'row', alignItems: 'center' },
  errorBackButtonText: { color: '#fff', fontSize: 16, marginLeft: 8, fontWeight: '600' },
  scrollContentContainer: { paddingBottom: 110 }, // Aumentado para mais espaço para o botão fixo

  headerImage: { width: '100%', height: SCREEN_WIDTH * 0.85, justifyContent: 'space-between' }, // Ajuste altura
  headerImageOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.30)', paddingHorizontal: 15, paddingTop: Platform.OS === 'ios' ? 50 : 25, paddingBottom: 15, justifyContent: 'space-between' },
  topNavContainer: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  iconButtonBackground: { backgroundColor: 'rgba(0,0,0,0.35)', padding: 10, borderRadius: 20 }, // Mais padding
  imageTextDetailsOverlay: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', paddingVertical: 12, paddingHorizontal: 15, backgroundColor: 'rgba(0,0,0,0.55)', borderRadius: 12 }, // Mais padding e borda
  nameAndLocationContainer: { flex: 1, marginRight: 10 },
  providerNameOnImage: { fontSize: 20, fontWeight: '700', color: '#FFFFFF', marginBottom: 3 }, // Ajuste tamanho
  locationOnImageContainer: { flexDirection: 'row', alignItems: 'center' },
  locationTextOnImage: { fontSize: 13, color: '#E0E0E0', marginLeft: 5 }, // Ajuste tamanho
  priceTextOnImage: { fontSize: 18, fontWeight: '700', color: '#FFFFFF' }, // Ajuste tamanho

  contentArea: {
    paddingHorizontal: 0,
    paddingTop: 20,
    backgroundColor: '#FFFFFF', // Fundo branco para a área de conteúdo
    borderTopLeftRadius: 24, // Mais arredondado
    borderTopRightRadius: 24,
    marginTop: -24, // Sobreposição mais pronunciada
    minHeight: Dimensions.get('window').height * 0.5, // Garante que a área branca seja visível
  },
  tabBar: { flexDirection: 'row', marginBottom: 10, paddingHorizontal: 20, borderBottomWidth: 1, borderBottomColor: '#F0F0F0' }, // Borda mais sutil
  tabItem: { paddingBottom: 12, marginRight: 25 }, // Aumento espaçamento
  activeTabItem: { borderBottomWidth: 3, borderBottomColor: '#111111' }, // Sublinhado mais grosso
  tabText: { fontSize: 15, color: '#888888', fontWeight: '600' }, // Mais peso
  activeTabText: { color: '#111111', fontWeight: '700' },
  tabContentContainer: { paddingHorizontal: 20, paddingTop: 15 },

  // Estilos para as estrelas robustas e sofisticadas (azuis)
  robustStarContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
    paddingVertical: 5,
    paddingHorizontal: 0, // Removido o padding horizontal para não ter fundo
    backgroundColor: 'transparent', // Fundo transparente
    borderRadius: 8,
    // Removida a sombra para não ter fundo
    // shadowColor: '#007AFF',
    // shadowOffset: { width: 0, height: 2 },
    // shadowOpacity: 0.1,
    // shadowRadius: 3,
    // elevation: 2,
  },
  robustReviewsText: {
    fontSize: 14, // Mantendo o tamanho menor
    fontFamily: 'sans-serif', // Tentativa de fonte mais moderna (pode precisar de importação para fontes customizadas)
    color: '#333', // Cor do texto de reviews
    marginLeft: 8,
    fontWeight: '500', // Fonte mais sofisticada/moderna
  },

  infoChipsContainer: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 20 },
  infoChip: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F0F0F0', paddingVertical: 7, paddingHorizontal: 12, borderRadius: 16 },
  infoChipText: { fontSize: 12, color: '#333333', marginLeft: 6, fontWeight: '500' },

  sectionTitle: { fontSize: 18, fontWeight: '700', color: '#111111', marginBottom: 12 },
  descriptionText: { fontSize: 15, lineHeight: 24, color: '#555555', textAlign: 'left', marginBottom: 25 },

  // Estilos para os botões de ação (Ligar, Chat, Mapa, Compartilhar) - Fiel ao print
  actionButtonsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 1,
    marginBottom: 25, // Espaçamento após os botões
    borderTopWidth: 1, // Linha divisória como no print
    borderTopColor: '#EEE',
    paddingTop: 15,
  },
  actionButton: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F0F0F0', // Fundo cinza claro
    borderRadius: 12,
    width: (SCREEN_WIDTH - (20 * 2) - (15 * 3)) / 4, // Calcula a largura para 4 botões com margens
    height: 70, // Altura fixa
  },
  actionButtonText: {
    fontSize: 12,
    color: '#666', // Cor do texto dos botões
    marginTop: 5,
    fontWeight: '500',
  },


  reviewCard: {
    backgroundColor: '#F8F9FA', // Fundo levemente diferente
    borderRadius: 10,
    padding: 15,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: '#E9ECEF',
  },
  reviewHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  reviewerImage: { width: 40, height: 40, borderRadius: 20, marginRight: 10 },
  reviewerImagePlaceholder: { width: 40, height: 40, borderRadius: 20, marginRight: 10, backgroundColor: '#CED4DA', justifyContent: 'center', alignItems: 'center' },
  reviewHeaderText: { flex: 1 },
  reviewerName: { fontSize: 15, fontWeight: '600', color: '#343A40' },
  reviewRatingDate: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 2 },
  starRatingContainer: { flexDirection: 'row' },
  reviewDate: { fontSize: 12, color: '#6C757D' },
  reviewComment: { fontSize: 14, lineHeight: 20, color: '#495057' },
  noReviewsText: { fontSize: 14, color: '#6C757D', fontStyle: 'italic', textAlign: 'center', paddingVertical: 15 },
  addReviewButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 8,
    backgroundColor: '#E9F5FF', // Fundo azul claro
    marginTop: 10,
    marginBottom: 15,
  },
  addReviewButtonText: { color: '#007AFF', fontSize: 15, fontWeight: '600', marginLeft: 8 },

  serviceItemCard: { backgroundColor: '#F8F9FA', padding: 15, borderRadius: 10, marginBottom: 10, borderWidth: 1, borderColor: '#E9ECEF' },
  serviceName: { fontSize: 16, fontWeight: '600', color: '#343A40', marginBottom: 4 },
  serviceDescription: { fontSize: 14, color: '#6C757D', marginBottom: 6 },
  servicePriceTag: { fontSize: 14, fontWeight: '700', color: '#007AFF', alignSelf: 'flex-end' },
  noDetailsText: { fontSize: 14, color: '#6C757D', fontStyle: 'italic', marginVertical: 10 },
  availabilityText: { fontSize: 14, lineHeight: 21, color: '#495057' },

  bookNowButtonWrapper: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 20,
    paddingVertical: 15,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E9ECEF', // Sombra sutil com borda
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 5,
  },
  // Botão "Agendar Serviço" fiel ao print
  bookServiceButton: {
    backgroundColor: '#007AFF', // Cor azul do print
    paddingVertical: 15,
    borderRadius: 12, // Arredondamento do print
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  bookServiceButtonText: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '700',
  },
});