// LimpeJaApp/components/BottomNavBar.tsx
import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { usePathname, useRouter } from 'expo-router';

export default function BottomNavBar() {
  const router = useRouter();
  const pathname = usePathname();

  const navItems = [
    { name: 'Home', icon: 'home-outline', route: '/(client)/explore' },
    { name: 'Categories', icon: 'grid-outline', route: '/(client)/explore/todas-categorias' }, // Rota de exemplo
    { name: 'Bookings', icon: 'calendar-outline', route: '/(client)/bookings' }, // Rota de exemplo
    { name: 'Message', icon: 'chatbubbles-outline', route: '/(client)/messages' }, // Rota de exemplo
    { name: 'Profile', icon: 'person-outline', route: '/(client)/profile' }, // Rota de exemplo
  ];

  return (
    <View style={styles.navBarContainer}>
      {navItems.map((item) => {
        // Verifica se a rota atual começa com a rota do item para considerar "ativo"
        const isActive = pathname.startsWith(item.route);
        return (
          <TouchableOpacity
            key={item.name}
            style={styles.navItem}
            onPress={() => router.replace(item.route as any)}
          >
            <Ionicons
              name={isActive ? item.icon.replace('-outline', '') : item.icon} // Ícone preenchido se ativo
              size={24}
              color={isActive ? '#007BFF' : '#718096'}
            />
            <Text style={[styles.navText, isActive && styles.navTextActive]}>
              {item.name}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  navBarContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    backgroundColor: '#FFFFFF', // Fundo claro
    borderTopWidth: 1,
    borderTopColor: '#EBF3FF', // Borda clara
    paddingVertical: 10,
    paddingBottom: Platform.OS === 'ios' ? 25 : 10, // Ajuste para barra inferior do iPhone X
    shadowColor: 'rgba(0,0,0,0.1)', // Sombra sutil
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.8,
    shadowRadius: 4,
    elevation: 8,
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
  },
  navItem: {
    alignItems: 'center',
    flex: 1,
  },
  navText: {
    fontSize: 10,
    color: '#718096',
    marginTop: 3,
  },
  navTextActive: {
    color: '#007BFF',
    fontWeight: '600',
  },
});