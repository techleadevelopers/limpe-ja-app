// LimpeJaApp/app/(client)/home/missions.tsx
import React, { useEffect, useRef, useState } from 'react';
import { View, StyleSheet, Text, Animated, Easing, ScrollView, TouchableOpacity, Alert, Platform } from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import MissionList from '../../../components/missions/MissionList'; // Ajuste o caminho conforme sua estrutura
// Importe useQuery do TanStack Query se estiver configurado
// import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

// Mock de dados de missões (em um app real, viria do backend)
const mockMissions = [
    {
        id: 'm1',
        name: 'Primeira Limpeza!',
        description: 'Conclua seu primeiro agendamento de limpeza.',
        currentProgress: 0,
        targetValue: 1,
        rewardType: 'COUPON',
        rewardValue: 20,
        status: 'ACTIVE',
    },
    {
        id: 'm2',
        name: 'Cliente Fiel',
        description: 'Agende e conclua 3 limpezas.',
        currentProgress: 1,
        targetValue: 3,
        rewardType: 'POINTS',
        rewardValue: 100,
        status: 'ACTIVE',
    },
    {
        id: 'm3',
        name: 'Avalie um Serviço',
        description: 'Deixe uma avaliação para um serviço concluído.',
        currentProgress: 1,
        targetValue: 1,
        rewardType: 'POINTS',
        rewardValue: 50,
        status: 'COMPLETED', // Simula uma missão concluída mas não resgatada
    },
    {
        id: 'm4',
        name: 'Indique um Amigo',
        description: 'Seu amigo deve realizar o primeiro agendamento.',
        currentProgress: 0,
        targetValue: 1,
        rewardType: 'COUPON',
        rewardValue: 30,
        status: 'ACTIVE',
    },
    {
        id: 'm5',
        name: 'Super Cliente',
        description: 'Conclua 10 agendamentos.',
        currentProgress: 10,
        targetValue: 10,
        rewardType: 'POINTS',
        rewardValue: 500,
        status: 'CLAIMED', // Simula uma missão já resgatada
    },
];

// Mock de função de fetching (em um app real, faria uma chamada API)
const fetchMissions = async () => {
    return new Promise<typeof mockMissions>((resolve) => {
        setTimeout(() => {
            resolve(mockMissions);
        }, 800); // Simula atraso da rede
    });
};

export default function MissionsScreen() {
    const router = useRouter();
    // const queryClient = useQueryClient(); // Para invalidação de cache do TanStack Query

    // Animação para o título do cabeçalho
    const headerAnim = useRef(new Animated.Value(0)).current;
    const contentAnim = useRef(new Animated.Value(0)).current;

    const [missions, setMissions] = useState<typeof mockMissions>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [claimingMissionId, setClaimingMissionId] = useState<string | null>(null);

    // Em um app real, você usaria useQuery do TanStack Query
    // const { data: missions, isLoading, error } = useQuery(['missions'], fetchMissions);

    useEffect(() => {
        const loadMissions = async () => {
            setIsLoading(true);
            const data = await fetchMissions();
            setMissions(data);
            setIsLoading(false);
        };
        loadMissions();

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
        setClaimingMissionId(missionId);
        // Em um app real, você usaria useMutation do TanStack Query para chamar o backend
        // const { mutateAsync: claimMissionMutation } = useMutation(
        //     (id: string) => yourMissionService.claimMission(id),
        //     {
        //         onSuccess: () => {
        //             queryClient.invalidateQueries(['missions']); // Invalida o cache para recarregar as missões
        //             Alert.alert('Sucesso!', 'Recompensa resgatada com sucesso!');
        //         },
        //         onError: (error) => {
        //             Alert.alert('Erro', 'Não foi possível resgatar a recompensa.');
        //             console.error('Erro ao resgatar missão:', error);
        //         },
        //         onSettled: () => {
        //             setClaimingMissionId(null);
        //         },
        //     }
        // );

        // Simulação de resgate
        try {
            // await claimMissionMutation(missionId); // Em um app real
            await new Promise(resolve => setTimeout(resolve, 1000)); // Simula API call

            setMissions(prevMissions =>
                prevMissions.map(m =>
                    m.id === missionId ? { ...m, status: 'CLAIMED' } : m
                )
            );
            Alert.alert('Sucesso!', 'Recompensa resgatada com sucesso!');
        } catch (error) {
            Alert.alert('Erro', 'Não foi possível resgatar a recompensa.');
            console.error('Erro ao resgatar missão:', error);
        } finally {
            setClaimingMissionId(null);
        }
    };

    return (
        <View style={styles.container}>
            <Stack.Screen options={{ headerShown: false }} />

            {/* Custom Header */}
            <Animated.View style={[styles.customHeader, { opacity: headerAnim, transform: [{ translateY: headerAnim.interpolate({ inputRange: [0, 1], outputRange: [-20, 0] }) }] }]}>
                <TouchableOpacity onPress={() => router.back()} style={styles.headerBackButton}>
                    <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Minhas Missões</Text>
                <View style={styles.headerActionIconPlaceholder} />
            </Animated.View>

            <Animated.View style={[styles.animatedContentWrapper, { opacity: contentAnim, transform: [{ translateY: contentAnim.interpolate({ inputRange: [0, 1], outputRange: [20, 0] }) }] }]}>
                <ScrollView contentContainerStyle={styles.scrollViewContentContainer}>
                    <MissionList
                        missions={missions}
                        isLoading={isLoading}
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