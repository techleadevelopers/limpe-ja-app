// app/(provider)/schedule/components/SaveChangesButton.tsx
import React, { useRef } from 'react';
import { Animated, StyleSheet, Text, TouchableOpacity, ActivityIndicator, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface SaveChangesButtonProps {
  isSaving: boolean;
  saveSuccess: boolean;
  hasValidationErrors: boolean;
  onPress: () => void;
  animation: Animated.Value;
}

const SaveChangesButton: React.FC<SaveChangesButtonProps> = ({ isSaving, saveSuccess, hasValidationErrors, onPress, animation }) => {
  const saveButtonScaleAnim = useRef(new Animated.Value(1)).current;

  const onPressInButton = () => { Animated.spring(saveButtonScaleAnim, { toValue: 0.96, useNativeDriver: true }).start(); };
  const onPressOutButton = () => { Animated.spring(saveButtonScaleAnim, { toValue: 1, friction: 3, tension: 40, useNativeDriver: true }).start(); };

  return (
    <Animated.View style={[styles.saveButtonContainer, { opacity: animation, transform: [{ translateY: animation.interpolate({ inputRange: [0, 1], outputRange: [20, 0] }) }] }]}>
      <TouchableOpacity
        style={[
          styles.saveButton,
          isSaving && styles.saveButtonDisabled,
          hasValidationErrors && styles.saveButtonDisabled, // Desabilita também se houver erros de validação
          { transform: [{ scale: saveButtonScaleAnim }] }
        ]}
        onPress={onPress}
        onPressIn={onPressInButton}
        onPressOut={onPressOutButton}
        disabled={isSaving || hasValidationErrors}
      >
        {isSaving ? (
          <ActivityIndicator color="#fff" />
        ) : saveSuccess ? (
          <Ionicons name="checkmark-circle-outline" size={24} color="#FFFFFF" />
        ) : (
          <Text style={styles.saveButtonText}>Salvar Alterações</Text>
        )}
      </TouchableOpacity>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  saveButtonContainer: {
    marginTop: 20,
    marginBottom: 10,
  },
  saveButton: {
    backgroundColor: '#28A745', // Verde para salvar
    paddingVertical: 15,
    borderRadius: 8,
    alignItems: 'center',
    ...Platform.select({
      ios: { shadowColor: 'rgba(0,0,0,0.1)', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 6 },
      android: { elevation: 6 },
    }),
  },
  saveButtonDisabled: {
    backgroundColor: '#A5D6A7', // Verde mais claro para desabilitado
    ...Platform.select({
      ios: { shadowOpacity: 0 },
      android: { elevation: 0 },
    }),
  },
  saveButtonText: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: 'bold',
  },
});

export default SaveChangesButton;