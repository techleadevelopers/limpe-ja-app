// LimpeJaApp/components/CategoriaCard.tsx
import React, { useRef } from 'react';
import { Text, TouchableOpacity, StyleSheet, Platform, Animated, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur'; // 👈 Importar BlurView

// Tipo para a Categoria
export type Categoria = {
  id: string;
  nome: string;
  icone: keyof typeof MaterialCommunityIcons.glyphMap;
  // corFundo não é mais usada diretamente se a cor é fixa ou sobreposta ao blur
  // Mas pode manter no tipo se usar para outros fins ou se quiser flexibilidade futura
  corFundo?: string; // Tornando opcional, já que a cor principal será o CARD_TINT_COLOR
};

interface CategoriaCardProps {
  item: Categoria;
  onPress: (item: Categoria) => void;
}

// Cor com opacidade para aplicar SOBRE o efeito de blur.
// Ajuste a opacidade (o último valor, 0.65) para o efeito desejado.
// Mais baixo = mais transparente e mais do blur/fundo visível.
// Mais alto = mais da cor e menos do blur/fundo visível.
const CARD_TINT_COLOR = 'rgba(93, 137, 230, 0.65)'; // Cor base do HeroHeader, com opacidade ajustada para o blur

const CategoriaCard: React.FC<CategoriaCardProps> = ({ item, onPress }) => {
  const cardScaleAnim = useRef(new Animated.Value(1)).current;

  const onPressInCard = () => {
    Animated.spring(cardScaleAnim, {
      toValue: 0.95,
      useNativeDriver: true,
    }).start();
  };

  const onPressOutCard = () => {
    Animated.spring(cardScaleAnim, {
      toValue: 1,
      friction: 3,
      tension: 40,
      useNativeDriver: true,
    }).start();
  };

  return (
    // O Animated.View agora também é o container externo para o borderRadius e overflow
    <Animated.View style={[styles.cardOuterContainer, { transform: [{ scale: cardScaleAnim }] }]}>
      <TouchableOpacity
        style={styles.touchableSurface} // Touchable cobre toda a área
        onPress={() => onPress(item)}
        onPressIn={onPressInCard}
        onPressOut={onPressOutCard}
        activeOpacity={0.9} // Uma leve opacidade ao pressionar, além da escala
      >
        <BlurView
          intensity={Platform.OS === 'ios' ? 60 : 90} // Ajuste a intensidade do blur
          tint={Platform.OS === 'ios' ? 'light' : 'light'} // 'light', 'dark', 'default'. 'light' costuma dar um bom efeito.
                                               // Teste 'default' no Android também.
          style={styles.blurViewStyle} // Ocupa todo o espaço do TouchableOpacity
        >
          {/* Esta View aplica a cor de "tinta" sobre o blur */}
          <View style={styles.contentOverlay}>
            <MaterialCommunityIcons name={item.icone} size={32} color="#FFFFFF" style={styles.categoriaIcone} />
            <Text style={styles.categoriaTexto}>{item.nome}</Text>
          </View>
        </BlurView>
      </TouchableOpacity>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  cardOuterContainer: {
    width: 95,
    height: 95,
    borderRadius: 16,
    overflow: 'hidden', // ESSENCIAL para o BlurView respeitar o borderRadius
    marginRight: 12,
    marginBottom: 8,
    // Sombra aplicada ao container externo
    shadowColor: 'rgba(0, 30, 60, 0.2)', // Sombra um pouco mais pronunciada
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 1,
    shadowRadius: 10,
    elevation: 8, // Elevação ligeiramente aumentada
  },
  touchableSurface: {
    width: '100%',
    height: '100%',
  },
  blurViewStyle: {
    flex: 1, // Garante que o BlurView preencha o TouchableOpacity
  },
  contentOverlay: { // Esta View fica por cima do BlurView
    flex: 1,
    backgroundColor: CARD_TINT_COLOR, // Cor com opacidade
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingVertical: 15, // Mantido
    paddingHorizontal: 10, // Mantido
  },
  categoriaIcone: {
    marginBottom: 6,
  },
  categoriaTexto: {
    fontSize: 12,
    color: '#FFFFFF',
    fontWeight: '500',
    textAlign: 'center',
    // fontFamily: 'Poppins-Medium',
  },
});

export default CategoriaCard;