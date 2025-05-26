// LimpeJaApp/components/HeaderSuperior.tsx
import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import Constants from 'expo-constants'; // Importar Constants

const HeaderSuperior: React.FC = () => {
  const router = useRouter();

  const handleProfilePress = () => {
    router.push('/(client)/profile');
  };

  return (
    // Adiciona um View para o padding da SafeArea se necessário, ou aplica diretamente
    <View style={styles.headerOuterContainer}>
      <View style={styles.headerInnerContainer}>
        <Text style={styles.logoTexto}>LimpeJá</Text>
        <TouchableOpacity onPress={handleProfilePress}>
          <Ionicons name="person-circle-outline" size={36} color="#1E3A5F" />
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  headerOuterContainer: {
    paddingTop: Constants.statusBarHeight, // Adiciona padding igual à altura da status bar
    backgroundColor: '#F4F7FC',
  },
  headerInnerContainer: { // O conteúdo do header agora fica aqui
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingBottom: 15, // Padding inferior que você já tinha
    height: 56, // Exemplo de altura para o conteúdo do header em si
  },
  logoTexto: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#007AFF',
  },
});

export default HeaderSuperior;