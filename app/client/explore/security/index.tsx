import { Ionicons } from '@expo/vector-icons';
import { Stack, useRouter } from 'expo-router';
import { Image, Platform, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function SecurityScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  return (
    <View style={{ flex: 1, backgroundColor: '#F2F2F2' }}>
      <Stack.Screen options={{ headerShown: false }} />

      {/* HEADER SAFE AREA */}
      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={22} color="#1A2538" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Segurança</Text>
        <View style={{ width: 22 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* HERO CARD */}
        <View style={styles.heroCard}>
          <View style={styles.heroIconWrap}>
            <Image
              source={require('../../../../assets/images/3d/security.png')}
              style={styles.heroIcon}
            />
          </View>

          <Text style={styles.heroTitle}>Segurança em primeiro lugar</Text>

          <Text style={styles.heroSubtitle}>
            Todos os prestadores passam por verificação de identidade, análise documental,
            selfie com reconhecimento facial e checagem de antecedentes. Suas reservas e dados
            são protegidos com criptografia e políticas rígidas de segurança.
          </Text>
        </View>

        {/* TRUST BANNER */}
        <View style={styles.trustBanner}>
          <Ionicons name="shield-checkmark" size={18} color="#0A84FF" />
          <Text style={styles.trustBannerText}>
            Garantia LimpeJA!: segurança, verificação e transparência.
          </Text>
        </View>

        {/* SAFETY GRID */}
        <View style={styles.grid}>
          <View style={styles.infoCard}>
            <Ionicons name="lock-closed" size={20} color="#0A84FF" />
            <Text style={styles.infoTitle}>Proteção de dados</Text>
            <Text style={styles.infoText}>
              Criptografia de ponta a ponta e controles rígidos de acesso.
            </Text>
          </View>

          <View style={styles.infoCard}>
            <Ionicons name="id-card" size={20} color="#0A84FF" />
            <Text style={styles.infoTitle}>Verificação completa</Text>
            <Text style={styles.infoText}>
              Documentos validados, selfie, OCR e checagem de antecedentes.
            </Text>
          </View>

          <View style={styles.infoCard}>
            <Ionicons name="star" size={20} color="#0A84FF" />
            <Text style={styles.infoTitle}>Avaliações reais</Text>
            <Text style={styles.infoText}>
              Feedbacks autênticos e transparência total nas notas.
            </Text>
          </View>
        </View>

        {/* CTA */}
        <TouchableOpacity
          style={styles.ctaBtn}
          onPress={() => router.push('/common/safety' as any)}
        >
          <Text style={styles.ctaBtnText}>Conheça nossa Central de Segurança</Text>
          <Ionicons name="chevron-forward" size={18} color="#0A84FF" />
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    paddingHorizontal: 16,
    paddingBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#F2F2F2',
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: '#1A2538',
  },
  content: {
    padding: 16,
    paddingBottom: 40,
  },
  heroCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    paddingVertical: 22,
    paddingHorizontal: 18,
    alignItems: 'center',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.06,
        shadowRadius: 12,
      },
      android: {
        elevation: 0,
      },
    }),
  },
  heroIconWrap: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#E9F2FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
  },
  heroIcon: {
    width: 40,
    height: 40,
    resizeMode: 'contain',
  },
  heroTitle: {
    fontSize: 19,
    fontWeight: '800',
    color: '#1A2538',
    textAlign: 'center',
  },
  heroSubtitle: {
    marginTop: 10,
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 20,
  },
  trustBanner: {
    marginTop: 16,
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    paddingVertical: 12,
    paddingHorizontal: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.06,
        shadowRadius: 8,
      },
      android: { elevation: 0 },
    }),
  },
  trustBannerText: {
    color: '#1A2538',
    fontWeight: '700',
    fontSize: 14,
    flex: 1,
  },
  grid: {
    marginTop: 16,
    flexDirection: 'row',
    gap: 12,
  },
  infoCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 14,
    alignItems: 'flex-start',
    gap: 8,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 6,
      },
      android: { elevation: 0 },
    }),
  },
  infoTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#1A2538',
  },
  infoText: {
    fontSize: 12,
    color: '#6B7280',
    lineHeight: 17,
  },
  ctaBtn: {
    marginTop: 20,
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    paddingVertical: 16,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 6,
      },
      android: { elevation: 0 },
    }),
  },
  ctaBtnText: {
    color: '#0A84FF',
    fontWeight: '800',
    fontSize: 14,
  },
});
