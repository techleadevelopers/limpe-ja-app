// LimpeJaApp/app/(client)/profile/index.tsx
import React, { useState, useEffect, useRef } from 'react';
import {
    View,
    Text,
    StyleSheet,
    Alert,
    ScrollView,
    TouchableOpacity,
    Image,
    Platform,
    Animated, // Importar Animated para animações
} from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { useAuth } from '../../../hooks/useAuth'; // Ajuste o caminho se 'hooks' estiver na raiz
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons'; // Para ícones

// << Definição local para User, idealmente importada ou o tipo de useAuth().user já incluiria avatarUrl >>
// << Se você tem um tipo User global, certifique-se que ele inclua avatarUrl?: string; >>
interface UserWithAvatar {
    id?: string; // Adicione outras propriedades que o seu objeto 'user' do useAuth() possa ter
    name?: string;
    email?: string;
    phone?: string;
    role?: 'client' | 'provider' | null; // Use os tipos de role reais do seu app
    avatarUrl?: string; // A propriedade que estamos gerenciando
}


// Componente MenuItem com animações de entrada e feedback de toque
const AnimatedMenuItem: React.FC<{
  label: string;
  iconName: keyof typeof Ionicons.glyphMap | keyof typeof MaterialCommunityIcons.glyphMap;
  onPress: () => void;
  isDestructive?: boolean;
  delay: number; // Para animação escalonada
  iconType?: 'Ionicons' | 'MaterialCommunityIcons'; // Para escolher o tipo de ícone
}> = ({ label, iconName, onPress, isDestructive, delay, iconType = 'Ionicons' }) => {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(20)).current;
  const scaleAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 400,
        delay: delay,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 400,
        delay: delay,
        useNativeDriver: true,
      }),
    ]).start();
  }, [fadeAnim, slideAnim, delay]);

  const onPressInItem = () => {
    Animated.spring(scaleAnim, {
      toValue: 0.98,
      useNativeDriver: true,
    }).start();
  };

  const onPressOutItem = () => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      friction: 3,
      tension: 40,
      useNativeDriver: true,
    }).start();
  };

  const IconComponent = iconType === 'MaterialCommunityIcons' ? MaterialCommunityIcons : Ionicons;

  return (
    <Animated.View
        style={[
            styles.menuItemWrapper,
            { opacity: fadeAnim, transform: [{ translateY: slideAnim }, { scale: scaleAnim }] }
        ]}
    >
        <TouchableOpacity
            style={styles.menuItem}
            onPress={onPress}
            onPressIn={onPressInItem}
            onPressOut={onPressOutItem}
            activeOpacity={1} // Desativa o activeOpacity padrão
        >
            <IconComponent
                name={iconName as any} // 'as any' para contornar o problema de tipo do nome do ícone
                size={24}
                color={isDestructive ? '#D32F2F' : '#007AFF'}
                style={styles.menuItemIcon}
            />
            <Text style={[styles.menuItemText, isDestructive && styles.menuItemTextDestructive]}>{label}</Text>
            {!isDestructive && <Ionicons name="chevron-forward-outline" size={22} color="#C7C7CC" />}
        </TouchableOpacity>
    </Animated.View>
  );
};

export default function ClientProfileScreen() {
  const { user, signOut } = useAuth();
  const router = useRouter();

  // Animações
  const headerAnim = useRef(new Animated.Value(0)).current;
  const profileHeaderAnim = useRef(new Animated.Value(0)).current;
  const avatarScaleAnim = useRef(new Animated.Value(1)).current; // Para feedback de toque no avatar

  useEffect(() => {
    // Animações de entrada do cabeçalho e seção de perfil
    Animated.stagger(200, [
        Animated.timing(headerAnim, {
            toValue: 1,
            duration: 500,
            useNativeDriver: true,
        }),
        Animated.timing(profileHeaderAnim, {
            toValue: 1,
            duration: 700,
            delay: 100, // Pequeno atraso para aparecer depois do header
            useNativeDriver: true,
        }),
    ]).start();
  }, [headerAnim, profileHeaderAnim]);

  // Animações de feedback ao pressionar o avatar
  const onPressInAvatar = () => { Animated.spring(avatarScaleAnim, { toValue: 0.95, useNativeDriver: true }).start(); };
  const onPressOutAvatar = () => { Animated.spring(avatarScaleAnim, { toValue: 1, friction: 3, tension: 40, useNativeDriver: true }).start(); };


  if (!user) {
    // Isso é um fallback, o RootLayout deveria ter redirecionado para login
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

  const handleLogout = () => {
    Alert.alert(
      "Sair da Conta",
      "Tem certeza que deseja sair da sua conta LimpeJá?",
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Sair",
          onPress: async () => {
            await signOut();
          },
          style: "destructive"
        }
      ],
      { cancelable: true }
    );
  };

  // Placeholder para funcionalidades futuras
  const handleWIP = (featureName: string) => {
    Alert.alert("Em Desenvolvimento", `A funcionalidade "${featureName}" será implementada em breve!`);
  };

  // Cast user para UserWithAvatar para acesso seguro ao avatarUrl
  const typedUser = user as UserWithAvatar;

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />

      {/* Custom Header */}
      <Animated.View style={[styles.customHeader, { opacity: headerAnim, transform: [{ translateY: headerAnim.interpolate({ inputRange: [0, 1], outputRange: [-20, 0] }) }] }]}>
          <Text style={styles.headerTitle}>Meu Perfil</Text>
          <TouchableOpacity style={styles.headerIconRight} onPress={() => router.push('/(common)/settings' as any)}>
              <Ionicons name="settings-outline" size={24} color="#FFFFFF" />
          </TouchableOpacity>
      </Animated.View>

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollViewContentContainer}>
        <Animated.View style={[styles.profileHeader, { opacity: profileHeaderAnim, transform: [{ translateY: profileHeaderAnim.interpolate({ inputRange: [0, 1], outputRange: [20, 0] }) }] }]}>
            <TouchableOpacity
                onPress={() => router.push('/(client)/profile/edit' as any)}
                onPressIn={onPressInAvatar}
                onPressOut={onPressOutAvatar}
                style={[styles.avatarContainer, { transform: [{ scale: avatarScaleAnim }] }]}
            >
              {/* << CORREÇÃO: Acessar avatarUrl através de typedUser >> */}
              {typedUser.avatarUrl ? (
                <Image source={{ uri: typedUser.avatarUrl }} style={styles.avatarImage} />
              ) : (
                <View style={styles.avatarPlaceholder}>
                  <Ionicons name="person-circle-outline" size={70} color="#ADB5BD" />
                </View>
              )}
              <View style={styles.editIconBadge}>
                <Ionicons name="pencil" size={14} color="#fff" />
              </View>
            </TouchableOpacity>
            <Text style={styles.userName}>{typedUser.name || 'Usuário LimpeJá'}</Text>
            <Text style={styles.userEmail}>{typedUser.email}</Text>
            {typedUser.phone && <Text style={styles.userPhone}><Ionicons name="call-outline" size={14} /> {typedUser.phone}</Text>}
        </Animated.View>

        <View style={styles.menuSection}>
          <Text style={styles.sectionTitle}>Minha Conta</Text>
          <AnimatedMenuItem label="Editar Perfil" iconName="create-outline" onPress={() => router.push('/(client)/profile/edit' as any)} delay={0} />
          <AnimatedMenuItem label="Meus Endereços" iconName="location-outline" onPress={() => handleWIP("Meus Endereços")} delay={50} />
          <AnimatedMenuItem label="Formas de Pagamento" iconName="card-outline" onPress={() => handleWIP("Formas de Pagamento")} delay={100} />
        </View>

        <View style={styles.menuSection}>
          <Text style={styles.sectionTitle}>Preferências e Suporte</Text>
          <AnimatedMenuItem label="Notificações" iconName="notifications-outline" onPress={() => handleWIP("Notificações")} delay={150} />
          <AnimatedMenuItem label="Configurações do App" iconName="settings-outline" onPress={() => router.push('/(common)/settings' as any)} delay={200} />
          <AnimatedMenuItem label="Ajuda e Suporte" iconName="help-circle-outline" onPress={() => router.push('/(common)/help' as any)} delay={250} />
          <AnimatedMenuItem label="Termos de Serviço" iconName="document-text-outline" onPress={() => router.push('/(common)/termos' as any)} delay={300} />
          <AnimatedMenuItem label="Política de Privacidade" iconName="shield-checkmark-outline" onPress={() => router.push('/(common)/privacidade' as any)} delay={350} />
        </View>

        <View style={styles.logoutSection}>
          <AnimatedMenuItem label="Sair da Conta" iconName="log-out-outline" onPress={handleLogout} isDestructive delay={400} />
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  scrollView: {
    flex: 1,
  },
  scrollViewContentContainer: {
    paddingBottom: 40, // Espaço no final do scroll
  },
  centeredMessageContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      padding: 20,
  },
  simpleButton: {
      marginTop: 20,
      backgroundColor: '#007AFF',
      paddingVertical: 10,
      paddingHorizontal: 20,
      borderRadius: 8,
  },
  simpleButtonText: {
      color: '#fff',
      fontSize: 16,
      fontWeight: '600',
  },
  loadingText: {
    fontSize: 16,
    color: '#6C757D',
    marginBottom: 10,
  },
  customHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#007AFF', // Cor primária do app
    paddingHorizontal: 15,
    paddingVertical: Platform.OS === 'ios' ? 50 : 20, // Ajuste para status bar iOS
    paddingTop: Platform.OS === 'ios' ? 50 : 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 5,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFFFFF',
    flex: 1, // Para o título ocupar o espaço e centralizar melhor
    textAlign: 'center',
  },
  headerIconRight: {
    padding: 5, // Aumenta a área de toque
    position: 'absolute', // Para posicionar corretamente
    right: 15, // Alinha à direita
    top: Platform.OS === 'ios' ? 47 : 17, // Ajuste de acordo com paddingTop
  },
  profileHeader: {
    alignItems: 'center',
    paddingVertical: 30,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E9ECEF',
    marginBottom: 10, // Espaço antes da primeira seção de menu
    ...Platform.select({
        ios: {
            shadowColor: 'rgba(0,0,0,0.05)',
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.1,
            shadowRadius: 3,
        },
        android: {
            elevation: 2,
        },
    }),
  },
  avatarContainer: {
    position: 'relative',
    marginBottom: 10,
    width: 100, // Tamanho fixo para o avatar
    height: 100,
    borderRadius: 50,
    borderWidth: 3,
    borderColor: '#007AFF',
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
    ...Platform.select({
        ios: {
            shadowColor: 'rgba(0,0,0,0.15)',
            shadowOffset: { width: 0, height: 5 },
            shadowOpacity: 0.25,
            shadowRadius: 10,
        },
        android: {
            elevation: 8,
        },
    }),
  },
  avatarImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  avatarPlaceholder: {
    width: '100%',
    height: '100%',
    backgroundColor: '#E9ECEF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  editIconBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: '#007AFF',
    padding: 6,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  userName: {
    fontSize: 24, // Maior para destaque
    fontWeight: 'bold',
    color: '#212529',
    marginTop: 8,
  },
  userEmail: {
    fontSize: 15,
    color: '#6C757D',
    marginTop: 4,
  },
  userPhone: {
    fontSize: 15,
    color: '#6C757D',
    marginTop: 4,
    // flexDirection: 'row', // Para alinhar o ícone com o texto - removido, Ionicons já é inline
    // alignItems: 'center',
  },
  menuSection: {
    marginTop: 15, // Espaço entre seções
    backgroundColor: '#FFFFFF',
    borderRadius: 12, // Bordas arredondadas para a seção
    marginHorizontal: 15, // Margem lateral
    overflow: 'hidden', // Garante que bordas arredondadas funcionem
    ...Platform.select({
        ios: {
            shadowColor: 'rgba(0,0,0,0.05)',
            shadowOffset: { width: 0, height: 3 },
            shadowOpacity: 0.15,
            shadowRadius: 6
        },
        android: {
            elevation: 4,
        },
    }),
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6C757D',
    paddingHorizontal: 20,
    paddingTop: 15,
    paddingBottom: 8,
    textTransform: 'uppercase',
    borderBottomWidth: StyleSheet.hairlineWidth, // Linha divisória
    borderBottomColor: '#E9ECEF',
  },
  menuItemWrapper: { // Wrapper para a animação de cada item
    // Estilos de sombra e borda serão aplicados ao menuSection
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 15,
    paddingHorizontal: 20,
    borderBottomWidth: StyleSheet.hairlineWidth, // Divisor entre itens
    borderBottomColor: '#E9ECEF',
  },
  menuItemIcon: {
    marginRight: 15,
  },
  menuItemText: {
    flex: 1,
    fontSize: 16,
    color: '#212529',
  },
  menuItemTextDestructive: {
    color: '#D32F2F',
  },
  logoutSection: { // Para dar mais destaque ou separação ao botão de logout
    marginTop: 25,
    marginBottom: 20,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    marginHorizontal: 15,
    overflow: 'hidden',
    ...Platform.select({
        ios: {
            shadowColor: 'rgba(0,0,0,0.05)',
            shadowOffset: { width: 0, height: 3 },
            shadowOpacity: 0.15,
            shadowRadius: 6
        },
        android: {
            elevation: 4,
        },
    }),
  }
});