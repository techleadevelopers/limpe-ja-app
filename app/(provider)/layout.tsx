// LimpeJaApp/app/(provider)/_layout.tsx
import React from 'react';
import { Tabs } from 'expo-router';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons'; // Exemplo

export default function ProviderTabLayout() {
  return (
    <Tabs
      screenOptions={{
        // tabBarActiveTintColor: 'yourProviderColor', // Defina sua cor
        headerShown: true,
      }}
    >
      <Tabs.Screen
        name="dashboard"
        options={{
          title: 'Painel',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="grid-outline" color={color} size={size} />
          ),
        }}
      />
      <Tabs.Screen
        name="schedule" // Diretório
        options={{
          title: 'Agenda',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="calendar-outline" color={color} size={size} />
          ),
        }}
      />
      <Tabs.Screen
        name="services" // Diretório
        options={{
          title: 'Serviços',
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons name="briefcase-check-outline" color={color} size={size} />
          ),
        }}
      />
       <Tabs.Screen
        name="earnings"
        options={{
          title: 'Ganhos',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="cash-outline" color={color} size={size} />
          ),
        }}
      />
      <Tabs.Screen
        name="messages" // Diretório
        options={{
          title: 'Mensagens',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="chatbubbles-outline" color={color} size={size} />
          ),
        }}
      />
      <Tabs.Screen
        name="profile" // Diretório
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