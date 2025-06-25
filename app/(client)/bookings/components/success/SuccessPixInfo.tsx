// LimpeJaApp/app/(client)/bookings/components/success/SuccessPixInfo.tsx
import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Image, Dimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { PixChargeResponseDto } from '../../../../types/backend/payments';

interface SuccessPixInfoProps {
  pixChargeDetails?: PixChargeResponseDto | null;
  handleCopyPixQrCode: () => void;
}

// Constante para a largura da tela para ajustar o card
const SCREEN_WIDTH = Dimensions.get('window').width;

export default function SuccessPixInfo({ pixChargeDetails, handleCopyPixQrCode }: SuccessPixInfoProps) {
  // Verifica se os detalhes da cobrança PIX e o brCode/qrCodeImage estão disponíveis
  if (!pixChargeDetails || !pixChargeDetails.brCode || !pixChargeDetails.qrCodeImage) {
    return null;
  }

  // Determina a fonte da imagem do QR Code
  const qrCodeSource = pixChargeDetails.qrCodeImage.startsWith('http')
    ? { uri: pixChargeDetails.qrCodeImage }
    : { uri: `data:image/png;base64,${pixChargeDetails.qrCodeImage}` };

  return (
    <View style={[
      styles.pixInfoSection,
      {
        width: SCREEN_WIDTH * 0.75, // Ocupa 85% da largura da tela (ajustável)
        alignSelf: 'center',       // Centraliza horizontalmente
      }
    ]}>
      {/* SEU CÓDIGO EXISTENTE - NADA ALTERADO AQUI */}
      <View style={styles.qrCodeContainer}>
        <Image source={qrCodeSource} style={styles.qrCodeImage} />
      </View>
      <TouchableOpacity style={styles.copyPixButton} onPress={handleCopyPixQrCode}>
        <Ionicons name="copy-outline" size={15} color="#FFFFFF" />
        <Text style={styles.copyPixButtonText}>Copiar Código PIX</Text>
      </TouchableOpacity>
      <Text style={styles.pixBrCodeText} numberOfLines={1} ellipsizeMode="middle">
        {pixChargeDetails.brCode}
      </Text>

      {/* NOVO TEXTO E PARÁGRAFO NA LATERAL DIREITA, SEM MEXER NO CÓDIGO EXISTENTE */}
      <View style={styles.pixMessageAbsoluteContainer}>
        <Text style={styles.pixMessageTitle}>Pagamento via PIX</Text>
        <Text style={styles.pixMessageText}>
          Escaneie o QR Code ou utilize o código Copia e Cola para realizar o pagamento.
          O pagamento é processado instantaneamente para maior agilidade na sua reserva!
        </Text>
        <Text style={styles.pixMessageAttention}>
          Atenção: O QR Code expira em breve.
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  pixInfoSection: {
    // Cores e largura serão sobrescritas pelas props de estilo inline
    borderRadius: 12,
    padding: 10,
    marginTop: 15,
    alignItems: 'center',
    position: 'relative', // Adicionado position: 'relative' para o posicionamento absoluto do pixMessageAbsoluteContainer
  },
  pixInfoHeader: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 10,
    marginBottom: 8,
  },
  pixInfoText: {
    fontSize: 14,
    color: '#555',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 15,
  },
  qrCodeContainer: {
    marginBottom: 10,
    borderWidth: 1,
    borderColor: 'rgba(22, 141, 246, 0.1)',
    borderRadius: 8,
    padding: 5,
    right: 110, // MANTIDO EXATAMENTE COMO VOCÊ PEDIU
    backgroundColor: 'rgba(22, 141, 246, 0.1)',
  },
  qrCodeImage: {
    width: 160,
    height: 130,
    resizeMode: 'contain',
    right: 5, // MANTIDO EXATAMENTE COMO VOCÊ PEDIU
    elevation: 33, // Sombra para Android
    shadowColor: '#000', // Sombra para iOS
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  copyPixButton: {
    flexDirection: 'row',
    backgroundColor: '#007AFF',
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
    right: 115, // MANTIDO EXATAMENTE COMO VOCÊ PEDIU
  },
  copyPixButtonText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  pixBrCodeText: {
    marginTop: 5,
    fontSize: 12,
    color: '#777',
    textAlign: 'center',
    fontStyle: 'italic',
    maxWidth: '41%',
    right: 112, // MANTIDO EXATAMENTE COMO VOCÊ PEDIU
  },
  // NOVO CSS PARA O TEXTO NA LATERAL, SEM MEXER NO CÓDIGO EXISTENTE
  pixMessageAbsoluteContainer: {
    position: 'absolute', // Posicionamento absoluto
    left: '47%', // Ajuste esse valor para mover para a direita. Pode precisar de tunagem fina.
    top: 10, // Alinha ao topo do pixInfoSection
    width: 197, // Largura fixa para a caixa de texto
    padding: 18,
    borderRadius: 8,
    backgroundColor: '#F0F8FF',
    elevation: 3, // Sombra para Android
    shadowColor: '#000', // Sombra para iOS
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  pixMessageTitle: {
    fontSize: 10, // Fonte pequena como solicitado
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 3,
    textAlign: 'center', // <--- Apenas esta linha foi adicionada
  },
  pixMessageText: {
    fontSize: 10, // Fonte pequena como solicitado
    color: '#555',
    textAlign: 'center', // <--- Apenas esta linha foi adicionada
    lineHeight: 12, // Ajuste para ficar melhor com a fonte pequena
    marginBottom: 5,
  },
  pixMessageAttention: {
    fontSize: 10, // Fonte pequena como solicitado
    color: '#D32F2F',
    fontWeight: 'bold',
    marginBottom: 10,
  },
});