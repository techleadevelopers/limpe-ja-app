import React from 'react';
import { View, FlatList, StyleSheet } from 'react-native';
import PrestadorCard from './PrestadorCard';

interface ListaPrestadoresProps {
  data: any[];
  navigation: any;
}

const ListaPrestadores: React.FC<ListaPrestadoresProps> = ({ data, navigation }) => {
  return (
    <View style={styles.listaPrestadores}>
      {data.map(item => (
        <PrestadorCard item={item} navigation={navigation} key={item.id} />
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