// LimpeJaApp/app/client/category/[categoryId].tsx (ou services/category/[categoryId].tsx)
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import React, { useCallback, useEffect, useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  FlatList,
  RefreshControl,
  Platform,
  TouchableOpacity,
  Animated,
  Easing,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

// Importar o NOVO componente CategoryProviderCard para reutilizar a UI
import CategoryProviderCard from '../../../components/client/explore/category/CategoryProviderCard';
// Importar o serviço para buscar provedores
import { getProvidersByServiceCategory } from '../../../services/providerService';
// Importar a tipografia de ProviderDisplayInfo
import { ProviderDisplayInfo } from '../../../types/backend/providers';
// Importar o NavBar e seus tipos (ajuste o caminho se necessário)
import NavBar from '../../../components/client/explore/home/NavBar';

const FilteredProvidersScreen: React.FC = () => {
  const router = useRouter();
  const { categoryId, categoryName } = useLocalSearchParams<{ categoryId: string; categoryName: string }>();

  const [providers, setProviders] = useState<ProviderDisplayInfo[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Props necessárias para NavBar (corrigidas para o tipo exato: 'coupon' | 'referral' | null)
  const [activeBottomPromotion, setActiveBottomPromotion] = useState<'coupon' | 'referral' | null>(null); // Tipo corrigido: não boolean
  const welcomeCouponOffer = null; // Default: null (tipo any aceita isso; mude para objeto se houver oferta real)

  // Animated values for header and feedback
  const headerAnim = useRef(new Animated.Value(0)).current;
  const feedbackAnim = useRef(new Animated.Value(0)).current;

  // Initial animations for header and feedback
  useEffect(() => {
    Animated.timing(headerAnim, {
      toValue: 1,
      duration: 500,
      easing: Easing.out(Easing.ease),
      useNativeDriver: true,
    }).start();

    // Feedback animation (for loading/empty/error states)
    // Only animate feedback when content is ready or state changes
    if (!isLoading && !isRefreshing) {
        Animated.timing(feedbackAnim, {
            toValue: 1,
            duration: 500,
            easing: Easing.out(Easing.ease),
            useNativeDriver: true,
        }).start();
    }
  }, [headerAnim, feedbackAnim, isLoading, isRefreshing]);

  // Função para buscar os provedores com base na categoria
  const fetchProviders = useCallback(async (refresh = false) => {
    if (!categoryId) {
      setError('ID da categoria não fornecido.');
      setIsLoading(false);
      return;
    }

    if (!refresh) setIsLoading(true);
    setError(null);

    try {
      const fetchedProviders = await getProvidersByServiceCategory(categoryId);
      setProviders(fetchedProviders);
    } catch (err: any) {
      console.error('Erro ao buscar provedores por categoria:', err);
      setError(err.message || 'Não foi possível carregar os prestadores desta categoria.');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
      // Trigger feedback animation after data is loaded/error occurs
      Animated.timing(feedbackAnim, {
          toValue: 1,
          duration: 500,
          easing: Easing.out(Easing.ease),
          useNativeDriver: true,
      }).start();
    }
  }, [categoryId, feedbackAnim]);

  // useEffect para carregar os dados quando a tela é montada ou o categoryId muda
  useEffect(() => {
    fetchProviders();
  }, [fetchProviders]); // Dependência em categoryId para recarregar se a categoria mudar

  // Função para o Pull-to-Refresh
  const onRefresh = React.useCallback(() => {
    setIsRefreshing(true);
    fetchProviders(true);
  }, [fetchProviders]);

  // Função para lidar com o clique em um cartão de prestador
  const handleProviderPress = (providerId: string) => {
    router.push({
      pathname: '/client/explore/[providerId]',
      params: { providerId: providerId }
    });
  };

  // Componente para exibir quando não há prestadores
  const renderEmptyState = () => (
    <Animated.View style={[styles.centeredFeedback, { opacity: feedbackAnim }]}>
      <Ionicons name="sad-outline" size={60} color="#CED4DA" />
      <Text style={styles.emptyStateText}>Nenhum prestador encontrado para esta categoria.</Text>
      <Text style={styles.emptyStateSubText}>Tente outra categoria ou verifique mais tarde.</Text>
    </Animated.View>
  );

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />

      <Animated.View style={[styles.mainHeader, { opacity: headerAnim, transform: [{ translateY: headerAnim.interpolate({ inputRange: [0, 1], outputRange: [-20, 0] }) }] }]}>
        <View style={styles.topRow}>
          <TouchableOpacity onPress={() => router.back()} style={styles.headerBackButton}>
            <Ionicons name="arrow-back" size={24} color="#4A90E2" />
          </TouchableOpacity>
          <View style={styles.greetingContainer}>
            <Text style={styles.greetingText}>{categoryName || 'Prestadores'}</Text>
          </View>
          <View style={styles.headerIcons}>
            <TouchableOpacity style={styles.iconButton}>
              <Ionicons name="search-outline" size={24} color="#4A90E2" />
            </TouchableOpacity>
            <TouchableOpacity style={styles.iconButton}>
              <Ionicons name="ellipsis-vertical" size={24} color="#4A90E2" />
            </TouchableOpacity>
          </View>
        </View>
      </Animated.View>

      <View style={{ flex: 1 }}>
        {isLoading && !isRefreshing ? (
          <Animated.View style={[styles.centeredFeedback, { opacity: feedbackAnim }]}>
              <ActivityIndicator size="large" color="#4A90E2"/>
              <Text style={styles.loadingText}>Carregando prestadores...</Text>
          </Animated.View>
        ) : error ? (
          <Animated.View style={[styles.centeredFeedback, { opacity: feedbackAnim }]}>
              <Ionicons name="alert-circle-outline" size={64} color="red" />
              <Text style={styles.errorText}>{error}</Text>
              <TouchableOpacity onPress={() => fetchProviders()} style={styles.retryButton}>
                  <Text style={styles.retryButtonText}>Tentar Novamente</Text>
              </TouchableOpacity>
          </Animated.View>
        ) : providers.length > 0 ? (
          <FlatList
            data={providers}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <CategoryProviderCard // Usando o NOVO componente
                item={item}
                onPress={handleProviderPress}
              />
            )}
            contentContainerStyle={styles.listContentContainer}
            ListEmptyComponent={renderEmptyState}
            refreshControl={
              <RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} tintColor="#4A90E2" />
            }
            // Otimizações de performance para listas longas (como em Explore)
            removeClippedSubviews
            initialNumToRender={8}
            maxToRenderPerBatch={8}
            windowSize={7}
            getItemLayout={(_, index) => ({ length: 108, offset: 108 * index, index })} // Assumindo altura fixa de ~108px por card; ajuste se necessário
          />
        ) : (
          renderEmptyState()
        )}
      </View>

      {/* NavBar com props obrigatórias passadas corretamente (tipos resolvidos) */}
      <NavBar
        welcomeCouponOffer={welcomeCouponOffer}
        activeBottomPromotion={activeBottomPromotion}
        setActiveBottomPromotion={setActiveBottomPromotion}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F6F8FB', // Fundo neutro claro como nas imagens (Schedule/Provider details)
  },
  mainHeader: {
    backgroundColor: '#FFFFFF', // Fundo branco como em "Detalhes" e "Agendar" nas imagens
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'ios' ? 50 : 20, // Padding para status bar, alinhado com imagens iOS
    paddingBottom: 16, // Padding bottom para separar da lista, como em Provider details
    borderBottomWidth: 1, // Linha sutil de separação como em headers brancos das imagens
    borderBottomColor: '#E9ECEF', // Cor neutra para border
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 }, // Shadow leve para elevação sutil, como em Schedule
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 4, // Elevation baixa para Android, matching clean look
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between', // Back left, icons right, título centralizado
    paddingTop: Platform.OS === 'ios' ? 10 : 0, // Extra para alignment iOS como nas imagens
  },
  greetingContainer: {
    flex: 1,
    alignItems: 'center', // Centraliza o título perfeitamente
    marginHorizontal: 10, // Spacing entre back/título/icons, como em "São Paulo" nas imagens
  },
  greetingText: {
    fontSize: 20, // Tamanho alinhado com títulos das imagens (ex: "Agendar" ou "São Paulo" ~20px)
    fontWeight: '400', // Bold como em Provider details ("Joãoa")
    color: '#586b86ff', // Cor azul para título, como em "Detalhes" e banners das imagens
    textAlign: 'center',
    left: -45,
    letterSpacing: 0.2, // Leve spacing para premium feel, como em Schedule
  },
  headerIcons: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconButton: {
    padding: 8, // Padding consistente com back button
    marginLeft: 8, // Spacing entre icons, como em Explore/Provider actions
  },
  headerBackButton: {
    padding: 8, // Padding arredondado como back em todas as imagens
    borderRadius: 12, // Leve radius para modernidade (opcional, mas alinha com botões em Schedule)
  },
  listContentContainer: {
    paddingVertical: 15,
    paddingHorizontal: 16, // Padding horizontal maior para lista, alinhado com cards nas imagens
  },
  centeredFeedback: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#F6F8FB', // Fundo neutro como container
  },
  loadingText: {
    marginTop: 15,
    fontSize: 16,
    color: '#6C757D',
  },
  errorText: {
    fontSize: 16,
    color: 'red',
    textAlign: 'center',
    marginTop: 10,
  },
  retryButton: {
    marginTop: 20,
    paddingVertical: 10,
    paddingHorizontal: 15,
    backgroundColor: '#4A90E2', // Azul para CTA, como em botões das imagens
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  emptyStateText: {
    fontSize: 20,
    fontWeight: '700',
    color: '#343A40',
    marginTop: 15,
    textAlign: 'center',
  },
  emptyStateSubText: {
    fontSize: 15,
    color: '#6C757D',
    marginTop: 5,
    textAlign: 'center',
    paddingHorizontal: 20,
  },
});

export default FilteredProvidersScreen;
