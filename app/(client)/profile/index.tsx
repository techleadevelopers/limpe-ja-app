// LimpeJaApp/app/(client)/profile/index.tsx
import React from 'react';
import { 
    View, 
    Text, 
    StyleSheet, 
    Alert, 
    ScrollView, 
    TouchableOpacity, 
    Image,
    Platform 
} from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { useAuth } from '../../../hooks/useAuth'; // Ajuste o caminho se 'hooks' estiver na raiz
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons'; // Para ícones

// Assumindo que o tipo User no AuthContext pode ter avatarUrl e phone
// interface User {
//   id: string;
//   email: string;
//   name?: string;
//   role: 'client' | 'provider' | null;
//   phone?: string;
//   avatarUrl?: string;
// }

const MenuItem: React.FC<{
  label: string;
  iconName: keyof typeof Ionicons.glyphMap; // Ou outro tipo de ícone se preferir
  onPress: () => void;
  isDestructive?: boolean;
}> = ({ label, iconName, onPress, isDestructive }) => {
  return (
    <TouchableOpacity style={styles.menuItem} onPress={onPress}>
      <Ionicons 
        name={iconName} 
        size={24} 
        color={isDestructive ? '#D32F2F' : '#007AFF'} 
        style={styles.menuItemIcon} 
      />
      <Text style={[styles.menuItemText, isDestructive && styles.menuItemTextDestructive]}>{label}</Text>
      {!isDestructive && <Ionicons name="chevron-forward-outline" size={22} color="#C7C7CC" />}
    </TouchableOpacity>
  );
};

export default function ClientProfileScreen() {
  const { user, signOut } = useAuth();
  const router = useRouter();

  if (!user) {
    // Isso é um fallback, o RootLayout deveria ter redirecionado para login
    return (
      <View style={styles.centeredMessageContainer}>
        <Text>Usuário não encontrado. Por favor, faça login novamente.</Text>
        <TouchableOpacity style={styles.simpleButton} onPress={() => router.replace('/(auth)/login')}>
            <Text style={styles.simpleButtonText}>Ir para Login</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const handleLogout = () => { // Removido async pois Alert.alert não precisa de await aqui
    Alert.alert(
      "Sair da Conta",
      "Tem certeza que deseja sair da sua conta LimpeJá?",
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Sair",
          onPress: async () => { // signOut é async
            await signOut();
            // O RootLayout (app/_layout.tsx) deve detectar a mudança no estado de autenticação
            // e redirecionar automaticamente para / (auth)/login.
            // router.replace('/(auth)/login'); // Pode ser redundante se _layout já faz
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

  return (
    <ScrollView style={styles.scrollView} contentContainerStyle={styles.container}>
      <Stack.Screen options={{ title: 'Meu Perfil' }} />
      
      <View style={styles.profileHeader}>
        <TouchableOpacity onPress={() => router.push('/(client)/profile/edit')} style={styles.avatarContainer}>
          {user.avatarUrl ? (
            <Image source={{ uri: user.avatarUrl }} style={styles.avatarImage} />
          ) : (
            <View style={styles.avatarPlaceholder}>
              <Ionicons name="person-circle-outline" size={70} color="#ADB5BD" />
            </View>
          )}
          <View style={styles.editIconBadge}>
            <Ionicons name="pencil" size={14} color="#fff" />
          </View>
        </TouchableOpacity>
        <Text style={styles.userName}>{user.name || 'Usuário LimpeJá'}</Text>
        <Text style={styles.userEmail}>{user.email}</Text>
        {user.phone && <Text style={styles.userPhone}><Ionicons name="call-outline" size={14} /> {user.phone}</Text>}
      </View>

      <View style={styles.menuSection}>
        <Text style={styles.sectionTitle}>Minha Conta</Text>
        <MenuItem label="Editar Perfil" iconName="create-outline" onPress={() => router.push('/(client)/profile/edit')} />
        <MenuItem label="Meus Endereços" iconName="location-outline" onPress={() => handleWIP("Meus Endereços")} />
        <MenuItem label="Formas de Pagamento" iconName="card-outline" onPress={() => handleWIP("Formas de Pagamento")} />
      </View>

      <View style={styles.menuSection}>
        <Text style={styles.sectionTitle}>Preferências e Suporte</Text>
        <MenuItem label="Notificações" iconName="notifications-outline" onPress={() => handleWIP("Notificações")} />
        <MenuItem label="Configurações do App" iconName="settings-outline" onPress={() => router.push('/(common)/settings')} />
        <MenuItem label="Ajuda e Suporte" iconName="help-circle-outline" onPress={() => router.push('/(common)/help')} />
        <MenuItem label="Termos de Serviço" iconName="document-text-outline" onPress={() => handleWIP("Termos de Serviço")} />
        <MenuItem label="Política de Privacidade" iconName="shield-checkmark-outline" onPress={() => handleWIP("Política de Privacidade")} />
      </View>
      
      <View style={styles.logoutSection}>
        <MenuItem label="Sair da Conta" iconName="log-out-outline" onPress={handleLogout} isDestructive />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scrollView: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  container: {
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
      borderRadius: 5,
  },
  simpleButtonText: {
      color: '#fff',
      fontSize: 16,
  },
  profileHeader: {
    alignItems: 'center',
    paddingVertical: 30,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E9ECEF',
    marginBottom: 10, // Espaço antes da primeira seção de menu
  },
  avatarContainer: {
    position: 'relative',
    marginBottom: 10,
  },
  avatarImage: {
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 3,
    borderColor: '#007AFF',
  },
  avatarPlaceholder: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#E9ECEF',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#DEE2E6',
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
    fontSize: 22,
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
  },
  menuSection: {
    marginTop: 15, // Espaço entre seções
    backgroundColor: '#FFFFFF',
    // Adiciona uma leve sombra aos cards de seção
    ...Platform.select({
        ios: { shadowColor: 'rgba(0,0,0,0.05)', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 1, shadowRadius: 3 },
        android: { elevation: 1, borderTopWidth:0.5, borderBottomWidth:0.5, borderColor:'#E0E0E0' }, // No Android, elevação e bordas podem ser mais diretas
    }),
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6C757D',
    paddingHorizontal: 20,
    paddingTop: 15,
    paddingBottom: 8,
    textTransform: 'uppercase', // Títulos de seção em maiúsculas
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 15,
    paddingHorizontal: 20,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: '#E9ECEF',
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
    ...Platform.select({
        ios: { shadowColor: 'rgba(0,0,0,0.05)', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 1, shadowRadius: 3 },
        android: { elevation: 1, borderTopWidth:0.5, borderBottomWidth:0.5, borderColor:'#E0E0E0' },
    }),
  }
});