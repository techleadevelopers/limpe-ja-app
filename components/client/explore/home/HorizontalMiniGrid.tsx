import * as Haptics from "expo-haptics";
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from "expo-router";
import {
    Animated,
    FlatList,
    Image,
    ImageSourcePropType,
    Platform,
    Pressable,
    StyleSheet,
    Text,
    View,
} from "react-native";

// Ãcones 3D da versÃ£o antiga
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

// Itens da grade da versÃ£o antiga
const gridItems: GridItem[] = [
  { key: "coupons", title: "Cupons", icon: Icons3D.ticket, route: "/client/coupons" },
  { key: "cashback", title: "Cashback", icon: Icons3D.cashback, route: "/client/wallet/cashback" },
  { key: "missions", title: "Missões", icon: Icons3D.missions, route: "/client/missions" },
  { key: "referrals", title: "Ganhe", icon: Icons3D.referral, route: "/client/referrals" },
  { key: "ranking", title: "Pontos", icon: Icons3D.champions2, route: "/client/explore/ranking" },
  { key: "metrics", title: "Metricas", icon: Icons3D.metrics, route: "/client/metrics" },
  { key: "support", title: "Suporte", icon: Icons3D.support, route: "/common/support" },
  { key: "safety", title: "Segurança", icon: Icons3D.safety, route: "/client/explore/security" },
  { key: "settings", title: "Ajustes", icon: Icons3D.privacy, route: "/client/profile" },
];

export default function HorizontalMiniGrid() {
  const router = useRouter();

  const renderItem = ({ item }: { item: GridItem }) => {
    const scale = new Animated.Value(1);

    const handlePressIn = () => {
      Animated.spring(scale, {
        toValue: 0.92,
        useNativeDriver: true,
        friction: 3, // Ajuste para mais "mola"
        tension: 80, // Ajuste para um retorno mais rÃ¡pido
      }).start();
    };

    const handlePressOut = () => {
      Animated.spring(scale, {
        toValue: 1,
        friction: 3,
        tension: 80, // MantÃ©m a tensÃ£o para consistÃªncia
        useNativeDriver: true,
      }).start();
    };

    const handlePress = () => {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium); // Feedback tÃ¡til
      router.push(item.route as any);
    };

    return (
      <Pressable
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        onPress={handlePress}
        style={styles.cardContainer} // Usa o estilo do container da segunda versÃ£o
      >
        <Animated.View style={[styles.cardInner, { transform: [{ scale }] }]}>
          <LinearGradient
            colors={['rgba(230, 240, 255, 0)', 'rgba(196, 197, 205, 0)']}
            style={styles.gradientBackground}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            <Image source={item.icon} style={styles.icon} resizeMode="contain" />
          </LinearGradient>
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
    marginTop: 7,
    marginBottom: 2,
    paddingHorizontal: 5,
  },
  cardContainer: {
    alignItems: "center",
    marginRight: 20, // EspaÃ§amento entre os cards
    marginTop: 0,
  },
  cardInner: {
    width: 58, // Tamanho do fundo circular
    height: 48,
    borderRadius: 30, // Corrigido para cÃ­rculo perfeito (metade de 60)
    justifyContent: "center",
    alignItems: "center",
    overflow: 'hidden', // Garante que o gradiente nÃ£o vaze
    // Sombras premium: sutis e consistentes para iOS e Android (alinhado com Apple Store / Play Store)
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1, // Sombra mais suave para visual premium
        shadowRadius: 4, // Raio ligeiramente maior para suavidade
      },
      android: {
        elevation: 0, // ElevaÃ§Ã£o moderada para profundidade sem exageros
      },
    }),
  },
  gradientBackground: {
    flex: 1,
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 30, // Herda o borderRadius para o gradiente
  },
  icon: {
    width: 35, // Tamanho do Ã­cone
    height: 35,
    resizeMode: 'contain',
  },
  cardTitle: {
    marginTop: -2,
    fontSize: 11,
    fontWeight: "400",
    textAlign: "center",
    color: "#666",
  },
});
