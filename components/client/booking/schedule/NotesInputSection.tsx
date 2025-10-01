import React from 'react';
import { View, Text, TextInput, StyleSheet, Animated } from 'react-native';
import { AppColors } from '../../../../constants/appStyles'; // Importe AppColors

interface NotesInputSectionProps {
  notes: string;
  setNotes: (text: string) => void;
  // fadeAnim: Animated.Value; // Removido, pois o ScrollView pai já aplica
  // slideUpAnim: Animated.Value; // Removido, pois o ScrollView pai já aplica
}

const NotesInputSection: React.FC<NotesInputSectionProps> = ({ notes, setNotes }) => { // Removido fadeAnim e slideUpAnim dos props
  return (
    // O Animated.View aqui é mantido caso haja intenção de animações internas futuras,
    // mas as props fadeAnim e slideUpAnim são controladas pelo componente pai.
    <View style={styles.notesContainer}>
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
    </View>
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
    fontFamily: 'Montserrat-Regular',
    color: AppColors.textBody, // Usando AppColors
    marginBottom: 10,
  },
  notesInput: {
    backgroundColor: AppColors.white, // Usando AppColors
    padding: 15,
    borderRadius: 12, // ✅ PRESERVADO: Borda 12 para coerência premium
    borderWidth: 1,
    borderColor: AppColors.borderNeutral, // Usando AppColors
    minHeight: 100,
    textAlignVertical: 'top',
    fontSize: 14, // ✅ PRESERVADO: Fonte 14 para conforto
    fontFamily: 'Montserrat-Regular',
    color: AppColors.textBody, // Usando AppColors
  },
});

export default NotesInputSection;