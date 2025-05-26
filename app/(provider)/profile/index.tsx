// LimpeJaApp/app/(provider)/profile/index.tsx
import React from 'react';
import { View, Text, Button, StyleSheet, Alert, ScrollView } from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { useAuth } from '../../../hooks/useAuth';

export default function ProviderProfileManagementScreen() {
  const { user, signOut } = useAuth();
  const router = useRouter();

  if (!user) return <View style={styles.container}><Text>Usuário não encontrado.</Text></View>;

  return (
    <ScrollView style={styles.container}>
      <Stack.Screen options={{ title: 'Meu Perfil Profissional' }} />
      <View style={styles.profileHeader}>
        <Text style={styles.userName}>{user.name || 'Profissional LimpeJá'}</Text>
        <Text style={styles.userEmail}>{user.email}</Text>
      </View>

      <View style={styles.menuContainer}>
        <Button title="Editar Dados Pessoais" onPress={() => Alert.alert("WIP", "Editar dados como nome, telefone, etc.")} />
        <Button title="Gerenciar Meus Serviços e Preços" onPress={() => router.push('/(provider)/profile/edit-services')} />
        <Button title="Gerenciar Áreas de Atendimento" onPress={() => Alert.alert("WIP", "Tela de áreas de atendimento")} />
        <Button title="Minhas Avaliações" onPress={() => Alert.alert("WIP", "Tela de minhas avaliações")} />
        <Button title="Configurar Dados Bancários" onPress={() => Alert.alert("WIP", "Tela de dados bancários")} />
        <Button title="Configurações da Conta" onPress={() => router.push('/(common)/settings')} />
        <Button title="Ajuda e Suporte" onPress={() => router.push('/(common)/help')} />
      </View>

      <View style={styles.logoutButtonContainer}>
        <Button title="Sair da Conta" onPress={signOut} color="red" />
      </View>
    </ScrollView>
  );
}
// Use estilos similares ao app/(client)/profile/index.tsx ou personalize
const styles = StyleSheet.create({
  container: { flex: 1, paddingHorizontal: 20 }, // Adicionado paddingHorizontal
  profileHeader: { alignItems: 'center', marginBottom: 30, paddingVertical: 20, borderBottomWidth: 1, borderBottomColor: '#eee' },
  userName: { fontSize: 22, fontWeight: 'bold' },
  userEmail: { fontSize: 16, color: 'gray', marginTop: 5 },
  menuContainer: { width: '100%', gap: 15 },
  logoutButtonContainer: { marginTop: 30, paddingBottom: 40, width: '100%' },
});