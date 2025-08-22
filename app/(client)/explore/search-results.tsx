// LimpeJaApp/app/(client)/explore/search-results.tsx
import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  FlatList,
  RefreshControl,
  TouchableOpacity,
} from 'react-native';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useQuery } from '@tanstack/react-query';
import { searchProviders } from '../../../services/providerService';
import ProviderCard from '../../../components/ProviderCard';
import { IProvider } from '../../../types/backend/IProvider';
import { API_QUERY_KEYS } from '../../../constants/queryKeys';

export default function SearchResultsScreen() {
  const router = useRouter();
  const { query, categoryId } = useLocalSearchParams();

  // Utiliza o hook useQuery para gerenciar o estado da busca
  const {
    data: providers,
    isLoading,
    isError,
    refetch,
    isRefetching,
  } = useQuery({
    queryKey: [API_QUERY_KEYS.SEARCH_PROVIDERS, { query, categoryId }],
    queryFn: () => {
      // O endpoint searchProviders pode lidar com os dois tipos de filtro
      return searchProviders({ query: query as string, categoryId: categoryId as string });
    },
    enabled: !!query || !!categoryId, // A busca só é disparada se houver query ou categoryId
  });

  const onRefresh = () => {
    refetch();
  };

  const renderHeaderTitle = () => {
    return (
      <View style={styles.headerTitleContainer}>
        <Text style={styles.headerTitle}>
          {query ? `Resultados para "${query}"` : 'Prestadores de Serviço'}
        </Text>
      </View>
    );
  };

  const renderContent = () => {
    if (isLoading) {
      return (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color="#007BFF" />
          <Text style={styles.loadingText}>Buscando prestadores...</Text>
        </View>
      );
    }

    if (isError) {
      return (
        <View style={styles.centered}>
          <Ionicons name="alert-circle-outline" size={50} color="#D32F2F" />
          <Text style={styles.errorText}>
            Não foi possível carregar os prestadores de serviço. Tente novamente.
          </Text>
          <TouchableOpacity onPress={() => refetch()} style={styles.retryButton}>
            <Text style={styles.retryButtonText}>Tentar Novamente</Text>
          </TouchableOpacity>
        </View>
      );
    }

    if (!providers || providers.length === 0) {
      return (
        <View style={styles.centered}>
          <Ionicons name="sad-outline" size={50} color="#6C757D" />
          <Text style={styles.noResultsText}>
            Nenhum prestador de serviço encontrado para esta busca.
          </Text>
        </View>
      );
    }

    return (
      <FlatList
        data={providers}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <ProviderCard
            provider={item}
            onPress={() => router.push(`/(client)/explore/${item.id}`)}
          />
        )}
        contentContainerStyle={styles.listContainer}
        refreshControl={
          <RefreshControl refreshing={isRefetching} onRefresh={onRefresh} />
        }
      />
    );
  };

  return (
    <View style={styles.container}>
      <Stack.Screen
        options={{
          headerTitle: () => renderHeaderTitle(),
          headerShadowVisible: false,
          headerStyle: {
            backgroundColor: '#F0F8FF',
          },
          headerLeft: () => (
            <TouchableOpacity onPress={() => router.back()} style={{ marginLeft: 10 }}>
              <Ionicons name="arrow-back" size={24} color="#2F4F4F" />
            </TouchableOpacity>
          ),
        }}
      />
      {renderContent()}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F0F8FF',
  },
  headerTitleContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2F4F4F',
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#6C757D',
  },
  errorText: {
    marginTop: 10,
    fontSize: 16,
    color: '#D32F2F',
    textAlign: 'center',
  },
  noResultsText: {
    marginTop: 10,
    fontSize: 16,
    color: '#6C757D',
    textAlign: 'center',
  },
  retryButton: {
    marginTop: 20,
    backgroundColor: '#007BFF',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  listContainer: {
    paddingHorizontal: 15,
    paddingVertical: 10,
  },
});