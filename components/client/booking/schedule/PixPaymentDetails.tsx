// LimpeJaApp/app/(client)/bookings/components/schedule/PixPaymentDetails.tsx
import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

// Importa a interface PixChargeResponseDto do seu arquivo de tipagens centralizado
// Isso garante que a tipagem seja consistente em todo o aplicativo
import { PixChargeResponseDto as GlobalPixChargeResponseDto } from '../../../../types/backend/payments';

// A interface para as props do componente PixPaymentDetails
interface PixPaymentDetailsProps {
    // Usamos a interface importada e renomeada para evitar conflitos de nome
    pixChargeDetails: GlobalPixChargeResponseDto | null;
    copyToClipboard: (text: string) => Promise<void>;
}

export default function PixPaymentDetails({ pixChargeDetails, copyToClipboard }: PixPaymentDetailsProps) {
    // Verifica se os dados essenciais do PIX estão disponíveis
    // Agora usando 'amount' e 'expiresAt'
    if (!pixChargeDetails || !pixChargeDetails.brCode || !pixChargeDetails.qrCodeImage || pixChargeDetails.amount === undefined) {
        return null; // Não renderiza se faltarem dados essenciais
    }

    // Formata a data de expiração, se existir
    // pixChargeDetails.expiresAt é um Date ou string ISO, dependendo de como é passado
    const formattedExpiration = pixChargeDetails.expiresAt
        ? new Date(pixChargeDetails.expiresAt).toLocaleString('pt-BR', {
              day: '2-digit',
              month: '2-digit',
              year: 'numeric',
              hour: '2-digit',
              minute: '2-digit',
          })
        : null;

    // Determina a fonte da imagem do QR Code
    // Se for uma URL, usa { uri: pixChargeDetails.qrCodeImage }
    // Se for base64, usa { uri: `data:image/png;base64,${pixChargeDetails.qrCodeImage}` }
    // Assumindo que qrCodeImage pode ser uma URL ou base64
    const qrCodeSource = pixChargeDetails.qrCodeImage.startsWith('http')
        ? { uri: pixChargeDetails.qrCodeImage }
        : { uri: `data:image/png;base64,${pixChargeDetails.qrCodeImage}` };

    return (
        <View style={styles.pixPaymentContainer}>
            <Text style={styles.pixSectionTitle}>Pagamento via PIX</Text>
            <View style={styles.pixCard}>
                <View style={styles.pixAmountHighlight}>
                    <Text style={styles.pixAmountLabel}>Valor Total:</Text>
                    {/* Usa pixChargeDetails.amount */}
                    <Text style={styles.pixAmountValue}>R$ {pixChargeDetails.amount.toFixed(2).replace('.', ',')}</Text>
                </View>

                <View style={styles.pixContent}>
                    <View style={styles.pixQrContainer}>
                        {/* Usa a imagem do QR Code vinda do DTO */}
                        <Image
                            source={qrCodeSource}
                            style={styles.qrCodeImage}
                        />
                        <Text style={styles.pixQrCaption}>Escaneie o QR Code</Text>
                    </View>
                    <View style={styles.pixOrSeparator}>
                        <View style={styles.pixSeparatorLine} />
                        <Text style={styles.pixOrText}>OU</Text>
                        <View style={styles.pixSeparatorLine} />
                    </View>
                    <View style={styles.pixCopyKeyContainer}>
                        <Text style={styles.pixCopyLabel}>Copie a Chave PIX:</Text>
                        <View style={styles.pixKeyBox}>
                            {/* Usa pixChargeDetails.brCode */}
                            <Text style={styles.pixKeyValue} numberOfLines={1} ellipsizeMode="middle">
                                {pixChargeDetails.brCode}
                            </Text>
                            {/* Copia o brCode */}
                            <TouchableOpacity onPress={() => copyToClipboard(pixChargeDetails.brCode)} style={styles.pixCopyButton}>
                                <Ionicons name="copy-outline" size={22} color="#2A72E7" />
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>

                {formattedExpiration && (
                    <Text style={styles.pixExpirationText}>
                        Este PIX expira em: {formattedExpiration}
                    </Text>
                )}

                <Text style={styles.pixInstructionsTitle}>Instruções:</Text>
                <Text style={styles.pixInstructionItem}>1. Abra o app do seu banco e acesse a área PIX.</Text>
                <Text style={styles.pixInstructionItem}>2. Escolha pagar com QR Code ou Chave PIX.</Text>
                <Text style={styles.pixInstructionItem}>3. Escaneie o código ou cole a chave copiada.</Text>
                <Text style={styles.pixInstructionItem}>4. Confirme os dados e o valor, depois finalize o pagamento.</Text>
                <Text style={styles.pixInstructionItem}>Seu agendamento será confirmado após a aprovação do pagamento.</Text>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    pixPaymentContainer: {
        marginTop: 25,
        marginBottom: 10,
        paddingHorizontal: 15,
    },
    pixSectionTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#111',
        marginBottom: 10,
        textAlign: 'center',
    },
    pixCard: {
        backgroundColor: '#F7F9FC',
        borderRadius: 12,
        padding: 15,
        borderWidth: 1,
        borderColor: '#E9EDF0',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
        elevation: 2,
    },
    pixAmountHighlight: {
        backgroundColor: '#E6F0FF',
        paddingVertical: 10,
        paddingHorizontal: 15,
        borderRadius: 8,
        marginBottom: 15,
        alignItems: 'center',
    },
    pixAmountLabel: {
        fontSize: 14,
        color: '#2A72E7',
        fontWeight: '500',
    },
    pixAmountValue: {
        fontSize: 20,
        color: '#2A72E7',
        fontWeight: 'bold',
    },
    pixContent: {
        alignItems: 'center',
    },
    pixQrContainer: {
        alignItems: 'center',
        marginBottom: 10,
    },
    qrCodeImage: {
        width: 150,
        height: 150,
        resizeMode: 'contain',
    },
    pixQrCaption: {
        fontSize: 13,
        color: '#555',
        marginTop: 4,
    },
    pixOrSeparator: {
        flexDirection: 'row',
        alignItems: 'center',
        marginVertical: 15,
        width: '80%',
    },
    pixSeparatorLine: {
        flex: 1,
        height: 1,
        backgroundColor: '#DDEEFF',
    },
    pixOrText: {
        marginHorizontal: 10,
        fontSize: 13,
        color: '#778899',
        fontWeight: '500',
    },
    pixCopyKeyContainer: {
        width: '100%',
        alignItems: 'center',
        marginBottom: 20,
    },
    pixCopyLabel: {
        fontSize: 14,
        color: '#333',
        marginBottom: 6,
        fontWeight: '500',
    },
    pixKeyBox: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#FFFFFF',
        borderRadius: 8,
        paddingHorizontal: 12,
        paddingVertical: 10,
        borderWidth: 1,
        borderColor: '#DDEEFF',
        width: '90%',
        minHeight: 48,
    },
    pixKeyValue: {
        flex: 1,
        fontSize: 14,
        color: '#333',
        marginRight: 10,
    },
    pixCopyButton: {
        padding: 6,
    },
    pixExpirationText: {
        fontSize: 13,
        color: '#D32F2F',
        textAlign: 'center',
        marginTop: 10,
        marginBottom: 15,
        fontWeight: '500',
    },
    pixInstructionsTitle: {
        fontSize: 15,
        fontWeight: '600',
        color: '#334155',
        marginTop: 10,
        marginBottom: 8,
    },
    pixInstructionItem: {
        fontSize: 13,
        color: '#475569',
        lineHeight: 20,
        marginBottom: 4,
    },
    pixConfirmationNote: {
        fontSize: 12,
        color: '#64748B',
        textAlign: 'center',
        marginTop: 15,
        fontStyle: 'italic',
    },
});