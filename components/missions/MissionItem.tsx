// LimpeJaApp/components/missions/MissionItem.tsx
import React, { useRef, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    Animated,
    Easing,
    ActivityIndicator,
    Platform,
    useColorScheme, // Importado para theming
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { MissionItem as MissionItemType, MissionStatus } from '../../services/missionService';
import Colors from '../../constants/Colors'; // Importa o arquivo de cores

// Hook para acessar as cores do tema atual
function useTheme() {
  const scheme = useColorScheme?.() || 'light';
  const theme = (Colors as any)[scheme] || (Colors as any).light;
  return theme as typeof Colors.light;
}

interface MissionItemProps {
    mission: MissionItemType;
    delay: number;
    onClaim: (missionId: string) => void;
    isClaiming: boolean;
}

const MissionItem: React.FC<MissionItemProps> = ({ mission, delay, onClaim, isClaiming }) => {
    const fadeAnim = useRef(new Animated.Value(0)).current;
    const slideAnim = useRef(new Animated.Value(20)).current;
    const scaleAnim = useRef(new Animated.Value(1)).current;
    const progressWidthAnim = useRef(new Animated.Value(0)).current;
    const theme = useTheme(); // Usa o hook de tema

    useEffect(() => {
        Animated.parallel([
            Animated.timing(fadeAnim, {
                toValue: 1,
                duration: 400,
                delay: delay,
                easing: Easing.out(Easing.ease),
                useNativeDriver: true,
            }),
            Animated.timing(slideAnim, {
                toValue: 0,
                duration: 400,
                delay: delay,
                easing: Easing.out(Easing.ease),
                useNativeDriver: true,
            }),
        ]).start();
    }, [fadeAnim, slideAnim, delay]);

    useEffect(() => {
        Animated.timing(progressWidthAnim, {
            toValue: mission.progressPct,
            duration: 500,
            delay: delay + 200,
            easing: Easing.out(Easing.ease),
            useNativeDriver: false,
        }).start();
    }, [mission.progressPct, progressWidthAnim, delay]);

    const onPressInButton = () => { Animated.spring(scaleAnim, { toValue: 0.96, useNativeDriver: true }).start(); };
    const onPressOutButton = () => { Animated.spring(scaleAnim, { toValue: 1, friction: 3, tension: 40, useNativeDriver: true }).start(); };

    const isCompleted = mission.progress?.status === MissionStatus.COMPLETED;
    const isClaimed = mission.isClaimed;
    const canClaim = mission.canClaim;

    const rewardText = mission.mission.rewardType === 'POINTS' ? `${mission.mission.rewardValue} Pontos` : `Cupom de R$${mission.mission.rewardValue}`;

    return (
        <Animated.View
            style={[
                styles.missionItemWrapper,
                { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }
            ]}
        >
            <View style={[styles.missionCard, { backgroundColor: theme.cardBackground }]}> {/* Usa a cor de fundo do cartão do tema */}
                <View style={styles.missionHeader}>
                    <Ionicons
                        name={isCompleted ? "checkmark-circle" : "flag"}
                        size={24}
                        color={isCompleted ? theme.success : theme.primary} {/* Usa cores do tema */}
                        style={styles.missionIcon}
                    />
                    <View style={styles.missionTitleContainer}>
                        <Text style={[styles.missionName, { color: theme.text }]}>{mission.mission.title}</Text> {/* Usa a cor do texto do tema */}
                        <Text style={[styles.missionDescription, { color: theme.textMuted }]}>{mission.mission.description}</Text> {/* Usa a cor do texto mudo do tema */}
                    </View>
                </View>

                <View style={[styles.progressBarContainer, { backgroundColor: theme.border }]}> {/* Usa a cor da borda do tema */}
                    <Animated.View style={[styles.progressBarFill, { width: progressWidthAnim.interpolate({
                        inputRange: [0, 100],
                        outputRange: ['0%', '100%'],
                    }), backgroundColor: isCompleted ? theme.success : theme.primary }]} /> {/* Usa cores do tema */}
                    <Text style={[styles.progressText, { color: theme.text }]}>{mission.progressLabel}</Text> {/* Usa a cor do texto do tema */}
                </View>

                <View style={styles.missionFooter}>
                    <Text style={[styles.rewardText, { color: theme.textMuted }]}>Recompensa: <Text style={[styles.rewardValueText, { color: theme.success }]}>{rewardText}</Text></Text> {/* Usa cores do tema */}
                    {canClaim && (
                        <TouchableOpacity
                            style={[styles.claimButton, { transform: [{ scale: scaleAnim }], backgroundColor: theme.primary }]} {/* Usa a cor primária do tema */}
                            onPress={() => onClaim(mission.mission.id)}
                            onPressIn={onPressInButton}
                            onPressOut={onPressOutButton}
                            disabled={isClaiming}
                        >
                            {isClaiming ? (
                                <ActivityIndicator color={theme.textLight} size="small" /> {/* Usa a cor do texto claro do tema */}
                            ) : (
                                <Text style={[styles.claimButtonText, { color: theme.textLight }]}>Resgatar</Text> {/* Usa a cor do texto claro do tema */}
                            )}
                        </TouchableOpacity>
                    )}
                    {isClaimed && (
                        <View style={[styles.claimedBadge, { backgroundColor: theme.border }]}> {/* Usa a cor da borda do tema */}
                            <Ionicons name="gift" size={16} color={theme.textMuted} /> {/* Usa a cor do texto mudo do tema */}
                            <Text style={[styles.claimedText, { color: theme.textMuted }]}>Resgatada</Text> {/* Usa a cor do texto mudo do tema */}
                        </View>
                    )}
                </View>
            </View>
        </Animated.View>
    );
};

const styles = StyleSheet.create({
    missionItemWrapper: {
        marginBottom: 15,
        marginHorizontal: 15,
    },
    missionCard: {
        borderRadius: 12,
        padding: 15,
        ...Platform.select({
            ios: {
                shadowColor: 'rgba(0,0,0,0.08)',
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.15,
                shadowRadius: 8,
            },
            android: {
                elevation: 6,
            },
        }),
    },
    missionHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 10,
    },
    missionIcon: {
        marginRight: 10,
    },
    missionTitleContainer: {
        flex: 1,
    },
    missionName: {
        fontSize: 18,
        fontWeight: '600',
    },
    missionDescription: {
        fontSize: 14,
        marginTop: 2,
    },
    progressBarContainer: {
        height: 10,
        borderRadius: 5,
        overflow: 'hidden',
        position: 'relative',
        marginBottom: 10,
    },
    progressBarFill: {
        height: '100%',
        borderRadius: 5,
        position: 'absolute',
        left: 0,
        top: 0,
    },
    progressText: {
        position: 'absolute',
        alignSelf: 'center',
        fontSize: 10,
        fontWeight: 'bold',
        top: -1,
    },
    missionFooter: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginTop: 5,
    },
    rewardText: {
        fontSize: 14,
    },
    rewardValueText: {
        fontWeight: 'bold',
    },
    claimButton: {
        paddingVertical: 8,
        paddingHorizontal: 15,
        borderRadius: 8,
        minWidth: 90,
        alignItems: 'center',
    },
    claimButtonText: {
        fontWeight: '600',
        fontSize: 14,
    },
    claimedBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 5,
        paddingHorizontal: 10,
        borderRadius: 8,
    },
    claimedText: {
        marginLeft: 5,
        fontSize: 13,
    },
});

export default MissionItem;