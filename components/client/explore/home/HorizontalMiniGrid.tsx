// LimpeJaApp/components/client/explore/home/HorizontalMiniGrid.tsx
import React from "react";
import {
  Animated,
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  View,
  Image,
  ImageSourcePropType,
  Platform, // Importar Platform para estilos específicos de OS
} from "react-native";
import { useRouter } from "expo-router";
import * as Haptics from "expo-haptics";
import { LinearGradient } from 'expo-linear-gradient'; // Importar LinearGradient

// Ícones 3D já existentes e adicionados os novos para completar as opções do menu
const Icons3D = {
  ticket: require("../../../../assets/images/3d/ticket.png"),
  cashback: require("../../../../assets/images/3d/cashback.png"),
  missions: require("../../../../assets/images/3d/step1-card-profile.png"),
  referral: require("../../../../assets/images/3d/gift2.png"),
  // Novos ícones injetados das opções que faltavam
  champions2: require("../../../../assets/images/3d/champions2.png"),
  metrics: require("../../../../assets/images/3d/uptrend.png"),
  bookService: require("../../../../assets/images/3d/button.png"),
  support: require("../../../../assets/images/3d/support.png"),
  safety: require("../../../../assets/images/3d/security.png"),
  privacy: require("../../../../assets/images/3d/privacidade.png"), // Usado para 'ajustes'/'settings'
};

interface GridItem {
  key: string;
  title: string;
  icon: ImageSourcePropType;
  route: string;
}

const gridItems: GridItem[] = [
  { key: "coupons", title: "Cupons", icon: Icons3D.ticket, route: "/(client)/coupons" },
  { key: "cashback", title: "Cashback", icon: Icons3D.cashback, route: "/(client)/wallet/cashback" },
  { key: "missions", title: "Missões", icon: Icons3D.missions, route: "/(client)/missions" },
  { key: "referrals", title: "Ganhe", icon: Icons3D.referral, route: "/(client)/referrals" },
  // Opções injetadas do menu/index.tsx
  { key: "champions2", title: "Champions", icon: Icons3D.champions2, route: "/(client)/champions2" },
  { key: "metrics", title: "Métricas", icon: Icons3D.metrics, route: "/(client)/metrics" },
  { key: "bookService", title: "Agendar", icon: Icons3D.bookService, route: "/(client)/booking" },
  { key: "support", title: "Suporte", icon: Icons3D.support, route: "/(common)/support" },
  { key: "safety", title: "Segurança", icon: Icons3D.safety, route: "/(common)/safety" },
  { key: "settings", title: "Ajustes", icon: Icons3D.privacy, route: "/(client)/settings" },
];

export default function HorizontalMiniGrid() {
  const router = useRouter();

  const renderItem = ({ item }: { item: GridItem }) => {
    const scale = new Animated.Value(1);

    const handlePressIn = () => {
      Animated.spring(scale, {
        toValue: 0.92,
        useNativeDriver: true,
        speed: 40,
      }).start();
    };

    const handlePressOut = () => {
      Animated.spring(scale, {
        toValue: 1,
        friction: 3,
        useNativeDriver: true,
      }).start();
    };

    const handlePress = () => {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      router.push(item.route as any);
    };

    return (
      <Pressable
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        onPress={handlePress}
        style={{ marginRight: 10 }}
      >
        {/* INÍCIO DAS ALTERAÇÕES PARA BORDA GRADIENTE NEON */}
        <LinearGradient
          colors={['#ADD8E6', '#4169e17b', '#00008b7e']} // Azul claro, azul médio, azul escuro
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.gradientBorder}
        >
          <Animated.View style={[styles.cardInner, { transform: [{ scale }] }]}>
            <Image source={item.icon} style={styles.icon} resizeMode="contain" />
            <Text style={styles.cardTitle}>{item.title}</Text>
          </Animated.View>
        </LinearGradient>
        {/* FIM DAS ALTERAÇÕES PARA BORDA GRADIENTE NEON */}
      </Pressable>
    );
  };

  return (
    <View style={styles.container}>
      <FlatList
        data={gridItems}
        renderItem={renderItem}
        keyExtractor={(item) => item.key}
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 16 }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginTop: 12,
    marginBottom: 14,
    left: 0,
    paddingHorizontal: 10,
  },
  // O estilo 'card' original foi dividido em 'gradientBorder' e 'cardInner' para permitir a borda gradiente.
  gradientBorder: {
    width: 62, // 65 (card original) + 2*2 (borda de 2px)
    height: 62,
    borderRadius: 24, // 22 (card original) + 2 (borda de 2px)
    alignItems: "center",
    justifyContent: "center",
    // Sombras para simular o efeito neon/glow
    shadowColor: "#4169E1", // Cor base da sombra para o efeito neon
    shadowOffset: { width: 0, height: 0 }, // Sombra centralizada
    shadowOpacity: 0.8, // Opacidade alta para o brilho
    shadowRadius: 8, // Raio maior para um brilho mais difuso
    ...Platform.select({
      ios: {
        shadowColor: '#4169E1',
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.8,
        shadowRadius: 8,
      },
      android: {
        elevation: 12, // Ajustado para Android para um efeito similar de brilho
      },
    }),
  },
  cardInner: {
    width: 65,
    height: 65,
    borderRadius: 22,
    backgroundColor: "#FFFFFF", // Alterado de "#87b9ef69" para branco
    alignItems: "center",
    justifyContent: "center",
    // As sombras originais foram movidas para 'gradientBorder' para criar o efeito de borda neon.
  },
  icon: {
    width: 54,
    height: 44,
    left: 2,
  },
  cardTitle: {
    marginTop: -2,
    fontSize: 9.0,
    fontWeight: "500",
    textAlign: "center",
    color: "rgba(78, 78, 78, 1)",
  },
});