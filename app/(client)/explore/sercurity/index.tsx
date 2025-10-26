import React from 'react';
import { Stack, useRouter } from 'expo-router';
import { View, Text, StyleSheet, ScrollView, Image, TouchableOpacity, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export default function SecurityScreen() {
  const router = useRouter();
  return (
    <View style={{ flex: 1, backgroundColor: '#f2f2f2' }}>
      {/* Header simples alinhado ao padrão do app */}
      <Stack.Screen options={{ headerShown: false }} />
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} accessibilityLabel="Voltar">
          <Ionicons name="arrow-back" size={22} color="#1A2538" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Segurança</Text>
        <View style={{ width: 22 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {/* Hero de Confiança */}
        <View style={styles.heroCard}>
          <View style={styles.heroIconWrap}>
            <Image source={require('../../../../assets/images/3d/security.png')} style={styles.heroIcon} />
          </View>
          <Text style={styles.heroTitle}>Segurança em primeiro lugar</Text>
          <Text style={styles.heroSubtitle}>
            Seus dados e suas reservas são protegidos com criptografia, verificação de identidade e políticas claras.
          </Text>
        </View>

        {/* Mini banner de confiança */}
        <View style={styles.trustBanner}>
          <Ionicons name="shield-checkmark" size={18} color="#0A84FF" />
          <Text style={styles.trustBannerText}>Garantia LimpeJá: atendimento seguro e eficiente.</Text>
        </View>

        {/* Pontos de segurança (premium) */}
        <View style={styles.grid}>
          <View style={styles.infoCard}>
            <Ionicons name="lock-closed" size={18} color="#0A84FF" />
            <Text style={styles.infoTitle}>Proteção de dados</Text>
            <Text style={styles.infoText}>Criptografia e controles rígidos de acesso.</Text>
          </View>
          <View style={styles.infoCard}>
            <Ionicons name="id-card" size={18} color="#0A84FF" />
            <Text style={styles.infoTitle}>Identidade verificada</Text>
            <Text style={styles.infoText}>Prestadores e clientes com verificação ativa.</Text>
          </View>
          <View style={styles.infoCard}>
            <Ionicons name="star" size={18} color="#0A84FF" />
            <Text style={styles.infoTitle}>Avaliações reais</Text>
            <Text style={styles.infoText}>Feedbacks autênticos e transparência nas notas.</Text>
          </View>
        </View>

        <TouchableOpacity style={styles.ctaBtn} onPress={() => router.push('/(common)/safety' as any)}>
          <Text style={styles.ctaBtnText}>Conheça nossa Central de Segurança</Text>
          <Ionicons name="chevron-forward" size={18} color="#0A84FF" />
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  header: { paddingTop: 80, paddingHorizontal: 16, paddingBottom: 12, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  headerTitle: { fontSize: 17, fontWeight: '800', color: '#1A2538' },
  content: { padding: 16, paddingBottom: 24 },
  heroCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    paddingVertical: 18,
    paddingHorizontal: 16,
    alignItems: 'center',
    ...Platform.select({ ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.06, shadowRadius: 12 }, android: { elevation: 4 } })
  },
  heroIconWrap: { width: 54, height: 54, borderRadius: 28, backgroundColor: '#E9F2FF', alignItems: 'center', justifyContent: 'center', marginBottom: 10 },
  heroIcon: { width: 34, height: 34, resizeMode: 'contain' },
  heroTitle: { fontSize: 18, fontWeight: '800', color: '#1A2538', textAlign: 'center' },
  heroSubtitle: { marginTop: 8, fontSize: 13, color: '#6B7280', textAlign: 'center', lineHeight: 18 },

  trustBanner: { marginTop: 12, backgroundColor: '#FFFFFF', borderRadius: 12, paddingVertical: 10, paddingHorizontal: 12, flexDirection: 'row', alignItems: 'center', gap: 8, ...Platform.select({ ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.06, shadowRadius: 8 }, android: { elevation: 2 } }) },
  trustBannerText: { color: '#1A2538', fontWeight: '700', fontSize: 13 },

  grid: { marginTop: 14, flexDirection: 'row', gap: 10 },
  infoCard: { flex: 1, backgroundColor: '#FFFFFF', borderRadius: 12, padding: 12, alignItems: 'flex-start', gap: 6, ...Platform.select({ ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 6 }, android: { elevation: 2 } }) },
  infoTitle: { fontSize: 13, fontWeight: '800', color: '#1A2538' },
  infoText: { fontSize: 12, color: '#6B7280', lineHeight: 16 },

  ctaBtn: { marginTop: 16, backgroundColor: '#FFFFFF', borderRadius: 12, paddingVertical: 14, paddingHorizontal: 14, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', ...Platform.select({ ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 6 }, android: { elevation: 2 } }) },
  ctaBtnText: { color: '#0A84FF', fontWeight: '800' },
});
