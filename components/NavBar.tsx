// LimpeJaApp/components/NavBar.tsx
import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Platform } from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter, usePathname } from 'expo-router';

// Definindo tipos mais específicos para os itens da barra de navegação
interface NavItemBase {
  name: string;
  path: string; // Ajuste para o tipo Href do Expo Router se quiser mais segurança
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
  // MaterialCommunityIcons não tem um conceito de 'activeIcon' separado da mesma forma,
  // mas você pode definir um se quiser ou apenas mudar a cor.
  activeIcon?: keyof typeof MaterialCommunityIcons.glyphMap; // Opcional
}

type NavItemType = IoniconNavItem | MaterialCommunityIconNavItem;

const navItems: NavItemType[] = [
  {
    name: 'Home',
    iconSet: 'Ionicons',
    icon: 'home-outline',
    activeIcon: 'home',
    path: '/(client)/explore', // Ajuste para sua rota real
  },
  {
    name: 'Buscar',
    iconSet: 'Ionicons',
    icon: 'search-outline',
    activeIcon: 'search',
    path: '/(client)/search', // Crie esta rota: app/(client)/search.tsx
  },
  {
    name: 'Limpar',
    iconSet: 'MaterialCommunityIcons', // Especifica o conjunto de ícones
    icon: 'water-outline',             // Ícone do MaterialCommunityIcons
    isCentral: true,
    path: '/(client)/bookings/schedule-service', // Rota para agendar limpeza
  },
  {
    name: 'Agenda',
    iconSet: 'Ionicons',
    icon: 'calendar-outline',
    activeIcon: 'calendar',
    path: '/(client)/bookings', // Rota para agendamentos
  },
  {
    name: 'Perfil',
    iconSet: 'Ionicons',
    icon: 'person-outline',
    activeIcon: 'person',
    path: '/(client)/profile', // Rota para perfil
  },
];

const NavBar: React.FC = () => {
  const router = useRouter();
  const pathname = usePathname();

  const isRouteActive = (itemPath: string) => {
    // Lógica mais precisa para verificar se a rota está ativa,
    // especialmente para rotas aninhadas ou com parâmetros.
    // Para abas simples, startsWith pode ser suficiente.
    if (itemPath === '/(client)/explore' && pathname === '/(client)/explore') return true; // Caso exato para a home
    return pathname.startsWith(itemPath) && itemPath !== '/(client)/explore'; // Evita que explore sempre pareça ativo para sub-rotas
  };

  return (
    <View style={styles.navBar}>
      {navItems.map((item) => {
        const isActive = isRouteActive(item.path);

        if (item.isCentral) {
          // Verificação de tipo para MaterialCommunityIcons
          if (item.iconSet === 'MaterialCommunityIcons') {
            return (
              <TouchableOpacity
                key={item.name}
                style={styles.navItemCentralContainer}
                onPress={() => router.push(item.path as any)}
              >
                <View style={styles.gotaIconContainer}>
                  <MaterialCommunityIcons name={item.icon} size={32} color="#FFFFFF" />
                </View>
                <Text style={[styles.navTexto, { color: isActive ? '#007AFF' : '#555E68', marginTop: 8, fontWeight: isActive ? '700' : '600' }]}>
                  {item.name}
                </Text>
              </TouchableOpacity>
            );
          }
        } else {
          // Verificação de tipo para Ionicons
          if (item.iconSet === 'Ionicons') {
            return (
              <TouchableOpacity
                key={item.name}
                style={styles.navItem}
                onPress={() => router.push(item.path as any)}
              >
                <Ionicons name={isActive ? item.activeIcon : item.icon} size={26} color={isActive ? '#007AFF' : '#888'} />
                <Text style={[styles.navTexto, isActive && styles.navTextoAtivo]}>{item.name}</Text>
              </TouchableOpacity>
            );
          }
        }
        return null; // Caso não caia em nenhuma das condições (não deve acontecer com tipos corretos)
      })}
    </View>
  );
};

// Seus estilos (mantidos como no seu código)
const styles = StyleSheet.create({
  navBar: {
    flexDirection: 'row',
    height: Platform.OS === 'ios' ? 85 : 70, 
    paddingBottom: Platform.OS === 'ios' ? 20 : 0, 
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: '#B2B2B2', 
    backgroundColor: '#FFFFFF',
    alignItems: 'flex-start', 
  },
  navItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 10, 
    height: '100%', 
  },
  navItemCentralContainer: { 
    flex: 1.2, 
    alignItems: 'center',
    justifyContent: 'flex-start', 
    transform: [{ translateY: -15 }], 
  },
  gotaIconContainer: {
    backgroundColor: '#007AFF',
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