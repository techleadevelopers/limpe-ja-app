// LimpeJaApp/app/(client)/explore/todas-categorias.tsx
import React from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity } from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { withData } from '../../../hocs/withData'; // Importar o HOC (arquivo novo)
import { getCategories } from '../../../services/categoryService'; // Importar seu serviço de categorias
import CategoryCard from '../../../components/client/explore/home/CategoriaCard'; // FIX: Importar seu componente de card (verifique o caminho)
import { Ionicons } from '@expo/vector-icons';
import { AppColors } from '../../../constants/appStyles'; // Importar suas cores

// Definir a interface para a sua estrutura de categoria (se não estiver em types/backend)
interface Category {
  id: string;
  name: string;
  icon?: string;
}

// Definir a interface para as props que o HOC withData injetará
interface InjectedDataProps {
  data: Category[];
  loading: boolean;
  error: any;
  refetch: () => void;
}

// Componente de Conteúdo que receberá as props injetadas pelo HOC
const TodasCategoriasContent: React.FC<InjectedDataProps> = ({ data, loading, error, refetch }) => {
  const router = useRouter();

  const handleCategoryPress = (categoryId: string, categoryName: string) => {
    // FIX: Caminho correto para a tela de serviços por categoria
    router.push({
      pathname: '/category/[categoryId]', // Caminho ajustado
      params: { categoryId: categoryId, categoryName: categoryName }
    });
  };

  return (
    <View style={styles.container}>
      <Stack.Screen
        options={{
          title: 'Todas as Categorias',
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
      <Text style={styles.title}>Todas as Categorias</Text>
   <FlatList
  data={data}
  keyExtractor={(item) => item.id}
  renderItem={({ item }) => (
    <CategoryCard item={item} />
  )}
  contentContainerStyle={styles.listContentContainer}
  onRefresh={refetch}
  refreshing={loading}
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

// Componente Wrapper que usará o HOC e passará as props específicas do HOC
const TodasCategoriasWrapped = withData(TodasCategoriasContent);

export default function TodasCategoriasScreen() {
  return (
    <TodasCategoriasWrapped
      fetcher={getCategories} // Passa seu serviço getCategories
      emptyMessage='Nenhuma categoria encontrada.'
      emptySubMessage='Tente novamente mais tarde.'
    />
  );
}