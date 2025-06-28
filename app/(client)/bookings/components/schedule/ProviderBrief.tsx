// ./app/(client)/bookings/components/schedule/ProviderBrief.tsx
import React, { useCallback } from 'react';
import { View, Text, Image, StyleSheet, ActivityIndicator, ColorValue } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import StarRating from '../../../explore/components/provider/StarRating';
import { LinearGradient } from 'expo-linear-gradient';
// Importar VerificationStatus para ter certeza
import { VerificationStatus } from '../../../../types/backend/providers';

// A interface ProviderDetails deve espelhar a ProviderDisplayInfo
interface ProviderDetails {
    id: string;
    fullName: string;
    email?: string;
    phone?: string | null;
    bio?: string | null;
    cpf?: string;
    dateOfBirth?: string;
    address?: {
        id: string;
        cep: string;
        street: string;
        number: string;
        complement?: string | null;
        neighborhood: string;
        city: string;
        state: string;
    } | null;
    createdAt?: string;
    updatedAt?: string;
    distance?: string;
    reviews?: any[];
    pixKey?: string;

    avatarUrl?: string | null;
    averageRating?: number | null;
    verificationStatus?: VerificationStatus;
    yearsOfExperience?: number | null;
    providerServices?: { service: { name: string; }; }[];
}

interface ProviderBriefProps {
    provider: ProviderDetails | null;
    serviceName?: string | string[];
    isLoading?: boolean;
}

export default function ProviderBrief({ provider, serviceName, isLoading }: ProviderBriefProps) {
    const renderStars = useCallback((rating: number | undefined | null) => {
        const stars = [];
        const actualRating = rating ?? 0;
        const fullStars = Math.floor(actualRating);
        const hasHalfStar = (actualRating * 2) % 2 !== 0;

        for (let i = 0; i < 5; i++) {
            let iconName: keyof typeof Ionicons.glyphMap = 'star-outline';
            if (i < fullStars) iconName = 'star';
            else if (hasHalfStar && i === fullStars) iconName = 'star-half-sharp';

            stars.push(
                <Ionicons
                    key={i}
                    name={iconName}
                    size={12}
                    color="#4A90E2"
                    style={styles.ratingStarIcon}
                />
            );
        }
        return <View style={styles.ratingStarContainer}>{stars}</View>;
    }, []);

    const renderInfoChip = useCallback((iconName: keyof typeof Ionicons.glyphMap, text: string, isVerified?: boolean) => {
        return (
            <View style={[styles.infoChip, isVerified && styles.infoChipVerified]}>
                <Ionicons name={iconName} size={12} color={isVerified ? 'rgba(6, 78, 212, 0.85)' : '#555'} />
                <Text style={[styles.infoChipText, isVerified && styles.infoChipTextVerified]}>{text}</Text>
            </View>
        );
    }, []);

    const specialtyToDisplay = serviceName || (provider?.providerServices && provider.providerServices.length > 0
        ? provider.providerServices[0].service.name
        : 'Serviço não especificado');

    // Cores do gradiente com opacidade - ATUALIZADAS CONFORME SUA SOLICITAÇÃO
    const gradientColors: ColorValue[] = [
        'rgb(173, 216, 230)', // Azul claro com baixa opacidade
        'rgba(65, 153, 225, 0.29)',  // Azul com média opacidade
        'rgba(133, 168, 231, 0.66)', // Azul claro com alta opacidade
    ];

    if (isLoading || !provider) {
        return (
            <View style={styles.providerBriefSkeleton}>
                <View style={styles.providerImageSkeleton} />
                <View style={styles.providerTextInfoSkeleton}>
                    <View style={styles.skeletonLineLarge} />
                    <View style={styles.skeletonLineSmall} />
                    <View style={styles.skeletonChipsContainer}>
                        <View style={styles.skeletonChip} />
                        <View style={styles.skeletonChip} />
                    </View>
                </View>
            </View>
        );
    }

    return (
        <LinearGradient
            colors={gradientColors}
            start={{ x: 0, y: 0 }} // Início do gradiente (canto superior esquerdo)
            end={{ x: 1, y: 1 }}   // Fim do gradiente (canto inferior direito)
            style={styles.providerBriefCard} // Os estilos do card são aplicados ao gradiente
        >
            {/* Certifique-se de que `provider.avatarUrl` seja tratado como um URI válido para `Image` */}
            {provider.avatarUrl ? (
                <Image source={{ uri: provider.avatarUrl }} style={styles.providerImageSmall} />
            ) : (
                <View style={styles.providerImagePlaceholder}>
                    <Ionicons name="person-circle-outline" size={30} color="#666" />
                </View>
            )}
            <View style={styles.providerTextInfo}>
                <View style={styles.providerNameAndRatingRow}>
                    <Text style={styles.providerNameSmall}>{provider.fullName}</Text>
                    {typeof provider.averageRating === 'number' && provider.averageRating > 0 ? (
                        <View style={styles.ratingContainer}>
                            {renderStars(provider.averageRating)}
                        </View>
                    ) : (
                        <Text style={styles.noRatingText}>Sem avaliação</Text>
                    )}
                </View>
                <Text style={styles.providerServiceSmall}>
                    {specialtyToDisplay}
                </Text>
                <View style={styles.infoChipsRow}>
                    {provider.verificationStatus === VerificationStatus.APPROVED && (
                        renderInfoChip("shield-checkmark-outline", "Verificado", true)
                    )}
                    {/* Certifique-se de que yearsOfExperience é um número antes de renderizar */}
                    {typeof provider.yearsOfExperience === 'number' && provider.yearsOfExperience > 0 && (
                        renderInfoChip("hourglass-outline", `${provider.yearsOfExperience}+ anos`)
                    )}
                </View>
            </View>
        </LinearGradient>
    );
}

const styles = StyleSheet.create({
    providerBriefCard: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 14, // Mais padding para um visual mais "confortável"
        paddingLeft: 22,
        // Removido backgroundColor: '#FFFFFF', pois o LinearGradient o substitui
        borderRadius: 15, // Mais arredondado para um visual moderno
        marginHorizontal: 30, // Consistência de margem lateral
        marginTop: 10,
        marginBottom: 10,
        
        // Mantemos as sombras aqui, pois o LinearGradient pode aplicá-las
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 25,
        elevation: 5,
    },
    providerImageSmall: {
        width: 55, // Um pouco maior para destaque
        height: 55, // Ajuste para ser proporcional à largura
        borderRadius: 37.5, // Para ser circular (metade da largura/altura)
        marginRight: 15, // Mais espaço entre a imagem e o texto
        borderWidth: 2, // Borda um pouco mais visível
        borderColor: '#E6F0FF', // Cor da borda para dar profundidade
    },
    providerImagePlaceholder: {
        width: 65,
        height: 65,
        borderRadius: 37.5,
        marginRight: 15,
        borderWidth: 2,
        borderColor: '#E6F0FF',
        backgroundColor: '#E0E0E0',
        justifyContent: 'center',
        alignItems: 'center',
    },
    providerTextInfo: {
        flex: 1,
        justifyContent: 'center',
    },
    providerNameAndRatingRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 1, // Pequeno espaço entre o nome/avaliação e o serviço
        marginTop: -1,
    },
    providerNameSmall: {
        fontSize: 13, // Um pouco maior para melhor legibilidade
        fontWeight: '700', // Mais negrito para destaque
        color: '#333',
        marginRight: 40, // Mais espaço antes das estrelas
    },
    providerServiceSmall: {
        fontSize: 13, // Um pouco maior
        color: '#666',
        marginBottom: 9, // Mais espaço abaixo do serviço
        
    },
    ratingContainer: {
        flexDirection: 'row',
        marginRight: 5,
        alignItems: 'center',
    },
    noRatingText: {
        fontSize: 9, // Tamanho de fonte ajustado
        color: '#888',
        fontWeight: 'normal',
        
    },
    ratingStarContainer: {
        flexDirection: 'row',
    },
    ratingStarIcon: {
        marginRight: 2, // Espaçamento entre as estrelas
    },
    infoChipsRow: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 5, // Aumentar espaçamento entre chips para respiro
        marginTop: -3,
        left: 2,
    },
    infoChip: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#F0F4F8', // Fundo mais suave para o chip
        borderRadius: 20, // Mais arredondado para visual suave
        paddingVertical: 5, // Mais padding vertical
        paddingHorizontal: 12, // Mais padding horizontal
    },
    infoChipText: {
        fontSize: 9, // Tamanho de fonte ajustado
        color: '#555',
        marginLeft: 6, // Mais espaço entre ícone e texto
        fontWeight: '600', // Um pouco mais negrito
    },
    infoChipVerified: {
        backgroundColor: '#D1ECF1', // Cor de fundo mais clara para verificado
    },
    infoChipTextVerified: {
        color: '#007BFF',
    },
    providerBriefSkeleton: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 20, // Consistência com o card real
        backgroundColor: '#FFFFFF',
        borderRadius: 15, // Consistência com o card real
        marginHorizontal: 15, // Consistência com o card real
        marginTop: 20,
        marginBottom: 10,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.15,
        shadowRadius: 6,
        elevation: 6,
        height: 100, // A altura pode ser ajustada para corresponder ao card
    },
    providerImageSkeleton: {
        width: 75, // Consistência com o card real
        height: 75, // Consistência com o card real
        borderRadius: 37.5, // Consistência com o card real
        marginRight: 15, // Consistência com o card real
        backgroundColor: '#E0E0E0',
    },
    providerTextInfoSkeleton: {
        flex: 1,
        justifyContent: 'center',
    },
    skeletonLineLarge: {
        height: 18,
        width: '85%', // Um pouco mais longo para preencher
        backgroundColor: '#E0E0E0',
        borderRadius: 6, // Mais arredondado
        marginBottom: 10, // Mais espaço
    },
    skeletonLineSmall: {
        height: 15, // Um pouco maior
        width: '65%', // Um pouco mais longo
        backgroundColor: '#E0E0E0',
        borderRadius: 6, // Mais arredondado
        marginBottom: 8, // Mais espaço
    },
    skeletonChipsContainer: {
        flexDirection: 'row',
        marginTop: 5,
        gap: 10, // Consistência com o chip real
    },
    skeletonChip: {
        height: 28, // Um pouco maior
        width: 80, // Mais largo
        backgroundColor: '#E0E0E0',
        borderRadius: 18, // Mais arredondado
    },
});