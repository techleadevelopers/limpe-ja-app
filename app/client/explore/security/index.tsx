import { Ionicons } from '@expo/vector-icons';
import { Stack, useRouter } from 'expo-router';
import { Image, Platform, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const SECURITY_SECTIONS = [
  {
    badge: '🛡️ 1',
    title: 'Rigor na Seleção (KYC & Antecedentes)',
    overview: 'Não aceitamos qualquer um. Nossa barra é alta.',
    points: [
      {
        title: 'Verificação de Identidade',
        text: 'Validamos selfie com o documento em mãos (Liveness Check) para garantir que a pessoa é quem diz ser.',
      },
      {
        title: 'Scanner Anti-Fraude',
        text: 'OCR cruza os dados do documento e bloqueia qualquer tentativa de falsificação.',
      },
      {
        title: 'Filtro Criminal',
        text: 'Consultamos bases oficiais de antecedentes criminais em tempo real. Se não for ficha limpa, não entra.',
      },
    ],
  },
  {
    badge: '📍 2',
    title: 'Monitoramento em Tempo Real (Live Tracking)',
    overview: 'Você acompanha tudo, do portão ao fim da faxina.',
    points: [
      {
        title: 'Rastreio de Trajeto',
        text: 'Veja no mapa quando a profissional sai de casa e receba o alerta: "Já estou a caminho".',
      },
      {
        title: 'Cerca Digital (Geofencing)',
        text: 'O serviço só começa quando o GPS confirma que a profissional está na sua porta. Sem fraudes de horário.',
      },
      {
        title: 'Auditoria de Sessão',
        text: 'Monitoramos o status da faxina minuto a minuto. Qualquer interrupção abrupta dispara um alerta no nosso suporte.',
      },
    ],
  },
  {
    badge: '🏦 3',
    title: 'Proteção Financeira e Patrimonial (Insurance Tech)',
    overview: 'Sua casa protegida por quem entende.',
    points: [
      {
        title: 'Seguro Real',
        text: 'Parceria com banco físico para cobertura de Responsabilidade Civil.',
      },
      {
        title: 'Cobertura de Danos',
        text: 'Quebrou algo? O seguro cobre sinistros em serviços finalizados (conforme apólice).',
      },
      {
        title: 'Pagamento Blindado',
        text: 'O dinheiro só sai da sua conta após a confirmação mútua do término do serviço.',
      },
    ],
  },
];

export default function SecurityScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  return (
    <View style={{ flex: 1, backgroundColor: '#F2F2F2' }}>
      <Stack.Screen options={{ headerShown: false }} />

      <View style={[styles.header, { paddingTop: insets.top + 8 }]}> 
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={22} color="#1A2538" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Segurança</Text>
        <View style={{ width: 22 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.heroCard}>
          <View style={styles.heroIconWrap}>
            <Image
              source={require('../../../../assets/images/3d/security.png')}
              style={styles.heroIcon}
            />
          </View>

          <Text style={styles.heroTitle}>Sua segurança é nossa tecnologia</Text>
          <Text style={styles.heroSubtitle}>Conheça os 3 pilares que protegem você e sua casa</Text>
        </View>

        <View style={styles.sectionList}>
          {SECURITY_SECTIONS.map((section) => (
            <View key={section.title} style={styles.sectionCard}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionBadge}>{section.badge}</Text>
                <Text style={styles.sectionTitle}>{section.title}</Text>
              </View>
              <Text style={styles.sectionOverview}>{section.overview}</Text>
              <View style={styles.pointList}>
                {section.points.map((point) => (
                  <View key={point.title} style={styles.pointItem}>
                    <Text style={styles.pointTitle}>{point.title}</Text>
                    <Text style={styles.pointText}>{point.text}</Text>
                  </View>
                ))}
              </View>
            </View>
          ))}
        </View>
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
    paddingBottom: 44,
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
    marginTop: 6,
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 20,
  },
  sectionList: {
    marginTop: 20,
    gap: 16,
  },
  sectionCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 18,
    gap: 12,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.08,
        shadowRadius: 16,
      },
      android: { elevation: 2 },
    }),
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  sectionBadge: {
    fontSize: 14,
    lineHeight: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#1A2538',
    flex: 1,
  },
  sectionOverview: {
    fontSize: 13,
    color: '#4B5563',
  },
  pointList: {
    marginTop: 8,
    gap: 10,
  },
  pointItem: {
    borderTopWidth: 1,
    borderTopColor: '#EDF2F7',
    paddingTop: 10,
  },
  pointTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0A1F44',
  },
  pointText: {
    marginTop: 4,
    fontSize: 12,
    color: '#4B5563',
    lineHeight: 18,
  },
});
