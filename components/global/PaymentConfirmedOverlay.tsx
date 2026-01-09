import { Ionicons } from "@expo/vector-icons";
import { useEffect, useRef } from "react";
import { Animated, StyleSheet, Text, ViewStyle } from "react-native";

export default function PaymentConfirmedOverlay({ visible }: { visible: boolean }) {
  const opacity = useRef(new Animated.Value(0)).current;
  const scale = useRef(new Animated.Value(0.85)).current;

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.timing(opacity, { toValue: 1, duration: 250, useNativeDriver: true }),
        Animated.spring(scale, { toValue: 1, friction: 6, useNativeDriver: true }),
      ]).start();
    } else {
      Animated.timing(opacity, { toValue: 0, duration: 200, useNativeDriver: true }).start();
    }
  }, [visible]);

  if (!visible) return null;

  return (
    <Animated.View style={[styles.toastWrapper, { opacity }]} pointerEvents="none">
      <Animated.View style={[styles.card, { transform: [{ scale }] }]}>
        <Ionicons name="checkmark-circle" size={44} color="#4ADE80" style={styles.icon} />
        <Text style={styles.text}>Pagamento confirmado!</Text>
      </Animated.View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  toastWrapper: {
    position: "absolute",
    left: 16,
    right: 16,
    bottom: 40,
    alignItems: "center",
    elevation: 999,
    zIndex: 999,
    pointerEvents: "none" as ViewStyle["pointerEvents"],
  },
  card: {
    backgroundColor: "#f1f2f1",
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 14,
    alignItems: "center",
    shadowColor: "#000",
    shadowOpacity: 0.18,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 4,
    flexDirection: "row",
  },
  text: {
    fontSize: 16,
    fontWeight: "600",
    color: "#0B0B0B",
  },
  icon: {
    marginRight: 8,
  },
});
