// LimpeJaApp/app/(client)/services/category/[categoryId].tsx
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useState, useRef } from 'react';
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
import CategoryProviderCard from '../../../components/CategoryProviderCard'; // Caminho ajustado para o novo componente
// Importar o serviço para buscar provedores
import { getProvidersByServiceCategory } from '../../../services/providerService';
// Importar a tipagem de ProviderDisplayInfo
import { ProviderDisplayInfo } from '../../../types/backend/providers';

const FilteredProvidersScreen: React.FC = () => {
  const router = useRouter();
  const { categoryId, categoryName } = useLocalSearchParams<{ categoryId: string; categoryName: string }>();

  const [providers, setProviders] = useState<ProviderDisplayInfo[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
  const fetchProviders = async (refresh = false) => {
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
  };

  // useEffect para carregar os dados quando a tela é montada ou o categoryId muda
  useEffect(() => {
    fetchProviders();
  }, [categoryId]); // Dependência em categoryId para recarregar se a categoria mudar

  // Função para o Pull-to-Refresh
  const onRefresh = React.useCallback(() => {
    setIsRefreshing(true);
    fetchProviders(true);
  }, [fetchProviders]);

  // Função para lidar com o clique em um cartão de prestador
  const handleProviderPress = (providerId: string) => {
    router.push({
      pathname: '/(client)/providers/[providerId]',
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
            <Ionicons name="arrow-back" size={24} color="#FFF" />
          </TouchableOpacity>
          <Text style={styles.greetingText}>{categoryName || 'Prestadores'}</Text>
          <View style={styles.headerIcons}>
            <TouchableOpacity style={styles.iconButton}>
              <Ionicons name="search-outline" size={24} color="#FFF" />
            </TouchableOpacity>
            <TouchableOpacity style={styles.iconButton}>
              <Ionicons name="ellipsis-vertical" size={24} color="#FFF" />
            </TouchableOpacity>
          </View>
        </View>
      </Animated.View>

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
        />
      ) : (
        renderEmptyState()
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F0F8FF',
  },
  mainHeader: {
    backgroundColor: '#4A90E2',
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'ios' ? 60 : 20,
    paddingBottom: 15,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 5,
    elevation: 8,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  greetingText: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#FFFFFF',
    flex: 1,
    textAlign: 'center',
    marginLeft: -24,
  },
  headerIcons: {
    flexDirection: 'row',
  },
  iconButton: {
    padding: 8,
    marginLeft: 10,
  },
  headerBackButton: {
    padding: 8,
    marginRight: 10,
  },
  listContentContainer: {
    paddingVertical: 15,
    paddingHorizontal: 10, // Padding horizontal ajustado para a lista
  },
  centeredFeedback: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#F0F8FF',
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
    backgroundColor: '#4A90E2',
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