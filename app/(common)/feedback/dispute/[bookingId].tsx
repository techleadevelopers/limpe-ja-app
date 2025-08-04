// app/(common)/feedback/dispute/[bookingId].tsx
import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, Platform } from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import ScreenContainer from '../../../../components/common/ScreenContainer';
import Header from '../../../../components/common/Header';
import Card from '../../../../components/common/Card';
import PrimaryButton from '../../../../components/common/PrimaryButton';
import TextInputWithIcon from '../../../../components/common/TextInputWithIcon';
import { colors } from '../../../../components/common/theme/colors';
import { typography } from '../../../../components/common/theme/typography';
import Icon from 'react-native-vector-icons/MaterialIcons';

// Mock de dados para demonstração
const mockDisputeDetails = {
  bookingId: 'BKNG-001',
  subject: 'Serviço não realizado corretamente',
  status: 'Em Análise',
  description: 'O serviço de limpeza agendado para o dia 20/07/2024 não foi executado conforme o esperado. A cozinha e os banheiros não foram limpos adequadamente.',
  attachments: [
    { name: 'foto_cozinha.jpg', uri: 'https://example.com/foto_cozinha.jpg' },
    { name: 'foto_banheiro.jpg', uri: 'https://example.com/foto_banheiro.jpg' },
  ],
  messages: [
    { type: 'user', text: 'O serviço não foi satisfatório.', timestamp: '2024-07-20T10:00:00Z' },
    { type: 'admin', text: 'Recebemos sua disputa e estamos analisando o caso. Entraremos em contato em breve.', timestamp: '2024-07-20T11:30:00Z' },
    { type: 'user', text: 'Gostaria de saber o status da minha solicitação.', timestamp: '2024-07-21T09:00:00Z' },
  ],
};

const DisputeDetailsScreen: React.FC = () => {
  const route = useRoute();
  const navigation = useNavigation();
  const { bookingId } = route.params as { bookingId: string };
  const [message, setMessage] = useState('');

  // Em um cenário real, você buscaria os detalhes da disputa com base no bookingId
  const dispute = mockDisputeDetails; // Usando mock para demonstração

  const handleSendMessage = () => {
    if (message.trim()) {
      // Lógica para enviar a mensagem
      console.log('Enviando mensagem:', message);
      Alert.alert('Mensagem Enviada', 'Sua mensagem foi enviada com sucesso.');
      setMessage('');
      // Em um app real, você atualizaria o estado ou refetch dos dados
    }
  };

  const handleUploadFile = () => {
    // Lógica para upload de arquivo
    console.log('Abrir seletor de arquivos');
    Alert.alert('Upload de Arquivo', 'Funcionalidade de upload de arquivo.');
  };

  if (!dispute) {
    return (
      <ScreenContainer>
        <Header title="Detalhes da Disputa" showBackButton={true} />
        <View style={styles.loadingContainer}>
          <Text style={typography.body}>Carregando detalhes da disputa...</Text>
        </View>
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer scrollable={false}>
      <Header title={`Disputa #${dispute.bookingId}`} showBackButton={true} />
      <ScrollView contentContainerStyle={styles.scrollViewContent}>
        <Card style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>Detalhes da Disputa</Text>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Assunto:</Text>
            <Text style={styles.detailValue}>{dispute.subject}</Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Status:</Text>
            <Text style={[styles.detailValue, styles[dispute.status.replace(/\s/g, '') as keyof typeof styles]]}>
              {dispute.status}
            </Text>
          </View>
          <Text style={styles.descriptionText}>{dispute.description}</Text>
        </Card>

        {dispute.attachments.length > 0 && (
          <Card style={styles.sectionCard}>
            <Text style={styles.sectionTitle}>Anexos</Text>
            {dispute.attachments.map((attachment, index) => (
              <TouchableOpacity key={index} style={styles.attachmentItem} onPress={() => Alert.alert('Visualizar Anexo', attachment.name)}>
                <Icon name="attach-file" size={20} color={colors.textSecondary} />
                <Text style={styles.attachmentText}>{attachment.name}</Text>
                <Icon name="visibility" size={20} color={colors.primary} />
              </TouchableOpacity>
            ))}
          </Card>
        )}

        <Card style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>Histórico de Mensagens</Text>
          <View style={styles.messagesContainer}>
            {dispute.messages.map((msg, index) => (
              <View key={index} style={[styles.messageBubble, msg.type === 'user' ? styles.userMessage : styles.adminMessage]}>
                <Text style={msg.type === 'user' ? styles.userMessageText : styles.adminMessageText}>
                  {msg.text}
                </Text>
                <Text style={styles.messageTimestamp}>
                  {new Date(msg.timestamp).toLocaleString()}
                </Text>
              </View>
            ))}
          </View>
        </Card>
      </ScrollView>

      <View style={styles.inputContainer}>
        <TextInputWithIcon
          placeholder="Digite sua mensagem..."
          value={message}
          onChangeText={setMessage}
          containerStyle={styles.messageInput}
          iconName="chat"
          multiline
          maxLength={200}
        />
        <TouchableOpacity onPress={handleUploadFile} style={styles.uploadButton}>
          <Icon name="attach-file" size={28} color={colors.primary} />
        </TouchableOpacity>
        <TouchableOpacity onPress={handleSendMessage} style={styles.sendButton}>
          <Icon name="send" size={28} color={colors.primary} />
        </TouchableOpacity>
      </View>
    </ScreenContainer>
  );
};

const styles = StyleSheet.create({
  scrollViewContent: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sectionCard: {
    marginBottom: 15,
  },
  sectionTitle: {
    ...typography.h3,
    marginBottom: 10,
    color: colors.textPrimary,
  },
  detailRow: {
    flexDirection: 'row',
    marginBottom: 5,
  },
  detailLabel: {
    ...typography.body,
    fontWeight: '600',
    color: colors.textPrimary,
    marginRight: 5,
  },
  detailValue: {
    ...typography.body,
    color: colors.textSecondary,
    flexShrink: 1, // Permite que o texto quebre linha
  },
  descriptionText: {
    ...typography.bodySmall,
    color: colors.textSecondary,
    marginTop: 10,
    lineHeight: 20,
  },
  EmAnálise: {
    backgroundColor: colors.primaryLight,
    color: colors.textWhite,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 5,
    overflow: 'hidden',
    fontWeight: '700',
  },
  Resolvido: {
    backgroundColor: colors.success,
    color: colors.textWhite,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 5,
    overflow: 'hidden',
    fontWeight: '700',
  },
  AguardandoResposta: {
    backgroundColor: colors.error,
    color: colors.textWhite,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 5,
    overflow: 'hidden',
    fontWeight: '700',
  },
  attachmentItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
  },
  attachmentText: {
    ...typography.body,
    color: colors.primary,
    flex: 1,
    marginLeft: 10,
  },
  messagesContainer: {
    marginTop: 10,
  },
  messageBubble: {
    padding: 10,
    borderRadius: 10,
    marginBottom: 8,
    maxWidth: '80%',
  },
  userMessage: {
    alignSelf: 'flex-end',
    backgroundColor: colors.primaryLight,
  },
  adminMessage: {
    alignSelf: 'flex-start',
    backgroundColor: colors.backgroundLightest,
    borderWidth: 1,
    borderColor: colors.borderPrimaryLight,
  },
  userMessageText: {
    ...typography.bodySmall,
    color: colors.textWhite,
  },
  adminMessageText: {
    ...typography.bodySmall,
    color: colors.textPrimary,
  },
  messageTimestamp: {
    fontSize: 10,
    color: colors.textWhite,
    alignSelf: 'flex-end',
    marginTop: 5,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    backgroundColor: colors.cardBackground,
  },
  messageInput: {
    flex: 1,
    marginVertical: 0, // Remover margem vertical padrão do TextInputWithIcon
    paddingVertical: Platform.OS === 'ios' ? 10 : 5, // Ajuste para melhor alinhamento
    minHeight: 40,
    maxHeight: 120, // Limitar altura para multiline
  },
  uploadButton: {
    marginLeft: 10,
    padding: 5,
  },
  sendButton: {
    marginLeft: 10,
    padding: 5,
  },
});

export default DisputeDetailsScreen;