// ./app/(client)/bookings/components/schedule/ProviderBrief.tsx
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient'; // Manter a importação se usada em outros lugares ou para o shine effect
import React, { useCallback } from 'react';
import { Image, StyleSheet, Text, View } from 'react-native';
// Importar VerificationStatus para ter certeza
import { VerificationStatus } from '../../../../types/backend/auth'; // CORREÇÃO: Importar VerificationStatus de auth.ts
import { BookingAddress } from '../../../../types/backend/bookings'; // CORREÇÃO: Importar BookingAddress

// A interface ProviderDetails deve espelhar a ProviderDisplayInfo
interface ProviderDetails {
    id: string;
    fullName: string;
    email?: string | null;
    phone?: string | null;
    bio?: string | null;
    cpf?: string | null;
    dateOfBirth?: string | null;
    address?: BookingAddress | null; // CORREÇÃO: Usar BookingAddress importado
    createdAt?: string;
    updatedAt?: string;
    distance?: number | null;
    reviews?: any[];
    pixKey?: string | null;

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
        <View
            style={styles.providerBriefCard}
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
        </View>
    );
}

const styles = StyleSheet.create({
    providerBriefCard: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 14,
        paddingLeft: 12,
        backgroundColor: '#bfd4f7c3', // Fundo de cor sólida aplicado aqui
        borderRadius: 15,
        marginHorizontal: 30,
        marginTop: 20,
        marginBottom: 25,
    
    },
    providerImageSmall: {
        width: 55,
        height: 55,
        borderRadius: 37.5,
        marginRight: 10,
        borderWidth: 2,
        borderColor: '#E6F0FF',
    },
    providerImagePlaceholder: {
        width: 65,
        height: 65,
        borderRadius: 37.5,
        marginRight: 1,
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
        marginBottom: 1,
        marginTop: -1,
    },
    providerNameSmall: {
        fontSize: 13,
        fontWeight: '700',
        color: '#333',
        marginRight: 18,
    },
    providerServiceSmall: {
        fontSize: 13,
        color: '#666',
        marginBottom: 9,
    },
    ratingContainer: {
        flexDirection: 'row',
        marginRight: 5,
        alignItems: 'center',
    },
    noRatingText: {
        fontSize: 9,
        color: '#888',
        fontWeight: 'normal',
    },
    ratingStarContainer: {
        flexDirection: 'row',
    },
    ratingStarIcon: {
        marginRight: 2,
    },
    infoChipsRow: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 5,
        marginTop: -3,
        left: 2,
    },
    infoChip: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#F0F4F8',
        borderRadius: 20,
        paddingVertical: 5,
        paddingHorizontal: 12,
    },
    infoChipText: {
        fontSize: 9,
        color: '#555',
        marginLeft: 6,
        fontWeight: '600',
    },
    infoChipVerified: {
        backgroundColor: '#D1ECF1',
    },
    infoChipTextVerified: {
        color: '#007BFF',
    },
    providerBriefSkeleton: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 20,
        backgroundColor: '#FFFFFF',
        borderRadius: 15,
        marginHorizontal: 15,
        marginTop: 20,
        marginBottom: 10,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.15,
        shadowRadius: 6,
        elevation: 6,
        height: 100,
    },
    providerImageSkeleton: {
        width: 75,
        height: 75,
        borderRadius: 37.5,
        marginRight: 15,
        backgroundColor: '#E0E0E0',
    },
    providerTextInfoSkeleton: {
        flex: 1,
        justifyContent: 'center',
    },
    skeletonLineLarge: {
        height: 18,
        width: '85%',
        backgroundColor: '#E0E0E0',
        borderRadius: 6,
        marginBottom: 10,
    },
    skeletonLineSmall: {
        height: 15,
        width: '65%',
        backgroundColor: '#E0E0E0',
        borderRadius: 6,
        marginBottom: 8,
    },
    skeletonChipsContainer: {
        flexDirection: 'row',
        marginTop: 5,
        gap: 10,
    },
    skeletonChip: {
        height: 28,
        width: 80,
        backgroundColor: '#E0E0E0',
        borderRadius: 18,
    },
});