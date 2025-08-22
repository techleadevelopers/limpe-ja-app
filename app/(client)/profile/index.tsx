// LimpeJaApp/app/(client)/profile/index.tsx
import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
    View,
    Text,
    StyleSheet,
    Alert,
    ScrollView,
    TouchableOpacity,
    Image,
    Platform,
    Animated,
    Easing,
    TextInput,
} from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { useAuth } from '../../../contexts/AuthContext';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

// Componente MenuItem com animações de entrada e feedback de toque
const AnimatedMenuItem: React.FC<{
    label: string;
    iconName: keyof typeof Ionicons.glyphMap | keyof typeof MaterialCommunityIcons.glyphMap;
    onPress: () => void;
    isDestructive?: boolean;
    delay: number;
    iconType?: 'Ionicons' | 'MaterialCommunityIcons';
    showChevron?: boolean;
}> = ({ label, iconName, onPress, isDestructive, delay, iconType = 'Ionicons', showChevron = true }) => {
    const fadeAnim = useRef(new Animated.Value(0)).current;
    const slideAnim = useRef(new Animated.Value(20)).current;
    const scaleAnim = useRef(new Animated.Value(1)).current;

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

    const onPressInItem = () => {
        Animated.spring(scaleAnim, {
            toValue: 0.98,
            useNativeDriver: true,
        }).start();
    };

    const onPressOutItem = () => {
        Animated.spring(scaleAnim, {
            toValue: 1,
            friction: 3,
            tension: 40,
            useNativeDriver: true,
        }).start();
    };

    const IconComponent = iconType === 'MaterialCommunityIcons' ? MaterialCommunityIcons : Ionicons;

    return (
        <Animated.View
            style={[
                styles.menuItemWrapper,
                { opacity: fadeAnim, transform: [{ translateY: slideAnim }, { scale: scaleAnim }] }
            ]}
        >
            <TouchableOpacity
                style={[styles.menuItem, isDestructive && styles.menuItemDestructive]}
                onPress={onPress}
                onPressIn={onPressInItem}
                onPressOut={onPressOutItem}
                activeOpacity={0.7}
            >
                <IconComponent
                    name={iconName as any}
                    size={24}
                    color={isDestructive ? '#D32F2F' : '#4682B4'} // Ícone azul mais robusto
                    style={styles.menuItemIcon}
                />
                <Text style={[styles.menuItemText, isDestructive && styles.menuItemTextDestructive]}>{label}</Text>
                {showChevron && !isDestructive && <Ionicons name="chevron-forward-outline" size={22} color="#C7C7CC" />}
            </TouchableOpacity>
        </Animated.View>
    );
};

export default function ClientProfileScreen() {
    const { user, logout } = useAuth();
    const router = useRouter();

    // Estado para simular pontos do usuário (pode ser global ou vindo de uma API)
    const [userPoints, setUserPoints] = useState(1250); // Exemplo de pontos iniciais
    // Simulação de missões pendentes (em um app real, viria de um estado global/API)
    const [pendingMissionsCount, setPendingMissionsCount] = useState(3);

    // Animações de entrada gerais
    const headerAnim = useRef(new Animated.Value(0)).current;
    const profileHeaderAnim = useRef(new Animated.Value(0)).current;
    const avatarScaleAnim = useRef(new Animated.Value(1)).current;
    const searchBarAnim = useRef(new Animated.Value(0)).current;
    const missionsCardAnim = useRef(new Animated.Value(0)).current;

    // Animações para o ícone do cartão de missões (efeitos de conforto)
    const missionIconPulseAnim = useRef(new Animated.Value(1)).current;
    const missionIconRotateAnim = useRef(new Animated.Value(0)).current;

    // Animação de reflexo para a barra de pesquisa
    const searchReflectionAnim = useRef(new Animated.Value(0)).current;
    // Animação de reflexo para o cartão de missões
    const missionsCardReflectionAnim = useRef(new Animated.Value(0)).current;


    useEffect(() => {
        // Animação de pulso para o ícone de missão
        Animated.loop(
            Animated.sequence([
                Animated.timing(missionIconPulseAnim, {
                    toValue: 1.1,
                    duration: 800,
                    easing: Easing.inOut(Easing.ease),
                    useNativeDriver: true,
                }),
                Animated.timing(missionIconPulseAnim, {
                    toValue: 1,
                    duration: 800,
                    easing: Easing.inOut(Easing.ease),
                    useNativeDriver: true,
                }),
            ])
        ).start();

        // Animação de rotação para o ícone de missão
        Animated.loop(
            Animated.timing(missionIconRotateAnim, {
                toValue: 1,
                duration: 10000, // Rotação mais lenta para sutileza
                easing: Easing.linear,
                useNativeDriver: true,
            })
        ).start();

        // Animação de reflexo para a barra de pesquisa
        Animated.loop(
            Animated.sequence([
                Animated.timing(searchReflectionAnim, {
                    toValue: 1,
                    duration: 2000,
                    easing: Easing.linear,
                    useNativeDriver: true,
                }),
                Animated.timing(searchReflectionAnim, {
                    toValue: 0,
                    duration: 0,
                    useNativeDriver: true,
                }),
            ])
        ).start();

        // Animação de reflexo para o cartão de missões
        Animated.loop(
            Animated.sequence([
                Animated.timing(missionsCardReflectionAnim, {
                    toValue: 1,
                    duration: 3000,
                    easing: Easing.linear,
                    useNativeDriver: true,
                }),
                Animated.timing(missionsCardReflectionAnim, {
                    toValue: 0,
                    duration: 0,
                    useNativeDriver: true,
                }),
            ])
        ).start();

    }, [missionIconPulseAnim, missionIconRotateAnim, searchReflectionAnim, missionsCardReflectionAnim]);

    // Interpolação para a rotação do ícone de missão
    const rotateInterpolate = missionIconRotateAnim.interpolate({
        inputRange: [0, 1],
        outputRange: ['0deg', '360deg'],
    });

    // Interpolação para o reflexo da barra de pesquisa
    const searchReflectionTranslateX = searchReflectionAnim.interpolate({
        inputRange: [0, 1],
        outputRange: [-250, 250], // Ajustar conforme a largura da barra
    });
    const searchReflectionOpacity = searchReflectionAnim.interpolate({
        inputRange: [0, 0.2, 0.8, 1],
        outputRange: [0, 0.5, 0.5, 0],
    });

    // Interpolação para o reflexo do cartão de missões
    const missionsCardReflectionTranslateX = missionsCardReflectionAnim.interpolate({
        inputRange: [0, 1],
        outputRange: [-350, 350], // Ajustar conforme a largura do cartão
    });
    const missionsCardReflectionOpacity = missionsCardReflectionAnim.interpolate({
        inputRange: [0, 0.2, 0.8, 1],
        outputRange: [0, 0.6, 0.6, 0],
    });


    useEffect(() => {
        // Animações de entrada do cabeçalho e seções
        Animated.stagger(200, [
            Animated.timing(headerAnim, {
                toValue: 1,
                duration: 500,
                easing: Easing.out(Easing.ease),
                useNativeDriver: true,
            }),
            Animated.timing(profileHeaderAnim, {
                toValue: 1,
                duration: 700,
                delay: 100,
                easing: Easing.out(Easing.ease),
                useNativeDriver: true,
            }),
            Animated.timing(searchBarAnim, {
                toValue: 1,
                duration: 600,
                delay: 200,
                easing: Easing.out(Easing.ease),
                useNativeDriver: true,
            }),
            Animated.timing(missionsCardAnim, { // Animação para o cartão de missões
                toValue: 1,
                duration: 600,
                delay: 300,
                easing: Easing.out(Easing.ease),
                useNativeDriver: true,
            }),
        ]).start();
    }, [headerAnim, profileHeaderAnim, searchBarAnim, missionsCardAnim]);

    // Animações de feedback ao pressionar o avatar
    const onPressInAvatar = useCallback(() => { Animated.spring(avatarScaleAnim, { toValue: 0.95, useNativeDriver: true }).start(); }, [avatarScaleAnim]);
    const onPressOutAvatar = useCallback(() => { Animated.spring(avatarScaleAnim, { toValue: 1, friction: 3, tension: 40, useNativeDriver: true }).start(); }, [avatarScaleAnim]);

    const handleLogout = async () => {
        Alert.alert(
            "Sair da Conta",
            "Tem certeza que deseja sair?",
            [
                {
                    text: "Cancelar",
                    style: "cancel"
                },
                {
                    text: "Sair",
                    onPress: async () => {
                        console.log('[ClientProfileScreen] handleLogout: Botão Sair da Conta clicado! Iniciando logout direto.');
                        try {
                            await logout();
                            console.log('[ClientProfileScreen] logout() concluído com sucesso.');
                            // Redirecionar para a tela de login ou home após o logout
                            router.replace('/(auth)/login' as any);
                        } catch (error) {
                            console.error('[ClientProfileScreen] Erro ao executar logout():', error);
                            Alert.alert("Erro ao Sair", "Não foi possível sair da conta. Por favor, tente novamente.");
                        }
                    }
                }
            ]
        );
    };

    const handleWIP = (featureName: string) => {
        Alert.alert("Em Desenvolvimento", `A funcionalidade "${featureName}" será implementada em breve!`);
    };

    if (!user) {
        return (
            <View style={styles.centeredMessageContainer}>
                <Stack.Screen options={{ headerShown: false }} />
                <Text style={styles.loadingText}>Usuário não encontrado. Por favor, faça login novamente.</Text>
                <TouchableOpacity style={styles.simpleButton} onPress={() => router.replace('/(auth)/login' as any)}>
                    <Text style={styles.simpleButtonText}>Ir para Login</Text>
                </TouchableOpacity>
            </View>
        );
    }

    const userName = user.fullName || 'Aryan Vishwakarma';
    const userSlogan = "Bio over here"; // Mantendo o slogan do OCR
    const userAvatarUrl = user.avatarUrl;

    return (
        <View style={styles.container}>
            <Stack.Screen options={{ headerShown: false }} />

            {/* Cabeçalho Personalizado sem fundo e sem reflexo */}
            <Animated.View style={[styles.customHeaderWrapper, { opacity: headerAnim, transform: [{ translateY: headerAnim.interpolate({ inputRange: [0, 1], outputRange: [-20, 0] }) }] }]}>
                <View style={styles.customHeader}>
                    <TouchableOpacity style={styles.headerIconLeft} onPress={() => router.back()}>
                        <Ionicons name="arrow-back" size={24} color="#2F4F4F" /> {/* Ícone escuro para contraste */}
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>Perfil</Text>
                    <View style={styles.headerIconRightPlaceholder} />
                </View>
            </Animated.View>

            <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollViewContentContainer}>
                {/* Barra de Pesquisa com Fundo Azul Claro e Reflexo */}
                <Animated.View style={[styles.searchBarContainer, { opacity: searchBarAnim, transform: [{ translateY: searchBarAnim.interpolate({ inputRange: [0, 1], outputRange: [20, 0] }) }] }]}>
                    <Ionicons name="search" size={20} color="#5e7694ff" style={styles.searchIcon} /> {/* Ícone escuro para contraste */}
                    <TextInput
                        style={styles.searchInput}
                        placeholder="Pesquisar"
                        placeholderTextColor="#2F4F4F" // Cor do placeholder para contraste
                    />
                    {/* Efeito de Reflexo na Barra de Pesquisa */}
                    <Animated.View style={[
                        styles.reflectionOverlay,
                        {
                            transform: [{ translateX: searchReflectionTranslateX }, { skewX: '-20deg' }],
                            opacity: searchReflectionOpacity,
                            width: 80, // Largura do reflexo
                            height: '100%',
                            borderRadius: 10, // Para combinar com o borderRadius da barra
                        }
                    ]} />
                </Animated.View>

                {/* Seção de Perfil do Usuário */}
                <Animated.View style={[styles.profileHeader, { opacity: profileHeaderAnim, transform: [{ translateY: profileHeaderAnim.interpolate({ inputRange: [0, 1], outputRange: [20, 0] }) }] }]}>
                    <TouchableOpacity
                        onPress={() => router.push('/(client)/profile/edit' as any)}
                        onPressIn={onPressInAvatar}
                        onPressOut={onPressOutAvatar}
                        style={[styles.avatarContainer, { transform: [{ scale: avatarScaleAnim }] }]}
                    >
                        {userAvatarUrl ? (
                            <Image source={{ uri: userAvatarUrl }} style={styles.avatarImage} />
                        ) : (
                            <View style={styles.avatarPlaceholder}>
                                <Ionicons name="person-circle-outline" size={70} color="#ADB5BD" />
                            </View>
                        )}
                        <View style={styles.editIconBadge}>
                            <Ionicons name="pencil" size={14} color="#fff" />
                        </View>
                    </TouchableOpacity>
                    <View style={styles.userInfoTextContainer}>
                        <Text style={styles.userName}>{userName}</Text>
                        <Text style={styles.userSlogan}>{userSlogan}</Text>
                        <Text style={styles.userPointsText}>Pontos: {userPoints}</Text>
                    </View>
                    <TouchableOpacity onPress={() => handleWIP("QR Code")}>
                        <MaterialCommunityIcons name="qrcode-scan" size={24} color="#6C757D" />
                    </TouchableOpacity>
                </Animated.View>

                {/* Seção de Menu Principal com Ícones Azuis e Robustos */}
                <View style={styles.menuSection}>
                    <AnimatedMenuItem label="Meus Agendamentos" iconName="calendar-outline" onPress={() => router.push('/(client)/bookings' as any)} delay={0} showChevron={false} />
                    <AnimatedMenuItem label="Conta" iconName="person" onPress={() => router.push('/(client)/profile/edit' as any)} delay={50} showChevron={false} />
                    <AnimatedMenuItem label="Endereços" iconName="location-outline" onPress={() => handleWIP("Endereços")} delay={100} showChevron={false} />
                    <AnimatedMenuItem label="Formas de Pagamento" iconName="card-outline" onPress={() => handleWIP("Formas de Pagamento")} delay={150} showChevron={false} />
                    <AnimatedMenuItem label="Notificações" iconName="notifications" onPress={() => handleWIP("Notificações")} delay={200} showChevron={false} />
                    <AnimatedMenuItem label="Segurança" iconName="lock-closed" onPress={() => handleWIP("Segurança")} delay={250} showChevron={false} />
                    <AnimatedMenuItem label="Privacidade" iconName="shield-checkmark" onPress={() => handleWIP("Privacidade")} delay={300} showChevron={false} />
                    <AnimatedMenuItem label="Ajuda" iconName="help-circle" onPress={() => router.push('/(common)/help' as any)} delay={350} showChevron={false} />
                </View>

                {/* Cartão de Missões (Substitui a seção Premium) com Reflexo Robusto */}
                <Animated.View style={[styles.missionsCard, { opacity: missionsCardAnim, transform: [{ translateY: missionsCardAnim.interpolate({ inputRange: [0, 1], outputRange: [20, 0] }) }] }]}>
                    <TouchableOpacity
                        onPress={() => router.push('/(client)/missions' as any)} // Navega para a tela de missões
                        style={styles.missionsCardButton}
                    >
                        <LinearGradient
                            colors={['#4A90E2', '#3A7ACC']} // Gradiente azul alinhado com a HomeScreen
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 0 }}
                            style={styles.missionsCardGradient}
                        >
                            <Animated.View
                                style={{
                                    transform: [
                                        { scale: missionIconPulseAnim },
                                        { rotateY: rotateInterpolate }
                                    ]
                                }}
                            >
                                <Ionicons name="trophy-outline" size={40} color="#e9e8ecff" style={styles.missionsCardIcon} />
                            </Animated.View>
                            <View style={styles.missionsCardTextContainer}>
                                <Text style={styles.missionsCardTitle}>Suas Missões</Text>
                                <Text style={styles.missionsCardSubtitle}>{pendingMissionsCount} Missões Pendentes</Text>
                            </View>
                            <Ionicons name="chevron-forward-outline" size={28} color="#FFFFFF" />

                            {/* Efeito de Reflexo no Cartão de Missões */}
                            <Animated.View style={[
                                styles.reflectionOverlay,
                                {
                                    transform: [{ translateX: missionsCardReflectionTranslateX }, { skewX: '-20deg' }],
                                    opacity: missionsCardReflectionOpacity,
                                    width: 120, // Largura do reflexo
                                    height: '100%',
                                    borderRadius: 12, // Para combinar com o borderRadius do cartão
                                }
                            ]} />
                        </LinearGradient>
                    </TouchableOpacity>
                </Animated.View>

                {/* Seção Inferior (Indicações, Fidelidade, Termos, Política, Sair) */}
                <View style={styles.bottomSection}>
                    <AnimatedMenuItem label="Indicações" iconName="people-outline" onPress={() => router.push('/(common)/referrals' as any)} delay={400} showChevron={false} />
                    <AnimatedMenuItem label="Fidelidade" iconName="star-outline" onPress={() => router.push('/(common)/loyalty' as any)} delay={450} showChevron={false} />
                    <AnimatedMenuItem label="Termos de Serviço" iconName="document-text-outline" onPress={() => router.push('/(common)/termos' as any)} delay={500} showChevron={false} />
                    <AnimatedMenuItem label="Política de Privacidade" iconName="shield-outline" onPress={() => router.push('/(common)/privacidade' as any)} delay={550} showChevron={false} />
                    <AnimatedMenuItem label="Sair da Conta" iconName="log-out-outline" onPress={handleLogout} isDestructive delay={600} showChevron={false} />
                </View>
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F0F8FF', // Fundo claro (AliceBlue)
    },
    scrollView: {
        flex: 1,
    },
    scrollViewContentContainer: {
        paddingBottom: 40, // Espaço no final do scroll
    },
    centeredMessageContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    simpleButton: {
        marginTop: 20,
        backgroundColor: '#007AFF',
        paddingVertical: 10,
        paddingHorizontal: 20,
        borderRadius: 8,
    },
    simpleButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '600',
    },
    loadingText: {
        fontSize: 16,
        color: '#6C757D',
        marginBottom: 10,
    },
    customHeaderWrapper: { // Wrapper para o cabeçalho, sem sombra ou overflow aqui
        // Removidas as propriedades de sombra e overflow para um cabeçalho transparente
    },
    customHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 15,
        paddingVertical: Platform.OS === 'ios' ? 50 : 20, // Ajuste de padding para iOS
        paddingTop: Platform.OS === 'ios' ? 50 : 20,
        position: 'relative', // Necessário para posicionar elementos internos
        backgroundColor: 'transparent', // Garante que não há fundo
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#2F4F4F', // Texto escuro para contraste no header claro
        textAlign: 'center',
        flex: 1,
    },
    headerIconLeft: {
        padding: 5,
        zIndex: 1,
    },
    headerIconRightPlaceholder: {
        width: 24 + 10, // Largura do ícone + padding
        zIndex: 1,
    },
    searchBarContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#9ec2f1ff', // Fundo azul mais robusto para a barra de pesquisa
        borderRadius: 10,
        marginHorizontal: 15,
        marginTop: 20,
        paddingHorizontal: 15,
        paddingVertical: 10,
        position: 'relative', // Necessário para posicionar o reflexo
        overflow: 'hidden', // Importante para o reflexo
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
    searchIcon: {
        marginRight: 10,
        // Cor já definida no componente, mas pode ser ajustada aqui se necessário
    },
    searchInput: {
        flex: 1,
        fontSize: 16,
        color: '#2F4F4F', // Texto de entrada escuro para contraste
    },
    profileHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 20,
        backgroundColor: '#FFFFFF',
        borderRadius: 12,
        marginHorizontal: 15,
        marginTop: 20,
        marginBottom: 20,
        paddingHorizontal: 20,
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
    avatarContainer: {
        position: 'relative',
        width: 80,
        height: 80,
        borderRadius: 40,
        borderWidth: 3,
        borderColor: '#007AFF', // Mantido como estava, pois a solicitação era específica para o lápis
        justifyContent: 'center',
        alignItems: 'center',
        overflow: 'hidden',
        marginRight: 15,
        ...Platform.select({
            ios: {
                shadowColor: 'rgba(0,0,0,0.15)',
                shadowOffset: { width: 0, height: 5 },
                shadowOpacity: 0.25,
                shadowRadius: 10,
            },
            android: {
                elevation: 8,
            },
        }),
    },
    avatarImage: {
        width: '100%',
        height: '100%',
        resizeMode: 'cover',
    },
    avatarPlaceholder: {
        width: '100%',
        height: '100%',
        backgroundColor: '#E9ECEF',
        justifyContent: 'center',
        alignItems: 'center',
    },
    editIconBadge: {
        position: 'absolute',
        bottom: 0,
        right: 0,
        backgroundColor: '#4A90E2', // Alterado para o azul da HomeScreen
        padding: 6,
        borderRadius: 12,
        borderWidth: 2,
        borderColor: '#FFFFFF',
    },
    userInfoTextContainer: {
        flex: 1,
    },
    userName: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#212529',
    },
    userSlogan: {
        fontSize: 14,
        color: '#6C757D',
        marginTop: 4,
        fontStyle: 'italic',
    },
    userPointsText: {
        fontSize: 14,
        fontWeight: 'bold',
        color: '#4CAF50', // Verde para pontos
        marginTop: 8,
    },
    menuSection: {
        marginTop: 15,
        backgroundColor: '#FFFFFF',
        borderRadius: 12,
        marginHorizontal: 15,
        overflow: 'hidden',
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
    menuItemWrapper: {
        // Estilos de sombra e borda serão aplicados ao menuSection
    },
    menuItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 15,
        paddingHorizontal: 20,
    },
    menuItemDestructive: {
        backgroundColor: 'rgba(211, 47, 47, 0.05)',
    },
    menuItemIcon: {
        marginRight: 15,
        // Cor definida no componente, mas pode ser ajustada aqui se necessário
    },
    menuItemText: {
        flex: 1,
        fontSize: 16,
        color: '#212529',
    },
    menuItemTextDestructive: {
        color: '#D32F2F',
        fontWeight: '600',
    },
    // Estilos para o Cartão de Missões
    missionsCard: {
        marginHorizontal: 15,
        marginTop: 25,
        borderRadius: 12,
        overflow: 'hidden', // Importante para o reflexo
        ...Platform.select({
            ios: {
                shadowColor: 'rgba(0,0,0,0.15)',
                shadowOffset: { width: 0, height: 5 },
                shadowOpacity: 0.25,
                shadowRadius: 10,
            },
            android: {
                elevation: 8,
            },
        }),
    },
    missionsCardButton: {
        width: '100%',
    },
    missionsCardGradient: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingVertical: 20,
        paddingHorizontal: 20,
        position: 'relative', // Necessário para posicionar o reflexo
    },
    missionsCardIcon: {
        marginRight: 15,
    },
    missionsCardTextContainer: {
        flex: 1,
    },
    missionsCardTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#FFFFFF',
    },
    missionsCardSubtitle: {
        fontSize: 15,
        color: '#E0E0E0',
        marginTop: 4,
    },
    bottomSection: {
        marginTop: 25,
        marginBottom: 20,
        backgroundColor: '#FFFFFF',
        borderRadius: 12,
        marginHorizontal: 15,
        overflow: 'hidden',
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
    reflectionOverlay: {
        position: 'absolute',
        backgroundColor: 'rgba(255, 255, 255, 0.7)', // Cor do reflexo (branco semi-transparente)
        // Largura, altura e transform serão definidos inline para cada uso
    },
});