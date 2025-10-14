// LimpeJaApp/app/(client)/_layout.tsx
import React from 'react';
import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons'; // Exemplo de ÃƒÂ­cones, instale @expo/vector-icons
// Importe seus componentes de ÃƒÂ­cones personalizados se tiver
// import TabBarIcon from '../../src/components/layout/TabBarIcon';

export default function ClientTabLayout() {
  return (
    <Tabs
      tabBar={() => null}
      screenOptions={{
        // tabBarActiveTintColor: Colors.tint, // Use suas constantes de cores
        headerShown: false, // Oculta o header padrÃ£o; telas tÃªm headers prÃ³prios
      }}
    >
      <Tabs.Screen
        name="explore" // Deve corresponder ao nome do diretÃƒÂ³rio/arquivo
        options={{
          title: 'Explorar',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="search" color={color} size={size} />
          ),
          // headerShown: false, // Se a tela de explore tiver seu prÃƒÂ³prio header
        }}
      />
      <Tabs.Screen
        name="bookings"
        options={{
          title: 'Agendamentos',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="calendar-outline" color={color} size={size} />
          ),
        }}
      />
      <Tabs.Screen
        name="messages"
        options={{
          title: 'Mensagens',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="chatbubbles-outline" color={color} size={size} />
          ),
          // tabBarBadge: 3, // Exemplo de badge
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Perfil',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="person-circle-outline" color={color} size={size} />
          ),
        }}
      />
    </Tabs>
  );
}

