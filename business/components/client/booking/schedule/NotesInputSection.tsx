import React from 'react';
import { View, Text, TextInput, StyleSheet, Animated } from 'react-native';
import { AppColors } from '../../../../../constants/appStyles'; // Importe AppColors

interface NotesInputSectionProps {
  notes: string;
  setNotes: (text: string) => void;
  compactMode?: boolean; // ✅ NOVO: Suporte para modo compacto (reduz padding, altura e margens)
  showTitle?: boolean; // ✅ NOVO: Opcional para esconder o título em integrações (ex: card unificado)
  // fadeAnim: Animated.Value; // Removido, pois o ScrollView pai já aplica
  // slideUpAnim: Animated.Value; // Removido, pois o ScrollView pai já aplica
}

const NotesInputSection: React.FC<NotesInputSectionProps> = ({ 
  notes, 
  setNotes, 
  compactMode = false, 
  showTitle = true 
}) => { // ✅ NOVO: Props default para compactMode e showTitle
  // ✅ NOVO: Estilos dinâmicos baseados em compactMode
  const inputStyle = compactMode 
    ? [styles.notesInput, styles.compactNotesInput] 
    : styles.notesInput;

  const containerStyle = compactMode 
    ? [styles.notesContainer, styles.compactNotesContainer] 
    : styles.notesContainer;

  const titleStyle = compactMode 
    ? [styles.notesTitle, styles.compactNotesTitle] 
    : styles.notesTitle;

  return (
    // O Animated.View aqui é mantido caso haja intenção de animações internas futuras,
    // mas as props fadeAnim e slideUpAnim são controladas pelo componente pai.
    <View style={containerStyle}>
      {showTitle && ( // ✅ NOVO: Renderiza título apenas se showTitle for true
        <Text style={titleStyle}>Observações (Opcional)</Text>
      )}
      <TextInput
        style={inputStyle}
        placeholder="Ex: 'Procurar por Maria na portaria', 'O apartamento é o 101, cor amarela'."
        value={notes}
        onChangeText={setNotes}
        multiline
        numberOfLines={compactMode ? 2 : 4} // ✅ NOVO: Menos linhas em modo compacto
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
  // ✅ NOVO: Estilo compacto para container (menos margens)
  compactNotesContainer: {
    marginHorizontal: 0, // Sem margens laterais em compacto (integrado no card)
    marginTop: 0,
    marginBottom: 0,
  },
  notesTitle: {
    fontSize: 15,
    fontWeight: 'bold',
    fontFamily: 'Montserrat-Regular',
    color: AppColors.textBody, // Usando AppColors
    marginBottom: 10,
  },
  // ✅ NOVO: Título compacto (menor fonte e margem)
  compactNotesTitle: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 6,
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
  // ✅ NOVO: Input compacto (menos padding e altura mínima)
  compactNotesInput: {
    padding: 10, // Padding reduzido
    borderRadius: 8, // Raio menor para compacto
    minHeight: 60, // Altura mínima reduzida
    fontSize: 13, // Fonte ligeiramente menor
  },
});

export default NotesInputSection;