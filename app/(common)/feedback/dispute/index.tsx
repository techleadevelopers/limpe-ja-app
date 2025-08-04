// app/(common)/feedback/dispute/index.tsx
import React from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router'; // <--- Importado useRouter do expo-router
// import { useNavigation } from '@react-navigation/native'; // <--- Removido useNavigation
import ScreenContainer from '../../../../components/common/ScreenContainer';
import Header from '../../../../components/common/Header';
import Card from '../../../../components/common/Card';
import PrimaryButton from '../../../../components/common/PrimaryButton';
import { colors } from '../../../../components/common/theme/colors';
import { typography } from '../../../../components/common/theme/typography';
import Icon from 'react-native-vector-icons/MaterialIcons';

// Mock de dados para demonstração
const mockDisputes = [
  {
    id: '12345',
    bookingId: 'BKNG-001',
    subject: 'Serviço não realizado corretamente',
    status: 'Em Análise',
    date: '2024-07-20',
  },
  {
    id: '67890',
    bookingId: 'BKNG-002',
    subject: 'Divergência de preço',
    status: 'Resolvido',
    date: '2024-07-18',
  },
  {
    id: '11223',
    bookingId: 'BKNG-003',
    subject: 'Danos à propriedade',
    status: 'Aguardando Resposta',
    date: '2024-07-15',
  },
];

const DisputeListItem: React.FC<{ dispute: typeof mockDisputes[0]; onPress: () => void }> = ({ dispute, onPress }) => (
  <TouchableOpacity onPress={onPress} activeOpacity={0.8}>
    <Card style={styles.disputeCard}>
      <View style={styles.cardHeader}>
        <Text style={styles.bookingIdText}>Reserva: {dispute.bookingId}</Text>
        <Text style={[styles.statusText, styles[dispute.status.replace(/\s/g, '') as keyof typeof styles]]}>
          {dispute.status}
        </Text>
      </View>
      <Text style={styles.subjectText}>{dispute.subject}</Text>
      <Text style={styles.dateText}>Data: {dispute.date}</Text>
      <Icon name="chevron-right" size={24} color={colors.textSecondary} style={styles.arrowIcon} />
    </Card>
  </TouchableOpacity>
);

const DisputeListScreen: React.FC = () => {
  const router = useRouter(); // <--- Usando useRouter

  const handleCreateNewDispute = () => {
    // Lógica para iniciar a criação de uma nova disputa
    console.log('Criar nova disputa');
    // router.push('/(common)/feedback/dispute/create'); // Exemplo de navegação para tela de criação
  };

  const renderEmptyState = () => (
    <View style={styles.emptyStateContainer}>
      <Icon name="inbox" size={80} color={colors.textPlaceholder} />
      <Text style={styles.emptyStateText}>Nenhuma disputa encontrada.</Text>
      <Text style={styles.emptyStateSubText}>
        Parece que você não tem nenhuma disputa registrada no momento.
      </Text>
      <PrimaryButton
        title="Abrir Nova Disputa"
        onPress={handleCreateNewDispute}
        style={styles.emptyStateButton}
      />
    </View>
  );

  return (
    <ScreenContainer scrollable={false}>
      <Header title="Minhas Disputas" showBackButton={true} />
      {mockDisputes.length === 0 ? (
        renderEmptyState()
      ) : (
        <FlatList
          data={mockDisputes}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <DisputeListItem
              dispute={item}
              // <--- CORREÇÃO AQUI: Usando router.push com o caminho da rota dinâmica
              onPress={() => router.push(`/(common)/feedback/dispute/${item.bookingId}`)}
            />
          )}
          contentContainerStyle={styles.listContentContainer}
          ListFooterComponent={() => (
            <PrimaryButton
              title="Abrir Nova Disputa"
              onPress={handleCreateNewDispute}
              style={styles.newDisputeButton}
            />
          )}
        />
      )}
    </ScreenContainer>
  );
};

const styles = StyleSheet.create({
  listContentContainer: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  disputeCard: {
    marginBottom: 10,
    position: 'relative',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  bookingIdText: {
    ...typography.subtitle,
    color: colors.textPrimary,
  },
  statusText: {
    ...typography.bodySmall,
    fontWeight: '700',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 5,
    overflow: 'hidden',
  },
  EmAnálise: {
    backgroundColor: colors.primaryLight,
    color: colors.textWhite,
  },
  Resolvido: {
    backgroundColor: colors.success,
    color: colors.textWhite,
  },
  AguardandoResposta: {
    backgroundColor: colors.error,
    color: colors.textWhite,
  },
  subjectText: {
    ...typography.body,
    marginBottom: 5,
  },
  dateText: {
    ...typography.bodySmall,
    color: colors.textSecondary,
  },
  arrowIcon: {
    position: 'absolute',
    right: 15,
    top: '50%',
    marginTop: -12, // Centralizar verticalmente
  },
  newDisputeButton: {
    marginTop: 20,
  },
  emptyStateContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
    backgroundColor: colors.background,
  },
  emptyStateText: {
    ...typography.h2,
    textAlign: 'center',
    marginTop: 20,
    color: colors.textPrimary,
  },
  emptyStateSubText: {
    ...typography.body,
    textAlign: 'center',
    color: colors.textSecondary,
    marginTop: 10,
    marginBottom: 30,
  },
  emptyStateButton: {
    width: '100%',
  },
});

export default DisputeListScreen;