// ./app/(client)/bookings/components/schedule/ProviderBrief.tsx
import React, { useCallback } from 'react';
import { View, Text, Image, StyleSheet, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import StarRating from '../../../explore/components/provider/StarRating';
// Importar VerificationStatus para ter certeza
import { VerificationStatus } from '../../../../types/backend/providers';

// A interface ProviderDetails deve espelhar a ProviderDisplayInfo
interface ProviderDetails {
    id: string;
    fullName: string;
    email?: string; // Adicionado email pois ProviderDisplayInfo tem
    phone?: string | null; // Adicionado phone pois ProviderDisplayInfo tem
    bio?: string | null; // Adicionado bio pois ProviderDisplayInfo tem
    cpf?: string; // Adicionado cpf pois ProviderDisplayInfo tem
    dateOfBirth?: string; // Adicionado dateOfBirth pois ProviderDisplayInfo tem
    address?: { // Adicionado address, pode ser opcional ou null em ProviderDisplayInfo
        id: string;
        cep: string;
        street: string;
        number: string;
        complement?: string | null;
        neighborhood: string;
        city: string;
        state: string;
    } | null;
    createdAt?: string; // Adicionado createdAt
    updatedAt?: string; // Adicionado updatedAt
    distance?: string; // Adicionado distance
    reviews?: any[]; // Tipo 'any' temporário para reviews, ou importe ProviderReview
    pixKey?: string;

    // As propriedades problemáticas:
    avatarUrl?: string | null; // <<< Corrigido para ser OPCIONAL e permitir string | null. O "undefined" já está implícito pelo "?"
    averageRating?: number | null; // <<< Corrigido para ser OPCIONAL e permitir number | null
    verificationStatus?: VerificationStatus; // <<< Corrigido para ser OPCIONAL
    yearsOfExperience?: number | null; // <<< Corrigido para ser OPCIONAL e permitir number | null
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
                    size={16}
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
                <Ionicons name={iconName} size={16} color={isVerified ? '#2A72E7' : '#555'} />
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
        <View style={styles.providerBriefCard}>
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
        padding: 15,
        backgroundColor: '#FFFFFF',
        borderRadius: 12,
        marginHorizontal: 20,
        marginTop: 20,
        marginBottom: 10,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 4,
    },
    providerImageSmall: {
        width: 70,
        height: 70,
        borderRadius: 35,
        marginRight: 12,
        borderWidth: 1,
        borderColor: '#DDEEFF',
    },
    providerImagePlaceholder: {
        width: 70,
        height: 70,
        borderRadius: 35,
        marginRight: 12,
        borderWidth: 1,
        borderColor: '#DDEEFF',
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
        marginBottom: 0,
    },
    providerNameSmall: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#333',
        marginRight: 4,
    },
    providerServiceSmall: {
        fontSize: 14,
        color: '#555',
        marginBottom: 5,
    },
    ratingContainer: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    noRatingText: {
        fontSize: 12,
        color: '#888',
        fontWeight: 'normal',
        marginLeft: 4,
    },
    ratingStarContainer: {
        flexDirection: 'row',
    },
    ratingStarIcon: {
        marginRight: 1,
    },
    infoChipsRow: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
        marginTop: 5,
    },
    infoChip: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#E0E0E0',
        borderRadius: 16,
        paddingVertical: 4,
        paddingHorizontal: 8,
    },
    infoChipText: {
        fontSize: 12,
        color: '#555',
        marginLeft: 4,
        fontWeight: '500',
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
        padding: 15,
        backgroundColor: '#FFFFFF',
        borderRadius: 12,
        marginHorizontal: 20,
        marginTop: 20,
        marginBottom: 10,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 4,
        height: 100,
    },
    providerImageSkeleton: {
        width: 70,
        height: 70,
        borderRadius: 35,
        marginRight: 12,
        backgroundColor: '#E0E0E0',
    },
    providerTextInfoSkeleton: {
        flex: 1,
        justifyContent: 'center',
    },
    skeletonLineLarge: {
        height: 18,
        width: '80%',
        backgroundColor: '#E0E0E0',
        borderRadius: 4,
        marginBottom: 8,
    },
    skeletonLineSmall: {
        height: 14,
        width: '60%',
        backgroundColor: '#E0E0E0',
        borderRadius: 4,
        marginBottom: 5,
    },
    skeletonChipsContainer: {
        flexDirection: 'row',
        marginTop: 5,
        gap: 8,
    },
    skeletonChip: {
        height: 24,
        width: 70,
        backgroundColor: '#E0E0E0',
        borderRadius: 16,
    },
});