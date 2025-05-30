// LimpeJaApp/components/SecaoContainer.tsx
import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, FlatList, ListRenderItem } from 'react-native'; // Adicionado ListRenderItem
import { Ionicons } from '@expo/vector-icons';
// useRouter não é necessário aqui se a ação de "Ver tudo" é passada como callback

// Para tornar o componente mais reutilizável, podemos usar um tipo genérico para os itens da lista
interface SecaoContainerProps<T> {
  titulo: string;
  data: T[]; // Usa o tipo genérico T
  renderItem: ListRenderItem<T>; // Usa ListRenderItem<T> para tipagem forte do renderItem da FlatList
  onVerTudoPress?: () => void; // 1. Alterado de 'verTudo: string' e 'navigation: any'. Agora é uma função opcional.
  horizontal?: boolean; // Adicionado para manter a funcionalidade original
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
  return (
    <View style={styles.secaoContainer}>
      <View style={styles.secaoHeader}>
        <Text style={styles.secaoTitulo}>{titulo}</Text>
        {/* 2. O TouchableOpacity para "Ver tudo" agora chama onVerTudoPress se existir */}
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
        renderItem={renderItem}
        keyExtractor={(item) => String(item.id)} // Converte id para string para o keyExtractor
        horizontal={horizontal}
        showsHorizontalScrollIndicator={false}
        // Adicionado paddingLeft ao container da FlatList se for horizontal,
        // e removido de secaoContainer para que o header da seção fique alinhado.
        contentContainerStyle={horizontal ? styles.listaHorizontalPadding : {}}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  secaoContainer: {
    marginTop: 30,
    // paddingHorizontal: 20, // Removido daqui, aplicado no header e na lista se necessário
  },
  secaoHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 18,
    paddingHorizontal: 20, // Adicionado padding ao header da seção
  },
  secaoTitulo: {
    fontSize: 22,
    fontWeight: '700',
    color: '#1C3A5F',
  },
  verTudoTexto: {
    fontSize: 15,
    color: '#007AFF',
    fontWeight: '600',
  },
  listaHorizontalPadding: { // Aplicado ao contentContainerStyle da FlatList horizontal
    paddingLeft: 20, // Para o primeiro item não colar na borda
    paddingRight: 10, // Um pouco de espaço depois do último item
  },
});

export default SecaoContainer;