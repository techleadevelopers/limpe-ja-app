// LimpeJaApp/app/(common)/termos.tsx
import React from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { Stack } from 'expo-router';

export default function TermosScreen() {
  return (
    <ScrollView style={styles.container}>
      <Stack.Screen options={{ title: 'Termos de Serviço' }} />
      <Text style={styles.title}>Termos de Serviço do LimpeJá</Text>
      <Text style={styles.paragraph}>
        Lorem ipsum dolor sit amet, consectetur adipiscing elit. 
        Nullam euismod, nisl eget aliquam ultricies, nunc nisl
        ultricies nunc, vitae aliquam nisl nisl vitae nisl. 
        {/* Adicione o texto completo dos seus termos aqui */}
      </Text>
      <Text style={styles.subTitle}>1. Aceitação dos Termos</Text>
      <Text style={styles.paragraph}>Ao usar o LimpeJá, você concorda com estes termos...</Text>
      {/* ... mais seções ... */}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, backgroundColor: '#fff' },
  title: { fontSize: 22, fontWeight: 'bold', marginBottom: 15 },
  subTitle: { fontSize: 18, fontWeight: 'bold', marginTop:15, marginBottom: 10 },
  paragraph: { fontSize: 15, lineHeight: 22, marginBottom: 10, textAlign: 'justify' },
});