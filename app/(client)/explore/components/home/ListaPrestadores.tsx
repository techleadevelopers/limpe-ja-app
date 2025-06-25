import React from 'react';
import { View, FlatList, StyleSheet } from 'react-native';
import PrestadorCard from './PrestadorCard';

// Importa a interface Provider diretamente do caminho original
import { Provider } from '../../../../types/backend/providers'; // AJUSTE O CAMINHO CONFORME A ESTRUTURA REAL DO SEU PROJETO

interface ListaPrestadoresProps {
  data: Provider[]; // Agora a prop 'data' é tipada como um array de Provider
  // navigation: any; // Removido, pois PrestadorCard não precisa mais de navigation diretamente
}

const ListaPrestadores: React.FC<ListaPrestadoresProps> = ({ data }) => {
  // A função onPress agora será passada para o PrestadorCard,
  // e o PrestadorCard será responsável por chamar o router.
  // Se ListaPrestadores precisar navegar, ele precisaria do router aqui.
  // Por simplicidade, assumimos que o PrestadorCard lida com a navegação.

  // Se você estiver usando FlatList, o componente PrestadorCard pode ser renderizado assim:
  // return (
  //   <FlatList
  //     data={data}
  //     keyExtractor={(item) => item.id}
  //     renderItem={({ item }) => (
  //       <PrestadorCard item={item} onPress={(providerId) => { /* Lógica de navegação aqui se ListaPrestadores for responsável */ }} />
  //     )}
  //     contentContainerStyle={styles.listaPrestadores}
  //   />
  // );

  // Mantendo a implementação original com .map para consistência com o código fornecido:
  return (
    <View style={styles.listaPrestadores}>
      {data.map(item => (
        // O onPress do PrestadorCard espera uma função que recebe o ID do provedor.
        // Assumindo que ListaPrestadores não lida com navegação, PrestadorCard deve ter seu próprio router.
        // Ou, ListaPrestadores deveria receber uma prop `onPressCard` e passá-la.
        // Para resolver o erro de tipagem e manter a funcionalidade, PrestadorCard deve ter o router.
        <PrestadorCard item={item} key={item.id} onPress={(providerId) => { /* router.push(...) */ }} />
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  listaPrestadores: {
    marginTop: 30,
    paddingHorizontal: 20,
  },
});

export default ListaPrestadores;