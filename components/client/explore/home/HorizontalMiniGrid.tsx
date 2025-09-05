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
  Platform,
} from "react-native";
import { useRouter } from "expo-router";
import * as Haptics from "expo-haptics";

// Ícones 3D da versão antiga
const Icons3D = {
  ticket: require("../../../../assets/images/3d/ticket.png"),
  cashback: require("../../../../assets/images/3d/cashback.png"),
  missions: require("../../../../assets/images/3d/step1-card-profile.png"),
  referral: require("../../../../assets/images/3d/gift2.png"),
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

// Itens da grade da versão antiga
const gridItems: GridItem[] = [
  { key: "coupons", title: "Cupons", icon: Icons3D.ticket, route: "/(client)/coupons" },
  { key: "cashback", title: "Cashback", icon: Icons3D.cashback, route: "/(client)/wallet/cashback" },
  { key: "missions", title: "Missões", icon: Icons3D.missions, route: "/(client)/missions" },
  { key: "referrals", title: "Ganhe", icon: Icons3D.referral, route: "/(client)/referrals" },
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
        style={styles.cardContainer} // Usa o estilo do container da segunda versão
      >
        <Animated.View style={[styles.cardInner, { transform: [{ scale }] }]}>
            <Image source={item.icon} style={styles.icon} resizeMode="contain" />
        </Animated.View>
        <Text style={styles.cardTitle}>{item.title}</Text>
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
    marginTop: 10,
    marginBottom: 10,
  },
  cardContainer: {
    alignItems: "center",
    marginRight: 20, // Espaçamento entre os cards
  },
  cardInner: {
    width: 60, // Tamanho do fundo circular
    height: 60,
    borderRadius: 30, // Metade da largura/altura para um círculo perfeito
    backgroundColor: '#F0F0F0', // Cor de fundo clara para o círculo
    justifyContent: "center",
    alignItems: "center",
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  icon: {
    width: 35, // Tamanho do ícone
    height: 35,
    resizeMode: 'contain',
  },
  cardTitle: {
    marginTop: 8,
    fontSize: 12,
    fontWeight: "500",
    textAlign: "center",
    color: "#666",
  },
});