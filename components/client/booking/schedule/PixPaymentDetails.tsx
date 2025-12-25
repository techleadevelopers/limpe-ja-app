// LimpeJaApp/app/client/bookings/components/schedule/PixPaymentDetails.tsx
import { Ionicons } from '@expo/vector-icons';
import { Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { PixChargeResponseDto as GlobalPixChargeResponseDto } from '../../../../types/backend/payments';

interface PixPaymentDetailsProps {
  pixChargeDetails: GlobalPixChargeResponseDto | null;
  copyToClipboard: (text: string) => Promise<void>;
}

export default function PixPaymentDetails({ pixChargeDetails, copyToClipboard }: PixPaymentDetailsProps) {
  if (!pixChargeDetails || !pixChargeDetails.brCode || !pixChargeDetails.qrCodeImage || pixChargeDetails.amount === undefined) {
    return null;
  }

  const formattedExpiration = pixChargeDetails.expiresAt
    ? new Date(pixChargeDetails.expiresAt).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })
    : null;

  const qrCodeSource = pixChargeDetails.qrCodeImage.startsWith('http')
    ? { uri: pixChargeDetails.qrCodeImage }
    : { uri: `data:image/png;base64,${pixChargeDetails.qrCodeImage}` };

  return (
    <View style={s.container}>
      <Text style={s.title}>Pagamento via PIX</Text>
      <View style={s.card}>
        <View style={s.amountBox}>
          <Text style={s.amountLabel}>Valor Total:</Text>
          <Text style={s.amountValue}>R$ {pixChargeDetails.amount.toFixed(2).replace('.', ',')}</Text>
        </View>

        <View style={s.body}>
          <View style={s.qr}>
            <Image source={qrCodeSource} style={s.qrImg} />
            <Text style={s.qrCaption}>Escaneie o QR Code</Text>
          </View>

          <View style={s.or}>
            <View style={s.line} />
            <Text style={s.orText}>OU</Text>
            <View style={s.line} />
          </View>

          <View style={s.copy}>
            <Text style={s.copyLabel}>Copie a Chave PIX:</Text>
            <View style={s.keyBox}>
              <Text numberOfLines={1} ellipsizeMode="middle" style={s.keyVal}>{pixChargeDetails.brCode}</Text>
              <TouchableOpacity onPress={() => copyToClipboard(pixChargeDetails.brCode)} style={{ padding: 6 }}>
                <Ionicons name="copy-outline" size={22} color="#2A72E7" />
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {formattedExpiration && <Text style={s.expire}>Este PIX expira em: {formattedExpiration}</Text>}

        <Text style={s.subtitle}>Instruções:</Text>
        {['Abra o app do seu banco e acesse a área PIX.',
          'Escolha pagar com QR Code ou Chave PIX.',
          'Escaneie o código ou cole a chave copiada.',
          'Confirme os dados e o valor, depois finalize o pagamento.',
          'Seu agendamento será confirmado após a aprovação do pagamento.'].map((t, i) =>
          <Text key={i} style={s.li}>{`${i + 1}. ${t}`}</Text>
        )}
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  container: { marginTop: 24, marginBottom: 10, paddingHorizontal: 16 },
  title: { fontSize: 16, fontWeight: '700', color: '#1F2E45', textAlign: 'center', marginBottom: 10 },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1, borderColor: '#E9EDF0',
    shadowColor: '#1E2A3B', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.06, shadowRadius: 8, elevation: 0,
  },
  amountBox: { backgroundColor: '#E9F2FF', paddingVertical: 10, paddingHorizontal: 14, borderRadius: 10, marginBottom: 12, alignItems: 'center' },
  amountLabel: { fontSize: 13, color: '#2A72E7', fontWeight: '600' },
  amountValue: { fontSize: 19, color: '#2A72E7', fontWeight: '800' },

  body: { alignItems: 'center' },
  qr: { alignItems: 'center', marginBottom: 8 },
  qrImg: { width: 150, height: 150, resizeMode: 'contain' },
  qrCaption: { fontSize: 12, color: '#6A7C90', marginTop: 4 },

  or: { flexDirection: 'row', alignItems: 'center', marginVertical: 12, width: '80%' },
  line: { flex: 1, height: 1, backgroundColor: '#DDEEFF' },
  orText: { marginHorizontal: 10, fontSize: 12, color: '#7A8DA7', fontWeight: '700' },

  copy: { width: '100%', alignItems: 'center', marginBottom: 14 },
  copyLabel: { fontSize: 13, color: '#223243', marginBottom: 6, fontWeight: '600' },
  keyBox: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFFFFF', borderRadius: 10, paddingHorizontal: 12, paddingVertical: 10, borderWidth: 1, borderColor: '#DDEEFF', width: '90%', minHeight: 48 },
  keyVal: { flex: 1, fontSize: 13, color: '#223243', marginRight: 8 },

  expire: { fontSize: 12, color: '#D32F2F', textAlign: 'center', marginTop: 4, marginBottom: 10, fontWeight: '600' },
  subtitle: { fontSize: 14, fontWeight: '700', color: '#334155', marginTop: 8, marginBottom: 6 },
  li: { fontSize: 12, color: '#475569', lineHeight: 20, marginBottom: 2 },
});
