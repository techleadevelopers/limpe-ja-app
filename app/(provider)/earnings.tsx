// LimpeJaApp/app/(provider)/earnings.tsx
import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, StyleSheet, ActivityIndicator } from 'react-native';
import { Stack } from 'expo-router';
// import { getProviderEarnings } from '../../../src/services/providerService';

export default function ProviderEarningsScreen() {
  const [earningsSummary, setEarningsSummary] = useState<any>(null); // Placeholder
  const [recentTransactions, setRecentTransactions] = useState<any[]>([]); // Placeholder
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // TODO: Chamar providerService para buscar resumo de ganhos e transações
    // const fetchEarnings = async () => { /* ... */ };
    // fetchEarnings();
    // Simulação
    setTimeout(() => {
      setEarningsSummary({
        totalBalance: 'R$ 1250,75',
        pendingWithdrawal: 'R$ 200,00',
        lastPayout: 'R$ 550,00 em 15/05/2025',
      });
      setRecentTransactions([
        { id: 't1', date: '2025-06-01', description: 'Pagamento - Limpeza para Cliente A', amount: '+ R$ 150,00' },
        { id: 't2', date: '2025-05-28', description: 'Pagamento - Limpeza para Cliente B', amount: '+ R$ 120,00' },
        { id: 't3', date: '2025-05-15', description: 'Saque para conta bancária', amount: '- R$ 550,00' },
      ]);
      setIsLoading(false);
    }, 1000);
  }, []);

  if (isLoading) return <ActivityIndicator size="large" style={styles.loader} />;

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ title: 'Meus Ganhos' }} />
      <View style={styles.summaryContainer}>
        <Text style={styles.summaryTitle}>Resumo dos Ganhos</Text>
        <Text>Saldo Total: {earningsSummary?.totalBalance}</Text>
        <Text>Pendente de Saque: {earningsSummary?.pendingWithdrawal}</Text>
        <Text>Último Pagamento Recebido: {earningsSummary?.lastPayout}</Text>
        {/* TODO: Botão para solicitar saque */}
      </View>

      <Text style={styles.transactionsTitle}>Transações Recentes</Text>
      <FlatList
        data={recentTransactions}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View style={styles.transactionItem}>
            <View>
              <Text style={styles.transactionDescription}>{item.description}</Text>
              <Text style={styles.transactionDate}>{new Date(item.date).toLocaleDateString()}</Text>
            </View>
            <Text style={[styles.transactionAmount, item.amount.startsWith('+') ? styles.positive : styles.negative]}>
              {item.amount}
            </Text>
          </View>
        )}
      />
    </View>
  );
}
const styles = StyleSheet.create({
  container: { flex: 1, padding: 15 },
  loader: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  summaryContainer: { padding: 15, backgroundColor: '#e9f5ff', borderRadius: 8, marginBottom: 20 },
  summaryTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 10 },
  transactionsTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 10 },
  transactionItem: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#f0f0f0' },
  transactionDescription: { fontSize: 15 },
  transactionDate: { fontSize: 12, color: 'gray' },
  transactionAmount: { fontSize: 16, fontWeight: 'bold' },
  positive: { color: 'green' },
  negative: { color: 'red' },
});