import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import { ShieldCheck, Lock, Check } from 'lucide-react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LinearGradient } from 'expo-linear-gradient';
import { Stack, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
    Alert,
    Image,
    Modal,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    useColorScheme,
    View,
} from 'react-native';
import { alertUserError } from '../../../_shared/errors/uiFeedback';
import Colors from '../../../constants/Colors';
import { PROVIDER_ROUTES } from '../../../constants/routes';
import { useAuth } from '../../../hooks/useAuth';
import { acceptProviderTerms, updateMyProviderProfile } from '../../../services/providerService';
import userService from '../../../services/userService';

const AppLogo = require('../../../assets/images/logo2.png');

function useTheme() {
  const scheme = useColorScheme?.() || 'light';
  const theme = (Colors as any)[scheme] || (Colors as any).light;
  return theme as typeof Colors.light;
}

const ProfileHero: React.FC<{
  name: string;
  subtitle: string;
  avatarUrl?: string | null;
  onBack: () => void;
  onSubtitlePress?: () => void;
}> = ({ name, subtitle, avatarUrl, onBack, onSubtitlePress }) => {
  const theme = useTheme();
  return (
    <LinearGradient
      colors={[theme.primaryLight || '#EAF3FF', '#FFFFFF']}
      start={{ x: 0, y: 0 }}
      end={{ x: 0, y: 1 }}
      style={styles.hero}
    >
      {Platform.OS !== 'web' && <BlurView intensity={10} tint="light" style={StyleSheet.absoluteFill} />}
      <View style={styles.heroRow}>
        <TouchableOpacity onPress={onBack} accessibilityLabel="Voltar" style={styles.heroBackBtn}>
          <Ionicons name="arrow-back" size={22} color="#274B63" />
        </TouchableOpacity>
      </View>
      <View style={styles.heroProfileRow}>
        <View style={styles.heroAvatarWrap}>
          {avatarUrl ? (
            <Image source={{ uri: avatarUrl }} style={styles.heroAvatarImg} />
          ) : (
            <View style={styles.heroAvatarPlaceholder}>
              <Ionicons name="person" size={28} color="#8AAAE0" />
            </View>
          )}
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.heroName}>{name}</Text>
          <TouchableOpacity onPress={onSubtitlePress} accessibilityLabel={subtitle}>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <Text style={styles.heroSubtitle}>{subtitle}</Text>
              <Ionicons name="chevron-forward-outline" size={16} color="#6C6C6C" />
            </View>
          </TouchableOpacity>
        </View>
        <Image source={AppLogo} style={styles.heroLogo} />
      </View>
    </LinearGradient>
  );
};

const ListRow: React.FC<{
  label: string;
  ionIcon?: keyof typeof Ionicons.glyphMap;
  mciIcon?: keyof typeof MaterialCommunityIcons.glyphMap;
  badge?: number;
  onPress?: () => void;
  destructive?: boolean;
}> = ({ label, ionIcon, mciIcon, badge, onPress, destructive }) => {
  return (
    <TouchableOpacity onPress={onPress} style={styles.row} activeOpacity={0.9}>
      <View style={styles.rowLeft}>
        {ionIcon ? (
          <Ionicons name={ionIcon as any} size={20} color={destructive ? '#D32F2F' : '#2C3E50'} style={{ marginRight: 12 }} />
        ) : mciIcon ? (
          <MaterialCommunityIcons name={mciIcon as any} size={20} color={destructive ? '#D32F2F' : '#2C3E50'} style={{ marginRight: 12 }} />
        ) : null}
        <Text style={[styles.rowLabel, destructive && { color: '#D32F2F', fontWeight: '600' }]}>{label}</Text>
      </View>
      <View style={styles.rowRight}>
        {typeof badge === 'number' && badge > 0 && (
          <View style={styles.badge}>
            <Text style={styles.badgeText}>{badge}</Text>
          </View>
        )}
        {!destructive && <Ionicons name="chevron-forward-outline" size={16} color="#C7C7CC" />}
      </View>
    </TouchableOpacity>
  );
};

const PaymentCard: React.FC<{ onPress: () => void }> = ({ onPress }) => {
  return (
    <TouchableOpacity style={styles.paymentCard} onPress={onPress} activeOpacity={0.95}>
      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
        <View>
          <Text style={styles.paymentTitle}>Pagamentos</Text>
          <Text style={styles.paymentSubtitle}>Gerencie suas formas de pagamento ou pague na maquininha</Text>
        </View>
      </View>
      <Ionicons name="chevron-forward-outline" size={18} color="#C7C7CC" />
    </TouchableOpacity>
  );
};

export default function ProviderProfileScreen() {
  const router = useRouter();
  const { user, logout, updateUser } = useAuth();
  const [showEditNameModal, setShowEditNameModal] = useState(false);
  const [nameInput, setNameInput] = useState('');
  const [savingName, setSavingName] = useState(false);
  const [termsAccepted, setTermsAccepted] = useState<boolean>(false);
  const [isTermsModalVisible, setTermsModalVisible] = useState(false);
  const [acceptingTerms, setAcceptingTerms] = useState(false);
  const TERMS_KEY = '@LimpeJa:providerTermsAccepted';

  useEffect(() => {
    if (user?.fullName) {
      setNameInput(user.fullName);
    }
  }, [user?.fullName]);

  useEffect(() => {
    (async () => {
      try {
        if ((user as any)?.termsAcceptedAt) {
          setTermsAccepted(true);
          setTermsModalVisible(false);
          return;
        }
        const flag = await AsyncStorage.getItem(TERMS_KEY);
        const accepted = flag === '1';
        setTermsAccepted(accepted);
        if (!accepted) {
          setTermsModalVisible(true);
        }
      } catch {
        // ignore
      }
    })();
  }, [user]);

  const handleSaveName = async () => {
    const trimmed = nameInput.trim();
    if (!trimmed) {
      // Corrigido: obrigatÃ³rio -> obrigatório | vÃ¡lido -> válido
      Alert.alert('Nome obrigatório', 'Digite um nome válido.');
      return;
    }
    try {
      setSavingName(true);
      const updated = await updateMyProviderProfile({ fullName: trimmed });
      await updateUser({ fullName: updated.fullName });
      Alert.alert('Perfil atualizado', 'Seu nome foi alterado com sucesso.');
      setShowEditNameModal(false);
    } catch (error: any) {
      // Corrigido: NÃ£o -> Não | possÃ­vel -> possível
      alertUserError(error, 'Erro ao atualizar o nome');
    } finally {
      setSavingName(false);
    }
  };

  const handleAcceptTerms = async () => {
    try {
      const termsVersion = 'v1';
        const resp = await acceptProviderTerms(termsVersion);
        await AsyncStorage.setItem(TERMS_KEY, '1');
        setTermsAccepted(true);
        await updateUser({ termsAcceptedAt: resp.termsAcceptedAt, termsVersion: resp.termsVersion });
        setTermsModalVisible(false);
      // Corrigido: condicoes -> condições
      Alert.alert('Termos aceitos', 'Obrigado por aceitar os termos e condições.');
    } catch (e: any) {
      // Corrigido: Nao -> Não | possivel -> possível | concordancia -> concordância
      alertUserError(e, 'Erro ao registrar a concordância');
    }
  };

  const handleLogout = async () => {
    try {
      await logout();
      router.replace('/auth/register-options' as any);
    } catch {
      // Corrigido: NÃ£o -> Não
      Alert.alert('Erro ao sair', 'Não foi possível sair da conta. Tente novamente.');
    }
  };

  const handleDeleteAccount = () => {
    // Corrigido: ação -> ação | é -> é | irreversível -> irreversível | serão -> serão
    Alert.alert(
      'Excluir conta',
      'Tem certeza? Essa ação é irreversível. Sua conta e dados serão removidos.',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Excluir',
          style: 'destructive',
          onPress: () => {
            (async () => {
              try {
                await userService.deleteMe();
                await logout();
                // Corrigido: excluÃ­da -> excluída
                    Alert.alert('Conta excluída', 'Conta excluída com sucesso.', [
                      {
                        text: 'OK',
                        onPress: () => router.replace('/auth/register-options' as any),
                      },
                    ]);
              } catch {
                // Corrigido: NÃ£o -> Não | possÃ­vel -> possível
                Alert.alert('Erro', 'Não foi possível excluir sua conta. Tente novamente.');
              }
            })();
          },
        },
      ],
    );
  };

  if (!user) {
    return (
      <View style={styles.centeredMessageContainer}>
        <Stack.Screen options={{ headerShown: false }} />
        <Text style={styles.loadingText}>Carregando perfil...</Text>
        <TouchableOpacity style={styles.simpleButton} onPress={() => router.replace('/auth/login' as any)}>
          <Text style={styles.simpleButtonText}>Ir para Login</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const normalizeAvatar = (value?: string | null) => {
    if (typeof value !== 'string') return undefined;
    const cleaned = value.trim();
    return cleaned.length > 0 ? cleaned : undefined;
  };

  const userName = user.fullName || 'Profissional';
  const userAvatarUrl =
    normalizeAvatar(user.providerDetails?.avatarUrl) ||
    normalizeAvatar(user.avatarUrl);

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />

      <View style={Platform.OS === 'android' ? styles.profileHeroAndroid : undefined}>
        <ProfileHero
          name={userName}
          // Corrigido: Profissional de Limpeza (não havia erro, mas manteve-se)
          subtitle="Profissional de Limpeza"
          avatarUrl={userAvatarUrl}
          onBack={() => router.back()}
          onSubtitlePress={() => router.push(PROVIDER_ROUTES.PROFILE as any)}
        />
      </View>

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollViewContentContainer}>
        <PaymentCard onPress={() => router.push('/provider/profile/bank-details' as any)} />

        <View style={styles.section}>
          <ListRow label="Editar nome" ionIcon="person-outline" onPress={() => setShowEditNameModal(true)} />
          {/* Corrigido: Verificação -> Verificação */}
          <ListRow label="Verificação de Conta" ionIcon="id-card-outline" onPress={() => router.push(PROVIDER_ROUTES.VERIFICATION as any)} />
          {/* Corrigido: Serviços -> Serviços */}
          <ListRow label="Editar/Adicionar Serviços" ionIcon="briefcase-outline" onPress={() => router.push(PROVIDER_ROUTES.EDIT_SERVICES as any)} />
          {/* Corrigido: Disponibilidade -> Disponibilidade */}
          <ListRow label="Gerenciar Disponibilidade" ionIcon="time-outline" onPress={() => router.push(PROVIDER_ROUTES.MANAGE_AVAILABILITY as any)} />
        </View>

        <View style={styles.section}>
          {/* Corrigido: Avaliações -> Avaliações */}
          <ListRow label="Minhas Avaliações" ionIcon="star-outline" onPress={() => router.push(PROVIDER_ROUTES.REVIEWS as any)} />
          {/* Corrigido: Ganhos -> Ganhos */}
          <ListRow label="Meus Ganhos" ionIcon="wallet-outline" onPress={() => router.push(PROVIDER_ROUTES.EARNINGS as any)} />
          {/* Corrigido: Relatórios e Métricas -> Relatórios e Métricas */}
          <ListRow label="Relatórios e Métricas" ionIcon="trending-up-outline" onPress={() => router.push('/provider/profile/metrics' as any)} />
        </View>

        <View style={styles.section}>
          {/* Corrigido: Notificações -> Notificações */}
          <ListRow label="Notificações" ionIcon="notifications-outline" onPress={() => router.push('/common/settings/notifications' as any)} />
          {/* Corrigido: Bancários -> Bancários */}
          <ListRow label="Dados Bancários" ionIcon="card-outline" onPress={() => router.push('/provider/profile/bank-details' as any)} />
          <ListRow label="Ajuda e Suporte" ionIcon="help-circle-outline" onPress={() => router.push('/common/help' as any)} />
          {/* Corrigido: Serviço -> Serviço */}
          <ListRow label="Termos de Serviço" ionIcon="document-text-outline" onPress={() => router.push('/common/termos' as any)} />
          <ListRow
            label={termsAccepted ? 'Termos aceitos' : 'Marcar como lido e concordado'}
            ionIcon={termsAccepted ? 'checkmark-done-outline' : 'alert-circle-outline'}
            onPress={termsAccepted ? undefined : handleAcceptTerms}
            destructive={!termsAccepted}
          />
          {/* Corrigido: PolÃ­tica de Privacidade -> Política de Privacidade */}
          <ListRow label="Política de Privacidade" ionIcon="shield-checkmark-outline" onPress={() => router.push('/common/privacidade' as any)} />
          <ListRow
            label="Excluir minha conta"
            ionIcon="trash-outline"
            destructive
            onPress={handleDeleteAccount}
          />
          <ListRow label="Sair" ionIcon="log-out-outline" destructive onPress={handleLogout} />
        </View>
      </ScrollView>
      <Modal
        visible={isTermsModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => {
          if (termsAccepted) {
            setTermsModalVisible(false);
          }
        }}
      >
        <View style={styles.termsOverlay}>
          <View style={styles.termsModal}>
            <Text style={styles.termsModalTitle}>Termos de Serviço</Text>
            <ScrollView style={styles.termsModalBody}>
              <Text style={styles.termsModalParagraph}>
                Bem-vindo(a) ao LimpeJA!. Estes termos regulam o uso da plataforma; apenas continue após aceitá-los.
              </Text>
              <Text style={styles.termsModalSubtitle}>1. Aceitação</Text>
              <Text style={styles.termsModalParagraph}>
                Ao utilizar o LimpeJA!, você concorda com todos os termos estabelecidos para clientes e provedores.
              </Text>
              <Text style={styles.termsModalSubtitle}>2. Serviços oferecidos</Text>
              <Text style={styles.termsModalParagraph}>
                Somos um marketplace que conecta clientes a profissionais autônomos de limpeza residencial e corporativa.
              </Text>
              <Text style={styles.termsModalSubtitle}>3. Pagamento e cancelamento</Text>
              <Text style={styles.termsModalParagraph}>
                Pagamentos via PIX são processados pela plataforma; cancelamentos podem ter taxas conforme política.
              </Text>
              <Text style={styles.termsModalSubtitle}>4. Segurança e responsabilidade</Text>
              <Text style={styles.termsModalParagraph}>
                Validamos documentos e antecedentes, mas não nos responsabilizamos por eventos fora do controle do app.
              </Text>
            </ScrollView>
            <TouchableOpacity style={styles.termsModalButton} onPress={handleAcceptTerms}>
              <Text style={styles.termsModalButtonText}>Aceitar e continuar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      <Modal visible={showEditNameModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Atualizar nome</Text>
            <TextInput
              style={styles.modalInput}
              value={nameInput}
              onChangeText={setNameInput}
              placeholder="Seu nome completo"
              placeholderTextColor="#9aa3ad"
              autoCapitalize="words"
            />
            <View style={styles.modalActions}>
              <TouchableOpacity style={[styles.modalButton, styles.modalCancel]} onPress={() => setShowEditNameModal(false)} disabled={savingName}>
                <Text style={styles.modalButtonTextCancel}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.modalButton, styles.modalConfirm]} onPress={handleSaveName} disabled={savingName}>
                <Text style={styles.modalButtonTextConfirm}>{savingName ? 'Salvando...' : 'Salvar'}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f7f7f7' },
  scrollView: { flex: 1 },
  scrollViewContentContainer: { paddingBottom: 40, paddingHorizontal: 12 },
  profileHeroAndroid: {
    transform: [{ scale: 0.95 }],
  },

  centeredMessageContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 },
  simpleButton: { marginTop: 20, backgroundColor: '#007AFF', paddingVertical: 10, paddingHorizontal: 20, borderRadius: 8 },
  simpleButtonText: { color: '#fff', fontSize: 16, fontWeight: '600' },
  loadingText: { fontSize: 16, color: '#6C757D', marginBottom: 10 },

  // hero
  hero: { paddingTop: Platform.OS === 'ios' ? 30 : 20, paddingBottom: 16, paddingHorizontal: 14 },
  heroRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  heroBackBtn: { padding: 6 },
  heroLogo: { width: 110, height: 26, resizeMode: 'contain', marginLeft: 8 },
  heroProfileRow: { marginTop: 6, flexDirection: 'row', alignItems: 'center' },
  heroAvatarWrap: { width: 42, height: 42, borderRadius: 21, overflow: 'hidden', backgroundColor: '#F0F2F5', marginRight: 10 },
  heroAvatarImg: { width: '100%', height: '100%' },
  heroAvatarPlaceholder: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  heroName: { fontSize: 18, fontWeight: '700', color: '#111' },
  heroSubtitle: { fontSize: 13, color: '#6C6C6C', marginTop: 4 },

  // cards/sections
  paymentCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 16,
    marginTop: 12,
    marginHorizontal: 4,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    ...Platform.select({
      ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.06, shadowRadius: 6 },
      android: { elevation: 0 },
    }),
  },
  paymentTitle: { fontSize: 16, color: '#111', fontWeight: '600' },
  paymentSubtitle: { fontSize: 12, color: '#6C6C6C', marginTop: 2, maxWidth: 240 },

  section: {
    marginTop: 14,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    overflow: 'hidden',
    marginHorizontal: 4,
    ...Platform.select({
      ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.06, shadowRadius: 6 },
      android: { elevation: 0 },
    }),
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    paddingHorizontal: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderColor: '#ECECEC',
    backgroundColor: '#FFFFFF',
  },
  rowLeft: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  rowRight: { flexDirection: 'row', alignItems: 'center' },
  rowLabel: { fontSize: 15, color: '#1F2E35', flex: 1 },
  badge: {
    backgroundColor: '#FF2D55',
    paddingHorizontal: 8,
    height: 18,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
  },
  badgeText: { color: '#fff', fontWeight: '700', fontSize: 12 },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.35)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  modalCard: {
    width: '100%',
    maxWidth: 380,
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 16,
    ...Platform.select({
      ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.12, shadowRadius: 8 },
      android: { elevation: 0 },
    }),
  },
  modalTitle: { fontSize: 17, fontWeight: '700', color: '#111', marginBottom: 12 },
  modalInput: {
    borderWidth: 1,
    borderColor: '#E1E5EB',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 15,
    color: '#111',
    marginBottom: 14,
  },
  modalActions: { flexDirection: 'row', justifyContent: 'flex-end', alignItems: 'center' },
  modalButton: { paddingVertical: 10, paddingHorizontal: 14, borderRadius: 10, marginLeft: 8 },
  modalCancel: { backgroundColor: '#F3F4F6' },
  modalConfirm: { backgroundColor: '#2D8CFF' },
  modalButtonTextCancel: { color: '#333', fontWeight: '600' },
  modalButtonTextConfirm: { color: '#fff', fontWeight: '700' },
  termsOverlay: {
    ...Platform.select({
      ios: { backgroundColor: 'rgba(0,0,0,0.35)', shadowColor: '#000' },
      android: { backgroundColor: 'rgba(0,0,0,0.35)' },
    }),
    position: 'absolute',
    inset: 0,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  termsModal: {
    width: '100%',
    maxWidth: 380,
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 16,
    maxHeight: '80%',
  },
  termsModalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1B1B1F',
    marginBottom: 12,
  },
  termsModalBody: {
    marginBottom: 16,
  },
  termsModalSubtitle: {
    fontSize: 16,
    fontWeight: '600',
    marginTop: 12,
    marginBottom: 6,
    color: '#2E3D50',
  },
  termsModalParagraph: {
    fontSize: 14,
    lineHeight: 20,
    color: '#4B5563',
  },
  termsModalButton: {
    backgroundColor: '#2D8CFF',
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: 'center',
  },
  termsModalButtonText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 15,
  },
});
