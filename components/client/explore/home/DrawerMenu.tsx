import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router'; // Importe useRouter
import React from 'react';
import {
    Dimensions,
    Image,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { useAuth } from '../../../../contexts/AuthContext'; // Importar useAuth para acessar o contexto

// Importa a interface UserProfile completa para tipar o 'user' do AuthContext
import { UserProfile } from '../../../../types/backend/users'; // AJUSTE O CAMINHO CONFORME A ESTRUTURA REAL DO SEU PROJETO

const SCREEN_WIDTH = Dimensions.get('window').width;

export default function DrawerMenu() {
  const { user, signOut } = useAuth() as { user: UserProfile | null; signOut: () => Promise<void> };
  const router = useRouter(); // Declaração correta do router

  const handleLogout = async () => {
    console.log("DrawerMenu: Iniciando logout...");
    try {
      await signOut();
      console.log("DrawerMenu: Usuário deslogado com sucesso.");
      router.push('/(auth)/login'); // Navegar para a tela de login após logout
    } catch (error) {
      console.error("DrawerMenu: Erro ao deslogar:", error);
    }
  };

  const navigateTo = (path: string, params?: object) => {
    console.log(`DrawerMenu: Navegando para: ${path}`);
    router.push({ pathname: path, params: params } as any);
  };

  const userJobTitle = user?.role === 'CLIENT' ? 'Cliente Cleaning' : user?.role === 'PROVIDER' ? 'Provedor de Serviços' : 'Usuário';

  const avatarSource = user?.avatarUrl ? { uri: user.avatarUrl } : require('../../../../assets/images/default-avatar.png');

  return (
    <View style={styles.container}>
      <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
        <Ionicons name="arrow-back" size={24} color="#333" />
      </TouchableOpacity>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.profileSection}>
          <Image source={avatarSource} style={styles.avatar} />
          <View style={styles.userInfo}>
            <Text style={styles.userName}>{user?.name || 'Visitante'}</Text>
            <Text style={styles.userJobTitle}>{userJobTitle}</Text>
            <TouchableOpacity onPress={() => navigateTo('/(client)/profile')} style={styles.editIcon}>
              <Ionicons name="pencil-outline" size={20} color="#666" />
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.contactInfo}>
          <View style={styles.contactItem}>
            <Ionicons name="call-outline" size={18} color="#666" style={styles.contactIcon} />
            <Text style={styles.contactText}>{user?.phone || 'Não informado'}</Text>
          </View>
          <View style={styles.contactItem}>
            <Ionicons name="mail-outline" size={18} color="#666" style={styles.contactIcon} />
            <Text style={styles.contactText}>{user?.email || 'Não informado'}</Text>
          </View>
        </View>

        <View style={styles.statsSection}>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>
              {user?.role === 'CLIENT' ?
                `R$ ${(user.walletBalance || 0).toFixed(2).replace('.', ',')}` :
                user?.role === 'PROVIDER' ?
                `R$ ${(user.totalEarningsLastMonth || 0).toFixed(2).replace('.', ',')}` :
                'R$ 0,00'
              }
            </Text>
            <Text style={styles.statLabel}>
              {user?.role === 'CLIENT' ? 'Carteira' : user?.role === 'PROVIDER' ? 'Ganhos Mês' : 'Saldo'}
            </Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statValue}>
              {user?.role === 'CLIENT' ?
                (user.ordersCount || 0) :
                user?.role === 'PROVIDER' ?
                (user.upcomingBookingsCount || 0) :
                '0'
              }
            </Text>
            <Text style={styles.statLabel}>
              {user?.role === 'CLIENT' ? 'Agendamentos' : user?.role === 'PROVIDER' ? 'Próx. Serv.' : 'Pedidos'}
            </Text>
          </View>
        </View>

        <View style={styles.menuOptions}>
          <TouchableOpacity style={styles.menuItem} onPress={() => navigateTo('/(client)/bookings')}>
            <Ionicons name="bookmark-outline" size={22} color="#666" style={styles.menuIcon} />
            <Text style={styles.menuText}>Meus Agendamentos</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.menuItem} onPress={() => navigateTo('/(client)/payments')}>
            <Ionicons name="card-outline" size={22} color="#666" style={styles.menuIcon} />
            <Text style={styles.menuText}>Formas de Pagamento</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.menuItem} onPress={() => navigateTo('/(client)/refer-a-friend')}>
            <Ionicons name="people-outline" size={22} color="#666" style={styles.menuIcon} />
            <Text style={styles.menuText}>Indique um Amigo</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.menuItem} onPress={() => navigateTo('/(client)/promotions')}>
            <Ionicons name="gift-outline" size={22} color="#666" style={styles.menuIcon} />
            <Text style={styles.menuText}>Promoções</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.menuItem} onPress={() => navigateTo('/(client)/settings')}>
            <Ionicons name="settings-outline" size={22} color="#666" style={styles.menuIcon} />
            <Text style={styles.menuText}>Configurações</Text>
          </TouchableOpacity>

          <TouchableOpacity style={[styles.menuItem, styles.logoutItem]} onPress={handleLogout}>
            <Ionicons name="log-out-outline" size={22} color="#E74C3C" style={styles.menuIcon} />
            <Text style={[styles.menuText, styles.logoutText]}>Sair</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    paddingTop: Platform.OS === 'android' ? 40 : 60,
    paddingHorizontal: 20,
  },
  backButton: {
    position: 'absolute',
    top: Platform.OS === 'android' ? 40 : 60,
    left: 20,
    zIndex: 1,
    padding: 10,
  },
  scrollContent: {
    paddingTop: 0,
    paddingBottom: 20,
  },
  profileSection: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 30,
    marginTop: 20,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    marginRight: 15,
    borderWidth: 2,
    borderColor: '#E0E0E0',
  },
  userInfo: {
    flex: 1,
    position: 'relative',
  },
  userName: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#333',
  },
  userJobTitle: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
  editIcon: {
    position: 'absolute',
    top: 0,
    right: 0,
    padding: 5,
  },
  contactInfo: {
    marginBottom: 30,
  },
  contactItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  contactIcon: {
    marginRight: 10,
  },
  contactText: {
    fontSize: 16,
    color: '#333',
  },
  statsSection: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    backgroundColor: '#F8F8F8',
    borderRadius: 12,
    paddingVertical: 15,
    marginBottom: 30,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: '#E0E0E0',
  },
  statItem: {
    alignItems: 'center',
    flex: 1,
  },
  statValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  statLabel: {
    fontSize: 13,
    color: '#666',
    marginTop: 5,
  },
  statDivider: {
    height: '80%',
    width: 1,
    backgroundColor: '#E0E0E0',
  },
  menuOptions: {
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 15,
    paddingHorizontal: 10,
    marginBottom: 10,
    borderRadius: 10,
    backgroundColor: '#F8F8F8',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: '#E0E0E0',
  },
  menuIcon: {
    marginRight: 15,
  },
  menuText: {
    fontSize: 16,
    color: '#333',
    fontWeight: '500',
  },
  logoutItem: {
    marginTop: 20,
    backgroundColor: '#FEE',
    borderColor: '#FCC',
  },
  logoutText: {
    color: '#E74C3C',
    fontWeight: 'bold',
  },
});