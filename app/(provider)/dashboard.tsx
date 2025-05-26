// LimpeJaApp/app/(provider)/dashboard.tsx
import React from 'react';
import { View, Text, StyleSheet, Button, ScrollView } from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { useAuth } from '../../hooks/useAuth'; // Ajuste o caminho se necessário

export default function ProviderDashboardScreen() {
  const { user, signOut } = useAuth(); // signOut foi importado aqui
  const router = useRouter();

  // TODO: Buscar dados resumidos para o painel (próximos serviços, ganhos recentes, novas solicitações)
  const summaryData = {
    upcomingServices: 3,
    newRequests: 1,
    weeklyEarnings: 'R$ 350,00',
  };

  return (
    <ScrollView style={styles.container}>
      <Stack.Screen options={{ title: 'Meu Painel' }} />
      <Text style={styles.welcomeText}>Bem-vindo(a), {user?.name || user?.email}!</Text>
      <Text style={styles.roleText}>Você está no painel de Profissional.</Text>

      <View style={styles.summaryCard}>
        <Text style={styles.cardTitle}>Próximos Serviços</Text>
        <Text style={styles.cardValue}>{summaryData.upcomingServices}</Text>
        <Button title="Ver Agenda" onPress={() => router.push('/(provider)/schedule')} />
      </View>

      <View style={styles.summaryCard}>
        <Text style={styles.cardTitle}>Novas Solicitações</Text>
        <Text style={styles.cardValue}>{summaryData.newRequests}</Text>
        <Button title="Ver Solicitações" onPress={() => router.push('/(provider)/services')} />
      </View>

      <View style={styles.summaryCard}>
        <Text style={styles.cardTitle}>Ganhos da Semana</Text>
        <Text style={styles.cardValue}>{summaryData.weeklyEarnings}</Text>
        <Button title="Ver Ganhos" onPress={() => router.push('/(provider)/earnings')} />
      </View>
      
      <View style={styles.quickActions}>
        <Button title="Gerenciar Disponibilidade" onPress={() => router.push('/(provider)/schedule/manage-availability')} />
        <Button title="Editar Meus Serviços" onPress={() => router.push('/(provider)/profile/edit-services')} />
      </View>

      {/* Linha 48 (aproximadamente) onde styles.logoutButton é usado */}
      <View style={styles.logoutButton}> 
        <Button title="Sair" onPress={signOut} color="red" />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 15,
  },
  welcomeText: {
    fontSize: 22,
    fontWeight: 'bold', // Corrigido para string "bold"
    marginBottom: 5,
  },
  roleText: {
    fontSize: 16,
    color: 'gray',
    marginBottom: 20,
  },
  summaryCard: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 15,
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 1.41,
    elevation: 2,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '600', // Corrigido para string "600"
    marginBottom: 5,
  },
  cardValue: {
    fontSize: 24,
    fontWeight: 'bold', // Corrigido para string "bold"
    marginBottom: 10,
  },
  quickActions: {
    marginTop: 20,
    gap: 10,
  },
  // Linha 91 (aproximadamente) onde o '{' para logoutButton está
  logoutButton: { 
    marginTop: 30,
    marginBottom: 20,
  }, // <<--- Certifique-se que este '}' está aqui e que não há vírgula se for o último estilo.
}); // <<--- Certifique-se que este '});' está fechando corretamente o StyleSheet.create