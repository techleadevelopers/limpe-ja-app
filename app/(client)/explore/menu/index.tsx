import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  AccessibilityInfo,
  Animated,
  Dimensions,
  Easing,
  Image,
  ImageSourcePropType,
  Platform,
  Pressable,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  useColorScheme,
} from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { Ionicons } from '@expo/vector-icons';
import NavBar from '../../../../components/client/explore/home/NavBar'; // Import do NavBar injetado

import Colors from '../../../../constants/Colors';
import { getUserProfile } from '../../../../services/clientService';
import type { UserProfile } from '../../../../types/backend/users';

// =================== THEME ===================
function useTheme() {
  const scheme = useColorScheme?.() || 'light';
  const theme = (Colors as any)[scheme] || (Colors as any).light;
  return theme as typeof Colors.light;
}

// Helper para adicionar opacidade a cores hexadecimais
const withAlpha = (hex: string, a: number) => {
  const h = hex.replace('#', '');
  const f = h.length === 3 ? h.split('').map(c => c + c).join('') : h;
  const i = parseInt(f, 16);
  const r = (i >> 16) & 255, g = (i >> 8) & 255, b = i & 255;
  return `rgba(${r}, ${g}, ${b}, ${a})`;
};

// =================== ÍCONES 3D ===================
const Icons3D = {
  profile: require('../../../../assets/images/3d/perfil.png'),
  ticket: require('../../../../assets/images/3d/ticket.png'), // Cupons
  cashback: require('../../../../assets/images/3d/cashback.png'), // Cashback
  champions2: require('../../../../assets/images/3d/champions2.png'), // Ranking
  missions: require('../../../../assets/images/3d/step1-card-profile.png'), // Missões
  referral: require('../../../../assets/images/3d/gift2.png'), // Indicações
  metrics: require('../../../../assets/images/3d/uptrend.png'), // Métricas
  support: require('../../../../assets/images/3d/support.png'), // Suporte
  safety: require('../../../../assets/images/3d/security.png'), // Segurança
  privacy: require('../../../../assets/images/3d/privacidade.png'), // Configurações/Privacidade
  bookService: require('../../../../assets/images/3d/button.png'), // Novo ícone para Agendar Serviço
} satisfies Record<string, ImageSourcePropType>;

// Componente para renderizar ícones 3D
const Icon3D = ({ src, size = 46, style }: { src: ImageSourcePropType; size?: number; style?: any }) => (
  <Image source={src} style={[{ width: size, height: size }, style]} resizeMode="contain" />
);

// =================== SKELETON (SHIMMER) - DEFINIÇÃO CORRIGIDA ===================
function Shimmer({ style, borderRadius = 12 }: { style?: any; borderRadius?: number }) {
  const progress = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    const loop = Animated.loop(
      Animated.timing(progress, {
        toValue: 1,
        duration: 1500,
        easing: Easing.linear,
        useNativeDriver: true,
      }),
    );
    loop.start();
    return () => loop.stop();
  }, [progress]);

  const translateX = progress.interpolate({ inputRange: [0, 1], outputRange: [-100, 300] });

  return (
    <View style={[{ overflow: 'hidden', backgroundColor: 'rgba(0,0,0,0.06)', borderRadius }, style]}>
      <Animated.View
        style={{
          position: 'absolute',
          top: 0,
          bottom: 0,
          width: '100%', // Ajustado para cobrir a largura total do Shimmer
          transform: [{ translateX }],
          opacity: 0.6,
        }}
      >
        <LinearGradient
           colors={['rgba(173, 216, 230, 0.7)', 'rgba(74, 145, 226, 0.38)', 'rgba(173, 216, 230, 0.7)']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={{ flex: 1 }}
        />
      </Animated.View>
    </View>
  );
}


// =================== DEFINIÇÃO DOS MINI-CARDS DE CATEGORIA ===================
interface MenuCategoryItem {
  key: string;
  title: string;
  icon: ImageSourcePropType;
  route: string;
}

const menuCategories: MenuCategoryItem[] = [
  { key: 'coupons', title: 'cupons', icon: Icons3D.ticket, route: '/(client)/coupons' },
  { key: 'missions', title: 'missões', icon: Icons3D.missions, route: '/(client)/missions' },
  { key: 'champions2', title: 'Ranking', icon: Icons3D.champions2, route: '/(client)/champions2' },
  { key: 'cashback', title: 'cashback', icon: Icons3D.cashback, route: '/(client)/wallet/cashback' },
  { key: 'referral', title: 'indicações', icon: Icons3D.referral, route: '/(client)/referrals' },
  { key: 'metrics', title: 'métricas', icon: Icons3D.metrics, route: '/(client)/metrics' },
  { key: 'bookService', title: 'agendar', icon: Icons3D.bookService, route: '/(client)/booking' }, // Exemplo
  { key: 'support', title: 'suporte', icon: Icons3D.support, route: '/(common)/support' },
  { key: 'safety', title: 'segurança', icon: Icons3D.safety, route: '/(common)/safety' },
  { key: 'settings', title: 'ajustes', icon: Icons3D.privacy, route: '/(client)/settings' },
];

// =================== MINI-CARD DE CATEGORIA (Substitui StatPill) ===================
function CategoryMiniCard({ item, theme }: { item: MenuCategoryItem; theme: ReturnType<typeof useTheme> }) {
  const router = useRouter();
  const handlePress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.push(item.route as any);
  };

  return (
    <Pressable
      onPress={handlePress}
      accessibilityRole="button"
      accessibilityLabel={item.title}
      style={({ pressed }) => [
        styles.categoryMiniCard,
        {
          backgroundColor: '#87b9ef69',
          borderColor: '#b487efff', // Borda roxa transparente
          transform: [{ scale: pressed ? 0.98 : 1 }],
          // Sombras já definidas em styles.categoryMiniCard
        },
      ]}
    >
      <Icon3D src={item.icon} size={66} />
      <Text style={[styles.categoryMiniCardTitle, { color: theme.text }]} numberOfLines={1}>
        {item.title}
      </Text>
    </Pressable>
  );
}

// =================== TELA ===================
export default function ClientMenuScreen() {
  const router = useRouter();
  const theme = useTheme();
  const scheme = useColorScheme?.() || 'light';

  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [reduceMotion, setReduceMotion] = useState(false);

  const headerFade = useRef(new Animated.Value(0)).current;
  const headerTranslate = useRef(new Animated.Value(18)).current; // Para a animação do card principal

  useEffect(() => {
    AccessibilityInfo.isReduceMotionEnabled().then(setReduceMotion).catch(() => {});
  }, []);

  useEffect(() => {
    (async () => {
      try {
        const p = await getUserProfile();
        setProfile(p);
      } catch {
        setProfile(null);
      }
    })();
  }, []);

  useEffect(() => {
    const animations = [
      Animated.timing(headerFade, { toValue: 1, duration: 380, easing: Easing.out(Easing.quad), useNativeDriver: true }),
      Animated.timing(headerTranslate, { toValue: 0, duration: 380, easing: Easing.out(Easing.quad), useNativeDriver: true }),
    ];
    if (reduceMotion) {
      headerFade.setValue(1);
      headerTranslate.setValue(0);
    } else {
      Animated.parallel(animations).start();
    }
  }, [headerFade, headerTranslate, reduceMotion]);

  const userName =
    profile?.clientDetails?.fullName ||
    profile?.providerDetails?.fullName ||
    profile?.fullName ||
    'Cliente Indicador'; // Nome padrão
  const userEmail = profile?.email || 'indicador@teste.com'; // Email padrão
  const avatarUri =
    profile?.avatarUrl ||
    profile?.clientDetails?.avatarUrl ||
    profile?.providerDetails?.avatarUrl;

  // ===== Header do cartão (perfil + mini-cards de categoria) =====
  const MainCardContent = (
    <Animated.View style={{ opacity: headerFade, transform: [{ translateY: headerTranslate }] }}>
      <LinearGradient
        colors={['rgba(212, 233, 240, 0.11)', 'rgba(74, 119, 226, 0.21)', 'rgba(225, 206, 230, 0)']}
        start={{ x: 0.12, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[styles.glassmorphismCard, { borderColor: withAlpha('#FFF', 0.2) }]}
      >
        <View style={styles.profileBlock}>
          <View style={[styles.avatarWrap, { backgroundColor: withAlpha('#FFF', 0.1) }]}>
            {profile === null ? (
              <Shimmer style={{ width: '100%', height: '100%', borderRadius: 43 }} borderRadius={43} />
            ) : avatarUri ? (
              <Image source={{ uri: avatarUri }} style={styles.avatar} />
            ) : (
              <Image source={Icons3D.profile} style={styles.avatar} />
            )}
          </View>

          {profile === null ? (
            <>
              <Shimmer style={{ width: 160, height: 18, borderRadius: 6, marginTop: 6 }} />
              <Shimmer style={{ width: 120, height: 14, borderRadius: 6, marginTop: 6 }} />
            </>
          ) : (
            <>
              <Text style={[styles.userName, { color: '#1158e683' }]} numberOfLines={1}>
                {userName}
              </Text>
              <Text style={[styles.userEmail, { color: '#666666ff' }]} numberOfLines={1}>
                {userEmail}
              </Text>
            </>
          )}
        </View>

        {/* Grade de Mini-Cards de Categoria */}
        <View style={styles.categoryMiniCardsGrid}>
          {menuCategories.map((item) => (
            <CategoryMiniCard key={item.key} item={item} theme={theme} />
          ))}
        </View>
      </LinearGradient>
    </Animated.View>
  );

  return (
    <View style={[styles.screen, { backgroundColor: '#FFFFFF' }]}>
      <Stack.Screen options={{ headerShown: false }} />
      <StatusBar barStyle={scheme === 'dark' ? 'light-content' : 'dark-content'} />

      {/* Cabeçalho superior da tela (Menu) - Com ícone de voltar e título com fontSize aumentada em ~2% */}
      <Animated.View
        style={[
          styles.topHeader,
          {
            opacity: headerFade,
            transform: [{ translateY: headerFade.interpolate({ inputRange: [0, 1], outputRange: [-16, 0] }) }],
          },
        ]}
      >
        {/* Ícone de voltar injetado no lado esquerdo */}
        <TouchableOpacity
          onPress={() => router.back()}
          style={{ padding: 5, marginLeft: -5 }}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Ionicons name="arrow-back" size={24} color="#1158e683" />
        </TouchableOpacity>
        <Text style={[styles.topHeaderTitle, { color: '#1158e683' }]}>Menu Principal</Text>
        <View style={{ width: 20 }} /> {/* Placeholder para o lado direito */}
      </Animated.View>

      {/* Conteúdo principal com ScrollView */}
      <View style={styles.mainContent}>
        <ScrollView contentContainerStyle={styles.scrollViewContent}>
          {MainCardContent}
          {/* A SectionList e seus itens foram removidos, pois os mini-cards agora estão no HeaderCard */}
        </ScrollView>
      </View>

      {/* NavBar injetado na parte inferior (rodapé fixo) e movido 2% para cima */}
      <View style={{ transform: [{ translateY: -(Dimensions.get('window').height * 0.02) }] }}>
        <NavBar />
      </View>
    </View>
  );
}

// =================== STYLES ===================
const styles = StyleSheet.create({
  screen: { 
    flex: 1,
    // Para acomodar o NavBar no bottom, garantimos que o conteúdo principal não o sobreponha
  },
  mainContent: {
    flex: 1, // Ocupa o espaço restante entre header e bottom nav
  },
  scrollViewContent: { 
    padding: 16, 
    paddingTop: Platform.OS === 'ios' ? 16 : 16, 
    paddingBottom: 28 // Padding extra no bottom para evitar corte pelo NavBar
  }, // Ajuste de padding

  glassmorphismCard: {
    borderRadius: 44,
    borderWidth: 1,
    // Sombra robusta para o card principal
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.15,
        shadowRadius: 1,
      },
      android: {
        elevation: 15,
      },
    }),
  },

  topHeader: {
    paddingHorizontal: 26,
    marginBottom: 10,
    paddingTop: Platform.OS === 'ios' ? 59 : 20,
    paddingBottom: 12,
    borderBottomLeftRadius: 22,
    borderBottomRightRadius: 22,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    // Sombra robusta para o cabeçalho superior
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.15,
        shadowRadius: 10,
      },
      android: {
        elevation: 15,
      },
    }),
  },
  topHeaderTitle: { 
    fontWeight: '700', 
    letterSpacing: 0.6, 
    flex: 1, 
    textAlign: 'center',
    fontSize: 17, // Aumentado em aproximadamente 2% (assumindo base ~17.6px padrão para títulos semelhantes)
  }, // Centraliza o título

  profileBlock: { alignItems: 'center', paddingVertical: 8 },
  avatarWrap: {
    width: 69,
    height: 69,
    borderRadius: 43,
    overflow: 'hidden',
    marginBottom: 0,
    marginTop: 1,
  },
  avatar: { width: '100%', height: '100%', resizeMode: 'cover' },
  userName: { fontSize: 17, fontWeight: '700', marginTop: 6 },
  userEmail: { marginTop: 2, fontSize: 12, opacity: 0.8 },

  // Nova grade para os mini-cards de categoria
  categoryMiniCardsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-around', // Distribui os itens uniformemente
    gap: 10, // Espaçamento entre os mini-cards
    marginTop: 20, // Espaçamento do bloco de perfil
    paddingHorizontal: 10, // Padding interno para a grade
    marginBottom: 20, // Espaçamento inferior da grade
  },
  // Estilos para cada mini-card de categoria
  categoryMiniCard: {
    width: '30%', // Aproximadamente 3 por linha com gap
    aspectRatio: 1, // Torna o card quadrado
    borderRadius: 22,
    padding: 8,
    alignItems: 'center',
    justifyContent: 'center',
  
    // Sombra moderna para os mini-cards
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.15,
        shadowRadius: 6,
      },
      android: {
        elevation: 8,
      },
    }),
  },
  categoryMiniCardTitle: {
    fontSize: 11,
    fontWeight: '600',
    textAlign: 'center',
    marginTop: 2,
    textTransform: 'lowercase', // Títulos em minúsculas
  },

  // Estilos de shimmer (mantidos, mas não diretamente usados nos mini-cards agora)
  shimmer: {
    backgroundColor: 'rgba(0,0,0,0.06)',
  },
});
