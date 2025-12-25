// constants/styles.ts
import { StyleSheet } from 'react-native';
import Colors from '../constants/Colors'; // Importação padrão corrigida e caminho ajustado

// Como commonStyles é um StyleSheet.create estático, ele não pode usar hooks como useColorScheme.
// Portanto, ele deve referenciar as cores de um tema específico (geralmente o light como padrão)
// ou ser uma função que recebe o tema como argumento se precisar ser dinâmico.
const themeColors = Colors.light; // Usando o tema light como padrão para estilos estáticos

export const commonStyles = StyleSheet.create({
  backdrop: { position: 'absolute', top: 0, bottom: 0, left: 0, right: 0, backgroundColor: 'rgba(0,0,0,0.35)' },
  sheet: { 
    position: 'absolute', 
    left: 0, 
    right: 0, 
    bottom: 0, 
    backgroundColor: themeColors.background, // Usando themeColors.background
    borderTopLeftRadius: 16, 
    borderTopRightRadius: 16, 
    padding: 12 
  },
  handle: { alignSelf: 'center', width: 44, height: 4, backgroundColor: '#E5E7EB', borderRadius: 999, marginBottom: 8 },
  sheetTitle: { fontSize: 16, fontWeight: '800', color: themeColors.textPrimary, paddingHorizontal: 8, marginBottom: 8 }, // Usando themeColors.textPrimary
  toastWrap: { position: 'absolute', top: 14, left: 12, right: 12 },
  toast: { 
    backgroundColor: themeColors.background, // Usando themeColors.background
    borderRadius: 12, 
    padding: 14, 
    borderWidth: 1, 
    borderColor: themeColors.border, // Usando themeColors.border
    shadowColor: themeColors.shadowColorSection, // Usando themeColors.shadowColorSection
    shadowOpacity: 0.08, 
    shadowRadius: 8, 
    shadowOffset: { width: 0, height: 4 }, 
    elevation: 0, 
    flexDirection: 'row', 
    alignItems: 'center', 
    gap: 10, 
    borderLeftWidth: 4 
  },
  toastTitle: { fontWeight: '800', color: themeColors.textPrimary }, // Usando themeColors.textPrimary
  toastSub: { color: themeColors.textMuted, marginTop: 2 } // Usando themeColors.textMuted
});