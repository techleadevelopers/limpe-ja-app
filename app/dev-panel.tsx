// DEV PANEL — QA ONLY — DO NOT SHIP TO PRODUCTION
import React, { useMemo, useState } from 'react';
import { Alert, SafeAreaView, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { useRouter } from 'expo-router';
import Colors from '../constants/Colors';
import { acceptBooking, startBooking, completeBooking, getBookingDetails } from '../services/bookingService';

const QA_ENABLED = __DEV__ || process.env.EXPO_PUBLIC_ENABLE_QA_PANEL === 'true';

const ActionButton = ({ label, onPress, disabled }: { label: string; onPress: () => void; disabled?: boolean }) => (
  <TouchableOpacity style={[styles.button, disabled && styles.buttonDisabled]} onPress={onPress} disabled={disabled}>
    <Text style={styles.buttonText}>{label}</Text>
  </TouchableOpacity>
);

export default function DevPanelScreen() {
  const router = useRouter();
  const [bookingId, setBookingId] = useState('');
  const [loading, setLoading] = useState<string | null>(null);
  const [statusText, setStatusText] = useState<string | null>(null);
  const isDisabled = useMemo(() => !bookingId || !!loading, [bookingId, loading]);

  if (!QA_ENABLED) {
    return (
      <SafeAreaView style={styles.container}>
        <Text style={styles.title}>Painel desativado</Text>
        <Text style={styles.subtitle}>Habilite EXPO_PUBLIC_ENABLE_QA_PANEL=true (ou __DEV__) para usar.</Text>
      </SafeAreaView>
    );
  }

  const handle = async (label: string, fn: (id: string) => Promise<any>) => {
    setLoading(label);
    setStatusText(null);
    try {
      const res = await fn(bookingId.trim());
      setStatusText(JSON.stringify(res, null, 2));
      Alert.alert('OK', `${label} enviado. Verifique push/deeplink.`);
    } catch (e: any) {
      const msg = e?.message || 'Erro';
      setStatusText(msg);
      Alert.alert('Erro', msg);
    } finally {
      setLoading(null);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.title}>Painel DEV (QA)</Text>
        <Text style={styles.subtitle}>Somente staging/QA. Usa endpoints reais. Não simula push local.</Text>
        <Text style={styles.label}>bookingId</Text>
        <TextInput
          style={styles.input}
          placeholder="Digite o bookingId"
          value={bookingId}
          onChangeText={setBookingId}
          autoCapitalize="none"
          autoCorrect={false}
        />

        <View style={styles.row}>
          <ActionButton label="Accept booking" onPress={() => handle('Accept', acceptBooking)} disabled={isDisabled} />
          <ActionButton label="Start booking" onPress={() => handle('Start', startBooking)} disabled={isDisabled} />
          <ActionButton label="Complete booking" onPress={() => handle('Complete', completeBooking)} disabled={isDisabled} />
        </View>

        <ActionButton label="Refetch booking" onPress={() => handle('Refetch', getBookingDetails)} disabled={isDisabled} />

        {loading && <Text style={styles.loading}>Processando: {loading}...</Text>}
        {statusText && (
          <View style={styles.resultBox}>
            <Text style={styles.resultTitle}>Resposta</Text>
            <Text style={styles.result}>{statusText}</Text>
          </View>
        )}

        <TouchableOpacity style={styles.link} onPress={() => router.back()}>
          <Text style={styles.linkText}>Voltar</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f6f7fb' },
  content: { padding: 20, gap: 12 },
  title: { fontSize: 22, fontWeight: '700', color: Colors.light?.text || '#111' },
  subtitle: { fontSize: 14, color: '#555' },
  label: { fontSize: 14, fontWeight: '600', marginTop: 8, color: '#222' },
  input: {
    borderWidth: 1,
    borderColor: '#d0d7e2',
    borderRadius: 10,
    padding: 12,
    backgroundColor: '#fff',
  },
  row: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginTop: 12 },
  button: {
    backgroundColor: '#2563EB',
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 10,
  },
  buttonDisabled: { backgroundColor: '#9db7f5' },
  buttonText: { color: '#fff', fontWeight: '700' },
  loading: { color: '#2563EB', fontWeight: '600' },
  resultBox: { backgroundColor: '#fff', borderRadius: 10, padding: 12, borderWidth: 1, borderColor: '#e5e7eb' },
  resultTitle: { fontWeight: '700', marginBottom: 6 },
  result: { fontFamily: 'monospace', fontSize: 12, color: '#111' },
  link: { marginTop: 20 },
  linkText: { color: '#2563EB', fontWeight: '600' },
});
