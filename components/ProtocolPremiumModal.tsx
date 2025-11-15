import React, { useEffect, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Dimensions,
} from "react-native";
import { BlurView } from "expo-blur";
import { Ionicons } from "@expo/vector-icons";
import { AppColors } from "../constants/appStyles";

const { width, height } = Dimensions.get("window");

interface Props {
  visible: boolean;
  onContinue: () => void;
  onChecklist: () => void;
}

export default function ProtocolPremiumModal({
  visible,
  onContinue,
  onChecklist,
}: Props) {
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 280,
        useNativeDriver: true,
      }).start();
    } else {
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 220,
        useNativeDriver: true,
      }).start();
    }
  }, [visible, fadeAnim]);

  if (!visible) return null;

  return (
    <Animated.View style={[styles.overlay, { opacity: fadeAnim }]}>
      <BlurView intensity={35} tint="dark" style={StyleSheet.absoluteFill} />

      <Animated.View
        style={[
          styles.card,
          {
            transform: [
              {
                translateY: fadeAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [40, 0],
                }),
              },
            ],
          },
        ]}
      >
        <Ionicons
          name="diamond"
          size={42}
          color={AppColors.primaryInteractive}
          style={{ marginBottom: 8, alignSelf: "center" }}
        />

        <Text style={styles.title}>Produtos de limpeza disponíveis?</Text>

        <Text style={styles.subtitle}>
          Antes de começar, confirme um detalhe importante do seu atendimento.
        </Text>

        <Text style={styles.body}>
          Os <Text style={styles.highlight}>produtos de limpeza</Text> que a diarista vai
          usar já estão separados e acessíveis no local?
        </Text>

        <Text style={styles.body}>
          O uso dos <Text style={styles.highlight}>seus produtos</Text> garante mais
          segurança, personalização e conforto para você.
        </Text>

        <View style={styles.actions}>
          <TouchableOpacity style={styles.primaryBtn} onPress={onContinue}>
            <Text style={styles.primaryText}>Produtos confirmados</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.secondaryBtn} onPress={onChecklist}>
            <Text style={styles.secondaryText}>Ver check‑list de produtos</Text>
          </TouchableOpacity>
        </View>
      </Animated.View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    position: "absolute",
    width,
    height,
    top: 0,
    left: 0,
    justifyContent: "center",
    alignItems: "center",
    zIndex: 999,
  },
  card: {
    width: width * 0.88,
    backgroundColor: "#fff",
    borderRadius: 20,
    paddingVertical: 30,
    paddingHorizontal: 24,
    shadowColor: "#000",
    shadowOpacity: 0.18,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 8 },
    elevation: 10,
  },
  title: {
    fontSize: 20,
    fontWeight: "800",
    color: "#374151",
    textAlign: "center",
    marginBottom: 12,
  },
  subtitle: {
    fontSize: 14,
    color: "#555",
    textAlign: "center",
    marginBottom: 18,
  },
  body: {
    fontSize: 14,
    lineHeight: 22,
    color: "#374151",
    marginBottom: 14,
  },
  highlight: {
    fontWeight: "700",
    color: AppColors.primaryInteractive,
  },
  actions: {
    marginTop: 20,
    flexDirection: "column",
    gap: 12,
  },
  primaryBtn: {
    backgroundColor: "#1e88e5",
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: "center",
  },
  primaryText: {
    color: "#fff",
    fontSize: 15,
    fontWeight: "700",
  },
  secondaryBtn: {
    paddingVertical: 12,
    borderRadius: 12,
    borderColor: "#d1d5db",
    borderWidth: 2,
    alignItems: "center",
  },
  secondaryText: {
    color: "#6b7280",
    fontSize: 14,
    fontWeight: "600",
  },
});
