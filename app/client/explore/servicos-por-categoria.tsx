// LimpeJaApp/app/client/explore/servicos-por-categoria.tsx
import React from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity } from 'react-native';
import { useLocalSearchParams, Stack, useRouter } from 'expo-router';
import { withData } from '../../../hocs/withData';
import { getServicesByCategoryId } from '../../../services/providerService'; // OU '../../../services/categoryService'
import ServiceCard from '../../../components/ServiceCard';

import { Ionicons } from '@expo/vector-icons';
import { AppColors } from '../../../constants/appStyles';

// Interface dos serviços (ajuste conforme backend)
interface Service {
  id: string;
  name: string;
  description?: string;
  price?: number;
  rating?: number;
  imageUrl?: string;
}

// Props que vêm do HOC
interface ServicosPorCategoriaContentProps {
  data: Service[];
  loading: boolean;
  error: any;
  refetch: () => void;
  categoriaId: string;
  categoriaNome: string;
}

const ServicosPorCategoriaContent: React.FC<ServicosPorCategoriaContentProps> = ({
  data,
  loading,
  error,
  refetch,
  categoriaId,
  categoriaNome,
}) => {
  const router = useRouter();

 const handleServicePress = (serviceId: string) => {
  router.push({
    pathname: '/client/category/[categoryId]',
    params: {
      categoryId: serviceId,
      categoryName: categoriaNome,
    },
  });
};

  return (
    <View style={styles.container}>
      <Stack.Screen
        options={{
          title: categoriaNome || 'Serviços da Categoria',
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
      <Text style={styles.title}>Serviços para: {categoriaNome}</Text>
   <FlatList
  data={data}
  keyExtractor={(item) => item.id}
  renderItem={({ item }) => (
    <ServiceCard
      id={item.id}
      name={item.name}
      description={item.description}
      price={item.price}
      onPress={handleServicePress}
    />
  )}
  contentContainerStyle={styles.listContentContainer}
  onRefresh={refetch}
  refreshing={loading}
  ListEmptyComponent={
    <Text style={{ textAlign: 'center', marginTop: 20, color: AppColors.textBody }}>
      Nenhum serviço encontrado para {categoriaNome || 'esta categoria'}.
    </Text>
  }
/>

    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: AppColors.backgroundLight,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 10,
    textAlign: 'center',
    color: AppColors.textBody,
    marginTop: 10,
  },
  listContentContainer: {
    paddingVertical: 10,
    paddingHorizontal: 5,
  },
});

const ServicosPorCategoriaWrapped = withData(ServicosPorCategoriaContent);

export default function ServicosPorCategoriaScreen() {
  const { categoriaId, categoriaNome } = useLocalSearchParams<{
    categoriaId: string;
    categoriaNome: string;
  }>();

  const fetcherFunction = React.useCallback(() => {
    if (!categoriaId) return Promise.resolve([]);
    return getServicesByCategoryId(categoriaId as string);
  }, [categoriaId]);

  return (
    <ServicosPorCategoriaWrapped
      fetcher={fetcherFunction}
      categoriaId={categoriaId as string}
      categoriaNome={categoriaNome as string}
    />
  );
}
