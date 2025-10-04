import { Ionicons } from '@expo/vector-icons';
import Constants from 'expo-constants'; // Importa Constants para acessar a altura da barra de status
import { useRouter } from 'expo-router';
import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View, Image, Platform } from 'react-native'; // Importe Platform
import { LinearGradient } from 'expo-linear-gradient'; // Importação do LinearGradient
import { Icons3D } from '@/constants/icons3d';

interface NewHeaderProps {
  userName: string;
  userAvatarUrl?: string | null; // Propriedade opcional para o avatar do usuário, aceitando string, undefined ou null
  userAddress?: string | null; // Adicione esta linha
}

const NewHeader: React.FC<NewHeaderProps> = ({ userName, userAvatarUrl, userAddress }) => {
  const router = useRouter();

  const getGreeting = () => {
    const hour = new Date().getHours();
    // Alteração: Capitalização corrigida para as saudações em português
    if (hour < 12) return 'Bom dia';
    if (hour < 18) return 'Boa tarde';
    return 'Boa noite';
  };

  const handleProfilePress = () => {
    router.push('/(client)/profile' as any); // Ajuste a rota se necessário
  };

  const handleNotificationsPress = () => {
    // Implemente a lógica de notificação aqui, por exemplo, navegar para uma tela de notificações
    console.log('Notifications pressed');
    // router.push('/(client)/notifications' as any); // Exemplo de navegação
  };

  // NOVO: Função para lidar com o clique no ícone de categoria
  const handleCategoryPress = () => {
    router.push('/(client)/explore/menu' as any); // Navegação para a rota especificada
  };

  // Define a fonte da imagem do avatar. Se userAvatarUrl for nulo ou indefinido, usa o avatar padrão.
  const avatarSource = userAvatarUrl
    ? { uri: userAvatarUrl }
    : require('../../../../assets/images/default-avatar.png');

  return (
    <LinearGradient
      colors={['#9ebfec13', '#a6abb213']} // Cores do gradiente, do lilás ao rosa suave
      style={styles.container}
    >
      <View style={styles.leftContent}>
        <TouchableOpacity onPress={handleProfilePress} style={styles.profileImageContainer}>
          <Image source={avatarSource} style={styles.profileImage} />
        </TouchableOpacity>
        <View>
          <Text style={styles.greetingText}>{getGreeting()}</Text>
          <Text style={styles.userNameText}>{userName}</Text>
       
        </View>
      </View>
      <View style={styles.rightContent}>
        <TouchableOpacity onPress={handleCategoryPress} style={styles.notificationIconContainer}>
          {/* Alteração aqui: Substituindo Ionicons por Image */}
          <Image
            source={require('../../../../assets/images/3d/category2.png')}
            style={styles.categoryIcon} // Novo estilo para o ícone da categoria
            resizeMode="contain" // Garante que a imagem se ajuste sem cortar
          />
          {/* Opcional: Badge de notificação (descomente e implemente a lógica se precisar) */}
          {/* <View style={styles.notificationBadge} /> */}
        </TouchableOpacity>
      </View>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: {
    // paddingTop ajustado para considerar a altura da barra de status do dispositivo
    // Reduzido o 40 para 30 para um cabeçalho um pouco menos alto
    paddingVertical: Constants.statusBarHeight - 28, // PREMIUM: Inclui status bar no topo para fluxo seamless
    left: 0,
    paddingHorizontal: 15,
    // REMOVIDO: Borda arredondada do cabeçalho (para unificação com ScrollView)
     borderBottomEndRadius: 30,
     borderBottomStartRadius: 30,
     marginBottom: 10,
    // borderRadius: 0,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    // REMOVIDO: paddingBottom e marginBottom para fluxo contínuo no ScrollView
    // paddingBottom: 9,
    // marginBottom: 13,
    // Adicionando zIndex para garantir que o cabeçalho fique abaixo do conteúdo principal
    zIndex: 0, // Definindo um zIndex explícito e baixo
    shadowColor: '#2f3344e8', // Cor da sombra
    shadowOffset: { width: 0, height: 1 }, // Deslocamento vertical mais pronunciado
    shadowOpacity: 0.17, // Opacidade aumentada para robustezs
    shadowRadius: 9, // Raio de desfoque para conforto
    elevation: 6, // Elevação aumentada para robustez no Android
  },
  leftContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  profileImageContainer: {
    width: 38,
    height: 38,
    borderRadius: 20,
    overflow: 'hidden', // Garante que a imagem não saia dos limites do borderRadius
    marginRight: 6,
    backgroundColor: 'transparent', // Fundo de placeholder enquanto a imagem carrega ou se não houver avatar
    justifyContent: 'center',
    alignItems: 'center',
  },
  profileImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover', // Garante que a imagem cubra todo o espaço
  },
  // Inversão: Greeting ("Bom dia") agora é o mais GROSSO (ExtraBold no iOS; Regular + '900' no Android)
  // Mesma família: Montserrat para ambos
  greetingText: {
    fontSize: 14,
    fontFamily: Platform.select({
      ios: 'Montserrat-ExtraBold', // Grosso pesado no iOS (inverte o original: greeting é o bold principal)
      android: 'Montserrat-Regular' // Mantém base no Android, mas com weight alto
    }),
    color: '#666',
    fontWeight: Platform.select({
      ios: '300', // Deixa a variante da font cuidar no iOS
      android: '900' // Mantém original (simula "black/grosso" no Android)
    }),
  },
  // Inversão: UserName agora é um pouco MAIS FINO (Medium/SemiBold no iOS; Thin + 'bold' no Android)
  // Mesma família: Montserrat para ambos (variante mais leve que greeting)
  userNameText: {
    fontSize: 16,
    fontFamily: Platform.select({
      ios: 'Montserrat-Regular', // Mais fina que ExtraBold (mas ainda bold leve) no iOS
      android: 'Montserrat-Thin' // Mantém base no Android
    }),
    color: '#7398b9ff',
    fontWeight: Platform.select({
      ios: '500', // Deixa a variante da font cuidar no iOS
      android: 'bold' // Mantém original (leve bold no Android)
    }),
  },
  // NOVO: Estilo para userAddress (premium: fluxo completo com endereço abaixo do nome)
  userAddressText: {
    fontSize: 12,
    fontFamily: 'Montserrat-Regular',
    color: '#888',
    marginTop: 2,
  },
  rightContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  notificationIconContainer: {
    padding: 5,
  },
  // NOVO ESTILO PARA O ÍCONE DA CATEGORIA
  categoryIcon: {
    width: 25, // Ajuste o tamanho conforme necessário para o ícone da categoria
    height: 25,
  },
  notificationBadge: {
    position: 'absolute',
    top: 5,
    right: 5,
    backgroundColor: 'red',
    borderRadius: 5,
    width: 10,
    height: 10,
  },
});

export default NewHeader;