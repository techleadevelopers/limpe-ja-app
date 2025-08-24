// LimpeJaApp/app/(client)/missions/index.tsx
import React, { useEffect, useRef, useState, useCallback } from 'react';
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
  ActivityIndicator,
  RefreshControl,
  useColorScheme,
  Dimensions, // Importado para SCREEN_WIDTH/HEIGHT
} from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { LinearGradient } from 'expo-linear-gradient'; // Importado para o fundo animado

import { claimMission, getMyMissions, MissionItem as MissionItemType, MissionStatus, RewardType, MissionAudience } from '../../../services/missionService';
import Toast from '../../../components/Toast';
import MissionList from '../../../components/missions/MissionList';
import { MissionReminderCard } from '../../../components/missions/MissionReminderCard';
import { MissionProgressSnack } from '../../../components/missions/MissionProgressSnack';

import Colors from '../../../constants/Colors';

// Dimensões da tela para o fundo animado
const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

function useTheme() {
  const scheme = useColorScheme?.() || 'light';
  const theme = (Colors as any)[scheme] || (Colors as any).light;
  return theme as typeof Colors.light;
}

export default function ClientMissionsScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const theme = useTheme();

  const [allMissions, setAllMissions] = useState<MissionItemType[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [claimingMissionId, setClaimingMissionId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'ACTIVE' | 'CAN_CLAIM' | 'CLAIMED'>('ACTIVE');

  const headerAnim = useRef(new Animated.Value(0)).current;
  const contentAnim = useRef(new Animated.Value(0)).current;

  // Animações para o fundo
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const rotateAnim = useRef(new Animated.Value(0)).current;
  const backgroundFloatAnim = useRef(new Animated.Value(0)).current;
  const calendarBreatheAnim = useRef(new Animated.Value(1)).current; // Reutilizado para um efeito sutil

  const loadMissions = useCallback(async () => {
    setIsRefreshing(true);
    try {
      const fetchedMissions = await getMyMissions(MissionAudience.CLIENT);
      setAllMissions(fetchedMissions);
    } catch (error: any) {
      console.error('Erro ao buscar missões do cliente:', error.response?.data || error.message);
      Toast.show({
        type: 'error',
        text1: t('common.error'),
        text2: error.response?.data?.message || t('common.network_error'),
      });
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [t]);

  useEffect(() => {
    // Animações de entrada para o header e conteúdo
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

    // Animações de fundo
    const startPulse = () => {
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.02,
            duration: 2000,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 2000,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
        ])
      ).start();
    };

    const startRotation = () => {
      Animated.loop(
        Animated.timing(rotateAnim, {
          toValue: 1,
          duration: 20000,
          easing: Easing.linear,
          useNativeDriver: true,
        })
      ).start();
    };

    const startFloating = () => {
      Animated.loop(
        Animated.sequence([
          Animated.timing(backgroundFloatAnim, {
            toValue: 1,
            duration: 4000,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
          Animated.timing(backgroundFloatAnim, {
            toValue: 0,
            duration: 4000,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
        ])
      ).start();
    };

    const startCalendarBreathe = () => {
      Animated.loop(
        Animated.sequence([
          Animated.timing(calendarBreatheAnim, {
            toValue: 1.005,
            duration: 3000,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
          Animated.timing(calendarBreatheAnim, {
            toValue: 1,
            duration: 3000,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
        ])
      ).start();
    };

    startPulse();
    startRotation();
    startFloating();
    startCalendarBreathe();

    loadMissions();
  }, [headerAnim, contentAnim, loadMissions, pulseAnim, rotateAnim, backgroundFloatAnim, calendarBreatheAnim]);

  const handleClaimMission = async (missionId: string) => {
    setClaimingMissionId(missionId);
    try {
      const response = await claimMission(missionId);
      if (response.ok) {
        let rewardMessage = '';
        if (response.rewardType === RewardType.COUPON && response.coupon) {
          rewardMessage = t('missions.claim_success_coupon', { code: response.coupon.code, value: response.coupon.value });
        } else if (response.rewardType === RewardType.POINTS && response.pointsGranted) {
          rewardMessage = t('missions.claim_success_points', { points: response.pointsGranted });
        } else {
          rewardMessage = t('missions.claim_success');
        }

        Toast.show({
          type: 'success',
          text1: t('common.success'),
          text2: rewardMessage,
        });
        loadMissions();
      } else {
        Toast.show({
          type: 'error',
          text1: t('common.error'),
          text2: response.reason || t('missions.claim_error'),
        });
      }
    } catch (error: any) {
      console.error('Erro ao resgatar missão:', error.response?.data || error.message);
      Toast.show({
        type: 'error',
        text1: t('common.error'),
        text2: error.response?.data?.message || t('missions.claim_error'),
      });
    } finally {
      setClaimingMissionId(null);
    }
  };

  const onRefresh = useCallback(() => {
    setIsRefreshing(true);
    loadMissions();
  }, [loadMissions]);

  const filteredMissions = allMissions.filter(mission => {
    switch (activeTab) {
      case 'ACTIVE':
        return mission.progress?.status === MissionStatus.ACTIVE;
      case 'CAN_CLAIM':
        return mission.canClaim && !mission.isClaimed;
      case 'CLAIMED':
        return mission.isClaimed;
      default:
        return true;
    }
  });

  const missionsReadyToClaim = allMissions.find(m => m.canClaim && !m.isClaimed);

  if (isLoading && !isRefreshing) {
    return (
      <View style={[styles.centeredFeedback, { backgroundColor: theme.background }]}>
        <Stack.Screen options={{ headerShown: false }} />
        <ActivityIndicator size="large" color={theme.primary} />
        <Text style={[styles.loadingText, { color: theme.textMuted }]}>{t('common.loading')}</Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <Stack.Screen options={{ headerShown: false }} />

      {/* Background animado */}
      <Animated.View style={[
        styles.backgroundDecoration,
        {
          transform: [
            {
              translateY: backgroundFloatAnim.interpolate({
                inputRange: [0, 1],
                outputRange: [-20, 20]
              })
            },
            {
              rotate: rotateAnim.interpolate({
                inputRange: [0, 1],
                outputRange: ['0deg', '360deg']
              })
            }
          ]
        }
      ]}>
        <LinearGradient
          colors={[theme.primaryLight, theme.accent]} // Cores mais suaves para o fundo
          style={styles.decorationGradient}
        />
      </Animated.View>

      <Animated.View style={[
        styles.backgroundDecoration2,
        {
          transform: [
            {
              translateX: backgroundFloatAnim.interpolate({
                inputRange: [0, 1],
                outputRange: [10, -10]
              })
            },
            { scale: calendarBreatheAnim }
          ]
        }
      ]}>
        <LinearGradient
          colors={[theme.secondaryLight, theme.tertiary]} // Cores mais suaves para o fundo
          style={styles.decorationGradient}
        />
      </Animated.View>

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
                  outputRange: [-60, 0], // Ajuste para descer mais
                }),
              },
            ],
            backgroundColor: theme.background, // Fundo claro para o header
            borderBottomColor: theme.border,
          },
        ]}
      >
        <TouchableOpacity onPress={() => router.back()} style={styles.headerBackButton}>
          <Ionicons name="arrow-back" size={24} color={theme.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: theme.text }]}>{t('missions.title')}</Text>
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
        <ScrollView
          contentContainerStyle={styles.scrollViewContentContainer}
          refreshControl={
            <RefreshControl
              refreshing={isRefreshing}
              onRefresh={onRefresh}
              tintColor={theme.primary}
              title={t('common.loading')}
              titleColor={theme.primary}
            />
          }
        >
          {allMissions.length > 0 && allMissions[0].progress && (
            <Animated.View style={[styles.summaryCard, { transform: [{ scale: pulseAnim }] }]}>
              <MissionProgressSnack
                current={allMissions[0].progress.currentValue}
                goal={allMissions[0].mission.targetValue}
                onView={() => setActiveTab('ACTIVE')}
              />
            </Animated.View>
          )}

          {missionsReadyToClaim && (
            <Animated.View style={[styles.reminderCard, { transform: [{ scale: pulseAnim }] }]}>
              <MissionReminderCard
                missionId={missionsReadyToClaim.mission.id}
                title={missionsReadyToClaim.mission.title}
                deadlineAt={missionsReadyToClaim.mission.updatedAt}
                reward={{ kind: missionsReadyToClaim.mission.rewardType, value: missionsReadyToClaim.mission.rewardValue }}
                onGo={() => setActiveTab('CAN_CLAIM')}
                onDismiss={() => { Alert.alert(t('common.info'), t('missions.reminder_dismissed')); }}
              />
            </Animated.View>
          )}

          <View style={[styles.tabsContainer, { backgroundColor: theme.cardBackground }]}>
            <TouchableOpacity
              style={[styles.tabButton, activeTab === 'ACTIVE' && [styles.tabButtonActive, { backgroundColor: theme.primaryTransparent, borderColor: theme.primary }]]}
              onPress={() => setActiveTab('ACTIVE')}
            >
              <Text style={[styles.tabButtonText, { color: theme.text }, activeTab === 'ACTIVE' && { color: theme.primary }]}>{t('missions.tab_active')}</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.tabButton, activeTab === 'CAN_CLAIM' && [styles.tabButtonActive, { backgroundColor: theme.primaryTransparent, borderColor: theme.primary }]]}
              onPress={() => setActiveTab('CAN_CLAIM')}
            >
              <Text style={[styles.tabButtonText, { color: theme.text }, activeTab === 'CAN_CLAIM' && { color: theme.primary }]}>{t('missions.tab_can_claim')}</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.tabButton, activeTab === 'CLAIMED' && [styles.tabButtonActive, { backgroundColor: theme.primaryTransparent, borderColor: theme.primary }]]}
              onPress={() => setActiveTab('CLAIMED')}
            >
              <Text style={[styles.tabButtonText, { color: theme.text }, activeTab === 'CLAIMED' && { color: theme.primary }]}>{t('missions.tab_claimed')}</Text>
            </TouchableOpacity>
          </View>

          <MissionList
            missions={filteredMissions}
            onClaimMission={handleClaimMission}
            claimingMissionId={claimingMissionId}
            onRefresh={onRefresh}
            isRefreshing={isRefreshing}
          />
        </ScrollView>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    // Background color is handled by theme.background
  },
  centeredFeedback: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    // Background color is handled by theme.background
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    // Color is handled by theme.textMuted
  },
  // Estilos para o fundo animado (copiado de schedule-service.tsx e adaptado)
  backgroundDecoration: {
    position: 'absolute',
    top: SCREEN_HEIGHT * 0.1,
    right: -SCREEN_WIDTH * 0.2,
    width: SCREEN_WIDTH * 0.6,
    height: SCREEN_WIDTH * 0.6,
    borderRadius: SCREEN_WIDTH * 0.3,
    overflow: 'hidden',
  },
  backgroundDecoration2: {
    position: 'absolute',
    bottom: SCREEN_HEIGHT * 0.3,
    left: -SCREEN_WIDTH * 0.15,
    width: SCREEN_WIDTH * 0.5,
    height: SCREEN_WIDTH * 0.5,
    borderRadius: SCREEN_WIDTH * 0.25,
    overflow: 'hidden',
  },
  decorationGradient: {
    flex: 1,
  },
  // Fim dos estilos de fundo animado

  customHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 15,
    paddingVertical: Platform.OS === 'ios' ? 50 : 20,
    paddingTop: Platform.OS === 'ios' ? 50 : 20,
    borderBottomWidth: 1, // Borda inferior
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05, // Sombra mais sutil
    shadowRadius: 4,
    elevation: 3,
    zIndex: 10, // Garante que o header fique acima do conteúdo
  },
  headerBackButton: {
    marginRight: 15,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
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
  summaryCard: {
    marginHorizontal: 15,
    marginBottom: 10,
  },
  reminderCard: {
    marginHorizontal: 15,
    marginBottom: 10,
  },
  tabsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginHorizontal: 15,
    marginBottom: 15,
    borderRadius: 10,
    padding: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  tabButton: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  tabButtonActive: {
    // backgroundColor handled by theme.primaryTransparent
    // borderColor handled by theme.primary
  },
  tabButtonText: {
    fontSize: 14,
    fontWeight: 'bold',
    // color handled by theme.text and theme.primary
  },
  emptyStateContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    minHeight: 200,
    // backgroundColor handled by theme.cardBackground
    borderRadius: 12,
    marginTop: 20,
    marginHorizontal: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  emptyStateText: {
    fontSize: 16,
    // color handled by theme.textMuted
    textAlign: 'center',
    marginTop: 10,
  },
  exploreButton: {
    // backgroundColor handled by theme.primary
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 25,
    marginTop: 20,
  },
  exploreButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
});