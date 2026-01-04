import { Ionicons } from '@expo/vector-icons';
import { Stack, useRouter } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, Alert, Image, ImageSourcePropType, Platform, RefreshControl, ScrollView, Share, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { alertUserError } from '../../../_shared/errors/uiFeedback';
import Toast from '../../../components/Toast';
import Colors from '../../../constants/Colors';
import { getReferralInfo, type ReferralInfo } from '../../../services/referralService';

// Assets (3D icons)
const Icons3D = {
  discountTicket: require('../../../assets/images/3d/masc.png'),
  check: require('../../../assets/images/3d/check.png'),
  time: require('../../../assets/images/3d/time.png'),
  button: require('../../../assets/images/3d/button.png'),
} satisfies Record<string, ImageSourcePropType>;

const Icon3D = ({ src, size = 28, style }: { src: ImageSourcePropType; size?: number; style?: any }) => (
  <Image source={src} style={[{ width: size, height: size }, style]} resizeMode="contain" />
);

function useTheme() {
  const scheme = (Colors as any)?.scheme || 'light';
  const theme = (Colors as any)[scheme] || (Colors as any).light;
  return theme as typeof Colors.light;
}

function ReferralCodeCard({ referralCode, onCopyCode, onShareLink, theme }: { referralCode: string; onCopyCode: (code: string) => void; onShareLink: (code: string) => void; theme: ReturnType<typeof useTheme>; }) {
  return (
    <View style={[styles.card, styles.shadowCard, { backgroundColor: theme.cardBackground }]}>
      <View style={styles.cardHeaderRow}>
        <Icon3D src={Icons3D.discountTicket} size={80} style={{ marginRight: 12 }} />
        <View style={{ flex: 1 }}>
          <Text style={[styles.cardTitle, { color: theme.text }]}>Seu Código de Indicação</Text>
          <Text style={[styles.cardSubtitle, { color: theme.textSecondary }]}>Compartilhe com amigos</Text>
        </View>
      </View>

      <View style={[styles.codeBox, { borderColor: theme.border }]}>
        <Text style={[styles.codeText, { color: theme.primary }]}>{referralCode}</Text>
      </View>

      <View style={styles.rowGap}>
        <TouchableOpacity style={[styles.primaryBtn, { backgroundColor: theme.primary }]} onPress={() => onShareLink(referralCode)}>
          <Ionicons name="share-social-outline" size={18} color="#FFFFFF" />
          <Text style={styles.primaryBtnText}>Compartilhar</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.primaryBtn, { backgroundColor: Platform.select({ ios: theme.primary, android: theme.primary }) }]} onPress={() => onCopyCode(referralCode)}>
          <Ionicons name="copy-outline" size={18} color="#FFFFFF" />
          <Text style={styles.primaryBtnText}>Copiar</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

function BenefitsSection({ referrerBenefit, refereeBenefit, theme }: { referrerBenefit: string; refereeBenefit: string; theme: ReturnType<typeof useTheme>; }) {
  return (
    <View style={[styles.card, styles.shadowCard, { backgroundColor: theme.cardBackground }]}>
      <Text style={[styles.sectionTitle, { color: theme.text }]}>O que vocês ganham?</Text>
      <View style={styles.howItem}><Text style={[styles.howText, { color: theme.text }]}>Você: {referrerBenefit}</Text></View>
      <View style={styles.howItem}><Text style={[styles.howText, { color: theme.text }]}>Amigo: {refereeBenefit}</Text></View>
    </View>
  );
}

function HowItWorks({ theme }: { theme: ReturnType<typeof useTheme> }) {
  return (
    <View style={[styles.card, styles.shadowCard, { backgroundColor: theme.cardBackground }]}>
      <Text style={[styles.sectionTitle, { color: theme.text }]}>Como Funciona</Text>
      <View style={styles.howItem}><Text style={[styles.howText, { color: theme.text }]}>Compartilhe seu código com um amigo.</Text></View>
      <View style={styles.howItem}><Text style={[styles.howText, { color: theme.text }]}>Amigo usa no primeiro agendamento.</Text></View>
      <View style={styles.howItem}><Text style={[styles.howText, { color: theme.text }]}>Ambos recebem o desconto!</Text></View>
    </View>
  );
}

export default function ClientReferralScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const theme = useTheme();
  const insets = useSafeAreaInsets();

  const [referralInfo, setReferralInfo] = useState<ReferralInfo | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const loadReferralInfo = useCallback(async () => {
    setIsRefreshing(true);
    try {
      const info = await getReferralInfo();
      setReferralInfo(info);
    } catch (error: any) {
      Toast.show({ type: 'error', text1: t('common.error'), text2: error?.response?.data?.message || t('common.network_error') });
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [t]);

  useEffect(() => { loadReferralInfo(); }, [loadReferralInfo]);

  const onRefresh = useCallback(() => { setIsRefreshing(true); loadReferralInfo(); }, [loadReferralInfo]);

  const handleCopyCode = useCallback((code: string) => {
    Alert.alert('Código Copiado!', `"${code}" foi copiado para a área de transferência.`);
  }, []);

  const handleShareLink = useCallback(async (code: string) => {
    try {
      const result = await Share.share({ message: `Use meu código de indicação "${code}" para ganhar R$25 OFF no primeiro serviço!`, url: referralInfo?.termsLink });
      if ((result as any)?.action === (Share as any)?.sharedAction) {
        Alert.alert('Sucesso!', 'Código compartilhado!');
      }
    } catch (error: any) {
      alertUserError(error, 'Erro ao compartilhar');
    }
  }, [referralInfo]);

  if (isLoading && !isRefreshing) {
    return (
      <View style={[styles.centered, { backgroundColor: theme.background }]}>
        <Stack.Screen options={{ headerShown: false }} />
        <ActivityIndicator size="large" color={theme.primary} />
        <Text style={{ marginTop: 8, color: theme.textMuted }}>{t('common.loading')}</Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <Stack.Screen options={{ headerShown: false }} />

      {/* Header alinhado ao Cashback/Cupons */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} accessibilityLabel={t('common.back', { defaultValue: 'Voltar' }) || 'Voltar'}>
          <Ionicons name="arrow-back" size={22} color={theme.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: theme.text }]}>{t('referrals.title', { defaultValue: 'Indique e Ganhe' })}</Text>
        <View style={{ width: 22 }} />
      </View>

      <ScrollView contentContainerStyle={{ paddingBottom: insets.bottom + 16 }} refreshControl={<RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} tintColor={theme.primary} />} keyboardShouldPersistTaps="handled">
        <View style={styles.content}>
          {referralInfo && (
            <>
              <ReferralCodeCard referralCode={referralInfo.referralCode} onCopyCode={handleCopyCode} onShareLink={handleShareLink} theme={theme} />
              <BenefitsSection referrerBenefit={referralInfo.referrerBenefit} refereeBenefit={referralInfo.refereeBenefit} theme={theme} />
            </>
          )}

          <HowItWorks theme={theme} />

          {referralInfo && (
            <TouchableOpacity style={[styles.termsButton, { borderColor: theme.border, backgroundColor: theme.cardBackground }]} onPress={() => Alert.alert('Termos', `Link: ${referralInfo.termsLink}`)}>
              <Text style={[styles.termsButtonText, { color: theme.textSecondary }]}>{t('referrals.terms', { defaultValue: 'Termos e Condições' })}</Text>
              <Ionicons name="chevron-forward" size={18} color={theme.textSecondary} />
            </TouchableOpacity>
          )}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  header: { paddingTop: 80, paddingHorizontal: 16, paddingBottom: 12, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  headerTitle: { fontSize: 17, fontWeight: '800' },
  content: { paddingHorizontal: 16, paddingTop: 6 },

  // Cards
  card: { borderRadius: 16, padding: 26, alignItems: 'center', marginBottom: 14 },
  shadowCard: { ...Platform.select({ ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.04, shadowRadius: 12 }, android: { elevation: 0 } }) },
  cardHeaderRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  cardTitle: { fontSize: 16, fontWeight: '700' },
  cardSubtitle: { fontSize: 12, alignItems: 'center' },

  codeBox: { alignItems: 'center', paddingVertical: 12, borderWidth: 1, borderRadius: 8, marginVertical: 12 },
  codeText: { fontSize: 24, fontWeight: '800', letterSpacing: 2 },

  rowGap: { flexDirection: 'row', gap: 12 },
  primaryBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 12, borderRadius: 12, gap: 8 },
  primaryBtnText: { color: '#FFFFFF', fontWeight: '800' },

  sectionTitle: { fontSize: 16, fontWeight: '700', marginBottom: 8 },
  howItem: { flexDirection: 'row',  gap: 12, marginBottom: 5 },
  howText: { fontSize: 14, flex: 1, left: 20, },

  termsButton: { marginTop: 4, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 14, paddingHorizontal: 16, borderRadius: 12, borderWidth: 1, ...Platform.select({ ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 4 }, android: { elevation: 0 } }) },
  termsButtonText: { fontSize: 14, fontWeight: '600' },
});
