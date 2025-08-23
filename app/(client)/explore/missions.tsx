// LimpeJaApp/app/(client)/home/missions.tsx
import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  StyleSheet,
  Text,
  Animated,
  Easing,
  ScrollView,
  TouchableOpacity,
  Alert,
  Platform,
} from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import MissionList from '../../../components/missions/MissionList';
import { claimMission } from '../../../services/missionService'; // usa sua API real

export default function MissionsScreen() {
  const router = useRouter();

  // animações de entrada do header e do conteúdo
  const headerAnim = useRef(new Animated.Value(0)).current;
  const contentAnim = useRef(new Animated.Value(0)).current;

  // estado de resgate
  const [claimingMissionId, setClaimingMissionId] = useState<string | null>(null);

  // truque para forçar o MissionList a remontar e refazer o fetch após um resgate
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    Animated.parallel([
      Animated.timing(headerAnim, {
        toValue: 1,
        duration: 500,
        easing: Easing.out(Easing.ease),
        useNativeDriver: true,
      }),
      Animated.timing(contentAnim, {
        toValue: 1,
        duration: 700,
        delay: 100,
        easing: Easing.out(Easing.ease),
        useNativeDriver: true,
      }),
    ]).start();
  }, [headerAnim, contentAnim]);

  const handleClaimMission = async (missionId: string) => {
    try {
      setClaimingMissionId(missionId);
      // chamada real ao backend
      await claimMission(missionId);

      Alert.alert('Sucesso!', 'Recompensa resgatada com sucesso!');
      // força o MissionList a remontar e buscar dados atualizados
      setReloadKey((k) => k + 1);
    } catch (err: any) {
      const msg =
        err?.response?.data?.message ||
        err?.message ||
        'Não foi possível resgatar a recompensa.';
      Alert.alert('Erro', msg);
      console.error('[missions] claim error:', err);
    } finally {
      setClaimingMissionId(null);
    }
  };

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />

      {/* Header customizado */}
      <Animated.View
        style={[
          styles.customHeader,
          {
            opacity: headerAnim,
            transform: [
              {
                translateY: headerAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [-20, 0],
                }),
              },
            ],
          },
        ]}
      >
        <TouchableOpacity onPress={() => router.back()} style={styles.headerBackButton}>
          <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Minhas Missões</Text>
        <View style={styles.headerActionIconPlaceholder} />
      </Animated.View>

      {/* Conteúdo */}
      <Animated.View
        style={[
          styles.animatedContentWrapper,
          {
            opacity: contentAnim,
            transform: [
              {
                translateY: contentAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [20, 0],
                }),
              },
            ],
          },
        ]}
      >
        <ScrollView contentContainerStyle={styles.scrollViewContentContainer}>
          <MissionList
            key={reloadKey}
            onClaimMission={handleClaimMission}
            claimingMissionId={claimingMissionId}
          />
        </ScrollView>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F0F8FF', // --background-light-blue
  },
  customHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#223355', // --primary-dark-blue
    paddingHorizontal: 15,
    paddingVertical: Platform.OS === 'ios' ? 50 : 20,
    paddingTop: Platform.OS === 'ios' ? 50 : 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 5,
  },
  headerBackButton: {
    marginRight: 15,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFFFFF',
    flex: 1,
    textAlign: 'center',
  },
  headerActionIconPlaceholder: {
    width: 24,
    marginLeft: 15,
  },
  animatedContentWrapper: {
    flex: 1,
  },
  scrollViewContentContainer: {
    flexGrow: 1,
    paddingVertical: 10,
  },
});
