import React from 'react';
import { View, Text, TextInput, StyleSheet, Animated } from 'react-native';
import { AppColors } from '../../../../constants/appStyles'; // Importe AppColors

interface NotesInputSectionProps {
  notes: string;
  setNotes: (text: string) => void;
  fadeAnim: Animated.Value;
  slideUpAnim: Animated.Value;
}

const NotesInputSection: React.FC<NotesInputSectionProps> = ({ notes, setNotes, fadeAnim, slideUpAnim }) => {
  return (
    <Animated.View style={[styles.notesContainer, { opacity: fadeAnim, transform: [{ translateY: slideUpAnim }] }]}>
      <Text style={styles.notesTitle}>Observações (Opcional)</Text>
      <TextInput
        style={styles.notesInput}
        placeholder="Ex: 'Procurar por Maria na portaria', 'O apartamento é o 101, cor amarela'."
        value={notes}
        onChangeText={setNotes}
        multiline
        numberOfLines={4}
        placeholderTextColor={AppColors.mediumGray} // Usando AppColors
      />
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  notesContainer: {
    marginHorizontal: 15,
    marginTop: 20,
    marginBottom: 10,
  },
  notesTitle: {
    fontSize: 15,
    fontWeight: 'bold',
    color: AppColors.textBody, // Usando AppColors
    marginBottom: 10,
  },
  notesInput: {
    backgroundColor: AppColors.white, // Usando AppColors
    padding: 15,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: AppColors.borderNeutral, // Usando AppColors
    minHeight: 100,
    textAlignVertical: 'top',
    fontSize: 14,
    color: AppColors.textBody, // Usando AppColors
  },
});

export default NotesInputSection;