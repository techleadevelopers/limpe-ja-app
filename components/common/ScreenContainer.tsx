// src/components/ScreenContainer.tsx
import React from 'react';
import { View, StyleSheet, StatusBar, ScrollView, ViewStyle, Platform } from 'react-native'; // Adicionado Platform
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors } from './theme/colors';

interface ScreenContainerProps {
  children: React.ReactNode;
  scrollable?: boolean;
  style?: ViewStyle;
  statusBarColor?: string; // Permite customizar a cor da StatusBar
  statusBarStyle?: 'dark-content' | 'light-content'; // Permite customizar o estilo da StatusBar
  contentContainerStyle?: ViewStyle; // Permite customizar o estilo do conteúdo (ScrollView ou View)
}

const ScreenContainer: React.FC<ScreenContainerProps> = ({
  children,
  scrollable = true,
  style,
  statusBarColor = colors.background, // Padrão para a cor de fundo
  statusBarStyle = 'dark-content', // Padrão para dark-content
  contentContainerStyle,
}) => {
  const insets = useSafeAreaInsets();

  const content = scrollable ? (
    <ScrollView
      contentContainerStyle={[styles.scrollViewContent, contentContainerStyle]}
      keyboardShouldPersistTaps="handled"
      showsVerticalScrollIndicator={false}
      // Adiciona um bounce suave para iOS, típico de apps premium
      bounces={Platform.OS === 'ios'}
    >
      {children}
    </ScrollView>
  ) : (
    <View style={[styles.nonScrollableContent, contentContainerStyle]}>{children}</View>
  );

  return (
    <View style={[styles.container, { paddingTop: insets.top, paddingBottom: insets.bottom }, style]}>
      <StatusBar
        barStyle={statusBarStyle}
        backgroundColor={statusBarColor}
        translucent={true} // Torna a StatusBar transparente para que o conteúdo possa ir atrás dela
      />
      {content}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background, // Fundo principal da tela
  },
  scrollViewContent: {
    flexGrow: 1, // Garante que o conteúdo preencha a tela e permita rolagem
    paddingHorizontal: 20, // Padding lateral padrão para um visual limpo
    paddingVertical: 20, // Padding vertical padrão
  },
  nonScrollableContent: {
    flex: 1,
    paddingHorizontal: 20,
    paddingVertical: 20,
  },
});

export default ScreenContainer;