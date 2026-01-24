// src/components/Header.tsx
import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ViewStyle } from 'react-native';
import { MaterialIcons as Icon } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { colors } from './theme/colors';
import { typography } from './theme/typography';

interface HeaderProps {
  title: string;
  showBackButton?: boolean;
  rightComponent?: React.ReactNode;
  style?: ViewStyle;
}

const Header: React.FC<HeaderProps> = ({ title, showBackButton = true, rightComponent, style }) => {
  const navigation = useNavigation();

  return (
    <View style={[styles.headerContainer, style]}>
      {showBackButton && (
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Icon name="arrow-back-ios" size={24} color={colors.textPrimary} />
        </TouchableOpacity>
      )}
      <Text style={styles.headerTitle}>{title}</Text>
      <View style={styles.rightComponentContainer}>
        {rightComponent}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  headerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
    paddingVertical: 15,
    backgroundColor: colors.cardBackground, // Ou colors.background
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  backButton: {
    position: 'absolute',
    left: 20,
    padding: 5,
  },
  headerTitle: {
    ...typography.h3,
    textAlign: 'center',
    flex: 1, // Permite que o título ocupe o espaço central
  },
  rightComponentContainer: {
    position: 'absolute',
    right: 20,
  },
});

export default Header;
