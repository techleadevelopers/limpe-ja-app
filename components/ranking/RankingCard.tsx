import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity, Animated, Easing, useColorScheme, StyleProp, ViewStyle, TextStyle, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Colors from '../../constants/Colors'; // Adjust path based on your project structure

// Hook para acessar as cores do tema atual
function useTheme() {
  const scheme = useColorScheme?.() || 'light';
  const theme = (Colors as any)[scheme] || (Colors as any).light;
  return theme as typeof Colors.light;
}

interface RankingCardProps {
  rank: number;
  name: string;
  score: number;
  avatarUrl?: string | null;
  isCurrentUser?: boolean; // Para destacar o card do usuário logado
  onPress?: () => void; // Opcional, para permitir interatividade
  delay?: number; // Novo prop para atraso na animação de entrada
  style?: StyleProp<ViewStyle>; // <--- A propriedade 'style' agora é aceita aqui
}

const RankingCard: React.FC<RankingCardProps> = ({
  rank,
  name,
  score,
  avatarUrl,
  isCurrentUser = false,
  onPress,
  delay = 0,
  style, // <--- Recebendo a propriedade 'style'
}) => {
  const theme = useTheme(); // Obtém o tema atual

  // Animações de entrada para o card
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(20)).current;
  const scaleInAnim = useRef(new Animated.Value(0.95)).current;

  // Animação de feedback ao pressionar o card
  const pressScaleAnim = useRef(new Animated.Value(1)).current;

  // Animação para o badge do usuário atual
  const badgePulseAnim = useRef(new Animated.Value(1)).current;

  // Array de URLs de imagens de placeholder
  const placeholderImages = useRef([
    'https://randomuser.me/api/portraits/men/1.jpg',
    'https://randomuser.me/api/portraits/women/2.jpg',
    'https://randomuser.me/api/portraits/men/3.jpg',
    'https://randomuser.me/api/portraits/women/4.jpg',
    'https://randomuser.me/api/portraits/men/5.jpg',
    'https://randomuser.me/api/portraits/women/6.jpg',
    'https://randomuser.me/api/portraits/men/7.jpg',
    'https://randomuser.me/api/portraits/women/8.jpg',
    'https://randomuser.me/api/portraits/men/9.jpg',
    'https://randomuser.me/api/portraits/women/10.jpg',
  ]).current;

  useEffect(() => {
    // Animação de entrada
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 500,
        delay: delay,
        easing: Easing.out(Easing.ease),
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 500,
        delay: delay,
        easing: Easing.out(Easing.ease),
        useNativeDriver: true,
      }),
      Animated.timing(scaleInAnim, {
        toValue: 1,
        duration: 500,
        delay: delay,
        easing: Easing.out(Easing.ease),
        useNativeDriver: true,
      }),
    ]).start();

    // Animação de pulso para o badge do usuário atual
    if (isCurrentUser) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(badgePulseAnim, {
            toValue: 1.1,
            duration: 800,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
          Animated.timing(badgePulseAnim, {
            toValue: 1,
            duration: 800,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
        ])
      ).start();
    }
  }, [fadeAnim, slideAnim, scaleInAnim, delay, isCurrentUser, badgePulseAnim]);

  const onPressInCard = () => {
    Animated.spring(pressScaleAnim, {
      toValue: 0.97,
      useNativeDriver: true,
    }).start();
  };

  const onPressOutCard = () => {
    Animated.spring(pressScaleAnim, {
      toValue: 1,
      friction: 3,
      tension: 40,
      useNativeDriver: true,
    }).start();
  };

  // Estilos dinâmicos baseados no tema e no estado do usuário
  const dynamicStyles = StyleSheet.create({
    defaultCard: {
      borderLeftColor: '#3376f2af', // Borda azul para cards normais
    },
    currentUserCard: {
      borderLeftColor: '#c933f2af', // Borda roxa para o card do usuário atual
    },
    rankText: {
      color: theme.textBody,
    },
    avatarPlaceholder: {
      backgroundColor: '#c933f2af', // Fundo do placeholder do avatar (roxo)
      borderColor: '#3633f2af', // Borda do placeholder do avatar (azul-roxo)
    },
    nameText: {
      color: theme.textBody,
    },
    scoreIcon: {
      color: '#c933f2af', // Cor do ícone de troféu (roxo)
    },
    scoreText: {
      color: theme.textMuted,
    },
    currentUserBadge: {
      backgroundColor: theme.link, // Cor do badge do usuário atual
      borderColor: '#c933f2af', // Borda do badge (roxo)
    },
  });

  const cardStyle = [
    styles.baseCard, // Aplica os estilos base (margens, etc.)
    isCurrentUser ? dynamicStyles.currentUserCard : dynamicStyles.defaultCard, // Aplica estilos específicos de usuário (como borderLeftColor)
    style, // <--- Aplica o estilo passado via prop AQUI. Isso sobrescreverá backgroundColor, borderRadius, e shadow.
    {
      opacity: fadeAnim,
      transform: [
        { translateY: slideAnim },
        { scale: Animated.multiply(scaleInAnim, pressScaleAnim) }, // Combina animação de entrada com feedback de pressão
      ],
    },
  ];

  // Lógica para selecionar a imagem de placeholder
  const selectedPlaceholder = placeholderImages[rank % placeholderImages.length];

  return (
    <Animated.View style={cardStyle}>
      <TouchableOpacity onPress={onPress} disabled={!onPress} onPressIn={onPressInCard} onPressOut={onPressOutCard} activeOpacity={1}>
        <View style={styles.contentWrapper}>
          <View style={styles.rankContainer}>
            <Text style={[styles.rankText, dynamicStyles.rankText]}>{rank}°</Text>
          </View>
          <View style={[styles.avatarContainer, { borderColor: isCurrentUser ? '#FFF' : dynamicStyles.avatarPlaceholder.borderColor }]}>
            {avatarUrl ? (
              <Image source={{ uri: avatarUrl }} style={styles.avatarImage} />
            ) : (
              <Image
                source={{ uri: selectedPlaceholder }}
                style={[styles.avatarImage, dynamicStyles.avatarPlaceholder]}
                onError={() => {}}
              />
            )}
          </View>
          <View style={styles.infoContainer}>
            <Text style={[styles.nameText, dynamicStyles.nameText]} numberOfLines={1}>{name}</Text>
            <View style={styles.scoreContainer}>
              <Ionicons name="trophy" size={16} color={dynamicStyles.scoreIcon.color} />
              <Text style={[styles.scoreText, dynamicStyles.scoreText]}>{score} Pts</Text>
            </View>
          </View>
          {isCurrentUser && (
            <Animated.View style={[styles.currentUserBadge, dynamicStyles.currentUserBadge, { transform: [{ scale: badgePulseAnim }] }]}>
              <Ionicons name="star" size={18} color="#FFFFFF" />
            </Animated.View>
          )}
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  // Base para o card, sem propriedades que o glassmorphismCard irá sobrescrever
  baseCard: {
    marginVertical: 6,
    marginHorizontal: 16,
    // borderRadius, shadow, backgroundColor serão definidos pelo 'style' prop
  },
  contentWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  defaultCard: {
    borderLeftWidth: 4,
  },
  currentUserCard: {
    borderLeftWidth: 4,
    // As propriedades de sombra foram removidas daqui para serem controladas pelo glassmorphismCard
    // Se precisar de uma sombra *adicional* apenas para o usuário atual, adicione-a no index.tsx
  },
  rankContainer: {
    width: 40,
    alignItems: 'center',
    marginRight: 10,
  },
  rankText: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  avatarContainer: {
    width: 50,
    height: 50,
    borderRadius: 25,
    overflow: 'hidden',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
    borderWidth: 2,
  },
  avatarImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  avatarPlaceholder: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  infoContainer: {
    flex: 1,
  },
  nameText: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  scoreContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  scoreText: {
    fontSize: 14,
    marginLeft: 5,
    fontWeight: 'bold',
  },
  currentUserBadge: {
    position: 'absolute',
    top: -5,
    right: -5,
    borderRadius: 15,
    padding: 5,
    borderWidth: 2,
  },
});

export default RankingCard;
