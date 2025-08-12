// LimpeJaApp/app/(client)/home/missions.tsx (Exemplo de tela)
import React from 'react';
import { View, StyleSheet, Text } from 'react-native';
import MissionList from '../../../components/missions/MissionList'; // Ajuste o caminho conforme sua estrutura

export default function MissionsScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.headerTitle}>Minhas Missões</Text>
      <MissionList />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
    paddingTop: 50, // Espaço para o header, se não usar Stack.Screen
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    textAlign: 'center',
    marginBottom: 10,
  },
});