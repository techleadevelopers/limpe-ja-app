// LimpeJaApp/components/SecaoContainer.tsx
import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, FlatList, ListRenderItem, ListRenderItemInfo } from 'react-native'; // Importar ListRenderItemInfo
import { Ionicons } from '@expo/vector-icons';

// Para tornar o componente mais reutilizável, podemos usar um tipo genérico para os itens da lista
interface SecaoContainerProps<T> {
  titulo: string;
  data: T[]; // Usa o tipo genérico T
  renderItem: ListRenderItem<T>; // Usa ListRenderItem<T> para tipagem forte do renderItem da FlatList
  onVerTudoPress?: () => void;
  horizontal?: boolean;
  // Você pode adicionar outras props comuns a seções, como um placeholder para lista vazia, etc.
}

// Usando o tipo genérico no componente
const SecaoContainer = <T extends { id: string | number }>({ // Garante que os itens tenham um 'id' para o keyExtractor
  titulo,
  data,
  renderItem,
  onVerTudoPress,
  horizontal = true, // Definindo um valor padrão
}: SecaoContainerProps<T>) => {

  // --- VERIFICAÇÃO DEFENSIVA 1: Verifica se a prop 'data' é um array válido ---
  if (!data || !Array.isArray(data)) {
    console.error(`[SecaoContainer] A prop 'data' é inválida ou não é um array: ${data}`);
    // Você pode retornar null, um componente de placeholder, ou uma mensagem de erro aqui
    return null;
  }

  return (
    <View style={styles.secaoContainer}>
      <View style={styles.secaoHeader}>
        <Text style={styles.secaoTitulo}>{titulo}</Text>
        {onVerTudoPress && (
          <TouchableOpacity onPress={onVerTudoPress}>
            <Text style={styles.verTudoTexto}>
              Ver tudo <Ionicons name="arrow-forward" size={14} color="#007AFF" />
            </Text>
          </TouchableOpacity>
        )}
      </View>
      <FlatList
        data={data}
        // --- CORREÇÃO AQUI: Incluir 'separators' na desestruturação e passá-lo adiante ---
        renderItem={({ item, index, separators }: ListRenderItemInfo<T>) => { // Explicitamente tipar para clareza
          if (!item) {
            console.error(`[SecaoContainer] Item inválido (undefined/null) encontrado no índice ${index}!`);
            return null; // Retorna null para este item específico, impedindo que cause erro no componente filho
          }
          // Se o item for válido, chama a função renderItem original fornecida pelo componente pai
          // Agora passa todos os argumentos que a função renderItem original espera
          return renderItem({ item, index, separators });
        }}
        // --- FIM DA CORREÇÃO ---
        keyExtractor={(item, index) => {
          if (!item || item.id === undefined || item.id === null) {
            console.error(`[SecaoContainer] Item inválido (sem ID) encontrado no índice ${index} para keyExtractor:`, item);
            return `invalid-item-${index}-${Math.random()}`;
          }
          return String(item.id);
        }}
        horizontal={horizontal}
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={horizontal ? styles.listaHorizontalPadding : {}}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  secaoContainer: {
    marginTop: 22,
  },
  secaoHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 11,
    paddingHorizontal: 20,
  },
  secaoTitulo: {
    fontSize: 19,
    fontWeight: '700',
    color: '#1C3A5F',
  },
  verTudoTexto: {
    fontSize: 14,
    color: '#007AFF',
    fontWeight: '600',
  },
  listaHorizontalPadding: {
    paddingLeft: 20,
    paddingRight: 10,
  },
});

export default SecaoContainer;