import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Platform, Image } from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter, usePathname } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context'; // Importar useSafeAreaInsets

// Definindo tipos mais específicos para os itens da barra de navegação
interface NavItemBase {
  name: string;
  path: string;
  isCentral?: boolean;
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

type NavItemType = IoniconNavItem | MaterialCommunityIconNavItem;

const navItems: NavItemType[] = [
  {
    name: 'Home',
    iconSet: 'Ionicons',
    icon: 'home-outline',
    activeIcon: 'home',
    path: '/(client)/explore',
  },
  {
    name: 'Buscar',
    iconSet: 'Ionicons',
    icon: 'search-outline',
    activeIcon: 'search',
    path: '/(client)/search',
  },
  {
    name: '', // Este é o item central que vamos modificar
    iconSet: 'MaterialCommunityIcons',
    icon: 'water-outline',
    isCentral: true,
    path: '/(client)/bookings/schedule-service',
  },
  {
    name: 'Agenda',
    iconSet: 'Ionicons',
    icon: 'calendar-outline',
    activeIcon: 'calendar',
    path: '/(client)/bookings',
  },
  {
    name: 'Perfil',
    iconSet: 'Ionicons',
    icon: 'person-outline',
    activeIcon: 'person',
    path: '/(client)/profile',
  },
];

const NavBar: React.FC = () => {
  const router = useRouter();
  const pathname = usePathname();
  const insets = useSafeAreaInsets(); // Obter os insets de área segura

  const isRouteActive = (itemPath: string) => {
    if (itemPath === '/(client)/explore' && pathname === '/(client)/explore') return true;
    return pathname.startsWith(itemPath) && itemPath !== '/(client)/explore';
  };

  return (
    <View style={[styles.navBar, { paddingBottom: insets.bottom }]}> {/* Aplicar paddingBottom */}
      {navItems.map((item) => {
        const isActive = isRouteActive(item.path);

        if (item.isCentral) {
          return (
            <TouchableOpacity
              key={item.path} // Usar path como key, pois name pode ser vazio
              style={styles.navItemCentralContainer}
              onPress={() => router.push(item.path as any)}
            >
              <View style={styles.gotaIconContainer}>
                <Image
                  source={require('/assets/images/splash.png')}
                  style={styles.centralImage}
                />
              </View>
              {/* O texto do item central pode precisar de ajuste de marginTop se o nome for vazio */}
              <Text style={[styles.navTexto, { color: isActive ? '#007AFF' : '#555E68', marginTop: 8, fontWeight: isActive ? '700' : '600' }]}>
                {item.name}
              </Text>
            </TouchableOpacity>
          );
        } else {
          if (item.iconSet === 'Ionicons') {
            return (
              <TouchableOpacity
                key={item.path} // Usar path como key
                style={styles.navItem}
                onPress={() => router.push(item.path as any)}
              >
                <Ionicons name={isActive ? item.activeIcon : item.icon} size={18} color={isActive ? '#007AFF' : '#888'} />
                <Text style={[styles.navTexto, isActive && styles.navTextoAtivo]}>{item.name}</Text>
              </TouchableOpacity>
            );
          }
        }
        return null;
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  navBar: {
    flexDirection: 'row',
    // Removendo height fixo e paddingBottom hardcoded
    // A altura será definida pelo conteúdo + paddingTop + paddingBottom (do safe area)
    minHeight: 65, // Altura mínima para o conteúdo da barra (ajuste se necessário)
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: '#B2B2B2',
    backgroundColor: '#FFFFFF',
    alignItems: 'flex-start', // Mantido para alinhar o conteúdo no topo da área de conteúdo
    // O paddingBottom: insets.bottom será adicionado via style inline
    marginTop: 80,
  },
  navItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 10, // Mantido para dar espaço ao conteúdo
    height: '100%', // Item ocupa 100% da altura do navBar (excluindo paddingBottom)
  },
  navItemCentralContainer: {
    flex: 1.2,
    alignItems: 'center',
    justifyContent: 'flex-start',
    transform: [{ translateY: -15 }], // Mantido para levantar o botão central
  },
  gotaIconContainer: {
    // bottom: 15, // Removido, pois translateY já posiciona
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#003D7A',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.15,
    shadowRadius: 5,
    elevation: 6,
  },
  centralImage: {
    width: 75,
    height: 75,
    bottom: -15, // Mantido para ajustar a imagem dentro do container
    borderRadius: 88,
  },
  navTexto: {
    fontSize: 11,
    color: '#555E68',
    marginTop: 4,
  },
  navTextoAtivo: {
    color: '#007AFF',
    fontWeight: '700',
  },
});

export default NavBar;