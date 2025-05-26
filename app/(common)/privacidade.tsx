// LimpeJaApp/app/(common)/privacidade.tsx
import React from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { Stack } from 'expo-router';

export default function PrivacidadeScreen() {
  return (
    <ScrollView style={styles.container}>
      <Stack.Screen options={{ title: 'Política de Privacidade' }} />
      <Text style={styles.title}>Política de Privacidade do LimpeJá</Text>
      <Text style={styles.paragraph}>
        Sua privacidade é importante para nós. Esta política explica como coletamos,
        usamos e protegemos suas informações pessoais.
        {/* Adicione o texto completo da sua política aqui */}
      </Text>
      <Text style={styles.subTitle}>1. Informações que Coletamos</Text>
      <Text style={styles.paragraph}>Coletamos informações que você nos fornece diretamente...</Text>
      {/* ... mais seções ... */}
    </ScrollView>
  );
}
// Use estilos similares aos de TermosScreen ou crie novos
const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, backgroundColor: '#fff' },
  title: { fontSize: 22, fontWeight: 'bold', marginBottom: 15 },
  subTitle: { fontSize: 18, fontWeight: 'bold', marginTop:15, marginBottom: 10 },
  paragraph: { fontSize: 15, lineHeight: 22, marginBottom: 10, textAlign: 'justify' },
});