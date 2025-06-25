// ./app/(client)/bookings/components/schedule/ProviderBrief.tsx
import React from 'react';
import { View, Text, Image, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons'; // Importe Ionicons para o placeholder
import StarRating from '../../../explore/components/provider/StarRating'; // Importe o componente StarRating

// A interface ProviderDetails foi atualizada para espelhar a ProviderDetailsDto do backend.
// Os nomes dos campos foram ajustados conforme a análise.
interface ProviderDetails {
    id: string;
    fullName: string;
    // O campo specialty não está presente no ProviderDisplayInfo,
    // se você está usando serviceName || provider.specialty
    // talvez precise de providerServices ou um campo principal de serviço no DTO.
    // Para simplificar, vou assumir que serviceName é o que você quer exibir como especialidade.
    avatarUrl: string | null; // Alterado de 'imagemUrl' para 'avatarUrl', agora pode ser null
    averageRating: number; // <--- ADICIONADO: Propriedade para a média de avaliação
    providerServices?: { service: { name: string; }; }[]; // Adicionado para derivar specialty
    pixKey?: string;
    // precoServico foi removido, pois não é usado diretamente neste componente.
}

interface ProviderBriefProps {
    provider: ProviderDetails;
    serviceName?: string | string[]; // serviceName pode vir como string ou string[] do useLocalSearchParams
}

export default function ProviderBrief({ provider, serviceName }: ProviderBriefProps) {
    const specialtyToDisplay = serviceName || (provider.providerServices && provider.providerServices.length > 0
        ? provider.providerServices[0].service.name
        : 'Serviço não especificado');

    return (
        <View style={styles.providerBrief}>
            {/* Usando provider.avatarUrl */}
            {provider.avatarUrl ? (
                <Image source={{ uri: provider.avatarUrl }} style={styles.providerImageSmall} />
            ) : (
                // Fallback para quando não há avatarUrl (ex: ícone de usuário genérico)
                <View style={styles.providerImagePlaceholder}>
                    <Ionicons name="person-circle-outline" size={30} color="#666" />
                </View>
            )}
            <View style={styles.providerTextInfo}>
                {/* Usando provider.fullName */}
                <Text style={styles.providerNameSmall}>{provider.fullName}</Text>
                {/* Usando provider.specialty */}
                <Text style={styles.providerServiceSmall}>{specialtyToDisplay}</Text>
            </View>

            {/* ADICIONADO: StarRating no canto direito */}
            {provider.averageRating !== undefined && provider.averageRating !== null && (
                <View style={styles.ratingContainer}>
                    <StarRating rating={provider.averageRating} size={15} color="#FFD700" />
                </View>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    providerBrief: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 15,
        backgroundColor: '#F7F9FC',
        borderBottomWidth: 1,
        borderBottomColor: '#E9EDF0',
        // Adicionado para empurrar o rating para a direita, enquanto o avatar e o texto flutuam à esquerda
        justifyContent: 'space-between', 
    },
    providerImageSmall: {
        width: 50,
        height: 50,
        borderRadius: 25,
        marginRight: 12,
        borderWidth: 1,
        borderColor: '#DDEEFF',
    },
    providerImagePlaceholder: {
        width: 50,
        height: 50,
        borderRadius: 25,
        marginRight: 12,
        borderWidth: 1,
        borderColor: '#DDEEFF',
        backgroundColor: '#E0E0E0',
        justifyContent: 'center',
        alignItems: 'center',
    },
    providerTextInfo: {
        flex: 1, // Permite que o texto ocupe o espaço restante
        marginRight: 10, // Adiciona uma margem para não encostar no rating
    },
    providerNameSmall: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#333',
    },
    providerServiceSmall: {
        fontSize: 14,
        color: '#555',
    },
    // Estilo para o contêiner do rating, para garantir que ele não se quebre
    ratingContainer: {
        // Sem position: 'absolute' para que ele flua naturalmente
        alignSelf: 'center', // Centraliza verticalmente com os outros itens da linha
    },
});