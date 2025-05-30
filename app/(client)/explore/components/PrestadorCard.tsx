// LimpeJaApp/components/PrestadorCard.tsx
import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useRef } from 'react';
import { Animated, Dimensions, Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

// Importa o tipo Prestador do arquivo SecaoPrestadores
import { Prestador } from './SecaoPrestadores';

const SCREEN_WIDTH = Dimensions.get('window').width;

interface PrestadorCardProps {
  item: Prestador;
  onPress: (prestadorId: string) => void;
  // 'delay' removido, pois a animação individual não é ideal para scroll horizontal
}

const PrestadorCard: React.FC<PrestadorCardProps> = ({ item, onPress }) => {
  const scaleAnim = useRef(new Animated.Value(1)).current;
  // Animação de entrada (mantida para um fade-in geral, mas sem delay por item)
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(20)).current; // Ainda pode ser útil para um efeito sutil

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 400,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 400,
        useNativeDriver: true,
      }),
    ]).start();
  }, [fadeAnim, slideAnim]);


  const onPressInCard = () => {
    Animated.spring(scaleAnim, { toValue: 0.97, useNativeDriver: true }).start();
  };

  const onPressOutCard = () => {
    Animated.spring(scaleAnim, { toValue: 1, friction: 4, tension: 50, useNativeDriver: true }).start();
  };

  const renderStars = (rating: number) => {
    const stars = [];
    for (let i = 1; i <= 5; i++) {
      stars.push(
        <Ionicons
          key={i}
          name={i <= rating ? 'star' : 'star-outline'}
          size={14}
          color="#007BFF" // Estrelas azuis
          style={styles.starIcon}
        />
      );
    }
    return <View style={styles.starContainer}>{stars}</View>;
  };

  return (
    <Animated.View style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}>
      <TouchableOpacity
        style={[styles.cardContainer, { transform: [{ scale: scaleAnim }] }]}
        onPress={() => onPress(item.id)}
        onPressIn={onPressInCard}
        onPressOut={onPressOutCard}
        activeOpacity={0.95}
      >
        {/* Imagem Principal */}
        <View style={styles.imageWrapper}>
          <Image source={{ uri: item.imagemUrl }} style={styles.cardImage} />
          {item.distancia && (
            <View style={styles.distanceTag}>
              <Ionicons name="location-outline" size={14} color="#FFF" />
              <Text style={styles.distanceText}>{item.distancia}</Text>
            </View>
          )}
          {/* Ícone de Favoritar */}
          <TouchableOpacity style={styles.favoriteIconContainer}>
            <Ionicons
              name={"heart-outline"}
              size={24}
              color={"#FFF"}
            />
          </TouchableOpacity>
        </View>

        {/* Container de Detalhes Abaixo da Imagem */}
        <View style={styles.detailsContainer}>
          {/* Linha de Avaliação */}
          <View style={styles.ratingRow}>
            {renderStars(item.avaliacao)}
            <Text style={styles.reviewsText}>({item.numeroAvaliacoes} Avaliações)</Text> {/* Traduzido */}
          </View>
          
          {/* Título Principal (nome do prestador) */}
          <Text style={styles.cardTitle} numberOfLines={1}>{item.nome}</Text> 

          {/* Especialidade (abaixo do nome, essencial) */}
          <View style={styles.specialtyRow}>
            <Ionicons name="briefcase-outline" size={16} color="#B0B0B0" /> {/* Ícone mais claro para tema escuro */}
            <Text style={styles.specialtyText} numberOfLines={1}>{item.especialidade}</Text>
          </View>

          {/* Seção de Verificado e Preço */}
          <View style={styles.verificationPriceRow}>
            {item.isVerificado && (
              <View style={styles.verifiedBadge}>
                <Ionicons name="shield-checkmark" size={14} color="#FFF" />
                <Text style={styles.verifiedBadgeText}>Verificado</Text> {/* Traduzido */}
              </View>
            )}
            <Text style={styles.priceText}>{item.precoHora}</Text>
          </View>
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  cardContainer: {
    width: 280,
    backgroundColor: '#FFFFFF', // ALTERADO: Fundo branco para o card (revertido para o original)
    borderRadius: 15,
    marginRight: 15,
    marginBottom: 15, // Margem inferior mantida para espaçamento
    overflow: 'hidden',
    shadowColor: '#000000', // Sombra preta
    shadowOffset: { width: 0, height: 4 }, // Sombra um pouco mais sutil para light mode
    shadowOpacity: 0.10, // Opacidade da sombra reduzida para light mode
    shadowRadius: 6,   // Raio da sombra ajustado
    elevation: 5,       // Elevação ajustada para Android
  },
  imageWrapper: {
    width: '100%',
    height: 160,
    backgroundColor: '#E0E0E0', // Placeholder mais claro para imagem
    borderTopLeftRadius: 15,
    borderTopRightRadius: 15,
    overflow: 'hidden',
    position: 'relative',
  },
  cardImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  distanceTag: { // Mantido, pois é sobre a imagem e o contraste com a imagem é o principal
    position: 'absolute',
    top: 12,
    left: 12,
    backgroundColor: 'rgba(0, 0, 0, 0.5)', // Fundo escuro semitransparente para contraste na imagem
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
    flexDirection: 'row',
    alignItems: 'center',
  },
  distanceText: { // Mantido branco para contraste com a tag escura
    color: '#FFF',
    fontSize: 13,
    fontWeight: '600',
    marginLeft: 6,
  },
  favoriteIconContainer: { // Mantido, para contraste sobre a imagem
    position: 'absolute',
    top: 12,
    right: 12,
    padding: 6,
    backgroundColor: 'rgba(0, 0, 0, 0.3)', // Fundo sutil para o ícone sobre a imagem
    borderRadius: 50,
  },
  detailsContainer: {
    paddingVertical: 15,
    paddingHorizontal: 16,
    backgroundColor: '#FFFFFF', // Fundo branco para os detalhes (mantido conforme original)
    borderBottomLeftRadius: 15,
    borderBottomRightRadius: 15,
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 5,
  },
  starContainer: {
    flexDirection: 'row',
    marginRight: 5,
  },
  starIcon: { // Cor da estrela mantida como azul primário, fica bom em fundo branco
    marginRight: 2,
    color: "#007BFF",
  },
  reviewsText: {
    fontSize: 12,
    color: '#6C757D', // Cinza escuro para legibilidade em fundo branco
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1A202C', // Cor escura (quase preto) para o título
    marginBottom: 4,
  },
  specialtyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  // Ícone da maleta (briefcase) já era claro/cinza, agora pode ser um pouco mais escuro
  // Se o ícone é passado como prop, a cor é definida no Ionicons. Aqui é o estilo do texto ao lado.
  // No seu código, o ícone `briefcase-outline` tem cor '#B0B0B0'. Podemos mudar para:
  // <Ionicons name="briefcase-outline" size={16} color="#8A94A6" />
  specialtyText: {
    fontSize: 14,
    color: '#4A5568', // Cinza mais escuro para la especialidade
    marginLeft: 6,
    flexShrink: 1,
  },
  verificationPriceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0', // Linha divisória bem clara
  },
  verifiedBadge: { // Mantido, pois o badge azul com texto branco funciona bem em fundo claro
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#007BFF',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
  },
  verifiedBadgeText: { // Mantido
    color: '#FFF',
    fontSize: 12,
    fontWeight: '600',
    marginLeft: 5,
  },
  priceText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#007BFF', // Preço com a cor primária do app para destaque
  },
});
export default PrestadorCard;