// LimpeJaApp/app/client/explore/resultados-busca.tsx
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
import { useLocalSearchParams, Stack, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useQuery } from '@tanstack/react-query'; // Importar useQuery
import { searchProviders } from '../../../services/providerService'; // Importar seu serviço de busca
import ProviderCard from '../../../components/ProviderCard'; // Importar seu componente de card
import { ProviderDisplayInfo } from '../../../types/backend/providers'; // Importar seu tipo
import { API_QUERY_KEYS } from '../../../constants/queryKeys'; // Importar suas chaves de query
import { AppColors } from '../../../constants/appStyles'; // Importar suas cores

const isProviderVerified = (provider: ProviderDisplayInfo) =>
  provider.verificationStatus === 'APPROVED' || Boolean(provider.user?.isVerified);

export default function ResultadosBuscaScreen() {
  const router = useRouter();
  const { termoBusca } = useLocalSearchParams<{ termoBusca: string }>();

  const {
    data: providers,
    isLoading,
    isError,
    refetch,
    isRefetching,
  } = useQuery<ProviderDisplayInfo[]>({
    queryKey: [API_QUERY_KEYS.SEARCH_PROVIDERS, termoBusca],
    queryFn: () => searchProviders({ searchTerm: termoBusca as string }),
    enabled: !!termoBusca, // Habilitar a query apenas se houver termo de busca
  });

  const onRefresh = () => {
    refetch();
  };

  const handleProviderPress = (providerId: string) => {
    // FIX: Caminho correto para o perfil do provedor
    router.push({
      pathname: '/client/explore/[providerId]', // Caminho ajustado
      params: { providerId: providerId }
    });
  };

  const renderContent = () => {
    if (isLoading) {
      return (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={AppColors.primaryInteractive} />
          <Text style={styles.loadingText}>Buscando prestadores...</Text>
        </View>
      );
    }

    if (isError) {
      return (
        <View style={styles.centered}>
          <Ionicons name="alert-circle-outline" size={50} color={AppColors.errorRed} />
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
          <Ionicons name="sad-outline" size={50} color={AppColors.mediumGray} />
          <Text style={styles.noResultsText}>
            Nenhum prestador de serviço encontrado para esta busca.
          </Text>
          <TouchableOpacity onPress={() => router.back()} style={styles.retryButton}>
            <Text style={styles.retryButtonText}>Refinar Busca</Text>
          </TouchableOpacity>
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
            onPress={handleProviderPress} // Passa a função handleProviderPress
            isVerified={isProviderVerified(item)}
          />
        )}
        contentContainerStyle={styles.listContainer}
        refreshControl={
          <RefreshControl refreshing={isRefetching} onRefresh={onRefresh} tintColor={AppColors.primaryInteractive} />
        }
      />
    );
  };

  return (
    <View style={styles.container}>
      <Stack.Screen
        options={{
          title: `Resultados para: "${termoBusca}"`,
          headerShadowVisible: false,
          headerStyle: {
            backgroundColor: AppColors.backgroundLight,
          },
          headerLeft: () => (
            <TouchableOpacity onPress={() => router.back()} style={{ marginLeft: 10 }}>
              <Ionicons name="arrow-back" size={24} color={AppColors.textBody} />
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
    backgroundColor: AppColors.backgroundLight,
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
    color: AppColors.textAuxiliary,
  },
  errorText: {
    marginTop: 10,
    fontSize: 16,
    color: AppColors.errorRed,
    textAlign: 'center',
  },
  noResultsText: {
    marginTop: 10,
    fontSize: 16,
    color: AppColors.textAuxiliary,
    textAlign: 'center',
  },
  retryButton: {
    marginTop: 20,
    backgroundColor: AppColors.primaryInteractive,
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
  },
  retryButtonText: {
    color: AppColors.white,
    fontSize: 16,
    fontWeight: '600',
  },
  listContainer: {
    paddingHorizontal: 5,
    paddingVertical: 10,
  },
});
