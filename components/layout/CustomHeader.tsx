// LimpeJaApp/src/components/layout/CustomHeader.tsx
import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, SafeAreaView, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import Colors from '../../constants/Colors';
import { useColorScheme } from 'react-native';

interface CustomHeaderProps {
  title: string;
  canGoBack?: boolean;
  rightAction?: React.ReactNode; // Ex: um ícone ou botão à direita
  onBackPress?: () => void;
}

const CustomHeader: React.FC<CustomHeaderProps> = ({ title, canGoBack, rightAction, onBackPress }) => {
  const router = useRouter();
  const colorScheme = useColorScheme() || 'light';
  const themeColors = Colors[colorScheme];

  const handleBack = () => {
    if (onBackPress) {
      onBackPress();
    } else if (router.canGoBack()) {
      router.back();
    }
  };

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: themeColors.background }]}>
      <View style={[styles.container, { borderBottomColor: themeColors.lightGrey }]}>
        {canGoBack && (
          <TouchableOpacity onPress={handleBack} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color={themeColors.primary} />
          </TouchableOpacity>
        )}
        <View style={styles.titleContainer}>
          <Text style={[styles.title, { color: themeColors.text }]} numberOfLines={1}>
            {title}
          </Text>
        </View>
        <View style={styles.rightActionContainer}>
          {rightAction ? rightAction : <View style={styles.placeholder} /> /* Mantém o título centralizado */}
        </View>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    // A cor de fundo é definida dinamicamente
  },
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    height: Platform.OS === 'ios' ? 44 : 56, // Altura padrão de header
    paddingHorizontal: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  backButton: {
    padding: 8,
    marginRight: 5,
  },
  titleContainer: {
    flex: 1,
    alignItems: 'center', // Centraliza o título se não houver rightAction
    justifyContent: 'center',
  },
  title: {
    fontSize: 17,
    fontWeight: '600',
  },
  rightActionContainer: {
    minWidth: 40, // Mesmo tamanho do backButton para balancear
    alignItems: 'flex-end',
  },
  placeholder: { // Para ocupar espaço se não houver rightAction
    width: 40, // Ajuste conforme o tamanho do backButton
  }
});

export default CustomHeader;

// Para usar este header em uma tela com Expo Router, você faria:
// Em app/alguma-tela.tsx ou _layout.tsx:
// <Stack.Screen options={{ header: (props) => <CustomHeader title={props.options.title || "Título Padrão"} canGoBack={props.navigation.canGoBack()} /> }} />
// Ou, se quiser esconder o header padrão e colocar o seu dentro da tela:
// <Stack.Screen options={{ headerShown: false }} />
// <View>
//   <CustomHeader title="Meu Título" />
//   {/* Conteúdo da tela */}
// </View>