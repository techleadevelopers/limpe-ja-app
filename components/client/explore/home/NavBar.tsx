import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Platform, Image } from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter, usePathname } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient'; // Importar LinearGradient para o botão central

// Definindo tipos mais específicos para os itens da barra de navegação
interface NavItemBase {
  name: string;
  path: string;
  isCentral?: boolean;
  notificationCount?: number; // Adicionado para exibir contagens
}

interface IoniconNavItem extends NavItemBase {
  iconSet: 'Ionicons';
  icon: keyof typeof Ionicons.glyphMap;
  activeIcon: keyof typeof Ionicons.glyphMap;
}

interface MaterialCommunityIconNavItem extends NavItemBase {
  iconSet: 'MaterialCommunityIcons';
  icon: keyof typeof MaterialCommunityIcons.glyphMap;
  activeIcon?: keyof typeof MaterialCommunityIcons.glyphMap;
}

// NOVO TIPO: Para itens de navegação que usam uma imagem customizada
interface ImageNavItem extends NavItemBase {
  iconSet: 'Image'; // Um identificador para o tipo de ícone de imagem
  imageSource: any; // O caminho da imagem (require(...))
}

// ATUALIZADO: NavItemType agora pode ser um de três tipos
type NavItemType = IoniconNavItem | MaterialCommunityIconNavItem | ImageNavItem;

const navItems: NavItemType[] = [
  {
    name: 'Home', // Alterado o nome para 'Today' conforme a imagem
    iconSet: 'Ionicons',
    icon: 'sunny-outline', // Ícone de sol para 'Today'
    activeIcon: 'home',
    path: '/(client)/today', // Assumindo uma rota para 'Today'
  },
  {
    name: 'Search',
    iconSet: 'Ionicons',
    icon: 'search-outline',
    activeIcon: 'search',
    path: '/(client)/search',
  },
  {
    name: '', // Este é o item central que vamos modificar
    iconSet: 'Image', // ATUALIZADO: Indica que este item usa uma imagem
    imageSource: require('../../../../assets/images/safe.png'), // Caminho da imagem, assumindo que 'safe.png' é o ícone de '+'
    isCentral: true,
    path: '/(client)/bookings/schedule-service', // Rota para agendar serviço
  },
  {
    name: 'Calendar', // Alterado o nome para 'Calendar'
    iconSet: 'Ionicons',
    icon: 'calendar-outline',
    activeIcon: 'calendar',
    path: '/(client)/bookings', // Rota para a agenda/bookings
  },
  {
    name: 'Inbox', // Alterado o nome para 'Inbox'
    iconSet: 'Ionicons',
    icon: 'mail-outline', // Ícone de caixa de entrada
    activeIcon: 'mail',
    path: '/(client)/inbox', // Assumindo uma rota para a caixa de entrada
  },
];

// Adicionando props para o NavBar para receber contagens de notificação
interface NavBarProps {
  unreadMessagesCount?: number;
}

const NavBar: React.FC<NavBarProps> = ({ unreadMessagesCount }) => {
  const router = useRouter();
  const pathname = usePathname();
  const insets = useSafeAreaInsets();

  const isRouteActive = (itemPath: string) => {
    // Para 'Today' e '/'
    if (itemPath === '/(client)/today' && pathname === '/') {
      return true;
    }
    return pathname.startsWith(itemPath);
  };

  return (
    <View style={[styles.navBarWrapper, { paddingBottom: insets.bottom }]}>
      <View style={styles.navBar}>
        {navItems.map((item) => {
          const isActive = isRouteActive(item.path);

          if (item.isCentral) {
            const imageItem = item as ImageNavItem;
            return (
              <TouchableOpacity
                key={imageItem.path}
                style={styles.centralNavItemContainer} // Container para posicionar o botão central
                onPress={() => router.push(imageItem.path as any)}
              >
                <LinearGradient // Gradiente para o círculo de fundo do botão central
                  colors={['#56B8FF', '#0097FF']} // Azul claro para azul médio
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.centralButtonGradient}
                >
                  {/* Ícone '+' no centro, sobreposto ao "safe.png" se "safe.png" for o fundo */}
                  <Ionicons name="add" size={32} color="#FFFFFF" style={styles.centralButtonPlusIcon} />
                  {/* Se safe.png for o ícone de '+' em si, use:
                  <Image
                    source={imageItem.imageSource}
                    style={styles.centralIconImage} // Estilo para a imagem customizada (o '+')
                  /> */}
                </LinearGradient>
              </TouchableOpacity>
            );
          } else {
            // Renderiza ícones e textos para itens não centrais
            const iconColor = isActive ? '#007AFF' : '#64B5F6'; // Azul vibrante para ativo, azul claro para inativo
            const textColor = isActive ? '#007AFF' : '#64B5F6'; // Texto segue a cor do ícone

            if (item.iconSet === 'Ionicons') {
              const ioniconItem = item as IoniconNavItem;
              return (
                <TouchableOpacity
                  key={ioniconItem.path}
                  style={styles.navItem}
                  onPress={() => router.push(ioniconItem.path as any)}
                >
                  <View style={styles.iconContainer}>
                    <Ionicons name={isActive ? ioniconItem.activeIcon : ioniconItem.icon} size={24} color={iconColor} />
                    {/* Exibe o badge de notificação para 'Inbox' */}
                    {ioniconItem.name === 'Inbox' && unreadMessagesCount && unreadMessagesCount > 0 && (
                      <View style={styles.notificationBadge}>
                        <Text style={styles.notificationText}>{unreadMessagesCount}</Text>
                      </View>
                    )}
                  </View>
                  <Text style={[styles.navText, { color: textColor }]}>{ioniconItem.name}</Text>
                </TouchableOpacity>
              );
            } else if (item.iconSet === 'MaterialCommunityIcons') {
              const mcIconItem = item as MaterialCommunityIconNavItem;
              return (
                <TouchableOpacity
                  key={mcIconItem.path}
                  style={styles.navItem}
                  onPress={() => router.push(mcIconItem.path as any)}
                >
                  <View style={styles.iconContainer}>
                    <MaterialCommunityIcons name={mcIconItem.icon} size={24} color={iconColor} />
                    {mcIconItem.name === 'Inbox' && unreadMessagesCount && unreadMessagesCount > 0 && (
                      <View style={styles.notificationBadge}>
                        <Text style={styles.notificationText}>{unreadMessagesCount}</Text>
                      </View>
                    )}
                  </View>
                  <Text style={[styles.navText, { color: textColor }]}>{mcIconItem.name}</Text>
                </TouchableOpacity>
              );
            }
          }
          return null;
        })}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  navBarWrapper: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'transparent', // O wrapper é transparente para permitir o navBar flutuar
  },
  navBar: {
    flexDirection: 'row',
    height: Platform.OS === 'ios' ? 80 : 70, // Altura ajustada
    backgroundColor: 'rgba(180, 213, 248, 0.9)', // Azul muito claro com opacidade para o fundo
    marginHorizontal: 20, // Margem nas laterais
    borderTopLeftRadius: 30, // Bordas arredondadas apenas na parte superior
    borderTopRightRadius: 30, // Bordas arredondadas apenas na parte superior
    // Removidas as bordas inferiores
    alignItems: 'center',
    justifyContent: 'space-around',
    
    // Sombras para replicar o efeito flutuante
    shadowColor: '#007AFF', // Sombra azul
    shadowOffset: { width: 0, height: 5 }, // Sombra para baixo
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 10, // Sombra para Android

    // A curva na imagem é um efeito mais complexo que exigiria SVG ou View sobreposto.
    // Para um resultado visual próximo, mantemos o borderRadius superior e centralizamos o botão +.
  },
  navItem: {
    flex: 1, // Distribui igualmente o espaço entre os itens
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 5,
  },
  iconContainer: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  },
  navText: {
    fontSize: 11, // Tamanho da fonte ajustado
    fontWeight: '600',
    marginTop: 4, // Espaçamento entre ícone e texto
  },
  // Estilos para o botão central
  centralNavItemContainer: {
    position: 'absolute', // Posicionamento absoluto para o item central
    top: -25, // Puxa o botão para cima para criar a "invasão"
    width: 60, // Tamanho do círculo externo
    height: 60,
    borderRadius: 30, // Metade da largura/altura para ser um círculo
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF', // Fundo branco para a "borda" que aparece na imagem
    
    // Sombra para o botão central
    shadowColor: '#007AFF',
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.35,
    shadowRadius: 12,
    elevation: 15,
  },
  centralButtonGradient: {
    width: 50, // Tamanho do círculo interno (gradiente)
    height: 50,
    borderRadius: 25, // Metade da largura/altura para ser um círculo
    alignItems: 'center',
    justifyContent: 'center',
  },
  centralButtonPlusIcon: {
    // O ícone '+' já vem com cor branca do Ionicons
  },

  // Estilos do badge de notificação
  notificationBadge: {
    position: 'absolute',
    top: -5,
    right: -10, // Ajuste a posição para o canto superior direito do ícone
    backgroundColor: '#FF3B30', // Vermelho vibrante para notificações
    borderRadius: 10,
    minWidth: 20, // Garante que o círculo tenha um tamanho mínimo
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 4, // Espaçamento horizontal para números de 2 dígitos
  },
  notificationText: {
    color: 'white',
    fontSize: 10,
    fontWeight: 'bold',
  },
});

export default NavBar;