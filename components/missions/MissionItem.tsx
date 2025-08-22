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
    Platform, // <-- CORREÇÃO: Adicionado Platform aqui
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Mission } from '../../types/backend/mission'; // <-- Certifique-se de que esta importação está correta, conforme a solução anterior

interface MissionItemProps {
    mission: Mission; // <-- Usando a interface Mission importada
    delay: number;
    onClaim: (missionId: string) => void;
    isClaiming: boolean;
}

const MissionItem: React.FC<MissionItemProps> = ({ mission, delay, onClaim, isClaiming }) => {
    const fadeAnim = useRef(new Animated.Value(0)).current;
    const slideAnim = useRef(new Animated.Value(20)).current;
    const scaleAnim = useRef(new Animated.Value(1)).current;
    const progressWidthAnim = useRef(new Animated.Value(0)).current;

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
        const progressPercentage = (mission.currentProgress / mission.targetValue) * 100;
        Animated.timing(progressWidthAnim, {
            toValue: progressPercentage,
            duration: 500,
            delay: delay + 200, // Anima o progresso após a entrada do item
            easing: Easing.out(Easing.ease),
            useNativeDriver: false, // 'width' não suporta native driver
        }).start();
    }, [mission.currentProgress, mission.targetValue, progressWidthAnim, delay]);

    const onPressInButton = () => { Animated.spring(scaleAnim, { toValue: 0.96, useNativeDriver: true }).start(); };
    const onPressOutButton = () => { Animated.spring(scaleAnim, { toValue: 1, friction: 3, tension: 40, useNativeDriver: true }).start(); };

    const isCompleted = mission.status === 'COMPLETED';
    const isClaimed = mission.status === 'CLAIMED';
    const progress = Math.min(mission.currentProgress, mission.targetValue);
    const progressText = `${progress}/${mission.targetValue}`;
    const rewardText = mission.rewardType === 'POINTS' ? `${mission.rewardValue} Pontos` : `Cupom de R$${mission.rewardValue}`;

    return (
        <Animated.View
            style={[
                styles.missionItemWrapper,
                { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }
            ]}
        >
            <View style={styles.missionCard}>
                <View style={styles.missionHeader}>
                    <Ionicons
                        name={isCompleted ? "checkmark-circle" : "flag"}
                        size={24}
                        color={isCompleted ? '#28A745' : '#007AFF'}
                        style={styles.missionIcon}
                    />
                    <View style={styles.missionTitleContainer}>
                        <Text style={styles.missionName}>{mission.name}</Text>
                        <Text style={styles.missionDescription}>{mission.description}</Text>
                    </View>
                </View>

                <View style={styles.progressBarContainer}>
                    <Animated.View style={[styles.progressBarFill, { width: progressWidthAnim.interpolate({
                        inputRange: [0, 100],
                        outputRange: ['0%', '100%'],
                    }), backgroundColor: isCompleted ? '#28A745' : '#007AFF' }]} />
                    <Text style={styles.progressText}>{progressText}</Text>
                </View>

                <View style={styles.missionFooter}>
                    <Text style={styles.rewardText}>Recompensa: <Text style={styles.rewardValueText}>{rewardText}</Text></Text>
                    {isCompleted && !isClaimed && (
                        <TouchableOpacity
                            style={[styles.claimButton, { transform: [{ scale: scaleAnim }] }]}
                            onPress={() => onClaim(mission.id)}
                            onPressIn={onPressInButton}
                            onPressOut={onPressOutButton}
                            disabled={isClaiming}
                        >
                            {isClaiming ? (
                                <ActivityIndicator color="#fff" size="small" />
                            ) : (
                                <Text style={styles.claimButtonText}>Resgatar</Text>
                            )}
                        </TouchableOpacity>
                    )}
                    {isClaimed && (
                        <View style={styles.claimedBadge}>
                            <Ionicons name="gift" size={16} color="#6C757D" />
                            <Text style={styles.claimedText}>Resgatada</Text>
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
        backgroundColor: '#FFFFFF', // --card-background
        borderRadius: 12,
        padding: 15,
        ...Platform.select({ // <-- Uso de Platform aqui
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
        color: '#212529', // --text-dark
    },
    missionDescription: {
        fontSize: 14,
        color: '#6C757D', // --text-medium
        marginTop: 2,
    },
    progressBarContainer: {
        height: 10,
        backgroundColor: '#E9ECEF', // --border-light
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
        color: '#212529', // --text-dark
        top: -1, // Ajuste para centralizar verticalmente
    },
    missionFooter: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginTop: 5,
    },
    rewardText: {
        fontSize: 14,
        color: '#495057', // --text-darker-gray
    },
    rewardValueText: {
        fontWeight: 'bold',
        color: '#28A745', // Verde para recompensa
    },
    claimButton: {
        backgroundColor: '#007AFF', // --accent-blue
        paddingVertical: 8,
        paddingHorizontal: 15,
        borderRadius: 8,
        minWidth: 90,
        alignItems: 'center',
    },
    claimButtonText: {
        color: '#FFFFFF',
        fontWeight: '600',
        fontSize: 14,
    },
    claimedBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#F0F2F5', // Cinza claro
        paddingVertical: 5,
        paddingHorizontal: 10,
        borderRadius: 8,
    },
    claimedText: {
        marginLeft: 5,
        color: '#6C757D', // --text-medium
        fontSize: 13,
    },
});

export default MissionItem;