import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Alert,
  ScrollView,
  TouchableOpacity,
  Image,
  Platform,
  useColorScheme,
} from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { useAuth } from '../../../contexts/AuthContext';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import Colors from '../../../constants/Colors';
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
          <TouchableOpacity onPress={onSubtitlePress} accessibilityLabel="Seus cupons">
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
  if (typeof label === 'string' && label.toLowerCase().includes('entrega')) {
    return null;
  }
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
          <View style={styles.badge}><Text style={styles.badgeText}>{badge}</Text></View>
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

export default function ClientProfileScreen() {
  const { user, logout } = useAuth();
  const router = useRouter();

  const handleLogout = async () => {
    try {
      await logout();
      router.replace('/(auth)/login' as any);
    } catch (error) {
      Alert.alert('Erro ao Sair', 'Não foi possível sair da conta. Por favor, tente novamente.');
    }
  };

  const handleWIP = (featureName: string) => {
    Alert.alert('Em Desenvolvimento', `A funcionalidade "${featureName}" será implementada em breve!`);
  };

  if (!user) {
    return (
      <View style={styles.centeredMessageContainer}>
        <Stack.Screen options={{ headerShown: false }} />
        <Text style={styles.loadingText}>Usuário não encontrado. Por favor, faça login novamente.</Text>
        <TouchableOpacity style={styles.simpleButton} onPress={() => router.replace('/(auth)/login' as any)}>
          <Text style={styles.simpleButtonText}>Ir para Login</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const userName = user.fullName || 'Usuário';
  const userAvatarUrl = user.avatarUrl;

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />

      <ProfileHero
        name={userName}
        subtitle={'usar cupons de até R$21,90'}
        avatarUrl={userAvatarUrl}
        onBack={() => router.back()}
        onSubtitlePress={() => router.push('/(client)/profile/edit' as any)}
      />

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollViewContentContainer}>
        <PaymentCard onPress={() => handleWIP('Pagamentos')} />

        <View style={styles.section}>
          <ListRow label="Conversas" ionIcon="chatbubble-outline" onPress={() => handleWIP('Conversas')} badge={2} />
          <ListRow label="Notificações" ionIcon="notifications-outline" onPress={() => router.push('/(common)/notifications' as any)} />
          <ListRow label="Dados da conta" ionIcon="person-outline" onPress={() => router.push('/(client)/profile/edit' as any)} />
          <ListRow label="Clube" ionIcon="ribbon-outline" onPress={() => handleWIP('Clube')} />
          <ListRow label="Cupons" ionIcon="pricetag-outline" onPress={() => handleWIP('Cupons')} />
          <ListRow label="Código de entrega" ionIcon="qr-code-outline" onPress={() => handleWIP('Código de entrega')} />
          <ListRow label="Comunidade" ionIcon="people-outline" onPress={() => handleWIP('Comunidade')} />
          <ListRow label="Fidelidade" ionIcon="star-outline" onPress={() => handleWIP('Fidelidade')} />
        </View>

        <View style={styles.section}>
          <ListRow label="Suporte" ionIcon="help-circle-outline" onPress={() => router.push('/(common)/help' as any)} />
          <ListRow label="Termos de Serviço" ionIcon="document-text-outline" onPress={() => router.push('/(common)/termos' as any)} />
          <ListRow label="Política de Privacidade" ionIcon="shield-checkmark-outline" onPress={() => router.push('/(common)/privacidade' as any)} />
          <ListRow label="Sair" ionIcon="log-out-outline" destructive onPress={handleLogout} />
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f7f7f7' },
  scrollView: { flex: 1 },
  scrollViewContentContainer: { paddingBottom: 40, paddingHorizontal: 12 },

  centeredMessageContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 },
  simpleButton: { marginTop: 20, backgroundColor: '#007AFF', paddingVertical: 10, paddingHorizontal: 20, borderRadius: 8 },
  simpleButtonText: { color: '#fff', fontSize: 16, fontWeight: '600' },
  loadingText: { fontSize: 16, color: '#6C757D', marginBottom: 10 },

  // hero
  hero: { paddingTop: Platform.OS === 'ios' ? 50 : 20, paddingBottom: 16, paddingHorizontal: 14 },
  heroRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  heroBackBtn: { padding: 6 },
  heroLogo: { width: 40, height: 16, resizeMode: 'contain', marginLeft: 8 },
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
    ...Platform.select({ ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.06, shadowRadius: 6 }, android: { elevation: 3 } }),
  },
  paymentTitle: { fontSize: 16, color: '#111', fontWeight: '600' },
  paymentSubtitle: { fontSize: 12, color: '#6C6C6C', marginTop: 2, maxWidth: 240 },

  section: {
    marginTop: 14,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    overflow: 'hidden',
    marginHorizontal: 4,
    ...Platform.select({ ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.06, shadowRadius: 6 }, android: { elevation: 2 } }),
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
  badge: { backgroundColor: '#FF2D55', paddingHorizontal: 8, height: 18, borderRadius: 9, alignItems: 'center', justifyContent: 'center', marginRight: 8 },
  badgeText: { color: '#fff', fontWeight: '700', fontSize: 12 },
});

