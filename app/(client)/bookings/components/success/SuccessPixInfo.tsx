// LimpeJaApp/app/(client)/bookings/components/success/SuccessPixInfo.tsx
import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Image, Dimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { PixChargeResponseDto } from '../../../../types/backend/payments';

// A imagem local do QR Code agora é um fallback, não a fonte principal.
// const localPixQrCodeImage = require('../../../../../assets/images/pix.png');


interface SuccessPixInfoProps {
  pixChargeDetails?: PixChargeResponseDto | null;
  handleCopyPixQrCode: () => void;
}

// Constante para a largura da tela para ajustar o card
const SCREEN_WIDTH = Dimensions.get('window').width;

export default function SuccessPixInfo({ pixChargeDetails, handleCopyPixQrCode }: SuccessPixInfoProps) {
  // Verifica se os detalhes da cobrança PIX e o brCode estão disponíveis
  if (!pixChargeDetails || !pixChargeDetails.brCode) {
    return null;
  }

  // >>>>> CORREÇÃO AQUI: Usa a URL do QR Code do backend, ou um placeholder se não houver <<<<<
  const qrCodeSource = pixChargeDetails.qrCodeImage
    ? { uri: pixChargeDetails.qrCodeImage } // Usa a URL dinâmica
    : require('../../../../../assets/images/pix.png'); // Fallback para imagem local

  return (
    <View style={[
      styles.pixInfoSection,
      {
        width: SCREEN_WIDTH * 0.75, // Ocupa 85% da largura da tela (ajustável)
        alignSelf: 'center',        // Centraliza horizontalmente
      }
    ]}>
      {/* SEU CÓDIGO EXISTENTE - NADA ALTERADO AQUI */}
      <View style={styles.qrCodeContainer}>
        <Image
          source={qrCodeSource} // Agora usa a fonte dinâmica
          style={styles.qrCodeImage}
        />
      </View>
      <TouchableOpacity style={styles.copyPixButton} onPress={handleCopyPixQrCode}>
        <Ionicons name="copy-outline" size={15} color="#FFFFFF" />
        <Text style={styles.copyPixButtonText}>Copiar Código PIX</Text>
      </TouchableOpacity>
      <Text style={styles.pixBrCodeText} numberOfLines={1} ellipsizeMode="middle">
        {pixChargeDetails.brCode}
      </Text>

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
    marginTop: -10,
    borderColor: 'rgba(22, 141, 246, 0.1)',
    borderRadius: 8,
    padding: 5,
    right: 0,
    backgroundColor: 'rgba(22, 141, 246, 0.1)',
  },
  qrCodeImage: {
    width: 240,
    height: 220,
    resizeMode: 'contain',
    right: 0,
    elevation: 33, // Sombra para Android
    shadowColor: '#000', // Sombra para iOS
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    borderRadius: 8, // <--- ADICIONADO AQUI: Border radius para a imagem
  },
  copyPixButton: {
    flexDirection: 'row',
    backgroundColor: '#007AFF',
    paddingVertical: 8,
    paddingHorizontal: 68,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
    right: 0,
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
    maxWidth: '98%',
    right: 0,
  },
  // NOVO CSS PARA O TEXTO NA LATERAL, SEM MEXER NO CÓDIGO EXISTENTE
  pixMessageAbsoluteContainer: {
    position: 'absolute',
    left: '47%',
    top: 10,
    width: 187,
    
    padding: 18,
    borderRadius: 28,
    backgroundColor: '#F0F8FF',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  pixMessageTitle: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 3,
    textAlign: 'center',
  },
  pixMessageText: {
    fontSize: 10,
    color: '#555',
    textAlign: 'center',
    lineHeight: 12,
    marginBottom: 5,
  },
  pixMessageAttention: {
    fontSize: 10,
    color: '#D32F2F',
    fontWeight: 'bold',
    marginBottom: 10,
  },
});
