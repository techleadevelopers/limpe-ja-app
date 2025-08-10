import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient'; // Importação necessária para o gradiente
import React from 'react';
import {
    Platform,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';

// Cores do gradiente do HeroHeader
const HERO_GRADIENT_START = 'rgba(45, 108, 233, 0.37)';
const HERO_GRADIENT_MIDDLE = 'rgba(97, 78, 241, 0.9)';
const HERO_GRADIENT_END = 'rgba(45, 101, 232, 0.24)';

// Cores para o novo estilo
const COR_AZUL_ESCURO = '#2C3E50';
const COR_AMARELO_OURO = '#FFD700';
const COR_BRANCO_PURO = '#FFFFFF';
const COR_AZUL_CLARO_BG = 'rgba(255, 255, 255, 0.2)';

const mockMissions = [
    { id: 'm1', icon: 'hammer-wrench', title: 'Complete 3 trabalhos', progress: 0.6, reward: 50 },
    { id: 'm2', icon: 'account-group', title: 'Indique 2 amigos', progress: 0.2, reward: 100 },
    { id: 'm3', icon: 'star-circle', title: 'Ganhe 5 avaliações', progress: 0.9, reward: 200 },
];
const mockRank = { rank: 12, role: 'avaliador' };
const mockRewards = { pontos: 180, proximaRecompensa: 200 };
const mockFeedback = { visible: true, pontos: 20 };

const Points: React.FC = () => {
    return (
        <View style={styles.container}>
            {/* O LinearGradient agora envolve o conteúdo principal para aplicar o gradiente de fundo */}
            <LinearGradient
                colors={[HERO_GRADIENT_START, HERO_GRADIENT_MIDDLE, HERO_GRADIENT_END]}
                start={{ x: 0.0, y: 0.0 }}
                end={{ x: 1.0, y: 1.0 }}
                style={styles.gradientContainer}
            >
                {/* Módulos de Informação em uma única linha */}
                <View style={styles.inlineModulesContainer}>
                    {/* Ranking Local */}
                    <TouchableOpacity style={styles.inlineModuleItem}>
                        <Text style={styles.inlineModuleTitle}>Ranking</Text>
                        <View style={styles.inlineModuleContent}>
                            <Ionicons name="podium-outline" size={24} color={COR_BRANCO_PURO} style={styles.iconShadow} />
                            <Text style={styles.inlineModuleText}>#{mockRank.rank}</Text>
                        </View>
                    </TouchableOpacity>

                    {/* Pontos */}
                    <TouchableOpacity style={styles.inlineModuleItem}>
                        <Text style={styles.inlineModuleTitle}>Pontos</Text>
                        <View style={styles.inlineModuleContent}>
                            <Ionicons name="star" size={24} color={COR_AMARELO_OURO} style={styles.iconShadow} />
                            <Text style={styles.inlineModuleText}>{mockRewards.pontos}</Text>
                        </View>
                    </TouchableOpacity>

                    {/* Missões Semanais */}
                    <TouchableOpacity style={styles.inlineModuleItem}>
                        <Text style={styles.inlineModuleTitle}>Missões</Text>
                        <View style={styles.inlineModuleContent}>
                            <Ionicons name="document-text-outline" size={24} color={COR_BRANCO_PURO} style={styles.iconShadow} />
                            <Text style={styles.inlineModuleText}>
                                {mockMissions.filter(m => m.progress === 1).length} / {mockMissions.length}
                            </Text>
                        </View>
                    </TouchableOpacity>
                </View>

                {/* Banner de Feedback (opcional) */}
                {mockFeedback.visible && (
                    <TouchableOpacity style={styles.feedbackBanner}>
                        <Ionicons name="gift-outline" size={20} color={COR_AZUL_ESCURO} style={{ marginRight: 8 }} />
                        <Text style={styles.feedbackText}>
                            Você ganhou +{mockFeedback.pontos} pontos por seu feedback!
                        </Text>
                    </TouchableOpacity>
                )}
            </LinearGradient>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        paddingHorizontal: 12,
        marginTop: 20,
    },
    // Novo estilo para o container com gradiente, com bordas arredondadas e sombra
    gradientContainer: {
        borderRadius: 20,
        padding: 16,
        ...Platform.select({
            ios: {
                shadowColor: 'rgba(0,0,0,0.3)',
                shadowOffset: { width: 0, height: 6 },
                shadowOpacity: 0.25,
                shadowRadius: 10,
            },
            android: {
                elevation: 12,
            },
        }),
    },
    inlineModulesContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingHorizontal: 1,
    },
    inlineModuleItem: {
        alignItems: 'center',
        justifyContent: 'center',
        flex: 1,
        paddingVertical: 12,
        // Fundo transparente para o item, deixando o gradiente do container visível
        backgroundColor: COR_AZUL_CLARO_BG, 
        borderRadius: 15,
        marginHorizontal: 4,
        ...Platform.select({
            ios: {
                shadowColor: 'rgba(0,0,0,0.1)',
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.15,
                shadowRadius: 5,
            },
            android: {
                elevation: 4,
            },
        }),
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.3)',
    },
    inlineModuleContent: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 4,
    },
    inlineModuleTitle: {
        fontSize: 12,
        color: COR_BRANCO_PURO,
        fontWeight: '500',
        textShadowColor: 'rgba(0,0,0,0.2)',
        textShadowOffset: { width: 1, height: 1 },
        textShadowRadius: 2,
    },
    inlineModuleText: {
        fontSize: 14,
        color: COR_BRANCO_PURO,
        fontWeight: '700',
        marginLeft: 6,
        textShadowColor: 'rgba(0,0,0,0.2)',
        textShadowOffset: { width: 1, height: 1 },
        textShadowRadius: 2,
    },
    iconShadow: {
        textShadowColor: 'rgba(0,0,0,0.3)',
        textShadowOffset: { width: 1, height: 1 },
        textShadowRadius: 2,
    },
    feedbackBanner: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: 16,
        padding: 12,
        backgroundColor: COR_BRANCO_PURO,
        borderRadius: 15,
        ...Platform.select({
            ios: {
                shadowColor: 'rgba(0,0,0,0.1)',
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.15,
                shadowRadius: 5,
            },
            android: {
                elevation: 4,
            },
        }),
    },
    feedbackText: {
        color: COR_AZUL_ESCURO,
        fontWeight: '600',
        fontSize: 14,
    },
});

export default Points;
